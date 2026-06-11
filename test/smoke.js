/* smoke.js — test headless: simula DOM/canvas e gioca l'intera campagna.
   Esecuzione: node test/smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ------------------------------------------------ stub DOM/canvas */

function ctx2d() {
  const noop = () => {};
  return new Proxy({}, {
    get(t, prop) {
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createConicGradient') {
        return () => ({ addColorStop: noop });
      }
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (typeof prop === 'string') {
        if (!(prop in t)) t[prop] = noop;
        return t[prop];
      }
      return undefined;
    },
    set(t, prop, v) { t[prop] = v; return true; }
  });
}

function makeCanvas() {
  return { width: 0, height: 0, getContext: () => ctx2d() };
}

const listeners = {};
const storage = {};
let rafCb = null;

const sandbox = {
  console,
  Math, JSON, Object, Array, Uint8ClampedArray, setTimeout,
  addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
  AudioContext: null,
  webkitAudioContext: null,
  document: {
    readyState: 'complete',
    createElement: tag => makeCanvas(),
    getElementById: id => { const c = makeCanvas(); c.width = 960; c.height = 540; return c; },
    addEventListener: (ev, fn) => { (listeners['doc:' + ev] = listeners['doc:' + ev] || []).push(fn); }
  },
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; }
  },
  performance: { now: () => simTime },
  requestAnimationFrame: cb => { rafCb = cb; }
};
sandbox.window = sandbox; // come nel browser: window è l'oggetto globale
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

let simTime = 0;

function load(file) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

['js/sprites.js', 'js/maps.js', 'js/data.js', 'js/game.js', 'js/ui.js', 'js/main.js'].forEach(load);

const W = sandbox.window;
const Game = W.Game;
const UI = W.UI;
const DATA = W.DATA;
const MAPS = W.MAPS;
const Sprites = W.Sprites;

let failures = 0;
function check(cond, msg) {
  if (cond) { console.log('  ok  ' + msg); }
  else { failures++; console.error('FAIL  ' + msg); }
}

/* ------------------------------------------------ helper di simulazione */

function key(k, down) {
  const evs = listeners['keydown'] || [];
  const ups = listeners['keyup'] || [];
  const e = { key: k, preventDefault: () => {} };
  for (const fn of (down ? evs : ups)) fn(e);
}

function tap(k) { key(k, true); key(k, false); }

function frames(n, dt) {
  dt = dt || 16;
  for (let i = 0; i < n; i++) {
    simTime += dt;
    const cb = rafCb;
    rafCb = null;
    if (cb) cb(simTime);
    if (!rafCb) throw new Error('il ciclo di gioco si è interrotto');
  }
}

function teleportNear(npcId) {
  const G = Game.G;
  const n = G.region.npcs.find(x => x.id === npcId);
  if (!n) throw new Error('PNG non trovato: ' + npcId);
  G.player.x = n.x + 20;
  G.player.y = n.y;
  return n;
}

function runDialog(maxSteps, choice) {
  const G = Game.G;
  let steps = 0;
  while (G.mode === 'dialog' && steps++ < (maxSteps || 30)) {
    const d = G.dialog;
    const atChoices = d && d.choices && d.idx === d.lines.length - 1;
    if (atChoices && choice !== undefined) {
      let guard = 0;
      while (d.choiceIdx !== choice) {
        tap('ArrowDown'); frames(1);
        if (++guard > 10) throw new Error('navigazione delle scelte bloccata (choiceIdx=' + d.choiceIdx + ')');
      }
      tap('Enter');
      frames(1);
      return;
    }
    tap('Enter');
    frames(1);
  }
}

/* ------------------------------------------------ verifiche statiche */

console.log('\n--- Verifiche statiche ---');
check(typeof Sprites.hero === 'object', 'sprite dell\'eroe generato');
for (const id in MAPS) {
  const m = MAPS[id];
  check(m.rows.every(r => r.length === 40), 'mappa ' + id + ': righe larghe 40');
  check(m.rows.length === 26, 'mappa ' + id + ': 26 righe');
  for (const ex of m.exits) {
    check(!!MAPS[ex.to], 'mappa ' + id + ': uscita verso ' + ex.to + ' esiste');
    const dest = MAPS[ex.to];
    const ch = dest.rows[Math.floor(ex.ty)][Math.floor(ex.tx)];
    check(!W.SOLID_TILES[ch], 'mappa ' + id + ': arrivo in ' + ex.to + ' (' + ex.tx + ',' + ex.ty + ') è percorribile [' + ch + ']');
  }
  for (const n of m.npcs) check(typeof DATA.DIALOGS[n.id] === 'function', 'dialogo definito per ' + n.id);
}
for (const sid in DATA.SHOPS) {
  for (const it of DATA.SHOPS[sid].items) check(!!DATA.ITEMS[it], 'negozio ' + sid + ': oggetto ' + it + ' esiste');
}

/* ------------------------------------------------ avvio e titolo */

console.log('\n--- Avvio ---');
frames(5);
check(Game.G.mode === 'title', 'parte dalla schermata del titolo');
tap('Enter');           // Nuova partita
frames(2);
check(Game.G.mode === 'intro', 'introduzione mostrata');
tap('Enter');
frames(2);
check(Game.G.mode === 'play', 'gioco avviato');
check(Game.G.region.id === 'oakvale', 'si parte a Roccavecchia');

const G = Game.G;

/* ------------------------------------------------ movimento e combattimento */

console.log('\n--- Movimento e combattimento ---');
const x0 = G.player.x;
key('d', true);
frames(30);
key('d', false);
check(G.player.x > x0, 'il giocatore si muove a destra');

// posiziona un lupo davanti al giocatore e attacca
const wolf = G.region.enemies.find(e => e.type === 'wolf');
check(!!wolf, 'lupi presenti a Roccavecchia');
wolf.x = G.player.x + 24; wolf.y = G.player.y;
G.player.face = 'right';
const hp0 = wolf.hp;
tap('j');
frames(2);
check(wolf.hp < hp0, 'l\'attacco in mischia ferisce il lupo');

wolf.x = G.player.x - 300; // sposta il lupo perché non intercetti subito il colpo
tap('k');
frames(1);
check(G.region.projs.length > 0, 'proiettile a distanza creato');
frames(60);

tap('l');
frames(1);
check(G.player.mp < Game.maxMp(), 'la palla di fuoco consuma Volontà');

/* ------------------------------------------------ missione dei lupi */

console.log('\n--- Missione: Lupi alle porte ---');
teleportNear('mayor');
tap('e');
frames(2);
check(G.mode === 'dialog', 'dialogo col sindaco aperto');
runDialog();
check(G.quests.q_wolves.state === 1, 'missione dei lupi attivata');

// uccide tutti i lupi
for (const e of G.region.enemies.slice()) {
  if (e.type === 'wolf') Game.damageEnemy(e, 9999, 0, 0);
}
check(G.quests.q_wolves.count >= 5, 'conteggio lupi raggiunto (' + G.quests.q_wolves.count + ')');
check(G.region.orbs.length > 0, 'orbe di esperienza generate');

// raccoglie le orbe
const orb = G.region.orbs[0];
G.player.x = orb.x; G.player.y = orb.y;
frames(10);
check(G.player.xp > 0, 'esperienza raccolta (' + G.player.xp + ')');

teleportNear('mayor');
tap('e'); frames(2);
runDialog();
check(G.quests.q_wolves.state === 2, 'missione dei lupi completata');
check(G.quests.q_road.state === 1, 'missione della Veggente attivata');
check(G.player.gold >= 160, 'ricompensa in oro ricevuta (' + G.player.gold + ')');

/* ------------------------------------------------ missioni secondarie a Roccavecchia */

console.log('\n--- Missioni secondarie ---');
teleportNear('granny');
tap('e'); frames(2); runDialog();
check(G.quests.s_pie.state === 1, 'missione della torta attivata');
teleportNear('smith');
tap('e'); frames(2); runDialog(30, 0); // consegna la torta
check(G.quests.s_pie.state === 2, 'torta consegnata');
runDialog(); // chiude l'eventuale messaggio di Game.say

teleportNear('farmer');
tap('e'); frames(2); runDialog();
check(G.quests.s_chicken.state === 1, 'missione delle galline attivata');
for (const c of G.region.chickens) {
  c.vx = 0; c.vy = 0; c.t = 999; // ferma la gallina: il test deve essere deterministico
  G.player.x = c.x; G.player.y = c.y;
  tap('e'); frames(2);
  if (G.quests.s_chicken.count >= 3) break;
}
check(G.quests.s_chicken.count >= 3, 'galline catturate');
teleportNear('farmer');
tap('e'); frames(2); runDialog();
check(G.quests.s_chicken.state === 2, 'missione delle galline completata');

/* ------------------------------------------------ viaggio: uscite tra regioni */

console.log('\n--- Cambio regione tramite uscite ---');
G.player.x = 38 * 32 + 16;
G.player.y = 11 * 32 + 16;
frames(2);
check(G.region.id === 'forest', 'uscita a est porta a Boscocupo');
check(!Game.G.player.dead, 'il giocatore è vivo dopo il viaggio');

/* ------------------------------------------------ foresta: banditi e veggente */

console.log('\n--- Boscocupo ---');
teleportNear('seer');
tap('e'); frames(2); runDialog();
check(G.quests.q_road.state === 2, 'missione della via completata');
check(G.quests.q_bandits.state === 1, 'missione dei banditi attivata');

for (const e of G.region.enemies.slice()) {
  if (e.type === 'bandit') Game.damageEnemy(e, 9999, 0, 0);
}
check(G.quests.q_bandits.count >= 6, 'banditi eliminati');
teleportNear('seer');
tap('e'); frames(2); runDialog();
check(G.quests.q_bandits.state === 2, 'missione dei banditi completata');
check(G.quests.q_seal.state === 1, 'missione del Sigillo attivata');

// bandito ferito: risparmialo
teleportNear('woundedBandit');
tap('e'); frames(2); runDialog(30, 0);
check(G.flags.banditChoice === 'spared', 'scelta morale registrata');
runDialog();
const moralBefore = G.player.moral;
check(moralBefore > 0, 'la moralità è positiva (' + moralBefore + ')');

/* ------------------------------------------------ città: negozio e proprietà */

console.log('\n--- Borgopietra ---');
G.player.x = 39 * 32 + 8;
G.player.y = 16 * 32 + 16;
frames(2);
check(G.region.id === 'town', 'arrivo a Borgopietra');

G.player.gold = 2000;
teleportNear('olga');
tap('e'); frames(2); runDialog();
check(G.mode === 'shop', 'negozio aperto dal dialogo');
tap('Enter'); frames(1); // compra pozione di vita
check(G.player.potions.hp >= 3, 'pozione comprata');
tap('ArrowDown'); frames(1);
tap('ArrowDown'); frames(1);
tap('Enter'); frames(1); // compra spada
check(G.player.meleeTier === 2, 'spada d\'acciaio equipaggiata');
tap('Escape'); frames(1);
check(G.mode === 'play', 'negozio chiuso');

// proprietà
const prop = MAPS.town.props[0];
G.player.x = prop.x * 32 + 16;
G.player.y = prop.y * 32 + 16;
tap('e'); frames(2);
runDialog();
check(G.owned.includes(prop.id), 'casa acquistata');
G.rentT = 59.99;
frames(2);
check(G.msg && G.msg.includes('Affitti'), 'affitto riscosso');

// potenziamento del personaggio
G.player.xp = 1000;
tap('c'); frames(1);
check(G.mode === 'char', 'scheda personaggio aperta');
tap('Enter'); frames(1);
check(G.player.str === 2, 'Forza potenziata');
tap('Escape'); frames(1);

/* ------------------------------------------------ cimitero e sigillo */

console.log('\n--- Cimitero di Pratolargo ---');
Game.enterRegion('cemetery', 20, 22);
frames(2);
check(G.region.id === 'cemetery', 'ingresso al cimitero');
check(G.region.enemies.filter(e => e.type === 'hollow').length >= 8, 'non-morti presenti');

// il cancello nord è chiuso senza sigillo
G.player.x = 19 * 32 + 16;
G.player.y = 1 * 32 + 16;
frames(2);
check(G.region.id === 'cemetery', 'il cancello nord è chiuso senza Sigillo');

for (const e of G.region.enemies.slice()) {
  if (e.type === 'hollow') Game.damageEnemy(e, 9999, 0, 0);
}
check(G.quests.q_seal.count >= 8, 'non-morti distrutti');

// apre la cripta
G.player.x = 20 * 32 + 16;
G.player.y = 6 * 32 + 16;
tap('e'); frames(2);
runDialog();
check(G.flags.hasSeal === true, 'Sigillo dell\'Eroe ottenuto');
check(G.quests.q_seal.state === 2, 'missione del Sigillo completata');
check(G.quests.q_jack.state === 1, 'missione finale attivata');

// ora il cancello nord è aperto
G.player.x = 19 * 32 + 16;
G.player.y = 0 * 32 + 16;
frames(2);
check(G.region.id === 'lair', 'il cancello aperto porta alla Tana');

/* ------------------------------------------------ boss e finale */

console.log('\n--- Jack of Blades ---');
const jack = G.region.enemies.find(e => e.type === 'jack');
check(!!jack, 'Jack of Blades presente');

// lascia che Jack lanci una raffica
G.player.x = jack.x;
G.player.y = jack.y + 200;
frames(200);
check(G.player.hp <= Game.maxHp(), 'il giocatore ha subito la battaglia (PV: ' + Math.ceil(G.player.hp) + ')');

Game.damageEnemy(jack, 99999, 0, 0);
frames(1);
check(G.mode === 'dialog', 'dialogo finale dopo la vittoria');
runDialog(30, 0); // distrugge la Spada (Bene)
check(G.mode === 'ending', 'schermata del finale mostrata');
check(G.ending === 'good', 'finale buono registrato');
check(G.flags.jackDead === true, 'Jack segnato come sconfitto');
frames(5);
tap('Enter');
frames(2);
check(G.mode === 'play', 'si può continuare a esplorare dopo il finale');

/* ------------------------------------------------ morte e resurrezione */

console.log('\n--- Morte e resurrezione ---');
G.player.hp = 1;
Game.damagePlayer(9999);
check(G.player.dead === true, 'il giocatore può morire');
frames(200);
check(G.player.dead === false && G.player.hp === Game.maxHp(), 'resurrezione con PV pieni');

/* ------------------------------------------------ salvataggio e caricamento */

console.log('\n--- Salvataggio ---');
Game.saveGame();
check(Game.hasSave(), 'salvataggio presente');
const goldBefore = G.player.gold;
const ok = Game.loadGame();
check(ok, 'caricamento riuscito');
check(Game.G.player.gold === goldBefore, 'oro conservato nel salvataggio');
check(Game.G.flags.hasSeal === true, 'flag conservati nel salvataggio');
check(Game.G.quests.q_jack.state === 2, 'stato missioni conservato');

// pausa dal gioco caricato
frames(5);
tap('Escape'); frames(1);
check(Game.G.mode === 'pause', 'menu di pausa');
tap('Escape'); frames(1);
check(Game.G.mode === 'play', 'ripresa dal menu');

// registro missioni
tap('q'); frames(1);
check(Game.G.mode === 'quests', 'registro missioni aperto');
tap('q'); frames(1);

// rendering lungo in ogni regione (stress di disegno)
console.log('\n--- Stress di rendering ---');
for (const id of Object.keys(MAPS)) {
  Game.enterRegion(id, 8, 8);
  frames(120);
  check(true, 'regione ' + id + ': 120 fotogrammi senza errori');
}

console.log('\n' + (failures === 0 ? 'TUTTI I TEST SUPERATI ✔' : failures + ' TEST FALLITI ✘'));
process.exit(failures === 0 ? 0 : 1);

/* game.js — logica di gioco: mondo, combattimento, IA, missioni, salvataggi */
(function () {
  const T = 32;            // dimensione tessera a schermo
  const SCALE = 2;         // scala sprite

  const ENEMY_TYPES = {
    wolf:      { name: 'Lupo',          hp: 25,  dmg: 8,  speed: 110, aggro: 190, xp: 12, gold: [0, 5],  sprite: 'wolf',      beast: true },
    bandit:    { name: 'Bandito',       hp: 40,  dmg: 12, speed: 100, aggro: 200, xp: 20, gold: [8, 20], sprite: 'bandit' },
    hobbe:     { name: 'Hobbe',         hp: 30,  dmg: 10, speed: 90,  aggro: 180, xp: 15, gold: [3, 10], sprite: 'hobbe' },
    hollow:    { name: 'Non-morto',     hp: 50,  dmg: 14, speed: 80,  aggro: 230, xp: 25, gold: [5, 15], sprite: 'hollow' },
    balverine: { name: 'Balverine',     hp: 90,  dmg: 18, speed: 160, aggro: 240, xp: 60, gold: [20, 40], sprite: 'balverine' },
    jack:      { name: 'Jack of Blades', hp: 600, dmg: 25, speed: 115, aggro: 9999, xp: 0, gold: [0, 0], sprite: 'jack', boss: true }
  };

  const Game = {};
  let G = null;
  Game.T = T;
  Game.SCALE = SCALE;
  Game.ENEMY_TYPES = ENEMY_TYPES;

  /* ------------------------------------------------ stato */

  function freshQuests() {
    const q = {};
    for (const id in DATA.QUESTS) {
      q[id] = { state: 0, count: 0, targetN: DATA.QUESTS[id].target || 0 };
    }
    return q;
  }

  Game.newGame = function () {
    G = {
      mode: 'intro',
      introIdx: 0,
      time: 0,
      dayT: 80,                 // secondi nel ciclo giorno/notte (parte di giorno)
      player: {
        x: 0, y: 0, face: 'down',
        hp: 80, mp: 30,
        gold: 60, xp: 0,
        str: 1, skill: 1, will: 1,
        moral: 0, renown: 0,
        meleeTier: 1, rangedTier: 1,
        potions: { hp: 2, mp: 1 },
        atkCd: 0, rngCd: 0, magCd: 0, healCd: 0, hurtCd: 0,
        swing: 0, anim: 0, dead: false, deadT: 0
      },
      dog: { x: 0, y: 0, flip: false, barkT: 0, anim: 0 },
      quests: freshQuests(),
      flags: {},
      owned: [],
      dug: {},
      rentT: 0,
      kills: 0,
      msg: null, msgT: 0,
      dialog: null,
      shop: null,
      menuIdx: 0,
      region: null,
      ending: null,
      shake: 0
    };
    Game.G = G;
    enterRegion('oakvale', 8, 8);
    return G;
  };

  /* ------------------------------------------------ utilità */

  function maxHp() { return 80 + (G.player.str - 1) * 22; }
  function maxMp() { return 30 + (G.player.will - 1) * 16; }
  Game.maxHp = maxHp;
  Game.maxMp = maxMp;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function irand(a, b) { return Math.floor(rand(a, b + 1)); }
  function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy); }

  Game.addText = function (x, y, str, color) {
    G.region.texts.push({ x, y, str, color: color || '#fff', t: 1.4 });
  };

  Game.toast = function (str) { G.msg = str; G.msgT = 3.5; };

  Game.say = function (str) {
    G.dialog = { name: '', lines: [str], idx: 0, choices: null, choiceIdx: 0, onEnd: null };
    G.mode = 'dialog';
  };

  function sfx(name) { if (window.Sfx) try { window.Sfx[name](); } catch (e) {} }
  Game.sfx = sfx;

  /* ------------------------------------------------ regioni */

  function tileAt(tx, ty) {
    const r = G.region;
    if (tx < 0 || ty < 0 || tx >= r.w || ty >= r.h) return '#';
    return r.tiles[ty][tx];
  }
  Game.tileAt = tileAt;

  function solidTile(tx, ty) {
    return !!SOLID_TILES[tileAt(tx, ty)];
  }

  function solidAt(px, py) {
    return solidTile(Math.floor(px / T), Math.floor(py / T));
  }

  function boxFree(x, y, hw, hh) {
    return !solidAt(x - hw, y - hh) && !solidAt(x + hw, y - hh) &&
           !solidAt(x - hw, y + hh) && !solidAt(x + hw, y + hh);
  }
  Game.boxFree = boxFree;

  function moveEntity(e, dx, dy, hw, hh) {
    hw = hw || 8; hh = hh || 6;
    if (dx !== 0 && boxFree(e.x + dx, e.y, hw, hh)) e.x += dx;
    if (dy !== 0 && boxFree(e.x, e.y + dy, hw, hh)) e.y += dy;
  }

  function carveRect(tiles, x, y, w, h, ch) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (j >= 0 && j < tiles.length && i >= 0 && i < tiles[j].length) tiles[j][i] = ch;
      }
    }
  }

  function enterRegion(id, tx, ty) {
    const def = MAPS[id];
    const tiles = def.rows.map(r => r.split(''));

    // garantisce uscite percorribili (se la condizione è soddisfatta)
    for (const ex of def.exits) {
      if (ex.cond && !G.flags[ex.cond]) continue;
      carveRect(tiles, ex.x, ex.y, ex.w, ex.h, 'p');
    }

    const region = {
      id, def, name: def.name, w: def.w, h: def.h, tiles,
      enemies: [], npcs: [], chickens: [], orbs: [], projs: [],
      parts: [], texts: [], digs: [], entryX: tx * T, entryY: ty * T
    };

    function clearAround(cx, cy) {
      const i = Math.floor(cx), j = Math.floor(cy);
      if (SOLID_TILES[tiles[j] && tiles[j][i]]) tiles[j][i] = '.';
    }

    for (const n of def.npcs) {
      if (id === 'forest' && n.id === 'woundedBandit' && G.flags.banditChoice === 'killed') continue;
      clearAround(n.x, n.y);
      region.npcs.push({
        id: n.id, name: n.name, sprite: n.sprite, shopId: n.shop || null,
        x: n.x * T + T / 2, y: n.y * T + T / 2,
        homeX: n.x * T + T / 2, homeY: n.y * T + T / 2,
        hp: 30, wanderT: rand(1, 3), vx: 0, vy: 0, fleeT: 0, dead: false, flip: false
      });
    }

    for (const s of def.spawns) {
      if (s.type === 'jack' && G.flags.jackDead) continue;
      const et = ENEMY_TYPES[s.type];
      clearAround(s.x, s.y);
      region.enemies.push({
        type: s.type, et,
        x: s.x * T + T / 2, y: s.y * T + T / 2,
        homeX: s.x * T + T / 2, homeY: s.y * T + T / 2,
        hp: et.hp, cd: rand(0, 1), wanderT: rand(0.5, 2), vx: 0, vy: 0,
        hurtT: 0, volleyT: 2.5, flip: false, anim: rand(0, 9)
      });
    }

    for (const c of def.chickens) {
      clearAround(c.x, c.y);
      region.chickens.push({ x: c.x * T + T / 2, y: c.y * T + T / 2, vx: 0, vy: 0, t: rand(0.5, 2), kicked: 0, caught: false, flip: false });
    }

    for (const d of def.digs) {
      const key = id + ':' + d.x + ',' + d.y;
      if (G.dug[key]) continue;
      region.digs.push({ x: d.x * T + T / 2, y: d.y * T + T / 2, gold: d.gold, key, found: false });
    }

    G.region = region;
    G.player.x = tx * T;
    G.player.y = ty * T;
    G.dog.x = G.player.x - 26;
    G.dog.y = G.player.y + 10;

    Game.toast(def.name);
    saveGame();
  }
  Game.enterRegion = enterRegion;

  /* ------------------------------------------------ missioni */

  Game.startQuest = function (id) {
    const q = G.quests[id];
    if (q.state !== 0) return;
    q.state = 1;
    Game.toast('Nuova missione: ' + DATA.QUESTS[id].title);
    sfx('quest');
  };

  Game.completeQuest = function (id, reward) {
    const q = G.quests[id];
    if (q.state === 2) return;
    q.state = 2;
    reward = reward || {};
    if (reward.gold) Game.give(reward.gold);
    if (reward.moral) Game.addMoral(reward.moral);
    if (reward.renown) Game.addRenown(reward.renown);
    Game.toast('Missione completata: ' + DATA.QUESTS[id].title);
    sfx('quest');
    saveGame();
  };

  Game.failQuest = function (id) { G.quests[id].state = 3; };

  Game.give = function (n) {
    G.player.gold = Math.max(0, G.player.gold + n);
    if (n > 0) Game.addText(G.player.x, G.player.y - 30, '+' + n + ' oro', '#ffd84a');
  };

  Game.addMoral = function (n) {
    G.player.moral = Math.max(-100, Math.min(100, G.player.moral + n));
    Game.addText(G.player.x, G.player.y - 42, (n > 0 ? '+' : '') + n + ' moralità', n > 0 ? '#8ad2ff' : '#ff6a6a');
  };

  Game.addRenown = function (n) { G.player.renown += n; };

  Game.healPlayer = function (n) {
    G.player.hp = Math.min(maxHp(), G.player.hp + n);
    Game.addText(G.player.x, G.player.y - 30, '+' + n + ' PV', '#6aff8a');
  };

  function questKill(kind) {
    for (const id in G.quests) {
      const q = G.quests[id], def = DATA.QUESTS[id];
      if (q.state === 1 && def.kind === kind && q.count < q.targetN) {
        q.count++;
        Game.toast(def.title + ': ' + q.count + '/' + q.targetN);
      }
    }
  }

  Game.activeQuestText = function () {
    // priorità alla missione principale attiva
    const order = ['q_jack', 'q_seal', 'q_bandits', 'q_road', 'q_wolves', 's_pie', 's_chicken', 's_bandit'];
    for (const id of order) {
      const q = G.quests[id];
      if (q.state === 1) return { title: DATA.QUESTS[id].title, obj: DATA.QUESTS[id].objective(q) };
    }
    return null;
  };

  /* ------------------------------------------------ combattimento */

  function meleeDmg() { return 8 + G.player.str * 4 + (G.player.meleeTier > 1 ? 8 : 0); }
  function rangedDmg() { return 6 + G.player.skill * 3 + (G.player.rangedTier > 1 ? 7 : 0); }
  function magicDmg() { return 10 + G.player.will * 6; }
  Game.meleeDmg = meleeDmg; Game.rangedDmg = rangedDmg; Game.magicDmg = magicDmg;

  function facingVec() {
    switch (G.player.face) {
      case 'up': return [0, -1];
      case 'down': return [0, 1];
      case 'left': return [-1, 0];
      default: return [1, 0];
    }
  }

  Game.playerMelee = function () {
    const p = G.player;
    if (p.atkCd > 0) return;
    p.atkCd = 0.38;
    p.swing = 0.16;
    sfx('swing');
    const [fx, fy] = facingVec();
    const hx = p.x + fx * 26, hy = p.y + fy * 26;
    let hit = false;
    for (const e of G.region.enemies) {
      if (Math.abs(e.x - hx) < 26 && Math.abs(e.y - hy) < 26) {
        damageEnemy(e, meleeDmg(), fx, fy);
        hit = true;
      }
    }
    for (const n of G.region.npcs) {
      if (!n.dead && Math.abs(n.x - hx) < 22 && Math.abs(n.y - hy) < 22) hitNpc(n);
    }
    for (const c of G.region.chickens) {
      if (!c.caught && Math.abs(c.x - hx) < 22 && Math.abs(c.y - hy) < 22) {
        c.vx = fx * 320; c.vy = fy * 320 - 80; c.kicked = 0.8;
        Game.addMoral(-1);
        Game.addText(c.x, c.y - 16, 'COOOC!', '#ffd84a');
        sfx('chicken');
      }
    }
    if (hit) sfx('hit');
  };

  Game.playerRanged = function () {
    const p = G.player;
    if (p.rngCd > 0) return;
    p.rngCd = 0.55;
    const [fx, fy] = facingVec();
    G.region.projs.push({
      x: p.x + fx * 14, y: p.y - 8 + fy * 14, vx: fx * 420, vy: fy * 420,
      dmg: rangedDmg(), from: 'player', kind: p.rangedTier > 1 ? 'bullet' : 'arrow', life: 0.8
    });
    sfx('shoot');
  };

  Game.playerFireball = function () {
    const p = G.player;
    if (p.magCd > 0 || p.mp < 12) {
      if (p.mp < 12 && p.magCd <= 0) Game.addText(p.x, p.y - 30, 'Volontà insufficiente!', '#8a8aff');
      return;
    }
    p.magCd = 0.8;
    p.mp -= 12;
    const [fx, fy] = facingVec();
    G.region.projs.push({
      x: p.x + fx * 14, y: p.y - 8 + fy * 14, vx: fx * 320, vy: fy * 320,
      dmg: magicDmg(), from: 'player', kind: 'fire', life: 1.1
    });
    sfx('magic');
  };

  Game.playerHeal = function () {
    const p = G.player;
    if (p.healCd > 0 || p.mp < 20) {
      if (p.mp < 20 && p.healCd <= 0) Game.addText(p.x, p.y - 30, 'Volontà insufficiente!', '#8a8aff');
      return;
    }
    p.healCd = 1.2;
    p.mp -= 20;
    Game.healPlayer(30 + G.player.will * 10);
    for (let i = 0; i < 10; i++) {
      G.region.parts.push({ x: p.x + rand(-14, 14), y: p.y + rand(-20, 6), vx: 0, vy: -40, t: rand(0.3, 0.7), color: '#6aff8a', size: 2 });
    }
    sfx('heal');
  };

  Game.usePotion = function (kind) {
    const p = G.player;
    if (kind === 'hp' && p.potions.hp > 0 && p.hp < maxHp()) {
      p.potions.hp--; Game.healPlayer(40); sfx('drink');
    } else if (kind === 'mp' && p.potions.mp > 0 && p.mp < maxMp()) {
      p.potions.mp--; p.mp = Math.min(maxMp(), p.mp + 30);
      Game.addText(p.x, p.y - 30, '+30 Volontà', '#8a8aff'); sfx('drink');
    }
  };

  function damageEnemy(e, dmg, kx, ky) {
    e.hp -= dmg;
    e.hurtT = 0.15;
    if (kx || ky) {
      const nx = e.x + (kx || 0) * 10, ny = e.y + (ky || 0) * 10;
      if (boxFree(nx, ny, 8, 6)) { e.x = nx; e.y = ny; }
    }
    Game.addText(e.x, e.y - 26, '' + dmg, '#ffae5a');
    if (e.hp <= 0) killEnemy(e);
  }
  Game.damageEnemy = damageEnemy;

  function killEnemy(e) {
    const r = G.region;
    const i = r.enemies.indexOf(e);
    if (i >= 0) r.enemies.splice(i, 1);
    G.kills++;
    Game.addRenown(1);
    questKill(e.type);
    sfx('die');

    // orbe di esperienza (stile Fable)
    const orbs = Math.max(1, Math.round(e.et.xp / 6));
    for (let k = 0; k < orbs; k++) {
      r.orbs.push({ x: e.x + rand(-12, 12), y: e.y + rand(-12, 12), val: Math.ceil(e.et.xp / orbs), kind: 'xp', t: 12 });
    }
    const gold = irand(e.et.gold[0], e.et.gold[1]);
    if (gold > 0) r.orbs.push({ x: e.x, y: e.y, val: gold, kind: 'gold', t: 12 });

    for (let k = 0; k < 8; k++) {
      r.parts.push({ x: e.x, y: e.y - 8, vx: rand(-60, 60), vy: rand(-80, 10), t: rand(0.2, 0.5), color: '#a83232', size: 2 });
    }

    if (e.type === 'balverine') { Game.addRenown(5); Game.toast('Hai abbattuto una Balverine! (+fama)'); }
    if (e.type === 'jack') {
      G.flags.jackDead = true;
      G.shake = 0.8;
      finalChoice();
    }
  }

  function hitNpc(n) {
    n.hp -= meleeDmg();
    n.fleeT = 3;
    Game.addMoral(-4);
    sfx('hit');
    if (n.hp <= 0) {
      n.dead = true;
      Game.addMoral(-11);
      Game.toast('Hai ucciso ' + n.name + '. Albion non dimentica.');
      for (let k = 0; k < 8; k++) {
        G.region.parts.push({ x: n.x, y: n.y - 8, vx: rand(-60, 60), vy: rand(-80, 10), t: rand(0.2, 0.5), color: '#a83232', size: 2 });
      }
    }
  }

  function damagePlayer(dmg) {
    const p = G.player;
    if (p.hurtCd > 0 || p.dead) return;
    p.hurtCd = 0.6;
    p.hp -= dmg;
    G.shake = Math.max(G.shake, 0.25);
    sfx('hurt');
    Game.addText(p.x, p.y - 30, '-' + dmg, '#ff5a5a');
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.deadT = 2.6;
      const lost = Math.floor(p.gold * 0.1);
      p.gold -= lost;
      Game.toast('Sei caduto... Un Vessillo della Resurrezione ti riporta in vita. (-' + lost + ' oro)');
    }
  }
  Game.damagePlayer = damagePlayer;

  function finalChoice() {
    G.mode = 'dialog';
    G.dialog = {
      name: 'Jack of Blades',
      lines: [
        'Jack: *cade in ginocchio, la maschera incrinata* Impossibile... io SONO Albion...',
        'La Spada di Aeons cade ai tuoi piedi, pulsando di un potere antico. Senti la sua voce nel sangue.'
      ],
      idx: 0,
      choiceIdx: 0,
      choices: [
        {
          label: 'Distruggi la Spada di Aeons (Bene)',
          fn: () => {
            Game.addMoral(40);
            Game.addRenown(50);
            G.ending = 'good';
            G.mode = 'ending';
            sfx('quest');
          }
        },
        {
          label: 'Impugna la Spada di Aeons (Male)',
          fn: () => {
            Game.addMoral(-40);
            Game.addRenown(50);
            G.player.meleeTier = 3;
            G.ending = 'evil';
            G.mode = 'ending';
            sfx('die');
          }
        }
      ],
      onEnd: null
    };
    G.quests.q_jack.state = 2;
    saveGame();
  }

  /* ------------------------------------------------ interazione */

  Game.interact = function () {
    const p = G.player;
    const r = G.region;

    // galline (missione) — hanno priorità sui PNG vicini
    if (G.quests.s_chicken.state === 1) {
      for (const c of r.chickens) {
        if (!c.caught && dist(p, c) < 36) {
          c.caught = true;
          G.quests.s_chicken.count++;
          Game.toast('Gallina catturata! (' + G.quests.s_chicken.count + '/3)');
          sfx('chicken');
          return;
        }
      }
    }

    // PNG
    for (const n of r.npcs) {
      if (!n.dead && dist(p, n) < 44) { startDialog(n); return; }
    }

    // cripta
    if (r.def.crypt && G.quests.q_seal.state === 1) {
      const cx = r.def.crypt.x * T + T / 2, cy = r.def.crypt.y * T + T;
      if (Math.abs(p.x - cx) < 60 && Math.abs(p.y - cy) < 60) {
        const q = G.quests.q_seal;
        if (q.count >= q.targetN) {
          G.flags.hasSeal = true;
          Game.completeQuest('q_seal', { renown: 25 });
          Game.startQuest('q_jack');
          // apre il cancello a nord
          for (const ex of r.def.exits) {
            if (ex.cond === 'hasSeal') carveRect(r.tiles, ex.x, ex.y, ex.w, ex.h, 'p');
          }
          Game.say('Hai il SIGILLO DELL\'EROE! Un boato scuote la terra: il cancello a nord del cimitero si spalanca.');
        } else {
          Game.say('La cripta è sigillata da energia oscura. (' + q.count + '/' + q.targetN + ' non-morti distrutti)');
        }
        return;
      }
    }

    // punti di scavo
    for (const d of r.digs) {
      if (dist(p, d) < 40) {
        G.dug[d.key] = true;
        r.digs.splice(r.digs.indexOf(d), 1);
        Game.give(d.gold);
        Game.toast('Strappo ha fiutato bene: tesoro dissotterrato!');
        sfx('dig');
        return;
      }
    }

    // proprietà
    if (r.def.props) {
      for (const pr of r.def.props) {
        const px = pr.x * T + T / 2, py = pr.y * T + T / 2;
        if (Math.abs(p.x - px) < 44 && Math.abs(p.y - py) < 44) {
          if (G.owned.includes(pr.id)) {
            Game.say(pr.name + ': è casa tua. Rendita: ' + pr.rent + ' oro al minuto.');
          } else if (G.player.gold >= pr.cost) {
            G.player.gold -= pr.cost;
            G.owned.push(pr.id);
            Game.addRenown(5);
            Game.say('Hai comprato ' + pr.name + ' per ' + pr.cost + ' oro! Riceverai ' + pr.rent + ' oro di affitto al minuto.');
            sfx('quest');
            saveGame();
          } else {
            Game.say(pr.name + ' è in vendita per ' + pr.cost + ' oro. Non hai abbastanza monete.');
          }
          return;
        }
      }
    }
  };

  function startDialog(npc) {
    const fn = DATA.DIALOGS[npc.id];
    if (!fn) { Game.say(npc.name + ': ...'); return; }
    const d = fn(G, Game);
    G.dialog = {
      name: npc.name,
      lines: d.lines || ['...'],
      idx: 0,
      choices: d.choices || null,
      choiceIdx: 0,
      onEnd: d.onEnd || null,
      shop: d.shop || null
    };
    G.mode = 'dialog';
    sfx('talk');
  }

  Game.advanceDialog = function () {
    const d = G.dialog;
    if (!d) { G.mode = 'play'; return; }
    if (d.idx < d.lines.length - 1) { d.idx++; sfx('talk'); return; }
    if (d.choices) return; // l'interfaccia gestisce la scelta
    const onEnd = d.onEnd, shop = d.shop;
    G.dialog = null;
    G.mode = 'play';
    if (onEnd) onEnd();
    if (shop) Game.openShop(shop);
  };

  Game.chooseDialog = function (i) {
    const d = G.dialog;
    if (!d || !d.choices) return;
    const c = d.choices[i];
    G.dialog = null;
    G.mode = 'play';
    if (c && c.fn) c.fn();
    sfx('ui');
  };

  /* ------------------------------------------------ negozio */

  Game.priceMod = function () {
    if (G.player.moral >= 40) return 0.9;
    if (G.player.moral <= -40) return 1.25;
    return 1;
  };

  Game.openShop = function (shopId) {
    G.shop = { id: shopId, idx: 0 };
    G.mode = 'shop';
  };

  Game.buyItem = function (itemId) {
    const it = DATA.ITEMS[itemId];
    const price = Math.round(it.price * Game.priceMod());
    const p = G.player;
    if (it.once === 'meleeTier' && p.meleeTier >= 2) { Game.toast('Possiedi già un\'arma migliore.'); return; }
    if (it.once === 'rangedTier' && p.rangedTier >= 2) { Game.toast('Possiedi già quest\'arma.'); return; }
    if (p.gold < price) { Game.toast('Oro insufficiente!'); sfx('ui'); return; }
    p.gold -= price;
    if (itemId === 'pot_hp') p.potions.hp++;
    else if (itemId === 'pot_mp') p.potions.mp++;
    else if (it.once === 'meleeTier') { p.meleeTier = 2; Game.toast('Nuova arma da mischia equipaggiata!'); }
    else if (it.once === 'rangedTier') { p.rangedTier = 2; Game.toast('Nuova arma a distanza equipaggiata!'); }
    sfx('drink');
  };

  /* ------------------------------------------------ potenziamento */

  Game.upgradeCost = function (lvl) { return lvl * 100; };

  Game.upgrade = function (stat) {
    const p = G.player;
    const lvl = p[stat];
    if (lvl >= 5) { Game.toast('Livello massimo raggiunto.'); return; }
    const cost = Game.upgradeCost(lvl);
    if (p.xp < cost) { Game.toast('Esperienza insufficiente (' + cost + ' necessaria).'); return; }
    p.xp -= cost;
    p[stat]++;
    if (stat === 'str') p.hp = maxHp();
    if (stat === 'will') p.mp = maxMp();
    Game.toast('Potenziamento! ' + ({ str: 'Forza', skill: 'Abilità', will: 'Volontà' })[stat] + ' → livello ' + p[stat]);
    sfx('levelup');
  };

  /* ------------------------------------------------ aggiornamento */

  Game.update = function (dt, input) {
    G.time += dt;
    G.dayT = (G.dayT + dt) % 240;
    if (G.msgT > 0) G.msgT -= dt;
    if (G.shake > 0) G.shake -= dt;

    // affitti
    G.rentT += dt;
    if (G.rentT >= 60) {
      G.rentT -= 60;
      let rent = 0;
      const townProps = MAPS.town.props || [];
      for (const pr of townProps) if (G.owned.includes(pr.id)) rent += pr.rent;
      if (rent > 0) {
        G.player.gold += rent;
        Game.toast('Affitti riscossi: +' + rent + ' oro');
        sfx('drink');
      }
    }

    updatePlayer(dt, input);
    updateDog(dt);
    updateEnemies(dt);
    updateNpcs(dt);
    updateChickens(dt);
    updateProjectiles(dt);
    updateOrbs(dt);
    updateParticles(dt);
    checkExits();
  };

  function updatePlayer(dt, input) {
    const p = G.player;
    for (const k of ['atkCd', 'rngCd', 'magCd', 'healCd', 'hurtCd']) if (p[k] > 0) p[k] -= dt;
    if (p.swing > 0) p.swing -= dt;

    if (p.dead) {
      p.deadT -= dt;
      if (p.deadT <= 0) {
        p.dead = false;
        p.hp = maxHp();
        p.mp = maxMp();
        p.x = G.region.entryX;
        p.y = G.region.entryY;
      }
      return;
    }

    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    p.moving = !!(dx || dy);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const sp = (150 + (p.skill - 1) * 8) * dt;
      moveEntity(p, dx / len * sp, dy / len * sp);
      p.anim += dt * 10;
      if (Math.abs(dx) >= Math.abs(dy)) p.face = dx < 0 ? 'left' : 'right';
      else p.face = dy < 0 ? 'up' : 'down';
    }

    // rigenerazione lenta della Volontà
    p.mp = Math.min(maxMp(), p.mp + dt * 1.5);
  }

  function updateDog(dt) {
    const d = G.dog, p = G.player;
    d.anim += dt * 8;
    d.moving = false;
    const dd = dist(d, p);
    if (dd > 44) {
      const sp = Math.min(220, 90 + dd) * dt;
      const dx = p.x - d.x, dy = p.y - d.y, len = Math.hypot(dx, dy) || 1;
      moveEntity(d, dx / len * sp, dy / len * sp, 6, 5);
      d.flip = dx < 0;
      d.moving = true;
    }
    // attacca i nemici vicini
    if (d.barkT > 0) d.barkT -= dt;
    let near = null, best = 120;
    for (const e of G.region.enemies) {
      if (e.et.boss) continue;
      const de = dist(d, e);
      if (de < best) { best = de; near = e; }
    }
    if (near && best < 30 && d.barkT <= 0) {
      d.barkT = 1.1;
      damageEnemy(near, 4 + G.player.str, 0, 0);
      Game.addText(d.x, d.y - 20, 'GRRR!', '#d8b22a');
    } else if (near && best < 120) {
      const dx = near.x - d.x, dy = near.y - d.y, len = Math.hypot(dx, dy) || 1;
      moveEntity(d, dx / len * 130 * dt, dy / len * 130 * dt, 6, 5);
      d.flip = dx < 0;
      d.moving = true;
    }
    // fiuta i tesori
    for (const dig of G.region.digs) {
      if (!dig.found && dist(d, dig) < 110) {
        dig.found = true;
        Game.toast('Strappo abbaia verso un punto del terreno! (avvicinati e premi E)');
        sfx('bark');
      }
    }
  }

  function updateEnemies(dt) {
    const p = G.player;
    for (const e of G.region.enemies) {
      e.anim += dt * 8;
      e.moving = false;
      if (e.hurtT > 0) e.hurtT -= dt;
      if (e.cd > 0) e.cd -= dt;
      const dp = dist(e, p);
      const speed = e.et.speed * (e.type === 'jack' && e.hp < ENEMY_TYPES.jack.hp / 2 ? 1.35 : 1);

      if (!p.dead && dp < e.et.aggro) {
        // insegue
        if (dp > 26) {
          const dx = p.x - e.x, dy = p.y - e.y, len = Math.hypot(dx, dy) || 1;
          moveEntity(e, dx / len * speed * dt, dy / len * speed * dt);
          e.flip = dx < 0;
          e.moving = true;
        } else if (e.cd <= 0) {
          e.cd = 1.0;
          damagePlayer(e.et.dmg);
        }
        // il boss lancia palle di fuoco
        if (e.type === 'jack') {
          e.volleyT -= dt;
          if (e.volleyT <= 0) {
            e.volleyT = e.hp < ENEMY_TYPES.jack.hp / 2 ? 1.7 : 2.5;
            const n = e.hp < ENEMY_TYPES.jack.hp / 2 ? 5 : 3;
            const base = Math.atan2(p.y - e.y, p.x - e.x);
            for (let i = 0; i < n; i++) {
              const a = base + (i - (n - 1) / 2) * 0.28;
              G.region.projs.push({
                x: e.x, y: e.y - 10, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260,
                dmg: 16, from: 'enemy', kind: 'efire', life: 1.6
              });
            }
            sfx('magic');
          }
        }
      } else {
        // vagabondaggio
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          e.wanderT = rand(1, 3);
          const a = rand(0, Math.PI * 2);
          e.vx = Math.cos(a) * 30;
          e.vy = Math.sin(a) * 30;
          if (Math.random() < 0.4) { e.vx = 0; e.vy = 0; }
        }
        if (e.vx || e.vy) {
          moveEntity(e, e.vx * dt, e.vy * dt);
          if (e.vx) e.flip = e.vx < 0;
          e.moving = true;
        }
      }
    }
  }

  function updateNpcs(dt) {
    const p = G.player;
    const evil = p.moral <= -40;
    for (const n of G.region.npcs) {
      if (n.dead) continue;
      n.anim = (n.anim || 0) + dt * 8;
      n.moving = false;
      if (n.fleeT > 0 || (evil && dist(n, p) < 90)) {
        if (n.fleeT <= 0) { n.fleeT = 1.2; Game.addText(n.x, n.y - 30, '!', '#ff5a5a'); }
        n.fleeT -= dt;
        const dx = n.x - p.x, dy = n.y - p.y, len = Math.hypot(dx, dy) || 1;
        moveEntity(n, dx / len * 120 * dt, dy / len * 120 * dt);
        n.flip = dx < 0;
        n.moving = true;
        continue;
      }
      n.wanderT -= dt;
      if (n.wanderT <= 0) {
        n.wanderT = rand(2, 5);
        if (dist(n, { x: n.homeX, y: n.homeY }) > 60) {
          const dx = n.homeX - n.x, dy = n.homeY - n.y, len = Math.hypot(dx, dy) || 1;
          n.vx = dx / len * 30; n.vy = dy / len * 30;
        } else if (Math.random() < 0.5) {
          const a = rand(0, Math.PI * 2);
          n.vx = Math.cos(a) * 25; n.vy = Math.sin(a) * 25;
        } else { n.vx = 0; n.vy = 0; }
      }
      if (n.vx || n.vy) {
        moveEntity(n, n.vx * dt, n.vy * dt);
        if (n.vx) n.flip = n.vx < 0;
        n.moving = true;
      }
      // i cuori per l'eroe buono
      if (p.moral >= 40 && dist(n, p) < 70 && Math.random() < dt * 0.5) {
        G.region.parts.push({ x: n.x, y: n.y - 24, vx: 0, vy: -25, t: 0.8, color: '#ff8ab0', size: 2 });
      }
    }
  }

  function updateChickens(dt) {
    for (const c of G.region.chickens) {
      if (c.caught) continue;
      c.anim = (c.anim || 0) + dt * 8;
      c.moving = false;
      if (c.kicked > 0) {
        c.kicked -= dt;
        moveEntity(c, c.vx * dt, c.vy * dt, 5, 4);
        c.vx *= 0.92; c.vy *= 0.92;
        c.moving = true;
        continue;
      }
      c.t -= dt;
      if (c.t <= 0) {
        c.t = rand(0.8, 2.5);
        const a = rand(0, Math.PI * 2);
        c.vx = Math.cos(a) * 35; c.vy = Math.sin(a) * 35;
        if (Math.random() < 0.5) { c.vx = 0; c.vy = 0; }
      }
      if (c.vx || c.vy) {
        moveEntity(c, c.vx * dt, c.vy * dt, 5, 4);
        if (c.vx) c.flip = c.vx < 0;
        c.moving = true;
      }
    }
  }

  function updateProjectiles(dt) {
    const r = G.region, p = G.player;
    for (let i = r.projs.length - 1; i >= 0; i--) {
      const pr = r.projs[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      let dead = pr.life <= 0 || solidAt(pr.x, pr.y);

      if (!dead && pr.from === 'player') {
        for (const e of r.enemies) {
          if (Math.abs(e.x - pr.x) < 16 && Math.abs(e.y - 10 - pr.y) < 18) {
            if (pr.kind === 'fire') {
              // esplosione ad area
              for (const e2 of r.enemies.slice()) {
                if (Math.hypot(e2.x - pr.x, e2.y - pr.y) < 52) damageEnemy(e2, pr.dmg, 0, 0);
              }
              explode(pr.x, pr.y, '#ff8a2a');
            } else {
              damageEnemy(e, pr.dmg, Math.sign(pr.vx) * 0.5, Math.sign(pr.vy) * 0.5);
            }
            dead = true;
            break;
          }
        }
      } else if (!dead && pr.from === 'enemy') {
        if (!p.dead && Math.abs(p.x - pr.x) < 14 && Math.abs(p.y - 10 - pr.y) < 18) {
          damagePlayer(pr.dmg);
          dead = true;
        }
      }

      if (dead) {
        if (pr.kind === 'fire') explode(pr.x, pr.y, '#ff8a2a');
        r.projs.splice(i, 1);
      }
    }
  }

  function explode(x, y, color) {
    for (let k = 0; k < 12; k++) {
      G.region.parts.push({ x, y, vx: rand(-90, 90), vy: rand(-90, 90), t: rand(0.2, 0.5), color, size: 3 });
    }
    sfx('boom');
  }

  function updateOrbs(dt) {
    const r = G.region, p = G.player;
    for (let i = r.orbs.length - 1; i >= 0; i--) {
      const o = r.orbs[i];
      o.t -= dt;
      const d = dist(o, p);
      if (d < 90) {
        const dx = p.x - o.x, dy = p.y - o.y, len = Math.hypot(dx, dy) || 1;
        const sp = 260 * dt;
        o.x += dx / len * sp;
        o.y += dy / len * sp;
      }
      if (d < 18) {
        if (o.kind === 'xp') {
          p.xp += o.val;
          Game.addText(p.x, p.y - 26, '+' + o.val + ' esp', '#6ad2ff');
        } else {
          p.gold += o.val;
          Game.addText(p.x, p.y - 26, '+' + o.val + ' oro', '#ffd84a');
        }
        sfx('pickup');
        r.orbs.splice(i, 1);
      } else if (o.t <= 0) {
        r.orbs.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    const r = G.region;
    for (let i = r.parts.length - 1; i >= 0; i--) {
      const pt = r.parts[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.t -= dt;
      if (pt.t <= 0) r.parts.splice(i, 1);
    }
    for (let i = r.texts.length - 1; i >= 0; i--) {
      const tx = r.texts[i];
      tx.y -= 26 * dt;
      tx.t -= dt;
      if (tx.t <= 0) r.texts.splice(i, 1);
    }
  }

  function checkExits() {
    const p = G.player;
    if (p.dead) return;
    const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    for (const ex of G.region.def.exits) {
      if (tx >= ex.x && tx < ex.x + ex.w && ty >= ex.y && ty < ex.y + ex.h) {
        if (ex.cond && !G.flags[ex.cond]) continue;
        enterRegion(ex.to, ex.tx, ex.ty);
        return;
      }
    }
  }

  /* ------------------------------------------------ salvataggio */

  const SAVE_KEY = 'albion_save_v1';

  function saveGame() {
    if (!G || G.mode === 'intro' || G.mode === 'title') return;
    try {
      const p = G.player;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        player: {
          hp: p.hp, mp: p.mp, gold: p.gold, xp: p.xp,
          str: p.str, skill: p.skill, will: p.will,
          moral: p.moral, renown: p.renown,
          meleeTier: p.meleeTier, rangedTier: p.rangedTier,
          potions: p.potions
        },
        quests: G.quests, flags: G.flags, owned: G.owned, dug: G.dug,
        kills: G.kills, regionId: G.region.id, ending: G.ending
      }));
    } catch (e) { /* storage non disponibile */ }
  }
  Game.saveGame = saveGame;

  Game.hasSave = function () {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  };

  Game.loadGame = function () {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!data) return false;
    Game.newGame();
    Object.assign(G.player, data.player);
    // assicura nuovi campi missione su salvataggi vecchi
    for (const id in G.quests) if (data.quests[id]) Object.assign(G.quests[id], data.quests[id]);
    G.flags = data.flags || {};
    G.owned = data.owned || [];
    G.dug = data.dug || {};
    G.kills = data.kills || 0;
    G.ending = data.ending || null;
    G.mode = 'play';
    enterRegion(data.regionId || 'oakvale', 8, 8);
    G.player.hp = Math.min(G.player.hp || maxHp(), maxHp());
    return true;
  };

  Game.clearSave = function () {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  };

  window.Game = Game;
})();

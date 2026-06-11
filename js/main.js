/* main.js — input, audio, ciclo di gioco */
(function () {

  /* ------------------------------------------------ audio (sintetizzato) */

  const Sfx = (function () {
    let ac = null;
    function audio() {
      if (!ac) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      }
      if (ac && ac.state === 'suspended') ac.resume();
      return ac;
    }
    function beep(freq, dur, type, vol, slide) {
      const a = audio();
      if (!a) return;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.04, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    }
    return {
      unlock: () => audio(),
      swing: () => beep(200, 0.09, 'sawtooth', 0.03, -90),
      hit: () => beep(130, 0.1, 'square', 0.05, -50),
      hurt: () => beep(90, 0.2, 'sawtooth', 0.06, -40),
      die: () => beep(160, 0.3, 'sawtooth', 0.05, -120),
      shoot: () => beep(600, 0.08, 'square', 0.03, -300),
      magic: () => beep(300, 0.25, 'sine', 0.05, 250),
      heal: () => beep(420, 0.3, 'sine', 0.04, 200),
      boom: () => beep(70, 0.3, 'sawtooth', 0.07, -30),
      pickup: () => beep(700, 0.07, 'square', 0.03, 250),
      drink: () => beep(350, 0.12, 'sine', 0.04, 120),
      quest: () => { beep(440, 0.12, 'square', 0.04); setTimeout(() => beep(660, 0.18, 'square', 0.04), 110); },
      levelup: () => { beep(330, 0.1, 'square', 0.04); setTimeout(() => beep(440, 0.1, 'square', 0.04), 90); setTimeout(() => beep(550, 0.2, 'square', 0.04), 180); },
      talk: () => beep(500, 0.04, 'square', 0.02),
      ui: () => beep(380, 0.05, 'square', 0.02),
      dig: () => beep(150, 0.15, 'sawtooth', 0.04, 60),
      bark: () => { beep(240, 0.07, 'square', 0.05, -60); setTimeout(() => beep(240, 0.07, 'square', 0.05, -60), 120); },
      chicken: () => beep(800, 0.1, 'square', 0.03, -400)
    };
  })();
  window.Sfx = Sfx;

  /* ------------------------------------------------ input */

  const keys = {};
  let pressed = {};

  const HANDLED = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter', 'escape',
    'w', 'a', 's', 'd', 'j', 'k', 'l', 'h', 'e', 'q', 'c', '1', '2'];

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (HANDLED.includes(k)) e.preventDefault();
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    Sfx.unlock();
  });
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  function hit(...ks) {
    for (const k of ks) if (pressed[k]) return true;
    return false;
  }

  /* ------------------------------------------------ logica per modalità */

  function menuNav(G, n) {
    if (hit('arrowup', 'w')) { G.menuIdx = (G.menuIdx + n - 1) % n; Sfx.ui(); }
    if (hit('arrowdown', 's')) { G.menuIdx = (G.menuIdx + 1) % n; Sfx.ui(); }
  }

  function step(dt) {
    const G = Game.G;
    if (!G) return;

    switch (G.mode) {
      case 'title': {
        const n = Game.hasSave() ? 2 : 1;
        if (G.menuIdx >= n) G.menuIdx = 0;
        menuNav(G, n);
        if (hit('enter', 'e', ' ')) {
          if (G.menuIdx === 0) {
            Game.newGame();
            Game.G.mode = 'intro';
          } else {
            Game.loadGame();
          }
        }
        break;
      }

      case 'intro':
        if (hit('enter', 'e', ' ')) { G.mode = 'play'; Game.toast(G.region.name); }
        break;

      case 'play': {
        if (hit('escape')) { G.mode = 'pause'; G.menuIdx = 0; break; }
        if (hit('q')) { G.mode = 'quests'; break; }
        if (hit('c')) { G.mode = 'char'; G.menuIdx = 0; break; }
        if (!G.player.dead) {
          if (hit('e')) Game.interact();
          if (G.mode !== 'play') break; // l'interazione può aprire un dialogo
          if (hit('j', ' ')) Game.playerMelee();
          if (hit('k')) Game.playerRanged();
          if (hit('l')) Game.playerFireball();
          if (hit('h')) Game.playerHeal();
          if (hit('1')) Game.usePotion('hp');
          if (hit('2')) Game.usePotion('mp');
        }
        Game.update(dt, {
          up: keys['w'] || keys['arrowup'],
          down: keys['s'] || keys['arrowdown'],
          left: keys['a'] || keys['arrowleft'],
          right: keys['d'] || keys['arrowright']
        });
        break;
      }

      case 'dialog': {
        const d = G.dialog;
        if (!d) { G.mode = 'play'; break; }
        const atChoices = d.choices && d.idx === d.lines.length - 1;
        if (atChoices) {
          if (hit('arrowup', 'w')) { d.choiceIdx = (d.choiceIdx + d.choices.length - 1) % d.choices.length; Sfx.ui(); }
          if (hit('arrowdown', 's')) { d.choiceIdx = (d.choiceIdx + 1) % d.choices.length; Sfx.ui(); }
          if (hit('enter', 'e', ' ')) Game.chooseDialog(d.choiceIdx);
        } else if (hit('enter', 'e', ' ')) {
          Game.advanceDialog();
        }
        break;
      }

      case 'shop': {
        const items = DATA.SHOPS[G.shop.id].items;
        if (hit('arrowup', 'w')) { G.shop.idx = (G.shop.idx + items.length - 1) % items.length; Sfx.ui(); }
        if (hit('arrowdown', 's')) { G.shop.idx = (G.shop.idx + 1) % items.length; Sfx.ui(); }
        if (hit('enter', ' ')) Game.buyItem(items[G.shop.idx]);
        if (hit('escape', 'e')) { G.shop = null; G.mode = 'play'; }
        break;
      }

      case 'char': {
        menuNav(G, 3);
        if (hit('enter', ' ')) Game.upgrade(['str', 'skill', 'will'][G.menuIdx]);
        if (hit('escape', 'c')) G.mode = 'play';
        break;
      }

      case 'quests':
        if (hit('escape', 'q')) G.mode = 'play';
        break;

      case 'pause': {
        menuNav(G, 4);
        if (hit('escape')) { G.mode = 'play'; break; }
        if (hit('enter', 'e', ' ')) {
          if (G.menuIdx === 0) G.mode = 'play';
          else if (G.menuIdx === 1) { Game.saveGame(); Game.toast('Partita salvata.'); G.mode = 'play'; }
          else if (G.menuIdx === 2) G.mode = 'help';
          else { G.mode = 'title'; G.menuIdx = 0; }
        }
        break;
      }

      case 'help':
        if (hit('escape', 'enter', 'e')) G.mode = 'pause';
        break;

      case 'ending':
        if (hit('enter', 'e', ' ')) { G.mode = 'play'; Game.saveGame(); }
        if (hit('escape')) { Game.saveGame(); G.mode = 'title'; G.menuIdx = 0; }
        break;
    }

    pressed = {};
  }

  /* ------------------------------------------------ avvio */

  function boot() {
    Sprites.build();
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    Game.newGame();
    Game.G.mode = 'title';
    Game.G.menuIdx = 0;

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      UI.draw(ctx, Game.G, Game, W, H);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

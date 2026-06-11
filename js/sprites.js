/* sprites.js — pixel art generata proceduralmente su canvas */
(function () {
  const S = {};

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function sprite(rows, pal) {
    const h = rows.length;
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    const c = cv(w, h);
    const x = c.getContext('2d');
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        x.fillStyle = col;
        x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }

  /* Umanoide 12x16 (più 2 righe extra se ha le corna) */
  function human(o) {
    let rows = [
      '....hhhh....',
      '...hhhhhh...',
      '...hssssh...',
      '...sseess...',
      '....ssss....',
      '...tttttt...',
      '..tttttttt..',
      '.ssttttttss.',
      '.s.tttttt.s.',
      '...tbbbbt...',
      '...llllll...',
      '...ll..ll...',
      '...ll..ll...',
      '...oo..oo...',
      '..ooo..ooo..',
      '............'
    ];
    if (o.horns) {
      rows = ['..g......g..', '..g......g..'].concat(rows);
    }
    const pal = {
      h: o.hair || '#5a3a1e',
      s: o.skin || '#e6b88a',
      e: o.eye || '#1a1a24',
      t: o.tunic || '#7a4a2a',
      b: o.belt || '#42301a',
      l: o.legs || '#4a3a2a',
      o: o.boots || '#33241a',
      g: o.hornCol || '#d8b22a'
    };
    return sprite(rows, pal);
  }

  /* Bestia quadrupede 16x10 (cane, lupo) — guarda a destra */
  function beast(body, eye) {
    const rows = [
      '...........dd...',
      '..........dddd..',
      '..........dedd..',
      'dd........dddd..',
      '.dd......ddd....',
      '.ddddddddddd....',
      '.dddddddddd.....',
      '.dd......dd.....',
      '.dd......dd.....',
      '................'
    ];
    return sprite(rows, { d: body, e: eye || '#ffffff' });
  }

  function chicken() {
    const rows = [
      '....ww..',
      '...wwww.',
      '...wweb.',
      '.wwwww..',
      'wwwwww..',
      '.wwww...',
      '..y.y...',
      '........'
    ];
    return sprite(rows, { w: '#f2efe6', e: '#222222', b: '#e08a1e', y: '#d8a128' });
  }

  function potionIcon(col) {
    const rows = [
      '..kk..',
      '..kk..',
      '.pppp.',
      'pppppp',
      'pppppp',
      '.pppp.'
    ];
    return sprite(rows, { k: '#8a6a3a', p: col });
  }

  function sign() {
    const rows = [
      'wwwwwwww',
      'wccccccw',
      'wccccccw',
      'wwwwwwww',
      '...ww...',
      '...ww...'
    ];
    return sprite(rows, { w: '#6a4a26', c: '#e8d8a8' });
  }

  function chest() {
    const rows = [
      '.cccccc.',
      'cccccccc',
      'cggggggc',
      'cccgcccc' + '',
      'cccccccc',
      '.cccccc.'
    ];
    return sprite(rows, { c: '#7a5226', g: '#d8b22a' });
  }

  S.build = function () {
    S.hero = human({ hair: '#6a4520', tunic: '#3a5a8a', legs: '#4a3a2a' });
    S.heroEvil = human({ hair: '#2a2230', tunic: '#5a1a26', legs: '#33222a', skin: '#d8c0a0' });
    S.dog = beast('#9a7444', '#2a1c10');
    S.wolf = beast('#777b85', '#d8e02a');
    S.balverine = human({ hair: '#23262e', skin: '#3a3e4a', tunic: '#23262e', legs: '#1c1e26', eye: '#e0d22a', boots: '#1c1e26' });
    S.bandit = human({ hair: '#2c2c2c', tunic: '#5a2a2a', legs: '#3a3a3a', belt: '#1e1e1e' });
    S.hobbe = sprite([
      '...gggg...',
      '..gggggg..',
      '..geggeg..',
      '..gggggg..',
      '.tttttttt.',
      '.tttttttt.',
      '..tttttt..',
      '..gg..gg..',
      '..gg..gg..',
      '..........'
    ], { g: '#7a8e3a', e: '#d82a2a', t: '#5a4a2e' });
    S.hollow = human({ hair: '#2e3a2e', skin: '#cfd6c0', tunic: '#5a665a', legs: '#4a564a', eye: '#5ae06a' });
    S.jack = human({ hair: '#8a1620', skin: '#e8e6df', tunic: '#7a1420', legs: '#3a1020', eye: '#e02a2a', horns: true });
    S.mayor = human({ hair: '#bcbcbc', tunic: '#6a5a2a', legs: '#4a4a4a' });
    S.granny = human({ hair: '#d8d8d8', tunic: '#7a4a6a', legs: '#5a4a5a' });
    S.smith = human({ hair: '#3a2a1a', tunic: '#555560', legs: '#3a3a3a', belt: '#222222' });
    S.farmer = human({ hair: '#8a6a2a', tunic: '#6a7a3a', legs: '#5a4a2a' });
    S.villager = human({ hair: '#4a3018', tunic: '#5a6a4a', legs: '#4a3a2a' });
    S.villagerF = human({ hair: '#7a3a1a', tunic: '#8a5a3a', legs: '#5a4030' });
    S.guard = human({ hair: '#6a6a72', skin: '#e6b88a', tunic: '#7a8a9a', legs: '#55606a', belt: '#2a2a30' });
    S.merchant = human({ hair: '#3a2a4a', tunic: '#8a6a2a', legs: '#5a4a3a' });
    S.priest = human({ hair: '#e8e8e8', tunic: '#d8d0b0', legs: '#b8b098' });
    S.seer = human({ hair: '#8a1620', skin: '#d8c0a0', tunic: '#8a1620', legs: '#5a1020' });
    S.gravedigger = human({ hair: '#3a3a3a', tunic: '#4a4a52', legs: '#33333a' });
    S.woundedBandit = human({ hair: '#2c2c2c', tunic: '#6a3a3a', legs: '#3a3a3a' });
    S.chicken = chicken();
    S.potHp = potionIcon('#d23a3a');
    S.potMp = potionIcon('#3a6ad2');
    S.sign = sign();
    S.chest = chest();
  };

  S.forNpc = function (key) {
    return S[key] || S.villager;
  };

  window.Sprites = S;
})();

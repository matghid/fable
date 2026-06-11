/* sprites.js — pixel art generata proceduralmente su canvas.
   Tecniche: selout (contorno selettivo), hue shifting (ombre fredde,
   luci calde), luce dall'alto, due frame di camminata per personaggio. */
(function () {
  const S = {};

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /* hue shifting: scurire vira al blu-viola, schiarire al giallo caldo */
  function shade(hex, f) {
    let r, g, b;
    if (hex[0] === '#') {
      const n = parseInt(hex.slice(1), 16);
      r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
    } else { return hex; }
    if (f < 1) {
      r = r * f * 0.88; g = g * f * 0.94; b = Math.min(255, b * f * 1.22 + 12);
    } else {
      r = Math.min(255, r * f * 1.08 + 10); g = Math.min(255, g * f + 4); b = Math.min(255, b * f * 0.9);
    }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  S.shade = shade;

  /* Disegna righe di caratteri con palette, selout e luce dall'alto */
  function sprite(rows, pal) {
    const h = rows.length;
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    const grid = [];
    for (let j = 0; j < h; j++) {
      grid.push([]);
      for (let i = 0; i < w; i++) {
        const ch = rows[j][i];
        grid[j][i] = (ch && ch !== '.' && ch !== ' ' && pal[ch]) ? pal[ch] : null;
      }
    }
    const c = cv(w + 2, h + 2); // margine per il selout
    const x = c.getContext('2d');
    const at = (i, j) => (i >= 0 && j >= 0 && i < w && j < h) ? grid[j][i] : null;

    // selout: bordo nel colore scurito del pixel adiacente
    for (let j = -1; j <= h; j++) {
      for (let i = -1; i <= w; i++) {
        if (at(i, j)) continue;
        const nb = at(i, j - 1) || at(i, j + 1) || at(i - 1, j) || at(i + 1, j);
        if (nb) { x.fillStyle = shade(nb, 0.38); x.fillRect(i + 1, j + 1, 1, 1); }
      }
    }
    // pixel con luce dall'alto
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const col = grid[j][i];
        if (!col) continue;
        x.fillStyle = !at(i, j - 1) ? shade(col, 1.22) : col;
        x.fillRect(i + 1, j + 1, 1, 1);
      }
    }
    return c;
  }

  /* ---------------- umanoide 16x24, due frame ---------------- */

  const HEAD_TORSO = [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '...hhsssssshh...',
    '...hssessessh...',
    '....ssssssss....',
    '....ssssssss....',
    '.....ssssss.....',
    '....tttttttt....',
    '...tttttttttt...',
    '..s.tttttttt.s..',
    '..s.tttttttt.s..',
    '..s.ttbbbbtt.s..',
    '....tttttttt....',
    '....tttttttt....'
  ];

  const LEGS_A = [
    '....llllllll....',
    '....lll..lll....',
    '....lll..lll....',
    '....lll..lll....',
    '....lll..lll....',
    '....ooo..ooo....',
    '...oooo..oooo...',
    '................'
  ];

  const LEGS_B = [
    '....llllllll....',
    '....lll..lll....',
    '....lll..lll....',
    '....ooo..lll....',
    '...oooo..lll....',
    '.........ooo....',
    '........oooo....',
    '................'
  ];

  const SKIRT = [
    '...tttttttttt...',
    '...dddddddddd...',
    '...dddddddddd...',
    '....dddddddd....',
    '....ss....ss....',
    '....oo....oo....',
    '................',
    '................'
  ];

  function human(o) {
    const pal = {
      h: o.hair || '#6b4423',
      s: o.skin || '#eab28c',
      e: o.eye || '#26222e',
      t: o.tunic || '#6b4a2a',
      b: o.belt || '#473018',
      l: o.legs || '#4c3a2a',
      o: o.boots || '#33241a',
      d: o.dress || shade(o.tunic || '#6b4a2a', 0.78),
      g: '#e3b93f',
      m: '#efe9dc',
      w: '#f2efe6'
    };
    function build(legs) {
      let rows = HEAD_TORSO.slice();
      if (o.mask) {
        // maschera bianca in stile Jack of Blades, occhi rossi
        rows[4] = '...hmmmmmmmmh...';
        rows[5] = '...hmmemmemmh...';
        rows[6] = '....mmmmmmmm....';
        rows[7] = '....mmrmmrmm....'.replace(/r/g, 'e');
        rows[8] = '.....mmmmmm.....';
      }
      if (o.brooch) {
        rows[9] = '....ttgggttt....';
        rows[10] = '...ttttggtttt...';
      }
      rows = rows.concat(o.dressed ? SKIRT : legs);
      if (o.horns) {
        rows = ['...g........g...', '...g........g...', '...gg......gg...'].concat(rows);
      }
      return sprite(rows, pal);
    }
    return { a: build(LEGS_A), b: o.dressed ? build(LEGS_A) : build(LEGS_B) };
  }

  /* ---------------- bestia quadrupede 18x12, due frame ---------------- */

  function beast(body, eye) {
    const pal = { w: body, e: eye || '#f2efe6', o: shade(body, 0.6), n: '#26222e' };
    const A = [
      '.............ww...',
      '............wwww..',
      '............wewwn.',
      '.www........wwww..',
      '..wwwwwwwwwwwww...',
      '..wwwwwwwwwwwww...',
      '..wwwwwwwwwwww....',
      '..www.....www.....',
      '..www.....www.....',
      '..ooo.....ooo.....'
    ];
    const B = A.slice(0, 7).concat([
      '...www.....www....',
      '..www.......www...',
      '..ooo.......ooo...'
    ]);
    return { a: sprite(A, pal), b: sprite(B, pal) };
  }

  /* ---------------- creature speciali ---------------- */

  function balverine() {
    const pal = { b: '#2e3140', y: '#ffd23a', w: '#d8d3c4', c: '#c9c2b8' };
    const rows = [
      '......bb......bb..',
      '......bbb....bbb..',
      '.......bbbbbbbb...',
      '......bbbbbbbbbb..',
      '......bbybbbybbb..',
      '......bbbbbbbbbb..',
      '.......bbwbbwbb...',
      '....bbbbbbbbbb....',
      '..bbbbbbbbbbbb....',
      '.bbbbbbbbbbbbbb...',
      '.bbb..bbbbbbbbbb..',
      '.bbb..bbbbbbbbbb..',
      '.ccc..bbbbbbbb....',
      '......bbbbbbbb....',
      '......bbbbbbb.....',
      '.....bbbbbbbb.....',
      '.....bbb..bbb.....',
      '.....bbb..bbb.....',
      '.....bbb..bbb.....',
      '.....ccc..ccc.....'
    ];
    const s = sprite(rows, pal);
    return { a: s, b: s };
  }

  function hobbe() {
    const pal = { g: '#7d9440', y: '#d8452a', w: '#e8e3d0', t: '#5d4a2e', o: '#3a2c1c' };
    const rows = [
      '....gggggg....',
      '...gggggggg...',
      '..gggggggggg..',
      '..ggyggggygg..',
      '..gggggggggg..',
      '...gggwwggg...',
      '....gggggg....',
      '..tttttttttt..',
      '.tttttttttttt.',
      '.g.tttttttt.g.',
      '.g.tttttttt.g.',
      '...tttttttt...',
      '...ggg..ggg...',
      '...ggg..ggg...',
      '...ooo..ooo...'
    ];
    const s = sprite(rows, pal);
    return { a: s, b: s };
  }

  function chicken() {
    const pal = { w: '#f2efe6', e: '#26222e', b: '#e0892a', y: '#d8a128', r: '#d8452a' };
    const A = [
      '.....r....',
      '....ww....',
      '...wwww...',
      '...wweb...',
      '.wwwww....',
      'wwwwww....',
      '.wwww.....',
      '..y.y.....',
      '..........'
    ];
    const B = [
      '..........',
      '.....r....',
      '....ww....',
      '...wweb...',
      '.wwwww....',
      'wwwwww....',
      '.wwww.....',
      '.y...y....',
      '..........'
    ];
    return { a: sprite(A, pal), b: sprite(B, pal) };
  }

  /* ---------------- oggetti ---------------- */

  function potionIcon(col) {
    return sprite([
      '..kk..',
      '..kk..',
      '.pppp.',
      'pppppp',
      'pppppp',
      '.pppp.'
    ], { k: '#8a6a3a', p: col });
  }

  function signSprite() {
    return sprite([
      'wwwwwwww',
      'wccccccw',
      'wccccccw',
      'wwwwwwww',
      '...ww...',
      '...ww...'
    ], { w: '#6b4423', c: '#e8d8a8' });
  }

  function chestSprite() {
    return sprite([
      '.cccccc.',
      'cccccccc',
      'cggggggc',
      'cccgcccc',
      'cccccccc',
      '.cccccc.'
    ], { c: '#7a5226', g: '#e3b93f' });
  }

  /* ---------------- catalogo ---------------- */

  S.build = function () {
    S.hero = human({ hair: '#7a4a23', tunic: '#4f6f9f', legs: '#4c3a2a', belt: '#8a6a3a' });
    S.heroEvil = human({ hair: '#2a2433', skin: '#d9c2a6', tunic: '#6e2233', legs: '#33222d', eye: '#c92a2a' });
    S.dog = beast('#a87f4d', '#2a1c10');
    S.wolf = beast('#6e7480', '#ffd23a');
    S.balverine = balverine();
    S.hobbe = hobbe();
    S.bandit = human({ hair: '#2e2c2a', tunic: '#7a3030', legs: '#3e3c3a', belt: '#222020' });
    S.hollow = human({ hair: '#3a4a3c', skin: '#cdd3bd', tunic: '#5a685a', legs: '#4c584c', eye: '#6fe08a' });
    S.jack = human({
      hair: '#8e2334', tunic: '#7c1f2e', legs: '#3c1622', boots: '#2a101a',
      belt: '#d8b23a', eye: '#e03a3a', mask: true, horns: true, brooch: true
    });
    S.mayor = human({ hair: '#c4c4c4', tunic: '#7a6a30', legs: '#4c4c4c' });
    S.granny = human({ hair: '#dcdcdc', tunic: '#8a5278', dressed: true });
    S.smith = human({ hair: '#3a2c1c', tunic: '#5d5d68', legs: '#3e3c3a', belt: '#26222e' });
    S.farmer = human({ hair: '#9a7430', tunic: '#7a8a40', legs: '#5d4a2e' });
    S.villager = human({ hair: '#523a1e', tunic: '#62744e', legs: '#4c3a2a' });
    S.villagerF = human({ hair: '#8a4420', tunic: '#9a6240', dressed: true });
    S.guard = human({ hair: '#8f99a8', tunic: '#7d8ca0', legs: '#56606e', belt: '#2a2a30' });
    S.merchant = human({ hair: '#43305c', tunic: '#a3802d', legs: '#5d4a3a' });
    S.priest = human({ hair: '#ececec', tunic: '#ddd3b3', dressed: true, dress: '#c4ba9a' });
    S.seer = human({ hair: '#8e2334', skin: '#d9c2a6', tunic: '#8e2334', dressed: true, dress: '#6e1a28' });
    S.gravedigger = human({ hair: '#3e3e3e', tunic: '#4e4e58', legs: '#36363e' });
    S.woundedBandit = human({ hair: '#2e2c2a', tunic: '#8a4040', legs: '#3e3c3a' });
    S.chicken = chicken();
    S.potHp = potionIcon('#d8452a');
    S.potMp = potionIcon('#3f6fd0');
    S.sign = signSprite();
    S.chest = chestSprite();
  };

  S.forNpc = function (key) {
    return S[key] || S.villager;
  };

  /* sceglie il frame di camminata in base al movimento */
  S.frameOf = function (spr, ent) {
    if (spr.a === undefined) return spr; // sprite statico
    return (ent && ent.moving && Math.floor((ent.anim || 0) * 0.6) % 2) ? spr.b : spr.a;
  };

  window.Sprites = S;
})();

/* maps.js — definizione delle regioni di Albion
   Legenda tessere:
   . erba   , erba scura   # albero (solido)   w acqua (solida)   B ponte
   p sentiero   h casa (solida)   f staccionata (solida)   k roccia (solida)
   g lapide (solida)   s sabbia   c pavimento di caverna   _ parete di caverna (solida)
   C cripta (solida, interagibile)   x punto di scavo (diventa erba)
*/
(function () {
  const W = 40, H = 26;

  const MAPS = {};

  MAPS.oakvale = {
    name: 'Roccavecchia',
    dark: 0,
    rows: [
      '########################################',
      '#..,.....##....,....#.....,....##......#',
      '#...hhh......hhh.......hhh......,......#',
      '#...hhh..,...hhh.......hhh.............#',
      '#...hhh......hhh..,....hhh......#......#',
      '#....p........p.........p..............#',
      '#,...p........p.........p.......,......#',
      '#....ppppppppppppppppppppp.............#',
      '#.,......................p.......##....#',
      '#...hhh......,...........p.............#',
      '#...hhh..........fff.....p..,...#......#',
      '#...hhh..........f.f.....pppppppppppppp#',
      '#....p...........fff.....p.............#',
      '#....p...,...............p.....,......,#',
      '#....ppppppppppppppppppppp.......#.....#',
      '#.............,..........,.............#',
      '#...,...www......x..............#......#',
      '#......wwwww........,..................#',
      '#.......www.........#...,....##........#',
      '#..........,...........................#',
      '#...#...........,......#.......,...#...#',
      '#......,....#..............,...........#',
      '#..#............,...#..........#....,..#',
      '#....,......#...........,..........#...#',
      '#........#.......,..........#......,...#',
      '########################################'
    ],
    exits: [
      { x: 38, y: 10, w: 2, h: 3, to: 'forest', tx: 2.5, ty: 12 }
    ],
    npcs: [
      { id: 'mayor', name: 'Sindaco Aldo', sprite: 'mayor', x: 26, y: 6 },
      { id: 'granny', name: 'Nonna Rosa', sprite: 'granny', x: 6, y: 6 },
      { id: 'smith', name: 'Fabbro Bruno', sprite: 'smith', x: 15, y: 6, shop: 'bruno' },
      { id: 'farmer', name: 'Contadino Gino', sprite: 'farmer', x: 21, y: 13 },
      { id: 'vill1', name: 'Popolano', sprite: 'villager', x: 10, y: 15 },
      { id: 'vill2', name: 'Popolana', sprite: 'villagerF', x: 30, y: 16 }
    ],
    chickens: [
      { x: 20, y: 13 }, { x: 22, y: 12 }, { x: 18, y: 13 }, { x: 24, y: 16 }
    ],
    spawns: [
      { type: 'wolf', x: 6, y: 21 }, { type: 'wolf', x: 12, y: 23 },
      { type: 'wolf', x: 22, y: 21 }, { type: 'wolf', x: 30, y: 22 },
      { type: 'wolf', x: 35, y: 20 }, { type: 'wolf', x: 17, y: 22 }
    ],
    digs: [
      { x: 17, y: 16, gold: 40 }
    ]
  };

  MAPS.forest = {
    name: 'Boscocupo',
    dark: 0.18,
    rows: [
      '########################################',
      '###..,..####...,...##pp##....,..####...#',
      '##......##..........pp......##.....##..#',
      '#...##.......##.....pp...,......hhh....#',
      '#.,......,.......#..pp..##......hhh....#',
      '#...####....##......pp..........hhh....#',
      '##.....##.......,...pp....##....,p.....#',
      '#..,........##......pp..........pp.....#',
      '#......##.......####ppp###....ppp...##.#',
      '#.##........,.......ppppppppppp......###',
      '#......,..####..........pp........##...#',
      '#ppppppppppppppppppppppppppppppppppppp.#',
      'pppp......##......,......pp.........ppp#',
      'pppp...,......##.........pp.......,.ppp#',
      '#.......##.......,..wwwwwBwwwww.....ppp#',
      '#..,.........##.....wwwwwBwwwww.....ppp#',
      '#....##..,..........wwwwwBwwwww.....ppp',
      '#.........,...##....,....pp....,....ppp',
      '#..####.............,....pp.........ppp',
      '#.......,...fff.f........pp..,....##...#',
      '#..##.......f.....,......pp............#',
      '#......,....f..x.........pp....####..,.#',
      '#...........fff.f....,...pp............#',
      '#..,...##.......,.....,..pp.....##.....#',
      '#............,...........pp..,.........#',
      '########################################'
    ],
    exits: [
      { x: 0, y: 11, w: 1, h: 3, to: 'oakvale', tx: 37, ty: 11.5 },
      { x: 39, y: 15, w: 1, h: 4, to: 'town', tx: 2.5, ty: 13 },
      { x: 20, y: 0, w: 2, h: 1, to: 'cemetery', tx: 20, ty: 23 }
    ],
    npcs: [
      { id: 'seer', name: 'Veggente Teodora', sprite: 'seer', x: 33, y: 7 },
      { id: 'woundedBandit', name: 'Bandito Ferito', sprite: 'woundedBandit', x: 14, y: 20 }
    ],
    chickens: [],
    spawns: [
      { type: 'bandit', x: 8, y: 14 }, { type: 'bandit', x: 12, y: 17 },
      { type: 'bandit', x: 7, y: 20 }, { type: 'bandit', x: 18, y: 23 },
      { type: 'bandit', x: 30, y: 20 }, { type: 'bandit', x: 33, y: 17 },
      { type: 'bandit', x: 10, y: 5 },
      { type: 'wolf', x: 5, y: 7 }, { type: 'wolf', x: 26, y: 3 },
      { type: 'hobbe', x: 31, y: 23 }, { type: 'hobbe', x: 34, y: 22 },
      { type: 'balverine', x: 4, y: 17 }
    ],
    digs: [
      { x: 16, y: 21, gold: 120 }
    ]
  };

  MAPS.town = {
    name: 'Borgopietra',
    dark: 0,
    rows: [
      '########################################',
      '#......................................#',
      '#..hhhh....hhhhhh....hhhhhh....hhhh....#',
      '#..hhhh....hhhhhh....hhhhhh....hhhh....#',
      '#..hhhh....hhhhhh....hhhhhh....hhhh....#',
      '#...p.........p.........p........p.....#',
      '#...p.........p.........p........p.....#',
      '#...ppppppppppppppppppppppppppppp......#',
      '#.............p..........p.............#',
      '#..hhh........p...ww.....p......hhh....#',
      '#..hhh........p...ww.....p......hhh....#',
      '#..hhh........p..........p......hhh....#',
      '#...p.........p..........p.......p.....#',
      'ppppppppppppppppppppppppppppppppppppp..#',
      'ppppppppppppppppppppppppppppppppppppp..#',
      '#...p.....p..........p...........p.....#',
      '#...p.....p..........p...........p.....#',
      '#..hhh...hhh........hhh.........hhh....#',
      '#..hhh...hhh........hhh.........hhh....#',
      '#..hhh...hhh........hhh.........hhh....#',
      '#......................................#',
      '#....,.......,..........,....,.........#',
      '#..f.f.f.f.f.f..,...........x..........#',
      '#....,..........,.....,........,..,....#',
      '#.......,..................,...........#',
      '########################################'
    ],
    exits: [
      { x: 0, y: 13, w: 1, h: 2, to: 'forest', tx: 37, ty: 16.5 }
    ],
    npcs: [
      { id: 'olga', name: 'Mercante Olga', sprite: 'merchant', x: 21, y: 9, shop: 'olga' },
      { id: 'priest', name: 'Sacerdote Lucio', sprite: 'priest', x: 13, y: 6 },
      { id: 'guard1', name: 'Guardia', sprite: 'guard', x: 6, y: 13 },
      { id: 'guard2', name: 'Guardia', sprite: 'guard', x: 30, y: 14 },
      { id: 'tvill1', name: 'Cittadino', sprite: 'villager', x: 24, y: 21 },
      { id: 'tvill2', name: 'Cittadina', sprite: 'villagerF', x: 10, y: 21 },
      { id: 'tvill3', name: 'Cittadino', sprite: 'villager', x: 33, y: 8 }
    ],
    chickens: [{ x: 5, y: 23 }],
    spawns: [],
    digs: [
      { x: 28, y: 22, gold: 80 }
    ],
    props: [
      { id: 'casa1', name: 'Casetta del Vicolo', x: 5, y: 16, cost: 500, rent: 5 },
      { id: 'casa2', name: 'Dimora del Mercato', x: 20, y: 16, cost: 800, rent: 9 },
      { id: 'casa3', name: 'Villa sul Viale', x: 34, y: 12, cost: 1200, rent: 14 }
    ]
  };

  MAPS.cemetery = {
    name: 'Cimitero di Pratolargo',
    dark: 0.32,
    rows: [
      '###################ff###################',
      '#.,.....,......,...ff......,........,..#',
      '#..,.........,..........,......,.......#',
      '#....,...........kkCCkk.........,......#',
      '#.,......,.......kkCCkk....,...........#',
      '#...,............kkppkk.......,......,.#',
      '#.......g..g..g....pp....g..g..g.......#',
      '#.,.....g..g..g....pp....g..g..g....,..#',
      '#.......g..g..g....pp....g..g..g.......#',
      '#...,..............pp..........,.......#',
      '#.......g..g..g....pp....g..g..g....,..#',
      '#.,.....g..g..g....pp....g..g..g.......#',
      '#.......g..g..g....pp....g..g..g..,....#',
      '#....,.............pp.............,....#',
      '#.......g..g..g....pp....g..g..g.......#',
      '#.,.....g..g..g....pp....g..g..g..,....#',
      '#.......g..g..g....pp....g..g..g.......#',
      '#....,.............pp.....,............#',
      '#.........,........pp..........,.......#',
      '#..,..........x....pp.......,..........#',
      '#......,...........pp.............,....#',
      '#.,........,.......pp....,.............#',
      '#....,.............pp..........,....,..#',
      '#..........,.......pp......,...........#',
      '###################pp###################',
      '########################################'
    ],
    exits: [
      { x: 19, y: 24, w: 2, h: 2, to: 'forest', tx: 21, ty: 2 },
      { x: 19, y: 0, w: 2, h: 1, to: 'lair', tx: 19, ty: 22, cond: 'hasSeal' }
    ],
    npcs: [
      { id: 'gravedigger', name: 'Becchino Mort', sprite: 'gravedigger', x: 23, y: 21 }
    ],
    chickens: [],
    spawns: [
      { type: 'hollow', x: 9, y: 7 }, { type: 'hollow', x: 28, y: 7 },
      { type: 'hollow', x: 9, y: 11 }, { type: 'hollow', x: 28, y: 11 },
      { type: 'hollow', x: 9, y: 15 }, { type: 'hollow', x: 28, y: 15 },
      { type: 'hollow', x: 14, y: 5 }, { type: 'hollow', x: 25, y: 5 },
      { type: 'hollow', x: 20, y: 9 }
    ],
    digs: [
      { x: 14, y: 19, gold: 150 }
    ],
    crypt: { x: 20, y: 4 }
  };

  MAPS.lair = {
    name: 'Tana di Jack',
    dark: 0.42,
    rows: [
      '________________________________________',
      '________________________________________',
      '____cccccccccccccccccccccccccccccccc____',
      '___cccccccccccccccccccccccccccccccccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___ccc______cccccccccccccccc______ccc___',
      '___ccc______cccccccccccccccc______ccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___ccc______cccccccccccccccc______ccc___',
      '___ccc______cccccccccccccccc______ccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___ccc______cccccccccccccccc______ccc___',
      '___ccc______cccccccccccccccc______ccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '___cccccccccccccccccccccccccccccccccc___',
      '____cccccccccccccccccccccccccccccccc____',
      '_____ccccccccccccccccccccccccccccccc____',
      '__________ccccccccccccccccccc___________',
      '__________________cc____________________',
      '__________________cc____________________',
      '__________________cc____________________',
      '__________________cc____________________'
    ],
    exits: [
      { x: 18, y: 25, w: 2, h: 1, to: 'cemetery', tx: 20, ty: 2 }
    ],
    npcs: [],
    chickens: [],
    spawns: [
      { type: 'hobbe', x: 8, y: 13 }, { type: 'hobbe', x: 31, y: 13 },
      { type: 'hobbe', x: 8, y: 18 }, { type: 'hobbe', x: 31, y: 18 },
      { type: 'balverine', x: 14, y: 9 }, { type: 'balverine', x: 25, y: 9 },
      { type: 'jack', x: 20, y: 4 }
    ],
    digs: []
  };

  const SOLID = { '#': 1, w: 1, h: 1, f: 1, k: 1, g: 1, C: 1, _: 1 };

  /* Normalizza ogni mappa: righe della stessa larghezza, altezza fissa */
  function normalize(def) {
    const rows = def.rows;
    while (rows.length < H) rows.push('#'.repeat(W));
    for (let j = 0; j < rows.length; j++) {
      let r = rows[j];
      if (r.length < W) r += (SOLID[r[r.length - 1]] ? r[r.length - 1] : '#').repeat(W - r.length);
      if (r.length > W) r = r.slice(0, W);
      rows[j] = r;
    }
    def.w = W;
    def.h = rows.length;
  }

  for (const k in MAPS) normalize(MAPS[k]);

  window.MAPS = MAPS;
  window.MAP_W = W;
  window.MAP_H = H;
  window.SOLID_TILES = SOLID;
})();

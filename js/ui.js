/* ui.js — rendering: mondo, HUD, menu e schermate.
   Stile: pixel art "storybook" alla Fable — palette calda, ombre fredde,
   luce dorata, atmosfera per regione (raggi, nebbia, braci, lucciole). */
(function () {
  const UI = {};
  const T = 32;

  const FONT_S = '11px "Courier New", monospace';
  const FONT_M = 'bold 13px "Courier New", monospace';
  const FONT_L = 'bold 22px "Courier New", monospace';
  const FONT_XL = 'bold 34px "Courier New", monospace';

  function rnd2(x, y) {
    let n = (x * 374761393 + y * 668265263) | 0;
    n = (n ^ (n >> 13)) | 0;
    return ((n * 1274126177) >>> 0) / 4294967295;
  }

  /* ------------------------------------------------ tessere */

  const GRASSY = { '.': 1, ',': 1, x: 1, f: 1, g: 1, '#': 1 };

  function grassBase(ctx, sx, sy, tx, ty, dark) {
    const r = rnd2(tx, ty);
    ctx.fillStyle = dark ? '#4c8240' : '#5d9c49';
    ctx.fillRect(sx, sy, T, T);
    // ciuffi e variazioni (mai una griglia visibile)
    const r2 = rnd2(tx * 3 + 1, ty * 5 + 2);
    ctx.fillStyle = dark ? '#447637' : '#549040';
    if (r > 0.35) ctx.fillRect(sx + ((r * 23) | 0), sy + ((r2 * 23) | 0), 5, 3);
    if (r2 > 0.5) ctx.fillRect(sx + ((r2 * 20) | 0), sy + ((r * 26) | 0), 3, 2);
    ctx.fillStyle = dark ? '#558c47' : '#6cab55';
    if (r > 0.62) ctx.fillRect(sx + ((r2 * 25) | 0), sy + ((r * 18) | 0), 2, 4);
    // fiorellini sparsi
    if (!dark && r > 0.93) {
      ctx.fillStyle = r2 > 0.5 ? '#e8e3d0' : '#d8895a';
      ctx.fillRect(sx + ((r * 26) | 0), sy + ((r2 * 26) | 0), 2, 2);
      ctx.fillStyle = '#e3b93f';
      ctx.fillRect(sx + ((r * 26) | 0) + 1, sy + ((r2 * 26) | 0) + 1, 1, 1);
    }
  }

  function drawTile(ctx, tiles, i, j, sx, sy, time) {
    const ch = tiles[j][i];
    const at = (x, y) => (tiles[y] && tiles[y][x]) || ch;
    const r = rnd2(i, j);

    switch (ch) {
      case '.':
      case 'x':
        grassBase(ctx, sx, sy, i, j, false);
        break;

      case ',':
        grassBase(ctx, sx, sy, i, j, true);
        break;

      case '#': {
        grassBase(ctx, sx, sy, i, j, true);
        // ombra a terra
        ctx.fillStyle = 'rgba(20,40,25,0.35)';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 27, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // tronco
        ctx.fillStyle = '#5d3f24';
        ctx.fillRect(sx + 13, sy + 18, 6, 11);
        ctx.fillStyle = '#6b4a2b';
        ctx.fillRect(sx + 13, sy + 18, 2, 11);
        // chioma a strati (con leggera variazione per albero)
        const v = (r * 5) | 0;
        ctx.fillStyle = '#2e5e2b';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 11, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3f7c33';
        ctx.beginPath();
        ctx.ellipse(sx + 14 - v % 3, sy + 9, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#549441';
        ctx.beginPath();
        ctx.ellipse(sx + 12 - v % 2, sy + 7, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6cab55';
        ctx.fillRect(sx + 8 - (v % 2), sy + 4, 4, 2);
        break;
      }

      case 'w': {
        ctx.fillStyle = '#33639c';
        ctx.fillRect(sx, sy, T, T);
        ctx.fillStyle = '#2c5588';
        if (r > 0.5) ctx.fillRect(sx + ((r * 16) | 0), sy + 18, 10, 4);
        // onde animate
        const ph = Math.sin(time * 1.6 + i * 1.7 + j * 2.3);
        ctx.fillStyle = '#5a8ec4';
        if (ph > 0.2) ctx.fillRect(sx + 4 + ((r * 8) | 0), sy + 6, 12, 2);
        if (ph < -0.4) ctx.fillRect(sx + 12, sy + 22, 14, 2);
        // schiuma sui bordi verso la terra
        ctx.fillStyle = 'rgba(207,227,238,0.85)';
        if (at(i, j - 1) !== 'w' && at(i, j - 1) !== 'B') ctx.fillRect(sx, sy, T, 2);
        if (at(i, j + 1) !== 'w' && at(i, j + 1) !== 'B') ctx.fillRect(sx, sy + T - 2, T, 2);
        if (at(i - 1, j) !== 'w' && at(i - 1, j) !== 'B') ctx.fillRect(sx, sy, 2, T);
        if (at(i + 1, j) !== 'w' && at(i + 1, j) !== 'B') ctx.fillRect(sx + T - 2, sy, 2, T);
        break;
      }

      case 'B':
        ctx.fillStyle = '#8a6038';
        ctx.fillRect(sx, sy, T, T);
        ctx.fillStyle = '#6e4a28';
        for (let k = 0; k < 4; k++) ctx.fillRect(sx, sy + 6 + k * 8, T, 2);
        ctx.fillStyle = '#a3784a';
        ctx.fillRect(sx, sy, T, 2);
        ctx.fillStyle = '#523618';
        ctx.fillRect(sx, sy, 3, T);
        ctx.fillRect(sx + T - 3, sy, 3, T);
        break;

      case 'p': {
        ctx.fillStyle = '#c2a36b';
        ctx.fillRect(sx, sy, T, T);
        // ciottoli
        ctx.fillStyle = '#b3935c';
        if (r > 0.3) ctx.fillRect(sx + ((r * 20) | 0), sy + ((rnd2(i + 7, j) * 20) | 0), 6, 4);
        ctx.fillStyle = '#d1b47e';
        if (r > 0.55) ctx.fillRect(sx + ((rnd2(i, j + 9) * 22) | 0), sy + ((r * 24) | 0), 4, 3);
        ctx.fillStyle = '#a8854f';
        if (r > 0.75) ctx.fillRect(sx + ((r * 14) | 0), sy + ((rnd2(i + 3, j + 3) * 24) | 0), 5, 3);
        // bordi morbidi verso l'erba
        ctx.fillStyle = '#558c47';
        if (GRASSY[at(i, j - 1)]) { ctx.fillRect(sx, sy, 5, 2); ctx.fillRect(sx + 12, sy, 6, 2); ctx.fillRect(sx + 26, sy, 6, 2); }
        if (GRASSY[at(i, j + 1)]) { ctx.fillRect(sx + 4, sy + 30, 6, 2); ctx.fillRect(sx + 20, sy + 30, 7, 2); }
        if (GRASSY[at(i - 1, j)]) { ctx.fillRect(sx, sy + 6, 2, 5); ctx.fillRect(sx, sy + 20, 2, 6); }
        if (GRASSY[at(i + 1, j)]) { ctx.fillRect(sx + 30, sy + 3, 2, 6); ctx.fillRect(sx + 30, sy + 18, 2, 7); }
        break;
      }

      case 'h': {
        const wall = at(i, j + 1) !== 'h'; // riga più bassa del blocco = facciata
        if (wall) {
          // facciata in stile Tudor: intonaco e travi a vista
          ctx.fillStyle = '#d9c9a8';
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = '#c4b292';
          ctx.fillRect(sx, sy + T - 6, T, 6);
          ctx.fillStyle = '#6b4a2b';
          ctx.fillRect(sx, sy, T, 3);
          ctx.fillRect(sx, sy, 3, T);
          ctx.fillRect(sx + T - 3, sy, 3, T);
          ctx.fillRect(sx, sy + T - 3, T, 3);
          if (r > 0.55) {
            // finestra con luce calda
            ctx.fillStyle = '#6b4a2b';
            ctx.fillRect(sx + 9, sy + 8, 14, 14);
            ctx.fillStyle = r > 0.78 ? '#e8c178' : '#7fa8c9';
            ctx.fillRect(sx + 11, sy + 10, 10, 10);
            ctx.fillStyle = '#6b4a2b';
            ctx.fillRect(sx + 15, sy + 10, 2, 10);
            ctx.fillRect(sx + 11, sy + 14, 10, 2);
          } else if (r > 0.3) {
            // trave diagonale
            ctx.fillStyle = '#6b4a2b';
            for (let k = 0; k < 8; k++) ctx.fillRect(sx + 4 + k * 3, sy + 6 + k * 2, 3, 3);
          } else {
            // porta
            ctx.fillStyle = '#5d3a20';
            ctx.fillRect(sx + 10, sy + 10, 12, 22);
            ctx.fillStyle = '#7a5230';
            ctx.fillRect(sx + 12, sy + 12, 8, 20);
            ctx.fillStyle = '#e3b93f';
            ctx.fillRect(sx + 18, sy + 20, 2, 2);
          }
        } else {
          // tetto di tegole
          const ridge = at(i, j - 1) !== 'h';
          ctx.fillStyle = '#9c4f3a';
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = '#7e3c2d';
          for (let k = 0; k < 4; k++) {
            ctx.fillRect(sx, sy + 6 + k * 8, T, 2);
            const off = (k % 2) * 8;
            for (let q = 0; q < 4; q++) ctx.fillRect(sx + off + q * 16 - 8, sy + k * 8, 2, 6);
          }
          if (ridge) {
            ctx.fillStyle = '#b56247';
            ctx.fillRect(sx, sy, T, 4);
            ctx.fillStyle = '#d8895a';
            ctx.fillRect(sx, sy, T, 1);
          }
        }
        break;
      }

      case 'f':
        grassBase(ctx, sx, sy, i, j, false);
        ctx.fillStyle = '#8a6a3e';
        ctx.fillRect(sx + 3, sy + 6, 5, 24);
        ctx.fillRect(sx + 24, sy + 6, 5, 24);
        ctx.fillStyle = '#a3804d';
        ctx.fillRect(sx + 3, sy + 6, 2, 24);
        ctx.fillRect(sx + 24, sy + 6, 2, 24);
        ctx.fillStyle = '#75552e';
        ctx.fillRect(sx, sy + 12, T, 4);
        ctx.fillRect(sx, sy + 22, T, 3);
        break;

      case 'k':
        grassBase(ctx, sx, sy, i, j, true);
        ctx.fillStyle = 'rgba(20,30,25,0.3)';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 26, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6e747c';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 16, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8b919a';
        ctx.fillRect(sx + 7, sy + 8, 10, 5);
        ctx.fillStyle = '#4f545b';
        ctx.fillRect(sx + 12, sy + 20, 12, 4);
        break;

      case 'g': {
        grassBase(ctx, sx, sy, i, j, true);
        ctx.fillStyle = 'rgba(15,25,20,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 28, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9aa0a8';
        ctx.fillRect(sx + 9, sy + 8, 14, 20);
        ctx.fillStyle = '#b5bac2';
        ctx.fillRect(sx + 11, sy + 5, 10, 5);
        ctx.fillRect(sx + 9, sy + 8, 3, 20);
        ctx.fillStyle = '#70767e';
        ctx.fillRect(sx + 20, sy + 8, 3, 20);
        // incisione: croce o lapide liscia
        ctx.fillStyle = '#5a5f66';
        if (r > 0.5) {
          ctx.fillRect(sx + 15, sy + 11, 2, 9);
          ctx.fillRect(sx + 12, sy + 14, 8, 2);
        } else {
          ctx.fillRect(sx + 12, sy + 13, 8, 1);
          ctx.fillRect(sx + 12, sy + 16, 8, 1);
        }
        // muschio
        if (r > 0.6) { ctx.fillStyle = '#558c47'; ctx.fillRect(sx + 9, sy + 24, 5, 4); }
        break;
      }

      case 's':
        ctx.fillStyle = '#d9c084';
        ctx.fillRect(sx, sy, T, T);
        ctx.fillStyle = '#c9ae70';
        if (r > 0.4) ctx.fillRect(sx + ((r * 22) | 0), sy + ((rnd2(i + 1, j) * 22) | 0), 6, 3);
        break;

      case 'c':
        ctx.fillStyle = '#4a4250';
        ctx.fillRect(sx, sy, T, T);
        ctx.fillStyle = '#544b5b';
        if (r > 0.5) ctx.fillRect(sx + ((r * 18) | 0), sy + ((rnd2(i + 5, j) * 18) | 0), 9, 6);
        ctx.fillStyle = '#403947';
        if (r > 0.7) ctx.fillRect(sx + ((rnd2(i, j + 5) * 20) | 0), sy + ((r * 22) | 0), 6, 4);
        // crepe
        if (r > 0.85) {
          ctx.fillStyle = '#332c3a';
          ctx.fillRect(sx + 8, sy + 14, 12, 1);
          ctx.fillRect(sx + 18, sy + 15, 1, 6);
        }
        break;

      case '_': {
        const face = at(i, j + 1) === 'c'; // parete frontale sopra il pavimento
        if (face) {
          ctx.fillStyle = '#382f42';
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = '#443a50';
          ctx.fillRect(sx, sy, T, 8);
          ctx.fillStyle = '#241f2c';
          ctx.fillRect(sx, sy + T - 4, T, 4);
          ctx.fillRect(sx + ((r * 24) | 0), sy + 10, 2, 12);
          if (r > 0.5) ctx.fillRect(sx + ((rnd2(i + 2, j) * 26) | 0), sy + 14, 8, 2);
        } else {
          ctx.fillStyle = '#241f2c';
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = '#2b2533';
          if (r > 0.4) ctx.fillRect(sx + ((r * 20) | 0), sy + ((rnd2(i + 4, j) * 20) | 0), 10, 7);
        }
        break;
      }

      case 'C': {
        ctx.fillStyle = '#50545c';
        ctx.fillRect(sx, sy, T, T);
        ctx.fillStyle = '#62666e';
        ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
        ctx.fillStyle = '#3c4046';
        ctx.fillRect(sx + 2, sy + T - 6, T - 4, 4);
        // runa pulsante
        const glow = 0.6 + Math.sin(time * 3 + i) * 0.4;
        ctx.fillStyle = 'rgba(150,90,230,' + glow.toFixed(2) + ')';
        ctx.fillRect(sx + 13, sy + 8, 6, 16);
        ctx.fillRect(sx + 9, sy + 13, 14, 4);
        break;
      }

      default:
        grassBase(ctx, sx, sy, i, j, false);
    }
  }

  /* ------------------------------------------------ sprite helper */

  function drawSprite(ctx, img, x, y, flip, scale) {
    scale = scale || 2;
    const w = img.width * scale, h = img.height * scale;
    ctx.save();
    if (flip) {
      ctx.translate(Math.round(x + w / 2), Math.round(y - h));
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, 0, w, h);
    } else {
      ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h), w, h);
    }
    ctx.restore();
  }

  function dropShadow(ctx, x, y, rx) {
    ctx.fillStyle = 'rgba(15,20,30,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, rx, rx * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ------------------------------------------------ atmosfera */

  function nightAlpha(G) {
    const t = G.dayT;
    let night = 0;
    if (t > 120 && t < 150) night = (t - 120) / 30;
    else if (t >= 150 && t <= 210) night = 1;
    else if (t > 210 && t < 240) night = (240 - t) / 30;
    return night * 0.32;
  }

  function drawAmbience(ctx, G, W, H, camX, camY) {
    const id = G.region.id;
    const time = G.time;
    const night = nightAlpha(G) > 0.12;

    if (id === 'forest') {
      // lame di luce dorata tra gli alberi
      ctx.save();
      for (let k = 0; k < 5; k++) {
        const bx = ((k * 367 + 80) - camX * 0.9) % (W + 300) - 150;
        const pulse = 0.05 + 0.025 * Math.sin(time * 0.7 + k * 2.1);
        const grad = ctx.createLinearGradient(bx, 0, bx + 120, H);
        grad.addColorStop(0, 'rgba(255,226,140,' + pulse.toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(255,226,140,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx + 70, 0);
        ctx.lineTo(bx + 190, H);
        ctx.lineTo(bx + 90, H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    if (id === 'cemetery') {
      // banchi di nebbia che scorrono
      for (let k = 0; k < 3; k++) {
        const fy = (k * 170 + 60 + Math.sin(time * 0.3 + k * 2) * 30) % (H + 80) - 40;
        const fx = ((time * (8 + k * 5)) % (W + 400)) - 200;
        const grad = ctx.createRadialGradient(fx, fy, 10, fx, fy, 220);
        grad.addColorStop(0, 'rgba(185,200,210,0.10)');
        grad.addColorStop(1, 'rgba(185,200,210,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(fx - 220, fy - 90, 440, 180);
      }
    }

    if (id === 'lair') {
      // braci che salgono
      for (let k = 0; k < 14; k++) {
        const seed = rnd2(k * 13 + 5, k * 7 + 2);
        const ex = (seed * W + Math.sin(time * 0.8 + k) * 24 + W) % W;
        const ey = H - ((time * (22 + seed * 30) + seed * 500) % (H + 40));
        const a = 0.25 + 0.2 * Math.sin(time * 4 + k);
        ctx.fillStyle = 'rgba(255,120,50,' + Math.max(0, a).toFixed(2) + ')';
        ctx.fillRect(ex, ey, 2, 2);
      }
    }

    if (night && (id === 'oakvale' || id === 'forest' || id === 'town')) {
      // lucciole notturne
      for (let k = 0; k < 9; k++) {
        const seed = rnd2(k * 31 + 3, k * 17 + 11);
        const fx = (seed * W + Math.sin(time * 0.6 + k * 1.9) * 60 + W) % W;
        const fy = (seed * H * 0.8 + 40 + Math.cos(time * 0.5 + k * 1.3) * 40 + H) % H;
        const a = Math.max(0, Math.sin(time * 2.2 + k * 2.6)) * 0.7;
        if (a > 0.05) {
          ctx.fillStyle = 'rgba(230,230,120,' + (a * 0.25).toFixed(2) + ')';
          ctx.beginPath();
          ctx.arc(fx, fy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(245,245,170,' + a.toFixed(2) + ')';
          ctx.fillRect(fx - 1, fy - 1, 2, 2);
        }
      }
    }

    // calda luce dorata diurna nelle zone aperte
    if (!night && (id === 'oakvale' || id === 'town')) {
      ctx.fillStyle = 'rgba(255,205,110,0.06)';
      ctx.fillRect(0, 0, W, H);
    }

    // vignettatura
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(10,8,20,0)');
    vg.addColorStop(1, 'rgba(10,8,20,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ------------------------------------------------ mondo */

  function drawWorld(ctx, G, Game, W, H) {
    const r = G.region, p = G.player;

    let camX = Math.round(p.x - W / 2);
    let camY = Math.round(p.y - H / 2);
    camX = Math.max(0, Math.min(r.w * T - W, camX));
    camY = Math.max(0, Math.min(r.h * T - H, camY));
    if (G.shake > 0) {
      camX += Math.round((Math.random() - 0.5) * 8);
      camY += Math.round((Math.random() - 0.5) * 8);
    }

    const tx0 = Math.max(0, Math.floor(camX / T)), ty0 = Math.max(0, Math.floor(camY / T));
    const tx1 = Math.min(r.w - 1, tx0 + Math.ceil(W / T) + 1);
    const ty1 = Math.min(r.h - 1, ty0 + Math.ceil(H / T) + 1);
    for (let j = ty0; j <= ty1; j++) {
      for (let i = tx0; i <= tx1; i++) {
        drawTile(ctx, r.tiles, i, j, i * T - camX, j * T - camY, G.time);
      }
    }

    // punti di scavo trovati dal cane
    for (const d of r.digs) {
      if (!d.found) continue;
      const sx = d.x - camX, sy = d.y - camY;
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(sx - 8, sy - 5, 16, 10);
      ctx.fillStyle = '#523218';
      ctx.fillRect(sx - 5, sy - 2, 10, 5);
      ctx.fillStyle = '#e3b93f';
      ctx.font = FONT_M;
      ctx.textAlign = 'center';
      if (Math.sin(G.time * 5) > 0) ctx.fillText('!', sx, sy - 12);
    }

    // cartelli delle proprietà
    if (r.def.props) {
      for (const pr of r.def.props) {
        const sx = pr.x * T + T / 2 - camX, sy = pr.y * T + T - camY;
        drawSprite(ctx, Sprites.sign, sx, sy, false, 2);
        if (Math.abs(p.x - (pr.x * T + T / 2)) < 60 && Math.abs(p.y - (pr.y * T + T / 2)) < 60) {
          ctx.font = FONT_S;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          const owned = G.owned.includes(pr.id);
          ctx.fillText(owned ? pr.name + ' (tua)' : pr.name + ' - ' + pr.cost + ' oro [E]', sx, sy - 30);
        }
      }
    }

    // entità ordinate per Y
    const ents = [];
    for (const e of r.enemies) ents.push({ y: e.y, kind: 'enemy', o: e });
    for (const n of r.npcs) if (!n.dead) ents.push({ y: n.y, kind: 'npc', o: n });
    for (const c of r.chickens) if (!c.caught) ents.push({ y: c.y, kind: 'chicken', o: c });
    ents.push({ y: G.dog.y, kind: 'dog', o: G.dog });
    if (!p.dead) ents.push({ y: p.y, kind: 'player', o: p });
    ents.sort((a, b) => a.y - b.y);

    for (const en of ents) {
      const o = en.o;
      const sx = o.x - camX, sy = o.y - camY;
      if (en.kind === 'player') {
        drawPlayer(ctx, G, sx, sy);
      } else if (en.kind === 'dog') {
        dropShadow(ctx, sx, sy + 2, 12);
        const bob = Math.sin(o.anim) * 1.5;
        drawSprite(ctx, Sprites.frameOf(Sprites.dog, o), sx, sy + 6 + bob, o.flip, 2);
      } else if (en.kind === 'chicken') {
        dropShadow(ctx, sx, sy + 2, 7);
        drawSprite(ctx, Sprites.frameOf(Sprites.chicken, o), sx, sy + 4, o.flip, 2);
      } else if (en.kind === 'npc') {
        dropShadow(ctx, sx, sy + 2, 10);
        drawSprite(ctx, Sprites.frameOf(Sprites.forNpc(o.sprite), o), sx, sy + 4, o.flip, 2);
        if (Math.abs(p.x - o.x) < 60 && Math.abs(p.y - o.y) < 60) {
          ctx.font = FONT_S;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffe9a0';
          ctx.fillText(o.name + ' [E]', sx, sy - 48);
        }
      } else {
        const e = o;
        const spr = Sprites[e.et.sprite] || Sprites.bandit;
        dropShadow(ctx, sx, sy + 2, e.et.boss ? 16 : 11);
        if (e.hurtT > 0) ctx.globalAlpha = 0.55;
        const bob = e.et.beast ? Math.sin(e.anim) * 1.5 : 0;
        drawSprite(ctx, Sprites.frameOf(spr, e), sx, sy + 4 + bob, e.flip, e.et.boss ? 3 : 2);
        ctx.globalAlpha = 1;
        if (e.hp < e.et.hp && !e.et.boss) {
          ctx.fillStyle = 'rgba(15,15,25,0.8)';
          ctx.fillRect(sx - 14, sy - 44, 28, 4);
          ctx.fillStyle = '#d8452a';
          ctx.fillRect(sx - 14, sy - 44, 28 * Math.max(0, e.hp / e.et.hp), 4);
        }
      }
    }

    // proiettili
    for (const pr of r.projs) {
      const sx = pr.x - camX, sy = pr.y - camY;
      if (pr.kind === 'fire' || pr.kind === 'efire') {
        ctx.fillStyle = pr.kind === 'fire' ? 'rgba(255,140,40,0.35)' : 'rgba(225,40,75,0.35)';
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pr.kind === 'fire' ? '#ff8a2a' : '#e02a4a';
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe084';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (pr.kind === 'bullet') {
        ctx.fillStyle = '#ffe084';
        ctx.fillRect(sx - 3, sy - 1, 6, 2);
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(sx - 1, sy - 2, 3, 4);
      } else {
        ctx.strokeStyle = '#caa86a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx - pr.vx * 0.02, sy - pr.vy * 0.02);
        ctx.lineTo(sx + pr.vx * 0.02, sy + pr.vy * 0.02);
        ctx.stroke();
        ctx.fillStyle = '#e8e3d0';
        ctx.fillRect(sx + pr.vx * 0.02 - 1, sy + pr.vy * 0.02 - 1, 3, 3);
      }
    }

    // orbe
    for (const o of r.orbs) {
      const sx = o.x - camX, sy = o.y - camY;
      const pulse = 3 + Math.sin(G.time * 6 + o.x) * 1;
      ctx.fillStyle = o.kind === 'xp' ? 'rgba(90,200,255,0.35)' : 'rgba(255,215,70,0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, pulse + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = o.kind === 'xp' ? '#5ac8ff' : '#ffd84a';
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 1, sy - pulse + 1, 2, 2);
    }

    // particelle
    for (const pt of r.parts) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - camX, pt.y - camY, pt.size, pt.size);
    }

    // testi fluttuanti
    ctx.font = FONT_M;
    ctx.textAlign = 'center';
    for (const txt of r.texts) {
      ctx.globalAlpha = Math.min(1, txt.t);
      ctx.fillStyle = '#000';
      ctx.fillText(txt.str, txt.x - camX + 1, txt.y - camY + 1);
      ctx.fillStyle = txt.color;
      ctx.fillText(txt.str, txt.x - camX, txt.y - camY);
    }
    ctx.globalAlpha = 1;

    // atmosfera della regione
    drawAmbience(ctx, G, W, H, camX, camY);

    // oscurità (regione + notte)
    const dark = Math.min(0.55, r.def.dark + nightAlpha(G) * (r.def.dark > 0.25 ? 0.3 : 1));
    if (dark > 0.01) {
      ctx.fillStyle = 'rgba(10,12,40,' + dark.toFixed(2) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawPlayer(ctx, G, sx, sy) {
    const p = G.player;

    dropShadow(ctx, sx, sy + 2, 11);

    // aura morale
    if (Math.abs(p.moral) >= 40) {
      const good = p.moral > 0;
      ctx.fillStyle = good ? 'rgba(255,230,120,0.20)' : 'rgba(220,40,40,0.20)';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 18, 22, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      if (good) {
        ctx.strokeStyle = 'rgba(255,230,120,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 52, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const spr = p.moral <= -40 ? Sprites.heroEvil : Sprites.hero;
    const bob = Math.sin(p.anim) * 1.5;
    if (p.hurtCd > 0 && Math.sin(G.time * 30) > 0) ctx.globalAlpha = 0.5;
    drawSprite(ctx, Sprites.frameOf(spr, p), sx, sy + 4 + bob, p.face === 'left', 2);
    ctx.globalAlpha = 1;

    // fendente
    if (p.swing > 0) {
      const angles = { right: 0, left: Math.PI, down: Math.PI / 2, up: -Math.PI / 2 };
      const a = angles[p.face];
      ctx.strokeStyle = p.meleeTier >= 3 ? '#e04aff' : '#f0ead8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy - 16, 27, a - 0.8 + (0.16 - p.swing) * 10, a + 0.2 + (0.16 - p.swing) * 10);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(sx, sy - 16, 27, a - 0.6 + (0.16 - p.swing) * 10, a + 0.1 + (0.16 - p.swing) * 10);
      ctx.stroke();
    }
  }

  /* ------------------------------------------------ HUD */

  function bar(ctx, x, y, w, h, frac, color, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
    if (label) {
      ctx.font = FONT_S;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + 4, y + h - 3);
    }
  }

  function drawHud(ctx, G, Game, W, H) {
    const p = G.player;
    bar(ctx, 14, 14, 180, 14, p.hp / Game.maxHp(), '#c93a3a', 'PV ' + Math.ceil(p.hp) + '/' + Game.maxHp());
    bar(ctx, 14, 34, 140, 12, p.mp / Game.maxMp(), '#3a6ac9', 'Volontà ' + Math.floor(p.mp));

    ctx.font = FONT_M;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd84a';
    ctx.fillText('Oro: ' + p.gold, 14, 66);
    ctx.fillStyle = '#5ac8ff';
    ctx.fillText('Esp: ' + p.xp, 120, 66);
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText('[1] Poz.Vita x' + p.potions.hp, 14, 84);
    ctx.fillStyle = '#8a8aff';
    ctx.fillText('[2] Poz.Volontà x' + p.potions.mp, 130, 84);

    // bilancia morale
    const mx = 14, my = 92, mw = 180;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mx - 2, my, mw + 4, 10);
    const grad = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    grad.addColorStop(0, '#a02020');
    grad.addColorStop(0.5, '#777');
    grad.addColorStop(1, '#e8c84a');
    ctx.fillStyle = grad;
    ctx.fillRect(mx, my + 2, mw, 6);
    const mpos = mx + mw / 2 + (p.moral / 100) * (mw / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(mpos - 2, my, 4, 10);

    // missione attiva
    const aq = Game.activeQuestText();
    if (aq) {
      ctx.textAlign = 'right';
      ctx.font = FONT_M;
      ctx.fillStyle = '#ffe9a0';
      ctx.fillText(aq.title, W - 14, 24);
      ctx.font = FONT_S;
      ctx.fillStyle = '#fff';
      ctx.fillText(aq.obj, W - 14, 40);
    }

    // boss
    for (const e of G.region.enemies) {
      if (e.et.boss) {
        bar(ctx, W / 2 - 200, H - 30, 400, 12, e.hp / e.et.hp, '#a02040', 'Jack of Blades');
      }
    }

    // avviso
    if (G.msgT > 0 && G.msg) {
      ctx.font = FONT_M;
      ctx.textAlign = 'center';
      const tw = ctx.measureText(G.msg).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(W / 2 - tw / 2 - 12, 100, tw + 24, 24);
      ctx.fillStyle = '#ffe9a0';
      ctx.fillText(G.msg, W / 2, 116);
    }

    // comandi
    ctx.font = FONT_S;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('WASD/frecce: muovi  J: spada  K: distanza  L: fuoco  H: cura  E: interagisci  C: personaggio  Q: missioni  Esc: menu', W / 2, H - 8);

    if (p.dead) {
      ctx.fillStyle = 'rgba(80,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = FONT_XL;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6a6a';
      ctx.fillText('SEI CADUTO...', W / 2, H / 2);
    }
  }

  /* ------------------------------------------------ pannelli */

  function panel(ctx, x, y, w, h, title) {
    ctx.fillStyle = 'rgba(16,14,24,0.93)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#caa86a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    if (title) {
      ctx.font = FONT_L;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9a0';
      ctx.fillText(title, x + w / 2, y + 32);
    }
  }

  function wrapText(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawDialog(ctx, G, W, H) {
    const d = G.dialog;
    if (!d) return;
    const bh = 130;
    panel(ctx, 40, H - bh - 20, W - 80, bh, null);
    ctx.font = FONT_M;
    ctx.textAlign = 'left';
    if (d.name) {
      ctx.fillStyle = '#ffd84a';
      ctx.fillText(d.name, 60, H - bh + 2);
    }
    ctx.fillStyle = '#fff';
    const lines = wrapText(ctx, d.lines[d.idx], W - 140);
    let yy = H - bh + 24;
    for (const l of lines) { ctx.fillText(l, 60, yy); yy += 18; }

    const last = d.idx === d.lines.length - 1;
    if (last && d.choices) {
      let cy = H - bh + 24 + lines.length * 18 + 6;
      ctx.font = FONT_M;
      for (let i = 0; i < d.choices.length; i++) {
        ctx.fillStyle = i === d.choiceIdx ? '#ffe9a0' : '#999';
        ctx.fillText((i === d.choiceIdx ? '> ' : '  ') + d.choices[i].label, 80, cy);
        cy += 20;
      }
    } else {
      ctx.font = FONT_S;
      ctx.fillStyle = '#caa86a';
      ctx.textAlign = 'right';
      ctx.fillText('[E] continua', W - 60, H - 36);
    }
  }

  function drawShop(ctx, G, Game, W, H) {
    const shop = DATA.SHOPS[G.shop.id];
    const mod = Game.priceMod();
    panel(ctx, W / 2 - 260, 80, 520, 320, shop.name);
    ctx.font = FONT_M;
    ctx.textAlign = 'left';
    let yy = 130;
    for (let i = 0; i < shop.items.length; i++) {
      const it = DATA.ITEMS[shop.items[i]];
      const price = Math.round(it.price * mod);
      const sel = i === G.shop.idx;
      ctx.fillStyle = sel ? '#ffe9a0' : '#bbb';
      ctx.fillText((sel ? '> ' : '  ') + it.name, W / 2 - 230, yy);
      ctx.textAlign = 'right';
      ctx.fillStyle = G.player.gold >= price ? '#ffd84a' : '#885533';
      ctx.fillText(price + ' oro', W / 2 + 230, yy);
      ctx.textAlign = 'left';
      if (sel) {
        ctx.font = FONT_S;
        ctx.fillStyle = '#999';
        ctx.fillText(it.desc, W / 2 - 210, yy + 16);
        ctx.font = FONT_M;
      }
      yy += 44;
    }
    ctx.font = FONT_S;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd84a';
    ctx.fillText('Il tuo oro: ' + G.player.gold + (mod !== 1 ? (mod < 1 ? '  (sconto da brava persona!)' : '  (sovrapprezzo: i mercanti ti temono)') : ''), W / 2, 360);
    ctx.fillStyle = '#caa86a';
    ctx.fillText('Su/Giù: scegli   Invio: compra   Esc: chiudi', W / 2, 382);
  }

  function drawChar(ctx, G, Game, W, H) {
    const p = G.player;
    panel(ctx, W / 2 - 280, 60, 560, 400, 'Il tuo Eroe');
    ctx.font = FONT_M;
    ctx.textAlign = 'left';
    const lx = W / 2 - 240;
    ctx.fillStyle = '#fff';
    ctx.fillText('Titolo: ' + DATA.renownTitle(p.renown) + '   (fama ' + p.renown + ')', lx, 110);
    ctx.fillText('Moralità: ' + p.moral + '  ' + (p.moral >= 40 ? '(santo)' : p.moral <= -40 ? '(malvagio)' : '(neutrale)'), lx, 132);
    ctx.fillText('Nemici uccisi: ' + G.kills, lx, 154);
    ctx.fillStyle = '#5ac8ff';
    ctx.fillText('Esperienza disponibile: ' + p.xp, lx, 184);

    // ritratto dell'eroe
    const spr = p.moral <= -40 ? Sprites.heroEvil : Sprites.hero;
    drawSprite(ctx, spr.a, W / 2 + 190, 200, false, 4);

    const stats = [
      ['str', 'Forza', 'Danno in mischia e PV massimi'],
      ['skill', 'Abilità', 'Danno a distanza e velocità'],
      ['will', 'Volontà', 'Danno magico e Volontà massima']
    ];
    let yy = 224;
    for (let i = 0; i < 3; i++) {
      const [key, name, desc] = stats[i];
      const lvl = p[key];
      const sel = i === G.menuIdx;
      ctx.font = FONT_M;
      ctx.fillStyle = sel ? '#ffe9a0' : '#bbb';
      const cost = lvl >= 5 ? 'MAX' : Game.upgradeCost(lvl) + ' esp';
      ctx.fillText((sel ? '> ' : '  ') + name + '  liv.' + lvl + '/5   [' + cost + ']', lx, yy);
      ctx.font = FONT_S;
      ctx.fillStyle = '#888';
      ctx.fillText(desc, lx + 20, yy + 16);
      yy += 48;
    }
    ctx.font = FONT_S;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#caa86a';
    ctx.fillText('Su/Giù: scegli   Invio: potenzia   Esc/C: chiudi', W / 2, 430);
  }

  function drawQuests(ctx, G, W, H) {
    panel(ctx, W / 2 - 300, 50, 600, 430, 'Registro delle Missioni');
    ctx.textAlign = 'left';
    let yy = 100;
    const states = ['', '◆ IN CORSO', '✓ COMPLETATA', '✗ FALLITA'];
    const colors = ['', '#ffe9a0', '#6aff8a', '#ff6a6a'];
    let any = false;
    for (const id in DATA.QUESTS) {
      const q = G.quests[id], def = DATA.QUESTS[id];
      if (q.state === 0) continue;
      any = true;
      ctx.font = FONT_M;
      ctx.fillStyle = colors[q.state];
      ctx.fillText(states[q.state] + '  ' + def.title + (def.side ? '  (secondaria)' : ''), W / 2 - 270, yy);
      ctx.font = FONT_S;
      ctx.fillStyle = '#999';
      ctx.fillText(q.state === 1 ? def.objective(q) : def.desc, W / 2 - 250, yy + 16);
      yy += 42;
    }
    if (!any) {
      ctx.font = FONT_M;
      ctx.fillStyle = '#999';
      ctx.fillText('Nessuna missione. Parla con la gente di Roccavecchia.', W / 2 - 270, yy);
    }
    ctx.font = FONT_S;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#caa86a';
    ctx.fillText('Q/Esc: chiudi', W / 2, 460);
  }

  function drawPause(ctx, G, W, H) {
    const opts = ['Riprendi', 'Salva partita', 'Istruzioni', 'Esci al titolo'];
    panel(ctx, W / 2 - 160, 140, 320, 240, 'Pausa');
    ctx.font = FONT_M;
    ctx.textAlign = 'center';
    let yy = 200;
    for (let i = 0; i < opts.length; i++) {
      ctx.fillStyle = i === G.menuIdx ? '#ffe9a0' : '#999';
      ctx.fillText((i === G.menuIdx ? '> ' : '') + opts[i], W / 2, yy);
      yy += 36;
    }
  }

  function drawHelp(ctx, W, H) {
    panel(ctx, W / 2 - 290, 50, 580, 430, 'Istruzioni');
    const rows = [
      'WASD / frecce ........ muoviti per Albion',
      'J .................... attacco con la spada',
      'K .................... attacco a distanza (arco/pistola)',
      'L .................... palla di fuoco (consuma Volontà)',
      'H .................... incantesimo di cura',
      'E .................... parla, raccogli, scava, compra case',
      '1 / 2 ................ pozione di vita / di Volontà',
      'C .................... scheda personaggio e potenziamenti',
      'Q .................... registro delle missioni',
      '',
      'Raccogli le orbe blu (esperienza) e gialle (oro).',
      'Le tue azioni cambiano la moralità: i buoni hanno sconti',
      'e aureole, i malvagi prezzi alti e cittadini in fuga.',
      'Il tuo cane Strappo combatte al tuo fianco e fiuta i tesori.',
      'Compra case a Borgopietra per riscuotere gli affitti.'
    ];
    ctx.font = FONT_M;
    ctx.textAlign = 'left';
    let yy = 100;
    for (const r of rows) {
      ctx.fillStyle = '#ccc';
      ctx.fillText(r, W / 2 - 260, yy);
      yy += 23;
    }
    ctx.font = FONT_S;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#caa86a';
    ctx.fillText('Esc: indietro', W / 2, 462);
  }

  function drawTitle(ctx, G, Game, W, H) {
    // cielo al tramonto
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a1430');
    sky.addColorStop(0.55, '#3a2440');
    sky.addColorStop(0.8, '#7a4434');
    sky.addColorStop(1, '#b56247');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // sole basso
    ctx.fillStyle = 'rgba(255,200,110,0.8)';
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.62, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,110,0.25)';
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.62, 60, 0, Math.PI * 2);
    ctx.fill();
    // colline
    ctx.fillStyle = '#26361e';
    ctx.beginPath();
    ctx.ellipse(W * 0.3, H * 1.02, 460, 200, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#1a2814';
    ctx.beginPath();
    ctx.ellipse(W * 0.78, H * 1.08, 480, 240, 0, Math.PI, 0);
    ctx.fill();

    ctx.font = FONT_XL;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('ALBION', W / 2 + 2, 152);
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText('ALBION', W / 2, 150);
    ctx.font = FONT_L;
    ctx.fillStyle = '#caa86a';
    ctx.fillText('Cronache di un Eroe', W / 2, 185);
    ctx.font = FONT_S;
    ctx.fillStyle = '#a89078';
    ctx.fillText('Un omaggio in pixel a Fable, Fable II e Fable III', W / 2, 210);

    const opts = ['Nuova partita'];
    if (Game.hasSave()) opts.push('Continua');
    ctx.font = FONT_M;
    let yy = 300;
    for (let i = 0; i < opts.length; i++) {
      ctx.fillStyle = i === G.menuIdx ? '#ffe9a0' : '#998878';
      ctx.fillText((i === G.menuIdx ? '> ' : '') + opts[i], W / 2, yy);
      yy += 32;
    }
    ctx.fillStyle = '#776655';
    ctx.font = FONT_S;
    ctx.fillText('Su/Giù: scegli   Invio: conferma', W / 2, yy + 20);

    // eroe e cane in controluce sulla collina
    drawSprite(ctx, Sprites.hero.a, W / 2 - 20, H - 92, false, 4);
    drawSprite(ctx, Sprites.dog.a, W / 2 + 56, H - 96, true, 3);
  }

  function drawIntro(ctx, G, W, H) {
    ctx.fillStyle = '#0c0a14';
    ctx.fillRect(0, 0, W, H);
    ctx.font = FONT_M;
    ctx.textAlign = 'center';
    let yy = 90;
    for (const line of DATA.INTRO) {
      ctx.fillStyle = line === line.toUpperCase() && line.length > 0 ? '#ffe9a0' : '#ccc';
      const wrapped = line ? wrapText(ctx, line, W - 200) : [''];
      for (const l of wrapped) { ctx.fillText(l, W / 2, yy); yy += 24; }
    }
    ctx.fillStyle = '#caa86a';
    ctx.font = FONT_S;
    ctx.fillText('[Invio] inizia', W / 2, H - 40);
  }

  function drawEnding(ctx, G, W, H) {
    const good = G.ending === 'good';
    ctx.fillStyle = good ? '#1a2030' : '#200a0e';
    ctx.fillRect(0, 0, W, H);
    ctx.font = FONT_XL;
    ctx.textAlign = 'center';
    ctx.fillStyle = good ? '#ffe9a0' : '#e04a4a';
    ctx.fillText(good ? 'LA LUCE DI ALBION' : 'IL NUOVO SIGNORE DI ALBION', W / 2, 120);

    const lines = good ? [
      'Hai scagliato la Spada di Aeons nel vuoto da cui era venuta.',
      'Jack of Blades non è più che cenere, e Albion respira.',
      'Nelle taverne cantano già il tuo nome; Strappo, al tuo fianco,',
      'scodinzola come se avesse capito tutto. Probabilmente è così.',
      '',
      'Sei diventato ciò che tuo padre sperava: un Eroe.'
    ] : [
      'Le tue dita si chiudono sull\'elsa della Spada di Aeons.',
      'Il potere di mille anime scorre nel tuo braccio. Albion',
      'avrà ancora un padrone mascherato... ma il volto, stavolta, è il tuo.',
      'Strappo guaisce piano, poi ti segue. È l\'unico che non ti teme.',
      '',
      'Sei diventato ciò che Jack aveva sempre visto in te.'
    ];
    ctx.font = FONT_M;
    let yy = 180;
    for (const l of lines) { ctx.fillStyle = '#ccc'; ctx.fillText(l, W / 2, yy); yy += 26; }

    const p = G.player;
    ctx.fillStyle = '#999';
    ctx.font = FONT_S;
    yy += 20;
    ctx.fillText('Fama: ' + p.renown + ' (' + DATA.renownTitle(p.renown) + ')   Moralità: ' + p.moral + '   Oro: ' + p.gold + '   Nemici sconfitti: ' + G.kills, W / 2, yy);
    ctx.fillStyle = '#caa86a';
    ctx.fillText('[Invio] continua a esplorare Albion       [Esc] torna al titolo', W / 2, yy + 40);
  }

  /* ------------------------------------------------ draw principale */

  UI.draw = function (ctx, G, Game, W, H) {
    ctx.imageSmoothingEnabled = false;
    if (!G || G.mode === 'title') { if (G) drawTitle(ctx, G, Game, W, H); return; }
    if (G.mode === 'intro') { drawIntro(ctx, G, W, H); return; }
    if (G.mode === 'ending') { drawEnding(ctx, G, W, H); return; }

    drawWorld(ctx, G, Game, W, H);
    drawHud(ctx, G, Game, W, H);

    if (G.mode === 'dialog') drawDialog(ctx, G, W, H);
    else if (G.mode === 'shop') drawShop(ctx, G, Game, W, H);
    else if (G.mode === 'char') drawChar(ctx, G, Game, W, H);
    else if (G.mode === 'quests') drawQuests(ctx, G, W, H);
    else if (G.mode === 'pause') drawPause(ctx, G, W, H);
    else if (G.mode === 'help') drawHelp(ctx, W, H);
  };

  window.UI = UI;
})();

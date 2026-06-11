/* assets.js — caricamento di asset grafici esterni (PNG) con fallback procedurale.
   Se un'immagine manca o non è ancora caricata, il gioco usa la grafica
   generata da codice: nessun asset è obbligatorio. */
(function () {
  const A = {
    images: {},
    manifest: {
      bg_title: 'assets/bg_title.png',           // 960x540 — schermata del titolo
      bg_intro: 'assets/bg_intro.png',           // 960x540 — prologo
      bg_ending_good: 'assets/bg_ending_good.png', // 960x540 — finale buono
      bg_ending_evil: 'assets/bg_ending_evil.png', // 960x540 — finale malvagio
      hero_sheet: 'assets/hero_sheet.png',       // sprite sheet 128x192, frame 32x48
      ui_frame: 'assets/ui_frame.png'            // cornice ornata 96x96, bordo 24px (9-slice)
    }
  };

  A.load = function () {
    if (typeof Image === 'undefined') return; // ambiente headless: solo fallback
    for (const k in A.manifest) {
      const img = new Image();
      img.onerror = function () { img.failed = true; };
      img.src = A.manifest[k];
      A.images[k] = img;
    }
  };

  A.ready = function (k) {
    const img = A.images[k];
    return !!(img && img.complete && !img.failed && img.naturalWidth > 0);
  };

  A.img = function (k) { return A.images[k]; };

  /* Disegna una cornice 9-slice: angoli intatti, bordi e centro stirati */
  A.nineSlice = function (ctx, img, x, y, w, h, sb, db) {
    const iw = img.width, ih = img.height;
    db = db || sb;
    const cw = iw - sb * 2, chh = ih - sb * 2;
    const dw = w - db * 2, dh = h - db * 2;
    // angoli
    ctx.drawImage(img, 0, 0, sb, sb, x, y, db, db);
    ctx.drawImage(img, iw - sb, 0, sb, sb, x + w - db, y, db, db);
    ctx.drawImage(img, 0, ih - sb, sb, sb, x, y + h - db, db, db);
    ctx.drawImage(img, iw - sb, ih - sb, sb, sb, x + w - db, y + h - db, db, db);
    // bordi
    ctx.drawImage(img, sb, 0, cw, sb, x + db, y, dw, db);
    ctx.drawImage(img, sb, ih - sb, cw, sb, x + db, y + h - db, dw, db);
    ctx.drawImage(img, 0, sb, sb, chh, x, y + db, db, dh);
    ctx.drawImage(img, iw - sb, sb, sb, chh, x + w - db, y + db, db, dh);
    // centro
    ctx.drawImage(img, sb, sb, cw, chh, x + db, y + db, dw, dh);
  };

  window.Assets = A;
})();

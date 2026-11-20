/* Coral Dawn — poster renderer.
   Draws the whole GTA-style cover onto a canvas, at any size, from a state
   object and a list of loaded photos. No network, no DOM except canvas. */
(function (global) {
  'use strict';

  var PLUM = '#2b0a2e';
  var CREAM = '#fff6e6';
  var INK = '#241028';

  /* The five built-in sample photos, in fixed index order. The index IS the
     assignment: 0 boulevard (the driver), 1 pier (the fixer),
     2 dawn street (the getaway), 3 dawn boat (the lookout),
     4 dawn tower (the insider). Panels always take photos by index, so the
     street photo can never land in the boat panel and vice versa. */
  var SAMPLES = [
    { file: 'samples/boulevard.jpg', name: 'Boulevard', focus: [0.45, 0.35] },
    { file: 'samples/pier.jpg', name: 'Pier', focus: [0.42, 0.30] },
    { file: 'samples/dawn-street.jpg', name: 'Dawn street', focus: [0.36, 0.66] },
    { file: 'samples/dawn-boat.jpg', name: 'Dawn boat', focus: [0.62, 0.42] },
    { file: 'samples/dawn-tower.jpg', name: 'Dawn tower', focus: [0.63, 0.70] }
  ];

  var ROLES = ['THE DRIVER', 'THE FIXER', 'THE GETAWAY', 'THE LOOKOUT', 'THE INSIDER'];

  var GRADES = {
    'coral-dawn': {
      label: 'Coral Dawn', dot: '#ff6b6b',
      title: ['#ff5e6c', '#ff9d7a', '#ffd9a0', '#fff3c4'],
      filter: 'saturate(1.18) contrast(1.06) brightness(1.04)',
      tint: '#ff8a5c', tintAlpha: 0.10,
      strip: ['#ffb37a', '#ff6b81', '#ff4d6d'],
      frame: '#ff8a7a', accent: '#ff5e6c'
    },
    'sunset': {
      label: 'Sunset', dot: '#ff7a1a',
      title: ['#ff7a1a', '#ff4d6d', '#b04dff', '#7a2bff'],
      filter: 'saturate(1.25) sepia(0.18) contrast(1.08)',
      tint: '#ff6a00', tintAlpha: 0.12,
      strip: ['#ffb347', '#ff5e3a', '#8a2be2'],
      frame: '#ff9d5c', accent: '#ff7a1a'
    },
    'neon-night': {
      label: 'Neon Night', dot: '#c44dff',
      title: ['#00e5ff', '#ff4dd2', '#ff2e88', '#7a2bff'],
      filter: 'saturate(1.35) contrast(1.12) brightness(0.96)',
      tint: '#b44dff', tintAlpha: 0.14,
      strip: ['#00e5ff', '#ff4dd2', '#2b0a4d'],
      frame: '#c44dff', accent: '#ff4dd2'
    },
    'golden-hour': {
      label: 'Golden Hour', dot: '#ffb400',
      title: ['#ffb400', '#ff8a00', '#ffe9a3', '#fff6d8'],
      filter: 'saturate(1.2) sepia(0.25) contrast(1.05)',
      tint: '#ffb400', tintAlpha: 0.12,
      strip: ['#ffd76a', '#ff9d00', '#ff6b35'],
      frame: '#e8a33d', accent: '#ffb400'
    },
    'teal-dusk': {
      label: 'Teal Dusk', dot: '#17b8a6',
      title: ['#17e6c8', '#2bb3ff', '#7a5cff', '#ff7ab8'],
      filter: 'saturate(1.15) contrast(1.07) brightness(0.98)',
      tint: '#17b8a6', tintAlpha: 0.12,
      strip: ['#2be6c8', '#1a7ab8', '#123a5c'],
      frame: '#2bb3a6', accent: '#17b8a6'
    },
    'ultraviolet': {
      label: 'Ultraviolet', dot: '#a64dff',
      title: ['#e64dff', '#a64dff', '#5c2bff', '#ff5ea8'],
      filter: 'saturate(1.3) contrast(1.1) hue-rotate(12deg)',
      tint: '#a64dff', tintAlpha: 0.14,
      strip: ['#e64dff', '#7a2bff', '#1a0a3d'],
      frame: '#a64dff', accent: '#e64dff'
    }
  };

  var LAYOUTS = {
    'hero-top': { label: 'Hero Top' },
    'hero-left': { label: 'Hero Left' },
    'hero-right': { label: 'Hero Right' },
    'hero-centre': { label: 'Hero Centre' },
    'six-grid': { label: 'Six Grid' },
    'tilted': { label: 'Tilted Snaps' }
  };

  var SIZES = {
    square: { w: 1080, h: 1080, label: 'Square · 1080×1080' },
    portrait: { w: 1080, h: 1350, label: 'Portrait · 1080×1350' },
    wide: { w: 1920, h: 1080, label: 'Wide · 1920×1080' }
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* Default state: a finished cover on screen, no placeholder anywhere. */
  function defaultState() {
    return {
      layout: 'hero-top',
      grade: 'coral-dawn',
      size: 'square',
      title: 'CORAL DAWN',
      subtitle: 'chasing the sunrise',
      tagline: 'SUN UP · ENGINES HOT · NO WAY BACK',
      quote: 'A SUNRISE YOU CAN HANG ON YOUR WALL',
      outlet: 'THE PEACH COVE GAZETTE',
      badge: 'VOL. 02',
      billing: 'PEACH COVE PICTURES PRESENTS · A CORAL DAWN PRODUCTION · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND',
      titleStyle: 'striped',
      paint: 65, halftone: 30, grain: 25, glow: 40, ink: true,
      roles: ROLES.slice(),
      show: { roles: true, quote: true, seal: true, stamps: true, billing: true, strip: true },
      /* photo index per slot, rebuilt by autoFill whenever the layout changes */
      slots: [0, 1, 2, 3],
      /* per-slot crop transforms, keyed by slot index */
      pans: {}
    };
  }

  /* Photo index for each slot of a layout, by SAMPLES index. */
  function slotPhotos(layout) {
    switch (layout) {
      case 'hero-top': return [0, 1, 2, 3];
      case 'hero-left': return [0, 1, 2, 3, 4];
      case 'hero-right': return [0, 1, 2, 3, 4];
      case 'hero-centre': return [0, 1, 2, 3, 4];
      case 'six-grid': return [0, 1, 2, 3, 4, 0];
      case 'tilted': return [0, 1, 2, 3, 4];
      default: return [0, 1, 2, 3];
    }
  }

  /* Slot rectangles as fractions of the poster (x, y, w, h), plus slant. */
  function slotRects(layout, W, H) {
    var q = 0.052;            /* quote bar height, fraction of H */
    var f = 0.014;            /* frame inset, fraction of W */
    var top = q + 0.008;
    var bottom = 0.725;       /* photo area bottom, fraction of H */
    var iw = 1 - f * 2;
    var g = 0.012;            /* gap between panels, fraction of W */
    var s = [];
    if (layout === 'hero-top') {
      s.push({ x: f, y: top, w: iw, h: 0.395, slant: 0.018, hero: true });
      var py = 0.505, ph = bottom - py;
      var w1 = 0.315, w2 = 0.35, w3 = iw - w1 - w2 - g * 2;
      s.push({ x: f, y: py, w: w1, h: ph });
      s.push({ x: f + w1 + g, y: py, w: w2, h: ph });
      s.push({ x: f + w1 + g + w2 + g, y: py, w: w3, h: ph });
    } else if (layout === 'hero-left' || layout === 'hero-right') {
      var left = layout === 'hero-left';
      var hw = 0.50;
      var hx = left ? f : 1 - f - hw;
      s.push({ x: hx, y: top, w: hw, h: bottom - top, hero: true });
      var gx = left ? f + hw + g : f;
      var gw = iw - hw - g;
      var cw = (gw - g) / 2, ch = (bottom - top - g) / 2;
      s.push({ x: gx, y: top, w: cw, h: ch });
      s.push({ x: gx + cw + g, y: top, w: cw, h: ch });
      s.push({ x: gx, y: top + ch + g, w: cw, h: ch });
      s.push({ x: gx + cw + g, y: top + ch + g, w: cw, h: ch });
    } else if (layout === 'hero-centre') {
      var chw = 0.42, chx = (1 - chw) / 2;
      s.push({ x: chx, y: top, w: chw, h: bottom - top, hero: true });
      var sw = (chx - f - g);
      var sh = (bottom - top - g) / 2;
      s.push({ x: f, y: top, w: sw, h: sh });
      s.push({ x: f, y: top + sh + g, w: sw, h: sh });
      s.push({ x: 1 - f - sw, y: top, w: sw, h: sh });
      s.push({ x: 1 - f - sw, y: top + sh + g, w: sw, h: sh });
    } else if (layout === 'six-grid') {
      var cols = 3, rows = 2;
      var cw2 = (iw - g * (cols - 1)) / cols;
      var ch2 = (bottom - top - g * (rows - 1)) / rows;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          s.push({ x: f + c * (cw2 + g), y: top + r * (ch2 + g), w: cw2, h: ch2, hero: r === 0 && c === 0 });
        }
      }
    } else { /* tilted snapshots */
      var tw = 0.30, th = 0.46;
      var rots = [-0.06, 0.05, -0.03, 0.06, -0.05];
      var xs = [0.03, 0.20, 0.38, 0.55, 0.70];
      for (var i = 0; i < 5; i++) {
        s.push({ x: xs[i], y: top + 0.02 + (i % 2) * 0.05, w: tw, h: th, rot: rots[i], snap: true, hero: i === 2 });
      }
    }
    return s;
  }

  function titleY(layout) {
    if (layout === 'tilted') return 0.60;
    if (layout === 'hero-top') return 0.385;
    return 0.475;
  }

  /* ---- drawing helpers ---- */

  function fitFont(ctx, text, maxW, startPx, family, weight) {
    var px = startPx;
    while (px > 24) {
      ctx.font = weight + ' ' + px + 'px ' + family;
      if (ctx.measureText(text).width <= maxW) break;
      px -= 4;
    }
    ctx.font = weight + ' ' + px + 'px ' + family;
    return px;
  }

  function drawPhoto(ctx, img, rect, pan, grade, W, H) {
    if (!img || !img.naturalWidth) {
      ctx.fillStyle = '#e8d5c0';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      return;
    }
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var focus = SAMPLES[pan.photo] ? SAMPLES[pan.photo].focus : [0.5, 0.5];
    var fx = clamp(focus[0], 0.08, 0.92), fy = clamp(focus[1], 0.08, 0.92);
    /* Cover zoom that still covers the panel once the focus point is put
       at the panel's centre: an off-centre focus needs extra zoom, or the
       photo slides off one edge and leaves a cream gap. */
    var zx = Math.max(rect.w / iw, rect.w / (2 * fx * iw), rect.w / (2 * (1 - fx) * iw));
    var zy = Math.max(rect.h / ih, rect.h / (2 * fy * ih), rect.h / (2 * (1 - fy) * ih));
    var zoom = (pan.zoom || 1) * Math.max(zx, zy);
    var dw = iw * zoom, dh = ih * zoom;
    /* focus point lands on the panel centre */
    var cx = rect.x + rect.w / 2 + dw / 2 - fx * dw;
    var cy = rect.y + rect.h / 2 + dh / 2 - fy * dh;
    /* keep the user's pan inside the coverage bounds, so a drag can never
       pull a cream gap into the panel */
    var ox = clamp(pan.ox || 0, rect.x + rect.w - dw - (cx - dw / 2), rect.x - (cx - dw / 2));
    var oy = clamp(pan.oy || 0, rect.y + rect.h - dh - (cy - dh / 2), rect.y - (cy - dh / 2));
    cx += ox;
    cy += oy;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (grade.filter) { try { ctx.filter = grade.filter; } catch (e) { /* old canvas */ } }
    if (pan.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(pan.rot * Math.PI / 180);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    if (pan.flip) {
      ctx.translate(rect.x + rect.w / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(rect.x + rect.w / 2), 0);
    }
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    try { ctx.filter = 'none'; } catch (e) { /* ignore */ }
    if (grade.tint) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = grade.tintAlpha * (0.5 + (global.__paint || 65) / 130);
      ctx.fillStyle = grade.tint;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function frameRect(ctx, x, y, w, h, color, lw) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function star4(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath();
  }

  function starburst(ctx, x, y, rOuter, rInner, points) {
    ctx.beginPath();
    for (var i = 0; i < points * 2; i++) {
      var r = i % 2 === 0 ? rOuter : rInner;
      var a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawPalm(ctx, x, y, s, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -s : s, s);
    ctx.strokeStyle = PLUM;
    ctx.fillStyle = PLUM;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(6, -52, 2, -96);
    ctx.stroke();
    var fronds = [[-58, -108], [-34, -122], [-6, -128], [24, -122], [52, -104], [64, -84]];
    for (var i = 0; i < fronds.length; i++) {
      ctx.beginPath();
      ctx.moveTo(2, -96);
      ctx.quadraticCurveTo(fronds[i][0] * 0.55, -96 + fronds[i][1] * 0.22, fronds[i][0], -96 + fronds[i][1] * 0.12);
      ctx.lineWidth = 4.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function halftonePattern() {
    if (global.__htPat) return global.__htPat;
    var c = document.createElement('canvas');
    c.width = 9; c.height = 9;
    var g = c.getContext('2d');
    g.fillStyle = '#1a0a2e';
    g.beginPath(); g.arc(4.5, 4.5, 1.5, 0, Math.PI * 2); g.fill();
    global.__htPat = c;
    return c;
  }

  function grainPattern() {
    if (global.__grPat) return global.__grPat;
    var c = document.createElement('canvas');
    c.width = 140; c.height = 140;
    var g = c.getContext('2d');
    var img = g.createImageData(140, 140);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = 110 + Math.floor(Math.random() * 90);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    global.__grPat = c;
    return c;
  }

  /* ---- the poster ---- */

  function renderCover(canvas, state, images) {
    var W = canvas.width, H = canvas.height;
    var ctx = canvas.getContext('2d');
    var grade = GRADES[state.grade] || GRADES['coral-dawn'];
    var S = Math.min(W, H) / 1080; /* scale unit */
    global.__paint = state.paint;
    var rects = slotRects(state.layout, W, H);
    var photos = slotPhotos(state.layout);

    /* cream field */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    /* top quote bar */
    if (state.show.quote) {
      var qh = H * 0.052;
      ctx.fillStyle = PLUM;
      ctx.fillRect(0, 0, W, qh);
      ctx.fillStyle = '#ffc21c';
      ctx.font = '900 ' + Math.round(qh * 0.42) + 'px Anton, "Arial Black", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('★★★★★', W * 0.014, qh * 0.54);
      ctx.fillStyle = '#fff6e6';
      ctx.font = '700 ' + Math.round(qh * 0.34) + 'px Anton, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      var quoteLine = '“' + state.quote + '” — ' + state.outlet;
      fitFont(ctx, quoteLine, W * 0.72, Math.round(qh * 0.36), 'Anton, "Arial Black", sans-serif', '700');
      ctx.fillText(quoteLine, W * 0.5, qh * 0.54);
      /* ticket badge */
      var bw = W * 0.085, bh = qh * 0.62;
      var bx = W - bw - W * 0.012, by = (qh - bh) / 2;
      ctx.fillStyle = '#ffc21c';
      roundRect(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = PLUM;
      ctx.font = '900 ' + Math.round(bh * 0.52) + 'px Anton, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.badge, bx + bw / 2, by + bh / 2 + 1);
      ctx.textAlign = 'left';
    }

    /* photos */
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      var px = r.x * W, py = r.y * H, pw = r.w * W, ph = r.h * H;
      var pan = Object.assign({ photo: photos[i], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false }, state.pans[i] || {});
      /* six-grid reuses the hero photo in its last slot: zoom in so it reads
         as a clearly different crop, not the same picture twice */
      if (state.layout === 'six-grid' && i === 5) pan.zoom = (pan.zoom || 1) * 1.7;
      ctx.save();
      if (r.snap) {
        ctx.translate(px + pw / 2, py + ph / 2);
        ctx.rotate(r.rot || 0);
        ctx.translate(-(px + pw / 2), -(py + ph / 2));
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(43,10,46,0.35)';
        ctx.shadowBlur = 14 * S;
        ctx.shadowOffsetY = 5 * S;
        ctx.fillRect(px - 7 * S, py - 7 * S, pw + 14 * S, ph + 14 * S);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      if (r.slant) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py);
        ctx.lineTo(px + pw, py + ph - r.slant * H);
        ctx.lineTo(px, py + ph);
        ctx.closePath();
        ctx.clip();
        drawPhoto(ctx, images[pan.photo], { x: px, y: py, w: pw, h: ph }, pan, grade, W, H);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py);
        ctx.lineTo(px + pw, py + ph - r.slant * H);
        ctx.lineTo(px, py + ph);
        ctx.closePath();
        ctx.strokeStyle = grade.frame;
        ctx.lineWidth = Math.max(2, 3 * S);
        ctx.stroke();
        ctx.restore();
      } else {
        drawPhoto(ctx, images[pan.photo], { x: px, y: py, w: pw, h: ph }, pan, grade, W, H);
        frameRect(ctx, px, py, pw, ph, grade.frame, Math.max(2, 3 * S));
        ctx.restore();
      }
      /* sunrise badge on the hero band */
      if (r.hero && state.show.stamps && (state.layout === 'hero-top' || state.layout === 'hero-centre')) {
        var tag = 'SUNRISE 06:47 · PEACH COVE';
        ctx.font = '700 ' + Math.round(15 * S + 4) + 'px Anton, "Arial Black", sans-serif';
        var tw = ctx.measureText(tag).width + 22 * S;
        var tx = px + pw - tw - 10 * S, ty = py + 10 * S;
        ctx.fillStyle = 'rgba(43,10,46,0.85)';
        roundRect(ctx, tx, ty, tw, 26 * S, 13 * S);
        ctx.fill();
        ctx.fillStyle = '#fff6e6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, tx + tw / 2, ty + 13 * S + 1);
        ctx.textAlign = 'left';
      }
      /* role tag */
      if (state.show.roles) {
        var role = state.roles[i] || ROLES[i % ROLES.length];
        ctx.font = '900 ' + Math.round(15 * S + 4) + 'px Anton, "Arial Black", sans-serif';
        var rw = ctx.measureText(role).width + 20 * S;
        var rh = 26 * S;
        var rx = px + 6 * S, ry = py + ph - rh - 8 * S;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + rw, ry);
        ctx.lineTo(rx + rw - 9 * S, ry + rh);
        ctx.lineTo(rx, ry + rh);
        ctx.closePath();
        ctx.fillStyle = PLUM;
        ctx.fill();
        ctx.fillStyle = '#fff6e6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(role, rx + rw / 2 - 4 * S, ry + rh / 2 + 1);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }

    /* sunrise glow over the hero */
    if (state.glow > 0) {
      var hero = rects[0];
      var gx = (hero.x + 0.12) * W, gy = (hero.y + 0.22) * H;
      var gr = Math.max(W, H) * 0.32;
      var glowGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      glowGrad.addColorStop(0, 'rgba(255,236,170,' + (0.55 * state.glow / 100) + ')');
      glowGrad.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = glowGrad;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      ctx.restore();
    }

    /* kicker + giant title over the seam */
    var ty = titleY(state.layout) * H;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(43,10,46,0.55)';
    ctx.shadowBlur = 6 * S;
    ctx.shadowOffsetY = 2 * S;
    var kickPx = fitFont(ctx, '★ WELCOME TO PEACH COVE ★', W * 0.62, Math.round(26 * S + 6), 'Anton, "Arial Black", sans-serif', '700');
    ctx.fillText('★ WELCOME TO PEACH COVE ★', W / 2, ty - Math.round(118 * S + 18));
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    var titlePx = fitFont(ctx, state.title, W * 0.94, Math.round(150 * S + 30), 'Anton, "Arial Black", sans-serif', '900');
    var titleGrad;
    if (state.titleStyle === 'glow') {
      titleGrad = ctx.createLinearGradient(0, ty - titlePx * 0.55, 0, ty + titlePx * 0.55);
      titleGrad.addColorStop(0, grade.title[0]);
      titleGrad.addColorStop(0.55, grade.title[1]);
      titleGrad.addColorStop(1, grade.title[2]);
    } else {
      /* striped dawn: hard horizontal bands through the letters */
      titleGrad = ctx.createLinearGradient(0, ty - titlePx * 0.55, 0, ty + titlePx * 0.55);
      var stops = grade.title;
      var bands = 9;
      for (var bi = 0; bi < bands; bi++) {
        var c = stops[bi % stops.length];
        titleGrad.addColorStop(bi / bands, c);
        titleGrad.addColorStop(Math.min(1, (bi + 0.82) / bands), c);
        var nc = stops[(bi + 1) % stops.length];
        titleGrad.addColorStop(Math.min(1, (bi + 0.84) / bands), nc);
      }
    }
    var shX = Math.round(7 * S + 2), shY = Math.round(8 * S + 2);
    ctx.font = '900 ' + titlePx + 'px Anton, "Arial Black", sans-serif';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PLUM;
    ctx.lineWidth = Math.max(4, titlePx * 0.055);
    /* hard offset shadow */
    ctx.save();
    ctx.translate(shX, shY);
    ctx.fillStyle = PLUM;
    ctx.fillText(state.title, W / 2, ty);
    ctx.restore();
    /* main fill + outline */
    ctx.fillStyle = titleGrad;
    ctx.fillText(state.title, W / 2, ty);
    ctx.strokeText(state.title, W / 2, ty);
    if (state.titleStyle === 'glow') {
      ctx.save();
      ctx.shadowColor = grade.title[0];
      ctx.shadowBlur = 22 * S;
      ctx.fillStyle = titleGrad;
      ctx.fillText(state.title, W / 2, ty);
      ctx.restore();
    }
    /* sparkle glints */
    ctx.fillStyle = '#ffffff';
    var twd = ctx.measureText(state.title).width;
    var glints = [[-0.34, -0.32, 0.10], [0.28, -0.42, 0.08], [0.42, 0.30, 0.07]];
    for (var gi = 0; gi < glints.length; gi++) {
      star4(ctx, W / 2 + glints[gi][0] * twd, ty + glints[gi][1] * titlePx, Math.max(5, titlePx * glints[gi][2]));
      ctx.fill();
    }

    /* script subtitle overlapping the title's bottom edge */
    ctx.font = Math.round(titlePx * 0.34) + 'px "Great Vibes", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 10 * S;
    ctx.fillText(state.subtitle, W / 2, ty + titlePx * 0.32);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    /* tagline pill */
    ctx.font = '700 ' + Math.round(20 * S + 5) + 'px Anton, "Arial Black", sans-serif';
    var tagW = ctx.measureText(state.tagline).width + 44 * S;
    var tagH = Math.round(34 * S + 8);
    var tagX = (W - tagW) / 2;
    var tagY = ty + titlePx * 0.62 + 8;
    ctx.fillStyle = PLUM;
    roundRect(ctx, tagX, tagY, tagW, tagH, tagH / 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e6';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline, W / 2, tagY + tagH / 2 + 1);

    /* gold seal */
    if (state.show.seal) {
      var sx = W * 0.885, sy = H * 0.775, sr = Math.max(34, W * 0.052);
      ctx.save();
      ctx.translate(sx, sy);
      starburst(ctx, 0, 0, sr, sr * 0.82, 12);
      ctx.fillStyle = '#ffc21c';
      ctx.fill();
      ctx.strokeStyle = '#a86e00';
      ctx.lineWidth = Math.max(2, 2 * S);
      ctx.stroke();
      ctx.fillStyle = PLUM;
      ctx.font = '900 ' + Math.round(sr * 0.24) + 'px Anton, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ORIGINAL', 0, -sr * 0.16);
      ctx.fillText('COVER ART', 0, sr * 0.14);
      ctx.font = '900 ' + Math.round(sr * 0.20) + 'px Anton, "Arial Black", sans-serif';
      ctx.fillText('★ 2026 ★', 0, sr * 0.44);
      ctx.restore();
      ctx.textAlign = 'left';
    }

    /* billing block */
    if (state.show.billing) {
      ctx.fillStyle = '#5c4a55';
      ctx.font = '700 ' + Math.round(11 * S + 4) + 'px Anton, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, state.billing, W * 0.94, Math.round(11 * S + 4), 'Anton, "Arial Black", sans-serif', '700');
      ctx.fillText(state.billing, W / 2, H * 0.845);
      ctx.textAlign = 'left';
    }

    /* palm strip along the bottom */
    if (state.show.strip) {
      var stripY = H * 0.885;
      var stripGrad = ctx.createLinearGradient(0, stripY, 0, H);
      stripGrad.addColorStop(0, grade.strip[0]);
      stripGrad.addColorStop(0.55, grade.strip[1]);
      stripGrad.addColorStop(1, grade.strip[2]);
      ctx.fillStyle = stripGrad;
      ctx.fillRect(0, stripY, W, H - stripY);
      /* rising sun, centre-bottom */
      var sunX = W * 0.66, sunBase = H * 0.985;
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = Math.max(2, 2.5 * S);
      for (var ri = 0; ri < 9; ri++) {
        var ra = Math.PI + (ri / 8) * Math.PI;
        var rIn = W * 0.042, rOut = W * 0.062;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(ra) * rIn, sunBase - Math.abs(Math.sin(ra)) * H * 0.038);
        ctx.lineTo(sunX + Math.cos(ra) * rOut, sunBase - Math.abs(Math.sin(ra)) * H * 0.055);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffe9a3';
      ctx.beginPath();
      ctx.arc(sunX, sunBase, W * 0.038, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PLUM;
      ctx.stroke();
      /* palms */
      drawPalm(ctx, W * 0.03, H * 0.995, Math.max(0.7, S * 0.9), false);
      drawPalm(ctx, W * 0.10, H * 0.995, Math.max(0.55, S * 0.65), true);
      drawPalm(ctx, W * 0.88, H * 0.995, Math.max(0.7, S * 0.9), true);
      /* COMING SOON pill */
      var cs = '★ COMING SOON';
      ctx.font = '900 ' + Math.round(17 * S + 5) + 'px Anton, "Arial Black", sans-serif';
      var csw = ctx.measureText(cs).width + 36 * S;
      var csh = Math.round(30 * S + 8);
      ctx.fillStyle = PLUM;
      roundRect(ctx, (W - csw) / 2, stripY + (H - stripY - csh) / 2, csw, csh, csh / 2);
      ctx.fill();
      ctx.fillStyle = '#fff6e6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cs, W / 2, stripY + (H - stripY) / 2 + 1);
      ctx.textAlign = 'left';
      /* barcode, bottom-right */
      var bcx = W * 0.955, bcy = H * 0.935, bcw = W * 0.042, bch = H * 0.05;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bcx - 4 * S, bcy - 4 * S, bcw + 8 * S, bch + 8 * S);
      ctx.fillStyle = INK;
      var bars = [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 2];
      var bx2 = bcx;
      for (var bi2 = 0; bi2 < bars.length; bi2++) {
        var bw2 = bars[bi2] * 1.6 * S;
        if (bi2 % 2 === 0) ctx.fillRect(bx2, bcy, bw2, bch);
        bx2 += bw2 + 1.4 * S;
      }
    }

    /* poster-ink halftone + grain over everything */
    if (state.ink && state.halftone > 0) {
      ctx.save();
      ctx.globalAlpha = (state.halftone / 100) * 0.16;
      ctx.fillStyle = ctx.createPattern(halftonePattern(), 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (state.grain > 0) {
      ctx.save();
      ctx.globalAlpha = (state.grain / 100) * 0.14;
      ctx.fillStyle = ctx.createPattern(grainPattern(), 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    /* outer frame */
    frameRect(ctx, W * 0.006, H * 0.006, W * 0.988, H * 0.988, grade.frame, Math.max(2, 3 * S));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    return { slots: rects, photos: photos };
  }

  /* Export a cover at full resolution; returns a Promise<Blob>. */
  function exportCover(state, images, sizeKey) {
    var size = SIZES[sizeKey] || SIZES.square;
    var c = document.createElement('canvas');
    c.width = size.w;
    c.height = size.h;
    renderCover(c, Object.assign({}, state, { size: sizeKey }), images);
    return new Promise(function (resolve) {
      c.toBlob(function (b) { resolve(b); }, 'image/png');
    });
  }

  global.CoralDawn = {
    SAMPLES: SAMPLES, ROLES: ROLES, GRADES: GRADES, LAYOUTS: LAYOUTS, SIZES: SIZES,
    defaultState: defaultState, slotPhotos: slotPhotos, slotRects: slotRects,
    renderCover: renderCover, exportCover: exportCover, titleY: titleY
  };
})(typeof window !== 'undefined' ? window : globalThis);

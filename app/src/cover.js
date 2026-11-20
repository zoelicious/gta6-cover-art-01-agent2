// Coral Dawn — cover renderer.
// Draws the whole GTA-style poster on any 2d canvas, at any size, from one
// state object. The editor preview and the PNG export call the same function,
// so what you see is exactly what you download.

export const GRADES = {
  'coral-dawn': {
    label: 'Coral Dawn', sky: '#241a4d', horizon: '#ff7a5c', tint: '#ff8a6b',
    tintAlpha: 0.16, filter: 'saturate(1.18) contrast(1.06) brightness(1.02)',
    accent: '#ff6f61', accent2: '#35f0ff',
  },
  sunset: {
    label: 'Sunset', sky: '#3a1c5e', horizon: '#ff9a3d', tint: '#ff9a3d',
    tintAlpha: 0.18, filter: 'saturate(1.25) contrast(1.05)',
    accent: '#ff9a3d', accent2: '#ff5ea8',
  },
  'neon-night': {
    label: 'Neon Night', sky: '#12082e', horizon: '#7b2ff7', tint: '#b04dff',
    tintAlpha: 0.20, filter: 'saturate(1.35) contrast(1.12) brightness(0.98)',
    accent: '#ff2fb3', accent2: '#2fe8ff',
  },
  'golden-hour': {
    label: 'Golden Hour', sky: '#4d2a10', horizon: '#ffc53d', tint: '#ffc53d',
    tintAlpha: 0.18, filter: 'saturate(1.28) contrast(1.04) brightness(1.03)',
    accent: '#ffc53d', accent2: '#ff7a3d',
  },
  'teal-dusk': {
    label: 'Teal Dusk', sky: '#0d2f3a', horizon: '#2fd8c8', tint: '#2fd8c8',
    tintAlpha: 0.14, filter: 'saturate(1.15) contrast(1.06)',
    accent: '#2fd8c8', accent2: '#ffb37a',
  },
  ultraviolet: {
    label: 'Ultraviolet', sky: '#1c0b3d', horizon: '#c04dff', tint: '#a64dff',
    tintAlpha: 0.20, filter: 'saturate(1.4) contrast(1.1)',
    accent: '#c04dff', accent2: '#ff5ea8',
  },
};

export const LAYOUTS = {
  'hero-left': { label: 'Hero left', panels: 4 },
  'hero-right': { label: 'Hero right', panels: 4 },
  'hero-top': { label: 'Hero top', panels: 4 },
  'hero-centre': { label: 'Hero centre', panels: 4 },
  'six-grid': { label: 'Six grid', panels: 6 },
  tilted: { label: 'Tilted snapshots', panels: 4 },
};

export const DEFAULT_ROLES = ['THE DRIVER', 'THE GETAWAY', 'THE CAPTAIN', 'THE LOOKOUT', 'THE RIDER', 'THE FIXER'];

export function defaultState() {
  return {
    layout: 'hero-left',
    grade: 'coral-dawn',
    title: 'CORAL DAWN',
    subtitle: 'first light, last getaway',
    tagline: 'SUN UP · ENGINES HOT · NO WAY BACK',
    quote: 'A SUNRISE YOU CAN HANG ON YOUR WALL',
    outlet: 'THE CORAL LEDGER',
    ticket: 'DAWN EDITION',
    billing: 'PEACH COVE PICTURES PRESENTS · A CORAL DAWN PRODUCTION · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND',
    titleStyle: 'striped',
    showRoles: true, showSeal: true, showQuote: true, showStamps: true,
    showBilling: true, showFooter: true,
    paint: 0.8, halftone: 0.5, grain: 0.35, glow: 0.8,
    panels: [
      { photo: 0, role: 'THE DRIVER', zoom: 1, x: 0.5, y: 0.60, rot: 0, flip: false },
      { photo: 1, role: 'THE GETAWAY', zoom: 1, x: 0.5, y: 0.5, rot: 0, flip: false },
      { photo: 2, role: 'THE CAPTAIN', zoom: 1, x: 0.5, y: 0.34, rot: 0, flip: false },
      { photo: 3, role: 'THE LOOKOUT', zoom: 1, x: 0.5, y: 0.52, rot: 0, flip: false },
      { photo: 4, role: 'THE RIDER', zoom: 1, x: 0.5, y: 0.45, rot: 0, flip: false },
      { photo: 0, role: 'THE FIXER', zoom: 1.35, x: 0.5, y: 0.3, rot: 0, flip: false },
    ],
  };
}

// Panel rectangles as fractions of the poster area (x, y, w, h, rotation deg).
export function layoutPanels(layout, count) {
  const g = 0.012; // gap, in fractions of poster width
  const hero = (x, y, w, h) => ({ x, y, w, h, rot: 0 });
  switch (layout) {
    case 'hero-right': {
      const r = [hero(0.42, 0, 0.58, 1)];
      const cw = 0.40 - g;
      for (let i = 0; i < 3; i++) r.push(hero(0, i * (1 / 3) + (i ? g / 2 : 0), cw, 1 / 3 - g / 2));
      return r.slice(0, count);
    }
    case 'hero-top': {
      const r = [hero(0, 0, 1, 0.56)];
      const pw = (1 - 2 * g) / 3;
      for (let i = 0; i < 3; i++) r.push(hero(i * (pw + g), 0.58, pw, 0.42));
      return r.slice(0, count);
    }
    case 'hero-centre': {
      const side = 0.30 - g;
      const r = [hero(0, 0, side, 0.49), hero(0, 0.51, side, 0.49), hero(0.31, 0, 0.38, 1),
        hero(0.70, 0, side, 0.49), hero(0.70, 0.51, side, 0.49)];
      return r.slice(0, count);
    }
    case 'six-grid': {
      const cw = (1 - 2 * g) / 3, ch = (1 - g) / 2;
      const r = [];
      for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++)
        r.push(hero(col * (cw + g), row * (ch + g), cw, ch));
      return r.slice(0, count);
    }
    case 'tilted': {
      return [
        { x: 0.02, y: 0.03, w: 0.46, h: 0.52, rot: -3 },
        { x: 0.52, y: 0.05, w: 0.46, h: 0.44, rot: 2.5 },
        { x: 0.06, y: 0.58, w: 0.44, h: 0.40, rot: 2 },
        { x: 0.54, y: 0.52, w: 0.42, h: 0.45, rot: -2 },
      ].slice(0, count);
    }
    case 'hero-left':
    default: {
      const r = [hero(0, 0, 0.58, 1)];
      const cw = 0.40 - g;
      for (let i = 0; i < 3; i++) r.push(hero(0.60, i * (1 / 3) + (i ? g / 2 : 0), cw, 1 / 3 - g / 2));
      return r.slice(0, count);
    }
  }
}

// Where the title block sits, per layout (fractions of poster height).
function titleZone(layout) {
  if (layout === 'hero-top') return { y: 0.48, size: 0.175 };
  if (layout === 'six-grid') return { y: 0.44, size: 0.17 };
  if (layout === 'tilted') return { y: 0.46, size: 0.175 };
  if (layout === 'hero-centre') return { y: 0.60, size: 0.175 };
  return { y: 0.60, size: 0.185 }; // hero-left / hero-right
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

function drawSparkle(ctx, cx, cy, r, color, glow) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r); ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r); ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill(); ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  // Simple palm silhouette: curved trunk, fronds arcing down from the crown.
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.10); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.55, x + s * 0.20, y - s * 0.92); ctx.stroke();
  const cx = x + s * 0.20, cy = y - s * 0.92;
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.08 + i * 0.21); // fan from right-down to left-down
    const ex = cx + Math.cos(a) * s * 0.52;
    const ey = cy + Math.sin(a) * s * 0.34;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * s * 0.34, cy - s * 0.16, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSunriseStrip(ctx, x, y, w, h, grade) {
  // Sun disc + palm silhouettes along a thin strip.
  const sunR = h * 0.42;
  const sun = ctx.createRadialGradient(x + w * 0.5, y + h * 0.55, sunR * 0.1, x + w * 0.5, y + h * 0.55, sunR);
  sun.addColorStop(0, '#fff3c4'); sun.addColorStop(0.55, grade.horizon); sun.addColorStop(1, grade.horizon + '00');
  ctx.fillStyle = sun;
  ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.55, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1245';
  drawPalm(ctx, x + w * 0.07, y + h, h * 1.35, '#2a1245');
  drawPalm(ctx, x + w * 0.93, y + h, h * 1.15, '#2a1245');
  drawPalm(ctx, x + w * 0.20, y + h, h * 0.85, '#2a1245');
  // horizon glow line
  const lg = ctx.createLinearGradient(x, y + h * 0.62, x + w, y + h * 0.62);
  lg.addColorStop(0, grade.horizon + '00'); lg.addColorStop(0.5, grade.horizon); lg.addColorStop(1, grade.horizon + '00');
  ctx.fillStyle = lg; ctx.fillRect(x, y + h * 0.6, w, h * 0.05);
}

function drawBarcode(ctx, x, y, w, h, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.fillStyle = '#1c1030';
  let px = x;
  while (px < x + w - 2) {
    const bw = 1 + rnd() * 3.4;
    if (rnd() > 0.42) ctx.fillRect(px, y, bw, h);
    px += bw + 1 + rnd() * 2.4;
  }
}

function drawSeal(ctx, cx, cy, r, text) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = '#f5b942';
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    const rr = i % 2 ? r * 0.86 : r;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9ad';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4d00';
  ctx.font = `900 ${r * 0.34}px Anton, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const words = text.split(' ');
  words.forEach((wd, i) => ctx.fillText(wd, 0, (i - (words.length - 1) / 2) * r * 0.4));
  ctx.restore();
}

function drawPhoto(ctx, img, rect, panel, grade, state) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (panel.rot) {
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate((panel.rot * Math.PI) / 180); ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * (panel.zoom || 1);
  const dw = iw * scale, dh = ih * scale;
  const dx = x + w / 2 - dw * (panel.x ?? 0.5) + (panel.flip ? 0 : 0);
  const dy = y + h / 2 - dh * (panel.y ?? 0.5);
  ctx.filter = grade.filter;
  if (panel.flip) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(img, dx - x, dy, dw, dh); }
  else ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  // grade wash: sky -> horizon gradient over the photo
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, grade.sky + '55'); g.addColorStop(0.62, grade.horizon + '22'); g.addColorStop(1, grade.horizon + '44');
  ctx.globalAlpha = state.paint;
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  // halftone dots
  if (state.halftone > 0.05) {
    ctx.globalAlpha = state.halftone * 0.16; ctx.fillStyle = '#1c1030';
    const step = Math.max(7, w / 90);
    for (let py = y + step / 2; py < y + h; py += step)
      for (let px = x + step / 2; px < x + w; px += step) {
        ctx.beginPath(); ctx.arc(px, py, step * 0.16, 0, Math.PI * 2); ctx.fill();
      }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // thin cream frame around the panel
  ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.strokeRect(x, y, w, h);
}

function drawRoleLabel(ctx, rect, role, accent, maxBottom) {
  const barH = Math.max(20, rect.h * 0.115);
  const bx = rect.x, by = Math.min(rect.y + rect.h - barH, maxBottom - barH);
  ctx.fillStyle = 'rgba(12,6,26,0.92)';
  ctx.fillRect(bx, by, rect.w, barH);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(bx, by); ctx.lineTo(bx + barH * 0.28, by); ctx.lineTo(bx + barH * 0.62, by + barH); ctx.lineTo(bx, by + barH);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `400 ${barH * 0.52}px Anton, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(role, bx + barH * 0.78, by + barH * 0.54, rect.w - barH);
}

// The main entry point: draw the full poster on ctx at W x H.
export function drawCover(ctx, W, H, state, photos) {
  const grade = GRADES[state.grade] || GRADES['coral-dawn'];
  const u = W / 1920; // unit scale, poster designed at 1920 wide
  const wide = W / H > 1.35; // wide covers keep the title centred; square/portrait shift it to the hero side
  ctx.clearRect(0, 0, W, H);
  // Warm cream field the poster sits on.
  ctx.fillStyle = '#f7ead2'; ctx.fillRect(0, 0, W, H);
  const m = Math.round(W * 0.014); // outer margin
  const px = m, py = m, pw = W - 2 * m, ph = H - 2 * m;
  // Poster paper: deep plum night sky.
  const sky = ctx.createLinearGradient(0, py, 0, py + ph);
  sky.addColorStop(0, grade.sky); sky.addColorStop(0.55, grade.sky); sky.addColorStop(1, grade.horizon);
  ctx.fillStyle = sky; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = grade.accent; ctx.lineWidth = Math.max(2, 3 * u);
  ctx.strokeRect(px, py, pw, ph);

  const panels = layoutPanels(state.layout, LAYOUTS[state.layout].panels);
  const rects = panels.map((p) => ({
    x: px + p.x * pw, y: py + p.y * ph, w: p.w * pw, h: p.h * ph, rot: p.rot || 0,
  }));

  // Photos
  rects.forEach((r, i) => {
    const p = state.panels[i] || defaultState().panels[i];
    const img = photos[p.photo];
    if (img) drawPhoto(ctx, img, r, p, grade, state);
    else { ctx.fillStyle = '#3a2358'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  });

  // Sunrise strip along the seam / bottom of the poster.
  if (state.showStamps) {
    const stripH = ph * 0.085;
    drawSunriseStrip(ctx, px + pw * 0.30, py + ph - stripH - ph * 0.10, pw * 0.40, stripH, grade);
  }

  const bbH = ph * 0.085;
  const bbY = py + ph - bbH;

  // Role labels — clamped above the bottom bar so they are never covered.
  if (state.showRoles) {
    rects.forEach((r, i) => {
      const p = state.panels[i] || defaultState().panels[i];
      drawRoleLabel(ctx, r, p.role || DEFAULT_ROLES[i] || 'THE CREW', grade.accent, state.showFooter ? bbY : py + ph);
    });
  }

  // Top bar: stars + press quote + outlet + ticket box.
  const barH = ph * 0.075;
  ctx.fillStyle = 'rgba(12,6,26,0.88)'; ctx.fillRect(px, py, pw, barH);
  const starR = barH * 0.26;
  let sx = px + pw * 0.02;
  for (let i = 0; i < 5; i++) { drawStar(ctx, sx, py + barH / 2, starR, '#f5b942'); sx += starR * 2.3; }
  if (state.showQuote) {
    ctx.fillStyle = '#ffe9ad';
    ctx.font = `italic 700 ${barH * 0.42}px Georgia, serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`“${state.quote}”`, sx + starR, py + barH / 2, pw * 0.52);
    ctx.fillStyle = '#ff8a6b';
    ctx.font = `400 ${barH * 0.34}px Anton, sans-serif`;
    ctx.fillText(`— ${state.outlet}`, sx + starR, py + barH * 0.86, pw * 0.52);
  }
  // Ticket box, top right.
  const tbW = pw * 0.115, tbH = barH * 0.78, tbX = px + pw - tbW - pw * 0.012, tbY = py + barH * 0.11;
  ctx.fillStyle = '#f5b942'; ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = '#7a4d00'; ctx.lineWidth = Math.max(1.5, 2 * u); ctx.strokeRect(tbX, tbY, tbW, tbH);
  ctx.fillStyle = '#3a1c00'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `400 ${tbH * 0.42}px Anton, sans-serif`;
  ctx.fillText(state.ticket, tbX + tbW / 2, tbY + tbH / 2, tbW * 0.92);

  // Kicker just under the top bar, over the hero's open sky. On square/portrait
  // covers the sunrise badge sits in the hero's top-left corner, so the kicker
  // drops a little lower to clear it.
  const tz = titleZone(state.layout);
  const titleY = py + ph * tz.y;
  const titleSize = ph * tz.size;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffe9ad';
  ctx.font = `400 ${barH * 0.40}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${barH * 0.10}px`; } catch (e) { /* older canvas */ }
  ctx.fillText('W E L C O M E   T O   P E A C H   C O V E', px + pw / 2, py + barH + ph * (wide ? 0.038 : 0.09));
  try { ctx.letterSpacing = '0px'; } catch (e) { /* noop */ }

  // On a wide cover the title sits dead centre; on square/portrait it shifts
  // towards the hero side so it never hides the right column's faces.
  const titleCx = state.layout === 'hero-right' && !wide ? px + pw * 0.64
    : state.layout === 'hero-left' && !wide ? px + pw * 0.34 : px + pw / 2;
  const title = (state.title || 'CORAL DAWN').toUpperCase();
  ctx.font = `${titleSize}px Anton, sans-serif`;
  const tw = ctx.measureText(title).width;
  const tScale = Math.min(1, (pw * (wide ? 0.92 : 0.62)) / tw);
  ctx.save();
  ctx.translate(titleCx, titleY);
  ctx.scale(tScale, tScale);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let grad;
  if (state.titleStyle === 'glow') {
    grad = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
    grad.addColorStop(0, '#2fe8ff'); grad.addColorStop(0.5, '#b04dff'); grad.addColorStop(1, '#ff2fb3');
    ctx.shadowColor = '#ff2fb3'; ctx.shadowBlur = titleSize * 0.30 * state.glow;
  } else {
    grad = ctx.createLinearGradient(0, -titleSize * 0.5, 0, titleSize * 0.5);
    grad.addColorStop(0, '#ff5e7a'); grad.addColorStop(0.34, '#ff5e7a');
    grad.addColorStop(0.34, '#ffb37a'); grad.addColorStop(0.67, '#ffb37a');
    grad.addColorStop(0.67, '#ffe98a'); grad.addColorStop(1, '#ffe98a');
    ctx.shadowColor = '#ff2fb3'; ctx.shadowBlur = titleSize * 0.14 * state.glow;
  }
  // Hard offset drop shadow.
  ctx.fillStyle = '#1a0b2e';
  ctx.fillText(title, titleSize * 0.045, titleSize * 0.06);
  // Dark outline, then gradient fill.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1a0b2e'; ctx.lineWidth = titleSize * 0.055;
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Sparkles on the title.
  drawSparkle(ctx, titleCx - (tw * tScale) / 2 - titleSize * 0.12, titleY - titleSize * 0.55, titleSize * 0.09, '#ffffff', titleSize * 0.2 * state.glow);
  drawSparkle(ctx, titleCx + (tw * tScale) / 2 + titleSize * 0.10, titleY + titleSize * 0.35, titleSize * 0.07, '#ffffff', titleSize * 0.16 * state.glow);
  drawSparkle(ctx, titleCx + (tw * tScale) / 2 - titleSize * 0.3, titleY - titleSize * 0.62, titleSize * 0.05, '#ffe98a', titleSize * 0.12 * state.glow);

  // Script subtitle, cyan, overlapping the title's lower edge.
  ctx.save();
  ctx.translate(titleCx, titleY + titleSize * 0.62);
  ctx.rotate(-0.02);
  ctx.font = `${titleSize * 0.42}px "Great Vibes", cursive`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#2fe8ff'; ctx.shadowBlur = titleSize * 0.16 * state.glow;
  ctx.fillStyle = '#35f0ff';
  ctx.fillText(state.subtitle || 'first light, last getaway', 0, 0);
  ctx.restore();

  // Ribbon slogan.
  const ribbon = state.tagline || '';
  ctx.font = `400 ${titleSize * 0.135}px Anton, sans-serif`;
  const rw = Math.min(pw * 0.62, ctx.measureText(ribbon).width + titleSize * 0.5);
  const rh = titleSize * 0.26;
  const rx = titleCx - rw / 2, ry = titleY + titleSize * 0.86;
  ctx.fillStyle = 'rgba(12,6,26,0.94)';
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, rh / 2); ctx.fill();
  ctx.strokeStyle = grade.accent; ctx.lineWidth = Math.max(1.5, 2.5 * u); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ribbon, titleCx, ry + rh / 2 + rh * 0.04, rw * 0.94);

  // "SUNRISE 06:47" badge on the hero panel: bottom-left above its role tag on
  // wide covers; top-left corner on square/portrait, where the bottom is crowded.
  if (state.showStamps && rects[0]) {
    const b = rects[0];
    const bw = Math.min(b.w * 0.30, W * 0.17), bh = Math.max(22, b.h * 0.055);
    const roleBarH = Math.max(20, b.h * 0.115);
    const labelY = Math.min(b.y + b.h - roleBarH, bbY - roleBarH);
    const bx = b.x + b.w * 0.03;
    const by = wide ? labelY - bh - 10 : py + barH + 8;
    ctx.fillStyle = 'rgba(12,6,26,0.9)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
    ctx.strokeStyle = grade.accent; ctx.lineWidth = Math.max(1.5, 2 * u); ctx.stroke();
    ctx.fillStyle = '#ffe9ad'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `400 ${bh * 0.44}px Anton, sans-serif`;
    ctx.fillText('SUNRISE 06:47', bx + bw / 2, by + bh / 2 + bh * 0.03, bw * 0.92);
  }

  // Bottom bar: COMING SOON + credits + barcode + seal.
  if (state.showFooter) {
    ctx.fillStyle = 'rgba(12,6,26,0.92)'; ctx.fillRect(px, bbY, pw, bbH);
    ctx.fillStyle = grade.accent;
    ctx.font = `400 ${bbH * 0.42}px Anton, sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('COMING SOON', px + pw * 0.02, bbY + bbH / 2);
    if (state.showBilling) {
      ctx.fillStyle = '#d9c9a8';
      ctx.font = `400 ${bbH * 0.20}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(state.billing, px + pw / 2, bbY + bbH / 2, pw * 0.58);
    }
    const bcW = pw * 0.075, bcH = bbH * 0.58;
    drawBarcode(ctx, px + pw - bcW - pw * 0.012, bbY + bbH * 0.21, bcW, bcH, 1234567);
    if (state.showSeal) drawSeal(ctx, px + pw - bcW - pw * 0.10, bbY + bbH * 0.5, bbH * 0.62, 'FIRST LIGHT');
  }

  // Grain over everything.
  if (state.grain > 0.03) {
    ctx.save();
    ctx.globalAlpha = state.grain * 0.10;
    ctx.globalCompositeOperation = 'overlay';
    const n = 140;
    const noise = document.createElement('canvas');
    noise.width = n; noise.height = n;
    const nctx = noise.getContext('2d');
    const id = nctx.createImageData(n, n);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 110 + Math.random() * 90;
      id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255;
    }
    nctx.putImageData(id, 0, 0);
    ctx.fillStyle = ctx.createPattern(noise, 'repeat');
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  }
  return { panels: rects, poster: { x: px, y: py, w: pw, h: ph } };
}

// Fit "cover" crop math shared by the editor's hit-testing.
export function panelPhotoRect(img, rect, panel) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
  return { w: iw * scale, h: ih * scale, x: rect.x + rect.w / 2 - iw * scale * (panel.x ?? 0.5), y: rect.y + rect.h / 2 - ih * scale * (panel.y ?? 0.5) };
}

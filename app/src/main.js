// Coral Dawn — editor wiring.
// Photos live on this machine only. The preview and the export both call
// drawCover from cover.js, so the preview IS the export.

import { GRADES, LAYOUTS, DEFAULT_ROLES, defaultState, drawCover, layoutPanels } from './cover.js';

const SAMPLES = [
  { name: 'The Driver — marina blue hour', file: 'samples/media-generation-hero-driver-0-7280ee0e-fdeb-4482-844b-ddc2a3ee850d.jpg' },
  { name: 'The Getaway — neon street', file: 'samples/media-generation-getaway-neon-0-fa3f72b2-e666-4801-b612-7b5705fed524.jpg' },
  { name: 'The Captain — yacht at dawn', file: 'samples/media-generation-captain-yacht-0-ce599474-ed20-43d9-b23e-9cbc17bd4b06.jpg' },
  { name: 'The Lookout — skyline + helicopter', file: 'samples/media-generation-lookout-skyline-0-40460160-6d12-4087-b398-da0bd982f26e.jpg' },
  { name: 'The Rider — palms beach', file: 'samples/media-generation-palms-beach-0-ece84583-bc92-4017-aba3-db139a0258af.jpg' },
];

const EXPORT_SIZES = {
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080' },
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350' },
};

const $ = (id) => document.getElementById(id);
const state = defaultState();
const photos = []; // { name, src, img }
let selected = 0;
let exportSize = '1920x1080';
let undoStack = [];
let redoStack = [];
let geometry = null; // last drawCover geometry, in preview pixels
let previewScale = 1;

function snapshot() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}
function restore(json) {
  const s = JSON.parse(json);
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, s);
  syncControls();
  render();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(state));
  restore(undoStack.pop());
  updateUndoButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state));
  restore(redoStack.pop());
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undoBtn').disabled = !undoStack.length;
  $('redoBtn').disabled = !redoStack.length;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addPhoto(name, src) {
  const img = await loadImage(src);
  photos.push({ name, src, img });
  renderThumbs();
  return photos.length - 1;
}

async function loadSamples() {
  for (const s of SAMPLES) {
    if (!photos.some((p) => p.src === s.file)) await addPhoto(s.name, s.file);
  }
  render();
}

function renderThumbs() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'thumb';
    b.title = p.name;
    const im = document.createElement('img');
    im.src = p.src; im.alt = p.name;
    b.appendChild(im);
    const tag = document.createElement('span');
    tag.textContent = String(i + 1);
    b.appendChild(tag);
    b.addEventListener('click', () => {
      snapshot();
      const p0 = state.panels[selected] || state.panels[0];
      p0.photo = i;
      render();
    });
    strip.appendChild(b);
  });
  $('photoCount').textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} loaded`;
}

function previewSize() {
  const s = EXPORT_SIZES[exportSize];
  const max = 960;
  const k = Math.min(1, max / Math.max(s.w, s.h));
  return { w: Math.round(s.w * k), h: Math.round(s.h * k) };
}

function render() {
  const canvas = $('preview');
  const { w, h } = previewSize();
  canvas.width = w; canvas.height = h;
  previewScale = w / EXPORT_SIZES[exportSize].w;
  const ctx = canvas.getContext('2d');
  geometry = drawCover(ctx, w, h, state, photos.map((p) => p.img));
  updatePanelControls();
  $('zoomReadout').textContent = `Panel ${selected + 1} · zoom ${Math.round(((state.panels[selected] || {}).zoom || 1) * 100)}%`;
}

function panelAt(cx, cy) {
  if (!geometry) return -1;
  for (let i = geometry.panels.length - 1; i >= 0; i--) {
    const r = geometry.panels[i];
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return i;
  }
  return -1;
}

function bindCanvas() {
  const canvas = $('preview');
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (canvas.width / r.width);
    const cy = (e.clientY - r.top) * (canvas.height / r.height);
    const i = panelAt(cx, cy);
    if (i < 0) return;
    selected = i;
    drag = { i, x: cx, y: cy, moved: false, swap: e.shiftKey };
    canvas.setPointerCapture(e.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (canvas.width / r.width);
    const cy = (e.clientY - r.top) * (canvas.height / r.height);
    const p = state.panels[drag.i];
    const rect = geometry.panels[drag.i];
    if (drag.swap) {
      const j = panelAt(cx, cy);
      if (j >= 0 && j !== drag.i) {
        snapshot();
        const a = state.panels[drag.i].photo;
        state.panels[drag.i].photo = state.panels[j].photo;
        state.panels[j].photo = a;
        drag.i = j; selected = j;
        render();
      }
      return;
    }
    if (!drag.snapshotted) { snapshot(); drag.snapshotted = true; }
    const dx = (cx - drag.x) / rect.w, dy = (cy - drag.y) / rect.h;
    if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
    p.x = Math.min(1, Math.max(0, (p.x ?? 0.5) - dx));
    p.y = Math.min(1, Math.max(0, (p.y ?? 0.5) - dy));
    drag.x = cx; drag.y = cy;
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[selected];
    if (!p) return;
    snapshot();
    p.zoom = Math.min(3, Math.max(0.5, (p.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.92)));
    render();
  }, { passive: false });
  canvas.addEventListener('dblclick', () => {
    snapshot();
    const d = defaultState().panels[selected];
    Object.assign(state.panels[selected], { zoom: 1, x: d.x, y: d.y, rot: 0, flip: false });
    render();
  });
}

function updatePanelControls() {
  const p = state.panels[selected] || {};
  $('panelZoom').value = Math.round(((p.zoom || 1) - 0.5) / 2.5 * 100);
  $('panelX').value = Math.round((p.x ?? 0.5) * 100);
  $('panelY').value = Math.round((p.y ?? 0.5) * 100);
  $('panelRole').value = p.role || '';
  $('panelLabel').textContent = `Panel ${selected + 1} — ${p.role || ''}`;
}

function syncControls() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  $('quoteInput').value = state.quote;
  $('outletInput').value = state.outlet;
  $('ticketInput').value = state.ticket;
  $('billingInput').value = state.billing;
  $('paintRange').value = Math.round(state.paint * 100);
  $('halftoneRange').value = Math.round(state.halftone * 100);
  $('grainRange').value = Math.round(state.grain * 100);
  $('glowRange').value = Math.round(state.glow * 100);
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === exportSize));
  document.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === state.titleStyle));
  for (const [id, key] of [['toggleRoles', 'showRoles'], ['toggleSeal', 'showSeal'], ['toggleQuote', 'showQuote'], ['toggleStamps', 'showStamps'], ['toggleBilling', 'showBilling'], ['toggleFooter', 'showFooter']]) {
    $(id).checked = !!state[key];
  }
  updatePanelControls();
}

function buildControls() {
  // Layout thumbnails.
  const lay = $('layoutRow');
  for (const [key, l] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.className = 'chip layout-chip';
    b.dataset.layout = key;
    b.innerHTML = `<span class="mini ${key}"></span>${l.label} · ${l.panels} panels`;
    b.addEventListener('click', () => {
      snapshot();
      state.layout = key;
      while (state.panels.length < l.panels) state.panels.push({ ...defaultState().panels[state.panels.length], role: DEFAULT_ROLES[state.panels.length] });
      selected = 0;
      syncControls(); render();
    });
    lay.appendChild(b);
  }
  // Grade chips.
  const gr = $('gradeRow');
  for (const [key, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.className = 'chip grade-chip';
    b.dataset.grade = key;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${g.sky},${g.horizon})"></span>${g.label}`;
    b.addEventListener('click', () => { snapshot(); state.grade = key; syncControls(); render(); });
    gr.appendChild(b);
  }
  // Export size buttons.
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => { exportSize = b.dataset.size; syncControls(); render(); });
  });
  // Title style.
  document.querySelectorAll('[data-style]').forEach((b) => {
    b.addEventListener('click', () => { snapshot(); state.titleStyle = b.dataset.style; syncControls(); render(); });
  });
  // Text fields.
  for (const [id, key] of [['titleInput', 'title'], ['subtitleInput', 'subtitle'], ['taglineInput', 'tagline'], ['quoteInput', 'quote'], ['outletInput', 'outlet'], ['ticketInput', 'ticket'], ['billingInput', 'billing']]) {
    $(id).addEventListener('input', () => { state[key] = $(id).value; render(); });
    $(id).addEventListener('change', () => snapshot());
  }
  // Toggles.
  for (const [id, key] of [['toggleRoles', 'showRoles'], ['toggleSeal', 'showSeal'], ['toggleQuote', 'showQuote'], ['toggleStamps', 'showStamps'], ['toggleBilling', 'showBilling'], ['toggleFooter', 'showFooter']]) {
    $(id).addEventListener('change', () => { snapshot(); state[key] = $(id).checked; render(); });
  }
  // Sliders.
  for (const [id, key] of [['paintRange', 'paint'], ['halftoneRange', 'halftone'], ['grainRange', 'grain'], ['glowRange', 'glow']]) {
    $(id).addEventListener('input', () => { state[key] = $(id).value / 100; render(); });
    $(id).addEventListener('change', () => snapshot());
  }
  // Per-panel controls.
  $('panelZoom').addEventListener('input', () => {
    const p = state.panels[selected]; p.zoom = 0.5 + ($('panelZoom').value / 100) * 2.5; render();
  });
  $('panelZoom').addEventListener('change', () => snapshot());
  $('panelX').addEventListener('input', () => {
    const p = state.panels[selected]; p.x = $('panelX').value / 100; render();
  });
  $('panelX').addEventListener('change', () => snapshot());
  $('panelY').addEventListener('input', () => {
    const p = state.panels[selected]; p.y = $('panelY').value / 100; render();
  });
  $('panelY').addEventListener('change', () => snapshot());
  $('panelRole').addEventListener('input', () => {
    const p = state.panels[selected]; p.role = $('panelRole').value.toUpperCase(); render();
  });
  $('panelRole').addEventListener('change', () => snapshot());
  $('flipBtn').addEventListener('click', () => {
    snapshot(); const p = state.panels[selected]; p.flip = !p.flip; render();
  });
  $('rotBtn').addEventListener('click', () => {
    snapshot(); const p = state.panels[selected]; p.rot = ((p.rot || 0) + 90) % 360; render();
  });
  $('resetPanelBtn').addEventListener('click', () => {
    snapshot();
    const d = defaultState().panels[selected];
    Object.assign(state.panels[selected], { zoom: 1, x: d.x, y: d.y, rot: 0, flip: false });
    render();
  });
  $('swapBtn').addEventListener('click', () => {
    snapshot();
    const n = LAYOUTS[state.layout].panels;
    const j = (selected + 1) % n;
    const a = state.panels[selected].photo;
    state.panels[selected].photo = state.panels[j].photo;
    state.panels[j].photo = a;
    render();
  });
  // Undo / redo.
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
  // Surprise me.
  $('surpriseBtn').addEventListener('click', () => {
    snapshot();
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.titleStyle = Math.random() > 0.5 ? 'striped' : 'glow';
    const n = LAYOUTS[state.layout].panels;
    for (let i = 0; i < n; i++) state.panels[i].photo = Math.floor(Math.random() * photos.length);
    selected = 0;
    syncControls(); render();
  });
  // Auto-fill.
  $('autofillBtn').addEventListener('click', () => {
    snapshot();
    const n = LAYOUTS[state.layout].panels;
    for (let i = 0; i < n; i++) state.panels[i].photo = i % photos.length;
    render();
  });
  // Add photos: file input, drag-drop, paste.
  $('fileInput').addEventListener('change', async (e) => {
    for (const f of e.target.files) {
      const src = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      await addPhoto(f.name, src);
    }
    render();
  });
  const dz = $('dropZone');
  dz.addEventListener('click', () => $('fileInput').click());
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', async (e) => {
    e.preventDefault(); dz.classList.remove('over');
    for (const f of e.dataTransfer.files) {
      if (!f.type.startsWith('image/')) continue;
      const src = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      await addPhoto(f.name, src);
    }
    render();
  });
  document.addEventListener('paste', async (e) => {
    for (const item of e.clipboardData?.items || []) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        const src = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
        await addPhoto('Pasted photo', src);
        render();
      }
    }
  });
  $('samplesBtn').addEventListener('click', loadSamples);
  // Export.
  $('exportBtn').addEventListener('click', () => exportPNG(exportSize, true));
  $('exportAllBtn').addEventListener('click', async () => {
    for (const key of Object.keys(EXPORT_SIZES)) await exportPNG(key, true);
  });
}

async function exportPNG(sizeKey, download) {
  const s = EXPORT_SIZES[sizeKey];
  const c = document.createElement('canvas');
  c.width = s.w; c.height = s.h;
  drawCover(c.getContext('2d'), s.w, s.h, state, photos.map((p) => p.img));
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  if (download) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `coral-dawn-${s.w}x${s.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  return { blob, dataUrl: await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); }) };
}

async function init() {
  buildControls();
  bindCanvas();
  syncControls();
  try {
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('60px "Great Vibes"')]);
  } catch (e) { /* fonts fall back, render anyway */ }
  await loadSamples();
  render();
  document.fonts.ready.then(() => render());
  // Automation hook (used by the maker's own screenshot runs).
  window.CoralDawn = {
    state, photos, exportPNG,
    setState(patch) { Object.assign(state, patch); syncControls(); render(); },
    setPanel(i, patch) { Object.assign(state.panels[i], patch); render(); },
    render,
  };
  window.__coralReady = true;
}

init();

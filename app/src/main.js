/* Coral Dawn — editor wiring.
   Bright cream editor around the canvas poster renderer in cover.js.
   Photos live in `library` (sample photos first, user photos appended);
   state.slots hold library indices per panel slot. */
(function () {
  'use strict';

  var CD = window.CoralDawn;
  var state = CD.defaultState();
  var library = [];          /* { name, img, src } */
  var undoStack = [];
  var redoStack = [];
  var selected = 0;          /* selected slot index */
  var dragPhoto = null;      /* library index being dragged from the strip */
  var panDrag = null;        /* { slot, x, y, ox, oy } */
  var swapDrag = null;       /* { slot } while shift-dragging a panel */

  var $ = function (id) { return document.getElementById(id); };

  function params() { return new URLSearchParams(window.location.search); }

  function snapshot() {
    return JSON.stringify({ state: state, selected: selected });
  }
  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 60) undoStack.shift();
    redoStack.length = 0;
    syncUndoButtons();
  }
  function restore(json) {
    var data = JSON.parse(json);
    state = data.state;
    selected = data.selected;
    rebuildAll();
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    syncUndoButtons();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    syncUndoButtons();
  }
  function syncUndoButtons() {
    var u = $('undoBtn'), r = $('redoBtn');
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }

  /* ---- photo loading ---- */

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('cannot load ' + src)); };
      img.src = src;
    });
  }

  function loadSamples() {
    var jobs = CD.SAMPLES.map(function (s) {
      return loadImage(s.file).then(function (img) {
        return { name: s.name, img: img, src: s.file };
      }).catch(function () { return null; });
    });
    return Promise.all(jobs).then(function (rows) {
      /* Keep null placeholders in place: library indices MUST stay aligned
         with SAMPLES indices, or the street/boat assignment breaks. */
      library = rows;
      autoFill();
    });
  }

  /* Assign photos to slots by SAMPLES index, so street is always THE
     GETAWAY and boat is always THE LOOKOUT, in every layout. */
  function autoFill() {
    state.slots = CD.slotPhotos(state.layout).slice();
    state.pans = {};
    renderPreview();
    renderStrip();
  }

  function images() {
    return library.map(function (p) { return p ? p.img : null; });
  }

  /* ---- preview ---- */

  var preview = null;
  function renderPreview() {
    if (!preview) preview = $('preview');
    if (!preview) return;
    var size = CD.SIZES[state.size] || CD.SIZES.square;
    var box = preview.parentElement.getBoundingClientRect();
    var availW = Math.min(box.width - 8, 760);
    var availH = 640;
    var scale = Math.min(availW / size.w, availH / size.h, 1);
    preview.width = Math.round(size.w * scale);
    preview.height = Math.round(size.h * scale);
    /* render at full size offscreen, then draw scaled into the preview */
    var off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    var info = CD.renderCover(off, state, images());
    preview.getContext('2d').drawImage(off, 0, 0, preview.width, preview.height);
    window.__coverSlots = info.slots.map(function (r) {
      return {
        x: r.x * preview.width, y: r.y * preview.height,
        w: r.w * preview.width, h: r.h * preview.height
      };
    });
    updateSelectedReadout();
  }

  function updateSelectedReadout() {
    var el = $('selectedLabel');
    if (!el) return;
    var pan = state.pans[selected] || {};
    var role = (state.roles[selected] || CD.ROLES[selected % CD.ROLES.length]);
    var shown = library[state.slots[selected]];
    var name = shown ? shown.name : '—';
    el.textContent = 'Selected: ' + (selected === 0 ? 'Hero band' : 'Panel ' + (selected + 1)) +
      ' · ' + role + ' — ' + name +
      ' · drag to move · scroll to zoom';
    var z = $('zoomRange'); if (z) z.value = Math.round((pan.zoom || 1) * 100);
    var zx = $('zoomVal'); if (zx) zx.textContent = Math.round((pan.zoom || 1) * 100) + '%';
    var sx = $('shiftXRange'); if (sx) sx.value = pan.ox || 0;
    var sy = $('shiftYRange'); if (sy) sy.value = pan.oy || 0;
  }

  /* ---- left rail: strip, layouts, grades ---- */

  function renderStrip() {
    var strip = $('photoStrip');
    if (!strip) return;
    strip.innerHTML = '';
    library.forEach(function (photo, i) {
      if (!photo) return;
      var b = document.createElement('button');
      b.className = 'thumb';
      b.type = 'button';
      b.title = photo.name + ' — click, then click a panel to place it';
      var im = document.createElement('img');
      im.src = photo.src;
      im.alt = photo.name;
      b.appendChild(im);
      b.addEventListener('click', function () {
        dragPhoto = i;
        strip.querySelectorAll('.thumb').forEach(function (t) { t.classList.remove('picked'); });
        b.classList.add('picked');
      });
      strip.appendChild(b);
    });
  }

  function buildChips() {
    var lg = $('layoutChips');
    if (lg) {
      lg.innerHTML = '';
      Object.keys(CD.LAYOUTS).forEach(function (key) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (state.layout === key ? ' on' : '');
        b.textContent = CD.LAYOUTS[key].label;
        b.addEventListener('click', function () {
          pushUndo();
          state.layout = key;
          selected = 0;
          autoFill();
          buildChips();
        });
        lg.appendChild(b);
      });
    }
    var gg = $('gradeChips');
    if (gg) {
      gg.innerHTML = '';
      Object.keys(CD.GRADES).forEach(function (key) {
        var g = CD.GRADES[key];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip grade' + (state.grade === key ? ' on' : '');
        b.innerHTML = '<span class="dot" style="background:' + g.dot + '"></span>' + g.label;
        b.addEventListener('click', function () {
          pushUndo();
          state.grade = key;
          renderPreview();
          buildChips();
        });
        gg.appendChild(b);
      });
    }
  }

  function buildSizeTabs() {
    var tabs = $('sizeTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    Object.keys(CD.SIZES).forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'size-tab' + (state.size === key ? ' on' : '');
      b.textContent = CD.SIZES[key].label;
      b.addEventListener('click', function () {
        state.size = key;
        renderPreview();
        buildSizeTabs();
      });
      tabs.appendChild(b);
    });
  }

  function rebuildAll() {
    buildChips();
    buildSizeTabs();
    renderStrip();
    syncCaptionFields();
    syncToggles();
    syncSliders();
    renderPreview();
  }

  /* ---- right rail: caption + toggles + sliders ---- */

  function bindText(id, key) {
    var el = $(id);
    if (!el) return;
    el.value = state[key];
    /* snapshot BEFORE the edit, so Undo returns to the pre-edit state */
    el.addEventListener('focus', function () { pushUndo(); });
    el.addEventListener('input', function () {
      state[key] = el.value;
      renderPreview();
    });
  }

  function syncCaptionFields() {
    [['titleField', 'title'], ['subtitleField', 'subtitle'], ['taglineField', 'tagline'],
     ['quoteField', 'quote'], ['outletField', 'outlet'], ['badgeField', 'badge']]
      .forEach(function (pair) {
        var el = $(pair[0]);
        if (el && document.activeElement !== el) el.value = state[pair[1]];
      });
    var rolesBox = $('roleFields');
    if (rolesBox) {
      rolesBox.innerHTML = '';
      var photos = CD.slotPhotos(state.layout);
      photos.forEach(function (_, i) {
        var label = document.createElement('label');
        label.className = 'role-row';
        label.textContent = 'Panel ' + (i + 1) + ' role';
        var input = document.createElement('input');
        input.type = 'text';
        input.value = state.roles[i] || '';
        input.addEventListener('input', function () {
          state.roles[i] = input.value.toUpperCase();
          renderPreview();
        });
        label.appendChild(input);
        rolesBox.appendChild(label);
      });
    }
    var ts = $('titleStyle');
    if (ts) ts.value = state.titleStyle;
  }

  function bindToggle(id, key) {
    var el = $(id);
    if (!el) return;
    el.checked = !!state.show[key];
    el.addEventListener('pointerdown', function () { pushUndo(); });
    el.addEventListener('change', function () {
      state.show[key] = el.checked;
      renderPreview();
    });
  }

  function syncToggles() {
    [['tglRoles', 'roles'], ['tglQuote', 'quote'], ['tglSeal', 'seal'],
     ['tglStamps', 'stamps'], ['tglBilling', 'billing'], ['tglStrip', 'strip']]
      .forEach(function (pair) {
        var el = $(pair[0]);
        if (el) el.checked = !!state.show[pair[1]];
      });
    var ink = $('inkToggle');
    if (ink) ink.checked = !!state.ink;
  }

  function bindSlider(id, key, outId, fmt) {
    var el = $(id);
    if (!el) return;
    el.value = state[key];
    var out = outId ? $(outId) : null;
    if (out) out.textContent = fmt(state[key]);
    el.addEventListener('pointerdown', function () { pushUndo(); });
    el.addEventListener('input', function () {
      state[key] = Number(el.value);
      if (out) out.textContent = fmt(state[key]);
      renderPreview();
    });
  }

  function syncSliders() {
    [['paintRange', 'paint', 'paintVal'], ['halftoneRange', 'halftone', 'halftoneVal'],
     ['grainRange', 'grain', 'grainVal'], ['glowRange', 'glow', 'glowVal']]
      .forEach(function (t) {
        var el = $(t[0]);
        if (el) el.value = state[t[1]];
        var out = $(t[2]);
        if (out) out.textContent = String(state[t[1]]);
      });
  }

  /* ---- export ---- */

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 800);
  }

  function exportOne(sizeKey) {
    return CD.exportCover(state, images(), sizeKey).then(function (blob) {
      downloadBlob(blob, 'coral-dawn-' + sizeKey + '.png');
      return blob;
    });
  }

  function exportAll() {
    var keys = Object.keys(CD.SIZES);
    var chain = Promise.resolve();
    keys.forEach(function (k, i) {
      chain = chain.then(function () {
        return new Promise(function (res) { setTimeout(res, i * 350); });
      }).then(function () { return exportOne(k); });
    });
    return chain;
  }

  function surprise() {
    pushUndo();
    var layouts = Object.keys(CD.LAYOUTS);
    var grades = Object.keys(CD.GRADES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    selected = 0;
    autoFill();
    buildChips();
  }

  /* ---- file input: user photos ---- */

  function addFiles(files) {
    var list = Array.prototype.slice.call(files || []).filter(function (f) {
      return f.type && f.type.indexOf('image/') === 0;
    });
    if (!list.length) return;
    var jobs = list.map(function (file) {
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () {
          loadImage(reader.result).then(function (img) {
            resolve({ name: file.name.replace(/\.[^.]+$/, ''), img: img, src: reader.result });
          }).catch(function () { resolve(null); });
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(jobs).then(function (rows) {
      var fresh = rows.filter(Boolean);
      if (!fresh.length) return;
      pushUndo();
      library = library.concat(fresh);
      renderStrip();
      renderPreview();
    });
  }

  /* ---- canvas pointer interaction ---- */

  function slotAt(clientX, clientY) {
    if (!preview || !window.__coverSlots) return -1;
    var r = preview.getBoundingClientRect();
    var kx = preview.width / r.width, ky = preview.height / r.height;
    var x = (clientX - r.left) * kx, y = (clientY - r.top) * ky;
    for (var i = 0; i < window.__coverSlots.length; i++) {
      var s = window.__coverSlots[i];
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return i;
    }
    return -1;
  }

  function bindCanvas() {
    preview = $('preview');
    if (!preview) return;
    preview.addEventListener('pointerdown', function (e) {
      var slot = slotAt(e.clientX, e.clientY);
      if (slot < 0) return;
      preview.setPointerCapture(e.pointerId);
      if (e.shiftKey) {
        swapDrag = { slot: slot };
        return;
      }
      selected = slot;
      var pan = state.pans[slot] || (state.pans[slot] = { photo: state.slots[slot], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      /* keep the pre-drag snapshot: only a drag that actually moved earns an undo entry */
      panDrag = { slot: slot, x: e.clientX, y: e.clientY, ox: pan.ox || 0, oy: pan.oy || 0, moved: false, before: snapshot() };
      updateSelectedReadout();
    });
    preview.addEventListener('pointermove', function (e) {
      if (!panDrag) return;
      var pan = state.pans[panDrag.slot];
      var scale = preview.width / (CD.SIZES[state.size] || CD.SIZES.square).w;
      pan.ox = panDrag.ox + (e.clientX - panDrag.x) / scale;
      pan.oy = panDrag.oy + (e.clientY - panDrag.y) / scale;
      if (Math.abs(e.clientX - panDrag.x) + Math.abs(e.clientY - panDrag.y) > 3) panDrag.moved = true;
      renderPreview();
    });
    preview.addEventListener('pointerup', function (e) {
      if (swapDrag) {
        var target = slotAt(e.clientX, e.clientY);
        if (target >= 0 && target !== swapDrag.slot) {
          pushUndo();
          var a = state.slots[swapDrag.slot];
          state.slots[swapDrag.slot] = state.slots[target];
          state.slots[target] = a;
          var pa = state.pans[swapDrag.slot];
          state.pans[swapDrag.slot] = state.pans[target];
          state.pans[target] = pa;
          renderPreview();
        }
        swapDrag = null;
        return;
      }
      if (panDrag) {
        if (panDrag.moved) {
          undoStack.push(panDrag.before);
          if (undoStack.length > 60) undoStack.shift();
          redoStack.length = 0;
          syncUndoButtons();
        }
        /* click a panel after picking a photo from the strip places it */
        if (!panDrag.moved && dragPhoto !== null && dragPhoto !== undefined) {
          pushUndo();
          state.slots[panDrag.slot] = dragPhoto;
          state.pans[panDrag.slot] = { photo: dragPhoto, zoom: 1, ox: 0, oy: 0, rot: 0, flip: false };
          dragPhoto = null;
          document.querySelectorAll('.thumb').forEach(function (t) { t.classList.remove('picked'); });
        }
        panDrag = null;
        renderPreview();
      }
    });
    preview.addEventListener('wheel', function (e) {
      e.preventDefault();
      var pan = state.pans[selected] || (state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      pan.zoom = Math.max(0.5, Math.min(3, (pan.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
      renderPreview();
    }, { passive: false });
    preview.addEventListener('dblclick', function (e) {
      var slot = slotAt(e.clientX, e.clientY);
      if (slot < 0) return;
      pushUndo();
      state.pans[slot] = { photo: state.slots[slot], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false };
      renderPreview();
    });
  }

  function bindPanelControls() {
    var zr = $('zoomRange');
    if (zr) {
      zr.addEventListener('pointerdown', function () { pushUndo(); });
      zr.addEventListener('input', function () {
      var pan = state.pans[selected] || (state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      pan.zoom = Number(zr.value) / 100;
      renderPreview();
    });
    }
    var xr = $('shiftXRange');
    if (xr) xr.addEventListener('input', function () {
      var pan = state.pans[selected] || (state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      pan.ox = Number(xr.value);
      renderPreview();
    });
    var yr = $('shiftYRange');
    if (yr) yr.addEventListener('input', function () {
      var pan = state.pans[selected] || (state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      pan.oy = Number(yr.value);
      renderPreview();
    });
    var rot = $('rotateBtn');
    if (rot) rot.addEventListener('click', function () {
      pushUndo();
      var pan = state.pans[selected] || (state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      pan.rot = ((pan.rot || 0) + 90) % 360;
      renderPreview();
    });
    var fl = $('flipBtn');
    if (fl) fl.addEventListener('click', function () {
      pushUndo();
      var pan = state.pans[selected] || (state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false });
      pan.flip = !pan.flip;
      renderPreview();
    });
    var rs = $('resetBtn');
    if (rs) rs.addEventListener('click', function () {
      pushUndo();
      state.pans[selected] = { photo: state.slots[selected], zoom: 1, ox: 0, oy: 0, rot: 0, flip: false };
      renderPreview();
    });
  }

  /* ---- shot mode: full-bleed cover, no editor chrome ---- */

  function runShotMode() {
    var q = params();
    var layout = q.get('layout') || 'hero-top';
    var grade = q.get('grade') || 'coral-dawn';
    var sizeKey = q.get('size') || 'square';
    if (CD.LAYOUTS[layout]) state.layout = layout;
    if (CD.GRADES[grade]) state.grade = grade;
    if (CD.SIZES[sizeKey]) state.size = sizeKey;
    document.body.classList.add('shot-mode');
    var c = document.createElement('canvas');
    var size = CD.SIZES[state.size];
    c.width = size.w;
    c.height = size.h;
    c.id = 'shotCanvas';
    c.style.width = '100vmin';
    c.style.height = 'auto';
    document.body.appendChild(c);
    CD.renderCover(c, state, images());
    window.__shotDone = true;
  }

  /* ---- boot ---- */

  function fontsReady() {
    var jobs = [];
    try {
      jobs.push(document.fonts.load('900 100px Anton'));
      jobs.push(document.fonts.load('400 60px "Great Vibes"'));
    } catch (e) { /* fonts API unavailable: fall back to system fonts */ }
    return Promise.all(jobs).catch(function () { /* ignore */ });
  }

  function boot() {
    var q = params();
    var shot = q.get('shot');
    Promise.all([loadSamples(), fontsReady()]).then(function () {
      if (shot === 'cover') {
        runShotMode();
      } else {
        rebuildAll();
        bindCanvas();
        bindPanelControls();
        renderPreview();
      }
      window.__coralReady = true;
      window.__coral = {
        state: state,
        library: library,
        renderPreview: renderPreview,
        exportPNG: function (sizeKey) {
          return CD.exportCover(state, images(), sizeKey).then(function (blob) {
            return blob.arrayBuffer().then(function (buf) {
              var bytes = new Uint8Array(buf);
              return {
                size: sizeKey, width: (CD.SIZES[sizeKey] || CD.SIZES.square).w,
                height: (CD.SIZES[sizeKey] || CD.SIZES.square).h,
                bytes: bytes.length,
                pngMagic: bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
              };
            });
          });
        }
      };
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* header + left rail buttons */
    var addBtn = $('addPhotosBtn');
    if (addBtn) addBtn.addEventListener('click', function () { $('fileInput').click(); });
    var addBtn2 = $('addPhotosBtn2');
    if (addBtn2) addBtn2.addEventListener('click', function () { $('fileInput').click(); });
    var fi = $('fileInput');
    if (fi) fi.addEventListener('change', function () { addFiles(fi.files); fi.value = ''; });
    var sampleBtn = $('sampleBtn');
    if (sampleBtn) sampleBtn.addEventListener('click', function () {
      pushUndo();
      loadSamples().then(function () { rebuildAll(); });
    });
    var autoBtn = $('autoFillBtn');
    if (autoBtn) autoBtn.addEventListener('click', function () { pushUndo(); autoFill(); });
    var surBtn = $('surpriseBtn');
    if (surBtn) surBtn.addEventListener('click', surprise);
    var surBtn2 = $('surpriseBtn2');
    if (surBtn2) surBtn2.addEventListener('click', surprise);
    var u = $('undoBtn');
    if (u) u.addEventListener('click', undo);
    var r = $('redoBtn');
    if (r) r.addEventListener('click', redo);
    var ex = $('exportBtn');
    if (ex) ex.addEventListener('click', function () { exportOne(state.size); });
    var exTop = $('exportBtnTop');
    if (exTop) exTop.addEventListener('click', function () { exportOne(state.size); });
    var exAll = $('exportAllBtn');
    if (exAll) exAll.addEventListener('click', exportAll);

    bindText('titleField', 'title');
    bindText('subtitleField', 'subtitle');
    bindText('taglineField', 'tagline');
    bindText('quoteField', 'quote');
    bindText('outletField', 'outlet');
    bindText('badgeField', 'badge');
    var ts = $('titleStyle');
    if (ts) {
      ts.addEventListener('focus', function () { pushUndo(); });
      ts.addEventListener('change', function () {
        state.titleStyle = ts.value;
        renderPreview();
      });
    }
    bindToggle('tglRoles', 'roles');
    bindToggle('tglQuote', 'quote');
    bindToggle('tglSeal', 'seal');
    bindToggle('tglStamps', 'stamps');
    bindToggle('tglBilling', 'billing');
    bindToggle('tglStrip', 'strip');
    var ink = $('inkToggle');
    if (ink) {
      ink.addEventListener('pointerdown', function () { pushUndo(); });
      ink.addEventListener('change', function () {
        state.ink = ink.checked;
        renderPreview();
      });
    }
    bindSlider('paintRange', 'paint', 'paintVal', String);
    bindSlider('halftoneRange', 'halftone', 'halftoneVal', String);
    bindSlider('grainRange', 'grain', 'grainVal', String);
    bindSlider('glowRange', 'glow', 'glowVal', String);

    /* drag-drop + paste anywhere in the editor */
    document.addEventListener('dragover', function (e) { e.preventDefault(); });
    document.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
    document.addEventListener('paste', function (e) {
      if (e.clipboardData && e.clipboardData.files) addFiles(e.clipboardData.files);
    });
    window.addEventListener('resize', function () { renderPreview(); });

    boot();
  });
})();

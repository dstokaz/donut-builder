// ── Shared scaffolding for all chart builders ───────────────────────────────
// Chart-agnostic helpers reused by donut.html and combo.html.

// Default color palette for new segments / series.
const PALETTE = ['#F5A623','#4A4A4A','#666666','#888888','#2A7AFF','#E84545','#27AE60','#9B59B6'];

// Extract the numeric portion from a value like "~600", "1,200", or 600.
function parseValue(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

// Set up a canvas scaled to the device pixel ratio for crisp HiDPI rendering.
// Returns the 2D context (already scaled). Render code can then work in CSS px.
function setupCanvas(canvas, w, h) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width        = w * dpr;
  canvas.height       = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  return ctx;
}

// Export a PNG by rendering into an offscreen canvas at `scale`× resolution.
// `render` is a callback with signature (ctx, w, h, withBg).
function exportPNG({ render, w, h, withBg, filename, scale = 2 }) {
  const off  = document.createElement('canvas');
  off.width  = w * scale;
  off.height = h * scale;
  const octx = off.getContext('2d');
  octx.scale(scale, scale);
  render(octx, w, h, withBg);
  off.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Trigger a download of `text` as a file. Used for JSON config export.
function downloadText(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// localStorage wrappers — each builder owns its key and data shape.
function saveState(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
}
function loadState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// ── Small DOM builders ────────────────────────────────────────────────────────

// A labeled range slider with a live value readout.
// opts: { min, max, step, value, fmt(value)->string, onInput(value) }
function sliderRow(label, opts) {
  const row = document.createElement('div');
  row.className = 'slider-row';

  const header = document.createElement('div');
  header.className = 'slider-header';
  const name = document.createElement('span'); name.textContent = label;
  const val  = document.createElement('span');
  const fmt  = opts.fmt || (v => v);
  val.textContent = fmt(opts.value);
  header.append(name, val);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = opts.min; input.max = opts.max; input.step = opts.step;
  input.value = opts.value;
  input.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    val.textContent = fmt(v);
    opts.onInput(v);
  });

  row.append(header, input);
  return row;
}

// A ●/○ visibility toggle button. onChange(isOn).
function visToggle(initial, onChange) {
  const btn = document.createElement('button');
  btn.className = 'vis-toggle';
  btn.title = 'Show/hide';
  const sync = on => { btn.textContent = on ? '●' : '○'; btn.classList.toggle('off', !on); };
  let on = initial;
  sync(on);
  btn.addEventListener('click', () => { on = !on; sync(on); onChange(on); });
  return btn;
}

// A color swatch wrapping a hidden <input type=color>. onInput(hex).
function colorSwatch(value, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'color-swatch';
  wrap.style.background = value;
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.addEventListener('input', e => {
    wrap.style.background = e.target.value;
    onInput(e.target.value);
  });
  wrap.appendChild(input);
  return wrap;
}

// Convert a #RRGGBB hex color to an rgba() string at the given alpha (0–1).
function hexToRgba(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return `rgba(128,128,128,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Round a raw maximum up to a "nice" axis bound (1/2/2.5/5 × 10^n).
function niceMax(raw) {
  if (!isFinite(raw) || raw <= 0) return 10;
  const exp  = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const f    = raw / base;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * base;
}

// ── Preview zoom ────────────────────────────────────────────────────────────
// Purely-visual zoom for the on-screen #canvas inside #preview. It only sets a
// CSS transform on the displayed canvas, so the render/export paths (which draw
// into the buffer / an offscreen canvas) are completely unaffected.
// Auto-initializes on any page that has both #preview and #canvas.
function initChartZoom() {
  const preview = document.getElementById('preview');
  const canvas  = document.getElementById('canvas');
  if (!preview || !canvas) return;

  const MIN = 0.5, MAX = 3, STEP = 0.25;  // 50% … 300% in clean 25% steps
  const PAN_SENS = 0.5;                   // trackpad pan damping (lower = calmer)
  let scale = 1;                          // visual scale about the chart's center
  let tx = 0, ty = 0;                     // pan offset in CSS px (applied after scale)

  const magnifier = sign => // sign: '+' (zoom in) or '-' (zoom out)
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
       <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
       <line x1="7.5" y1="11" x2="14.5" y2="11"/>
       ${sign === '+' ? '<line x1="11" y1="7.5" x2="11" y2="14.5"/>' : ''}</svg>`;

  const ctl = document.createElement('div');
  ctl.className = 'zoom-ctl';
  ctl.innerHTML =
    `<button class="zoom-btn" data-zoom="out" title="Zoom out">${magnifier('-')}</button>` +
    `<button class="zoom-pct" title="Reset to 100%">100%</button>` +
    `<button class="zoom-btn" data-zoom="in" title="Zoom in">${magnifier('+')}</button>`;
  preview.appendChild(ctl);
  const pctEl = ctl.querySelector('.zoom-pct');

  canvas.style.transformOrigin = '50% 50%';

  // Bound the pan to the gap between the scaled chart and the preview on each
  // axis (plus a small margin). Using the absolute gap means you can move both
  // horizontally and vertically whenever zoomed — reaching the edges on the
  // axis that overflows, and sliding within the slack on the axis that fits.
  function clampPan() {
    if (scale <= 1) { tx = ty = 0; return; }
    const maxX = Math.abs(canvas.offsetWidth  * scale - preview.clientWidth)  / 2 + 24;
    const maxY = Math.abs(canvas.offsetHeight * scale - preview.clientHeight) / 2 + 24;
    tx = Math.max(-maxX, Math.min(maxX, tx));
    ty = Math.max(-maxY, Math.min(maxY, ty));
  }

  function apply() {
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    canvas.style.cursor = scale > 1 ? 'grab' : '';
    pctEl.textContent = Math.round(scale * 100) + '%';
  }

  function zoom(delta) {
    canvas.style.transition = '';   // animate button zoom (CSS default transition)
    scale = Math.max(MIN, Math.min(MAX, Math.round((scale + delta) / STEP) * STEP));
    clampPan();
    apply();
  }

  ctl.querySelector('[data-zoom="in"]').addEventListener('click', () => zoom(STEP));
  ctl.querySelector('[data-zoom="out"]').addEventListener('click', () => zoom(-STEP));
  pctEl.addEventListener('click', () => { canvas.style.transition = ''; scale = 1; tx = ty = 0; apply(); });

  // Two-finger trackpad scroll pans the chart when zoomed in (no transition so
  // it tracks the gesture smoothly; damped by PAN_SENS to keep it gentle).
  preview.addEventListener('wheel', e => {
    if (scale <= 1) return;
    e.preventDefault();
    canvas.style.transition = 'none';
    tx -= e.deltaX * PAN_SENS;
    ty -= e.deltaY * PAN_SENS;
    clampPan();
    apply();
  }, { passive: false });

  apply();
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', initChartZoom);
else
  initChartZoom();

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

// Round a raw maximum up to a "nice" axis bound (1/2/2.5/5 × 10^n).
function niceMax(raw) {
  if (!isFinite(raw) || raw <= 0) return 10;
  const exp  = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const f    = raw / base;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * base;
}

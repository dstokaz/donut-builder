// ── Shared scaffolding for all chart builders ───────────────────────────────
// Chart-agnostic helpers reused by donut.html and combo.html.

// Default color palette for new segments / series.
const PALETTE = ['#F5A623','#4A4A4A','#666666','#888888','#2A7AFF','#E84545','#27AE60','#9B59B6'];

// Font stack for all canvas text.
const FF = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Extract the numeric portion from a value like "~600", "1,200", or 600.
function parseValue(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

// Format a number for display: thousands separators, one decimal for fractions.
function fmtNum(n) {
  if (!isFinite(n)) return '';
  if (Number.isInteger(n)) return n.toLocaleString();
  return (Math.round(n * 10) / 10).toLocaleString();
}

// Strict #RRGGBB test — validates colors from imports and saved state.
const isHex6 = v => /^#[0-9a-fA-F]{6}$/.test(String(v));

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

// Canvas pixel size per aspect ratio (width is the long side, kept ~1040 so the
// chart stays crisp; height follows the ratio). 1:1 is shrunk to fit the viewport.
const ASPECTS = {
  '21:9': [1040, 446],   // ultrawide / cinematic
  '16:9': [1040, 585],
  '3:2':  [1040, 693],
  '4:3':  [1040, 780],
  '1:1':  [820, 820],
};

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

// A segmented toggle: one button per option, the current one highlighted.
// options: [{label, value}]; onChange(value).
function makeSegToggle(options, current, disabled, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'seg-toggle' + (disabled ? ' disabled' : '');
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    btn.classList.toggle('active', opt.value === current);
    btn.addEventListener('click', () => onChange(opt.value));
    wrap.appendChild(btn);
  });
  return wrap;
}

// Sync a ●/○ visibility toggle button (by element id) to a boolean.
function syncToggleBtn(id, on) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.textContent = on ? '●' : '○';
  btn.classList.toggle('off', !on);
}

// Wire a ●/○ toggle button to a boolean `key` on `state`. `onToggled()` runs
// after each flip — typically renderPreview plus any dependent UI rebuild.
function bindStateToggle(id, state, key, onToggled) {
  document.getElementById(id).addEventListener('click', () => {
    state[key] = !state[key];
    syncToggleBtn(id, state[key]);
    onToggled();
  });
}

// Wire the standard background controls (#bgColorPicker / #bgColorHex /
// #bgSwatch) to `state.bgColor`. Returns applyBgColor so pages can re-sync the
// controls after restore/import.
function bindBgControl(state, renderPreview) {
  const picker = document.getElementById('bgColorPicker');
  const hexIn  = document.getElementById('bgColorHex');
  const swatch = document.getElementById('bgSwatch');
  function applyBgColor(hex) {
    state.bgColor = hex;
    swatch.style.background = hex;
    picker.value = isHex6(hex) ? hex : '#111111';
    hexIn.value = hex;
    renderPreview();
  }
  picker.addEventListener('input', e => applyBgColor(e.target.value));
  hexIn.addEventListener('input', e => {
    const v = e.target.value.trim();
    if (isHex6(v)) applyBgColor(v);
  });
  return applyBgColor;
}

// Wire the standard Import panel (#toggleImport / #import-panel / #importText /
// #importMsg / #applyImport / #cancelImport). `applyFn(parsedJson)` performs the
// page-specific validation + state swap and returns { ok, msg }.
function initImportPanel(applyFn) {
  const panel = document.getElementById('import-panel');
  const text  = document.getElementById('importText');
  const msg   = document.getElementById('importMsg');
  const show = (t, ok) => {
    msg.textContent = t;
    msg.classList.toggle('error', !ok);
    msg.classList.toggle('ok', !!ok && !!t);
  };
  document.getElementById('toggleImport').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) text.focus();
  });
  document.getElementById('cancelImport').addEventListener('click', () => {
    panel.hidden = true;
    show('', true);
  });
  document.getElementById('applyImport').addEventListener('click', () => {
    let data;
    try { data = JSON.parse(text.value); }
    catch (err) { show('Invalid JSON: ' + err.message, false); return; }
    const res = applyFn(data);
    show(res.msg, res.ok);
  });
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

// Compute a "nice" signed axis scale spanning [min, max]. Zero is always
// included and the bounds land on step multiples, so charts with negative
// values (waterfall, scatter) get clean ticks on both sides of the baseline.
// Returns { min, max, step, ticks: [lo, …, hi] }.
function niceScale(min, max, tickCount = 5) {
  min = Math.min(0, min);
  max = Math.max(0, max);
  if (min === 0 && max === 0) max = 10;   // degenerate: nothing to scale
  const step = niceMax((max - min) / tickCount);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const n = Math.round((hi - lo) / step);
  const ticks = Array.from({ length: n + 1 }, (_, i) => lo + i * step);
  return { min: lo, max: hi, step, ticks };
}

// ── Canvas drawing helpers ──────────────────────────────────────────────────

// Draw a value label as a rounded "pill" tinted with `color`, centered on `cx`
// with its bottom edge at `bottomY`. Keeps labels readable over bars/grid/bg.
function drawValueLabel(c, text, cx, bottomY, color, fontSize) {
  c.font = `600 ${fontSize}px ${FF}`;
  const padX = 6, padY = 3;
  const w = c.measureText(text).width + padX * 2;
  const h = fontSize + padY * 2;
  const x = cx - w / 2;
  const y = bottomY - h;
  const r = Math.min(6, h / 2);
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = hexToRgba(color, 0.22);
  c.fill();
  c.fillStyle = '#f0f0f0';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, cx, y + h / 2);
}

// Straight line with filled triangular arrowheads. heads: 'end' | 'both' | 'none'.
function drawArrow(c, x1, y1, x2, y2, { color = '#f0f0f0', width = 1.5, heads = 'end', dash = null } = {}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 4 + width * 2.5;
  c.strokeStyle = color;
  c.lineWidth = width;
  if (dash) c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  if (dash) c.setLineDash([]);
  const head = (x, y, a) => {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - headLen * Math.cos(a - 0.4), y - headLen * Math.sin(a - 0.4));
    c.lineTo(x - headLen * Math.cos(a + 0.4), y - headLen * Math.sin(a + 0.4));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };
  if (heads === 'end' || heads === 'both') head(x2, y2, angle);
  if (heads === 'both') head(x1, y1, angle + Math.PI);
}

// Dashed horizontal reference line (average / target / benchmark).
function drawValueLine(c, x1, x2, y, { color = '#E84545', width = 1.5, dash = [6, 4] } = {}) {
  c.strokeStyle = color;
  c.lineWidth = width;
  if (dash) c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y);
  c.lineTo(x2, y);
  c.stroke();
  c.setLineDash([]);
}

// Compound annual growth rate from v0 to v1 over `periods` periods.
// Returns null when undefined (nonpositive endpoints or zero periods).
function computeCAGR(v0, v1, periods) {
  if (!(v0 > 0) || !(v1 > 0) || !(periods > 0)) return null;
  return Math.pow(v1 / v0, 1 / periods) - 1;
}

// Break `text` into lines that each fit within `maxW` px under the current
// c.font. Wraps on spaces; hard-breaks any single word wider than maxW. Caps at
// `maxLines` lines, appending an ellipsis if content remains. Always returns ≥1 line.
function wrapLabel(c, text, maxW, maxLines = 3) {
  const fits = s => c.measureText(s).width <= maxW;
  // Split words; hard-break any word that can't fit on its own line.
  const words = [];
  text.split(/\s+/).filter(Boolean).forEach(word => {
    if (fits(word)) { words.push(word); return; }
    let chunk = '';
    for (const ch of word) {
      if (chunk && !fits(chunk + ch)) { words.push(chunk); chunk = ''; }
      chunk += ch;
    }
    if (chunk) words.push(chunk);
  });
  if (!words.length) return [text];

  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && !fits(next)) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);

  if (lines.length <= maxLines) return lines;
  // Truncate to maxLines, ellipsizing the last visible line.
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && !fits(last + '…')) last = last.slice(0, -1);
  kept[maxLines - 1] = last + '…';
  return kept;
}

// ── Chart navigation ────────────────────────────────────────────────────────
// One entry per builder page. Adding a new chart = one line here plus a
// launcher card in index.html; every page's <nav class="chart-tabs"> is built
// from this list with the current page marked active.
const CHARTS = [
  { href: 'donut.html',     label: 'Donut' },
  { href: 'combo.html',     label: 'Combo' },
  { href: 'waterfall.html', label: 'Waterfall' },
];

function initChartTabs() {
  const nav = document.querySelector('nav.chart-tabs');
  if (!nav) return;
  const current = location.pathname.split('/').pop() || 'index.html';
  nav.innerHTML =
    `<a class="chart-tab home" href="index.html" aria-label="All charts" title="All charts">
       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>
       </svg>
     </a>` +
    CHARTS.map(chart =>
      `<a class="chart-tab${chart.href === current ? ' active' : ''}" href="${chart.href}">${chart.label}</a>`
    ).join('');
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

function initShared() {
  initChartTabs();
  initChartZoom();
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', initShared);
else
  initShared();

# Changelog

## [2026-07-17] — Axis breaks (combo + waterfall)

### Added
- **Axis break** — compress a value band (e.g. the middle of one dominant bar) into a thin 18px strip so the remaining bars regain resolution; enable it in the Axis (combo, left axis) or Display (waterfall) section with from/to inputs and an inline validity hint
- Slash markers with a punched gap on the axis and across every bar spanning the band (background-colored, or truly transparent in transparent PNG exports); ticks inside the band are skipped
- Everything maps through the shared piecewise `makeYMapper` — bars, stacks, lines, value labels, stack totals, waterfall connectors, arrows, and value lines all stay consistent, and dragging a value line still lands on the correct value through the broken scale
- Break settings persist and round-trip through JSON export/import; older saves load with the break disabled

---

## [2026-07-17] — Donut upgrades: slice explode, multi-ring, pie-of-pie

### Added
- **Click any slice** to open a popover with a recolor swatch, an **explode slider** (slides the slice outward along its mid-angle — guide ring and leader line follow), and a **Break out slice** button
- **Multi-ring mode** — up to three concentric rings; each item picks its ring, percentages are computed within each ring, and bands auto-thin to fit. The outer ring keeps draggable leader-line labels; inner rings label with % inside the arc
- **Pie-of-pie breakout** — one slice can break out into a secondary donut showing its composition, with connector lines from the slice edges and a mini legend; parts are edited in a new Breakout panel section
- All new fields (explode, ring, detail, multiRing) persist and round-trip through JSON export/import; existing saved donuts restore pixel-identical with everything off

---

## [2026-07-17] — Scatter / bubble chart builder

### Added
- **Scatter builder** (`scatter.html`) — X-Y point chart with color-coded series and per-series point tables (label / x / y / size)
  - **Bubble mode** — a size dimension mapped area-proportionally (√) onto a min/max radius range; toggle off for uniform dots
  - **Draggable point labels** with automatic leader lines once moved (same interaction as the donut builder)
  - **Quadrant lines** splitting at manual X/Y values or the data mean (BCG-matrix style)
  - Horizontal **value-line annotations** with draggable pills, both "nice" signed axes via `niceScale`, axis titles (Y rotated), legend with dot glyphs in 4 positions, grid, aspect ratios
  - Full persistence (`scatter-builder-v1`), PNG export (background / transparent), and JSON export/import (minimal `{ "series": [...] }` or full config; JSON paste is the bulk-entry path)
- `drawVLine()` in `shared.js` (vertical dashed reference line) and a Scatter entry in the launcher + shared nav

---

## [2026-07-17] — Annotations: CAGR/diff arrows and value lines

### Added
- **Growth / diff arrows** on combo and waterfall — think-cell-style arrows between two categories/bars with dashed risers and an auto-computed pill: **CAGR** (`+5.3% p.a.`), absolute **Δ**, or **%Δ**; undefined cases (e.g. CAGR over nonpositive values) render as `n/a`
  - Combo arrows can measure any series or the stack total (stacked modes) / first bar series (grouped); anchors follow stack tops in stacked and 100% modes
  - Waterfall arrows measure running levels — e.g. start total → end subtotal shows the whole bridge move
- **Value lines** — dashed horizontal reference lines (target/benchmark) with a label + value pill; combo lines can bind to the left or right axis
- **Drag on the chart** — grab an arrow pill to raise/lower the arrow, or a value-line pill to slide the line to a new value (snapped to a fraction of the axis step); the panel input tracks live
- Annotation cards in the side panel (metric/from/to/series pickers, value/label/axis, colors, delete); shared canvas primitives `drawArrow`, `drawValueLine`, `computeCAGR` in `shared.js`
- Annotations persist and round-trip through JSON export/import on both builders; older saves and imports without annotations load clean

---

## [2026-07-17] — Combo: stacked & 100% stacked bars, totals, segment labels

### Added
- **Bar mode** on the combo builder: Grouped (unchanged default), **Stacked**, and **100% stacked** (per-category normalization with a 0–100% left axis)
- **Stack totals** — automatic sum label above each stack
- **Segment labels** — per-series values or %-of-stack centered inside each segment, automatically hidden when a segment is too short to hold them
- Per-bar color overrides (click a bar) work on stacked segments too

### Changed
- Stacking locks bar series to the left axis (a stack needs one scale); their Left/Right toggle disables while stacked. Line series keep their axis
- Bar-gap slider hides in stacked modes (it only spaces bars within a group)
- Saved configs from before this change restore identically (grouped mode); negative values are skipped in stacked modes, matching grouped behavior

---

## [2026-07-17] — Waterfall chart builder

### Added
- **Waterfall builder** (`waterfall.html`) — think-cell-style bridge chart: each bar is a **delta** (floats on the running total, sign-colored), a **subtotal** (computed from the running total, read-only), or a **total** (restarts the running total)
  - Dashed connectors between bars at the running level; values crossing zero render naturally on a signed "nice" axis with an emphasized zero baseline
  - Signed value labels (`+30` / `−12`) with optional prefix/suffix, placed above upward and below downward bars
  - Role colors (increase / decrease / totals) plus per-bar overrides with reset-to-auto; ▲/▼ reordering; aspect-ratio, grid, title, and slider controls
  - Full persistence (`waterfall-builder-v1`), PNG export (background / transparent), and JSON export/import (minimal `{ "bars": [...] }` or full config)
- `niceScale()` in `shared.js` — signed nice-axis scale (zero always included) reused by upcoming stacked-combo and scatter work
- Launcher card on the home page and a Waterfall tab on all builders (via the shared `CHARTS` list)

---

## [2026-07-17] — Shared engine groundwork + donut JSON import/export

### Added
- **Donut JSON round-trip** — `Export JSON (data + config)` button and an `Import JSON…` panel on the donut builder, matching the combo builder; accepts minimal `{ "items": [...] }` data or a full exported config, with validation and clamped visual settings
- **Shared chart-tab navigation** — the tab strip on every builder is now generated from a single `CHARTS` list in `shared.js`; adding a chart page no longer requires editing every page's nav

### Changed
- Promoted common code from the builders into `shared.js`: font stack (`FF`), `fmtNum`, `isHex6`, `wrapLabel`, `drawValueLabel` (now takes an explicit font size), `makeSegToggle`, `ASPECTS`, `syncToggleBtn`, `bindStateToggle`, `bindBgControl`, and `initImportPanel` — groundwork for the upcoming waterfall and scatter builders
- Donut persistence now flows through a `getConfig()` snapshot (same pattern as combo) so localStorage and JSON export can't drift; saved configs from previous versions restore unchanged

---

## [2026-06-01] — Multi-chart builder: launcher + combo chart

### Added
- **Launcher hub** (`index.html`) — landing page with a card per chart type; pick Donut or Combo to open its builder
- **Combo chart builder** (`combo.html`) — category-based chart with **flexible series**: add any number of series, each individually toggled **bar** or **line**
  - **Single or dual Y-axis** — one shared scale, or assign each series to a left/right axis (for mixing units like count vs %)
  - **Value matrix** — compact series × category table for data entry; blank cells create gaps in line series
  - Display controls: grid, legend, value labels; bar width, line width, and axis/value/legend text-size sliders
  - PNG export (with background / transparent) at 2× and per-browser persistence (`combo-builder-v1`)
- **Shared foundation** — `shared.css` (dark UI) and `shared.js` (canvas setup, PNG export, persistence, palette, slider/toggle/swatch builders, `niceMax`) reused by both builders

### Changed
- The donut builder moved from `index.html` to `donut.html` and now uses the shared CSS/JS. Behavior and visuals are unchanged; existing saved charts are preserved (localStorage key `donut-builder-v1` kept)
- Documented GitHub Pages publishing; all links/assets are relative so the app works under a repo subpath

### Future (not yet implemented for combo)
- Draggable labels, stacked bars, negative-value baseline

---

## [2026-05-28] — Text controls & visibility toggles

### Added
- **Click-to-edit center text** — hover over the title, value, or subtitle inside the donut ring; cursor shows grab hand; click to focus the matching input in the panel
- **Visibility toggles** — `●/○` toggle button next to each Center Text field (Title, Value, Subtitle) and three toggles in the Chart panel for `%` text, Label text, and Value text across all segments
- **Text size sliders** — independently control the size of the `%` text, segment label text, and value text directly from the Chart panel
- **Per-user data persistence** — chart state (segments, colors, offsets, sliders, center text, background, visibility) is saved to `localStorage` and restored automatically on revisit; each browser keeps its own independent data

### Changed
- Reduced donut size relative to canvas (`outerR` 34% → 27% of reference dimension) for more breathing room around labels and edges

### Fixed
- `applyBgColor` no longer runs at script load time, preventing it from overwriting restored localStorage state with defaults
- Font size slider values were not being saved to localStorage; they are now persisted correctly

---

## [2026-05-28] — Interactive controls & visual polish

### Added
- **Ring thickness slider** — adjust the donut ring width from 4% to 30%
- **Rotation slider** — rotate the entire chart 0°–360°
- **Draggable labels** — click and drag any canvas label to reposition it; leader line follows
- **Click-to-edit labels** — clicking a canvas label focuses its text input in the side panel
- **Per-segment outer guide ring** — thin decorative arc outside each segment, colored to match, with `|` end caps and gaps between segments

### Changed
- Value field changed from number-only to text, allowing prefixes like `~` (e.g. `~600`)
- `~` prefix removed as a forced automatic addition — value is now displayed exactly as typed
- Canvas expanded to 1040×720 for more layout space
- Rendering scaled to device pixel ratio for sharp display on HiDPI / Retina screens

### Fixed
- Typing in value or percentage fields no longer loses focus after the first character (DOM was being fully rebuilt on every keystroke)

---

## [Initial] — First release

### Added
- Single-file donut chart builder (`index.html`), no install or server required
- Add / remove segments with label, optional value, and percentage
- Auto-calculate percentage from value; remaining % distributed proportionally across value-based segments
- Segment color pickers
- Center text: title, value, subtitle
- Background color picker with hex input
- Export PNG (with background) and Export PNG (transparent) at 2× resolution

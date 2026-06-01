# Changelog

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

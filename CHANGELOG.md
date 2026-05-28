# Changelog

## [Unreleased]

### Changed
- Reduced donut size relative to canvas for better breathing room around labels and edges

---

## [2025-05-28] — Interactive controls & visual polish

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

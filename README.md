# Chart Builder

A minimalist, browser-based chart builder. No install, no build step — open one HTML file and start designing. Two chart types so far:

- **Donut chart** — labeled, colored ring segments
- **Combo chart** — bars + line over categories, with single or dual Y-axis

## How to start

1. Clone the repo:
   ```bash
   git clone https://github.com/dstokaz/donut-builder.git
   cd donut-builder
   ```

2. Open `index.html` in your browser — that's the launcher. Pick a chart type. No server needed.

   Or serve it locally if you prefer:
   ```bash
   python3 -m http.server 8080
   # then open http://localhost:8080
   ```

## Run it live / publish

The whole app is static (plain HTML/CSS/JS, no build step), so it runs as-is on **GitHub Pages**:

1. Push the repo to GitHub.
2. Settings → Pages → Build from a branch → pick your branch and `/ (root)`.
3. Visit `https://<user>.github.io/<repo>/` — the launcher (`index.html`) is the entry point.

All links and assets are relative, so it works under the repo subpath. Each visitor's charts are saved in their own browser via `localStorage`; there's no backend.

## Chart types

### Donut chart (`donut.html`)
- **Segments** — add, remove segments with custom labels, values, and colors
- **Value or %** — enter a numeric value and the percentage is calculated automatically, or enter % directly
- **Draggable labels** — click and drag any label to reposition it on the canvas
- **Editable labels** — click a canvas label to focus its text field in the panel
- **Center text** — customizable title, value, and subtitle inside the donut
- **Text controls** — size sliders and show/hide toggles for `%`, label, and value text

### Combo chart (`combo.html`)
- **Categories** — define the shared X-axis points; add, rename, remove freely
- **Flexible series** — add any number of series; mark each one a **bar** or a **line**
- **Single or dual axis** — toggle a shared Y-axis or assign each series to a **left** or **right** axis (great for mixing units, e.g. count vs %)
- **Value matrix** — a compact table to enter each series' value per category
- **Display controls** — grid lines, legend, value labels; bar width, line width, and text-size sliders

### Both
- **Background color** — change via color picker or hex input
- **Export PNG** — at 2× resolution, with background or transparent
- **Per-browser persistence** — your chart is saved to `localStorage` and restored on revisit (each chart type keeps its own data)

## Usage tips

- Donut: type a plain number (`600`) or a prefixed value (`~600`) in the Value field — the `~` is shown as-is; leave Value blank and enter % directly to control a segment manually
- Combo: leave a value cell blank to create a gap in a line series
- Combo: turn off "Dual axis" to put every series on one shared scale; turn it on to split bars/line onto independent left/right scales
- Export a transparent PNG to drop the chart onto custom backgrounds in slides or design tools

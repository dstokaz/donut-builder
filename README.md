# Donut Builder

A minimalist, browser-based donut chart builder. No install, no build step — open one HTML file and start designing.

![Donut Builder preview](https://i.imgur.com/placeholder.png)

## How to start

1. Clone the repo:
   ```bash
   git clone https://github.com/dstokaz/donut-builder.git
   cd donut-builder
   ```

2. Open `index.html` in your browser — that's it. No server needed.

   Or serve it locally if you prefer:
   ```bash
   python3 -m http.server 8080
   # then open http://localhost:8080
   ```

## Features

- **Segments** — add, remove, and reorder segments with custom labels, values, and colors
- **Value or %** — enter a numeric value and the percentage is calculated automatically, or enter % directly
- **Draggable labels** — click and drag any label to reposition it on the canvas
- **Editable labels** — click a canvas label to focus its text field in the panel
- **Center text** — customizable title, value, and subtitle inside the donut
- **Background color** — change via color picker or hex input
- **Export PNG** — exports at 2× resolution with background
- **Export PNG (transparent)** — exports at 2× resolution with no background

## Usage tips

- Type a plain number (`600`) or a prefixed value (`~600`) in the Value field — the `~` is optional and displayed as-is on the chart
- Leave Value blank and enter % directly for segments you want to control manually
- Mix value-based and manual-% segments freely; the remaining percentage is distributed proportionally
- Drag labels anywhere on the canvas; the leader line follows automatically
- Export transparent PNG for use on custom backgrounds in presentations or design tools

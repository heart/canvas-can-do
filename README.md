# Canvas Can Do

Transform-based vector graphics editor engine for the web (PixiJS).

## Install

```bash
npm install canvas-can-do pixi.js
```

## Quick Start

```ts
import { CCDApp } from 'canvas-can-do';

const app = new CCDApp();
await app.init(document.getElementById('editor')!);

app.useTool('select');
```

## Key Features

- Shapes: rectangle, ellipse, line, star, text, image
- Transform tools: move, resize, rotate, multi-select
- Shift to constrain resize ratio
- Undo/redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y)
- Export: PNG/JPG/SVG (all objects or selection)
- Save/Load: JSON with embedded image data URLs
- Rulers with pan/zoom indicators

## API Highlights

```ts
// Tools
app.useTool('rectangle');

// Export raster (PNG/JPG)
const png = await app.exportRaster({ type: 'png', scope: 'all' });

// Export SVG (embed images)
const svg = await app.exportSVG({
  scope: 'selection',
  imageEmbed: 'display', // 'original' | 'display' | 'max'
  imageMaxEdge: 2048,
});

// Save/Load JSON (embedded images)
const doc = await app.exportJSON();
if (doc) await app.importJSON(doc);

// Access Pixi Application
const pixiApp = app.getPixiApp();
```

## Export Options

```ts
// Raster
exportRaster({
  type: 'png' | 'jpg',
  scope: 'all' | 'selection',
  quality?: number,        // for JPG
  padding?: number,        // extra pixels around bounds
  background?: string,     // e.g. '#ffffff'
});

// SVG
exportSVG({
  scope: 'all' | 'selection',
  padding?: number,
  background?: string,
  imageEmbed?: 'original' | 'display' | 'max',
  imageMaxEdge?: number,
});
```

## Events

```ts
editor.addEventListener('tool:changed', (e) => {
  console.log(e.detail.tool);
});

editor.addEventListener('layer:changed', (e) => {
  console.log(e.detail.hierarchy);
});

editor.addEventListener('viewport:changed', (e) => {
  console.log(e.detail); // { x, y, zoom, source }
});
```

## Notes

- Image sources are stored as **data URLs** for portability.
- Importing JSON resets pan/zoom to defaults.

## License

MIT

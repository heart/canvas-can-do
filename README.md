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

- Frame creation: via API (`addFrame`) and drag-to-draw frame tool (`useTool('frame')` / `F`)
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
app.useTool('frame'); // drag to draw a frame

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

// Layers (for external layer panel UIs)
const flatLayers = app.getFlatLayers({ recursive: true, topFirst: true });
const canMove = app.canMoveLayers(['node-a'], 'node-b', 'before');
if (canMove.ok) {
  await app.moveLayers(['node-a'], 'node-b', 'before');
}

// Frames
const frame = await app.addFrame({
  name: 'Frame 1',
  width: 1280,
  height: 720,
  backgroundColor: '#ffffff',
  borderColor: '#A0A0A0',
  borderWidth: 1,
  clipContent: true,
});
const frames = app.getFrames();
const framePng = await app.exportRaster({ type: 'png', scope: 'frame', frameId: frame?.id });
```

## Layer Reordering API

Use this API when your layer panel UI lives outside this library and you need a stable, id-based way to reorder layers and move nodes in/out of groups.

### Goals

- Keep UI code decoupled from Pixi internals
- Support reorder and reparent in one atomic operation
- Preserve visual placement when moving across parents/groups
- Keep undo/redo clean (`1 drop = 1 history entry`)

### Read Layers

```ts
const layers = app.getFlatLayers({
  parentId: null,   // null = root object layer
  recursive: true,  // include descendants
  topFirst: true,   // top-most first (panel-friendly)
});
```

Each item includes:

- `id`, `type`, `name`
- `parentId`, `depth`
- `zIndex`
- `isGroup`, `childCount`
- `visible`, `locked`

### Move Semantics

Position values:

- `'before'`: insert source before target in target's parent
- `'after'`: insert source after target in target's parent
- `'inside'`: insert source into target (target must be a group or frame)

Helpers:

```ts
const checkOne = app.canMoveLayer(sourceId, targetId, 'before');
const checkMany = app.canMoveLayers(sourceIds, targetId, 'inside');

if (checkMany.ok) {
  await app.moveLayers(sourceIds, targetId, 'inside');
}
```

Write methods:

- `moveLayer(sourceId, targetId, position, options?)`
- `moveLayers(sourceIds, targetId, position, options?)`

Options:

- `recordHistory?: boolean` (default `true`)

### Validation Rules

Move is rejected (`ok: false`) when:

- source/target ids are invalid
- source and target are the same node
- `position === 'inside'` but target is not a group/frame
- source node is locked
- destination parent is locked
- move would create a parent/child cycle (ancestor into descendant)
- moving a frame into non-root parent (frames are root-only)

### Atomic Move Behavior

`moveLayer(s)` performs one transaction-like operation:

1. Validate request
2. Normalize source list (avoid parent+child duplicate moves)
3. Resolve insertion index
4. Capture each source node world transform
5. Reparent/reorder
6. Re-apply transform in destination parent space (so node does not jump)
7. Emit `layer:changed`
8. Capture history (unless `recordHistory: false`)

This is what enables: selecting an item inside a group, dragging it above an external layer, and having it both leave the group and land at the correct z-order in one drop.

### Typical External UI Flow

```ts
// 1) render panel from library state
const layers = app.getFlatLayers({ recursive: true, topFirst: true });

// 2) while dragging, probe validity
const probe = app.canMoveLayers(dragSourceIds, hoverTargetId, hoverPosition);
showDropIndicator(probe.ok);

// 3) on drop, commit once
if (probe.ok) {
  await app.moveLayers(dragSourceIds, hoverTargetId, hoverPosition);
}

// 4) listen and re-render
app.addEventListener('layer:changed', () => {
  rerenderPanel(app.getFlatLayers({ recursive: true, topFirst: true }));
});
```

## Frame Concept (Figma-like)

`Frame` is different from `Group`.

- `Group`: logical grouping for transforming multiple nodes together
- `Frame`: a bounded working area with optional background and clipping

Think of `Frame` as an artboard/container that can also be used as an export boundary.

### Frame Behavior

- Frame is **root-only**:
  - cannot be grouped
  - cannot be child of group/frame
- Can contain child nodes (like a container)
- Has explicit `width` and `height`
- Supports background color or transparent background
- Supports clipping/masking at frame bounds (`clipContent`)
- Can be target of drag/drop reparent operations (`inside`)
- Can be used as export scope

### Drawing and Moving In/Out of Frame

- Frame can be created by API (`addFrame`) or drag tool (`frame` / `F`)
- Drawing non-frame shapes starts in the frame under pointer (if any), otherwise root canvas
- Drag/drop can move nodes into a frame (`inside`) or out of a frame (`before`/`after` against external target)
- Reparent + z-order update happen in one atomic operation
- World transform is preserved when reparenting so nodes do not visually jump
- Auto drag-reparent is blocked for group-managed nodes (group or descendants of group)

### Canvas Presentation (Editor Visual)

Frame should look visibly different from regular objects so users can immediately identify it as a working boundary.

- Visible frame border at all times (scale-aware stroke)
- Frame name label near top-left corner
- Optional background fill (or transparent mode)
- Clear visual cue when clipping is enabled
- Distinct `idle`, `hover`, `selected`, and `drop-target` states

Recommended editor-only rendering split:

- `FrameNode` for document content (background + children + clip)
- `FrameOverlay` for editor cues (border, label, highlight, drop indicator)

This keeps export output clean while still giving strong authoring feedback on canvas.

### Suggested Frame Visual States

- `idle`: neutral border, subtle label
- `hover`: stronger border to indicate targetability
- `selected`: accent border + resize handles + prominent label
- `drop-target`: temporary insertion highlight while dragging

### Export Semantics

- Support exporting by frame id (raster/SVG)
- If `clipContent=true`, export respects frame bounds
- If transparent background is selected, exported background remains transparent

### Suggested API Surface

```ts
// creation / query
const frame = await app.addFrame({
  name: 'Frame 1',
  x: 100,
  y: 80,
  width: 1280,
  height: 720,
  backgroundColor: '#ffffff', // null for transparent
  borderColor: '#A0A0A0',
  borderWidth: 1,
  clipContent: true,
});

const frames = app.getFrames();

// export by frame
const png = await app.exportRaster({
  type: 'png',
  scope: 'frame',
  frameId: frame.id,
});
```

## Export Options

```ts
// Raster
exportRaster({
  type: 'png' | 'jpg',
  scope: 'all' | 'selection' | 'frame',
  frameId?: string,        // required when scope === 'frame'
  quality?: number,        // for JPG
  padding?: number,        // extra pixels around bounds
  background?: string,     // e.g. '#ffffff'
});

// SVG
exportSVG({
  scope: 'all' | 'selection' | 'frame',
  frameId?: string,        // required when scope === 'frame'
  padding?: number,
  background?: string,
  imageEmbed?: 'original' | 'display' | 'max',
  imageMaxEdge?: number,
});
```

## Export Contract (Revision)

This section defines the intended behavior after introducing `Frame` as an artboard-like container.

### Scope Modes

- `scope: 'all'`
  - Export all root-level content.
- `scope: 'selection'`
  - Export only currently selected nodes (including selected container descendants when relevant).
- `scope: 'frame'`
  - Export by `frameId`.
  - Output bounds are always the frame boundary (`width/height`), not child bounds.

### Frame Export Rules

- `frameId` must exist and reference a frame node.
- Background behavior:
  - if frame background is set: render that color
  - if frame background is transparent: keep transparency for PNG/SVG
- Clipping behavior:
  - if `clipContent = true`: clip children to frame boundary
  - if `clipContent = false`: still keep output canvas as frame boundary, but children are rendered without clip (parts outside boundary are naturally cropped by output bounds)

### Format Notes

- `jpg` always exports opaque background (white fallback when transparent).
- `png` and `svg` preserve transparency when no background is set.

### Validation

Export should fail fast (`null` or error) when:

- `scope === 'frame'` but `frameId` is missing
- `frameId` does not exist
- referenced node is not a frame

## Save/Load Contract (Revision)

This section defines the document model expectations after adding frames and expanded layer behavior.

### Document Goals

- Preserve exact hierarchy (parent/child + order).
- Preserve per-node transform and visibility/locking.
- Preserve frame-specific properties and behavior.
- Keep backward compatibility with older documents where possible.
- Enforce frame root-only invariant on import/restore.

### Required Frame Fields (logical model)

- geometry: `x`, `y`, `width`, `height`
- transform: `rotation` (currently fixed to 0 by interaction), `scale`
- visibility/state: `visible`, `locked`
- frame style: `backgroundColor`, `borderColor`, `borderWidth`
- frame behavior: `clipContent`
- hierarchy: `children[]` in stable z-order

### Round-trip Invariants

After `exportJSON -> importJSON`:

- node count and hierarchy must match
- z-order must match
- frame bounds/style/clip settings must match
- locked/visible state must match
- export output for same scope should remain equivalent
- frame never appears as a child of group/frame after import normalization

### Versioning and Migration

- Current baseline is `document.version = 1` only.
- Keep schema simple while not in production.
- If schema changes later, introduce migrations in the next version.

Import normalization defaults for frame fields:

- `backgroundColor = '#ffffff'`
- `borderColor = '#A0A0A0'`
- `borderWidth = 1`
- `clipContent = true`

### Post-change Checklist

- Verify `all/selection/frame` export for PNG/JPG/SVG.
- Verify frame with `clipContent` on/off.
- Verify frame remains root-only after save/load.
- Verify lock/visible states survive save/load.
- Verify undo/redo still works immediately after load.

## Interaction Policy

- Group-first hit test: pointer hover/click on a group or any descendant selects the group.
- Frame-child-first hit test: inside frame, children are preferred over selecting frame body.
- Layer panel/API can still select specific child ids directly (`selectNodeById` / `selectNodesById`).

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

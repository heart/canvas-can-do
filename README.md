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
- Save/Load: JSON with embedded image data URLs + per-node export settings
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

// Per-node export presets (persisted in exportJSON/importJSON)
await app.setNodeExportSettings(frame.id, {
  presets: [
    { id: 'png-1x', format: 'png', scale: 1, suffix: '' },
    { id: 'png-2x', format: 'png', scale: 2, suffix: '@2x' },
    { id: 'svg', format: 'svg', scale: 1, suffix: '' },
  ],
});
const asset = await app.exportNodeByPreset(frame.id, { presetId: 'png-2x' });
if (asset?.contentType === 'dataUrl') {
  // asset.content => data URL
}

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
  scale?: number,          // output pixel ratio, e.g. 1/2/3
  padding?: number,        // extra pixels around bounds
  background?: string,     // e.g. '#ffffff'
});

// SVG
exportSVG({
  scope: 'all' | 'selection' | 'frame',
  frameId?: string,        // required when scope === 'frame'
  padding?: number,
  scale?: number,          // width/height multiplier (viewBox unchanged)
  background?: string,
  imageEmbed?: 'original' | 'display' | 'max',
  imageMaxEdge?: number,
});
```

## Node Export Presets (Figma-like)

Presets are stored in a centralized document-level registry (`exportStore`) and linked to nodes by id.
This keeps lookup/edit fast and avoids recursive node scans.

```ts
type NodeExportPreset = {
  id: string;
  format: 'png' | 'jpg' | 'svg';
  scale: number;
  suffix: string; // e.g. '', '@2x'
  quality?: number; // jpg
  padding?: number;
  backgroundMode?: 'auto' | 'transparent' | 'solid';
  backgroundColor?: string; // used when backgroundMode = 'solid'
  imageEmbed?: 'original' | 'display' | 'max'; // svg
  imageMaxEdge?: number; // svg
};
```

### Preset APIs

```ts
// read
const settings = app.getNodeExportSettings(nodeId);

// replace full settings
await app.setNodeExportSettings(nodeId, {
  presets: [
    { id: 'png-1x', format: 'png', scale: 1, suffix: '' },
    { id: 'png-2x', format: 'png', scale: 2, suffix: '@2x' },
    { id: 'svg', format: 'svg', scale: 1, suffix: '' },
  ],
});

// insert/update one preset by id
await app.upsertNodeExportPreset(nodeId, {
  id: 'png-3x',
  format: 'png',
  scale: 3,
  suffix: '@3x',
});

// edit a preset entity directly (affects all linked nodes using this preset id)
await app.updateExportPreset(`${nodeId}:png-2x`, {
  scale: 2,
  suffix: '@2x',
});

// inspect linked nodes before editing shared presets
const usedBy = app.getExportPresetUsage(`${nodeId}:png-2x`);

// export one node using its preset
const asset = await app.exportNodeByPreset(nodeId, { presetId: 'png-2x' });
if (asset) {
  // asset.filename, asset.mimeType, asset.contentType, asset.content
}

// export many nodes in one call
const assets = await app.exportNodesByPreset([
  { nodeId: frameA, presetId: 'png-1x' },
  { nodeId: frameB, presetId: 'svg' },
]);
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

### Server Persistence Flow

Use `exportJSON()` as the payload to your backend.  
This payload now includes `exportStore` (preset registry + node links), so loading back with `importJSON()` restores export presets too.
Legacy documents that previously stored `node.exportSettings` are still accepted and migrated at import time.

```ts
// save
const doc = await app.exportJSON();
await fetch('/api/documents/123', {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(doc),
});

// load
const loaded = await fetch('/api/documents/123').then((r) => r.json());
await app.importJSON(loaded);
```

### Round-trip (including export presets)

After `exportJSON -> save to server -> load from server -> importJSON`:

- node hierarchy/order must match
- frame properties must match
- export registry + node links must match (`id/format/scale/suffix/...`)
- exporting the same node + preset should produce equivalent output

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

## UI Recommendation (Figma-like Export)

Suggested UX in the right sidebar when 1 node is selected:

1. Section title: `Export`
2. List rows: one row per preset (`PNG 1x`, `PNG 2x`, `SVG`)
3. Each row editable: `format`, `scale`, `suffix`, advanced options
4. Row actions: duplicate / delete preset
5. Primary button: `Export <NodeName>` (export selected preset)
6. Secondary button: `Export All` (all presets for current node)

Suggested UI behavior:

- Auto-save preset edits immediately via `setNodeExportSettings` / `upsertNodeExportPreset`
- Keep preset `id` stable; use `id` for persistence and updates (shared ids = shared edits)
- Show final filename preview from `name + suffix + extension`
- When exporting multiple selected nodes, call `exportNodesByPreset`

## Implementation Guide

1. Add an `ExportPanel` in your inspector that reads `getNodeExportSettings(nodeId)`.
2. Bind form fields to preset objects and debounce writes to `setNodeExportSettings`.
3. On export click, call `exportNodeByPreset(nodeId, { presetId })`.
4. If `asset.contentType === 'dataUrl'`, download with anchor `href = dataUrl`.
5. If `asset.contentType === 'text'` (SVG), create `Blob([asset.content], { type: asset.mimeType })`.
6. For batch export, call `exportNodesByPreset` then zip/download in your app shell.

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

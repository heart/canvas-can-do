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
- Export: PNG/JPG/SVG via node-linked presets
- Save/Load: JSON with embedded image data URLs + document export preset store
- Rulers with pan/zoom indicators

## API Highlights

```ts
// Tools
app.useTool('rectangle');
app.useTool('frame'); // drag to draw a frame

// Save/Load JSON (embedded images)
const doc = await app.exportJSON();
if (doc) await app.importJSON(doc);

// Frames
const frame = await app.addFrame({
  name: 'Frame 1',
  width: 1280,
  height: 720,
  backgroundColor: '#ffffff',
  clipContent: true,
});
const frames = app.getFrames();

// Document export preset store linked to node ids (persisted in exportJSON/importJSON)
const preset = await app.addExportSetting(frame!.id, {
  format: 'png',
  scale: 2,
  suffix: '@2x',
});
const asset = preset ? await app.exportNodeByPreset(frame!.id, preset.id) : null;
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
- Can be used as export target node for preset-based export

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
  clipContent: true,
});

const frames = app.getFrames();

// export by preset
const pngPreset = await app.addExportSetting(frame.id, { format: 'png', scale: 1, suffix: '' });
const pngAsset = pngPreset ? await app.exportNodeByPreset(frame.id, pngPreset.id) : null;
```

## Export Presets (Figma-like)

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
// add preset and link to node
const added = await app.addExportSetting(nodeId, {
  format: 'png',
  scale: 1,
  suffix: '',
});

// get preset entity by id
const preset = app.getExportSettingById(added!.id);

// edit preset entity
await app.editExportSetting(added!.id, {
  scale: 2,
  suffix: '@2x',
});

// list preset ids linked to a node
const presetIds = app.getExportSettingIds(nodeId);

// list all presets in document (without scanning nodes manually)
const allPresets = app.getAllExportSettings();
// [{ id, preset, linkedNodeIds }]

// inspect linked nodes before editing shared presets
const usedBy = app.getExportPresetUsage(preset!.id);

// export one node using its preset
const asset = await app.exportNodeByPreset(nodeId, preset!.id);
if (asset) {
  // asset.filename, asset.mimeType, asset.contentType, asset.content
}

// export many nodes in one call
const frameAPreset = await app.addExportSetting(frameA, { format: 'png', scale: 1, suffix: '' });
const frameBPreset = await app.addExportSetting(frameB, { format: 'svg', scale: 1, suffix: '' });
const assets = await app.exportNodesByPreset([
  { nodeId: frameA, presetId: frameAPreset!.id },
  { nodeId: frameB, presetId: frameBPreset!.id },
]);

// delete preset entity (and unlink from all nodes)
await app.deleteExportSetting(added!.id);
```

## Export Contract

Preset-first only:

- Create preset via `addExportSetting(nodeId, preset)`
- Edit/delete via `editExportSetting` / `deleteExportSetting`
- Export only via `exportNodeByPreset(nodeId, presetId)` or `exportNodesByPreset(...)`
- `presetId` must be explicitly provided and linked to that node

Format behavior:

- `jpg` should use opaque background (`backgroundMode: 'solid'`, `backgroundColor`)
- `png` / `svg` can keep transparency with `backgroundMode: 'auto'` or `'transparent'`

## Save/Load Contract (Revision)

This section defines the document model expectations after adding frames and expanded layer behavior.

### Document Goals

- Preserve exact hierarchy (parent/child + order).
- Preserve per-node transform and visibility/locking.
- Preserve frame-specific properties and behavior.
- Enforce frame root-only invariant on import/restore.

### Required Frame Fields (logical model)

- geometry: `x`, `y`, `width`, `height`
- transform: `rotation` (currently fixed to 0 by interaction), `scale`
- visibility/state: `visible`, `locked`
- frame style: `backgroundColor`
- frame behavior: `clipContent`
- hierarchy: `children[]` in stable z-order

### Round-trip Invariants

After `exportJSON -> importJSON`:

- node count and hierarchy must match
- z-order must match
- frame bounds/style/clip settings must match
- locked/visible state must match
- export output for same node + preset should remain equivalent
- frame never appears as a child of group/frame after import normalization

### Versioning and Migration

- Current baseline is `document.version = 1` only.
- Keep schema simple while not in production.
- If schema changes later, introduce migrations in the next version.

Import normalization defaults for frame fields:

- `backgroundColor = '#ffffff'`
- `clipContent = true`

### Server Persistence Flow

Use `exportJSON()` as the payload to your backend.  
This payload now includes `exportStore` (preset registry + node links), so loading back with `importJSON()` restores export presets too.

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

- Verify preset-based export for PNG/JPG/SVG on target nodes.
- Verify frame with `clipContent` on/off.
- Verify frame remains root-only after save/load.
- Verify lock/visible states survive save/load.
- Verify undo/redo still works immediately after load.

## Interaction Policy

- Group-first hit test: pointer hover/click on a group or any descendant selects the group.
- Frame-child-first hit test: inside frame, children are preferred over selecting frame body.
- Frame body selection is intentionally disabled on canvas hit-test; select frame via label or layer/API.
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

- Auto-save preset edits immediately via `addExportSetting` / `editExportSetting` / `deleteExportSetting`
- Keep preset `id` stable; use `id` for persistence and updates (shared ids = shared edits)
- Export requires explicit `presetId` linked to that node (no implicit fallback preset)
- Show final filename preview from `name + suffix + extension`
- When exporting multiple selected nodes, call `exportNodesByPreset`

## Implementation Guide

1. Add an `ExportPanel` in your inspector that reads `getAllExportSettings()` for document-level preset list, and `getExportSettingIds(nodeId)` for per-node links.
2. Bind form fields to preset objects and debounce writes to `editExportSetting`.
3. On export click, call `exportNodeByPreset(nodeId, presetId)`.
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

# PixiJS — LLM-Friendly Coding Reference (Editor-Focused Reduced Doc)

> Reduced technical reference for building editor-style apps (canvas editor, Figma-like tools, UI layers).  
> This document keeps only practical APIs and patterns needed for real coding.

---

# 1. Application

## Create App

```ts
const app = new Application();

await app.init({
  width: 1280,
  height: 800,
  background: '#1e1e1e',
  antialias: true,
});

document.body.appendChild(app.canvas);
```

## Common Options

```
width
height
background
resolution
autoDensity
antialias
preference: 'webgl' | 'webgpu'
```

---

# 2. Scene Structure (Editor Layout)

Recommended editor structure:

```ts
app.stage
 ├─ objectLayer
 ├─ toolsLayer
 ├─ previewLayer
 └─ helperLayer
```

Example:

```ts
const objectLayer = new Container();
const toolsLayer = new Container();
const previewLayer = new Container();
const helperLayer = new Container();

app.stage.addChild(objectLayer);
app.stage.addChild(toolsLayer);
app.stage.addChild(previewLayer);
app.stage.addChild(helperLayer);
```

---

# 3. Container (Scene Node)

```ts
const node = new Container();

node.x = 100;
node.y = 200;
node.scale.set(1.5);
node.rotation = 0.2;
node.alpha = 1;
node.visible = true;
```

Enable zIndex sorting:

```ts
container.sortableChildren = true;
sprite.zIndex = 10;
```

---

# 4. Sprite

## Create Sprite

```ts
const texture = await Assets.load('/img.png');
const sprite = new Sprite(texture);

sprite.anchor.set(0.5);
sprite.position.set(400, 300);

objectLayer.addChild(sprite);
```

Common properties:

```
anchor
width / height
rotation
scale
tint
alpha
```

---

# 5. Graphics (Editor Preview / Shape Tool)

```ts
const g = new Graphics();

g.rect(0, 0, 100, 100);
g.fill(0xff0000);

previewLayer.addChild(g);
```

Dynamic preview:

```ts
g.clear();
g.rect(x, y, w, h);
g.stroke({ width: 2, color: 0xffffff });
```

---

# 6. Text

```ts
const label = new Text({
  text: 'Layer Name',
  style: {
    fontSize: 14,
    fill: 0xffffff,
  },
});

helperLayer.addChild(label);
```

⚠️ Avoid updating text every frame.

---

# 7. Assets Loading

```ts
await Assets.load('/a.png');
```

Multiple:

```ts
await Assets.load(['/a.png', '/b.png']);
```

Create texture directly:

```ts
const tex = Texture.from('/img.png');
```

---

# 8. Events (Pointer System)

Enable interaction:

```ts
sprite.eventMode = 'static';
sprite.cursor = 'pointer';
```

Events:

```ts
sprite.on('pointerdown', onDown);
sprite.on('pointermove', onMove);
sprite.on('pointerup', onUp);
```

eventMode values:

```
none
passive
static
dynamic
```

---

# 9. Ticker (Update Loop)

```ts
app.ticker.add((delta) => {
  // animation or state update
});
```

Remove:

```ts
app.ticker.remove(fn);
```

---

# 10. Editor Interaction Pattern

## Pointer State Machine (Recommended)

```ts
type InteractionState =
  | { kind: 'idle' }
  | { kind: 'dragging'; target: Container }
  | { kind: 'drawing'; start: { x: number; y: number } };
```

Avoid storing logic inside display objects.

Keep controller separate.

---

# 11. Render Order

## zIndex

```ts
container.sortableChildren = true;
sprite.zIndex = 100;
```

## Layer Separation

Preferred for editors:

```
objectLayer → real content
previewLayer → temporary shapes
helperLayer → guides / measurement
```

---

# 12. Render Groups (Performance)

```ts
container.isRenderGroup = true;
```

Use when:

```
UI layer
static background
large subtree
```

Avoid too many render groups.

---

# 13. Masking

```ts
sprite.mask = graphics;
```

Costly if animated every frame.

---

# 14. Filters

```ts
sprite.filters = [new BlurFilter()];
```

Use sparingly.

---

# 15. Memory Management

Destroy unused objects.

```ts
sprite.destroy();
container.destroy({ children: true });
texture.destroy();
```

Common leaks in editors:

```
preview Graphics not cleared
temporary textures
hidden containers not destroyed
```

---

# 16. Export / Render to Texture (Editor Use)

```ts
const rt = app.renderer.generateTexture(targetContainer);
```

Export bitmap:

```ts
app.renderer.extract.canvas(targetContainer);
```

Transparent background:

```ts
await app.init({
  backgroundAlpha: 0,
});
```

---

# 17. Coordinate Utilities

Global position:

```ts
const global = sprite.getGlobalPosition();
```

Local transform:

```ts
container.toLocal(point);
container.toGlobal(point);
```

---

# 18. Performance Guidelines (Editor Context)

Good:

```
reuse Graphics instance
batch sprites
limit text redraw
separate preview layer
```

Avoid:

```
creating Graphics each pointer move
deep container nesting
changing filters every frame
```

---

# 19. Minimal Editor Skeleton

```ts
const app = new Application();
await app.init({ width: 800, height: 600 });

document.body.appendChild(app.canvas);

const objectLayer = new Container();
const previewLayer = new Container();

app.stage.addChild(objectLayer);
app.stage.addChild(previewLayer);

const texture = await Assets.load('/bunny.png');
const sprite = new Sprite(texture);

objectLayer.addChild(sprite);

app.ticker.add(() => {
  // editor update
});
```

---

# 20. Mental Model (Editor Build)

```
Application = renderer + ticker
Stage = root
Container = node / layer
Graphics = tool preview
Sprite = asset object
Ticker = update loop
Renderer.extract = export
destroy() = memory control
```

---

# PixiJS Editor Architecture Reference

> Patterns for building canvas editors (Figma-like / CCDApp-style).
> Focused on interaction architecture — not PixiJS basics.

This document covers:

- TransformHandle pattern
- Selection Overlay Layer
- PointerController structure
- Object vs Tool rendering separation
- Export bitmap ignoring overlay

---

# 1. Layer Architecture (Foundation)

Recommended stage structure:

```

stage
├─ objectLayer        (real content)
├─ toolLayer          (tool UI / handles)
├─ previewLayer       (temporary drawing)
└─ helperLayer        (guides / measurements)

```

Example:

```ts
const objectLayer = new Container();
const toolLayer = new Container();
const previewLayer = new Container();
const helperLayer = new Container();

app.stage.addChild(objectLayer);
app.stage.addChild(toolLayer);
app.stage.addChild(previewLayer);
app.stage.addChild(helperLayer);
```

Rule:

```
objectLayer = persistent data
tool/preview/helper = ephemeral UI
```

---

# 2. TransformHandle Pattern

## Goal

Separate transformation UI from object logic.

Do NOT attach handles inside the object itself.

```
ObjectNode (data)
TransformHandle (UI controller)
```

---

## Structure

```ts
class TransformHandle extends Container {
  target: Container | null = null;
  box = new Graphics();
}
```

Attach to toolLayer:

```ts
toolLayer.addChild(transformHandle);
```

---

## Bind Target

```ts
setTarget(node: Container | null) {
  this.target = node
  this.updateBox()
}
```

---

## Update Visual

```ts
updateBox() {
  if (!this.target) return

  const bounds = this.target.getBounds()

  this.box.clear()
  this.box.rect(bounds.x, bounds.y, bounds.width, bounds.height)
  this.box.stroke({ width:1, color:0xffffff })
}
```

Call after:

```
move
scale
rotate
selection change
```

---

## Drag Handle Logic

Handles should emit intent:

```
scaleStart
scaleMove
scaleEnd
```

Avoid mutating object inside handle class directly.

---

# 3. Selection Overlay Layer

## Concept

Selection visuals must NOT live inside objectLayer.

```
objectLayer → real render
toolLayer   → selection visuals
```

Benefits:

```
export clean
no object mutation
easy toggle
```

---

## Selection Manager Example

```ts
class SelectionOverlay {
  selected: Container[] = [];
}
```

Render boxes:

```ts
function drawSelection(node: Container) {
  const g = new Graphics();
  const b = node.getBounds();

  g.rect(b.x, b.y, b.width, b.height);
  g.stroke({ width: 1, color: 0x00ffff });

  toolLayer.addChild(g);
}
```

Clear overlay each frame or when selection changes.

---

## Multi Selection

Do NOT create handles per object.

Create:

```
1 overlay container
N visual boxes
```

---

# 4. PointerController Structure

## Principle

Centralize pointer logic.

Avoid:

```
sprite.on(pointerdown) everywhere
```

Use single controller:

---

## State Model

```ts
type PointerState =
  | { kind: 'idle' }
  | { kind: 'drag-object'; target: Container; start: { x: number; y: number } }
  | { kind: 'draw-rect'; start: { x: number; y: number } };
```

---

## Controller Skeleton

```ts
class PointerController {
  state: PointerState = { kind: 'idle' };

  onDown(e) {}
  onMove(e) {}
  onUp(e) {}
}
```

Bind once:

```ts
app.stage.eventMode = 'static';
app.stage.on('pointerdown', controller.onDown);
app.stage.on('pointermove', controller.onMove);
app.stage.on('pointerup', controller.onUp);
```

---

## Hit Testing Pattern

```ts
const hit = objectLayer.children.find((n) => n.containsPoint(pos));
```

Controller decides behavior:

```
select
drag
start tool
```

---

# 5. Object vs Tool Rendering Separation

## Rule

Never mix tool visuals into objectLayer.

Bad:

```
objectLayer
  ├─ sprite
  └─ resizeHandle
```

Good:

```
objectLayer → sprite
toolLayer   → resizeHandle
```

---

## Visibility Control

```ts
toolLayer.visible = isEditMode;
previewLayer.visible = toolActive;
```

---

## Update Flow

```
PointerController → update state
TransformHandle → reflect selection
previewLayer → temporary drawing
objectLayer → only final objects
```

---

# 6. Export Bitmap (Ignore Overlay)

## Problem

Editor UI must not appear in exported image.

Solution:

Render ONLY objectLayer.

---

## Method 1 — generateTexture

```ts
const texture = app.renderer.generateTexture(objectLayer);
```

Export canvas:

```ts
const canvas = app.renderer.extract.canvas(objectLayer);
```

---

## Method 2 — Temporary Visibility Switch

```ts
toolLayer.visible = false;
previewLayer.visible = false;
helperLayer.visible = false;

const canvas = app.renderer.extract.canvas(app.stage);

toolLayer.visible = true;
previewLayer.visible = true;
helperLayer.visible = true;
```

Prefer Method 1 when possible.

---

## Transparent Background Export

```ts
await app.init({
  backgroundAlpha: 0,
});
```

---

# 7. Preview Drawing Pattern (Rectangle Tool Example)

```ts
previewGraphics.clear();
previewGraphics.rect(x, y, w, h);
previewGraphics.stroke({ width: 1, color: 0xffffff });
```

Never create new Graphics every pointer move.

Reuse instance.

---

# 8. Common Editor Pitfalls

```
✗ attaching interaction to every object
✗ recreating Graphics each frame
✗ mixing overlay into object tree
✗ exporting full stage
```

---

# 9. Minimal Editor Architecture Overview

```
PointerController
    ↓
SelectionManager
    ↓
TransformHandle (toolLayer)
    ↓
objectLayer (data only)
```

---

# AGENT.md — Canvas Can Do

## Project Overview
**Canvas Can Do** is a modern, transform-based **vector graphics editor engine** for the web.

The core of the project is built around a powerful Transform2D system that provides:
- Matrix-based transformations (scale, rotation, translation)
- Pivot point handling
- Chainable transform operations
- Clean mathematical foundation

This project intentionally avoids tight coupling with UI frameworks (Vue/React/etc.).
UI layers should act as **hosts**, not as part of the engine logic.

---

## Core Principles

### 1. Engine-first, UI-second
- The editor engine must be usable without any framework.
- No dependency on Vue/React reactivity.
- UI communicates with the engine via **commands and events**, not direct state mutation.

### 2. World Space vs Viewport Space
- All document data lives in **world coordinates**.
- Viewport (pan/zoom) is a separate concern.
- Canvas resize must never affect document geometry.

### 3. Object-based (Not Pixel-based)
- Every drawable entity is an object (node).
- No drawing-by-side-effects.
- All rendering derives from document state.

### 4. Deterministic Transforms
- All transforms are matrix-based.
- No implicit position mutation.
- Selection transforms apply via world-delta math, not DOM tricks.

---

## Architecture

```
src/
 ├─ core/                # Engine core (no rendering dependency)
 │   ├─ Document.ts
 │   ├─ Node.ts
 │   ├─ Selection.ts
 │   ├─ Transform.ts
 │   └─ commands/
 │
 ├─ renderer/
 │   └─ pixi/            # PixiJS renderer + overlay tools
 │       ├─ PixiRenderer.ts
 │       ├─ TransformGizmo.ts
 │       └─ HitTest.ts
 │
 ├─ input/
 │   └─ PointerController.ts
 │
 ├─ index.ts             # Public library entry
 ├─ main.ts              # Demo / playground only
 └─ index.html           # Demo host
```

---

## Rendering Strategy

- PixiJS (WebGL) is used as the **default renderer**
- Rendering is split into layers:
  - content layer (actual objects)
  - overlay layer (selection box, transform handles, guides)

Overlay rendering must:
- exist in world/root coordinates
- never mutate document state directly
- be disposable and stateless

---

## Selection & Transform Model

- All transforms operate through a **selection abstraction**
- Even single-object transforms are treated as selection transforms
- Two supported strategies:
  - **Controller-based transform** (no reparenting, preferred)
  - Temporary grouping (allowed in early stages)

Matrix rule (core invariant):

```
W_new = Δ * W_old
L_new = inverse(P_world) * W_new
```

This rule must remain valid regardless of nesting depth.

---

## Text Editing Policy

- Text rendering is handled by the renderer (e.g. Pixi.Text)
- **Live text editing is NOT implemented inside the engine**
- Editing uses native HTML input/textarea overlays
- Engine only consumes the final committed text value

This ensures:
- proper IME support (Thai, CJK, etc.)
- correct selection / caret behavior
- reduced engine complexity

---

## Build & Tooling

- Language: **TypeScript**
- Bundler: **Vite (library mode)**
- Output: ESM + type definitions
- No framework assumptions in build output

Experimental tooling (e.g. rolldown-vite) may be used **only** in demos or experiments, never as the core build dependency.

---

## Non-Goals (Explicit)

Canvas Can Do is **NOT**:
- a DOM/SVG-based editor
- a UI framework
- a Figma clone UI-wise
- a raster/photo editor

This project focuses on **engine correctness and interaction fidelity**, not visual polish.

---

## Long-term Direction

Possible future extensions (non-binding):
- WebGL-native renderer (no Pixi)
- WASM-powered geometry operations
- CRDT-based collaboration layer
- Headless rendering / export pipeline

These must never compromise the simplicity of the core engine.

---

## Philosophy

> “If the math is correct, the UI will follow.”

Canvas Can Do prioritizes:
- predictable behavior
- explicit state transitions
- minimal magic

Every abstraction must justify its existence.

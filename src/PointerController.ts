import { PreviewRect } from './core/nodes/preview/PreviewRect';
import { PreviewEllipse } from './core/nodes/preview/PreviewEllipse';
import { PreviewLine } from './core/nodes/preview/PreviewLine';
import { PreviewStar } from './core/nodes/preview/PreviewStar';
import { PreviewBase } from './core/nodes/preview/PreviewBase';
import { SelectionManager } from './core/selection/SelectionManager';
import { BaseNode } from './core/nodes/BaseNode';

import type { ToolName } from './index';
import { Container, Point, Graphics, Text } from 'pixi.js';
import { RectangleNode } from './core/nodes/RectangleNode';
import { EllipseNode } from './core/nodes/EllipseNode';
import { LineNode } from './core/nodes/LineNode';
import { StarNode } from './core/nodes/StarNode';
import { TextNode } from './core/nodes/TextNode';
import { FrameNode } from './core/nodes/FrameNode';
import { GroupNode } from './core/nodes/GroupNode';
import { Application } from 'pixi.js';

export class PointerController {
  private preview: PreviewBase;
  private activeTool: ToolName = 'select';

  //previewLayer is the layer that use to draw preview only
  private previewLayer: Container;

  //objectLayer is the layer that we draw the real object here
  private objectLayer: Container;
  private toolsLayer: Container;

  private selectionManager: SelectionManager;
  private hoverGraphics: Graphics;
  private frameLabelLayer: Container;
  private frameLabelItems = new Map<
    string,
    { bg: Graphics; label: Text; bounds: { x: number; y: number; width: number; height: number } }
  >();
  private frameLabelOrder: string[] = [];
  private frameNodesById = new Map<string, FrameNode>();
  private hoveredNode: BaseNode | null = null;
  private hoveredBounds: { x: number; y: number; width: number; height: number } | null = null;
  private clipboard: BaseNode[] = [];
  private onLayerChanged: () => void;
  private isPanning = false;
  private lastPan?: Point;
  private app?: Application;
  private world?: Container;
  private eventTarget = new EventTarget();
  private activeTextInput?: HTMLInputElement;
  private onHistoryCapture?: () => void | Promise<void>;
  private shortcutsEnabled = true;
  private activeTransformHandle: string | null = null;
  private transformStartClient: Point | null = null;
  private transformMoved = false;
  private dropTargetFrameId: string | null = null;
  private drawingParentFrameId: string | null = null;

  private isPanModeActive(): boolean {
    return this.isPanning || this.activeTool === 'pan';
  }

  constructor(
    previewLayer: Container,
    objectLayer: Container,
    toolsLayer: Container,
    onLayerChanged: () => void,
    app?: Application,
    world?: Container,
    onHistoryCapture?: () => void | Promise<void>,
    eventTarget?: EventTarget
  ) {
    this.previewLayer = previewLayer;
    this.objectLayer = objectLayer;
    this.toolsLayer = toolsLayer;
    this.onLayerChanged = onLayerChanged;
    this.app = app;
    this.world = world;
    this.onHistoryCapture = onHistoryCapture;

    this.selectionManager = new SelectionManager(toolsLayer, eventTarget ?? this.eventTarget);
    this.hoverGraphics = new Graphics();
    this.frameLabelLayer = new Container();
    this.toolsLayer.addChild(this.hoverGraphics);
    this.toolsLayer.addChild(this.frameLabelLayer);

    this.preview = new PreviewRect(previewLayer);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    this.eventTarget.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) {
    this.eventTarget.removeEventListener(type, listener, options);
  }

  dispatchEvent(event: Event): boolean {
    return this.eventTarget.dispatchEvent(event);
  }

  clearSelection() {
    this.selectionManager.clear();
  }

  getSelectedNodes() {
    return this.selectionManager.getSelectedNodes();
  }

  selectNode(node: BaseNode | null) {
    this.selectionManager.select(node);
  }

  selectNodes(nodes: BaseNode[]) {
    this.selectionManager.selectMany(nodes);
  }

  setHoverNode(node: BaseNode | null) {
    this.updateHover(node, true);
  }

  setShortcutsEnabled(enabled: boolean) {
    this.shortcutsEnabled = enabled;
  }

  setObjectSnapEnabled(enabled: boolean) {
    this.selectionManager.setObjectSnapEnabled(enabled);
  }

  getSelectionBounds() {
    if (this.selectionManager.getSelectedNodes().length === 0) return null;
    return this.selectionManager.getSelectionBounds();
  }

  handleKeyDown(e: KeyboardEvent) {
    if (!this.shortcutsEnabled) {
      return;
    }
    if (this.isEditingText()) {
      return;
    }

    if (this.activeTextInput) {
      return;
    }

    if (e.key === 'Shift') {
      if ('setShiftKey' in this.preview) {
        (this.preview as any).setShiftKey(true);
      }
      this.selectionManager.setMultiSelect(true);
      this.selectionManager.setShiftKey(true);
    }

    // Delete selected nodes
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const removed = this.selectionManager.deleteSelected(this.objectLayer);
      if (removed.length) {
        e.preventDefault();
        this.onHistoryCapture?.();
      }
    }

    // Copy (Ctrl/Cmd + C)
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.clipboard = this.selectionManager.getSelectedNodes();
    }

    // Paste (Ctrl/Cmd + V)
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const pasted: BaseNode[] = [];
      const offset = 12;
      this.clipboard.forEach((node) => {
        const clone = this.cloneNode(node, offset, offset);
        if (clone) {
          this.objectLayer.addChild(clone);
          pasted.push(clone);
        }
      });

      if (pasted.length) {
        this.selectionManager.setMultiSelect(true);
        pasted.forEach((node) => this.selectionManager.select(node));
        this.selectionManager.setMultiSelect(false);
        this.onLayerChanged();
        this.onHistoryCapture?.();
      }
    }

    // Group shortcut (Ctrl+G or Cmd+G)
    if (e.key === 'g' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      const group = this.selectionManager.createGroup();
      if (group) {
        this.onLayerChanged();
        this.onHistoryCapture?.();
      }
    }

    // Ungroup shortcut (Ctrl+Shift+G or Cmd+Shift+G)
    if (e.key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      const ungrouped = this.selectionManager.ungroupSelected();
      if (ungrouped.length) {
        this.onLayerChanged();
        this.onHistoryCapture?.();
      }
    }

    // Reorder shortcuts: Ctrl/Cmd + ArrowUp/ArrowDown
    if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const direction = e.key === 'ArrowUp' ? 1 : -1; // swap: Up moves forward, Down moves backward
      const moved = this.selectionManager.reorderSelected(this.objectLayer, direction);
      if (moved) {
        this.onHistoryCapture?.();
      }
    }

    // Nudge with Arrow keys (no Ctrl/Cmd): move selection
    if (
      !e.ctrlKey &&
      !e.metaKey &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    ) {
      e.preventDefault();
      const delta = e.shiftKey ? 1 : 10;
      const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
      const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
      const moved = this.selectionManager.nudgeSelected(dx, dy);
      if (moved) {
        this.onHistoryCapture?.();
      }
    }

    if (e.key === ' ' && !e.repeat) {
      e.preventDefault();
      this.isPanning = true;
      this.setCursor('grab');
    }
  }

  private cloneNode(node: BaseNode, dx = 0, dy = 0): BaseNode | null {
    try {
      return node.clone(dx, dy);
    } catch {
      return null;
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    if (!this.shortcutsEnabled) {
      return;
    }
    if (this.isEditingText()) {
      return;
    }

    if (this.activeTextInput) {
      return;
    }

    if (e.key === 'Shift') {
      if ('setShiftKey' in this.preview) {
        (this.preview as any).setShiftKey(false);
      }
      this.selectionManager.setMultiSelect(false);
      this.selectionManager.setShiftKey(false);
    }

    if (e.key === ' ') {
      this.isPanning = false;
      this.lastPan = undefined;
      this.setCursor(this.activeTool === 'pan' ? 'grab' : null);
    }
  }

  setTool(tool: ToolName) {
    this.activeTool = tool;
    this.lastPan = undefined;

    if (tool === 'pan') {
      this.setCursor('grab');
    } else if (!this.isPanning) {
      this.setCursor(null);
    }

    // Clear selection when changing tools
    this.selectionManager.clear();

    // Update preview based on tool
    switch (tool) {
      case 'frame':
        this.preview = new PreviewRect(this.previewLayer);
        break;
      case 'rectangle':
        this.preview = new PreviewRect(this.previewLayer);
        break;
      case 'ellipse':
        this.preview = new PreviewEllipse(this.previewLayer);
        break;
      case 'line':
        this.preview = new PreviewLine(this.previewLayer);
        break;
      case 'star':
        this.preview = new PreviewStar(this.previewLayer);
        break;
      case 'text':
        this.preview = new PreviewRect(this.previewLayer);
        break;
    }
  }

  onPointerDown(e: PointerEvent) {
    if (this.isPanModeActive() && this.world && this.app) {
      this.lastPan = new Point(e.clientX, e.clientY);
      this.setCursor('grabbing');
      return;
    }

    const point = this.toWorldPoint(e);
    const globalPoint = this.toGlobalPoint(e);
    this.updateFrameLabels(globalPoint);

    if (this.activeTool === 'select') {
      // Check if we hit a transform handle first
      const handle = this.selectionManager.hitTestHandle(point);

      if (handle) {
        this.activeTransformHandle = handle;
        this.transformStartClient = new Point(e.clientX, e.clientY);
        this.transformMoved = false;
        this.selectionManager.startTransform(globalPoint, handle);
        return;
      }

      // If no handle hit, check for object selection
      const hitObject = this.findHitObject(globalPoint) ?? this.getFrameLabelHitNode(globalPoint);

      this.selectionManager.select((hitObject as BaseNode) || null);

      // Begin move transform when clicking on a selected object body
      if (hitObject && this.selectionManager.getSelectedNodes().length === 1) {
        this.activeTransformHandle = 'move';
        this.transformStartClient = new Point(e.clientX, e.clientY);
        this.transformMoved = false;
        this.selectionManager.startTransform(globalPoint, 'move');
      } else {
        this.activeTransformHandle = null;
        this.transformStartClient = null;
        this.transformMoved = false;
      }
    } else if (
      ['frame', 'rectangle', 'ellipse', 'line', 'star', 'text'].includes(this.activeTool)
    ) {
      const drawingTargetFrame = this.findTopFrameAtPoint(globalPoint);
      this.drawingParentFrameId =
        this.activeTool !== 'frame' && drawingTargetFrame && !drawingTargetFrame.locked
          ? drawingTargetFrame.id
          : null;
      this.preview.begin(this.snapWorldPoint(point));
    }
  }

  onDoubleClick(e: MouseEvent) {
    const globalPoint = this.toGlobalPoint(e as any);
    const hitObject = this.findHitObject(globalPoint);

    if (!hitObject || (hitObject as any).type !== 'text') return;
    const textNode = hitObject as TextNode;
    if (textNode.locked) return;

    this.beginTextEdit(textNode);
  }

  onPointerMove(e: PointerEvent) {
    if (this.isPanModeActive() && this.world && this.app) {
      if (this.lastPan) {
        const dx = e.clientX - this.lastPan.x;
        const dy = e.clientY - this.lastPan.y;
        this.world.position.x += dx;
        this.world.position.y += dy;
        this.lastPan.set(e.clientX, e.clientY);
        this.dispatchEvent(
          new CustomEvent('viewport:changed', {
            detail: {
              x: this.world.position.x,
              y: this.world.position.y,
              zoom: this.world.scale.x,
              source: 'pan',
            },
          })
        );
      }
      return;
    }

    const point = this.toWorldPoint(e);
    const globalPoint = this.toGlobalPoint(e);
    this.updateFrameLabels(globalPoint);

    if (this.activeTool === 'select') {
      // Update transform if in progress
      this.selectionManager.updateTransform(globalPoint);
      if (this.transformStartClient) {
        const dx = e.clientX - this.transformStartClient.x;
        const dy = e.clientY - this.transformStartClient.y;
        if (Math.hypot(dx, dy) > 2) {
          this.transformMoved = true;
        }
      }

      if (this.activeTransformHandle === 'move' && this.transformMoved) {
        this.dropTargetFrameId = this.resolveDropTargetFrameId(globalPoint);
      } else {
        this.dropTargetFrameId = null;
      }

      // Otherwise show hover state - search from top to bottom of z-order
      const hitObject = this.findHitObject(globalPoint) ?? this.getFrameLabelHitNode(globalPoint);

      this.updateHover((hitObject as BaseNode) || null, true);
    } else if (
      ['frame', 'rectangle', 'ellipse', 'line', 'star', 'text'].includes(this.activeTool)
    ) {
      this.preview.update(this.snapWorldPoint(point));
    }
  }

  onPointerUp(e: PointerEvent) {
    const globalPoint = this.toGlobalPoint(e);
    this.updateFrameLabels(globalPoint);
    if (this.activeTool === 'select') {
      this.selectionManager.endTransform();
      if (this.activeTransformHandle === 'move' && this.transformMoved) {
        if (this.reparentSelectionIntoFrame(globalPoint)) {
          this.onLayerChanged();
        }
      }
      this.activeTransformHandle = null;
      this.transformStartClient = null;
      this.transformMoved = false;
      this.dropTargetFrameId = null;
      this.onHistoryCapture?.();
    }

    if (this.isPanModeActive() && !e.buttons) {
      if (this.world) {
        const nextX = Math.round(this.world.position.x);
        const nextY = Math.round(this.world.position.y);
        this.world.position.set(nextX, nextY);
        this.dispatchEvent(
          new CustomEvent('viewport:changed', {
            detail: {
              x: nextX,
              y: nextY,
              zoom: this.world.scale.x,
              source: 'pan',
            },
          })
        );
      }
      this.lastPan = undefined;
      this.setCursor(this.activeTool === 'pan' || this.isPanning ? 'grab' : null);
      return;
    }

    const rect = this.preview.end();
    if (!rect) {
      this.drawingParentFrameId = null;
      return;
    }

    let shape;
    const defaultStyle = {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1,
    };

    switch (this.activeTool) {
      case 'frame':
        let frameWidth = rect.w;
        let frameHeight = rect.h;
        let frameX = rect.x;
        let frameY = rect.y;

        if (e.shiftKey) {
          const frameSize = Math.max(rect.w, rect.h);
          if (rect.w < rect.h) {
            if (this.preview.last.x < this.preview.start.x) frameX = this.preview.start.x - frameSize;
            frameWidth = frameSize;
          } else {
            if (this.preview.last.y < this.preview.start.y) frameY = this.preview.start.y - frameSize;
            frameHeight = frameSize;
          }
        }

        shape = new FrameNode({
          width: Math.max(1, Math.round(frameWidth)),
          height: Math.max(1, Math.round(frameHeight)),
          x: Math.round(frameX),
          y: Math.round(frameY),
          backgroundColor: '#ffffff',
          clipContent: true,
          style: { opacity: 1 },
        });
        break;
      case 'rectangle':
        let rectWidth = rect.w;
        let rectHeight = rect.h;
        let rectX = rect.x;
        let rectY = rect.y;

        if (e.shiftKey) {
          const size = Math.max(rect.w, rect.h);
          if (rect.w < rect.h) {
            if (this.preview.last.x < this.preview.start.x) rectX = this.preview.start.x - size;
            rectWidth = size;
          } else {
            if (this.preview.last.y < this.preview.start.y) rectY = this.preview.start.y - size;
            rectHeight = size;
          }
        }

        shape = new RectangleNode({
          width: rectWidth,
          height: rectHeight,
          x: rectX,
          y: rectY,
          style: defaultStyle,
        });
        break;
      case 'ellipse':
        let width = rect.w;
        let height = rect.h;
        let x = rect.x;
        let y = rect.y;

        if (e.shiftKey) {
          const size = Math.max(rect.w, rect.h);
          width = size;
          height = size;
        }

        shape = new EllipseNode({
          width,
          height,
          x,
          y,
          style: defaultStyle,
        });
        break;

      case 'line':
        let endX = this.preview.last.x;
        let endY = this.preview.last.y;

        // Check if shift is pressed to constrain the line
        if (e.shiftKey) {
          const snapped = this.snapPointTo45(this.preview.start, this.preview.last);
          endX = snapped.x;
          endY = snapped.y;
        }

        shape = new LineNode({
          startX: this.preview.start.x,
          startY: this.preview.start.y,
          endX: endX,
          endY: endY,
          style: defaultStyle,
        });
        break;

      case 'star':
        const size = Math.min(rect.w, rect.h);
        const outerRadius = size / 2;
        const innerRadius = outerRadius * 0.5;
        const centerX = rect.x + rect.w / 2;
        const centerY = rect.y + rect.h / 2;
        shape = new StarNode({
          points: 5,
          innerRadius,
          outerRadius,
          x: centerX - outerRadius,
          y: centerY - outerRadius,
          style: defaultStyle,
        });
        break;

      case 'text':
        const textStyle = {
          ...defaultStyle,
          fill: '#333333',
        };
        shape = new TextNode({
          text: 'Double click to edit',
          x: rect.x,
          y: rect.y,
          style: textStyle,
        });
        break;
    }

    if (shape) {
      const event = new CustomEvent('shape:created', {
        detail: { shape, parentId: this.activeTool === 'frame' ? null : this.drawingParentFrameId },
      });
      this.dispatchEvent(event);
    }
    this.drawingParentFrameId = null;
  }

  cancel() {
    this.preview.cancel();
    this.setTool('select');
    this.isPanning = false;
    this.lastPan = undefined;
    this.activeTransformHandle = null;
    this.transformStartClient = null;
    this.transformMoved = false;
    this.dropTargetFrameId = null;
    this.drawingParentFrameId = null;
    this.updateFrameLabels();
    this.setCursor(null);
  }

  private setCursor(name: string | null) {
    const canvas = this.app?.renderer?.canvas as unknown as HTMLCanvasElement | undefined;
    if (!canvas) return;
    canvas.style.cursor = name ? name : '';
  }

  private toGlobalPoint(e: PointerEvent): Point {
    if (!this.app) return new Point(e.clientX, e.clientY);
    const p = new Point();
    this.app.renderer.events.mapPositionToPoint(p, e.clientX, e.clientY);
    return p;
  }

  private toWorldPoint(e: PointerEvent): Point {
    if (!this.world || !this.app) return new Point(e.offsetX, e.offsetY);
    const globalPoint = this.toGlobalPoint(e);
    return this.world.toLocal(globalPoint);
  }

  private snapWorldPoint(point: Point) {
    return new Point(Math.round(point.x), Math.round(point.y));
  }

  private isEditingText(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
  }

  private updateHover(node: BaseNode | null, emitEvent: boolean) {
    const nodeChanged = this.hoveredNode !== node;
    let shouldRedraw = nodeChanged;

    if (node && !nodeChanged) {
      const nextBounds = node.getBounds();
      const prevBounds = this.hoveredBounds;
      shouldRedraw =
        !prevBounds ||
        prevBounds.x !== nextBounds.x ||
        prevBounds.y !== nextBounds.y ||
        prevBounds.width !== nextBounds.width ||
        prevBounds.height !== nextBounds.height;
    }

    if (!shouldRedraw) return;

    this.hoveredNode = node;
    this.hoverGraphics.clear();
    if (node) {
      const bounds = node.getBounds();
      this.hoveredBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };

      const topLeft = this.world
        ? this.world.toLocal(new Point(bounds.x, bounds.y))
        : new Point(bounds.x, bounds.y);
      const bottomRight = this.world
        ? this.world.toLocal(new Point(bounds.x + bounds.width, bounds.y + bounds.height))
        : new Point(bounds.x + bounds.width, bounds.y + bounds.height);
      const w = bottomRight.x - topLeft.x;
      const h = bottomRight.y - topLeft.y;
      this.hoverGraphics.rect(topLeft.x, topLeft.y, w, h);
      this.hoverGraphics.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
    } else {
      this.hoveredBounds = null;
    }

    if (emitEvent && nodeChanged) {
      this.dispatchEvent(
        new CustomEvent('hover:changed', {
          detail: { id: node?.id ?? null },
        })
      );
    }
  }

  private snapPointTo45(start: { x: number; y: number }, end: { x: number; y: number }) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return { x: start.x, y: start.y };
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const snapped = Math.round(angle / step) * step;
    return {
      x: start.x + Math.cos(snapped) * length,
      y: start.y + Math.sin(snapped) * length,
    };
  }

  private findHitObject(globalPoint: Point): BaseNode | undefined {
    const tolerance = 10;
    const findInContainer = (container: Container): BaseNode | undefined => {
      for (let i = container.children.length - 1; i >= 0; i--) {
        const child = container.children[i];
        if (!(child instanceof BaseNode)) continue;
        if (!child.visible || child.locked) continue;

        // Group-first selection: selecting any descendant/body promotes to the group itself.
        if (child instanceof GroupNode) {
          if (this.isNodeHit(child, globalPoint, tolerance)) {
            return child;
          }
          continue;
        }

        // Intentional behavior: frame body is not directly selectable on canvas hit-test.
        // Users can select frames via frame label or layer panel/API.
        if (child instanceof FrameNode) {
          const nested = findInContainer(child);
          if (nested) return nested;
          continue;
        }

        if (child.children.length) {
          const nested = findInContainer(child);
          if (nested) return nested;
        }

        if (this.isNodeHit(child, globalPoint, tolerance)) {
          return child;
        }
      }
      return undefined;
    };

    return findInContainer(this.objectLayer);
  }

  private isNodeHit(node: BaseNode, globalPoint: Point, tolerance: number): boolean {
    if (node.type === 'line') {
      const line = node as LineNode;
      const startLocal = new Point(line.x + line.startX, line.y + line.startY);
      const endLocal = new Point(line.x + line.endX, line.y + line.endY);
      const start = line.parent ? line.parent.toGlobal(startLocal) : startLocal;
      const end = line.parent ? line.parent.toGlobal(endLocal) : endLocal;
      const len = Math.hypot(end.x - start.x, end.y - start.y) || 1;
      const dist =
        Math.abs(
          (end.y - start.y) * globalPoint.x -
            (end.x - start.x) * globalPoint.y +
            end.x * start.y -
            end.y * start.x
        ) / len;
      const minX = Math.min(start.x, end.x) - tolerance;
      const maxX = Math.max(start.x, end.x) + tolerance;
      const minY = Math.min(start.y, end.y) - tolerance;
      const maxY = Math.max(start.y, end.y) + tolerance;
      return (
        dist <= tolerance &&
        globalPoint.x >= minX &&
        globalPoint.x <= maxX &&
        globalPoint.y >= minY &&
        globalPoint.y <= maxY
      );
    }
    const bounds = node.getBounds();
    return bounds.containsPoint(globalPoint.x, globalPoint.y);
  }

  private updateFrameLabels(pointerGlobal?: Point) {
    const frames = this.collectFramesInStackOrder();
    this.frameLabelOrder = frames.map((frame) => frame.id);
    this.frameNodesById = new Map(frames.map((frame) => [frame.id, frame]));

    const nextIds = new Set(frames.map((frame) => frame.id));
    for (const [id, item] of this.frameLabelItems.entries()) {
      if (!nextIds.has(id)) {
        this.frameLabelLayer.removeChild(item.bg);
        this.frameLabelLayer.removeChild(item.label);
        item.bg.destroy();
        item.label.destroy();
        this.frameLabelItems.delete(id);
      }
    }

    const selectedFrameIds = new Set(
      this.selectionManager
        .getSelectedNodes()
        .filter((node): node is FrameNode => node instanceof FrameNode)
        .map((frame) => frame.id)
    );

    const hoverFrameId = pointerGlobal ? this.getFrameLabelHoverId(pointerGlobal) : null;

    frames.forEach((frame) => {
      const existing = this.frameLabelItems.get(frame.id);
      const item =
        existing ??
        (() => {
          const bg = new Graphics();
          const label = new Text({
            text: frame.name || 'Frame',
            style: {
              fill: 0x1f2937,
              fontSize: 11,
            },
          });
          label.eventMode = 'none';
          this.frameLabelLayer.addChild(bg);
          this.frameLabelLayer.addChild(label);
          const created = { bg, label, bounds: { x: 0, y: 0, width: 0, height: 0 } };
          this.frameLabelItems.set(frame.id, created);
          return created;
        })();

      const text = frame.name || 'Frame';
      item.label.text = text;
      const bounds = this.getFrameLabelBounds(frame, text);
      item.bounds = bounds;

      let bgColor = 0xffffff;
      let bgAlpha = 0.92;
      let borderColor = 0x1f2937;
      let borderAlpha = 0.65;
      let textColor = 0x1f2937;

      if (frame.id === this.dropTargetFrameId) {
        bgColor = 0xe6ffed;
        borderColor = 0x0be666;
        borderAlpha = 0.95;
        textColor = 0x0f5132;
      } else if (selectedFrameIds.has(frame.id)) {
        bgColor = 0xe7f1ff;
        borderColor = 0x0b84ff;
        borderAlpha = 0.95;
        textColor = 0x0b3b82;
      } else if (hoverFrameId === frame.id) {
        bgColor = 0xf7f9fb;
        borderColor = 0x345b7a;
        borderAlpha = 0.9;
      }

      item.bg.clear();
      item.bg.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 4);
      item.bg.fill({ color: bgColor, alpha: bgAlpha });
      item.bg.stroke({ color: borderColor, width: 1, alpha: borderAlpha });
      item.label.style.fill = textColor;
      item.label.position.set(bounds.x + 5, bounds.y + 3);

      const baseIndex = frames.indexOf(frame) * 2;
      this.frameLabelLayer.setChildIndex(item.bg, Math.min(baseIndex, this.frameLabelLayer.children.length - 1));
      this.frameLabelLayer.setChildIndex(
        item.label,
        Math.min(baseIndex + 1, this.frameLabelLayer.children.length - 1)
      );
    });
  }

  private getFrameLabelBounds(frame: FrameNode, text: string) {
    const bounds = frame.getBounds();
    const topLeft = this.world
      ? this.world.toLocal(new Point(bounds.x, bounds.y))
      : new Point(bounds.x, bounds.y);
    const width = Math.max(44, Math.min(240, text.length * 7 + 14));
    const height = 18;
    const x = topLeft.x;
    const y = topLeft.y - 20;
    return { x, y, width, height };
  }

  private getFrameLabelHoverId(globalPoint: Point): string | null {
    const point = this.world ? this.world.toLocal(globalPoint) : globalPoint;
    for (let i = this.frameLabelOrder.length - 1; i >= 0; i -= 1) {
      const id = this.frameLabelOrder[i];
      const item = this.frameLabelItems.get(id);
      if (!item) continue;
      const b = item.bounds;
      if (
        point.x >= b.x &&
        point.x <= b.x + b.width &&
        point.y >= b.y &&
        point.y <= b.y + b.height
      ) {
        return id;
      }
    }
    return null;
  }

  private getFrameLabelHitNode(globalPoint: Point): FrameNode | null {
    const id = this.getFrameLabelHoverId(globalPoint);
    if (!id) return null;
    return this.frameNodesById.get(id) ?? null;
  }

  private collectFramesInStackOrder(): FrameNode[] {
    const frames: FrameNode[] = [];
    const walk = (container: Container) => {
      container.children.forEach((child) => {
        if (!(child instanceof BaseNode)) return;
        if (child instanceof FrameNode && child.visible) {
          frames.push(child);
        }
        if (child.children.length) {
          walk(child);
        }
      });
    };
    walk(this.objectLayer);
    return frames;
  }

  private resolveDropTargetFrameId(globalPoint: Point): string | null {
    const frame = this.findTopFrameAtPoint(globalPoint);
    if (!frame) return null;
    const selected = this.selectionManager.getSelectedNodes();
    if (selected.length !== 1) return null;
    const node = selected[0];
    if (!node || node instanceof FrameNode) return null;
    if (this.isGroupManagedNode(node)) return null;
    if (frame === node.parent) return null;
    if (frame.locked || !frame.visible) return null;
    if (this.isAncestor(node, frame)) return null;
    return frame.id;
  }

  private reparentSelectionIntoFrame(globalPoint: Point): boolean {
    const selected = this.selectionManager.getSelectedNodes();
    if (selected.length !== 1) return false;

    const node = selected[0];
    if (!node || node instanceof FrameNode) return false;
    if (this.isGroupManagedNode(node)) return false;

    const targetFrame = this.findTopFrameAtPoint(globalPoint);
    if (!targetFrame) return false;
    if (targetFrame === node.parent) return false;
    if (targetFrame.locked || !targetFrame.visible) return false;
    if (this.isAncestor(node, targetFrame)) return false;

    const transform = {
      origin: node.toGlobal(new Point(0, 0)),
      xAxis: node.toGlobal(new Point(1, 0)),
      yAxis: node.toGlobal(new Point(0, 1)),
    };

    node.parent?.removeChild(node);
    targetFrame.addChild(node);

    const origin = targetFrame.toLocal(transform.origin);
    const xAxis = targetFrame.toLocal(transform.xAxis);
    const yAxis = targetFrame.toLocal(transform.yAxis);
    const xVector = new Point(xAxis.x - origin.x, xAxis.y - origin.y);
    const yVector = new Point(yAxis.x - origin.x, yAxis.y - origin.y);
    const scaleX = Math.hypot(xVector.x, xVector.y) || 1;
    const scaleY = Math.hypot(yVector.x, yVector.y) || 1;
    const rotation = Math.atan2(xVector.y, xVector.x);

    node.position.copyFrom(origin);
    if (node.type !== 'frame') {
      node.rotation = rotation;
    }
    node.scale.set(scaleX, scaleY);

    this.selectionManager.selectMany([node]);
    return true;
  }

  // Nodes that are groups themselves or descendants of any group should not auto-reparent on drag.
  private isGroupManagedNode(node: BaseNode): boolean {
    if (node instanceof GroupNode) return true;
    let current = node.parent;
    while (current) {
      if (current instanceof GroupNode) return true;
      if (current === this.objectLayer) break;
      current = current.parent;
    }
    return false;
  }

  private findTopFrameAtPoint(globalPoint: Point): FrameNode | null {
    const frames: FrameNode[] = [];
    const walk = (container: Container) => {
      container.children.forEach((child) => {
        if (!(child instanceof BaseNode)) return;
        if (child instanceof FrameNode) {
          frames.push(child);
        }
        if (child.children.length) {
          walk(child);
        }
      });
    };
    walk(this.objectLayer);

    for (let i = frames.length - 1; i >= 0; i -= 1) {
      const frame = frames[i];
      if (!frame.visible) continue;
      const bounds = frame.getBounds();
      if (bounds.containsPoint(globalPoint.x, globalPoint.y)) {
        return frame;
      }
    }
    return null;
  }

  private isAncestor(ancestor: BaseNode, node: Container | null): boolean {
    let current = node;
    while (current) {
      if (current === ancestor) return true;
      if (current === this.objectLayer) break;
      current = current.parent;
    }
    return false;
  }

  private beginTextEdit(node: TextNode) {
    if (!this.app) return;

    if (this.activeTextInput) {
      this.activeTextInput.remove();
      this.activeTextInput = undefined;
    }

    const canvas = this.app.renderer.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const bounds = node.getBounds();

    const input = document.createElement('input');
    input.type = 'text';
    input.value = node.text;
    input.style.position = 'absolute';
    input.style.left = `${rect.left + bounds.x}px`;
    input.style.top = `${rect.top + bounds.y}px`;
    input.style.width = `${Math.max(bounds.width, 40)}px`;
    input.style.height = `${Math.max(bounds.height, 20)}px`;
    input.style.fontSize = '16px';
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = '1px solid #0be666';
    input.style.outline = 'none';
    input.style.background = '#ffffff';
    input.style.color = '#000000';
    input.style.zIndex = '10000';

    document.body.appendChild(input);
    input.focus();
    input.select();

    let canceled = false;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (input.parentNode) input.remove();
      this.activeTextInput = undefined;
    };

    const commit = () => {
      if (canceled) return;
      node.setText(input.value);
      this.selectionManager.select(node);
      this.onHistoryCapture?.();
      cleanup();
    };

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        commit();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        canceled = true;
        cleanup();
      }
    });

    input.addEventListener('blur', () => {
      commit();
    });

    this.activeTextInput = input;
  }
}

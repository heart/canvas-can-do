import { PreviewRect } from './core/nodes/preview/PreviewRect';
import { PreviewEllipse } from './core/nodes/preview/PreviewEllipse';
import { PreviewLine } from './core/nodes/preview/PreviewLine';
import { PreviewStar } from './core/nodes/preview/PreviewStar';
import { PreviewBase } from './core/nodes/preview/PreviewBase';
import { SelectionManager } from './core/selection/SelectionManager';
import { BaseNode } from './core/nodes/BaseNode';

import type { ToolName } from './index';
import { Container, Point, Graphics } from 'pixi.js';
import { RectangleNode } from './core/nodes/RectangleNode';
import { EllipseNode } from './core/nodes/EllipseNode';
import { LineNode } from './core/nodes/LineNode';
import { StarNode } from './core/nodes/StarNode';
import { TextNode } from './core/nodes/TextNode';
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
    this.toolsLayer.addChild(this.hoverGraphics);

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

    if (e.key === ' ' && !e.repeat) {
      this.isPanning = true;
      this.setCursor('grab');
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
        // Ensure group is on object layer; children are already reparented
        if (!this.objectLayer.children.includes(group)) {
          this.objectLayer.addChild(group);
        }
        this.onHistoryCapture?.();
      }
    }

    // Ungroup shortcut (Ctrl+Shift+G or Cmd+Shift+G)
    if (e.key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      const ungrouped = this.selectionManager.ungroupSelected();
      // Re-add ungrouped children to object layer
      ungrouped.forEach((child) => {
        if (!this.objectLayer.children.includes(child)) {
          this.objectLayer.addChild(child);
        }
      });
      if (ungrouped.length) {
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

    if (this.activeTool === 'select') {
      // Check if we hit a transform handle first
      const handle = this.selectionManager.hitTestHandle(point);

      if (handle) {
        this.selectionManager.startTransform(point, handle);
        return;
      }

      // If no handle hit, check for object selection
      const hitObject = this.findHitObject(globalPoint);

      this.selectionManager.select((hitObject as BaseNode) || null);

      // Begin move transform when clicking on a selected object body
      if (hitObject && this.selectionManager.getSelectedNodes().length === 1) {
        this.selectionManager.startTransform(point, 'move');
      }
    } else if (
      ['rectangle', 'circle', 'ellipse', 'line', 'star', 'text'].includes(this.activeTool)
    ) {
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

    if (this.activeTool === 'select') {
      // Update transform if in progress
      this.selectionManager.updateTransform(point);

      // Otherwise show hover state - search from top to bottom of z-order
      const hitObject = this.findHitObject(globalPoint);

      this.updateHover((hitObject as BaseNode) || null, true);
    } else if (
      ['rectangle', 'circle', 'ellipse', 'line', 'star', 'text'].includes(this.activeTool)
    ) {
      this.preview.update(this.snapWorldPoint(point));
    }
  }

  onPointerUp(e: PointerEvent) {
    if (this.activeTool === 'select') {
      this.selectionManager.endTransform();
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
    if (!rect) return;

    let shape;
    const defaultStyle = {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1,
    };

    switch (this.activeTool) {
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
        detail: { shape },
      });
      this.dispatchEvent(event);
    }
  }

  cancel() {
    this.preview.cancel();
    this.setTool('select');
    this.isPanning = false;
    this.lastPan = undefined;
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

    // Convert client coords to renderer (stage) coords
    const canvas = this.app.renderer.canvas as unknown as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const globalPoint = new Point(screenX, screenY);
    // Map through world transform to local space (handles scale/position)
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

  private findHitObject(globalPoint: Point): Container | undefined {
    const children = this.objectLayer?.children || [];
    const tolerance = 10;

    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child === this.objectLayer) continue;
      if (!child.visible) continue;
      if (child instanceof BaseNode && child.locked) continue;
      if ((child as any).type === 'line') {
        const line = child as any as LineNode;
        const startX = line.x + line.startX;
        const startY = line.y + line.startY;
        const endX = line.x + line.endX;
        const endY = line.y + line.endY;
        const len = Math.hypot(endX - startX, endY - startY) || 1;
        const dist =
          Math.abs(
            (endY - startY) * globalPoint.x -
              (endX - startX) * globalPoint.y +
              endX * startY -
              endY * startX
          ) / len;
        const minX = Math.min(startX, endX) - tolerance;
        const maxX = Math.max(startX, endX) + tolerance;
        const minY = Math.min(startY, endY) - tolerance;
        const maxY = Math.max(startY, endY) + tolerance;
        if (
          dist <= tolerance &&
          globalPoint.x >= minX &&
          globalPoint.x <= maxX &&
          globalPoint.y >= minY &&
          globalPoint.y <= maxY
        ) {
          return child;
        }
        continue;
      }

      const bounds = child.getBounds();
      if (bounds.containsPoint(globalPoint.x, globalPoint.y)) {
        return child;
      }
    }

    return undefined;
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

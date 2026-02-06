import { PreviewRect } from './core/nodes/preview/PreviewRect';
import { PreviewEllipse } from './core/nodes/preview/PreviewEllipse';
import { PreviewLine } from './core/nodes/preview/PreviewLine';
import { PreviewStar } from './core/nodes/preview/PreviewStar';
import { PreviewBase } from './core/nodes/preview/PreviewBase';
import { SelectionManager } from './core/selection/SelectionManager';
import { BaseNode } from './core/nodes/BaseNode';

import type { ToolName } from './index';
import { Container, Point } from 'pixi.js';
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

  private selectionManager: SelectionManager;
  private clipboard: BaseNode[] = [];
  private onLayerChanged: () => void;
  private isPanning = false;
  private lastPan?: Point;
  private app?: Application;
  private world?: Container;

  constructor(
    previewLayer: Container,
    objectLayer: Container,
    toolsLayer: Container,
    onLayerChanged: () => void,
    app?: Application,
    world?: Container
  ) {
    this.previewLayer = previewLayer;
    this.objectLayer = objectLayer;
    this.onLayerChanged = onLayerChanged;
    this.app = app;
    this.world = world;

    this.selectionManager = new SelectionManager(toolsLayer);

    this.preview = new PreviewRect(previewLayer);
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      if ('setShiftKey' in this.preview) {
        (this.preview as any).setShiftKey(true);
      }
      this.selectionManager.setMultiSelect(true);
    }

    // Delete selected nodes
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const removed = this.selectionManager.deleteSelected(this.objectLayer);
      if (removed.length) {
        e.preventDefault();
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
      this.clipboard.forEach(node => {
        const clone = this.cloneNode(node, offset, offset);
        if (clone) {
          this.objectLayer.addChild(clone);
          pasted.push(clone);
        }
      });

      if (pasted.length) {
        this.selectionManager.setMultiSelect(true);
        pasted.forEach(node => this.selectionManager.select(node));
        this.selectionManager.setMultiSelect(false);
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
        this.onLayerChanged();
      }
    }

    // Ungroup shortcut (Ctrl+Shift+G or Cmd+Shift+G)
    if (e.key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      const ungrouped = this.selectionManager.ungroupSelected();
      // Re-add ungrouped children to object layer
      ungrouped.forEach(child => {
        if (!this.objectLayer.children.includes(child)) {
          this.objectLayer.addChild(child);
        }
      });
      if (ungrouped.length) this.onLayerChanged();
    }

    // Reorder shortcuts: Ctrl/Cmd + ArrowUp/ArrowDown
    if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const direction = e.key === 'ArrowUp' ? 1 : -1; // swap: Up moves forward, Down moves backward
      const moved = this.selectionManager.reorderSelected(this.objectLayer, direction);
      if (moved) this.onLayerChanged();
    }

    // Nudge with Arrow keys (no Ctrl/Cmd): move selection
    if (!e.ctrlKey && !e.metaKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const delta = e.shiftKey ? 1 : 10;
      const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
      const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
      const moved = this.selectionManager.nudgeSelected(dx, dy);
      if (moved) this.onLayerChanged();
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
    if (e.key === 'Shift') {
      if ('setShiftKey' in this.preview) {
        (this.preview as any).setShiftKey(false);
      }
      this.selectionManager.setMultiSelect(false);
    }

    if (e.key === ' ') {
      this.isPanning = false;
      this.lastPan = undefined;
      this.setCursor(null);
    }
  }

  setTool(tool: ToolName) {
    this.activeTool = tool;

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
    }
  }

  onPointerDown(e: PointerEvent) {
    if (this.isPanning && this.world && this.app) {
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
      const hitObject = [...(this.objectLayer?.children || [])]
        .reverse()
        .find((child) => {
          if (child === this.objectLayer) return false;
          const bounds = child.getBounds();
          // bounds are global; use global point
          return bounds.containsPoint(globalPoint.x, globalPoint.y);
        });

      this.selectionManager.select((hitObject as BaseNode) || null);
      if (hitObject) {
        this.onLayerChanged();
      }

      // Begin move transform when clicking on a selected object body
      if (hitObject && this.selectionManager.getSelectedNodes().length === 1) {
        this.selectionManager.startTransform(point, 'move');
      }
    } else if (['rectangle', 'circle', 'ellipse', 'line', 'star'].includes(this.activeTool)) {
      this.preview.begin(point);
    }
  }

  onPointerMove(e: PointerEvent) {
    if (this.isPanning && this.world && this.app) {
      if (this.lastPan) {
        const dx = e.clientX - this.lastPan.x;
        const dy = e.clientY - this.lastPan.y;
        this.world.position.x += dx;
        this.world.position.y += dy;
        this.lastPan.set(e.clientX, e.clientY);
      }
      return;
    }

    const point = this.toWorldPoint(e);
    const globalPoint = this.toGlobalPoint(e);

    if (this.activeTool === 'select') {
      // Update transform if in progress
      this.selectionManager.updateTransform(point);

      // Otherwise show hover state - search from top to bottom of z-order
      const hitObject = [...(this.objectLayer?.children || [])]
        .reverse()
        .find((child) => {
          if (child === this.objectLayer) return false;
          const bounds = child.getBounds();
          return bounds.containsPoint(globalPoint.x, globalPoint.y);
        });

      if (hitObject) {
        const bounds = hitObject.getBounds();
        this.preview.graphics.clear();
        this.preview.graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.preview.graphics.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });

        if (!this.preview.graphics.parent) {
          this.previewLayer.addChild(this.preview.graphics);
        }
      } else {
        this.preview.graphics.clear();
      }
    } else if (['rectangle', 'circle', 'ellipse', 'line', 'star'].includes(this.activeTool)) {
      this.preview.update(point);
    }
  }

  onPointerUp(e: PointerEvent) {
    if (this.activeTool === 'select') {
      this.selectionManager.endTransform();
    }

    if (this.isPanning) {
      this.isPanning = false;
      this.lastPan = undefined;
      this.setCursor(null);
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
          const dx = Math.abs(this.preview.last.x - this.preview.start.x);
          const dy = Math.abs(this.preview.last.y - this.preview.start.y);

          if (dx > dy) {
            // Make horizontal
            endY = this.preview.start.y;
          } else {
            // Make vertical
            endX = this.preview.start.x;
          }
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
        shape = new StarNode({
          points: 5,
          innerRadius: size * 0.4,
          outerRadius: size * 0.8,
          x: rect.x,
          y: rect.y,
          style: defaultStyle,
        });
        break;

      case 'text':
        shape = new TextNode({
          text: 'Double click to edit',
          x: rect.x,
          y: rect.y,
          style: defaultStyle,
        });
        break;
    }

    if (shape) {
      const event = new CustomEvent('shape:created', {
        detail: { shape },
      });
      window.dispatchEvent(event);
      this.onLayerChanged();
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
}

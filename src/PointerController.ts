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

export class PointerController {
  private preview: PreviewBase;
  private activeTool: ToolName = 'select';

  //previewLayer is the layer that use to draw preview only
  private previewLayer: Container;

  //objectLayer is the layer that we draw the real object here
  private objectLayer: Container;

  private selectionManager: SelectionManager;

  constructor(previewLayer: Container, objectLayer: Container, toolsLayer: Container) {
    this.previewLayer = previewLayer;
    this.objectLayer = objectLayer;

    this.selectionManager = new SelectionManager(toolsLayer);

    this.preview = new PreviewRect(previewLayer);

    // Add keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      if ('setShiftKey' in this.preview) {
        (this.preview as any).setShiftKey(true);
      }
      this.selectionManager.setMultiSelect(true);
    }

    // Group shortcut (Ctrl+G or Cmd+G)
    if (e.key === 'g' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const group = this.selectionManager.createGroup();
      if (group) {
        // Remove selected nodes and add group to object layer
        Array.from(this.selectionManager.getSelectedNodes())
          .filter(node => node !== group)
          .forEach(node => {
            this.objectLayer.removeChild(node);
          });
        this.objectLayer.addChild(group);
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      if ('setShiftKey' in this.preview) {
        (this.preview as any).setShiftKey(false);
      }
      this.selectionManager.setMultiSelect(false);
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
    const point = new Point(e.offsetX, e.offsetY);

    if (this.activeTool === 'select') {
      // Check if we hit a transform handle first
      const handle = this.selectionManager.hitTestHandle(point);

      if (handle) {
        this.selectionManager.startTransform(point, handle);
        return;
      }

      // If no handle hit, check for object selection
      const hitObject = this.objectLayer?.children.find((child) => {
        if (child === this.objectLayer) return false;
        const bounds = child.getBounds();
        return bounds.containsPoint(point.x, point.y);
      });

      this.selectionManager.select((hitObject as BaseNode) || null);

      // Begin move transform when clicking on a selected object body
      if (hitObject) {
        this.selectionManager.startTransform(point, 'move');
      }
    } else if (['rectangle', 'circle', 'ellipse', 'line', 'star'].includes(this.activeTool)) {
      this.preview.begin(point);
    }
  }

  onPointerMove(e: PointerEvent) {
    const point = new Point(e.offsetX, e.offsetY);

    if (this.activeTool === 'select') {
      // Update transform if in progress
      this.selectionManager.updateTransform(point);

      // Otherwise show hover state
      const hitObject = this.objectLayer?.children.find((child) => {
        if (child === this.objectLayer) return false;
        const bounds = child.getBounds();
        return bounds.containsPoint(point.x, point.y);
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
    }
  }

  cancel() {
    this.preview.cancel();
    this.setTool('select');
  }
}

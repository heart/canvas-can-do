import { PreviewRect } from './core/nodes/preview/PreviewRect';
import type { ToolName } from './index';
import { Container } from 'pixi.js';
import { RectangleNode } from './core/nodes/RectangleNode';
import { CircleNode } from './core/nodes/CircleNode';
import { EllipseNode } from './core/nodes/EllipseNode';
import { LineNode } from './core/nodes/LineNode';
import { StarNode } from './core/nodes/StarNode';
import { TextNode } from './core/nodes/TextNode';

export class PointerController {
  private previewRect: PreviewRect;
  private activeTool: ToolName = 'select';
  private onToolChange?: (tool: ToolName) => void;

  constructor(previewLayer: Container) {
    this.previewRect = new PreviewRect(previewLayer);
  }

  setTool(tool: ToolName) {
    this.activeTool = tool;
  }

  onPointerDown(e: PointerEvent) {
    const point = { x: e.offsetX, y: e.offsetY };
    
    if (this.activeTool === 'rectangle' || 
        this.activeTool === 'circle' || 
        this.activeTool === 'ellipse') {
      this.previewRect.begin(point);
    }
  }

  onPointerMove(e: PointerEvent) {
    const point = { x: e.offsetX, y: e.offsetY };
    
    if (this.activeTool === 'rectangle' || 
        this.activeTool === 'circle' || 
        this.activeTool === 'ellipse') {
      this.previewRect.update(point);
    }
  }

  onPointerUp(e: PointerEvent) {
    const rect = this.previewRect.end();
    if (!rect) return;

    let shape;
    const defaultStyle = {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1
    };

    switch (this.activeTool) {
      case 'rectangle':
        shape = new RectangleNode({
          width: rect.w,
          height: rect.h,
          x: rect.x,
          y: rect.y,
          style: defaultStyle
        });
        break;

      case 'circle':
        const radius = Math.min(rect.w, rect.h) / 2;
        shape = new CircleNode({
          radius,
          x: rect.x + rect.w / 2,
          y: rect.y + rect.h / 2,
          style: defaultStyle
        });
        break;

      case 'ellipse':
        shape = new EllipseNode({
          width: rect.w,
          height: rect.h,
          x: rect.x + rect.w / 2,
          y: rect.y + rect.h / 2,
          style: defaultStyle
        });
        break;

      case 'line':
        shape = new LineNode({
          startX: rect.x,
          startY: rect.y,
          endX: rect.x + rect.w,
          endY: rect.y + rect.h,
          style: defaultStyle
        });
        break;

      case 'star':
        const size = Math.min(rect.w, rect.h);
        shape = new StarNode({
          points: 5,
          innerRadius: size * 0.4,
          outerRadius: size * 0.8,
          x: rect.x + rect.w / 2,
          y: rect.y + rect.h / 2,
          style: defaultStyle
        });
        break;

      case 'text':
        shape = new TextNode({
          text: 'Double click to edit',
          x: rect.x,
          y: rect.y,
          style: defaultStyle
        });
        break;
    }

    if (shape) {
      const event = new CustomEvent('shape:created', {
        detail: { shape },
      });
      window.dispatchEvent(event);

      // Reset to select tool after creating shape
      this.setTool('select');
      // Notify about tool change
      this.onToolChange?.('select');
    }
  }

  setToolChangeHandler(handler: (tool: ToolName) => void) {
    this.onToolChange = handler;
  }

  cancel() {
    this.previewRect.cancel();
    // Reset to select tool when canceling
    this.setTool('select');
    // Notify about tool change through handler
    this.onToolChange?.('select');
  }
}

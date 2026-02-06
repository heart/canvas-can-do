import { PreviewRect } from './core/nodes/preview/PreviewRect';
import type { ToolName } from './index';
import type { RectangleNode } from './core/nodes/RectangleNode';
import { Container } from 'pixi.js';

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
    if (this.activeTool === 'rectangle') {
      const point = { x: e.offsetX, y: e.offsetY };
      this.previewRect.begin(point);
    }
  }

  onPointerMove(e: PointerEvent) {
    if (this.activeTool === 'rectangle') {
      const point = { x: e.offsetX, y: e.offsetY };
      this.previewRect.update(point);
    }
  }

  onPointerUp(e: PointerEvent) {
    if (this.activeTool === 'rectangle') {
      const rect = this.previewRect.end();
      if (rect) {
        const rectangleNode: RectangleNode = {
          type: 'rectangle',
          id: crypto.randomUUID(),
          x: rect.x,
          y: rect.y,
          width: rect.w,
          height: rect.h,
        };

        const event = new CustomEvent('shape:created', {
          detail: { shape: rectangleNode },
        });
        window.dispatchEvent(event);
      }
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

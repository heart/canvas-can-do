import { PreviewRect } from './core/nodes/preview/PreviewRect';
import type { CCDApp } from './index';
import type { ToolName } from './index';

export class PointerController {
  private app: CCDApp;
  private previewRect: PreviewRect;
  private activeTool: ToolName = 'select';

  constructor(app: CCDApp) {
    this.app = app;
    this.previewRect = new PreviewRect(app.previewLayer);
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
        // Here you can handle the final rectangle creation
        console.log('Rectangle created:', rect);
      }
    }
  }

  cancel() {
    this.previewRect.cancel();
    // Reset to select tool when canceling
    this.setTool('select');
    // Notify app about tool change
    this.app.onToolChange('select');
  }
}

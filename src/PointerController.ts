import { CCDApp, type ToolName, TOOL_CURSOR } from '.';

type InteractionState =
  | { kind: 'idle' }
  | {
      kind: 'drawing';
      tool: 'rectangle' | 'circle';
      start: { x: number; y: number };
      previewId: string;
    }
  | { kind: 'dragging'; targetId: string; start: { x: number; y: number } };

export class PointerController {
  state: InteractionState = { kind: 'idle' };

  app: CCDApp;
  constructor(app: CCDApp) {
    this.app = app;
  }

  onPointerDown(p: { x: number; y: number }) {
    if (this.state.kind !== 'idle') return; // กันซ้อน

    if (this.app?.activeTool === 'rectangle') {
      this.state = { kind: 'drawing', tool: 'rectangle', start: p, previewId: 'preview' };
      //this.app.setCursor('crosshair');
      //this.beginPreviewRect(p);
      return;
    }

    // select tool
    //const hit = this.hitTestTopmost(p);
    // if (hit) {
    //   this.state = { kind: 'dragging', targetId: hit.id, start: p };
    //   this.app.setCursor('move');
    //   return;
    // }
  }

  onPointerMove(p: { x: number; y: number }) {
    switch (this.state.kind) {
      case 'drawing':
        //this.updatePreview(this.state.start, p);
        break;
      case 'dragging':
        //this.moveTarget(this.state.targetId, this.state.start, p);
        break;
      default:
        // hover cursor (optional)
        break;
    }
  }

  onPointerUp(p: { x: number; y: number }) {
    switch (this.state.kind) {
      case 'drawing':
        //this.commitShape(this.state.start, p);
        //this.clearPreview();
        break;
      case 'dragging':
        //this.endDrag();
        break;
    }
    this.state = { kind: 'idle' };
    this.app.setCursor(TOOL_CURSOR[this.app?.activeTool] ?? null); // กลับตาม tool
  }

  cancel() {
    //if (this.state.kind === 'drawing') this.clearPreview();
    this.state = { kind: 'idle' };
    this.app.setCursor(TOOL_CURSOR[this.app?.activeTool] ?? null);
  }
}

import { Application, Container } from 'pixi.js';
import { PointerController } from './PointerController';
import type { ShapeCreatedEvent } from './events';
import { RectangleObject } from './core/nodes/rectangle/RectangleObject';

export const version = '0.0.0';

export type ToolName = 'select' | 'rectangle' | 'circle' | 'text' | 'pan';

export const TOOL_CURSOR: Record<ToolName, string | null> = {
  select: null,
  rectangle: 'crosshair',
  circle: 'crosshair',
  text: 'text',
  pan: 'grab',
};

export class CCDApp {
  app = new Application();

  objectLayer = new Container();
  previewLayer = new Container();
  toolsLayer = new Container();
  helperLayer = new Container();
  uiLayer = new Container();

  host?: HTMLElement;
  pointerController?: PointerController;

  activeTool: ToolName = 'select';

  async init(host: HTMLElement) {
    await this.app.init({
      background: '#F2F2F2',
      resizeTo: host, // ให้ Pixi จัดการ resize เอง
      antialias: true,
    });

    this.host = host;
    host.appendChild(this.app.canvas);

    // layers
    this.app.stage.addChild(this.objectLayer);
    this.app.stage.addChild(this.previewLayer);
    this.app.stage.addChild(this.toolsLayer);
    this.app.stage.addChild(this.helperLayer);
    this.app.stage.addChild(this.uiLayer);

    // events
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // overlay ไม่แย่งคลิก
    this.previewLayer.eventMode = 'passive';
    this.helperLayer.eventMode = 'passive';
    this.uiLayer.eventMode = 'passive';

    // ถ้าต้อง sync hitArea ให้ชัวร์
    this.app.ticker.add(() => {
      this.app.stage.hitArea = this.app.screen;
    });

    this.initPointerController();
  }

  initPointerController() {
    this.pointerController = new PointerController(this.previewLayer);
    this.pointerController.setToolChangeHandler((tool) => this.onToolChange(tool));
    
    // Listen for shape creation events
    window.addEventListener('shape:created', ((e: ShapeCreatedEvent) => {
      const shape = e.detail.shape;
      if (shape.type === 'rectangle') {
        const rectangleObject = new RectangleObject(shape);
        this.objectLayer.addChild(rectangleObject);
      }
    }) as EventListener);

    this.host?.addEventListener('pointerdown', (e) => {
      //this.host.setPointerCapture(e.pointerId);
      this.pointerController?.onPointerDown(e);
    });

    this.host?.addEventListener('pointermove', (e) => {
      this.pointerController?.onPointerMove(e);
    });

    this.host?.addEventListener('pointerup', (e) => {
      //host.releasePointerCapture(e.pointerId);
      this.pointerController?.onPointerUp(e);
    });

    this.host?.addEventListener('pointercancel', (e) => {
      this.pointerController?.cancel();
    });
  }

  setCursor(name: string | null) {
    this.resetCursor();

    if (name) {
      this.host?.classList.add(`ccd-cursor-${name}`);
    }
  }

  resetCursor() {
    if (!this.host) return;

    for (const cls of Array.from(this.host.classList)) {
      if (cls.startsWith('ccd-cursor-')) {
        this.host.classList.remove(cls);
      }
    }
  }

  useTool(toolName: ToolName) {
    this.pointerController?.setTool(toolName);
    const toolCursor = TOOL_CURSOR[toolName];
    this.setCursor(toolCursor);
  }

  onToolChange(toolName: ToolName) {
    const toolCursor = TOOL_CURSOR[toolName];
    this.setCursor(toolCursor);
  }

  destroy() {
    this.app.destroy(true);
  }
}

import { Application, Container } from 'pixi.js';
import { PointerController } from './PointerController';
import type { ShapeCreatedEvent } from './events';
import { LayerHierarchy } from './core/layers/LayerHierarchy';

export const version = '0.0.0';

export type ToolName =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'line'
  | 'ellipse'
  | 'star'
  | 'pan';

export const TOOL_CURSOR: Record<ToolName, string | null> = {
  select: null,
  rectangle: 'crosshair',
  circle: 'crosshair',
  ellipse: 'crosshair',
  line: 'crosshair',
  star: 'crosshair',
  text: 'text',
  pan: 'grab',
};

export class CCDApp {
  app = new Application();

  world = new Container();
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
    this.world.addChild(this.objectLayer);
    this.world.addChild(this.previewLayer);
    this.world.addChild(this.toolsLayer);
    this.world.addChild(this.helperLayer);
    this.app.stage.addChild(this.world);
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

    // zoom hotkeys
    window.addEventListener('keydown', this.handleZoomKeys.bind(this));
  }

  initPointerController() {
    this.pointerController = new PointerController(
      this.previewLayer,
      this.objectLayer,
      this.toolsLayer,
      this.dispatchLayerHierarchyChanged.bind(this),
      this.app,
      this.world
    );

    // Listen for shape creation events
    window.addEventListener('shape:created', ((e: ShapeCreatedEvent) => {
      const shape = e.detail.shape;
      this.objectLayer.addChild(shape);
      this.dispatchLayerHierarchyChanged();
      this.useTool('select');
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

    this.host?.addEventListener('pointercancel', (_) => {
      this.pointerController?.cancel();
    });

    window.addEventListener(
      'keydown',
      this.pointerController.handleKeyDown.bind(this.pointerController)
    );
    window.addEventListener(
      'keyup',
      this.pointerController.handleKeyUp.bind(this.pointerController)
    );
  }

  private handleZoomKeys(e: KeyboardEvent) {
    const hasMeta = e.ctrlKey || e.metaKey;
    const key = e.key;

    // ctrl/cmd + plus/equals
    if (hasMeta && (key === '+' || key === '=')) {
      e.preventDefault();
      this.setZoom(this.world.scale.x + 0.1);
      return;
    }

    // ctrl/cmd + minus
    if (hasMeta && key === '-') {
      e.preventDefault();
      this.setZoom(this.world.scale.x - 0.1);
      return;
    }

    // absolute zoom with digits (no ctrl/cmd)
    if (!hasMeta) {
      if (key === '0') {
        e.preventDefault();
        this.setZoom(1);
      } else if (/^[1-9]$/.test(key)) {
        e.preventDefault();
        const level = 1 + parseInt(key, 10) * 0.1;
        this.setZoom(level);
      }
    }
  }

  private setZoom(newScale: number) {
    const min = 0.1;
    const max = 5;
    const clamped = Math.max(min, Math.min(max, newScale));

    const oldScale = this.world.scale.x;
    if (clamped === oldScale) return;

    const center = {
      x: this.app.screen.width / 2,
      y: this.app.screen.height / 2,
    };

    // world point at screen center before scaling
    const worldX = (center.x - this.world.position.x) / oldScale;
    const worldY = (center.y - this.world.position.y) / oldScale;

    // apply new scale
    this.world.scale.set(clamped);

    // reposition so center stays fixed
    this.world.position.set(center.x - worldX * clamped, center.y - worldY * clamped);
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

    const event = new CustomEvent('tool:changed', {
      detail: { tool: toolName },
    });
    window.dispatchEvent(event);
  }

  dispatchLayerHierarchyChanged() {
    const hierarchy = LayerHierarchy.getHierarchy(this.objectLayer);
    const event = new CustomEvent('layer:changed', {
      detail: { hierarchy },
    });
    window.dispatchEvent(event);
  }

  destroy() {
    this.app.destroy(true);
  }

  getLayerHierarchy() {
    return LayerHierarchy.getHierarchy(this.objectLayer);
  }
}

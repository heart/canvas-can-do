import { Application, Container } from 'pixi.js';
import { PointerController } from './PointerController';
import type { ShapeCreatedEvent } from './events';
import { LayerHierarchy } from './core/layers/LayerHierarchy';
import type { BaseNode, InspectableNode } from './core/nodes';

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

export interface NodePropUpdate {
  id: string;
  props: Record<string, string | number | boolean | null>;
}

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
      autoDensity: true,
      resolution: Math.max(1, window.devicePixelRatio || 1),
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

    // Listen for shape creation events from pointer controller
    this.pointerController.addEventListener('shape:created', ((e: ShapeCreatedEvent) => {
      const shape = e.detail.shape;
      this.objectLayer.addChild(shape);
      this.dispatchLayerHierarchyChanged();
      this.useTool('select');
    }) as EventListener);
    this.pointerController.addEventListener('viewport:changed', ((e: Event) => {
      const detail = (e as CustomEvent).detail;
      const evt = new CustomEvent('viewport:changed', { detail });
      this.dispatchOnHost(evt);
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

    this.host?.addEventListener('dblclick', (e) => {
      this.pointerController?.onDoubleClick(e);
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

    this.dispatchOnHost(
      new CustomEvent('viewport:changed', {
        detail: {
          x: this.world.position.x,
          y: this.world.position.y,
          zoom: this.world.scale.x,
          source: 'zoom',
        },
      })
    );
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
    this.dispatchOnHost(event);
  }

  dispatchLayerHierarchyChanged() {
    const hierarchy = LayerHierarchy.getHierarchy(this.objectLayer);
    const event = new CustomEvent('layer:changed', {
      detail: { hierarchy, selectedIds: [] },
    });
    this.dispatchOnHost(event);
  }

  /**
   * Apply property updates to one or more nodes by id.
   * Pass the ids/props you received from `layer:changed` or `properties:changed`.
   */
  applyNodeProperties(update: NodePropUpdate | NodePropUpdate[]): void {
    const updates = Array.isArray(update) ? update : [update];
    const touchedNodes: BaseNode[] = [];

    updates.forEach(({ id, props }) => {
      const node = this.findNodeById(this.objectLayer, id);
      if (!node) return;

      Object.entries(props).forEach(([key, value]) => {
        switch (key) {
          case 'name':
            node.name = value as string;
            break;
          case 'x':
            node.position.x = Number(value);
            break;
          case 'y':
            node.position.y = Number(value);
            break;
          case 'width':
            node.width = Number(value);
            break;
          case 'height':
            node.height = Number(value);
            break;
          case 'scaleX':
            node.scale.x = Number(value);
            break;
          case 'scaleY':
            node.scale.y = Number(value);
            break;
          case 'rotation':
            node.rotation = Number(value);
            break;
          case 'visible':
            node.visible = Boolean(value);
            break;
          case 'locked':
            node.locked = Boolean(value);
            break;
          case 'fill':
          case 'stroke':
          case 'strokeWidth':
          case 'opacity':
            this.applyStyle(node, key, value);
            break;
          case 'fontSize':
          case 'fontFamily':
          case 'fontWeight':
          case 'fontStyle':
            if (node.type === 'text') {
              this.applyStyle(node, key, value);
            }
            break;
          case 'radius':
            if ('radius' in node) {
              (node as any).radius = Number(value);
              node.width = Number(value) * 2;
              node.height = Number(value) * 2;
              (node as any).redraw?.();
            }
            break;
          case 'cornerRadius':
            if ('cornerRadius' in node) {
              (node as any).cornerRadius = Number(value);
              (node as any).redraw?.();
            }
            break;
          case 'text':
            if ('setText' in node) {
              (node as any).setText(value as string);
            }
            break;
          case 'points':
          case 'innerRadius':
          case 'outerRadius':
            if (node.type === 'star') {
              if (key === 'points') (node as any).points = Number(value);
              if (key === 'innerRadius') (node as any).innerRadius = Number(value);
              if (key === 'outerRadius') {
                (node as any).outerRadius = Number(value);
                node.width = Number(value) * 2;
                node.height = Number(value) * 2;
              }
              (node as any).redraw?.();
            }
            break;
          case 'startX':
          case 'startY':
          case 'endX':
          case 'endY':
            if (node.type === 'line') {
              // values are absolute; store relative to node position
              if (key === 'startX') (node as any).startX = Number(value) - node.position.x;
              if (key === 'startY') (node as any).startY = Number(value) - node.position.y;
              if (key === 'endX') (node as any).endX = Number(value) - node.position.x;
              if (key === 'endY') (node as any).endY = Number(value) - node.position.y;
              (node as any).refresh?.();
              (node as any).redraw?.();
            }
            break;
        }
      });

      touchedNodes.push(node);
    });

    if (touchedNodes.length) {
      // Let listeners refresh panels
      const nodes: InspectableNode[] = touchedNodes
        .map((n) =>
          typeof (n as any).getInspectable === 'function' ? (n as any).getInspectable() : null
        )
        .filter((n): n is InspectableNode => n !== null);

      const propEvent = new CustomEvent('properties:changed', { detail: { nodes } });
      this.dispatchOnHost(propEvent);
      this.dispatchLayerHierarchyChanged();
    }
  }

  private applyStyle(node: BaseNode, key: string, value: any) {
    const styleUpdate: any = { [key]: value };
    if ('setStyle' in node && typeof (node as any).setStyle === 'function') {
      (node as any).setStyle(styleUpdate);
    } else {
      node.style = { ...node.style, ...styleUpdate };
      (node as any).redraw?.();
    }
  }

  private findNodeById(container: Container, id: string): BaseNode | null {
    for (const child of container.children) {
      if ((child as any).id === id) return child as BaseNode;
      if (child instanceof Container) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  private dispatchOnHost(event: Event) {
    if (this.host) {
      this.host.dispatchEvent(event);
    } else {
      window.dispatchEvent(event);
    }
  }

  destroy() {
    this.app.destroy(true);
  }

  getLayerHierarchy() {
    return LayerHierarchy.getHierarchy(this.objectLayer);
  }
}

import './ccd.css';
import { Application, Container, Matrix, Point, RenderTexture, Color } from 'pixi.js';
import { PointerController } from './PointerController';
import type { ShapeCreatedEvent } from './events';
import { LayerHierarchy } from './core/layers/LayerHierarchy';
import { BaseNode } from './core/nodes/BaseNode';
import type { InspectableNode } from './core/nodes';
import { ImageNode } from './core/nodes/ImageNode';
import { TextNode } from './core/nodes/TextNode';
import { GroupNode } from './core/nodes/GroupNode';
import { FrameNode } from './core/nodes/FrameNode';
import { HistoryManager } from './core/history/HistoryManager';
import type { SceneDocument } from './core/history/HistoryManager';
import { RulerOverlay } from './core/ui/RulerOverlay';
import {
  DEFAULT_FONT_FAMILY,
  normalizeFontFamily,
  normalizeFontStyle,
  normalizeFontWeight,
} from './core/fonts/fontOptions';

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

export interface AddedNodeResult {
  id: string;
  type: InspectableNode['type'];
  inspectable: InspectableNode;
  update: NodePropUpdate;
}

export interface AddFrameOptions {
  width: number;
  height: number;
  x?: number;
  y?: number;
  space?: 'world' | 'screen';
  name?: string;
  backgroundColor?: string | null;
  borderColor?: string;
  borderWidth?: number;
  // legacy alias
  background?: string | null;
  clipContent?: boolean;
}

export type LayerMovePosition = 'before' | 'after' | 'inside';

export interface FlatLayerItem {
  id: string;
  type: BaseNode['type'];
  name: string;
  visible: boolean;
  locked: boolean;
  parentId: string | null;
  depth: number;
  zIndex: number;
  isGroup: boolean;
  childCount: number;
}

export interface GetFlatLayersOptions {
  parentId?: string | null;
  recursive?: boolean;
  topFirst?: boolean;
}

export interface LayerMoveValidation {
  ok: boolean;
  reason?: string;
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

export class CCDApp extends EventTarget {
  app = new Application();

  world = new Container();
  objectLayer = new Container();
  previewLayer = new Container();
  toolsLayer = new Container();
  helperLayer = new Container();
  uiLayer = new Container();

  host?: HTMLElement;
  pointerController?: PointerController;
  history?: HistoryManager;
  private ruler?: RulerOverlay;
  private shortcutsEnabled = true;
  private objectSnapEnabled = true;
  private isInitialized = false;

  private readonly syncStageHitArea = () => {
    this.app.stage.hitArea = this.app.screen;
  };
  private readonly updateRuler = () => {
    this.ruler?.update();
  };
  private readonly onZoomKeyDown = (e: KeyboardEvent) => this.handleZoomKeys(e);
  private readonly onUndoRedoKeyDown = (e: KeyboardEvent) => this.handleUndoRedoKeys(e);
  private readonly onToolKeyDown = (e: KeyboardEvent) => this.handleToolKeys(e);
  private readonly onCanvasWheel = (e: WheelEvent) => this.handleWheel(e);
  private readonly onHostDragOver = (e: DragEvent) => {
    e.preventDefault();
  };
  private readonly onHostDrop = (e: DragEvent) => {
    this.handleDrop(e);
  };
  private readonly onHostPaste = (e: ClipboardEvent) => {
    this.handlePaste(e);
  };
  private readonly onWindowPaste = (e: ClipboardEvent) => {
    this.handlePaste(e);
  };
  private readonly onPointerControllerShapeCreated = ((e: ShapeCreatedEvent) => {
    const shape = e.detail.shape;
    const parentId = e.detail.parentId ?? null;
    this.objectLayer.addChild(shape);
    if (parentId) {
      const target = this.findNodeById(this.objectLayer, parentId);
      if (target instanceof FrameNode && !target.locked) {
        const transform = {
          origin: shape.toGlobal(new Point(0, 0)),
          xAxis: shape.toGlobal(new Point(1, 0)),
          yAxis: shape.toGlobal(new Point(0, 1)),
        };
        this.objectLayer.removeChild(shape);
        target.addChild(shape);
        this.applyWorldTransformToParent(shape, target, transform);
      }
    }
    this.dispatchLayerHierarchyChanged();
    this.useTool('select');
    this.history?.capture();
  }) as EventListener;
  private readonly onPointerControllerViewportChanged = ((e: Event) => {
    const detail = (e as CustomEvent).detail;
    const evt = new CustomEvent('viewport:changed', { detail });
    this.dispatchOnHost(evt);
  }) as EventListener;
  private readonly onPointerControllerHoverChanged = ((e: Event) => {
    const detail = (e as CustomEvent).detail;
    const evt = new CustomEvent('hover:changed', { detail });
    this.dispatchOnHost(evt);
  }) as EventListener;
  private readonly onHostPointerDown = (e: PointerEvent) => {
    this.pointerController?.onPointerDown(e);
  };
  private readonly onHostPointerMove = (e: PointerEvent) => {
    this.pointerController?.onPointerMove(e);
  };
  private readonly onHostPointerUp = (e: PointerEvent) => {
    this.pointerController?.onPointerUp(e);
  };
  private readonly onHostDoubleClick = (e: MouseEvent) => {
    this.pointerController?.onDoubleClick(e);
  };
  private readonly onHostPointerCancel = (_: PointerEvent) => {
    this.pointerController?.cancel();
  };
  private pointerControllerKeyDownHandler?: (e: KeyboardEvent) => void;
  private pointerControllerKeyUpHandler?: (e: KeyboardEvent) => void;

  activeTool: ToolName = 'select';

  constructor() {
    super();
  }

  async init(host: HTMLElement) {
    if (this.isInitialized) return;

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
    this.app.ticker.add(this.syncStageHitArea);

    this.initPointerController();
    this.history = new HistoryManager(this.objectLayer);
    await this.history.capture();
    this.ruler = new RulerOverlay(this.uiLayer, () => ({
      width: this.app.screen.width,
      height: this.app.screen.height,
      scale: this.world.scale.x,
      x: this.world.position.x,
      y: this.world.position.y,
    }));
    this.app.ticker.add(this.updateRuler);

    // zoom hotkeys
    window.addEventListener('keydown', this.onZoomKeyDown);
    window.addEventListener('keydown', this.onUndoRedoKeyDown);
    window.addEventListener('keydown', this.onToolKeyDown);

    // wheel: pan and pinch/ctrl zoom
    this.app.canvas.addEventListener('wheel', this.onCanvasWheel, { passive: false });

    // drag & drop / paste images
    this.host?.addEventListener('dragover', this.onHostDragOver);
    this.host?.addEventListener('drop', this.onHostDrop);
    this.host?.addEventListener('paste', this.onHostPaste);
    window.addEventListener('paste', this.onWindowPaste);
    this.isInitialized = true;
  }

  public setShortcutsEnabled(enabled: boolean) {
    this.shortcutsEnabled = enabled;
    this.pointerController?.setShortcutsEnabled(enabled);
  }

  public setObjectSnapEnabled(enabled: boolean) {
    this.objectSnapEnabled = enabled;
    this.pointerController?.setObjectSnapEnabled(enabled);
  }

  public isObjectSnapEnabled(): boolean {
    return this.objectSnapEnabled;
  }

  initPointerController() {
    this.pointerController = new PointerController(
      this.previewLayer,
      this.objectLayer,
      this.toolsLayer,
      this.dispatchLayerHierarchyChanged.bind(this),
      this.app,
      this.world,
      async () => {
        await this.history?.capture();
      },
      this
    );
    this.pointerController.setObjectSnapEnabled(this.objectSnapEnabled);

    // Listen for shape creation events from pointer controller
    this.pointerController.addEventListener('shape:created', this.onPointerControllerShapeCreated);
    this.pointerController.addEventListener(
      'viewport:changed',
      this.onPointerControllerViewportChanged
    );
    this.pointerController.addEventListener('hover:changed', this.onPointerControllerHoverChanged);

    this.host?.addEventListener('pointerdown', this.onHostPointerDown);
    this.host?.addEventListener('pointermove', this.onHostPointerMove);
    this.host?.addEventListener('pointerup', this.onHostPointerUp);
    this.host?.addEventListener('dblclick', this.onHostDoubleClick);
    this.host?.addEventListener('pointercancel', this.onHostPointerCancel);

    this.pointerControllerKeyDownHandler = this.pointerController.handleKeyDown.bind(this.pointerController);
    this.pointerControllerKeyUpHandler = this.pointerController.handleKeyUp.bind(this.pointerController);
    window.addEventListener('keydown', this.pointerControllerKeyDownHandler);
    window.addEventListener('keyup', this.pointerControllerKeyUpHandler);
  }

  private handleZoomKeys(e: KeyboardEvent) {
    if (!this.shortcutsEnabled) return;
    if (this.isEditingText()) return;

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

    // absolute zoom with digits (ctrl/cmd + number)
    if (hasMeta) {
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

  private handleToolKeys(e: KeyboardEvent) {
    if (!this.shortcutsEnabled) return;
    if (this.isEditingText()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case 'g':
        e.preventDefault();
        this.useTool('select');
        break;
      case 'o':
        e.preventDefault();
        this.useTool('ellipse');
        break;
      case 'r':
        e.preventDefault();
        this.useTool('rectangle');
        break;
      case 'l':
        e.preventDefault();
        this.useTool('line');
        break;
      case 's':
        e.preventDefault();
        this.useTool('star');
        break;
      case 't':
        e.preventDefault();
        this.useTool('text');
        break;
    }
  }

  private handleWheel(e: WheelEvent) {
    if (!this.shortcutsEnabled) return;
    if (this.isEditingText()) return;
    if (!this.host) return;

    const { deltaX, deltaY } = this.normalizeWheel(e);
    const hasMeta = e.ctrlKey || e.metaKey;

    if (hasMeta) {
      e.preventDefault();
      const point = new Point();
      this.app.renderer.events.mapPositionToPoint(point, e.clientX, e.clientY);
      const zoomFactor = Math.pow(1.0015, -deltaY);
      this.setZoomAt(this.world.scale.x * zoomFactor, point);
      return;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      e.preventDefault();
      this.panBy(-deltaX, -deltaY, 'wheel');
    }
  }

  private normalizeWheel(e: WheelEvent) {
    let dx = e.deltaX;
    let dy = e.deltaY;
    if (e.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (e.deltaMode === 2) {
      dx *= this.app.screen.width;
      dy *= this.app.screen.height;
    }
    return { deltaX: dx, deltaY: dy };
  }

  private handleUndoRedoKeys(e: KeyboardEvent) {
    const hasMeta = e.ctrlKey || e.metaKey;
    if (!hasMeta) return;
    if (this.isEditingText()) return;

    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      return;
    }

    if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      this.redo();
    }
  }

  public setZoom(newScale: number) {
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

    // reposition so center stays fixed (snap to integer pixels)
    const nextX = Math.round(center.x - worldX * clamped);
    const nextY = Math.round(center.y - worldY * clamped);
    this.world.position.set(nextX, nextY);

    this.dispatchOnHost(
      new CustomEvent('viewport:changed', {
        detail: {
          x: nextX,
          y: nextY,
          zoom: this.world.scale.x,
          source: 'zoom',
        },
      })
    );
  }

  public setZoomAt(newScale: number, center: Point) {
    const min = 0.1;
    const max = 5;
    const clamped = Math.max(min, Math.min(max, newScale));

    const oldScale = this.world.scale.x;
    if (clamped === oldScale) return;

    const worldX = (center.x - this.world.position.x) / oldScale;
    const worldY = (center.y - this.world.position.y) / oldScale;

    this.world.scale.set(clamped);

    const nextX = Math.round(center.x - worldX * clamped);
    const nextY = Math.round(center.y - worldY * clamped);
    this.world.position.set(nextX, nextY);

    this.dispatchOnHost(
      new CustomEvent('viewport:changed', {
        detail: {
          x: nextX,
          y: nextY,
          zoom: this.world.scale.x,
          source: 'zoom',
        },
      })
    );
  }

  public panBy(dx: number, dy: number, source: 'pan' | 'wheel' = 'pan') {
    this.world.position.x += dx;
    this.world.position.y += dy;
    this.dispatchOnHost(
      new CustomEvent('viewport:changed', {
        detail: {
          x: this.world.position.x,
          y: this.world.position.y,
          zoom: this.world.scale.x,
          source,
        },
      })
    );
  }

  private async handleDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    const point = this.getWorldPointFromClient(e.clientX, e.clientY);
    for (const file of files) {
      await this.addImageFromSource(await this.toDataUrl(file), point);
    }
  }

  private async handlePaste(e: ClipboardEvent) {
    if (e.defaultPrevented) return;
    if (this.isEditingText()) return;

    const clipboard = e.clipboardData;
    const items = Array.from(clipboard?.items ?? []);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (imageItems.length) {
      e.preventDefault();
      const point = this.getWorldPointFromClient(
        this.app.screen.width / 2,
        this.app.screen.height / 2,
        true
      );

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          await this.addImageFromSource(await this.toDataUrl(file), point);
        }
      }
      return;
    }

    const text = clipboard?.getData('text/plain') ?? '';
    if (!text.trim()) return;

    e.preventDefault();
    const point = this.getWorldPointFromClient(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      true
    );
    await this.addTextAt(text, point);
  }

  private async addTextAt(text: string, point: Point): Promise<AddedNodeResult> {
    const node = new TextNode({
      text,
      x: point.x,
      y: point.y,
      style: {
        fill: '#333333',
      },
    });
    return this.commitAddedNode(node);
  }

  /**
   * Public API for adding plain text as a text node.
   * Default placement is the center of current viewport.
   */
  public async addText(
    text: string,
    options?: { x: number; y: number; space?: 'world' | 'screen' }
  ): Promise<AddedNodeResult | null> {
    const content = text ?? '';
    if (!content.trim()) return null;

    let point: Point;
    if (options) {
      point =
        options.space === 'world'
          ? new Point(options.x, options.y)
          : this.getWorldPointFromClient(options.x, options.y, true);
    } else {
      point = this.getWorldPointFromClient(
        this.app.screen.width / 2,
        this.app.screen.height / 2,
        true
      );
    }
    return this.addTextAt(content, point);
  }

  /**
   * Public API for adding an image from URL/data URL/File/Blob.
   * Default placement is the center of current viewport.
   */
  public async addImage(
    source: string | File | Blob,
    options?: { x: number; y: number; space?: 'world' | 'screen' }
  ): Promise<AddedNodeResult | null> {
    let point: Point;
    if (options) {
      point =
        options.space === 'world'
          ? new Point(options.x, options.y)
          : this.getWorldPointFromClient(options.x, options.y, true);
    } else {
      point = this.getWorldPointFromClient(
        this.app.screen.width / 2,
        this.app.screen.height / 2,
        true
      );
    }
    return this.addImageFromSource(source, point);
  }

  /**
   * Public API for adding a frame node.
   * Default placement is the center of current viewport.
   */
  public async addFrame(options: AddFrameOptions): Promise<AddedNodeResult | null> {
    const width = Math.max(1, Math.round(options.width));
    const height = Math.max(1, Math.round(options.height));
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;

    const point =
      options.x !== undefined && options.y !== undefined
        ? options.space === 'world'
          ? new Point(options.x, options.y)
          : this.getWorldPointFromClient(options.x, options.y, true)
        : this.getWorldPointFromClient(
            this.app.screen.width / 2 - width / 2,
            this.app.screen.height / 2 - height / 2,
            true
          );

    const node = new FrameNode({
      name: options.name,
      width,
      height,
      x: Math.round(point.x),
      y: Math.round(point.y),
      backgroundColor:
        options.backgroundColor !== undefined
          ? options.backgroundColor
          : options.background === undefined
            ? '#ffffff'
            : options.background,
      borderColor: options.borderColor ?? '#A0A0A0',
      borderWidth: options.borderWidth ?? 1,
      clipContent: options.clipContent ?? true,
      style: {
        opacity: 1,
      },
    });
    return this.commitAddedNode(node);
  }

  private async addImageFromSource(
    source: string | File | Blob,
    point: Point
  ): Promise<AddedNodeResult | null> {
    try {
      const node = await ImageNode.fromSource({
        source,
        x: point.x,
        y: point.y,
      });
      return this.commitAddedNode(node);
    } catch (err) {
      console.error('Failed to add image', err);
      return null;
    }
  }

  private async commitAddedNode(node: BaseNode): Promise<AddedNodeResult> {
    this.objectLayer.addChild(node);
    this.dispatchLayerHierarchyChanged();
    await this.history?.capture();

    const inspectable = node.getInspectable();
    return {
      id: node.id,
      type: node.type,
      inspectable,
      update: {
        id: node.id,
        props: Object.fromEntries(inspectable.props.map((prop) => [prop.key, prop.value])),
      },
    };
  }

  private getWorldPointFromClient(clientX: number, clientY: number, isScreenCoords = false): Point {
    const p = new Point();
    if (isScreenCoords) {
      p.set(clientX, clientY);
    } else {
      this.app.renderer.events.mapPositionToPoint(p, clientX, clientY);
    }
    return this.world.toLocal(p);
  }

  async exportRaster(options: {
    type: 'png' | 'jpg';
    scope: 'all' | 'selection' | 'frame';
    frameId?: string;
    quality?: number;
    padding?: number;
    background?: string;
  }): Promise<string | null> {
    const bounds = this.getExportBounds(options.scope, options.frameId);
    if (!bounds) return null;

    const padding = options.padding ?? 0;
    const width = Math.max(1, Math.ceil(bounds.width + padding * 2));
    const height = Math.max(1, Math.ceil(bounds.height + padding * 2));

    const rt = RenderTexture.create({ width, height, resolution: 1 });
    const transform = new Matrix().translate(-bounds.x + padding, -bounds.y + padding);

    const clearColor =
      options.background !== undefined
        ? this.toColorNumber(options.background)
        : options.type === 'jpg'
          ? 0xffffff
          : new Color(0x000000).setAlpha(0);

    const render = () =>
      this.app.renderer.render({
        container: this.objectLayer,
        target: rt,
        clear: true,
        clearColor,
        transform,
      });

    if (options.scope === 'selection') {
      const selected = this.pointerController?.getSelectedNodes() ?? [];
      const restore = this.applySelectionVisibility(selected);
      try {
        render();
      } finally {
        restore();
      }
    } else if (options.scope === 'frame') {
      const frame = options.frameId ? this.findNodeById(this.objectLayer, options.frameId) : null;
      if (!(frame instanceof FrameNode)) return null;
      const restore = this.applySelectionVisibility([frame]);
      try {
        render();
      } finally {
        restore();
      }
    } else {
      render();
    }

    const canvas = this.app.renderer.extract.canvas(rt);

    if (canvas && canvas.toDataURL) {
      const mime = options.type === 'jpg' ? 'image/jpeg' : 'image/png';

      const dataUrl = canvas.toDataURL(mime, options.quality ?? 0.92);
      rt.destroy(true);
      return dataUrl;
    }

    rt.destroy(true);
    return null;
  }

  async exportSVG(options: {
    scope: 'all' | 'selection' | 'frame';
    frameId?: string;
    padding?: number;
    imageEmbed?: 'original' | 'display' | 'max';
    imageMaxEdge?: number;
    background?: string;
  }): Promise<string | null> {
    const bounds = this.getExportBounds(options.scope, options.frameId);
    if (!bounds) return null;

    const padding = options.padding ?? 0;
    const width = Math.max(1, Math.ceil(bounds.width + padding * 2));
    const height = Math.max(1, Math.ceil(bounds.height + padding * 2));
    const offsetX = -bounds.x + padding;
    const offsetY = -bounds.y + padding;

    const nodes =
      options.scope === 'selection'
        ? (this.pointerController?.getSelectedNodes() ?? [])
        : options.scope === 'frame'
          ? (() => {
              const frame = options.frameId ? this.findNodeById(this.objectLayer, options.frameId) : null;
              return frame instanceof FrameNode ? [frame] : [];
            })()
        : this.getRootNodes();
    if (!nodes.length) return null;

    const invWorld = this.world.worldTransform.clone().invert();
    const parts: string[] = [];

    if (options.background) {
      parts.push(
        `<rect x="0" y="0" width="${width}" height="${height}" fill="${options.background}"/>`
      );
    }

    for (const node of nodes) {
      parts.push(
        await this.nodeToSvg(node, {
          invWorld,
          offsetX,
          offsetY,
          imageEmbed: options.imageEmbed ?? 'original',
          imageMaxEdge: options.imageMaxEdge ?? 2048,
        })
      );
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<g transform="translate(${offsetX} ${offsetY})">`,
      parts.join(''),
      `</g>`,
      `</svg>`,
    ].join('');
  }

  private getExportBounds(scope: 'all' | 'selection' | 'frame', frameId?: string) {
    if (scope === 'frame') {
      const frame = frameId ? this.findNodeById(this.objectLayer, frameId) : null;
      if (!(frame instanceof FrameNode)) return null;
      return this.getFrameBounds(frame);
    }

    const nodes = scope === 'selection'
      ? (this.pointerController?.getSelectedNodes() ?? [])
      : this.getRootNodes();
    if (!nodes.length) return null;
    return this.getBoundsFromNodes(nodes);
  }

  private getFrameBounds(frame: FrameNode) {
    const tlGlobal = frame.toGlobal(new Point(0, 0));
    const brGlobal = frame.toGlobal(new Point(frame.width, frame.height));
    const tl = this.world.toLocal(tlGlobal);
    const br = this.world.toLocal(brGlobal);
    const x = Math.min(tl.x, br.x);
    const y = Math.min(tl.y, br.y);
    const width = Math.abs(br.x - tl.x);
    const height = Math.abs(br.y - tl.y);
    return { x, y, width, height };
  }

  private getBoundsFromNodes(nodes: BaseNode[]) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const b = node.getBounds();
      const tl = this.world.toLocal(new Point(b.x, b.y));
      const br = this.world.toLocal(new Point(b.x + b.width, b.y + b.height));
      minX = Math.min(minX, tl.x);
      minY = Math.min(minY, tl.y);
      maxX = Math.max(maxX, br.x);
      maxY = Math.max(maxY, br.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private getRootNodes() {
    return this.objectLayer.children.filter((c): c is BaseNode => c instanceof BaseNode);
  }

  private getAllBaseNodes(container: Container) {
    const result: BaseNode[] = [];
    const walk = (c: Container) => {
      c.children.forEach((child) => {
        if (child instanceof BaseNode) {
          result.push(child);
          if (child.children.length) {
            walk(child);
          }
        }
      });
    };
    walk(container);
    return result;
  }

  private applySelectionVisibility(selected: BaseNode[]) {
    const keep = new Set<BaseNode>();
    const addDesc = (node: BaseNode) => {
      keep.add(node);
      node.children.forEach((child) => {
        if (child instanceof BaseNode) addDesc(child);
      });
    };
    const addAnc = (node: BaseNode) => {
      let p = node.parent;
      while (p && p instanceof BaseNode) {
        keep.add(p);
        p = p.parent;
      }
    };

    selected.forEach((node) => {
      addDesc(node);
      addAnc(node);
    });

    const all = this.getAllBaseNodes(this.objectLayer);
    const restore: Array<{ node: BaseNode; visible: boolean }> = [];
    all.forEach((node) => {
      restore.push({ node, visible: node.visible });
      if (!keep.has(node)) node.visible = false;
    });

    return () => {
      restore.forEach(({ node, visible }) => {
        node.visible = visible;
      });
    };
  }

  private toColorNumber(color: string): number {
    if (color.startsWith('#')) {
      return parseInt(color.slice(1), 16);
    }
    if (color.startsWith('0x')) {
      return parseInt(color.slice(2), 16);
    }
    return 0xffffff;
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
        return true;
      }
      if (
        normalized === 'false' ||
        normalized === '0' ||
        normalized === 'no' ||
        normalized === 'off' ||
        normalized === '' ||
        normalized === 'null' ||
        normalized === 'undefined'
      ) {
        return false;
      }
    }
    return Boolean(value);
  }

  private async nodeToSvg(
    node: BaseNode,
    opts: {
      invWorld: Matrix;
      offsetX: number;
      offsetY: number;
      imageEmbed: 'original' | 'display' | 'max';
      imageMaxEdge: number;
    }
  ): Promise<string> {
    const m = node.worldTransform.clone();
    m.prepend(opts.invWorld);
    const transform = `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.tx} ${m.ty})`;
    const style = this.styleToSvg(node.style);
    const opacity = node.style.opacity !== undefined ? ` opacity="${node.style.opacity}"` : '';

    switch (node.type) {
      case 'rectangle': {
        const n = node as any;
        const rx = n.cornerRadius ? ` rx="${n.cornerRadius}" ry="${n.cornerRadius}"` : '';
        return `<rect x="0" y="0" width="${n.width}" height="${n.height}"${rx} transform="${transform}"${style}${opacity}/>`;
      }
      case 'ellipse': {
        const n = node as any;
        const cx = n.width / 2;
        const cy = n.height / 2;
        return `<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" transform="${transform}"${style}${opacity}/>`;
      }
      case 'circle': {
        const n = node as any;
        return `<circle cx="0" cy="0" r="${n.radius}" transform="${transform}"${style}${opacity}/>`;
      }
      case 'line': {
        const n = node as any;
        const stroke = node.style.stroke ?? '#000000';
        const width = node.style.strokeWidth ?? 1;
        const op = node.style.opacity !== undefined ? ` opacity="${node.style.opacity}"` : '';
        return `<line x1="${n.startX}" y1="${n.startY}" x2="${n.endX}" y2="${n.endY}" transform="${transform}" stroke="${stroke}" stroke-width="${width}" fill="none"${op}/>`;
      }
      case 'star': {
        const n = node as any;
        const points = this.starPointsToSvg(n);
        return `<polygon points="${points}" transform="${transform}"${style}${opacity}/>`;
      }
      case 'text': {
        const n = node as any;
        const fontSize = n.style.fontSize ?? 20;
        const fontFamily = n.style.fontFamily ?? DEFAULT_FONT_FAMILY;
        const fontWeight = n.style.fontWeight ?? 'normal';
        const fontStyle = n.style.fontStyle ?? 'normal';
        const fill = n.style.fill ?? '#000000';
        return `<text x="0" y="0" dominant-baseline="hanging" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${fill}" transform="${transform}"${opacity}>${this.escapeXml(n.text)}</text>`;
      }
      case 'image': {
        const n = node as any;
        const href = await this.resolveImageDataUrl(n, opts.imageEmbed, opts.imageMaxEdge);
        return `<image x="0" y="0" width="${n.width}" height="${n.height}" href="${href}" transform="${transform}"${opacity}/>`;
      }
      case 'group': {
        const n = node as any;
        const children: Array<Promise<string>> = n.children
          .filter((c: any) => c instanceof BaseNode)
          .map((c: BaseNode) =>
            this.nodeToSvg(c, {
              invWorld: opts.invWorld,
              offsetX: opts.offsetX,
              offsetY: opts.offsetY,
              imageEmbed: opts.imageEmbed,
              imageMaxEdge: opts.imageMaxEdge,
            })
          );
        return (await Promise.all(children)).join('');
      }
      case 'frame': {
        const n = node as FrameNode;
        const children: Array<Promise<string>> = n.children
          .filter((c): c is BaseNode => c instanceof BaseNode)
          .map((c) =>
            this.nodeToSvg(c, {
              invWorld: opts.invWorld,
              offsetX: opts.offsetX,
              offsetY: opts.offsetY,
              imageEmbed: opts.imageEmbed,
              imageMaxEdge: opts.imageMaxEdge,
            })
          );
        const childSvg: string = (await Promise.all(children)).join('');
        const backgroundFill = n.backgroundColor ?? 'none';
        const stroke = n.borderColor;
        const strokeWidth = n.borderWidth;
        const frameRect = `<rect x="0" y="0" width="${n.width}" height="${n.height}" fill="${backgroundFill}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="${transform}"${opacity}/>`;

        if (!n.clipContent) {
          return `${frameRect}${childSvg}`;
        }

        const clipId = `frame-clip-${n.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        return [
          `<defs><clipPath id="${clipId}"><rect x="0" y="0" width="${n.width}" height="${n.height}" transform="${transform}"/></clipPath></defs>`,
          frameRect,
          `<g clip-path="url(#${clipId})">${childSvg}</g>`,
        ].join('');
      }
      default:
        return '';
    }
  }

  private starPointsToSvg(node: any) {
    const outerRadiusX = node.width / 2;
    const outerRadiusY = node.height / 2;
    const ratio = node.outerRadius > 0 ? node.innerRadius / node.outerRadius : 0.5;
    const innerRadiusX = outerRadiusX * ratio;
    const innerRadiusY = outerRadiusY * ratio;
    const offsetX = outerRadiusX;
    const offsetY = outerRadiusY;
    const pts: string[] = [];
    for (let i = 0; i < node.points * 2; i++) {
      const isOuter = i % 2 === 0;
      const radiusX = isOuter ? outerRadiusX : innerRadiusX;
      const radiusY = isOuter ? outerRadiusY : innerRadiusY;
      const angle = (i * Math.PI) / node.points - Math.PI / 2;
      const x = Math.cos(angle) * radiusX + offsetX;
      const y = Math.sin(angle) * radiusY + offsetY;
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }

  private styleToSvg(style: any) {
    const fill = style.fill ?? 'none';
    const stroke = style.stroke ?? 'none';
    const strokeWidth = style.strokeWidth ?? 0;
    return ` fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"`;
  }

  private escapeXml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private async resolveImageDataUrl(
    node: any,
    mode: 'original' | 'display' | 'max',
    maxEdge: number
  ) {
    const src = node.source ?? '';
    if (typeof src === 'string' && src.startsWith('data:') && mode === 'original') {
      return src;
    }

    const img = await this.loadImage(src);
    let targetW = img.naturalWidth || img.width;
    let targetH = img.naturalHeight || img.height;

    if (mode === 'display') {
      targetW = Math.max(1, Math.round(node.width));
      targetH = Math.max(1, Math.round(node.height));
    } else if (mode === 'max') {
      const longest = Math.max(targetW, targetH);
      if (longest > maxEdge) {
        const scale = maxEdge / longest;
        targetW = Math.max(1, Math.round(targetW * scale));
        targetH = Math.max(1, Math.round(targetH * scale));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, targetW, targetH);
    }
    return canvas.toDataURL('image/png');
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  private toDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  private isEditingText(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
  }

  async undo() {
    await this.history?.undo();
    this.dispatchLayerHierarchyChanged();
    this.pointerController?.clearSelection();
  }

  async redo() {
    await this.history?.redo();
    this.dispatchLayerHierarchyChanged();
    this.pointerController?.clearSelection();
  }

  async exportJSON(): Promise<SceneDocument | null> {
    const doc = await this.history?.exportDocument();
    return doc ?? null;
  }

  async importJSON(doc: SceneDocument): Promise<void> {
    await this.history?.importDocument(doc);
    this.dispatchLayerHierarchyChanged();
    this.pointerController?.clearSelection();
    this.world.scale.set(1);
    this.world.position.set(0, 0);
    this.dispatchOnHost(
      new CustomEvent('viewport:changed', {
        detail: {
          x: this.world.position.x,
          y: this.world.position.y,
          zoom: this.world.scale.x,
          source: 'import',
        },
      })
    );
  }

  hasDocumentContent(): boolean {
    return this.history?.hasContent() ?? false;
  }

  async clearDocument(): Promise<void> {
    await this.history?.clearDocument();
    this.dispatchLayerHierarchyChanged();
    this.pointerController?.clearSelection();
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
      detail: { hierarchy },
    });
    this.dispatchOnHost(event);
  }

  public selectNodeById(id: string | null) {
    const node = id ? this.findNodeById(this.objectLayer, id) : null;
    this.pointerController?.selectNode(node);
  }

  public selectNodesById(ids: string[]) {
    const nodes = ids
      .map((id) => this.findNodeById(this.objectLayer, id))
      .filter((n): n is BaseNode => n !== null);
    this.pointerController?.selectNodes(nodes);
  }

  public setHoverById(id: string | null) {
    const node = id ? this.findNodeById(this.objectLayer, id) : null;
    this.pointerController?.setHoverNode(node);
  }

  public getFlatLayers(options: GetFlatLayersOptions = {}): FlatLayerItem[] {
    const { parentId = null, recursive = true, topFirst = true } = options;
    const parent = this.resolveLayerParent(parentId);
    if (!parent) return [];

    const layers: FlatLayerItem[] = [];
    this.collectFlatLayers(parent, parentId, 0, layers, recursive, topFirst);
    return layers;
  }

  public canMoveLayer(
    sourceId: string,
    targetId: string,
    position: LayerMovePosition
  ): LayerMoveValidation {
    return this.validateLayerMove([sourceId], targetId, position);
  }

  public canMoveLayers(
    sourceIds: string[],
    targetId: string,
    position: LayerMovePosition
  ): LayerMoveValidation {
    return this.validateLayerMove(sourceIds, targetId, position);
  }

  public async moveLayer(
    sourceId: string,
    targetId: string,
    position: LayerMovePosition,
    options: { recordHistory?: boolean } = {}
  ): Promise<boolean> {
    return this.moveLayers([sourceId], targetId, position, options);
  }

  public async moveLayers(
    sourceIds: string[],
    targetId: string,
    position: LayerMovePosition,
    options: { recordHistory?: boolean } = {}
  ): Promise<boolean> {
    const validation = this.validateLayerMove(sourceIds, targetId, position);
    if (!validation.ok) return false;

    const sourceNodes = this.getMoveSourceNodes(sourceIds);
    const targetNode = this.findNodeById(this.objectLayer, targetId);
    if (!targetNode) return false;

    const destinationParent = position === 'inside' ? targetNode : (targetNode.parent as Container | null);
    if (!destinationParent) return false;

    const insertionIndex = this.resolveInsertionIndex(sourceNodes, destinationParent, targetNode, position);
    const orderedNodes = sourceNodes
      .slice()
      .sort((a, b) => this.compareNodeStackOrder(a, b));
    const transforms = new Map<string, { origin: Point; xAxis: Point; yAxis: Point }>();

    orderedNodes.forEach((node) => {
      transforms.set(node.id, {
        origin: node.toGlobal(new Point(0, 0)),
        xAxis: node.toGlobal(new Point(1, 0)),
        yAxis: node.toGlobal(new Point(0, 1)),
      });
      node.parent?.removeChild(node);
    });

    let nextIndex = Math.max(0, Math.min(insertionIndex, destinationParent.children.length));
    orderedNodes.forEach((node) => {
      destinationParent.addChildAt(node, nextIndex);
      const transform = transforms.get(node.id);
      if (transform) {
        this.applyWorldTransformToParent(node, destinationParent, transform);
      }
      nextIndex += 1;
    });

    this.dispatchLayerHierarchyChanged();
    if (options.recordHistory !== false) {
      await this.history?.capture();
    }
    return true;
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

      if (node.type === 'star') {
        const n: any = node as any;
        const hasPoints = Object.prototype.hasOwnProperty.call(props, 'points');
        const hasInner = Object.prototype.hasOwnProperty.call(props, 'innerRadius');
        const hasOuter = Object.prototype.hasOwnProperty.call(props, 'outerRadius');
        const hasRatio = Object.prototype.hasOwnProperty.call(props, 'innerRatio');
        if (hasPoints || hasInner || hasOuter || hasRatio) {
          const prevRatio = n.outerRadius > 0 ? n.innerRadius / n.outerRadius : 0.5;
          if (hasPoints) n.points = Number((props as any).points);
          if (hasOuter) {
            const nextOuter = Number((props as any).outerRadius);
            n.outerRadius = nextOuter;
            node.width = nextOuter * 2;
            node.height = nextOuter * 2;
            if (!hasInner && !hasRatio) {
              n.innerRadius = nextOuter * prevRatio;
            }
          }
          if (hasInner) {
            n.innerRadius = Number((props as any).innerRadius);
          }
          if (hasRatio) {
            const raw = Number((props as any).innerRatio);
            const ratio = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : prevRatio;
            n.innerRadius = n.outerRadius * ratio;
          }
          n.redraw?.();
        }
      }

      Object.entries(props).forEach(([key, value]) => {
        if (node.locked && key !== 'locked' && key !== 'visible') {
          return;
        }
        if (
          node.type === 'star' &&
          (key === 'points' ||
            key === 'innerRadius' ||
            key === 'outerRadius' ||
            key === 'innerRatio')
        ) {
          return;
        }
        switch (key) {
          case 'name':
            node.name = value as string;
            break;
          case 'x':
            this.setNodeGlobalPosition(node, Number(value), undefined);
            break;
          case 'y':
            this.setNodeGlobalPosition(node, undefined, Number(value));
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
            if (node.type !== 'frame') {
              node.rotation = Number(value);
            }
            break;
          case 'visible':
            node.visible = this.parseBoolean(value);
            break;
          case 'locked':
            node.locked = this.parseBoolean(value);
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
          case 'background':
          case 'backgroundColor':
            if (node.type === 'frame') {
              (node as FrameNode).setBackgroundColor(
                value === null || value === '' ? null : String(value)
              );
            }
            break;
          case 'borderColor':
            if (node.type === 'frame' && value !== null && value !== '') {
              (node as FrameNode).setBorderColor(String(value));
            }
            break;
          case 'borderWidth':
            if (node.type === 'frame') {
              (node as FrameNode).setBorderWidth(Number(value));
            }
            break;
          case 'clipContent':
            if (node.type === 'frame') {
              (node as FrameNode).setClipContent(this.parseBoolean(value));
            }
            break;
          case 'startX':
          case 'startY':
          case 'endX':
          case 'endY':
            if (node.type === 'line') {
              const currentStart = this.getLinePointGlobal(node as any, 'start');
              const currentEnd = this.getLinePointGlobal(node as any, 'end');
              const targetStart = { ...currentStart };
              const targetEnd = { ...currentEnd };
              if (key === 'startX') targetStart.x = Number(value);
              if (key === 'startY') targetStart.y = Number(value);
              if (key === 'endX') targetEnd.x = Number(value);
              if (key === 'endY') targetEnd.y = Number(value);

              const parent = (node as any).parent as Container | null;
              const startLocal = parent
                ? parent.toLocal(new Point(targetStart.x, targetStart.y))
                : new Point(targetStart.x, targetStart.y);
              const endLocal = parent
                ? parent.toLocal(new Point(targetEnd.x, targetEnd.y))
                : new Point(targetEnd.x, targetEnd.y);

              (node as any).position.set(startLocal.x, startLocal.y);
              (node as any).startX = 0;
              (node as any).startY = 0;
              (node as any).endX = endLocal.x - startLocal.x;
              (node as any).endY = endLocal.y - startLocal.y;
              (node as any).refresh?.();
              (node as any).redraw?.();
            }
            break;
        }
      });

      touchedNodes.push(node);
    });

    if (touchedNodes.length) {
      if (touchedNodes.some((node) => node.locked || !node.visible)) {
        this.pointerController?.clearSelection();
      }
      // Let listeners refresh panels
      const nodes: InspectableNode[] = touchedNodes
        .map((n) =>
          typeof (n as any).getInspectable === 'function' ? (n as any).getInspectable() : null
        )
        .filter((n): n is InspectableNode => n !== null);

      const propEvent = new CustomEvent('properties:changed', { detail: { nodes } });
      this.dispatchOnHost(propEvent);
      this.dispatchLayerHierarchyChanged();
      this.history?.capture();
    }
  }

  private applyStyle(node: BaseNode, key: string, value: any) {
    if (node.type === 'frame') {
      const frame = node as FrameNode;
      if (key === 'fill') {
        frame.setBackgroundColor(value === null || value === '' ? null : String(value));
        return;
      }
      if (key === 'stroke') {
        if (value !== null && value !== '') {
          frame.setBorderColor(String(value));
        }
        return;
      }
      if (key === 'strokeWidth') {
        frame.setBorderWidth(Number(value));
        return;
      }
      if (key === 'opacity') {
        frame.setStyle({ opacity: Number(value) });
        return;
      }
    }

    const normalizedValue =
      key === 'strokeWidth'
        ? Math.max(0, Math.round(Number.isFinite(Number(value)) ? Number(value) : 0))
        : key === 'fontFamily'
          ? normalizeFontFamily(value)
        : key === 'fontStyle'
          ? normalizeFontStyle(value)
          : key === 'fontWeight'
            ? normalizeFontWeight(value)
        : value;
    const styleUpdate: any = { [key]: normalizedValue };
    if ('setStyle' in node && typeof (node as any).setStyle === 'function') {
      (node as any).setStyle(styleUpdate);
    } else {
      node.style = { ...node.style, ...styleUpdate };
      (node as any).redraw?.();
    }
  }

  private setNodeGlobalPosition(node: BaseNode, x?: number, y?: number) {
    const currentGlobal = this.getNodeGlobalPosition(node);
    const targetX = x ?? currentGlobal.x;
    const targetY = y ?? currentGlobal.y;
    const local = node.parent
      ? node.parent.toLocal(new Point(targetX, targetY))
      : new Point(targetX, targetY);
    node.position.set(local.x, local.y);
  }

  private getNodeGlobalPosition(node: BaseNode): Point {
    if (!node.parent) return new Point(node.position.x, node.position.y);
    return node.parent.toGlobal(new Point(node.position.x, node.position.y));
  }

  private getLinePointGlobal(
    node: { parent?: Container; position: Point; startX: number; startY: number; endX: number; endY: number },
    which: 'start' | 'end'
  ): Point {
    const local = new Point(
      node.position.x + (which === 'start' ? node.startX : node.endX),
      node.position.y + (which === 'start' ? node.startY : node.endY)
    );
    return node.parent ? node.parent.toGlobal(local) : local;
  }

  private resolveLayerParent(parentId: string | null): Container | null {
    if (parentId === null) return this.objectLayer;
    const node = this.findNodeById(this.objectLayer, parentId);
    if (!node || !(node instanceof GroupNode || node instanceof FrameNode)) return null;
    return node;
  }

  private collectFlatLayers(
    parent: Container,
    parentId: string | null,
    depth: number,
    output: FlatLayerItem[],
    recursive: boolean,
    topFirst: boolean
  ) {
    const nodes = parent.children.filter((child): child is BaseNode => child instanceof BaseNode);
    const ordered = topFirst ? nodes.slice().reverse() : nodes.slice();

    ordered.forEach((node) => {
      output.push({
        id: node.id,
        type: node.type,
        name: node.name,
        visible: node.visible,
        locked: node.locked,
        parentId,
        depth,
        zIndex: parent.getChildIndex(node),
        isGroup: node instanceof GroupNode,
        childCount: node.children.filter((child): child is BaseNode => child instanceof BaseNode).length,
      });

      if (recursive && node instanceof GroupNode) {
        this.collectFlatLayers(node, node.id, depth + 1, output, recursive, topFirst);
      }
    });
  }

  private validateLayerMove(
    sourceIds: string[],
    targetId: string,
    position: LayerMovePosition
  ): LayerMoveValidation {
    if (!sourceIds.length) return { ok: false, reason: 'No source ids provided.' };
    const uniqueIds = Array.from(new Set(sourceIds));
    if (uniqueIds.includes(targetId)) {
      return { ok: false, reason: 'Source and target cannot be the same node.' };
    }

    const resolvedNodes = uniqueIds.map((id) => this.findNodeById(this.objectLayer, id));
    if (resolvedNodes.some((node) => !node)) {
      return { ok: false, reason: 'Some source ids do not exist.' };
    }

    const sourceNodes = this.getMoveSourceNodes(uniqueIds);
    if (!sourceNodes.length) {
      return { ok: false, reason: 'No valid source nodes found.' };
    }

    const targetNode = this.findNodeById(this.objectLayer, targetId);
    if (!targetNode) return { ok: false, reason: 'Target node not found.' };

    const destinationParent = position === 'inside' ? targetNode : (targetNode.parent as Container | null);
    if (!destinationParent) return { ok: false, reason: 'Target has no destination parent.' };
    if (position === 'inside' && !(targetNode instanceof GroupNode || targetNode instanceof FrameNode)) {
      return { ok: false, reason: 'Only group or frame nodes can accept inside drops.' };
    }
    if (
      destinationParent instanceof BaseNode &&
      destinationParent.locked
    ) {
      return { ok: false, reason: 'Destination parent is locked.' };
    }
    if (sourceNodes.some((node) => node.locked)) {
      return { ok: false, reason: 'Locked nodes cannot be moved.' };
    }
    if (sourceNodes.some((node) => this.isAncestorNode(node, destinationParent))) {
      return { ok: false, reason: 'Cannot move a node into its own descendant.' };
    }
    return { ok: true };
  }

  private resolveInsertionIndex(
    sourceNodes: BaseNode[],
    destinationParent: Container,
    targetNode: BaseNode,
    position: LayerMovePosition
  ): number {
    if (position === 'inside') {
      return destinationParent.children.length;
    }

    let index = destinationParent.getChildIndex(targetNode);
    if (position === 'after') {
      index += 1;
    }

    sourceNodes.forEach((node) => {
      if (node.parent !== destinationParent) return;
      const childIndex = destinationParent.getChildIndex(node);
      if (childIndex < index) {
        index -= 1;
      }
    });
    return index;
  }

  private getMoveSourceNodes(sourceIds: string[]): BaseNode[] {
    const uniqueIds = Array.from(new Set(sourceIds));
    const nodes = uniqueIds
      .map((id) => this.findNodeById(this.objectLayer, id))
      .filter((node): node is BaseNode => node !== null);
    const nodeSet = new Set(nodes);
    return nodes.filter((node) => !this.hasAncestorInSet(node, nodeSet));
  }

  private hasAncestorInSet(node: BaseNode, set: Set<BaseNode>): boolean {
    let parent = node.parent;
    while (parent) {
      if (parent instanceof BaseNode && set.has(parent)) return true;
      if (parent === this.objectLayer) break;
      parent = parent.parent;
    }
    return false;
  }

  private isAncestorNode(ancestor: BaseNode, node: Container | null): boolean {
    let current: Container | null = node;
    while (current) {
      if (current === ancestor) return true;
      if (current === this.objectLayer) break;
      current = current.parent;
    }
    return false;
  }

  private compareNodeStackOrder(a: BaseNode, b: BaseNode): number {
    const pathA = this.getNodePathIndices(a);
    const pathB = this.getNodePathIndices(b);
    const len = Math.min(pathA.length, pathB.length);
    for (let i = 0; i < len; i += 1) {
      if (pathA[i] !== pathB[i]) return pathA[i] - pathB[i];
    }
    return pathA.length - pathB.length;
  }

  private getNodePathIndices(node: BaseNode): number[] {
    const indices: number[] = [];
    let current: Container | null = node;
    while (current && current !== this.objectLayer) {
      const parent = current.parent as Container | null;
      if (!parent) break;
      indices.push(parent.getChildIndex(current));
      current = parent;
    }
    return indices.reverse();
  }

  private applyWorldTransformToParent(
    node: BaseNode,
    parent: Container,
    transform: { origin: Point; xAxis: Point; yAxis: Point }
  ) {
    const origin = parent.toLocal(transform.origin);
    const xAxis = parent.toLocal(transform.xAxis);
    const yAxis = parent.toLocal(transform.yAxis);
    const xVector = new Point(xAxis.x - origin.x, xAxis.y - origin.y);
    const yVector = new Point(yAxis.x - origin.x, yAxis.y - origin.y);
    const scaleX = Math.hypot(xVector.x, xVector.y) || 1;
    const scaleY = Math.hypot(yVector.x, yVector.y) || 1;
    const rotation = Math.atan2(xVector.y, xVector.x);

    node.position.copyFrom(origin);
    node.rotation = rotation;
    node.scale.set(scaleX, scaleY);
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
    this.dispatchEvent(event);
  }

  destroy() {
    this.app.ticker.remove(this.syncStageHitArea);
    this.app.ticker.remove(this.updateRuler);

    window.removeEventListener('keydown', this.onZoomKeyDown);
    window.removeEventListener('keydown', this.onUndoRedoKeyDown);
    window.removeEventListener('keydown', this.onToolKeyDown);
    if (this.pointerControllerKeyDownHandler) {
      window.removeEventListener('keydown', this.pointerControllerKeyDownHandler);
    }
    if (this.pointerControllerKeyUpHandler) {
      window.removeEventListener('keyup', this.pointerControllerKeyUpHandler);
    }

    this.app.canvas.removeEventListener('wheel', this.onCanvasWheel);
    this.host?.removeEventListener('dragover', this.onHostDragOver);
    this.host?.removeEventListener('drop', this.onHostDrop);
    this.host?.removeEventListener('paste', this.onHostPaste);
    window.removeEventListener('paste', this.onWindowPaste);
    this.host?.removeEventListener('pointerdown', this.onHostPointerDown);
    this.host?.removeEventListener('pointermove', this.onHostPointerMove);
    this.host?.removeEventListener('pointerup', this.onHostPointerUp);
    this.host?.removeEventListener('dblclick', this.onHostDoubleClick);
    this.host?.removeEventListener('pointercancel', this.onHostPointerCancel);

    if (this.pointerController) {
      this.pointerController.removeEventListener(
        'shape:created',
        this.onPointerControllerShapeCreated
      );
      this.pointerController.removeEventListener(
        'viewport:changed',
        this.onPointerControllerViewportChanged
      );
      this.pointerController.removeEventListener(
        'hover:changed',
        this.onPointerControllerHoverChanged
      );
    }

    this.pointerControllerKeyDownHandler = undefined;
    this.pointerControllerKeyUpHandler = undefined;
    this.pointerController = undefined;
    this.ruler = undefined;
    this.history = undefined;
    this.host = undefined;
    this.isInitialized = false;
    this.app.destroy(true);
  }

  getLayerHierarchy() {
    return LayerHierarchy.getHierarchy(this.objectLayer);
  }

  getFrames(): FrameNode[] {
    return this.getAllBaseNodes(this.objectLayer).filter((node): node is FrameNode => node instanceof FrameNode);
  }

  getFrameById(id: string): FrameNode | null {
    const node = this.findNodeById(this.objectLayer, id);
    return node instanceof FrameNode ? node : null;
  }

  getPixiApp() {
    return this.app;
  }
}

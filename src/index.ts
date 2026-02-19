import './ccd.css';
import { Application, Container, Matrix, Point, RenderTexture, Color } from 'pixi.js';
import { PointerController } from './PointerController';
import type { ShapeCreatedEvent } from './events';
import { LayerHierarchy } from './core/layers/LayerHierarchy';
import { BaseNode } from './core/nodes/BaseNode';
import type { InspectableNode } from './core/nodes';
import { ImageNode } from './core/nodes/ImageNode';
import { HistoryManager } from './core/history/HistoryManager';
import type { SceneDocument } from './core/history/HistoryManager';
import { RulerOverlay } from './core/ui/RulerOverlay';

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
  history?: HistoryManager;
  private ruler?: RulerOverlay;

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
    this.history = new HistoryManager(this.objectLayer);
    await this.history.capture();
    this.ruler = new RulerOverlay(this.uiLayer, () => ({
      width: this.app.screen.width,
      height: this.app.screen.height,
      scale: this.world.scale.x,
      x: this.world.position.x,
      y: this.world.position.y,
    }));
    this.app.ticker.add(() => this.ruler?.update());

    // zoom hotkeys
    window.addEventListener('keydown', this.handleZoomKeys.bind(this));
    window.addEventListener('keydown', this.handleUndoRedoKeys.bind(this));
    window.addEventListener('keydown', this.handleToolKeys.bind(this));

    // wheel: pan and pinch/ctrl zoom
    this.app.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // drag & drop / paste images
    this.host?.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    this.host?.addEventListener('drop', (e) => {
      this.handleDrop(e);
    });
    this.host?.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
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
      }
    );

    // Listen for shape creation events from pointer controller
    this.pointerController.addEventListener('shape:created', ((e: ShapeCreatedEvent) => {
      const shape = e.detail.shape;
      this.objectLayer.addChild(shape);
      this.dispatchLayerHierarchyChanged();
      this.useTool('select');
      this.history?.capture();
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
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (!imageItems.length) return;

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
  }

  private async addImageFromSource(source: string | File | Blob, point: Point) {
    try {
      const node = await ImageNode.fromSource({
        source,
        x: point.x,
        y: point.y,
      });
      this.objectLayer.addChild(node);
      this.dispatchLayerHierarchyChanged();
      await this.history?.capture();
    } catch (err) {
      console.error('Failed to add image', err);
    }
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
    scope: 'all' | 'selection';
    quality?: number;
    padding?: number;
    background?: string;
  }): Promise<string | null> {
    const bounds = this.getExportBounds(options.scope);
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
    scope: 'all' | 'selection';
    padding?: number;
    imageEmbed?: 'original' | 'display' | 'max';
    imageMaxEdge?: number;
    background?: string;
  }): Promise<string | null> {
    const bounds = this.getExportBounds(options.scope);
    if (!bounds) return null;

    const padding = options.padding ?? 0;
    const width = Math.max(1, Math.ceil(bounds.width + padding * 2));
    const height = Math.max(1, Math.ceil(bounds.height + padding * 2));
    const offsetX = -bounds.x + padding;
    const offsetY = -bounds.y + padding;

    const nodes =
      options.scope === 'selection'
        ? (this.pointerController?.getSelectedNodes() ?? [])
        : this.getRootNodes();

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

  private getExportBounds(scope: 'all' | 'selection') {
    const nodes =
      scope === 'selection'
        ? (this.pointerController?.getSelectedNodes() ?? [])
        : this.getRootNodes();
    if (!nodes.length) return null;
    return this.getBoundsFromNodes(nodes);
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

  private async nodeToSvg(
    node: BaseNode,
    opts: {
      invWorld: Matrix;
      offsetX: number;
      offsetY: number;
      imageEmbed: 'original' | 'display' | 'max';
      imageMaxEdge: number;
    }
  ) {
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
        const fontFamily = n.style.fontFamily ?? 'Arial';
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
        const children = n.children
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
      this.history?.capture();
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

  getPixiApp() {
    return this.app;
  }
}

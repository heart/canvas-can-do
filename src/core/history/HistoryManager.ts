import type { Container } from 'pixi.js';
import { BaseNode } from '../nodes/BaseNode';
import type { Style } from '../nodes/BaseNode';
import { RectangleNode } from '../nodes/RectangleNode';
import { EllipseNode } from '../nodes/EllipseNode';
import { CircleNode } from '../nodes/CircleNode';
import { LineNode } from '../nodes/LineNode';
import { StarNode } from '../nodes/StarNode';
import { TextNode } from '../nodes/TextNode';
import { GroupNode } from '../nodes/GroupNode';
import { ImageNode } from '../nodes/ImageNode';
import { FrameNode } from '../nodes/FrameNode';
import { normalizeExportPresetStore, type ExportPresetStore } from '../export/exportSettings';

export type SerializedNode = {
  id: string;
  type: BaseNode['type'];
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  rotation: number;
  scale: { x: number; y: number };
  style: Style;
  width?: number;
  height?: number;
  data?: Record<string, any>;
  children?: SerializedNode[];
};

type SceneSnapshot = {
  nodes: SerializedNode[];
  exportStore?: ExportPresetStore;
};

type HistoryManagerOptions = {
  getExportStore?: () => ExportPresetStore;
  setExportStore?: (store: ExportPresetStore) => void;
};

export type SceneDocument = {
  version: 1;
  nodes: SerializedNode[];
  exportStore?: ExportPresetStore;
};

export class HistoryManager {
  private static readonly MAX_UNDO_STACK_SIZE = 200;
  private undoStack: SceneSnapshot[] = [];
  private redoStack: SceneSnapshot[] = [];
  private lastSnapshotKey = '';
  private captureRequested = false;
  private captureInFlight: Promise<void> | null = null;

  private objectLayer: Container;
  private readonly getExportStore?: () => ExportPresetStore;
  private readonly setExportStore?: (store: ExportPresetStore) => void;

  constructor(objectLayer: Container, options: HistoryManagerOptions = {}) {
    this.objectLayer = objectLayer;
    this.getExportStore = options.getExportStore;
    this.setExportStore = options.setExportStore;
  }

  async capture(): Promise<void> {
    this.captureRequested = true;
    if (!this.captureInFlight) {
      this.captureInFlight = this.flushCaptureQueue();
    }
    await this.captureInFlight;
  }

  async undo(): Promise<void> {
    if (this.undoStack.length < 2) return;
    const current = this.undoStack.pop();
    if (current) this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    if (!prev) return;
    await this.restore(prev);
    this.lastSnapshotKey = this.snapshotKey(prev);
  }

  async redo(): Promise<void> {
    if (!this.redoStack.length) return;
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(next);
    await this.restore(next);
    this.lastSnapshotKey = this.snapshotKey(next);
  }

  private async serializeScene(): Promise<SceneSnapshot> {
    const nodes = this.objectLayer.children
      .filter((c): c is BaseNode => c instanceof BaseNode)
      .map((node) => this.serializeNode(node));
    const exportStore = this.getExportStore ? normalizeExportPresetStore(this.getExportStore()) : undefined;
    return { nodes, exportStore };
  }

  async exportDocument(): Promise<SceneDocument> {
    const snapshot = await this.serializeScene();
    const doc: SceneDocument = { version: 1, nodes: snapshot.nodes };
    if (snapshot.exportStore) {
      doc.exportStore = normalizeExportPresetStore(snapshot.exportStore);
    }
    return doc;
  }

  async importDocument(doc: SceneDocument): Promise<void> {
    if (!doc || doc.version !== 1) {
      throw new Error('Unsupported document version');
    }
    const normalized = this.normalizeDocument(doc);
    await this.restore(normalized);
    const snapshot = { nodes: normalized.nodes, exportStore: normalized.exportStore };
    this.lastSnapshotKey = this.snapshotKey(snapshot);
    this.undoStack = [snapshot];
    this.redoStack = [];
  }

  hasContent(): boolean {
    return this.objectLayer.children.some((c) => c instanceof BaseNode);
  }

  async clearDocument(): Promise<void> {
    const children = this.objectLayer.children.slice();
    children.forEach((child) => this.objectLayer.removeChild(child));
    this.lastSnapshotKey = '';
    this.undoStack = [];
    this.redoStack = [];
    this.captureRequested = false;
  }

  private async flushCaptureQueue(): Promise<void> {
    try {
      while (this.captureRequested) {
        this.captureRequested = false;
        const snapshot = await this.serializeScene();
        const key = this.snapshotKey(snapshot);
        if (key === this.lastSnapshotKey) continue;

        this.lastSnapshotKey = key;
        this.undoStack.push(snapshot);
        if (this.undoStack.length > HistoryManager.MAX_UNDO_STACK_SIZE) {
          this.undoStack.splice(0, this.undoStack.length - HistoryManager.MAX_UNDO_STACK_SIZE);
        }
        this.redoStack = [];
      }
    } finally {
      this.captureInFlight = null;
    }
  }

  private snapshotKey(snapshot: SceneSnapshot): string {
    return JSON.stringify(snapshot);
  }

  private normalizeDocument(doc: SceneDocument): SceneDocument {
    return {
      version: 1,
      nodes: (doc.nodes ?? []).map((node) => this.normalizeNode(node)),
      exportStore: normalizeExportPresetStore(doc.exportStore),
    };
  }

  private normalizeNode(node: SerializedNode): SerializedNode {
    const normalizedStyle: Style = { ...(node.style ?? {}) };
    const normalizedScale = {
      x: this.toFiniteNumber(node.scale?.x, 1),
      y: this.toFiniteNumber(node.scale?.y, 1),
    };

    const normalized: SerializedNode = {
      ...node,
      name: typeof node.name === 'string' ? node.name : '',
      visible: this.toBoolean(node.visible, true),
      locked: this.toBoolean(node.locked, false),
      x: this.toFiniteNumber(node.x, 0),
      y: this.toFiniteNumber(node.y, 0),
      rotation: this.toFiniteNumber(node.rotation, 0),
      scale: normalizedScale,
      width: node.width === undefined ? undefined : Math.max(0, this.toFiniteNumber(node.width, 0)),
      height: node.height === undefined ? undefined : Math.max(0, this.toFiniteNumber(node.height, 0)),
      style: normalizedStyle,
      data: node.data ? { ...node.data } : undefined,
      children: node.children?.map((child) => this.normalizeNode(child)),
    };

    if (node.type === 'frame') {
      const data = normalized.data ?? {};
      const restData = { ...data } as Record<string, unknown>;
      delete restData.borderColor;
      delete restData.borderWidth;
      const backgroundColor =
        Object.prototype.hasOwnProperty.call(data, 'backgroundColor')
          ? this.toNullableColor(data.backgroundColor, '#ffffff')
          : '#ffffff';
      const clipContent = this.toBoolean(data.clipContent, true);

      normalized.data = {
        ...restData,
        backgroundColor,
        clipContent,
      };
      normalized.width = Math.max(1, this.toFiniteNumber(normalized.width, 1));
      normalized.height = Math.max(1, this.toFiniteNumber(normalized.height, 1));
    }

    return normalized;
  }

  private toFiniteNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  private toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off', 'null', 'undefined', ''].includes(normalized)) return false;
    }
    return fallback;
  }

  private toColor(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const text = value.trim();
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text) ? text : fallback;
  }

  private toNullableColor(value: unknown, fallback: string): string | null {
    if (value === null) return null;
    if (typeof value !== 'string') return fallback;
    const text = value.trim();
    if (!text || text.toLowerCase() === 'none' || text.toLowerCase() === 'transparent') {
      return null;
    }
    return this.toColor(text, fallback);
  }

  private serializeNode(node: BaseNode): SerializedNode {
    const base: SerializedNode = {
      id: node.id,
      type: node.type,
      name: node.name,
      visible: node.visible,
      locked: node.locked,
      x: node.position.x,
      y: node.position.y,
      rotation: node.rotation,
      scale: { x: node.scale.x, y: node.scale.y },
      style: { ...node.style },
      width: node.width,
      height: node.height,
    };

    switch (node.type) {
      case 'rectangle': {
        const n = node as RectangleNode;
        base.data = { cornerRadius: n.cornerRadius ?? 0 };
        break;
      }
      case 'ellipse': {
        const n = node as EllipseNode;
        base.width = n.width;
        base.height = n.height;
        break;
      }
      case 'circle': {
        const n = node as CircleNode;
        base.data = { radius: n.radius };
        break;
      }
      case 'line': {
        const n = node as LineNode;
        const startX = n.position.x + n.startX;
        const startY = n.position.y + n.startY;
        const endX = n.position.x + n.endX;
        const endY = n.position.y + n.endY;
        base.data = { startX, startY, endX, endY };
        break;
      }
      case 'star': {
        const n = node as StarNode;
        base.data = {
          points: n.points,
          innerRadius: n.innerRadius,
          outerRadius: n.outerRadius,
        };
        break;
      }
      case 'text': {
        const n = node as TextNode;
        base.data = { text: n.text };
        break;
      }
      case 'image': {
        const n = node as ImageNode;
        base.data = { source: n.source ?? '' };
        break;
      }
      case 'group': {
        const n = node as GroupNode;
        base.children = n.children
          .filter((c): c is BaseNode => c instanceof BaseNode)
          .map((child) => this.serializeNode(child));
        break;
      }
      case 'frame': {
        const n = node as FrameNode;
        base.data = {
          backgroundColor: n.backgroundColor,
          clipContent: n.clipContent,
        };
        base.children = n.children
          .filter((c): c is BaseNode => c instanceof BaseNode)
          .map((child) => this.serializeNode(child));
        break;
      }
    }

    return base;
  }

  private async restore(snapshot: SceneSnapshot): Promise<void> {
    const children = this.objectLayer.children.slice();
    children.forEach((child) => this.objectLayer.removeChild(child));

    for (const data of snapshot.nodes) {
      const node = await this.deserializeNode(data);
      this.objectLayer.addChild(node);
    }
    if (this.setExportStore && snapshot.exportStore) {
      this.setExportStore(normalizeExportPresetStore(snapshot.exportStore));
    }
  }

  private async deserializeNode(data: SerializedNode): Promise<BaseNode> {
    let node: BaseNode;
    const style = { ...data.style };

    switch (data.type) {
      case 'rectangle':
        node = new RectangleNode({
          id: data.id,
          width: data.width ?? 0,
          height: data.height ?? 0,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
          cornerRadius: data.data?.cornerRadius,
        });
        break;
      case 'ellipse':
        node = new EllipseNode({
          id: data.id,
          width: data.width ?? 0,
          height: data.height ?? 0,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      case 'circle':
        node = new CircleNode({
          id: data.id,
          radius: data.data?.radius ?? 0,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      case 'line':
        node = new LineNode({
          id: data.id,
          startX: data.data?.startX ?? data.x,
          startY: data.data?.startY ?? data.y,
          endX: data.data?.endX ?? data.x,
          endY: data.data?.endY ?? data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      case 'star':
        node = new StarNode({
          id: data.id,
          points: data.data?.points ?? 5,
          innerRadius: data.data?.innerRadius ?? 0,
          outerRadius: data.data?.outerRadius ?? 0,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      case 'text':
        node = new TextNode({
          id: data.id,
          text: data.data?.text ?? '',
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      case 'image': {
        const src = data.data?.source ?? '';
        node = await ImageNode.fromSource({
          source: src,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      }
      case 'group': {
        const children = [];
        for (const child of data.children ?? []) {
          if (child.type === 'frame') {
            continue;
          }
          children.push(await this.deserializeNode(child));
        }
        node = new GroupNode({
          id: data.id,
          children,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
        });
        break;
      }
      case 'frame': {
        const children = [];
        for (const child of data.children ?? []) {
          if (child.type === 'frame') {
            continue;
          }
          children.push(await this.deserializeNode(child));
        }
        const backgroundColor =
          Object.prototype.hasOwnProperty.call(data.data ?? {}, 'backgroundColor')
            ? (data.data?.backgroundColor ?? null)
            : '#ffffff';
        node = new FrameNode({
          id: data.id,
          name: data.name,
          children,
          width: data.width ?? 0,
          height: data.height ?? 0,
          x: data.x,
          y: data.y,
          rotation: data.rotation,
          scale: data.scale,
          style,
          visible: data.visible,
          locked: data.locked,
          backgroundColor,
          clipContent: data.data?.clipContent ?? true,
        });
        break;
      }
      default:
        throw new Error(`Unknown node type: ${(data as any).type}`);
    }

    node.name = data.name;
    node.visible = data.visible;
    node.locked = data.locked;
    return node;
  }
}

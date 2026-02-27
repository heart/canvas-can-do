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
};

export type SceneDocument = {
  version: 1;
  nodes: SerializedNode[];
};

export class HistoryManager {
  private static readonly MAX_UNDO_STACK_SIZE = 200;
  private undoStack: SceneSnapshot[] = [];
  private redoStack: SceneSnapshot[] = [];
  private lastSnapshotKey = '';
  private captureRequested = false;
  private captureInFlight: Promise<void> | null = null;

  private objectLayer: Container;

  constructor(objectLayer: Container) {
    this.objectLayer = objectLayer;
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
    return { nodes };
  }

  async exportDocument(): Promise<SceneDocument> {
    const snapshot = await this.serializeScene();
    return { version: 1, nodes: snapshot.nodes };
  }

  async importDocument(doc: SceneDocument): Promise<void> {
    if (!doc || doc.version !== 1) {
      throw new Error('Unsupported document version');
    }
    await this.restore({ nodes: doc.nodes });
    const snapshot = { nodes: doc.nodes };
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
          background: n.background,
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
          children.push(await this.deserializeNode(child));
        }
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
          background:
            Object.prototype.hasOwnProperty.call(data.data ?? {}, 'background')
              ? (data.data?.background ?? null)
              : '#ffffff',
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

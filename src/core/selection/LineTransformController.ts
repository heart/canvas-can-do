import { Container, Point } from 'pixi.js';
import type { LineNode } from '../nodes/LineNode';

export class LineTransformController {
  private activeNode: LineNode | null = null;
  private startPoint: Point | null = null;
  private activeHandle: 'start' | 'end' | 'move' | null = null;
  private startState: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    x: number;
    y: number;
    parent: Container | null;
    startWorld: Point;
    endWorld: Point;
  } | null = null;

  startTransform(node: LineNode, point: Point, handle: 'start' | 'end' | 'move') {
    this.activeNode = node;
    this.startPoint = point;
    this.activeHandle = handle;
    this.startState = {
      startX: node.startX,
      startY: node.startY,
      endX: node.endX,
      endY: node.endY,
      x: node.x,
      y: node.y,
      parent: (node.parent as Container | null) ?? null,
      startWorld: node.parent
        ? node.parent.toGlobal(new Point(node.x + node.startX, node.y + node.startY))
        : new Point(node.x + node.startX, node.y + node.startY),
      endWorld: node.parent
        ? node.parent.toGlobal(new Point(node.x + node.endX, node.y + node.endY))
        : new Point(node.x + node.endX, node.y + node.endY),
    };
  }

  updateTransform(point: Point, shiftKey = false) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;

    const startPoint = this.startPoint;
    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;

    if (this.activeHandle === 'start') {
      const fixedEnd = this.startState.endWorld;
      let nextStart = new Point(this.startState.startWorld.x + dx, this.startState.startWorld.y + dy);

      if (shiftKey) {
        const snapped = this.snapPointTo45(fixedEnd.x, fixedEnd.y, nextStart.x, nextStart.y);
        nextStart = new Point(snapped.x, snapped.y);
      }

      this.applyWorldEndpoints(nextStart, fixedEnd);
      this.activeNode.refresh();
    } else if (this.activeHandle === 'end') {
      const fixedStart = this.startState.startWorld;
      let nextEnd = new Point(this.startState.endWorld.x + dx, this.startState.endWorld.y + dy);

      if (shiftKey) {
        const snapped = this.snapPointTo45(fixedStart.x, fixedStart.y, nextEnd.x, nextEnd.y);
        nextEnd = new Point(snapped.x, snapped.y);
      }

      this.applyWorldEndpoints(fixedStart, nextEnd);
      this.activeNode.refresh();
    } else if (this.activeHandle === 'move') {
      const parent = this.startState.parent;
      let localDx = dx;
      let localDy = dy;
      if (parent) {
        const startLocal = parent.toLocal(this.startPoint);
        const currentLocal = parent.toLocal(point);
        localDx = currentLocal.x - startLocal.x;
        localDy = currentLocal.y - startLocal.y;
      }
      this.activeNode.position.set(
        Math.round(this.startState.x + localDx),
        Math.round(this.startState.y + localDy)
      );
      this.activeNode.startX = this.startState.startX;
      this.activeNode.startY = this.startState.startY;
      this.activeNode.endX = this.startState.endX;
      this.activeNode.endY = this.startState.endY;
      this.activeNode.refresh();
    }
  }

  endTransform() {
    this.activeNode = null;
    this.startPoint = null;
    this.activeHandle = null;
    this.startState = null;
  }

  private snapPointTo45(fixedX: number, fixedY: number, targetX: number, targetY: number) {
    const dx = targetX - fixedX;
    const dy = targetY - fixedY;
    const length = Math.hypot(dx, dy);
    if (length === 0) return { x: fixedX, y: fixedY };
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const snapped = Math.round(angle / step) * step;
    return {
      x: fixedX + Math.cos(snapped) * length,
      y: fixedY + Math.sin(snapped) * length,
    };
  }

  private applyWorldEndpoints(startWorld: Point, endWorld: Point) {
    if (!this.activeNode || !this.startState) return;
    const parent = this.startState.parent;
    const startLocal = parent ? parent.toLocal(startWorld) : startWorld;
    const endLocal = parent ? parent.toLocal(endWorld) : endWorld;
    const sx = Math.round(startLocal.x);
    const sy = Math.round(startLocal.y);
    const ex = Math.round(endLocal.x);
    const ey = Math.round(endLocal.y);

    this.activeNode.position.set(sx, sy);
    this.activeNode.startX = 0;
    this.activeNode.startY = 0;
    this.activeNode.endX = ex - sx;
    this.activeNode.endY = ey - sy;
  }
}

import { Point } from 'pixi.js';
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
    };
  }

  updateTransform(point: Point, shiftKey = false) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    if (this.activeHandle === 'start') {
      // Move the start point by updating position and keeping end point fixed in world space
      const worldEndX = this.startState.x + this.startState.endX;
      const worldEndY = this.startState.y + this.startState.endY;
      let nextStartX = this.startState.x + dx;
      let nextStartY = this.startState.y + dy;

      if (shiftKey) {
        const snapped = this.snapPointTo45(worldEndX, worldEndY, nextStartX, nextStartY);
        nextStartX = snapped.x;
        nextStartY = snapped.y;
      }

      this.activeNode.position.set(Math.round(nextStartX), Math.round(nextStartY));

      // Update end point relative to new position
      const snappedStartX = Math.round(nextStartX);
      const snappedStartY = Math.round(nextStartY);
      this.activeNode.endX = Math.round(worldEndX) - snappedStartX;
      this.activeNode.endY = Math.round(worldEndY) - snappedStartY;

      // Start point is always at origin relative to position
      this.activeNode.startX = 0;
      this.activeNode.startY = 0;

      // Redraw the line
      this.activeNode.refresh();
    } else if (this.activeHandle === 'end') {
      // Simply update end point relative to current position
      const worldStartX = this.startState.x + this.startState.startX;
      const worldStartY = this.startState.y + this.startState.startY;
      let nextEndX = this.startState.x + this.startState.endX + dx;
      let nextEndY = this.startState.y + this.startState.endY + dy;

      if (shiftKey) {
        const snapped = this.snapPointTo45(worldStartX, worldStartY, nextEndX, nextEndY);
        nextEndX = snapped.x;
        nextEndY = snapped.y;
      }

      const snappedEndX = Math.round(nextEndX);
      const snappedEndY = Math.round(nextEndY);
      const snappedStartX = Math.round(this.startState.x);
      const snappedStartY = Math.round(this.startState.y);
      this.activeNode.position.set(snappedStartX, snappedStartY);
      this.activeNode.endX = snappedEndX - snappedStartX;
      this.activeNode.endY = snappedEndY - snappedStartY;

      // Redraw the line
      this.activeNode.refresh();
    } else if (this.activeHandle === 'move') {
      // Move the entire line by updating position only
      this.activeNode.position.set(
        Math.round(this.startState.x + dx),
        Math.round(this.startState.y + dy)
      );
      // Preserve endpoint offsets relative to position
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
}

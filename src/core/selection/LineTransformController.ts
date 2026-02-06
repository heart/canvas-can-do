import { Point } from 'pixi.js';
import type { LineNode } from '../nodes/LineNode';

export class LineTransformController {
  private activeNode: LineNode | null = null;
  private startPoint: Point | null = null;
  private activeHandle: 'start' | 'end' | null = null;
  private startState: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    x: number;
    y: number;
  } | null = null;

  startTransform(node: LineNode, point: Point, handle: 'start' | 'end') {
    this.activeNode = node;
    this.startPoint = point;
    this.activeHandle = handle;
    this.startState = {
      startX: node.startX,
      startY: node.startY,
      endX: node.endX,
      endY: node.endY,
      x: node.x,
      y: node.y
    };
  }

  updateTransform(point: Point) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    if (this.activeHandle === 'start') {
      // Move the start point by updating position and keeping end point fixed in world space
      const worldEndX = this.startState.x + this.startState.endX;
      const worldEndY = this.startState.y + this.startState.endY;
      
      this.activeNode.position.set(
        this.startState.x + dx,
        this.startState.y + dy
      );
      
      // Update end point relative to new position
      this.activeNode.endX = worldEndX - (this.startState.x + dx);
      this.activeNode.endY = worldEndY - (this.startState.y + dy);
      
      // Start point is always at origin relative to position
      this.activeNode.startX = 0;
      this.activeNode.startY = 0;

      // Redraw the line
      this.activeNode.redraw();
    } else if (this.activeHandle === 'end') {
      // Simply update end point relative to current position
      this.activeNode.endX = this.startState.endX + dx;
      this.activeNode.endY = this.startState.endY + dy;
      
      // Redraw the line
      this.activeNode.redraw();
    } else if (this.activeHandle === 'move') {
      // Move the entire line by updating position only
      this.activeNode.position.set(
        this.startState.x + dx,
        this.startState.y + dy
      );
    }
  }

  endTransform() {
    this.activeNode = null;
    this.startPoint = null;
    this.activeHandle = null;
    this.startState = null;
  }
}

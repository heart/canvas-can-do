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
      // Update start point
      const newStartX = this.startState.startX + dx;
      const newStartY = this.startState.startY + dy;
      
      // Adjust the line's position and endpoint
      this.activeNode.position.set(
        this.startState.x + dx,
        this.startState.y + dy
      );
      this.activeNode.startX = 0;
      this.activeNode.startY = 0;
      this.activeNode.endX = this.startState.endX - dx;
      this.activeNode.endY = this.startState.endY - dy;
    } else if (this.activeHandle === 'end') {
      // Update end point
      this.activeNode.endX = this.startState.endX + dx;
      this.activeNode.endY = this.startState.endY + dy;
    }
  }

  endTransform() {
    this.activeNode = null;
    this.startPoint = null;
    this.activeHandle = null;
    this.startState = null;
  }
}

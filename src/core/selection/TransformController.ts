import { Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';

type TransformMode = 'none' | 'move' | 'resize' | 'rotate';

export class TransformController {
  private mode: TransformMode = 'none';
  private startPoint: Point | null = null;
  private startState: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null = null;
  private activeNode: BaseNode | null = null;
  private activeHandle: string | null = null;

  constructor() {}

  startTransform(node: BaseNode, point: Point, handle?: string) {
    this.activeNode = node;
    this.startPoint = point;
    this.activeHandle = handle ?? null;

    // Store initial transform state
    this.startState = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: node.rotation
    };

    // Determine transform mode based on handle
    if (!handle) {
      this.mode = 'move';
    } else if (handle === 'rotate') {
      this.mode = 'rotate';
    } else {
      this.mode = 'resize';
    }
  }

  updateTransform(point: Point) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    switch (this.mode) {
      case 'move':
        this.activeNode.position.set(
          this.startState.x + dx,
          this.startState.y + dy
        );
        break;

      case 'rotate':
        const center = new Point(
          this.startState.x + this.activeNode.width / 2,
          this.startState.y + this.activeNode.height / 2
        );
        
        const startAngle = Math.atan2(
          this.startPoint.y - center.y,
          this.startPoint.x - center.x
        );
        const currentAngle = Math.atan2(
          point.y - center.y,
          point.x - center.x
        );
        
        this.activeNode.rotation = this.startState.rotation + (currentAngle - startAngle);
        break;

      case 'resize':
        if (!this.activeHandle) break;

        let newWidth = this.startState.width;
        let newHeight = this.startState.height;
        let newX = this.startState.x;
        let newY = this.startState.y;

        // Handle resize based on which handle is being dragged
        const [vertical, horizontal] = this.activeHandle.split('-');
        
        // Handle horizontal resize
        if (horizontal === 'left') {
          newWidth = Math.max(10, this.startState.width - dx);
          newX = this.startState.x + (this.startState.width - newWidth);
        } else if (horizontal === 'right') {
          newWidth = Math.max(10, this.startState.width + dx);
        }

        // Handle vertical resize
        if (vertical === 'top') {
          newHeight = Math.max(10, this.startState.height - dy);
          newY = this.startState.y + (this.startState.height - newHeight);
        } else if (vertical === 'bottom') {
          newHeight = Math.max(10, this.startState.height + dy);
        }

        // Update node
        this.activeNode.width = newWidth;
        this.activeNode.height = newHeight;
        this.activeNode.position.set(newX, newY);
        break;
    }
  }

  endTransform() {
    this.mode = 'none';
    this.startPoint = null;
    this.startState = null;
    this.activeNode = null;
    this.activeHandle = null;
  }
}

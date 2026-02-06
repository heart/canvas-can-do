import { Container, Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';

type TransformMode = 'none' | 'move' | 'resize' | 'rotate';

export class TransformController {
  private mode: TransformMode = 'none';
  private startPoint: Point | null = null;
  private startTransform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null = null;
  private activeNode: BaseNode | null = null;
  private activeHandle: string | null = null;

  constructor(private toolsLayer: Container) {}

  startTransform(node: BaseNode, point: Point, handle?: string) {
    this.activeNode = node;
    this.startPoint = point;
    this.activeHandle = handle ?? null;

    // Store initial transform state
    this.startTransform = {
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
    if (!this.activeNode || !this.startPoint || !this.startTransform) return;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    switch (this.mode) {
      case 'move':
        this.activeNode.position.set(
          this.startTransform.x + dx,
          this.startTransform.y + dy
        );
        break;

      case 'rotate':
        const center = new Point(
          this.startTransform.x + this.activeNode.width / 2,
          this.startTransform.y + this.activeNode.height / 2
        );
        
        const startAngle = Math.atan2(
          this.startPoint.y - center.y,
          this.startPoint.x - center.x
        );
        const currentAngle = Math.atan2(
          point.y - center.y,
          point.x - center.x
        );
        
        this.activeNode.rotation = this.startTransform.rotation + (currentAngle - startAngle);
        break;

      case 'resize':
        if (!this.activeHandle) break;

        const bounds = this.activeNode.getBounds();
        let newWidth = this.startTransform.width;
        let newHeight = this.startTransform.height;
        let newX = this.startTransform.x;
        let newY = this.startTransform.y;

        // Handle resize based on which handle is being dragged
        if (this.activeHandle.includes('right')) {
          newWidth = this.startTransform.width + dx;
        } else if (this.activeHandle.includes('left')) {
          newWidth = this.startTransform.width - dx;
          newX = this.startTransform.x + dx;
        }

        if (this.activeHandle.includes('bottom')) {
          newHeight = this.startTransform.height + dy;
        } else if (this.activeHandle.includes('top')) {
          newHeight = this.startTransform.height - dy;
          newY = this.startTransform.y + dy;
        }

        // Ensure minimum size
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

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
    this.startTransform = null;
    this.activeNode = null;
    this.activeHandle = null;
  }
}

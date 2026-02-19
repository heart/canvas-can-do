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
    if (!handle || handle === 'move') {
      this.mode = 'move';
    } else if (handle === 'rotate') {
      this.mode = 'rotate';
    } else {
      this.mode = 'resize';
    }
  }

  updateTransform(point: Point, constrainRatio = false) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    switch (this.mode) {
      case 'move':
        this.activeNode.position.set(
          Math.round(this.startState.x + dx),
          Math.round(this.startState.y + dy)
        );
        break;

      case 'rotate': {
        // Compute geometric center from top-left + rotation
        const w = this.startState.width;
        const h = this.startState.height;
        const r0 = this.startState.rotation;
        const cos0 = Math.cos(r0);
        const sin0 = Math.sin(r0);
        const centerX = this.startState.x + (w / 2) * cos0 - (h / 2) * sin0;
        const centerY = this.startState.y + (w / 2) * sin0 + (h / 2) * cos0;
        const center = new Point(centerX, centerY);
        
        const startAngle = Math.atan2(
          this.startPoint.y - center.y,
          this.startPoint.x - center.x
        );
        const currentAngle = Math.atan2(
          point.y - center.y,
          point.x - center.x
        );
        
        const newRotation = this.startState.rotation + (currentAngle - startAngle);
        this.activeNode.rotation = newRotation;

        // Recompute top-left so the center stays fixed
        const cos = Math.cos(newRotation);
        const sin = Math.sin(newRotation);
        const offsetX = (-w / 2) * cos + (h / 2) * sin;
        const offsetY = (-w / 2) * sin - (h / 2) * cos;
        this.activeNode.position.set(
          Math.round(center.x + offsetX),
          Math.round(center.y + offsetY)
        );
        break;
      }

      case 'resize': {
        if (!this.activeHandle) break;

        const MIN_SIZE = 10;
        const rightEdge = this.startState.x + this.startState.width;
        const bottomEdge = this.startState.y + this.startState.height;
        const centerX = this.startState.x + this.startState.width / 2;
        const centerY = this.startState.y + this.startState.height / 2;

        let newWidth = this.startState.width;
        let newHeight = this.startState.height;
        let newX = this.startState.x;
        let newY = this.startState.y;

        const hasLeft = this.activeHandle.includes('left');
        const hasRight = this.activeHandle.includes('right');
        const hasTop = this.activeHandle.includes('top');
        const hasBottom = this.activeHandle.includes('bottom');

        if (hasRight) {
          newWidth = this.startState.width + dx;
        }
        if (hasLeft) {
          newWidth = this.startState.width - dx;
          newX = this.startState.x + dx;
        }
        if (hasBottom) {
          newHeight = this.startState.height + dy;
        }
        if (hasTop) {
          newHeight = this.startState.height - dy;
          newY = this.startState.y + dy;
        }

        if (constrainRatio) {
          const ratio = this.startState.width / Math.max(1, this.startState.height);
          const hasHorizontal = hasLeft || hasRight;
          const hasVertical = hasTop || hasBottom;

          if (hasHorizontal && hasVertical) {
            // Corner: choose dominant delta then match other dimension
            const targetWidth = Math.max(MIN_SIZE, newWidth);
            const targetHeight = Math.max(MIN_SIZE, newHeight);
            if (Math.abs(targetWidth / ratio - targetHeight) > Math.abs(targetHeight * ratio - targetWidth)) {
              newHeight = targetWidth / ratio;
            } else {
              newWidth = targetHeight * ratio;
            }

            if (hasLeft) {
              newX = rightEdge - newWidth;
            }
            if (hasTop) {
              newY = bottomEdge - newHeight;
            }
          } else if (hasHorizontal) {
            // Side: keep vertical center, adjust height to match ratio
            newHeight = newWidth / ratio;
            newY = centerY - newHeight / 2;
          } else if (hasVertical) {
            // Side: keep horizontal center, adjust width to match ratio
            newWidth = newHeight * ratio;
            newX = centerX - newWidth / 2;
          }
        }

        if (newWidth < MIN_SIZE) {
          newWidth = MIN_SIZE;
          if (hasLeft) newX = rightEdge - newWidth;
        }
        if (newHeight < MIN_SIZE) {
          newHeight = MIN_SIZE;
          if (hasTop) newY = bottomEdge - newHeight;
        }

        this.activeNode.width = Math.round(newWidth);
        this.activeNode.height = Math.round(newHeight);
        this.activeNode.position.set(Math.round(newX), Math.round(newY));
        break;
      }
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

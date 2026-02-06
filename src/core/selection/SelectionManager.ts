import { Container, Graphics, Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';
import { TransformController } from './TransformController';
import { LineTransformController } from './LineTransformController';
import type { LineNode } from '../nodes/LineNode';

export class SelectionManager {
  private selectedNodes: Set<BaseNode> = new Set();
  private selectionGraphics: Graphics;
  private transformController: TransformController;
  private lineTransformController: LineTransformController;

  constructor(toolsLayer: Container) {
    this.transformController = new TransformController();
    this.lineTransformController = new LineTransformController();

    this.selectionGraphics = new Graphics();
    toolsLayer.addChild(this.selectionGraphics);
  }

  startTransform(point: Point, handle?: string) {
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (!selectedNode) return;

    if (selectedNode.type === 'line') {
      if (handle === 'start' || handle === 'end') {
        this.lineTransformController.startTransform(selectedNode as LineNode, point, handle);
      }
    } else {
      this.transformController.startTransform(selectedNode, point, handle);
    }
  }

  updateTransform(point: Point) {
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (selectedNode?.type === 'line') {
      this.lineTransformController.updateTransform(point);
    } else {
      this.transformController.updateTransform(point);
    }
    this.updateSelectionVisuals();
  }

  endTransform() {
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (selectedNode?.type === 'line') {
      this.lineTransformController.endTransform();
    } else {
      this.transformController.endTransform();
    }
    this.updateSelectionVisuals();
  }

  hitTestHandle(point: Point): string | null {
    if (this.selectedNodes.size === 0) return null;

    const node = Array.from(this.selectedNodes)[0];
    
    if (node.type === 'line') {
      const lineNode = node as LineNode;
      const handleSize = 12;

      // Check start point handle
      const startX = lineNode.x + lineNode.startX;
      const startY = lineNode.y + lineNode.startY;
      if (Math.abs(point.x - startX) < handleSize &&
          Math.abs(point.y - startY) < handleSize) {
        return 'start';
      }

      // Check end point handle
      const endX = lineNode.x + lineNode.endX;
      const endY = lineNode.y + lineNode.endY;
      if (Math.abs(point.x - endX) < handleSize &&
          Math.abs(point.y - endY) < handleSize) {
        return 'end';
      }

      // Check if point is near the line for moving
      const lineLength = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      const distance = Math.abs(
        (endY - startY) * point.x - (endX - startX) * point.y + endX * startY - endY * startX
      ) / lineLength;

      if (distance < handleSize) {
        return 'move';
      }
    } else {
      // Use intrinsic size and true center derived from current rotation
      const width = node.width;
      const height = node.height;
      const r = node.rotation;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const centerX = node.position.x + (width / 2) * cos - (height / 2) * sin;
      const centerY = node.position.y + (width / 2) * sin + (height / 2) * cos;

      // Convert point into overlay-local space (centered, unrotated)
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const ux = dx * cos + dy * sin;      // inverse rotate
      const uy = -dx * sin + dy * cos;
      const handleSize = 12; // Size of handle hit area (tap-friendly)

      // Check rotation handle first (top middle)
      const rotateHandle = new Point(0, -height / 2 - 20);
      if (Math.abs(ux - rotateHandle.x) < handleSize &&
          Math.abs(uy - rotateHandle.y) < handleSize) {
        return 'rotate';
      }

      // Check resize handles
      const handles = [
        { x: -width / 2, y: -height / 2, name: 'top-left' },
        { x: 0, y: -height / 2, name: 'top' },
        { x: width / 2, y: -height / 2, name: 'top-right' },
        { x: width / 2, y: 0, name: 'right' },
        { x: width / 2, y: height / 2, name: 'bottom-right' },
        { x: 0, y: height / 2, name: 'bottom' },
        { x: -width / 2, y: height / 2, name: 'bottom-left' },
        { x: -width / 2, y: 0, name: 'left' }
      ];

      for (const handle of handles) {
        if (Math.abs(ux - handle.x) < handleSize &&
            Math.abs(uy - handle.y) < handleSize) {
          return handle.name;
        }
      }

      // Check if point is inside selection bounds
      if (ux >= -width / 2 && ux <= width / 2 &&
          uy >= -height / 2 && uy <= height / 2) {
        return 'move';
      }
    }

    return null;
  }

  select(node: BaseNode | null) {
    this.selectedNodes.clear();
    if (node) {
      this.selectedNodes.add(node);
    }
    this.updateSelectionVisuals();
  }

  isSelected(node: BaseNode): boolean {
    return this.selectedNodes.has(node);
  }

  getSelectedNodes(): BaseNode[] {
    return Array.from(this.selectedNodes);
  }

  clear() {
    this.selectedNodes.clear();
    this.updateSelectionVisuals();
  }

  private updateSelectionVisuals() {
    this.selectionGraphics.clear();

    for (const node of this.selectedNodes) {
      const width = node.width;
      const height = node.height;
      const r = node.rotation;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const centerX = node.position.x + (width / 2) * cos - (height / 2) * sin;
      const centerY = node.position.y + (width / 2) * sin + (height / 2) * cos;

      // Position overlay at true center (matches virtual rotation pivot)
      this.selectionGraphics.position.set(centerX, centerY);
      this.selectionGraphics.rotation = node.rotation;
      this.selectionGraphics.pivot.set(0, 0);

      if (node.type === 'line') {
        const lineNode = node as LineNode;
        
        // Reset transform for line
        this.selectionGraphics.position.set(0, 0);
        this.selectionGraphics.rotation = 0;
        
        // Draw line
        this.selectionGraphics.moveTo(
          lineNode.x + lineNode.startX,
          lineNode.y + lineNode.startY
        );
        this.selectionGraphics.lineTo(
          lineNode.x + lineNode.endX,
          lineNode.y + lineNode.endY
        );
        this.selectionGraphics.stroke({ color: 0x0099ff, width: 2, alpha: 1 });

        // Draw endpoints
        const endpoints = [
          { x: lineNode.x + lineNode.startX, y: lineNode.y + lineNode.startY },
          { x: lineNode.x + lineNode.endX, y: lineNode.y + lineNode.endY }
        ];

        for (const point of endpoints) {
          this.selectionGraphics.circle(point.x, point.y, 6);
          this.selectionGraphics.fill({ color: 0xffffff });
          this.selectionGraphics.stroke({ color: 0x0099ff, width: 2, alpha: 0.9 });
        }
      } else {
        // Draw selection rectangle
        this.selectionGraphics.rect(-width / 2, -height / 2, width, height);
        this.selectionGraphics.stroke({ color: 0x0099ff, width: 2, alpha: 1 });

        // Draw control points
        const controlPoints = [
          { x: -width / 2, y: -height / 2, name: 'top-left' }, // Top-left
          { x: 0, y: -height / 2, name: 'top' }, // Top-middle
          { x: width / 2, y: -height / 2, name: 'top-right' }, // Top-right
          { x: width / 2, y: 0, name: 'right' }, // Middle-right
          { x: width / 2, y: height / 2, name: 'bottom-right' }, // Bottom-right
          { x: 0, y: height / 2, name: 'bottom' }, // Bottom-middle
          { x: -width / 2, y: height / 2, name: 'bottom-left' }, // Bottom-left
          { x: -width / 2, y: 0, name: 'left' }, // Middle-left
        ];

      for (const point of controlPoints) {
        this.selectionGraphics.circle(point.x, point.y, 6);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: 2, alpha: 0.9 });
      }

      // Draw rotation handle line and knob (above top-middle)
      const rotationHandleY = -height / 2 - 20;
      const rotationX = 0;
      this.selectionGraphics.moveTo(rotationX, -height / 2);
      this.selectionGraphics.lineTo(rotationX, rotationHandleY);
      this.selectionGraphics.stroke({ color: 0x0099ff, width: 1, alpha: 0.9 });
      this.selectionGraphics.circle(rotationX, rotationHandleY, 5);
      this.selectionGraphics.fill({ color: 0xffffff });
      this.selectionGraphics.stroke({ color: 0x0099ff, width: 1 });
    }
  }
}

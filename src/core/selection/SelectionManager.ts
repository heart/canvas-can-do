import { Container, Graphics, Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';
import { TransformController } from './TransformController';

export class SelectionManager {
  private selectedNodes: Set<BaseNode> = new Set();
  private selectionGraphics: Graphics;
  private transformController: TransformController;

  constructor(toolsLayer: Container) {
    this.transformController = new TransformController();

    this.selectionGraphics = new Graphics();
    toolsLayer.addChild(this.selectionGraphics);
  }

  startTransform(point: Point, handle?: string) {
    const selectedNode = Array.from(this.selectedNodes)[0];
    if (selectedNode) {
      this.transformController.startTransform(selectedNode, point, handle);
    }
  }

  updateTransform(point: Point) {
    this.transformController.updateTransform(point);
    this.updateSelectionVisuals();
  }

  endTransform() {
    this.transformController.endTransform();
    this.updateSelectionVisuals();
  }

  hitTestHandle(point: Point): string | null {
    if (this.selectedNodes.size === 0) return null;

    const node = Array.from(this.selectedNodes)[0];
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

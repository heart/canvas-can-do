import { Container, Graphics, Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';
import { TransformController } from './TransformController';

export class SelectionManager {
  private selectedNodes: Set<BaseNode> = new Set();
  private selectionGraphics: Graphics;
  private toolsLayer: Container;
  private transformController: TransformController;

  constructor(toolsLayer: Container) {
    this.toolsLayer = toolsLayer;
    this.transformController = new TransformController(toolsLayer);

    this.selectionGraphics = new Graphics();
    this.toolsLayer.addChild(this.selectionGraphics);
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
    const bounds = node.getBounds();
    const handleSize = 8; // Size of handle hit area

    // Check rotation handle first (top middle)
    const rotateHandle = new Point(
      bounds.x + bounds.width / 2,
      bounds.y - 20
    );
    if (Math.abs(point.x - rotateHandle.x) < handleSize &&
        Math.abs(point.y - rotateHandle.y) < handleSize) {
      return 'rotate';
    }

    // Check resize handles
    const handles = [
      { x: bounds.x, y: bounds.y, name: 'top-left' },
      { x: bounds.x + bounds.width / 2, y: bounds.y, name: 'top' },
      { x: bounds.x + bounds.width, y: bounds.y, name: 'top-right' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, name: 'right' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, name: 'bottom-right' },
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, name: 'bottom' },
      { x: bounds.x, y: bounds.y + bounds.height, name: 'bottom-left' },
      { x: bounds.x, y: bounds.y + bounds.height / 2, name: 'left' }
    ];

    for (const handle of handles) {
      if (Math.abs(point.x - handle.x) < handleSize &&
          Math.abs(point.y - handle.y) < handleSize) {
        return handle.name;
      }
    }

    // Check if point is inside selection bounds
    if (point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y && point.y <= bounds.y + bounds.height) {
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
      const bounds = node.getBounds();

      // Draw selection rectangle
      this.selectionGraphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
      this.selectionGraphics.stroke({ color: 0x0099ff, width: 2, alpha: 1 });

      // Draw control points
      const controlPoints = [
        { x: bounds.x, y: bounds.y }, // Top-left
        { x: bounds.x + bounds.width / 2, y: bounds.y }, // Top-middle
        { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // Middle-right
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // Bottom-middle
        { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
        { x: bounds.x, y: bounds.y + bounds.height / 2 }, // Middle-left
      ];

      for (const point of controlPoints) {
        this.selectionGraphics.circle(point.x, point.y, 4);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: 1 });
      }
    }
  }
}

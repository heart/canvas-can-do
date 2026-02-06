import { Container, Graphics } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';

export class SelectionManager {
  private selectedNodes: Set<BaseNode> = new Set();
  private selectionGraphics: Graphics;

  constructor(private toolsLayer: Container) {
    this.selectionGraphics = new Graphics();
    this.toolsLayer.addChild(this.selectionGraphics);
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
        { x: bounds.x, y: bounds.y },                           // Top-left
        { x: bounds.x + bounds.width / 2, y: bounds.y },       // Top-middle
        { x: bounds.x + bounds.width, y: bounds.y },           // Top-right
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // Middle-right
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height },     // Bottom-right
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // Bottom-middle
        { x: bounds.x, y: bounds.y + bounds.height },          // Bottom-left
        { x: bounds.x, y: bounds.y + bounds.height / 2 }       // Middle-left
      ];

      for (const point of controlPoints) {
        this.selectionGraphics.circle(point.x, point.y, 4);
        this.selectionGraphics.fill({ color: 0xffffff });
        this.selectionGraphics.stroke({ color: 0x0099ff, width: 1 });
      }
    }
  }
}

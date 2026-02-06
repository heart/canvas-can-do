import { Graphics } from 'pixi.js';
import type { RectangleNode } from '../rectangle';

export class RectangleObject extends Graphics {
  node: RectangleNode;

  constructor(node: RectangleNode) {
    super();
    this.node = node;
    this.redraw();
  }

  private redraw() {
    this.clear();
    
    // Fill with semi-transparent color
    this.beginFill(0x0be666, 0.2);
    this.drawRect(this.node.x, this.node.y, this.node.width, this.node.height);
    this.endFill();

    // Draw border
    this.lineStyle(1, 0x0be666);
    this.drawRect(this.node.x, this.node.y, this.node.width, this.node.height);
  }
}

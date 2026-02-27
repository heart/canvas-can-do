import { Graphics, Point } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';

export class LineNode extends BaseNode {
  readonly type = 'line' as const;
  protected graphics: Graphics;
  startX: number;
  startY: number;
  endX: number;
  endY: number;

  constructor(options: {
    id?: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number | { x: number; y: number };
    style?: Style;
    visible?: boolean;
    locked?: boolean;
  }) {
    super({
      id: options.id,
      type: 'line',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    // Store original coordinates relative to node position
    this.startX = 0;
    this.startY = 0;
    this.endX = options.endX - options.startX;
    this.endY = options.endY - options.startY;

    // Set node position to start point
    this.position.set(options.startX, options.startY);

    // Calculate width and height based on line extent
    this._width = Math.abs(this.endX);
    this._height = Math.abs(this.endY);

    // Setup graphics
    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.redraw();
  }

  protected redraw(): void {
    const { stroke, strokeWidth = 1, opacity = 1 } = this.style;

    this.graphics.clear();

    // Convert hex color strings to numbers if needed
    const strokeColor = typeof stroke === 'string' ? parseInt(stroke.replace('#', ''), 16) : stroke;

    // Draw line
    this.graphics.moveTo(this.startX, this.startY);
    this.graphics.lineTo(this.endX, this.endY);

    // Apply stroke
    if (stroke !== undefined) {
      this.graphics.stroke({
        width: strokeWidth,
        color: strokeColor ?? 0x000000,
        alpha: opacity
      });
    }

    // Update width and height based on line extent
    this._width = Math.abs(this.endX - this.startX);
    this._height = Math.abs(this.endY - this.startY);
  }

  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    this.redraw();
    return this;
  }

  // Expose a safe public refresh for external controllers
  refresh(): void {
    this.redraw();
  }

  getProps(): NodePropertyDescriptor[] {
    const startLocalX = this.position.x + this.startX;
    const startLocalY = this.position.y + this.startY;
    const endLocalX = this.position.x + this.endX;
    const endLocalY = this.position.y + this.endY;
    const start = this.parent
      ? this.parent.toGlobal(new Point(startLocalX, startLocalY))
      : new Point(startLocalX, startLocalY);
    const end = this.parent
      ? this.parent.toGlobal(new Point(endLocalX, endLocalY))
      : new Point(endLocalX, endLocalY);
    return [
      ...super.getProps(),
      {
        name: 'Start X',
        key: 'startX',
        type: 'float',
        value: start.x,
        desc: 'Start X position',
        group: 'Line',
      },
      {
        name: 'Start Y',
        key: 'startY',
        type: 'float',
        value: start.y,
        desc: 'Start Y position',
        group: 'Line',
      },
      {
        name: 'End X',
        key: 'endX',
        type: 'float',
        value: end.x,
        desc: 'End X position',
        group: 'Line',
      },
      {
        name: 'End Y',
        key: 'endY',
        type: 'float',
        value: end.y,
        desc: 'End Y position',
        group: 'Line',
      },
    ];
  }

  clone(offsetX = 0, offsetY = 0): LineNode {
    const startX = this.position.x + this.startX + offsetX;
    const startY = this.position.y + this.startY + offsetY;
    const endX = this.position.x + this.endX + offsetX;
    const endY = this.position.y + this.endY + offsetY;
    return new LineNode({
      startX,
      startY,
      endX,
      endY,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked,
    });
  }
}

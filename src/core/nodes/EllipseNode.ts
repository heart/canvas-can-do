import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';

export class EllipseNode extends BaseNode {
  readonly type = 'ellipse' as const;
  protected graphics: Graphics;

  constructor(options: {
    id?: string;
    width: number;
    height: number;
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
      type: 'ellipse',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    this._width = options.width;
    this._height = options.height;

    // Setup graphics
    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.redraw();
  }

  protected redraw(): void {
    const { fill, stroke, strokeWidth = 1, opacity = 1 } = this.style;

    this.graphics.clear();

    // Convert hex color strings to numbers if needed
    const fillColor = typeof fill === 'string' ? parseInt(fill.replace('#', ''), 16) : fill;
    const strokeColor = typeof stroke === 'string' ? parseInt(stroke.replace('#', ''), 16) : stroke;

    // Draw ellipse
    this.graphics.ellipse(0, 0, this.width / 2, this.height / 2);

    // Apply fill if needed
    if (fill !== undefined) {
      this.graphics.fill({
        color: fillColor ?? 0xffffff,
        alpha: opacity
      });
    }

    // Apply stroke if needed
    if (stroke !== undefined) {
      this.graphics.stroke({
        width: strokeWidth,
        color: strokeColor ?? 0x000000,
        alpha: opacity
      });
    }
  }

  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    this.redraw();
    return this;
  }
}

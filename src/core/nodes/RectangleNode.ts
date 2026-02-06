import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';

export class RectangleNode extends BaseNode {
  readonly type = 'rectangle' as const;
  cornerRadius?: number;
  protected graphics: Graphics;

  constructor(options: {
    id?: string;
    width: number;
    height: number;
    cornerRadius?: number;
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
      type: 'rectangle',
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
    this.cornerRadius = options.cornerRadius;

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

    // Draw rectangle with fill and stroke
    if (this.cornerRadius) {
      this.graphics.roundRect(0, 0, this.width, this.height, this.cornerRadius);
    } else {
      this.graphics.rect(0, 0, this.width, this.height);
    }

    // Apply fill if needed
    if (fill !== undefined) {
      this.graphics.fill({
        color: fillColor ?? 0xffffff,
        alpha: opacity,
      });
    }

    // Apply stroke if needed
    if (stroke !== undefined) {
      this.graphics.stroke({
        width: strokeWidth,
        color: strokeColor ?? 0x000000,
        alpha: opacity,
      });
    }
  }

  // Transform convenience methods inherited from BaseNode

  // Style methods
  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    this.redraw();
    return this;
  }
}

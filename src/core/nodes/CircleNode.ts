import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';

export class CircleNode extends BaseNode {
  readonly type = 'circle' as const;
  radius: number;
  protected graphics: Graphics;

  constructor(options: {
    id?: string;
    radius: number;
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
      type: 'circle',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    this.radius = options.radius;
    this._width = this.radius * 2;
    this._height = this.radius * 2;

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

    // Draw circle
    this.graphics.circle(0, 0, this.radius);

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

  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    this.redraw();
    return this;
  }

  getProps(): NodePropertyDescriptor[] {
    return [
      ...super.getProps(),
      {
        name: 'Radius',
        key: 'radius',
        type: 'float',
        value: this.radius,
        desc: 'Circle radius',
        min: 0,
      },
    ];
  }
}

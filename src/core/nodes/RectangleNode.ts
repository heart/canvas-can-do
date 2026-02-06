import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Transform2D } from '../math/Transform2D';
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
    transform?: Transform2D;
    style?: Style;
    visible?: boolean;
    locked?: boolean;
  }) {
    super({
      id: options.id,
      type: 'rectangle',
      transform: options.transform,
      style: options.style,
      visible: options.visible,
      locked: options.locked
    });

    this._width = options.width;
    this._height = options.height;
    this.cornerRadius = options.cornerRadius;

    // Setup graphics
    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.redraw();
    this.syncTransform();
  }

  protected redraw(): void {
    const { fill, stroke, strokeWidth = 1, opacity = 1 } = this.style;

    this.graphics.clear();

    // Convert hex color strings to numbers if needed
    const fillColor = typeof fill === 'string' ? parseInt(fill.replace('#', ''), 16) : fill;
    const strokeColor = typeof stroke === 'string' ? parseInt(stroke.replace('#', ''), 16) : stroke;

    // Fill
    if (fill !== undefined) {
      this.graphics.beginFill({ color: fillColor ?? 0xFFFFFF, alpha: opacity });
    }

    // Stroke
    if (stroke !== undefined) {
      this.graphics.stroke.width = strokeWidth;
      this.graphics.stroke.color = strokeColor ?? 0x000000;
      this.graphics.stroke.alpha = opacity;
    }

    // Draw rectangle
    if (this.cornerRadius) {
      this.graphics.drawRoundedRect(0, 0, this.width, this.height, this.cornerRadius);
    } else {
      this.graphics.drawRect(0, 0, this.width, this.height);
    }

    this.graphics.endFill();
  }

  protected syncTransform(): void {
    this.position.set(this.transform.x, this.transform.y);
    this.rotation = this.transform.rotation;
    this.scale.set(this.transform.scaleX, this.transform.scaleY);
  }

  updateTransform() {
    this.syncTransform();
    super.updateTransform();
  }

  // Transform convenience methods
  setPosition(x: number, y: number): this {
    this.transform.setPosition(x, y);
    return this;
  }

  setScale(sx: number, sy = sx): this {
    this.transform.setScale(sx, sy);
    return this;
  }

  setRotation(rad: number): this {
    this.transform.setRotation(rad);
    return this;
  }

  translate(x: number, y: number): this {
    this.transform.translate(x, y);
    return this;
  }

  rotate(rad: number): this {
    this.transform.rotate(rad);
    return this;
  }

  scale(sx: number, sy = sx): this {
    this.transform.scale(sx, sy);
    return this;
  }

  // Style methods
  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    this.redraw();
    return this;
  }
}

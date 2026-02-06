import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';

export class StarNode extends BaseNode {
  readonly type = 'star' as const;
  protected graphics: Graphics;
  points: number;
  innerRadius: number;
  outerRadius: number;

  constructor(options: {
    id?: string;
    points: number;
    innerRadius: number;
    outerRadius: number;
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
      type: 'star',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    this.points = options.points;
    this.innerRadius = options.innerRadius;
    this.outerRadius = options.outerRadius;

    // Set dimensions based on outer radius
    this._width = this.outerRadius * 2;
    this._height = this.outerRadius * 2;

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

    // Draw star anchored at top-left by offsetting with outerRadius
    const offset = this.outerRadius;
    const points: number[] = [];
    for (let i = 0; i < this.points * 2; i++) {
      const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
      const angle = (i * Math.PI) / this.points;
      points.push(
        Math.cos(angle) * radius + offset,
        Math.sin(angle) * radius + offset
      );
    }
    this.graphics.poly(points);

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

  getProps() {
    return [
      ...super.getProps(),
      {
        name: 'Points',
        key: 'points',
        type: 'int',
        value: this.points,
        desc: 'Number of star points',
        min: 2,
        step: 1,
      },
      {
        name: 'Inner Radius',
        key: 'innerRadius',
        type: 'float',
        value: this.innerRadius,
        desc: 'Inner radius',
        min: 0,
      },
      {
        name: 'Outer Radius',
        key: 'outerRadius',
        type: 'float',
        value: this.outerRadius,
        desc: 'Outer radius',
        min: 0,
      },
    ];
  }

  clone(offsetX = 0, offsetY = 0): StarNode {
    return new StarNode({
      points: this.points,
      innerRadius: this.innerRadius,
      outerRadius: this.outerRadius,
      x: this.position.x + offsetX,
      y: this.position.y + offsetY,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked,
    });
  }
}

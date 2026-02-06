import { Container } from 'pixi.js';
import type { Vec2 } from '../math/Vec2';
import { vec2 } from '../math/Vec2';

export type NodeType = 'rectangle' | 'circle' | 'text';

export interface Style {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export class BaseNode extends Container {
  readonly id: string;
  readonly type: NodeType;
  style: Style;
  locked: boolean;
  protected _width: number = 0;
  protected _height: number = 0;

  constructor(options: {
    id?: string;
    type: NodeType;
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number | { x: number; y: number };
    style?: Style;
    visible?: boolean;
    locked?: boolean;
  }) {
    super();
    this.id = options.id ?? crypto.randomUUID();
    this.type = options.type;
    this.style = options.style ?? {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1
    };
    this.visible = options.visible ?? true;
    this.locked = options.locked ?? false;

    // Set initial transform
    if (options.x !== undefined || options.y !== undefined) {
      this.position.set(options.x ?? 0, options.y ?? 0);
    }
    if (options.rotation !== undefined) {
      this.rotation = options.rotation;
    }
    if (options.scale !== undefined) {
      if (typeof options.scale === 'number') {
        this.scale.set(options.scale, options.scale);
      } else {
        this.scale.set(options.scale.x, options.scale.y);
      }
    }
  }

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
  }

  // Transform convenience methods
  setPosition(x: number, y: number): this {
    this.position.set(x, y);
    return this;
  }

  setScale(sx: number, sy = sx): this {
    this.scale.set(sx, sy);
    return this;
  }

  setRotation(rad: number): this {
    this.rotation = rad;
    return this;
  }

  setPivot(x: number, y: number): this {
    this.pivot.set(x, y);
    return this;
  }

  translate(x: number, y: number): this {
    this.position.x += x;
    this.position.y += y;
    return this;
  }

  // Reset transform
  resetTransform(): this {
    this.position.set(0, 0);
    this.scale.set(1, 1);
    this.rotation = 0;
    this.pivot.set(0, 0);
    return this;
  }
}

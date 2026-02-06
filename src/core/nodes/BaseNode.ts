import { Container } from 'pixi.js';
import { Transform2D } from '../math/Transform2D';
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
  transform: Transform2D;
  style: Style;
  locked: boolean;
  protected _width: number = 0;
  protected _height: number = 0;

  constructor(options: {
    id?: string;
    type: NodeType;
    transform?: Transform2D;
    style?: Style;
    visible?: boolean;
    locked?: boolean;
  }) {
    super();
    this.id = options.id ?? crypto.randomUUID();
    this.type = options.type;
    this.transform = options.transform ?? new Transform2D();
    this.style = options.style ?? {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1
    };
    this.visible = options.visible ?? true;
    this.locked = options.locked ?? false;
    
    // Initial transform sync
    this.syncTransform();
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

  protected syncTransform(): void {
    this.position.set(this.transform.x, this.transform.y);
    this.rotation = this.transform.rotation;
    this.scale.set(this.transform.scaleX, this.transform.scaleY);
  }

  updateTransform() {
    this.syncTransform();
    super.updateTransform();
  }

  // Position
  get x(): number {
    return this.transform.x;
  }

  set x(value: number) {
    this.transform.x = value;
  }

  get y(): number {
    return this.transform.y;
  }

  set y(value: number) {
    this.transform.y = value;
  }

  get position(): Vec2 {
    return this.transform.position;
  }

  set position(value: Vec2) {
    this.transform.position = value;
  }

  setPosition(x: number, y: number): this {
    this.transform.setPosition(x, y);
    return this;
  }

  // Scale
  get scaleX(): number {
    return this.transform.scaleX;
  }

  get scaleY(): number {
    return this.transform.scaleY;
  }

  setScale(sx: number, sy = sx): this {
    this.transform.setScale(sx, sy);
    return this;
  }

  // Rotation
  get rotation(): number {
    return this.transform.rotation;
  }

  set rotation(rad: number) {
    this.transform.rotation = rad;
  }

  setRotation(rad: number): this {
    this.transform.setRotation(rad);
    return this;
  }

  // Pivot
  get pivot(): Vec2 {
    return this.transform.pivot;
  }

  set pivot(value: Vec2) {
    this.transform.pivot = value;
  }

  setPivot(x: number, y: number): this {
    this.transform.pivot = vec2(x, y);
    return this;
  }

  // Transform operations
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

  rotateAround(rad: number, point: Vec2): this {
    this.transform.rotateAround(rad, point);
    return this;
  }

  scaleAround(sx: number, sy: number, point: Vec2): this {
    this.transform.scaleAround(sx, sy, point);
    return this;
  }

  // Reset
  resetTransform(): this {
    this.transform.reset();
    return this;
  }
}

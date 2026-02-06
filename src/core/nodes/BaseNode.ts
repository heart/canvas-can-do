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

export interface BaseNode {
  id: string;
  type: NodeType;

  parentId?: string;
  children?: string[];

  transform: Transform2D; // local transform
  style: Style;

  visible: boolean;
  locked: boolean;
}

export class BaseNodeImpl implements BaseNode {
  id: string;
  type: NodeType;
  parentId?: string;
  children?: string[];
  transform: Transform2D;
  style: Style;
  visible: boolean;
  locked: boolean;

  constructor(node: BaseNode) {
    this.id = node.id;
    this.type = node.type;
    this.parentId = node.parentId;
    this.children = node.children;
    this.transform = node.transform;
    this.style = node.style;
    this.visible = node.visible;
    this.locked = node.locked;
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

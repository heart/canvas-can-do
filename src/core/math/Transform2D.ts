import type { Vec2 } from './Vec2';
import { vec2 } from './Vec2';

/**
 * 2D Transform Matrix
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 * 
 * Where:
 * - [a b] is the scale/rotation for x
 * - [c d] is the scale/rotation for y
 * - [e f] is the translation
 */
export class Transform2D {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  private _pivot: Vec2 = vec2(0, 0);

  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  static identity(): Transform2D {
    return new Transform2D();
  }

  clone(): Transform2D {
    return new Transform2D(this.a, this.b, this.c, this.d, this.e, this.f);
  }

  // this = this * t
  multiply(t: Transform2D): Transform2D {
    const { a, b, c, d, e, f } = this;
    this.a = a * t.a + c * t.b;
    this.b = b * t.a + d * t.b;
    this.c = a * t.c + c * t.d;
    this.d = b * t.c + d * t.d;
    this.e = a * t.e + c * t.f + e;
    this.f = b * t.e + d * t.f + f;
    return this;
  }

  static multiply(a: Transform2D, b: Transform2D): Transform2D {
    return a.clone().multiply(b);
  }

  translate(x: number, y: number): Transform2D {
    return this.multiply(new Transform2D(1, 0, 0, 1, x, y));
  }

  scale(sx: number, sy = sx): Transform2D {
    return this.multiply(new Transform2D(sx, 0, 0, sy, 0, 0));
  }

  rotate(rad: number): Transform2D {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return this.multiply(new Transform2D(cos, sin, -sin, cos, 0, 0));
  }

  invert(): Transform2D {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) throw new Error('Transform not invertible');

    const a = this.d / det;
    const b = -this.b / det;
    const c = -this.c / det;
    const d = this.a / det;
    const e = (this.c * this.f - this.d * this.e) / det;
    const f = (this.b * this.e - this.a * this.f) / det;

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  apply(p: Vec2): Vec2 {
    return {
      x: p.x * this.a + p.y * this.c + this.e,
      y: p.x * this.b + p.y * this.d + this.f,
    };
  }

  // Position getters/setters
  get x(): number {
    return this.e;
  }

  set x(value: number) {
    this.e = value;
  }

  get y(): number {
    return this.f;
  }

  set y(value: number) {
    this.f = value;
  }

  get position(): Vec2 {
    return vec2(this.e, this.f);
  }

  set position(value: Vec2) {
    this.e = value.x;
    this.f = value.y;
  }

  // Scale getters/setters
  get scaleX(): number {
    return Math.sqrt(this.a * this.a + this.b * this.b);
  }

  get scaleY(): number {
    return Math.sqrt(this.c * this.c + this.d * this.d);
  }

  // Rotation in radians
  get rotation(): number {
    return Math.atan2(this.b, this.a);
  }

  set rotation(rad: number) {
    const scale = this.scaleX;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    this.a = cos * scale;
    this.b = sin * scale;
    this.c = -sin * scale;
    this.d = cos * scale;
  }

  // Pivot point manipulation
  get pivot(): Vec2 {
    return this._pivot;
  }

  set pivot(value: Vec2) {
    // Store the global position
    const globalPos = this.apply(vec2(0, 0));
    
    // Update pivot
    this._pivot = { ...value };
    
    // Adjust position to maintain global position with new pivot
    const newGlobalPos = this.apply(vec2(0, 0));
    this.e += globalPos.x - newGlobalPos.x;
    this.f += globalPos.y - newGlobalPos.y;
  }

  // Utility methods
  setPosition(x: number, y: number): Transform2D {
    this.e = x;
    this.f = y;
    return this;
  }

  setScale(sx: number, sy = sx): Transform2D {
    const rotation = this.rotation;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    this.a = cos * sx;
    this.b = sin * sx;
    this.c = -sin * sy;
    this.d = cos * sy;
    return this;
  }

  setRotation(rad: number): Transform2D {
    this.rotation = rad;
    return this;
  }

  // Transform around pivot point
  rotateAround(rad: number, point: Vec2): Transform2D {
    const dx = point.x - this.e;
    const dy = point.y - this.f;
    
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    this.e = point.x + (dx * cos - dy * sin) - dx;
    this.f = point.y + (dx * sin + dy * cos) - dy;
    
    return this.rotate(rad);
  }

  scaleAround(sx: number, sy: number, point: Vec2): Transform2D {
    const dx = point.x - this.e;
    const dy = point.y - this.f;
    
    this.e = point.x + dx * sx - dx;
    this.f = point.y + dy * sy - dy;
    
    return this.scale(sx, sy);
  }

  // Reset transform
  reset(): Transform2D {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    this._pivot = vec2(0, 0);
    return this;
  }
}

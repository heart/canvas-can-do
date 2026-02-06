import type { Vec2 } from './Vec2';

/**
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 */
export class Transform2D {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

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
}

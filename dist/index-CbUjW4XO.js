var z = /* @__PURE__ */ ((r) => (r.Application = "application", r.WebGLPipes = "webgl-pipes", r.WebGLPipesAdaptor = "webgl-pipes-adaptor", r.WebGLSystem = "webgl-system", r.WebGPUPipes = "webgpu-pipes", r.WebGPUPipesAdaptor = "webgpu-pipes-adaptor", r.WebGPUSystem = "webgpu-system", r.CanvasSystem = "canvas-system", r.CanvasPipesAdaptor = "canvas-pipes-adaptor", r.CanvasPipes = "canvas-pipes", r.Asset = "asset", r.LoadParser = "load-parser", r.ResolveParser = "resolve-parser", r.CacheParser = "cache-parser", r.DetectionParser = "detection-parser", r.MaskEffect = "mask-effect", r.BlendMode = "blend-mode", r.TextureSource = "texture-source", r.Environment = "environment", r.ShapeBuilder = "shape-builder", r.Batcher = "batcher", r))(z || {});
const Rs = (r) => {
  if (typeof r == "function" || typeof r == "object" && r.extension) {
    if (!r.extension)
      throw new Error("Extension class must have an extension object");
    r = { ...typeof r.extension != "object" ? { type: r.extension } : r.extension, ref: r };
  }
  if (typeof r == "object")
    r = { ...r };
  else
    throw new Error("Invalid extension type");
  return typeof r.type == "string" && (r.type = [r.type]), r;
}, Ae = (r, t) => Rs(r).priority ?? t, ht = {
  /** @ignore */
  _addHandlers: {},
  /** @ignore */
  _removeHandlers: {},
  /** @ignore */
  _queue: {},
  /**
   * Remove extensions from PixiJS.
   * @param extensions - Extensions to be removed. Can be:
   * - Extension class with static `extension` property
   * - Extension format object with `type` and `ref`
   * - Multiple extensions as separate arguments
   * @returns {extensions} this for chaining
   * @example
   * ```ts
   * // Remove a single extension
   * extensions.remove(MyRendererPlugin);
   *
   * // Remove multiple extensions
   * extensions.remove(
   *     MyRendererPlugin,
   *     MySystemPlugin
   * );
   * ```
   * @see {@link ExtensionType} For available extension types
   * @see {@link ExtensionFormat} For extension format details
   */
  remove(...r) {
    return r.map(Rs).forEach((t) => {
      t.type.forEach((e) => this._removeHandlers[e]?.(t));
    }), this;
  },
  /**
   * Register new extensions with PixiJS. Extensions can be registered in multiple formats:
   * - As a class with a static `extension` property
   * - As an extension format object
   * - As multiple extensions passed as separate arguments
   * @param extensions - Extensions to add to PixiJS. Each can be:
   * - A class with static `extension` property
   * - An extension format object with `type` and `ref`
   * - Multiple extensions as separate arguments
   * @returns This extensions instance for chaining
   * @example
   * ```ts
   * // Register a simple extension
   * extensions.add(MyRendererPlugin);
   *
   * // Register multiple extensions
   * extensions.add(
   *     MyRendererPlugin,
   *     MySystemPlugin,
   * });
   * ```
   * @see {@link ExtensionType} For available extension types
   * @see {@link ExtensionFormat} For extension format details
   * @see {@link extensions.remove} For removing registered extensions
   */
  add(...r) {
    return r.map(Rs).forEach((t) => {
      t.type.forEach((e) => {
        const s = this._addHandlers, i = this._queue;
        s[e] ? s[e]?.(t) : (i[e] = i[e] || [], i[e]?.push(t));
      });
    }), this;
  },
  /**
   * Internal method to handle extensions by name.
   * @param type - The extension type.
   * @param onAdd  - Function handler when extensions are added/registered {@link StrictExtensionFormat}.
   * @param onRemove  - Function handler when extensions are removed/unregistered {@link StrictExtensionFormat}.
   * @returns this for chaining.
   * @internal
   * @ignore
   */
  handle(r, t, e) {
    const s = this._addHandlers, i = this._removeHandlers;
    if (s[r] || i[r])
      throw new Error(`Extension type ${r} already has a handler`);
    s[r] = t, i[r] = e;
    const n = this._queue;
    return n[r] && (n[r]?.forEach((o) => t(o)), delete n[r]), this;
  },
  /**
   * Handle a type, but using a map by `name` property.
   * @param type - Type of extension to handle.
   * @param map - The object map of named extensions.
   * @returns this for chaining.
   * @ignore
   */
  handleByMap(r, t) {
    return this.handle(
      r,
      (e) => {
        e.name && (t[e.name] = e.ref);
      },
      (e) => {
        e.name && delete t[e.name];
      }
    );
  },
  /**
   * Handle a type, but using a list of extensions with a `name` property.
   * @param type - Type of extension to handle.
   * @param map - The array of named extensions.
   * @param defaultPriority - Fallback priority if none is defined.
   * @returns this for chaining.
   * @ignore
   */
  handleByNamedList(r, t, e = -1) {
    return this.handle(
      r,
      (s) => {
        t.findIndex((n) => n.name === s.name) >= 0 || (t.push({ name: s.name, value: s.ref }), t.sort((n, o) => Ae(o.value, e) - Ae(n.value, e)));
      },
      (s) => {
        const i = t.findIndex((n) => n.name === s.name);
        i !== -1 && t.splice(i, 1);
      }
    );
  },
  /**
   * Handle a type, but using a list of extensions.
   * @param type - Type of extension to handle.
   * @param list - The list of extensions.
   * @param defaultPriority - The default priority to use if none is specified.
   * @returns this for chaining.
   * @ignore
   */
  handleByList(r, t, e = -1) {
    return this.handle(
      r,
      (s) => {
        t.includes(s.ref) || (t.push(s.ref), t.sort((i, n) => Ae(n, e) - Ae(i, e)));
      },
      (s) => {
        const i = t.indexOf(s.ref);
        i !== -1 && t.splice(i, 1);
      }
    );
  },
  /**
   * Mixin the source object(s) properties into the target class's prototype.
   * Copies all property descriptors from source objects to the target's prototype.
   * @param Target - The target class to mix properties into
   * @param sources - One or more source objects containing properties to mix in
   * @example
   * ```ts
   * // Create a mixin with shared properties
   * const moveable = {
   *     x: 0,
   *     y: 0,
   *     move(x: number, y: number) {
   *         this.x += x;
   *         this.y += y;
   *     }
   * };
   *
   * // Create a mixin with computed properties
   * const scalable = {
   *     scale: 1,
   *     get scaled() {
   *         return this.scale > 1;
   *     }
   * };
   *
   * // Apply mixins to a class
   * extensions.mixin(Sprite, moveable, scalable);
   *
   * // Use mixed-in properties
   * const sprite = new Sprite();
   * sprite.move(10, 20);
   * console.log(sprite.x, sprite.y); // 10, 20
   * ```
   * @remarks
   * - Copies all properties including getters/setters
   * - Does not modify source objects
   * - Preserves property descriptors
   * @see {@link Object.defineProperties} For details on property descriptors
   * @see {@link Object.getOwnPropertyDescriptors} For details on property copying
   */
  mixin(r, ...t) {
    for (const e of t)
      Object.defineProperties(r.prototype, Object.getOwnPropertyDescriptors(e));
  }
}, Un = {
  extension: {
    type: z.Environment,
    name: "browser",
    priority: -1
  },
  test: () => !0,
  load: async () => {
    await import("./browserAll-D358sNiQ.js");
  }
}, $n = {
  extension: {
    type: z.Environment,
    name: "webworker",
    priority: 0
  },
  test: () => typeof self < "u" && self.WorkerGlobalScope !== void 0,
  load: async () => {
    await import("./webworkerAll-EieaH4C5.js");
  }
};
class Z {
  /**
   * Creates a new `ObservablePoint`
   * @param observer - Observer to pass to listen for change events.
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */
  constructor(t, e, s) {
    this._x = e || 0, this._y = s || 0, this._observer = t;
  }
  /**
   * Creates a clone of this point.
   * @example
   * ```ts
   * // Basic cloning
   * const point = new ObservablePoint(observer, 100, 200);
   * const copy = point.clone();
   *
   * // Clone with new observer
   * const newObserver = {
   *     _onUpdate: (p) => console.log(`Clone updated: (${p.x}, ${p.y})`)
   * };
   * const watched = point.clone(newObserver);
   *
   * // Verify independence
   * watched.set(300, 400); // Only triggers new observer
   * ```
   * @param observer - Optional observer to pass to the new observable point
   * @returns A copy of this observable point
   * @see {@link ObservablePoint.copyFrom} For copying into existing point
   * @see {@link Observer} For observer interface details
   */
  clone(t) {
    return new Z(t ?? this._observer, this._x, this._y);
  }
  /**
   * Sets the point to a new x and y position.
   *
   * If y is omitted, both x and y will be set to x.
   * @example
   * ```ts
   * // Basic position setting
   * const point = new ObservablePoint(observer);
   * point.set(100, 200);
   *
   * // Set both x and y to same value
   * point.set(50); // x=50, y=50
   * ```
   * @param x - Position on the x axis
   * @param y - Position on the y axis, defaults to x
   * @returns The point instance itself
   * @see {@link ObservablePoint.copyFrom} For copying from another point
   * @see {@link ObservablePoint.equals} For comparing positions
   */
  set(t = 0, e = t) {
    return (this._x !== t || this._y !== e) && (this._x = t, this._y = e, this._observer._onUpdate(this)), this;
  }
  /**
   * Copies x and y from the given point into this point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new ObservablePoint(observer, 100, 200);
   * const target = new ObservablePoint();
   * target.copyFrom(source);
   *
   * // Copy and chain operations
   * const point = new ObservablePoint()
   *     .copyFrom(source)
   *     .set(x + 50, y + 50);
   *
   * // Copy from any PointData
   * const data = { x: 10, y: 20 };
   * point.copyFrom(data);
   * ```
   * @param p - The point to copy from
   * @returns The point instance itself
   * @see {@link ObservablePoint.copyTo} For copying to another point
   * @see {@link ObservablePoint.clone} For creating new point copy
   */
  copyFrom(t) {
    return (this._x !== t.x || this._y !== t.y) && (this._x = t.x, this._y = t.y, this._observer._onUpdate(this)), this;
  }
  /**
   * Copies this point's x and y into the given point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new ObservablePoint(100, 200);
   * const target = new ObservablePoint();
   * source.copyTo(target);
   * ```
   * @param p - The point to copy to. Can be any type that is or extends `PointLike`
   * @returns The point (`p`) with values updated
   * @see {@link ObservablePoint.copyFrom} For copying from another point
   * @see {@link ObservablePoint.clone} For creating new point copy
   */
  copyTo(t) {
    return t.set(this._x, this._y), t;
  }
  /**
   * Checks if another point is equal to this point.
   *
   * Compares x and y values using strict equality.
   * @example
   * ```ts
   * // Basic equality check
   * const p1 = new ObservablePoint(100, 200);
   * const p2 = new ObservablePoint(100, 200);
   * console.log(p1.equals(p2)); // true
   *
   * // Compare with PointData
   * const data = { x: 100, y: 200 };
   * console.log(p1.equals(data)); // true
   *
   * // Check different points
   * const p3 = new ObservablePoint(200, 300);
   * console.log(p1.equals(p3)); // false
   * ```
   * @param p - The point to check
   * @returns `true` if both `x` and `y` are equal
   * @see {@link ObservablePoint.copyFrom} For making points equal
   * @see {@link PointData} For point data interface
   */
  equals(t) {
    return t.x === this._x && t.y === this._y;
  }
  toString() {
    return `[pixi.js/math:ObservablePoint x=${this._x} y=${this._y} scope=${this._observer}]`;
  }
  /**
   * Position of the observable point on the x axis.
   * Triggers observer callback when value changes.
   * @example
   * ```ts
   * // Basic x position
   * const point = new ObservablePoint(observer);
   * point.x = 100; // Triggers observer
   *
   * // Use in calculations
   * const width = rightPoint.x - leftPoint.x;
   * ```
   * @default 0
   */
  get x() {
    return this._x;
  }
  set x(t) {
    this._x !== t && (this._x = t, this._observer._onUpdate(this));
  }
  /**
   * Position of the observable point on the y axis.
   * Triggers observer callback when value changes.
   * @example
   * ```ts
   * // Basic y position
   * const point = new ObservablePoint(observer);
   * point.y = 200; // Triggers observer
   *
   * // Use in calculations
   * const height = bottomPoint.y - topPoint.y;
   * ```
   * @default 0
   */
  get y() {
    return this._y;
  }
  set y(t) {
    this._y !== t && (this._y = t, this._observer._onUpdate(this));
  }
}
function Sr(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var ls = { exports: {} }, ui;
function jn() {
  return ui || (ui = 1, (function(r) {
    var t = Object.prototype.hasOwnProperty, e = "~";
    function s() {
    }
    Object.create && (s.prototype = /* @__PURE__ */ Object.create(null), new s().__proto__ || (e = !1));
    function i(h, l, c) {
      this.fn = h, this.context = l, this.once = c || !1;
    }
    function n(h, l, c, d, f) {
      if (typeof c != "function")
        throw new TypeError("The listener must be a function");
      var u = new i(c, d || h, f), p = e ? e + l : l;
      return h._events[p] ? h._events[p].fn ? h._events[p] = [h._events[p], u] : h._events[p].push(u) : (h._events[p] = u, h._eventsCount++), h;
    }
    function o(h, l) {
      --h._eventsCount === 0 ? h._events = new s() : delete h._events[l];
    }
    function a() {
      this._events = new s(), this._eventsCount = 0;
    }
    a.prototype.eventNames = function() {
      var l = [], c, d;
      if (this._eventsCount === 0) return l;
      for (d in c = this._events)
        t.call(c, d) && l.push(e ? d.slice(1) : d);
      return Object.getOwnPropertySymbols ? l.concat(Object.getOwnPropertySymbols(c)) : l;
    }, a.prototype.listeners = function(l) {
      var c = e ? e + l : l, d = this._events[c];
      if (!d) return [];
      if (d.fn) return [d.fn];
      for (var f = 0, u = d.length, p = new Array(u); f < u; f++)
        p[f] = d[f].fn;
      return p;
    }, a.prototype.listenerCount = function(l) {
      var c = e ? e + l : l, d = this._events[c];
      return d ? d.fn ? 1 : d.length : 0;
    }, a.prototype.emit = function(l, c, d, f, u, p) {
      var m = e ? e + l : l;
      if (!this._events[m]) return !1;
      var g = this._events[m], x = arguments.length, y, b;
      if (g.fn) {
        switch (g.once && this.removeListener(l, g.fn, void 0, !0), x) {
          case 1:
            return g.fn.call(g.context), !0;
          case 2:
            return g.fn.call(g.context, c), !0;
          case 3:
            return g.fn.call(g.context, c, d), !0;
          case 4:
            return g.fn.call(g.context, c, d, f), !0;
          case 5:
            return g.fn.call(g.context, c, d, f, u), !0;
          case 6:
            return g.fn.call(g.context, c, d, f, u, p), !0;
        }
        for (b = 1, y = new Array(x - 1); b < x; b++)
          y[b - 1] = arguments[b];
        g.fn.apply(g.context, y);
      } else {
        var w = g.length, S;
        for (b = 0; b < w; b++)
          switch (g[b].once && this.removeListener(l, g[b].fn, void 0, !0), x) {
            case 1:
              g[b].fn.call(g[b].context);
              break;
            case 2:
              g[b].fn.call(g[b].context, c);
              break;
            case 3:
              g[b].fn.call(g[b].context, c, d);
              break;
            case 4:
              g[b].fn.call(g[b].context, c, d, f);
              break;
            default:
              if (!y) for (S = 1, y = new Array(x - 1); S < x; S++)
                y[S - 1] = arguments[S];
              g[b].fn.apply(g[b].context, y);
          }
      }
      return !0;
    }, a.prototype.on = function(l, c, d) {
      return n(this, l, c, d, !1);
    }, a.prototype.once = function(l, c, d) {
      return n(this, l, c, d, !0);
    }, a.prototype.removeListener = function(l, c, d, f) {
      var u = e ? e + l : l;
      if (!this._events[u]) return this;
      if (!c)
        return o(this, u), this;
      var p = this._events[u];
      if (p.fn)
        p.fn === c && (!f || p.once) && (!d || p.context === d) && o(this, u);
      else {
        for (var m = 0, g = [], x = p.length; m < x; m++)
          (p[m].fn !== c || f && !p[m].once || d && p[m].context !== d) && g.push(p[m]);
        g.length ? this._events[u] = g.length === 1 ? g[0] : g : o(this, u);
      }
      return this;
    }, a.prototype.removeAllListeners = function(l) {
      var c;
      return l ? (c = e ? e + l : l, this._events[c] && o(this, c)) : (this._events = new s(), this._eventsCount = 0), this;
    }, a.prototype.off = a.prototype.removeListener, a.prototype.addListener = a.prototype.on, a.prefixed = e, a.EventEmitter = a, r.exports = a;
  })(ls)), ls.exports;
}
var Vn = jn();
const xt = /* @__PURE__ */ Sr(Vn), qn = Math.PI * 2, Kn = 180 / Math.PI, Zn = Math.PI / 180;
class C {
  /**
   * Creates a new `Point`
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */
  constructor(t = 0, e = 0) {
    this.x = 0, this.y = 0, this.x = t, this.y = e;
  }
  /**
   * Creates a clone of this point, which is a new instance with the same `x` and `y` values.
   * @example
   * ```ts
   * // Basic point cloning
   * const original = new Point(100, 200);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.set(300, 400);
   *
   * // Verify independence
   * console.log(original); // Point(100, 200)
   * console.log(modified); // Point(300, 400)
   * ```
   * @remarks
   * - Creates new Point instance
   * - Deep copies x and y values
   * - Independent from original
   * - Useful for preserving values
   * @returns A clone of this point
   * @see {@link Point.copyFrom} For copying into existing point
   * @see {@link Point.copyTo} For copying to existing point
   */
  clone() {
    return new C(this.x, this.y);
  }
  /**
   * Copies x and y from the given point into this point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Point(100, 200);
   * const target = new Point();
   * target.copyFrom(source);
   *
   * // Copy and chain operations
   * const point = new Point()
   *     .copyFrom(source)
   *     .set(x + 50, y + 50);
   *
   * // Copy from any PointData
   * const data = { x: 10, y: 20 };
   * point.copyFrom(data);
   * ```
   * @param p - The point to copy from
   * @returns The point instance itself
   * @see {@link Point.copyTo} For copying to another point
   * @see {@link Point.clone} For creating new point copy
   */
  copyFrom(t) {
    return this.set(t.x, t.y), this;
  }
  /**
   * Copies this point's x and y into the given point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Point(100, 200);
   * const target = new Point();
   * source.copyTo(target);
   * ```
   * @param p - The point to copy to. Can be any type that is or extends `PointLike`
   * @returns The point (`p`) with values updated
   * @see {@link Point.copyFrom} For copying from another point
   * @see {@link Point.clone} For creating new point copy
   */
  copyTo(t) {
    return t.set(this.x, this.y), t;
  }
  /**
   * Checks if another point is equal to this point.
   *
   * Compares x and y values using strict equality.
   * @example
   * ```ts
   * // Basic equality check
   * const p1 = new Point(100, 200);
   * const p2 = new Point(100, 200);
   * console.log(p1.equals(p2)); // true
   *
   * // Compare with PointData
   * const data = { x: 100, y: 200 };
   * console.log(p1.equals(data)); // true
   *
   * // Check different points
   * const p3 = new Point(200, 300);
   * console.log(p1.equals(p3)); // false
   * ```
   * @param p - The point to check
   * @returns `true` if both `x` and `y` are equal
   * @see {@link Point.copyFrom} For making points equal
   * @see {@link PointData} For point data interface
   */
  equals(t) {
    return t.x === this.x && t.y === this.y;
  }
  /**
   * Sets the point to a new x and y position.
   *
   * If y is omitted, both x and y will be set to x.
   * @example
   * ```ts
   * // Basic position setting
   * const point = new Point();
   * point.set(100, 200);
   *
   * // Set both x and y to same value
   * point.set(50); // x=50, y=50
   *
   * // Chain with other operations
   * point
   *     .set(10, 20)
   *     .copyTo(otherPoint);
   * ```
   * @param x - Position on the x axis
   * @param y - Position on the y axis, defaults to x
   * @returns The point instance itself
   * @see {@link Point.copyFrom} For copying from another point
   * @see {@link Point.equals} For comparing positions
   */
  set(t = 0, e = t) {
    return this.x = t, this.y = e, this;
  }
  toString() {
    return `[pixi.js/math:Point x=${this.x} y=${this.y}]`;
  }
  /**
   * A static Point object with `x` and `y` values of `0`.
   *
   * This shared instance is reset to zero values when accessed.
   *
   * > [!IMPORTANT] This point is shared and temporary. Do not store references to it.
   * @example
   * ```ts
   * // Use for temporary calculations
   * const tempPoint = Point.shared;
   * tempPoint.set(100, 200);
   * matrix.apply(tempPoint);
   *
   * // Will be reset to (0,0) on next access
   * const fresh = Point.shared; // x=0, y=0
   * ```
   * @readonly
   * @returns A fresh zeroed point for temporary use
   * @see {@link Point.constructor} For creating new points
   * @see {@link PointData} For basic point interface
   */
  static get shared() {
    return cs.x = 0, cs.y = 0, cs;
  }
}
const cs = new C();
class F {
  /**
   * @param a - x scale
   * @param b - y skew
   * @param c - x skew
   * @param d - y scale
   * @param tx - x translation
   * @param ty - y translation
   */
  constructor(t = 1, e = 0, s = 0, i = 1, n = 0, o = 0) {
    this.array = null, this.a = t, this.b = e, this.c = s, this.d = i, this.tx = n, this.ty = o;
  }
  /**
   * Creates a Matrix object based on the given array.
   * Populates matrix components from a flat array in column-major order.
   *
   * > [!NOTE] Array mapping order:
   * > ```
   * > array[0] = a  (x scale)
   * > array[1] = b  (y skew)
   * > array[2] = tx (x translation)
   * > array[3] = c  (x skew)
   * > array[4] = d  (y scale)
   * > array[5] = ty (y translation)
   * > ```
   * @example
   * ```ts
   * // Create matrix from array
   * const matrix = new Matrix();
   * matrix.fromArray([
   *     2, 0,  100,  // a, b, tx
   *     0, 2,  100   // c, d, ty
   * ]);
   *
   * // Create matrix from typed array
   * const float32Array = new Float32Array([
   *     1, 0, 0,     // Scale x1, no skew
   *     0, 1, 0      // No skew, scale x1
   * ]);
   * matrix.fromArray(float32Array);
   * ```
   * @param array - The array to populate the matrix from
   * @see {@link Matrix.toArray} For converting matrix to array
   * @see {@link Matrix.set} For setting values directly
   */
  fromArray(t) {
    this.a = t[0], this.b = t[1], this.c = t[3], this.d = t[4], this.tx = t[2], this.ty = t[5];
  }
  /**
   * Sets the matrix properties directly.
   * All matrix components can be set in one call.
   * @example
   * ```ts
   * // Set to identity matrix
   * matrix.set(1, 0, 0, 1, 0, 0);
   *
   * // Set to scale matrix
   * matrix.set(2, 0, 0, 2, 0, 0); // Scale 2x
   *
   * // Set to translation matrix
   * matrix.set(1, 0, 0, 1, 100, 50); // Move 100,50
   * ```
   * @param a - Scale on x axis
   * @param b - Shear on y axis
   * @param c - Shear on x axis
   * @param d - Scale on y axis
   * @param tx - Translation on x axis
   * @param ty - Translation on y axis
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.identity} For resetting to identity
   * @see {@link Matrix.fromArray} For setting from array
   */
  set(t, e, s, i, n, o) {
    return this.a = t, this.b = e, this.c = s, this.d = i, this.tx = n, this.ty = o, this;
  }
  /**
   * Creates an array from the current Matrix object.
   *
   * > [!NOTE] The array format is:
   * > ```
   * > Non-transposed:
   * > [a, c, tx,
   * > b, d, ty,
   * > 0, 0, 1]
   * >
   * > Transposed:
   * > [a, b, 0,
   * > c, d, 0,
   * > tx,ty,1]
   * > ```
   * @example
   * ```ts
   * // Basic array conversion
   * const matrix = new Matrix(2, 0, 0, 2, 100, 100);
   * const array = matrix.toArray();
   *
   * // Using existing array
   * const float32Array = new Float32Array(9);
   * matrix.toArray(false, float32Array);
   *
   * // Get transposed array
   * const transposed = matrix.toArray(true);
   * ```
   * @param transpose - Whether to transpose the matrix
   * @param out - Optional Float32Array to store the result
   * @returns The array containing the matrix values
   * @see {@link Matrix.fromArray} For creating matrix from array
   * @see {@link Matrix.array} For cached array storage
   */
  toArray(t, e) {
    this.array || (this.array = new Float32Array(9));
    const s = e || this.array;
    return t ? (s[0] = this.a, s[1] = this.b, s[2] = 0, s[3] = this.c, s[4] = this.d, s[5] = 0, s[6] = this.tx, s[7] = this.ty, s[8] = 1) : (s[0] = this.a, s[1] = this.c, s[2] = this.tx, s[3] = this.b, s[4] = this.d, s[5] = this.ty, s[6] = 0, s[7] = 0, s[8] = 1), s;
  }
  /**
   * Get a new position with the current transformation applied.
   *
   * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
   * @example
   * ```ts
   * // Basic point transformation
   * const matrix = new Matrix().translate(100, 50).rotate(Math.PI / 4);
   * const point = new Point(10, 20);
   * const transformed = matrix.apply(point);
   *
   * // Reuse existing point
   * const output = new Point();
   * matrix.apply(point, output);
   * ```
   * @param pos - The origin point to transform
   * @param newPos - Optional point to store the result
   * @returns The transformed point
   * @see {@link Matrix.applyInverse} For inverse transformation
   * @see {@link Point} For point operations
   */
  apply(t, e) {
    e = e || new C();
    const s = t.x, i = t.y;
    return e.x = this.a * s + this.c * i + this.tx, e.y = this.b * s + this.d * i + this.ty, e;
  }
  /**
   * Get a new position with the inverse of the current transformation applied.
   *
   * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
   * @example
   * ```ts
   * // Basic inverse transformation
   * const matrix = new Matrix().translate(100, 50).rotate(Math.PI / 4);
   * const worldPoint = new Point(150, 100);
   * const localPoint = matrix.applyInverse(worldPoint);
   *
   * // Reuse existing point
   * const output = new Point();
   * matrix.applyInverse(worldPoint, output);
   *
   * // Convert mouse position to local space
   * const mousePoint = new Point(mouseX, mouseY);
   * const localMouse = matrix.applyInverse(mousePoint);
   * ```
   * @param pos - The origin point to inverse-transform
   * @param newPos - Optional point to store the result
   * @returns The inverse-transformed point
   * @see {@link Matrix.apply} For forward transformation
   * @see {@link Matrix.invert} For getting inverse matrix
   */
  applyInverse(t, e) {
    e = e || new C();
    const s = this.a, i = this.b, n = this.c, o = this.d, a = this.tx, h = this.ty, l = 1 / (s * o + n * -i), c = t.x, d = t.y;
    return e.x = o * l * c + -n * l * d + (h * n - a * o) * l, e.y = s * l * d + -i * l * c + (-h * s + a * i) * l, e;
  }
  /**
   * Translates the matrix on the x and y axes.
   * Adds to the position values while preserving scale, rotation and skew.
   * @example
   * ```ts
   * // Basic translation
   * const matrix = new Matrix();
   * matrix.translate(100, 50); // Move right 100, down 50
   *
   * // Chain with other transformations
   * matrix
   *     .scale(2, 2)
   *     .translate(100, 0)
   *     .rotate(Math.PI / 4);
   * ```
   * @param x - How much to translate on the x axis
   * @param y - How much to translate on the y axis
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.set} For setting position directly
   * @see {@link Matrix.setTransform} For complete transform setup
   */
  translate(t, e) {
    return this.tx += t, this.ty += e, this;
  }
  /**
   * Applies a scale transformation to the matrix.
   * Multiplies the scale values with existing matrix components.
   * @example
   * ```ts
   * // Basic scaling
   * const matrix = new Matrix();
   * matrix.scale(2, 3); // Scale 2x horizontally, 3x vertically
   *
   * // Chain with other transformations
   * matrix
   *     .translate(100, 100)
   *     .scale(2, 2)     // Scales after translation
   *     .rotate(Math.PI / 4);
   * ```
   * @param x - The amount to scale horizontally
   * @param y - The amount to scale vertically
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.setTransform} For setting scale directly
   * @see {@link Matrix.append} For combining transformations
   */
  scale(t, e) {
    return this.a *= t, this.d *= e, this.c *= t, this.b *= e, this.tx *= t, this.ty *= e, this;
  }
  /**
   * Applies a rotation transformation to the matrix.
   *
   * Rotates around the origin (0,0) by the given angle in radians.
   * @example
   * ```ts
   * // Basic rotation
   * const matrix = new Matrix();
   * matrix.rotate(Math.PI / 4); // Rotate 45 degrees
   *
   * // Chain with other transformations
   * matrix
   *     .translate(100, 100) // Move to rotation center
   *     .rotate(Math.PI)     // Rotate 180 degrees
   *     .scale(2, 2);        // Scale after rotation
   *
   * // Common angles
   * matrix.rotate(Math.PI / 2);  // 90 degrees
   * matrix.rotate(Math.PI);      // 180 degrees
   * matrix.rotate(Math.PI * 2);  // 360 degrees
   * ```
   * @remarks
   * - Rotates around origin point (0,0)
   * - Affects position if translation was set
   * - Uses counter-clockwise rotation
   * - Order of operations matters when chaining
   * @param angle - The angle in radians
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.setTransform} For setting rotation directly
   * @see {@link Matrix.append} For combining transformations
   */
  rotate(t) {
    const e = Math.cos(t), s = Math.sin(t), i = this.a, n = this.c, o = this.tx;
    return this.a = i * e - this.b * s, this.b = i * s + this.b * e, this.c = n * e - this.d * s, this.d = n * s + this.d * e, this.tx = o * e - this.ty * s, this.ty = o * s + this.ty * e, this;
  }
  /**
   * Appends the given Matrix to this Matrix.
   * Combines two matrices by multiplying them together: this = this * matrix
   * @example
   * ```ts
   * // Basic matrix combination
   * const matrix = new Matrix();
   * const other = new Matrix().translate(100, 0).rotate(Math.PI / 4);
   * matrix.append(other);
   * ```
   * @remarks
   * - Order matters: A.append(B) !== B.append(A)
   * - Modifies current matrix
   * - Preserves transformation order
   * - Commonly used for combining transforms
   * @param matrix - The matrix to append
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.prepend} For prepending transformations
   * @see {@link Matrix.appendFrom} For appending two external matrices
   */
  append(t) {
    const e = this.a, s = this.b, i = this.c, n = this.d;
    return this.a = t.a * e + t.b * i, this.b = t.a * s + t.b * n, this.c = t.c * e + t.d * i, this.d = t.c * s + t.d * n, this.tx = t.tx * e + t.ty * i + this.tx, this.ty = t.tx * s + t.ty * n + this.ty, this;
  }
  /**
   * Appends two matrices and sets the result to this matrix.
   * Performs matrix multiplication: this = A * B
   * @example
   * ```ts
   * // Basic matrix multiplication
   * const result = new Matrix();
   * const matrixA = new Matrix().scale(2, 2);
   * const matrixB = new Matrix().rotate(Math.PI / 4);
   * result.appendFrom(matrixA, matrixB);
   * ```
   * @remarks
   * - Order matters: A * B !== B * A
   * - Creates a new transformation from two others
   * - More efficient than append() for multiple operations
   * - Does not modify input matrices
   * @param a - The first matrix to multiply
   * @param b - The second matrix to multiply
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.append} For single matrix combination
   * @see {@link Matrix.prepend} For reverse order multiplication
   */
  appendFrom(t, e) {
    const s = t.a, i = t.b, n = t.c, o = t.d, a = t.tx, h = t.ty, l = e.a, c = e.b, d = e.c, f = e.d;
    return this.a = s * l + i * d, this.b = s * c + i * f, this.c = n * l + o * d, this.d = n * c + o * f, this.tx = a * l + h * d + e.tx, this.ty = a * c + h * f + e.ty, this;
  }
  /**
   * Sets the matrix based on all the available properties.
   * Combines position, scale, rotation, skew and pivot in a single operation.
   * @example
   * ```ts
   * // Basic transform setup
   * const matrix = new Matrix();
   * matrix.setTransform(
   *     100, 100,    // position
   *     0, 0,        // pivot
   *     2, 2,        // scale
   *     Math.PI / 4, // rotation (45 degrees)
   *     0, 0         // skew
   * );
   * ```
   * @remarks
   * - Updates all matrix components at once
   * - More efficient than separate transform calls
   * - Uses radians for rotation and skew
   * - Pivot affects rotation center
   * @param x - Position on the x axis
   * @param y - Position on the y axis
   * @param pivotX - Pivot on the x axis
   * @param pivotY - Pivot on the y axis
   * @param scaleX - Scale on the x axis
   * @param scaleY - Scale on the y axis
   * @param rotation - Rotation in radians
   * @param skewX - Skew on the x axis
   * @param skewY - Skew on the y axis
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.decompose} For extracting transform properties
   * @see {@link TransformableObject} For transform data structure
   */
  setTransform(t, e, s, i, n, o, a, h, l) {
    return this.a = Math.cos(a + l) * n, this.b = Math.sin(a + l) * n, this.c = -Math.sin(a - h) * o, this.d = Math.cos(a - h) * o, this.tx = t - (s * this.a + i * this.c), this.ty = e - (s * this.b + i * this.d), this;
  }
  /**
   * Prepends the given Matrix to this Matrix.
   * Combines two matrices by multiplying them together: this = matrix * this
   * @example
   * ```ts
   * // Basic matrix prepend
   * const matrix = new Matrix().scale(2, 2);
   * const other = new Matrix().translate(100, 0);
   * matrix.prepend(other); // Translation happens before scaling
   * ```
   * @remarks
   * - Order matters: A.prepend(B) !== B.prepend(A)
   * - Modifies current matrix
   * - Reverses transformation order compared to append()
   * @param matrix - The matrix to prepend
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.append} For appending transformations
   * @see {@link Matrix.appendFrom} For combining external matrices
   */
  prepend(t) {
    const e = this.tx;
    if (t.a !== 1 || t.b !== 0 || t.c !== 0 || t.d !== 1) {
      const s = this.a, i = this.c;
      this.a = s * t.a + this.b * t.c, this.b = s * t.b + this.b * t.d, this.c = i * t.a + this.d * t.c, this.d = i * t.b + this.d * t.d;
    }
    return this.tx = e * t.a + this.ty * t.c + t.tx, this.ty = e * t.b + this.ty * t.d + t.ty, this;
  }
  /**
   * Decomposes the matrix into its individual transform components.
   * Extracts position, scale, rotation and skew values from the matrix.
   * @example
   * ```ts
   * // Basic decomposition
   * const matrix = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4)
   *     .scale(2, 2);
   *
   * const transform = {
   *     position: new Point(),
   *     scale: new Point(),
   *     pivot: new Point(),
   *     skew: new Point(),
   *     rotation: 0
   * };
   *
   * matrix.decompose(transform);
   * console.log(transform.position); // Point(100, 100)
   * console.log(transform.rotation); // ~0.785 (PI/4)
   * console.log(transform.scale); // Point(2, 2)
   * ```
   * @remarks
   * - Handles combined transformations
   * - Accounts for pivot points
   * - Chooses between rotation/skew based on transform type
   * - Uses radians for rotation and skew
   * @param transform - The transform object to store the decomposed values
   * @returns The transform with the newly applied properties
   * @see {@link Matrix.setTransform} For composing from components
   * @see {@link TransformableObject} For transform structure
   */
  decompose(t) {
    const e = this.a, s = this.b, i = this.c, n = this.d, o = t.pivot, a = -Math.atan2(-i, n), h = Math.atan2(s, e), l = Math.abs(a + h);
    return l < 1e-5 || Math.abs(qn - l) < 1e-5 ? (t.rotation = h, t.skew.x = t.skew.y = 0) : (t.rotation = 0, t.skew.x = a, t.skew.y = h), t.scale.x = Math.sqrt(e * e + s * s), t.scale.y = Math.sqrt(i * i + n * n), t.position.x = this.tx + (o.x * e + o.y * i), t.position.y = this.ty + (o.x * s + o.y * n), t;
  }
  /**
   * Inverts this matrix.
   * Creates the matrix that when multiplied with this matrix results in an identity matrix.
   * @example
   * ```ts
   * // Basic matrix inversion
   * const matrix = new Matrix()
   *     .translate(100, 50)
   *     .scale(2, 2);
   *
   * matrix.invert(); // Now transforms in opposite direction
   *
   * // Verify inversion
   * const point = new Point(50, 50);
   * const transformed = matrix.apply(point);
   * const original = matrix.invert().apply(transformed);
   * // original ≈ point
   * ```
   * @remarks
   * - Modifies the current matrix
   * - Useful for reversing transformations
   * - Cannot invert matrices with zero determinant
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.identity} For resetting to identity
   * @see {@link Matrix.applyInverse} For inverse transformations
   */
  invert() {
    const t = this.a, e = this.b, s = this.c, i = this.d, n = this.tx, o = t * i - e * s;
    return this.a = i / o, this.b = -e / o, this.c = -s / o, this.d = t / o, this.tx = (s * this.ty - i * n) / o, this.ty = -(t * this.ty - e * n) / o, this;
  }
  /**
   * Checks if this matrix is an identity matrix.
   *
   * An identity matrix has no transformations applied (default state).
   * @example
   * ```ts
   * // Check if matrix is identity
   * const matrix = new Matrix();
   * console.log(matrix.isIdentity()); // true
   *
   * // Check after transformations
   * matrix.translate(100, 0);
   * console.log(matrix.isIdentity()); // false
   *
   * // Reset and verify
   * matrix.identity();
   * console.log(matrix.isIdentity()); // true
   * ```
   * @remarks
   * - Verifies a = 1, d = 1 (no scale)
   * - Verifies b = 0, c = 0 (no skew)
   * - Verifies tx = 0, ty = 0 (no translation)
   * @returns True if matrix has no transformations
   * @see {@link Matrix.identity} For resetting to identity
   * @see {@link Matrix.IDENTITY} For constant identity matrix
   */
  isIdentity() {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
  }
  /**
   * Resets this Matrix to an identity (default) matrix.
   * Sets all components to their default values: scale=1, no skew, no translation.
   * @example
   * ```ts
   * // Reset transformed matrix
   * const matrix = new Matrix()
   *     .scale(2, 2)
   *     .rotate(Math.PI / 4);
   * matrix.identity(); // Back to default state
   *
   * // Chain after reset
   * matrix
   *     .identity()
   *     .translate(100, 100)
   *     .scale(2, 2);
   *
   * // Compare with identity constant
   * const isDefault = matrix.equals(Matrix.IDENTITY);
   * ```
   * @remarks
   * - Sets a=1, d=1 (default scale)
   * - Sets b=0, c=0 (no skew)
   * - Sets tx=0, ty=0 (no translation)
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.IDENTITY} For constant identity matrix
   * @see {@link Matrix.isIdentity} For checking identity state
   */
  identity() {
    return this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.tx = 0, this.ty = 0, this;
  }
  /**
   * Creates a new Matrix object with the same values as this one.
   * @returns A copy of this matrix. Good for chaining method calls.
   */
  clone() {
    const t = new F();
    return t.a = this.a, t.b = this.b, t.c = this.c, t.d = this.d, t.tx = this.tx, t.ty = this.ty, t;
  }
  /**
   * Creates a new Matrix object with the same values as this one.
   * @param matrix
   * @example
   * ```ts
   * // Basic matrix cloning
   * const matrix = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4);
   * const copy = matrix.clone();
   *
   * // Clone and modify
   * const modified = matrix.clone()
   *     .scale(2, 2);
   *
   * // Compare matrices
   * console.log(matrix.equals(copy));     // true
   * console.log(matrix.equals(modified)); // false
   * ```
   * @returns A copy of this matrix. Good for chaining method calls.
   * @see {@link Matrix.copyTo} For copying to existing matrix
   * @see {@link Matrix.copyFrom} For copying from another matrix
   */
  copyTo(t) {
    return t.a = this.a, t.b = this.b, t.c = this.c, t.d = this.d, t.tx = this.tx, t.ty = this.ty, t;
  }
  /**
   * Changes the values of the matrix to be the same as the ones in given matrix.
   * @example
   * ```ts
   * // Basic matrix copying
   * const source = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4);
   * const target = new Matrix();
   * target.copyFrom(source);
   * ```
   * @param matrix - The matrix to copy from
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.clone} For creating new matrix copy
   * @see {@link Matrix.copyTo} For copying to another matrix
   */
  copyFrom(t) {
    return this.a = t.a, this.b = t.b, this.c = t.c, this.d = t.d, this.tx = t.tx, this.ty = t.ty, this;
  }
  /**
   * Checks if this matrix equals another matrix.
   * Compares all components for exact equality.
   * @example
   * ```ts
   * // Basic equality check
   * const m1 = new Matrix();
   * const m2 = new Matrix();
   * console.log(m1.equals(m2)); // true
   *
   * // Compare transformed matrices
   * const transform = new Matrix()
   *     .translate(100, 100)
   * const clone = new Matrix()
   *     .scale(2, 2);
   * console.log(transform.equals(clone)); // false
   * ```
   * @param matrix - The matrix to compare to
   * @returns True if matrices are identical
   * @see {@link Matrix.copyFrom} For copying matrix values
   * @see {@link Matrix.isIdentity} For identity comparison
   */
  equals(t) {
    return t.a === this.a && t.b === this.b && t.c === this.c && t.d === this.d && t.tx === this.tx && t.ty === this.ty;
  }
  toString() {
    return `[pixi.js:Matrix a=${this.a} b=${this.b} c=${this.c} d=${this.d} tx=${this.tx} ty=${this.ty}]`;
  }
  /**
   * A default (identity) matrix with no transformations applied.
   *
   * > [!IMPORTANT] This is a shared read-only object. Create a new Matrix if you need to modify it.
   * @example
   * ```ts
   * // Get identity matrix reference
   * const identity = Matrix.IDENTITY;
   * console.log(identity.isIdentity()); // true
   *
   * // Compare with identity
   * const matrix = new Matrix();
   * console.log(matrix.equals(Matrix.IDENTITY)); // true
   *
   * // Create new matrix instead of modifying IDENTITY
   * const transform = new Matrix()
   *     .copyFrom(Matrix.IDENTITY)
   *     .translate(100, 100);
   * ```
   * @readonly
   * @returns A read-only identity matrix
   * @see {@link Matrix.shared} For temporary calculations
   * @see {@link Matrix.identity} For resetting matrices
   */
  static get IDENTITY() {
    return Jn.identity();
  }
  /**
   * A static Matrix that can be used to avoid creating new objects.
   * Will always ensure the matrix is reset to identity when requested.
   *
   * > [!IMPORTANT] This matrix is shared and temporary. Do not store references to it.
   * @example
   * ```ts
   * // Use for temporary calculations
   * const tempMatrix = Matrix.shared;
   * tempMatrix.translate(100, 100).rotate(Math.PI / 4);
   * const point = tempMatrix.apply({ x: 10, y: 20 });
   *
   * // Will be reset to identity on next access
   * const fresh = Matrix.shared; // Back to identity
   * ```
   * @remarks
   * - Always returns identity matrix
   * - Safe to modify temporarily
   * - Not safe to store references
   * - Useful for one-off calculations
   * @readonly
   * @returns A fresh identity matrix for temporary use
   * @see {@link Matrix.IDENTITY} For immutable identity matrix
   * @see {@link Matrix.identity} For resetting matrices
   */
  static get shared() {
    return Qn.identity();
  }
}
const Qn = new F(), Jn = new F(), Bt = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1], Gt = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1], Dt = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1], zt = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1], Ls = [], Cr = [], Ie = Math.sign;
function to() {
  for (let r = 0; r < 16; r++) {
    const t = [];
    Ls.push(t);
    for (let e = 0; e < 16; e++) {
      const s = Ie(Bt[r] * Bt[e] + Dt[r] * Gt[e]), i = Ie(Gt[r] * Bt[e] + zt[r] * Gt[e]), n = Ie(Bt[r] * Dt[e] + Dt[r] * zt[e]), o = Ie(Gt[r] * Dt[e] + zt[r] * zt[e]);
      for (let a = 0; a < 16; a++)
        if (Bt[a] === s && Gt[a] === i && Dt[a] === n && zt[a] === o) {
          t.push(a);
          break;
        }
    }
  }
  for (let r = 0; r < 16; r++) {
    const t = new F();
    t.set(Bt[r], Gt[r], Dt[r], zt[r], 0, 0), Cr.push(t);
  }
}
to();
const Y = {
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 0°       | East      |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  E: 0,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 45°↻     | Southeast |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  SE: 1,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 90°↻     | South     |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  S: 2,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 135°↻    | Southwest |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  SW: 3,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 180°     | West      |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  W: 4,
  /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -135°/225°↻ | Northwest    |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  NW: 5,
  /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -90°/270°↻  | North        |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  N: 6,
  /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -45°/315°↻  | Northeast    |
   * @group groupD8
   * @type {GD8Symmetry}
   */
  NE: 7,
  /**
   * Reflection about Y-axis.
   * @group groupD8
   * @type {GD8Symmetry}
   */
  MIRROR_VERTICAL: 8,
  /**
   * Reflection about the main diagonal.
   * @group groupD8
   * @type {GD8Symmetry}
   */
  MAIN_DIAGONAL: 10,
  /**
   * Reflection about X-axis.
   * @group groupD8
   * @type {GD8Symmetry}
   */
  MIRROR_HORIZONTAL: 12,
  /**
   * Reflection about reverse diagonal.
   * @group groupD8
   * @type {GD8Symmetry}
   */
  REVERSE_DIAGONAL: 14,
  /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the U-axis
   *    after rotating the axes.
   */
  uX: (r) => Bt[r],
  /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the U-axis
   *    after rotating the axes.
   */
  uY: (r) => Gt[r],
  /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the V-axis
   *    after rotating the axes.
   */
  vX: (r) => Dt[r],
  /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the V-axis
   *    after rotating the axes.
   */
  vY: (r) => zt[r],
  /**
   * @group groupD8
   * @param {GD8Symmetry} rotation - symmetry whose opposite
   *   is needed. Only rotations have opposite symmetries while
   *   reflections don't.
   * @returns {GD8Symmetry} The opposite symmetry of `rotation`
   */
  inv: (r) => r & 8 ? r & 15 : -r & 7,
  /**
   * Composes the two D8 operations.
   *
   * Taking `^` as reflection:
   *
   * |       | E=0 | S=2 | W=4 | N=6 | E^=8 | S^=10 | W^=12 | N^=14 |
   * |-------|-----|-----|-----|-----|------|-------|-------|-------|
   * | E=0   | E   | S   | W   | N   | E^   | S^    | W^    | N^    |
   * | S=2   | S   | W   | N   | E   | S^   | W^    | N^    | E^    |
   * | W=4   | W   | N   | E   | S   | W^   | N^    | E^    | S^    |
   * | N=6   | N   | E   | S   | W   | N^   | E^    | S^    | W^    |
   * | E^=8  | E^  | N^  | W^  | S^  | E    | N     | W     | S     |
   * | S^=10 | S^  | E^  | N^  | W^  | S    | E     | N     | W     |
   * | W^=12 | W^  | S^  | E^  | N^  | W    | S     | E     | N     |
   * | N^=14 | N^  | W^  | S^  | E^  | N    | W     | S     | E     |
   *
   * [This is a Cayley table]{@link https://en.wikipedia.org/wiki/Cayley_table}
   * @group groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation, which
   *   is the row in the above cayley table.
   * @param {GD8Symmetry} rotationFirst - First operation, which
   *   is the column in the above cayley table.
   * @returns {GD8Symmetry} Composed operation
   */
  add: (r, t) => Ls[r][t],
  /**
   * Reverse of `add`.
   * @group groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation
   * @param {GD8Symmetry} rotationFirst - First operation
   * @returns {GD8Symmetry} Result
   */
  sub: (r, t) => Ls[r][Y.inv(t)],
  /**
   * Adds 180 degrees to rotation, which is a commutative
   * operation.
   * @group groupD8
   * @param {number} rotation - The number to rotate.
   * @returns {number} Rotated number
   */
  rotate180: (r) => r ^ 4,
  /**
   * Checks if the rotation angle is vertical, i.e. south
   * or north. It doesn't work for reflections.
   * @group groupD8
   * @param {GD8Symmetry} rotation - The number to check.
   * @returns {boolean} Whether or not the direction is vertical
   */
  isVertical: (r) => (r & 3) === 2,
  // rotation % 4 === 2
  /**
   * Approximates the vector `V(dx,dy)` into one of the
   * eight directions provided by `groupD8`.
   * @group groupD8
   * @param {number} dx - X-component of the vector
   * @param {number} dy - Y-component of the vector
   * @returns {GD8Symmetry} Approximation of the vector into
   *  one of the eight symmetries.
   */
  byDirection: (r, t) => Math.abs(r) * 2 <= Math.abs(t) ? t >= 0 ? Y.S : Y.N : Math.abs(t) * 2 <= Math.abs(r) ? r > 0 ? Y.E : Y.W : t > 0 ? r > 0 ? Y.SE : Y.SW : r > 0 ? Y.NE : Y.NW,
  /**
   * Helps sprite to compensate texture packer rotation.
   * @group groupD8
   * @param {Matrix} matrix - sprite world matrix
   * @param {GD8Symmetry} rotation - The rotation factor to use.
   * @param {number} tx - sprite anchoring
   * @param {number} ty - sprite anchoring
   */
  matrixAppendRotationInv: (r, t, e = 0, s = 0) => {
    const i = Cr[Y.inv(t)];
    i.tx = e, i.ty = s, r.append(i);
  },
  /**
   * Transforms rectangle coordinates based on texture packer rotation.
   * Used when texture atlas pages are rotated and coordinates need to be adjusted.
   * @group groupD8
   * @param {RectangleLike} rect - Rectangle with original coordinates to transform
   * @param {RectangleLike} sourceFrame - Source texture frame (includes offset and dimensions)
   * @param {GD8Symmetry} rotation - The groupD8 rotation value
   * @param {Rectangle} out - Rectangle to store the result
   * @returns {Rectangle} Transformed coordinates (includes source frame offset)
   */
  transformRectCoords: (r, t, e, s) => {
    const { x: i, y: n, width: o, height: a } = r, { x: h, y: l, width: c, height: d } = t;
    return e === Y.E ? (s.set(i + h, n + l, o, a), s) : e === Y.S ? s.set(
      c - n - a + h,
      i + l,
      a,
      o
    ) : e === Y.W ? s.set(
      c - i - o + h,
      d - n - a + l,
      o,
      a
    ) : e === Y.N ? s.set(
      n + h,
      d - i - o + l,
      a,
      o
    ) : s.set(i + h, n + l, o, a);
  }
}, Ee = [new C(), new C(), new C(), new C()];
class j {
  /**
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of the rectangle
   * @param height - The overall height of the rectangle
   */
  constructor(t = 0, e = 0, s = 0, i = 0) {
    this.type = "rectangle", this.x = Number(t), this.y = Number(e), this.width = Number(s), this.height = Number(i);
  }
  /**
   * Returns the left edge (x-coordinate) of the rectangle.
   * @example
   * ```ts
   * // Get left edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.left); // 100
   *
   * // Use in alignment calculations
   * sprite.x = rect.left + padding;
   *
   * // Compare positions
   * if (point.x > rect.left) {
   *     console.log('Point is right of rectangle');
   * }
   * ```
   * @readonly
   * @returns The x-coordinate of the left edge
   * @see {@link Rectangle.right} For right edge position
   * @see {@link Rectangle.x} For direct x-coordinate access
   */
  get left() {
    return this.x;
  }
  /**
   * Returns the right edge (x + width) of the rectangle.
   * @example
   * ```ts
   * // Get right edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.right); // 300
   *
   * // Align to right edge
   * sprite.x = rect.right - sprite.width;
   *
   * // Check boundaries
   * if (point.x < rect.right) {
   *     console.log('Point is inside right bound');
   * }
   * ```
   * @readonly
   * @returns The x-coordinate of the right edge
   * @see {@link Rectangle.left} For left edge position
   * @see {@link Rectangle.width} For width value
   */
  get right() {
    return this.x + this.width;
  }
  /**
   * Returns the top edge (y-coordinate) of the rectangle.
   * @example
   * ```ts
   * // Get top edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.top); // 100
   *
   * // Position above rectangle
   * sprite.y = rect.top - sprite.height;
   *
   * // Check vertical position
   * if (point.y > rect.top) {
   *     console.log('Point is below top edge');
   * }
   * ```
   * @readonly
   * @returns The y-coordinate of the top edge
   * @see {@link Rectangle.bottom} For bottom edge position
   * @see {@link Rectangle.y} For direct y-coordinate access
   */
  get top() {
    return this.y;
  }
  /**
   * Returns the bottom edge (y + height) of the rectangle.
   * @example
   * ```ts
   * // Get bottom edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.bottom); // 250
   *
   * // Stack below rectangle
   * sprite.y = rect.bottom + margin;
   *
   * // Check vertical bounds
   * if (point.y < rect.bottom) {
   *     console.log('Point is above bottom edge');
   * }
   * ```
   * @readonly
   * @returns The y-coordinate of the bottom edge
   * @see {@link Rectangle.top} For top edge position
   * @see {@link Rectangle.height} For height value
   */
  get bottom() {
    return this.y + this.height;
  }
  /**
   * Determines whether the Rectangle is empty (has no area).
   * @example
   * ```ts
   * // Check zero dimensions
   * const rect = new Rectangle(100, 100, 0, 50);
   * console.log(rect.isEmpty()); // true
   * ```
   * @returns True if the rectangle has no area
   * @see {@link Rectangle.width} For width value
   * @see {@link Rectangle.height} For height value
   */
  isEmpty() {
    return this.left === this.right || this.top === this.bottom;
  }
  /**
   * A constant empty rectangle. This is a new object every time the property is accessed.
   * @example
   * ```ts
   * // Get fresh empty rectangle
   * const empty = Rectangle.EMPTY;
   * console.log(empty.isEmpty()); // true
   * ```
   * @returns A new empty rectangle instance
   * @see {@link Rectangle.isEmpty} For empty state testing
   */
  static get EMPTY() {
    return new j(0, 0, 0, 0);
  }
  /**
   * Creates a clone of this Rectangle
   * @example
   * ```ts
   * // Basic cloning
   * const original = new Rectangle(100, 100, 200, 150);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.width *= 2;
   * modified.height += 50;
   *
   * // Verify independence
   * console.log(original.width);  // 200
   * console.log(modified.width);  // 400
   * ```
   * @returns A copy of the rectangle
   * @see {@link Rectangle.copyFrom} For copying into existing rectangle
   * @see {@link Rectangle.copyTo} For copying to another rectangle
   */
  clone() {
    return new j(this.x, this.y, this.width, this.height);
  }
  /**
   * Converts a Bounds object to a Rectangle object.
   * @example
   * ```ts
   * // Convert bounds to rectangle
   * const bounds = container.getBounds();
   * const rect = new Rectangle().copyFromBounds(bounds);
   * ```
   * @param bounds - The bounds to copy and convert to a rectangle
   * @returns Returns itself
   * @see {@link Bounds} For bounds object structure
   * @see {@link Rectangle.getBounds} For getting rectangle bounds
   */
  copyFromBounds(t) {
    return this.x = t.minX, this.y = t.minY, this.width = t.maxX - t.minX, this.height = t.maxY - t.minY, this;
  }
  /**
   * Copies another rectangle to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Rectangle(100, 100, 200, 150);
   * const target = new Rectangle();
   * target.copyFrom(source);
   *
   * // Chain with other operations
   * const rect = new Rectangle()
   *     .copyFrom(source)
   *     .pad(10);
   * ```
   * @param rectangle - The rectangle to copy from
   * @returns Returns itself
   * @see {@link Rectangle.copyTo} For copying to another rectangle
   * @see {@link Rectangle.clone} For creating new rectangle copy
   */
  copyFrom(t) {
    return this.x = t.x, this.y = t.y, this.width = t.width, this.height = t.height, this;
  }
  /**
   * Copies this rectangle to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Rectangle(100, 100, 200, 150);
   * const target = new Rectangle();
   * source.copyTo(target);
   *
   * // Chain with other operations
   * const result = source
   *     .copyTo(new Rectangle())
   *     .getBounds();
   * ```
   * @param rectangle - The rectangle to copy to
   * @returns Returns given parameter
   * @see {@link Rectangle.copyFrom} For copying from another rectangle
   * @see {@link Rectangle.clone} For creating new rectangle copy
   */
  copyTo(t) {
    return t.copyFrom(this), t;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this Rectangle
   * @example
   * ```ts
   * // Basic containment check
   * const rect = new Rectangle(100, 100, 200, 150);
   * const isInside = rect.contains(150, 125); // true
   * // Check edge cases
   * console.log(rect.contains(100, 100)); // true (on edge)
   * console.log(rect.contains(300, 250)); // false (outside)
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Rectangle
   * @see {@link Rectangle.containsRect} For rectangle containment
   * @see {@link Rectangle.strokeContains} For checking stroke intersection
   */
  contains(t, e) {
    return this.width <= 0 || this.height <= 0 ? !1 : t >= this.x && t < this.x + this.width && e >= this.y && e < this.y + this.height;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this rectangle including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const rect = new Rectangle(100, 100, 200, 150);
   * const isOnStroke = rect.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = rect.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = rect.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = rect.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coordinates are within this rectangle's stroke
   * @see {@link Rectangle.contains} For checking fill containment
   * @see {@link Rectangle.getBounds} For getting stroke bounds
   */
  strokeContains(t, e, s, i = 0.5) {
    const { width: n, height: o } = this;
    if (n <= 0 || o <= 0)
      return !1;
    const a = this.x, h = this.y, l = s * (1 - i), c = s - l, d = a - l, f = a + n + l, u = h - l, p = h + o + l, m = a + c, g = a + n - c, x = h + c, y = h + o - c;
    return t >= d && t <= f && e >= u && e <= p && !(t > m && t < g && e > x && e < y);
  }
  /**
   * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
   * Returns true only if the area of the intersection is >0, this means that Rectangles
   * sharing a side are not overlapping. Another side effect is that an arealess rectangle
   * (width or height equal to zero) can't intersect any other rectangle.
   * @param {Rectangle} other - The Rectangle to intersect with `this`.
   * @param {Matrix} transform - The transformation matrix of `other`.
   * @returns {boolean} A value of `true` if the transformed `other` Rectangle intersects with `this`; otherwise `false`.
   */
  /**
   * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
   *
   * Returns true only if the area of the intersection is greater than 0.
   * This means that rectangles sharing only a side are not considered intersecting.
   * @example
   * ```ts
   * // Basic intersection check
   * const rect1 = new Rectangle(0, 0, 100, 100);
   * const rect2 = new Rectangle(50, 50, 100, 100);
   * console.log(rect1.intersects(rect2)); // true
   *
   * // With transformation matrix
   * const matrix = new Matrix();
   * matrix.rotate(Math.PI / 4); // 45 degrees
   * console.log(rect1.intersects(rect2, matrix)); // Checks with rotation
   *
   * // Edge cases
   * const zeroWidth = new Rectangle(0, 0, 0, 100);
   * console.log(rect1.intersects(zeroWidth)); // false (no area)
   * ```
   * @remarks
   * - Returns true only if intersection area is > 0
   * - Rectangles sharing only a side are not intersecting
   * - Zero-area rectangles cannot intersect anything
   * - Supports optional transformation matrix
   * @param other - The Rectangle to intersect with `this`
   * @param transform - Optional transformation matrix of `other`
   * @returns True if the transformed `other` Rectangle intersects with `this`
   * @see {@link Rectangle.containsRect} For containment testing
   * @see {@link Rectangle.contains} For point testing
   */
  intersects(t, e) {
    if (!e) {
      const T = this.x < t.x ? t.x : this.x;
      if ((this.right > t.right ? t.right : this.right) <= T)
        return !1;
      const P = this.y < t.y ? t.y : this.y;
      return (this.bottom > t.bottom ? t.bottom : this.bottom) > P;
    }
    const s = this.left, i = this.right, n = this.top, o = this.bottom;
    if (i <= s || o <= n)
      return !1;
    const a = Ee[0].set(t.left, t.top), h = Ee[1].set(t.left, t.bottom), l = Ee[2].set(t.right, t.top), c = Ee[3].set(t.right, t.bottom);
    if (l.x <= a.x || h.y <= a.y)
      return !1;
    const d = Math.sign(e.a * e.d - e.b * e.c);
    if (d === 0 || (e.apply(a, a), e.apply(h, h), e.apply(l, l), e.apply(c, c), Math.max(a.x, h.x, l.x, c.x) <= s || Math.min(a.x, h.x, l.x, c.x) >= i || Math.max(a.y, h.y, l.y, c.y) <= n || Math.min(a.y, h.y, l.y, c.y) >= o))
      return !1;
    const f = d * (h.y - a.y), u = d * (a.x - h.x), p = f * s + u * n, m = f * i + u * n, g = f * s + u * o, x = f * i + u * o;
    if (Math.max(p, m, g, x) <= f * a.x + u * a.y || Math.min(p, m, g, x) >= f * c.x + u * c.y)
      return !1;
    const y = d * (a.y - l.y), b = d * (l.x - a.x), w = y * s + b * n, S = y * i + b * n, _ = y * s + b * o, v = y * i + b * o;
    return !(Math.max(w, S, _, v) <= y * a.x + b * a.y || Math.min(w, S, _, v) >= y * c.x + b * c.y);
  }
  /**
   * Pads the rectangle making it grow in all directions.
   *
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   * @example
   * ```ts
   * // Basic padding
   * const rect = new Rectangle(100, 100, 200, 150);
   * rect.pad(10); // Adds 10px padding on all sides
   *
   * // Different horizontal and vertical padding
   * const uiRect = new Rectangle(0, 0, 100, 50);
   * uiRect.pad(20, 10); // 20px horizontal, 10px vertical
   * ```
   * @remarks
   * - Adjusts x/y by subtracting padding
   * - Increases width/height by padding * 2
   * - Common in UI layout calculations
   * - Chainable with other methods
   * @param paddingX - The horizontal padding amount
   * @param paddingY - The vertical padding amount
   * @returns Returns itself
   * @see {@link Rectangle.enlarge} For growing to include another rectangle
   * @see {@link Rectangle.fit} For shrinking to fit within another rectangle
   */
  pad(t = 0, e = t) {
    return this.x -= t, this.y -= e, this.width += t * 2, this.height += e * 2, this;
  }
  /**
   * Fits this rectangle around the passed one.
   * @example
   * ```ts
   * // Basic fitting
   * const container = new Rectangle(0, 0, 100, 100);
   * const content = new Rectangle(25, 25, 200, 200);
   * content.fit(container); // Clips to container bounds
   * ```
   * @param rectangle - The rectangle to fit around
   * @returns Returns itself
   * @see {@link Rectangle.enlarge} For growing to include another rectangle
   * @see {@link Rectangle.pad} For adding padding around the rectangle
   */
  fit(t) {
    const e = Math.max(this.x, t.x), s = Math.min(this.x + this.width, t.x + t.width), i = Math.max(this.y, t.y), n = Math.min(this.y + this.height, t.y + t.height);
    return this.x = e, this.width = Math.max(s - e, 0), this.y = i, this.height = Math.max(n - i, 0), this;
  }
  /**
   * Enlarges rectangle so that its corners lie on a grid defined by resolution.
   * @example
   * ```ts
   * // Basic grid alignment
   * const rect = new Rectangle(10.2, 10.6, 100.8, 100.4);
   * rect.ceil(); // Aligns to whole pixels
   *
   * // Custom resolution grid
   * const uiRect = new Rectangle(5.3, 5.7, 50.2, 50.8);
   * uiRect.ceil(0.5); // Aligns to half pixels
   *
   * // Use with precision value
   * const preciseRect = new Rectangle(20.001, 20.999, 100.001, 100.999);
   * preciseRect.ceil(1, 0.01); // Handles small decimal variations
   * ```
   * @param resolution - The grid size to align to (1 = whole pixels)
   * @param eps - Small number to prevent floating point errors
   * @returns Returns itself
   * @see {@link Rectangle.fit} For constraining to bounds
   * @see {@link Rectangle.enlarge} For growing dimensions
   */
  ceil(t = 1, e = 1e-3) {
    const s = Math.ceil((this.x + this.width - e) * t) / t, i = Math.ceil((this.y + this.height - e) * t) / t;
    return this.x = Math.floor((this.x + e) * t) / t, this.y = Math.floor((this.y + e) * t) / t, this.width = s - this.x, this.height = i - this.y, this;
  }
  /**
   * Scales the rectangle's dimensions and position by the specified factors.
   * @example
   * ```ts
   * const rect = new Rectangle(50, 50, 100, 100);
   *
   * // Scale uniformly
   * rect.scale(0.5, 0.5);
   * // rect is now: x=25, y=25, width=50, height=50
   *
   * // non-uniformly
   * rect.scale(0.5, 1);
   * // rect is now: x=25, y=50, width=50, height=100
   * ```
   * @param x - The factor by which to scale the horizontal properties (x, width).
   * @param y - The factor by which to scale the vertical properties (y, height).
   * @returns Returns itself
   */
  scale(t, e = t) {
    return this.x *= t, this.y *= e, this.width *= t, this.height *= e, this;
  }
  /**
   * Enlarges this rectangle to include the passed rectangle.
   * @example
   * ```ts
   * // Basic enlargement
   * const rect = new Rectangle(50, 50, 100, 100);
   * const other = new Rectangle(0, 0, 200, 75);
   * rect.enlarge(other);
   * // rect is now: x=0, y=0, width=200, height=150
   *
   * // Use for bounding box calculation
   * const bounds = new Rectangle();
   * objects.forEach((obj) => {
   *     bounds.enlarge(obj.getBounds());
   * });
   * ```
   * @param rectangle - The rectangle to include
   * @returns Returns itself
   * @see {@link Rectangle.fit} For shrinking to fit within another rectangle
   * @see {@link Rectangle.pad} For adding padding around the rectangle
   */
  enlarge(t) {
    const e = Math.min(this.x, t.x), s = Math.max(this.x + this.width, t.x + t.width), i = Math.min(this.y, t.y), n = Math.max(this.y + this.height, t.y + t.height);
    return this.x = e, this.width = s - e, this.y = i, this.height = n - i, this;
  }
  /**
   * Returns the framing rectangle of the rectangle as a Rectangle object
   * @example
   * ```ts
   * // Basic bounds retrieval
   * const rect = new Rectangle(100, 100, 200, 150);
   * const bounds = rect.getBounds();
   *
   * // Reuse existing rectangle
   * const out = new Rectangle();
   * rect.getBounds(out);
   * ```
   * @param out - Optional rectangle to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle.copyFrom} For direct copying
   * @see {@link Rectangle.clone} For creating new copy
   */
  getBounds(t) {
    return t || (t = new j()), t.copyFrom(this), t;
  }
  /**
   * Determines whether another Rectangle is fully contained within this Rectangle.
   *
   * Rectangles that occupy the same space are considered to be containing each other.
   *
   * Rectangles without area (width or height equal to zero) can't contain anything,
   * not even other arealess rectangles.
   * @example
   * ```ts
   * // Check if one rectangle contains another
   * const container = new Rectangle(0, 0, 100, 100);
   * const inner = new Rectangle(25, 25, 50, 50);
   *
   * console.log(container.containsRect(inner)); // true
   *
   * // Check overlapping rectangles
   * const partial = new Rectangle(75, 75, 50, 50);
   * console.log(container.containsRect(partial)); // false
   *
   * // Zero-area rectangles
   * const empty = new Rectangle(0, 0, 0, 100);
   * console.log(container.containsRect(empty)); // false
   * ```
   * @param other - The Rectangle to check for containment
   * @returns True if other is fully contained within this Rectangle
   * @see {@link Rectangle.contains} For point containment
   * @see {@link Rectangle.intersects} For overlap testing
   */
  containsRect(t) {
    if (this.width <= 0 || this.height <= 0)
      return !1;
    const e = t.x, s = t.y, i = t.x + t.width, n = t.y + t.height;
    return e >= this.x && e < this.x + this.width && s >= this.y && s < this.y + this.height && i >= this.x && i < this.x + this.width && n >= this.y && n < this.y + this.height;
  }
  /**
   * Sets the position and dimensions of the rectangle.
   * @example
   * ```ts
   * // Basic usage
   * const rect = new Rectangle();
   * rect.set(100, 100, 200, 150);
   *
   * // Chain with other operations
   * const bounds = new Rectangle()
   *     .set(0, 0, 100, 100)
   *     .pad(10);
   * ```
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of the rectangle
   * @param height - The overall height of the rectangle
   * @returns Returns itself for method chaining
   * @see {@link Rectangle.copyFrom} For copying from another rectangle
   * @see {@link Rectangle.clone} For creating a new copy
   */
  set(t, e, s, i) {
    return this.x = t, this.y = e, this.width = s, this.height = i, this;
  }
  toString() {
    return `[pixi.js/math:Rectangle x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
  }
}
const ds = {
  default: -1
};
function U(r = "default") {
  return ds[r] === void 0 && (ds[r] = -1), ++ds[r];
}
const fi = /* @__PURE__ */ new Set(), W = "8.0.0", eo = "8.3.4", qt = {
  quiet: !1,
  noColor: !1
}, B = (r, t, e = 3) => {
  if (qt.quiet || fi.has(t))
    return;
  let s = new Error().stack;
  const i = `${t}
Deprecated since v${r}`, n = typeof console.groupCollapsed == "function" && !qt.noColor;
  typeof s > "u" ? console.warn("PixiJS Deprecation Warning: ", i) : (s = s.split(`
`).splice(e).join(`
`), n ? (console.groupCollapsed(
    "%cPixiJS Deprecation Warning: %c%s",
    "color:#614108;background:#fffbe6",
    "font-weight:normal;color:#614108;background:#fffbe6",
    i
  ), console.warn(s), console.groupEnd()) : (console.warn("PixiJS Deprecation Warning: ", i), console.warn(s))), fi.add(t);
};
Object.defineProperties(B, {
  quiet: {
    get: () => qt.quiet,
    set: (r) => {
      qt.quiet = r;
    },
    enumerable: !0,
    configurable: !1
  },
  noColor: {
    get: () => qt.noColor,
    set: (r) => {
      qt.noColor = r;
    },
    enumerable: !0,
    configurable: !1
  }
});
const Mr = () => {
};
function Zt(r) {
  return r += r === 0 ? 1 : 0, --r, r |= r >>> 1, r |= r >>> 2, r |= r >>> 4, r |= r >>> 8, r |= r >>> 16, r + 1;
}
function pi(r) {
  return !(r & r - 1) && !!r;
}
function Pr(r) {
  const t = {};
  for (const e in r)
    r[e] !== void 0 && (t[e] = r[e]);
  return t;
}
const gi = /* @__PURE__ */ Object.create(null);
function so(r) {
  const t = gi[r];
  return t === void 0 && (gi[r] = U("resource")), t;
}
const kr = class Tr extends xt {
  /**
   * @param options - options for the style
   */
  constructor(t = {}) {
    super(), this._resourceType = "textureSampler", this._touched = 0, this._maxAnisotropy = 1, this.destroyed = !1, t = { ...Tr.defaultOptions, ...t }, this.addressMode = t.addressMode, this.addressModeU = t.addressModeU ?? this.addressModeU, this.addressModeV = t.addressModeV ?? this.addressModeV, this.addressModeW = t.addressModeW ?? this.addressModeW, this.scaleMode = t.scaleMode, this.magFilter = t.magFilter ?? this.magFilter, this.minFilter = t.minFilter ?? this.minFilter, this.mipmapFilter = t.mipmapFilter ?? this.mipmapFilter, this.lodMinClamp = t.lodMinClamp, this.lodMaxClamp = t.lodMaxClamp, this.compare = t.compare, this.maxAnisotropy = t.maxAnisotropy ?? 1;
  }
  set addressMode(t) {
    this.addressModeU = t, this.addressModeV = t, this.addressModeW = t;
  }
  /** setting this will set wrapModeU,wrapModeV and wrapModeW all at once! */
  get addressMode() {
    return this.addressModeU;
  }
  set wrapMode(t) {
    B(W, "TextureStyle.wrapMode is now TextureStyle.addressMode"), this.addressMode = t;
  }
  get wrapMode() {
    return this.addressMode;
  }
  set scaleMode(t) {
    this.magFilter = t, this.minFilter = t, this.mipmapFilter = t;
  }
  /** setting this will set magFilter,minFilter and mipmapFilter all at once!  */
  get scaleMode() {
    return this.magFilter;
  }
  /** Specifies the maximum anisotropy value clamp used by the sampler. */
  set maxAnisotropy(t) {
    this._maxAnisotropy = Math.min(t, 16), this._maxAnisotropy > 1 && (this.scaleMode = "linear");
  }
  get maxAnisotropy() {
    return this._maxAnisotropy;
  }
  // TODO - move this to WebGL?
  get _resourceId() {
    return this._sharedResourceId || this._generateResourceId();
  }
  update() {
    this._sharedResourceId = null, this.emit("change", this);
  }
  _generateResourceId() {
    const t = `${this.addressModeU}-${this.addressModeV}-${this.addressModeW}-${this.magFilter}-${this.minFilter}-${this.mipmapFilter}-${this.lodMinClamp}-${this.lodMaxClamp}-${this.compare}-${this._maxAnisotropy}`;
    return this._sharedResourceId = so(t), this._resourceId;
  }
  /** Destroys the style */
  destroy() {
    this.destroyed = !0, this.emit("destroy", this), this.emit("change", this), this.removeAllListeners();
  }
};
kr.defaultOptions = {
  addressMode: "clamp-to-edge",
  scaleMode: "linear"
};
let Ve = kr;
const Ar = class Ir extends xt {
  /**
   * @param options - options for creating a new TextureSource
   */
  constructor(t = {}) {
    super(), this.options = t, this._gpuData = /* @__PURE__ */ Object.create(null), this._gcLastUsed = -1, this.uid = U("textureSource"), this._resourceType = "textureSource", this._resourceId = U("resource"), this.uploadMethodId = "unknown", this._resolution = 1, this.pixelWidth = 1, this.pixelHeight = 1, this.width = 1, this.height = 1, this.sampleCount = 1, this.mipLevelCount = 1, this.autoGenerateMipmaps = !1, this.format = "rgba8unorm", this.dimension = "2d", this.antialias = !1, this._touched = 0, this._batchTick = -1, this._textureBindLocation = -1, t = { ...Ir.defaultOptions, ...t }, this.label = t.label ?? "", this.resource = t.resource, this.autoGarbageCollect = t.autoGarbageCollect, this._resolution = t.resolution, t.width ? this.pixelWidth = t.width * this._resolution : this.pixelWidth = this.resource ? this.resourceWidth ?? 1 : 1, t.height ? this.pixelHeight = t.height * this._resolution : this.pixelHeight = this.resource ? this.resourceHeight ?? 1 : 1, this.width = this.pixelWidth / this._resolution, this.height = this.pixelHeight / this._resolution, this.format = t.format, this.dimension = t.dimensions, this.mipLevelCount = t.mipLevelCount, this.autoGenerateMipmaps = t.autoGenerateMipmaps, this.sampleCount = t.sampleCount, this.antialias = t.antialias, this.alphaMode = t.alphaMode, this.style = new Ve(Pr(t)), this.destroyed = !1, this._refreshPOT();
  }
  /** returns itself */
  get source() {
    return this;
  }
  /** the style of the texture */
  get style() {
    return this._style;
  }
  set style(t) {
    this.style !== t && (this._style?.off("change", this._onStyleChange, this), this._style = t, this._style?.on("change", this._onStyleChange, this), this._onStyleChange());
  }
  /** Specifies the maximum anisotropy value clamp used by the sampler. */
  set maxAnisotropy(t) {
    this._style.maxAnisotropy = t;
  }
  get maxAnisotropy() {
    return this._style.maxAnisotropy;
  }
  /** setting this will set wrapModeU, wrapModeV and wrapModeW all at once! */
  get addressMode() {
    return this._style.addressMode;
  }
  set addressMode(t) {
    this._style.addressMode = t;
  }
  /** setting this will set wrapModeU, wrapModeV and wrapModeW all at once! */
  get repeatMode() {
    return this._style.addressMode;
  }
  set repeatMode(t) {
    this._style.addressMode = t;
  }
  /** Specifies the sampling behavior when the sample footprint is smaller than or equal to one texel. */
  get magFilter() {
    return this._style.magFilter;
  }
  set magFilter(t) {
    this._style.magFilter = t;
  }
  /** Specifies the sampling behavior when the sample footprint is larger than one texel. */
  get minFilter() {
    return this._style.minFilter;
  }
  set minFilter(t) {
    this._style.minFilter = t;
  }
  /** Specifies behavior for sampling between mipmap levels. */
  get mipmapFilter() {
    return this._style.mipmapFilter;
  }
  set mipmapFilter(t) {
    this._style.mipmapFilter = t;
  }
  /** Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture. */
  get lodMinClamp() {
    return this._style.lodMinClamp;
  }
  set lodMinClamp(t) {
    this._style.lodMinClamp = t;
  }
  /** Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture. */
  get lodMaxClamp() {
    return this._style.lodMaxClamp;
  }
  set lodMaxClamp(t) {
    this._style.lodMaxClamp = t;
  }
  _onStyleChange() {
    this.emit("styleChange", this);
  }
  /** call this if you have modified the texture outside of the constructor */
  update() {
    if (this.resource) {
      const t = this._resolution;
      if (this.resize(this.resourceWidth / t, this.resourceHeight / t))
        return;
    }
    this.emit("update", this);
  }
  /** Destroys this texture source */
  destroy() {
    this.destroyed = !0, this.unload(), this.emit("destroy", this), this._style && (this._style.destroy(), this._style = null), this.uploadMethodId = null, this.resource = null, this.removeAllListeners();
  }
  /**
   * This will unload the Texture source from the GPU. This will free up the GPU memory
   * As soon as it is required fore rendering, it will be re-uploaded.
   */
  unload() {
    this._resourceId = U("resource"), this.emit("change", this), this.emit("unload", this);
    for (const t in this._gpuData)
      this._gpuData[t]?.destroy?.();
    this._gpuData = /* @__PURE__ */ Object.create(null);
  }
  /** the width of the resource. This is the REAL pure number, not accounting resolution   */
  get resourceWidth() {
    const { resource: t } = this;
    return t.naturalWidth || t.videoWidth || t.displayWidth || t.width;
  }
  /** the height of the resource. This is the REAL pure number, not accounting resolution */
  get resourceHeight() {
    const { resource: t } = this;
    return t.naturalHeight || t.videoHeight || t.displayHeight || t.height;
  }
  /**
   * the resolution of the texture. Changing this number, will not change the number of pixels in the actual texture
   * but will the size of the texture when rendered.
   *
   * changing the resolution of this texture to 2 for example will make it appear twice as small when rendered (as pixel
   * density will have increased)
   */
  get resolution() {
    return this._resolution;
  }
  set resolution(t) {
    this._resolution !== t && (this._resolution = t, this.width = this.pixelWidth / t, this.height = this.pixelHeight / t);
  }
  /**
   * Resize the texture, this is handy if you want to use the texture as a render texture
   * @param width - the new width of the texture
   * @param height - the new height of the texture
   * @param resolution - the new resolution of the texture
   * @returns - if the texture was resized
   */
  resize(t, e, s) {
    s || (s = this._resolution), t || (t = this.width), e || (e = this.height);
    const i = Math.round(t * s), n = Math.round(e * s);
    return this.width = i / s, this.height = n / s, this._resolution = s, this.pixelWidth === i && this.pixelHeight === n ? !1 : (this._refreshPOT(), this.pixelWidth = i, this.pixelHeight = n, this.emit("resize", this), this._resourceId = U("resource"), this.emit("change", this), !0);
  }
  /**
   * Lets the renderer know that this texture has been updated and its mipmaps should be re-generated.
   * This is only important for RenderTexture instances, as standard Texture instances will have their
   * mipmaps generated on upload. You should call this method after you make any change to the texture
   *
   * The reason for this is is can be quite expensive to update mipmaps for a texture. So by default,
   * We want you, the developer to specify when this action should happen.
   *
   * Generally you don't want to have mipmaps generated on Render targets that are changed every frame,
   */
  updateMipmaps() {
    this.autoGenerateMipmaps && this.mipLevelCount > 1 && this.emit("updateMipmaps", this);
  }
  set wrapMode(t) {
    this._style.wrapMode = t;
  }
  get wrapMode() {
    return this._style.wrapMode;
  }
  set scaleMode(t) {
    this._style.scaleMode = t;
  }
  /** setting this will set magFilter,minFilter and mipmapFilter all at once!  */
  get scaleMode() {
    return this._style.scaleMode;
  }
  /**
   * Refresh check for isPowerOfTwo texture based on size
   * @private
   */
  _refreshPOT() {
    this.isPowerOfTwo = pi(this.pixelWidth) && pi(this.pixelHeight);
  }
  static test(t) {
    throw new Error("Unimplemented");
  }
};
Ar.defaultOptions = {
  resolution: 1,
  format: "bgra8unorm",
  alphaMode: "premultiply-alpha-on-upload",
  dimensions: "2d",
  mipLevelCount: 1,
  autoGenerateMipmaps: !1,
  sampleCount: 1,
  antialias: !1,
  autoGarbageCollect: !1
};
let lt = Ar;
class Ks extends lt {
  constructor(t) {
    const e = t.resource || new Float32Array(t.width * t.height * 4);
    let s = t.format;
    s || (e instanceof Float32Array ? s = "rgba32float" : e instanceof Int32Array || e instanceof Uint32Array ? s = "rgba32uint" : e instanceof Int16Array || e instanceof Uint16Array ? s = "rgba16uint" : (e instanceof Int8Array, s = "bgra8unorm")), super({
      ...t,
      resource: e,
      format: s
    }), this.uploadMethodId = "buffer";
  }
  static test(t) {
    return t instanceof Int8Array || t instanceof Uint8Array || t instanceof Uint8ClampedArray || t instanceof Int16Array || t instanceof Uint16Array || t instanceof Int32Array || t instanceof Uint32Array || t instanceof Float32Array;
  }
}
Ks.extension = z.TextureSource;
const mi = new F();
class io {
  /**
   * @param texture - observed texture
   * @param clampMargin - Changes frame clamping, 0.5 by default. Use -0.5 for extra border.
   */
  constructor(t, e) {
    this.mapCoord = new F(), this.uClampFrame = new Float32Array(4), this.uClampOffset = new Float32Array(2), this._textureID = -1, this._updateID = 0, this.clampOffset = 0, typeof e > "u" ? this.clampMargin = t.width < 10 ? 0 : 0.5 : this.clampMargin = e, this.isSimple = !1, this.texture = t;
  }
  /** Texture property. */
  get texture() {
    return this._texture;
  }
  set texture(t) {
    this.texture !== t && (this._texture?.removeListener("update", this.update, this), this._texture = t, this._texture.addListener("update", this.update, this), this.update());
  }
  /**
   * Multiplies uvs array to transform
   * @param uvs - mesh uvs
   * @param [out=uvs] - output
   * @returns - output
   */
  multiplyUvs(t, e) {
    e === void 0 && (e = t);
    const s = this.mapCoord;
    for (let i = 0; i < t.length; i += 2) {
      const n = t[i], o = t[i + 1];
      e[i] = n * s.a + o * s.c + s.tx, e[i + 1] = n * s.b + o * s.d + s.ty;
    }
    return e;
  }
  /**
   * Updates matrices if texture was changed
   * @returns - whether or not it was updated
   */
  update() {
    const t = this._texture;
    this._updateID++;
    const e = t.uvs;
    this.mapCoord.set(e.x1 - e.x0, e.y1 - e.y0, e.x3 - e.x0, e.y3 - e.y0, e.x0, e.y0);
    const s = t.orig, i = t.trim;
    i && (mi.set(
      s.width / i.width,
      0,
      0,
      s.height / i.height,
      -i.x / i.width,
      -i.y / i.height
    ), this.mapCoord.append(mi));
    const n = t.source, o = this.uClampFrame, a = this.clampMargin / n._resolution, h = this.clampOffset / n._resolution;
    return o[0] = (t.frame.x + a + h) / n.width, o[1] = (t.frame.y + a + h) / n.height, o[2] = (t.frame.x + t.frame.width - a + h) / n.width, o[3] = (t.frame.y + t.frame.height - a + h) / n.height, this.uClampOffset[0] = this.clampOffset / n.pixelWidth, this.uClampOffset[1] = this.clampOffset / n.pixelHeight, this.isSimple = t.frame.width === n.width && t.frame.height === n.height && t.rotate === 0, !0;
  }
}
class D extends xt {
  /**
   * @param {TextureOptions} options - Options for the texture
   */
  constructor({
    source: t,
    label: e,
    frame: s,
    orig: i,
    trim: n,
    defaultAnchor: o,
    defaultBorders: a,
    rotate: h,
    dynamic: l
  } = {}) {
    if (super(), this.uid = U("texture"), this.uvs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 }, this.frame = new j(), this.noFrame = !1, this.dynamic = !1, this.isTexture = !0, this.label = e, this.source = t?.source ?? new lt(), this.noFrame = !s, s)
      this.frame.copyFrom(s);
    else {
      const { width: c, height: d } = this._source;
      this.frame.width = c, this.frame.height = d;
    }
    this.orig = i || this.frame, this.trim = n, this.rotate = h ?? 0, this.defaultAnchor = o, this.defaultBorders = a, this.destroyed = !1, this.dynamic = l || !1, this.updateUvs();
  }
  set source(t) {
    this._source && this._source.off("resize", this.update, this), this._source = t, t.on("resize", this.update, this), this.emit("update", this);
  }
  /** the underlying source of the texture (equivalent of baseTexture in v7) */
  get source() {
    return this._source;
  }
  /** returns a TextureMatrix instance for this texture. By default, that object is not created because its heavy. */
  get textureMatrix() {
    return this._textureMatrix || (this._textureMatrix = new io(this)), this._textureMatrix;
  }
  /** The width of the Texture in pixels. */
  get width() {
    return this.orig.width;
  }
  /** The height of the Texture in pixels. */
  get height() {
    return this.orig.height;
  }
  /** Call this function when you have modified the frame of this texture. */
  updateUvs() {
    const { uvs: t, frame: e } = this, { width: s, height: i } = this._source, n = e.x / s, o = e.y / i, a = e.width / s, h = e.height / i;
    let l = this.rotate;
    if (l) {
      const c = a / 2, d = h / 2, f = n + c, u = o + d;
      l = Y.add(l, Y.NW), t.x0 = f + c * Y.uX(l), t.y0 = u + d * Y.uY(l), l = Y.add(l, 2), t.x1 = f + c * Y.uX(l), t.y1 = u + d * Y.uY(l), l = Y.add(l, 2), t.x2 = f + c * Y.uX(l), t.y2 = u + d * Y.uY(l), l = Y.add(l, 2), t.x3 = f + c * Y.uX(l), t.y3 = u + d * Y.uY(l);
    } else
      t.x0 = n, t.y0 = o, t.x1 = n + a, t.y1 = o, t.x2 = n + a, t.y2 = o + h, t.x3 = n, t.y3 = o + h;
  }
  /**
   * Destroys this texture
   * @param destroySource - Destroy the source when the texture is destroyed.
   */
  destroy(t = !1) {
    this._source && (this._source.off("resize", this.update, this), t && (this._source.destroy(), this._source = null)), this._textureMatrix = null, this.destroyed = !0, this.emit("destroy", this), this.removeAllListeners();
  }
  /**
   * Call this if you have modified the `texture outside` of the constructor.
   *
   * If you have modified this texture's source, you must separately call `texture.source.update()` to see those changes.
   */
  update() {
    this.noFrame && (this.frame.width = this._source.width, this.frame.height = this._source.height), this.updateUvs(), this.emit("update", this);
  }
  /** @deprecated since 8.0.0 */
  get baseTexture() {
    return B(W, "Texture.baseTexture is now Texture.source"), this._source;
  }
}
D.EMPTY = new D({
  label: "EMPTY",
  source: new lt({
    label: "EMPTY"
  })
});
D.EMPTY.destroy = Mr;
D.WHITE = new D({
  source: new Ks({
    resource: new Uint8Array([255, 255, 255, 255]),
    width: 1,
    height: 1,
    alphaMode: "premultiply-alpha-on-upload",
    label: "WHITE"
  }),
  label: "WHITE"
});
D.WHITE.destroy = Mr;
function ro(r, t, e) {
  const { width: s, height: i } = e.orig, n = e.trim;
  if (n) {
    const o = n.width, a = n.height;
    r.minX = n.x - t._x * s, r.maxX = r.minX + o, r.minY = n.y - t._y * i, r.maxY = r.minY + a;
  } else
    r.minX = -t._x * s, r.maxX = r.minX + s, r.minY = -t._y * i, r.maxY = r.minY + i;
}
const yi = new F();
class ut {
  /**
   * Creates a new Bounds object.
   * @param minX - The minimum X coordinate of the bounds.
   * @param minY - The minimum Y coordinate of the bounds.
   * @param maxX - The maximum X coordinate of the bounds.
   * @param maxY - The maximum Y coordinate of the bounds.
   */
  constructor(t = 1 / 0, e = 1 / 0, s = -1 / 0, i = -1 / 0) {
    this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.matrix = yi, this.minX = t, this.minY = e, this.maxX = s, this.maxY = i;
  }
  /**
   * Checks if bounds are empty, meaning either width or height is zero or negative.
   * Empty bounds occur when min values exceed max values on either axis.
   * @example
   * ```ts
   * const bounds = new Bounds();
   *
   * // Check if newly created bounds are empty
   * console.log(bounds.isEmpty()); // true, default bounds are empty
   *
   * // Add frame and check again
   * bounds.addFrame(0, 0, 100, 100);
   * console.log(bounds.isEmpty()); // false, bounds now have area
   *
   * // Clear bounds
   * bounds.clear();
   * console.log(bounds.isEmpty()); // true, bounds are empty again
   * ```
   * @returns True if bounds are empty (have no area)
   * @see {@link Bounds#clear} For resetting bounds
   * @see {@link Bounds#isValid} For checking validity
   */
  isEmpty() {
    return this.minX > this.maxX || this.minY > this.maxY;
  }
  /**
   * The bounding rectangle representation of these bounds.
   * Lazily creates and updates a Rectangle instance based on the current bounds.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Get rectangle representation
   * const rect = bounds.rectangle;
   * console.log(rect.x, rect.y, rect.width, rect.height);
   *
   * // Use for hit testing
   * if (bounds.rectangle.contains(mouseX, mouseY)) {
   *     console.log('Mouse is inside bounds!');
   * }
   * ```
   * @see {@link Rectangle} For rectangle methods
   * @see {@link Bounds.isEmpty} For bounds validation
   */
  get rectangle() {
    this._rectangle || (this._rectangle = new j());
    const t = this._rectangle;
    return this.minX > this.maxX || this.minY > this.maxY ? (t.x = 0, t.y = 0, t.width = 0, t.height = 0) : t.copyFromBounds(this), t;
  }
  /**
   * Clears the bounds and resets all coordinates to their default values.
   * Resets the transformation matrix back to identity.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * console.log(bounds.isEmpty()); // false
   * // Clear the bounds
   * bounds.clear();
   * console.log(bounds.isEmpty()); // true
   * ```
   * @returns This bounds object for chaining
   */
  clear() {
    return this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.matrix = yi, this;
  }
  /**
   * Sets the bounds directly using coordinate values.
   * Provides a way to set all bounds values at once.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * bounds.set(0, 0, 100, 100);
   * ```
   * @param x0 - Left X coordinate of frame
   * @param y0 - Top Y coordinate of frame
   * @param x1 - Right X coordinate of frame
   * @param y1 - Bottom Y coordinate of frame
   * @see {@link Bounds#addFrame} For matrix-aware bounds setting
   * @see {@link Bounds#clear} For resetting bounds
   */
  set(t, e, s, i) {
    this.minX = t, this.minY = e, this.maxX = s, this.maxY = i;
  }
  /**
   * Adds a rectangular frame to the bounds, optionally transformed by a matrix.
   * Updates the bounds to encompass the new frame coordinates.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * bounds.addFrame(0, 0, 100, 100);
   *
   * // Add transformed frame
   * const matrix = new Matrix()
   *     .translate(50, 50)
   *     .rotate(Math.PI / 4);
   * bounds.addFrame(0, 0, 100, 100, matrix);
   * ```
   * @param x0 - Left X coordinate of frame
   * @param y0 - Top Y coordinate of frame
   * @param x1 - Right X coordinate of frame
   * @param y1 - Bottom Y coordinate of frame
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addRect} For adding Rectangle objects
   * @see {@link Bounds#addBounds} For adding other Bounds
   */
  addFrame(t, e, s, i, n) {
    n || (n = this.matrix);
    const o = n.a, a = n.b, h = n.c, l = n.d, c = n.tx, d = n.ty;
    let f = this.minX, u = this.minY, p = this.maxX, m = this.maxY, g = o * t + h * e + c, x = a * t + l * e + d;
    g < f && (f = g), x < u && (u = x), g > p && (p = g), x > m && (m = x), g = o * s + h * e + c, x = a * s + l * e + d, g < f && (f = g), x < u && (u = x), g > p && (p = g), x > m && (m = x), g = o * t + h * i + c, x = a * t + l * i + d, g < f && (f = g), x < u && (u = x), g > p && (p = g), x > m && (m = x), g = o * s + h * i + c, x = a * s + l * i + d, g < f && (f = g), x < u && (u = x), g > p && (p = g), x > m && (m = x), this.minX = f, this.minY = u, this.maxX = p, this.maxY = m;
  }
  /**
   * Adds a rectangle to the bounds, optionally transformed by a matrix.
   * Updates the bounds to encompass the given rectangle.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * // Add simple rectangle
   * const rect = new Rectangle(0, 0, 100, 100);
   * bounds.addRect(rect);
   *
   * // Add transformed rectangle
   * const matrix = new Matrix()
   *     .translate(50, 50)
   *     .rotate(Math.PI / 4);
   * bounds.addRect(rect, matrix);
   * ```
   * @param rect - The rectangle to be added
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addFrame} For adding raw coordinates
   * @see {@link Bounds#addBounds} For adding other bounds
   */
  addRect(t, e) {
    this.addFrame(t.x, t.y, t.x + t.width, t.y + t.height, e);
  }
  /**
   * Adds another bounds object to this one, optionally transformed by a matrix.
   * Expands the bounds to include the given bounds' area.
   * @example
   * ```ts
   * const bounds = new Bounds();
   *
   * // Add child bounds
   * const childBounds = sprite.getBounds();
   * bounds.addBounds(childBounds);
   *
   * // Add transformed bounds
   * const matrix = new Matrix()
   *     .scale(2, 2);
   * bounds.addBounds(childBounds, matrix);
   * ```
   * @param bounds - The bounds to be added
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addFrame} For adding raw coordinates
   * @see {@link Bounds#addRect} For adding rectangles
   */
  addBounds(t, e) {
    this.addFrame(t.minX, t.minY, t.maxX, t.maxY, e);
  }
  /**
   * Adds other Bounds as a mask, creating an intersection of the two bounds.
   * Only keeps the overlapping region between current bounds and mask bounds.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Create mask bounds
   * const mask = new Bounds();
   * mask.addFrame(50, 50, 150, 150);
   * // Apply mask - results in bounds of (50,50,100,100)
   * bounds.addBoundsMask(mask);
   * ```
   * @param mask - The Bounds to use as a mask
   * @see {@link Bounds#addBounds} For union operation
   * @see {@link Bounds#fit} For fitting to rectangle
   */
  addBoundsMask(t) {
    this.minX = this.minX > t.minX ? this.minX : t.minX, this.minY = this.minY > t.minY ? this.minY : t.minY, this.maxX = this.maxX < t.maxX ? this.maxX : t.maxX, this.maxY = this.maxY < t.maxY ? this.maxY : t.maxY;
  }
  /**
   * Applies a transformation matrix to the bounds, updating its coordinates.
   * Transforms all corners of the bounds using the given matrix.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Apply translation
   * const translateMatrix = new Matrix()
   *     .translate(50, 50);
   * bounds.applyMatrix(translateMatrix);
   * ```
   * @param matrix - The matrix to apply to the bounds
   * @see {@link Matrix} For matrix operations
   * @see {@link Bounds#addFrame} For adding transformed frames
   */
  applyMatrix(t) {
    const e = this.minX, s = this.minY, i = this.maxX, n = this.maxY, { a: o, b: a, c: h, d: l, tx: c, ty: d } = t;
    let f = o * e + h * s + c, u = a * e + l * s + d;
    this.minX = f, this.minY = u, this.maxX = f, this.maxY = u, f = o * i + h * s + c, u = a * i + l * s + d, this.minX = f < this.minX ? f : this.minX, this.minY = u < this.minY ? u : this.minY, this.maxX = f > this.maxX ? f : this.maxX, this.maxY = u > this.maxY ? u : this.maxY, f = o * e + h * n + c, u = a * e + l * n + d, this.minX = f < this.minX ? f : this.minX, this.minY = u < this.minY ? u : this.minY, this.maxX = f > this.maxX ? f : this.maxX, this.maxY = u > this.maxY ? u : this.maxY, f = o * i + h * n + c, u = a * i + l * n + d, this.minX = f < this.minX ? f : this.minX, this.minY = u < this.minY ? u : this.minY, this.maxX = f > this.maxX ? f : this.maxX, this.maxY = u > this.maxY ? u : this.maxY;
  }
  /**
   * Resizes the bounds object to fit within the given rectangle.
   * Clips the bounds if they extend beyond the rectangle's edges.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 200, 200);
   * // Fit within viewport
   * const viewport = new Rectangle(50, 50, 100, 100);
   * bounds.fit(viewport);
   * // bounds are now (50, 50, 150, 150)
   * ```
   * @param rect - The rectangle to fit within
   * @returns This bounds object for chaining
   * @see {@link Bounds#addBoundsMask} For intersection
   * @see {@link Bounds#pad} For expanding bounds
   */
  fit(t) {
    return this.minX < t.left && (this.minX = t.left), this.maxX > t.right && (this.maxX = t.right), this.minY < t.top && (this.minY = t.top), this.maxY > t.bottom && (this.maxY = t.bottom), this;
  }
  /**
   * Resizes the bounds object to include the given bounds.
   * Similar to fit() but works with raw coordinate values instead of a Rectangle.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 200, 200);
   * // Fit to specific coordinates
   * bounds.fitBounds(50, 150, 50, 150);
   * // bounds are now (50, 50, 150, 150)
   * ```
   * @param left - The left value of the bounds
   * @param right - The right value of the bounds
   * @param top - The top value of the bounds
   * @param bottom - The bottom value of the bounds
   * @returns This bounds object for chaining
   * @see {@link Bounds#fit} For fitting to Rectangle
   * @see {@link Bounds#addBoundsMask} For intersection
   */
  fitBounds(t, e, s, i) {
    return this.minX < t && (this.minX = t), this.maxX > e && (this.maxX = e), this.minY < s && (this.minY = s), this.maxY > i && (this.maxY = i), this;
  }
  /**
   * Pads bounds object, making it grow in all directions.
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Add equal padding
   * bounds.pad(10);
   * // bounds are now (-10, -10, 110, 110)
   *
   * // Add different padding for x and y
   * bounds.pad(20, 10);
   * // bounds are now (-30, -20, 130, 120)
   * ```
   * @param paddingX - The horizontal padding amount
   * @param paddingY - The vertical padding amount
   * @returns This bounds object for chaining
   * @see {@link Bounds#fit} For constraining bounds
   * @see {@link Bounds#scale} For uniform scaling
   */
  pad(t, e = t) {
    return this.minX -= t, this.maxX += t, this.minY -= e, this.maxY += e, this;
  }
  /**
   * Ceils the bounds by rounding up max values and rounding down min values.
   * Useful for pixel-perfect calculations and avoiding fractional pixels.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * bounds.set(10.2, 10.9, 50.1, 50.8);
   *
   * // Round to whole pixels
   * bounds.ceil();
   * // bounds are now (10, 10, 51, 51)
   * ```
   * @returns This bounds object for chaining
   * @see {@link Bounds#scale} For size adjustments
   * @see {@link Bounds#fit} For constraining bounds
   */
  ceil() {
    return this.minX = Math.floor(this.minX), this.minY = Math.floor(this.minY), this.maxX = Math.ceil(this.maxX), this.maxY = Math.ceil(this.maxY), this;
  }
  /**
   * Creates a new Bounds instance with the same values.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Create a copy
   * const copy = bounds.clone();
   *
   * // Original and copy are independent
   * bounds.pad(10);
   * console.log(copy.width === bounds.width); // false
   * ```
   * @returns A new Bounds instance with the same values
   * @see {@link Bounds#copyFrom} For reusing existing bounds
   */
  clone() {
    return new ut(this.minX, this.minY, this.maxX, this.maxY);
  }
  /**
   * Scales the bounds by the given values, adjusting all edges proportionally.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Scale uniformly
   * bounds.scale(2);
   * // bounds are now (0, 0, 200, 200)
   *
   * // Scale non-uniformly
   * bounds.scale(0.5, 2);
   * // bounds are now (0, 0, 100, 400)
   * ```
   * @param x - The X value to scale by
   * @param y - The Y value to scale by (defaults to x)
   * @returns This bounds object for chaining
   * @see {@link Bounds#pad} For adding padding
   * @see {@link Bounds#fit} For constraining size
   */
  scale(t, e = t) {
    return this.minX *= t, this.minY *= e, this.maxX *= t, this.maxY *= e, this;
  }
  /**
   * The x position of the bounds in local space.
   * Setting this value will move the bounds while maintaining its width.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get x position
   * console.log(bounds.x); // 0
   *
   * // Move bounds horizontally
   * bounds.x = 50;
   * console.log(bounds.minX, bounds.maxX); // 50, 150
   *
   * // Width stays the same
   * console.log(bounds.width); // Still 100
   * ```
   */
  get x() {
    return this.minX;
  }
  set x(t) {
    const e = this.maxX - this.minX;
    this.minX = t, this.maxX = t + e;
  }
  /**
   * The y position of the bounds in local space.
   * Setting this value will move the bounds while maintaining its height.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get y position
   * console.log(bounds.y); // 0
   *
   * // Move bounds vertically
   * bounds.y = 50;
   * console.log(bounds.minY, bounds.maxY); // 50, 150
   *
   * // Height stays the same
   * console.log(bounds.height); // Still 100
   * ```
   */
  get y() {
    return this.minY;
  }
  set y(t) {
    const e = this.maxY - this.minY;
    this.minY = t, this.maxY = t + e;
  }
  /**
   * The width value of the bounds.
   * Represents the distance between minX and maxX coordinates.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get width
   * console.log(bounds.width); // 100
   * // Resize width
   * bounds.width = 200;
   * console.log(bounds.maxX - bounds.minX); // 200
   * ```
   */
  get width() {
    return this.maxX - this.minX;
  }
  set width(t) {
    this.maxX = this.minX + t;
  }
  /**
   * The height value of the bounds.
   * Represents the distance between minY and maxY coordinates.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get height
   * console.log(bounds.height); // 100
   * // Resize height
   * bounds.height = 150;
   * console.log(bounds.maxY - bounds.minY); // 150
   * ```
   */
  get height() {
    return this.maxY - this.minY;
  }
  set height(t) {
    this.maxY = this.minY + t;
  }
  /**
   * The left edge coordinate of the bounds.
   * Alias for minX.
   * @example
   * ```ts
   * const bounds = new Bounds(50, 0, 150, 100);
   * console.log(bounds.left); // 50
   * console.log(bounds.left === bounds.minX); // true
   * ```
   * @readonly
   */
  get left() {
    return this.minX;
  }
  /**
   * The right edge coordinate of the bounds.
   * Alias for maxX.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * console.log(bounds.right); // 100
   * console.log(bounds.right === bounds.maxX); // true
   * ```
   * @readonly
   */
  get right() {
    return this.maxX;
  }
  /**
   * The top edge coordinate of the bounds.
   * Alias for minY.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 25, 100, 125);
   * console.log(bounds.top); // 25
   * console.log(bounds.top === bounds.minY); // true
   * ```
   * @readonly
   */
  get top() {
    return this.minY;
  }
  /**
   * The bottom edge coordinate of the bounds.
   * Alias for maxY.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 200);
   * console.log(bounds.bottom); // 200
   * console.log(bounds.bottom === bounds.maxY); // true
   * ```
   * @readonly
   */
  get bottom() {
    return this.maxY;
  }
  /**
   * Whether the bounds has positive width and height.
   * Checks if both dimensions are greater than zero.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Check if bounds are positive
   * console.log(bounds.isPositive); // true
   *
   * // Negative bounds
   * bounds.maxX = bounds.minX;
   * console.log(bounds.isPositive); // false, width is 0
   * ```
   * @readonly
   * @see {@link Bounds#isEmpty} For checking empty state
   * @see {@link Bounds#isValid} For checking validity
   */
  get isPositive() {
    return this.maxX - this.minX > 0 && this.maxY - this.minY > 0;
  }
  /**
   * Whether the bounds has valid coordinates.
   * Checks if the bounds has been initialized with real values.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * console.log(bounds.isValid); // false, default state
   *
   * // Set valid bounds
   * bounds.addFrame(0, 0, 100, 100);
   * console.log(bounds.isValid); // true
   * ```
   * @readonly
   * @see {@link Bounds#isEmpty} For checking empty state
   * @see {@link Bounds#isPositive} For checking dimensions
   */
  get isValid() {
    return this.minX + this.minY !== 1 / 0;
  }
  /**
   * Adds vertices from a Float32Array to the bounds, optionally transformed by a matrix.
   * Used for efficiently updating bounds from raw vertex data.
   * @example
   * ```ts
   * const bounds = new Bounds();
   *
   * // Add vertices from geometry
   * const vertices = new Float32Array([
   *     0, 0,    // Vertex 1
   *     100, 0,  // Vertex 2
   *     100, 100 // Vertex 3
   * ]);
   * bounds.addVertexData(vertices, 0, 6);
   *
   * // Add transformed vertices
   * const matrix = new Matrix()
   *     .translate(50, 50)
   *     .rotate(Math.PI / 4);
   * bounds.addVertexData(vertices, 0, 6, matrix);
   *
   * // Add subset of vertices
   * bounds.addVertexData(vertices, 2, 4); // Only second vertex
   * ```
   * @param vertexData - The array of vertices to add
   * @param beginOffset - Starting index in the vertex array
   * @param endOffset - Ending index in the vertex array (excluded)
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addFrame} For adding rectangular frames
   * @see {@link Matrix} For transformation details
   */
  addVertexData(t, e, s, i) {
    let n = this.minX, o = this.minY, a = this.maxX, h = this.maxY;
    i || (i = this.matrix);
    const l = i.a, c = i.b, d = i.c, f = i.d, u = i.tx, p = i.ty;
    for (let m = e; m < s; m += 2) {
      const g = t[m], x = t[m + 1], y = l * g + d * x + u, b = c * g + f * x + p;
      n = y < n ? y : n, o = b < o ? b : o, a = y > a ? y : a, h = b > h ? b : h;
    }
    this.minX = n, this.minY = o, this.maxX = a, this.maxY = h;
  }
  /**
   * Checks if a point is contained within the bounds.
   * Returns true if the point's coordinates fall within the bounds' area.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Basic point check
   * console.log(bounds.containsPoint(50, 50)); // true
   * console.log(bounds.containsPoint(150, 150)); // false
   *
   * // Check edges
   * console.log(bounds.containsPoint(0, 0));   // true, includes edges
   * console.log(bounds.containsPoint(100, 100)); // true, includes edges
   * ```
   * @param x - x coordinate to check
   * @param y - y coordinate to check
   * @returns True if the point is inside the bounds
   * @see {@link Bounds#isPositive} For valid bounds check
   * @see {@link Bounds#rectangle} For Rectangle representation
   */
  containsPoint(t, e) {
    return this.minX <= t && this.minY <= e && this.maxX >= t && this.maxY >= e;
  }
  /**
   * Returns a string representation of the bounds.
   * Useful for debugging and logging bounds information.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * console.log(bounds.toString()); // "[pixi.js:Bounds minX=0 minY=0 maxX=100 maxY=100 width=100 height=100]"
   * ```
   * @returns A string describing the bounds
   * @see {@link Bounds#copyFrom} For copying bounds
   * @see {@link Bounds#clone} For creating a new instance
   */
  toString() {
    return `[pixi.js:Bounds minX=${this.minX} minY=${this.minY} maxX=${this.maxX} maxY=${this.maxY} width=${this.width} height=${this.height}]`;
  }
  /**
   * Copies the bounds from another bounds object.
   * Useful for reusing bounds objects and avoiding allocations.
   * @example
   * ```ts
   * const sourceBounds = new Bounds(0, 0, 100, 100);
   * // Copy bounds
   * const targetBounds = new Bounds();
   * targetBounds.copyFrom(sourceBounds);
   * ```
   * @param bounds - The bounds to copy from
   * @returns This bounds object for chaining
   * @see {@link Bounds#clone} For creating new instances
   */
  copyFrom(t) {
    return this.minX = t.minX, this.minY = t.minY, this.maxX = t.maxX, this.maxY = t.maxY, this;
  }
}
var no = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) }, bt = function(r) {
  return typeof r == "string" ? r.length > 0 : typeof r == "number";
}, K = function(r, t, e) {
  return t === void 0 && (t = 0), e === void 0 && (e = Math.pow(10, t)), Math.round(e * r) / e + 0;
}, ot = function(r, t, e) {
  return t === void 0 && (t = 0), e === void 0 && (e = 1), r > e ? e : r > t ? r : t;
}, Er = function(r) {
  return (r = isFinite(r) ? r % 360 : 0) > 0 ? r : r + 360;
}, xi = function(r) {
  return { r: ot(r.r, 0, 255), g: ot(r.g, 0, 255), b: ot(r.b, 0, 255), a: ot(r.a) };
}, us = function(r) {
  return { r: K(r.r), g: K(r.g), b: K(r.b), a: K(r.a, 3) };
}, oo = /^#([0-9a-f]{3,8})$/i, Re = function(r) {
  var t = r.toString(16);
  return t.length < 2 ? "0" + t : t;
}, Rr = function(r) {
  var t = r.r, e = r.g, s = r.b, i = r.a, n = Math.max(t, e, s), o = n - Math.min(t, e, s), a = o ? n === t ? (e - s) / o : n === e ? 2 + (s - t) / o : 4 + (t - e) / o : 0;
  return { h: 60 * (a < 0 ? a + 6 : a), s: n ? o / n * 100 : 0, v: n / 255 * 100, a: i };
}, Lr = function(r) {
  var t = r.h, e = r.s, s = r.v, i = r.a;
  t = t / 360 * 6, e /= 100, s /= 100;
  var n = Math.floor(t), o = s * (1 - e), a = s * (1 - (t - n) * e), h = s * (1 - (1 - t + n) * e), l = n % 6;
  return { r: 255 * [s, a, o, o, h, s][l], g: 255 * [h, s, s, a, o, o][l], b: 255 * [o, o, h, s, s, a][l], a: i };
}, bi = function(r) {
  return { h: Er(r.h), s: ot(r.s, 0, 100), l: ot(r.l, 0, 100), a: ot(r.a) };
}, wi = function(r) {
  return { h: K(r.h), s: K(r.s), l: K(r.l), a: K(r.a, 3) };
}, _i = function(r) {
  return Lr((e = (t = r).s, { h: t.h, s: (e *= ((s = t.l) < 50 ? s : 100 - s) / 100) > 0 ? 2 * e / (s + e) * 100 : 0, v: s + e, a: t.a }));
  var t, e, s;
}, fe = function(r) {
  return { h: (t = Rr(r)).h, s: (i = (200 - (e = t.s)) * (s = t.v) / 100) > 0 && i < 200 ? e * s / 100 / (i <= 100 ? i : 200 - i) * 100 : 0, l: i / 2, a: t.a };
  var t, e, s, i;
}, ao = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, ho = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, lo = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, co = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Fs = { string: [[function(r) {
  var t = oo.exec(r);
  return t ? (r = t[1]).length <= 4 ? { r: parseInt(r[0] + r[0], 16), g: parseInt(r[1] + r[1], 16), b: parseInt(r[2] + r[2], 16), a: r.length === 4 ? K(parseInt(r[3] + r[3], 16) / 255, 2) : 1 } : r.length === 6 || r.length === 8 ? { r: parseInt(r.substr(0, 2), 16), g: parseInt(r.substr(2, 2), 16), b: parseInt(r.substr(4, 2), 16), a: r.length === 8 ? K(parseInt(r.substr(6, 2), 16) / 255, 2) : 1 } : null : null;
}, "hex"], [function(r) {
  var t = lo.exec(r) || co.exec(r);
  return t ? t[2] !== t[4] || t[4] !== t[6] ? null : xi({ r: Number(t[1]) / (t[2] ? 100 / 255 : 1), g: Number(t[3]) / (t[4] ? 100 / 255 : 1), b: Number(t[5]) / (t[6] ? 100 / 255 : 1), a: t[7] === void 0 ? 1 : Number(t[7]) / (t[8] ? 100 : 1) }) : null;
}, "rgb"], [function(r) {
  var t = ao.exec(r) || ho.exec(r);
  if (!t) return null;
  var e, s, i = bi({ h: (e = t[1], s = t[2], s === void 0 && (s = "deg"), Number(e) * (no[s] || 1)), s: Number(t[3]), l: Number(t[4]), a: t[5] === void 0 ? 1 : Number(t[5]) / (t[6] ? 100 : 1) });
  return _i(i);
}, "hsl"]], object: [[function(r) {
  var t = r.r, e = r.g, s = r.b, i = r.a, n = i === void 0 ? 1 : i;
  return bt(t) && bt(e) && bt(s) ? xi({ r: Number(t), g: Number(e), b: Number(s), a: Number(n) }) : null;
}, "rgb"], [function(r) {
  var t = r.h, e = r.s, s = r.l, i = r.a, n = i === void 0 ? 1 : i;
  if (!bt(t) || !bt(e) || !bt(s)) return null;
  var o = bi({ h: Number(t), s: Number(e), l: Number(s), a: Number(n) });
  return _i(o);
}, "hsl"], [function(r) {
  var t = r.h, e = r.s, s = r.v, i = r.a, n = i === void 0 ? 1 : i;
  if (!bt(t) || !bt(e) || !bt(s)) return null;
  var o = (function(a) {
    return { h: Er(a.h), s: ot(a.s, 0, 100), v: ot(a.v, 0, 100), a: ot(a.a) };
  })({ h: Number(t), s: Number(e), v: Number(s), a: Number(n) });
  return Lr(o);
}, "hsv"]] }, vi = function(r, t) {
  for (var e = 0; e < t.length; e++) {
    var s = t[e][0](r);
    if (s) return [s, t[e][1]];
  }
  return [null, void 0];
}, uo = function(r) {
  return typeof r == "string" ? vi(r.trim(), Fs.string) : typeof r == "object" && r !== null ? vi(r, Fs.object) : [null, void 0];
}, fs = function(r, t) {
  var e = fe(r);
  return { h: e.h, s: ot(e.s + 100 * t, 0, 100), l: e.l, a: e.a };
}, ps = function(r) {
  return (299 * r.r + 587 * r.g + 114 * r.b) / 1e3 / 255;
}, Si = function(r, t) {
  var e = fe(r);
  return { h: e.h, s: e.s, l: ot(e.l + 100 * t, 0, 100), a: e.a };
}, Ns = (function() {
  function r(t) {
    this.parsed = uo(t)[0], this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
  }
  return r.prototype.isValid = function() {
    return this.parsed !== null;
  }, r.prototype.brightness = function() {
    return K(ps(this.rgba), 2);
  }, r.prototype.isDark = function() {
    return ps(this.rgba) < 0.5;
  }, r.prototype.isLight = function() {
    return ps(this.rgba) >= 0.5;
  }, r.prototype.toHex = function() {
    return t = us(this.rgba), e = t.r, s = t.g, i = t.b, o = (n = t.a) < 1 ? Re(K(255 * n)) : "", "#" + Re(e) + Re(s) + Re(i) + o;
    var t, e, s, i, n, o;
  }, r.prototype.toRgb = function() {
    return us(this.rgba);
  }, r.prototype.toRgbString = function() {
    return t = us(this.rgba), e = t.r, s = t.g, i = t.b, (n = t.a) < 1 ? "rgba(" + e + ", " + s + ", " + i + ", " + n + ")" : "rgb(" + e + ", " + s + ", " + i + ")";
    var t, e, s, i, n;
  }, r.prototype.toHsl = function() {
    return wi(fe(this.rgba));
  }, r.prototype.toHslString = function() {
    return t = wi(fe(this.rgba)), e = t.h, s = t.s, i = t.l, (n = t.a) < 1 ? "hsla(" + e + ", " + s + "%, " + i + "%, " + n + ")" : "hsl(" + e + ", " + s + "%, " + i + "%)";
    var t, e, s, i, n;
  }, r.prototype.toHsv = function() {
    return t = Rr(this.rgba), { h: K(t.h), s: K(t.s), v: K(t.v), a: K(t.a, 3) };
    var t;
  }, r.prototype.invert = function() {
    return gt({ r: 255 - (t = this.rgba).r, g: 255 - t.g, b: 255 - t.b, a: t.a });
    var t;
  }, r.prototype.saturate = function(t) {
    return t === void 0 && (t = 0.1), gt(fs(this.rgba, t));
  }, r.prototype.desaturate = function(t) {
    return t === void 0 && (t = 0.1), gt(fs(this.rgba, -t));
  }, r.prototype.grayscale = function() {
    return gt(fs(this.rgba, -1));
  }, r.prototype.lighten = function(t) {
    return t === void 0 && (t = 0.1), gt(Si(this.rgba, t));
  }, r.prototype.darken = function(t) {
    return t === void 0 && (t = 0.1), gt(Si(this.rgba, -t));
  }, r.prototype.rotate = function(t) {
    return t === void 0 && (t = 15), this.hue(this.hue() + t);
  }, r.prototype.alpha = function(t) {
    return typeof t == "number" ? gt({ r: (e = this.rgba).r, g: e.g, b: e.b, a: t }) : K(this.rgba.a, 3);
    var e;
  }, r.prototype.hue = function(t) {
    var e = fe(this.rgba);
    return typeof t == "number" ? gt({ h: t, s: e.s, l: e.l, a: e.a }) : K(e.h);
  }, r.prototype.isEqual = function(t) {
    return this.toHex() === gt(t).toHex();
  }, r;
})(), gt = function(r) {
  return r instanceof Ns ? r : new Ns(r);
}, Ci = [], fo = function(r) {
  r.forEach(function(t) {
    Ci.indexOf(t) < 0 && (t(Ns, Fs), Ci.push(t));
  });
};
function po(r, t) {
  var e = { white: "#ffffff", bisque: "#ffe4c4", blue: "#0000ff", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", antiquewhite: "#faebd7", aqua: "#00ffff", azure: "#f0ffff", whitesmoke: "#f5f5f5", papayawhip: "#ffefd5", plum: "#dda0dd", blanchedalmond: "#ffebcd", black: "#000000", gold: "#ffd700", goldenrod: "#daa520", gainsboro: "#dcdcdc", cornsilk: "#fff8dc", cornflowerblue: "#6495ed", burlywood: "#deb887", aquamarine: "#7fffd4", beige: "#f5f5dc", crimson: "#dc143c", cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkkhaki: "#bdb76b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9", peachpuff: "#ffdab9", darkmagenta: "#8b008b", darkred: "#8b0000", darkorchid: "#9932cc", darkorange: "#ff8c00", darkslateblue: "#483d8b", gray: "#808080", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", deeppink: "#ff1493", deepskyblue: "#00bfff", wheat: "#f5deb3", firebrick: "#b22222", floralwhite: "#fffaf0", ghostwhite: "#f8f8ff", darkviolet: "#9400d3", magenta: "#ff00ff", green: "#008000", dodgerblue: "#1e90ff", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", blueviolet: "#8a2be2", forestgreen: "#228b22", lawngreen: "#7cfc00", indianred: "#cd5c5c", indigo: "#4b0082", fuchsia: "#ff00ff", brown: "#a52a2a", maroon: "#800000", mediumblue: "#0000cd", lightcoral: "#f08080", darkturquoise: "#00ced1", lightcyan: "#e0ffff", ivory: "#fffff0", lightyellow: "#ffffe0", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", linen: "#faf0e6", mediumaquamarine: "#66cdaa", lemonchiffon: "#fffacd", lime: "#00ff00", khaki: "#f0e68c", mediumseagreen: "#3cb371", limegreen: "#32cd32", mediumspringgreen: "#00fa9a", lightskyblue: "#87cefa", lightblue: "#add8e6", midnightblue: "#191970", lightpink: "#ffb6c1", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", mintcream: "#f5fffa", lightslategray: "#778899", lightslategrey: "#778899", navajowhite: "#ffdead", navy: "#000080", mediumvioletred: "#c71585", powderblue: "#b0e0e6", palegoldenrod: "#eee8aa", oldlace: "#fdf5e6", paleturquoise: "#afeeee", mediumturquoise: "#48d1cc", mediumorchid: "#ba55d3", rebeccapurple: "#663399", lightsteelblue: "#b0c4de", mediumslateblue: "#7b68ee", thistle: "#d8bfd8", tan: "#d2b48c", orchid: "#da70d6", mediumpurple: "#9370db", purple: "#800080", pink: "#ffc0cb", skyblue: "#87ceeb", springgreen: "#00ff7f", palegreen: "#98fb98", red: "#ff0000", yellow: "#ffff00", slateblue: "#6a5acd", lavenderblush: "#fff0f5", peru: "#cd853f", palevioletred: "#db7093", violet: "#ee82ee", teal: "#008080", slategray: "#708090", slategrey: "#708090", aliceblue: "#f0f8ff", darkseagreen: "#8fbc8f", darkolivegreen: "#556b2f", greenyellow: "#adff2f", seagreen: "#2e8b57", seashell: "#fff5ee", tomato: "#ff6347", silver: "#c0c0c0", sienna: "#a0522d", lavender: "#e6e6fa", lightgreen: "#90ee90", orange: "#ffa500", orangered: "#ff4500", steelblue: "#4682b4", royalblue: "#4169e1", turquoise: "#40e0d0", yellowgreen: "#9acd32", salmon: "#fa8072", saddlebrown: "#8b4513", sandybrown: "#f4a460", rosybrown: "#bc8f8f", darksalmon: "#e9967a", lightgoldenrodyellow: "#fafad2", snow: "#fffafa", lightgrey: "#d3d3d3", lightgray: "#d3d3d3", dimgray: "#696969", dimgrey: "#696969", olivedrab: "#6b8e23", olive: "#808000" }, s = {};
  for (var i in e) s[e[i]] = i;
  var n = {};
  r.prototype.toName = function(o) {
    if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";
    var a, h, l = s[this.toHex()];
    if (l) return l;
    if (o?.closest) {
      var c = this.toRgb(), d = 1 / 0, f = "black";
      if (!n.length) for (var u in e) n[u] = new r(e[u]).toRgb();
      for (var p in e) {
        var m = (a = c, h = n[p], Math.pow(a.r - h.r, 2) + Math.pow(a.g - h.g, 2) + Math.pow(a.b - h.b, 2));
        m < d && (d = m, f = p);
      }
      return f;
    }
  }, t.string.push([function(o) {
    var a = o.toLowerCase(), h = a === "transparent" ? "#0000" : e[a];
    return h ? new r(h).toRgb() : null;
  }, "name"]);
}
fo([po]);
const Qt = class le {
  /**
   * @param {ColorSource} value - Optional value to use, if not provided, white is used.
   */
  constructor(t = 16777215) {
    this._value = null, this._components = new Float32Array(4), this._components.fill(1), this._int = 16777215, this.value = t;
  }
  /**
   * Get the red component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('red');
   * console.log(color.red); // 1
   *
   * const green = new Color('#00ff00');
   * console.log(green.red); // 0
   * ```
   */
  get red() {
    return this._components[0];
  }
  /**
   * Get the green component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('lime');
   * console.log(color.green); // 1
   *
   * const red = new Color('#ff0000');
   * console.log(red.green); // 0
   * ```
   */
  get green() {
    return this._components[1];
  }
  /**
   * Get the blue component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('blue');
   * console.log(color.blue); // 1
   *
   * const yellow = new Color('#ffff00');
   * console.log(yellow.blue); // 0
   * ```
   */
  get blue() {
    return this._components[2];
  }
  /**
   * Get the alpha component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('red');
   * console.log(color.alpha); // 1 (fully opaque)
   *
   * const transparent = new Color('rgba(255, 0, 0, 0.5)');
   * console.log(transparent.alpha); // 0.5 (semi-transparent)
   * ```
   */
  get alpha() {
    return this._components[3];
  }
  /**
   * Sets the color value and returns the instance for chaining.
   *
   * This is a chainable version of setting the `value` property.
   * @param value - The color to set. Accepts various formats:
   * - Hex strings/numbers (e.g., '#ff0000', 0xff0000)
   * - RGB/RGBA values (arrays, objects)
   * - CSS color names
   * - HSL/HSLA values
   * - HSV/HSVA values
   * @returns The Color instance for chaining
   * @example
   * ```ts
   * // Basic usage
   * const color = new Color();
   * color.setValue('#ff0000')
   *     .setAlpha(0.5)
   *     .premultiply(0.8);
   *
   * // Different formats
   * color.setValue(0xff0000);          // Hex number
   * color.setValue('#ff0000');         // Hex string
   * color.setValue([1, 0, 0]);         // RGB array
   * color.setValue([1, 0, 0, 0.5]);    // RGBA array
   * color.setValue({ r: 1, g: 0, b: 0 }); // RGB object
   *
   * // Copy from another color
   * const red = new Color('red');
   * color.setValue(red);
   * ```
   * @throws {Error} If the color value is invalid or null
   * @see {@link Color.value} For the underlying value property
   */
  setValue(t) {
    return this.value = t, this;
  }
  /**
   * The current color source. This property allows getting and setting the color value
   * while preserving the original format where possible.
   * @remarks
   * When setting:
   * - Setting to a `Color` instance copies its source and components
   * - Setting to other valid sources normalizes and stores the value
   * - Setting to `null` throws an Error
   * - The color remains unchanged if normalization fails
   *
   * When getting:
   * - Returns `null` if color was modified by {@link Color.multiply} or {@link Color.premultiply}
   * - Otherwise returns the original color source
   * @example
   * ```ts
   * // Setting different color formats
   * const color = new Color();
   *
   * color.value = 0xff0000;         // Hex number
   * color.value = '#ff0000';        // Hex string
   * color.value = [1, 0, 0];        // RGB array
   * color.value = [1, 0, 0, 0.5];   // RGBA array
   * color.value = { r: 1, g: 0, b: 0 }; // RGB object
   *
   * // Copying from another color
   * const red = new Color('red');
   * color.value = red;  // Copies red's components
   *
   * // Getting the value
   * console.log(color.value);  // Returns original format
   *
   * // After modifications
   * color.multiply([0.5, 0.5, 0.5]);
   * console.log(color.value);  // Returns null
   * ```
   * @throws {Error} When attempting to set `null`
   */
  set value(t) {
    if (t instanceof le)
      this._value = this._cloneSource(t._value), this._int = t._int, this._components.set(t._components);
    else {
      if (t === null)
        throw new Error("Cannot set Color#value to null");
      (this._value === null || !this._isSourceEqual(this._value, t)) && (this._value = this._cloneSource(t), this._normalize(this._value));
    }
  }
  get value() {
    return this._value;
  }
  /**
   * Copy a color source internally.
   * @param value - Color source
   */
  _cloneSource(t) {
    return typeof t == "string" || typeof t == "number" || t instanceof Number || t === null ? t : Array.isArray(t) || ArrayBuffer.isView(t) ? t.slice(0) : typeof t == "object" && t !== null ? { ...t } : t;
  }
  /**
   * Equality check for color sources.
   * @param value1 - First color source
   * @param value2 - Second color source
   * @returns `true` if the color sources are equal, `false` otherwise.
   */
  _isSourceEqual(t, e) {
    const s = typeof t;
    if (s !== typeof e)
      return !1;
    if (s === "number" || s === "string" || t instanceof Number)
      return t === e;
    if (Array.isArray(t) && Array.isArray(e) || ArrayBuffer.isView(t) && ArrayBuffer.isView(e))
      return t.length !== e.length ? !1 : t.every((n, o) => n === e[o]);
    if (t !== null && e !== null) {
      const n = Object.keys(t), o = Object.keys(e);
      return n.length !== o.length ? !1 : n.every((a) => t[a] === e[a]);
    }
    return t === e;
  }
  /**
   * Convert to a RGBA color object with normalized components (0-1).
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert colors to RGBA objects
   * new Color('white').toRgba();     // returns { r: 1, g: 1, b: 1, a: 1 }
   * new Color('#ff0000').toRgba();   // returns { r: 1, g: 0, b: 0, a: 1 }
   *
   * // With transparency
   * new Color('rgba(255,0,0,0.5)').toRgba(); // returns { r: 1, g: 0, b: 0, a: 0.5 }
   * ```
   * @returns An RGBA object with normalized components
   */
  toRgba() {
    const [t, e, s, i] = this._components;
    return { r: t, g: e, b: s, a: i };
  }
  /**
   * Convert to a RGB color object with normalized components (0-1).
   *
   * Alpha component is omitted in the output.
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert colors to RGB objects
   * new Color('white').toRgb();     // returns { r: 1, g: 1, b: 1 }
   * new Color('#ff0000').toRgb();   // returns { r: 1, g: 0, b: 0 }
   *
   * // Alpha is ignored
   * new Color('rgba(255,0,0,0.5)').toRgb(); // returns { r: 1, g: 0, b: 0 }
   * ```
   * @returns An RGB object with normalized components
   */
  toRgb() {
    const [t, e, s] = this._components;
    return { r: t, g: e, b: s };
  }
  /**
   * Convert to a CSS-style rgba string representation.
   *
   * RGB components are scaled to 0-255 range, alpha remains 0-1.
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert colors to RGBA strings
   * new Color('white').toRgbaString();     // returns "rgba(255,255,255,1)"
   * new Color('#ff0000').toRgbaString();   // returns "rgba(255,0,0,1)"
   *
   * // With transparency
   * new Color([1, 0, 0, 0.5]).toRgbaString(); // returns "rgba(255,0,0,0.5)"
   * ```
   * @returns A CSS-compatible rgba string
   */
  toRgbaString() {
    const [t, e, s] = this.toUint8RgbArray();
    return `rgba(${t},${e},${s},${this.alpha})`;
  }
  /**
   * Convert to an [R, G, B] array of clamped uint8 values (0 to 255).
   * @param {number[]|Uint8Array|Uint8ClampedArray} [out] - Optional output array. If not provided,
   * a cached array will be used and returned.
   * @returns Array containing RGB components as integers between 0-255
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toUint8RgbArray(); // returns [255, 255, 255]
   * new Color('#ff0000').toUint8RgbArray(); // returns [255, 0, 0]
   *
   * // Using custom output array
   * const rgb = new Uint8Array(3);
   * new Color('blue').toUint8RgbArray(rgb); // rgb is now [0, 0, 255]
   *
   * // Using different array types
   * new Color('red').toUint8RgbArray(new Uint8ClampedArray(3)); // [255, 0, 0]
   * new Color('red').toUint8RgbArray([]); // [255, 0, 0]
   * ```
   * @remarks
   * - Output values are always clamped between 0-255
   * - Alpha component is not included in output
   * - Reuses internal cache array if no output array provided
   */
  toUint8RgbArray(t) {
    const [e, s, i] = this._components;
    return this._arrayRgb || (this._arrayRgb = []), t || (t = this._arrayRgb), t[0] = Math.round(e * 255), t[1] = Math.round(s * 255), t[2] = Math.round(i * 255), t;
  }
  /**
   * Convert to an [R, G, B, A] array of normalized floats (numbers from 0.0 to 1.0).
   * @param {number[]|Float32Array} [out] - Optional output array. If not provided,
   * a cached array will be used and returned.
   * @returns Array containing RGBA components as floats between 0-1
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toArray();  // returns [1, 1, 1, 1]
   * new Color('red').toArray();    // returns [1, 0, 0, 1]
   *
   * // With alpha
   * new Color('rgba(255,0,0,0.5)').toArray(); // returns [1, 0, 0, 0.5]
   *
   * // Using custom output array
   * const rgba = new Float32Array(4);
   * new Color('blue').toArray(rgba); // rgba is now [0, 0, 1, 1]
   * ```
   * @remarks
   * - Output values are normalized between 0-1
   * - Includes alpha component as the fourth value
   * - Reuses internal cache array if no output array provided
   */
  toArray(t) {
    this._arrayRgba || (this._arrayRgba = []), t || (t = this._arrayRgba);
    const [e, s, i, n] = this._components;
    return t[0] = e, t[1] = s, t[2] = i, t[3] = n, t;
  }
  /**
   * Convert to an [R, G, B] array of normalized floats (numbers from 0.0 to 1.0).
   * @param {number[]|Float32Array} [out] - Optional output array. If not provided,
   * a cached array will be used and returned.
   * @returns Array containing RGB components as floats between 0-1
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toRgbArray(); // returns [1, 1, 1]
   * new Color('red').toRgbArray();   // returns [1, 0, 0]
   *
   * // Using custom output array
   * const rgb = new Float32Array(3);
   * new Color('blue').toRgbArray(rgb); // rgb is now [0, 0, 1]
   * ```
   * @remarks
   * - Output values are normalized between 0-1
   * - Alpha component is omitted from output
   * - Reuses internal cache array if no output array provided
   */
  toRgbArray(t) {
    this._arrayRgb || (this._arrayRgb = []), t || (t = this._arrayRgb);
    const [e, s, i] = this._components;
    return t[0] = e, t[1] = s, t[2] = i, t;
  }
  /**
   * Convert to a hexadecimal number.
   * @returns The color as a 24-bit RGB integer
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toNumber(); // returns 0xffffff
   * new Color('red').toNumber();   // returns 0xff0000
   *
   * // Store as hex
   * const color = new Color('blue');
   * const hex = color.toNumber(); // 0x0000ff
   * ```
   */
  toNumber() {
    return this._int;
  }
  /**
   * Convert to a BGR number.
   *
   * Useful for platforms that expect colors in BGR format.
   * @returns The color as a 24-bit BGR integer
   * @example
   * ```ts
   * // Convert RGB to BGR
   * new Color(0xffcc99).toBgrNumber(); // returns 0x99ccff
   *
   * // Common use case: platform-specific color format
   * const color = new Color('orange');
   * const bgrColor = color.toBgrNumber(); // Color with swapped R/B channels
   * ```
   * @remarks
   * This swaps the red and blue channels compared to the normal RGB format:
   * - RGB 0xRRGGBB becomes BGR 0xBBGGRR
   */
  toBgrNumber() {
    const [t, e, s] = this.toUint8RgbArray();
    return (s << 16) + (e << 8) + t;
  }
  /**
   * Convert to a hexadecimal number in little endian format (e.g., BBGGRR).
   *
   * Useful for platforms that expect colors in little endian byte order.
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert RGB color to little endian format
   * new Color(0xffcc99).toLittleEndianNumber(); // returns 0x99ccff
   *
   * // Common use cases:
   * const color = new Color('orange');
   * const leColor = color.toLittleEndianNumber(); // Swaps byte order for LE systems
   *
   * // Multiple conversions
   * const colors = {
   *     normal: 0xffcc99,
   *     littleEndian: new Color(0xffcc99).toLittleEndianNumber(), // 0x99ccff
   *     backToNormal: new Color(0x99ccff).toLittleEndianNumber()  // 0xffcc99
   * };
   * ```
   * @remarks
   * - Swaps R and B channels in the color value
   * - RGB 0xRRGGBB becomes 0xBBGGRR
   * - Useful for systems that use little endian byte order
   * - Can be used to convert back and forth between formats
   * @returns The color as a number in little endian format (BBGGRR)
   * @see {@link Color.toBgrNumber} For BGR format without byte swapping
   */
  toLittleEndianNumber() {
    const t = this._int;
    return (t >> 16) + (t & 65280) + ((t & 255) << 16);
  }
  /**
   * Multiply with another color.
   *
   * This action is destructive and modifies the original color.
   * @param {ColorSource} value - The color to multiply by. Accepts any valid color format:
   * - Hex strings/numbers (e.g., '#ff0000', 0xff0000)
   * - RGB/RGBA arrays ([1, 0, 0], [1, 0, 0, 1])
   * - Color objects ({ r: 1, g: 0, b: 0 })
   * - CSS color names ('red', 'blue')
   * @returns this - The Color instance for chaining
   * @example
   * ```ts
   * // Basic multiplication
   * const color = new Color('#ff0000');
   * color.multiply(0x808080); // 50% darker red
   *
   * // With transparency
   * color.multiply([1, 1, 1, 0.5]); // 50% transparent
   *
   * // Chain operations
   * color
   *     .multiply('#808080')
   *     .multiply({ r: 1, g: 1, b: 1, a: 0.5 });
   * ```
   * @remarks
   * - Multiplies each RGB component and alpha separately
   * - Values are clamped between 0-1
   * - Original color format is lost (value becomes null)
   * - Operation cannot be undone
   */
  multiply(t) {
    const [e, s, i, n] = le._temp.setValue(t)._components;
    return this._components[0] *= e, this._components[1] *= s, this._components[2] *= i, this._components[3] *= n, this._refreshInt(), this._value = null, this;
  }
  /**
   * Converts color to a premultiplied alpha format.
   *
   * This action is destructive and modifies the original color.
   * @param alpha - The alpha value to multiply by (0-1)
   * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels
   * @returns {Color} The Color instance for chaining
   * @example
   * ```ts
   * // Basic premultiplication
   * const color = new Color('red');
   * color.premultiply(0.5); // 50% transparent red with premultiplied RGB
   *
   * // Alpha only (RGB unchanged)
   * color.premultiply(0.5, false); // 50% transparent, original RGB
   *
   * // Chain with other operations
   * color
   *     .multiply(0x808080)
   *     .premultiply(0.5)
   *     .toNumber();
   * ```
   * @remarks
   * - RGB channels are multiplied by alpha when applyToRGB is true
   * - Alpha is always set to the provided value
   * - Values are clamped between 0-1
   * - Original color format is lost (value becomes null)
   * - Operation cannot be undone
   */
  premultiply(t, e = !0) {
    return e && (this._components[0] *= t, this._components[1] *= t, this._components[2] *= t), this._components[3] = t, this._refreshInt(), this._value = null, this;
  }
  /**
   * Returns the color as a 32-bit premultiplied alpha integer.
   *
   * Format: 0xAARRGGBB
   * @param {number} alpha - The alpha value to multiply by (0-1)
   * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels
   * @returns {number} The premultiplied color as a 32-bit integer
   * @example
   * ```ts
   * // Convert to premultiplied format
   * const color = new Color('red');
   *
   * // Full opacity (0xFFRRGGBB)
   * color.toPremultiplied(1.0); // 0xFFFF0000
   *
   * // 50% transparency with premultiplied RGB
   * color.toPremultiplied(0.5); // 0x7F7F0000
   *
   * // 50% transparency without RGB premultiplication
   * color.toPremultiplied(0.5, false); // 0x7FFF0000
   * ```
   * @remarks
   * - Returns full opacity (0xFF000000) when alpha is 1.0
   * - Returns 0 when alpha is 0.0 and applyToRGB is true
   * - RGB values are rounded during premultiplication
   */
  toPremultiplied(t, e = !0) {
    if (t === 1)
      return (255 << 24) + this._int;
    if (t === 0)
      return e ? 0 : this._int;
    let s = this._int >> 16 & 255, i = this._int >> 8 & 255, n = this._int & 255;
    return e && (s = s * t + 0.5 | 0, i = i * t + 0.5 | 0, n = n * t + 0.5 | 0), (t * 255 << 24) + (s << 16) + (i << 8) + n;
  }
  /**
   * Convert to a hexadecimal string (6 characters).
   * @returns A CSS-compatible hex color string (e.g., "#ff0000")
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Basic colors
   * new Color('red').toHex();    // returns "#ff0000"
   * new Color('white').toHex();  // returns "#ffffff"
   * new Color('black').toHex();  // returns "#000000"
   *
   * // From different formats
   * new Color(0xff0000).toHex(); // returns "#ff0000"
   * new Color([1, 0, 0]).toHex(); // returns "#ff0000"
   * new Color({ r: 1, g: 0, b: 0 }).toHex(); // returns "#ff0000"
   * ```
   * @remarks
   * - Always returns a 6-character hex string
   * - Includes leading "#" character
   * - Alpha channel is ignored
   * - Values are rounded to nearest hex value
   */
  toHex() {
    const t = this._int.toString(16);
    return `#${"000000".substring(0, 6 - t.length) + t}`;
  }
  /**
   * Convert to a hexadecimal string with alpha (8 characters).
   * @returns A CSS-compatible hex color string with alpha (e.g., "#ff0000ff")
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Fully opaque colors
   * new Color('red').toHexa();   // returns "#ff0000ff"
   * new Color('white').toHexa(); // returns "#ffffffff"
   *
   * // With transparency
   * new Color('rgba(255, 0, 0, 0.5)').toHexa(); // returns "#ff00007f"
   * new Color([1, 0, 0, 0]).toHexa(); // returns "#ff000000"
   * ```
   * @remarks
   * - Returns an 8-character hex string
   * - Includes leading "#" character
   * - Alpha is encoded in last two characters
   * - Values are rounded to nearest hex value
   */
  toHexa() {
    const e = Math.round(this._components[3] * 255).toString(16);
    return this.toHex() + "00".substring(0, 2 - e.length) + e;
  }
  /**
   * Set alpha (transparency) value while preserving color components.
   *
   * Provides a chainable interface for setting alpha.
   * @param alpha - Alpha value between 0 (fully transparent) and 1 (fully opaque)
   * @returns The Color instance for chaining
   * @example
   * ```ts
   * // Basic alpha setting
   * const color = new Color('red');
   * color.setAlpha(0.5);  // 50% transparent red
   *
   * // Chain with other operations
   * color
   *     .setValue('#ff0000')
   *     .setAlpha(0.8)    // 80% opaque
   *     .premultiply(0.5); // Further modify alpha
   *
   * // Reset to fully opaque
   * color.setAlpha(1);
   * ```
   * @remarks
   * - Alpha value is clamped between 0-1
   * - Can be chained with other color operations
   */
  setAlpha(t) {
    return this._components[3] = this._clamp(t), this;
  }
  /**
   * Normalize the input value into rgba
   * @param value - Input value
   */
  _normalize(t) {
    let e, s, i, n;
    if ((typeof t == "number" || t instanceof Number) && t >= 0 && t <= 16777215) {
      const o = t;
      e = (o >> 16 & 255) / 255, s = (o >> 8 & 255) / 255, i = (o & 255) / 255, n = 1;
    } else if ((Array.isArray(t) || t instanceof Float32Array) && t.length >= 3 && t.length <= 4)
      t = this._clamp(t), [e, s, i, n = 1] = t;
    else if ((t instanceof Uint8Array || t instanceof Uint8ClampedArray) && t.length >= 3 && t.length <= 4)
      t = this._clamp(t, 0, 255), [e, s, i, n = 255] = t, e /= 255, s /= 255, i /= 255, n /= 255;
    else if (typeof t == "string" || typeof t == "object") {
      if (typeof t == "string") {
        const a = le.HEX_PATTERN.exec(t);
        a && (t = `#${a[2]}`);
      }
      const o = gt(t);
      o.isValid() && ({ r: e, g: s, b: i, a: n } = o.rgba, e /= 255, s /= 255, i /= 255);
    }
    if (e !== void 0)
      this._components[0] = e, this._components[1] = s, this._components[2] = i, this._components[3] = n, this._refreshInt();
    else
      throw new Error(`Unable to convert color ${t}`);
  }
  /** Refresh the internal color rgb number */
  _refreshInt() {
    this._clamp(this._components);
    const [t, e, s] = this._components;
    this._int = (t * 255 << 16) + (e * 255 << 8) + (s * 255 | 0);
  }
  /**
   * Clamps values to a range. Will override original values
   * @param value - Value(s) to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   */
  _clamp(t, e = 0, s = 1) {
    return typeof t == "number" ? Math.min(Math.max(t, e), s) : (t.forEach((i, n) => {
      t[n] = Math.min(Math.max(i, e), s);
    }), t);
  }
  /**
   * Check if a value can be interpreted as a valid color format.
   * Supports all color formats that can be used with the Color class.
   * @param value - Value to check
   * @returns True if the value can be used as a color
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // CSS colors and hex values
   * Color.isColorLike('red');          // true
   * Color.isColorLike('#ff0000');      // true
   * Color.isColorLike(0xff0000);       // true
   *
   * // Arrays (RGB/RGBA)
   * Color.isColorLike([1, 0, 0]);      // true
   * Color.isColorLike([1, 0, 0, 0.5]); // true
   *
   * // TypedArrays
   * Color.isColorLike(new Float32Array([1, 0, 0]));          // true
   * Color.isColorLike(new Uint8Array([255, 0, 0]));          // true
   * Color.isColorLike(new Uint8ClampedArray([255, 0, 0]));   // true
   *
   * // Object formats
   * Color.isColorLike({ r: 1, g: 0, b: 0 });            // true (RGB)
   * Color.isColorLike({ r: 1, g: 0, b: 0, a: 0.5 });    // true (RGBA)
   * Color.isColorLike({ h: 0, s: 100, l: 50 });         // true (HSL)
   * Color.isColorLike({ h: 0, s: 100, l: 50, a: 0.5 }); // true (HSLA)
   * Color.isColorLike({ h: 0, s: 100, v: 100 });        // true (HSV)
   * Color.isColorLike({ h: 0, s: 100, v: 100, a: 0.5 });// true (HSVA)
   *
   * // Color instances
   * Color.isColorLike(new Color('red')); // true
   *
   * // Invalid values
   * Color.isColorLike(null);           // false
   * Color.isColorLike(undefined);      // false
   * Color.isColorLike({});             // false
   * Color.isColorLike([]);             // false
   * Color.isColorLike('not-a-color');  // false
   * ```
   * @remarks
   * Checks for the following formats:
   * - Numbers (0x000000 to 0xffffff)
   * - CSS color strings
   * - RGB/RGBA arrays and objects
   * - HSL/HSLA objects
   * - HSV/HSVA objects
   * - TypedArrays (Float32Array, Uint8Array, Uint8ClampedArray)
   * - Color instances
   * @see {@link ColorSource} For supported color format types
   * @see {@link Color.setValue} For setting color values
   * @category utility
   */
  static isColorLike(t) {
    return typeof t == "number" || typeof t == "string" || t instanceof Number || t instanceof le || Array.isArray(t) || t instanceof Uint8Array || t instanceof Uint8ClampedArray || t instanceof Float32Array || t.r !== void 0 && t.g !== void 0 && t.b !== void 0 || t.r !== void 0 && t.g !== void 0 && t.b !== void 0 && t.a !== void 0 || t.h !== void 0 && t.s !== void 0 && t.l !== void 0 || t.h !== void 0 && t.s !== void 0 && t.l !== void 0 && t.a !== void 0 || t.h !== void 0 && t.s !== void 0 && t.v !== void 0 || t.h !== void 0 && t.s !== void 0 && t.v !== void 0 && t.a !== void 0;
  }
};
Qt.shared = new Qt();
Qt._temp = new Qt();
Qt.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;
let V = Qt;
const go = {
  cullArea: null,
  cullable: !1,
  cullableChildren: !0
};
let gs = 0;
const Mi = 500;
function J(...r) {
  gs !== Mi && (gs++, gs === Mi ? console.warn("PixiJS Warning: too many warnings, no more warnings will be reported to the console by PixiJS.") : console.warn("PixiJS Warning: ", ...r));
}
const Me = {
  /**
   * Set of registered pools and cleanable objects.
   * @private
   */
  _registeredResources: /* @__PURE__ */ new Set(),
  /**
   * Registers a pool or cleanable object for cleanup.
   * @param {Cleanable} pool - The pool or object to register.
   */
  register(r) {
    this._registeredResources.add(r);
  },
  /**
   * Unregisters a pool or cleanable object from cleanup.
   * @param {Cleanable} pool - The pool or object to unregister.
   */
  unregister(r) {
    this._registeredResources.delete(r);
  },
  /** Clears all registered pools and cleanable objects. This will call clear() on each registered item. */
  release() {
    this._registeredResources.forEach((r) => r.clear());
  },
  /**
   * Gets the number of registered pools and cleanable objects.
   * @returns {number} The count of registered items.
   */
  get registeredCount() {
    return this._registeredResources.size;
  },
  /**
   * Checks if a specific pool or cleanable object is registered.
   * @param {Cleanable} pool - The pool or object to check.
   * @returns {boolean} True if the item is registered, false otherwise.
   */
  isRegistered(r) {
    return this._registeredResources.has(r);
  },
  /**
   * Removes all registrations without clearing the pools.
   * Useful if you want to reset the collector without affecting the pools.
   */
  reset() {
    this._registeredResources.clear();
  }
};
class mo {
  /**
   * Constructs a new Pool.
   * @param ClassType - The constructor of the items in the pool.
   * @param {number} [initialSize] - The initial size of the pool.
   */
  constructor(t, e) {
    this._pool = [], this._count = 0, this._index = 0, this._classType = t, e && this.prepopulate(e);
  }
  /**
   * Prepopulates the pool with a given number of items.
   * @param total - The number of items to add to the pool.
   */
  prepopulate(t) {
    for (let e = 0; e < t; e++)
      this._pool[this._index++] = new this._classType();
    this._count += t;
  }
  /**
   * Gets an item from the pool. Calls the item's `init` method if it exists.
   * If there are no items left in the pool, a new one will be created.
   * @param {unknown} [data] - Optional data to pass to the item's constructor.
   * @returns {T} The item from the pool.
   */
  get(t) {
    let e;
    return this._index > 0 ? e = this._pool[--this._index] : (e = new this._classType(), this._count++), e.init?.(t), e;
  }
  /**
   * Returns an item to the pool. Calls the item's `reset` method if it exists.
   * @param {T} item - The item to return to the pool.
   */
  return(t) {
    t.reset?.(), this._pool[this._index++] = t;
  }
  /**
   * Gets the number of items in the pool.
   * @readonly
   */
  get totalSize() {
    return this._count;
  }
  /**
   * Gets the number of items in the pool that are free to use without needing to create more.
   * @readonly
   */
  get totalFree() {
    return this._index;
  }
  /**
   * Gets the number of items in the pool that are currently in use.
   * @readonly
   */
  get totalUsed() {
    return this._count - this._index;
  }
  /** clears the pool */
  clear() {
    if (this._pool.length > 0 && this._pool[0].destroy)
      for (let t = 0; t < this._index; t++)
        this._pool[t].destroy();
    this._pool.length = 0, this._count = 0, this._index = 0;
  }
}
class yo {
  constructor() {
    this._poolsByClass = /* @__PURE__ */ new Map();
  }
  /**
   * Prepopulates a specific pool with a given number of items.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} Class - The constructor of the items in the pool.
   * @param {number} total - The number of items to add to the pool.
   */
  prepopulate(t, e) {
    this.getPool(t).prepopulate(e);
  }
  /**
   * Gets an item from a specific pool.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} Class - The constructor of the items in the pool.
   * @param {unknown} [data] - Optional data to pass to the item's constructor.
   * @returns {T} The item from the pool.
   */
  get(t, e) {
    return this.getPool(t).get(e);
  }
  /**
   * Returns an item to its respective pool.
   * @param {PoolItem} item - The item to return to the pool.
   */
  return(t) {
    this.getPool(t.constructor).return(t);
  }
  /**
   * Gets a specific pool based on the class type.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} ClassType - The constructor of the items in the pool.
   * @returns {Pool<T>} The pool of the given class type.
   */
  getPool(t) {
    return this._poolsByClass.has(t) || this._poolsByClass.set(t, new mo(t)), this._poolsByClass.get(t);
  }
  /** gets the usage stats of each pool in the system */
  stats() {
    const t = {};
    return this._poolsByClass.forEach((e) => {
      const s = t[e._classType.name] ? e._classType.name + e._classType.ID : e._classType.name;
      t[s] = {
        free: e.totalFree,
        used: e.totalUsed,
        size: e.totalSize
      };
    }), t;
  }
  /** Clears all pools in the group. This will reset all pools and free their resources. */
  clear() {
    this._poolsByClass.forEach((t) => t.clear()), this._poolsByClass.clear();
  }
}
const at = new yo();
Me.register(at);
const xo = {
  get isCachedAsTexture() {
    return !!this.renderGroup?.isCachedAsTexture;
  },
  cacheAsTexture(r) {
    typeof r == "boolean" && r === !1 ? this.disableRenderGroup() : (this.enableRenderGroup(), this.renderGroup.enableCacheAsTexture(r === !0 ? {} : r));
  },
  updateCacheTexture() {
    this.renderGroup?.updateCacheTexture();
  },
  get cacheAsBitmap() {
    return this.isCachedAsTexture;
  },
  set cacheAsBitmap(r) {
    B("v8.6.0", "cacheAsBitmap is deprecated, use cacheAsTexture instead."), this.cacheAsTexture(r);
  }
};
function bo(r, t, e) {
  const s = r.length;
  let i;
  if (t >= s || e === 0)
    return;
  e = t + e > s ? s - t : e;
  const n = s - e;
  for (i = t; i < n; ++i)
    r[i] = r[i + e];
  r.length = n;
}
const wo = {
  allowChildren: !0,
  removeChildren(r = 0, t) {
    const e = t ?? this.children.length, s = e - r, i = [];
    if (s > 0 && s <= e) {
      for (let o = e - 1; o >= r; o--) {
        const a = this.children[o];
        a && (i.push(a), a.parent = null);
      }
      bo(this.children, r, e);
      const n = this.renderGroup || this.parentRenderGroup;
      n && n.removeChildren(i);
      for (let o = 0; o < i.length; ++o) {
        const a = i[o];
        a.parentRenderLayer?.detach(a), this.emit("childRemoved", a, this, o), i[o].emit("removed", this);
      }
      return i.length > 0 && this._didViewChangeTick++, i;
    } else if (s === 0 && this.children.length === 0)
      return i;
    throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
  },
  removeChildAt(r) {
    const t = this.getChildAt(r);
    return this.removeChild(t);
  },
  getChildAt(r) {
    if (r < 0 || r >= this.children.length)
      throw new Error(`getChildAt: Index (${r}) does not exist.`);
    return this.children[r];
  },
  setChildIndex(r, t) {
    if (t < 0 || t >= this.children.length)
      throw new Error(`The index ${t} supplied is out of bounds ${this.children.length}`);
    this.getChildIndex(r), this.addChildAt(r, t);
  },
  getChildIndex(r) {
    const t = this.children.indexOf(r);
    if (t === -1)
      throw new Error("The supplied Container must be a child of the caller");
    return t;
  },
  addChildAt(r, t) {
    this.allowChildren || B(W, "addChildAt: Only Containers will be allowed to add children in v8.0.0");
    const { children: e } = this;
    if (t < 0 || t > e.length)
      throw new Error(`${r}addChildAt: The index ${t} supplied is out of bounds ${e.length}`);
    if (r.parent) {
      const i = r.parent.children.indexOf(r);
      if (r.parent === this && i === t)
        return r;
      i !== -1 && r.parent.children.splice(i, 1);
    }
    t === e.length ? e.push(r) : e.splice(t, 0, r), r.parent = this, r.didChange = !0, r._updateFlags = 15;
    const s = this.renderGroup || this.parentRenderGroup;
    return s && s.addChild(r), this.sortableChildren && (this.sortDirty = !0), this.emit("childAdded", r, this, t), r.emit("added", this), r;
  },
  swapChildren(r, t) {
    if (r === t)
      return;
    const e = this.getChildIndex(r), s = this.getChildIndex(t);
    this.children[e] = t, this.children[s] = r;
    const i = this.renderGroup || this.parentRenderGroup;
    i && (i.structureDidChange = !0), this._didContainerChangeTick++;
  },
  removeFromParent() {
    this.parent?.removeChild(this);
  },
  reparentChild(...r) {
    return r.length === 1 ? this.reparentChildAt(r[0], this.children.length) : (r.forEach((t) => this.reparentChildAt(t, this.children.length)), r[0]);
  },
  reparentChildAt(r, t) {
    if (r.parent === this)
      return this.setChildIndex(r, t), r;
    const e = r.worldTransform.clone();
    r.removeFromParent(), this.addChildAt(r, t);
    const s = this.worldTransform.clone();
    return s.invert(), e.prepend(s), r.setFromMatrix(e), r;
  },
  replaceChild(r, t) {
    r.updateLocalTransform(), this.addChildAt(t, this.getChildIndex(r)), t.setFromMatrix(r.localTransform), t.updateLocalTransform(), this.removeChild(r);
  }
}, _o = {
  collectRenderables(r, t, e) {
    this.parentRenderLayer && this.parentRenderLayer !== e || this.globalDisplayStatus < 7 || !this.includeInBuild || (this.sortableChildren && this.sortChildren(), this.isSimple ? this.collectRenderablesSimple(r, t, e) : this.renderGroup ? t.renderPipes.renderGroup.addRenderGroup(this.renderGroup, r) : this.collectRenderablesWithEffects(r, t, e));
  },
  collectRenderablesSimple(r, t, e) {
    const s = this.children, i = s.length;
    for (let n = 0; n < i; n++)
      s[n].collectRenderables(r, t, e);
  },
  collectRenderablesWithEffects(r, t, e) {
    const { renderPipes: s } = t;
    for (let i = 0; i < this.effects.length; i++) {
      const n = this.effects[i];
      s[n.pipe].push(n, this, r);
    }
    this.collectRenderablesSimple(r, t, e);
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const n = this.effects[i];
      s[n.pipe].pop(n, this, r);
    }
  }
};
class Pi {
  constructor() {
    this.pipe = "filter", this.priority = 1;
  }
  destroy() {
    for (let t = 0; t < this.filters.length; t++)
      this.filters[t].destroy();
    this.filters = null, this.filterArea = null;
  }
}
class vo {
  constructor() {
    this._effectClasses = [], this._tests = [], this._initialized = !1;
  }
  init() {
    this._initialized || (this._initialized = !0, this._effectClasses.forEach((t) => {
      this.add({
        test: t.test,
        maskClass: t
      });
    }));
  }
  add(t) {
    this._tests.push(t);
  }
  getMaskEffect(t) {
    this._initialized || this.init();
    for (let e = 0; e < this._tests.length; e++) {
      const s = this._tests[e];
      if (s.test(t))
        return at.get(s.maskClass, t);
    }
    return t;
  }
  returnMaskEffect(t) {
    at.return(t);
  }
}
const Bs = new vo();
ht.handleByList(z.MaskEffect, Bs._effectClasses);
const So = {
  _maskEffect: null,
  _maskOptions: {
    inverse: !1
  },
  _filterEffect: null,
  effects: [],
  _markStructureAsChanged() {
    const r = this.renderGroup || this.parentRenderGroup;
    r && (r.structureDidChange = !0);
  },
  addEffect(r) {
    this.effects.indexOf(r) === -1 && (this.effects.push(r), this.effects.sort((e, s) => e.priority - s.priority), this._markStructureAsChanged(), this._updateIsSimple());
  },
  removeEffect(r) {
    const t = this.effects.indexOf(r);
    t !== -1 && (this.effects.splice(t, 1), this._markStructureAsChanged(), this._updateIsSimple());
  },
  set mask(r) {
    const t = this._maskEffect;
    t?.mask !== r && (t && (this.removeEffect(t), Bs.returnMaskEffect(t), this._maskEffect = null), r != null && (this._maskEffect = Bs.getMaskEffect(r), this.addEffect(this._maskEffect)));
  },
  get mask() {
    return this._maskEffect?.mask;
  },
  setMask(r) {
    this._maskOptions = {
      ...this._maskOptions,
      ...r
    }, r.mask && (this.mask = r.mask), this._markStructureAsChanged();
  },
  set filters(r) {
    !Array.isArray(r) && r && (r = [r]);
    const t = this._filterEffect || (this._filterEffect = new Pi());
    r = r;
    const e = r?.length > 0, s = t.filters?.length > 0, i = e !== s;
    r = Array.isArray(r) ? r.slice(0) : r, t.filters = Object.freeze(r), i && (e ? this.addEffect(t) : (this.removeEffect(t), t.filters = r ?? null));
  },
  get filters() {
    return this._filterEffect?.filters;
  },
  set filterArea(r) {
    this._filterEffect || (this._filterEffect = new Pi()), this._filterEffect.filterArea = r;
  },
  get filterArea() {
    return this._filterEffect?.filterArea;
  }
}, Co = {
  label: null,
  get name() {
    return B(W, "Container.name property has been removed, use Container.label instead"), this.label;
  },
  set name(r) {
    B(W, "Container.name property has been removed, use Container.label instead"), this.label = r;
  },
  getChildByName(r, t = !1) {
    return this.getChildByLabel(r, t);
  },
  getChildByLabel(r, t = !1) {
    const e = this.children;
    for (let s = 0; s < e.length; s++) {
      const i = e[s];
      if (i.label === r || r instanceof RegExp && r.test(i.label))
        return i;
    }
    if (t)
      for (let s = 0; s < e.length; s++) {
        const n = e[s].getChildByLabel(r, !0);
        if (n)
          return n;
      }
    return null;
  },
  getChildrenByLabel(r, t = !1, e = []) {
    const s = this.children;
    for (let i = 0; i < s.length; i++) {
      const n = s[i];
      (n.label === r || r instanceof RegExp && r.test(n.label)) && e.push(n);
    }
    if (t)
      for (let i = 0; i < s.length; i++)
        s[i].getChildrenByLabel(r, !0, e);
    return e;
  }
}, Q = at.getPool(F), _t = at.getPool(ut), Mo = new F(), Po = {
  getFastGlobalBounds(r, t) {
    t || (t = new ut()), t.clear(), this._getGlobalBoundsRecursive(!!r, t, this.parentRenderLayer), t.isValid || t.set(0, 0, 0, 0);
    const e = this.renderGroup || this.parentRenderGroup;
    return t.applyMatrix(e.worldTransform), t;
  },
  _getGlobalBoundsRecursive(r, t, e) {
    let s = t;
    if (r && this.parentRenderLayer && this.parentRenderLayer !== e || this.localDisplayStatus !== 7 || !this.measurable)
      return;
    const i = !!this.effects.length;
    if ((this.renderGroup || i) && (s = _t.get().clear()), this.boundsArea)
      t.addRect(this.boundsArea, this.worldTransform);
    else {
      if (this.renderPipeId) {
        const o = this.bounds;
        s.addFrame(
          o.minX,
          o.minY,
          o.maxX,
          o.maxY,
          this.groupTransform
        );
      }
      const n = this.children;
      for (let o = 0; o < n.length; o++)
        n[o]._getGlobalBoundsRecursive(r, s, e);
    }
    if (i) {
      let n = !1;
      const o = this.renderGroup || this.parentRenderGroup;
      for (let a = 0; a < this.effects.length; a++)
        this.effects[a].addBounds && (n || (n = !0, s.applyMatrix(o.worldTransform)), this.effects[a].addBounds(s, !0));
      n && s.applyMatrix(o.worldTransform.copyTo(Mo).invert()), t.addBounds(s), _t.return(s);
    } else this.renderGroup && (t.addBounds(s, this.relativeGroupTransform), _t.return(s));
  }
};
function Fr(r, t, e) {
  e.clear();
  let s, i;
  return r.parent ? t ? s = r.parent.worldTransform : (i = Q.get().identity(), s = Zs(r, i)) : s = F.IDENTITY, Nr(r, e, s, t), i && Q.return(i), e.isValid || e.set(0, 0, 0, 0), e;
}
function Nr(r, t, e, s) {
  if (!r.visible || !r.measurable)
    return;
  let i;
  s ? i = r.worldTransform : (r.updateLocalTransform(), i = Q.get(), i.appendFrom(r.localTransform, e));
  const n = t, o = !!r.effects.length;
  if (o && (t = _t.get().clear()), r.boundsArea)
    t.addRect(r.boundsArea, i);
  else {
    const a = r.bounds;
    a && !a.isEmpty() && (t.matrix = i, t.addBounds(a));
    for (let h = 0; h < r.children.length; h++)
      Nr(r.children[h], t, i, s);
  }
  if (o) {
    for (let a = 0; a < r.effects.length; a++)
      r.effects[a].addBounds?.(t);
    n.addBounds(t, F.IDENTITY), _t.return(t);
  }
  s || Q.return(i);
}
function Zs(r, t) {
  const e = r.parent;
  return e && (Zs(e, t), e.updateLocalTransform(), t.append(e.localTransform)), t;
}
function Br(r, t) {
  if (r === 16777215 || !t)
    return t;
  if (t === 16777215 || !r)
    return r;
  const e = r >> 16 & 255, s = r >> 8 & 255, i = r & 255, n = t >> 16 & 255, o = t >> 8 & 255, a = t & 255, h = e * n / 255 | 0, l = s * o / 255 | 0, c = i * a / 255 | 0;
  return (h << 16) + (l << 8) + c;
}
const ki = 16777215;
function Ti(r, t) {
  return r === ki ? t : t === ki ? r : Br(r, t);
}
function Ue(r) {
  return ((r & 255) << 16) + (r & 65280) + (r >> 16 & 255);
}
const ko = {
  getGlobalAlpha(r) {
    if (r)
      return this.renderGroup ? this.renderGroup.worldAlpha : this.parentRenderGroup ? this.parentRenderGroup.worldAlpha * this.alpha : this.alpha;
    let t = this.alpha, e = this.parent;
    for (; e; )
      t *= e.alpha, e = e.parent;
    return t;
  },
  getGlobalTransform(r = new F(), t) {
    if (t)
      return r.copyFrom(this.worldTransform);
    this.updateLocalTransform();
    const e = Zs(this, Q.get().identity());
    return r.appendFrom(this.localTransform, e), Q.return(e), r;
  },
  getGlobalTint(r) {
    if (r)
      return this.renderGroup ? Ue(this.renderGroup.worldColor) : this.parentRenderGroup ? Ue(
        Ti(this.localColor, this.parentRenderGroup.worldColor)
      ) : this.tint;
    let t = this.localColor, e = this.parent;
    for (; e; )
      t = Ti(t, e.localColor), e = e.parent;
    return Ue(t);
  }
};
function Gr(r, t, e) {
  return t.clear(), e || (e = F.IDENTITY), Dr(r, t, e, r, !0), t.isValid || t.set(0, 0, 0, 0), t;
}
function Dr(r, t, e, s, i) {
  let n;
  if (i)
    n = Q.get(), n = e.copyTo(n);
  else {
    if (!r.visible || !r.measurable)
      return;
    r.updateLocalTransform();
    const h = r.localTransform;
    n = Q.get(), n.appendFrom(h, e);
  }
  const o = t, a = !!r.effects.length;
  if (a && (t = _t.get().clear()), r.boundsArea)
    t.addRect(r.boundsArea, n);
  else {
    r.renderPipeId && (t.matrix = n, t.addBounds(r.bounds));
    const h = r.children;
    for (let l = 0; l < h.length; l++)
      Dr(h[l], t, n, s, !1);
  }
  if (a) {
    for (let h = 0; h < r.effects.length; h++)
      r.effects[h].addLocalBounds?.(t, s);
    o.addBounds(t, F.IDENTITY), _t.return(t);
  }
  Q.return(n);
}
function zr(r, t) {
  const e = r.children;
  for (let s = 0; s < e.length; s++) {
    const i = e[s], n = i.uid, o = (i._didViewChangeTick & 65535) << 16 | i._didContainerChangeTick & 65535, a = t.index;
    (t.data[a] !== n || t.data[a + 1] !== o) && (t.data[t.index] = n, t.data[t.index + 1] = o, t.didChange = !0), t.index = a + 2, i.children.length && zr(i, t);
  }
  return t.didChange;
}
const To = new F(), Ao = {
  _localBoundsCacheId: -1,
  _localBoundsCacheData: null,
  _setWidth(r, t) {
    const e = Math.sign(this.scale.x) || 1;
    t !== 0 ? this.scale.x = r / t * e : this.scale.x = e;
  },
  _setHeight(r, t) {
    const e = Math.sign(this.scale.y) || 1;
    t !== 0 ? this.scale.y = r / t * e : this.scale.y = e;
  },
  getLocalBounds() {
    this._localBoundsCacheData || (this._localBoundsCacheData = {
      data: [],
      index: 1,
      didChange: !1,
      localBounds: new ut()
    });
    const r = this._localBoundsCacheData;
    return r.index = 1, r.didChange = !1, r.data[0] !== this._didViewChangeTick && (r.didChange = !0, r.data[0] = this._didViewChangeTick), zr(this, r), r.didChange && Gr(this, r.localBounds, To), r.localBounds;
  },
  getBounds(r, t) {
    return Fr(this, r, t || new ut());
  }
}, Io = {
  _onRender: null,
  set onRender(r) {
    const t = this.renderGroup || this.parentRenderGroup;
    if (!r) {
      this._onRender && t?.removeOnRender(this), this._onRender = null;
      return;
    }
    this._onRender || t?.addOnRender(this), this._onRender = r;
  },
  get onRender() {
    return this._onRender;
  }
}, Eo = {
  _zIndex: 0,
  sortDirty: !1,
  sortableChildren: !1,
  get zIndex() {
    return this._zIndex;
  },
  set zIndex(r) {
    this._zIndex !== r && (this._zIndex = r, this.depthOfChildModified());
  },
  depthOfChildModified() {
    this.parent && (this.parent.sortableChildren = !0, this.parent.sortDirty = !0), this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0);
  },
  sortChildren() {
    this.sortDirty && (this.sortDirty = !1, this.children.sort(Ro));
  }
};
function Ro(r, t) {
  return r._zIndex - t._zIndex;
}
const Lo = {
  getGlobalPosition(r = new C(), t = !1) {
    return this.parent ? this.parent.toGlobal(this._position, r, t) : (r.x = this._position.x, r.y = this._position.y), r;
  },
  toGlobal(r, t, e = !1) {
    const s = this.getGlobalTransform(Q.get(), e);
    return t = s.apply(r, t), Q.return(s), t;
  },
  toLocal(r, t, e, s) {
    t && (r = t.toGlobal(r, e, s));
    const i = this.getGlobalTransform(Q.get(), s);
    return e = i.applyInverse(r, e), Q.return(i), e;
  }
};
class Yr {
  constructor() {
    this.uid = U("instructionSet"), this.instructions = [], this.instructionSize = 0, this.renderables = [], this.gcTick = 0;
  }
  /** reset the instruction set so it can be reused set size back to 0 */
  reset() {
    this.instructionSize = 0;
  }
  /**
   * Destroy the instruction set, clearing the instructions and renderables.
   * @internal
   */
  destroy() {
    this.instructions.length = 0, this.renderables.length = 0, this.renderPipes = null, this.gcTick = 0;
  }
  /**
   * Add an instruction to the set
   * @param instruction - add an instruction to the set
   */
  add(t) {
    this.instructions[this.instructionSize++] = t;
  }
  /**
   * Log the instructions to the console (for debugging)
   * @internal
   */
  log() {
    this.instructions.length = this.instructionSize, console.table(this.instructions, ["type", "action"]);
  }
}
let Fo = 0;
class No {
  /**
   * @param textureOptions - options that will be passed to BaseRenderTexture constructor
   * @param {SCALE_MODE} [textureOptions.scaleMode] - See {@link SCALE_MODE} for possible values.
   */
  constructor(t) {
    this._poolKeyHash = /* @__PURE__ */ Object.create(null), this._texturePool = {}, this.textureOptions = t || {}, this.enableFullScreen = !1, this.textureStyle = new Ve(this.textureOptions);
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   * @param antialias
   */
  createTexture(t, e, s) {
    const i = new lt({
      ...this.textureOptions,
      width: t,
      height: e,
      resolution: 1,
      antialias: s,
      autoGarbageCollect: !1
    });
    return new D({
      source: i,
      label: `texturePool_${Fo++}`
    });
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param frameWidth - The minimum width of the render texture.
   * @param frameHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @param antialias
   * @returns The new render texture.
   */
  getOptimalTexture(t, e, s = 1, i) {
    let n = Math.ceil(t * s - 1e-6), o = Math.ceil(e * s - 1e-6);
    n = Zt(n), o = Zt(o);
    const a = (n << 17) + (o << 1) + (i ? 1 : 0);
    this._texturePool[a] || (this._texturePool[a] = []);
    let h = this._texturePool[a].pop();
    return h || (h = this.createTexture(n, o, i)), h.source._resolution = s, h.source.width = n / s, h.source.height = o / s, h.source.pixelWidth = n, h.source.pixelHeight = o, h.frame.x = 0, h.frame.y = 0, h.frame.width = t, h.frame.height = e, h.updateUvs(), this._poolKeyHash[h.uid] = a, h;
  }
  /**
   * Gets extra texture of the same size as input renderTexture
   * @param texture - The texture to check what size it is.
   * @param antialias - Whether to use antialias.
   * @returns A texture that is a power of two
   */
  getSameSizeTexture(t, e = !1) {
    const s = t.source;
    return this.getOptimalTexture(t.width, t.height, s._resolution, e);
  }
  /**
   * Place a render texture back into the pool. Optionally reset the style of the texture to the default texture style.
   * useful if you modified the style of the texture after getting it from the pool.
   * @param renderTexture - The renderTexture to free
   * @param resetStyle - Whether to reset the style of the texture to the default texture style
   */
  returnTexture(t, e = !1) {
    const s = this._poolKeyHash[t.uid];
    e && (t.source.style = this.textureStyle), this._texturePool[s].push(t);
  }
  /**
   * Clears the pool.
   * @param destroyTextures - Destroy all stored textures.
   */
  clear(t) {
    if (t = t !== !1, t)
      for (const e in this._texturePool) {
        const s = this._texturePool[e];
        if (s)
          for (let i = 0; i < s.length; i++)
            s[i].destroy(!0);
      }
    this._texturePool = {};
  }
}
const Xr = new No();
Me.register(Xr);
class Bo {
  constructor() {
    this.renderPipeId = "renderGroup", this.root = null, this.canBundle = !1, this.renderGroupParent = null, this.renderGroupChildren = [], this.worldTransform = new F(), this.worldColorAlpha = 4294967295, this.worldColor = 16777215, this.worldAlpha = 1, this.childrenToUpdate = /* @__PURE__ */ Object.create(null), this.updateTick = 0, this.gcTick = 0, this.childrenRenderablesToUpdate = { list: [], index: 0 }, this.structureDidChange = !0, this.instructionSet = new Yr(), this._onRenderContainers = [], this.textureNeedsUpdate = !0, this.isCachedAsTexture = !1, this._matrixDirty = 7;
  }
  init(t) {
    this.root = t, t._onRender && this.addOnRender(t), t.didChange = !0;
    const e = t.children;
    for (let s = 0; s < e.length; s++) {
      const i = e[s];
      i._updateFlags = 15, this.addChild(i);
    }
  }
  enableCacheAsTexture(t = {}) {
    this.textureOptions = t, this.isCachedAsTexture = !0, this.textureNeedsUpdate = !0;
  }
  disableCacheAsTexture() {
    this.isCachedAsTexture = !1, this.texture && (Xr.returnTexture(this.texture, !0), this.texture = null);
  }
  updateCacheTexture() {
    this.textureNeedsUpdate = !0;
    const t = this._parentCacheAsTextureRenderGroup;
    t && !t.textureNeedsUpdate && t.updateCacheTexture();
  }
  reset() {
    this.renderGroupChildren.length = 0;
    for (const t in this.childrenToUpdate) {
      const e = this.childrenToUpdate[t];
      e.list.fill(null), e.index = 0;
    }
    this.childrenRenderablesToUpdate.index = 0, this.childrenRenderablesToUpdate.list.fill(null), this.root = null, this.updateTick = 0, this.structureDidChange = !0, this._onRenderContainers.length = 0, this.renderGroupParent = null, this.disableCacheAsTexture();
  }
  get localTransform() {
    return this.root.localTransform;
  }
  addRenderGroupChild(t) {
    t.renderGroupParent && t.renderGroupParent._removeRenderGroupChild(t), t.renderGroupParent = this, this.renderGroupChildren.push(t);
  }
  _removeRenderGroupChild(t) {
    const e = this.renderGroupChildren.indexOf(t);
    e > -1 && this.renderGroupChildren.splice(e, 1), t.renderGroupParent = null;
  }
  addChild(t) {
    if (this.structureDidChange = !0, t.parentRenderGroup = this, t.updateTick = -1, t.parent === this.root ? t.relativeRenderGroupDepth = 1 : t.relativeRenderGroupDepth = t.parent.relativeRenderGroupDepth + 1, t.didChange = !0, this.onChildUpdate(t), t.renderGroup) {
      this.addRenderGroupChild(t.renderGroup);
      return;
    }
    t._onRender && this.addOnRender(t);
    const e = t.children;
    for (let s = 0; s < e.length; s++)
      this.addChild(e[s]);
  }
  removeChild(t) {
    if (this.structureDidChange = !0, t._onRender && (t.renderGroup || this.removeOnRender(t)), t.parentRenderGroup = null, t.renderGroup) {
      this._removeRenderGroupChild(t.renderGroup);
      return;
    }
    const e = t.children;
    for (let s = 0; s < e.length; s++)
      this.removeChild(e[s]);
  }
  removeChildren(t) {
    for (let e = 0; e < t.length; e++)
      this.removeChild(t[e]);
  }
  onChildUpdate(t) {
    let e = this.childrenToUpdate[t.relativeRenderGroupDepth];
    e || (e = this.childrenToUpdate[t.relativeRenderGroupDepth] = {
      index: 0,
      list: []
    }), e.list[e.index++] = t;
  }
  updateRenderable(t) {
    t.globalDisplayStatus < 7 || (this.instructionSet.renderPipes[t.renderPipeId].updateRenderable(t), t.didViewUpdate = !1);
  }
  onChildViewUpdate(t) {
    this.childrenRenderablesToUpdate.list[this.childrenRenderablesToUpdate.index++] = t;
  }
  get isRenderable() {
    return this.root.localDisplayStatus === 7 && this.worldAlpha > 0;
  }
  /**
   * adding a container to the onRender list will make sure the user function
   * passed in to the user defined 'onRender` callBack
   * @param container - the container to add to the onRender list
   */
  addOnRender(t) {
    this._onRenderContainers.push(t);
  }
  removeOnRender(t) {
    this._onRenderContainers.splice(this._onRenderContainers.indexOf(t), 1);
  }
  runOnRender(t) {
    for (let e = 0; e < this._onRenderContainers.length; e++)
      this._onRenderContainers[e]._onRender(t);
  }
  destroy() {
    this.disableCacheAsTexture(), this.renderGroupParent = null, this.root = null, this.childrenRenderablesToUpdate = null, this.childrenToUpdate = null, this.renderGroupChildren = null, this._onRenderContainers = null, this.instructionSet = null;
  }
  getChildren(t = []) {
    const e = this.root.children;
    for (let s = 0; s < e.length; s++)
      this._getChildren(e[s], t);
    return t;
  }
  _getChildren(t, e = []) {
    if (e.push(t), t.renderGroup)
      return e;
    const s = t.children;
    for (let i = 0; i < s.length; i++)
      this._getChildren(s[i], e);
    return e;
  }
  invalidateMatrices() {
    this._matrixDirty = 7;
  }
  /**
   * Returns the inverse of the world transform matrix.
   * @returns {Matrix} The inverse of the world transform matrix.
   */
  get inverseWorldTransform() {
    return (this._matrixDirty & 1) === 0 ? this._inverseWorldTransform : (this._matrixDirty &= -2, this._inverseWorldTransform || (this._inverseWorldTransform = new F()), this._inverseWorldTransform.copyFrom(this.worldTransform).invert());
  }
  /**
   * Returns the inverse of the texture offset transform matrix.
   * @returns {Matrix} The inverse of the texture offset transform matrix.
   */
  get textureOffsetInverseTransform() {
    return (this._matrixDirty & 2) === 0 ? this._textureOffsetInverseTransform : (this._matrixDirty &= -3, this._textureOffsetInverseTransform || (this._textureOffsetInverseTransform = new F()), this._textureOffsetInverseTransform.copyFrom(this.inverseWorldTransform).translate(
      -this._textureBounds.x,
      -this._textureBounds.y
    ));
  }
  /**
   * Returns the inverse of the parent texture transform matrix.
   * This is used to properly transform coordinates when rendering into cached textures.
   * @returns {Matrix} The inverse of the parent texture transform matrix.
   */
  get inverseParentTextureTransform() {
    if ((this._matrixDirty & 4) === 0)
      return this._inverseParentTextureTransform;
    this._matrixDirty &= -5;
    const t = this._parentCacheAsTextureRenderGroup;
    return t ? (this._inverseParentTextureTransform || (this._inverseParentTextureTransform = new F()), this._inverseParentTextureTransform.copyFrom(this.worldTransform).prepend(t.inverseWorldTransform).translate(
      -t._textureBounds.x,
      -t._textureBounds.y
    )) : this.worldTransform;
  }
  /**
   * Returns a matrix that transforms coordinates to the correct coordinate space of the texture being rendered to.
   * This is the texture offset inverse transform of the closest parent RenderGroup that is cached as a texture.
   * @returns {Matrix | null} The transform matrix for the cached texture coordinate space,
   * or null if no parent is cached as texture.
   */
  get cacheToLocalTransform() {
    return this.isCachedAsTexture ? this.textureOffsetInverseTransform : this._parentCacheAsTextureRenderGroup ? this._parentCacheAsTextureRenderGroup.textureOffsetInverseTransform : null;
  }
}
function Go(r, t, e = {}) {
  for (const s in t)
    !e[s] && t[s] !== void 0 && (r[s] = t[s]);
}
const ms = new Z(null), Le = new Z(null), ys = new Z(null, 1, 1), Fe = new Z(null), Ai = 1, Do = 2, xs = 4;
class q extends xt {
  constructor(t = {}) {
    super(), this.uid = U("renderable"), this._updateFlags = 15, this.renderGroup = null, this.parentRenderGroup = null, this.parentRenderGroupIndex = 0, this.didChange = !1, this.didViewUpdate = !1, this.relativeRenderGroupDepth = 0, this.children = [], this.parent = null, this.includeInBuild = !0, this.measurable = !0, this.isSimple = !0, this.parentRenderLayer = null, this.updateTick = -1, this.localTransform = new F(), this.relativeGroupTransform = new F(), this.groupTransform = this.relativeGroupTransform, this.destroyed = !1, this._position = new Z(this, 0, 0), this._scale = ys, this._pivot = Le, this._origin = Fe, this._skew = ms, this._cx = 1, this._sx = 0, this._cy = 0, this._sy = 1, this._rotation = 0, this.localColor = 16777215, this.localAlpha = 1, this.groupAlpha = 1, this.groupColor = 16777215, this.groupColorAlpha = 4294967295, this.localBlendMode = "inherit", this.groupBlendMode = "normal", this.localDisplayStatus = 7, this.globalDisplayStatus = 7, this._didContainerChangeTick = 0, this._didViewChangeTick = 0, this._didLocalTransformChangeId = -1, this.effects = [], Go(this, t, {
      children: !0,
      parent: !0,
      effects: !0
    }), t.children?.forEach((e) => this.addChild(e)), t.parent?.addChild(this);
  }
  /**
   * Mixes all enumerable properties and methods from a source object to Container.
   * @param source - The source of properties and methods to mix in.
   * @deprecated since 8.8.0
   */
  static mixin(t) {
    B("8.8.0", "Container.mixin is deprecated, please use extensions.mixin instead."), ht.mixin(q, t);
  }
  // = 'default';
  /**
   * We now use the _didContainerChangeTick and _didViewChangeTick to track changes
   * @deprecated since 8.2.6
   * @ignore
   */
  set _didChangeId(t) {
    this._didViewChangeTick = t >> 12 & 4095, this._didContainerChangeTick = t & 4095;
  }
  /** @ignore */
  get _didChangeId() {
    return this._didContainerChangeTick & 4095 | (this._didViewChangeTick & 4095) << 12;
  }
  /**
   * Adds one or more children to the container.
   * The children will be rendered as part of this container's display list.
   * @example
   * ```ts
   * // Add a single child
   * container.addChild(sprite);
   *
   * // Add multiple children
   * container.addChild(background, player, foreground);
   *
   * // Add with type checking
   * const sprite = container.addChild<Sprite>(new Sprite(texture));
   * sprite.tint = 'red';
   * ```
   * @param children - The Container(s) to add to the container
   * @returns The first child that was added
   * @see {@link Container#removeChild} For removing children
   * @see {@link Container#addChildAt} For adding at specific index
   */
  addChild(...t) {
    if (this.allowChildren || B(W, "addChild: Only Containers will be allowed to add children in v8.0.0"), t.length > 1) {
      for (let i = 0; i < t.length; i++)
        this.addChild(t[i]);
      return t[0];
    }
    const e = t[0], s = this.renderGroup || this.parentRenderGroup;
    return e.parent === this ? (this.children.splice(this.children.indexOf(e), 1), this.children.push(e), s && (s.structureDidChange = !0), e) : (e.parent && e.parent.removeChild(e), this.children.push(e), this.sortableChildren && (this.sortDirty = !0), e.parent = this, e.didChange = !0, e._updateFlags = 15, s && s.addChild(e), this.emit("childAdded", e, this, this.children.length - 1), e.emit("added", this), this._didViewChangeTick++, e._zIndex !== 0 && e.depthOfChildModified(), e);
  }
  /**
   * Removes one or more children from the container.
   * When removing multiple children, events will be triggered for each child in sequence.
   * @example
   * ```ts
   * // Remove a single child
   * const removed = container.removeChild(sprite);
   *
   * // Remove multiple children
   * const bg = container.removeChild(background, player, userInterface);
   *
   * // Remove with type checking
   * const sprite = container.removeChild<Sprite>(childSprite);
   * sprite.texture = newTexture;
   * ```
   * @param children - The Container(s) to remove
   * @returns The first child that was removed
   * @see {@link Container#addChild} For adding children
   * @see {@link Container#removeChildren} For removing multiple children
   */
  removeChild(...t) {
    if (t.length > 1) {
      for (let i = 0; i < t.length; i++)
        this.removeChild(t[i]);
      return t[0];
    }
    const e = t[0], s = this.children.indexOf(e);
    return s > -1 && (this._didViewChangeTick++, this.children.splice(s, 1), this.renderGroup ? this.renderGroup.removeChild(e) : this.parentRenderGroup && this.parentRenderGroup.removeChild(e), e.parentRenderLayer && e.parentRenderLayer.detach(e), e.parent = null, this.emit("childRemoved", e, this, s), e.emit("removed", this)), e;
  }
  /** @ignore */
  _onUpdate(t) {
    t && t === this._skew && this._updateSkew(), this._didContainerChangeTick++, !this.didChange && (this.didChange = !0, this.parentRenderGroup && this.parentRenderGroup.onChildUpdate(this));
  }
  set isRenderGroup(t) {
    !!this.renderGroup !== t && (t ? this.enableRenderGroup() : this.disableRenderGroup());
  }
  /**
   * Returns true if this container is a render group.
   * This means that it will be rendered as a separate pass, with its own set of instructions
   * @advanced
   */
  get isRenderGroup() {
    return !!this.renderGroup;
  }
  /**
   * Calling this enables a render group for this container.
   * This means it will be rendered as a separate set of instructions.
   * The transform of the container will also be handled on the GPU rather than the CPU.
   * @advanced
   */
  enableRenderGroup() {
    if (this.renderGroup)
      return;
    const t = this.parentRenderGroup;
    t?.removeChild(this), this.renderGroup = at.get(Bo, this), this.groupTransform = F.IDENTITY, t?.addChild(this), this._updateIsSimple();
  }
  /**
   * This will disable the render group for this container.
   * @advanced
   */
  disableRenderGroup() {
    if (!this.renderGroup)
      return;
    const t = this.parentRenderGroup;
    t?.removeChild(this), at.return(this.renderGroup), this.renderGroup = null, this.groupTransform = this.relativeGroupTransform, t?.addChild(this), this._updateIsSimple();
  }
  /** @ignore */
  _updateIsSimple() {
    this.isSimple = !this.renderGroup && this.effects.length === 0;
  }
  /**
   * Current transform of the object based on world (parent) factors.
   *
   * This matrix represents the absolute transformation in the scene graph.
   * @example
   * ```ts
   * // Get world position
   * const worldPos = container.worldTransform;
   * console.log(`World position: (${worldPos.tx}, ${worldPos.ty})`);
   * ```
   * @readonly
   * @see {@link Container#localTransform} For local space transform
   */
  get worldTransform() {
    return this._worldTransform || (this._worldTransform = new F()), this.renderGroup ? this._worldTransform.copyFrom(this.renderGroup.worldTransform) : this.parentRenderGroup && this._worldTransform.appendFrom(this.relativeGroupTransform, this.parentRenderGroup.worldTransform), this._worldTransform;
  }
  /**
   * The position of the container on the x axis relative to the local coordinates of the parent.
   *
   * An alias to position.x
   * @example
   * ```ts
   * // Basic position
   * container.x = 100;
   * ```
   */
  get x() {
    return this._position.x;
  }
  set x(t) {
    this._position.x = t;
  }
  /**
   * The position of the container on the y axis relative to the local coordinates of the parent.
   *
   * An alias to position.y
   * @example
   * ```ts
   * // Basic position
   * container.y = 200;
   * ```
   */
  get y() {
    return this._position.y;
  }
  set y(t) {
    this._position.y = t;
  }
  /**
   * The coordinate of the object relative to the local coordinates of the parent.
   * @example
   * ```ts
   * // Basic position setting
   * container.position.set(100, 200);
   * container.position.set(100); // Sets both x and y to 100
   * // Using point data
   * container.position = { x: 50, y: 75 };
   * ```
   * @since 4.0.0
   */
  get position() {
    return this._position;
  }
  set position(t) {
    this._position.copyFrom(t);
  }
  /**
   * The rotation of the object in radians.
   *
   * > [!NOTE] 'rotation' and 'angle' have the same effect on a display object;
   * > rotation is in radians, angle is in degrees.
   * @example
   * ```ts
   * // Basic rotation
   * container.rotation = Math.PI / 4; // 45 degrees
   *
   * // Convert from degrees
   * const degrees = 45;
   * container.rotation = degrees * Math.PI / 180;
   *
   * // Rotate around center
   * container.pivot.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // 180 degrees
   *
   * // Rotate around center with origin
   * container.origin.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // 180 degrees
   * ```
   */
  get rotation() {
    return this._rotation;
  }
  set rotation(t) {
    this._rotation !== t && (this._rotation = t, this._onUpdate(this._skew));
  }
  /**
   * The angle of the object in degrees.
   *
   * > [!NOTE] 'rotation' and 'angle' have the same effect on a display object;
   * > rotation is in radians, angle is in degrees.
   * @example
   * ```ts
   * // Basic angle rotation
   * sprite.angle = 45; // 45 degrees
   *
   * // Rotate around center
   * sprite.pivot.set(sprite.width / 2, sprite.height / 2);
   * sprite.angle = 180; // Half rotation
   *
   * // Rotate around center with origin
   * sprite.origin.set(sprite.width / 2, sprite.height / 2);
   * sprite.angle = 180; // Half rotation
   *
   * // Reset rotation
   * sprite.angle = 0;
   * ```
   */
  get angle() {
    return this.rotation * Kn;
  }
  set angle(t) {
    this.rotation = t * Zn;
  }
  /**
   * The center of rotation, scaling, and skewing for this display object in its local space.
   * The `position` is the projection of `pivot` in the parent's local space.
   *
   * By default, the pivot is the origin (0, 0).
   * @example
   * ```ts
   * // Rotate around center
   * container.pivot.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // Rotates around center
   * ```
   * @since 4.0.0
   */
  get pivot() {
    return this._pivot === Le && (this._pivot = new Z(this, 0, 0)), this._pivot;
  }
  set pivot(t) {
    this._pivot === Le && (this._pivot = new Z(this, 0, 0), this._origin !== Fe && J("Setting both a pivot and origin on a Container is not recommended. This can lead to unexpected behavior if not handled carefully.")), typeof t == "number" ? this._pivot.set(t) : this._pivot.copyFrom(t);
  }
  /**
   * The skew factor for the object in radians. Skewing is a transformation that distorts
   * the object by rotating it differently at each point, creating a non-uniform shape.
   * @example
   * ```ts
   * // Basic skewing
   * container.skew.set(0.5, 0); // Skew horizontally
   * container.skew.set(0, 0.5); // Skew vertically
   *
   * // Skew with point data
   * container.skew = { x: 0.3, y: 0.3 }; // Diagonal skew
   *
   * // Reset skew
   * container.skew.set(0, 0);
   *
   * // Animate skew
   * app.ticker.add(() => {
   *     // Create wave effect
   *     container.skew.x = Math.sin(Date.now() / 1000) * 0.3;
   * });
   *
   * // Combine with rotation
   * container.rotation = Math.PI / 4; // 45 degrees
   * container.skew.set(0.2, 0.2); // Skew the rotated object
   * ```
   * @since 4.0.0
   * @type {ObservablePoint} Point-like object with x/y properties in radians
   * @default {x: 0, y: 0}
   */
  get skew() {
    return this._skew === ms && (this._skew = new Z(this, 0, 0)), this._skew;
  }
  set skew(t) {
    this._skew === ms && (this._skew = new Z(this, 0, 0)), this._skew.copyFrom(t);
  }
  /**
   * The scale factors of this object along the local coordinate axes.
   *
   * The default scale is (1, 1).
   * @example
   * ```ts
   * // Basic scaling
   * container.scale.set(2, 2); // Scales to double size
   * container.scale.set(2); // Scales uniformly to double size
   * container.scale = 2; // Scales uniformly to double size
   * // Scale to a specific width and height
   * container.setSize(200, 100); // Sets width to 200 and height to 100
   * ```
   * @since 4.0.0
   */
  get scale() {
    return this._scale === ys && (this._scale = new Z(this, 1, 1)), this._scale;
  }
  set scale(t) {
    this._scale === ys && (this._scale = new Z(this, 0, 0)), typeof t == "string" && (t = parseFloat(t)), typeof t == "number" ? this._scale.set(t) : this._scale.copyFrom(t);
  }
  /**
   * @experimental
   * The origin point around which the container rotates and scales without affecting its position.
   * Unlike pivot, changing the origin will not move the container's position.
   * @example
   * ```ts
   * // Rotate around center point
   * container.origin.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // Rotates around center
   *
   * // Reset origin
   * container.origin.set(0, 0);
   * ```
   */
  get origin() {
    return this._origin === Fe && (this._origin = new Z(this, 0, 0)), this._origin;
  }
  set origin(t) {
    this._origin === Fe && (this._origin = new Z(this, 0, 0), this._pivot !== Le && J("Setting both a pivot and origin on a Container is not recommended. This can lead to unexpected behavior if not handled carefully.")), typeof t == "number" ? this._origin.set(t) : this._origin.copyFrom(t);
  }
  /**
   * The width of the Container, setting this will actually modify the scale to achieve the value set.
   * > [!NOTE] Changing the width will adjust the scale.x property of the container while maintaining its aspect ratio.
   * > [!NOTE] If you want to set both width and height at the same time, use {@link Container#setSize}
   * as it is more optimized by not recalculating the local bounds twice.
   * @example
   * ```ts
   * // Basic width setting
   * container.width = 100;
   * // Optimized width setting
   * container.setSize(100, 100);
   * ```
   */
  get width() {
    return Math.abs(this.scale.x * this.getLocalBounds().width);
  }
  set width(t) {
    const e = this.getLocalBounds().width;
    this._setWidth(t, e);
  }
  /**
   * The height of the Container,
   * > [!NOTE] Changing the height will adjust the scale.y property of the container while maintaining its aspect ratio.
   * > [!NOTE] If you want to set both width and height at the same time, use {@link Container#setSize}
   * as it is more optimized by not recalculating the local bounds twice.
   * @example
   * ```ts
   * // Basic height setting
   * container.height = 200;
   * // Optimized height setting
   * container.setSize(100, 200);
   * ```
   */
  get height() {
    return Math.abs(this.scale.y * this.getLocalBounds().height);
  }
  set height(t) {
    const e = this.getLocalBounds().height;
    this._setHeight(t, e);
  }
  /**
   * Retrieves the size of the container as a [Size]{@link Size} object.
   *
   * This is faster than get the width and height separately.
   * @example
   * ```ts
   * // Basic size retrieval
   * const size = container.getSize();
   * console.log(`Size: ${size.width}x${size.height}`);
   *
   * // Reuse existing size object
   * const reuseSize = { width: 0, height: 0 };
   * container.getSize(reuseSize);
   * ```
   * @param out - Optional object to store the size in.
   * @returns The size of the container.
   */
  getSize(t) {
    t || (t = {});
    const e = this.getLocalBounds();
    return t.width = Math.abs(this.scale.x * e.width), t.height = Math.abs(this.scale.y * e.height), t;
  }
  /**
   * Sets the size of the container to the specified width and height.
   * This is more efficient than setting width and height separately as it only recalculates bounds once.
   * @example
   * ```ts
   * // Basic size setting
   * container.setSize(100, 200);
   *
   * // Set uniform size
   * container.setSize(100); // Sets both width and height to 100
   * ```
   * @param value - This can be either a number or a [Size]{@link Size} object.
   * @param height - The height to set. Defaults to the value of `width` if not provided.
   */
  setSize(t, e) {
    const s = this.getLocalBounds();
    typeof t == "object" ? (e = t.height ?? t.width, t = t.width) : e ?? (e = t), t !== void 0 && this._setWidth(t, s.width), e !== void 0 && this._setHeight(e, s.height);
  }
  /** Called when the skew or the rotation changes. */
  _updateSkew() {
    const t = this._rotation, e = this._skew;
    this._cx = Math.cos(t + e._y), this._sx = Math.sin(t + e._y), this._cy = -Math.sin(t - e._x), this._sy = Math.cos(t - e._x);
  }
  /**
   * Updates the transform properties of the container.
   * Allows partial updates of transform properties for optimized manipulation.
   * @example
   * ```ts
   * // Basic transform update
   * container.updateTransform({
   *     x: 100,
   *     y: 200,
   *     rotation: Math.PI / 4
   * });
   *
   * // Scale and rotate around center
   * sprite.updateTransform({
   *     pivotX: sprite.width / 2,
   *     pivotY: sprite.height / 2,
   *     scaleX: 2,
   *     scaleY: 2,
   *     rotation: Math.PI
   * });
   *
   * // Update position only
   * button.updateTransform({
   *     x: button.x + 10, // Move right
   *     y: button.y      // Keep same y
   * });
   * ```
   * @param opts - Transform options to update
   * @param opts.x - The x position
   * @param opts.y - The y position
   * @param opts.scaleX - The x-axis scale factor
   * @param opts.scaleY - The y-axis scale factor
   * @param opts.rotation - The rotation in radians
   * @param opts.skewX - The x-axis skew factor
   * @param opts.skewY - The y-axis skew factor
   * @param opts.pivotX - The x-axis pivot point
   * @param opts.pivotY - The y-axis pivot point
   * @returns This container, for chaining
   * @see {@link Container#setFromMatrix} For matrix-based transforms
   * @see {@link Container#position} For direct position access
   */
  updateTransform(t) {
    return this.position.set(
      typeof t.x == "number" ? t.x : this.position.x,
      typeof t.y == "number" ? t.y : this.position.y
    ), this.scale.set(
      typeof t.scaleX == "number" ? t.scaleX || 1 : this.scale.x,
      typeof t.scaleY == "number" ? t.scaleY || 1 : this.scale.y
    ), this.rotation = typeof t.rotation == "number" ? t.rotation : this.rotation, this.skew.set(
      typeof t.skewX == "number" ? t.skewX : this.skew.x,
      typeof t.skewY == "number" ? t.skewY : this.skew.y
    ), this.pivot.set(
      typeof t.pivotX == "number" ? t.pivotX : this.pivot.x,
      typeof t.pivotY == "number" ? t.pivotY : this.pivot.y
    ), this.origin.set(
      typeof t.originX == "number" ? t.originX : this.origin.x,
      typeof t.originY == "number" ? t.originY : this.origin.y
    ), this;
  }
  /**
   * Updates the local transform properties by decomposing the given matrix.
   * Extracts position, scale, rotation, and skew from a transformation matrix.
   * @example
   * ```ts
   * // Basic matrix transform
   * const matrix = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4)
   *     .scale(2, 2);
   *
   * container.setFromMatrix(matrix);
   *
   * // Copy transform from another container
   * const source = new Container();
   * source.position.set(100, 100);
   * source.rotation = Math.PI / 2;
   *
   * target.setFromMatrix(source.localTransform);
   *
   * // Reset transform
   * container.setFromMatrix(Matrix.IDENTITY);
   * ```
   * @param matrix - The matrix to use for updating the transform
   * @see {@link Container#updateTransform} For property-based updates
   * @see {@link Matrix#decompose} For matrix decomposition details
   */
  setFromMatrix(t) {
    t.decompose(this);
  }
  /** Updates the local transform. */
  updateLocalTransform() {
    const t = this._didContainerChangeTick;
    if (this._didLocalTransformChangeId === t)
      return;
    this._didLocalTransformChangeId = t;
    const e = this.localTransform, s = this._scale, i = this._pivot, n = this._origin, o = this._position, a = s._x, h = s._y, l = i._x, c = i._y, d = -n._x, f = -n._y;
    e.a = this._cx * a, e.b = this._sx * a, e.c = this._cy * h, e.d = this._sy * h, e.tx = o._x - (l * e.a + c * e.c) + (d * e.a + f * e.c) - d, e.ty = o._y - (l * e.b + c * e.d) + (d * e.b + f * e.d) - f;
  }
  // / ///// color related stuff
  set alpha(t) {
    t !== this.localAlpha && (this.localAlpha = t, this._updateFlags |= Ai, this._onUpdate());
  }
  /**
   * The opacity of the object relative to its parent's opacity.
   * Value ranges from 0 (fully transparent) to 1 (fully opaque).
   * @example
   * ```ts
   * // Basic transparency
   * sprite.alpha = 0.5; // 50% opacity
   *
   * // Inherited opacity
   * container.alpha = 0.5;
   * const child = new Sprite(texture);
   * child.alpha = 0.5;
   * container.addChild(child);
   * // child's effective opacity is 0.25 (0.5 * 0.5)
   * ```
   * @default 1
   * @see {@link Container#visible} For toggling visibility
   * @see {@link Container#renderable} For render control
   */
  get alpha() {
    return this.localAlpha;
  }
  set tint(t) {
    const s = V.shared.setValue(t ?? 16777215).toBgrNumber();
    s !== this.localColor && (this.localColor = s, this._updateFlags |= Ai, this._onUpdate());
  }
  /**
   * The tint applied to the sprite.
   *
   * This can be any valid {@link ColorSource}.
   * @example
   * ```ts
   * // Basic color tinting
   * container.tint = 0xff0000; // Red tint
   * container.tint = 'red';    // Same as above
   * container.tint = '#00ff00'; // Green
   * container.tint = 'rgb(0,0,255)'; // Blue
   *
   * // Remove tint
   * container.tint = 0xffffff; // White = no tint
   * container.tint = null;     // Also removes tint
   * ```
   * @default 0xFFFFFF
   * @see {@link Container#alpha} For transparency
   * @see {@link Container#visible} For visibility control
   */
  get tint() {
    return Ue(this.localColor);
  }
  // / //////////////// blend related stuff
  set blendMode(t) {
    this.localBlendMode !== t && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= Do, this.localBlendMode = t, this._onUpdate());
  }
  /**
   * The blend mode to be applied to the sprite. Controls how pixels are blended when rendering.
   *
   * Setting to 'normal' will reset to default blending.
   * > [!NOTE] More blend modes are available after importing the `pixi.js/advanced-blend-modes` sub-export.
   * @example
   * ```ts
   * // Basic blend modes
   * sprite.blendMode = 'add';        // Additive blending
   * sprite.blendMode = 'multiply';   // Multiply colors
   * sprite.blendMode = 'screen';     // Screen blend
   *
   * // Reset blend mode
   * sprite.blendMode = 'normal';     // Normal blending
   * ```
   * @default 'normal'
   * @see {@link Container#alpha} For transparency
   * @see {@link Container#tint} For color adjustments
   */
  get blendMode() {
    return this.localBlendMode;
  }
  // / ///////// VISIBILITY / RENDERABLE /////////////////
  /**
   * The visibility of the object. If false the object will not be drawn,
   * and the transform will not be updated.
   * @example
   * ```ts
   * // Basic visibility toggle
   * sprite.visible = false; // Hide sprite
   * sprite.visible = true;  // Show sprite
   * ```
   * @default true
   * @see {@link Container#renderable} For render-only control
   * @see {@link Container#alpha} For transparency
   */
  get visible() {
    return !!(this.localDisplayStatus & 2);
  }
  set visible(t) {
    const e = t ? 2 : 0;
    (this.localDisplayStatus & 2) !== e && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= xs, this.localDisplayStatus ^= 2, this._onUpdate());
  }
  /** @ignore */
  get culled() {
    return !(this.localDisplayStatus & 4);
  }
  /** @ignore */
  set culled(t) {
    const e = t ? 0 : 4;
    (this.localDisplayStatus & 4) !== e && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= xs, this.localDisplayStatus ^= 4, this._onUpdate());
  }
  /**
   * Controls whether this object can be rendered. If false the object will not be drawn,
   * but the transform will still be updated. This is different from visible, which skips
   * transform updates.
   * @example
   * ```ts
   * // Basic render control
   * sprite.renderable = false; // Skip rendering
   * sprite.renderable = true;  // Enable rendering
   * ```
   * @default true
   * @see {@link Container#visible} For skipping transform updates
   * @see {@link Container#alpha} For transparency
   */
  get renderable() {
    return !!(this.localDisplayStatus & 1);
  }
  set renderable(t) {
    const e = t ? 1 : 0;
    (this.localDisplayStatus & 1) !== e && (this._updateFlags |= xs, this.localDisplayStatus ^= 1, this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._onUpdate());
  }
  /**
   * Whether or not the object should be rendered.
   * @advanced
   */
  get isRenderable() {
    return this.localDisplayStatus === 7 && this.groupAlpha > 0;
  }
  /**
   * Removes all internal references and listeners as well as removes children from the display list.
   * Do not use a Container after calling `destroy`.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * ```ts
   * container.destroy();
   * container.destroy(true);
   * container.destroy({ children: true });
   * container.destroy({ children: true, texture: true, textureSource: true });
   * ```
   */
  destroy(t = !1) {
    if (this.destroyed)
      return;
    this.destroyed = !0;
    let e;
    if (this.children.length && (e = this.removeChildren(0, this.children.length)), this.removeFromParent(), this.parent = null, this._maskEffect = null, this._filterEffect = null, this.effects = null, this._position = null, this._scale = null, this._pivot = null, this._origin = null, this._skew = null, this.emit("destroyed", this), this.removeAllListeners(), (typeof t == "boolean" ? t : t?.children) && e)
      for (let i = 0; i < e.length; ++i)
        e[i].destroy(t);
    this.renderGroup?.destroy(), this.renderGroup = null;
  }
}
ht.mixin(
  q,
  wo,
  Po,
  Lo,
  Io,
  Ao,
  So,
  Co,
  Eo,
  go,
  xo,
  ko,
  _o
);
class Qs extends q {
  constructor(t) {
    super(t), this.canBundle = !0, this.allowChildren = !1, this._roundPixels = 0, this._lastUsed = -1, this._gpuData = /* @__PURE__ */ Object.create(null), this.autoGarbageCollect = !0, this._gcLastUsed = -1, this._bounds = new ut(0, 1, 0, 0), this._boundsDirty = !0, this.autoGarbageCollect = t.autoGarbageCollect ?? !0;
  }
  /**
   * The local bounds of the view in its own coordinate space.
   * Bounds are automatically updated when the view's content changes.
   * @example
   * ```ts
   * // Get bounds dimensions
   * const bounds = view.bounds;
   * console.log(`Width: ${bounds.maxX - bounds.minX}`);
   * console.log(`Height: ${bounds.maxY - bounds.minY}`);
   * ```
   * @returns The rectangular bounds of the view
   * @see {@link Bounds} For bounds operations
   */
  get bounds() {
    return this._boundsDirty ? (this.updateBounds(), this._boundsDirty = !1, this._bounds) : this._bounds;
  }
  /**
   * Whether or not to round the x/y position of the sprite.
   * @example
   * ```ts
   * // Enable pixel rounding for crisp rendering
   * view.roundPixels = true;
   * ```
   * @default false
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  set roundPixels(t) {
    this._roundPixels = t ? 1 : 0;
  }
  /**
   * Checks if the object contains the given point in local coordinates.
   * Uses the view's bounds for hit testing.
   * @example
   * ```ts
   * // Basic point check
   * const localPoint = { x: 50, y: 25 };
   * const contains = view.containsPoint(localPoint);
   * console.log('Point is inside:', contains);
   * ```
   * @param point - The point to check in local coordinates
   * @returns True if the point is within the view's bounds
   * @see {@link ViewContainer#bounds} For the bounds used in hit testing
   * @see {@link Container#toLocal} For converting global coordinates to local
   */
  containsPoint(t) {
    const e = this.bounds, { x: s, y: i } = t;
    return s >= e.minX && s <= e.maxX && i >= e.minY && i <= e.maxY;
  }
  /** @private */
  onViewUpdate() {
    if (this._didViewChangeTick++, this._boundsDirty = !0, this.didViewUpdate)
      return;
    this.didViewUpdate = !0;
    const t = this.renderGroup || this.parentRenderGroup;
    t && t.onChildViewUpdate(this);
  }
  /** Unloads the GPU data from the view. */
  unload() {
    this.emit("unload", this);
    for (const t in this._gpuData)
      this._gpuData[t]?.destroy();
    this._gpuData = /* @__PURE__ */ Object.create(null), this.onViewUpdate();
  }
  destroy(t) {
    this.unload(), super.destroy(t), this._bounds = null;
  }
  /**
   * Collects renderables for the view container.
   * @param instructionSet - The instruction set to collect renderables for.
   * @param renderer - The renderer to collect renderables for.
   * @param currentLayer - The current render layer.
   * @internal
   */
  collectRenderablesSimple(t, e, s) {
    const { renderPipes: i } = e;
    i.blendMode.pushBlendMode(this, this.groupBlendMode, t), i[this.renderPipeId].addRenderable(this, t), this.didViewUpdate = !1;
    const o = this.children, a = o.length;
    for (let h = 0; h < a; h++)
      o[h].collectRenderables(t, e, s);
    i.blendMode.popBlendMode(t);
  }
}
class Jt extends Qs {
  /**
   * @param options - The options for creating the sprite.
   */
  constructor(t = D.EMPTY) {
    t instanceof D && (t = { texture: t });
    const { texture: e = D.EMPTY, anchor: s, roundPixels: i, width: n, height: o, ...a } = t;
    super({
      label: "Sprite",
      ...a
    }), this.renderPipeId = "sprite", this.batched = !0, this._visualBounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, this._anchor = new Z(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    ), s ? this.anchor = s : e.defaultAnchor && (this.anchor = e.defaultAnchor), this.texture = e, this.allowChildren = !1, this.roundPixels = i ?? !1, n !== void 0 && (this.width = n), o !== void 0 && (this.height = o);
  }
  /**
   * Creates a new sprite based on a source texture, image, video, or canvas element.
   * This is a convenience method that automatically creates and manages textures.
   * @example
   * ```ts
   * // Create from path or URL
   * const sprite = Sprite.from('assets/image.png');
   *
   * // Create from existing texture
   * const sprite = Sprite.from(texture);
   *
   * // Create from canvas
   * const canvas = document.createElement('canvas');
   * const sprite = Sprite.from(canvas, true); // Skip caching new texture
   * ```
   * @param source - The source to create the sprite from. Can be a path to an image, a texture,
   * or any valid texture source (canvas, video, etc.)
   * @param skipCache - Whether to skip adding to the texture cache when creating a new texture
   * @returns A new sprite based on the source
   * @see {@link Texture.from} For texture creation details
   * @see {@link Assets} For asset loading and management
   */
  static from(t, e = !1) {
    return t instanceof D ? new Jt(t) : new Jt(D.from(t, e));
  }
  set texture(t) {
    t || (t = D.EMPTY);
    const e = this._texture;
    e !== t && (e && e.dynamic && e.off("update", this.onViewUpdate, this), t.dynamic && t.on("update", this.onViewUpdate, this), this._texture = t, this._width && this._setWidth(this._width, this._texture.orig.width), this._height && this._setHeight(this._height, this._texture.orig.height), this.onViewUpdate());
  }
  /**
   * The texture that is displayed by the sprite. When changed, automatically updates
   * the sprite dimensions and manages texture event listeners.
   * @example
   * ```ts
   * // Create sprite with texture
   * const sprite = new Sprite({
   *     texture: Texture.from('sprite.png')
   * });
   *
   * // Update texture
   * sprite.texture = Texture.from('newSprite.png');
   *
   * // Use texture from spritesheet
   * const sheet = await Assets.load('spritesheet.json');
   * sprite.texture = sheet.textures['frame1.png'];
   *
   * // Reset to empty texture
   * sprite.texture = Texture.EMPTY;
   * ```
   * @see {@link Texture} For texture creation and management
   * @see {@link Assets} For asset loading
   */
  get texture() {
    return this._texture;
  }
  /**
   * The bounds of the sprite, taking into account the texture's trim area.
   * @example
   * ```ts
   * const texture = new Texture({
   *     source: new TextureSource({ width: 300, height: 300 }),
   *     frame: new Rectangle(196, 66, 58, 56),
   *     trim: new Rectangle(4, 4, 58, 56),
   *     orig: new Rectangle(0, 0, 64, 64),
   *     rotate: 2,
   * });
   * const sprite = new Sprite(texture);
   * const visualBounds = sprite.visualBounds;
   * // console.log(visualBounds); // { minX: -4, maxX: 62, minY: -4, maxY: 60 }
   */
  get visualBounds() {
    return ro(this._visualBounds, this._anchor, this._texture), this._visualBounds;
  }
  /**
   * @deprecated
   * @ignore
   */
  get sourceBounds() {
    return B("8.6.1", "Sprite.sourceBounds is deprecated, use visualBounds instead."), this.visualBounds;
  }
  /** @private */
  updateBounds() {
    const t = this._anchor, e = this._texture, s = this._bounds, { width: i, height: n } = e.orig;
    s.minX = -t._x * i, s.maxX = s.minX + i, s.minY = -t._y * n, s.maxY = s.minY + n;
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * sprite.destroy();
   * sprite.destroy(true);
   * sprite.destroy({ texture: true, textureSource: true });
   */
  destroy(t = !1) {
    if (super.destroy(t), typeof t == "boolean" ? t : t?.texture) {
      const s = typeof t == "boolean" ? t : t?.textureSource;
      this._texture.destroy(s);
    }
    this._texture = null, this._visualBounds = null, this._bounds = null, this._anchor = null;
  }
  /**
   * The anchor sets the origin point of the sprite. The default value is taken from the {@link Texture}
   * and passed to the constructor.
   *
   * - The default is `(0,0)`, this means the sprite's origin is the top left.
   * - Setting the anchor to `(0.5,0.5)` means the sprite's origin is centered.
   * - Setting the anchor to `(1,1)` would mean the sprite's origin point will be the bottom right corner.
   *
   * If you pass only single parameter, it will set both x and y to the same value as shown in the example below.
   * @example
   * ```ts
   * // Center the anchor point
   * sprite.anchor = 0.5; // Sets both x and y to 0.5
   * sprite.position.set(400, 300); // Sprite will be centered at this position
   *
   * // Set specific x/y anchor points
   * sprite.anchor = {
   *     x: 1, // Right edge
   *     y: 0  // Top edge
   * };
   *
   * // Using individual coordinates
   * sprite.anchor.set(0.5, 1); // Center-bottom
   *
   * // For rotation around center
   * sprite.anchor.set(0.5);
   * sprite.rotation = Math.PI / 4; // 45 degrees around center
   *
   * // For scaling from center
   * sprite.anchor.set(0.5);
   * sprite.scale.set(2); // Scales from center point
   * ```
   */
  get anchor() {
    return this._anchor;
  }
  set anchor(t) {
    typeof t == "number" ? this._anchor.set(t) : this._anchor.copyFrom(t);
  }
  /**
   * The width of the sprite, setting this will actually modify the scale to achieve the value set.
   * @example
   * ```ts
   * // Set width directly
   * sprite.width = 200;
   * console.log(sprite.scale.x); // Scale adjusted to match width
   *
   * // Set width while preserving aspect ratio
   * const ratio = sprite.height / sprite.width;
   * sprite.width = 300;
   * sprite.height = 300 * ratio;
   *
   * // For better performance when setting both width and height
   * sprite.setSize(300, 400); // Avoids recalculating bounds twice
   *
   * // Reset to original texture size
   * sprite.width = sprite.texture.orig.width;
   * ```
   */
  get width() {
    return Math.abs(this.scale.x) * this._texture.orig.width;
  }
  set width(t) {
    this._setWidth(t, this._texture.orig.width), this._width = t;
  }
  /**
   * The height of the sprite, setting this will actually modify the scale to achieve the value set.
   * @example
   * ```ts
   * // Set height directly
   * sprite.height = 150;
   * console.log(sprite.scale.y); // Scale adjusted to match height
   *
   * // Set height while preserving aspect ratio
   * const ratio = sprite.width / sprite.height;
   * sprite.height = 200;
   * sprite.width = 200 * ratio;
   *
   * // For better performance when setting both width and height
   * sprite.setSize(300, 400); // Avoids recalculating bounds twice
   *
   * // Reset to original texture size
   * sprite.height = sprite.texture.orig.height;
   * ```
   */
  get height() {
    return Math.abs(this.scale.y) * this._texture.orig.height;
  }
  set height(t) {
    this._setHeight(t, this._texture.orig.height), this._height = t;
  }
  /**
   * Retrieves the size of the Sprite as a [Size]{@link Size} object based on the texture dimensions and scale.
   * This is faster than getting width and height separately as it only calculates the bounds once.
   * @example
   * ```ts
   * // Basic size retrieval
   * const sprite = new Sprite(Texture.from('sprite.png'));
   * const size = sprite.getSize();
   * console.log(`Size: ${size.width}x${size.height}`);
   *
   * // Reuse existing size object
   * const reuseSize = { width: 0, height: 0 };
   * sprite.getSize(reuseSize);
   * ```
   * @param out - Optional object to store the size in, to avoid allocating a new object
   * @returns The size of the Sprite
   * @see {@link Sprite#width} For getting just the width
   * @see {@link Sprite#height} For getting just the height
   * @see {@link Sprite#setSize} For setting both width and height
   */
  getSize(t) {
    return t || (t = {}), t.width = Math.abs(this.scale.x) * this._texture.orig.width, t.height = Math.abs(this.scale.y) * this._texture.orig.height, t;
  }
  /**
   * Sets the size of the Sprite to the specified width and height.
   * This is faster than setting width and height separately as it only recalculates bounds once.
   * @example
   * ```ts
   * // Basic size setting
   * const sprite = new Sprite(Texture.from('sprite.png'));
   * sprite.setSize(100, 200); // Width: 100, Height: 200
   *
   * // Set uniform size
   * sprite.setSize(100); // Sets both width and height to 100
   *
   * // Set size with object
   * sprite.setSize({
   *     width: 200,
   *     height: 300
   * });
   *
   * // Reset to texture size
   * sprite.setSize(
   *     sprite.texture.orig.width,
   *     sprite.texture.orig.height
   * );
   * ```
   * @param value - This can be either a number or a {@link Size} object
   * @param height - The height to set. Defaults to the value of `width` if not provided
   * @see {@link Sprite#width} For setting width only
   * @see {@link Sprite#height} For setting height only
   * @see {@link Sprite#texture} For the source dimensions
   */
  setSize(t, e) {
    typeof t == "object" ? (e = t.height ?? t.width, t = t.width) : e ?? (e = t), t !== void 0 && this._setWidth(t, this._texture.orig.width), e !== void 0 && this._setHeight(e, this._texture.orig.height);
  }
}
const zo = new ut();
function Hr(r, t, e) {
  const s = zo;
  r.measurable = !0, Fr(r, e, s), t.addBoundsMask(s), r.measurable = !1;
}
function Or(r, t, e) {
  const s = _t.get();
  r.measurable = !0;
  const i = Q.get().identity(), n = Wr(r, e, i);
  Gr(r, s, n), r.measurable = !1, t.addBoundsMask(s), Q.return(i), _t.return(s);
}
function Wr(r, t, e) {
  return r ? (r !== t && (Wr(r.parent, t, e), r.updateLocalTransform(), e.append(r.localTransform)), e) : (J("Mask bounds, renderable is not inside the root container"), e);
}
class Ur {
  constructor(t) {
    this.priority = 0, this.inverse = !1, this.pipe = "alphaMask", t?.mask && this.init(t.mask);
  }
  init(t) {
    this.mask = t, this.renderMaskToTexture = !(t instanceof Jt), this.mask.renderable = this.renderMaskToTexture, this.mask.includeInBuild = !this.renderMaskToTexture, this.mask.measurable = !1;
  }
  reset() {
    this.mask !== null && (this.mask.measurable = !0, this.mask = null);
  }
  addBounds(t, e) {
    this.inverse || Hr(this.mask, t, e);
  }
  addLocalBounds(t, e) {
    Or(this.mask, t, e);
  }
  containsPoint(t, e) {
    const s = this.mask;
    return e(s, t);
  }
  destroy() {
    this.reset();
  }
  static test(t) {
    return t instanceof Jt;
  }
}
Ur.extension = z.MaskEffect;
class $r {
  constructor(t) {
    this.priority = 0, this.pipe = "colorMask", t?.mask && this.init(t.mask);
  }
  init(t) {
    this.mask = t;
  }
  destroy() {
  }
  static test(t) {
    return typeof t == "number";
  }
}
$r.extension = z.MaskEffect;
class jr {
  constructor(t) {
    this.priority = 0, this.pipe = "stencilMask", t?.mask && this.init(t.mask);
  }
  init(t) {
    this.mask = t, this.mask.includeInBuild = !1, this.mask.measurable = !1;
  }
  reset() {
    this.mask !== null && (this.mask.measurable = !0, this.mask.includeInBuild = !0, this.mask = null);
  }
  addBounds(t, e) {
    Hr(this.mask, t, e);
  }
  addLocalBounds(t, e) {
    Or(this.mask, t, e);
  }
  containsPoint(t, e) {
    const s = this.mask;
    return e(s, t);
  }
  destroy() {
    this.reset();
  }
  static test(t) {
    return t instanceof q;
  }
}
jr.extension = z.MaskEffect;
const Yo = {
  createCanvas: (r, t) => {
    const e = document.createElement("canvas");
    return e.width = r, e.height = t, e;
  },
  createImage: () => new Image(),
  getCanvasRenderingContext2D: () => CanvasRenderingContext2D,
  getWebGLRenderingContext: () => WebGLRenderingContext,
  getNavigator: () => navigator,
  getBaseUrl: () => document.baseURI ?? window.location.href,
  getFontFaceSet: () => document.fonts,
  fetch: (r, t) => fetch(r, t),
  parseXML: (r) => new DOMParser().parseFromString(r, "text/xml")
};
let Ii = Yo;
const rt = {
  /**
   * Returns the current adapter.
   * @returns {environment.Adapter} The current adapter.
   */
  get() {
    return Ii;
  },
  /**
   * Sets the current adapter.
   * @param adapter - The new adapter.
   */
  set(r) {
    Ii = r;
  }
};
class Vr extends lt {
  constructor(t) {
    t.resource || (t.resource = rt.get().createCanvas()), t.width || (t.width = t.resource.width, t.autoDensity || (t.width /= t.resolution)), t.height || (t.height = t.resource.height, t.autoDensity || (t.height /= t.resolution)), super(t), this.uploadMethodId = "image", this.autoDensity = t.autoDensity, this.resizeCanvas(), this.transparent = !!t.transparent;
  }
  resizeCanvas() {
    this.autoDensity && "style" in this.resource && (this.resource.style.width = `${this.width}px`, this.resource.style.height = `${this.height}px`), (this.resource.width !== this.pixelWidth || this.resource.height !== this.pixelHeight) && (this.resource.width = this.pixelWidth, this.resource.height = this.pixelHeight);
  }
  resize(t = this.width, e = this.height, s = this._resolution) {
    const i = super.resize(t, e, s);
    return i && this.resizeCanvas(), i;
  }
  static test(t) {
    return globalThis.HTMLCanvasElement && t instanceof HTMLCanvasElement || globalThis.OffscreenCanvas && t instanceof OffscreenCanvas;
  }
  /**
   * Returns the 2D rendering context for the canvas.
   * Caches the context after creating it.
   * @returns The 2D rendering context of the canvas.
   */
  get context2D() {
    return this._context2D || (this._context2D = this.resource.getContext("2d"));
  }
}
Vr.extension = z.TextureSource;
class qe extends lt {
  constructor(t) {
    super(t), this.uploadMethodId = "image", this.autoGarbageCollect = !0;
  }
  static test(t) {
    return globalThis.HTMLImageElement && t instanceof HTMLImageElement || typeof ImageBitmap < "u" && t instanceof ImageBitmap || globalThis.VideoFrame && t instanceof VideoFrame;
  }
}
qe.extension = z.TextureSource;
var Gs = /* @__PURE__ */ ((r) => (r[r.INTERACTION = 50] = "INTERACTION", r[r.HIGH = 25] = "HIGH", r[r.NORMAL = 0] = "NORMAL", r[r.LOW = -25] = "LOW", r[r.UTILITY = -50] = "UTILITY", r))(Gs || {});
class bs {
  /**
   * Constructor
   * @private
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param priority - The priority for emitting
   * @param once - If the handler should fire once
   */
  constructor(t, e = null, s = 0, i = !1) {
    this.next = null, this.previous = null, this._destroyed = !1, this._fn = t, this._context = e, this.priority = s, this._once = i;
  }
  /**
   * Simple compare function to figure out if a function and context match.
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @returns `true` if the listener match the arguments
   */
  match(t, e = null) {
    return this._fn === t && this._context === e;
  }
  /**
   * Emit by calling the current function.
   * @param ticker - The ticker emitting.
   * @returns Next ticker
   */
  emit(t) {
    this._fn && (this._context ? this._fn.call(this._context, t) : this._fn(t));
    const e = this.next;
    return this._once && this.destroy(!0), this._destroyed && (this.next = null), e;
  }
  /**
   * Connect to the list.
   * @param previous - Input node, previous listener
   */
  connect(t) {
    this.previous = t, t.next && (t.next.previous = this), this.next = t.next, t.next = this;
  }
  /**
   * Destroy and don't use after this.
   * @param hard - `true` to remove the `next` reference, this
   *        is considered a hard destroy. Soft destroy maintains the next reference.
   * @returns The listener to redirect while emitting or removing.
   */
  destroy(t = !1) {
    this._destroyed = !0, this._fn = null, this._context = null, this.previous && (this.previous.next = this.next), this.next && (this.next.previous = this.previous);
    const e = this.next;
    return this.next = t ? null : e, this.previous = null, e;
  }
}
const qr = class it {
  constructor() {
    this.autoStart = !1, this.deltaTime = 1, this.lastTime = -1, this.speed = 1, this.started = !1, this._requestId = null, this._maxElapsedMS = 100, this._minElapsedMS = 0, this._protected = !1, this._lastFrame = -1, this._head = new bs(null, null, 1 / 0), this.deltaMS = 1 / it.targetFPMS, this.elapsedMS = 1 / it.targetFPMS, this._tick = (t) => {
      this._requestId = null, this.started && (this.update(t), this.started && this._requestId === null && this._head.next && (this._requestId = requestAnimationFrame(this._tick)));
    };
  }
  /**
   * Conditionally requests a new animation frame.
   * If a frame has not already been requested, and if the internal
   * emitter has listeners, a new frame is requested.
   */
  _requestIfNeeded() {
    this._requestId === null && this._head.next && (this.lastTime = performance.now(), this._lastFrame = this.lastTime, this._requestId = requestAnimationFrame(this._tick));
  }
  /** Conditionally cancels a pending animation frame. */
  _cancelIfNeeded() {
    this._requestId !== null && (cancelAnimationFrame(this._requestId), this._requestId = null);
  }
  /**
   * Conditionally requests a new animation frame.
   * If the ticker has been started it checks if a frame has not already
   * been requested, and if the internal emitter has listeners. If these
   * conditions are met, a new frame is requested. If the ticker has not
   * been started, but autoStart is `true`, then the ticker starts now,
   * and continues with the previous conditions to request a new frame.
   */
  _startIfPossible() {
    this.started ? this._requestIfNeeded() : this.autoStart && this.start();
  }
  /**
   * Register a handler for tick events.
   * @param fn - The listener function to add. Receives the Ticker instance as parameter
   * @param context - The context for the listener
   * @param priority - The priority of the listener
   * @example
   * ```ts
   * // Access time properties through the ticker parameter
   * ticker.add((ticker) => {
   *     // Use deltaTime (dimensionless scalar) for frame-independent animations
   *     sprite.rotation += 0.1 * ticker.deltaTime;
   *
   *     // Use deltaMS (milliseconds) for time-based calculations
   *     const progress = ticker.deltaMS / animationDuration;
   *
   *     // Use elapsedMS for raw timing measurements
   *     console.log(`Raw frame time: ${ticker.elapsedMS}ms`);
   * });
   * ```
   */
  add(t, e, s = Gs.NORMAL) {
    return this._addListener(new bs(t, e, s));
  }
  /**
   * Add a handler for the tick event which is only executed once on the next frame.
   * @example
   * ```ts
   * // Basic one-time update
   * ticker.addOnce(() => {
   *     console.log('Runs next frame only');
   * });
   *
   * // With specific context
   * const game = {
   *     init(ticker) {
   *         this.loadResources();
   *         console.log('Game initialized');
   *     }
   * };
   * ticker.addOnce(game.init, game);
   *
   * // With priority
   * ticker.addOnce(
   *     () => {
   *         // High priority one-time setup
   *         physics.init();
   *     },
   *     undefined,
   *     UPDATE_PRIORITY.HIGH
   * );
   * ```
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param priority - The priority for emitting (default: UPDATE_PRIORITY.NORMAL)
   * @returns This instance of a ticker
   * @see {@link Ticker#add} For continuous updates
   * @see {@link Ticker#remove} For removing handlers
   */
  addOnce(t, e, s = Gs.NORMAL) {
    return this._addListener(new bs(t, e, s, !0));
  }
  /**
   * Internally adds the event handler so that it can be sorted by priority.
   * Priority allows certain handler (user, AnimatedSprite, Interaction) to be run
   * before the rendering.
   * @private
   * @param listener - Current listener being added.
   * @returns This instance of a ticker
   */
  _addListener(t) {
    let e = this._head.next, s = this._head;
    if (!e)
      t.connect(s);
    else {
      for (; e; ) {
        if (t.priority > e.priority) {
          t.connect(s);
          break;
        }
        s = e, e = e.next;
      }
      t.previous || t.connect(s);
    }
    return this._startIfPossible(), this;
  }
  /**
   * Removes any handlers matching the function and context parameters.
   * If no handlers are left after removing, then it cancels the animation frame.
   * @example
   * ```ts
   * // Basic removal
   * const onTick = () => {
   *     sprite.rotation += 0.1;
   * };
   * ticker.add(onTick);
   * ticker.remove(onTick);
   *
   * // Remove with context
   * const game = {
   *     update(ticker) {
   *         this.physics.update(ticker.deltaTime);
   *     }
   * };
   * ticker.add(game.update, game);
   * ticker.remove(game.update, game);
   *
   * // Remove all matching handlers
   * // (if same function was added multiple times)
   * ticker.add(onTick);
   * ticker.add(onTick);
   * ticker.remove(onTick); // Removes all instances
   * ```
   * @param fn - The listener function to be removed
   * @param context - The listener context to be removed
   * @returns This instance of a ticker
   * @see {@link Ticker#add} For adding handlers
   * @see {@link Ticker#addOnce} For one-time handlers
   */
  remove(t, e) {
    let s = this._head.next;
    for (; s; )
      s.match(t, e) ? s = s.destroy() : s = s.next;
    return this._head.next || this._cancelIfNeeded(), this;
  }
  /**
   * The number of listeners on this ticker, calculated by walking through linked list.
   * @example
   * ```ts
   * // Check number of active listeners
   * const ticker = new Ticker();
   * console.log(ticker.count); // 0
   *
   * // Add some listeners
   * ticker.add(() => {});
   * ticker.add(() => {});
   * console.log(ticker.count); // 2
   *
   * // Check after cleanup
   * ticker.destroy();
   * console.log(ticker.count); // 0
   * ```
   * @readonly
   * @see {@link Ticker#add} For adding listeners
   * @see {@link Ticker#remove} For removing listeners
   */
  get count() {
    if (!this._head)
      return 0;
    let t = 0, e = this._head;
    for (; e = e.next; )
      t++;
    return t;
  }
  /**
   * Starts the ticker. If the ticker has listeners a new animation frame is requested at this point.
   * @example
   * ```ts
   * // Basic manual start
   * const ticker = new Ticker();
   * ticker.add(() => {
   *     // Animation code here
   * });
   * ticker.start();
   * ```
   * @see {@link Ticker#stop} For stopping the ticker
   * @see {@link Ticker#autoStart} For automatic starting
   * @see {@link Ticker#started} For checking ticker state
   */
  start() {
    this.started || (this.started = !0, this._requestIfNeeded());
  }
  /**
   * Stops the ticker. If the ticker has requested an animation frame it is canceled at this point.
   * @example
   * ```ts
   * // Basic stop
   * const ticker = new Ticker();
   * ticker.stop();
   * ```
   * @see {@link Ticker#start} For starting the ticker
   * @see {@link Ticker#started} For checking ticker state
   * @see {@link Ticker#destroy} For cleaning up the ticker
   */
  stop() {
    this.started && (this.started = !1, this._cancelIfNeeded());
  }
  /**
   * Destroy the ticker and don't use after this. Calling this method removes all references to internal events.
   * @example
   * ```ts
   * // Clean up with active listeners
   * const ticker = new Ticker();
   * ticker.add(() => {});
   * ticker.destroy(); // Removes all listeners
   * ```
   * @see {@link Ticker#stop} For stopping without destroying
   * @see {@link Ticker#remove} For removing specific listeners
   */
  destroy() {
    if (!this._protected) {
      this.stop();
      let t = this._head.next;
      for (; t; )
        t = t.destroy(!0);
      this._head.destroy(), this._head = null;
    }
  }
  /**
   * Triggers an update.
   *
   * An update entails setting the
   * current {@link Ticker#elapsedMS|elapsedMS},
   * the current {@link Ticker#deltaTime|deltaTime},
   * invoking all listeners with current deltaTime,
   * and then finally setting {@link Ticker#lastTime|lastTime}
   * with the value of currentTime that was provided.
   *
   * This method will be called automatically by animation
   * frame callbacks if the ticker instance has been started
   * and listeners are added.
   * @example
   * ```ts
   * // Basic manual update
   * const ticker = new Ticker();
   * ticker.update(performance.now());
   * ```
   * @param currentTime - The current time of execution (defaults to performance.now())
   * @see {@link Ticker#deltaTime} For frame delta value
   * @see {@link Ticker#elapsedMS} For raw elapsed time
   */
  update(t = performance.now()) {
    let e;
    if (t > this.lastTime) {
      if (e = this.elapsedMS = t - this.lastTime, e > this._maxElapsedMS && (e = this._maxElapsedMS), e *= this.speed, this._minElapsedMS) {
        const n = t - this._lastFrame | 0;
        if (n < this._minElapsedMS)
          return;
        this._lastFrame = t - n % this._minElapsedMS;
      }
      this.deltaMS = e, this.deltaTime = this.deltaMS * it.targetFPMS;
      const s = this._head;
      let i = s.next;
      for (; i; )
        i = i.emit(this);
      s.next || this._cancelIfNeeded();
    } else
      this.deltaTime = this.deltaMS = this.elapsedMS = 0;
    this.lastTime = t;
  }
  /**
   * The frames per second at which this ticker is running.
   * The default is approximately 60 in most modern browsers.
   * > [!NOTE] This does not factor in the value of
   * > {@link Ticker#speed|speed}, which is specific
   * > to scaling {@link Ticker#deltaTime|deltaTime}.
   * @example
   * ```ts
   * // Basic FPS monitoring
   * ticker.add(() => {
   *     console.log(`Current FPS: ${Math.round(ticker.FPS)}`);
   * });
   * ```
   * @readonly
   */
  get FPS() {
    return 1e3 / this.elapsedMS;
  }
  /**
   * Manages the maximum amount of milliseconds allowed to
   * elapse between invoking {@link Ticker#update|update}.
   *
   * This value is used to cap {@link Ticker#deltaTime|deltaTime},
   * but does not effect the measured value of {@link Ticker#FPS|FPS}.
   *
   * When setting this property it is clamped to a value between
   * `0` and `Ticker.targetFPMS * 1000`.
   * @example
   * ```ts
   * // Set minimum acceptable frame rate
   * const ticker = new Ticker();
   * ticker.minFPS = 30; // Never go below 30 FPS
   *
   * // Use with maxFPS for frame rate clamping
   * ticker.minFPS = 30;
   * ticker.maxFPS = 60;
   *
   * // Monitor delta capping
   * ticker.add(() => {
   *     // Delta time will be capped based on minFPS
   *     console.log(`Delta time: ${ticker.deltaTime}`);
   * });
   * ```
   * @default 10
   */
  get minFPS() {
    return 1e3 / this._maxElapsedMS;
  }
  set minFPS(t) {
    const e = Math.min(this.maxFPS, t), s = Math.min(Math.max(0, e) / 1e3, it.targetFPMS);
    this._maxElapsedMS = 1 / s;
  }
  /**
   * Manages the minimum amount of milliseconds required to
   * elapse between invoking {@link Ticker#update|update}.
   *
   * This will effect the measured value of {@link Ticker#FPS|FPS}.
   *
   * If it is set to `0`, then there is no limit; PixiJS will render as many frames as it can.
   * Otherwise it will be at least `minFPS`
   * @example
   * ```ts
   * // Set minimum acceptable frame rate
   * const ticker = new Ticker();
   * ticker.maxFPS = 60; // Never go above 60 FPS
   *
   * // Use with maxFPS for frame rate clamping
   * ticker.minFPS = 30;
   * ticker.maxFPS = 60;
   *
   * // Monitor delta capping
   * ticker.add(() => {
   *     // Delta time will be capped based on maxFPS
   *     console.log(`Delta time: ${ticker.deltaTime}`);
   * });
   * ```
   * @default 0
   */
  get maxFPS() {
    return this._minElapsedMS ? Math.round(1e3 / this._minElapsedMS) : 0;
  }
  set maxFPS(t) {
    if (t === 0)
      this._minElapsedMS = 0;
    else {
      const e = Math.max(this.minFPS, t);
      this._minElapsedMS = 1 / (e / 1e3);
    }
  }
  /**
   * The shared ticker instance used by {@link AnimatedSprite} and by
   * {@link VideoSource} to update animation frames / video textures.
   *
   * It may also be used by {@link Application} if created with the `sharedTicker` option property set to true.
   *
   * The property {@link Ticker#autoStart|autoStart} is set to `true` for this instance.
   * Please follow the examples for usage, including how to opt-out of auto-starting the shared ticker.
   * @example
   * import { Ticker } from 'pixi.js';
   *
   * const ticker = Ticker.shared;
   * // Set this to prevent starting this ticker when listeners are added.
   * // By default this is true only for the Ticker.shared instance.
   * ticker.autoStart = false;
   *
   * // FYI, call this to ensure the ticker is stopped. It should be stopped
   * // if you have not attempted to render anything yet.
   * ticker.stop();
   *
   * // Call this when you are ready for a running shared ticker.
   * ticker.start();
   * @example
   * import { autoDetectRenderer, Container } from 'pixi.js';
   *
   * // You may use the shared ticker to render...
   * const renderer = autoDetectRenderer();
   * const stage = new Container();
   * document.body.appendChild(renderer.view);
   * ticker.add((time) => renderer.render(stage));
   *
   * // Or you can just update it manually.
   * ticker.autoStart = false;
   * ticker.stop();
   * const animate = (time) => {
   *     ticker.update(time);
   *     renderer.render(stage);
   *     requestAnimationFrame(animate);
   * };
   * animate(performance.now());
   * @type {Ticker}
   * @readonly
   */
  static get shared() {
    if (!it._shared) {
      const t = it._shared = new it();
      t.autoStart = !0, t._protected = !0;
    }
    return it._shared;
  }
  /**
   * The system ticker instance used by {@link PrepareBase} for core timing
   * functionality that shouldn't usually need to be paused, unlike the `shared`
   * ticker which drives visual animations and rendering which may want to be paused.
   *
   * The property {@link Ticker#autoStart|autoStart} is set to `true` for this instance.
   * @type {Ticker}
   * @readonly
   * @advanced
   */
  static get system() {
    if (!it._system) {
      const t = it._system = new it();
      t.autoStart = !0, t._protected = !0;
    }
    return it._system;
  }
};
qr.targetFPMS = 0.06;
let Ne = qr, ws;
async function Xo() {
  return ws ?? (ws = (async () => {
    const t = rt.get().createCanvas(1, 1).getContext("webgl");
    if (!t)
      return "premultiply-alpha-on-upload";
    const e = await new Promise((o) => {
      const a = document.createElement("video");
      a.onloadeddata = () => o(a), a.onerror = () => o(null), a.autoplay = !1, a.crossOrigin = "anonymous", a.preload = "auto", a.src = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ9Vzc9JjwItjxYgAAAAAAAAAAWfInEWjh0VOQ09ERVJEh49MYXZjIGxpYnZweC12cDlnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjA0MDAwMDAwMAAAH0O2dcfngQCgwqGggQAAAIJJg0IAABAAFgA4JBwYSgAAICAAEb///4r+AAB1oZ2mm+6BAaWWgkmDQgAAEAAWADgkHBhKAAAgIABIQBxTu2uRu4+zgQC3iveBAfGCAXHwgQM=", a.load();
    });
    if (!e)
      return "premultiply-alpha-on-upload";
    const s = t.createTexture();
    t.bindTexture(t.TEXTURE_2D, s);
    const i = t.createFramebuffer();
    t.bindFramebuffer(t.FRAMEBUFFER, i), t.framebufferTexture2D(
      t.FRAMEBUFFER,
      t.COLOR_ATTACHMENT0,
      t.TEXTURE_2D,
      s,
      0
    ), t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL, t.NONE), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, e);
    const n = new Uint8Array(4);
    return t.readPixels(0, 0, 1, 1, t.RGBA, t.UNSIGNED_BYTE, n), t.deleteFramebuffer(i), t.deleteTexture(s), t.getExtension("WEBGL_lose_context")?.loseContext(), n[0] <= n[3] ? "premultiplied-alpha" : "premultiply-alpha-on-upload";
  })()), ws;
}
const Je = class Kr extends lt {
  constructor(t) {
    super(t), this.isReady = !1, this.uploadMethodId = "video", t = {
      ...Kr.defaultOptions,
      ...t
    }, this._autoUpdate = !0, this._isConnectedToTicker = !1, this._updateFPS = t.updateFPS || 0, this._msToNextUpdate = 0, this.autoPlay = t.autoPlay !== !1, this.alphaMode = t.alphaMode ?? "premultiply-alpha-on-upload", this._videoFrameRequestCallback = this._videoFrameRequestCallback.bind(this), this._videoFrameRequestCallbackHandle = null, this._load = null, this._resolve = null, this._reject = null, this._onCanPlay = this._onCanPlay.bind(this), this._onCanPlayThrough = this._onCanPlayThrough.bind(this), this._onError = this._onError.bind(this), this._onPlayStart = this._onPlayStart.bind(this), this._onPlayStop = this._onPlayStop.bind(this), this._onSeeked = this._onSeeked.bind(this), t.autoLoad !== !1 && this.load();
  }
  /** Update the video frame if the source is not destroyed and meets certain conditions. */
  updateFrame() {
    if (!this.destroyed) {
      if (this._updateFPS) {
        const t = Ne.shared.elapsedMS * this.resource.playbackRate;
        this._msToNextUpdate = Math.floor(this._msToNextUpdate - t);
      }
      (!this._updateFPS || this._msToNextUpdate <= 0) && (this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0), this.isValid && this.update();
    }
  }
  /** Callback to update the video frame and potentially request the next frame update. */
  _videoFrameRequestCallback() {
    this.updateFrame(), this.destroyed ? this._videoFrameRequestCallbackHandle = null : this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(
      this._videoFrameRequestCallback
    );
  }
  /**
   * Checks if the resource has valid dimensions.
   * @returns {boolean} True if width and height are set, otherwise false.
   */
  get isValid() {
    return !!this.resource.videoWidth && !!this.resource.videoHeight;
  }
  /**
   * Start preloading the video resource.
   * @returns {Promise<this>} Handle the validate event
   */
  async load() {
    if (this._load)
      return this._load;
    const t = this.resource, e = this.options;
    return (t.readyState === t.HAVE_ENOUGH_DATA || t.readyState === t.HAVE_FUTURE_DATA) && t.width && t.height && (t.complete = !0), t.addEventListener("play", this._onPlayStart), t.addEventListener("pause", this._onPlayStop), t.addEventListener("seeked", this._onSeeked), this._isSourceReady() ? this._mediaReady() : (e.preload || t.addEventListener("canplay", this._onCanPlay), t.addEventListener("canplaythrough", this._onCanPlayThrough), t.addEventListener("error", this._onError, !0)), this.alphaMode = await Xo(), this._load = new Promise((s, i) => {
      this.isValid ? s(this) : (this._resolve = s, this._reject = i, e.preloadTimeoutMs !== void 0 && (this._preloadTimeout = setTimeout(() => {
        this._onError(new ErrorEvent(`Preload exceeded timeout of ${e.preloadTimeoutMs}ms`));
      })), t.load());
    }), this._load;
  }
  /**
   * Handle video error events.
   * @param event - The error event
   */
  _onError(t) {
    this.resource.removeEventListener("error", this._onError, !0), this.emit("error", t), this._reject && (this._reject(t), this._reject = null, this._resolve = null);
  }
  /**
   * Checks if the underlying source is playing.
   * @returns True if playing.
   */
  _isSourcePlaying() {
    const t = this.resource;
    return !t.paused && !t.ended;
  }
  /**
   * Checks if the underlying source is ready for playing.
   * @returns True if ready.
   */
  _isSourceReady() {
    return this.resource.readyState > 2;
  }
  /** Runs the update loop when the video is ready to play. */
  _onPlayStart() {
    this.isValid || this._mediaReady(), this._configureAutoUpdate();
  }
  /** Stops the update loop when a pause event is triggered. */
  _onPlayStop() {
    this._configureAutoUpdate();
  }
  /** Handles behavior when the video completes seeking to the current playback position. */
  _onSeeked() {
    this._autoUpdate && !this._isSourcePlaying() && (this._msToNextUpdate = 0, this.updateFrame(), this._msToNextUpdate = 0);
  }
  _onCanPlay() {
    this.resource.removeEventListener("canplay", this._onCanPlay), this._mediaReady();
  }
  _onCanPlayThrough() {
    this.resource.removeEventListener("canplaythrough", this._onCanPlay), this._preloadTimeout && (clearTimeout(this._preloadTimeout), this._preloadTimeout = void 0), this._mediaReady();
  }
  /** Fired when the video is loaded and ready to play. */
  _mediaReady() {
    const t = this.resource;
    this.isValid && (this.isReady = !0, this.resize(t.videoWidth, t.videoHeight)), this._msToNextUpdate = 0, this.updateFrame(), this._msToNextUpdate = 0, this._resolve && (this._resolve(this), this._resolve = null, this._reject = null), this._isSourcePlaying() ? this._onPlayStart() : this.autoPlay && this.resource.play();
  }
  /** Cleans up resources and event listeners associated with this texture. */
  destroy() {
    this._configureAutoUpdate();
    const t = this.resource;
    t && (t.removeEventListener("play", this._onPlayStart), t.removeEventListener("pause", this._onPlayStop), t.removeEventListener("seeked", this._onSeeked), t.removeEventListener("canplay", this._onCanPlay), t.removeEventListener("canplaythrough", this._onCanPlayThrough), t.removeEventListener("error", this._onError, !0), t.pause(), t.src = "", t.load()), super.destroy();
  }
  /** Should the base texture automatically update itself, set to true by default. */
  get autoUpdate() {
    return this._autoUpdate;
  }
  set autoUpdate(t) {
    t !== this._autoUpdate && (this._autoUpdate = t, this._configureAutoUpdate());
  }
  /**
   * How many times a second to update the texture from the video.
   * Leave at 0 to update at every render.
   * A lower fps can help performance, as updating the texture at 60fps on a 30ps video may not be efficient.
   */
  get updateFPS() {
    return this._updateFPS;
  }
  set updateFPS(t) {
    t !== this._updateFPS && (this._updateFPS = t, this._configureAutoUpdate());
  }
  /**
   * Configures the updating mechanism based on the current state and settings.
   *
   * This method decides between using the browser's native video frame callback or a custom ticker
   * for updating the video frame. It ensures optimal performance and responsiveness
   * based on the video's state, playback status, and the desired frames-per-second setting.
   *
   * - If `_autoUpdate` is enabled and the video source is playing:
   *   - It will prefer the native video frame callback if available and no specific FPS is set.
   *   - Otherwise, it will use a custom ticker for manual updates.
   * - If `_autoUpdate` is disabled or the video isn't playing, any active update mechanisms are halted.
   */
  _configureAutoUpdate() {
    this._autoUpdate && this._isSourcePlaying() ? !this._updateFPS && this.resource.requestVideoFrameCallback ? (this._isConnectedToTicker && (Ne.shared.remove(this.updateFrame, this), this._isConnectedToTicker = !1, this._msToNextUpdate = 0), this._videoFrameRequestCallbackHandle === null && (this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(
      this._videoFrameRequestCallback
    ))) : (this._videoFrameRequestCallbackHandle !== null && (this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker || (Ne.shared.add(this.updateFrame, this), this._isConnectedToTicker = !0, this._msToNextUpdate = 0)) : (this._videoFrameRequestCallbackHandle !== null && (this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker && (Ne.shared.remove(this.updateFrame, this), this._isConnectedToTicker = !1, this._msToNextUpdate = 0));
  }
  static test(t) {
    return globalThis.HTMLVideoElement && t instanceof HTMLVideoElement;
  }
};
Je.extension = z.TextureSource;
Je.defaultOptions = {
  ...lt.defaultOptions,
  /** If true, the video will start loading immediately. */
  autoLoad: !0,
  /** If true, the video will start playing as soon as it is loaded. */
  autoPlay: !0,
  /** The number of times a second to update the texture from the video. Leave at 0 to update at every render. */
  updateFPS: 0,
  /** If true, the video will be loaded with the `crossorigin` attribute. */
  crossorigin: !0,
  /** If true, the video will loop when it ends. */
  loop: !1,
  /** If true, the video will be muted. */
  muted: !0,
  /** If true, the video will play inline. */
  playsinline: !0,
  /** If true, the video will be preloaded. */
  preload: !1
};
Je.MIME_TYPES = {
  ogv: "video/ogg",
  mov: "video/quicktime",
  m4v: "video/mp4"
};
let Ho = Je;
const Ut = (r, t, e = !1) => (Array.isArray(r) || (r = [r]), t ? r.map((s) => typeof s == "string" || e ? t(s) : s) : r);
class Oo {
  constructor() {
    this._parsers = [], this._cache = /* @__PURE__ */ new Map(), this._cacheMap = /* @__PURE__ */ new Map();
  }
  /** Clear all entries. */
  reset() {
    this._cacheMap.clear(), this._cache.clear();
  }
  /**
   * Check if the key exists
   * @param key - The key to check
   */
  has(t) {
    return this._cache.has(t);
  }
  /**
   * Fetch entry by key
   * @param key - The key of the entry to get
   */
  get(t) {
    const e = this._cache.get(t);
    return e || J(`[Assets] Asset id ${t} was not found in the Cache`), e;
  }
  /**
   * Set a value by key or keys name
   * @param key - The key or keys to set
   * @param value - The value to store in the cache or from which cacheable assets will be derived.
   */
  set(t, e) {
    const s = Ut(t);
    let i;
    for (let h = 0; h < this.parsers.length; h++) {
      const l = this.parsers[h];
      if (l.test(e)) {
        i = l.getCacheableAssets(s, e);
        break;
      }
    }
    const n = new Map(Object.entries(i || {}));
    i || s.forEach((h) => {
      n.set(h, e);
    });
    const o = [...n.keys()], a = {
      cacheKeys: o,
      keys: s
    };
    s.forEach((h) => {
      this._cacheMap.set(h, a);
    }), o.forEach((h) => {
      const l = i ? i[h] : e;
      this._cache.has(h) && this._cache.get(h) !== l && J("[Cache] already has key:", h), this._cache.set(h, n.get(h));
    });
  }
  /**
   * Remove entry by key
   *
   * This function will also remove any associated alias from the cache also.
   * @param key - The key of the entry to remove
   */
  remove(t) {
    if (!this._cacheMap.has(t)) {
      J(`[Assets] Asset id ${t} was not found in the Cache`);
      return;
    }
    const e = this._cacheMap.get(t);
    e.cacheKeys.forEach((i) => {
      this._cache.delete(i);
    }), e.keys.forEach((i) => {
      this._cacheMap.delete(i);
    });
  }
  /**
   * All loader parsers registered
   * @advanced
   */
  get parsers() {
    return this._parsers;
  }
}
const $t = new Oo(), Ds = [];
ht.handleByList(z.TextureSource, Ds);
function Zr(r = {}) {
  const t = r && r.resource, e = t ? r.resource : r, s = t ? r : { resource: r };
  for (let i = 0; i < Ds.length; i++) {
    const n = Ds[i];
    if (n.test(e))
      return new n(s);
  }
  throw new Error(`Could not find a source type for resource: ${s.resource}`);
}
function Wo(r = {}, t = !1) {
  const e = r && r.resource, s = e ? r.resource : r, i = e ? r : { resource: r };
  if (!t && $t.has(s))
    return $t.get(s);
  const n = new D({ source: Zr(i) });
  return n.on("destroy", () => {
    $t.has(s) && $t.remove(s);
  }), t || $t.set(s, n), n;
}
function Uo(r, t = !1) {
  return typeof r == "string" ? $t.get(r) : r instanceof lt ? new D({ source: r }) : Wo(r, t);
}
D.from = Uo;
lt.from = Zr;
ht.add(Ur, $r, jr, Ho, qe, Vr, Ks);
var Qr = /* @__PURE__ */ ((r) => (r[r.Low = 0] = "Low", r[r.Normal = 1] = "Normal", r[r.High = 2] = "High", r))(Qr || {});
function ct(r) {
  if (typeof r != "string")
    throw new TypeError(`Path must be a string. Received ${JSON.stringify(r)}`);
}
function se(r) {
  return r.split("?")[0].split("#")[0];
}
function $o(r) {
  return r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function jo(r, t, e) {
  return r.replace(new RegExp($o(t), "g"), e);
}
function Vo(r, t) {
  let e = "", s = 0, i = -1, n = 0, o = -1;
  for (let a = 0; a <= r.length; ++a) {
    if (a < r.length)
      o = r.charCodeAt(a);
    else {
      if (o === 47)
        break;
      o = 47;
    }
    if (o === 47) {
      if (!(i === a - 1 || n === 1)) if (i !== a - 1 && n === 2) {
        if (e.length < 2 || s !== 2 || e.charCodeAt(e.length - 1) !== 46 || e.charCodeAt(e.length - 2) !== 46) {
          if (e.length > 2) {
            const h = e.lastIndexOf("/");
            if (h !== e.length - 1) {
              h === -1 ? (e = "", s = 0) : (e = e.slice(0, h), s = e.length - 1 - e.lastIndexOf("/")), i = a, n = 0;
              continue;
            }
          } else if (e.length === 2 || e.length === 1) {
            e = "", s = 0, i = a, n = 0;
            continue;
          }
        }
      } else
        e.length > 0 ? e += `/${r.slice(i + 1, a)}` : e = r.slice(i + 1, a), s = a - i - 1;
      i = a, n = 0;
    } else o === 46 && n !== -1 ? ++n : n = -1;
  }
  return e;
}
const ye = {
  /**
   * Converts a path to posix format.
   * @param path - The path to convert to posix
   * @example
   * ```ts
   * // Convert a Windows path to POSIX format
   * path.toPosix('C:\\Users\\User\\Documents\\file.txt');
   * // -> 'C:/Users/User/Documents/file.txt'
   * ```
   */
  toPosix(r) {
    return jo(r, "\\", "/");
  },
  /**
   * Checks if the path is a URL e.g. http://, https://
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path is a URL
   * path.isUrl('http://www.example.com');
   * // -> true
   * path.isUrl('C:/Users/User/Documents/file.txt');
   * // -> false
   * ```
   */
  isUrl(r) {
    return /^https?:/.test(this.toPosix(r));
  },
  /**
   * Checks if the path is a data URL
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path is a data URL
   * path.isDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...');
   * // -> true
   * ```
   */
  isDataUrl(r) {
    return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(r);
  },
  /**
   * Checks if the path is a blob URL
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path is a blob URL
   * path.isBlobUrl('blob:http://www.example.com/12345678-1234-1234-1234-123456789012');
   * // -> true
   * ```
   */
  isBlobUrl(r) {
    return r.startsWith("blob:");
  },
  /**
   * Checks if the path has a protocol e.g. http://, https://, file:///, data:, blob:, C:/
   * This will return true for windows file paths
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path has a protocol
   * path.hasProtocol('http://www.example.com');
   * // -> true
   * path.hasProtocol('C:/Users/User/Documents/file.txt');
   * // -> true
   * ```
   */
  hasProtocol(r) {
    return /^[^/:]+:/.test(this.toPosix(r));
  },
  /**
   * Returns the protocol of the path e.g. http://, https://, file:///, data:, blob:, C:/
   * @param path - The path to get the protocol from
   * @example
   * ```ts
   * // Get the protocol from a URL
   * path.getProtocol('http://www.example.com/path/to/resource');
   * // -> 'http://'
   * // Get the protocol from a file path
   * path.getProtocol('C:/Users/User/Documents/file.txt');
   * // -> 'C:/'
   * ```
   */
  getProtocol(r) {
    ct(r), r = this.toPosix(r);
    const t = /^file:\/\/\//.exec(r);
    if (t)
      return t[0];
    const e = /^[^/:]+:\/{0,2}/.exec(r);
    return e ? e[0] : "";
  },
  /**
   * Converts URL to an absolute path.
   * When loading from a Web Worker, we must use absolute paths.
   * If the URL is already absolute we return it as is
   * If it's not, we convert it
   * @param url - The URL to test
   * @param customBaseUrl - The base URL to use
   * @param customRootUrl - The root URL to use
   * @example
   * ```ts
   * // Convert a relative URL to an absolute path
   * path.toAbsolute('images/texture.png', 'http://example.com/assets/');
   * // -> 'http://example.com/assets/images/texture.png'
   * ```
   */
  toAbsolute(r, t, e) {
    if (ct(r), this.isDataUrl(r) || this.isBlobUrl(r))
      return r;
    const s = se(this.toPosix(t ?? rt.get().getBaseUrl())), i = se(this.toPosix(e ?? this.rootname(s)));
    return r = this.toPosix(r), r.startsWith("/") ? ye.join(i, r.slice(1)) : this.isAbsolute(r) ? r : this.join(s, r);
  },
  /**
   * Normalizes the given path, resolving '..' and '.' segments
   * @param path - The path to normalize
   * @example
   * ```ts
   * // Normalize a path with relative segments
   * path.normalize('http://www.example.com/foo/bar/../baz');
   * // -> 'http://www.example.com/foo/baz'
   * // Normalize a file path with relative segments
   * path.normalize('C:\\Users\\User\\Documents\\..\\file.txt');
   * // -> 'C:/Users/User/file.txt'
   * ```
   */
  normalize(r) {
    if (ct(r), r.length === 0)
      return ".";
    if (this.isDataUrl(r) || this.isBlobUrl(r))
      return r;
    r = this.toPosix(r);
    let t = "";
    const e = r.startsWith("/");
    this.hasProtocol(r) && (t = this.rootname(r), r = r.slice(t.length));
    const s = r.endsWith("/");
    return r = Vo(r), r.length > 0 && s && (r += "/"), e ? `/${r}` : t + r;
  },
  /**
   * Determines if path is an absolute path.
   * Absolute paths can be urls, data urls, or paths on disk
   * @param path - The path to test
   * @example
   * ```ts
   * // Check if a path is absolute
   * path.isAbsolute('http://www.example.com/foo/bar');
   * // -> true
   * path.isAbsolute('C:/Users/User/Documents/file.txt');
   * // -> true
   * ```
   */
  isAbsolute(r) {
    return ct(r), r = this.toPosix(r), this.hasProtocol(r) ? !0 : r.startsWith("/");
  },
  /**
   * Joins all given path segments together using the platform-specific separator as a delimiter,
   * then normalizes the resulting path
   * @param segments - The segments of the path to join
   * @example
   * ```ts
   * // Join multiple path segments
   * path.join('assets', 'images', 'sprite.png');
   * // -> 'assets/images/sprite.png'
   * // Join with relative segments
   * path.join('assets', 'images', '../textures', 'sprite.png');
   * // -> 'assets/textures/sprite.png'
   * ```
   */
  join(...r) {
    if (r.length === 0)
      return ".";
    let t;
    for (let e = 0; e < r.length; ++e) {
      const s = r[e];
      if (ct(s), s.length > 0)
        if (t === void 0)
          t = s;
        else {
          const i = r[e - 1] ?? "";
          this.joinExtensions.includes(this.extname(i).toLowerCase()) ? t += `/../${s}` : t += `/${s}`;
        }
    }
    return t === void 0 ? "." : this.normalize(t);
  },
  /**
   * Returns the directory name of a path
   * @param path - The path to parse
   * @example
   * ```ts
   * // Get the directory name of a path
   * path.dirname('http://www.example.com/foo/bar/baz.png');
   * // -> 'http://www.example.com/foo/bar'
   * // Get the directory name of a file path
   * path.dirname('C:/Users/User/Documents/file.txt');
   * // -> 'C:/Users/User/Documents'
   * ```
   */
  dirname(r) {
    if (ct(r), r.length === 0)
      return ".";
    r = this.toPosix(r);
    let t = r.charCodeAt(0);
    const e = t === 47;
    let s = -1, i = !0;
    const n = this.getProtocol(r), o = r;
    r = r.slice(n.length);
    for (let a = r.length - 1; a >= 1; --a)
      if (t = r.charCodeAt(a), t === 47) {
        if (!i) {
          s = a;
          break;
        }
      } else
        i = !1;
    return s === -1 ? e ? "/" : this.isUrl(o) ? n + r : n : e && s === 1 ? "//" : n + r.slice(0, s);
  },
  /**
   * Returns the root of the path e.g. /, C:/, file:///, http://domain.com/
   * @param path - The path to parse
   * @example
   * ```ts
   * // Get the root of a URL
   * path.rootname('http://www.example.com/foo/bar/baz.png');
   * // -> 'http://www.example.com/'
   * // Get the root of a file path
   * path.rootname('C:/Users/User/Documents/file.txt');
   * // -> 'C:/'
   * ```
   */
  rootname(r) {
    ct(r), r = this.toPosix(r);
    let t = "";
    if (r.startsWith("/") ? t = "/" : t = this.getProtocol(r), this.isUrl(r)) {
      const e = r.indexOf("/", t.length);
      e !== -1 ? t = r.slice(0, e) : t = r, t.endsWith("/") || (t += "/");
    }
    return t;
  },
  /**
   * Returns the last portion of a path
   * @param path - The path to test
   * @param ext - Optional extension to remove
   * @example
   * ```ts
   * // Get the basename of a URL
   * path.basename('http://www.example.com/foo/bar/baz.png');
   * // -> 'baz.png'
   * // Get the basename of a file path
   * path.basename('C:/Users/User/Documents/file.txt');
   * // -> 'file.txt'
   * ```
   */
  basename(r, t) {
    ct(r), t && ct(t), r = se(this.toPosix(r));
    let e = 0, s = -1, i = !0, n;
    if (t !== void 0 && t.length > 0 && t.length <= r.length) {
      if (t.length === r.length && t === r)
        return "";
      let o = t.length - 1, a = -1;
      for (n = r.length - 1; n >= 0; --n) {
        const h = r.charCodeAt(n);
        if (h === 47) {
          if (!i) {
            e = n + 1;
            break;
          }
        } else
          a === -1 && (i = !1, a = n + 1), o >= 0 && (h === t.charCodeAt(o) ? --o === -1 && (s = n) : (o = -1, s = a));
      }
      return e === s ? s = a : s === -1 && (s = r.length), r.slice(e, s);
    }
    for (n = r.length - 1; n >= 0; --n)
      if (r.charCodeAt(n) === 47) {
        if (!i) {
          e = n + 1;
          break;
        }
      } else s === -1 && (i = !1, s = n + 1);
    return s === -1 ? "" : r.slice(e, s);
  },
  /**
   * Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last
   * portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than
   * the first character of the basename of path, an empty string is returned.
   * @param path - The path to parse
   * @example
   * ```ts
   * // Get the extension of a URL
   * path.extname('http://www.example.com/foo/bar/baz.png');
   * // -> '.png'
   * // Get the extension of a file path
   * path.extname('C:/Users/User/Documents/file.txt');
   * // -> '.txt'
   * ```
   */
  extname(r) {
    ct(r), r = se(this.toPosix(r));
    let t = -1, e = 0, s = -1, i = !0, n = 0;
    for (let o = r.length - 1; o >= 0; --o) {
      const a = r.charCodeAt(o);
      if (a === 47) {
        if (!i) {
          e = o + 1;
          break;
        }
        continue;
      }
      s === -1 && (i = !1, s = o + 1), a === 46 ? t === -1 ? t = o : n !== 1 && (n = 1) : t !== -1 && (n = -1);
    }
    return t === -1 || s === -1 || n === 0 || n === 1 && t === s - 1 && t === e + 1 ? "" : r.slice(t, s);
  },
  /**
   * Parses a path into an object containing the 'root', `dir`, `base`, `ext`, and `name` properties.
   * @param path - The path to parse
   * @example
   * ```ts
   * // Parse a URL
   * const parsed = path.parse('http://www.example.com/foo/bar/baz.png');
   * // -> {
   * //   root: 'http://www.example.com/',
   * //   dir: 'http://www.example.com/foo/bar',
   * //   base: 'baz.png',
   * //   ext: '.png',
   * //   name: 'baz'
   * // }
   * // Parse a file path
   * const parsedFile = path.parse('C:/Users/User/Documents/file.txt');
   * // -> {
   * //   root: 'C:/',
   * //   dir: 'C:/Users/User/Documents',
   * //   base: 'file.txt',
   * //   ext: '.txt',
   * //   name: 'file'
   * // }
   * ```
   */
  parse(r) {
    ct(r);
    const t = { root: "", dir: "", base: "", ext: "", name: "" };
    if (r.length === 0)
      return t;
    r = se(this.toPosix(r));
    let e = r.charCodeAt(0);
    const s = this.isAbsolute(r);
    let i;
    t.root = this.rootname(r), s || this.hasProtocol(r) ? i = 1 : i = 0;
    let n = -1, o = 0, a = -1, h = !0, l = r.length - 1, c = 0;
    for (; l >= i; --l) {
      if (e = r.charCodeAt(l), e === 47) {
        if (!h) {
          o = l + 1;
          break;
        }
        continue;
      }
      a === -1 && (h = !1, a = l + 1), e === 46 ? n === -1 ? n = l : c !== 1 && (c = 1) : n !== -1 && (c = -1);
    }
    return n === -1 || a === -1 || c === 0 || c === 1 && n === a - 1 && n === o + 1 ? a !== -1 && (o === 0 && s ? t.base = t.name = r.slice(1, a) : t.base = t.name = r.slice(o, a)) : (o === 0 && s ? (t.name = r.slice(1, n), t.base = r.slice(1, a)) : (t.name = r.slice(o, n), t.base = r.slice(o, a)), t.ext = r.slice(n, a)), t.dir = this.dirname(r), t;
  },
  sep: "/",
  delimiter: ":",
  joinExtensions: [".html"]
};
function Jr(r, t, e, s, i) {
  const n = t[e];
  for (let o = 0; o < n.length; o++) {
    const a = n[o];
    e < t.length - 1 ? Jr(r.replace(s[e], a), t, e + 1, s, i) : i.push(r.replace(s[e], a));
  }
}
function qo(r) {
  const t = /\{(.*?)\}/g, e = r.match(t), s = [];
  if (e) {
    const i = [];
    e.forEach((n) => {
      const o = n.substring(1, n.length - 1).split(",");
      i.push(o);
    }), Jr(r, i, 0, e, s);
  } else
    s.push(r);
  return s;
}
const Ei = (r) => !Array.isArray(r);
class tn {
  constructor() {
    this._defaultBundleIdentifierOptions = {
      connector: "-",
      createBundleAssetId: (t, e) => `${t}${this._bundleIdConnector}${e}`,
      extractAssetIdFromBundle: (t, e) => e.replace(`${t}${this._bundleIdConnector}`, "")
    }, this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector, this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId, this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle, this._assetMap = {}, this._preferredOrder = [], this._parsers = [], this._resolverHash = {}, this._bundles = {};
  }
  /**
   * Override how the resolver deals with generating bundle ids.
   * must be called before any bundles are added
   * @param bundleIdentifier - the bundle identifier options
   */
  setBundleIdentifier(t) {
    if (this._bundleIdConnector = t.connector ?? this._bundleIdConnector, this._createBundleAssetId = t.createBundleAssetId ?? this._createBundleAssetId, this._extractAssetIdFromBundle = t.extractAssetIdFromBundle ?? this._extractAssetIdFromBundle, this._extractAssetIdFromBundle("foo", this._createBundleAssetId("foo", "bar")) !== "bar")
      throw new Error("[Resolver] GenerateBundleAssetId are not working correctly");
  }
  /**
   * Let the resolver know which assets you prefer to use when resolving assets.
   * Multiple prefer user defined rules can be added.
   * @example
   * resolver.prefer({
   *     // first look for something with the correct format, and then then correct resolution
   *     priority: ['format', 'resolution'],
   *     params:{
   *         format:'webp', // prefer webp images
   *         resolution: 2, // prefer a resolution of 2
   *     }
   * })
   * resolver.add('foo', ['bar@2x.webp', 'bar@2x.png', 'bar.webp', 'bar.png']);
   * resolver.resolveUrl('foo') // => 'bar@2x.webp'
   * @param preferOrders - the prefer options
   */
  prefer(...t) {
    t.forEach((e) => {
      this._preferredOrder.push(e), e.priority || (e.priority = Object.keys(e.params));
    }), this._resolverHash = {};
  }
  /**
   * Set the base path to prepend to all urls when resolving
   * @example
   * resolver.basePath = 'https://home.com/';
   * resolver.add('foo', 'bar.ong');
   * resolver.resolveUrl('foo', 'bar.png'); // => 'https://home.com/bar.png'
   * @param basePath - the base path to use
   */
  set basePath(t) {
    this._basePath = t;
  }
  get basePath() {
    return this._basePath;
  }
  /**
   * Set the root path for root-relative URLs. By default the `basePath`'s root is used. If no `basePath` is set, then the
   * default value for browsers is `window.location.origin`
   * @example
   * // Application hosted on https://home.com/some-path/index.html
   * resolver.basePath = 'https://home.com/some-path/';
   * resolver.rootPath = 'https://home.com/';
   * resolver.add('foo', '/bar.png');
   * resolver.resolveUrl('foo', '/bar.png'); // => 'https://home.com/bar.png'
   * @param rootPath - the root path to use
   */
  set rootPath(t) {
    this._rootPath = t;
  }
  get rootPath() {
    return this._rootPath;
  }
  /**
   * All the active URL parsers that help the parser to extract information and create
   * an asset object-based on parsing the URL itself.
   *
   * Can be added using the extensions API
   * @example
   * resolver.add('foo', [
   *     {
   *         resolution: 2,
   *         format: 'png',
   *         src: 'image@2x.png',
   *     },
   *     {
   *         resolution:1,
   *         format:'png',
   *         src: 'image.png',
   *     },
   * ]);
   *
   * // With a url parser the information such as resolution and file format could extracted from the url itself:
   * extensions.add({
   *     extension: ExtensionType.ResolveParser,
   *     test: loadTextures.test, // test if url ends in an image
   *     parse: (value: string) =>
   *     ({
   *         resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? '1'),
   *         format: value.split('.').pop(),
   *         src: value,
   *     }),
   * });
   *
   * // Now resolution and format can be extracted from the url
   * resolver.add('foo', [
   *     'image@2x.png',
   *     'image.png',
   * ]);
   */
  get parsers() {
    return this._parsers;
  }
  /** Used for testing, this resets the resolver to its initial state */
  reset() {
    this.setBundleIdentifier(this._defaultBundleIdentifierOptions), this._assetMap = {}, this._preferredOrder = [], this._resolverHash = {}, this._rootPath = null, this._basePath = null, this._manifest = null, this._bundles = {}, this._defaultSearchParams = null;
  }
  /**
   * Sets the default URL search parameters for the URL resolver. The urls can be specified as a string or an object.
   * @param searchParams - the default url parameters to append when resolving urls
   */
  setDefaultSearchParams(t) {
    if (typeof t == "string")
      this._defaultSearchParams = t;
    else {
      const e = t;
      this._defaultSearchParams = Object.keys(e).map((s) => `${encodeURIComponent(s)}=${encodeURIComponent(e[s])}`).join("&");
    }
  }
  /**
   * Returns the aliases for a given asset
   * @param asset - the asset to get the aliases for
   */
  getAlias(t) {
    const { alias: e, src: s } = t;
    return Ut(
      e || s,
      (n) => typeof n == "string" ? n : Array.isArray(n) ? n.map((o) => o?.src ?? o) : n?.src ? n.src : n,
      !0
    );
  }
  /**
   * Add a manifest to the asset resolver. This is a nice way to add all the asset information in one go.
   * generally a manifest would be built using a tool.
   * @param manifest - the manifest to add to the resolver
   */
  addManifest(t) {
    this._manifest && J("[Resolver] Manifest already exists, this will be overwritten"), this._manifest = t, t.bundles.forEach((e) => {
      this.addBundle(e.name, e.assets);
    });
  }
  /**
   * This adds a bundle of assets in one go so that you can resolve them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * resolver.addBundle('animals', [
   *  { alias: 'bunny', src: 'bunny.png' },
   *  { alias: 'chicken', src: 'chicken.png' },
   *  { alias: 'thumper', src: 'thumper.png' },
   * ]);
   * // or
   * resolver.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const resolvedAssets = await resolver.resolveBundle('animals');
   * @param bundleId - The id of the bundle to add
   * @param assets - A record of the asset or assets that will be chosen from when loading via the specified key
   */
  addBundle(t, e) {
    const s = [];
    let i = e;
    Array.isArray(e) || (i = Object.entries(e).map(([n, o]) => typeof o == "string" || Array.isArray(o) ? { alias: n, src: o } : { alias: n, ...o })), i.forEach((n) => {
      const o = n.src, a = n.alias;
      let h;
      if (typeof a == "string") {
        const l = this._createBundleAssetId(t, a);
        s.push(l), h = [a, l];
      } else {
        const l = a.map((c) => this._createBundleAssetId(t, c));
        s.push(...l), h = [...a, ...l];
      }
      this.add({
        ...n,
        alias: h,
        src: o
      });
    }), this._bundles[t] = s;
  }
  /**
   * Tells the resolver what keys are associated with witch asset.
   * The most important thing the resolver does
   * @example
   * // Single key, single asset:
   * resolver.add({alias: 'foo', src: 'bar.png');
   * resolver.resolveUrl('foo') // => 'bar.png'
   *
   * // Multiple keys, single asset:
   * resolver.add({alias: ['foo', 'boo'], src: 'bar.png'});
   * resolver.resolveUrl('foo') // => 'bar.png'
   * resolver.resolveUrl('boo') // => 'bar.png'
   *
   * // Multiple keys, multiple assets:
   * resolver.add({alias: ['foo', 'boo'], src: ['bar.png', 'bar.webp']});
   * resolver.resolveUrl('foo') // => 'bar.png'
   *
   * // Add custom data attached to the resolver
   * Resolver.add({
   *     alias: 'bunnyBooBooSmooth',
   *     src: 'bunny{png,webp}',
   *     data: { scaleMode:SCALE_MODES.NEAREST }, // Base texture options
   * });
   *
   * resolver.resolve('bunnyBooBooSmooth') // => { src: 'bunny.png', data: { scaleMode: SCALE_MODES.NEAREST } }
   * @param aliases - the UnresolvedAsset or array of UnresolvedAssets to add to the resolver
   */
  add(t) {
    const e = [];
    Array.isArray(t) ? e.push(...t) : e.push(t);
    let s;
    s = (n) => {
      this.hasKey(n) && J(`[Resolver] already has key: ${n} overwriting`);
    }, Ut(e).forEach((n) => {
      const { src: o } = n;
      let {
        data: a,
        format: h,
        loadParser: l,
        parser: c
      } = n;
      const d = Ut(o).map((m) => typeof m == "string" ? qo(m) : Array.isArray(m) ? m : [m]), f = this.getAlias(n);
      Array.isArray(f) ? f.forEach(s) : s(f);
      const u = [], p = (m) => ({
        ...this._parsers.find((x) => x.test(m))?.parse(m),
        src: m
      });
      d.forEach((m) => {
        m.forEach((g) => {
          let x = {};
          if (typeof g != "object" ? x = p(g) : (a = g.data ?? a, h = g.format ?? h, (g.loadParser || g.parser) && (l = g.loadParser ?? l, c = g.parser ?? c), x = {
            ...p(g.src),
            ...g
          }), !f)
            throw new Error(`[Resolver] alias is undefined for this asset: ${x.src}`);
          x = this._buildResolvedAsset(x, {
            aliases: f,
            data: a,
            format: h,
            loadParser: l,
            parser: c,
            progressSize: n.progressSize
          }), u.push(x);
        });
      }), f.forEach((m) => {
        this._assetMap[m] = u;
      });
    });
  }
  // TODO: this needs an overload like load did in Assets
  /**
   * If the resolver has had a manifest set via setManifest, this will return the assets urls for
   * a given bundleId or bundleIds.
   * @example
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * resolver.setManifest(manifest);
   * const resolved = resolver.resolveBundle('load-screen');
   * @param bundleIds - The bundle ids to resolve
   * @returns All the bundles assets or a hash of assets for each bundle specified
   */
  resolveBundle(t) {
    const e = Ei(t);
    t = Ut(t);
    const s = {};
    return t.forEach((i) => {
      const n = this._bundles[i];
      if (n) {
        const o = this.resolve(n), a = {};
        for (const h in o) {
          const l = o[h];
          a[this._extractAssetIdFromBundle(i, h)] = l;
        }
        s[i] = a;
      }
    }), e ? s[t[0]] : s;
  }
  /**
   * Does exactly what resolve does, but returns just the URL rather than the whole asset object
   * @param key - The key or keys to resolve
   * @returns - The URLs associated with the key(s)
   */
  resolveUrl(t) {
    const e = this.resolve(t);
    if (typeof t != "string") {
      const s = {};
      for (const i in e)
        s[i] = e[i].src;
      return s;
    }
    return e.src;
  }
  resolve(t) {
    const e = Ei(t);
    t = Ut(t);
    const s = {};
    return t.forEach((i) => {
      if (!this._resolverHash[i])
        if (this._assetMap[i]) {
          let n = this._assetMap[i];
          const o = this._getPreferredOrder(n);
          o?.priority.forEach((a) => {
            o.params[a].forEach((h) => {
              const l = n.filter((c) => c[a] ? c[a] === h : !1);
              l.length && (n = l);
            });
          }), this._resolverHash[i] = n[0];
        } else
          this._resolverHash[i] = this._buildResolvedAsset({
            alias: [i],
            src: i
          }, {});
      s[i] = this._resolverHash[i];
    }), e ? s[t[0]] : s;
  }
  /**
   * Checks if an asset with a given key exists in the resolver
   * @param key - The key of the asset
   */
  hasKey(t) {
    return !!this._assetMap[t];
  }
  /**
   * Checks if a bundle with the given key exists in the resolver
   * @param key - The key of the bundle
   */
  hasBundle(t) {
    return !!this._bundles[t];
  }
  /**
   * Internal function for figuring out what prefer criteria an asset should use.
   * @param assets
   */
  _getPreferredOrder(t) {
    for (let e = 0; e < t.length; e++) {
      const s = t[e], i = this._preferredOrder.find((n) => n.params.format.includes(s.format));
      if (i)
        return i;
    }
    return this._preferredOrder[0];
  }
  /**
   * Appends the default url parameters to the url
   * @param url - The url to append the default parameters to
   * @returns - The url with the default parameters appended
   */
  _appendDefaultSearchParams(t) {
    if (!this._defaultSearchParams)
      return t;
    const e = /\?/.test(t) ? "&" : "?";
    return `${t}${e}${this._defaultSearchParams}`;
  }
  _buildResolvedAsset(t, e) {
    const { aliases: s, data: i, loadParser: n, parser: o, format: a, progressSize: h } = e;
    return (this._basePath || this._rootPath) && (t.src = ye.toAbsolute(t.src, this._basePath, this._rootPath)), t.alias = s ?? t.alias ?? [t.src], t.src = this._appendDefaultSearchParams(t.src), t.data = { ...i || {}, ...t.data }, t.loadParser = n ?? t.loadParser, t.parser = o ?? t.parser, t.format = a ?? t.format ?? Ko(t.src), h !== void 0 && (t.progressSize = h), t;
  }
}
tn.RETINA_PREFIX = /@([0-9\.]+)x/;
function Ko(r) {
  return r.split(".").pop().split("?").shift().split("#").shift();
}
const Ri = (r, t) => {
  const e = t.split("?")[1];
  return e && (r += `?${e}`), r;
}, en = class ce {
  constructor(t, e) {
    this.linkedSheets = [];
    let s = t;
    t?.source instanceof lt && (s = {
      texture: t,
      data: e
    });
    const { texture: i, data: n, cachePrefix: o = "" } = s;
    this.cachePrefix = o, this._texture = i instanceof D ? i : null, this.textureSource = i.source, this.textures = {}, this.animations = {}, this.data = n;
    const a = parseFloat(n.meta.scale);
    a ? (this.resolution = a, i.source.resolution = this.resolution) : this.resolution = i.source._resolution, this._frames = this.data.frames, this._frameKeys = Object.keys(this._frames), this._batchIndex = 0, this._callback = null;
  }
  /**
   * Parser spritesheet from loaded data. This is done asynchronously
   * to prevent creating too many Texture within a single process.
   */
  parse() {
    return new Promise((t) => {
      this._callback = t, this._batchIndex = 0, this._frameKeys.length <= ce.BATCH_SIZE ? (this._processFrames(0), this._processAnimations(), this._parseComplete()) : this._nextBatch();
    });
  }
  /**
   * Process a batch of frames
   * @param initialFrameIndex - The index of frame to start.
   */
  _processFrames(t) {
    let e = t;
    const s = ce.BATCH_SIZE;
    for (; e - t < s && e < this._frameKeys.length; ) {
      const i = this._frameKeys[e], n = this._frames[i], o = n.frame;
      if (o) {
        let a = null, h = null;
        const l = n.trimmed !== !1 && n.sourceSize ? n.sourceSize : n.frame, c = new j(
          0,
          0,
          Math.floor(l.w) / this.resolution,
          Math.floor(l.h) / this.resolution
        );
        n.rotated ? a = new j(
          Math.floor(o.x) / this.resolution,
          Math.floor(o.y) / this.resolution,
          Math.floor(o.h) / this.resolution,
          Math.floor(o.w) / this.resolution
        ) : a = new j(
          Math.floor(o.x) / this.resolution,
          Math.floor(o.y) / this.resolution,
          Math.floor(o.w) / this.resolution,
          Math.floor(o.h) / this.resolution
        ), n.trimmed !== !1 && n.spriteSourceSize && (h = new j(
          Math.floor(n.spriteSourceSize.x) / this.resolution,
          Math.floor(n.spriteSourceSize.y) / this.resolution,
          Math.floor(o.w) / this.resolution,
          Math.floor(o.h) / this.resolution
        )), this.textures[i] = new D({
          source: this.textureSource,
          frame: a,
          orig: c,
          trim: h,
          rotate: n.rotated ? 2 : 0,
          defaultAnchor: n.anchor,
          defaultBorders: n.borders,
          label: i.toString()
        });
      }
      e++;
    }
  }
  /** Parse animations config. */
  _processAnimations() {
    const t = this.data.animations || {};
    for (const e in t) {
      this.animations[e] = [];
      for (let s = 0; s < t[e].length; s++) {
        const i = t[e][s];
        this.animations[e].push(this.textures[i]);
      }
    }
  }
  /** The parse has completed. */
  _parseComplete() {
    const t = this._callback;
    this._callback = null, this._batchIndex = 0, t.call(this, this.textures);
  }
  /** Begin the next batch of textures. */
  _nextBatch() {
    this._processFrames(this._batchIndex * ce.BATCH_SIZE), this._batchIndex++, setTimeout(() => {
      this._batchIndex * ce.BATCH_SIZE < this._frameKeys.length ? this._nextBatch() : (this._processAnimations(), this._parseComplete());
    }, 0);
  }
  /**
   * Destroy Spritesheet and don't use after this.
   * @param {boolean} [destroyBase=false] - Whether to destroy the base texture as well
   */
  destroy(t = !1) {
    for (const e in this.textures)
      this.textures[e].destroy();
    this._frames = null, this._frameKeys = null, this.data = null, this.textures = null, t && (this._texture?.destroy(), this.textureSource.destroy()), this._texture = null, this.textureSource = null, this.linkedSheets = [];
  }
};
en.BATCH_SIZE = 1e3;
let Li = en;
const Zo = [
  "jpg",
  "png",
  "jpeg",
  "avif",
  "webp",
  "basis",
  "etc2",
  "bc7",
  "bc6h",
  "bc5",
  "bc4",
  "bc3",
  "bc2",
  "bc1",
  "eac",
  "astc"
];
function sn(r, t, e) {
  const s = {};
  if (r.forEach((i) => {
    s[i] = t;
  }), Object.keys(t.textures).forEach((i) => {
    s[`${t.cachePrefix}${i}`] = t.textures[i];
  }), !e) {
    const i = ye.dirname(r[0]);
    t.linkedSheets.forEach((n, o) => {
      const a = sn([`${i}/${t.data.meta.related_multi_packs[o]}`], n, !0);
      Object.assign(s, a);
    });
  }
  return s;
}
const Qo = {
  extension: z.Asset,
  /** Handle the caching of the related Spritesheet Textures */
  cache: {
    test: (r) => r instanceof Li,
    getCacheableAssets: (r, t) => sn(r, t, !1)
  },
  /** Resolve the resolution of the asset. */
  resolver: {
    extension: {
      type: z.ResolveParser,
      name: "resolveSpritesheet"
    },
    test: (r) => {
      const e = r.split("?")[0].split("."), s = e.pop(), i = e.pop();
      return s === "json" && Zo.includes(i);
    },
    parse: (r) => {
      const t = r.split(".");
      return {
        resolution: parseFloat(tn.RETINA_PREFIX.exec(r)?.[1] ?? "1"),
        format: t[t.length - 2],
        src: r
      };
    }
  },
  /**
   * Loader plugin that parses sprite sheets!
   * once the JSON has been loaded this checks to see if the JSON is spritesheet data.
   * If it is, we load the spritesheets image and parse the data into Spritesheet
   * All textures in the sprite sheet are then added to the cache
   */
  loader: {
    /** used for deprecation purposes */
    name: "spritesheetLoader",
    id: "spritesheet",
    extension: {
      type: z.LoadParser,
      priority: Qr.Normal,
      name: "spritesheetLoader"
    },
    async testParse(r, t) {
      return ye.extname(t.src).toLowerCase() === ".json" && !!r.frames;
    },
    async parse(r, t, e) {
      const {
        texture: s,
        // if user need to use preloaded texture
        imageFilename: i,
        // if user need to use custom filename (not from jsonFile.meta.image)
        textureOptions: n,
        // if user need to set texture options on texture
        cachePrefix: o
        // if user need to use custom cache prefix
      } = t?.data ?? {};
      let a = ye.dirname(t.src);
      a && a.lastIndexOf("/") !== a.length - 1 && (a += "/");
      let h;
      if (s instanceof D)
        h = s;
      else {
        const d = Ri(a + (i ?? r.meta.image), t.src);
        h = (await e.load([{ src: d, data: n }]))[d];
      }
      const l = new Li({
        texture: h.source,
        data: r,
        cachePrefix: o
      });
      await l.parse();
      const c = r?.meta?.related_multi_packs;
      if (Array.isArray(c)) {
        const d = [];
        for (const u of c) {
          if (typeof u != "string")
            continue;
          let p = a + u;
          t.data?.ignoreMultiPack || (p = Ri(p, t.src), d.push(e.load({
            src: p,
            data: {
              textureOptions: n,
              ignoreMultiPack: !0
            }
          })));
        }
        const f = await Promise.all(d);
        l.linkedSheets = f, f.forEach((u) => {
          u.linkedSheets = [l].concat(l.linkedSheets.filter((p) => p !== u));
        });
      }
      return l;
    },
    async unload(r, t, e) {
      await e.unload(r.textureSource._sourceOrigin), r.destroy(!1);
    }
  }
};
ht.add(Qo);
const _s = /* @__PURE__ */ Object.create(null), Fi = /* @__PURE__ */ Object.create(null);
function Js(r, t) {
  let e = Fi[r];
  return e === void 0 && (_s[t] === void 0 && (_s[t] = 1), Fi[r] = e = _s[t]++), e;
}
let Be;
function rn() {
  return (!Be || Be?.isContextLost()) && (Be = rt.get().createCanvas().getContext("webgl", {})), Be;
}
let Ge;
function Jo() {
  if (!Ge) {
    Ge = "mediump";
    const r = rn();
    r && r.getShaderPrecisionFormat && (Ge = r.getShaderPrecisionFormat(r.FRAGMENT_SHADER, r.HIGH_FLOAT).precision ? "highp" : "mediump");
  }
  return Ge;
}
function ta(r, t, e) {
  return t ? r : e ? (r = r.replace("out vec4 finalColor;", ""), `

        #ifdef GL_ES // This checks if it is WebGL1
        #define in varying
        #define finalColor gl_FragColor
        #define texture texture2D
        #endif
        ${r}
        `) : `

        #ifdef GL_ES // This checks if it is WebGL1
        #define in attribute
        #define out varying
        #endif
        ${r}
        `;
}
function ea(r, t, e) {
  const s = e ? t.maxSupportedFragmentPrecision : t.maxSupportedVertexPrecision;
  if (r.substring(0, 9) !== "precision") {
    let i = e ? t.requestedFragmentPrecision : t.requestedVertexPrecision;
    return i === "highp" && s !== "highp" && (i = "mediump"), `precision ${i} float;
${r}`;
  } else if (s !== "highp" && r.substring(0, 15) === "precision highp")
    return r.replace("precision highp", "precision mediump");
  return r;
}
function sa(r, t) {
  return t ? `#version 300 es
${r}` : r;
}
const ia = {}, ra = {};
function na(r, { name: t = "pixi-program" }, e = !0) {
  t = t.replace(/\s+/g, "-"), t += e ? "-fragment" : "-vertex";
  const s = e ? ia : ra;
  return s[t] ? (s[t]++, t += `-${s[t]}`) : s[t] = 1, r.indexOf("#define SHADER_NAME") !== -1 ? r : `${`#define SHADER_NAME ${t}`}
${r}`;
}
function oa(r, t) {
  return t ? r.replace("#version 300 es", "") : r;
}
const vs = {
  // strips any version headers..
  stripVersion: oa,
  // adds precision string if not already present
  ensurePrecision: ea,
  // add some defines if WebGL1 to make it more compatible with WebGL2 shaders
  addProgramDefines: ta,
  // add the program name to the shader
  setProgramName: na,
  // add the version string to the shader header
  insertVersion: sa
}, ie = /* @__PURE__ */ Object.create(null), nn = class zs {
  /**
   * Creates a shiny new GlProgram. Used by WebGL renderer.
   * @param options - The options for the program.
   */
  constructor(t) {
    t = { ...zs.defaultOptions, ...t };
    const e = t.fragment.indexOf("#version 300 es") !== -1, s = {
      stripVersion: e,
      ensurePrecision: {
        requestedFragmentPrecision: t.preferredFragmentPrecision,
        requestedVertexPrecision: t.preferredVertexPrecision,
        maxSupportedVertexPrecision: "highp",
        maxSupportedFragmentPrecision: Jo()
      },
      setProgramName: {
        name: t.name
      },
      addProgramDefines: e,
      insertVersion: e
    };
    let i = t.fragment, n = t.vertex;
    Object.keys(vs).forEach((o) => {
      const a = s[o];
      i = vs[o](i, a, !0), n = vs[o](n, a, !1);
    }), this.fragment = i, this.vertex = n, this.transformFeedbackVaryings = t.transformFeedbackVaryings, this._key = Js(`${this.vertex}:${this.fragment}`, "gl-program");
  }
  /** destroys the program */
  destroy() {
    this.fragment = null, this.vertex = null, this._attributeData = null, this._uniformData = null, this._uniformBlockData = null, this.transformFeedbackVaryings = null, ie[this._cacheKey] = null;
  }
  /**
   * Helper function that creates a program for a given source.
   * It will check the program cache if the program has already been created.
   * If it has that one will be returned, if not a new one will be created and cached.
   * @param options - The options for the program.
   * @returns A program using the same source
   */
  static from(t) {
    const e = `${t.vertex}:${t.fragment}`;
    return ie[e] || (ie[e] = new zs(t), ie[e]._cacheKey = e), ie[e];
  }
};
nn.defaultOptions = {
  preferredVertexPrecision: "highp",
  preferredFragmentPrecision: "mediump"
};
let on = nn;
const Ni = {
  uint8x2: { size: 2, stride: 2, normalised: !1 },
  uint8x4: { size: 4, stride: 4, normalised: !1 },
  sint8x2: { size: 2, stride: 2, normalised: !1 },
  sint8x4: { size: 4, stride: 4, normalised: !1 },
  unorm8x2: { size: 2, stride: 2, normalised: !0 },
  unorm8x4: { size: 4, stride: 4, normalised: !0 },
  snorm8x2: { size: 2, stride: 2, normalised: !0 },
  snorm8x4: { size: 4, stride: 4, normalised: !0 },
  uint16x2: { size: 2, stride: 4, normalised: !1 },
  uint16x4: { size: 4, stride: 8, normalised: !1 },
  sint16x2: { size: 2, stride: 4, normalised: !1 },
  sint16x4: { size: 4, stride: 8, normalised: !1 },
  unorm16x2: { size: 2, stride: 4, normalised: !0 },
  unorm16x4: { size: 4, stride: 8, normalised: !0 },
  snorm16x2: { size: 2, stride: 4, normalised: !0 },
  snorm16x4: { size: 4, stride: 8, normalised: !0 },
  float16x2: { size: 2, stride: 4, normalised: !1 },
  float16x4: { size: 4, stride: 8, normalised: !1 },
  float32: { size: 1, stride: 4, normalised: !1 },
  float32x2: { size: 2, stride: 8, normalised: !1 },
  float32x3: { size: 3, stride: 12, normalised: !1 },
  float32x4: { size: 4, stride: 16, normalised: !1 },
  uint32: { size: 1, stride: 4, normalised: !1 },
  uint32x2: { size: 2, stride: 8, normalised: !1 },
  uint32x3: { size: 3, stride: 12, normalised: !1 },
  uint32x4: { size: 4, stride: 16, normalised: !1 },
  sint32: { size: 1, stride: 4, normalised: !1 },
  sint32x2: { size: 2, stride: 8, normalised: !1 },
  sint32x3: { size: 3, stride: 12, normalised: !1 },
  sint32x4: { size: 4, stride: 16, normalised: !1 }
};
function aa(r) {
  return Ni[r] ?? Ni.float32;
}
const ha = {
  f32: "float32",
  "vec2<f32>": "float32x2",
  "vec3<f32>": "float32x3",
  "vec4<f32>": "float32x4",
  vec2f: "float32x2",
  vec3f: "float32x3",
  vec4f: "float32x4",
  i32: "sint32",
  "vec2<i32>": "sint32x2",
  "vec3<i32>": "sint32x3",
  "vec4<i32>": "sint32x4",
  u32: "uint32",
  "vec2<u32>": "uint32x2",
  "vec3<u32>": "uint32x3",
  "vec4<u32>": "uint32x4",
  bool: "uint32",
  "vec2<bool>": "uint32x2",
  "vec3<bool>": "uint32x3",
  "vec4<bool>": "uint32x4"
};
function la({ source: r, entryPoint: t }) {
  const e = {}, s = r.indexOf(`fn ${t}`);
  if (s !== -1) {
    const i = r.indexOf("->", s);
    if (i !== -1) {
      const n = r.substring(s, i), o = /@location\((\d+)\)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>]+)(?:,|\s|$)/g;
      let a;
      for (; (a = o.exec(n)) !== null; ) {
        const h = ha[a[3]] ?? "float32";
        e[a[2]] = {
          location: parseInt(a[1], 10),
          format: h,
          stride: aa(h).stride,
          offset: 0,
          instance: !1,
          start: 0
        };
      }
    }
  }
  return e;
}
function Ss(r) {
  const t = /(^|[^/])@(group|binding)\(\d+\)[^;]+;/g, e = /@group\((\d+)\)/, s = /@binding\((\d+)\)/, i = /var(<[^>]+>)? (\w+)/, n = /:\s*(\w+)/, o = /struct\s+(\w+)\s*{([^}]+)}/g, a = /(\w+)\s*:\s*([\w\<\>]+)/g, h = /struct\s+(\w+)/, l = r.match(t)?.map((d) => ({
    group: parseInt(d.match(e)[1], 10),
    binding: parseInt(d.match(s)[1], 10),
    name: d.match(i)[2],
    isUniform: d.match(i)[1] === "<uniform>",
    type: d.match(n)[1]
  }));
  if (!l)
    return {
      groups: [],
      structs: []
    };
  const c = r.match(o)?.map((d) => {
    const f = d.match(h)[1], u = d.match(a).reduce((p, m) => {
      const [g, x] = m.split(":");
      return p[g.trim()] = x.trim(), p;
    }, {});
    return u ? { name: f, members: u } : null;
  }).filter(({ name: d }) => l.some((f) => f.type === d)) ?? [];
  return {
    groups: l,
    structs: c
  };
}
var de = /* @__PURE__ */ ((r) => (r[r.VERTEX = 1] = "VERTEX", r[r.FRAGMENT = 2] = "FRAGMENT", r[r.COMPUTE = 4] = "COMPUTE", r))(de || {});
function ca({ groups: r }) {
  const t = [];
  for (let e = 0; e < r.length; e++) {
    const s = r[e];
    t[s.group] || (t[s.group] = []), s.isUniform ? t[s.group].push({
      binding: s.binding,
      visibility: de.VERTEX | de.FRAGMENT,
      buffer: {
        type: "uniform"
      }
    }) : s.type === "sampler" ? t[s.group].push({
      binding: s.binding,
      visibility: de.FRAGMENT,
      sampler: {
        type: "filtering"
      }
    }) : s.type === "texture_2d" && t[s.group].push({
      binding: s.binding,
      visibility: de.FRAGMENT,
      texture: {
        sampleType: "float",
        viewDimension: "2d",
        multisampled: !1
      }
    });
  }
  return t;
}
function da({ groups: r }) {
  const t = [];
  for (let e = 0; e < r.length; e++) {
    const s = r[e];
    t[s.group] || (t[s.group] = {}), t[s.group][s.name] = s.binding;
  }
  return t;
}
function ua(r, t) {
  const e = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), i = [...r.structs, ...t.structs].filter((o) => e.has(o.name) ? !1 : (e.add(o.name), !0)), n = [...r.groups, ...t.groups].filter((o) => {
    const a = `${o.name}-${o.binding}`;
    return s.has(a) ? !1 : (s.add(a), !0);
  });
  return { structs: i, groups: n };
}
const re = /* @__PURE__ */ Object.create(null);
class ts {
  /**
   * Create a new GpuProgram
   * @param options - The options for the gpu program
   */
  constructor(t) {
    this._layoutKey = 0, this._attributeLocationsKey = 0;
    const { fragment: e, vertex: s, layout: i, gpuLayout: n, name: o } = t;
    if (this.name = o, this.fragment = e, this.vertex = s, e.source === s.source) {
      const a = Ss(e.source);
      this.structsAndGroups = a;
    } else {
      const a = Ss(s.source), h = Ss(e.source);
      this.structsAndGroups = ua(a, h);
    }
    this.layout = i ?? da(this.structsAndGroups), this.gpuLayout = n ?? ca(this.structsAndGroups), this.autoAssignGlobalUniforms = this.layout[0]?.globalUniforms !== void 0, this.autoAssignLocalUniforms = this.layout[1]?.localUniforms !== void 0, this._generateProgramKey();
  }
  // TODO maker this pure
  _generateProgramKey() {
    const { vertex: t, fragment: e } = this, s = t.source + e.source + t.entryPoint + e.entryPoint;
    this._layoutKey = Js(s, "program");
  }
  get attributeData() {
    return this._attributeData ?? (this._attributeData = la(this.vertex)), this._attributeData;
  }
  /** destroys the program */
  destroy() {
    this.gpuLayout = null, this.layout = null, this.structsAndGroups = null, this.fragment = null, this.vertex = null, re[this._cacheKey] = null;
  }
  /**
   * Helper function that creates a program for a given source.
   * It will check the program cache if the program has already been created.
   * If it has that one will be returned, if not a new one will be created and cached.
   * @param options - The options for the program.
   * @returns A program using the same source
   */
  static from(t) {
    const e = `${t.vertex.source}:${t.fragment.source}:${t.fragment.entryPoint}:${t.vertex.entryPoint}`;
    return re[e] || (re[e] = new ts(t), re[e]._cacheKey = e), re[e];
  }
}
const an = [
  "f32",
  "i32",
  "vec2<f32>",
  "vec3<f32>",
  "vec4<f32>",
  "mat2x2<f32>",
  "mat3x3<f32>",
  "mat4x4<f32>",
  "mat3x2<f32>",
  "mat4x2<f32>",
  "mat2x3<f32>",
  "mat4x3<f32>",
  "mat2x4<f32>",
  "mat3x4<f32>",
  "vec2<i32>",
  "vec3<i32>",
  "vec4<i32>"
], fa = an.reduce((r, t) => (r[t] = !0, r), {});
function pa(r, t) {
  switch (r) {
    case "f32":
      return 0;
    case "vec2<f32>":
      return new Float32Array(2 * t);
    case "vec3<f32>":
      return new Float32Array(3 * t);
    case "vec4<f32>":
      return new Float32Array(4 * t);
    case "mat2x2<f32>":
      return new Float32Array([
        1,
        0,
        0,
        1
      ]);
    case "mat3x3<f32>":
      return new Float32Array([
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1
      ]);
    case "mat4x4<f32>":
      return new Float32Array([
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1
      ]);
  }
  return null;
}
const hn = class ln {
  /**
   * Create a new Uniform group
   * @param uniformStructures - The structures of the uniform group
   * @param options - The optional parameters of this uniform group
   */
  constructor(t, e) {
    this._touched = 0, this.uid = U("uniform"), this._resourceType = "uniformGroup", this._resourceId = U("resource"), this.isUniformGroup = !0, this._dirtyId = 0, this.destroyed = !1, e = { ...ln.defaultOptions, ...e }, this.uniformStructures = t;
    const s = {};
    for (const i in t) {
      const n = t[i];
      if (n.name = i, n.size = n.size ?? 1, !fa[n.type]) {
        const o = n.type.match(/^array<(\w+(?:<\w+>)?),\s*(\d+)>$/);
        if (o) {
          const [, a, h] = o;
          throw new Error(
            `Uniform type ${n.type} is not supported. Use type: '${a}', size: ${h} instead.`
          );
        }
        throw new Error(`Uniform type ${n.type} is not supported. Supported uniform types are: ${an.join(", ")}`);
      }
      n.value ?? (n.value = pa(n.type, n.size)), s[i] = n.value;
    }
    this.uniforms = s, this._dirtyId = 1, this.ubo = e.ubo, this.isStatic = e.isStatic, this._signature = Js(Object.keys(s).map(
      (i) => `${i}-${t[i].type}`
    ).join("-"), "uniform-group");
  }
  /** Call this if you want the uniform groups data to be uploaded to the GPU only useful if `isStatic` is true. */
  update() {
    this._dirtyId++;
  }
};
hn.defaultOptions = {
  /** if true the UniformGroup is handled as an Uniform buffer object. */
  ubo: !1,
  /** if true, then you are responsible for when the data is uploaded to the GPU by calling `update()` */
  isStatic: !1
};
let cn = hn;
class $e {
  /**
   * Create a new instance eof the Bind Group.
   * @param resources - The resources that are bound together for use by a shader.
   */
  constructor(t) {
    this.resources = /* @__PURE__ */ Object.create(null), this._dirty = !0;
    let e = 0;
    for (const s in t) {
      const i = t[s];
      this.setResource(i, e++);
    }
    this._updateKey();
  }
  /**
   * Updates the key if its flagged as dirty. This is used internally to
   * match this bind group to a WebGPU BindGroup.
   * @internal
   */
  _updateKey() {
    if (!this._dirty)
      return;
    this._dirty = !1;
    const t = [];
    let e = 0;
    for (const s in this.resources)
      t[e++] = this.resources[s]._resourceId;
    this._key = t.join("|");
  }
  /**
   * Set a resource at a given index. this function will
   * ensure that listeners will be removed from the current resource
   * and added to the new resource.
   * @param resource - The resource to set.
   * @param index - The index to set the resource at.
   */
  setResource(t, e) {
    const s = this.resources[e];
    t !== s && (s && t.off?.("change", this.onResourceChange, this), t.on?.("change", this.onResourceChange, this), this.resources[e] = t, this._dirty = !0);
  }
  /**
   * Returns the resource at the current specified index.
   * @param index - The index of the resource to get.
   * @returns - The resource at the specified index.
   */
  getResource(t) {
    return this.resources[t];
  }
  /**
   * Used internally to 'touch' each resource, to ensure that the GC
   * knows that all resources in this bind group are still being used.
   * @param now - The current time in milliseconds.
   * @param tick - The current tick.
   * @internal
   */
  _touch(t, e) {
    const s = this.resources;
    for (const i in s)
      s[i]._gcLastUsed = t, s[i]._touched = e;
  }
  /** Destroys this bind group and removes all listeners. */
  destroy() {
    const t = this.resources;
    for (const e in t)
      t[e]?.off?.("change", this.onResourceChange, this);
    this.resources = null;
  }
  onResourceChange(t) {
    if (this._dirty = !0, t.destroyed) {
      const e = this.resources;
      for (const s in e)
        e[s] === t && (e[s] = null);
    } else
      this._updateKey();
  }
}
var Ys = /* @__PURE__ */ ((r) => (r[r.WEBGL = 1] = "WEBGL", r[r.WEBGPU = 2] = "WEBGPU", r[r.BOTH = 3] = "BOTH", r))(Ys || {});
class ti extends xt {
  constructor(t) {
    super(), this.uid = U("shader"), this._uniformBindMap = /* @__PURE__ */ Object.create(null), this._ownedBindGroups = [], this._destroyed = !1;
    let {
      gpuProgram: e,
      glProgram: s,
      groups: i,
      resources: n,
      compatibleRenderers: o,
      groupMap: a
    } = t;
    this.gpuProgram = e, this.glProgram = s, o === void 0 && (o = 0, e && (o |= Ys.WEBGPU), s && (o |= Ys.WEBGL)), this.compatibleRenderers = o;
    const h = {};
    if (!n && !i && (n = {}), n && i)
      throw new Error("[Shader] Cannot have both resources and groups");
    if (!e && i && !a)
      throw new Error("[Shader] No group map or WebGPU shader provided - consider using resources instead.");
    if (!e && i && a)
      for (const l in a)
        for (const c in a[l]) {
          const d = a[l][c];
          h[d] = {
            group: l,
            binding: c,
            name: d
          };
        }
    else if (e && i && !a) {
      const l = e.structsAndGroups.groups;
      a = {}, l.forEach((c) => {
        a[c.group] = a[c.group] || {}, a[c.group][c.binding] = c.name, h[c.name] = c;
      });
    } else if (n) {
      i = {}, a = {}, e && e.structsAndGroups.groups.forEach((d) => {
        a[d.group] = a[d.group] || {}, a[d.group][d.binding] = d.name, h[d.name] = d;
      });
      let l = 0;
      for (const c in n)
        h[c] || (i[99] || (i[99] = new $e(), this._ownedBindGroups.push(i[99])), h[c] = { group: 99, binding: l, name: c }, a[99] = a[99] || {}, a[99][l] = c, l++);
      for (const c in n) {
        const d = c;
        let f = n[c];
        !f.source && !f._resourceType && (f = new cn(f));
        const u = h[d];
        u && (i[u.group] || (i[u.group] = new $e(), this._ownedBindGroups.push(i[u.group])), i[u.group].setResource(f, u.binding));
      }
    }
    this.groups = i, this._uniformBindMap = a, this.resources = this._buildResourceAccessor(i, h);
  }
  /**
   * Sometimes a resource group will be provided later (for example global uniforms)
   * In such cases, this method can be used to let the shader know about the group.
   * @param name - the name of the resource group
   * @param groupIndex - the index of the group (should match the webGPU shader group location)
   * @param bindIndex - the index of the bind point (should match the webGPU shader bind point)
   */
  addResource(t, e, s) {
    var i, n;
    (i = this._uniformBindMap)[e] || (i[e] = {}), (n = this._uniformBindMap[e])[s] || (n[s] = t), this.groups[e] || (this.groups[e] = new $e(), this._ownedBindGroups.push(this.groups[e]));
  }
  _buildResourceAccessor(t, e) {
    const s = {};
    for (const i in e) {
      const n = e[i];
      Object.defineProperty(s, n.name, {
        get() {
          return t[n.group].getResource(n.binding);
        },
        set(o) {
          t[n.group].setResource(o, n.binding);
        }
      });
    }
    return s;
  }
  /**
   * Use to destroy the shader when its not longer needed.
   * It will destroy the resources and remove listeners.
   * @param destroyPrograms - if the programs should be destroyed as well.
   * Make sure its not being used by other shaders!
   */
  destroy(t = !1) {
    this._destroyed || (this._destroyed = !0, this.emit("destroy", this), t && (this.gpuProgram?.destroy(), this.glProgram?.destroy()), this.gpuProgram = null, this.glProgram = null, this.removeAllListeners(), this._uniformBindMap = null, this._ownedBindGroups.forEach((e) => {
      e.destroy();
    }), this._ownedBindGroups = null, this.resources = null, this.groups = null);
  }
  static from(t) {
    const { gpu: e, gl: s, ...i } = t;
    let n, o;
    return e && (n = ts.from(e)), s && (o = on.from(s)), new ti({
      gpuProgram: n,
      glProgram: o,
      ...i
    });
  }
}
const Xs = [];
ht.handleByNamedList(z.Environment, Xs);
async function ga(r) {
  if (!r)
    for (let t = 0; t < Xs.length; t++) {
      const e = Xs[t];
      if (e.value.test()) {
        await e.value.load();
        return;
      }
    }
}
let ne;
function ma() {
  if (typeof ne == "boolean")
    return ne;
  try {
    ne = new Function("param1", "param2", "param3", "return param1[param2] === param3;")({ a: "b" }, "a", "b") === !0;
  } catch {
    ne = !1;
  }
  return ne;
}
function Bi(r, t, e = 2) {
  const s = t && t.length, i = s ? t[0] * e : r.length;
  let n = dn(r, 0, i, e, !0);
  const o = [];
  if (!n || n.next === n.prev) return o;
  let a, h, l;
  if (s && (n = _a(r, t, n, e)), r.length > 80 * e) {
    a = r[0], h = r[1];
    let c = a, d = h;
    for (let f = e; f < i; f += e) {
      const u = r[f], p = r[f + 1];
      u < a && (a = u), p < h && (h = p), u > c && (c = u), p > d && (d = p);
    }
    l = Math.max(c - a, d - h), l = l !== 0 ? 32767 / l : 0;
  }
  return xe(n, o, e, a, h, l, 0), o;
}
function dn(r, t, e, s, i) {
  let n;
  if (i === Ra(r, t, e, s) > 0)
    for (let o = t; o < e; o += s) n = Gi(o / s | 0, r[o], r[o + 1], n);
  else
    for (let o = e - s; o >= t; o -= s) n = Gi(o / s | 0, r[o], r[o + 1], n);
  return n && te(n, n.next) && (we(n), n = n.next), n;
}
function Ht(r, t) {
  if (!r) return r;
  t || (t = r);
  let e = r, s;
  do
    if (s = !1, !e.steiner && (te(e, e.next) || H(e.prev, e, e.next) === 0)) {
      if (we(e), e = t = e.prev, e === e.next) break;
      s = !0;
    } else
      e = e.next;
  while (s || e !== t);
  return t;
}
function xe(r, t, e, s, i, n, o) {
  if (!r) return;
  !o && n && Pa(r, s, i, n);
  let a = r;
  for (; r.prev !== r.next; ) {
    const h = r.prev, l = r.next;
    if (n ? xa(r, s, i, n) : ya(r)) {
      t.push(h.i, r.i, l.i), we(r), r = l.next, a = l.next;
      continue;
    }
    if (r = l, r === a) {
      o ? o === 1 ? (r = ba(Ht(r), t), xe(r, t, e, s, i, n, 2)) : o === 2 && wa(r, t, e, s, i, n) : xe(Ht(r), t, e, s, i, n, 1);
      break;
    }
  }
}
function ya(r) {
  const t = r.prev, e = r, s = r.next;
  if (H(t, e, s) >= 0) return !1;
  const i = t.x, n = e.x, o = s.x, a = t.y, h = e.y, l = s.y, c = Math.min(i, n, o), d = Math.min(a, h, l), f = Math.max(i, n, o), u = Math.max(a, h, l);
  let p = s.next;
  for (; p !== t; ) {
    if (p.x >= c && p.x <= f && p.y >= d && p.y <= u && ue(i, a, n, h, o, l, p.x, p.y) && H(p.prev, p, p.next) >= 0) return !1;
    p = p.next;
  }
  return !0;
}
function xa(r, t, e, s) {
  const i = r.prev, n = r, o = r.next;
  if (H(i, n, o) >= 0) return !1;
  const a = i.x, h = n.x, l = o.x, c = i.y, d = n.y, f = o.y, u = Math.min(a, h, l), p = Math.min(c, d, f), m = Math.max(a, h, l), g = Math.max(c, d, f), x = Hs(u, p, t, e, s), y = Hs(m, g, t, e, s);
  let b = r.prevZ, w = r.nextZ;
  for (; b && b.z >= x && w && w.z <= y; ) {
    if (b.x >= u && b.x <= m && b.y >= p && b.y <= g && b !== i && b !== o && ue(a, c, h, d, l, f, b.x, b.y) && H(b.prev, b, b.next) >= 0 || (b = b.prevZ, w.x >= u && w.x <= m && w.y >= p && w.y <= g && w !== i && w !== o && ue(a, c, h, d, l, f, w.x, w.y) && H(w.prev, w, w.next) >= 0)) return !1;
    w = w.nextZ;
  }
  for (; b && b.z >= x; ) {
    if (b.x >= u && b.x <= m && b.y >= p && b.y <= g && b !== i && b !== o && ue(a, c, h, d, l, f, b.x, b.y) && H(b.prev, b, b.next) >= 0) return !1;
    b = b.prevZ;
  }
  for (; w && w.z <= y; ) {
    if (w.x >= u && w.x <= m && w.y >= p && w.y <= g && w !== i && w !== o && ue(a, c, h, d, l, f, w.x, w.y) && H(w.prev, w, w.next) >= 0) return !1;
    w = w.nextZ;
  }
  return !0;
}
function ba(r, t) {
  let e = r;
  do {
    const s = e.prev, i = e.next.next;
    !te(s, i) && fn(s, e, e.next, i) && be(s, i) && be(i, s) && (t.push(s.i, e.i, i.i), we(e), we(e.next), e = r = i), e = e.next;
  } while (e !== r);
  return Ht(e);
}
function wa(r, t, e, s, i, n) {
  let o = r;
  do {
    let a = o.next.next;
    for (; a !== o.prev; ) {
      if (o.i !== a.i && Aa(o, a)) {
        let h = pn(o, a);
        o = Ht(o, o.next), h = Ht(h, h.next), xe(o, t, e, s, i, n, 0), xe(h, t, e, s, i, n, 0);
        return;
      }
      a = a.next;
    }
    o = o.next;
  } while (o !== r);
}
function _a(r, t, e, s) {
  const i = [];
  for (let n = 0, o = t.length; n < o; n++) {
    const a = t[n] * s, h = n < o - 1 ? t[n + 1] * s : r.length, l = dn(r, a, h, s, !1);
    l === l.next && (l.steiner = !0), i.push(Ta(l));
  }
  i.sort(va);
  for (let n = 0; n < i.length; n++)
    e = Sa(i[n], e);
  return e;
}
function va(r, t) {
  let e = r.x - t.x;
  if (e === 0 && (e = r.y - t.y, e === 0)) {
    const s = (r.next.y - r.y) / (r.next.x - r.x), i = (t.next.y - t.y) / (t.next.x - t.x);
    e = s - i;
  }
  return e;
}
function Sa(r, t) {
  const e = Ca(r, t);
  if (!e)
    return t;
  const s = pn(e, r);
  return Ht(s, s.next), Ht(e, e.next);
}
function Ca(r, t) {
  let e = t;
  const s = r.x, i = r.y;
  let n = -1 / 0, o;
  if (te(r, e)) return e;
  do {
    if (te(r, e.next)) return e.next;
    if (i <= e.y && i >= e.next.y && e.next.y !== e.y) {
      const d = e.x + (i - e.y) * (e.next.x - e.x) / (e.next.y - e.y);
      if (d <= s && d > n && (n = d, o = e.x < e.next.x ? e : e.next, d === s))
        return o;
    }
    e = e.next;
  } while (e !== t);
  if (!o) return null;
  const a = o, h = o.x, l = o.y;
  let c = 1 / 0;
  e = o;
  do {
    if (s >= e.x && e.x >= h && s !== e.x && un(i < l ? s : n, i, h, l, i < l ? n : s, i, e.x, e.y)) {
      const d = Math.abs(i - e.y) / (s - e.x);
      be(e, r) && (d < c || d === c && (e.x > o.x || e.x === o.x && Ma(o, e))) && (o = e, c = d);
    }
    e = e.next;
  } while (e !== a);
  return o;
}
function Ma(r, t) {
  return H(r.prev, r, t.prev) < 0 && H(t.next, r, r.next) < 0;
}
function Pa(r, t, e, s) {
  let i = r;
  do
    i.z === 0 && (i.z = Hs(i.x, i.y, t, e, s)), i.prevZ = i.prev, i.nextZ = i.next, i = i.next;
  while (i !== r);
  i.prevZ.nextZ = null, i.prevZ = null, ka(i);
}
function ka(r) {
  let t, e = 1;
  do {
    let s = r, i;
    r = null;
    let n = null;
    for (t = 0; s; ) {
      t++;
      let o = s, a = 0;
      for (let l = 0; l < e && (a++, o = o.nextZ, !!o); l++)
        ;
      let h = e;
      for (; a > 0 || h > 0 && o; )
        a !== 0 && (h === 0 || !o || s.z <= o.z) ? (i = s, s = s.nextZ, a--) : (i = o, o = o.nextZ, h--), n ? n.nextZ = i : r = i, i.prevZ = n, n = i;
      s = o;
    }
    n.nextZ = null, e *= 2;
  } while (t > 1);
  return r;
}
function Hs(r, t, e, s, i) {
  return r = (r - e) * i | 0, t = (t - s) * i | 0, r = (r | r << 8) & 16711935, r = (r | r << 4) & 252645135, r = (r | r << 2) & 858993459, r = (r | r << 1) & 1431655765, t = (t | t << 8) & 16711935, t = (t | t << 4) & 252645135, t = (t | t << 2) & 858993459, t = (t | t << 1) & 1431655765, r | t << 1;
}
function Ta(r) {
  let t = r, e = r;
  do
    (t.x < e.x || t.x === e.x && t.y < e.y) && (e = t), t = t.next;
  while (t !== r);
  return e;
}
function un(r, t, e, s, i, n, o, a) {
  return (i - o) * (t - a) >= (r - o) * (n - a) && (r - o) * (s - a) >= (e - o) * (t - a) && (e - o) * (n - a) >= (i - o) * (s - a);
}
function ue(r, t, e, s, i, n, o, a) {
  return !(r === o && t === a) && un(r, t, e, s, i, n, o, a);
}
function Aa(r, t) {
  return r.next.i !== t.i && r.prev.i !== t.i && !Ia(r, t) && // doesn't intersect other edges
  (be(r, t) && be(t, r) && Ea(r, t) && // locally visible
  (H(r.prev, r, t.prev) || H(r, t.prev, t)) || // does not create opposite-facing sectors
  te(r, t) && H(r.prev, r, r.next) > 0 && H(t.prev, t, t.next) > 0);
}
function H(r, t, e) {
  return (t.y - r.y) * (e.x - t.x) - (t.x - r.x) * (e.y - t.y);
}
function te(r, t) {
  return r.x === t.x && r.y === t.y;
}
function fn(r, t, e, s) {
  const i = ze(H(r, t, e)), n = ze(H(r, t, s)), o = ze(H(e, s, r)), a = ze(H(e, s, t));
  return !!(i !== n && o !== a || i === 0 && De(r, e, t) || n === 0 && De(r, s, t) || o === 0 && De(e, r, s) || a === 0 && De(e, t, s));
}
function De(r, t, e) {
  return t.x <= Math.max(r.x, e.x) && t.x >= Math.min(r.x, e.x) && t.y <= Math.max(r.y, e.y) && t.y >= Math.min(r.y, e.y);
}
function ze(r) {
  return r > 0 ? 1 : r < 0 ? -1 : 0;
}
function Ia(r, t) {
  let e = r;
  do {
    if (e.i !== r.i && e.next.i !== r.i && e.i !== t.i && e.next.i !== t.i && fn(e, e.next, r, t)) return !0;
    e = e.next;
  } while (e !== r);
  return !1;
}
function be(r, t) {
  return H(r.prev, r, r.next) < 0 ? H(r, t, r.next) >= 0 && H(r, r.prev, t) >= 0 : H(r, t, r.prev) < 0 || H(r, r.next, t) < 0;
}
function Ea(r, t) {
  let e = r, s = !1;
  const i = (r.x + t.x) / 2, n = (r.y + t.y) / 2;
  do
    e.y > n != e.next.y > n && e.next.y !== e.y && i < (e.next.x - e.x) * (n - e.y) / (e.next.y - e.y) + e.x && (s = !s), e = e.next;
  while (e !== r);
  return s;
}
function pn(r, t) {
  const e = Os(r.i, r.x, r.y), s = Os(t.i, t.x, t.y), i = r.next, n = t.prev;
  return r.next = t, t.prev = r, e.next = i, i.prev = e, s.next = e, e.prev = s, n.next = s, s.prev = n, s;
}
function Gi(r, t, e, s) {
  const i = Os(r, t, e);
  return s ? (i.next = s.next, i.prev = s, s.next.prev = i, s.next = i) : (i.prev = i, i.next = i), i;
}
function we(r) {
  r.next.prev = r.prev, r.prev.next = r.next, r.prevZ && (r.prevZ.nextZ = r.nextZ), r.nextZ && (r.nextZ.prevZ = r.prevZ);
}
function Os(r, t, e) {
  return {
    i: r,
    // vertex index in coordinates array
    x: t,
    y: e,
    // vertex coordinates
    prev: null,
    // previous and next vertex nodes in a polygon ring
    next: null,
    z: 0,
    // z-order curve value
    prevZ: null,
    // previous and next nodes in z-order
    nextZ: null,
    steiner: !1
    // indicates whether this is a steiner point
  };
}
function Ra(r, t, e, s) {
  let i = 0;
  for (let n = t, o = e - s; n < e; n += s)
    i += (r[o] - r[n]) * (r[n + 1] + r[o + 1]), o = n;
  return i;
}
const La = Bi.default || Bi;
var gn = /* @__PURE__ */ ((r) => (r[r.NONE = 0] = "NONE", r[r.COLOR = 16384] = "COLOR", r[r.STENCIL = 1024] = "STENCIL", r[r.DEPTH = 256] = "DEPTH", r[r.COLOR_DEPTH = 16640] = "COLOR_DEPTH", r[r.COLOR_STENCIL = 17408] = "COLOR_STENCIL", r[r.DEPTH_STENCIL = 1280] = "DEPTH_STENCIL", r[r.ALL = 17664] = "ALL", r))(gn || {});
class Fa {
  /**
   * @param name - The function name that will be executed on the listeners added to this Runner.
   */
  constructor(t) {
    this.items = [], this._name = t;
  }
  /* jsdoc/check-param-names */
  /**
   * Dispatch/Broadcast Runner to all listeners added to the queue.
   * @param {...any} params - (optional) parameters to pass to each listener
   */
  /* jsdoc/check-param-names */
  emit(t, e, s, i, n, o, a, h) {
    const { name: l, items: c } = this;
    for (let d = 0, f = c.length; d < f; d++)
      c[d][l](t, e, s, i, n, o, a, h);
    return this;
  }
  /**
   * Add a listener to the Runner
   *
   * Runners do not need to have scope or functions passed to them.
   * All that is required is to pass the listening object and ensure that it has contains a function that has the same name
   * as the name provided to the Runner when it was created.
   *
   * Eg A listener passed to this Runner will require a 'complete' function.
   *
   * ```ts
   * import { Runner } from 'pixi.js';
   *
   * const complete = new Runner('complete');
   * ```
   *
   * The scope used will be the object itself.
   * @param {any} item - The object that will be listening.
   */
  add(t) {
    return t[this._name] && (this.remove(t), this.items.push(t)), this;
  }
  /**
   * Remove a single listener from the dispatch queue.
   * @param {any} item - The listener that you would like to remove.
   */
  remove(t) {
    const e = this.items.indexOf(t);
    return e !== -1 && this.items.splice(e, 1), this;
  }
  /**
   * Check to see if the listener is already in the Runner
   * @param {any} item - The listener that you would like to check.
   */
  contains(t) {
    return this.items.indexOf(t) !== -1;
  }
  /** Remove all listeners from the Runner */
  removeAll() {
    return this.items.length = 0, this;
  }
  /** Remove all references, don't use after this. */
  destroy() {
    this.removeAll(), this.items = null, this._name = null;
  }
  /**
   * `true` if there are no this Runner contains no listeners
   * @readonly
   */
  get empty() {
    return this.items.length === 0;
  }
  /**
   * The name of the runner.
   * @readonly
   */
  get name() {
    return this._name;
  }
}
const Na = [
  "init",
  "destroy",
  "contextChange",
  "resolutionChange",
  "resetState",
  "renderEnd",
  "renderStart",
  "render",
  "update",
  "postrender",
  "prerender"
], mn = class yn extends xt {
  /**
   * Set up a system with a collection of SystemClasses and runners.
   * Systems are attached dynamically to this class when added.
   * @param config - the config for the system manager
   */
  constructor(t) {
    super(), this.tick = 0, this.uid = U("renderer"), this.runners = /* @__PURE__ */ Object.create(null), this.renderPipes = /* @__PURE__ */ Object.create(null), this._initOptions = {}, this._systemsHash = /* @__PURE__ */ Object.create(null), this.type = t.type, this.name = t.name, this.config = t;
    const e = [...Na, ...this.config.runners ?? []];
    this._addRunners(...e), this._unsafeEvalCheck();
  }
  /**
   * Initialize the renderer.
   * @param options - The options to use to create the renderer.
   */
  async init(t = {}) {
    const e = t.skipExtensionImports === !0 ? !0 : t.manageImports === !1;
    await ga(e), this._addSystems(this.config.systems), this._addPipes(this.config.renderPipes, this.config.renderPipeAdaptors);
    for (const s in this._systemsHash)
      t = { ...this._systemsHash[s].constructor.defaultOptions, ...t };
    t = { ...yn.defaultOptions, ...t }, this._roundPixels = t.roundPixels ? 1 : 0;
    for (let s = 0; s < this.runners.init.items.length; s++)
      await this.runners.init.items[s].init(t);
    this._initOptions = t;
  }
  render(t, e) {
    this.tick++;
    let s = t;
    if (s instanceof q && (s = { container: s }, e && (B(W, "passing a second argument is deprecated, please use render options instead"), s.target = e.renderTexture)), s.target || (s.target = this.view.renderTarget), s.target === this.view.renderTarget && (this._lastObjectRendered = s.container, s.clearColor ?? (s.clearColor = this.background.colorRgba), s.clear ?? (s.clear = this.background.clearBeforeRender)), s.clearColor) {
      const i = Array.isArray(s.clearColor) && s.clearColor.length === 4;
      s.clearColor = i ? s.clearColor : V.shared.setValue(s.clearColor).toArray();
    }
    s.transform || (s.container.updateLocalTransform(), s.transform = s.container.localTransform), s.container.visible && (s.container.enableRenderGroup(), this.runners.prerender.emit(s), this.runners.renderStart.emit(s), this.runners.render.emit(s), this.runners.renderEnd.emit(s), this.runners.postrender.emit(s));
  }
  /**
   * Resizes the WebGL view to the specified width and height.
   * @param desiredScreenWidth - The desired width of the screen.
   * @param desiredScreenHeight - The desired height of the screen.
   * @param resolution - The resolution / device pixel ratio of the renderer.
   */
  resize(t, e, s) {
    const i = this.view.resolution;
    this.view.resize(t, e, s), this.emit("resize", this.view.screen.width, this.view.screen.height, this.view.resolution), s !== void 0 && s !== i && this.runners.resolutionChange.emit(s);
  }
  /**
   * Clears the render target.
   * @param options - The options to use when clearing the render target.
   * @param options.target - The render target to clear.
   * @param options.clearColor - The color to clear with.
   * @param options.clear - The clear mode to use.
   * @advanced
   */
  clear(t = {}) {
    const e = this;
    t.target || (t.target = e.renderTarget.renderTarget), t.clearColor || (t.clearColor = this.background.colorRgba), t.clear ?? (t.clear = gn.ALL);
    const { clear: s, clearColor: i, target: n } = t;
    V.shared.setValue(i ?? this.background.colorRgba), e.renderTarget.clear(n, s, V.shared.toArray());
  }
  /** The resolution / device pixel ratio of the renderer. */
  get resolution() {
    return this.view.resolution;
  }
  set resolution(t) {
    this.view.resolution = t, this.runners.resolutionChange.emit(t);
  }
  /**
   * Same as view.width, actual number of pixels in the canvas by horizontal.
   * @type {number}
   * @readonly
   * @default 800
   */
  get width() {
    return this.view.texture.frame.width;
  }
  /**
   * Same as view.height, actual number of pixels in the canvas by vertical.
   * @default 600
   */
  get height() {
    return this.view.texture.frame.height;
  }
  // NOTE: this was `view` in v7
  /**
   * The canvas element that everything is drawn to.
   * @type {environment.ICanvas}
   */
  get canvas() {
    return this.view.canvas;
  }
  /**
   * the last object rendered by the renderer. Useful for other plugins like interaction managers
   * @readonly
   */
  get lastObjectRendered() {
    return this._lastObjectRendered;
  }
  /**
   * Flag if we are rendering to the screen vs renderTexture
   * @readonly
   * @default true
   */
  get renderingToScreen() {
    return this.renderTarget.renderingToScreen;
  }
  /**
   * Measurements of the screen. (0, 0, screenWidth, screenHeight).
   *
   * Its safe to use as filterArea or hitArea for the whole stage.
   */
  get screen() {
    return this.view.screen;
  }
  /**
   * Create a bunch of runners based of a collection of ids
   * @param runnerIds - the runner ids to add
   */
  _addRunners(...t) {
    t.forEach((e) => {
      this.runners[e] = new Fa(e);
    });
  }
  _addSystems(t) {
    let e;
    for (e in t) {
      const s = t[e];
      this._addSystem(s.value, s.name);
    }
  }
  /**
   * Add a new system to the renderer.
   * @param ClassRef - Class reference
   * @param name - Property name for system, if not specified
   *        will use a static `name` property on the class itself. This
   *        name will be assigned as s property on the Renderer so make
   *        sure it doesn't collide with properties on Renderer.
   * @returns Return instance of renderer
   */
  _addSystem(t, e) {
    const s = new t(this);
    if (this[e])
      throw new Error(`Whoops! The name "${e}" is already in use`);
    this[e] = s, this._systemsHash[e] = s;
    for (const i in this.runners)
      this.runners[i].add(s);
    return this;
  }
  _addPipes(t, e) {
    const s = e.reduce((i, n) => (i[n.name] = n.value, i), {});
    t.forEach((i) => {
      const n = i.value, o = i.name, a = s[o];
      this.renderPipes[o] = new n(
        this,
        a ? new a() : null
      ), this.runners.destroy.add(this.renderPipes[o]);
    });
  }
  destroy(t = !1) {
    this.runners.destroy.items.reverse(), this.runners.destroy.emit(t), (t === !0 || typeof t == "object" && t.releaseGlobalResources) && Me.release(), Object.values(this.runners).forEach((e) => {
      e.destroy();
    }), this._systemsHash = null, this.renderPipes = null;
  }
  /**
   * Generate a texture from a container.
   * @param options - options or container target to use when generating the texture
   * @returns a texture
   */
  generateTexture(t) {
    return this.textureGenerator.generateTexture(t);
  }
  /**
   * Whether the renderer will round coordinates to whole pixels when rendering.
   * Can be overridden on a per scene item basis.
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   * @ignore
   */
  _unsafeEvalCheck() {
    if (!ma())
      throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
  }
  /**
   * Resets the rendering state of the renderer.
   * This is useful when you want to use the WebGL context directly and need to ensure PixiJS's internal state
   * stays synchronized. When modifying the WebGL context state externally, calling this method before the next Pixi
   * render will reset all internal caches and ensure it executes correctly.
   *
   * This is particularly useful when combining PixiJS with other rendering engines like Three.js:
   * ```js
   * // Reset Three.js state
   * threeRenderer.resetState();
   *
   * // Render a Three.js scene
   * threeRenderer.render(threeScene, threeCamera);
   *
   * // Reset PixiJS state since Three.js modified the WebGL context
   * pixiRenderer.resetState();
   *
   * // Now render Pixi content
   * pixiRenderer.render(pixiScene);
   * ```
   * @advanced
   */
  resetState() {
    this.runners.resetState.emit();
  }
};
mn.defaultOptions = {
  /**
   * Default resolution / device pixel ratio of the renderer.
   * @default 1
   */
  resolution: 1,
  /**
   * Should the `failIfMajorPerformanceCaveat` flag be enabled as a context option used in the `isWebGLSupported`
   * function. If set to true, a WebGL renderer can fail to be created if the browser thinks there could be
   * performance issues when using WebGL.
   *
   * In PixiJS v6 this has changed from true to false by default, to allow WebGL to work in as many
   * scenarios as possible. However, some users may have a poor experience, for example, if a user has a gpu or
   * driver version blacklisted by the
   * browser.
   *
   * If your application requires high performance rendering, you may wish to set this to false.
   * We recommend one of two options if you decide to set this flag to false:
   *
   * 1: Use the Canvas renderer as a fallback in case high performance WebGL is
   *    not supported.
   *
   * 2: Call `isWebGLSupported` (which if found in the utils package) in your code before attempting to create a
   *    PixiJS renderer, and show an error message to the user if the function returns false, explaining that their
   *    device & browser combination does not support high performance WebGL.
   *    This is a much better strategy than trying to create a PixiJS renderer and finding it then fails.
   * @default false
   */
  failIfMajorPerformanceCaveat: !1,
  /**
   * Should round pixels be forced when rendering?
   * @default false
   */
  roundPixels: !1
};
let xn = mn, Ye;
function Ba(r) {
  return Ye !== void 0 || (Ye = (() => {
    const t = {
      stencil: !0,
      failIfMajorPerformanceCaveat: r ?? xn.defaultOptions.failIfMajorPerformanceCaveat
    };
    try {
      if (!rt.get().getWebGLRenderingContext())
        return !1;
      let s = rt.get().createCanvas().getContext("webgl", t);
      const i = !!s?.getContextAttributes()?.stencil;
      if (s) {
        const n = s.getExtension("WEBGL_lose_context");
        n && n.loseContext();
      }
      return s = null, i;
    } catch {
      return !1;
    }
  })()), Ye;
}
let Xe;
async function Ga(r = {}) {
  return Xe !== void 0 || (Xe = await (async () => {
    const t = rt.get().getNavigator().gpu;
    if (!t)
      return !1;
    try {
      return await (await t.requestAdapter(r)).requestDevice(), !0;
    } catch {
      return !1;
    }
  })()), Xe;
}
const Di = ["webgl", "webgpu", "canvas"];
async function Da(r) {
  let t = [];
  r.preference ? (t.push(r.preference), Di.forEach((n) => {
    n !== r.preference && t.push(n);
  })) : t = Di.slice();
  let e, s = {};
  for (let n = 0; n < t.length; n++) {
    const o = t[n];
    if (o === "webgpu" && await Ga()) {
      const { WebGPURenderer: a } = await import("./WebGPURenderer-pdpNSHly.js");
      e = a, s = { ...r, ...r.webgpu };
      break;
    } else if (o === "webgl" && Ba(
      r.failIfMajorPerformanceCaveat ?? xn.defaultOptions.failIfMajorPerformanceCaveat
    )) {
      const { WebGLRenderer: a } = await import("./WebGLRenderer-CWOX7V4e.js");
      e = a, s = { ...r, ...r.webgl };
      break;
    } else if (o === "canvas")
      throw s = { ...r }, new Error("CanvasRenderer is not yet implemented");
  }
  if (delete s.webgpu, delete s.webgl, !e)
    throw new Error("No available renderer for the current environment");
  const i = new e();
  return await i.init(s), i;
}
const bn = "8.15.0";
class wn {
  static init() {
    globalThis.__PIXI_APP_INIT__?.(this, bn);
  }
  static destroy() {
  }
}
wn.extension = z.Application;
class za {
  constructor(t) {
    this._renderer = t;
  }
  init() {
    globalThis.__PIXI_RENDERER_INIT__?.(this._renderer, bn);
  }
  destroy() {
    this._renderer = null;
  }
}
za.extension = {
  type: [
    z.WebGLSystem,
    z.WebGPUSystem
  ],
  name: "initHook",
  priority: -10
};
const _n = class Ws {
  constructor(...t) {
    this.stage = new q(), t[0] !== void 0 && B(W, "Application constructor options are deprecated, please use Application.init() instead.");
  }
  /**
   * Initializes the PixiJS application with the specified options.
   *
   * This method must be called after creating a new Application instance.
   * @param options - Configuration options for the application and renderer
   * @returns A promise that resolves when initialization is complete
   * @example
   * ```js
   * const app = new Application();
   *
   * // Initialize with custom options
   * await app.init({
   *     width: 800,
   *     height: 600,
   *     backgroundColor: 0x1099bb,
   *     preference: 'webgl', // or 'webgpu'
   * });
   * ```
   */
  async init(t) {
    t = { ...t }, this.stage || (this.stage = new q()), this.renderer = await Da(t), Ws._plugins.forEach((e) => {
      e.init.call(this, t);
    });
  }
  /**
   * Renders the current stage to the screen.
   *
   * When using the default setup with {@link TickerPlugin} (enabled by default), you typically don't need to call
   * this method directly as rendering is handled automatically.
   *
   * Only use this method if you've disabled the {@link TickerPlugin} or need custom
   * render timing control.
   * @example
   * ```js
   * // Example 1: Default setup (TickerPlugin handles rendering)
   * const app = new Application();
   * await app.init();
   * // No need to call render() - TickerPlugin handles it
   *
   * // Example 2: Custom rendering loop (if TickerPlugin is disabled)
   * const app = new Application();
   * await app.init({ autoStart: false }); // Disable automatic rendering
   *
   * function animate() {
   *     app.render();
   *     requestAnimationFrame(animate);
   * }
   * animate();
   * ```
   */
  render() {
    this.renderer.render({ container: this.stage });
  }
  /**
   * Reference to the renderer's canvas element. This is the HTML element
   * that displays your application's graphics.
   * @readonly
   * @type {HTMLCanvasElement}
   * @example
   * ```js
   * // Create a new application
   * const app = new Application();
   * // Initialize the application
   * await app.init({...});
   * // Add canvas to the page
   * document.body.appendChild(app.canvas);
   *
   * // Access the canvas directly
   * console.log(app.canvas); // HTMLCanvasElement
   * ```
   */
  get canvas() {
    return this.renderer.canvas;
  }
  /**
   * Reference to the renderer's canvas element.
   * @type {HTMLCanvasElement}
   * @deprecated since 8.0.0
   * @see {@link Application#canvas}
   */
  get view() {
    return B(W, "Application.view is deprecated, please use Application.canvas instead."), this.renderer.canvas;
  }
  /**
   * Reference to the renderer's screen rectangle. This represents the visible area of your application.
   *
   * It's commonly used for:
   * - Setting filter areas for full-screen effects
   * - Defining hit areas for screen-wide interaction
   * - Determining the visible bounds of your application
   * @readonly
   * @example
   * ```js
   * // Use as filter area for a full-screen effect
   * const blurFilter = new BlurFilter();
   * sprite.filterArea = app.screen;
   *
   * // Use as hit area for screen-wide interaction
   * const screenSprite = new Sprite();
   * screenSprite.hitArea = app.screen;
   *
   * // Get screen dimensions
   * console.log(app.screen.width, app.screen.height);
   * ```
   * @see {@link Rectangle} For all available properties and methods
   */
  get screen() {
    return this.renderer.screen;
  }
  /**
   * Destroys the application and all of its resources.
   *
   * This method should be called when you want to completely
   * clean up the application and free all associated memory.
   * @param rendererDestroyOptions - Options for destroying the renderer:
   *  - `false` or `undefined`: Preserves the canvas element (default)
   *  - `true`: Removes the canvas element
   *  - `{ removeView: boolean }`: Object with removeView property to control canvas removal
   * @param options - Options for destroying the application:
   *  - `false` or `undefined`: Basic cleanup (default)
   *  - `true`: Complete cleanup including children
   *  - Detailed options object:
   *    - `children`: Remove children
   *    - `texture`: Destroy textures
   *    - `textureSource`: Destroy texture sources
   *    - `context`: Destroy WebGL context
   * @example
   * ```js
   * // Basic cleanup
   * app.destroy();
   *
   * // Remove canvas and do complete cleanup
   * app.destroy(true, true);
   *
   * // Remove canvas with explicit options
   * app.destroy({ removeView: true }, true);
   *
   * // Detailed cleanup with specific options
   * app.destroy(
   *     { removeView: true },
   *     {
   *         children: true,
   *         texture: true,
   *         textureSource: true,
   *         context: true
   *     }
   * );
   * ```
   * > [!WARNING] After calling destroy, the application instance should no longer be used.
   * > All properties will be null and further operations will throw errors.
   */
  destroy(t = !1, e = !1) {
    const s = Ws._plugins.slice(0);
    s.reverse(), s.forEach((i) => {
      i.destroy.call(this);
    }), this.stage.destroy(e), this.stage = null, this.renderer.destroy(t), this.renderer = null;
  }
};
_n._plugins = [];
let vn = _n;
ht.handleByList(z.Application, vn._plugins);
ht.add(wn);
class Ya {
  /**
   * Creates a new LRU cache instance.
   * Note: Constructor does not validate parameters. Use lru() factory function for parameter validation.
   *
   * @constructor
   * @param {number} [max=0] - Maximum number of items to store. 0 means unlimited.
   * @param {number} [ttl=0] - Time to live in milliseconds. 0 means no expiration.
   * @param {boolean} [resetTtl=false] - Whether to reset TTL when accessing existing items via get().
   * @example
   * const cache = new LRU(1000, 60000, true); // 1000 items, 1 minute TTL, reset on access
   * @see {@link lru} For parameter validation
   * @since 1.0.0
   */
  constructor(t = 0, e = 0, s = !1) {
    this.first = null, this.items = /* @__PURE__ */ Object.create(null), this.last = null, this.max = t, this.resetTtl = s, this.size = 0, this.ttl = e;
  }
  /**
   * Removes all items from the cache.
   *
   * @method clear
   * @memberof LRU
   * @returns {LRU} The LRU instance for method chaining.
   * @example
   * cache.clear();
   * console.log(cache.size); // 0
   * @since 1.0.0
   */
  clear() {
    return this.first = null, this.items = /* @__PURE__ */ Object.create(null), this.last = null, this.size = 0, this;
  }
  /**
   * Removes an item from the cache by key.
   *
   * @method delete
   * @memberof LRU
   * @param {string} key - The key of the item to delete.
   * @returns {LRU} The LRU instance for method chaining.
   * @example
   * cache.set('key1', 'value1');
   * cache.delete('key1');
   * console.log(cache.has('key1')); // false
   * @see {@link LRU#has}
   * @see {@link LRU#clear}
   * @since 1.0.0
   */
  delete(t) {
    if (this.has(t)) {
      const e = this.items[t];
      delete this.items[t], this.size--, e.prev !== null && (e.prev.next = e.next), e.next !== null && (e.next.prev = e.prev), this.first === e && (this.first = e.next), this.last === e && (this.last = e.prev);
    }
    return this;
  }
  /**
   * Returns an array of [key, value] pairs for the specified keys.
   * Order follows LRU order (least to most recently used).
   *
   * @method entries
   * @memberof LRU
   * @param {string[]} [keys=this.keys()] - Array of keys to get entries for. Defaults to all keys.
   * @returns {Array<Array<*>>} Array of [key, value] pairs in LRU order.
   * @example
   * cache.set('a', 1).set('b', 2);
   * console.log(cache.entries()); // [['a', 1], ['b', 2]]
   * console.log(cache.entries(['a'])); // [['a', 1]]
   * @see {@link LRU#keys}
   * @see {@link LRU#values}
   * @since 11.1.0
   */
  entries(t = this.keys()) {
    const e = new Array(t.length);
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      e[s] = [i, this.get(i)];
    }
    return e;
  }
  /**
   * Removes the least recently used item from the cache.
   *
   * @method evict
   * @memberof LRU
   * @param {boolean} [bypass=false] - Whether to force eviction even when cache is empty.
   * @returns {LRU} The LRU instance for method chaining.
   * @example
   * cache.set('old', 'value').set('new', 'value');
   * cache.evict(); // Removes 'old' item
   * @see {@link LRU#setWithEvicted}
   * @since 1.0.0
   */
  evict(t = !1) {
    if (t || this.size > 0) {
      const e = this.first;
      delete this.items[e.key], --this.size === 0 ? (this.first = null, this.last = null) : (this.first = e.next, this.first.prev = null);
    }
    return this;
  }
  /**
   * Returns the expiration timestamp for a given key.
   *
   * @method expiresAt
   * @memberof LRU
   * @param {string} key - The key to check expiration for.
   * @returns {number|undefined} The expiration timestamp in milliseconds, or undefined if key doesn't exist.
   * @example
   * const cache = new LRU(100, 5000); // 5 second TTL
   * cache.set('key1', 'value1');
   * console.log(cache.expiresAt('key1')); // timestamp 5 seconds from now
   * @see {@link LRU#get}
   * @see {@link LRU#has}
   * @since 1.0.0
   */
  expiresAt(t) {
    let e;
    return this.has(t) && (e = this.items[t].expiry), e;
  }
  /**
   * Retrieves a value from the cache by key. Updates the item's position to most recently used.
   *
   * @method get
   * @memberof LRU
   * @param {string} key - The key to retrieve.
   * @returns {*} The value associated with the key, or undefined if not found or expired.
   * @example
   * cache.set('key1', 'value1');
   * console.log(cache.get('key1')); // 'value1'
   * console.log(cache.get('nonexistent')); // undefined
   * @see {@link LRU#set}
   * @see {@link LRU#has}
   * @since 1.0.0
   */
  get(t) {
    const e = this.items[t];
    if (e !== void 0) {
      if (this.ttl > 0 && e.expiry <= Date.now()) {
        this.delete(t);
        return;
      }
      return this.moveToEnd(e), e.value;
    }
  }
  /**
   * Checks if a key exists in the cache.
   *
   * @method has
   * @memberof LRU
   * @param {string} key - The key to check for.
   * @returns {boolean} True if the key exists, false otherwise.
   * @example
   * cache.set('key1', 'value1');
   * console.log(cache.has('key1')); // true
   * console.log(cache.has('nonexistent')); // false
   * @see {@link LRU#get}
   * @see {@link LRU#delete}
   * @since 9.0.0
   */
  has(t) {
    return t in this.items;
  }
  /**
   * Efficiently moves an item to the end of the LRU list (most recently used position).
   * This is an internal optimization method that avoids the overhead of the full set() operation
   * when only LRU position needs to be updated.
   *
   * @method moveToEnd
   * @memberof LRU
   * @param {Object} item - The cache item with prev/next pointers to reposition.
   * @private
   * @since 11.3.5
   */
  moveToEnd(t) {
    this.last !== t && (t.prev !== null && (t.prev.next = t.next), t.next !== null && (t.next.prev = t.prev), this.first === t && (this.first = t.next), t.prev = this.last, t.next = null, this.last !== null && (this.last.next = t), this.last = t, this.first === null && (this.first = t));
  }
  /**
   * Returns an array of all keys in the cache, ordered from least to most recently used.
   *
   * @method keys
   * @memberof LRU
   * @returns {string[]} Array of keys in LRU order.
   * @example
   * cache.set('a', 1).set('b', 2);
   * cache.get('a'); // Move 'a' to most recent
   * console.log(cache.keys()); // ['b', 'a']
   * @see {@link LRU#values}
   * @see {@link LRU#entries}
   * @since 9.0.0
   */
  keys() {
    const t = new Array(this.size);
    let e = this.first, s = 0;
    for (; e !== null; )
      t[s++] = e.key, e = e.next;
    return t;
  }
  /**
   * Sets a value in the cache and returns any evicted item.
   *
   * @method setWithEvicted
   * @memberof LRU
   * @param {string} key - The key to set.
   * @param {*} value - The value to store.
   * @param {boolean} [resetTtl=this.resetTtl] - Whether to reset the TTL for this operation.
   * @returns {Object|null} The evicted item (if any) with shape {key, value, expiry, prev, next}, or null.
   * @example
   * const cache = new LRU(2);
   * cache.set('a', 1).set('b', 2);
   * const evicted = cache.setWithEvicted('c', 3); // evicted = {key: 'a', value: 1, ...}
   * @see {@link LRU#set}
   * @see {@link LRU#evict}
   * @since 11.3.0
   */
  setWithEvicted(t, e, s = this.resetTtl) {
    let i = null;
    if (this.has(t))
      this.set(t, e, !0, s);
    else {
      this.max > 0 && this.size === this.max && (i = { ...this.first }, this.evict(!0));
      let n = this.items[t] = {
        expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
        key: t,
        prev: this.last,
        next: null,
        value: e
      };
      ++this.size === 1 ? this.first = n : this.last.next = n, this.last = n;
    }
    return i;
  }
  /**
   * Sets a value in the cache. Updates the item's position to most recently used.
   *
   * @method set
   * @memberof LRU
   * @param {string} key - The key to set.
   * @param {*} value - The value to store.
   * @param {boolean} [bypass=false] - Internal parameter for setWithEvicted method.
   * @param {boolean} [resetTtl=this.resetTtl] - Whether to reset the TTL for this operation.
   * @returns {LRU} The LRU instance for method chaining.
   * @example
   * cache.set('key1', 'value1')
   *      .set('key2', 'value2')
   *      .set('key3', 'value3');
   * @see {@link LRU#get}
   * @see {@link LRU#setWithEvicted}
   * @since 1.0.0
   */
  set(t, e, s = !1, i = this.resetTtl) {
    let n = this.items[t];
    return s || n !== void 0 ? (n.value = e, s === !1 && i && (n.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl), this.moveToEnd(n)) : (this.max > 0 && this.size === this.max && this.evict(!0), n = this.items[t] = {
      expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
      key: t,
      prev: this.last,
      next: null,
      value: e
    }, ++this.size === 1 ? this.first = n : this.last.next = n, this.last = n), this;
  }
  /**
   * Returns an array of all values in the cache for the specified keys.
   * Order follows LRU order (least to most recently used).
   *
   * @method values
   * @memberof LRU
   * @param {string[]} [keys=this.keys()] - Array of keys to get values for. Defaults to all keys.
   * @returns {Array<*>} Array of values corresponding to the keys in LRU order.
   * @example
   * cache.set('a', 1).set('b', 2);
   * console.log(cache.values()); // [1, 2]
   * console.log(cache.values(['a'])); // [1]
   * @see {@link LRU#keys}
   * @see {@link LRU#entries}
   * @since 11.1.0
   */
  values(t = this.keys()) {
    const e = new Array(t.length);
    for (let s = 0; s < t.length; s++)
      e[s] = this.get(t[s]);
    return e;
  }
}
function Xa(r = 1e3, t = 0, e = !1) {
  if (isNaN(r) || r < 0)
    throw new TypeError("Invalid max value");
  if (isNaN(t) || t < 0)
    throw new TypeError("Invalid ttl value");
  if (typeof e != "boolean")
    throw new TypeError("Invalid resetTtl value");
  return new Ya(r, t, e);
}
const Ha = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui"
];
function Sn(r) {
  const t = typeof r.fontSize == "number" ? `${r.fontSize}px` : r.fontSize;
  let e = r.fontFamily;
  Array.isArray(r.fontFamily) || (e = r.fontFamily.split(","));
  for (let s = e.length - 1; s >= 0; s--) {
    let i = e[s].trim();
    !/([\"\'])[^\'\"]+\1/.test(i) && !Ha.includes(i) && (i = `"${i}"`), e[s] = i;
  }
  return `${r.fontStyle} ${r.fontVariant} ${r.fontWeight} ${t} ${e.join(",")}`;
}
const Cs = {
  // TextMetrics requires getImageData readback for measuring fonts.
  willReadFrequently: !0
}, ft = class I {
  /**
   * Checking that we can use modern canvas 2D API.
   *
   * Note: This is an unstable API, Chrome < 94 use `textLetterSpacing`, later versions use `letterSpacing`.
   * @see TextMetrics.experimentalLetterSpacing
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ICanvasRenderingContext2D/letterSpacing
   * @see https://developer.chrome.com/origintrials/#/view_trial/3585991203293757441
   */
  static get experimentalLetterSpacingSupported() {
    let t = I._experimentalLetterSpacingSupported;
    if (t === void 0) {
      const e = rt.get().getCanvasRenderingContext2D().prototype;
      t = I._experimentalLetterSpacingSupported = "letterSpacing" in e || "textLetterSpacing" in e;
    }
    return t;
  }
  /**
   * @param text - the text that was measured
   * @param style - the style that was measured
   * @param width - the measured width of the text
   * @param height - the measured height of the text
   * @param lines - an array of the lines of text broken by new lines and wrapping if specified in style
   * @param lineWidths - an array of the line widths for each line matched to `lines`
   * @param lineHeight - the measured line height for this style
   * @param maxLineWidth - the maximum line width for all measured lines
   * @param {FontMetrics} fontProperties - the font properties object from TextMetrics.measureFont
   */
  constructor(t, e, s, i, n, o, a, h, l) {
    this.text = t, this.style = e, this.width = s, this.height = i, this.lines = n, this.lineWidths = o, this.lineHeight = a, this.maxLineWidth = h, this.fontProperties = l;
  }
  /**
   * Measures the supplied string of text and returns a Rectangle.
   * @param text - The text to measure.
   * @param style - The text style to use for measuring
   * @param canvas - optional specification of the canvas to use for measuring.
   * @param wordWrap
   * @returns Measured width and height of the text.
   */
  static measureText(t = " ", e, s = I._canvas, i = e.wordWrap) {
    const n = `${t}-${e.styleKey}-wordWrap-${i}`;
    if (I._measurementCache.has(n))
      return I._measurementCache.get(n);
    const o = Sn(e), a = I.measureFont(o);
    a.fontSize === 0 && (a.fontSize = e.fontSize, a.ascent = e.fontSize);
    const h = I.__context;
    h.font = o;
    const c = (i ? I._wordWrap(t, e, s) : t).split(/(?:\r\n|\r|\n)/), d = new Array(c.length);
    let f = 0;
    for (let y = 0; y < c.length; y++) {
      const b = I._measureText(c[y], e.letterSpacing, h);
      d[y] = b, f = Math.max(f, b);
    }
    const u = e._stroke?.width || 0;
    let p = f + u;
    e.dropShadow && (p += e.dropShadow.distance);
    const m = e.lineHeight || a.fontSize;
    let g = Math.max(m, a.fontSize + u) + (c.length - 1) * (m + e.leading);
    e.dropShadow && (g += e.dropShadow.distance);
    const x = new I(
      t,
      e,
      p,
      g,
      c,
      d,
      m + e.leading,
      f,
      a
    );
    return I._measurementCache.set(n, x), x;
  }
  static _measureText(t, e, s) {
    let i = !1;
    I.experimentalLetterSpacingSupported && (I.experimentalLetterSpacing ? (s.letterSpacing = `${e}px`, s.textLetterSpacing = `${e}px`, i = !0) : (s.letterSpacing = "0px", s.textLetterSpacing = "0px"));
    const n = s.measureText(t);
    let o = n.width;
    const a = -n.actualBoundingBoxLeft;
    let l = n.actualBoundingBoxRight - a;
    if (o > 0)
      if (i)
        o -= e, l -= e;
      else {
        const c = (I.graphemeSegmenter(t).length - 1) * e;
        o += c, l += c;
      }
    return Math.max(o, l);
  }
  /**
   * Applies newlines to a string to have it optimally fit into the horizontal
   * bounds set by the Text object's wordWrapWidth property.
   * @param text - String to apply word wrapping to
   * @param style - the style to use when wrapping
   * @param canvas - optional specification of the canvas to use for measuring.
   * @returns New string with new lines applied where required
   */
  static _wordWrap(t, e, s = I._canvas) {
    const i = s.getContext("2d", Cs);
    let n = 0, o = "", a = "";
    const h = /* @__PURE__ */ Object.create(null), { letterSpacing: l, whiteSpace: c } = e, d = I._collapseSpaces(c), f = I._collapseNewlines(c);
    let u = !d;
    const p = e.wordWrapWidth + l, m = I._tokenize(t);
    for (let g = 0; g < m.length; g++) {
      let x = m[g];
      if (I._isNewline(x)) {
        if (!f) {
          a += I._addLine(o), u = !d, o = "", n = 0;
          continue;
        }
        x = " ";
      }
      if (d) {
        const b = I.isBreakingSpace(x), w = I.isBreakingSpace(o[o.length - 1]);
        if (b && w)
          continue;
      }
      const y = I._getFromCache(x, l, h, i);
      if (y > p)
        if (o !== "" && (a += I._addLine(o), o = "", n = 0), I.canBreakWords(x, e.breakWords)) {
          const b = I.wordWrapSplit(x);
          for (let w = 0; w < b.length; w++) {
            let S = b[w], _ = S, v = 1;
            for (; b[w + v]; ) {
              const k = b[w + v];
              if (!I.canBreakChars(_, k, x, w, e.breakWords))
                S += k;
              else
                break;
              _ = k, v++;
            }
            w += v - 1;
            const T = I._getFromCache(S, l, h, i);
            T + n > p && (a += I._addLine(o), u = !1, o = "", n = 0), o += S, n += T;
          }
        } else {
          o.length > 0 && (a += I._addLine(o), o = "", n = 0);
          const b = g === m.length - 1;
          a += I._addLine(x, !b), u = !1, o = "", n = 0;
        }
      else
        y + n > p && (u = !1, a += I._addLine(o), o = "", n = 0), (o.length > 0 || !I.isBreakingSpace(x) || u) && (o += x, n += y);
    }
    return a += I._addLine(o, !1), a;
  }
  /**
   * Convenience function for logging each line added during the wordWrap method.
   * @param line    - The line of text to add
   * @param newLine - Add new line character to end
   * @returns A formatted line
   */
  static _addLine(t, e = !0) {
    return t = I._trimRight(t), t = e ? `${t}
` : t, t;
  }
  /**
   * Gets & sets the widths of calculated characters in a cache object
   * @param key            - The key
   * @param letterSpacing  - The letter spacing
   * @param cache          - The cache
   * @param context        - The canvas context
   * @returns The from cache.
   */
  static _getFromCache(t, e, s, i) {
    let n = s[t];
    return typeof n != "number" && (n = I._measureText(t, e, i) + e, s[t] = n), n;
  }
  /**
   * Determines whether we should collapse breaking spaces.
   * @param whiteSpace - The TextStyle property whiteSpace
   * @returns Should collapse
   */
  static _collapseSpaces(t) {
    return t === "normal" || t === "pre-line";
  }
  /**
   * Determines whether we should collapse newLine chars.
   * @param whiteSpace - The white space
   * @returns should collapse
   */
  static _collapseNewlines(t) {
    return t === "normal";
  }
  /**
   * Trims breaking whitespaces from string.
   * @param text - The text
   * @returns Trimmed string
   */
  static _trimRight(t) {
    if (typeof t != "string")
      return "";
    for (let e = t.length - 1; e >= 0; e--) {
      const s = t[e];
      if (!I.isBreakingSpace(s))
        break;
      t = t.slice(0, -1);
    }
    return t;
  }
  /**
   * Determines if char is a newline.
   * @param char - The character
   * @returns True if newline, False otherwise.
   */
  static _isNewline(t) {
    return typeof t != "string" ? !1 : I._newlines.includes(t.charCodeAt(0));
  }
  /**
   * Determines if char is a breaking whitespace.
   *
   * It allows one to determine whether char should be a breaking whitespace
   * For example certain characters in CJK langs or numbers.
   * It must return a boolean.
   * @param char - The character
   * @param [_nextChar] - The next character
   * @returns True if whitespace, False otherwise.
   */
  static isBreakingSpace(t, e) {
    return typeof t != "string" ? !1 : I._breakingSpaces.includes(t.charCodeAt(0));
  }
  /**
   * Splits a string into words, breaking-spaces and newLine characters
   * @param text - The text
   * @returns A tokenized array
   */
  static _tokenize(t) {
    const e = [];
    let s = "";
    if (typeof t != "string")
      return e;
    for (let i = 0; i < t.length; i++) {
      const n = t[i], o = t[i + 1];
      if (I.isBreakingSpace(n, o) || I._isNewline(n)) {
        s !== "" && (e.push(s), s = ""), n === "\r" && o === `
` ? (e.push(`\r
`), i++) : e.push(n);
        continue;
      }
      s += n;
    }
    return s !== "" && e.push(s), e;
  }
  /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It allows one to customise which words should break
   * Examples are if the token is CJK or numbers.
   * It must return a boolean.
   * @param _token - The token
   * @param breakWords - The style attr break words
   * @returns Whether to break word or not
   */
  static canBreakWords(t, e) {
    return e;
  }
  /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It allows one to determine whether a pair of characters
   * should be broken by newlines
   * For example certain characters in CJK langs or numbers.
   * It must return a boolean.
   * @param _char - The character
   * @param _nextChar - The next character
   * @param _token - The token/word the characters are from
   * @param _index - The index in the token of the char
   * @param _breakWords - The style attr break words
   * @returns whether to break word or not
   */
  static canBreakChars(t, e, s, i, n) {
    return !0;
  }
  /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It is called when a token (usually a word) has to be split into separate pieces
   * in order to determine the point to break a word.
   * It must return an array of characters.
   * @param token - The token to split
   * @returns The characters of the token
   * @see CanvasTextMetrics.graphemeSegmenter
   */
  static wordWrapSplit(t) {
    return I.graphemeSegmenter(t);
  }
  /**
   * Calculates the ascent, descent and fontSize of a given font-style
   * @param font - String representing the style of the font
   * @returns Font properties object
   */
  static measureFont(t) {
    if (I._fonts[t])
      return I._fonts[t];
    const e = I._context;
    e.font = t;
    const s = e.measureText(I.METRICS_STRING + I.BASELINE_SYMBOL), i = {
      ascent: s.actualBoundingBoxAscent,
      descent: s.actualBoundingBoxDescent,
      fontSize: s.actualBoundingBoxAscent + s.actualBoundingBoxDescent
    };
    return I._fonts[t] = i, i;
  }
  /**
   * Clear font metrics in metrics cache.
   * @param {string} [font] - font name. If font name not set then clear cache for all fonts.
   */
  static clearMetrics(t = "") {
    t ? delete I._fonts[t] : I._fonts = {};
  }
  /**
   * Cached canvas element for measuring text
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */
  static get _canvas() {
    if (!I.__canvas) {
      let t;
      try {
        const e = new OffscreenCanvas(0, 0);
        if (e.getContext("2d", Cs)?.measureText)
          return I.__canvas = e, e;
        t = rt.get().createCanvas();
      } catch {
        t = rt.get().createCanvas();
      }
      t.width = t.height = 10, I.__canvas = t;
    }
    return I.__canvas;
  }
  /**
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */
  static get _context() {
    return I.__context || (I.__context = I._canvas.getContext("2d", Cs)), I.__context;
  }
};
ft.METRICS_STRING = "|ÉqÅ";
ft.BASELINE_SYMBOL = "M";
ft.BASELINE_MULTIPLIER = 1.4;
ft.HEIGHT_MULTIPLIER = 2;
ft.graphemeSegmenter = (() => {
  if (typeof Intl?.Segmenter == "function") {
    const r = new Intl.Segmenter();
    return (t) => {
      const e = r.segment(t), s = [];
      let i = 0;
      for (const n of e)
        s[i++] = n.segment;
      return s;
    };
  }
  return (r) => [...r];
})();
ft.experimentalLetterSpacing = !1;
ft._fonts = {};
ft._newlines = [
  10,
  // line feed
  13
  // carriage return
];
ft._breakingSpaces = [
  9,
  // character tabulation
  32,
  // space
  8192,
  // en quad
  8193,
  // em quad
  8194,
  // en space
  8195,
  // em space
  8196,
  // three-per-em space
  8197,
  // four-per-em space
  8198,
  // six-per-em space
  8200,
  // punctuation space
  8201,
  // thin space
  8202,
  // hair space
  8287,
  // medium mathematical space
  12288
  // ideographic space
];
ft._measurementCache = Xa(1e3);
let jt = ft;
const zi = [{ offset: 0, color: "white" }, { offset: 1, color: "black" }], ei = class Us {
  constructor(...t) {
    this.uid = U("fillGradient"), this._tick = 0, this.type = "linear", this.colorStops = [];
    let e = Oa(t);
    e = { ...e.type === "radial" ? Us.defaultRadialOptions : Us.defaultLinearOptions, ...Pr(e) }, this._textureSize = e.textureSize, this._wrapMode = e.wrapMode, e.type === "radial" ? (this.center = e.center, this.outerCenter = e.outerCenter ?? this.center, this.innerRadius = e.innerRadius, this.outerRadius = e.outerRadius, this.scale = e.scale, this.rotation = e.rotation) : (this.start = e.start, this.end = e.end), this.textureSpace = e.textureSpace, this.type = e.type, e.colorStops.forEach((i) => {
      this.addColorStop(i.offset, i.color);
    });
  }
  /**
   * Adds a color stop to the gradient
   * @param offset - Position of the stop (0-1)
   * @param color - Color of the stop
   * @returns This gradient instance for chaining
   */
  addColorStop(t, e) {
    return this.colorStops.push({ offset: t, color: V.shared.setValue(e).toHexa() }), this;
  }
  /**
   * Builds the internal texture and transform for the gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */
  buildLinearGradient() {
    if (this.texture)
      return;
    let { x: t, y: e } = this.start, { x: s, y: i } = this.end, n = s - t, o = i - e;
    const a = n < 0 || o < 0;
    if (this._wrapMode === "clamp-to-edge") {
      if (n < 0) {
        const g = t;
        t = s, s = g, n *= -1;
      }
      if (o < 0) {
        const g = e;
        e = i, i = g, o *= -1;
      }
    }
    const h = this.colorStops.length ? this.colorStops : zi, l = this._textureSize, { canvas: c, context: d } = Xi(l, 1), f = a ? d.createLinearGradient(this._textureSize, 0, 0, 0) : d.createLinearGradient(0, 0, this._textureSize, 0);
    Yi(f, h), d.fillStyle = f, d.fillRect(0, 0, l, 1), this.texture = new D({
      source: new qe({
        resource: c,
        addressMode: this._wrapMode
      })
    });
    const u = Math.sqrt(n * n + o * o), p = Math.atan2(o, n), m = new F();
    m.scale(u / l, 1), m.rotate(p), m.translate(t, e), this.textureSpace === "local" && m.scale(l, l), this.transform = m;
  }
  /**
   * Builds the internal texture and transform for the gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */
  buildGradient() {
    this.texture || this._tick++, this.type === "linear" ? this.buildLinearGradient() : this.buildRadialGradient();
  }
  /**
   * Builds the internal texture and transform for the radial gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */
  buildRadialGradient() {
    if (this.texture)
      return;
    const t = this.colorStops.length ? this.colorStops : zi, e = this._textureSize, { canvas: s, context: i } = Xi(e, e), { x: n, y: o } = this.center, { x: a, y: h } = this.outerCenter, l = this.innerRadius, c = this.outerRadius, d = a - c, f = h - c, u = e / (c * 2), p = (n - d) * u, m = (o - f) * u, g = i.createRadialGradient(
      p,
      m,
      l * u,
      (a - d) * u,
      (h - f) * u,
      c * u
    );
    Yi(g, t), i.fillStyle = t[t.length - 1].color, i.fillRect(0, 0, e, e), i.fillStyle = g, i.translate(p, m), i.rotate(this.rotation), i.scale(1, this.scale), i.translate(-p, -m), i.fillRect(0, 0, e, e), this.texture = new D({
      source: new qe({
        resource: s,
        addressMode: this._wrapMode
      })
    });
    const x = new F();
    x.scale(1 / u, 1 / u), x.translate(d, f), this.textureSpace === "local" && x.scale(e, e), this.transform = x;
  }
  /** Destroys the gradient, releasing resources. This will also destroy the internal texture. */
  destroy() {
    this.texture?.destroy(!0), this.texture = null, this.transform = null, this.colorStops = [], this.start = null, this.end = null, this.center = null, this.outerCenter = null;
  }
  /**
   * Returns a unique key for this gradient instance.
   * This key is used for caching and texture management.
   * @returns {string} Unique key for the gradient
   */
  get styleKey() {
    return `fill-gradient-${this.uid}-${this._tick}`;
  }
};
ei.defaultLinearOptions = {
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [],
  textureSpace: "local",
  type: "linear",
  textureSize: 256,
  wrapMode: "clamp-to-edge"
};
ei.defaultRadialOptions = {
  center: { x: 0.5, y: 0.5 },
  innerRadius: 0,
  outerRadius: 0.5,
  colorStops: [],
  scale: 1,
  textureSpace: "local",
  type: "radial",
  textureSize: 256,
  wrapMode: "clamp-to-edge"
};
let St = ei;
function Yi(r, t) {
  for (let e = 0; e < t.length; e++) {
    const s = t[e];
    r.addColorStop(s.offset, s.color);
  }
}
function Xi(r, t) {
  const e = rt.get().createCanvas(r, t), s = e.getContext("2d");
  return { canvas: e, context: s };
}
function Oa(r) {
  let t = r[0] ?? {};
  return (typeof t == "number" || r[1]) && (B("8.5.2", "use options object instead"), t = {
    type: "linear",
    start: { x: r[0], y: r[1] },
    end: { x: r[2], y: r[3] },
    textureSpace: r[4],
    textureSize: r[5] ?? St.defaultLinearOptions.textureSize
  }), t;
}
const Hi = {
  repeat: {
    addressModeU: "repeat",
    addressModeV: "repeat"
  },
  "repeat-x": {
    addressModeU: "repeat",
    addressModeV: "clamp-to-edge"
  },
  "repeat-y": {
    addressModeU: "clamp-to-edge",
    addressModeV: "repeat"
  },
  "no-repeat": {
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge"
  }
};
class es {
  constructor(t, e) {
    this.uid = U("fillPattern"), this._tick = 0, this.transform = new F(), this.texture = t, this.transform.scale(
      1 / t.frame.width,
      1 / t.frame.height
    ), e && (t.source.style.addressModeU = Hi[e].addressModeU, t.source.style.addressModeV = Hi[e].addressModeV);
  }
  /**
   * Sets the transform for the pattern
   * @param transform - The transform matrix to apply to the pattern.
   * If not provided, the pattern will use the default transform.
   */
  setTransform(t) {
    const e = this.texture;
    this.transform.copyFrom(t), this.transform.invert(), this.transform.scale(
      1 / e.frame.width,
      1 / e.frame.height
    ), this._tick++;
  }
  /** Internal texture used to render the gradient */
  get texture() {
    return this._texture;
  }
  set texture(t) {
    this._texture !== t && (this._texture = t, this._tick++);
  }
  /**
   * Returns a unique key for this instance.
   * This key is used for caching.
   * @returns {string} Unique key for the instance
   */
  get styleKey() {
    return `fill-pattern-${this.uid}-${this._tick}`;
  }
  /** Destroys the fill pattern, releasing resources. This will also destroy the internal texture. */
  destroy() {
    this.texture.destroy(!0), this.texture = null;
  }
}
var Ms, Oi;
function Wa() {
  if (Oi) return Ms;
  Oi = 1, Ms = e;
  var r = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 }, t = /([astvzqmhlc])([^astvzqmhlc]*)/ig;
  function e(n) {
    var o = [];
    return n.replace(t, function(a, h, l) {
      var c = h.toLowerCase();
      for (l = i(l), c == "m" && l.length > 2 && (o.push([h].concat(l.splice(0, 2))), c = "l", h = h == "m" ? "l" : "L"); ; ) {
        if (l.length == r[c])
          return l.unshift(h), o.push(l);
        if (l.length < r[c]) throw new Error("malformed path data");
        o.push([h].concat(l.splice(0, r[c])));
      }
    }), o;
  }
  var s = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;
  function i(n) {
    var o = n.match(s);
    return o ? o.map(Number) : [];
  }
  return Ms;
}
var Ua = Wa();
const $a = /* @__PURE__ */ Sr(Ua);
function ja(r, t) {
  const e = $a(r), s = [];
  let i = null, n = 0, o = 0;
  for (let a = 0; a < e.length; a++) {
    const h = e[a], l = h[0], c = h;
    switch (l) {
      case "M":
        n = c[1], o = c[2], t.moveTo(n, o);
        break;
      case "m":
        n += c[1], o += c[2], t.moveTo(n, o);
        break;
      case "H":
        n = c[1], t.lineTo(n, o);
        break;
      case "h":
        n += c[1], t.lineTo(n, o);
        break;
      case "V":
        o = c[1], t.lineTo(n, o);
        break;
      case "v":
        o += c[1], t.lineTo(n, o);
        break;
      case "L":
        n = c[1], o = c[2], t.lineTo(n, o);
        break;
      case "l":
        n += c[1], o += c[2], t.lineTo(n, o);
        break;
      case "C":
        n = c[5], o = c[6], t.bezierCurveTo(
          c[1],
          c[2],
          // First control point
          c[3],
          c[4],
          // Second control point
          n,
          o
          // End point
        );
        break;
      case "c":
        t.bezierCurveTo(
          n + c[1],
          o + c[2],
          // First control point
          n + c[3],
          o + c[4],
          // Second control point
          n + c[5],
          o + c[6]
          // End point
        ), n += c[5], o += c[6];
        break;
      case "S":
        n = c[3], o = c[4], t.bezierCurveToShort(
          c[1],
          c[2],
          // Control point
          n,
          o
          // End point
        );
        break;
      case "s":
        t.bezierCurveToShort(
          n + c[1],
          o + c[2],
          // Control point
          n + c[3],
          o + c[4]
          // End point
        ), n += c[3], o += c[4];
        break;
      case "Q":
        n = c[3], o = c[4], t.quadraticCurveTo(
          c[1],
          c[2],
          // Control point
          n,
          o
          // End point
        );
        break;
      case "q":
        t.quadraticCurveTo(
          n + c[1],
          o + c[2],
          // Control point
          n + c[3],
          o + c[4]
          // End point
        ), n += c[3], o += c[4];
        break;
      case "T":
        n = c[1], o = c[2], t.quadraticCurveToShort(
          n,
          o
          // End point
        );
        break;
      case "t":
        n += c[1], o += c[2], t.quadraticCurveToShort(
          n,
          o
          // End point
        );
        break;
      case "A":
        n = c[6], o = c[7], t.arcToSvg(
          c[1],
          // rx
          c[2],
          // ry
          c[3],
          // x-axis-rotation
          c[4],
          // large-arc-flag
          c[5],
          // sweep-flag
          n,
          o
          // End point
        );
        break;
      case "a":
        n += c[6], o += c[7], t.arcToSvg(
          c[1],
          // rx
          c[2],
          // ry
          c[3],
          // x-axis-rotation
          c[4],
          // large-arc-flag
          c[5],
          // sweep-flag
          n,
          o
          // End point
        );
        break;
      case "Z":
      case "z":
        t.closePath(), s.length > 0 && (i = s.pop(), i ? (n = i.startX, o = i.startY) : (n = 0, o = 0)), i = null;
        break;
      default:
        J(`Unknown SVG path command: ${l}`);
    }
    l !== "Z" && l !== "z" && i === null && (i = { startX: n, startY: o }, s.push(i));
  }
  return t;
}
class si {
  /**
   * @param x - The X coordinate of the center of this circle
   * @param y - The Y coordinate of the center of this circle
   * @param radius - The radius of the circle
   */
  constructor(t = 0, e = 0, s = 0) {
    this.type = "circle", this.x = t, this.y = e, this.radius = s;
  }
  /**
   * Creates a clone of this Circle instance.
   * @example
   * ```ts
   * // Basic circle cloning
   * const original = new Circle(100, 100, 50);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.radius = 75;
   *
   * // Verify independence
   * console.log(original.radius); // 50
   * console.log(modified.radius); // 75
   * ```
   * @returns A copy of the Circle
   * @see {@link Circle.copyFrom} For copying into existing circle
   * @see {@link Circle.copyTo} For copying to another circle
   */
  clone() {
    return new si(this.x, this.y, this.radius);
  }
  /**
   * Checks whether the x and y coordinates given are contained within this circle.
   *
   * Uses the distance formula to determine if a point is inside the circle's radius.
   *
   * Commonly used for hit testing in PixiJS events and graphics.
   * @example
   * ```ts
   * // Basic containment check
   * const circle = new Circle(100, 100, 50);
   * const isInside = circle.contains(120, 120);
   *
   * // Check mouse position
   * const circle = new Circle(0, 0, 100);
   * container.hitArea = circle;
   * container.on('pointermove', (e) => {
   *     // only called if pointer is within circle
   * });
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Circle
   * @see {@link Circle.strokeContains} For checking stroke intersection
   * @see {@link Circle.getBounds} For getting bounding box
   */
  contains(t, e) {
    if (this.radius <= 0)
      return !1;
    const s = this.radius * this.radius;
    let i = this.x - t, n = this.y - e;
    return i *= i, n *= n, i + n <= s;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this circle including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const circle = new Circle(100, 100, 50);
   * const isOnStroke = circle.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = circle.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = circle.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = circle.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param width - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this Circle's stroke
   * @see {@link Circle.contains} For checking fill containment
   * @see {@link Circle.getBounds} For getting stroke bounds
   */
  strokeContains(t, e, s, i = 0.5) {
    if (this.radius === 0)
      return !1;
    const n = this.x - t, o = this.y - e, a = this.radius, h = (1 - i) * s, l = Math.sqrt(n * n + o * o);
    return l <= a + h && l > a - (s - h);
  }
  /**
   * Returns the framing rectangle of the circle as a Rectangle object.
   * @example
   * ```ts
   * // Basic bounds calculation
   * const circle = new Circle(100, 100, 50);
   * const bounds = circle.getBounds();
   * // bounds: x=50, y=50, width=100, height=100
   *
   * // Reuse existing rectangle
   * const rect = new Rectangle();
   * circle.getBounds(rect);
   * ```
   * @param out - Optional Rectangle object to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link Circle.contains} For point containment
   */
  getBounds(t) {
    return t || (t = new j()), t.x = this.x - this.radius, t.y = this.y - this.radius, t.width = this.radius * 2, t.height = this.radius * 2, t;
  }
  /**
   * Copies another circle to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Circle(100, 100, 50);
   * const target = new Circle();
   * target.copyFrom(source);
   * ```
   * @param circle - The circle to copy from
   * @returns Returns itself
   * @see {@link Circle.copyTo} For copying to another circle
   * @see {@link Circle.clone} For creating new circle copy
   */
  copyFrom(t) {
    return this.x = t.x, this.y = t.y, this.radius = t.radius, this;
  }
  /**
   * Copies this circle to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Circle(100, 100, 50);
   * const target = new Circle();
   * source.copyTo(target);
   * ```
   * @param circle - The circle to copy to
   * @returns Returns given parameter
   * @see {@link Circle.copyFrom} For copying from another circle
   * @see {@link Circle.clone} For creating new circle copy
   */
  copyTo(t) {
    return t.copyFrom(this), t;
  }
  toString() {
    return `[pixi.js/math:Circle x=${this.x} y=${this.y} radius=${this.radius}]`;
  }
}
class ii {
  /**
   * @param x - The X coordinate of the center of this ellipse
   * @param y - The Y coordinate of the center of this ellipse
   * @param halfWidth - The half width of this ellipse
   * @param halfHeight - The half height of this ellipse
   */
  constructor(t = 0, e = 0, s = 0, i = 0) {
    this.type = "ellipse", this.x = t, this.y = e, this.halfWidth = s, this.halfHeight = i;
  }
  /**
   * Creates a clone of this Ellipse instance.
   * @example
   * ```ts
   * // Basic cloning
   * const original = new Ellipse(100, 100, 50, 25);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.halfWidth *= 2;
   * modified.halfHeight *= 2;
   *
   * // Verify independence
   * console.log(original.halfWidth);  // 50
   * console.log(modified.halfWidth);  // 100
   * ```
   * @returns A copy of the ellipse
   * @see {@link Ellipse.copyFrom} For copying into existing ellipse
   * @see {@link Ellipse.copyTo} For copying to another ellipse
   */
  clone() {
    return new ii(this.x, this.y, this.halfWidth, this.halfHeight);
  }
  /**
   * Checks whether the x and y coordinates given are contained within this ellipse.
   * Uses normalized coordinates and the ellipse equation to determine containment.
   * @example
   * ```ts
   * // Basic containment check
   * const ellipse = new Ellipse(100, 100, 50, 25);
   * const isInside = ellipse.contains(120, 110);
   * ```
   * @remarks
   * - Uses ellipse equation (x²/a² + y²/b² ≤ 1)
   * - Returns false if dimensions are 0 or negative
   * - Normalized to center (0,0) for calculation
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coords are within this ellipse
   * @see {@link Ellipse.strokeContains} For checking stroke intersection
   * @see {@link Ellipse.getBounds} For getting containing rectangle
   */
  contains(t, e) {
    if (this.halfWidth <= 0 || this.halfHeight <= 0)
      return !1;
    let s = (t - this.x) / this.halfWidth, i = (e - this.y) / this.halfHeight;
    return s *= s, i *= i, s + i <= 1;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this ellipse including stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const ellipse = new Ellipse(100, 100, 50, 25);
   * const isOnStroke = ellipse.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = ellipse.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = ellipse.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = ellipse.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @remarks
   * - Uses normalized ellipse equations
   * - Considers stroke alignment
   * - Returns false if dimensions are 0
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coords are within this ellipse's stroke
   * @see {@link Ellipse.contains} For checking fill containment
   * @see {@link Ellipse.getBounds} For getting stroke bounds
   */
  strokeContains(t, e, s, i = 0.5) {
    const { halfWidth: n, halfHeight: o } = this;
    if (n <= 0 || o <= 0)
      return !1;
    const a = s * (1 - i), h = s - a, l = n - h, c = o - h, d = n + a, f = o + a, u = t - this.x, p = e - this.y, m = u * u / (l * l) + p * p / (c * c), g = u * u / (d * d) + p * p / (f * f);
    return m > 1 && g <= 1;
  }
  /**
   * Returns the framing rectangle of the ellipse as a Rectangle object.
   * @example
   * ```ts
   * // Basic bounds calculation
   * const ellipse = new Ellipse(100, 100, 50, 25);
   * const bounds = ellipse.getBounds();
   * // bounds: x=50, y=75, width=100, height=50
   *
   * // Reuse existing rectangle
   * const rect = new Rectangle();
   * ellipse.getBounds(rect);
   * ```
   * @remarks
   * - Creates Rectangle if none provided
   * - Top-left is (x-halfWidth, y-halfHeight)
   * - Width is halfWidth * 2
   * - Height is halfHeight * 2
   * @param out - Optional Rectangle object to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link Ellipse.contains} For checking if a point is inside
   */
  getBounds(t) {
    return t || (t = new j()), t.x = this.x - this.halfWidth, t.y = this.y - this.halfHeight, t.width = this.halfWidth * 2, t.height = this.halfHeight * 2, t;
  }
  /**
   * Copies another ellipse to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Ellipse(100, 100, 50, 25);
   * const target = new Ellipse();
   * target.copyFrom(source);
   * ```
   * @param ellipse - The ellipse to copy from
   * @returns Returns itself
   * @see {@link Ellipse.copyTo} For copying to another ellipse
   * @see {@link Ellipse.clone} For creating new ellipse copy
   */
  copyFrom(t) {
    return this.x = t.x, this.y = t.y, this.halfWidth = t.halfWidth, this.halfHeight = t.halfHeight, this;
  }
  /**
   * Copies this ellipse to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Ellipse(100, 100, 50, 25);
   * const target = new Ellipse();
   * source.copyTo(target);
   * ```
   * @param ellipse - The ellipse to copy to
   * @returns Returns given parameter
   * @see {@link Ellipse.copyFrom} For copying from another ellipse
   * @see {@link Ellipse.clone} For creating new ellipse copy
   */
  copyTo(t) {
    return t.copyFrom(this), t;
  }
  toString() {
    return `[pixi.js/math:Ellipse x=${this.x} y=${this.y} halfWidth=${this.halfWidth} halfHeight=${this.halfHeight}]`;
  }
}
function Va(r, t, e, s, i, n) {
  const o = r - e, a = t - s, h = i - e, l = n - s, c = o * h + a * l, d = h * h + l * l;
  let f = -1;
  d !== 0 && (f = c / d);
  let u, p;
  f < 0 ? (u = e, p = s) : f > 1 ? (u = i, p = n) : (u = e + f * h, p = s + f * l);
  const m = r - u, g = t - p;
  return m * m + g * g;
}
let qa, Ka;
class pe {
  /**
   * @param points - This can be an array of Points
   *  that form the polygon, a flat array of numbers that will be interpreted as [x,y, x,y, ...], or
   *  the arguments passed can be all the points of the polygon e.g.
   *  `new Polygon(new Point(), new Point(), ...)`, or the arguments passed can be flat
   *  x,y values e.g. `new Polygon(x,y, x,y, x,y, ...)` where `x` and `y` are Numbers.
   */
  constructor(...t) {
    this.type = "polygon";
    let e = Array.isArray(t[0]) ? t[0] : t;
    if (typeof e[0] != "number") {
      const s = [];
      for (let i = 0, n = e.length; i < n; i++)
        s.push(e[i].x, e[i].y);
      e = s;
    }
    this.points = e, this.closePath = !0;
  }
  /**
   * Determines whether the polygon's points are arranged in a clockwise direction.
   * Uses the shoelace formula (surveyor's formula) to calculate the signed area.
   *
   * A positive area indicates clockwise winding, while negative indicates counter-clockwise.
   *
   * The formula sums up the cross products of adjacent vertices:
   * For each pair of adjacent points (x1,y1) and (x2,y2), we calculate (x1*y2 - x2*y1)
   * The final sum divided by 2 gives the signed area - positive for clockwise.
   * @example
   * ```ts
   * // Check polygon winding
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * console.log(polygon.isClockwise()); // Check direction
   *
   * // Use in path construction
   * const hole = new Polygon([25, 25, 75, 25, 75, 75, 25, 75]);
   * if (hole.isClockwise() === shape.isClockwise()) {
   *     hole.points.reverse(); // Reverse for proper hole winding
   * }
   * ```
   * @returns `true` if the polygon's points are arranged clockwise, `false` if counter-clockwise
   */
  isClockwise() {
    let t = 0;
    const e = this.points, s = e.length;
    for (let i = 0; i < s; i += 2) {
      const n = e[i], o = e[i + 1], a = e[(i + 2) % s], h = e[(i + 3) % s];
      t += (a - n) * (h + o);
    }
    return t < 0;
  }
  /**
   * Checks if this polygon completely contains another polygon.
   * Used for detecting holes in shapes, like when parsing SVG paths.
   * @example
   * ```ts
   * // Basic containment check
   * const outerSquare = new Polygon([0,0, 100,0, 100,100, 0,100]); // A square
   * const innerSquare = new Polygon([25,25, 75,25, 75,75, 25,75]); // A smaller square inside
   *
   * outerSquare.containsPolygon(innerSquare); // Returns true
   * innerSquare.containsPolygon(outerSquare); // Returns false
   * ```
   * @remarks
   * - Uses bounds check for quick rejection
   * - Tests all points for containment
   * @param polygon - The polygon to test for containment
   * @returns True if this polygon completely contains the other polygon
   * @see {@link Polygon.contains} For single point testing
   * @see {@link Polygon.getBounds} For bounds calculation
   */
  containsPolygon(t) {
    const e = this.getBounds(qa), s = t.getBounds(Ka);
    if (!e.containsRect(s))
      return !1;
    const i = t.points;
    for (let n = 0; n < i.length; n += 2) {
      const o = i[n], a = i[n + 1];
      if (!this.contains(o, a))
        return !1;
    }
    return !0;
  }
  /**
   * Creates a clone of this polygon.
   * @example
   * ```ts
   * // Basic cloning
   * const original = new Polygon([0, 0, 100, 0, 50, 100]);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.points[0] = 10; // Modify first x coordinate
   * ```
   * @returns A copy of the polygon
   * @see {@link Polygon.copyFrom} For copying into existing polygon
   * @see {@link Polygon.copyTo} For copying to another polygon
   */
  clone() {
    const t = this.points.slice(), e = new pe(t);
    return e.closePath = this.closePath, e;
  }
  /**
   * Checks whether the x and y coordinates passed to this function are contained within this polygon.
   * Uses raycasting algorithm for point-in-polygon testing.
   * @example
   * ```ts
   * // Basic containment check
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * const isInside = polygon.contains(25, 25); // true
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this polygon
   * @see {@link Polygon.strokeContains} For checking stroke intersection
   * @see {@link Polygon.containsPolygon} For polygon-in-polygon testing
   */
  contains(t, e) {
    let s = !1;
    const i = this.points.length / 2;
    for (let n = 0, o = i - 1; n < i; o = n++) {
      const a = this.points[n * 2], h = this.points[n * 2 + 1], l = this.points[o * 2], c = this.points[o * 2 + 1];
      h > e != c > e && t < (l - a) * ((e - h) / (c - h)) + a && (s = !s);
    }
    return s;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this polygon including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * const isOnStroke = polygon.strokeContains(25, 25, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = polygon.strokeContains(25, 25, 4, 1);   // Inside
   * const centerStroke = polygon.strokeContains(25, 25, 4, 0.5); // Centered
   * const outerStroke = polygon.strokeContains(25, 25, 4, 0);   // Outside
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coordinates are within this polygon's stroke
   * @see {@link Polygon.contains} For checking fill containment
   * @see {@link Polygon.getBounds} For getting stroke bounds
   */
  strokeContains(t, e, s, i = 0.5) {
    const n = s * s, o = n * (1 - i), a = n - o, { points: h } = this, l = h.length - (this.closePath ? 0 : 2);
    for (let c = 0; c < l; c += 2) {
      const d = h[c], f = h[c + 1], u = h[(c + 2) % h.length], p = h[(c + 3) % h.length], m = Va(t, e, d, f, u, p), g = Math.sign((u - d) * (e - f) - (p - f) * (t - d));
      if (m <= (g < 0 ? a : o))
        return !0;
    }
    return !1;
  }
  /**
   * Returns the framing rectangle of the polygon as a Rectangle object.
   * @example
   * ```ts
   * // Basic bounds calculation
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * const bounds = polygon.getBounds();
   * // bounds: x=0, y=0, width=100, height=100
   *
   * // Reuse existing rectangle
   * const rect = new Rectangle();
   * polygon.getBounds(rect);
   * ```
   * @param out - Optional rectangle to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link Polygon.contains} For checking if a point is inside
   */
  getBounds(t) {
    t || (t = new j());
    const e = this.points;
    let s = 1 / 0, i = -1 / 0, n = 1 / 0, o = -1 / 0;
    for (let a = 0, h = e.length; a < h; a += 2) {
      const l = e[a], c = e[a + 1];
      s = l < s ? l : s, i = l > i ? l : i, n = c < n ? c : n, o = c > o ? c : o;
    }
    return t.x = s, t.width = i - s, t.y = n, t.height = o - n, t;
  }
  /**
   * Copies another polygon to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Polygon([0, 0, 100, 0, 50, 100]);
   * const target = new Polygon();
   * target.copyFrom(source);
   * ```
   * @param polygon - The polygon to copy from
   * @returns Returns itself
   * @see {@link Polygon.copyTo} For copying to another polygon
   * @see {@link Polygon.clone} For creating new polygon copy
   */
  copyFrom(t) {
    return this.points = t.points.slice(), this.closePath = t.closePath, this;
  }
  /**
   * Copies this polygon to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Polygon([0, 0, 100, 0, 50, 100]);
   * const target = new Polygon();
   * source.copyTo(target);
   * ```
   * @param polygon - The polygon to copy to
   * @returns Returns given parameter
   * @see {@link Polygon.copyFrom} For copying from another polygon
   * @see {@link Polygon.clone} For creating new polygon copy
   */
  copyTo(t) {
    return t.copyFrom(this), t;
  }
  toString() {
    return `[pixi.js/math:PolygoncloseStroke=${this.closePath}points=${this.points.reduce((t, e) => `${t}, ${e}`, "")}]`;
  }
  /**
   * Get the last X coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.lastX); // 300
   * ```
   * @readonly
   * @returns The x-coordinate of the last vertex
   * @see {@link Polygon.lastY} For last Y coordinate
   * @see {@link Polygon.points} For raw points array
   */
  get lastX() {
    return this.points[this.points.length - 2];
  }
  /**
   * Get the last Y coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.lastY); // 400
   * ```
   * @readonly
   * @returns The y-coordinate of the last vertex
   * @see {@link Polygon.lastX} For last X coordinate
   * @see {@link Polygon.points} For raw points array
   */
  get lastY() {
    return this.points[this.points.length - 1];
  }
  /**
   * Get the last X coordinate of the polygon.
   * @readonly
   * @deprecated since 8.11.0, use {@link Polygon.lastX} instead.
   */
  get x() {
    return B("8.11.0", "Polygon.lastX is deprecated, please use Polygon.lastX instead."), this.points[this.points.length - 2];
  }
  /**
   * Get the last Y coordinate of the polygon.
   * @readonly
   * @deprecated since 8.11.0, use {@link Polygon.lastY} instead.
   */
  get y() {
    return B("8.11.0", "Polygon.y is deprecated, please use Polygon.lastY instead."), this.points[this.points.length - 1];
  }
  /**
   * Get the first X coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.x); // 0
   * ```
   * @readonly
   * @returns The x-coordinate of the first vertex
   * @see {@link Polygon.startY} For first Y coordinate
   * @see {@link Polygon.points} For raw points array
   */
  get startX() {
    return this.points[0];
  }
  /**
   * Get the first Y coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.y); // 0
   * ```
   * @readonly
   * @returns The y-coordinate of the first vertex
   * @see {@link Polygon.startX} For first X coordinate
   * @see {@link Polygon.points} For raw points array
   */
  get startY() {
    return this.points[1];
  }
}
const He = (r, t, e, s, i, n, o) => {
  const a = r - e, h = t - s, l = Math.sqrt(a * a + h * h);
  return l >= i - n && l <= i + o;
};
class ri {
  /**
   * @param x - The X coordinate of the upper-left corner of the rounded rectangle
   * @param y - The Y coordinate of the upper-left corner of the rounded rectangle
   * @param width - The overall width of this rounded rectangle
   * @param height - The overall height of this rounded rectangle
   * @param radius - Controls the radius of the rounded corners
   */
  constructor(t = 0, e = 0, s = 0, i = 0, n = 20) {
    this.type = "roundedRectangle", this.x = t, this.y = e, this.width = s, this.height = i, this.radius = n;
  }
  /**
   * Returns the framing rectangle of the rounded rectangle as a Rectangle object
   * @example
   * ```ts
   * // Basic bounds calculation
   * const rect = new RoundedRectangle(100, 100, 200, 150, 20);
   * const bounds = rect.getBounds();
   * // bounds: x=100, y=100, width=200, height=150
   *
   * // Reuse existing rectangle
   * const out = new Rectangle();
   * rect.getBounds(out);
   * ```
   * @remarks
   * - Rectangle matches outer dimensions
   * - Ignores corner radius
   * @param out - Optional rectangle to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link RoundedRectangle.contains} For checking if a point is inside
   */
  getBounds(t) {
    return t || (t = new j()), t.x = this.x, t.y = this.y, t.width = this.width, t.height = this.height, t;
  }
  /**
   * Creates a clone of this Rounded Rectangle.
   * @example
   * ```ts
   * // Basic cloning
   * const original = new RoundedRectangle(100, 100, 200, 150, 20);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.radius = 30;
   * modified.width *= 2;
   *
   * // Verify independence
   * console.log(original.radius);  // 20
   * console.log(modified.radius);  // 30
   * ```
   * @returns A copy of the rounded rectangle
   * @see {@link RoundedRectangle.copyFrom} For copying into existing rectangle
   * @see {@link RoundedRectangle.copyTo} For copying to another rectangle
   */
  clone() {
    return new ri(this.x, this.y, this.width, this.height, this.radius);
  }
  /**
   * Copies another rectangle to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new RoundedRectangle(100, 100, 200, 150, 20);
   * const target = new RoundedRectangle();
   * target.copyFrom(source);
   *
   * // Chain with other operations
   * const rect = new RoundedRectangle()
   *     .copyFrom(source)
   *     .getBounds(rect);
   * ```
   * @param rectangle - The rectangle to copy from
   * @returns Returns itself
   * @see {@link RoundedRectangle.copyTo} For copying to another rectangle
   * @see {@link RoundedRectangle.clone} For creating new rectangle copy
   */
  copyFrom(t) {
    return this.x = t.x, this.y = t.y, this.width = t.width, this.height = t.height, this;
  }
  /**
   * Copies this rectangle to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new RoundedRectangle(100, 100, 200, 150, 20);
   * const target = new RoundedRectangle();
   * source.copyTo(target);
   *
   * // Chain with other operations
   * const result = source
   *     .copyTo(new RoundedRectangle())
   *     .getBounds();
   * ```
   * @param rectangle - The rectangle to copy to
   * @returns Returns given parameter
   * @see {@link RoundedRectangle.copyFrom} For copying from another rectangle
   * @see {@link RoundedRectangle.clone} For creating new rectangle copy
   */
  copyTo(t) {
    return t.copyFrom(this), t;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this Rounded Rectangle
   * @example
   * ```ts
   * // Basic containment check
   * const rect = new RoundedRectangle(100, 100, 200, 150, 20);
   * const isInside = rect.contains(150, 125); // true
   * // Check corner radius
   * const corner = rect.contains(100, 100); // false if within corner curve
   * ```
   * @remarks
   * - Returns false if width/height is 0 or negative
   * - Handles rounded corners with radius check
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Rounded Rectangle
   * @see {@link RoundedRectangle.strokeContains} For checking stroke intersection
   * @see {@link RoundedRectangle.getBounds} For getting containing rectangle
   */
  contains(t, e) {
    if (this.width <= 0 || this.height <= 0)
      return !1;
    if (t >= this.x && t <= this.x + this.width && e >= this.y && e <= this.y + this.height) {
      const s = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
      if (e >= this.y + s && e <= this.y + this.height - s || t >= this.x + s && t <= this.x + this.width - s)
        return !0;
      let i = t - (this.x + s), n = e - (this.y + s);
      const o = s * s;
      if (i * i + n * n <= o || (i = t - (this.x + this.width - s), i * i + n * n <= o) || (n = e - (this.y + this.height - s), i * i + n * n <= o) || (i = t - (this.x + s), i * i + n * n <= o))
        return !0;
    }
    return !1;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this rectangle including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const rect = new RoundedRectangle(100, 100, 200, 150, 20);
   * const isOnStroke = rect.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = rect.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = rect.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = rect.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @param pX - The X coordinate of the point to test
   * @param pY - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coordinates are within this rectangle's stroke
   * @see {@link RoundedRectangle.contains} For checking fill containment
   * @see {@link RoundedRectangle.getBounds} For getting stroke bounds
   */
  strokeContains(t, e, s, i = 0.5) {
    const { x: n, y: o, width: a, height: h, radius: l } = this, c = s * (1 - i), d = s - c, f = n + l, u = o + l, p = a - l * 2, m = h - l * 2, g = n + a, x = o + h;
    return (t >= n - c && t <= n + d || t >= g - d && t <= g + c) && e >= u && e <= u + m || (e >= o - c && e <= o + d || e >= x - d && e <= x + c) && t >= f && t <= f + p ? !0 : (
      // Top-left
      t < f && e < u && He(
        t,
        e,
        f,
        u,
        l,
        d,
        c
      ) || t > g - l && e < u && He(
        t,
        e,
        g - l,
        u,
        l,
        d,
        c
      ) || t > g - l && e > x - l && He(
        t,
        e,
        g - l,
        x - l,
        l,
        d,
        c
      ) || t < f && e > x - l && He(
        t,
        e,
        f,
        x - l,
        l,
        d,
        c
      )
    );
  }
  toString() {
    return `[pixi.js/math:RoundedRectangle x=${this.x} y=${this.y}width=${this.width} height=${this.height} radius=${this.radius}]`;
  }
}
const Cn = {};
function Za(r, t, e) {
  let s = 2166136261;
  for (let i = 0; i < t; i++)
    s ^= r[i].uid, s = Math.imul(s, 16777619), s >>>= 0;
  return Cn[s] || Qa(r, t, s, e);
}
function Qa(r, t, e, s) {
  const i = {};
  let n = 0;
  for (let a = 0; a < s; a++) {
    const h = a < t ? r[a] : D.EMPTY.source;
    i[n++] = h.source, i[n++] = h.style;
  }
  const o = new $e(i);
  return Cn[e] = o, o;
}
class Wi {
  constructor(t) {
    typeof t == "number" ? this.rawBinaryData = new ArrayBuffer(t) : t instanceof Uint8Array ? this.rawBinaryData = t.buffer : this.rawBinaryData = t, this.uint32View = new Uint32Array(this.rawBinaryData), this.float32View = new Float32Array(this.rawBinaryData), this.size = this.rawBinaryData.byteLength;
  }
  /** View on the raw binary data as a `Int8Array`. */
  get int8View() {
    return this._int8View || (this._int8View = new Int8Array(this.rawBinaryData)), this._int8View;
  }
  /** View on the raw binary data as a `Uint8Array`. */
  get uint8View() {
    return this._uint8View || (this._uint8View = new Uint8Array(this.rawBinaryData)), this._uint8View;
  }
  /**  View on the raw binary data as a `Int16Array`. */
  get int16View() {
    return this._int16View || (this._int16View = new Int16Array(this.rawBinaryData)), this._int16View;
  }
  /** View on the raw binary data as a `Int32Array`. */
  get int32View() {
    return this._int32View || (this._int32View = new Int32Array(this.rawBinaryData)), this._int32View;
  }
  /** View on the raw binary data as a `Float64Array`. */
  get float64View() {
    return this._float64Array || (this._float64Array = new Float64Array(this.rawBinaryData)), this._float64Array;
  }
  /** View on the raw binary data as a `BigUint64Array`. */
  get bigUint64View() {
    return this._bigUint64Array || (this._bigUint64Array = new BigUint64Array(this.rawBinaryData)), this._bigUint64Array;
  }
  /**
   * Returns the view of the given type.
   * @param type - One of `int8`, `uint8`, `int16`,
   *    `uint16`, `int32`, `uint32`, and `float32`.
   * @returns - typed array of given type
   */
  view(t) {
    return this[`${t}View`];
  }
  /** Destroys all buffer references. Do not use after calling this. */
  destroy() {
    this.rawBinaryData = null, this.uint32View = null, this.float32View = null, this.uint16View = null, this._int8View = null, this._uint8View = null, this._int16View = null, this._int32View = null, this._float64Array = null, this._bigUint64Array = null;
  }
  /**
   * Returns the size of the given type in bytes.
   * @param type - One of `int8`, `uint8`, `int16`,
   *   `uint16`, `int32`, `uint32`, and `float32`.
   * @returns - size of the type in bytes
   */
  static sizeOf(t) {
    switch (t) {
      case "int8":
      case "uint8":
        return 1;
      case "int16":
      case "uint16":
        return 2;
      case "int32":
      case "uint32":
      case "float32":
        return 4;
      default:
        throw new Error(`${t} isn't a valid view type`);
    }
  }
}
function Ui(r, t) {
  const e = r.byteLength / 8 | 0, s = new Float64Array(r, 0, e);
  new Float64Array(t, 0, e).set(s);
  const n = r.byteLength - e * 8;
  if (n > 0) {
    const o = new Uint8Array(r, e * 8, n);
    new Uint8Array(t, e * 8, n).set(o);
  }
}
const Ja = {
  normal: "normal-npm",
  add: "add-npm",
  screen: "screen-npm"
};
var th = /* @__PURE__ */ ((r) => (r[r.DISABLED = 0] = "DISABLED", r[r.RENDERING_MASK_ADD = 1] = "RENDERING_MASK_ADD", r[r.MASK_ACTIVE = 2] = "MASK_ACTIVE", r[r.INVERSE_MASK_ACTIVE = 3] = "INVERSE_MASK_ACTIVE", r[r.RENDERING_MASK_REMOVE = 4] = "RENDERING_MASK_REMOVE", r[r.NONE = 5] = "NONE", r))(th || {});
function $i(r, t) {
  return t.alphaMode === "no-premultiply-alpha" && Ja[r] || r;
}
const eh = [
  "precision mediump float;",
  "void main(void){",
  "float test = 0.1;",
  "%forloop%",
  "gl_FragColor = vec4(0.0);",
  "}"
].join(`
`);
function sh(r) {
  let t = "";
  for (let e = 0; e < r; ++e)
    e > 0 && (t += `
else `), e < r - 1 && (t += `if(test == ${e}.0){}`);
  return t;
}
function ih(r, t) {
  if (r === 0)
    throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
  const e = t.createShader(t.FRAGMENT_SHADER);
  try {
    for (; ; ) {
      const s = eh.replace(/%forloop%/gi, sh(r));
      if (t.shaderSource(e, s), t.compileShader(e), !t.getShaderParameter(e, t.COMPILE_STATUS))
        r = r / 2 | 0;
      else
        break;
    }
  } finally {
    t.deleteShader(e);
  }
  return r;
}
let Wt = null;
function rh() {
  if (Wt)
    return Wt;
  const r = rn();
  return Wt = r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS), Wt = ih(
    Wt,
    r
  ), r.getExtension("WEBGL_lose_context")?.loseContext(), Wt;
}
class nh {
  constructor() {
    this.ids = /* @__PURE__ */ Object.create(null), this.textures = [], this.count = 0;
  }
  /** Clear the textures and their locations. */
  clear() {
    for (let t = 0; t < this.count; t++) {
      const e = this.textures[t];
      this.textures[t] = null, this.ids[e.uid] = null;
    }
    this.count = 0;
  }
}
class oh {
  constructor() {
    this.renderPipeId = "batch", this.action = "startBatch", this.start = 0, this.size = 0, this.textures = new nh(), this.blendMode = "normal", this.topology = "triangle-strip", this.canBundle = !0;
  }
  destroy() {
    this.textures = null, this.gpuBindGroup = null, this.bindGroup = null, this.batcher = null;
  }
}
const ge = [];
let Ke = 0;
Me.register({
  clear: () => {
    if (ge.length > 0)
      for (const r of ge)
        r && r.destroy();
    ge.length = 0, Ke = 0;
  }
});
function ji() {
  return Ke > 0 ? ge[--Ke] : new oh();
}
function Vi(r) {
  ge[Ke++] = r;
}
let oe = 0;
const Mn = class Pn {
  constructor(t) {
    this.uid = U("batcher"), this.dirty = !0, this.batchIndex = 0, this.batches = [], this._elements = [], t = { ...Pn.defaultOptions, ...t }, t.maxTextures || (B("v8.8.0", "maxTextures is a required option for Batcher now, please pass it in the options"), t.maxTextures = rh());
    const { maxTextures: e, attributesInitialSize: s, indicesInitialSize: i } = t;
    this.attributeBuffer = new Wi(s * 4), this.indexBuffer = new Uint16Array(i), this.maxTextures = e;
  }
  begin() {
    this.elementSize = 0, this.elementStart = 0, this.indexSize = 0, this.attributeSize = 0;
    for (let t = 0; t < this.batchIndex; t++)
      Vi(this.batches[t]);
    this.batchIndex = 0, this._batchIndexStart = 0, this._batchIndexSize = 0, this.dirty = !0;
  }
  add(t) {
    this._elements[this.elementSize++] = t, t._indexStart = this.indexSize, t._attributeStart = this.attributeSize, t._batcher = this, this.indexSize += t.indexSize, this.attributeSize += t.attributeSize * this.vertexSize;
  }
  checkAndUpdateTexture(t, e) {
    const s = t._batch.textures.ids[e._source.uid];
    return !s && s !== 0 ? !1 : (t._textureId = s, t.texture = e, !0);
  }
  updateElement(t) {
    this.dirty = !0;
    const e = this.attributeBuffer;
    t.packAsQuad ? this.packQuadAttributes(
      t,
      e.float32View,
      e.uint32View,
      t._attributeStart,
      t._textureId
    ) : this.packAttributes(
      t,
      e.float32View,
      e.uint32View,
      t._attributeStart,
      t._textureId
    );
  }
  /**
   * breaks the batcher. This happens when a batch gets too big,
   * or we need to switch to a different type of rendering (a filter for example)
   * @param instructionSet
   */
  break(t) {
    const e = this._elements;
    if (!e[this.elementStart])
      return;
    let s = ji(), i = s.textures;
    i.clear();
    const n = e[this.elementStart];
    let o = $i(n.blendMode, n.texture._source), a = n.topology;
    this.attributeSize * 4 > this.attributeBuffer.size && this._resizeAttributeBuffer(this.attributeSize * 4), this.indexSize > this.indexBuffer.length && this._resizeIndexBuffer(this.indexSize);
    const h = this.attributeBuffer.float32View, l = this.attributeBuffer.uint32View, c = this.indexBuffer;
    let d = this._batchIndexSize, f = this._batchIndexStart, u = "startBatch";
    const p = this.maxTextures;
    for (let m = this.elementStart; m < this.elementSize; ++m) {
      const g = e[m];
      e[m] = null;
      const y = g.texture._source, b = $i(g.blendMode, y), w = o !== b || a !== g.topology;
      if (y._batchTick === oe && !w) {
        g._textureId = y._textureBindLocation, d += g.indexSize, g.packAsQuad ? (this.packQuadAttributes(
          g,
          h,
          l,
          g._attributeStart,
          g._textureId
        ), this.packQuadIndex(
          c,
          g._indexStart,
          g._attributeStart / this.vertexSize
        )) : (this.packAttributes(
          g,
          h,
          l,
          g._attributeStart,
          g._textureId
        ), this.packIndex(
          g,
          c,
          g._indexStart,
          g._attributeStart / this.vertexSize
        )), g._batch = s;
        continue;
      }
      y._batchTick = oe, (i.count >= p || w) && (this._finishBatch(
        s,
        f,
        d - f,
        i,
        o,
        a,
        t,
        u
      ), u = "renderBatch", f = d, o = b, a = g.topology, s = ji(), i = s.textures, i.clear(), ++oe), g._textureId = y._textureBindLocation = i.count, i.ids[y.uid] = i.count, i.textures[i.count++] = y, g._batch = s, d += g.indexSize, g.packAsQuad ? (this.packQuadAttributes(
        g,
        h,
        l,
        g._attributeStart,
        g._textureId
      ), this.packQuadIndex(
        c,
        g._indexStart,
        g._attributeStart / this.vertexSize
      )) : (this.packAttributes(
        g,
        h,
        l,
        g._attributeStart,
        g._textureId
      ), this.packIndex(
        g,
        c,
        g._indexStart,
        g._attributeStart / this.vertexSize
      ));
    }
    i.count > 0 && (this._finishBatch(
      s,
      f,
      d - f,
      i,
      o,
      a,
      t,
      u
    ), f = d, ++oe), this.elementStart = this.elementSize, this._batchIndexStart = f, this._batchIndexSize = d;
  }
  _finishBatch(t, e, s, i, n, o, a, h) {
    t.gpuBindGroup = null, t.bindGroup = null, t.action = h, t.batcher = this, t.textures = i, t.blendMode = n, t.topology = o, t.start = e, t.size = s, ++oe, this.batches[this.batchIndex++] = t, a.add(t);
  }
  finish(t) {
    this.break(t);
  }
  /**
   * Resizes the attribute buffer to the given size (1 = 1 float32)
   * @param size - the size in vertices to ensure (not bytes!)
   */
  ensureAttributeBuffer(t) {
    t * 4 <= this.attributeBuffer.size || this._resizeAttributeBuffer(t * 4);
  }
  /**
   * Resizes the index buffer to the given size (1 = 1 float32)
   * @param size - the size in vertices to ensure (not bytes!)
   */
  ensureIndexBuffer(t) {
    t <= this.indexBuffer.length || this._resizeIndexBuffer(t);
  }
  _resizeAttributeBuffer(t) {
    const e = Math.max(t, this.attributeBuffer.size * 2), s = new Wi(e);
    Ui(this.attributeBuffer.rawBinaryData, s.rawBinaryData), this.attributeBuffer = s;
  }
  _resizeIndexBuffer(t) {
    const e = this.indexBuffer;
    let s = Math.max(t, e.length * 1.5);
    s += s % 2;
    const i = s > 65535 ? new Uint32Array(s) : new Uint16Array(s);
    if (i.BYTES_PER_ELEMENT !== e.BYTES_PER_ELEMENT)
      for (let n = 0; n < e.length; n++)
        i[n] = e[n];
    else
      Ui(e.buffer, i.buffer);
    this.indexBuffer = i;
  }
  packQuadIndex(t, e, s) {
    t[e] = s + 0, t[e + 1] = s + 1, t[e + 2] = s + 2, t[e + 3] = s + 0, t[e + 4] = s + 2, t[e + 5] = s + 3;
  }
  packIndex(t, e, s, i) {
    const n = t.indices, o = t.indexSize, a = t.indexOffset, h = t.attributeOffset;
    for (let l = 0; l < o; l++)
      e[s++] = i + n[l + a] - h;
  }
  /**
   * Destroys the batch and its resources.
   * @param options - destruction options
   * @param options.shader - whether to destroy the associated shader
   */
  destroy(t = {}) {
    if (this.batches !== null) {
      for (let e = 0; e < this.batchIndex; e++)
        Vi(this.batches[e]);
      this.batches = null, this.geometry.destroy(!0), this.geometry = null, t.shader && (this.shader?.destroy(), this.shader = null);
      for (let e = 0; e < this._elements.length; e++)
        this._elements[e] && (this._elements[e]._batch = null);
      this._elements = null, this.indexBuffer = null, this.attributeBuffer.destroy(), this.attributeBuffer = null;
    }
  }
};
Mn.defaultOptions = {
  maxTextures: null,
  attributesInitialSize: 4,
  indicesInitialSize: 6
};
let ah = Mn;
var et = /* @__PURE__ */ ((r) => (r[r.MAP_READ = 1] = "MAP_READ", r[r.MAP_WRITE = 2] = "MAP_WRITE", r[r.COPY_SRC = 4] = "COPY_SRC", r[r.COPY_DST = 8] = "COPY_DST", r[r.INDEX = 16] = "INDEX", r[r.VERTEX = 32] = "VERTEX", r[r.UNIFORM = 64] = "UNIFORM", r[r.STORAGE = 128] = "STORAGE", r[r.INDIRECT = 256] = "INDIRECT", r[r.QUERY_RESOLVE = 512] = "QUERY_RESOLVE", r[r.STATIC = 1024] = "STATIC", r))(et || {});
class _e extends xt {
  /**
   * Creates a new Buffer with the given options
   * @param options - the options for the buffer
   */
  constructor(t) {
    let { data: e, size: s } = t;
    const { usage: i, label: n, shrinkToFit: o } = t;
    super(), this._gpuData = /* @__PURE__ */ Object.create(null), this._gcLastUsed = -1, this.autoGarbageCollect = !0, this.uid = U("buffer"), this._resourceType = "buffer", this._resourceId = U("resource"), this._touched = 0, this._updateID = 1, this._dataInt32 = null, this.shrinkToFit = !0, this.destroyed = !1, e instanceof Array && (e = new Float32Array(e)), this._data = e, s ?? (s = e?.byteLength);
    const a = !!e;
    this.descriptor = {
      size: s,
      usage: i,
      mappedAtCreation: a,
      label: n
    }, this.shrinkToFit = o ?? !0;
  }
  /** the data in the buffer */
  get data() {
    return this._data;
  }
  set data(t) {
    this.setDataWithSize(t, t.length, !0);
  }
  get dataInt32() {
    return this._dataInt32 || (this._dataInt32 = new Int32Array(this.data.buffer)), this._dataInt32;
  }
  /** whether the buffer is static or not */
  get static() {
    return !!(this.descriptor.usage & et.STATIC);
  }
  set static(t) {
    t ? this.descriptor.usage |= et.STATIC : this.descriptor.usage &= ~et.STATIC;
  }
  /**
   * Sets the data in the buffer to the given value. This will immediately update the buffer on the GPU.
   * If you only want to update a subset of the buffer, you can pass in the size of the data.
   * @param value - the data to set
   * @param size - the size of the data in bytes
   * @param syncGPU - should the buffer be updated on the GPU immediately?
   */
  setDataWithSize(t, e, s) {
    if (this._updateID++, this._updateSize = e * t.BYTES_PER_ELEMENT, this._data === t) {
      s && this.emit("update", this);
      return;
    }
    const i = this._data;
    if (this._data = t, this._dataInt32 = null, !i || i.length !== t.length) {
      !this.shrinkToFit && i && t.byteLength < i.byteLength ? s && this.emit("update", this) : (this.descriptor.size = t.byteLength, this._resourceId = U("resource"), this.emit("change", this));
      return;
    }
    s && this.emit("update", this);
  }
  /**
   * updates the buffer on the GPU to reflect the data in the buffer.
   * By default it will update the entire buffer. If you only want to update a subset of the buffer,
   * you can pass in the size of the buffer to update.
   * @param sizeInBytes - the new size of the buffer in bytes
   */
  update(t) {
    this._updateSize = t ?? this._updateSize, this._updateID++, this.emit("update", this);
  }
  /** Unloads the buffer from the GPU */
  unload() {
    this.emit("unload", this);
    for (const t in this._gpuData)
      this._gpuData[t]?.destroy();
    this._gpuData = /* @__PURE__ */ Object.create(null);
  }
  /** Destroys the buffer */
  destroy() {
    this.destroyed = !0, this.unload(), this.emit("destroy", this), this.emit("change", this), this._data = null, this.descriptor = null, this.removeAllListeners();
  }
}
function kn(r, t) {
  if (!(r instanceof _e)) {
    let e = t ? et.INDEX : et.VERTEX;
    r instanceof Array && (t ? (r = new Uint32Array(r), e = et.INDEX | et.COPY_DST) : (r = new Float32Array(r), e = et.VERTEX | et.COPY_DST)), r = new _e({
      data: r,
      label: t ? "index-mesh-buffer" : "vertex-mesh-buffer",
      usage: e
    });
  }
  return r;
}
function hh(r, t, e) {
  const s = r.getAttribute(t);
  if (!s)
    return e.minX = 0, e.minY = 0, e.maxX = 0, e.maxY = 0, e;
  const i = s.buffer.data;
  let n = 1 / 0, o = 1 / 0, a = -1 / 0, h = -1 / 0;
  const l = i.BYTES_PER_ELEMENT, c = (s.offset || 0) / l, d = (s.stride || 8) / l;
  for (let f = c; f < i.length; f += d) {
    const u = i[f], p = i[f + 1];
    u > a && (a = u), p > h && (h = p), u < n && (n = u), p < o && (o = p);
  }
  return e.minX = n, e.minY = o, e.maxX = a, e.maxY = h, e;
}
function lh(r) {
  return (r instanceof _e || Array.isArray(r) || r.BYTES_PER_ELEMENT) && (r = {
    buffer: r
  }), r.buffer = kn(r.buffer, !1), r;
}
class ch extends xt {
  /**
   * Create a new instance of a geometry
   * @param options - The options for the geometry.
   */
  constructor(t = {}) {
    super(), this._gpuData = /* @__PURE__ */ Object.create(null), this.autoGarbageCollect = !0, this._gcLastUsed = -1, this.uid = U("geometry"), this._layoutKey = 0, this.instanceCount = 1, this._bounds = new ut(), this._boundsDirty = !0;
    const { attributes: e, indexBuffer: s, topology: i } = t;
    if (this.buffers = [], this.attributes = {}, e)
      for (const n in e)
        this.addAttribute(n, e[n]);
    this.instanceCount = t.instanceCount ?? 1, s && this.addIndex(s), this.topology = i || "triangle-list";
  }
  onBufferUpdate() {
    this._boundsDirty = !0, this.emit("update", this);
  }
  /**
   * Returns the requested attribute.
   * @param id - The name of the attribute required
   * @returns - The attribute requested.
   */
  getAttribute(t) {
    return this.attributes[t];
  }
  /**
   * Returns the index buffer
   * @returns - The index buffer.
   */
  getIndex() {
    return this.indexBuffer;
  }
  /**
   * Returns the requested buffer.
   * @param id - The name of the buffer required.
   * @returns - The buffer requested.
   */
  getBuffer(t) {
    return this.getAttribute(t).buffer;
  }
  /**
   * Used to figure out how many vertices there are in this geometry
   * @returns the number of vertices in the geometry
   */
  getSize() {
    for (const t in this.attributes) {
      const e = this.attributes[t];
      return e.buffer.data.length / (e.stride / 4 || e.size);
    }
    return 0;
  }
  /**
   * Adds an attribute to the geometry.
   * @param name - The name of the attribute to add.
   * @param attributeOption - The attribute option to add.
   */
  addAttribute(t, e) {
    const s = lh(e);
    this.buffers.indexOf(s.buffer) === -1 && (this.buffers.push(s.buffer), s.buffer.on("update", this.onBufferUpdate, this), s.buffer.on("change", this.onBufferUpdate, this)), this.attributes[t] = s;
  }
  /**
   * Adds an index buffer to the geometry.
   * @param indexBuffer - The index buffer to add. Can be a Buffer, TypedArray, or an array of numbers.
   */
  addIndex(t) {
    this.indexBuffer = kn(t, !0), this.buffers.push(this.indexBuffer);
  }
  /** Returns the bounds of the geometry. */
  get bounds() {
    return this._boundsDirty ? (this._boundsDirty = !1, hh(this, "aPosition", this._bounds)) : this._bounds;
  }
  /** Unloads the geometry from the GPU. */
  unload() {
    this.emit("unload", this);
    for (const t in this._gpuData)
      this._gpuData[t]?.destroy();
    this._gpuData = /* @__PURE__ */ Object.create(null);
  }
  /**
   * destroys the geometry.
   * @param destroyBuffers - destroy the buffers associated with this geometry
   */
  destroy(t = !1) {
    this.emit("destroy", this), this.removeAllListeners(), t && this.buffers.forEach((e) => e.destroy()), this.unload(), this.indexBuffer?.destroy(), this.attributes = null, this.buffers = null, this.indexBuffer = null, this._bounds = null;
  }
}
const dh = new Float32Array(1), uh = new Uint32Array(1);
class fh extends ch {
  constructor() {
    const e = new _e({
      data: dh,
      label: "attribute-batch-buffer",
      usage: et.VERTEX | et.COPY_DST,
      shrinkToFit: !1
    }), s = new _e({
      data: uh,
      label: "index-batch-buffer",
      usage: et.INDEX | et.COPY_DST,
      // | BufferUsage.STATIC,
      shrinkToFit: !1
    }), i = 24;
    super({
      attributes: {
        aPosition: {
          buffer: e,
          format: "float32x2",
          stride: i,
          offset: 0
        },
        aUV: {
          buffer: e,
          format: "float32x2",
          stride: i,
          offset: 8
        },
        aColor: {
          buffer: e,
          format: "unorm8x4",
          stride: i,
          offset: 16
        },
        aTextureIdAndRound: {
          buffer: e,
          format: "uint16x2",
          stride: i,
          offset: 20
        }
      },
      indexBuffer: s
    });
  }
}
function qi(r, t, e) {
  if (r)
    for (const s in r) {
      const i = s.toLocaleLowerCase(), n = t[i];
      if (n) {
        let o = r[s];
        s === "header" && (o = o.replace(/@in\s+[^;]+;\s*/g, "").replace(/@out\s+[^;]+;\s*/g, "")), e && n.push(`//----${e}----//`), n.push(o);
      } else
        J(`${s} placement hook does not exist in shader`);
    }
}
const ph = /\{\{(.*?)\}\}/g;
function Ki(r) {
  const t = {};
  return (r.match(ph)?.map((s) => s.replace(/[{()}]/g, "")) ?? []).forEach((s) => {
    t[s] = [];
  }), t;
}
function Zi(r, t) {
  let e;
  const s = /@in\s+([^;]+);/g;
  for (; (e = s.exec(r)) !== null; )
    t.push(e[1]);
}
function Qi(r, t, e = !1) {
  const s = [];
  Zi(t, s), r.forEach((a) => {
    a.header && Zi(a.header, s);
  });
  const i = s;
  e && i.sort();
  const n = i.map((a, h) => `       @location(${h}) ${a},`).join(`
`);
  let o = t.replace(/@in\s+[^;]+;\s*/g, "");
  return o = o.replace("{{in}}", `
${n}
`), o;
}
function Ji(r, t) {
  let e;
  const s = /@out\s+([^;]+);/g;
  for (; (e = s.exec(r)) !== null; )
    t.push(e[1]);
}
function gh(r) {
  const e = /\b(\w+)\s*:/g.exec(r);
  return e ? e[1] : "";
}
function mh(r) {
  const t = /@.*?\s+/g;
  return r.replace(t, "");
}
function yh(r, t) {
  const e = [];
  Ji(t, e), r.forEach((h) => {
    h.header && Ji(h.header, e);
  });
  let s = 0;
  const i = e.sort().map((h) => h.indexOf("builtin") > -1 ? h : `@location(${s++}) ${h}`).join(`,
`), n = e.sort().map((h) => `       var ${mh(h)};`).join(`
`), o = `return VSOutput(
            ${e.sort().map((h) => ` ${gh(h)}`).join(`,
`)});`;
  let a = t.replace(/@out\s+[^;]+;\s*/g, "");
  return a = a.replace("{{struct}}", `
${i}
`), a = a.replace("{{start}}", `
${n}
`), a = a.replace("{{return}}", `
${o}
`), a;
}
function tr(r, t) {
  let e = r;
  for (const s in t) {
    const i = t[s];
    i.join(`
`).length ? e = e.replace(`{{${s}}}`, `//-----${s} START-----//
${i.join(`
`)}
//----${s} FINISH----//`) : e = e.replace(`{{${s}}}`, "");
  }
  return e;
}
const Pt = /* @__PURE__ */ Object.create(null), Ps = /* @__PURE__ */ new Map();
let xh = 0;
function bh({
  template: r,
  bits: t
}) {
  const e = Tn(r, t);
  if (Pt[e])
    return Pt[e];
  const { vertex: s, fragment: i } = _h(r, t);
  return Pt[e] = An(s, i, t), Pt[e];
}
function wh({
  template: r,
  bits: t
}) {
  const e = Tn(r, t);
  return Pt[e] || (Pt[e] = An(r.vertex, r.fragment, t)), Pt[e];
}
function _h(r, t) {
  const e = t.map((o) => o.vertex).filter((o) => !!o), s = t.map((o) => o.fragment).filter((o) => !!o);
  let i = Qi(e, r.vertex, !0);
  i = yh(e, i);
  const n = Qi(s, r.fragment, !0);
  return {
    vertex: i,
    fragment: n
  };
}
function Tn(r, t) {
  return t.map((e) => (Ps.has(e) || Ps.set(e, xh++), Ps.get(e))).sort((e, s) => e - s).join("-") + r.vertex + r.fragment;
}
function An(r, t, e) {
  const s = Ki(r), i = Ki(t);
  return e.forEach((n) => {
    qi(n.vertex, s, n.name), qi(n.fragment, i, n.name);
  }), {
    vertex: tr(r, s),
    fragment: tr(t, i)
  };
}
const vh = (
  /* wgsl */
  `
    @in aPosition: vec2<f32>;
    @in aUV: vec2<f32>;

    @out @builtin(position) vPosition: vec4<f32>;
    @out vUV : vec2<f32>;
    @out vColor : vec4<f32>;

    {{header}}

    struct VSOutput {
        {{struct}}
    };

    @vertex
    fn main( {{in}} ) -> VSOutput {

        var worldTransformMatrix = globalUniforms.uWorldTransformMatrix;
        var modelMatrix = mat3x3<f32>(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        var position = aPosition;
        var uv = aUV;

        {{start}}

        vColor = vec4<f32>(1., 1., 1., 1.);

        {{main}}

        vUV = uv;

        var modelViewProjectionMatrix = globalUniforms.uProjectionMatrix * worldTransformMatrix * modelMatrix;

        vPosition =  vec4<f32>((modelViewProjectionMatrix *  vec3<f32>(position, 1.0)).xy, 0.0, 1.0);

        vColor *= globalUniforms.uWorldColorAlpha;

        {{end}}

        {{return}}
    };
`
), Sh = (
  /* wgsl */
  `
    @in vUV : vec2<f32>;
    @in vColor : vec4<f32>;

    {{header}}

    @fragment
    fn main(
        {{in}}
      ) -> @location(0) vec4<f32> {

        {{start}}

        var outColor:vec4<f32>;

        {{main}}

        var finalColor:vec4<f32> = outColor * vColor;

        {{end}}

        return finalColor;
      };
`
), Ch = (
  /* glsl */
  `
    in vec2 aPosition;
    in vec2 aUV;

    out vec4 vColor;
    out vec2 vUV;

    {{header}}

    void main(void){

        mat3 worldTransformMatrix = uWorldTransformMatrix;
        mat3 modelMatrix = mat3(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        vec2 position = aPosition;
        vec2 uv = aUV;

        {{start}}

        vColor = vec4(1.);

        {{main}}

        vUV = uv;

        mat3 modelViewProjectionMatrix = uProjectionMatrix * worldTransformMatrix * modelMatrix;

        gl_Position = vec4((modelViewProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);

        vColor *= uWorldColorAlpha;

        {{end}}
    }
`
), Mh = (
  /* glsl */
  `

    in vec4 vColor;
    in vec2 vUV;

    out vec4 finalColor;

    {{header}}

    void main(void) {

        {{start}}

        vec4 outColor;

        {{main}}

        finalColor = outColor * vColor;

        {{end}}
    }
`
), Ph = {
  name: "global-uniforms-bit",
  vertex: {
    header: (
      /* wgsl */
      `
        struct GlobalUniforms {
            uProjectionMatrix:mat3x3<f32>,
            uWorldTransformMatrix:mat3x3<f32>,
            uWorldColorAlpha: vec4<f32>,
            uResolution: vec2<f32>,
        }

        @group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
        `
    )
  }
}, kh = {
  name: "global-uniforms-bit",
  vertex: {
    header: (
      /* glsl */
      `
          uniform mat3 uProjectionMatrix;
          uniform mat3 uWorldTransformMatrix;
          uniform vec4 uWorldColorAlpha;
          uniform vec2 uResolution;
        `
    )
  }
};
function Th({ bits: r, name: t }) {
  const e = bh({
    template: {
      fragment: Sh,
      vertex: vh
    },
    bits: [
      Ph,
      ...r
    ]
  });
  return ts.from({
    name: t,
    vertex: {
      source: e.vertex,
      entryPoint: "main"
    },
    fragment: {
      source: e.fragment,
      entryPoint: "main"
    }
  });
}
function Ah({ bits: r, name: t }) {
  return new on({
    name: t,
    ...wh({
      template: {
        vertex: Ch,
        fragment: Mh
      },
      bits: [
        kh,
        ...r
      ]
    })
  });
}
const Ih = {
  name: "color-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            @in aColor: vec4<f32>;
        `
    ),
    main: (
      /* wgsl */
      `
            vColor *= vec4<f32>(aColor.rgb * aColor.a, aColor.a);
        `
    )
  }
}, Eh = {
  name: "color-bit",
  vertex: {
    header: (
      /* glsl */
      `
            in vec4 aColor;
        `
    ),
    main: (
      /* glsl */
      `
            vColor *= vec4(aColor.rgb * aColor.a, aColor.a);
        `
    )
  }
}, ks = {};
function Rh(r) {
  const t = [];
  if (r === 1)
    t.push("@group(1) @binding(0) var textureSource1: texture_2d<f32>;"), t.push("@group(1) @binding(1) var textureSampler1: sampler;");
  else {
    let e = 0;
    for (let s = 0; s < r; s++)
      t.push(`@group(1) @binding(${e++}) var textureSource${s + 1}: texture_2d<f32>;`), t.push(`@group(1) @binding(${e++}) var textureSampler${s + 1}: sampler;`);
  }
  return t.join(`
`);
}
function Lh(r) {
  const t = [];
  if (r === 1)
    t.push("outColor = textureSampleGrad(textureSource1, textureSampler1, vUV, uvDx, uvDy);");
  else {
    t.push("switch vTextureId {");
    for (let e = 0; e < r; e++)
      e === r - 1 ? t.push("  default:{") : t.push(`  case ${e}:{`), t.push(`      outColor = textureSampleGrad(textureSource${e + 1}, textureSampler${e + 1}, vUV, uvDx, uvDy);`), t.push("      break;}");
    t.push("}");
  }
  return t.join(`
`);
}
function Fh(r) {
  return ks[r] || (ks[r] = {
    name: "texture-batch-bit",
    vertex: {
      header: `
                @in aTextureIdAndRound: vec2<u32>;
                @out @interpolate(flat) vTextureId : u32;
            `,
      main: `
                vTextureId = aTextureIdAndRound.y;
            `,
      end: `
                if(aTextureIdAndRound.x == 1)
                {
                    vPosition = vec4<f32>(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
                }
            `
    },
    fragment: {
      header: `
                @in @interpolate(flat) vTextureId: u32;

                ${Rh(r)}
            `,
      main: `
                var uvDx = dpdx(vUV);
                var uvDy = dpdy(vUV);

                ${Lh(r)}
            `
    }
  }), ks[r];
}
const Ts = {};
function Nh(r) {
  const t = [];
  for (let e = 0; e < r; e++)
    e > 0 && t.push("else"), e < r - 1 && t.push(`if(vTextureId < ${e}.5)`), t.push("{"), t.push(`	outColor = texture(uTextures[${e}], vUV);`), t.push("}");
  return t.join(`
`);
}
function Bh(r) {
  return Ts[r] || (Ts[r] = {
    name: "texture-batch-bit",
    vertex: {
      header: `
                in vec2 aTextureIdAndRound;
                out float vTextureId;

            `,
      main: `
                vTextureId = aTextureIdAndRound.y;
            `,
      end: `
                if(aTextureIdAndRound.x == 1.)
                {
                    gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
                }
            `
    },
    fragment: {
      header: `
                in float vTextureId;

                uniform sampler2D uTextures[${r}];

            `,
      main: `

                ${Nh(r)}
            `
    }
  }), Ts[r];
}
const Gh = {
  name: "round-pixels-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>
            {
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `
    )
  }
}, Dh = {
  name: "round-pixels-bit",
  vertex: {
    header: (
      /* glsl */
      `
            vec2 roundPixels(vec2 position, vec2 targetSize)
            {
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `
    )
  }
}, er = {};
function zh(r) {
  let t = er[r];
  if (t)
    return t;
  const e = new Int32Array(r);
  for (let s = 0; s < r; s++)
    e[s] = s;
  return t = er[r] = new cn({
    uTextures: { value: e, type: "i32", size: r }
  }, { isStatic: !0 }), t;
}
class sr extends ti {
  constructor(t) {
    const e = Ah({
      name: "batch",
      bits: [
        Eh,
        Bh(t),
        Dh
      ]
    }), s = Th({
      name: "batch",
      bits: [
        Ih,
        Fh(t),
        Gh
      ]
    });
    super({
      glProgram: e,
      gpuProgram: s,
      resources: {
        batchSamplers: zh(t)
      }
    }), this.maxTextures = t;
  }
}
let ae = null;
const In = class En extends ah {
  constructor(t) {
    super(t), this.geometry = new fh(), this.name = En.extension.name, this.vertexSize = 6, ae ?? (ae = new sr(t.maxTextures)), this.shader = ae;
  }
  /**
   * Packs the attributes of a DefaultBatchableMeshElement into the provided views.
   * @param element - The DefaultBatchableMeshElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */
  packAttributes(t, e, s, i, n) {
    const o = n << 16 | t.roundPixels & 65535, a = t.transform, h = a.a, l = a.b, c = a.c, d = a.d, f = a.tx, u = a.ty, { positions: p, uvs: m } = t, g = t.color, x = t.attributeOffset, y = x + t.attributeSize;
    for (let b = x; b < y; b++) {
      const w = b * 2, S = p[w], _ = p[w + 1];
      e[i++] = h * S + c * _ + f, e[i++] = d * _ + l * S + u, e[i++] = m[w], e[i++] = m[w + 1], s[i++] = g, s[i++] = o;
    }
  }
  /**
   * Packs the attributes of a DefaultBatchableQuadElement into the provided views.
   * @param element - The DefaultBatchableQuadElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */
  packQuadAttributes(t, e, s, i, n) {
    const o = t.texture, a = t.transform, h = a.a, l = a.b, c = a.c, d = a.d, f = a.tx, u = a.ty, p = t.bounds, m = p.maxX, g = p.minX, x = p.maxY, y = p.minY, b = o.uvs, w = t.color, S = n << 16 | t.roundPixels & 65535;
    e[i + 0] = h * g + c * y + f, e[i + 1] = d * y + l * g + u, e[i + 2] = b.x0, e[i + 3] = b.y0, s[i + 4] = w, s[i + 5] = S, e[i + 6] = h * m + c * y + f, e[i + 7] = d * y + l * m + u, e[i + 8] = b.x1, e[i + 9] = b.y1, s[i + 10] = w, s[i + 11] = S, e[i + 12] = h * m + c * x + f, e[i + 13] = d * x + l * m + u, e[i + 14] = b.x2, e[i + 15] = b.y2, s[i + 16] = w, s[i + 17] = S, e[i + 18] = h * g + c * x + f, e[i + 19] = d * x + l * g + u, e[i + 20] = b.x3, e[i + 21] = b.y3, s[i + 22] = w, s[i + 23] = S;
  }
  /**
   * Updates the maximum number of textures that can be used in the shader.
   * @param maxTextures - The maximum number of textures that can be used in the shader.
   * @internal
   */
  _updateMaxTextures(t) {
    this.shader.maxTextures !== t && (ae = new sr(t), this.shader = ae);
  }
  destroy() {
    this.shader = null, super.destroy();
  }
};
In.extension = {
  type: [
    z.Batcher
  ],
  name: "default"
};
let Yh = In;
class Xh {
  constructor(t) {
    this.items = /* @__PURE__ */ Object.create(null);
    const { renderer: e, type: s, onUnload: i, priority: n, name: o } = t;
    this._renderer = e, e.gc.addResourceHash(this, "items", s, n ?? 0), this._onUnload = i, this.name = o;
  }
  /**
   * Add an item to the hash. No-op if already added.
   * @param item
   * @returns true if the item was added, false if it was already in the hash
   */
  add(t) {
    return this.items[t.uid] ? !1 : (this.items[t.uid] = t, t.once("unload", this.remove, this), t._gcLastUsed = this._renderer.gc.now, !0);
  }
  remove(t, ...e) {
    if (!this.items[t.uid])
      return;
    const s = t._gpuData[this._renderer.uid];
    s && (this._onUnload?.(t, ...e), s.destroy(), t._gpuData[this._renderer.uid] = null, this.items[t.uid] = null);
  }
  removeAll(...t) {
    Object.values(this.items).forEach((e) => e && this.remove(e, ...t));
  }
  destroy(...t) {
    this.removeAll(...t), this.items = /* @__PURE__ */ Object.create(null), this._renderer = null, this._onUnload = null;
  }
}
function Hh(r, t, e, s, i, n, o, a = null) {
  let h = 0;
  e *= t, i *= n;
  const l = a.a, c = a.b, d = a.c, f = a.d, u = a.tx, p = a.ty;
  for (; h < o; ) {
    const m = r[e], g = r[e + 1];
    s[i] = l * m + d * g + u, s[i + 1] = c * m + f * g + p, i += n, e += t, h++;
  }
}
function Oh(r, t, e, s) {
  let i = 0;
  for (t *= e; i < s; )
    r[t] = 0, r[t + 1] = 0, t += e, i++;
}
function Rn(r, t, e, s, i) {
  const n = t.a, o = t.b, a = t.c, h = t.d, l = t.tx, c = t.ty;
  e || (e = 0), s || (s = 2), i || (i = r.length / s - e);
  let d = e * s;
  for (let f = 0; f < i; f++) {
    const u = r[d], p = r[d + 1];
    r[d] = n * u + a * p + l, r[d + 1] = o * u + h * p + c, d += s;
  }
}
const Wh = new F();
class Ln {
  constructor() {
    this.packAsQuad = !1, this.batcherName = "default", this.topology = "triangle-list", this.applyTransform = !0, this.roundPixels = 0, this._batcher = null, this._batch = null;
  }
  get uvs() {
    return this.geometryData.uvs;
  }
  get positions() {
    return this.geometryData.vertices;
  }
  get indices() {
    return this.geometryData.indices;
  }
  get blendMode() {
    return this.renderable && this.applyTransform ? this.renderable.groupBlendMode : "normal";
  }
  get color() {
    const t = this.baseColor, e = t >> 16 | t & 65280 | (t & 255) << 16, s = this.renderable;
    return s ? Br(e, s.groupColor) + (this.alpha * s.groupAlpha * 255 << 24) : e + (this.alpha * 255 << 24);
  }
  get transform() {
    return this.renderable?.groupTransform || Wh;
  }
  copyTo(t) {
    t.indexOffset = this.indexOffset, t.indexSize = this.indexSize, t.attributeOffset = this.attributeOffset, t.attributeSize = this.attributeSize, t.baseColor = this.baseColor, t.alpha = this.alpha, t.texture = this.texture, t.geometryData = this.geometryData, t.topology = this.topology;
  }
  reset() {
    this.applyTransform = !0, this.renderable = null, this.topology = "triangle-list";
  }
  destroy() {
    this.renderable = null, this.texture = null, this.geometryData = null, this._batcher = null, this._batch = null;
  }
}
const ve = {
  extension: {
    type: z.ShapeBuilder,
    name: "circle"
  },
  build(r, t) {
    let e, s, i, n, o, a;
    if (r.type === "circle") {
      const w = r;
      if (o = a = w.radius, o <= 0)
        return !1;
      e = w.x, s = w.y, i = n = 0;
    } else if (r.type === "ellipse") {
      const w = r;
      if (o = w.halfWidth, a = w.halfHeight, o <= 0 || a <= 0)
        return !1;
      e = w.x, s = w.y, i = n = 0;
    } else {
      const w = r, S = w.width / 2, _ = w.height / 2;
      e = w.x + S, s = w.y + _, o = a = Math.max(0, Math.min(w.radius, Math.min(S, _))), i = S - o, n = _ - a;
    }
    if (i < 0 || n < 0)
      return !1;
    const h = Math.ceil(2.3 * Math.sqrt(o + a)), l = h * 8 + (i ? 4 : 0) + (n ? 4 : 0);
    if (l === 0)
      return !1;
    if (h === 0)
      return t[0] = t[6] = e + i, t[1] = t[3] = s + n, t[2] = t[4] = e - i, t[5] = t[7] = s - n, !0;
    let c = 0, d = h * 4 + (i ? 2 : 0) + 2, f = d, u = l, p = i + o, m = n, g = e + p, x = e - p, y = s + m;
    if (t[c++] = g, t[c++] = y, t[--d] = y, t[--d] = x, n) {
      const w = s - m;
      t[f++] = x, t[f++] = w, t[--u] = w, t[--u] = g;
    }
    for (let w = 1; w < h; w++) {
      const S = Math.PI / 2 * (w / h), _ = i + Math.cos(S) * o, v = n + Math.sin(S) * a, T = e + _, k = e - _, P = s + v, M = s - v;
      t[c++] = T, t[c++] = P, t[--d] = P, t[--d] = k, t[f++] = k, t[f++] = M, t[--u] = M, t[--u] = T;
    }
    p = i, m = n + a, g = e + p, x = e - p, y = s + m;
    const b = s - m;
    return t[c++] = g, t[c++] = y, t[--u] = b, t[--u] = g, i && (t[c++] = x, t[c++] = y, t[--u] = b, t[--u] = x), !0;
  },
  triangulate(r, t, e, s, i, n) {
    if (r.length === 0)
      return;
    let o = 0, a = 0;
    for (let c = 0; c < r.length; c += 2)
      o += r[c], a += r[c + 1];
    o /= r.length / 2, a /= r.length / 2;
    let h = s;
    t[h * e] = o, t[h * e + 1] = a;
    const l = h++;
    for (let c = 0; c < r.length; c += 2)
      t[h * e] = r[c], t[h * e + 1] = r[c + 1], c > 0 && (i[n++] = h, i[n++] = l, i[n++] = h - 1), h++;
    i[n++] = l + 1, i[n++] = l, i[n++] = h - 1;
  }
}, Uh = { ...ve, extension: { ...ve.extension, name: "ellipse" } }, $h = { ...ve, extension: { ...ve.extension, name: "roundedRectangle" } }, Fn = 1e-4, ir = 1e-4;
function jh(r) {
  const t = r.length;
  if (t < 6)
    return 1;
  let e = 0;
  for (let s = 0, i = r[t - 2], n = r[t - 1]; s < t; s += 2) {
    const o = r[s], a = r[s + 1];
    e += (o - i) * (a + n), i = o, n = a;
  }
  return e < 0 ? -1 : 1;
}
function rr(r, t, e, s, i, n, o, a) {
  const h = r - e * i, l = t - s * i, c = r + e * n, d = t + s * n;
  let f, u;
  o ? (f = s, u = -e) : (f = -s, u = e);
  const p = h + f, m = l + u, g = c + f, x = d + u;
  return a.push(p, m), a.push(g, x), 2;
}
function Ft(r, t, e, s, i, n, o, a) {
  const h = e - r, l = s - t;
  let c = Math.atan2(h, l), d = Math.atan2(i - r, n - t);
  a && c < d ? c += Math.PI * 2 : !a && c > d && (d += Math.PI * 2);
  let f = c;
  const u = d - c, p = Math.abs(u), m = Math.sqrt(h * h + l * l), g = (15 * p * Math.sqrt(m) / Math.PI >> 0) + 1, x = u / g;
  if (f += x, a) {
    o.push(r, t), o.push(e, s);
    for (let y = 1, b = f; y < g; y++, b += x)
      o.push(r, t), o.push(
        r + Math.sin(b) * m,
        t + Math.cos(b) * m
      );
    o.push(r, t), o.push(i, n);
  } else {
    o.push(e, s), o.push(r, t);
    for (let y = 1, b = f; y < g; y++, b += x)
      o.push(
        r + Math.sin(b) * m,
        t + Math.cos(b) * m
      ), o.push(r, t);
    o.push(i, n), o.push(r, t);
  }
  return g * 2;
}
function Vh(r, t, e, s, i, n) {
  const o = Fn;
  if (r.length === 0)
    return;
  const a = t;
  let h = a.alignment;
  if (t.alignment !== 0.5) {
    let N = jh(r);
    h = (h - 0.5) * N + 0.5;
  }
  const l = new C(r[0], r[1]), c = new C(r[r.length - 2], r[r.length - 1]), d = s, f = Math.abs(l.x - c.x) < o && Math.abs(l.y - c.y) < o;
  if (d) {
    r = r.slice(), f && (r.pop(), r.pop(), c.set(r[r.length - 2], r[r.length - 1]));
    const N = (l.x + c.x) * 0.5, pt = (c.y + l.y) * 0.5;
    r.unshift(N, pt), r.push(N, pt);
  }
  const u = i, p = r.length / 2;
  let m = r.length;
  const g = u.length / 2, x = a.width / 2, y = x * x, b = a.miterLimit * a.miterLimit;
  let w = r[0], S = r[1], _ = r[2], v = r[3], T = 0, k = 0, P = -(S - v), M = w - _, R = 0, L = 0, X = Math.sqrt(P * P + M * M);
  P /= X, M /= X, P *= x, M *= x;
  const Ct = h, A = (1 - Ct) * 2, E = Ct * 2;
  d || (a.cap === "round" ? m += Ft(
    w - P * (A - E) * 0.5,
    S - M * (A - E) * 0.5,
    w - P * A,
    S - M * A,
    w + P * E,
    S + M * E,
    u,
    !0
  ) + 2 : a.cap === "square" && (m += rr(w, S, P, M, A, E, !0, u))), u.push(
    w - P * A,
    S - M * A
  ), u.push(
    w + P * E,
    S + M * E
  );
  for (let N = 1; N < p - 1; ++N) {
    w = r[(N - 1) * 2], S = r[(N - 1) * 2 + 1], _ = r[N * 2], v = r[N * 2 + 1], T = r[(N + 1) * 2], k = r[(N + 1) * 2 + 1], P = -(S - v), M = w - _, X = Math.sqrt(P * P + M * M), P /= X, M /= X, P *= x, M *= x, R = -(v - k), L = _ - T, X = Math.sqrt(R * R + L * L), R /= X, L /= X, R *= x, L *= x;
    const pt = _ - w, Tt = S - v, nt = _ - T, Mt = k - v, ee = pt * nt + Tt * Mt, Ot = Tt * nt - Mt * pt, At = Ot < 0;
    if (Math.abs(Ot) < 1e-3 * Math.abs(ee)) {
      u.push(
        _ - P * A,
        v - M * A
      ), u.push(
        _ + P * E,
        v + M * E
      ), ee >= 0 && (a.join === "round" ? m += Ft(
        _,
        v,
        _ - P * A,
        v - M * A,
        _ - R * A,
        v - L * A,
        u,
        !1
      ) + 4 : m += 2, u.push(
        _ - R * E,
        v - L * E
      ), u.push(
        _ + R * A,
        v + L * A
      ));
      continue;
    }
    const li = (-P + w) * (-M + v) - (-P + _) * (-M + S), ci = (-R + T) * (-L + v) - (-R + _) * (-L + k), ke = (pt * ci - nt * li) / Ot, Te = (Mt * li - Tt * ci) / Ot, hs = (ke - _) * (ke - _) + (Te - v) * (Te - v), It = _ + (ke - _) * A, Et = v + (Te - v) * A, Rt = _ - (ke - _) * E, Lt = v - (Te - v) * E, On = Math.min(pt * pt + Tt * Tt, nt * nt + Mt * Mt), di = At ? A : E, Wn = On + di * di * y;
    hs <= Wn ? a.join === "bevel" || hs / y > b ? (At ? (u.push(It, Et), u.push(_ + P * E, v + M * E), u.push(It, Et), u.push(_ + R * E, v + L * E)) : (u.push(_ - P * A, v - M * A), u.push(Rt, Lt), u.push(_ - R * A, v - L * A), u.push(Rt, Lt)), m += 2) : a.join === "round" ? At ? (u.push(It, Et), u.push(_ + P * E, v + M * E), m += Ft(
      _,
      v,
      _ + P * E,
      v + M * E,
      _ + R * E,
      v + L * E,
      u,
      !0
    ) + 4, u.push(It, Et), u.push(_ + R * E, v + L * E)) : (u.push(_ - P * A, v - M * A), u.push(Rt, Lt), m += Ft(
      _,
      v,
      _ - P * A,
      v - M * A,
      _ - R * A,
      v - L * A,
      u,
      !1
    ) + 4, u.push(_ - R * A, v - L * A), u.push(Rt, Lt)) : (u.push(It, Et), u.push(Rt, Lt)) : (u.push(_ - P * A, v - M * A), u.push(_ + P * E, v + M * E), a.join === "round" ? At ? m += Ft(
      _,
      v,
      _ + P * E,
      v + M * E,
      _ + R * E,
      v + L * E,
      u,
      !0
    ) + 2 : m += Ft(
      _,
      v,
      _ - P * A,
      v - M * A,
      _ - R * A,
      v - L * A,
      u,
      !1
    ) + 2 : a.join === "miter" && hs / y <= b && (At ? (u.push(Rt, Lt), u.push(Rt, Lt)) : (u.push(It, Et), u.push(It, Et)), m += 2), u.push(_ - R * A, v - L * A), u.push(_ + R * E, v + L * E), m += 2);
  }
  w = r[(p - 2) * 2], S = r[(p - 2) * 2 + 1], _ = r[(p - 1) * 2], v = r[(p - 1) * 2 + 1], P = -(S - v), M = w - _, X = Math.sqrt(P * P + M * M), P /= X, M /= X, P *= x, M *= x, u.push(_ - P * A, v - M * A), u.push(_ + P * E, v + M * E), d || (a.cap === "round" ? m += Ft(
    _ - P * (A - E) * 0.5,
    v - M * (A - E) * 0.5,
    _ - P * A,
    v - M * A,
    _ + P * E,
    v + M * E,
    u,
    !1
  ) + 2 : a.cap === "square" && (m += rr(_, v, P, M, A, E, !1, u)));
  const kt = ir * ir;
  for (let N = g; N < m + g - 2; ++N)
    w = u[N * 2], S = u[N * 2 + 1], _ = u[(N + 1) * 2], v = u[(N + 1) * 2 + 1], T = u[(N + 2) * 2], k = u[(N + 2) * 2 + 1], !(Math.abs(w * (v - k) + _ * (k - S) + T * (S - v)) < kt) && n.push(N, N + 1, N + 2);
}
function qh(r, t, e, s) {
  const i = Fn;
  if (r.length === 0)
    return;
  const n = r[0], o = r[1], a = r[r.length - 2], h = r[r.length - 1], l = t || Math.abs(n - a) < i && Math.abs(o - h) < i, c = e, d = r.length / 2, f = c.length / 2;
  for (let u = 0; u < d; u++)
    c.push(r[u * 2]), c.push(r[u * 2 + 1]);
  for (let u = 0; u < d - 1; u++)
    s.push(f + u, f + u + 1);
  l && s.push(f + d - 1, f);
}
function Nn(r, t, e, s, i, n, o) {
  const a = La(r, t, 2);
  if (!a)
    return;
  for (let l = 0; l < a.length; l += 3)
    n[o++] = a[l] + i, n[o++] = a[l + 1] + i, n[o++] = a[l + 2] + i;
  let h = i * s;
  for (let l = 0; l < r.length; l += 2)
    e[h] = r[l], e[h + 1] = r[l + 1], h += s;
}
const Kh = [], Zh = {
  extension: {
    type: z.ShapeBuilder,
    name: "polygon"
  },
  build(r, t) {
    for (let e = 0; e < r.points.length; e++)
      t[e] = r.points[e];
    return !0;
  },
  triangulate(r, t, e, s, i, n) {
    Nn(r, Kh, t, e, s, i, n);
  }
}, Qh = {
  extension: {
    type: z.ShapeBuilder,
    name: "rectangle"
  },
  build(r, t) {
    const e = r, s = e.x, i = e.y, n = e.width, o = e.height;
    return n > 0 && o > 0 ? (t[0] = s, t[1] = i, t[2] = s + n, t[3] = i, t[4] = s + n, t[5] = i + o, t[6] = s, t[7] = i + o, !0) : !1;
  },
  triangulate(r, t, e, s, i, n) {
    let o = 0;
    s *= e, t[s + o] = r[0], t[s + o + 1] = r[1], o += e, t[s + o] = r[2], t[s + o + 1] = r[3], o += e, t[s + o] = r[6], t[s + o + 1] = r[7], o += e, t[s + o] = r[4], t[s + o + 1] = r[5], o += e;
    const a = s / e;
    i[n++] = a, i[n++] = a + 1, i[n++] = a + 2, i[n++] = a + 1, i[n++] = a + 3, i[n++] = a + 2;
  }
}, Jh = {
  extension: {
    type: z.ShapeBuilder,
    name: "triangle"
  },
  build(r, t) {
    return t[0] = r.x, t[1] = r.y, t[2] = r.x2, t[3] = r.y2, t[4] = r.x3, t[5] = r.y3, !0;
  },
  triangulate(r, t, e, s, i, n) {
    let o = 0;
    s *= e, t[s + o] = r[0], t[s + o + 1] = r[1], o += e, t[s + o] = r[2], t[s + o + 1] = r[3], o += e, t[s + o] = r[4], t[s + o + 1] = r[5];
    const a = s / e;
    i[n++] = a, i[n++] = a + 1, i[n++] = a + 2;
  }
}, tl = new F(), el = new j();
function sl(r, t, e, s) {
  const i = t.matrix ? r.copyFrom(t.matrix).invert() : r.identity();
  if (t.textureSpace === "local") {
    const o = e.getBounds(el);
    t.width && o.pad(t.width);
    const { x: a, y: h } = o, l = 1 / o.width, c = 1 / o.height, d = -a * l, f = -h * c, u = i.a, p = i.b, m = i.c, g = i.d;
    i.a *= l, i.b *= l, i.c *= c, i.d *= c, i.tx = d * u + f * m + i.tx, i.ty = d * p + f * g + i.ty;
  } else
    i.translate(t.texture.frame.x, t.texture.frame.y), i.scale(1 / t.texture.source.width, 1 / t.texture.source.height);
  const n = t.texture.source.style;
  return !(t.fill instanceof St) && n.addressMode === "clamp-to-edge" && (n.addressMode = "repeat", n.update()), s && i.append(tl.copyFrom(s).invert()), i;
}
const ss = {};
ht.handleByMap(z.ShapeBuilder, ss);
ht.add(Qh, Zh, Jh, ve, Uh, $h);
const il = new j(), rl = new F();
function nl(r, t) {
  const { geometryData: e, batches: s } = t;
  s.length = 0, e.indices.length = 0, e.vertices.length = 0, e.uvs.length = 0;
  for (let i = 0; i < r.instructions.length; i++) {
    const n = r.instructions[i];
    if (n.action === "texture")
      ol(n.data, s, e);
    else if (n.action === "fill" || n.action === "stroke") {
      const o = n.action === "stroke", a = n.data.path.shapePath, h = n.data.style, l = n.data.hole;
      o && l && nr(l.shapePath, h, !0, s, e), l && (a.shapePrimitives[a.shapePrimitives.length - 1].holes = l.shapePath.shapePrimitives), nr(a, h, o, s, e);
    }
  }
}
function ol(r, t, e) {
  const s = [], i = ss.rectangle, n = il;
  n.x = r.dx, n.y = r.dy, n.width = r.dw, n.height = r.dh;
  const o = r.transform;
  if (!i.build(n, s))
    return;
  const { vertices: a, uvs: h, indices: l } = e, c = l.length, d = a.length / 2;
  o && Rn(s, o), i.triangulate(s, a, 2, d, l, c);
  const f = r.image, u = f.uvs;
  h.push(
    u.x0,
    u.y0,
    u.x1,
    u.y1,
    u.x3,
    u.y3,
    u.x2,
    u.y2
  );
  const p = at.get(Ln);
  p.indexOffset = c, p.indexSize = l.length - c, p.attributeOffset = d, p.attributeSize = a.length / 2 - d, p.baseColor = r.style, p.alpha = r.alpha, p.texture = f, p.geometryData = e, t.push(p);
}
function nr(r, t, e, s, i) {
  const { vertices: n, uvs: o, indices: a } = i;
  r.shapePrimitives.forEach(({ shape: h, transform: l, holes: c }) => {
    const d = [], f = ss[h.type];
    if (!f.build(h, d))
      return;
    const u = a.length, p = n.length / 2;
    let m = "triangle-list";
    if (l && Rn(d, l), e) {
      const b = h.closePath ?? !0, w = t;
      w.pixelLine ? (qh(d, b, n, a), m = "line-list") : Vh(d, w, !1, b, n, a);
    } else if (c) {
      const b = [], w = d.slice();
      al(c).forEach((_) => {
        b.push(w.length / 2), w.push(..._);
      }), Nn(w, b, n, 2, p, a, u);
    } else
      f.triangulate(d, n, 2, p, a, u);
    const g = o.length / 2, x = t.texture;
    if (x !== D.WHITE) {
      const b = sl(rl, t, h, l);
      Hh(n, 2, p, o, g, 2, n.length / 2 - p, b);
    } else
      Oh(o, g, 2, n.length / 2 - p);
    const y = at.get(Ln);
    y.indexOffset = u, y.indexSize = a.length - u, y.attributeOffset = p, y.attributeSize = n.length / 2 - p, y.baseColor = t.color, y.alpha = t.alpha, y.texture = x, y.geometryData = i, y.topology = m, s.push(y);
  });
}
function al(r) {
  const t = [];
  for (let e = 0; e < r.length; e++) {
    const s = r[e].shape, i = [];
    ss[s.type].build(s, i) && t.push(i);
  }
  return t;
}
class hl {
  constructor() {
    this.batches = [], this.geometryData = {
      vertices: [],
      uvs: [],
      indices: []
    };
  }
  reset() {
    this.batches && this.batches.forEach((t) => {
      at.return(t);
    }), this.graphicsData && at.return(this.graphicsData), this.isBatchable = !1, this.context = null, this.batches.length = 0, this.geometryData.indices.length = 0, this.geometryData.vertices.length = 0, this.geometryData.uvs.length = 0, this.graphicsData = null;
  }
  destroy() {
    this.reset(), this.batches = null, this.geometryData = null;
  }
}
class ll {
  constructor() {
    this.instructions = new Yr();
  }
  init(t) {
    const e = t.maxTextures;
    this.batcher ? this.batcher._updateMaxTextures(e) : this.batcher = new Yh({ maxTextures: e }), this.instructions.reset();
  }
  /**
   * @deprecated since version 8.0.0
   * Use `batcher.geometry` instead.
   * @see {Batcher#geometry}
   */
  get geometry() {
    return B(eo, "GraphicsContextRenderData#geometry is deprecated, please use batcher.geometry instead."), this.batcher.geometry;
  }
  destroy() {
    this.batcher.destroy(), this.instructions.destroy(), this.batcher = null, this.instructions = null;
  }
}
const ni = class $s {
  constructor(t) {
    this._renderer = t, this._managedContexts = new Xh({ renderer: t, type: "resource", name: "graphicsContext" });
  }
  /**
   * Runner init called, update the default options
   * @ignore
   */
  init(t) {
    $s.defaultOptions.bezierSmoothness = t?.bezierSmoothness ?? $s.defaultOptions.bezierSmoothness;
  }
  /**
   * Returns the render data for a given GraphicsContext.
   * @param context - The GraphicsContext to get the render data for.
   * @internal
   */
  getContextRenderData(t) {
    return t._gpuData[this._renderer.uid].graphicsData || this._initContextRenderData(t);
  }
  /**
   * Updates the GPU context for a given GraphicsContext.
   * If the context is dirty, it will rebuild the batches and geometry data.
   * @param context - The GraphicsContext to update.
   * @returns The updated GpuGraphicsContext.
   * @internal
   */
  updateGpuContext(t) {
    const e = !!t._gpuData[this._renderer.uid], s = t._gpuData[this._renderer.uid] || this._initContext(t);
    if (t.dirty || !e) {
      e && s.reset(), nl(t, s);
      const i = t.batchMode;
      t.customShader || i === "no-batch" ? s.isBatchable = !1 : i === "auto" ? s.isBatchable = s.geometryData.vertices.length < 400 : s.isBatchable = !0, t.dirty = !1;
    }
    return s;
  }
  /**
   * Returns the GpuGraphicsContext for a given GraphicsContext.
   * If it does not exist, it will initialize a new one.
   * @param context - The GraphicsContext to get the GpuGraphicsContext for.
   * @returns The GpuGraphicsContext for the given GraphicsContext.
   * @internal
   */
  getGpuContext(t) {
    return t._gpuData[this._renderer.uid] || this._initContext(t);
  }
  _initContextRenderData(t) {
    const e = at.get(ll, {
      maxTextures: this._renderer.limits.maxBatchableTextures
    }), s = t._gpuData[this._renderer.uid], { batches: i, geometryData: n } = s;
    s.graphicsData = e;
    const o = n.vertices.length, a = n.indices.length;
    for (let d = 0; d < i.length; d++)
      i[d].applyTransform = !1;
    const h = e.batcher;
    h.ensureAttributeBuffer(o), h.ensureIndexBuffer(a), h.begin();
    for (let d = 0; d < i.length; d++) {
      const f = i[d];
      h.add(f);
    }
    h.finish(e.instructions);
    const l = h.geometry;
    l.indexBuffer.setDataWithSize(h.indexBuffer, h.indexSize, !0), l.buffers[0].setDataWithSize(h.attributeBuffer.float32View, h.attributeSize, !0);
    const c = h.batches;
    for (let d = 0; d < c.length; d++) {
      const f = c[d];
      f.bindGroup = Za(
        f.textures.textures,
        f.textures.count,
        this._renderer.limits.maxBatchableTextures
      );
    }
    return e;
  }
  _initContext(t) {
    const e = new hl();
    return e.context = t, t._gpuData[this._renderer.uid] = e, this._managedContexts.add(t), e;
  }
  destroy() {
    this._managedContexts.destroy(), this._renderer = null;
  }
};
ni.extension = {
  type: [
    z.WebGLSystem,
    z.WebGPUSystem,
    z.CanvasSystem
  ],
  name: "graphicsContext"
};
ni.defaultOptions = {
  /**
   * A value from 0 to 1 that controls the smoothness of bezier curves (the higher the smoother)
   * @default 0.5
   */
  bezierSmoothness: 0.5
};
let Bn = ni;
const cl = 8, Oe = 11920929e-14, dl = 1;
function Gn(r, t, e, s, i, n, o, a, h, l) {
  const d = Math.min(
    0.99,
    // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, l ?? Bn.defaultOptions.bezierSmoothness)
  );
  let f = (dl - d) / 1;
  return f *= f, ul(t, e, s, i, n, o, a, h, r, f), r;
}
function ul(r, t, e, s, i, n, o, a, h, l) {
  js(r, t, e, s, i, n, o, a, h, l, 0), h.push(o, a);
}
function js(r, t, e, s, i, n, o, a, h, l, c) {
  if (c > cl)
    return;
  const d = (r + e) / 2, f = (t + s) / 2, u = (e + i) / 2, p = (s + n) / 2, m = (i + o) / 2, g = (n + a) / 2, x = (d + u) / 2, y = (f + p) / 2, b = (u + m) / 2, w = (p + g) / 2, S = (x + b) / 2, _ = (y + w) / 2;
  if (c > 0) {
    let v = o - r, T = a - t;
    const k = Math.abs((e - o) * T - (s - a) * v), P = Math.abs((i - o) * T - (n - a) * v);
    if (k > Oe && P > Oe) {
      if ((k + P) * (k + P) <= l * (v * v + T * T)) {
        h.push(S, _);
        return;
      }
    } else if (k > Oe) {
      if (k * k <= l * (v * v + T * T)) {
        h.push(S, _);
        return;
      }
    } else if (P > Oe) {
      if (P * P <= l * (v * v + T * T)) {
        h.push(S, _);
        return;
      }
    } else if (v = S - (r + o) / 2, T = _ - (t + a) / 2, v * v + T * T <= l) {
      h.push(S, _);
      return;
    }
  }
  js(r, t, d, f, x, y, S, _, h, l, c + 1), js(S, _, b, w, m, g, o, a, h, l, c + 1);
}
const fl = 8, pl = 11920929e-14, gl = 1;
function ml(r, t, e, s, i, n, o, a) {
  const l = Math.min(
    0.99,
    // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, a ?? Bn.defaultOptions.bezierSmoothness)
  );
  let c = (gl - l) / 1;
  return c *= c, yl(t, e, s, i, n, o, r, c), r;
}
function yl(r, t, e, s, i, n, o, a) {
  Vs(o, r, t, e, s, i, n, a, 0), o.push(i, n);
}
function Vs(r, t, e, s, i, n, o, a, h) {
  if (h > fl)
    return;
  const l = (t + s) / 2, c = (e + i) / 2, d = (s + n) / 2, f = (i + o) / 2, u = (l + d) / 2, p = (c + f) / 2;
  let m = n - t, g = o - e;
  const x = Math.abs((s - n) * g - (i - o) * m);
  if (x > pl) {
    if (x * x <= a * (m * m + g * g)) {
      r.push(u, p);
      return;
    }
  } else if (m = u - (t + n) / 2, g = p - (e + o) / 2, m * m + g * g <= a) {
    r.push(u, p);
    return;
  }
  Vs(r, t, e, l, c, u, p, a, h + 1), Vs(r, u, p, d, f, n, o, a, h + 1);
}
function Dn(r, t, e, s, i, n, o, a) {
  let h = Math.abs(i - n);
  (!o && i > n || o && n > i) && (h = 2 * Math.PI - h), a || (a = Math.max(6, Math.floor(6 * Math.pow(s, 1 / 3) * (h / Math.PI)))), a = Math.max(a, 3);
  let l = h / a, c = i;
  l *= o ? -1 : 1;
  for (let d = 0; d < a + 1; d++) {
    const f = Math.cos(c), u = Math.sin(c), p = t + f * s, m = e + u * s;
    r.push(p, m), c += l;
  }
}
function xl(r, t, e, s, i, n) {
  const o = r[r.length - 2], h = r[r.length - 1] - e, l = o - t, c = i - e, d = s - t, f = Math.abs(h * d - l * c);
  if (f < 1e-8 || n === 0) {
    (r[r.length - 2] !== t || r[r.length - 1] !== e) && r.push(t, e);
    return;
  }
  const u = h * h + l * l, p = c * c + d * d, m = h * c + l * d, g = n * Math.sqrt(u) / f, x = n * Math.sqrt(p) / f, y = g * m / u, b = x * m / p, w = g * d + x * l, S = g * c + x * h, _ = l * (x + y), v = h * (x + y), T = d * (g + b), k = c * (g + b), P = Math.atan2(v - S, _ - w), M = Math.atan2(k - S, T - w);
  Dn(
    r,
    w + t,
    S + e,
    n,
    P,
    M,
    l * c > d * h
  );
}
const me = Math.PI * 2, As = {
  centerX: 0,
  centerY: 0,
  ang1: 0,
  ang2: 0
}, Is = ({ x: r, y: t }, e, s, i, n, o, a, h) => {
  r *= e, t *= s;
  const l = i * r - n * t, c = n * r + i * t;
  return h.x = l + o, h.y = c + a, h;
};
function bl(r, t) {
  const e = t === -1.5707963267948966 ? -0.551915024494 : 1.3333333333333333 * Math.tan(t / 4), s = t === 1.5707963267948966 ? 0.551915024494 : e, i = Math.cos(r), n = Math.sin(r), o = Math.cos(r + t), a = Math.sin(r + t);
  return [
    {
      x: i - n * s,
      y: n + i * s
    },
    {
      x: o + a * s,
      y: a - o * s
    },
    {
      x: o,
      y: a
    }
  ];
}
const or = (r, t, e, s) => {
  const i = r * s - t * e < 0 ? -1 : 1;
  let n = r * e + t * s;
  return n > 1 && (n = 1), n < -1 && (n = -1), i * Math.acos(n);
}, wl = (r, t, e, s, i, n, o, a, h, l, c, d, f) => {
  const u = Math.pow(i, 2), p = Math.pow(n, 2), m = Math.pow(c, 2), g = Math.pow(d, 2);
  let x = u * p - u * g - p * m;
  x < 0 && (x = 0), x /= u * g + p * m, x = Math.sqrt(x) * (o === a ? -1 : 1);
  const y = x * i / n * d, b = x * -n / i * c, w = l * y - h * b + (r + e) / 2, S = h * y + l * b + (t + s) / 2, _ = (c - y) / i, v = (d - b) / n, T = (-c - y) / i, k = (-d - b) / n, P = or(1, 0, _, v);
  let M = or(_, v, T, k);
  a === 0 && M > 0 && (M -= me), a === 1 && M < 0 && (M += me), f.centerX = w, f.centerY = S, f.ang1 = P, f.ang2 = M;
};
function _l(r, t, e, s, i, n, o, a = 0, h = 0, l = 0) {
  if (n === 0 || o === 0)
    return;
  const c = Math.sin(a * me / 360), d = Math.cos(a * me / 360), f = d * (t - s) / 2 + c * (e - i) / 2, u = -c * (t - s) / 2 + d * (e - i) / 2;
  if (f === 0 && u === 0)
    return;
  n = Math.abs(n), o = Math.abs(o);
  const p = Math.pow(f, 2) / Math.pow(n, 2) + Math.pow(u, 2) / Math.pow(o, 2);
  p > 1 && (n *= Math.sqrt(p), o *= Math.sqrt(p)), wl(
    t,
    e,
    s,
    i,
    n,
    o,
    h,
    l,
    c,
    d,
    f,
    u,
    As
  );
  let { ang1: m, ang2: g } = As;
  const { centerX: x, centerY: y } = As;
  let b = Math.abs(g) / (me / 4);
  Math.abs(1 - b) < 1e-7 && (b = 1);
  const w = Math.max(Math.ceil(b), 1);
  g /= w;
  let S = r[r.length - 2], _ = r[r.length - 1];
  const v = { x: 0, y: 0 };
  for (let T = 0; T < w; T++) {
    const k = bl(m, g), { x: P, y: M } = Is(k[0], n, o, d, c, x, y, v), { x: R, y: L } = Is(k[1], n, o, d, c, x, y, v), { x: X, y: Ct } = Is(k[2], n, o, d, c, x, y, v);
    Gn(
      r,
      S,
      _,
      P,
      M,
      R,
      L,
      X,
      Ct
    ), S = X, _ = Ct, m += g;
  }
}
function vl(r, t, e) {
  const s = (o, a) => {
    const h = a.x - o.x, l = a.y - o.y, c = Math.sqrt(h * h + l * l), d = h / c, f = l / c;
    return { len: c, nx: d, ny: f };
  }, i = (o, a) => {
    o === 0 ? r.moveTo(a.x, a.y) : r.lineTo(a.x, a.y);
  };
  let n = t[t.length - 1];
  for (let o = 0; o < t.length; o++) {
    const a = t[o % t.length], h = a.radius ?? e;
    if (h <= 0) {
      i(o, a), n = a;
      continue;
    }
    const l = t[(o + 1) % t.length], c = s(a, n), d = s(a, l);
    if (c.len < 1e-4 || d.len < 1e-4) {
      i(o, a), n = a;
      continue;
    }
    let f = Math.asin(c.nx * d.ny - c.ny * d.nx), u = 1, p = !1;
    c.nx * d.nx - c.ny * -d.ny < 0 ? f < 0 ? f = Math.PI + f : (f = Math.PI - f, u = -1, p = !0) : f > 0 && (u = -1, p = !0);
    const m = f / 2;
    let g, x = Math.abs(
      Math.cos(m) * h / Math.sin(m)
    );
    x > Math.min(c.len / 2, d.len / 2) ? (x = Math.min(c.len / 2, d.len / 2), g = Math.abs(x * Math.sin(m) / Math.cos(m))) : g = h;
    const y = a.x + d.nx * x + -d.ny * g * u, b = a.y + d.ny * x + d.nx * g * u, w = Math.atan2(c.ny, c.nx) + Math.PI / 2 * u, S = Math.atan2(d.ny, d.nx) - Math.PI / 2 * u;
    o === 0 && r.moveTo(
      y + Math.cos(w) * g,
      b + Math.sin(w) * g
    ), r.arc(y, b, g, w, S, p), n = a;
  }
}
function Sl(r, t, e, s) {
  const i = (a, h) => Math.sqrt((a.x - h.x) ** 2 + (a.y - h.y) ** 2), n = (a, h, l) => ({
    x: a.x + (h.x - a.x) * l,
    y: a.y + (h.y - a.y) * l
  }), o = t.length;
  for (let a = 0; a < o; a++) {
    const h = t[(a + 1) % o], l = h.radius ?? e;
    if (l <= 0) {
      a === 0 ? r.moveTo(h.x, h.y) : r.lineTo(h.x, h.y);
      continue;
    }
    const c = t[a], d = t[(a + 2) % o], f = i(c, h);
    let u;
    if (f < 1e-4)
      u = h;
    else {
      const g = Math.min(f / 2, l);
      u = n(
        h,
        c,
        g / f
      );
    }
    const p = i(d, h);
    let m;
    if (p < 1e-4)
      m = h;
    else {
      const g = Math.min(p / 2, l);
      m = n(
        h,
        d,
        g / p
      );
    }
    a === 0 ? r.moveTo(u.x, u.y) : r.lineTo(u.x, u.y), r.quadraticCurveTo(h.x, h.y, m.x, m.y, s);
  }
}
const Cl = new j();
class Ml {
  constructor(t) {
    this.shapePrimitives = [], this._currentPoly = null, this._bounds = new ut(), this._graphicsPath2D = t, this.signed = t.checkForHoles;
  }
  /**
   * Sets the starting point for a new sub-path. Any subsequent drawing commands are considered part of this path.
   * @param x - The x-coordinate for the starting point.
   * @param y - The y-coordinate for the starting point.
   * @returns The instance of the current object for chaining.
   */
  moveTo(t, e) {
    return this.startPoly(t, e), this;
  }
  /**
   * Connects the current point to a new point with a straight line. This method updates the current path.
   * @param x - The x-coordinate of the new point to connect to.
   * @param y - The y-coordinate of the new point to connect to.
   * @returns The instance of the current object for chaining.
   */
  lineTo(t, e) {
    this._ensurePoly();
    const s = this._currentPoly.points, i = s[s.length - 2], n = s[s.length - 1];
    return (i !== t || n !== e) && s.push(t, e), this;
  }
  /**
   * Adds an arc to the path. The arc is centered at (x, y)
   *  position with radius `radius` starting at `startAngle` and ending at `endAngle`.
   * @param x - The x-coordinate of the arc's center.
   * @param y - The y-coordinate of the arc's center.
   * @param radius - The radius of the arc.
   * @param startAngle - The starting angle of the arc, in radians.
   * @param endAngle - The ending angle of the arc, in radians.
   * @param counterclockwise - Specifies whether the arc should be drawn in the anticlockwise direction. False by default.
   * @returns The instance of the current object for chaining.
   */
  arc(t, e, s, i, n, o) {
    this._ensurePoly(!1);
    const a = this._currentPoly.points;
    return Dn(a, t, e, s, i, n, o), this;
  }
  /**
   * Adds an arc to the path with the arc tangent to the line joining two specified points.
   * The arc radius is specified by `radius`.
   * @param x1 - The x-coordinate of the first point.
   * @param y1 - The y-coordinate of the first point.
   * @param x2 - The x-coordinate of the second point.
   * @param y2 - The y-coordinate of the second point.
   * @param radius - The radius of the arc.
   * @returns The instance of the current object for chaining.
   */
  arcTo(t, e, s, i, n) {
    this._ensurePoly();
    const o = this._currentPoly.points;
    return xl(o, t, e, s, i, n), this;
  }
  /**
   * Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
   * @param rx - The x-radius of the ellipse.
   * @param ry - The y-radius of the ellipse.
   * @param xAxisRotation - The rotation of the ellipse's x-axis relative
   * to the x-axis of the coordinate system, in degrees.
   * @param largeArcFlag - Determines if the arc should be greater than or less than 180 degrees.
   * @param sweepFlag - Determines if the arc should be swept in a positive angle direction.
   * @param x - The x-coordinate of the arc's end point.
   * @param y - The y-coordinate of the arc's end point.
   * @returns The instance of the current object for chaining.
   */
  arcToSvg(t, e, s, i, n, o, a) {
    const h = this._currentPoly.points;
    return _l(
      h,
      this._currentPoly.lastX,
      this._currentPoly.lastY,
      o,
      a,
      t,
      e,
      s,
      i,
      n
    ), this;
  }
  /**
   * Adds a cubic Bezier curve to the path.
   * It requires three points: the first two are control points and the third one is the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the first control point.
   * @param cp1y - The y-coordinate of the first control point.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  bezierCurveTo(t, e, s, i, n, o, a) {
    this._ensurePoly();
    const h = this._currentPoly;
    return Gn(
      this._currentPoly.points,
      h.lastX,
      h.lastY,
      t,
      e,
      s,
      i,
      n,
      o,
      a
    ), this;
  }
  /**
   * Adds a quadratic curve to the path. It requires two points: the control point and the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the control point.
   * @param cp1y - The y-coordinate of the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothing - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  quadraticCurveTo(t, e, s, i, n) {
    this._ensurePoly();
    const o = this._currentPoly;
    return ml(
      this._currentPoly.points,
      o.lastX,
      o.lastY,
      t,
      e,
      s,
      i,
      n
    ), this;
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    return this.endPoly(!0), this;
  }
  /**
   * Adds another path to the current path. This method allows for the combination of multiple paths into one.
   * @param path - The `GraphicsPath` object representing the path to add.
   * @param transform - An optional `Matrix` object to apply a transformation to the path before adding it.
   * @returns The instance of the current object for chaining.
   */
  addPath(t, e) {
    this.endPoly(), e && !e.isIdentity() && (t = t.clone(!0), t.transform(e));
    const s = this.shapePrimitives, i = s.length;
    for (let n = 0; n < t.instructions.length; n++) {
      const o = t.instructions[n];
      this[o.action](...o.data);
    }
    if (t.checkForHoles && s.length - i > 1) {
      let n = null;
      for (let o = i; o < s.length; o++) {
        const a = s[o];
        if (a.shape.type === "polygon") {
          const h = a.shape, l = n?.shape;
          l && l.containsPolygon(h) ? (n.holes || (n.holes = []), n.holes.push(a), s.copyWithin(o, o + 1), s.length--, o--) : n = a;
        }
      }
    }
    return this;
  }
  /**
   * Finalizes the drawing of the current path. Optionally, it can close the path.
   * @param closePath - A boolean indicating whether to close the path after finishing. False by default.
   */
  finish(t = !1) {
    this.endPoly(t);
  }
  /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */
  rect(t, e, s, i, n) {
    return this.drawShape(new j(t, e, s, i), n), this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(t, e, s, i) {
    return this.drawShape(new si(t, e, s), i), this;
  }
  /**
   * Draws a polygon shape. This method allows for the creation of complex polygons by specifying a sequence of points.
   * @param points - An array of numbers, or or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  poly(t, e, s) {
    const i = new pe(t);
    return i.closePath = e, this.drawShape(i, s), this;
  }
  /**
   * Draws a regular polygon with a specified number of sides. All sides and angles are equal.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  regularPoly(t, e, s, i, n = 0, o) {
    i = Math.max(i | 0, 3);
    const a = -1 * Math.PI / 2 + n, h = Math.PI * 2 / i, l = [];
    for (let c = 0; c < i; c++) {
      const d = a - c * h;
      l.push(
        t + s * Math.cos(d),
        e + s * Math.sin(d)
      );
    }
    return this.poly(l, !0, o), this;
  }
  /**
   * Draws a polygon with rounded corners.
   * Similar to `regularPoly` but with the ability to round the corners of the polygon.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param corner - The radius of the rounding of the corners.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param smoothness - Optional parameter to adjust the smoothness of the rounding.
   * @returns The instance of the current object for chaining.
   */
  roundPoly(t, e, s, i, n, o = 0, a) {
    if (i = Math.max(i | 0, 3), n <= 0)
      return this.regularPoly(t, e, s, i, o);
    const h = s * Math.sin(Math.PI / i) - 1e-3;
    n = Math.min(n, h);
    const l = -1 * Math.PI / 2 + o, c = Math.PI * 2 / i, d = (i - 2) * Math.PI / i / 2;
    for (let f = 0; f < i; f++) {
      const u = f * c + l, p = t + s * Math.cos(u), m = e + s * Math.sin(u), g = u + Math.PI + d, x = u - Math.PI - d, y = p + n * Math.cos(g), b = m + n * Math.sin(g), w = p + n * Math.cos(x), S = m + n * Math.sin(x);
      f === 0 ? this.moveTo(y, b) : this.lineTo(y, b), this.quadraticCurveTo(p, m, w, S, a);
    }
    return this.closePath();
  }
  /**
   * Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
   * Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.
   * @param points - An array of `RoundedPoint` representing the corners of the shape to draw.
   * A minimum of 3 points is required.
   * @param radius - The default radius for the corners.
   * This radius is applied to all corners unless overridden in `points`.
   * @param useQuadratic - If set to true, rounded corners are drawn using a quadraticCurve
   *  method instead of an arc method. Defaults to false.
   * @param smoothness - Specifies the smoothness of the curve when `useQuadratic` is true.
   * Higher values make the curve smoother.
   * @returns The instance of the current object for chaining.
   */
  roundShape(t, e, s = !1, i) {
    return t.length < 3 ? this : (s ? Sl(this, t, e, i) : vl(this, t, e), this.closePath());
  }
  /**
   * Draw Rectangle with fillet corners. This is much like rounded rectangle
   * however it support negative numbers as well for the corner radius.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param fillet - accept negative or positive values
   */
  filletRect(t, e, s, i, n) {
    if (n === 0)
      return this.rect(t, e, s, i);
    const o = Math.min(s, i) / 2, a = Math.min(o, Math.max(-o, n)), h = t + s, l = e + i, c = a < 0 ? -a : 0, d = Math.abs(a);
    return this.moveTo(t, e + d).arcTo(t + c, e + c, t + d, e, d).lineTo(h - d, e).arcTo(h - c, e + c, h, e + d, d).lineTo(h, l - d).arcTo(h - c, l - c, t + s - d, l, d).lineTo(t + d, l).arcTo(t + c, l - c, t, l - d, d).closePath();
  }
  /**
   * Draw Rectangle with chamfer corners. These are angled corners.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param chamfer - non-zero real number, size of corner cutout
   * @param transform
   */
  chamferRect(t, e, s, i, n, o) {
    if (n <= 0)
      return this.rect(t, e, s, i);
    const a = Math.min(n, Math.min(s, i) / 2), h = t + s, l = e + i, c = [
      t + a,
      e,
      h - a,
      e,
      h,
      e + a,
      h,
      l - a,
      h - a,
      l,
      t + a,
      l,
      t,
      l - a,
      t,
      e + a
    ];
    for (let d = c.length - 1; d >= 2; d -= 2)
      c[d] === c[d - 2] && c[d - 1] === c[d - 3] && c.splice(d - 1, 2);
    return this.poly(c, !0, o);
  }
  /**
   * Draws an ellipse at the specified location and with the given x and y radii.
   * An optional transformation can be applied, allowing for rotation, scaling, and translation.
   * @param x - The x-coordinate of the center of the ellipse.
   * @param y - The y-coordinate of the center of the ellipse.
   * @param radiusX - The horizontal radius of the ellipse.
   * @param radiusY - The vertical radius of the ellipse.
   * @param transform - An optional `Matrix` object to apply a transformation to the ellipse. This can include rotations.
   * @returns The instance of the current object for chaining.
   */
  ellipse(t, e, s, i, n) {
    return this.drawShape(new ii(t, e, s, i), n), this;
  }
  /**
   * Draws a rectangle with rounded corners.
   * The corner radius can be specified to determine how rounded the corners should be.
   * An optional transformation can be applied, which allows for rotation, scaling, and translation of the rectangle.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param radius - The radius of the rectangle's corners. If not specified, corners will be sharp.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */
  roundRect(t, e, s, i, n, o) {
    return this.drawShape(new ri(t, e, s, i, n), o), this;
  }
  /**
   * Draws a given shape on the canvas.
   * This is a generic method that can draw any type of shape specified by the `ShapePrimitive` parameter.
   * An optional transformation matrix can be applied to the shape, allowing for complex transformations.
   * @param shape - The shape to draw, defined as a `ShapePrimitive` object.
   * @param matrix - An optional `Matrix` for transforming the shape. This can include rotations,
   * scaling, and translations.
   * @returns The instance of the current object for chaining.
   */
  drawShape(t, e) {
    return this.endPoly(), this.shapePrimitives.push({ shape: t, transform: e }), this;
  }
  /**
   * Starts a new polygon path from the specified starting point.
   * This method initializes a new polygon or ends the current one if it exists.
   * @param x - The x-coordinate of the starting point of the new polygon.
   * @param y - The y-coordinate of the starting point of the new polygon.
   * @returns The instance of the current object for chaining.
   */
  startPoly(t, e) {
    let s = this._currentPoly;
    return s && this.endPoly(), s = new pe(), s.points.push(t, e), this._currentPoly = s, this;
  }
  /**
   * Ends the current polygon path. If `closePath` is set to true,
   * the path is closed by connecting the last point to the first one.
   * This method finalizes the current polygon and prepares it for drawing or adding to the shape primitives.
   * @param closePath - A boolean indicating whether to close the polygon by connecting the last point
   *  back to the starting point. False by default.
   * @returns The instance of the current object for chaining.
   */
  endPoly(t = !1) {
    const e = this._currentPoly;
    return e && e.points.length > 2 && (e.closePath = t, this.shapePrimitives.push({ shape: e })), this._currentPoly = null, this;
  }
  _ensurePoly(t = !0) {
    if (!this._currentPoly && (this._currentPoly = new pe(), t)) {
      const e = this.shapePrimitives[this.shapePrimitives.length - 1];
      if (e) {
        let s = e.shape.x, i = e.shape.y;
        if (e.transform && !e.transform.isIdentity()) {
          const n = e.transform, o = s;
          s = n.a * s + n.c * i + n.tx, i = n.b * o + n.d * i + n.ty;
        }
        this._currentPoly.points.push(s, i);
      } else
        this._currentPoly.points.push(0, 0);
    }
  }
  /** Builds the path. */
  buildPath() {
    const t = this._graphicsPath2D;
    this.shapePrimitives.length = 0, this._currentPoly = null;
    for (let e = 0; e < t.instructions.length; e++) {
      const s = t.instructions[e];
      this[s.action](...s.data);
    }
    this.finish();
  }
  /** Gets the bounds of the path. */
  get bounds() {
    const t = this._bounds;
    t.clear();
    const e = this.shapePrimitives;
    for (let s = 0; s < e.length; s++) {
      const i = e[s], n = i.shape.getBounds(Cl);
      i.transform ? t.addRect(n, i.transform) : t.addRect(n);
    }
    return t;
  }
}
class vt {
  /**
   * Creates a `GraphicsPath` instance optionally from an SVG path string or an array of `PathInstruction`.
   * @param instructions - An SVG path string or an array of `PathInstruction` objects.
   * @param signed
   */
  constructor(t, e = !1) {
    this.instructions = [], this.uid = U("graphicsPath"), this._dirty = !0, this.checkForHoles = e, typeof t == "string" ? ja(t, this) : this.instructions = t?.slice() ?? [];
  }
  /**
   * Provides access to the internal shape path, ensuring it is up-to-date with the current instructions.
   * @returns The `ShapePath` instance associated with this `GraphicsPath`.
   */
  get shapePath() {
    return this._shapePath || (this._shapePath = new Ml(this)), this._dirty && (this._dirty = !1, this._shapePath.buildPath()), this._shapePath;
  }
  /**
   * Adds another `GraphicsPath` to this path, optionally applying a transformation.
   * @param path - The `GraphicsPath` to add.
   * @param transform - An optional transformation to apply to the added path.
   * @returns The instance of the current object for chaining.
   */
  addPath(t, e) {
    return t = t.clone(), this.instructions.push({ action: "addPath", data: [t, e] }), this._dirty = !0, this;
  }
  arc(...t) {
    return this.instructions.push({ action: "arc", data: t }), this._dirty = !0, this;
  }
  arcTo(...t) {
    return this.instructions.push({ action: "arcTo", data: t }), this._dirty = !0, this;
  }
  arcToSvg(...t) {
    return this.instructions.push({ action: "arcToSvg", data: t }), this._dirty = !0, this;
  }
  bezierCurveTo(...t) {
    return this.instructions.push({ action: "bezierCurveTo", data: t }), this._dirty = !0, this;
  }
  /**
   * Adds a cubic Bezier curve to the path.
   * It requires two points: the second control point and the end point. The first control point is assumed to be
   * The starting point is the last point in the current path.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  bezierCurveToShort(t, e, s, i, n) {
    const o = this.instructions[this.instructions.length - 1], a = this.getLastPoint(C.shared);
    let h = 0, l = 0;
    if (!o || o.action !== "bezierCurveTo")
      h = a.x, l = a.y;
    else {
      h = o.data[2], l = o.data[3];
      const c = a.x, d = a.y;
      h = c + (c - h), l = d + (d - l);
    }
    return this.instructions.push({ action: "bezierCurveTo", data: [h, l, t, e, s, i, n] }), this._dirty = !0, this;
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    return this.instructions.push({ action: "closePath", data: [] }), this._dirty = !0, this;
  }
  ellipse(...t) {
    return this.instructions.push({ action: "ellipse", data: t }), this._dirty = !0, this;
  }
  lineTo(...t) {
    return this.instructions.push({ action: "lineTo", data: t }), this._dirty = !0, this;
  }
  moveTo(...t) {
    return this.instructions.push({ action: "moveTo", data: t }), this;
  }
  quadraticCurveTo(...t) {
    return this.instructions.push({ action: "quadraticCurveTo", data: t }), this._dirty = !0, this;
  }
  /**
   * Adds a quadratic curve to the path. It uses the previous point as the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  quadraticCurveToShort(t, e, s) {
    const i = this.instructions[this.instructions.length - 1], n = this.getLastPoint(C.shared);
    let o = 0, a = 0;
    if (!i || i.action !== "quadraticCurveTo")
      o = n.x, a = n.y;
    else {
      o = i.data[0], a = i.data[1];
      const h = n.x, l = n.y;
      o = h + (h - o), a = l + (l - a);
    }
    return this.instructions.push({ action: "quadraticCurveTo", data: [o, a, t, e, s] }), this._dirty = !0, this;
  }
  /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */
  rect(t, e, s, i, n) {
    return this.instructions.push({ action: "rect", data: [t, e, s, i, n] }), this._dirty = !0, this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(t, e, s, i) {
    return this.instructions.push({ action: "circle", data: [t, e, s, i] }), this._dirty = !0, this;
  }
  roundRect(...t) {
    return this.instructions.push({ action: "roundRect", data: t }), this._dirty = !0, this;
  }
  poly(...t) {
    return this.instructions.push({ action: "poly", data: t }), this._dirty = !0, this;
  }
  regularPoly(...t) {
    return this.instructions.push({ action: "regularPoly", data: t }), this._dirty = !0, this;
  }
  roundPoly(...t) {
    return this.instructions.push({ action: "roundPoly", data: t }), this._dirty = !0, this;
  }
  roundShape(...t) {
    return this.instructions.push({ action: "roundShape", data: t }), this._dirty = !0, this;
  }
  filletRect(...t) {
    return this.instructions.push({ action: "filletRect", data: t }), this._dirty = !0, this;
  }
  chamferRect(...t) {
    return this.instructions.push({ action: "chamferRect", data: t }), this._dirty = !0, this;
  }
  /**
   * Draws a star shape centered at a specified location. This method allows for the creation
   *  of stars with a variable number of points, outer radius, optional inner radius, and rotation.
   * The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
   * An optional transformation can be applied to scale, rotate, or translate the star as needed.
   * @param x - The x-coordinate of the center of the star.
   * @param y - The y-coordinate of the center of the star.
   * @param points - The number of points of the star.
   * @param radius - The outer radius of the star (distance from the center to the outer points).
   * @param innerRadius - Optional. The inner radius of the star
   * (distance from the center to the inner points between the outer points).
   * If not provided, defaults to half of the `radius`.
   * @param rotation - Optional. The rotation of the star in radians, where 0 is aligned with the y-axis.
   * Defaults to 0, meaning one point is directly upward.
   * @param transform - An optional `Matrix` object to apply a transformation to the star.
   * This can include rotations, scaling, and translations.
   * @returns The instance of the current object for chaining further drawing commands.
   */
  // eslint-disable-next-line max-len
  star(t, e, s, i, n, o, a) {
    n || (n = i / 2);
    const h = -1 * Math.PI / 2 + o, l = s * 2, c = Math.PI * 2 / l, d = [];
    for (let f = 0; f < l; f++) {
      const u = f % 2 ? n : i, p = f * c + h;
      d.push(
        t + u * Math.cos(p),
        e + u * Math.sin(p)
      );
    }
    return this.poly(d, !0, a), this;
  }
  /**
   * Creates a copy of the current `GraphicsPath` instance. This method supports both shallow and deep cloning.
   * A shallow clone copies the reference of the instructions array, while a deep clone creates a new array and
   * copies each instruction individually, ensuring that modifications to the instructions of the cloned `GraphicsPath`
   * do not affect the original `GraphicsPath` and vice versa.
   * @param deep - A boolean flag indicating whether the clone should be deep.
   * @returns A new `GraphicsPath` instance that is a clone of the current instance.
   */
  clone(t = !1) {
    const e = new vt();
    if (e.checkForHoles = this.checkForHoles, !t)
      e.instructions = this.instructions.slice();
    else
      for (let s = 0; s < this.instructions.length; s++) {
        const i = this.instructions[s];
        e.instructions.push({ action: i.action, data: i.data.slice() });
      }
    return e;
  }
  clear() {
    return this.instructions.length = 0, this._dirty = !0, this;
  }
  /**
   * Applies a transformation matrix to all drawing instructions within the `GraphicsPath`.
   * This method enables the modification of the path's geometry according to the provided
   * transformation matrix, which can include translations, rotations, scaling, and skewing.
   *
   * Each drawing instruction in the path is updated to reflect the transformation,
   * ensuring the visual representation of the path is consistent with the applied matrix.
   *
   * Note: The transformation is applied directly to the coordinates and control points of the drawing instructions,
   * not to the path as a whole. This means the transformation's effects are baked into the individual instructions,
   * allowing for fine-grained control over the path's appearance.
   * @param matrix - A `Matrix` object representing the transformation to apply.
   * @returns The instance of the current object for chaining further operations.
   */
  transform(t) {
    if (t.isIdentity())
      return this;
    const e = t.a, s = t.b, i = t.c, n = t.d, o = t.tx, a = t.ty;
    let h = 0, l = 0, c = 0, d = 0, f = 0, u = 0, p = 0, m = 0;
    for (let g = 0; g < this.instructions.length; g++) {
      const x = this.instructions[g], y = x.data;
      switch (x.action) {
        case "moveTo":
        case "lineTo":
          h = y[0], l = y[1], y[0] = e * h + i * l + o, y[1] = s * h + n * l + a;
          break;
        case "bezierCurveTo":
          c = y[0], d = y[1], f = y[2], u = y[3], h = y[4], l = y[5], y[0] = e * c + i * d + o, y[1] = s * c + n * d + a, y[2] = e * f + i * u + o, y[3] = s * f + n * u + a, y[4] = e * h + i * l + o, y[5] = s * h + n * l + a;
          break;
        case "quadraticCurveTo":
          c = y[0], d = y[1], h = y[2], l = y[3], y[0] = e * c + i * d + o, y[1] = s * c + n * d + a, y[2] = e * h + i * l + o, y[3] = s * h + n * l + a;
          break;
        case "arcToSvg":
          h = y[5], l = y[6], p = y[0], m = y[1], y[0] = e * p + i * m, y[1] = s * p + n * m, y[5] = e * h + i * l + o, y[6] = s * h + n * l + a;
          break;
        case "circle":
          y[4] = he(y[3], t);
          break;
        case "rect":
          y[4] = he(y[4], t);
          break;
        case "ellipse":
          y[8] = he(y[8], t);
          break;
        case "roundRect":
          y[5] = he(y[5], t);
          break;
        case "addPath":
          y[0].transform(t);
          break;
        case "poly":
          y[2] = he(y[2], t);
          break;
        default:
          J("unknown transform action", x.action);
          break;
      }
    }
    return this._dirty = !0, this;
  }
  get bounds() {
    return this.shapePath.bounds;
  }
  /**
   * Retrieves the last point from the current drawing instructions in the `GraphicsPath`.
   * This method is useful for operations that depend on the path's current endpoint,
   * such as connecting subsequent shapes or paths. It supports various drawing instructions,
   * ensuring the last point's position is accurately determined regardless of the path's complexity.
   *
   * If the last instruction is a `closePath`, the method iterates backward through the instructions
   *  until it finds an actionable instruction that defines a point (e.g., `moveTo`, `lineTo`,
   * `quadraticCurveTo`, etc.). For compound paths added via `addPath`, it recursively retrieves
   * the last point from the nested path.
   * @param out - A `Point` object where the last point's coordinates will be stored.
   * This object is modified directly to contain the result.
   * @returns The `Point` object containing the last point's coordinates.
   */
  getLastPoint(t) {
    let e = this.instructions.length - 1, s = this.instructions[e];
    if (!s)
      return t.x = 0, t.y = 0, t;
    for (; s.action === "closePath"; ) {
      if (e--, e < 0)
        return t.x = 0, t.y = 0, t;
      s = this.instructions[e];
    }
    switch (s.action) {
      case "moveTo":
      case "lineTo":
        t.x = s.data[0], t.y = s.data[1];
        break;
      case "quadraticCurveTo":
        t.x = s.data[2], t.y = s.data[3];
        break;
      case "bezierCurveTo":
        t.x = s.data[4], t.y = s.data[5];
        break;
      case "arc":
      case "arcToSvg":
        t.x = s.data[5], t.y = s.data[6];
        break;
      case "addPath":
        s.data[0].getLastPoint(t);
        break;
    }
    return t;
  }
}
function he(r, t) {
  return r ? r.prepend(t) : t.clone();
}
function O(r, t, e) {
  const s = r.getAttribute(t);
  return s ? Number(s) : e;
}
function Pl(r, t) {
  const e = r.querySelectorAll("defs");
  for (let s = 0; s < e.length; s++) {
    const i = e[s];
    for (let n = 0; n < i.children.length; n++) {
      const o = i.children[n];
      switch (o.nodeName.toLowerCase()) {
        case "lineargradient":
          t.defs[o.id] = kl(o);
          break;
        case "radialgradient":
          t.defs[o.id] = Tl();
          break;
      }
    }
  }
}
function kl(r) {
  const t = O(r, "x1", 0), e = O(r, "y1", 0), s = O(r, "x2", 1), i = O(r, "y2", 0), n = r.getAttribute("gradientUnits") || "objectBoundingBox", o = new St(
    t,
    e,
    s,
    i,
    n === "objectBoundingBox" ? "local" : "global"
  );
  for (let a = 0; a < r.children.length; a++) {
    const h = r.children[a], l = O(h, "offset", 0), c = V.shared.setValue(h.getAttribute("stop-color")).toNumber();
    o.addColorStop(l, c);
  }
  return o;
}
function Tl(r) {
  return J("[SVG Parser] Radial gradients are not yet supported"), new St(0, 0, 1, 0);
}
function ar(r) {
  const t = r.match(/url\s*\(\s*['"]?\s*#([^'"\s)]+)\s*['"]?\s*\)/i);
  return t ? t[1] : "";
}
const hr = {
  // Fill properties
  fill: { type: "paint", default: 0 },
  // Fill color/gradient
  "fill-opacity": { type: "number", default: 1 },
  // Fill transparency
  // Stroke properties
  stroke: { type: "paint", default: 0 },
  // Stroke color/gradient
  "stroke-width": { type: "number", default: 1 },
  // Width of stroke
  "stroke-opacity": { type: "number", default: 1 },
  // Stroke transparency
  "stroke-linecap": { type: "string", default: "butt" },
  // End cap style: butt, round, square
  "stroke-linejoin": { type: "string", default: "miter" },
  // Join style: miter, round, bevel
  "stroke-miterlimit": { type: "number", default: 10 },
  // Limit on miter join sharpness
  "stroke-dasharray": { type: "string", default: "none" },
  // Dash pattern
  "stroke-dashoffset": { type: "number", default: 0 },
  // Offset for dash pattern
  // Global properties
  opacity: { type: "number", default: 1 }
  // Overall opacity
};
function zn(r, t) {
  const e = r.getAttribute("style"), s = {}, i = {}, n = {
    strokeStyle: s,
    fillStyle: i,
    useFill: !1,
    useStroke: !1
  };
  for (const o in hr) {
    const a = r.getAttribute(o);
    a && lr(t, n, o, a.trim());
  }
  if (e) {
    const o = e.split(";");
    for (let a = 0; a < o.length; a++) {
      const h = o[a].trim(), [l, c] = h.split(":");
      hr[l] && lr(t, n, l, c.trim());
    }
  }
  return {
    strokeStyle: n.useStroke ? s : null,
    fillStyle: n.useFill ? i : null,
    useFill: n.useFill,
    useStroke: n.useStroke
  };
}
function lr(r, t, e, s) {
  switch (e) {
    case "stroke":
      if (s !== "none") {
        if (s.startsWith("url(")) {
          const i = ar(s);
          t.strokeStyle.fill = r.defs[i];
        } else
          t.strokeStyle.color = V.shared.setValue(s).toNumber();
        t.useStroke = !0;
      }
      break;
    case "stroke-width":
      t.strokeStyle.width = Number(s);
      break;
    case "fill":
      if (s !== "none") {
        if (s.startsWith("url(")) {
          const i = ar(s);
          t.fillStyle.fill = r.defs[i];
        } else
          t.fillStyle.color = V.shared.setValue(s).toNumber();
        t.useFill = !0;
      }
      break;
    case "fill-opacity":
      t.fillStyle.alpha = Number(s);
      break;
    case "stroke-opacity":
      t.strokeStyle.alpha = Number(s);
      break;
    case "opacity":
      t.fillStyle.alpha = Number(s), t.strokeStyle.alpha = Number(s);
      break;
  }
}
function Al(r) {
  if (r.length <= 2)
    return !0;
  const t = r.map((a) => a.area).sort((a, h) => h - a), [e, s] = t, i = t[t.length - 1], n = e / s, o = s / i;
  return !(n > 3 && o < 2);
}
function Il(r) {
  return r.split(/(?=[Mm])/).filter((s) => s.trim().length > 0);
}
function El(r) {
  const t = r.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!t || t.length < 4)
    return 0;
  const e = t.map(Number), s = [], i = [];
  for (let c = 0; c < e.length; c += 2)
    c + 1 < e.length && (s.push(e[c]), i.push(e[c + 1]));
  if (s.length === 0 || i.length === 0)
    return 0;
  const n = Math.min(...s), o = Math.max(...s), a = Math.min(...i), h = Math.max(...i);
  return (o - n) * (h - a);
}
function cr(r, t) {
  const e = new vt(r, !1);
  for (const s of e.instructions)
    t.instructions.push(s);
}
function Rl(r, t) {
  if (typeof r == "string") {
    const o = document.createElement("div");
    o.innerHTML = r.trim(), r = o.querySelector("svg");
  }
  const e = {
    context: t,
    defs: {},
    path: new vt()
  };
  Pl(r, e);
  const s = r.children, { fillStyle: i, strokeStyle: n } = zn(r, e);
  for (let o = 0; o < s.length; o++) {
    const a = s[o];
    a.nodeName.toLowerCase() !== "defs" && Yn(a, e, i, n);
  }
  return t;
}
function Yn(r, t, e, s) {
  const i = r.children, { fillStyle: n, strokeStyle: o } = zn(r, t);
  n && e ? e = { ...e, ...n } : n && (e = n), o && s ? s = { ...s, ...o } : o && (s = o);
  const a = !e && !s;
  a && (e = { color: 0 });
  let h, l, c, d, f, u, p, m, g, x, y, b, w, S, _, v, T;
  switch (r.nodeName.toLowerCase()) {
    case "path": {
      S = r.getAttribute("d");
      const k = r.getAttribute("fill-rule"), P = Il(S), M = k === "evenodd", R = P.length > 1;
      if (M && R) {
        const X = P.map((A) => ({
          path: A,
          area: El(A)
        }));
        if (X.sort((A, E) => E.area - A.area), P.length > 3 || !Al(X))
          for (let A = 0; A < X.length; A++) {
            const E = X[A], kt = A === 0;
            t.context.beginPath();
            const N = new vt(void 0, !0);
            cr(E.path, N), t.context.path(N), kt ? (e && t.context.fill(e), s && t.context.stroke(s)) : t.context.cut();
          }
        else
          for (let A = 0; A < X.length; A++) {
            const E = X[A], kt = A % 2 === 1;
            t.context.beginPath();
            const N = new vt(void 0, !0);
            cr(E.path, N), t.context.path(N), kt ? t.context.cut() : (e && t.context.fill(e), s && t.context.stroke(s));
          }
      } else {
        const X = k ? k === "evenodd" : !0;
        _ = new vt(S, X), t.context.path(_), e && t.context.fill(e), s && t.context.stroke(s);
      }
      break;
    }
    case "circle":
      p = O(r, "cx", 0), m = O(r, "cy", 0), g = O(r, "r", 0), t.context.ellipse(p, m, g, g), e && t.context.fill(e), s && t.context.stroke(s);
      break;
    case "rect":
      h = O(r, "x", 0), l = O(r, "y", 0), v = O(r, "width", 0), T = O(r, "height", 0), x = O(r, "rx", 0), y = O(r, "ry", 0), x || y ? t.context.roundRect(h, l, v, T, x || y) : t.context.rect(h, l, v, T), e && t.context.fill(e), s && t.context.stroke(s);
      break;
    case "ellipse":
      p = O(r, "cx", 0), m = O(r, "cy", 0), x = O(r, "rx", 0), y = O(r, "ry", 0), t.context.beginPath(), t.context.ellipse(p, m, x, y), e && t.context.fill(e), s && t.context.stroke(s);
      break;
    case "line":
      c = O(r, "x1", 0), d = O(r, "y1", 0), f = O(r, "x2", 0), u = O(r, "y2", 0), t.context.beginPath(), t.context.moveTo(c, d), t.context.lineTo(f, u), s && t.context.stroke(s);
      break;
    case "polygon":
      w = r.getAttribute("points"), b = w.match(/-?\d+/g).map((k) => parseInt(k, 10)), t.context.poly(b, !0), e && t.context.fill(e), s && t.context.stroke(s);
      break;
    case "polyline":
      w = r.getAttribute("points"), b = w.match(/-?\d+/g).map((k) => parseInt(k, 10)), t.context.poly(b, !1), s && t.context.stroke(s);
      break;
    case "g":
    case "svg":
      break;
    default: {
      J(`[SVG parser] <${r.nodeName}> elements unsupported`);
      break;
    }
  }
  a && (e = null);
  for (let k = 0; k < i.length; k++)
    Yn(i[k], t, e, s);
}
function Ll(r) {
  return V.isColorLike(r);
}
function dr(r) {
  return r instanceof es;
}
function ur(r) {
  return r instanceof St;
}
function Fl(r) {
  return r instanceof D;
}
function Nl(r, t, e) {
  const s = V.shared.setValue(t ?? 0);
  return r.color = s.toNumber(), r.alpha = s.alpha === 1 ? e.alpha : s.alpha, r.texture = D.WHITE, { ...e, ...r };
}
function Bl(r, t, e) {
  return r.texture = t, { ...e, ...r };
}
function fr(r, t, e) {
  return r.fill = t, r.color = 16777215, r.texture = t.texture, r.matrix = t.transform, { ...e, ...r };
}
function pr(r, t, e) {
  return t.buildGradient(), r.fill = t, r.color = 16777215, r.texture = t.texture, r.matrix = t.transform, r.textureSpace = t.textureSpace, { ...e, ...r };
}
function Gl(r, t) {
  const e = { ...t, ...r }, s = V.shared.setValue(e.color);
  return e.alpha *= s.alpha, e.color = s.toNumber(), e;
}
function Yt(r, t) {
  if (r == null)
    return null;
  const e = {}, s = r;
  return Ll(r) ? Nl(e, r, t) : Fl(r) ? Bl(e, r, t) : dr(r) ? fr(e, r, t) : ur(r) ? pr(e, r, t) : s.fill && dr(s.fill) ? fr(s, s.fill, t) : s.fill && ur(s.fill) ? pr(s, s.fill, t) : Gl(s, t);
}
function Ze(r, t) {
  const { width: e, alignment: s, miterLimit: i, cap: n, join: o, pixelLine: a, ...h } = t, l = Yt(r, h);
  return l ? {
    width: e,
    alignment: s,
    miterLimit: i,
    cap: n,
    join: o,
    pixelLine: a,
    ...l
  } : null;
}
const Dl = new C(), gr = new F(), oi = class mt extends xt {
  constructor() {
    super(...arguments), this._gpuData = /* @__PURE__ */ Object.create(null), this.autoGarbageCollect = !0, this._gcLastUsed = -1, this.uid = U("graphicsContext"), this.dirty = !0, this.batchMode = "auto", this.instructions = [], this.destroyed = !1, this._activePath = new vt(), this._transform = new F(), this._fillStyle = { ...mt.defaultFillStyle }, this._strokeStyle = { ...mt.defaultStrokeStyle }, this._stateStack = [], this._tick = 0, this._bounds = new ut(), this._boundsDirty = !0;
  }
  /**
   * Creates a new GraphicsContext object that is a clone of this instance, copying all properties,
   * including the current drawing state, transformations, styles, and instructions.
   * @returns A new GraphicsContext instance with the same properties and state as this one.
   */
  clone() {
    const t = new mt();
    return t.batchMode = this.batchMode, t.instructions = this.instructions.slice(), t._activePath = this._activePath.clone(), t._transform = this._transform.clone(), t._fillStyle = { ...this._fillStyle }, t._strokeStyle = { ...this._strokeStyle }, t._stateStack = this._stateStack.slice(), t._bounds = this._bounds.clone(), t._boundsDirty = !0, t;
  }
  /**
   * The current fill style of the graphics context. This can be a color, gradient, pattern, or a more complex style defined by a FillStyle object.
   */
  get fillStyle() {
    return this._fillStyle;
  }
  set fillStyle(t) {
    this._fillStyle = Yt(t, mt.defaultFillStyle);
  }
  /**
   * The current stroke style of the graphics context. Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   */
  get strokeStyle() {
    return this._strokeStyle;
  }
  set strokeStyle(t) {
    this._strokeStyle = Ze(t, mt.defaultStrokeStyle);
  }
  /**
   * Sets the current fill style of the graphics context. The fill style can be a color, gradient,
   * pattern, or a more complex style defined by a FillStyle object.
   * @param style - The fill style to apply. This can be a simple color, a gradient or pattern object,
   *                or a FillStyle or ConvertedFillStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setFillStyle(t) {
    return this._fillStyle = Yt(t, mt.defaultFillStyle), this;
  }
  /**
   * Sets the current stroke style of the graphics context. Similar to fill styles, stroke styles can
   * encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   * @param style - The stroke style to apply. Can be defined as a color, a gradient or pattern,
   *                or a StrokeStyle or ConvertedStrokeStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setStrokeStyle(t) {
    return this._strokeStyle = Yt(t, mt.defaultStrokeStyle), this;
  }
  texture(t, e, s, i, n, o) {
    return this.instructions.push({
      action: "texture",
      data: {
        image: t,
        dx: s || 0,
        dy: i || 0,
        dw: n || t.frame.width,
        dh: o || t.frame.height,
        transform: this._transform.clone(),
        alpha: this._fillStyle.alpha,
        style: e ? V.shared.setValue(e).toNumber() : 16777215
      }
    }), this.onUpdate(), this;
  }
  /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  beginPath() {
    return this._activePath = new vt(), this;
  }
  fill(t, e) {
    let s;
    const i = this.instructions[this.instructions.length - 1];
    return this._tick === 0 && i?.action === "stroke" ? s = i.data.path : s = this._activePath.clone(), s ? (t != null && (e !== void 0 && typeof t == "number" && (B(W, "GraphicsContext.fill(color, alpha) is deprecated, use GraphicsContext.fill({ color, alpha }) instead"), t = { color: t, alpha: e }), this._fillStyle = Yt(t, mt.defaultFillStyle)), this.instructions.push({
      action: "fill",
      // TODO copy fill style!
      data: { style: this.fillStyle, path: s }
    }), this.onUpdate(), this._initNextPathLocation(), this._tick = 0, this) : this;
  }
  _initNextPathLocation() {
    const { x: t, y: e } = this._activePath.getLastPoint(C.shared);
    this._activePath.clear(), this._activePath.moveTo(t, e);
  }
  /**
   * Strokes the current path with the current stroke style. This method can take an optional
   * FillInput parameter to define the stroke's appearance, including its color, width, and other properties.
   * @param style - (Optional) The stroke style to apply. Can be defined as a simple color or a more complex style object. If omitted, uses the current stroke style.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  stroke(t) {
    let e;
    const s = this.instructions[this.instructions.length - 1];
    return this._tick === 0 && s?.action === "fill" ? e = s.data.path : e = this._activePath.clone(), e ? (t != null && (this._strokeStyle = Ze(t, mt.defaultStrokeStyle)), this.instructions.push({
      action: "stroke",
      // TODO copy fill style!
      data: { style: this.strokeStyle, path: e }
    }), this.onUpdate(), this._initNextPathLocation(), this._tick = 0, this) : this;
  }
  /**
   * Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
   * subtracting a path from the previously drawn path. If a hole is not completely in a shape, it will
   * fail to cut correctly!
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  cut() {
    for (let t = 0; t < 2; t++) {
      const e = this.instructions[this.instructions.length - 1 - t], s = this._activePath.clone();
      if (e && (e.action === "stroke" || e.action === "fill"))
        if (e.data.hole)
          e.data.hole.addPath(s);
        else {
          e.data.hole = s;
          break;
        }
    }
    return this._initNextPathLocation(), this;
  }
  /**
   * Adds an arc to the current path, which is centered at (x, y) with the specified radius,
   * starting and ending angles, and direction.
   * @param x - The x-coordinate of the arc's center.
   * @param y - The y-coordinate of the arc's center.
   * @param radius - The arc's radius.
   * @param startAngle - The starting angle, in radians.
   * @param endAngle - The ending angle, in radians.
   * @param counterclockwise - (Optional) Specifies whether the arc is drawn counterclockwise (true) or clockwise (false). Defaults to false.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  arc(t, e, s, i, n, o) {
    this._tick++;
    const a = this._transform;
    return this._activePath.arc(
      a.a * t + a.c * e + a.tx,
      a.b * t + a.d * e + a.ty,
      s,
      i,
      n,
      o
    ), this;
  }
  /**
   * Adds an arc to the current path with the given control points and radius, connected to the previous point
   * by a straight line if necessary.
   * @param x1 - The x-coordinate of the first control point.
   * @param y1 - The y-coordinate of the first control point.
   * @param x2 - The x-coordinate of the second control point.
   * @param y2 - The y-coordinate of the second control point.
   * @param radius - The arc's radius.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  arcTo(t, e, s, i, n) {
    this._tick++;
    const o = this._transform;
    return this._activePath.arcTo(
      o.a * t + o.c * e + o.tx,
      o.b * t + o.d * e + o.ty,
      o.a * s + o.c * i + o.tx,
      o.b * s + o.d * i + o.ty,
      n
    ), this;
  }
  /**
   * Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
   * @param rx - The x-radius of the ellipse.
   * @param ry - The y-radius of the ellipse.
   * @param xAxisRotation - The rotation of the ellipse's x-axis relative
   * to the x-axis of the coordinate system, in degrees.
   * @param largeArcFlag - Determines if the arc should be greater than or less than 180 degrees.
   * @param sweepFlag - Determines if the arc should be swept in a positive angle direction.
   * @param x - The x-coordinate of the arc's end point.
   * @param y - The y-coordinate of the arc's end point.
   * @returns The instance of the current object for chaining.
   */
  arcToSvg(t, e, s, i, n, o, a) {
    this._tick++;
    const h = this._transform;
    return this._activePath.arcToSvg(
      t,
      e,
      s,
      // should we rotate this with transform??
      i,
      n,
      h.a * o + h.c * a + h.tx,
      h.b * o + h.d * a + h.ty
    ), this;
  }
  /**
   * Adds a cubic Bezier curve to the path.
   * It requires three points: the first two are control points and the third one is the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the first control point.
   * @param cp1y - The y-coordinate of the first control point.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  bezierCurveTo(t, e, s, i, n, o, a) {
    this._tick++;
    const h = this._transform;
    return this._activePath.bezierCurveTo(
      h.a * t + h.c * e + h.tx,
      h.b * t + h.d * e + h.ty,
      h.a * s + h.c * i + h.tx,
      h.b * s + h.d * i + h.ty,
      h.a * n + h.c * o + h.tx,
      h.b * n + h.d * o + h.ty,
      a
    ), this;
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    return this._tick++, this._activePath?.closePath(), this;
  }
  /**
   * Draws an ellipse at the specified location and with the given x and y radii.
   * An optional transformation can be applied, allowing for rotation, scaling, and translation.
   * @param x - The x-coordinate of the center of the ellipse.
   * @param y - The y-coordinate of the center of the ellipse.
   * @param radiusX - The horizontal radius of the ellipse.
   * @param radiusY - The vertical radius of the ellipse.
   * @returns The instance of the current object for chaining.
   */
  ellipse(t, e, s, i) {
    return this._tick++, this._activePath.ellipse(t, e, s, i, this._transform.clone()), this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(t, e, s) {
    return this._tick++, this._activePath.circle(t, e, s, this._transform.clone()), this;
  }
  /**
   * Adds another `GraphicsPath` to this path, optionally applying a transformation.
   * @param path - The `GraphicsPath` to add.
   * @returns The instance of the current object for chaining.
   */
  path(t) {
    return this._tick++, this._activePath.addPath(t, this._transform.clone()), this;
  }
  /**
   * Connects the current point to a new point with a straight line. This method updates the current path.
   * @param x - The x-coordinate of the new point to connect to.
   * @param y - The y-coordinate of the new point to connect to.
   * @returns The instance of the current object for chaining.
   */
  lineTo(t, e) {
    this._tick++;
    const s = this._transform;
    return this._activePath.lineTo(
      s.a * t + s.c * e + s.tx,
      s.b * t + s.d * e + s.ty
    ), this;
  }
  /**
   * Sets the starting point for a new sub-path. Any subsequent drawing commands are considered part of this path.
   * @param x - The x-coordinate for the starting point.
   * @param y - The y-coordinate for the starting point.
   * @returns The instance of the current object for chaining.
   */
  moveTo(t, e) {
    this._tick++;
    const s = this._transform, i = this._activePath.instructions, n = s.a * t + s.c * e + s.tx, o = s.b * t + s.d * e + s.ty;
    return i.length === 1 && i[0].action === "moveTo" ? (i[0].data[0] = n, i[0].data[1] = o, this) : (this._activePath.moveTo(
      n,
      o
    ), this);
  }
  /**
   * Adds a quadratic curve to the path. It requires two points: the control point and the end point.
   * The starting point is the last point in the current path.
   * @param cpx - The x-coordinate of the control point.
   * @param cpy - The y-coordinate of the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  quadraticCurveTo(t, e, s, i, n) {
    this._tick++;
    const o = this._transform;
    return this._activePath.quadraticCurveTo(
      o.a * t + o.c * e + o.tx,
      o.b * t + o.d * e + o.ty,
      o.a * s + o.c * i + o.tx,
      o.b * s + o.d * i + o.ty,
      n
    ), this;
  }
  /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @returns The instance of the current object for chaining.
   */
  rect(t, e, s, i) {
    return this._tick++, this._activePath.rect(t, e, s, i, this._transform.clone()), this;
  }
  /**
   * Draws a rectangle with rounded corners.
   * The corner radius can be specified to determine how rounded the corners should be.
   * An optional transformation can be applied, which allows for rotation, scaling, and translation of the rectangle.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param radius - The radius of the rectangle's corners. If not specified, corners will be sharp.
   * @returns The instance of the current object for chaining.
   */
  roundRect(t, e, s, i, n) {
    return this._tick++, this._activePath.roundRect(t, e, s, i, n, this._transform.clone()), this;
  }
  /**
   * Draws a polygon shape by specifying a sequence of points. This method allows for the creation of complex polygons,
   * which can be both open and closed. An optional transformation can be applied, enabling the polygon to be scaled,
   * rotated, or translated as needed.
   * @param points - An array of numbers, or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates, of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   */
  poly(t, e) {
    return this._tick++, this._activePath.poly(t, e, this._transform.clone()), this;
  }
  /**
   * Draws a regular polygon with a specified number of sides. All sides and angles are equal.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  regularPoly(t, e, s, i, n = 0, o) {
    return this._tick++, this._activePath.regularPoly(t, e, s, i, n, o), this;
  }
  /**
   * Draws a polygon with rounded corners.
   * Similar to `regularPoly` but with the ability to round the corners of the polygon.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param corner - The radius of the rounding of the corners.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @returns The instance of the current object for chaining.
   */
  roundPoly(t, e, s, i, n, o) {
    return this._tick++, this._activePath.roundPoly(t, e, s, i, n, o), this;
  }
  /**
   * Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
   * Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.
   * @param points - An array of `RoundedPoint` representing the corners of the shape to draw.
   * A minimum of 3 points is required.
   * @param radius - The default radius for the corners.
   * This radius is applied to all corners unless overridden in `points`.
   * @param useQuadratic - If set to true, rounded corners are drawn using a quadraticCurve
   *  method instead of an arc method. Defaults to false.
   * @param smoothness - Specifies the smoothness of the curve when `useQuadratic` is true.
   * Higher values make the curve smoother.
   * @returns The instance of the current object for chaining.
   */
  roundShape(t, e, s, i) {
    return this._tick++, this._activePath.roundShape(t, e, s, i), this;
  }
  /**
   * Draw Rectangle with fillet corners. This is much like rounded rectangle
   * however it support negative numbers as well for the corner radius.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param fillet - accept negative or positive values
   */
  filletRect(t, e, s, i, n) {
    return this._tick++, this._activePath.filletRect(t, e, s, i, n), this;
  }
  /**
   * Draw Rectangle with chamfer corners. These are angled corners.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param chamfer - non-zero real number, size of corner cutout
   * @param transform
   */
  chamferRect(t, e, s, i, n, o) {
    return this._tick++, this._activePath.chamferRect(t, e, s, i, n, o), this;
  }
  /**
   * Draws a star shape centered at a specified location. This method allows for the creation
   *  of stars with a variable number of points, outer radius, optional inner radius, and rotation.
   * The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
   * An optional transformation can be applied to scale, rotate, or translate the star as needed.
   * @param x - The x-coordinate of the center of the star.
   * @param y - The y-coordinate of the center of the star.
   * @param points - The number of points of the star.
   * @param radius - The outer radius of the star (distance from the center to the outer points).
   * @param innerRadius - Optional. The inner radius of the star
   * (distance from the center to the inner points between the outer points).
   * If not provided, defaults to half of the `radius`.
   * @param rotation - Optional. The rotation of the star in radians, where 0 is aligned with the y-axis.
   * Defaults to 0, meaning one point is directly upward.
   * @returns The instance of the current object for chaining further drawing commands.
   */
  star(t, e, s, i, n = 0, o = 0) {
    return this._tick++, this._activePath.star(t, e, s, i, n, o, this._transform.clone()), this;
  }
  /**
   * Parses and renders an SVG string into the graphics context. This allows for complex shapes and paths
   * defined in SVG format to be drawn within the graphics context.
   * @param svg - The SVG string to be parsed and rendered.
   */
  svg(t) {
    return this._tick++, Rl(t, this), this;
  }
  /**
   * Restores the most recently saved graphics state by popping the top of the graphics state stack.
   * This includes transformations, fill styles, and stroke styles.
   */
  restore() {
    const t = this._stateStack.pop();
    return t && (this._transform = t.transform, this._fillStyle = t.fillStyle, this._strokeStyle = t.strokeStyle), this;
  }
  /** Saves the current graphics state, including transformations, fill styles, and stroke styles, onto a stack. */
  save() {
    return this._stateStack.push({
      transform: this._transform.clone(),
      fillStyle: { ...this._fillStyle },
      strokeStyle: { ...this._strokeStyle }
    }), this;
  }
  /**
   * Returns the current transformation matrix of the graphics context.
   * @returns The current transformation matrix.
   */
  getTransform() {
    return this._transform;
  }
  /**
   * Resets the current transformation matrix to the identity matrix, effectively removing any transformations (rotation, scaling, translation) previously applied.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  resetTransform() {
    return this._transform.identity(), this;
  }
  /**
   * Applies a rotation transformation to the graphics context around the current origin.
   * @param angle - The angle of rotation in radians.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  rotate(t) {
    return this._transform.rotate(t), this;
  }
  /**
   * Applies a scaling transformation to the graphics context, scaling drawings by x horizontally and by y vertically.
   * @param x - The scale factor in the horizontal direction.
   * @param y - (Optional) The scale factor in the vertical direction. If not specified, the x value is used for both directions.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  scale(t, e = t) {
    return this._transform.scale(t, e), this;
  }
  setTransform(t, e, s, i, n, o) {
    return t instanceof F ? (this._transform.set(t.a, t.b, t.c, t.d, t.tx, t.ty), this) : (this._transform.set(t, e, s, i, n, o), this);
  }
  transform(t, e, s, i, n, o) {
    return t instanceof F ? (this._transform.append(t), this) : (gr.set(t, e, s, i, n, o), this._transform.append(gr), this);
  }
  /**
   * Applies a translation transformation to the graphics context, moving the origin by the specified amounts.
   * @param x - The amount to translate in the horizontal direction.
   * @param y - (Optional) The amount to translate in the vertical direction. If not specified, the x value is used for both directions.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  translate(t, e = t) {
    return this._transform.translate(t, e), this;
  }
  /**
   * Clears all drawing commands from the graphics context, effectively resetting it. This includes clearing the path,
   * and optionally resetting transformations to the identity matrix.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  clear() {
    return this._activePath.clear(), this.instructions.length = 0, this.resetTransform(), this.onUpdate(), this;
  }
  onUpdate() {
    this._boundsDirty = !0, !this.dirty && (this.emit("update", this, 16), this.dirty = !0);
  }
  /** The bounds of the graphic shape. */
  get bounds() {
    if (!this._boundsDirty)
      return this._bounds;
    this._boundsDirty = !1;
    const t = this._bounds;
    t.clear();
    for (let e = 0; e < this.instructions.length; e++) {
      const s = this.instructions[e], i = s.action;
      if (i === "fill") {
        const n = s.data;
        t.addBounds(n.path.bounds);
      } else if (i === "texture") {
        const n = s.data;
        t.addFrame(n.dx, n.dy, n.dx + n.dw, n.dy + n.dh, n.transform);
      }
      if (i === "stroke") {
        const n = s.data, o = n.style.alignment, a = n.style.width * (1 - o), h = n.path.bounds;
        t.addFrame(
          h.minX - a,
          h.minY - a,
          h.maxX + a,
          h.maxY + a
        );
      }
    }
    return t;
  }
  /**
   * Check to see if a point is contained within this geometry.
   * @param point - Point to check if it's contained.
   * @returns {boolean} `true` if the point is contained within geometry.
   */
  containsPoint(t) {
    if (!this.bounds.containsPoint(t.x, t.y))
      return !1;
    const e = this.instructions;
    let s = !1;
    for (let i = 0; i < e.length; i++) {
      const n = e[i], o = n.data, a = o.path;
      if (!n.action || !a)
        continue;
      const h = o.style, l = a.shapePath.shapePrimitives;
      for (let c = 0; c < l.length; c++) {
        const d = l[c].shape;
        if (!h || !d)
          continue;
        const f = l[c].transform, u = f ? f.applyInverse(t, Dl) : t;
        if (n.action === "fill")
          s = d.contains(u.x, u.y);
        else {
          const m = h;
          s = d.strokeContains(u.x, u.y, m.width, m.alignment);
        }
        const p = o.hole;
        if (p) {
          const m = p.shapePath?.shapePrimitives;
          if (m)
            for (let g = 0; g < m.length; g++)
              m[g].shape.contains(u.x, u.y) && (s = !1);
        }
        if (s)
          return !0;
      }
    }
    return s;
  }
  /** Unloads the GPU data from the graphics context. */
  unload() {
    this.emit("unload", this);
    for (const t in this._gpuData)
      this._gpuData[t]?.destroy();
    this._gpuData = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Destroys the GraphicsData object.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * context.destroy();
   * context.destroy(true);
   * context.destroy({ texture: true, textureSource: true });
   */
  destroy(t = !1) {
    if (this.destroyed)
      return;
    if (this.destroyed = !0, this._stateStack.length = 0, this._transform = null, this.unload(), this.emit("destroy", this), this.removeAllListeners(), typeof t == "boolean" ? t : t?.texture) {
      const s = typeof t == "boolean" ? t : t?.textureSource;
      this._fillStyle.texture && (this._fillStyle.fill && "uid" in this._fillStyle.fill ? this._fillStyle.fill.destroy() : this._fillStyle.texture.destroy(s)), this._strokeStyle.texture && (this._strokeStyle.fill && "uid" in this._strokeStyle.fill ? this._strokeStyle.fill.destroy() : this._strokeStyle.texture.destroy(s));
    }
    this._fillStyle = null, this._strokeStyle = null, this.instructions = null, this._activePath = null, this._bounds = null, this._stateStack = null, this.customShader = null, this._transform = null;
  }
};
oi.defaultFillStyle = {
  /** The color to use for the fill. */
  color: 16777215,
  /** The alpha value to use for the fill. */
  alpha: 1,
  /** The texture to use for the fill. */
  texture: D.WHITE,
  /** The matrix to apply. */
  matrix: null,
  /** The fill pattern to use. */
  fill: null,
  /** Whether coordinates are 'global' or 'local' */
  textureSpace: "local"
};
oi.defaultStrokeStyle = {
  /** The width of the stroke. */
  width: 1,
  /** The color to use for the stroke. */
  color: 16777215,
  /** The alpha value to use for the stroke. */
  alpha: 1,
  /** The alignment of the stroke. */
  alignment: 0.5,
  /** The miter limit to use. */
  miterLimit: 10,
  /** The line cap style to use. */
  cap: "butt",
  /** The line join style to use. */
  join: "miter",
  /** The texture to use for the fill. */
  texture: D.WHITE,
  /** The matrix to apply. */
  matrix: null,
  /** The fill pattern to use. */
  fill: null,
  /** Whether coordinates are 'global' or 'local' */
  textureSpace: "local",
  /** If the stroke is a pixel line. */
  pixelLine: !1
};
let dt = oi;
const ai = class Vt extends xt {
  constructor(t = {}) {
    super(), this.uid = U("textStyle"), this._tick = 0, zl(t);
    const e = { ...Vt.defaultTextStyle, ...t };
    for (const s in e) {
      const i = s;
      this[i] = e[s];
    }
    this.update(), this._tick = 0;
  }
  /**
   * Alignment for multiline text, does not affect single line text.
   * @type {'left'|'center'|'right'|'justify'}
   */
  get align() {
    return this._align;
  }
  set align(t) {
    this._align !== t && (this._align = t, this.update());
  }
  /** Indicates if lines can be wrapped within words, it needs wordWrap to be set to true. */
  get breakWords() {
    return this._breakWords;
  }
  set breakWords(t) {
    this._breakWords !== t && (this._breakWords = t, this.update());
  }
  /** Set a drop shadow for the text. */
  get dropShadow() {
    return this._dropShadow;
  }
  set dropShadow(t) {
    this._dropShadow !== t && (t !== null && typeof t == "object" ? this._dropShadow = this._createProxy({ ...Vt.defaultDropShadow, ...t }) : this._dropShadow = t ? this._createProxy({ ...Vt.defaultDropShadow }) : null, this.update());
  }
  /** The font family, can be a single font name, or a list of names where the first is the preferred font. */
  get fontFamily() {
    return this._fontFamily;
  }
  set fontFamily(t) {
    this._fontFamily !== t && (this._fontFamily = t, this.update());
  }
  /** The font size (as a number it converts to px, but as a string, equivalents are '26px','20pt','160%' or '1.6em') */
  get fontSize() {
    return this._fontSize;
  }
  set fontSize(t) {
    this._fontSize !== t && (typeof t == "string" ? this._fontSize = parseInt(t, 10) : this._fontSize = t, this.update());
  }
  /**
   * The font style.
   * @type {'normal'|'italic'|'oblique'}
   */
  get fontStyle() {
    return this._fontStyle;
  }
  set fontStyle(t) {
    this._fontStyle !== t && (this._fontStyle = t.toLowerCase(), this.update());
  }
  /**
   * The font variant.
   * @type {'normal'|'small-caps'}
   */
  get fontVariant() {
    return this._fontVariant;
  }
  set fontVariant(t) {
    this._fontVariant !== t && (this._fontVariant = t, this.update());
  }
  /**
   * The font weight.
   * @type {'normal'|'bold'|'bolder'|'lighter'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'}
   */
  get fontWeight() {
    return this._fontWeight;
  }
  set fontWeight(t) {
    this._fontWeight !== t && (this._fontWeight = t, this.update());
  }
  /** The space between lines. */
  get leading() {
    return this._leading;
  }
  set leading(t) {
    this._leading !== t && (this._leading = t, this.update());
  }
  /** The amount of spacing between letters, default is 0. */
  get letterSpacing() {
    return this._letterSpacing;
  }
  set letterSpacing(t) {
    this._letterSpacing !== t && (this._letterSpacing = t, this.update());
  }
  /** The line height, a number that represents the vertical space that a letter uses. */
  get lineHeight() {
    return this._lineHeight;
  }
  set lineHeight(t) {
    this._lineHeight !== t && (this._lineHeight = t, this.update());
  }
  /**
   * Occasionally some fonts are cropped. Adding some padding will prevent this from happening
   * by adding padding to all sides of the text.
   * > [!NOTE] This will NOT affect the positioning or bounds of the text.
   */
  get padding() {
    return this._padding;
  }
  set padding(t) {
    this._padding !== t && (this._padding = t, this.update());
  }
  /**
   * An optional filter or array of filters to apply to the text, allowing for advanced visual effects.
   * These filters will be applied to the text as it is created, resulting in faster rendering for static text
   * compared to applying the filter directly to the text object (which would be applied at run time).
   * @default null
   */
  get filters() {
    return this._filters;
  }
  set filters(t) {
    this._filters !== t && (this._filters = Object.freeze(t), this.update());
  }
  /**
   * Trim transparent borders from the text texture.
   * > [!IMPORTANT] PERFORMANCE WARNING:
   * > This is a costly operation as it requires scanning pixel alpha values.
   * > Avoid using `trim: true` for dynamic text, as it could significantly impact performance.
   */
  get trim() {
    return this._trim;
  }
  set trim(t) {
    this._trim !== t && (this._trim = t, this.update());
  }
  /**
   * The baseline of the text that is rendered.
   * @type {'alphabetic'|'top'|'hanging'|'middle'|'ideographic'|'bottom'}
   */
  get textBaseline() {
    return this._textBaseline;
  }
  set textBaseline(t) {
    this._textBaseline !== t && (this._textBaseline = t, this.update());
  }
  /**
   * How newlines and spaces should be handled.
   * Default is 'pre' (preserve, preserve).
   *
   *  value       | New lines     |   Spaces
   *  ---         | ---           |   ---
   * 'normal'     | Collapse      |   Collapse
   * 'pre'        | Preserve      |   Preserve
   * 'pre-line'   | Preserve      |   Collapse
   * @type {'normal'|'pre'|'pre-line'}
   */
  get whiteSpace() {
    return this._whiteSpace;
  }
  set whiteSpace(t) {
    this._whiteSpace !== t && (this._whiteSpace = t, this.update());
  }
  /** Indicates if word wrap should be used. */
  get wordWrap() {
    return this._wordWrap;
  }
  set wordWrap(t) {
    this._wordWrap !== t && (this._wordWrap = t, this.update());
  }
  /** The width at which text will wrap, it needs wordWrap to be set to true. */
  get wordWrapWidth() {
    return this._wordWrapWidth;
  }
  set wordWrapWidth(t) {
    this._wordWrapWidth !== t && (this._wordWrapWidth = t, this.update());
  }
  /**
   * The fill style that will be used to color the text.
   * This can be:
   * - A color string like 'red', '#00FF00', or 'rgba(255,0,0,0.5)'
   * - A hex number like 0xff0000 for red
   * - A FillStyle object with properties like { color: 0xff0000, alpha: 0.5 }
   * - A FillGradient for gradient fills
   * - A FillPattern for pattern/texture fills
   *
   * When using a FillGradient, vertical gradients (angle of 90 degrees) are applied per line of text,
   * while gradients at any other angle are spread across the entire text body as a whole.
   * @example
   * // Vertical gradient applied per line
   * const verticalGradient = new FillGradient(0, 0, 0, 1)
   *     .addColorStop(0, 0xff0000)
   *     .addColorStop(1, 0x0000ff);
   *
   * const text = new Text({
   *     text: 'Line 1\nLine 2',
   *     style: { fill: verticalGradient }
   * });
   *
   * To manage the gradient in a global scope, set the textureSpace property of the FillGradient to 'global'.
   * @type {string|number|FillStyle|FillGradient|FillPattern}
   */
  get fill() {
    return this._originalFill;
  }
  set fill(t) {
    t !== this._originalFill && (this._originalFill = t, this._isFillStyle(t) && (this._originalFill = this._createProxy({ ...dt.defaultFillStyle, ...t }, () => {
      this._fill = Yt(
        { ...this._originalFill },
        dt.defaultFillStyle
      );
    })), this._fill = Yt(
      t === 0 ? "black" : t,
      dt.defaultFillStyle
    ), this.update());
  }
  /** A fillstyle that will be used on the text stroke, e.g., 'blue', '#FCFF00'. */
  get stroke() {
    return this._originalStroke;
  }
  set stroke(t) {
    t !== this._originalStroke && (this._originalStroke = t, this._isFillStyle(t) && (this._originalStroke = this._createProxy({ ...dt.defaultStrokeStyle, ...t }, () => {
      this._stroke = Ze(
        { ...this._originalStroke },
        dt.defaultStrokeStyle
      );
    })), this._stroke = Ze(t, dt.defaultStrokeStyle), this.update());
  }
  update() {
    this._tick++, this.emit("update", this);
  }
  /** Resets all properties to the default values */
  reset() {
    const t = Vt.defaultTextStyle;
    for (const e in t)
      this[e] = t[e];
  }
  /**
   * Returns a unique key for this instance.
   * This key is used for caching.
   * @returns {string} Unique key for the instance
   */
  get styleKey() {
    return `${this.uid}-${this._tick}`;
  }
  /**
   * Creates a new TextStyle object with the same values as this one.
   * @returns New cloned TextStyle object
   */
  clone() {
    return new Vt({
      align: this.align,
      breakWords: this.breakWords,
      dropShadow: this._dropShadow ? { ...this._dropShadow } : null,
      fill: this._fill,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontStyle: this.fontStyle,
      fontVariant: this.fontVariant,
      fontWeight: this.fontWeight,
      leading: this.leading,
      letterSpacing: this.letterSpacing,
      lineHeight: this.lineHeight,
      padding: this.padding,
      stroke: this._stroke,
      textBaseline: this.textBaseline,
      whiteSpace: this.whiteSpace,
      wordWrap: this.wordWrap,
      wordWrapWidth: this.wordWrapWidth,
      filters: this._filters ? [...this._filters] : void 0
    });
  }
  /**
   * Returns the final padding for the text style, taking into account any filters applied.
   * Used internally for correct measurements
   * @internal
   * @returns {number} The final padding for the text style.
   */
  _getFinalPadding() {
    let t = 0;
    if (this._filters)
      for (let e = 0; e < this._filters.length; e++)
        t += this._filters[e].padding;
    return Math.max(this._padding, t);
  }
  /**
   * Destroys this text style.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * // Destroy the text style and its textures
   * textStyle.destroy({ texture: true, textureSource: true });
   * textStyle.destroy(true);
   */
  destroy(t = !1) {
    if (this.removeAllListeners(), typeof t == "boolean" ? t : t?.texture) {
      const s = typeof t == "boolean" ? t : t?.textureSource;
      this._fill?.texture && this._fill.texture.destroy(s), this._originalFill?.texture && this._originalFill.texture.destroy(s), this._stroke?.texture && this._stroke.texture.destroy(s), this._originalStroke?.texture && this._originalStroke.texture.destroy(s);
    }
    this._fill = null, this._stroke = null, this.dropShadow = null, this._originalStroke = null, this._originalFill = null;
  }
  _createProxy(t, e) {
    return new Proxy(t, {
      set: (s, i, n) => (s[i] === n || (s[i] = n, e?.(i, n), this.update()), !0)
    });
  }
  _isFillStyle(t) {
    return (t ?? null) !== null && !(V.isColorLike(t) || t instanceof St || t instanceof es);
  }
};
ai.defaultDropShadow = {
  alpha: 1,
  angle: Math.PI / 6,
  blur: 0,
  color: "black",
  distance: 5
};
ai.defaultTextStyle = {
  align: "left",
  breakWords: !1,
  dropShadow: null,
  fill: "black",
  fontFamily: "Arial",
  fontSize: 26,
  fontStyle: "normal",
  fontVariant: "normal",
  fontWeight: "normal",
  leading: 0,
  letterSpacing: 0,
  lineHeight: 0,
  padding: 0,
  stroke: null,
  textBaseline: "alphabetic",
  trim: !1,
  whiteSpace: "pre",
  wordWrap: !1,
  wordWrapWidth: 100
};
let Xn = ai;
function zl(r) {
  const t = r;
  if (typeof t.dropShadow == "boolean" && t.dropShadow) {
    const e = Xn.defaultDropShadow;
    r.dropShadow = {
      alpha: t.dropShadowAlpha ?? e.alpha,
      angle: t.dropShadowAngle ?? e.angle,
      blur: t.dropShadowBlur ?? e.blur,
      color: t.dropShadowColor ?? e.color,
      distance: t.dropShadowDistance ?? e.distance
    };
  }
  if (t.strokeThickness !== void 0) {
    B(W, "strokeThickness is now a part of stroke");
    const e = t.stroke;
    let s = {};
    if (V.isColorLike(e))
      s.color = e;
    else if (e instanceof St || e instanceof es)
      s.fill = e;
    else if (Object.hasOwnProperty.call(e, "color") || Object.hasOwnProperty.call(e, "fill"))
      s = e;
    else
      throw new Error("Invalid stroke value.");
    r.stroke = {
      ...s,
      width: t.strokeThickness
    };
  }
  if (Array.isArray(t.fillGradientStops)) {
    if (B(W, "gradient fill is now a fill pattern: `new FillGradient(...)`"), !Array.isArray(t.fill) || t.fill.length === 0)
      throw new Error("Invalid fill value. Expected an array of colors for gradient fill.");
    t.fill.length !== t.fillGradientStops.length && J("The number of fill colors must match the number of fill gradient stops.");
    const e = new St({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      textureSpace: "local"
    }), s = t.fillGradientStops.slice(), i = t.fill.map((n) => V.shared.setValue(n).toNumber());
    s.forEach((n, o) => {
      e.addColorStop(n, i[o]);
    }), r.fill = {
      fill: e
    };
  }
}
class Yl {
  constructor(t) {
    this._canvasPool = /* @__PURE__ */ Object.create(null), this.canvasOptions = t || {}, this.enableFullScreen = !1;
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   */
  _createCanvasAndContext(t, e) {
    const s = rt.get().createCanvas();
    s.width = t, s.height = e;
    const i = s.getContext("2d");
    return { canvas: s, context: i };
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param minWidth - The minimum width of the render texture.
   * @param minHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @returns The new render texture.
   */
  getOptimalCanvasAndContext(t, e, s = 1) {
    t = Math.ceil(t * s - 1e-6), e = Math.ceil(e * s - 1e-6), t = Zt(t), e = Zt(e);
    const i = (t << 17) + (e << 1);
    this._canvasPool[i] || (this._canvasPool[i] = []);
    let n = this._canvasPool[i].pop();
    return n || (n = this._createCanvasAndContext(t, e)), n;
  }
  /**
   * Place a render texture back into the pool.
   * @param canvasAndContext
   */
  returnCanvasAndContext(t) {
    const e = t.canvas, { width: s, height: i } = e, n = (s << 17) + (i << 1);
    t.context.resetTransform(), t.context.clearRect(0, 0, s, i), this._canvasPool[n].push(t);
  }
  clear() {
    this._canvasPool = {};
  }
}
const qs = new Yl();
Me.register(qs);
const mr = 1e5;
function yr(r, t, e, s = 0) {
  if (r.texture === D.WHITE && !r.fill)
    return V.shared.setValue(r.color).setAlpha(r.alpha ?? 1).toHexa();
  if (r.fill) {
    if (r.fill instanceof es) {
      const i = r.fill, n = t.createPattern(i.texture.source.resource, "repeat"), o = i.transform.copyTo(F.shared);
      return o.scale(
        i.texture.frame.width,
        i.texture.frame.height
      ), n.setTransform(o), n;
    } else if (r.fill instanceof St) {
      const i = r.fill, n = i.type === "linear", o = i.textureSpace === "local";
      let a = 1, h = 1;
      o && e && (a = e.width + s, h = e.height + s);
      let l, c = !1;
      if (n) {
        const { start: d, end: f } = i;
        l = t.createLinearGradient(
          d.x * a,
          d.y * h,
          f.x * a,
          f.y * h
        ), c = Math.abs(f.x - d.x) < Math.abs((f.y - d.y) * 0.1);
      } else {
        const { center: d, innerRadius: f, outerCenter: u, outerRadius: p } = i;
        l = t.createRadialGradient(
          d.x * a,
          d.y * h,
          f * a,
          u.x * a,
          u.y * h,
          p * a
        );
      }
      if (c && o && e) {
        const d = e.lineHeight / h;
        for (let f = 0; f < e.lines.length; f++) {
          const u = (f * e.lineHeight + s / 2) / h;
          i.colorStops.forEach((p) => {
            const m = u + p.offset * d;
            l.addColorStop(
              // fix to 5 decimal places to avoid floating point precision issues
              Math.floor(m * mr) / mr,
              V.shared.setValue(p.color).toHex()
            );
          });
        }
      } else
        i.colorStops.forEach((d) => {
          l.addColorStop(d.offset, V.shared.setValue(d.color).toHex());
        });
      return l;
    }
  } else {
    const i = t.createPattern(r.texture.source.resource, "repeat"), n = r.matrix.copyTo(F.shared);
    return n.scale(r.texture.frame.width, r.texture.frame.height), i.setTransform(n), i;
  }
  return J("FillStyle not recognised", r), "red";
}
class tt extends Qs {
  /**
   * Creates a new Graphics object.
   * @param options - Options for the Graphics.
   */
  constructor(t) {
    t instanceof dt && (t = { context: t });
    const { context: e, roundPixels: s, ...i } = t || {};
    super({
      label: "Graphics",
      ...i
    }), this.renderPipeId = "graphics", e ? this.context = e : (this.context = this._ownedContext = new dt(), this.context.autoGarbageCollect = this.autoGarbageCollect), this.didViewUpdate = !0, this.allowChildren = !1, this.roundPixels = s ?? !1;
  }
  set context(t) {
    t !== this._context && (this._context && (this._context.off("update", this.onViewUpdate, this), this._context.off("unload", this.unload, this)), this._context = t, this._context.on("update", this.onViewUpdate, this), this._context.on("unload", this.unload, this), this.onViewUpdate());
  }
  /**
   * The underlying graphics context used for drawing operations.
   * Controls how shapes and paths are rendered.
   * @example
   * ```ts
   * // Create a shared context
   * const sharedContext = new GraphicsContext();
   *
   * // Create graphics objects sharing the same context
   * const graphics1 = new Graphics();
   * const graphics2 = new Graphics();
   *
   * // Assign shared context
   * graphics1.context = sharedContext;
   * graphics2.context = sharedContext;
   *
   * // Both graphics will show the same shapes
   * sharedContext
   *     .rect(0, 0, 100, 100)
   *     .fill({ color: 0xff0000 });
   * ```
   * @see {@link GraphicsContext} For drawing operations
   * @see {@link GraphicsOptions} For context configuration
   */
  get context() {
    return this._context;
  }
  /**
   * The local bounds of the graphics object.
   * Returns the boundaries after all graphical operations but before any transforms.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw a shape
   * graphics
   *     .rect(0, 0, 100, 100)
   *     .fill({ color: 0xff0000 });
   *
   * // Get bounds information
   * const bounds = graphics.bounds;
   * console.log(bounds.width);  // 100
   * console.log(bounds.height); // 100
   * ```
   * @readonly
   * @see {@link Bounds} For bounds operations
   * @see {@link Container#getBounds} For transformed bounds
   */
  get bounds() {
    return this._context.bounds;
  }
  /**
   * Graphics objects do not need to update their bounds as the context handles this.
   * @private
   */
  updateBounds() {
  }
  /**
   * Checks if the object contains the given point.
   * Returns true if the point lies within the Graphics object's rendered area.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw a shape
   * graphics
   *     .rect(0, 0, 100, 100)
   *     .fill({ color: 0xff0000 });
   *
   * // Check point intersection
   * if (graphics.containsPoint({ x: 50, y: 50 })) {
   *     console.log('Point is inside rectangle!');
   * }
   * ```
   * @param point - The point to check in local coordinates
   * @returns True if the point is inside the Graphics object
   * @see {@link Graphics#bounds} For bounding box checks
   * @see {@link PointData} For point data structure
   */
  containsPoint(t) {
    return this._context.containsPoint(t);
  }
  /**
   * Destroys this graphics renderable and optionally its context.
   * @param options - Options parameter. A boolean will act as if all options
   *
   * If the context was created by this graphics and `destroy(false)` or `destroy()` is called
   * then the context will still be destroyed.
   *
   * If you want to explicitly not destroy this context that this graphics created,
   * then you should pass destroy({ context: false })
   *
   * If the context was passed in as an argument to the constructor then it will not be destroyed
   * @example
   * ```ts
   * // Destroy the graphics and its context
   * graphics.destroy();
   * graphics.destroy(true);
   * graphics.destroy({ context: true, texture: true, textureSource: true });
   * ```
   */
  destroy(t) {
    this._ownedContext && !t ? this._ownedContext.destroy(t) : (t === !0 || t?.context === !0) && this._context.destroy(t), this._ownedContext = null, this._context = null, super.destroy(t);
  }
  /**
   * @param now - The current time in milliseconds.
   * @internal
   */
  _onTouch(t) {
    this._gcLastUsed = t, this._context._gcLastUsed = t;
  }
  _callContextMethod(t, e) {
    return this.context[t](...e), this;
  }
  // --------------------------------------- GraphicsContext methods ---------------------------------------
  /**
   * Sets the current fill style of the graphics context.
   * The fill style can be a color, gradient, pattern, or a complex style object.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic color fill
   * graphics
   *     .setFillStyle({ color: 0xff0000 }) // Red fill
   *     .rect(0, 0, 100, 100)
   *     .fill();
   *
   * // Gradient fill
   * const gradient = new FillGradient({
   *    end: { x: 1, y: 0 },
   *    colorStops: [
   *         { offset: 0, color: 0xff0000 }, // Red at start
   *         { offset: 0.5, color: 0x00ff00 }, // Green at middle
   *         { offset: 1, color: 0x0000ff }, // Blue at end
   *    ],
   * });
   *
   * graphics
   *     .setFillStyle(gradient)
   *     .circle(100, 100, 50)
   *     .fill();
   *
   * // Pattern fill
   * const pattern = new FillPattern(texture);
   * graphics
   *     .setFillStyle({
   *         fill: pattern,
   *         alpha: 0.5
   *     })
   *     .rect(0, 0, 200, 200)
   *     .fill();
   * ```
   * @param {FillInput} args - The fill style to apply
   * @returns The Graphics instance for chaining
   * @see {@link FillStyle} For fill style options
   * @see {@link FillGradient} For gradient fills
   * @see {@link FillPattern} For pattern fills
   */
  setFillStyle(...t) {
    return this._callContextMethod("setFillStyle", t);
  }
  /**
   * Sets the current stroke style of the graphics context.
   * Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic color stroke
   * graphics
   *     .setStrokeStyle({
   *         width: 2,
   *         color: 0x000000
   *     })
   *     .rect(0, 0, 100, 100)
   *     .stroke();
   *
   * // Complex stroke style
   * graphics
   *     .setStrokeStyle({
   *         width: 4,
   *         color: 0xff0000,
   *         alpha: 0.5,
   *         join: 'round',
   *         cap: 'round',
   *         alignment: 0.5
   *     })
   *     .circle(100, 100, 50)
   *     .stroke();
   *
   * // Gradient stroke
   * const gradient = new FillGradient({
   *    end: { x: 1, y: 0 },
   *    colorStops: [
   *         { offset: 0, color: 0xff0000 }, // Red at start
   *         { offset: 0.5, color: 0x00ff00 }, // Green at middle
   *         { offset: 1, color: 0x0000ff }, // Blue at end
   *    ],
   * });
   *
   * graphics
   *     .setStrokeStyle({
   *         width: 10,
   *         fill: gradient
   *     })
   *     .poly([0,0, 100,50, 0,100])
   *     .stroke();
   * ```
   * @param {StrokeInput} args - The stroke style to apply
   * @returns The Graphics instance for chaining
   * @see {@link StrokeStyle} For stroke style options
   * @see {@link FillGradient} For gradient strokes
   * @see {@link FillPattern} For pattern strokes
   */
  setStrokeStyle(...t) {
    return this._callContextMethod("setStrokeStyle", t);
  }
  fill(...t) {
    return this._callContextMethod("fill", t);
  }
  /**
   * Strokes the current path with the current stroke style or specified style.
   * Outlines the shape using the stroke settings.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Stroke with direct color
   * graphics
   *     .circle(50, 50, 25)
   *     .stroke({
   *         width: 2,
   *         color: 0xff0000
   *     }); // 2px red stroke
   *
   * // Fill with texture
   * graphics
   *    .rect(0, 0, 100, 100)
   *    .stroke(myTexture); // Fill with texture
   *
   * // Stroke with gradient
   * const gradient = new FillGradient({
   *     end: { x: 1, y: 0 },
   *     colorStops: [
   *         { offset: 0, color: 0xff0000 },
   *         { offset: 0.5, color: 0x00ff00 },
   *         { offset: 1, color: 0x0000ff },
   *     ],
   * });
   *
   * graphics
   *     .rect(0, 0, 100, 100)
   *     .stroke({
   *         width: 4,
   *         fill: gradient,
   *         alignment: 0.5,
   *         join: 'round'
   *     });
   * ```
   * @param {StrokeStyle} args - Optional stroke style to apply. Can be:
   * - A stroke style object with width, color, etc.
   * - A gradient
   * - A pattern
   * If omitted, uses current stroke style.
   * @returns The Graphics instance for chaining
   * @see {@link StrokeStyle} For stroke style options
   * @see {@link FillGradient} For gradient strokes
   * @see {@link setStrokeStyle} For setting default stroke style
   */
  stroke(...t) {
    return this._callContextMethod("stroke", t);
  }
  texture(...t) {
    return this._callContextMethod("texture", t);
  }
  /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @example
   * ```ts
   * const graphics = new Graphics();
   * graphics
   *     .circle(150, 150, 50)
   *     .fill({ color: 0x00ff00 })
   *     .beginPath() // Starts a new path
   *     .circle(250, 150, 50)
   *     .fill({ color: 0x0000ff });
   * ```
   * @returns The Graphics instance for chaining
   * @see {@link Graphics#moveTo} For starting a new subpath
   * @see {@link Graphics#closePath} For closing the current path
   */
  beginPath() {
    return this._callContextMethod("beginPath", []);
  }
  /**
   * Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
   * subtracting a path from the previously drawn path.
   *
   * If a hole is not completely in a shape, it will fail to cut correctly.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw outer circle
   * graphics
   *     .circle(100, 100, 50)
   *     .fill({ color: 0xff0000 });
   *     .circle(100, 100, 25) // Inner circle
   *     .cut() // Cuts out the inner circle from the outer circle
   * ```
   */
  cut() {
    return this._callContextMethod("cut", []);
  }
  arc(...t) {
    return this._callContextMethod("arc", t);
  }
  arcTo(...t) {
    return this._callContextMethod("arcTo", t);
  }
  arcToSvg(...t) {
    return this._callContextMethod("arcToSvg", t);
  }
  bezierCurveTo(...t) {
    return this._callContextMethod("bezierCurveTo", t);
  }
  /**
   * Closes the current path by drawing a straight line back to the start point.
   *
   * This is useful for completing shapes and ensuring they are properly closed for fills.
   * @example
   * ```ts
   * // Create a triangle with closed path
   * const graphics = new Graphics();
   * graphics
   *     .moveTo(50, 50)
   *     .lineTo(100, 100)
   *     .lineTo(0, 100)
   *     .closePath()
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#beginPath} For starting a new path
   * @see {@link Graphics#fill} For filling closed paths
   * @see {@link Graphics#stroke} For stroking paths
   */
  closePath() {
    return this._callContextMethod("closePath", []);
  }
  ellipse(...t) {
    return this._callContextMethod("ellipse", t);
  }
  circle(...t) {
    return this._callContextMethod("circle", t);
  }
  path(...t) {
    return this._callContextMethod("path", t);
  }
  lineTo(...t) {
    return this._callContextMethod("lineTo", t);
  }
  moveTo(...t) {
    return this._callContextMethod("moveTo", t);
  }
  quadraticCurveTo(...t) {
    return this._callContextMethod("quadraticCurveTo", t);
  }
  rect(...t) {
    return this._callContextMethod("rect", t);
  }
  roundRect(...t) {
    return this._callContextMethod("roundRect", t);
  }
  poly(...t) {
    return this._callContextMethod("poly", t);
  }
  regularPoly(...t) {
    return this._callContextMethod("regularPoly", t);
  }
  roundPoly(...t) {
    return this._callContextMethod("roundPoly", t);
  }
  roundShape(...t) {
    return this._callContextMethod("roundShape", t);
  }
  filletRect(...t) {
    return this._callContextMethod("filletRect", t);
  }
  chamferRect(...t) {
    return this._callContextMethod("chamferRect", t);
  }
  star(...t) {
    return this._callContextMethod("star", t);
  }
  svg(...t) {
    return this._callContextMethod("svg", t);
  }
  restore(...t) {
    return this._callContextMethod("restore", t);
  }
  /**
   * Saves the current graphics state onto a stack. The state includes:
   * - Current transformation matrix
   * - Current fill style
   * - Current stroke style
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Save state before complex operations
   * graphics.save();
   *
   * // Create transformed and styled shape
   * graphics
   *     .translateTransform(100, 100)
   *     .rotateTransform(Math.PI / 4)
   *     .setFillStyle({
   *         color: 0xff0000,
   *         alpha: 0.5
   *     })
   *     .rect(-25, -25, 50, 50)
   *     .fill();
   *
   * // Restore to original state
   * graphics.restore();
   *
   * // Continue drawing with previous state
   * graphics
   *     .circle(50, 50, 25)
   *     .fill();
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#restore} For restoring the saved state
   * @see {@link Graphics#setTransform} For setting transformations
   */
  save() {
    return this._callContextMethod("save", []);
  }
  /**
   * Returns the current transformation matrix of the graphics context.
   * This matrix represents all accumulated transformations including translate, scale, and rotate.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Apply some transformations
   * graphics
   *     .translateTransform(100, 100)
   *     .rotateTransform(Math.PI / 4);
   *
   * // Get the current transform matrix
   * const matrix = graphics.getTransform();
   * console.log(matrix.tx, matrix.ty); // 100, 100
   *
   * // Use the matrix for other operations
   * graphics
   *     .setTransform(matrix)
   *     .circle(0, 0, 50)
   *     .fill({ color: 0xff0000 });
   * ```
   * @returns The current transformation matrix.
   * @see {@link Graphics#setTransform} For setting the transform matrix
   * @see {@link Matrix} For matrix operations
   */
  getTransform() {
    return this.context.getTransform();
  }
  /**
   * Resets the current transformation matrix to the identity matrix, effectively removing
   * any transformations (rotation, scaling, translation) previously applied.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Apply transformations
   * graphics
   *     .translateTransform(100, 100)
   *     .scaleTransform(2, 2)
   *     .circle(0, 0, 25)
   *     .fill({ color: 0xff0000 });
   * // Reset transform to default state
   * graphics
   *     .resetTransform()
   *     .circle(50, 50, 25) // Will draw at actual coordinates
   *     .fill({ color: 0x00ff00 });
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#getTransform} For getting the current transform
   * @see {@link Graphics#setTransform} For setting a specific transform
   * @see {@link Graphics#save} For saving the current transform state
   * @see {@link Graphics#restore} For restoring a previous transform state
   */
  resetTransform() {
    return this._callContextMethod("resetTransform", []);
  }
  rotateTransform(...t) {
    return this._callContextMethod("rotate", t);
  }
  scaleTransform(...t) {
    return this._callContextMethod("scale", t);
  }
  setTransform(...t) {
    return this._callContextMethod("setTransform", t);
  }
  transform(...t) {
    return this._callContextMethod("transform", t);
  }
  translateTransform(...t) {
    return this._callContextMethod("translate", t);
  }
  /**
   * Clears all drawing commands from the graphics context, effectively resetting it.
   * This includes clearing the current path, fill style, stroke style, and transformations.
   *
   * > [!NOTE] Graphics objects are not designed to be continuously cleared and redrawn.
   * > Instead, they are intended to be used for static or semi-static graphics that
   * > can be redrawn as needed. Frequent clearing and redrawing may lead to performance issues.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw some shapes
   * graphics
   *     .circle(100, 100, 50)
   *     .fill({ color: 0xff0000 })
   *     .rect(200, 100, 100, 50)
   *     .fill({ color: 0x00ff00 });
   *
   * // Clear all graphics
   * graphics.clear();
   *
   * // Start fresh with new shapes
   * graphics
   *     .circle(150, 150, 30)
   *     .fill({ color: 0x0000ff });
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#beginPath} For starting a new path without clearing styles
   * @see {@link Graphics#save} For saving the current state
   * @see {@link Graphics#restore} For restoring a previous state
   */
  clear() {
    return this._callContextMethod("clear", []);
  }
  /**
   * Gets or sets the current fill style for the graphics context. The fill style determines
   * how shapes are filled when using the fill() method.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic color fill
   * graphics.fillStyle = {
   *     color: 0xff0000,  // Red
   *     alpha: 1
   * };
   *
   * // Using gradients
   * const gradient = new FillGradient({
   *     end: { x: 0, y: 1 }, // Vertical gradient
   *     stops: [
   *         { offset: 0, color: 0xff0000, alpha: 1 }, // Start color
   *         { offset: 1, color: 0x0000ff, alpha: 1 }  // End color
   *     ]
   * });
   *
   * graphics.fillStyle = {
   *     fill: gradient,
   *     alpha: 0.8
   * };
   *
   * // Using patterns
   * graphics.fillStyle = {
   *     texture: myTexture,
   *     alpha: 1,
   *     matrix: new Matrix()
   *         .scale(0.5, 0.5)
   *         .rotate(Math.PI / 4)
   * };
   * ```
   * @type {ConvertedFillStyle}
   * @see {@link FillStyle} For all available fill style options
   * @see {@link FillGradient} For creating gradient fills
   * @see {@link Graphics#fill} For applying the fill to paths
   */
  get fillStyle() {
    return this._context.fillStyle;
  }
  set fillStyle(t) {
    this._context.fillStyle = t;
  }
  /**
   * Gets or sets the current stroke style for the graphics context. The stroke style determines
   * how paths are outlined when using the stroke() method.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic stroke style
   * graphics.strokeStyle = {
   *     width: 2,
   *     color: 0xff0000,
   *     alpha: 1
   * };
   *
   * // Using with gradients
   * const gradient = new FillGradient({
   *   end: { x: 0, y: 1 },
   *   stops: [
   *       { offset: 0, color: 0xff0000, alpha: 1 },
   *       { offset: 1, color: 0x0000ff, alpha: 1 }
   *   ]
   * });
   *
   * graphics.strokeStyle = {
   *     width: 4,
   *     fill: gradient,
   *     alignment: 0.5,
   *     join: 'round',
   *     cap: 'round'
   * };
   *
   * // Complex stroke settings
   * graphics.strokeStyle = {
   *     width: 6,
   *     color: 0x00ff00,
   *     alpha: 0.5,
   *     join: 'miter',
   *     miterLimit: 10,
   * };
   * ```
   * @see {@link StrokeStyle} For all available stroke style options
   * @see {@link Graphics#stroke} For applying the stroke to paths
   */
  get strokeStyle() {
    return this._context.strokeStyle;
  }
  set strokeStyle(t) {
    this._context.strokeStyle = t;
  }
  /**
   * Creates a new Graphics object that copies the current graphics content.
   * The clone can either share the same context (shallow clone) or have its own independent
   * context (deep clone).
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Create original graphics content
   * graphics
   *     .circle(100, 100, 50)
   *     .fill({ color: 0xff0000 });
   *
   * // Create a shallow clone (shared context)
   * const shallowClone = graphics.clone();
   *
   * // Changes to original affect the clone
   * graphics
   *     .circle(200, 100, 30)
   *     .fill({ color: 0x00ff00 });
   *
   * // Create a deep clone (independent context)
   * const deepClone = graphics.clone(true);
   *
   * // Modify deep clone independently
   * deepClone
   *     .translateTransform(100, 100)
   *     .circle(0, 0, 40)
   *     .fill({ color: 0x0000ff });
   * ```
   * @param deep - Whether to create a deep clone of the graphics object.
   *              If false (default), the context will be shared between objects.
   *              If true, creates an independent copy of the context.
   * @returns A new Graphics instance with either shared or copied context
   * @see {@link Graphics#context} For accessing the underlying graphics context
   * @see {@link GraphicsContext} For understanding the shared context behavior
   */
  clone(t = !1) {
    return t ? new tt(this._context.clone()) : (this._ownedContext = null, new tt(this._context));
  }
  // -------- v7 deprecations ---------
  /**
   * @param width
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#setStrokeStyle} instead
   */
  lineStyle(t, e, s) {
    B(W, "Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.");
    const i = {};
    return t && (i.width = t), e && (i.color = e), s && (i.alpha = s), this.context.strokeStyle = i, this;
  }
  /**
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */
  beginFill(t, e) {
    B(W, "Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
    const s = {};
    return t !== void 0 && (s.color = t), e !== void 0 && (s.alpha = e), this.context.fillStyle = s, this;
  }
  /**
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */
  endFill() {
    B(W, "Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style."), this.context.fill();
    const t = this.context.strokeStyle;
    return (t.width !== dt.defaultStrokeStyle.width || t.color !== dt.defaultStrokeStyle.color || t.alpha !== dt.defaultStrokeStyle.alpha) && this.context.stroke(), this;
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#circle} instead
   */
  drawCircle(...t) {
    return B(W, "Graphics#drawCircle has been renamed to Graphics#circle"), this._callContextMethod("circle", t);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#ellipse} instead
   */
  drawEllipse(...t) {
    return B(W, "Graphics#drawEllipse has been renamed to Graphics#ellipse"), this._callContextMethod("ellipse", t);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#poly} instead
   */
  drawPolygon(...t) {
    return B(W, "Graphics#drawPolygon has been renamed to Graphics#poly"), this._callContextMethod("poly", t);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#rect} instead
   */
  drawRect(...t) {
    return B(W, "Graphics#drawRect has been renamed to Graphics#rect"), this._callContextMethod("rect", t);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#roundRect} instead
   */
  drawRoundedRect(...t) {
    return B(W, "Graphics#drawRoundedRect has been renamed to Graphics#roundRect"), this._callContextMethod("roundRect", t);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#star} instead
   */
  drawStar(...t) {
    return B(W, "Graphics#drawStar has been renamed to Graphics#star"), this._callContextMethod("star", t);
  }
}
class Xl extends Qs {
  constructor(t, e) {
    const { text: s, resolution: i, style: n, anchor: o, width: a, height: h, roundPixels: l, ...c } = t;
    super({
      ...c
    }), this.batched = !0, this._resolution = null, this._autoResolution = !0, this._didTextUpdate = !0, this._styleClass = e, this.text = s ?? "", this.style = n, this.resolution = i ?? null, this.allowChildren = !1, this._anchor = new Z(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    ), o && (this.anchor = o), this.roundPixels = l ?? !1, a !== void 0 && (this.width = a), h !== void 0 && (this.height = h);
  }
  /**
   * The anchor point of the text that controls the origin point for positioning and rotation.
   * Can be a number (same value for x/y) or a PointData object.
   * - (0,0) is top-left
   * - (0.5,0.5) is center
   * - (1,1) is bottom-right
   * ```ts
   * // Set anchor to center
   * const text = new Text({
   *     text: 'Hello Pixi!',
   *     anchor: 0.5 // Same as { x: 0.5, y: 0.5 }
   * });
   * // Set anchor to top-left
   * const text2 = new Text({
   *     text: 'Hello Pixi!',
   *     anchor: { x: 0, y: 0 } // Top-left corner
   * });
   * // Set anchor to bottom-right
   * const text3 = new Text({
   *     text: 'Hello Pixi!',
   *     anchor: { x: 1, y: 1 } // Bottom-right corner
   * });
   * ```
   * @default { x: 0, y: 0 }
   */
  get anchor() {
    return this._anchor;
  }
  set anchor(t) {
    typeof t == "number" ? this._anchor.set(t) : this._anchor.copyFrom(t);
  }
  /**
   * The text content to display. Use '\n' for line breaks.
   * Accepts strings, numbers, or objects with toString() method.
   * @example
   * ```ts
   * const text = new Text({
   *     text: 'Hello Pixi!',
   * });
   * const multilineText = new Text({
   *     text: 'Line 1\nLine 2\nLine 3',
   * });
   * const numberText = new Text({
   *     text: 12345, // Will be converted to '12345'
   * });
   * const objectText = new Text({
   *     text: { toString: () => 'Object Text' }, // Custom toString
   * });
   *
   * // Update text dynamically
   * text.text = 'Updated Text'; // Re-renders with new text
   * text.text = 67890; // Updates to '67890'
   * text.text = { toString: () => 'Dynamic Text' }; // Uses custom toString method
   * // Clear text
   * text.text = ''; // Clears the text
   * ```
   * @default ''
   */
  set text(t) {
    t = t.toString(), this._text !== t && (this._text = t, this.onViewUpdate());
  }
  get text() {
    return this._text;
  }
  /**
   * The resolution/device pixel ratio for rendering.
   * Higher values result in sharper text at the cost of performance.
   * Set to null for auto-resolution based on device.
   * @example
   * ```ts
   * const text = new Text({
   *     text: 'Hello Pixi!',
   *     resolution: 2 // High DPI for sharper text
   * });
   * const autoResText = new Text({
   *     text: 'Auto Resolution',
   *     resolution: null // Use device's pixel ratio
   * });
   * ```
   * @default null
   */
  set resolution(t) {
    this._autoResolution = t === null, this._resolution = t, this.onViewUpdate();
  }
  get resolution() {
    return this._resolution;
  }
  get style() {
    return this._style;
  }
  /**
   * The style configuration for the text.
   * Can be a TextStyle instance or a configuration object.
   * Supports canvas text styles, HTML text styles, and bitmap text styles.
   * @example
   * ```ts
   * const text = new Text({
   *     text: 'Styled Text',
   *     style: {
   *         fontSize: 24,
   *         fill: 0xff1010, // Red color
   *         fontFamily: 'Arial',
   *         align: 'center', // Center alignment
   *         stroke: { color: '#4a1850', width: 5 }, // Purple stroke
   *         dropShadow: {
   *             color: '#000000', // Black shadow
   *             blur: 4, // Shadow blur
   *             distance: 6 // Shadow distance
   *         }
   *     }
   * });
   * const htmlText = new HTMLText({
   *     text: 'HTML Styled Text',
   *     style: {
   *         fontSize: '20px',
   *         fill: 'blue',
   *         fontFamily: 'Verdana',
   *     }
   * });
   * const bitmapText = new BitmapText({
   *     text: 'Bitmap Styled Text',
   *     style: {
   *         fontName: 'Arial',
   *         fontSize: 32,
   *     }
   * })
   *
   * // Update style dynamically
   * text.style = {
   *     fontSize: 30, // Change font size
   *     fill: 0x00ff00, // Change color to green
   *     align: 'right', // Change alignment to right
   *     stroke: { color: '#000000', width: 2 }, // Add black stroke
   * }
   */
  set style(t) {
    t || (t = {}), this._style?.off("update", this.onViewUpdate, this), t instanceof this._styleClass ? this._style = t : this._style = new this._styleClass(t), this._style.on("update", this.onViewUpdate, this), this.onViewUpdate();
  }
  /**
   * The width of the sprite, setting this will actually modify the scale to achieve the value set.
   * @example
   * ```ts
   * // Set width directly
   * texture.width = 200;
   * console.log(texture.scale.x); // Scale adjusted to match width
   *
   * // For better performance when setting both width and height
   * texture.setSize(300, 400); // Avoids recalculating bounds twice
   * ```
   */
  get width() {
    return Math.abs(this.scale.x) * this.bounds.width;
  }
  set width(t) {
    this._setWidth(t, this.bounds.width);
  }
  /**
   * The height of the sprite, setting this will actually modify the scale to achieve the value set.
   * @example
   * ```ts
   * // Set height directly
   * texture.height = 200;
   * console.log(texture.scale.y); // Scale adjusted to match height
   *
   * // For better performance when setting both width and height
   * texture.setSize(300, 400); // Avoids recalculating bounds twice
   * ```
   */
  get height() {
    return Math.abs(this.scale.y) * this.bounds.height;
  }
  set height(t) {
    this._setHeight(t, this.bounds.height);
  }
  /**
   * Retrieves the size of the Text as a [Size]{@link Size} object based on the texture dimensions and scale.
   * This is faster than getting width and height separately as it only calculates the bounds once.
   * @example
   * ```ts
   * // Basic size retrieval
   * const text = new Text({
   *     text: 'Hello Pixi!',
   *     style: { fontSize: 24 }
   * });
   * const size = text.getSize();
   * console.log(`Size: ${size.width}x${size.height}`);
   *
   * // Reuse existing size object
   * const reuseSize = { width: 0, height: 0 };
   * text.getSize(reuseSize);
   * ```
   * @param out - Optional object to store the size in, to avoid allocating a new object
   * @returns The size of the Sprite
   * @see {@link Text#width} For getting just the width
   * @see {@link Text#height} For getting just the height
   * @see {@link Text#setSize} For setting both width and height
   */
  getSize(t) {
    return t || (t = {}), t.width = Math.abs(this.scale.x) * this.bounds.width, t.height = Math.abs(this.scale.y) * this.bounds.height, t;
  }
  /**
   * Sets the size of the Text to the specified width and height.
   * This is faster than setting width and height separately as it only recalculates bounds once.
   * @example
   * ```ts
   * // Basic size setting
   * const text = new Text({
   *    text: 'Hello Pixi!',
   *    style: { fontSize: 24 }
   * });
   * text.setSize(100, 200); // Width: 100, Height: 200
   *
   * // Set uniform size
   * text.setSize(100); // Sets both width and height to 100
   *
   * // Set size with object
   * text.setSize({
   *     width: 200,
   *     height: 300
   * });
   * ```
   * @param value - This can be either a number or a {@link Size} object
   * @param height - The height to set. Defaults to the value of `width` if not provided
   * @see {@link Text#width} For setting width only
   * @see {@link Text#height} For setting height only
   */
  setSize(t, e) {
    typeof t == "object" ? (e = t.height ?? t.width, t = t.width) : e ?? (e = t), t !== void 0 && this._setWidth(t, this.bounds.width), e !== void 0 && this._setHeight(e, this.bounds.height);
  }
  /**
   * Checks if the object contains the given point in local coordinates.
   * Uses the text's bounds for hit testing.
   * @example
   * ```ts
   * // Basic point check
   * const localPoint = { x: 50, y: 25 };
   * const contains = text.containsPoint(localPoint);
   * console.log('Point is inside:', contains);
   * ```
   * @param point - The point to check in local coordinates
   * @returns True if the point is within the text's bounds
   * @see {@link Container#toLocal} For converting global coordinates to local
   */
  containsPoint(t) {
    const e = this.bounds.width, s = this.bounds.height, i = -e * this.anchor.x;
    let n = 0;
    return t.x >= i && t.x <= i + e && (n = -s * this.anchor.y, t.y >= n && t.y <= n + s);
  }
  /** @internal */
  onViewUpdate() {
    this.didViewUpdate || (this._didTextUpdate = !0), super.onViewUpdate();
  }
  /**
   * Destroys this text renderable and optionally its style texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * // Destroys the text and its style
   * text.destroy({ style: true, texture: true, textureSource: true });
   * text.destroy(true);
   * text.destroy() // Destroys the text, but not its style
   */
  destroy(t = !1) {
    super.destroy(t), this.owner = null, this._bounds = null, this._anchor = null, (typeof t == "boolean" ? t : t?.style) && this._style.destroy(t), this._style = null, this._text = null;
  }
  /**
   * Returns a unique key for this instance.
   * This key is used for caching.
   * @returns {string} Unique key for the instance
   */
  get styleKey() {
    return `${this._text}:${this._style.styleKey}:${this._resolution}`;
  }
}
function Hl(r, t) {
  let e = r[0] ?? {};
  return (typeof e == "string" || r[1]) && (B(W, `use new ${t}({ text: "hi!", style }) instead`), e = {
    text: e,
    style: r[1]
  }), e;
}
let Nt = null, wt = null;
function Ol(r, t) {
  Nt || (Nt = rt.get().createCanvas(256, 128), wt = Nt.getContext("2d", { willReadFrequently: !0 }), wt.globalCompositeOperation = "copy", wt.globalAlpha = 1), (Nt.width < r || Nt.height < t) && (Nt.width = Zt(r), Nt.height = Zt(t));
}
function xr(r, t, e) {
  for (let s = 0, i = 4 * e * t; s < t; ++s, i += 4)
    if (r[i + 3] !== 0)
      return !1;
  return !0;
}
function br(r, t, e, s, i) {
  const n = 4 * t;
  for (let o = s, a = s * n + 4 * e; o <= i; ++o, a += n)
    if (r[a + 3] !== 0)
      return !1;
  return !0;
}
function Wl(...r) {
  let t = r[0];
  t.canvas || (t = { canvas: r[0], resolution: r[1] });
  const { canvas: e } = t, s = Math.min(t.resolution ?? 1, 1), i = t.width ?? e.width, n = t.height ?? e.height;
  let o = t.output;
  if (Ol(i, n), !wt)
    throw new TypeError("Failed to get canvas 2D context");
  wt.drawImage(
    e,
    0,
    0,
    i,
    n,
    0,
    0,
    i * s,
    n * s
  );
  const h = wt.getImageData(0, 0, i, n).data;
  let l = 0, c = 0, d = i - 1, f = n - 1;
  for (; c < n && xr(h, i, c); )
    ++c;
  if (c === n)
    return j.EMPTY;
  for (; xr(h, i, f); )
    --f;
  for (; br(h, i, l, c, f); )
    ++l;
  for (; br(h, i, d, c, f); )
    --d;
  return ++d, ++f, wt.globalCompositeOperation = "source-over", wt.strokeRect(l, c, d - l, f - c), wt.globalCompositeOperation = "copy", o ?? (o = new j()), o.set(l / s, c / s, (d - l) / s, (f - c) / s), o;
}
const wr = new j();
class Ul {
  /**
   * Creates a canvas with the specified text rendered to it.
   *
   * Generates a canvas of appropriate size, renders the text with the provided style,
   * and returns both the canvas/context and a Rectangle representing the text bounds.
   *
   * When trim is enabled in the style, the frame will represent the bounds of the
   * non-transparent pixels, which can be smaller than the full canvas.
   * @param options - The options for generating the text canvas
   * @param options.text - The text to render
   * @param options.style - The style to apply to the text
   * @param options.resolution - The resolution of the canvas (defaults to 1)
   * @param options.padding
   * @returns An object containing the canvas/context and the frame (bounds) of the text
   */
  getCanvasAndContext(t) {
    const { text: e, style: s, resolution: i = 1 } = t, n = s._getFinalPadding(), o = jt.measureText(e || " ", s), a = Math.ceil(Math.ceil(Math.max(1, o.width) + n * 2) * i), h = Math.ceil(Math.ceil(Math.max(1, o.height) + n * 2) * i), l = qs.getOptimalCanvasAndContext(a, h);
    this._renderTextToCanvas(e, s, n, i, l);
    const c = s.trim ? Wl({ canvas: l.canvas, width: a, height: h, resolution: 1, output: wr }) : wr.set(0, 0, a, h);
    return {
      canvasAndContext: l,
      frame: c
    };
  }
  /**
   * Returns a canvas and context to the pool.
   *
   * This should be called when you're done with the canvas to allow reuse
   * and prevent memory leaks.
   * @param canvasAndContext - The canvas and context to return to the pool
   */
  returnCanvasAndContext(t) {
    qs.returnCanvasAndContext(t);
  }
  /**
   * Renders text to its canvas, and updates its texture.
   * @param text - The text to render
   * @param style - The style of the text
   * @param padding - The padding of the text
   * @param resolution - The resolution of the text
   * @param canvasAndContext - The canvas and context to render the text to
   */
  _renderTextToCanvas(t, e, s, i, n) {
    const { canvas: o, context: a } = n, h = Sn(e), l = jt.measureText(t || " ", e), c = l.lines, d = l.lineHeight, f = l.lineWidths, u = l.maxLineWidth, p = l.fontProperties, m = o.height;
    if (a.resetTransform(), a.scale(i, i), a.textBaseline = e.textBaseline, e._stroke?.width) {
      const b = e._stroke;
      a.lineWidth = b.width, a.miterLimit = b.miterLimit, a.lineJoin = b.join, a.lineCap = b.cap;
    }
    a.font = h;
    let g, x;
    const y = e.dropShadow ? 2 : 1;
    for (let b = 0; b < y; ++b) {
      const w = e.dropShadow && b === 0, S = w ? Math.ceil(Math.max(1, m) + s * 2) : 0, _ = S * i;
      if (w) {
        a.fillStyle = "black", a.strokeStyle = "black";
        const k = e.dropShadow, P = k.color, M = k.alpha;
        a.shadowColor = V.shared.setValue(P).setAlpha(M).toRgbaString();
        const R = k.blur * i, L = k.distance * i;
        a.shadowBlur = R, a.shadowOffsetX = Math.cos(k.angle) * L, a.shadowOffsetY = Math.sin(k.angle) * L + _;
      } else {
        if (a.fillStyle = e._fill ? yr(e._fill, a, l, s * 2) : null, e._stroke?.width) {
          const k = e._stroke.width * 0.5 + s * 2;
          a.strokeStyle = yr(e._stroke, a, l, k);
        }
        a.shadowColor = "black";
      }
      let v = (d - p.fontSize) / 2;
      d - p.fontSize < 0 && (v = 0);
      const T = e._stroke?.width ?? 0;
      for (let k = 0; k < c.length; k++)
        g = T / 2, x = T / 2 + k * d + p.ascent + v, e.align === "right" ? g += u - f[k] : e.align === "center" && (g += (u - f[k]) / 2), e._stroke?.width && this._drawLetterSpacing(
          c[k],
          e,
          n,
          g + s,
          x + s - S,
          !0
        ), e._fill !== void 0 && this._drawLetterSpacing(
          c[k],
          e,
          n,
          g + s,
          x + s - S
        );
    }
  }
  /**
   * Render the text with letter-spacing.
   *
   * This method handles rendering text with the correct letter spacing, using either:
   * 1. Native letter spacing if supported by the browser
   * 2. Manual letter spacing calculation if not natively supported
   *
   * For manual letter spacing, it calculates the position of each character
   * based on its width and the desired spacing.
   * @param text - The text to draw
   * @param style - The text style to apply
   * @param canvasAndContext - The canvas and context to draw to
   * @param x - Horizontal position to draw the text
   * @param y - Vertical position to draw the text
   * @param isStroke - Whether to render the stroke (true) or fill (false)
   * @private
   */
  _drawLetterSpacing(t, e, s, i, n, o = !1) {
    const { context: a } = s, h = e.letterSpacing;
    let l = !1;
    if (jt.experimentalLetterSpacingSupported && (jt.experimentalLetterSpacing ? (a.letterSpacing = `${h}px`, a.textLetterSpacing = `${h}px`, l = !0) : (a.letterSpacing = "0px", a.textLetterSpacing = "0px")), h === 0 || l) {
      o ? a.strokeText(t, i, n) : a.fillText(t, i, n);
      return;
    }
    let c = i;
    const d = jt.graphemeSegmenter(t);
    let f = a.measureText(t).width, u = 0;
    for (let p = 0; p < d.length; ++p) {
      const m = d[p];
      o ? a.strokeText(m, c, n) : a.fillText(m, c, n);
      let g = "";
      for (let x = p + 1; x < d.length; ++x)
        g += d[x];
      u = a.measureText(g).width, c += f - u + h, f = u;
    }
  }
}
const _r = new Ul();
class Se extends Xl {
  constructor(...t) {
    const e = Hl(t, "Text");
    super(e, Xn), this.renderPipeId = "text", e.textureStyle && (this.textureStyle = e.textureStyle instanceof Ve ? e.textureStyle : new Ve(e.textureStyle));
  }
  /** @private */
  updateBounds() {
    const t = this._bounds, e = this._anchor;
    let s = 0, i = 0;
    if (this._style.trim) {
      const { frame: n, canvasAndContext: o } = _r.getCanvasAndContext({
        text: this.text,
        style: this._style,
        resolution: 1
      });
      _r.returnCanvasAndContext(o), s = n.width, i = n.height;
    } else {
      const n = jt.measureText(
        this._text,
        this._style
      );
      s = n.width, i = n.height;
    }
    t.minX = -e._x * s, t.maxX = t.minX + s, t.minY = -e._y * i, t.maxY = t.minY + i;
  }
}
class hi extends D {
  /**
   * Creates a RenderTexture. Pass `dynamic: true` in options to allow resizing after creation.
   * @param options - Options for the RenderTexture, including width, height, and dynamic.
   * @returns A new RenderTexture instance.
   * @example
   * const rt = RenderTexture.create({ width: 100, height: 100, dynamic: true });
   * rt.resize(500, 500);
   */
  static create(t) {
    const { dynamic: e, ...s } = t;
    return new hi({
      source: new lt(s),
      dynamic: e ?? !1
    });
  }
  /**
   * Resizes the render texture.
   * @param width - The new width of the render texture.
   * @param height - The new height of the render texture.
   * @param resolution - The new resolution of the render texture.
   * @returns This texture.
   */
  resize(t, e, s) {
    return this.source.resize(t, e, s), this;
  }
}
ht.add(Un, $n);
class is {
  g = new tt();
  active = !1;
  start = { x: 0, y: 0 };
  last = { x: 0, y: 0 };
  previewLayer;
  constructor(t) {
    this.previewLayer = t;
  }
  begin(t) {
    this.active = !0, this.start = t, this.last = t, this.previewLayer.addChild(this.g), this.redraw(t, t);
  }
  update(t) {
    this.active && (this.last = t, this.redraw(this.start, t));
  }
  end() {
    if (!this.active) return null;
    const t = this.getRect();
    return this.clear(), t;
  }
  cancel() {
    this.clear();
  }
  // Expose read-only access to the underlying graphics so external
  // controllers can draw auxiliary UI (e.g., hover highlights).
  get graphics() {
    return this.g;
  }
  getRect() {
    const t = Math.min(this.start.x, this.last.x), e = Math.min(this.start.y, this.last.y), s = Math.abs(this.last.x - this.start.x), i = Math.abs(this.last.y - this.start.y);
    return { x: t, y: e, w: s, h: i };
  }
  clear() {
    this.active && (this.active = !1, this.previewLayer.removeChild(this.g), this.g.clear());
  }
}
class We extends is {
  shiftKey = !1;
  setShiftKey(t) {
    this.shiftKey = t, this.active && this.redraw(this.start, this.last);
  }
  redraw(t, e) {
    let s = this.getRect();
    if (this.shiftKey) {
      const i = Math.max(s.w, s.h);
      s.w < s.h ? (e.x < t.x && (s.x = t.x - i), s.w = i) : (e.y < t.y && (s.y = t.y - i), s.h = i);
    }
    this.g.clear(), this.g.rect(s.x, s.y, s.w, s.h), this.g.fill({ color: 0, alpha: 0.08 }), this.g.rect(s.x, s.y, s.w, s.h), this.g.stroke({ color: 779878, alpha: 0.8, width: 1 });
  }
}
class $l extends is {
  shiftKey = !1;
  setShiftKey(t) {
    this.shiftKey = t, this.active && this.redraw(this.start, this.last);
  }
  redraw(t, e) {
    const s = this.getRect(), i = s.x + s.w / 2, n = s.y + s.h / 2;
    let o = s.w, a = s.h, h = i, l = n;
    if (this.shiftKey) {
      const c = Math.max(s.w, s.h);
      o = c, a = c, s.w < s.h ? h = t.x + (e.x - t.x) / 2 : l = t.y + (e.y - t.y) / 2;
    }
    this.g.clear(), this.g.ellipse(h, l, o / 2, a / 2), this.g.fill({ color: 0, alpha: 0.08 }), this.g.stroke({ color: 779878, alpha: 0.8, width: 1 });
  }
}
class jl extends is {
  shiftKey = !1;
  setShiftKey(t) {
    this.shiftKey = t, this.active && this.redraw(this.start, this.last);
  }
  redraw(t, e) {
    let s = e.x, i = e.y;
    if (this.shiftKey) {
      const n = this.snapPointTo45(t, e);
      s = n.x, i = n.y;
    }
    this.g.clear(), this.g.moveTo(t.x, t.y), this.g.lineTo(s, i), this.g.stroke({ color: 779878, alpha: 0.8, width: 2 });
  }
  snapPointTo45(t, e) {
    const s = e.x - t.x, i = e.y - t.y, n = Math.hypot(s, i);
    if (n === 0) return { x: t.x, y: t.y };
    const o = Math.atan2(i, s), a = Math.PI / 4, h = Math.round(o / a) * a;
    return {
      x: t.x + Math.cos(h) * n,
      y: t.y + Math.sin(h) * n
    };
  }
}
class Vl extends is {
  redraw(t, e) {
    const s = this.getRect(), i = Math.min(s.w, s.h), n = s.x + s.w / 2, o = s.y + s.h / 2, a = 5, h = i / 2, l = h * 0.5;
    this.g.clear();
    const c = [];
    for (let d = 0; d < a * 2; d++) {
      const f = d % 2 === 0 ? h : l, u = d * Math.PI / a - Math.PI / 2;
      c.push(
        n + Math.cos(u) * f,
        o + Math.sin(u) * f
      );
    }
    this.g.poly(c), this.g.fill({ color: 0, alpha: 0.08 }), this.g.stroke({ color: 779878, alpha: 0.8, width: 1 });
  }
}
class G extends q {
  id;
  type;
  name;
  style;
  locked;
  _width = 0;
  _height = 0;
  constructor(t) {
    super(), this.id = t.id ?? crypto.randomUUID(), this.type = t.type, this.name = t.name ?? this.defaultNameForType(t.type), this.style = t.style ?? {
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 1,
      opacity: 1
    }, this.visible = t.visible ?? !0, this.locked = t.locked ?? !1, (t.x !== void 0 || t.y !== void 0) && this.position.set(t.x ?? 0, t.y ?? 0), t.rotation !== void 0 && (this.rotation = t.rotation), t.scale !== void 0 && (typeof t.scale == "number" ? this.scale.set(t.scale, t.scale) : this.scale.set(t.scale.x, t.scale.y));
  }
  defaultNameForType(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  get width() {
    return this._width;
  }
  set width(t) {
    this._width = t;
    const e = this;
    typeof e.redraw == "function" && e.graphics && e.redraw();
  }
  get height() {
    return this._height;
  }
  set height(t) {
    this._height = t;
    const e = this;
    typeof e.redraw == "function" && e.graphics && e.redraw();
  }
  // Transform convenience methods
  setPosition(t, e) {
    return this.position.set(t, e), this;
  }
  setScale(t, e = t) {
    return this.scale.set(t, e), this;
  }
  setRotation(t) {
    return this.rotation = t, this;
  }
  setPivot(t, e) {
    return this.pivot.set(t, e), this;
  }
  translate(t, e) {
    return this.position.x += t, this.position.y += e, this;
  }
  // Reset transform
  resetTransform() {
    return this.position.set(0, 0), this.scale.set(1, 1), this.rotation = 0, this.pivot.set(0, 0), this;
  }
  // Override in subclasses to return a deep clone; offset is applied to position
  // Default implementation throws to surface missing overrides.
  clone(t = 0, e = 0) {
    throw new Error(`clone() not implemented for ${this.type}`);
  }
  toColorString(t) {
    return t === void 0 ? null : typeof t == "string" ? t : `#${Math.round(t).toString(16).padStart(6, "0")}`;
  }
  getProps() {
    const t = this.parent ? this.parent.toGlobal(new C(this.position.x, this.position.y)) : new C(this.position.x, this.position.y);
    return [
      {
        name: "Name",
        key: "name",
        type: "string",
        value: this.name,
        desc: "Display name",
        group: "Meta"
      },
      {
        name: "Visible",
        key: "visible",
        type: "boolean",
        value: this.visible,
        desc: "Toggle visibility",
        group: "Meta"
      },
      {
        name: "Locked",
        key: "locked",
        type: "boolean",
        value: this.locked,
        desc: "Lock editing",
        group: "Meta"
      },
      {
        name: "X",
        key: "x",
        type: "int",
        value: Math.round(t.x),
        desc: "X position",
        group: "Transform"
      },
      {
        name: "Y",
        key: "y",
        type: "int",
        value: Math.round(t.y),
        desc: "Y position",
        group: "Transform"
      },
      {
        name: "Width",
        key: "width",
        type: "int",
        value: this.width,
        desc: "Width",
        min: 0,
        group: "Transform"
      },
      {
        name: "Height",
        key: "height",
        type: "int",
        value: this.height,
        desc: "Height",
        min: 0,
        group: "Transform"
      },
      {
        name: "Scale X",
        key: "scaleX",
        type: "float",
        value: this.scale.x,
        desc: "Horizontal scale",
        group: "Transform"
      },
      {
        name: "Scale Y",
        key: "scaleY",
        type: "float",
        value: this.scale.y,
        desc: "Vertical scale",
        group: "Transform"
      },
      {
        name: "Rotation",
        key: "rotation",
        type: "float",
        value: this.rotation,
        desc: "Rotation (radians)",
        group: "Transform"
      },
      {
        name: "Fill",
        key: "fill",
        type: "color",
        value: this.toColorString(this.style.fill),
        desc: "Fill color",
        group: "Appearance"
      },
      {
        name: "Stroke",
        key: "stroke",
        type: "color",
        value: this.toColorString(this.style.stroke),
        desc: "Stroke color",
        group: "Appearance"
      },
      {
        name: "Stroke Width",
        key: "strokeWidth",
        type: "int",
        value: Math.max(0, Math.round(this.style.strokeWidth ?? 1)),
        desc: "Stroke width",
        min: 0,
        step: 1,
        group: "Appearance"
      },
      {
        name: "Opacity",
        key: "opacity",
        type: "float",
        value: this.style.opacity ?? 1,
        desc: "Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        group: "Appearance"
      }
    ];
  }
  getInspectable() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      props: this.getProps()
    };
  }
}
class ql {
  mode = "none";
  startPoint = null;
  startState = null;
  activeNode = null;
  activeHandle = null;
  constructor() {
  }
  startTransform(t, e, s) {
    this.activeNode = t, this.startPoint = e, this.activeHandle = s ?? null, this.startState = {
      x: t.x,
      y: t.y,
      width: t.width,
      height: t.height,
      rotation: t.rotation,
      parent: t.parent ?? null
    }, !s || s === "move" ? this.mode = "move" : s === "rotate" ? this.mode = "rotate" : this.mode = "resize";
  }
  updateTransform(t, e = !1) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;
    const s = this.toParentPoint(this.startPoint, this.startState.parent), i = this.toParentPoint(t, this.startState.parent), n = i.x - s.x, o = i.y - s.y;
    switch (this.mode) {
      case "move":
        this.activeNode.position.set(
          Math.round(this.startState.x + n),
          Math.round(this.startState.y + o)
        );
        break;
      case "rotate": {
        const a = this.startState.width, h = this.startState.height, l = this.startState.rotation, c = Math.cos(l), d = Math.sin(l), f = this.startState.x + a / 2 * c - h / 2 * d, u = this.startState.y + a / 2 * d + h / 2 * c, p = new C(f, u), m = Math.atan2(
          s.y - p.y,
          s.x - p.x
        ), g = Math.atan2(
          i.y - p.y,
          i.x - p.x
        ), x = this.startState.rotation + (g - m);
        this.activeNode.rotation = x;
        const y = Math.cos(x), b = Math.sin(x), w = -a / 2 * y + h / 2 * b, S = -a / 2 * b - h / 2 * y;
        this.activeNode.position.set(
          Math.round(p.x + w),
          Math.round(p.y + S)
        );
        break;
      }
      case "resize": {
        if (!this.activeHandle) break;
        const a = 10, h = this.startState.x + this.startState.width, l = this.startState.y + this.startState.height, c = this.startState.x + this.startState.width / 2, d = this.startState.y + this.startState.height / 2;
        let f = this.startState.width, u = this.startState.height, p = this.startState.x, m = this.startState.y;
        const g = this.activeHandle.includes("left"), x = this.activeHandle.includes("right"), y = this.activeHandle.includes("top"), b = this.activeHandle.includes("bottom");
        if (x && (f = this.startState.width + n), g && (f = this.startState.width - n, p = this.startState.x + n), b && (u = this.startState.height + o), y && (u = this.startState.height - o, m = this.startState.y + o), e) {
          const w = this.startState.width / Math.max(1, this.startState.height), S = g || x, _ = y || b;
          if (S && _) {
            const v = Math.max(a, f), T = Math.max(a, u);
            Math.abs(v / w - T) > Math.abs(T * w - v) ? u = v / w : f = T * w, g && (p = h - f), y && (m = l - u);
          } else S ? (u = f / w, m = d - u / 2) : _ && (f = u * w, p = c - f / 2);
        }
        f < a && (f = a, g && (p = h - f)), u < a && (u = a, y && (m = l - u)), this.activeNode.width = Math.round(f), this.activeNode.height = Math.round(u), this.activeNode.position.set(Math.round(p), Math.round(m));
        break;
      }
    }
  }
  endTransform() {
    this.mode = "none", this.startPoint = null, this.startState = null, this.activeNode = null, this.activeHandle = null;
  }
  toParentPoint(t, e) {
    return e ? e.toLocal(t) : t.clone();
  }
}
class Kl {
  activeNode = null;
  startPoint = null;
  activeHandle = null;
  startState = null;
  startTransform(t, e, s) {
    this.activeNode = t, this.startPoint = e, this.activeHandle = s, this.startState = {
      startX: t.startX,
      startY: t.startY,
      endX: t.endX,
      endY: t.endY,
      x: t.x,
      y: t.y,
      parent: t.parent ?? null,
      startWorld: t.parent ? t.parent.toGlobal(new C(t.x + t.startX, t.y + t.startY)) : new C(t.x + t.startX, t.y + t.startY),
      endWorld: t.parent ? t.parent.toGlobal(new C(t.x + t.endX, t.y + t.endY)) : new C(t.x + t.endX, t.y + t.endY)
    };
  }
  updateTransform(t, e = !1) {
    if (!this.activeNode || !this.startPoint || !this.startState) return;
    const s = this.startPoint, i = t.x - s.x, n = t.y - s.y;
    if (this.activeHandle === "start") {
      const o = this.startState.endWorld;
      let a = new C(this.startState.startWorld.x + i, this.startState.startWorld.y + n);
      if (e) {
        const h = this.snapPointTo45(o.x, o.y, a.x, a.y);
        a = new C(h.x, h.y);
      }
      this.applyWorldEndpoints(a, o), this.activeNode.refresh();
    } else if (this.activeHandle === "end") {
      const o = this.startState.startWorld;
      let a = new C(this.startState.endWorld.x + i, this.startState.endWorld.y + n);
      if (e) {
        const h = this.snapPointTo45(o.x, o.y, a.x, a.y);
        a = new C(h.x, h.y);
      }
      this.applyWorldEndpoints(o, a), this.activeNode.refresh();
    } else if (this.activeHandle === "move") {
      const o = this.startState.parent;
      let a = i, h = n;
      if (o) {
        const l = o.toLocal(this.startPoint), c = o.toLocal(t);
        a = c.x - l.x, h = c.y - l.y;
      }
      this.activeNode.position.set(
        Math.round(this.startState.x + a),
        Math.round(this.startState.y + h)
      ), this.activeNode.startX = this.startState.startX, this.activeNode.startY = this.startState.startY, this.activeNode.endX = this.startState.endX, this.activeNode.endY = this.startState.endY, this.activeNode.refresh();
    }
  }
  endTransform() {
    this.activeNode = null, this.startPoint = null, this.activeHandle = null, this.startState = null;
  }
  snapPointTo45(t, e, s, i) {
    const n = s - t, o = i - e, a = Math.hypot(n, o);
    if (a === 0) return { x: t, y: e };
    const h = Math.atan2(o, n), l = Math.PI / 4, c = Math.round(h / l) * l;
    return {
      x: t + Math.cos(c) * a,
      y: e + Math.sin(c) * a
    };
  }
  applyWorldEndpoints(t, e) {
    if (!this.activeNode || !this.startState) return;
    const s = this.startState.parent, i = s ? s.toLocal(t) : t, n = s ? s.toLocal(e) : e, o = Math.round(i.x), a = Math.round(i.y), h = Math.round(n.x), l = Math.round(n.y);
    this.activeNode.position.set(o, a), this.activeNode.startX = 0, this.activeNode.startY = 0, this.activeNode.endX = h - o, this.activeNode.endY = l - a;
  }
}
class st extends G {
  type = "group";
  constructor(t) {
    super({
      id: t.id,
      type: "group",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), t.children.forEach((s) => {
      this.addChild(s);
    });
    const e = this.getBounds();
    this._width = e.width, this._height = e.height;
  }
  // Override width/height to always reflect current bounds
  get width() {
    return this.getBounds().width;
  }
  get height() {
    return this.getBounds().height;
  }
  // Setting width/height scales the group so children maintain relative layout.
  set width(t) {
    const e = this.getBounds().width || 1, s = t / e;
    this.scale.x *= s;
  }
  set height(t) {
    const e = this.getBounds().height || 1, s = t / e;
    this.scale.y *= s;
  }
  clone(t = 0, e = 0) {
    const s = this.children.filter((i) => i instanceof G).map((i) => i.clone(0, 0));
    return new st({
      children: s,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked
    });
  }
}
class $ extends G {
  type = "frame";
  backgroundGraphics;
  clipGraphics;
  _backgroundColor;
  _clipContent;
  constructor(t) {
    super({
      id: t.id,
      type: "frame",
      name: t.name,
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this._width = t.width, this._height = t.height, this._backgroundColor = t.backgroundColor ?? "#ffffff", this._clipContent = t.clipContent ?? !0, this.backgroundGraphics = new tt(), this.clipGraphics = new tt(), this.addChild(this.backgroundGraphics), this.addChild(this.clipGraphics), this.redraw(), t.children?.forEach((e) => {
      this.addChild(e);
    });
  }
  redraw() {
    const t = this.style.opacity ?? 1;
    if (this.backgroundGraphics.clear(), this.backgroundGraphics.rect(0, 0, this.width, this.height), this._backgroundColor !== null) {
      const e = parseInt(this._backgroundColor.replace("#", ""), 16);
      this.backgroundGraphics.fill({
        color: e,
        alpha: t
      });
    }
    this.clipGraphics.clear(), this.clipGraphics.rect(0, 0, this.width, this.height), this.clipGraphics.fill({ color: 16777215, alpha: 1 }), this.mask = this._clipContent ? this.clipGraphics : null;
  }
  get width() {
    return this._width;
  }
  set width(t) {
    this._width = t, this.redraw();
  }
  get height() {
    return this._height;
  }
  set height(t) {
    this._height = t, this.redraw();
  }
  setStyle(t) {
    return this.style = { ...this.style, ...t }, t.fill !== void 0 && this.setBackgroundColor(t.fill === null ? null : String(t.fill)), this.redraw(), this;
  }
  get backgroundColor() {
    return this._backgroundColor;
  }
  setBackgroundColor(t) {
    return this._backgroundColor = t, this.redraw(), this;
  }
  get clipContent() {
    return this._clipContent;
  }
  setClipContent(t) {
    return this._clipContent = t, this.redraw(), this;
  }
  getProps() {
    return [
      ...super.getProps().filter((e) => e.key !== "fill" && e.key !== "stroke" && e.key !== "strokeWidth"),
      {
        name: "Background Color",
        key: "backgroundColor",
        type: "color",
        value: this.backgroundColor,
        desc: "Frame background color (null = transparent)",
        group: "Appearance"
      },
      {
        name: "Clip Content",
        key: "clipContent",
        type: "boolean",
        value: this.clipContent,
        desc: "Mask children to frame bounds",
        group: "Appearance"
      }
    ];
  }
  clone(t = 0, e = 0) {
    const s = this.children.filter((i) => i instanceof G).map((i) => i.clone(0, 0));
    return new $({
      name: this.name,
      width: this.width,
      height: this.height,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked,
      backgroundColor: this.backgroundColor,
      clipContent: this.clipContent,
      children: s
    });
  }
}
class Xt {
  static generateLayerName(t) {
    return {
      rectangle: "Rectangle",
      ellipse: "Ellipse",
      line: "Line",
      star: "Star",
      text: "Text",
      image: "Image",
      group: "Group",
      frame: "Frame"
    }[t.type] || "Layer";
  }
  static getHierarchy(t) {
    const e = (i) => i.type === "group" || i.type === "frame", s = (i) => {
      if (!(i instanceof G))
        return {
          id: "root",
          type: "root",
          name: "Root",
          visible: i.visible,
          locked: !1,
          children: i.children.filter((o) => o instanceof G).map((o) => s(o)).reverse()
        };
      const n = {
        id: i.id,
        type: i.type,
        name: Xt.generateLayerName(i),
        visible: i.visible,
        locked: i.locked
      };
      return e(i) && i.children.length > 0 && (n.children = i.children.filter((o) => o instanceof G).map((o) => s(o)).reverse()), n;
    };
    return s(t);
  }
}
class Zl {
  selectedNodes = /* @__PURE__ */ new Set();
  isMultiSelect = !1;
  selectionGraphics;
  transformController;
  lineTransformController;
  shiftKey = !1;
  eventTarget;
  propertiesChangedRafId = null;
  objectSnapEnabled = !0;
  objectSnapThreshold = 6;
  snapCandidatesCache = null;
  singleMoveTransform = null;
  singleResizeTransform = null;
  multiTransform = null;
  constructor(t, e) {
    this.transformController = new ql(), this.lineTransformController = new Kl(), this.eventTarget = e, this.selectionGraphics = new tt(), t.addChild(this.selectionGraphics);
  }
  startTransform(t, e) {
    if (this.selectedNodes.size === 0) return;
    const s = Array.from(this.selectedNodes);
    if (s.some((n) => !n.visible || n.locked))
      return;
    if (this.selectedNodes.size > 1) {
      this.snapCandidatesCache = this.objectSnapEnabled ? this.buildSnapCandidates(new Set(s)) : null;
      const n = !e || e === "move" ? "move" : "resize", o = this.getSelectedBoundsInParentSpace();
      if (!Number.isFinite(o.width) || !Number.isFinite(o.height)) {
        this.snapCandidatesCache = null;
        return;
      }
      this.multiTransform = {
        mode: n,
        handle: e,
        startPoint: t.clone(),
        startBounds: o,
        nodes: Array.from(this.selectedNodes).map((a) => ({
          node: a,
          x: a.position.x,
          y: a.position.y,
          width: a.width,
          height: a.height,
          line: a.type === "line" ? {
            startX: a.startX,
            startY: a.startY,
            endX: a.endX,
            endY: a.endY
          } : void 0
        }))
      };
      return;
    }
    const i = Array.from(this.selectedNodes)[0];
    if (i) {
      if (i.type === "frame" && e === "rotate") {
        this.snapCandidatesCache = null;
        return;
      }
      if (this.singleMoveTransform = null, this.singleResizeTransform = null, e === "move" && i.type !== "line") {
        this.snapCandidatesCache = this.objectSnapEnabled ? this.buildSnapCandidates(/* @__PURE__ */ new Set([i])) : null, this.singleMoveTransform = {
          node: i,
          startPoint: t.clone(),
          startX: i.position.x,
          startY: i.position.y,
          startBounds: this.getNodeBoundsInParentSpace(i)
        };
        return;
      }
      if (i.type !== "line" && e && e !== "move" && e !== "rotate") {
        this.snapCandidatesCache = this.objectSnapEnabled ? this.buildSnapCandidates(/* @__PURE__ */ new Set([i])) : null, this.singleResizeTransform = {
          node: i,
          startPoint: t.clone(),
          startState: {
            x: i.position.x,
            y: i.position.y,
            width: i.width,
            height: i.height
          },
          handle: e
        };
        return;
      }
      i.type === "line" ? (this.snapCandidatesCache = null, (e === "start" || e === "end" || e === "move") && this.lineTransformController.startTransform(
        i,
        t,
        e
      )) : (this.snapCandidatesCache = null, this.transformController.startTransform(i, t, e));
    }
  }
  updateTransform(t) {
    if (this.selectedNodes.size === 0) return;
    if (this.multiTransform) {
      this.updateMultiTransform(t), this.updateSelectionVisuals(), this.schedulePropertiesChanged();
      return;
    }
    if (this.singleMoveTransform) {
      const s = this.singleMoveTransform, i = this.getDeltaInParentSpace(s.node.parent, s.startPoint, t);
      let n = i.x, o = i.y;
      if (this.objectSnapEnabled) {
        const a = this.getSnappedMoveDelta(
          s.startBounds,
          n,
          o,
          /* @__PURE__ */ new Set([s.node])
        );
        n = a.dx, o = a.dy;
      }
      s.node.position.set(Math.round(s.startX + n), Math.round(s.startY + o)), this.updateSelectionVisuals(), this.schedulePropertiesChanged();
      return;
    }
    if (this.singleResizeTransform) {
      this.updateSingleResizeTransform(t), this.updateSelectionVisuals(), this.schedulePropertiesChanged();
      return;
    }
    if (this.selectedNodes.size !== 1) return;
    Array.from(this.selectedNodes)[0]?.type === "line" ? this.lineTransformController.updateTransform(t, this.shiftKey) : this.transformController.updateTransform(t, this.shiftKey), this.updateSelectionVisuals(), this.schedulePropertiesChanged();
  }
  endTransform() {
    if (this.selectedNodes.size !== 0) {
      if (this.multiTransform)
        this.multiTransform = null;
      else if (this.singleMoveTransform)
        this.singleMoveTransform = null;
      else if (this.singleResizeTransform)
        this.singleResizeTransform = null;
      else if (this.selectedNodes.size === 1)
        Array.from(this.selectedNodes)[0]?.type === "line" ? this.lineTransformController.endTransform() : this.transformController.endTransform();
      else
        return;
      this.snapCandidatesCache = null, this.cancelScheduledPropertiesChanged(), this.updateSelectionVisuals(), this.dispatchPropertiesChanged(), this.dispatchSelectionChanged();
    }
  }
  hitTestHandle(t) {
    if (this.selectedNodes.size === 0) return null;
    if (this.selectedNodes.size > 1) {
      const s = this.getSelectedBoundsInParentSpace(), n = 12 / this.getWorldScale(), o = [
        { x: s.x, y: s.y, name: "top-left" },
        { x: s.x + s.width / 2, y: s.y, name: "top" },
        { x: s.x + s.width, y: s.y, name: "top-right" },
        { x: s.x + s.width, y: s.y + s.height / 2, name: "right" },
        { x: s.x + s.width, y: s.y + s.height, name: "bottom-right" },
        { x: s.x + s.width / 2, y: s.y + s.height, name: "bottom" },
        { x: s.x, y: s.y + s.height, name: "bottom-left" },
        { x: s.x, y: s.y + s.height / 2, name: "left" }
      ];
      for (const a of o)
        if (Math.abs(t.x - a.x) < n && Math.abs(t.y - a.y) < n)
          return a.name;
      return t.x >= s.x && t.x <= s.x + s.width && t.y >= s.y && t.y <= s.y + s.height ? "move" : null;
    }
    const e = Array.from(this.selectedNodes)[0];
    if (e.type === "line") {
      const s = e, i = this.getWorldScale(), n = 12 / i, o = 10 / i, { startX: a, startY: h, endX: l, endY: c } = this.getLineEndpointsInSelectionSpace(s);
      if (Math.abs(t.x - a) < n && Math.abs(t.y - h) < n)
        return "start";
      if (Math.abs(t.x - l) < n && Math.abs(t.y - c) < n)
        return "end";
      const d = Math.sqrt(Math.pow(l - a, 2) + Math.pow(c - h, 2));
      if (Math.abs(
        (c - h) * t.x - (l - a) * t.y + l * h - c * a
      ) / d < o)
        return "move";
      const u = (a + l) / 2, p = (h + c) / 2;
      if (Math.abs(t.x - u) < n && Math.abs(t.y - p) < n)
        return "move";
    } else {
      if (e.type === "frame" || e.parent instanceof st || e.parent instanceof $) {
        const b = this.getNodeBoundsInSelectionSpace(e), S = 12 / this.getWorldScale(), _ = [
          { x: b.x, y: b.y, name: "top-left" },
          { x: b.x + b.width / 2, y: b.y, name: "top" },
          { x: b.x + b.width, y: b.y, name: "top-right" },
          { x: b.x + b.width, y: b.y + b.height / 2, name: "right" },
          { x: b.x + b.width, y: b.y + b.height, name: "bottom-right" },
          { x: b.x + b.width / 2, y: b.y + b.height, name: "bottom" },
          { x: b.x, y: b.y + b.height, name: "bottom-left" },
          { x: b.x, y: b.y + b.height / 2, name: "left" }
        ];
        for (const v of _)
          if (Math.abs(t.x - v.x) < S && Math.abs(t.y - v.y) < S)
            return v.name;
        return t.x >= b.x && t.x <= b.x + b.width && t.y >= b.y && t.y <= b.y + b.height ? "move" : null;
      }
      const s = e.width, i = e.height, n = e.rotation, o = Math.cos(n), a = Math.sin(n), h = e.position.x + s / 2 * o - i / 2 * a, l = e.position.y + s / 2 * a + i / 2 * o, c = t.x - h, d = t.y - l, f = c * o + d * a, u = -c * a + d * o, p = this.getWorldScale(), m = 12 / p, g = 20 / p, x = new C(0, -i / 2 - g);
      if (Math.abs(f - x.x) < m && Math.abs(u - x.y) < m)
        return "rotate";
      const y = [
        { x: -s / 2, y: -i / 2, name: "top-left" },
        { x: 0, y: -i / 2, name: "top" },
        { x: s / 2, y: -i / 2, name: "top-right" },
        { x: s / 2, y: 0, name: "right" },
        { x: s / 2, y: i / 2, name: "bottom-right" },
        { x: 0, y: i / 2, name: "bottom" },
        { x: -s / 2, y: i / 2, name: "bottom-left" },
        { x: -s / 2, y: 0, name: "left" }
      ];
      for (const b of y)
        if (Math.abs(f - b.x) < m && Math.abs(u - b.y) < m)
          return b.name;
      if (f >= -s / 2 && f <= s / 2 && u >= -i / 2 && u <= i / 2)
        return "move";
    }
    return null;
  }
  setMultiSelect(t) {
    this.isMultiSelect = t;
  }
  setShiftKey(t) {
    this.shiftKey = t;
  }
  setObjectSnapEnabled(t) {
    this.objectSnapEnabled = t, t || (this.snapCandidatesCache = null);
  }
  getSelectionParent() {
    return Array.from(this.selectedNodes)[0]?.parent ?? null;
  }
  select(t) {
    if (this.snapCandidatesCache = null, this.isMultiSelect || this.selectedNodes.clear(), t && t.visible && !t.locked)
      if (this.isMultiSelect) {
        const e = this.getSelectionParent();
        e && t.parent !== e ? (this.selectedNodes.clear(), this.selectedNodes.add(t)) : this.selectedNodes.has(t) ? this.selectedNodes.delete(t) : this.selectedNodes.add(t);
      } else
        this.selectedNodes.add(t);
    this.updateSelectionVisuals(), this.dispatchSelectionChanged();
  }
  selectMany(t) {
    this.snapCandidatesCache = null, this.selectedNodes.clear();
    const e = t.filter((s) => s && s.visible && !s.locked);
    if (e.length) {
      const s = e[0].parent, i = e.filter((n) => n.parent === s);
      i.length !== e.length ? this.selectedNodes.add(i[0]) : i.forEach((n) => this.selectedNodes.add(n));
    }
    this.updateSelectionVisuals(), this.dispatchSelectionChanged();
  }
  createGroup() {
    if (this.selectedNodes.size < 2) return;
    const t = Array.from(this.selectedNodes);
    if (t.some((c) => c instanceof $)) return;
    const e = t[0].parent;
    if (!e || t.some((c) => c.parent !== e)) return;
    const s = t.map((c) => ({ n: c, idx: e.getChildIndex(c) })).sort((c, d) => c.idx - d.idx).map((c) => c.n), i = s.length ? Math.min(...s.map((c) => e.getChildIndex(c))) : e.children.length, { minX: n, minY: o } = s.map((c) => this.getNodeBoundsInParentSpace(c)).reduce(
      (c, d) => ({
        minX: Math.min(c.minX, d.x),
        minY: Math.min(c.minY, d.y)
      }),
      { minX: 1 / 0, minY: 1 / 0 }
    ), a = new st({
      children: [],
      x: n,
      y: o
    }), h = s.map((c) => ({
      node: c,
      transform: this.captureNodeWorldTransform(c)
    }));
    s.forEach((c) => {
      e.removeChild(c);
    }), e.addChildAt(a, i), h.forEach(({ node: c, transform: d }) => {
      a.addChild(c), this.applyWorldTransformToParent(c, a, d);
    }), this.selectedNodes.clear(), this.selectedNodes.add(a), this.updateSelectionVisuals();
    const l = new CustomEvent("layer:changed", {
      detail: {
        hierarchy: Xt.getHierarchy(e),
        selectedIds: Array.from(this.selectedNodes).map((c) => c.id)
      }
    });
    return this.eventTarget.dispatchEvent(l), this.dispatchSelectionChanged(), a;
  }
  ungroupSelected() {
    if (this.selectedNodes.size !== 1) return [];
    const t = Array.from(this.selectedNodes)[0];
    if (!(t instanceof st)) return [];
    const e = t.parent, s = e ? e.getChildIndex(t) : -1, i = [...t.children], n = i.map((o) => ({
      child: o,
      transform: this.captureNodeWorldTransform(o)
    }));
    if (i.forEach((o) => {
      t.removeChild(o);
    }), e && (e.removeChild(t), n.forEach(({ child: o, transform: a }, h) => {
      e.addChildAt(o, s + h), this.applyWorldTransformToParent(o, e, a);
    })), this.selectedNodes.clear(), i.forEach((o) => this.selectedNodes.add(o)), this.updateSelectionVisuals(), e) {
      const o = new CustomEvent("layer:changed", {
        detail: {
          hierarchy: Xt.getHierarchy(e),
          selectedIds: Array.from(this.selectedNodes).map((a) => a.id)
        }
      });
      this.eventTarget.dispatchEvent(o);
    }
    return this.dispatchSelectionChanged(), i;
  }
  getSelectionBounds() {
    let t = 1 / 0, e = 1 / 0, s = -1 / 0, i = -1 / 0;
    return this.selectedNodes.forEach((n) => {
      const o = n.getBounds();
      t = Math.min(t, o.x), e = Math.min(e, o.y), s = Math.max(s, o.x + o.width), i = Math.max(i, o.y + o.height);
    }), {
      x: t,
      y: e,
      width: s - t,
      height: i - e
    };
  }
  isSelected(t) {
    return this.selectedNodes.has(t);
  }
  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }
  reorderSelected(t, e) {
    if (this.selectedNodes.size !== 1) return !1;
    const s = Array.from(this.selectedNodes)[0];
    if (!s.visible || s.locked) return !1;
    const i = s.parent;
    if (!i) return !1;
    const n = i.getChildIndex(s);
    let o = n + e;
    return o = Math.max(0, Math.min(i.children.length - 1, o)), o === n ? !1 : (i.setChildIndex(s, o), this.dispatchLayerChanged(t), !0);
  }
  deleteSelected(t) {
    const e = [];
    return this.selectedNodes.forEach((s) => {
      s.parent && (s.parent.removeChild(s), e.push(s));
    }), this.clear(), e.length && this.dispatchLayerChanged(t), e;
  }
  clear() {
    this.snapCandidatesCache = null, this.selectedNodes.clear(), this.updateSelectionVisuals(), this.dispatchSelectionChanged();
  }
  nudgeSelected(t, e) {
    if (this.selectedNodes.size === 0) return !1;
    const s = Array.from(this.selectedNodes).filter((i) => i.visible && !i.locked);
    return s.length ? (s.forEach((i) => {
      i.position.x += t, i.position.y += e;
    }), this.updateSelectionVisuals(), this.dispatchPropertiesChanged(), this.dispatchSelectionChanged(), !0) : !1;
  }
  updateSelectionVisuals() {
    if (this.selectionGraphics.clear(), this.selectedNodes.size === 0) return;
    const e = 1 / this.getWorldScale(), s = 2 * e, i = 1 * e, n = 6 * e, o = 20 * e;
    if (this.selectedNodes.size > 1) {
      const a = this.getSelectionBounds(), h = this.selectionGraphics.parent, l = h.toLocal(new C(a.x, a.y)), c = h.toLocal(new C(a.x + a.width, a.y + a.height)), d = c.x - l.x, f = c.y - l.y;
      this.selectionGraphics.position.set(0, 0), this.selectionGraphics.rotation = 0, this.selectionGraphics.pivot.set(0, 0), this.selectionGraphics.rect(l.x, l.y, d, f), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 1 });
      const u = [
        { x: l.x, y: l.y },
        { x: l.x + d / 2, y: l.y },
        { x: l.x + d, y: l.y },
        { x: l.x + d, y: l.y + f / 2 },
        { x: l.x + d, y: l.y + f },
        { x: l.x + d / 2, y: l.y + f },
        { x: l.x, y: l.y + f },
        { x: l.x, y: l.y + f / 2 }
      ];
      for (const p of u)
        this.selectionGraphics.circle(p.x, p.y, n), this.selectionGraphics.fill({ color: 16777215 }), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 0.9 });
      return;
    }
    for (const a of this.selectedNodes)
      if (a.type === "line") {
        const h = a, { startX: l, startY: c, endX: d, endY: f } = this.getLineEndpointsInSelectionSpace(h);
        this.selectionGraphics.position.set(0, 0), this.selectionGraphics.rotation = 0, this.selectionGraphics.moveTo(l, c), this.selectionGraphics.lineTo(d, f), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 1 });
        const u = [
          { x: l, y: c },
          { x: d, y: f }
        ];
        for (const x of u)
          this.selectionGraphics.circle(x.x, x.y, n), this.selectionGraphics.fill({ color: 16777215 }), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 0.9 });
        const p = (l + d) / 2, m = (c + f) / 2, g = 6 * e;
        this.selectionGraphics.rect(p - g, m - g, g * 2, g * 2), this.selectionGraphics.fill({ color: 16777215 }), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 0.9 });
      } else {
        if (a.type === "frame" || a.parent instanceof st || a.parent instanceof $) {
          const y = this.getNodeBoundsInSelectionSpace(a);
          this.selectionGraphics.position.set(0, 0), this.selectionGraphics.rotation = 0, this.selectionGraphics.pivot.set(0, 0), this.selectionGraphics.rect(y.x, y.y, y.width, y.height), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 1 });
          const b = [
            { x: y.x, y: y.y },
            { x: y.x + y.width / 2, y: y.y },
            { x: y.x + y.width, y: y.y },
            { x: y.x + y.width, y: y.y + y.height / 2 },
            { x: y.x + y.width, y: y.y + y.height },
            { x: y.x + y.width / 2, y: y.y + y.height },
            { x: y.x, y: y.y + y.height },
            { x: y.x, y: y.y + y.height / 2 }
          ];
          for (const w of b)
            this.selectionGraphics.circle(w.x, w.y, n), this.selectionGraphics.fill({ color: 16777215 }), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 0.9 });
          continue;
        }
        const h = a.width, l = a.height, c = a.rotation, d = Math.cos(c), f = Math.sin(c), u = a.position.x + h / 2 * d - l / 2 * f, p = a.position.y + h / 2 * f + l / 2 * d;
        this.selectionGraphics.position.set(u, p), this.selectionGraphics.rotation = a.rotation, this.selectionGraphics.pivot.set(0, 0), this.selectionGraphics.rect(-h / 2, -l / 2, h, l), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 1 });
        const m = [
          { x: -h / 2, y: -l / 2, name: "top-left" },
          // Top-left
          { x: 0, y: -l / 2, name: "top" },
          // Top-middle
          { x: h / 2, y: -l / 2, name: "top-right" },
          // Top-right
          { x: h / 2, y: 0, name: "right" },
          // Middle-right
          { x: h / 2, y: l / 2, name: "bottom-right" },
          // Bottom-right
          { x: 0, y: l / 2, name: "bottom" },
          // Bottom-middle
          { x: -h / 2, y: l / 2, name: "bottom-left" },
          // Bottom-left
          { x: -h / 2, y: 0, name: "left" }
          // Middle-left
        ];
        for (const y of m)
          this.selectionGraphics.circle(y.x, y.y, n), this.selectionGraphics.fill({ color: 16777215 }), this.selectionGraphics.stroke({ color: 39423, width: s, alpha: 0.9 });
        const g = -l / 2 - o, x = 0;
        this.selectionGraphics.moveTo(x, -l / 2), this.selectionGraphics.lineTo(x, g), this.selectionGraphics.stroke({ color: 39423, width: i, alpha: 0.9 }), this.selectionGraphics.circle(x, g, 5 * e), this.selectionGraphics.fill({ color: 16777215 }), this.selectionGraphics.stroke({ color: 39423, width: i });
      }
  }
  getWorldScale() {
    const t = this.selectionGraphics.parent;
    if (!t) return 1;
    const e = t.worldTransform, s = Math.hypot(e.a, e.b), i = Math.hypot(e.c, e.d);
    return (s + i) / 2 || 1;
  }
  dispatchLayerChanged(t) {
    const e = t ?? (this.selectedNodes.size ? Array.from(this.selectedNodes)[0].parent : null);
    if (!e) return;
    const s = Xt.getHierarchy(e), i = Array.from(this.selectedNodes).map((n) => n.id);
    this.eventTarget.dispatchEvent(
      new CustomEvent("layer:changed", {
        detail: { hierarchy: s, selectedIds: i }
      })
    );
  }
  dispatchPropertiesChanged() {
    const t = Array.from(this.selectedNodes).map((s) => typeof s.getInspectable == "function" ? s.getInspectable() : null).filter((s) => s !== null), e = new CustomEvent("properties:changed", {
      detail: { nodes: t }
    });
    this.eventTarget.dispatchEvent(e);
  }
  schedulePropertiesChanged() {
    this.propertiesChangedRafId === null && (this.propertiesChangedRafId = requestAnimationFrame(() => {
      this.propertiesChangedRafId = null, this.dispatchPropertiesChanged(), this.dispatchSelectionChanged();
    }));
  }
  cancelScheduledPropertiesChanged() {
    this.propertiesChangedRafId !== null && (cancelAnimationFrame(this.propertiesChangedRafId), this.propertiesChangedRafId = null);
  }
  dispatchSelectionChanged() {
    const t = Array.from(this.selectedNodes).map((i) => typeof i.getInspectable == "function" ? i.getInspectable() : null).filter((i) => i !== null), e = Array.from(this.selectedNodes).map((i) => i.id), s = new CustomEvent("selection:changed", {
      detail: { nodes: t, selectedIds: e }
    });
    this.eventTarget.dispatchEvent(s);
  }
  updateMultiTransform(t) {
    const e = this.multiTransform;
    if (!e) return;
    const s = t.x - e.startPoint.x, i = t.y - e.startPoint.y;
    if (e.mode === "move") {
      let _ = s, v = i;
      if (this.objectSnapEnabled) {
        const T = new Set(e.nodes.map((P) => P.node)), k = this.getSnappedMoveDelta(e.startBounds, s, i, T);
        _ = k.dx, v = k.dy;
      }
      e.nodes.forEach(({ node: T, x: k, y: P }) => {
        T.position.set(Math.round(k + _), Math.round(P + v));
      });
      return;
    }
    const n = e.startBounds, o = n.x + n.width, a = n.y + n.height, h = n.x + n.width / 2, l = n.y + n.height / 2;
    let c = n.x, d = n.y, f = n.width, u = n.height;
    const p = 10, m = e.handle ?? "bottom-right", g = m.includes("left"), x = m.includes("right"), y = m.includes("top"), b = m.includes("bottom");
    if (x && (f = n.width + s), g && (f = n.width - s, c = n.x + s), b && (u = n.height + i), y && (u = n.height - i, d = n.y + i), this.shiftKey) {
      const _ = n.width / Math.max(1, n.height), v = g || x, T = y || b;
      if (v && T) {
        const k = Math.max(p, f), P = Math.max(p, u);
        Math.abs(k / _ - P) > Math.abs(P * _ - k) ? u = k / _ : f = P * _, g && (c = o - f), y && (d = a - u);
      } else v ? (u = f / _, d = l - u / 2) : T && (f = u * _, c = h - f / 2);
    }
    if (f < p && (f = p, g && (c = o - f)), u < p && (u = p, y && (d = a - u)), this.objectSnapEnabled) {
      const _ = new Set(e.nodes.map((T) => T.node)), v = this.getSnappedResizeRect(
        { x: c, y: d, width: f, height: u },
        m,
        { x: n.x, y: n.y, width: n.width, height: n.height },
        _
      );
      c = v.x, d = v.y, f = v.width, u = v.height;
    }
    const w = f / Math.max(1, n.width), S = u / Math.max(1, n.height);
    e.nodes.forEach(({ node: _, x: v, y: T, width: k, height: P, line: M }) => {
      if (_.type === "line" && M) {
        const X = v + M.startX, Ct = T + M.startY, A = v + M.endX, E = T + M.endY, kt = c + (X - n.x) * w, N = d + (Ct - n.y) * S, pt = c + (A - n.x) * w, Tt = d + (E - n.y) * S, nt = _, Mt = Math.round(kt), ee = Math.round(N), Ot = Math.round(pt), At = Math.round(Tt);
        nt.position.set(Mt, ee), nt.startX = 0, nt.startY = 0, nt.endX = Ot - Mt, nt.endY = At - ee, nt.refresh();
        return;
      }
      const R = c + (v - n.x) * w, L = d + (T - n.y) * S;
      _.position.set(Math.round(R), Math.round(L)), _.width = Math.max(1, Math.round(k * w)), _.height = Math.max(1, Math.round(P * S));
    });
  }
  getSnappedMoveDelta(t, e, s, i) {
    const n = this.getSnapCandidates(i);
    if (!n.length) return { dx: e, dy: s };
    const o = {
      x: t.x + e,
      y: t.y + s,
      width: t.width,
      height: t.height
    }, a = [o.x, o.x + o.width / 2, o.x + o.width], h = [o.y, o.y + o.height / 2, o.y + o.height], l = this.objectSnapThreshold / this.getWorldScale();
    let c = null, d = null;
    for (const f of n) {
      const u = [f.x, f.x + f.width / 2, f.x + f.width], p = [f.y, f.y + f.height / 2, f.y + f.height];
      for (const m of a)
        for (const g of u) {
          const x = g - m, y = Math.abs(x);
          y <= l && (c === null || y < Math.abs(c)) && (c = x);
        }
      for (const m of h)
        for (const g of p) {
          const x = g - m, y = Math.abs(x);
          y <= l && (d === null || y < Math.abs(d)) && (d = x);
        }
    }
    return {
      dx: e + (c ?? 0),
      dy: s + (d ?? 0)
    };
  }
  getSnappedResizeRect(t, e, s, i) {
    const n = this.getSnapCandidates(i);
    if (!n.length) return t;
    const o = this.objectSnapThreshold / this.getWorldScale(), a = 10, h = e.includes("left"), l = e.includes("right"), c = e.includes("top"), d = e.includes("bottom");
    let f = t.x, u = t.y, p = t.width, m = t.height, g = null, x = null;
    const y = f, b = f + p, w = f + p / 2, S = u, _ = u + m, v = u + m / 2;
    for (const T of n) {
      const k = [T.x, T.x + T.width / 2, T.x + T.width], P = [T.y, T.y + T.height / 2, T.y + T.height];
      if (h)
        for (const M of k) {
          const R = M - y, L = Math.abs(R);
          L <= o && (g === null || L < Math.abs(g)) && (g = R);
        }
      else if (l)
        for (const M of k) {
          const R = M - b, L = Math.abs(R);
          L <= o && (g === null || L < Math.abs(g)) && (g = R);
        }
      else
        for (const M of k) {
          const R = M - w, L = Math.abs(R);
          L <= o && (g === null || L < Math.abs(g)) && (g = R);
        }
      if (c)
        for (const M of P) {
          const R = M - S, L = Math.abs(R);
          L <= o && (x === null || L < Math.abs(x)) && (x = R);
        }
      else if (d)
        for (const M of P) {
          const R = M - _, L = Math.abs(R);
          L <= o && (x === null || L < Math.abs(x)) && (x = R);
        }
      else
        for (const M of P) {
          const R = M - v, L = Math.abs(R);
          L <= o && (x === null || L < Math.abs(x)) && (x = R);
        }
    }
    if (g !== null)
      if (h) {
        const T = s.x + s.width;
        f += g, p = T - f;
      } else l ? p += g : f += g;
    if (x !== null)
      if (c) {
        const T = s.y + s.height;
        u += x, m = T - u;
      } else d ? m += x : u += x;
    return p < a && (h && (f = s.x + s.width - a), p = a), m < a && (c && (u = s.y + s.height - a), m = a), { x: f, y: u, width: p, height: m };
  }
  getSnapCandidates(t) {
    return this.snapCandidatesCache ? this.snapCandidatesCache : this.buildSnapCandidates(t);
  }
  buildSnapCandidates(t) {
    const e = Array.from(this.selectedNodes)[0], s = e?.parent;
    if (!s) return [];
    const n = s.children.filter((a) => a instanceof G).filter((a) => !t.has(a)).map((a) => this.getNodeBoundsInParentSpace(a)).filter((a) => Number.isFinite(a.x) && Number.isFinite(a.y) && a.width > 0 && a.height > 0), o = this.findNearestAncestorFrame(e ?? null);
    if (o) {
      const a = this.getContainerBoundsInTargetSpace(o, s);
      Number.isFinite(a.x) && Number.isFinite(a.y) && a.width > 0 && a.height > 0 && n.push(a);
    }
    return n;
  }
  findNearestAncestorFrame(t) {
    let e = t?.parent;
    for (; e; ) {
      if (e instanceof $) return e;
      e = e.parent;
    }
    return null;
  }
  getContainerBoundsInTargetSpace(t, e) {
    if (t === e)
      return { x: 0, y: 0, width: t.width, height: t.height };
    const s = t.getBounds(), i = e.toLocal(new C(s.x, s.y)), n = e.toLocal(new C(s.x + s.width, s.y + s.height));
    return {
      x: Math.min(i.x, n.x),
      y: Math.min(i.y, n.y),
      width: Math.abs(n.x - i.x),
      height: Math.abs(n.y - i.y)
    };
  }
  getNodeBoundsInParentSpace(t) {
    const e = t.parent, s = t.getBounds();
    if (!e) return { x: s.x, y: s.y, width: s.width, height: s.height };
    const i = e.toLocal(new C(s.x, s.y)), n = e.toLocal(new C(s.x + s.width, s.y + s.height)), o = Math.min(i.x, n.x), a = Math.min(i.y, n.y);
    return {
      x: o,
      y: a,
      width: Math.abs(n.x - i.x),
      height: Math.abs(n.y - i.y)
    };
  }
  captureNodeWorldTransform(t) {
    return {
      origin: t.toGlobal(new C(0, 0)),
      xAxis: t.toGlobal(new C(1, 0)),
      yAxis: t.toGlobal(new C(0, 1))
    };
  }
  applyWorldTransformToParent(t, e, s) {
    const i = e.toLocal(s.origin), n = e.toLocal(s.xAxis), o = e.toLocal(s.yAxis), a = new C(n.x - i.x, n.y - i.y), h = new C(o.x - i.x, o.y - i.y), l = Math.hypot(a.x, a.y) || 1, c = Math.hypot(h.x, h.y) || 1, d = Math.atan2(a.y, a.x);
    t.position.copyFrom(i), t.rotation = d, t.scale.set(l, c);
  }
  getNodeBoundsInSelectionSpace(t) {
    const e = this.selectionGraphics.parent, s = t.getBounds();
    if (!e) return { x: s.x, y: s.y, width: s.width, height: s.height };
    const i = e.toLocal(new C(s.x, s.y)), n = e.toLocal(new C(s.x + s.width, s.y + s.height));
    return {
      x: Math.min(i.x, n.x),
      y: Math.min(i.y, n.y),
      width: Math.abs(n.x - i.x),
      height: Math.abs(n.y - i.y)
    };
  }
  getLineEndpointsInSelectionSpace(t) {
    const e = t.parent ? t.parent.toGlobal(new C(t.x + t.startX, t.y + t.startY)) : new C(t.x + t.startX, t.y + t.startY), s = t.parent ? t.parent.toGlobal(new C(t.x + t.endX, t.y + t.endY)) : new C(t.x + t.endX, t.y + t.endY), i = this.selectionGraphics.parent;
    if (!i)
      return { startX: e.x, startY: e.y, endX: s.x, endY: s.y };
    const n = i.toLocal(e), o = i.toLocal(s);
    return { startX: n.x, startY: n.y, endX: o.x, endY: o.y };
  }
  getSelectedBoundsInParentSpace() {
    let t = 1 / 0, e = 1 / 0, s = -1 / 0, i = -1 / 0;
    return this.selectedNodes.forEach((n) => {
      const o = this.getNodeBoundsInParentSpace(n);
      t = Math.min(t, o.x), e = Math.min(e, o.y), s = Math.max(s, o.x + o.width), i = Math.max(i, o.y + o.height);
    }), {
      x: t,
      y: e,
      width: s - t,
      height: i - e
    };
  }
  updateSingleResizeTransform(t) {
    const e = this.singleResizeTransform;
    if (!e) return;
    const s = this.getDeltaInParentSpace(e.node.parent, e.startPoint, t), i = s.x, n = s.y, o = e.startState, a = e.handle, h = 10, l = o.x + o.width, c = o.y + o.height, d = o.x + o.width / 2, f = o.y + o.height / 2;
    let u = o.width, p = o.height, m = o.x, g = o.y;
    const x = a.includes("left"), y = a.includes("right"), b = a.includes("top"), w = a.includes("bottom");
    if (y && (u = o.width + i), x && (u = o.width - i, m = o.x + i), w && (p = o.height + n), b && (p = o.height - n, g = o.y + n), this.shiftKey) {
      const S = o.width / Math.max(1, o.height), _ = x || y, v = b || w;
      if (_ && v) {
        const T = Math.max(h, u), k = Math.max(h, p);
        Math.abs(T / S - k) > Math.abs(k * S - T) ? p = T / S : u = k * S, x && (m = l - u), b && (g = c - p);
      } else _ ? (p = u / S, g = f - p / 2) : v && (u = p * S, m = d - u / 2);
    }
    if (u < h && (u = h, x && (m = l - u)), p < h && (p = h, b && (g = c - p)), this.objectSnapEnabled) {
      const S = this.getSnappedResizeRect(
        { x: m, y: g, width: u, height: p },
        a,
        { x: o.x, y: o.y, width: o.width, height: o.height },
        /* @__PURE__ */ new Set([e.node])
      );
      m = S.x, g = S.y, u = S.width, p = S.height;
    }
    e.node.width = Math.max(1, Math.round(u)), e.node.height = Math.max(1, Math.round(p)), e.node.position.set(Math.round(m), Math.round(g));
  }
  getDeltaInParentSpace(t, e, s) {
    if (!t)
      return new C(s.x - e.x, s.y - e.y);
    const i = t.toLocal(e), n = t.toLocal(s);
    return new C(n.x - i.x, n.y - i.y);
  }
}
class rs extends G {
  type = "rectangle";
  cornerRadius;
  graphics;
  constructor(t) {
    super({
      id: t.id,
      type: "rectangle",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this._width = t.width, this._height = t.height, this.cornerRadius = t.cornerRadius, this.graphics = new tt(), this.addChild(this.graphics), this.redraw();
  }
  redraw() {
    const { fill: t, stroke: e, strokeWidth: s = 1, opacity: i = 1 } = this.style;
    this.graphics.clear();
    const n = typeof t == "string" ? parseInt(t.replace("#", ""), 16) : t, o = typeof e == "string" ? parseInt(e.replace("#", ""), 16) : e;
    this.cornerRadius ? this.graphics.roundRect(0, 0, this.width, this.height, this.cornerRadius) : this.graphics.rect(0, 0, this.width, this.height), t !== void 0 && this.graphics.fill({
      color: n ?? 16777215,
      alpha: i
    }), e !== void 0 && this.graphics.stroke({
      width: s,
      color: o ?? 0,
      alpha: i
    });
  }
  // Transform convenience methods inherited from BaseNode
  // Style methods
  setStyle(t) {
    return this.style = { ...this.style, ...t }, this.redraw(), this;
  }
  getProps() {
    return [
      ...super.getProps(),
      {
        name: "Corner Radius",
        key: "cornerRadius",
        type: "float",
        value: this.cornerRadius ?? 0,
        desc: "Rounded corner radius",
        min: 0,
        group: "Geometry"
      }
    ];
  }
  clone(t = 0, e = 0) {
    return new rs({
      width: this.width,
      height: this.height,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked,
      cornerRadius: this.cornerRadius
    });
  }
}
class ns extends G {
  type = "ellipse";
  graphics;
  constructor(t) {
    super({
      id: t.id,
      type: "ellipse",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this._width = t.width, this._height = t.height, this.graphics = new tt(), this.addChild(this.graphics), this.redraw();
  }
  redraw() {
    const { fill: t, stroke: e, strokeWidth: s = 1, opacity: i = 1 } = this.style;
    this.graphics.clear();
    const n = typeof t == "string" ? parseInt(t.replace("#", ""), 16) : t, o = typeof e == "string" ? parseInt(e.replace("#", ""), 16) : e;
    this.graphics.ellipse(this.width / 2, this.height / 2, this.width / 2, this.height / 2), t !== void 0 && this.graphics.fill({
      color: n ?? 16777215,
      alpha: i
    }), e !== void 0 && this.graphics.stroke({
      width: s,
      color: o ?? 0,
      alpha: i
    });
  }
  setStyle(t) {
    return this.style = { ...this.style, ...t }, this.redraw(), this;
  }
  clone(t = 0, e = 0) {
    return new ns({
      width: this.width,
      height: this.height,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked
    });
  }
}
class os extends G {
  type = "line";
  graphics;
  startX;
  startY;
  endX;
  endY;
  constructor(t) {
    super({
      id: t.id,
      type: "line",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this.startX = 0, this.startY = 0, this.endX = t.endX - t.startX, this.endY = t.endY - t.startY, this.position.set(t.startX, t.startY), this._width = Math.abs(this.endX), this._height = Math.abs(this.endY), this.graphics = new tt(), this.addChild(this.graphics), this.redraw();
  }
  redraw() {
    const { stroke: t, strokeWidth: e = 1, opacity: s = 1 } = this.style;
    this.graphics.clear();
    const i = typeof t == "string" ? parseInt(t.replace("#", ""), 16) : t;
    this.graphics.moveTo(this.startX, this.startY), this.graphics.lineTo(this.endX, this.endY), t !== void 0 && this.graphics.stroke({
      width: e,
      color: i ?? 0,
      alpha: s
    }), this._width = Math.abs(this.endX - this.startX), this._height = Math.abs(this.endY - this.startY);
  }
  setStyle(t) {
    return this.style = { ...this.style, ...t }, this.redraw(), this;
  }
  // Expose a safe public refresh for external controllers
  refresh() {
    this.redraw();
  }
  getProps() {
    const t = this.position.x + this.startX, e = this.position.y + this.startY, s = this.position.x + this.endX, i = this.position.y + this.endY, n = this.parent ? this.parent.toGlobal(new C(t, e)) : new C(t, e), o = this.parent ? this.parent.toGlobal(new C(s, i)) : new C(s, i);
    return [
      ...super.getProps(),
      {
        name: "Start X",
        key: "startX",
        type: "float",
        value: n.x,
        desc: "Start X position",
        group: "Line"
      },
      {
        name: "Start Y",
        key: "startY",
        type: "float",
        value: n.y,
        desc: "Start Y position",
        group: "Line"
      },
      {
        name: "End X",
        key: "endX",
        type: "float",
        value: o.x,
        desc: "End X position",
        group: "Line"
      },
      {
        name: "End Y",
        key: "endY",
        type: "float",
        value: o.y,
        desc: "End Y position",
        group: "Line"
      }
    ];
  }
  clone(t = 0, e = 0) {
    const s = this.position.x + this.startX + t, i = this.position.y + this.startY + e, n = this.position.x + this.endX + t, o = this.position.y + this.endY + e;
    return new os({
      startX: s,
      startY: i,
      endX: n,
      endY: o,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked
    });
  }
}
class as extends G {
  type = "star";
  graphics;
  points;
  innerRadius;
  outerRadius;
  constructor(t) {
    super({
      id: t.id,
      type: "star",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this.points = t.points, this.innerRadius = t.innerRadius, this.outerRadius = t.outerRadius, this._width = this.outerRadius * 2, this._height = this.outerRadius * 2, this.graphics = new tt(), this.addChild(this.graphics), this.redraw();
  }
  redraw() {
    const { fill: t, stroke: e, strokeWidth: s = 1, opacity: i = 1 } = this.style;
    this.graphics.clear();
    const n = typeof t == "string" ? parseInt(t.replace("#", ""), 16) : t, o = typeof e == "string" ? parseInt(e.replace("#", ""), 16) : e, a = this.width / 2, h = this.height / 2, l = this.outerRadius > 0 ? this.innerRadius / this.outerRadius : 0.5, c = a * l, d = h * l, f = a, u = h;
    this.outerRadius = a, this.innerRadius = c;
    const p = [];
    for (let m = 0; m < this.points * 2; m++) {
      const g = m % 2 === 0, x = g ? a : c, y = g ? h : d, b = m * Math.PI / this.points - Math.PI / 2;
      p.push(
        Math.cos(b) * x + f,
        Math.sin(b) * y + u
      );
    }
    this.graphics.poly(p), t !== void 0 && this.graphics.fill({
      color: n ?? 16777215,
      alpha: i
    }), e !== void 0 && this.graphics.stroke({
      width: s,
      color: o ?? 0,
      alpha: i
    });
  }
  setStyle(t) {
    return this.style = { ...this.style, ...t }, this.redraw(), this;
  }
  getProps() {
    return [
      ...super.getProps(),
      {
        name: "Points",
        key: "points",
        type: "int",
        value: this.points,
        desc: "Number of star points",
        min: 2,
        step: 1,
        group: "Geometry"
      },
      {
        name: "Inner Radius",
        key: "innerRadius",
        type: "float",
        value: this.innerRadius,
        desc: "Inner radius",
        min: 0,
        group: "Geometry"
      },
      {
        name: "Inner Ratio",
        key: "innerRatio",
        type: "float",
        value: this.outerRadius > 0 ? this.innerRadius / this.outerRadius : 0.5,
        desc: "Inner radius ratio",
        min: 0,
        max: 1,
        step: 0.05,
        group: "Geometry"
      },
      {
        name: "Outer Radius",
        key: "outerRadius",
        type: "float",
        value: this.outerRadius,
        desc: "Outer radius",
        min: 0,
        group: "Geometry"
      }
    ];
  }
  clone(t = 0, e = 0) {
    return new as({
      points: this.points,
      innerRadius: this.innerRadius,
      outerRadius: this.outerRadius,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked
    });
  }
}
const Ce = "Arial", Hn = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Lucida Console"
], Ql = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "normal",
  "bold"
], Jl = ["normal", "italic", "oblique"], tc = new Set(Hn);
function ec(r) {
  const t = String(r ?? "").trim();
  return t && tc.has(t) ? t : Ce;
}
function sc(r) {
  const t = String(r ?? "").toLowerCase();
  if (t === "normal" || t === "bold") return t;
  const e = Number.parseInt(t, 10);
  if (Number.isFinite(e)) {
    const s = Math.max(100, Math.min(900, Math.round(e / 100) * 100));
    return String(s);
  }
  return "normal";
}
function ic(r) {
  const t = String(r ?? "").toLowerCase();
  return t === "italic" || t === "oblique" ? t : "normal";
}
class Pe extends G {
  type = "text";
  textSprite;
  text;
  constructor(t) {
    super({
      id: t.id,
      type: "text",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this.text = t.text;
    const e = this.style.fontSize ?? 20, s = this.style.fontFamily ?? Ce, i = this.style.fontWeight ?? "normal", n = this.style.fontStyle ?? "normal";
    this.textSprite = new Se({
      text: this.text,
      style: {
        fill: this.style.fill ?? 0,
        fontSize: e,
        fontFamily: s,
        fontWeight: i,
        fontStyle: n
      }
    }), this.textSprite.resolution = Math.max(1, window.devicePixelRatio || 1), this.textSprite.roundPixels = !0, this.addChild(this.textSprite), this._width = this.textSprite.width, this._height = this.textSprite.height;
  }
  setText(t) {
    return this.text = t, this.textSprite.text = t, this._width = this.textSprite.width, this._height = this.textSprite.height, this;
  }
  setStyle(t) {
    if (this.style = { ...this.style, ...t }, t.fill !== void 0) {
      const e = typeof t.fill == "string" ? parseInt(t.fill.replace("#", ""), 16) : t.fill;
      this.textSprite.style.fill = e;
    }
    return t.fontSize !== void 0 && (this.textSprite.style.fontSize = t.fontSize), t.fontFamily !== void 0 && (this.textSprite.style.fontFamily = t.fontFamily), t.fontWeight !== void 0 && (this.textSprite.style.fontWeight = t.fontWeight), t.fontStyle !== void 0 && (this.textSprite.style.fontStyle = t.fontStyle), this._width = this.textSprite.width, this._height = this.textSprite.height, this;
  }
  getProps() {
    return [
      ...super.getProps(),
      {
        name: "Font Size",
        key: "fontSize",
        type: "float",
        value: this.style.fontSize ?? 20,
        desc: "Font size",
        min: 1,
        group: "Text"
      },
      {
        name: "Font Family",
        key: "fontFamily",
        type: "enum",
        value: this.style.fontFamily ?? Ce,
        options: [...Hn],
        desc: "Font family",
        group: "Text"
      },
      {
        name: "Font Weight",
        key: "fontWeight",
        type: "enum",
        value: this.style.fontWeight ?? "normal",
        options: [...Ql],
        desc: "Font weight",
        group: "Text"
      },
      {
        name: "Font Style",
        key: "fontStyle",
        type: "enum",
        value: this.style.fontStyle ?? "normal",
        options: [...Jl],
        desc: "Font style",
        group: "Text"
      },
      {
        name: "Text",
        key: "text",
        type: "string",
        value: this.text,
        desc: "Text content",
        group: "Text"
      }
    ];
  }
  clone(t = 0, e = 0) {
    return new Pe({
      text: this.text,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked
    });
  }
}
class rc {
  preview;
  activeTool = "select";
  //previewLayer is the layer that use to draw preview only
  previewLayer;
  //objectLayer is the layer that we draw the real object here
  objectLayer;
  toolsLayer;
  selectionManager;
  hoverGraphics;
  frameLabelLayer;
  frameLabelItems = /* @__PURE__ */ new Map();
  frameLabelOrder = [];
  frameNodesById = /* @__PURE__ */ new Map();
  hoveredNode = null;
  hoveredBounds = null;
  clipboard = [];
  onLayerChanged;
  isPanning = !1;
  lastPan;
  app;
  world;
  eventTarget = new EventTarget();
  activeTextInput;
  onHistoryCapture;
  shortcutsEnabled = !0;
  activeTransformHandle = null;
  transformStartClient = null;
  transformMoved = !1;
  dropTargetFrameId = null;
  drawingParentFrameId = null;
  pendingPointerMove = null;
  pointerMoveRafId = null;
  isPanModeActive() {
    return this.isPanning || this.activeTool === "pan";
  }
  constructor(t, e, s, i, n, o, a, h) {
    this.previewLayer = t, this.objectLayer = e, this.toolsLayer = s, this.onLayerChanged = () => {
      i();
    }, this.app = n, this.world = o, this.onHistoryCapture = a, this.selectionManager = new Zl(s, h ?? this.eventTarget), this.hoverGraphics = new tt(), this.frameLabelLayer = new q(), this.toolsLayer.addChild(this.hoverGraphics), this.toolsLayer.addChild(this.frameLabelLayer), this.preview = new We(t);
  }
  addEventListener(t, e, s) {
    this.eventTarget.addEventListener(t, e, s);
  }
  removeEventListener(t, e, s) {
    this.eventTarget.removeEventListener(t, e, s);
  }
  dispatchEvent(t) {
    return this.eventTarget.dispatchEvent(t);
  }
  clearSelection() {
    this.selectionManager.clear();
  }
  getSelectedNodes() {
    return this.selectionManager.getSelectedNodes();
  }
  selectNode(t) {
    this.selectionManager.select(t);
  }
  selectNodes(t) {
    this.selectionManager.selectMany(t);
  }
  setHoverNode(t) {
    this.updateHover(t, !0);
  }
  setShortcutsEnabled(t) {
    this.shortcutsEnabled = t;
  }
  setObjectSnapEnabled(t) {
    this.selectionManager.setObjectSnapEnabled(t);
  }
  getSelectionBounds() {
    return this.selectionManager.getSelectedNodes().length === 0 ? null : this.selectionManager.getSelectionBounds();
  }
  handleKeyDown(t) {
    if (this.shortcutsEnabled && !this.isEditingText() && !this.activeTextInput) {
      if (t.key === "Shift" && ("setShiftKey" in this.preview && this.preview.setShiftKey(!0), this.selectionManager.setMultiSelect(!0), this.selectionManager.setShiftKey(!0)), (t.key === "Delete" || t.key === "Backspace") && this.selectionManager.deleteSelected(this.objectLayer).length && (t.preventDefault(), this.onHistoryCapture?.()), t.key === "c" && (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.clipboard = this.selectionManager.getSelectedNodes()), t.key === "v" && (t.ctrlKey || t.metaKey)) {
        t.preventDefault();
        const e = [], s = 12;
        this.clipboard.forEach((i) => {
          const n = this.cloneNode(i, s, s);
          n && (this.objectLayer.addChild(n), e.push(n));
        }), e.length && (this.selectionManager.setMultiSelect(!0), e.forEach((i) => this.selectionManager.select(i)), this.selectionManager.setMultiSelect(!1), this.onLayerChanged(), this.onHistoryCapture?.());
      }
      if (t.key === "g" && (t.ctrlKey || t.metaKey) && !t.shiftKey && (t.preventDefault(), this.selectionManager.createGroup() && this.onHistoryCapture?.()), t.key === "g" && (t.ctrlKey || t.metaKey) && t.shiftKey && (t.preventDefault(), this.selectionManager.ungroupSelected().length && this.onHistoryCapture?.()), (t.ctrlKey || t.metaKey) && (t.key === "ArrowUp" || t.key === "ArrowDown")) {
        t.preventDefault();
        const e = t.key === "ArrowUp" ? 1 : -1;
        this.selectionManager.reorderSelected(this.objectLayer, e) && this.onHistoryCapture?.();
      }
      if (!t.ctrlKey && !t.metaKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(t.key)) {
        t.preventDefault();
        const e = t.shiftKey ? 1 : 10, s = t.key === "ArrowLeft" ? -e : t.key === "ArrowRight" ? e : 0, i = t.key === "ArrowUp" ? -e : t.key === "ArrowDown" ? e : 0;
        this.selectionManager.nudgeSelected(s, i) && this.onHistoryCapture?.();
      }
      t.key === " " && !t.repeat && (t.preventDefault(), this.isPanning = !0, this.setCursor("grab"));
    }
  }
  cloneNode(t, e = 0, s = 0) {
    try {
      return t.clone(e, s);
    } catch {
      return null;
    }
  }
  handleKeyUp(t) {
    this.shortcutsEnabled && (this.isEditingText() || this.activeTextInput || (t.key === "Shift" && ("setShiftKey" in this.preview && this.preview.setShiftKey(!1), this.selectionManager.setMultiSelect(!1), this.selectionManager.setShiftKey(!1)), t.key === " " && (this.isPanning = !1, this.lastPan = void 0, this.setCursor(this.activeTool === "pan" ? "grab" : null))));
  }
  setTool(t) {
    switch (this.activeTool = t, this.lastPan = void 0, t === "pan" ? this.setCursor("grab") : this.isPanning || this.setCursor(null), this.selectionManager.clear(), t) {
      case "frame":
        this.preview = new We(this.previewLayer);
        break;
      case "rectangle":
        this.preview = new We(this.previewLayer);
        break;
      case "ellipse":
        this.preview = new $l(this.previewLayer);
        break;
      case "line":
        this.preview = new jl(this.previewLayer);
        break;
      case "star":
        this.preview = new Vl(this.previewLayer);
        break;
      case "text":
        this.preview = new We(this.previewLayer);
        break;
    }
  }
  onPointerDown(t) {
    if (this.flushPendingPointerMove(), this.isPanModeActive() && this.world && this.app) {
      this.lastPan = new C(t.clientX, t.clientY), this.setCursor("grabbing");
      return;
    }
    const e = this.toWorldPoint(t), s = this.toGlobalPoint(t), i = this.collectFramesInStackOrder();
    if (this.updateFrameLabels(s, i), this.activeTool === "select") {
      const n = this.selectionManager.hitTestHandle(e);
      if (n) {
        this.activeTransformHandle = n, this.transformStartClient = new C(t.clientX, t.clientY), this.transformMoved = !1, this.selectionManager.startTransform(s, n);
        return;
      }
      const o = this.findHitObject(s) ?? this.getFrameLabelHitNode(s);
      this.selectionManager.select(o || null), o && this.selectionManager.getSelectedNodes().length === 1 ? (this.activeTransformHandle = "move", this.transformStartClient = new C(t.clientX, t.clientY), this.transformMoved = !1, this.selectionManager.startTransform(s, "move")) : (this.activeTransformHandle = null, this.transformStartClient = null, this.transformMoved = !1);
    } else if (["frame", "rectangle", "ellipse", "line", "star", "text"].includes(this.activeTool)) {
      const n = this.findTopFrameAtPoint(s, i);
      this.drawingParentFrameId = this.activeTool !== "frame" && n && !n.locked ? n.id : null, this.preview.begin(this.snapWorldPoint(e));
    }
  }
  onDoubleClick(t) {
    const e = this.toGlobalPoint(t), s = this.findHitObject(e);
    if (!s || s.type !== "text") return;
    const i = s;
    i.locked || this.beginTextEdit(i);
  }
  onPointerMove(t) {
    if (this.isPanModeActive() && this.world && this.app) {
      if (this.lastPan) {
        const e = t.clientX - this.lastPan.x, s = t.clientY - this.lastPan.y;
        this.world.position.x += e, this.world.position.y += s, this.lastPan.set(t.clientX, t.clientY), this.dispatchEvent(
          new CustomEvent("viewport:changed", {
            detail: {
              x: this.world.position.x,
              y: this.world.position.y,
              zoom: this.world.scale.x,
              source: "pan"
            }
          })
        );
      }
      return;
    }
    this.pendingPointerMove = {
      clientX: t.clientX,
      clientY: t.clientY,
      offsetX: t.offsetX,
      offsetY: t.offsetY
    }, this.pointerMoveRafId === null && (this.pointerMoveRafId = requestAnimationFrame(() => {
      this.pointerMoveRafId = null;
      const e = this.pendingPointerMove;
      this.pendingPointerMove = null, e && this.processPointerMove(e);
    }));
  }
  onPointerUp(t) {
    this.flushPendingPointerMove();
    const e = this.toGlobalPoint(t), s = this.collectFramesInStackOrder();
    if (this.updateFrameLabels(e, s), this.activeTool === "select" && (this.selectionManager.endTransform(), this.activeTransformHandle === "move" && this.transformMoved && this.reparentSelectionIntoFrame(e, s) && this.onLayerChanged(), this.activeTransformHandle = null, this.transformStartClient = null, this.transformMoved = !1, this.dropTargetFrameId = null, this.onHistoryCapture?.()), this.isPanModeActive() && !t.buttons) {
      if (this.world) {
        const a = Math.round(this.world.position.x), h = Math.round(this.world.position.y);
        this.world.position.set(a, h), this.dispatchEvent(
          new CustomEvent("viewport:changed", {
            detail: {
              x: a,
              y: h,
              zoom: this.world.scale.x,
              source: "pan"
            }
          })
        );
      }
      this.lastPan = void 0, this.setCursor(this.activeTool === "pan" || this.isPanning ? "grab" : null);
      return;
    }
    const i = this.preview.end();
    if (!i) {
      this.drawingParentFrameId = null;
      return;
    }
    let n;
    const o = {
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 1,
      opacity: 1
    };
    switch (this.activeTool) {
      case "frame":
        let a = i.w, h = i.h, l = i.x, c = i.y;
        if (t.shiftKey) {
          const M = Math.max(i.w, i.h);
          i.w < i.h ? (this.preview.last.x < this.preview.start.x && (l = this.preview.start.x - M), a = M) : (this.preview.last.y < this.preview.start.y && (c = this.preview.start.y - M), h = M);
        }
        n = new $({
          width: Math.max(1, Math.round(a)),
          height: Math.max(1, Math.round(h)),
          x: Math.round(l),
          y: Math.round(c),
          backgroundColor: "#ffffff",
          clipContent: !0,
          style: { opacity: 1 }
        });
        break;
      case "rectangle":
        let d = i.w, f = i.h, u = i.x, p = i.y;
        if (t.shiftKey) {
          const M = Math.max(i.w, i.h);
          i.w < i.h ? (this.preview.last.x < this.preview.start.x && (u = this.preview.start.x - M), d = M) : (this.preview.last.y < this.preview.start.y && (p = this.preview.start.y - M), f = M);
        }
        n = new rs({
          width: d,
          height: f,
          x: u,
          y: p,
          style: o
        });
        break;
      case "ellipse":
        let m = i.w, g = i.h, x = i.x, y = i.y;
        if (t.shiftKey) {
          const M = Math.max(i.w, i.h);
          m = M, g = M;
        }
        n = new ns({
          width: m,
          height: g,
          x,
          y,
          style: o
        });
        break;
      case "line":
        let b = this.preview.last.x, w = this.preview.last.y;
        if (t.shiftKey) {
          const M = this.snapPointTo45(this.preview.start, this.preview.last);
          b = M.x, w = M.y;
        }
        n = new os({
          startX: this.preview.start.x,
          startY: this.preview.start.y,
          endX: b,
          endY: w,
          style: o
        });
        break;
      case "star":
        const _ = Math.min(i.w, i.h) / 2, v = _ * 0.5, T = i.x + i.w / 2, k = i.y + i.h / 2;
        n = new as({
          points: 5,
          innerRadius: v,
          outerRadius: _,
          x: T - _,
          y: k - _,
          style: o
        });
        break;
      case "text":
        const P = {
          ...o,
          fill: "#333333"
        };
        n = new Pe({
          text: "Double click to edit",
          x: i.x,
          y: i.y,
          style: P
        });
        break;
    }
    if (n) {
      const a = new CustomEvent("shape:created", {
        detail: { shape: n, parentId: this.activeTool === "frame" ? null : this.drawingParentFrameId }
      });
      this.dispatchEvent(a);
    }
    this.drawingParentFrameId = null;
  }
  cancel() {
    this.cancelPendingPointerMove(), this.preview.cancel(), this.setTool("select"), this.isPanning = !1, this.lastPan = void 0, this.activeTransformHandle = null, this.transformStartClient = null, this.transformMoved = !1, this.dropTargetFrameId = null, this.drawingParentFrameId = null, this.updateFrameLabels(), this.setCursor(null);
  }
  setCursor(t) {
    const e = this.app?.renderer?.canvas;
    e && (e.style.cursor = t || "");
  }
  processPointerMove(t) {
    const e = this.toWorldPointFromClient(
      t.clientX,
      t.clientY,
      t.offsetX,
      t.offsetY
    ), s = this.toGlobalPointFromClient(t.clientX, t.clientY), i = this.collectFramesInStackOrder();
    if (this.updateFrameLabels(s, i), this.activeTool === "select") {
      if (this.selectionManager.updateTransform(s), this.transformStartClient) {
        const o = t.clientX - this.transformStartClient.x, a = t.clientY - this.transformStartClient.y;
        Math.hypot(o, a) > 2 && (this.transformMoved = !0);
      }
      if (this.activeTransformHandle === "move" && this.transformMoved ? this.dropTargetFrameId = this.resolveDropTargetFrameId(s, i) : this.dropTargetFrameId = null, this.activeTransformHandle && this.transformMoved) {
        this.updateHover(null, !0);
        return;
      }
      const n = this.findHitObject(s) ?? this.getFrameLabelHitNode(s);
      this.updateHover(n || null, !0);
      return;
    }
    ["frame", "rectangle", "ellipse", "line", "star", "text"].includes(this.activeTool) && this.preview.update(this.snapWorldPoint(e));
  }
  flushPendingPointerMove() {
    if (!this.pendingPointerMove) return;
    this.pointerMoveRafId !== null && (cancelAnimationFrame(this.pointerMoveRafId), this.pointerMoveRafId = null);
    const t = this.pendingPointerMove;
    this.pendingPointerMove = null, this.processPointerMove(t);
  }
  cancelPendingPointerMove() {
    this.pointerMoveRafId !== null && (cancelAnimationFrame(this.pointerMoveRafId), this.pointerMoveRafId = null), this.pendingPointerMove = null;
  }
  toGlobalPoint(t) {
    return this.toGlobalPointFromClient(t.clientX, t.clientY);
  }
  toGlobalPointFromClient(t, e) {
    if (!this.app) return new C(t, e);
    const s = new C();
    return this.app.renderer.events.mapPositionToPoint(s, t, e), s;
  }
  toWorldPoint(t) {
    return this.toWorldPointFromClient(t.clientX, t.clientY, t.offsetX, t.offsetY);
  }
  toWorldPointFromClient(t, e, s, i) {
    if (!this.world || !this.app) return new C(s, i);
    const n = this.toGlobalPointFromClient(t, e);
    return this.world.toLocal(n);
  }
  snapWorldPoint(t) {
    return new C(Math.round(t.x), Math.round(t.y));
  }
  isEditingText() {
    const t = document.activeElement;
    if (!t) return !1;
    const e = t.tagName.toLowerCase();
    return e === "input" || e === "textarea" || t.isContentEditable;
  }
  updateHover(t, e) {
    const s = this.hoveredNode !== t;
    let i = s;
    if (t && !s) {
      const n = t.getBounds(), o = this.hoveredBounds;
      i = !o || o.x !== n.x || o.y !== n.y || o.width !== n.width || o.height !== n.height;
    }
    if (i) {
      if (this.hoveredNode = t, this.hoverGraphics.clear(), t) {
        const n = t.getBounds();
        this.hoveredBounds = {
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height
        };
        const o = this.world ? this.world.toLocal(new C(n.x, n.y)) : new C(n.x, n.y), a = this.world ? this.world.toLocal(new C(n.x + n.width, n.y + n.height)) : new C(n.x + n.width, n.y + n.height), h = a.x - o.x, l = a.y - o.y;
        this.hoverGraphics.rect(o.x, o.y, h, l), this.hoverGraphics.stroke({ color: 779878, alpha: 0.8, width: 1 });
      } else
        this.hoveredBounds = null;
      e && s && this.dispatchEvent(
        new CustomEvent("hover:changed", {
          detail: { id: t?.id ?? null }
        })
      );
    }
  }
  snapPointTo45(t, e) {
    const s = e.x - t.x, i = e.y - t.y, n = Math.hypot(s, i);
    if (n === 0) return { x: t.x, y: t.y };
    const o = Math.atan2(i, s), a = Math.PI / 4, h = Math.round(o / a) * a;
    return {
      x: t.x + Math.cos(h) * n,
      y: t.y + Math.sin(h) * n
    };
  }
  findHitObject(t) {
    const s = (i) => {
      for (let n = i.children.length - 1; n >= 0; n--) {
        const o = i.children[n];
        if (o instanceof G && !(!o.visible || o.locked)) {
          if (o instanceof st) {
            if (this.isNodeHit(o, t, 10))
              return o;
            continue;
          }
          if (o instanceof $) {
            const a = s(o);
            if (a) return a;
            continue;
          }
          if (o.children.length) {
            const a = s(o);
            if (a) return a;
          }
          if (this.isNodeHit(o, t, 10))
            return o;
        }
      }
    };
    return s(this.objectLayer);
  }
  isNodeHit(t, e, s) {
    if (t.type === "line") {
      const n = t, o = new C(n.x + n.startX, n.y + n.startY), a = new C(n.x + n.endX, n.y + n.endY), h = n.parent ? n.parent.toGlobal(o) : o, l = n.parent ? n.parent.toGlobal(a) : a, c = Math.hypot(l.x - h.x, l.y - h.y) || 1, d = Math.abs(
        (l.y - h.y) * e.x - (l.x - h.x) * e.y + l.x * h.y - l.y * h.x
      ) / c, f = Math.min(h.x, l.x) - s, u = Math.max(h.x, l.x) + s, p = Math.min(h.y, l.y) - s, m = Math.max(h.y, l.y) + s;
      return d <= s && e.x >= f && e.x <= u && e.y >= p && e.y <= m;
    }
    return t.getBounds().containsPoint(e.x, e.y);
  }
  updateFrameLabels(t, e) {
    const s = e ?? this.collectFramesInStackOrder();
    this.frameLabelOrder = s.map((a) => a.id), this.frameNodesById = new Map(s.map((a) => [a.id, a]));
    const i = new Set(s.map((a) => a.id));
    for (const [a, h] of this.frameLabelItems.entries())
      i.has(a) || (this.frameLabelLayer.removeChild(h.bg), this.frameLabelLayer.removeChild(h.label), h.bg.destroy(), h.label.destroy(), this.frameLabelItems.delete(a));
    const n = new Set(
      this.selectionManager.getSelectedNodes().filter((a) => a instanceof $).map((a) => a.id)
    ), o = t ? this.getFrameLabelHoverId(t) : null;
    s.forEach((a, h) => {
      const c = this.frameLabelItems.get(a.id) ?? (() => {
        const b = new tt(), w = new Se({
          text: a.name || "Frame",
          style: {
            fill: 2042167,
            fontSize: 11
          }
        });
        w.eventMode = "none", this.frameLabelLayer.addChild(b), this.frameLabelLayer.addChild(w);
        const S = { bg: b, label: w, bounds: { x: 0, y: 0, width: 0, height: 0 } };
        return this.frameLabelItems.set(a.id, S), S;
      })(), d = a.name || "Frame";
      c.label.text = d;
      const f = this.getFrameLabelBounds(a, d);
      c.bounds = f;
      let u = 16777215, p = 0.92, m = 2042167, g = 0.65, x = 2042167;
      a.id === this.dropTargetFrameId ? (u = 15138797, m = 779878, g = 0.95, x = 1003826) : n.has(a.id) ? (u = 15200767, m = 754943, g = 0.95, x = 736130) : o === a.id && (u = 16251387, m = 3431290, g = 0.9), c.bg.clear(), c.bg.roundRect(f.x, f.y, f.width, f.height, 4), c.bg.fill({ color: u, alpha: p }), c.bg.stroke({ color: m, width: 1, alpha: g }), c.label.style.fill = x, c.label.position.set(f.x + 5, f.y + 3);
      const y = h * 2;
      this.frameLabelLayer.setChildIndex(c.bg, Math.min(y, this.frameLabelLayer.children.length - 1)), this.frameLabelLayer.setChildIndex(
        c.label,
        Math.min(y + 1, this.frameLabelLayer.children.length - 1)
      );
    });
  }
  getFrameLabelBounds(t, e) {
    const s = t.getBounds(), i = this.world ? this.world.toLocal(new C(s.x, s.y)) : new C(s.x, s.y), n = Math.max(44, Math.min(240, e.length * 7 + 14)), o = 18, a = i.x, h = i.y - 20;
    return { x: a, y: h, width: n, height: o };
  }
  getFrameLabelHoverId(t) {
    const e = this.world ? this.world.toLocal(t) : t;
    for (let s = this.frameLabelOrder.length - 1; s >= 0; s -= 1) {
      const i = this.frameLabelOrder[s], n = this.frameLabelItems.get(i);
      if (!n) continue;
      const o = n.bounds;
      if (e.x >= o.x && e.x <= o.x + o.width && e.y >= o.y && e.y <= o.y + o.height)
        return i;
    }
    return null;
  }
  getFrameLabelHitNode(t) {
    const e = this.getFrameLabelHoverId(t);
    return e ? this.frameNodesById.get(e) ?? null : null;
  }
  collectFramesInStackOrder() {
    const t = [], e = (s) => {
      s.children.forEach((i) => {
        i instanceof G && (i instanceof $ && i.visible && t.push(i), i.children.length && e(i));
      });
    };
    return e(this.objectLayer), t;
  }
  resolveDropTargetFrameId(t, e) {
    const s = this.findTopFrameAtPoint(t, e);
    if (!s) return null;
    const i = this.selectionManager.getSelectedNodes();
    if (i.length !== 1) return null;
    const n = i[0];
    return !n || n instanceof $ || this.isGroupManagedNode(n) || s === n.parent || s.locked || !s.visible || this.isAncestor(n, s) ? null : s.id;
  }
  reparentSelectionIntoFrame(t, e) {
    const s = this.selectionManager.getSelectedNodes();
    if (s.length !== 1) return !1;
    const i = s[0];
    if (!i || i instanceof $ || this.isGroupManagedNode(i)) return !1;
    const n = this.findTopFrameAtPoint(t, e);
    if (!n || n === i.parent || n.locked || !n.visible || this.isAncestor(i, n)) return !1;
    const o = {
      origin: i.toGlobal(new C(0, 0)),
      xAxis: i.toGlobal(new C(1, 0)),
      yAxis: i.toGlobal(new C(0, 1))
    };
    i.parent?.removeChild(i), n.addChild(i);
    const a = n.toLocal(o.origin), h = n.toLocal(o.xAxis), l = n.toLocal(o.yAxis), c = new C(h.x - a.x, h.y - a.y), d = new C(l.x - a.x, l.y - a.y), f = Math.hypot(c.x, c.y) || 1, u = Math.hypot(d.x, d.y) || 1, p = Math.atan2(c.y, c.x);
    return i.position.copyFrom(a), i.type !== "frame" && (i.rotation = p), i.scale.set(f, u), this.selectionManager.selectMany([i]), !0;
  }
  // Nodes that are groups themselves or descendants of any group should not auto-reparent on drag.
  isGroupManagedNode(t) {
    if (t instanceof st) return !0;
    let e = t.parent;
    for (; e; ) {
      if (e instanceof st) return !0;
      if (e === this.objectLayer) break;
      e = e.parent;
    }
    return !1;
  }
  findTopFrameAtPoint(t, e) {
    const s = e ?? this.collectFramesInStackOrder();
    for (let i = s.length - 1; i >= 0; i -= 1) {
      const n = s[i];
      if (!n.visible) continue;
      if (n.getBounds().containsPoint(t.x, t.y))
        return n;
    }
    return null;
  }
  isAncestor(t, e) {
    let s = e;
    for (; s; ) {
      if (s === t) return !0;
      if (s === this.objectLayer) break;
      s = s.parent;
    }
    return !1;
  }
  beginTextEdit(t) {
    if (!this.app) return;
    this.activeTextInput && (this.activeTextInput.remove(), this.activeTextInput = void 0);
    const s = this.app.renderer.canvas.getBoundingClientRect(), i = t.getBounds(), n = document.createElement("input");
    n.type = "text", n.value = t.text, n.style.position = "absolute", n.style.left = `${s.left + i.x}px`, n.style.top = `${s.top + i.y}px`, n.style.width = `${Math.max(i.width, 40)}px`, n.style.height = `${Math.max(i.height, 20)}px`, n.style.fontSize = "16px", n.style.padding = "0", n.style.margin = "0", n.style.border = "1px solid #0be666", n.style.outline = "none", n.style.background = "#ffffff", n.style.color = "#000000", n.style.zIndex = "10000", document.body.appendChild(n), n.focus(), n.select();
    let o = !1, a = !1;
    const h = () => {
      a || (a = !0, n.parentNode && n.remove(), this.activeTextInput = void 0);
    }, l = () => {
      o || (t.setText(n.value), this.selectionManager.select(t), this.onHistoryCapture?.(), h());
    };
    n.addEventListener("keydown", (c) => {
      c.key === "Enter" ? (c.preventDefault(), l()) : c.key === "Escape" && (c.preventDefault(), o = !0, h());
    }), n.addEventListener("blur", () => {
      l();
    }), this.activeTextInput = n;
  }
}
class yt extends G {
  type = "image";
  sprite;
  source;
  constructor(t) {
    super({
      id: t.id,
      type: "image",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this.source = t.source, this.sprite = new Jt(t.texture), this.addChild(this.sprite);
    const e = () => {
      this._width = t.width ?? this.sprite.texture.width, this._height = t.height ?? this.sprite.texture.height, this.redraw();
    };
    e(), (this.sprite.texture.width === 0 || this.sprite.texture.height === 0) && this.sprite.texture.once("update", e);
  }
  static async fromSource(t) {
    const { dataUrl: e, texture: s } = await yt.prepareSource(t.source);
    return new yt({
      texture: s,
      source: e,
      width: t.width,
      height: t.height,
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    });
  }
  static async prepareSource(t) {
    const e = await yt.toDataUrl(t), s = await yt.loadImage(e), i = D.from(s);
    return { dataUrl: e, texture: i };
  }
  static async toDataUrl(t) {
    if (typeof t == "string") {
      if (t.startsWith("data:")) return t;
      const e = await fetch(t);
      if (!e.ok) throw new Error(`Failed to fetch image: ${e.status}`);
      const s = await e.blob();
      return yt.blobToDataUrl(s);
    }
    return yt.blobToDataUrl(t);
  }
  static blobToDataUrl(t) {
    return new Promise((e, s) => {
      const i = new FileReader();
      i.onerror = () => s(i.error), i.onload = () => e(String(i.result)), i.readAsDataURL(t);
    });
  }
  static loadImage(t) {
    return new Promise((e, s) => {
      const i = new Image();
      i.crossOrigin = "anonymous", i.onload = () => e(i), i.onerror = () => s(new Error("Failed to load image")), i.src = t;
    });
  }
  redraw() {
    this.sprite.width = this._width, this.sprite.height = this._height;
    const t = Number(this.style.opacity ?? 1), e = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 1;
    this.sprite.alpha = e;
  }
  get width() {
    return this._width;
  }
  set width(t) {
    this._width = t, this.redraw();
  }
  get height() {
    return this._height;
  }
  set height(t) {
    this._height = t, this.redraw();
  }
  setStyle(t) {
    return this.style = { ...this.style, ...t }, this.redraw(), this;
  }
  getProps() {
    return [
      ...super.getProps(),
      {
        name: "Source",
        key: "source",
        type: "string",
        value: typeof this.source == "string" ? this.source : "",
        desc: "Image source",
        group: "Image"
      }
    ];
  }
  clone(t = 0, e = 0) {
    return new yt({
      texture: this.sprite.texture,
      source: this.source,
      width: this.width,
      height: this.height,
      x: this.position.x + t,
      y: this.position.y + e,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked
    });
  }
}
class nc extends G {
  type = "circle";
  radius;
  graphics;
  constructor(t) {
    super({
      id: t.id,
      type: "circle",
      x: t.x,
      y: t.y,
      rotation: t.rotation,
      scale: t.scale,
      style: t.style,
      visible: t.visible,
      locked: t.locked
    }), this.radius = t.radius, this._width = this.radius * 2, this._height = this.radius * 2, this.graphics = new tt(), this.addChild(this.graphics), this.redraw();
  }
  redraw() {
    const { fill: t, stroke: e, strokeWidth: s = 1, opacity: i = 1 } = this.style;
    this.graphics.clear();
    const n = typeof t == "string" ? parseInt(t.replace("#", ""), 16) : t, o = typeof e == "string" ? parseInt(e.replace("#", ""), 16) : e;
    this.graphics.circle(0, 0, this.radius), t !== void 0 && this.graphics.fill({
      color: n ?? 16777215,
      alpha: i
    }), e !== void 0 && this.graphics.stroke({
      width: s,
      color: o ?? 0,
      alpha: i
    });
  }
  setStyle(t) {
    return this.style = { ...this.style, ...t }, this.redraw(), this;
  }
  getProps() {
    return [
      ...super.getProps(),
      {
        name: "Radius",
        key: "radius",
        type: "float",
        value: this.radius,
        desc: "Circle radius",
        min: 0,
        group: "Geometry"
      }
    ];
  }
}
const vr = {
  presets: {},
  nodePresetIds: {}
};
function oc(r) {
  return r === "jpg" || r === "svg" ? r : "png";
}
function ac(r) {
  const t = Number(r);
  return !Number.isFinite(t) || t <= 0 ? 1 : Math.max(0.01, Math.min(64, t));
}
function hc(r) {
  if (r == null || r === "") return;
  const t = Number(r);
  if (Number.isFinite(t))
    return Math.max(0, Math.min(1, t));
}
function lc(r) {
  if (r == null || r === "") return;
  const t = Number(r);
  if (Number.isFinite(t))
    return Math.max(0, Math.round(t));
}
function cc(r) {
  return r === "transparent" || r === "solid" ? r : "auto";
}
function dc(r) {
  return r === "display" || r === "max" ? r : "original";
}
function uc(r) {
  const t = Number(r);
  return !Number.isFinite(t) || t < 1 ? 2048 : Math.max(1, Math.round(t));
}
function fc(r) {
  return `preset-${r + 1}`;
}
function je(r, t = 0) {
  const e = r && typeof r == "object" ? r : {};
  return {
    id: typeof e.id == "string" && e.id.trim() ? e.id : fc(t),
    format: oc(e.format),
    scale: ac(e.scale),
    suffix: typeof e.suffix == "string" ? e.suffix : "",
    quality: hc(e.quality),
    padding: lc(e.padding),
    backgroundMode: cc(e.backgroundMode),
    backgroundColor: typeof e.backgroundColor == "string" && e.backgroundColor.trim() ? e.backgroundColor : void 0,
    imageEmbed: dc(e.imageEmbed),
    imageMaxEdge: uc(e.imageMaxEdge)
  };
}
function Kt(r) {
  const t = r && typeof r == "object" ? r : {}, e = t.presets && typeof t.presets == "object" ? t.presets : {}, s = t.nodePresetIds && typeof t.nodePresetIds == "object" ? t.nodePresetIds : {}, i = {};
  Object.entries(e).forEach(([o, a], h) => {
    const l = je({ ...a, id: o }, h);
    i[l.id] = l;
  });
  const n = {};
  return Object.entries(s).forEach(([o, a]) => {
    if (!Array.isArray(a)) return;
    const h = a.map((l) => String(l)).filter((l, c, d) => !!l && d.indexOf(l) === c && i[l]);
    h.length && (n[o] = h);
  }), { presets: i, nodePresetIds: n };
}
function Es(r) {
  return (r || "export").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").replace(/-+/g, "-") || "export";
}
class Qe {
  static MAX_UNDO_STACK_SIZE = 200;
  undoStack = [];
  redoStack = [];
  lastSnapshotKey = "";
  captureRequested = !1;
  captureInFlight = null;
  objectLayer;
  getExportStore;
  setExportStore;
  constructor(t, e = {}) {
    this.objectLayer = t, this.getExportStore = e.getExportStore, this.setExportStore = e.setExportStore;
  }
  async capture() {
    this.captureRequested = !0, this.captureInFlight || (this.captureInFlight = this.flushCaptureQueue()), await this.captureInFlight;
  }
  async undo() {
    if (this.undoStack.length < 2) return;
    const t = this.undoStack.pop();
    t && this.redoStack.push(t);
    const e = this.undoStack[this.undoStack.length - 1];
    e && (await this.restore(e), this.lastSnapshotKey = this.snapshotKey(e));
  }
  async redo() {
    if (!this.redoStack.length) return;
    const t = this.redoStack.pop();
    t && (this.undoStack.push(t), await this.restore(t), this.lastSnapshotKey = this.snapshotKey(t));
  }
  async serializeScene() {
    const t = this.objectLayer.children.filter((s) => s instanceof G).map((s) => this.serializeNode(s)), e = this.getExportStore ? Kt(this.getExportStore()) : void 0;
    return { nodes: t, exportStore: e };
  }
  async exportDocument() {
    const t = await this.serializeScene(), e = { version: 1, nodes: t.nodes };
    return t.exportStore && (e.exportStore = Kt(t.exportStore)), e;
  }
  async importDocument(t) {
    if (!t || t.version !== 1)
      throw new Error("Unsupported document version");
    const e = this.normalizeDocument(t);
    await this.restore(e);
    const s = { nodes: e.nodes, exportStore: e.exportStore };
    this.lastSnapshotKey = this.snapshotKey(s), this.undoStack = [s], this.redoStack = [];
  }
  hasContent() {
    return this.objectLayer.children.some((t) => t instanceof G);
  }
  async clearDocument() {
    this.objectLayer.children.slice().forEach((e) => this.objectLayer.removeChild(e)), this.lastSnapshotKey = "", this.undoStack = [], this.redoStack = [], this.captureRequested = !1;
  }
  async flushCaptureQueue() {
    try {
      for (; this.captureRequested; ) {
        this.captureRequested = !1;
        const t = await this.serializeScene(), e = this.snapshotKey(t);
        e !== this.lastSnapshotKey && (this.lastSnapshotKey = e, this.undoStack.push(t), this.undoStack.length > Qe.MAX_UNDO_STACK_SIZE && this.undoStack.splice(0, this.undoStack.length - Qe.MAX_UNDO_STACK_SIZE), this.redoStack = []);
      }
    } finally {
      this.captureInFlight = null;
    }
  }
  snapshotKey(t) {
    return JSON.stringify(t);
  }
  normalizeDocument(t) {
    return {
      version: 1,
      nodes: (t.nodes ?? []).map((e) => this.normalizeNode(e)),
      exportStore: Kt(t.exportStore)
    };
  }
  normalizeNode(t) {
    const e = { ...t.style ?? {} }, s = {
      x: this.toFiniteNumber(t.scale?.x, 1),
      y: this.toFiniteNumber(t.scale?.y, 1)
    }, i = {
      ...t,
      name: typeof t.name == "string" ? t.name : "",
      visible: this.toBoolean(t.visible, !0),
      locked: this.toBoolean(t.locked, !1),
      x: this.toFiniteNumber(t.x, 0),
      y: this.toFiniteNumber(t.y, 0),
      rotation: this.toFiniteNumber(t.rotation, 0),
      scale: s,
      width: t.width === void 0 ? void 0 : Math.max(0, this.toFiniteNumber(t.width, 0)),
      height: t.height === void 0 ? void 0 : Math.max(0, this.toFiniteNumber(t.height, 0)),
      style: e,
      data: t.data ? { ...t.data } : void 0,
      children: t.children?.map((n) => this.normalizeNode(n))
    };
    if (t.type === "frame") {
      const n = i.data ?? {}, o = { ...n };
      delete o.borderColor, delete o.borderWidth;
      const a = Object.prototype.hasOwnProperty.call(n, "backgroundColor") ? this.toNullableColor(n.backgroundColor, "#ffffff") : "#ffffff", h = this.toBoolean(n.clipContent, !0);
      i.data = {
        ...o,
        backgroundColor: a,
        clipContent: h
      }, i.width = Math.max(1, this.toFiniteNumber(i.width, 1)), i.height = Math.max(1, this.toFiniteNumber(i.height, 1));
    }
    return i;
  }
  toFiniteNumber(t, e) {
    const s = Number(t);
    return Number.isFinite(s) ? s : e;
  }
  toBoolean(t, e) {
    if (typeof t == "boolean") return t;
    if (typeof t == "number") return t !== 0;
    if (typeof t == "string") {
      const s = t.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(s)) return !0;
      if (["false", "0", "no", "off", "null", "undefined", ""].includes(s)) return !1;
    }
    return e;
  }
  toColor(t, e) {
    if (typeof t != "string") return e;
    const s = t.trim();
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : e;
  }
  toNullableColor(t, e) {
    if (t === null) return null;
    if (typeof t != "string") return e;
    const s = t.trim();
    return !s || s.toLowerCase() === "none" || s.toLowerCase() === "transparent" ? null : this.toColor(s, e);
  }
  serializeNode(t) {
    const e = {
      id: t.id,
      type: t.type,
      name: t.name,
      visible: t.visible,
      locked: t.locked,
      x: t.position.x,
      y: t.position.y,
      rotation: t.rotation,
      scale: { x: t.scale.x, y: t.scale.y },
      style: { ...t.style },
      width: t.width,
      height: t.height
    };
    switch (t.type) {
      case "rectangle": {
        const s = t;
        e.data = { cornerRadius: s.cornerRadius ?? 0 };
        break;
      }
      case "ellipse": {
        const s = t;
        e.width = s.width, e.height = s.height;
        break;
      }
      case "circle": {
        const s = t;
        e.data = { radius: s.radius };
        break;
      }
      case "line": {
        const s = t, i = s.position.x + s.startX, n = s.position.y + s.startY, o = s.position.x + s.endX, a = s.position.y + s.endY;
        e.data = { startX: i, startY: n, endX: o, endY: a };
        break;
      }
      case "star": {
        const s = t;
        e.data = {
          points: s.points,
          innerRadius: s.innerRadius,
          outerRadius: s.outerRadius
        };
        break;
      }
      case "text": {
        const s = t;
        e.data = { text: s.text };
        break;
      }
      case "image": {
        const s = t;
        e.data = { source: s.source ?? "" };
        break;
      }
      case "group": {
        const s = t;
        e.children = s.children.filter((i) => i instanceof G).map((i) => this.serializeNode(i));
        break;
      }
      case "frame": {
        const s = t;
        e.data = {
          backgroundColor: s.backgroundColor,
          clipContent: s.clipContent
        }, e.children = s.children.filter((i) => i instanceof G).map((i) => this.serializeNode(i));
        break;
      }
    }
    return e;
  }
  async restore(t) {
    this.objectLayer.children.slice().forEach((s) => this.objectLayer.removeChild(s));
    for (const s of t.nodes) {
      const i = await this.deserializeNode(s);
      this.objectLayer.addChild(i);
    }
    this.setExportStore && t.exportStore && this.setExportStore(Kt(t.exportStore));
  }
  async deserializeNode(t) {
    let e;
    const s = { ...t.style };
    switch (t.type) {
      case "rectangle":
        e = new rs({
          id: t.id,
          width: t.width ?? 0,
          height: t.height ?? 0,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked,
          cornerRadius: t.data?.cornerRadius
        });
        break;
      case "ellipse":
        e = new ns({
          id: t.id,
          width: t.width ?? 0,
          height: t.height ?? 0,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      case "circle":
        e = new nc({
          id: t.id,
          radius: t.data?.radius ?? 0,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      case "line":
        e = new os({
          id: t.id,
          startX: t.data?.startX ?? t.x,
          startY: t.data?.startY ?? t.y,
          endX: t.data?.endX ?? t.x,
          endY: t.data?.endY ?? t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      case "star":
        e = new as({
          id: t.id,
          points: t.data?.points ?? 5,
          innerRadius: t.data?.innerRadius ?? 0,
          outerRadius: t.data?.outerRadius ?? 0,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      case "text":
        e = new Pe({
          id: t.id,
          text: t.data?.text ?? "",
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      case "image": {
        const i = t.data?.source ?? "";
        e = await yt.fromSource({
          source: i,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      }
      case "group": {
        const i = [];
        for (const n of t.children ?? [])
          n.type !== "frame" && i.push(await this.deserializeNode(n));
        e = new st({
          id: t.id,
          children: i,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked
        });
        break;
      }
      case "frame": {
        const i = [];
        for (const o of t.children ?? [])
          o.type !== "frame" && i.push(await this.deserializeNode(o));
        const n = Object.prototype.hasOwnProperty.call(t.data ?? {}, "backgroundColor") ? t.data?.backgroundColor ?? null : "#ffffff";
        e = new $({
          id: t.id,
          name: t.name,
          children: i,
          width: t.width ?? 0,
          height: t.height ?? 0,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scale: t.scale,
          style: s,
          visible: t.visible,
          locked: t.locked,
          backgroundColor: n,
          clipContent: t.data?.clipContent ?? !0
        });
        break;
      }
      default:
        throw new Error(`Unknown node type: ${t.type}`);
    }
    return e.name = t.name, e.visible = t.visible, e.locked = t.locked, e;
  }
}
class pc {
  root;
  g;
  labels;
  uiLayer;
  getViewport;
  constructor(t, e) {
    this.uiLayer = t, this.getViewport = e, this.root = new q(), this.g = new tt(), this.labels = new q(), this.root.addChild(this.g), this.root.addChild(this.labels), this.uiLayer.addChild(this.root);
  }
  update() {
    const { width: t, height: e, scale: s, x: i, y: n } = this.getViewport(), o = 24, a = t - o;
    this.g.clear(), this.labels.removeChildren(), this.g.rect(0, 0, t - o, o), this.g.rect(a, o, o, e - o), this.g.fill({ color: 16185078, alpha: 1 }), this.g.stroke({ color: 13421772, width: 1, alpha: 1 });
    const h = this.getNiceStep(s), l = s, c = -i / s, d = Math.floor(c / h) - 1, f = Math.ceil((c + (t - o) / s) / h) + 1;
    for (let g = d; g <= f; g++) {
      const x = g * h, y = (x - c) * l;
      if (y < 0 || y > t - o) continue;
      const b = g % 5 === 0, w = b ? 10 : 6;
      if (this.g.moveTo(y, o), this.g.lineTo(y, o - w), this.g.stroke({ color: 10066329, width: 1, alpha: 1 }), b) {
        const S = new Se({
          text: `${Math.round(x)}`,
          style: {
            fontSize: 10,
            fill: 6710886
          }
        });
        S.position.set(y + 2, 2), this.labels.addChild(S);
      }
    }
    const u = -n / s, p = Math.floor(u / h) - 1, m = Math.ceil((u + (e - o) / s) / h) + 1;
    for (let g = p; g <= m; g++) {
      const x = g * h, y = o + (x - u) * l;
      if (y < o || y > e) continue;
      const b = g % 5 === 0, w = b ? 10 : 6;
      if (this.g.moveTo(a, y), this.g.lineTo(a + w, y), this.g.stroke({ color: 10066329, width: 1, alpha: 1 }), b) {
        const S = new Se({
          text: `${Math.round(x)}`,
          style: {
            fontSize: 10,
            fill: 6710886
          }
        });
        S.rotation = -Math.PI / 2, S.position.set(a + 10, y + 4), this.labels.addChild(S);
      }
    }
  }
  getNiceStep(t) {
    const s = 50 / t, i = Math.pow(10, Math.floor(Math.log10(s))), n = s / i;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * i;
  }
}
const yc = "0.0.0", gc = {
  select: null,
  frame: "crosshair",
  rectangle: "crosshair",
  ellipse: "crosshair",
  line: "crosshair",
  star: "crosshair",
  text: "text",
  pan: "grab"
};
class xc extends EventTarget {
  app = new vn();
  world = new q();
  objectLayer = new q();
  previewLayer = new q();
  toolsLayer = new q();
  helperLayer = new q();
  uiLayer = new q();
  host;
  pointerController;
  history;
  ruler;
  zoomLabel;
  shortcutsEnabled = !0;
  objectSnapEnabled = !0;
  isInitialized = !1;
  exportPresetStore = { ...vr };
  syncStageHitArea = () => {
    this.app.stage.hitArea = this.app.screen;
  };
  updateRuler = () => {
    this.ruler?.update();
  };
  updateZoomLabel = () => {
    if (!this.zoomLabel) return;
    const t = Math.round(this.world.scale.x * 100);
    this.zoomLabel.text = `zoom: ${t}%`;
    const e = 10;
    this.zoomLabel.position.set(
      Math.round(this.app.screen.width - this.zoomLabel.width - e - 24),
      Math.round(this.app.screen.height - this.zoomLabel.height - e)
    );
  };
  onZoomKeyDown = (t) => this.handleZoomKeys(t);
  onUndoRedoKeyDown = (t) => this.handleUndoRedoKeys(t);
  onToolKeyDown = (t) => this.handleToolKeys(t);
  onCanvasWheel = (t) => this.handleWheel(t);
  onHostDragOver = (t) => {
    t.preventDefault();
  };
  onHostDrop = (t) => {
    this.handleDrop(t);
  };
  onHostPaste = (t) => {
    this.handlePaste(t);
  };
  onWindowPaste = (t) => {
    this.handlePaste(t);
  };
  onPointerControllerShapeCreated = ((t) => {
    const e = t.detail.shape, s = t.detail.parentId ?? null;
    if (this.objectLayer.addChild(e), s) {
      const i = this.findNodeById(this.objectLayer, s);
      if (i instanceof $ && !i.locked) {
        const n = {
          origin: e.toGlobal(new C(0, 0)),
          xAxis: e.toGlobal(new C(1, 0)),
          yAxis: e.toGlobal(new C(0, 1))
        };
        this.objectLayer.removeChild(e), i.addChild(e), this.applyWorldTransformToParent(e, i, n);
      }
    }
    this.dispatchLayerHierarchyChanged(), this.useTool("select"), this.history?.capture();
  });
  onPointerControllerViewportChanged = ((t) => {
    const e = t.detail, s = new CustomEvent("viewport:changed", { detail: e });
    this.dispatchOnHost(s);
  });
  onPointerControllerHoverChanged = ((t) => {
    const e = t.detail, s = new CustomEvent("hover:changed", { detail: e });
    this.dispatchOnHost(s);
  });
  onHostPointerDown = (t) => {
    this.pointerController?.onPointerDown(t);
  };
  onHostPointerMove = (t) => {
    this.pointerController?.onPointerMove(t);
  };
  onHostPointerUp = (t) => {
    this.pointerController?.onPointerUp(t);
  };
  onHostDoubleClick = (t) => {
    this.pointerController?.onDoubleClick(t);
  };
  onHostPointerCancel = (t) => {
    this.pointerController?.cancel();
  };
  pointerControllerKeyDownHandler;
  pointerControllerKeyUpHandler;
  activeTool = "select";
  constructor() {
    super();
  }
  async init(t) {
    this.isInitialized || (await this.app.init({
      background: "#F2F2F2",
      resizeTo: t,
      // ให้ Pixi จัดการ resize เอง
      antialias: !0,
      autoDensity: !0,
      resolution: Math.max(1, window.devicePixelRatio || 1)
    }), this.host = t, t.appendChild(this.app.canvas), this.world.addChild(this.objectLayer), this.world.addChild(this.previewLayer), this.world.addChild(this.toolsLayer), this.world.addChild(this.helperLayer), this.app.stage.addChild(this.world), this.app.stage.addChild(this.uiLayer), this.app.stage.eventMode = "static", this.app.stage.hitArea = this.app.screen, this.previewLayer.eventMode = "passive", this.helperLayer.eventMode = "passive", this.uiLayer.eventMode = "passive", this.app.ticker.add(this.syncStageHitArea), this.initPointerController(), this.history = new Qe(this.objectLayer, {
      getExportStore: () => this.snapshotExportPresetStore(),
      setExportStore: (e) => {
        this.exportPresetStore = Kt(e), this.ensureExportStoreConsistency();
      }
    }), await this.history.capture(), this.ruler = new pc(this.uiLayer, () => ({
      width: this.app.screen.width,
      height: this.app.screen.height,
      scale: this.world.scale.x,
      x: this.world.position.x,
      y: this.world.position.y
    })), this.zoomLabel = new Se({
      text: "100%",
      style: {
        fontSize: 11,
        fill: 1118481
      }
    }), this.zoomLabel.alpha = 0.85, this.zoomLabel.eventMode = "none", this.zoomLabel.roundPixels = !0, this.uiLayer.addChild(this.zoomLabel), this.updateZoomLabel(), this.app.ticker.add(this.updateRuler), this.app.ticker.add(this.updateZoomLabel), window.addEventListener("keydown", this.onZoomKeyDown), window.addEventListener("keydown", this.onUndoRedoKeyDown), window.addEventListener("keydown", this.onToolKeyDown), this.app.canvas.addEventListener("wheel", this.onCanvasWheel, { passive: !1 }), this.host?.addEventListener("dragover", this.onHostDragOver), this.host?.addEventListener("drop", this.onHostDrop), this.host?.addEventListener("paste", this.onHostPaste), window.addEventListener("paste", this.onWindowPaste), this.isInitialized = !0);
  }
  setShortcutsEnabled(t) {
    this.shortcutsEnabled = t, this.pointerController?.setShortcutsEnabled(t);
  }
  setObjectSnapEnabled(t) {
    this.objectSnapEnabled = t, this.pointerController?.setObjectSnapEnabled(t);
  }
  isObjectSnapEnabled() {
    return this.objectSnapEnabled;
  }
  initPointerController() {
    this.pointerController = new rc(
      this.previewLayer,
      this.objectLayer,
      this.toolsLayer,
      this.dispatchLayerHierarchyChanged.bind(this),
      this.app,
      this.world,
      async () => {
        this.ensureExportStoreConsistency(), await this.history?.capture();
      },
      this
    ), this.pointerController.setObjectSnapEnabled(this.objectSnapEnabled), this.pointerController.addEventListener("shape:created", this.onPointerControllerShapeCreated), this.pointerController.addEventListener(
      "viewport:changed",
      this.onPointerControllerViewportChanged
    ), this.pointerController.addEventListener("hover:changed", this.onPointerControllerHoverChanged), this.host?.addEventListener("pointerdown", this.onHostPointerDown), this.host?.addEventListener("pointermove", this.onHostPointerMove), this.host?.addEventListener("pointerup", this.onHostPointerUp), this.host?.addEventListener("dblclick", this.onHostDoubleClick), this.host?.addEventListener("pointercancel", this.onHostPointerCancel), this.pointerControllerKeyDownHandler = this.pointerController.handleKeyDown.bind(this.pointerController), this.pointerControllerKeyUpHandler = this.pointerController.handleKeyUp.bind(this.pointerController), window.addEventListener("keydown", this.pointerControllerKeyDownHandler), window.addEventListener("keyup", this.pointerControllerKeyUpHandler);
  }
  handleZoomKeys(t) {
    if (!this.shortcutsEnabled || this.isEditingText()) return;
    const e = t.ctrlKey || t.metaKey, s = t.key;
    if (e && (s === "+" || s === "=")) {
      t.preventDefault(), this.setZoom(this.world.scale.x + 0.1);
      return;
    }
    if (e && s === "-") {
      t.preventDefault(), this.setZoom(this.world.scale.x - 0.1);
      return;
    }
    if (e) {
      if (s === "0")
        t.preventDefault(), this.setZoom(1);
      else if (/^[1-9]$/.test(s)) {
        t.preventDefault();
        const i = 1 + parseInt(s, 10) * 0.1;
        this.setZoom(i);
      }
    }
  }
  handleToolKeys(t) {
    if (!this.shortcutsEnabled || this.isEditingText() || t.ctrlKey || t.metaKey || t.altKey) return;
    switch (t.key.toLowerCase()) {
      case "g":
        t.preventDefault(), this.useTool("select");
        break;
      case "o":
        t.preventDefault(), this.useTool("ellipse");
        break;
      case "r":
        t.preventDefault(), this.useTool("rectangle");
        break;
      case "f":
        t.preventDefault(), this.useTool("frame");
        break;
      case "l":
        t.preventDefault(), this.useTool("line");
        break;
      case "s":
        t.preventDefault(), this.useTool("star");
        break;
      case "t":
        t.preventDefault(), this.useTool("text");
        break;
    }
  }
  handleWheel(t) {
    if (!this.shortcutsEnabled || this.isEditingText() || !this.host) return;
    const { deltaX: e, deltaY: s } = this.normalizeWheel(t);
    if (t.ctrlKey || t.metaKey) {
      t.preventDefault();
      const n = new C();
      this.app.renderer.events.mapPositionToPoint(n, t.clientX, t.clientY);
      const o = Math.pow(1.0015, -s);
      this.setZoomAt(this.world.scale.x * o, n);
      return;
    }
    (e !== 0 || s !== 0) && (t.preventDefault(), this.panBy(-e, -s, "wheel"));
  }
  normalizeWheel(t) {
    let e = t.deltaX, s = t.deltaY;
    return t.deltaMode === 1 ? (e *= 16, s *= 16) : t.deltaMode === 2 && (e *= this.app.screen.width, s *= this.app.screen.height), { deltaX: e, deltaY: s };
  }
  handleUndoRedoKeys(t) {
    if ((t.ctrlKey || t.metaKey) && !this.isEditingText()) {
      if (t.key === "z" || t.key === "Z") {
        t.preventDefault(), t.shiftKey ? this.redo() : this.undo();
        return;
      }
      (t.key === "y" || t.key === "Y") && (t.preventDefault(), this.redo());
    }
  }
  setZoom(t) {
    const i = Math.max(0.1, Math.min(5, t)), n = this.world.scale.x;
    if (i === n) return;
    const o = {
      x: this.app.screen.width / 2,
      y: this.app.screen.height / 2
    }, a = (o.x - this.world.position.x) / n, h = (o.y - this.world.position.y) / n;
    this.world.scale.set(i);
    const l = Math.round(o.x - a * i), c = Math.round(o.y - h * i);
    this.world.position.set(l, c), this.dispatchOnHost(
      new CustomEvent("viewport:changed", {
        detail: {
          x: l,
          y: c,
          zoom: this.world.scale.x,
          source: "zoom"
        }
      })
    );
  }
  setZoomAt(t, e) {
    const n = Math.max(0.1, Math.min(5, t)), o = this.world.scale.x;
    if (n === o) return;
    const a = (e.x - this.world.position.x) / o, h = (e.y - this.world.position.y) / o;
    this.world.scale.set(n);
    const l = Math.round(e.x - a * n), c = Math.round(e.y - h * n);
    this.world.position.set(l, c), this.dispatchOnHost(
      new CustomEvent("viewport:changed", {
        detail: {
          x: l,
          y: c,
          zoom: this.world.scale.x,
          source: "zoom"
        }
      })
    );
  }
  panBy(t, e, s = "pan") {
    this.world.position.x += t, this.world.position.y += e, this.dispatchOnHost(
      new CustomEvent("viewport:changed", {
        detail: {
          x: this.world.position.x,
          y: this.world.position.y,
          zoom: this.world.scale.x,
          source: s
        }
      })
    );
  }
  async handleDrop(t) {
    if (t.preventDefault(), !t.dataTransfer) return;
    const e = Array.from(t.dataTransfer.files).filter((i) => i.type.startsWith("image/"));
    if (!e.length) return;
    const s = this.getWorldPointFromClient(t.clientX, t.clientY);
    for (const i of e)
      await this.addImageFromSource(await this.toDataUrl(i), s);
  }
  async handlePaste(t) {
    if (t.defaultPrevented || this.isEditingText()) return;
    const e = t.clipboardData, i = Array.from(e?.items ?? []).filter((a) => a.type.startsWith("image/"));
    if (i.length) {
      t.preventDefault();
      const a = this.getWorldPointFromClient(
        this.app.screen.width / 2,
        this.app.screen.height / 2,
        !0
      );
      for (const h of i) {
        const l = h.getAsFile();
        l && await this.addImageFromSource(await this.toDataUrl(l), a);
      }
      return;
    }
    const n = e?.getData("text/plain") ?? "";
    if (!n.trim()) return;
    t.preventDefault();
    const o = this.getWorldPointFromClient(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      !0
    );
    await this.addTextAt(n, o);
  }
  async addTextAt(t, e) {
    const s = new Pe({
      text: t,
      x: e.x,
      y: e.y,
      style: {
        fill: "#333333"
      }
    });
    return this.commitAddedNode(s);
  }
  /**
   * Public API for adding plain text as a text node.
   * Default placement is the center of current viewport.
   */
  async addText(t, e) {
    const s = t ?? "";
    if (!s.trim()) return null;
    let i;
    return e ? i = e.space === "world" ? new C(e.x, e.y) : this.getWorldPointFromClient(e.x, e.y, !0) : i = this.getWorldPointFromClient(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      !0
    ), this.addTextAt(s, i);
  }
  /**
   * Public API for adding an image from URL/data URL/File/Blob.
   * Default placement is the center of current viewport.
   */
  async addImage(t, e) {
    let s;
    return e ? s = e.space === "world" ? new C(e.x, e.y) : this.getWorldPointFromClient(e.x, e.y, !0) : s = this.getWorldPointFromClient(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      !0
    ), this.addImageFromSource(t, s);
  }
  /**
   * Public API for adding a frame node.
   * Default placement is the center of current viewport.
   */
  async addFrame(t) {
    const e = Math.max(1, Math.round(t.width)), s = Math.max(1, Math.round(t.height));
    if (!Number.isFinite(e) || !Number.isFinite(s)) return null;
    const i = t.x !== void 0 && t.y !== void 0 ? t.space === "world" ? new C(t.x, t.y) : this.getWorldPointFromClient(t.x, t.y, !0) : this.getWorldPointFromClient(
      this.app.screen.width / 2 - e / 2,
      this.app.screen.height / 2 - s / 2,
      !0
    ), n = new $({
      name: t.name,
      width: e,
      height: s,
      x: Math.round(i.x),
      y: Math.round(i.y),
      backgroundColor: t.backgroundColor ?? "#ffffff",
      clipContent: t.clipContent ?? !0,
      style: {
        opacity: 1
      }
    });
    return this.commitAddedNode(n);
  }
  async addImageFromSource(t, e) {
    try {
      const s = await yt.fromSource({
        source: t,
        x: e.x,
        y: e.y
      });
      return this.commitAddedNode(s);
    } catch (s) {
      return console.error("Failed to add image", s), null;
    }
  }
  async commitAddedNode(t) {
    this.objectLayer.addChild(t), this.dispatchLayerHierarchyChanged(), await this.history?.capture();
    const e = t.getInspectable();
    return {
      id: t.id,
      type: t.type,
      inspectable: e,
      update: {
        id: t.id,
        props: Object.fromEntries(e.props.map((s) => [s.key, s.value]))
      }
    };
  }
  getWorldPointFromClient(t, e, s = !1) {
    const i = new C();
    return s ? i.set(t, e) : this.app.renderer.events.mapPositionToPoint(i, t, e), this.world.toLocal(i);
  }
  async exportRasterNodes(t, e) {
    if (!t.length) return null;
    const s = e.boundsOverride ?? this.getBoundsFromNodes(t), i = e.padding ?? 0, n = Math.max(0.01, Number.isFinite(Number(e.scale)) ? Number(e.scale) : 1), o = Math.max(1, Math.ceil(s.width + i * 2)), a = Math.max(1, Math.ceil(s.height + i * 2)), h = hi.create({ width: o, height: a, resolution: n }), l = new F().translate(-s.x + i, -s.y + i), c = e.background !== void 0 ? this.toColorNumber(e.background) : e.type === "jpg" ? 16777215 : new V(0).setAlpha(0), d = this.applySelectionVisibility(t);
    try {
      this.app.renderer.render({
        container: this.objectLayer,
        target: h,
        clear: !0,
        clearColor: c,
        transform: l
      });
    } finally {
      d();
    }
    const f = this.app.renderer.extract.canvas(h);
    if (f && f.toDataURL) {
      const u = e.type === "jpg" ? "image/jpeg" : "image/png", p = f.toDataURL(u, e.quality ?? 0.92);
      return h.destroy(!0), p;
    }
    return h.destroy(!0), null;
  }
  async exportSvgNodes(t, e) {
    if (!t.length) return null;
    const s = e.boundsOverride ?? this.getBoundsFromNodes(t), i = e.padding ?? 0, n = Math.max(0.01, Number.isFinite(Number(e.scale)) ? Number(e.scale) : 1), o = Math.max(1, Math.ceil(s.width + i * 2)), a = Math.max(1, Math.ceil(s.height + i * 2)), h = Math.max(1, Math.ceil(o * n)), l = Math.max(1, Math.ceil(a * n)), c = -s.x + i, d = -s.y + i, f = this.world.worldTransform.clone().invert(), u = [];
    e.background && u.push(`<rect x="0" y="0" width="${o}" height="${a}" fill="${e.background}"/>`);
    for (const p of t)
      u.push(
        await this.nodeToSvg(p, {
          invWorld: f,
          offsetX: c,
          offsetY: d,
          imageEmbed: e.imageEmbed ?? "original",
          imageMaxEdge: e.imageMaxEdge ?? 2048
        })
      );
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${h}" height="${l}" viewBox="0 0 ${o} ${a}">`,
      `<g transform="translate(${c} ${d})">`,
      u.join(""),
      "</g>",
      "</svg>"
    ].join("");
  }
  getFrameBounds(t) {
    const e = t.toGlobal(new C(0, 0)), s = t.toGlobal(new C(t.width, t.height)), i = this.world.toLocal(e), n = this.world.toLocal(s), o = Math.min(i.x, n.x), a = Math.min(i.y, n.y), h = Math.abs(n.x - i.x), l = Math.abs(n.y - i.y);
    return { x: o, y: a, width: h, height: l };
  }
  getBoundsFromNodes(t) {
    let e = 1 / 0, s = 1 / 0, i = -1 / 0, n = -1 / 0;
    return t.forEach((o) => {
      const a = o.getBounds(), h = this.world.toLocal(new C(a.x, a.y)), l = this.world.toLocal(new C(a.x + a.width, a.y + a.height));
      e = Math.min(e, h.x), s = Math.min(s, h.y), i = Math.max(i, l.x), n = Math.max(n, l.y);
    }), {
      x: e,
      y: s,
      width: i - e,
      height: n - s
    };
  }
  getAllBaseNodes(t) {
    const e = [], s = (i) => {
      i.children.forEach((n) => {
        n instanceof G && (e.push(n), n.children.length && s(n));
      });
    };
    return s(t), e;
  }
  applySelectionVisibility(t) {
    const e = /* @__PURE__ */ new Set(), s = (a) => {
      e.add(a), a.children.forEach((h) => {
        h instanceof G && s(h);
      });
    }, i = (a) => {
      let h = a.parent;
      for (; h && h instanceof G; )
        e.add(h), h = h.parent;
    };
    t.forEach((a) => {
      s(a), i(a);
    });
    const n = this.getAllBaseNodes(this.objectLayer), o = [];
    return n.forEach((a) => {
      o.push({ node: a, visible: a.visible }), e.has(a) || (a.visible = !1);
    }), () => {
      o.forEach(({ node: a, visible: h }) => {
        a.visible = h;
      });
    };
  }
  toColorNumber(t) {
    return t.startsWith("#") ? parseInt(t.slice(1), 16) : t.startsWith("0x") ? parseInt(t.slice(2), 16) : 16777215;
  }
  parseBoolean(t) {
    if (typeof t == "boolean") return t;
    if (typeof t == "number") return t !== 0;
    if (typeof t == "string") {
      const e = t.trim().toLowerCase();
      if (e === "true" || e === "1" || e === "yes" || e === "on")
        return !0;
      if (e === "false" || e === "0" || e === "no" || e === "off" || e === "" || e === "null" || e === "undefined")
        return !1;
    }
    return !!t;
  }
  async nodeToSvg(t, e) {
    const s = t.worldTransform.clone();
    s.prepend(e.invWorld);
    const i = `matrix(${s.a} ${s.b} ${s.c} ${s.d} ${s.tx} ${s.ty})`, n = this.styleToSvg(t.style), o = t.style.opacity !== void 0 ? ` opacity="${t.style.opacity}"` : "";
    switch (t.type) {
      case "rectangle": {
        const a = t, h = a.cornerRadius ? ` rx="${a.cornerRadius}" ry="${a.cornerRadius}"` : "";
        return `<rect x="0" y="0" width="${a.width}" height="${a.height}"${h} transform="${i}"${n}${o}/>`;
      }
      case "ellipse": {
        const a = t, h = a.width / 2, l = a.height / 2;
        return `<ellipse cx="${h}" cy="${l}" rx="${h}" ry="${l}" transform="${i}"${n}${o}/>`;
      }
      case "circle":
        return `<circle cx="0" cy="0" r="${t.radius}" transform="${i}"${n}${o}/>`;
      case "line": {
        const a = t, h = t.style.stroke ?? "#000000", l = t.style.strokeWidth ?? 1, c = t.style.opacity !== void 0 ? ` opacity="${t.style.opacity}"` : "";
        return `<line x1="${a.startX}" y1="${a.startY}" x2="${a.endX}" y2="${a.endY}" transform="${i}" stroke="${h}" stroke-width="${l}" fill="none"${c}/>`;
      }
      case "star": {
        const a = t;
        return `<polygon points="${this.starPointsToSvg(a)}" transform="${i}"${n}${o}/>`;
      }
      case "text": {
        const a = t, h = a.style.fontSize ?? 20, l = a.style.fontFamily ?? Ce, c = a.style.fontWeight ?? "normal", d = a.style.fontStyle ?? "normal", f = a.style.fill ?? "#000000";
        return `<text x="0" y="0" dominant-baseline="hanging" font-size="${h}" font-family="${l}" font-weight="${c}" font-style="${d}" fill="${f}" transform="${i}"${o}>${this.escapeXml(a.text)}</text>`;
      }
      case "image": {
        const a = t, h = await this.resolveImageDataUrl(a, e.imageEmbed, e.imageMaxEdge);
        return `<image x="0" y="0" width="${a.width}" height="${a.height}" href="${h}" transform="${i}"${o}/>`;
      }
      case "group": {
        const h = t.children.filter((l) => l instanceof G).map(
          (l) => this.nodeToSvg(l, {
            invWorld: e.invWorld,
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            imageEmbed: e.imageEmbed,
            imageMaxEdge: e.imageMaxEdge
          })
        );
        return (await Promise.all(h)).join("");
      }
      case "frame": {
        const a = t, h = a.children.filter((u) => u instanceof G).map(
          (u) => this.nodeToSvg(u, {
            invWorld: e.invWorld,
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            imageEmbed: e.imageEmbed,
            imageMaxEdge: e.imageMaxEdge
          })
        ), l = (await Promise.all(h)).join(""), c = a.backgroundColor ?? "none", d = `<rect x="0" y="0" width="${a.width}" height="${a.height}" fill="${c}" transform="${i}"${o}/>`;
        if (!a.clipContent)
          return `${d}${l}`;
        const f = `frame-clip-${a.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
        return [
          `<defs><clipPath id="${f}"><rect x="0" y="0" width="${a.width}" height="${a.height}" transform="${i}"/></clipPath></defs>`,
          d,
          `<g clip-path="url(#${f})">${l}</g>`
        ].join("");
      }
      default:
        return "";
    }
  }
  starPointsToSvg(t) {
    const e = t.width / 2, s = t.height / 2, i = t.outerRadius > 0 ? t.innerRadius / t.outerRadius : 0.5, n = e * i, o = s * i, a = e, h = s, l = [];
    for (let c = 0; c < t.points * 2; c++) {
      const d = c % 2 === 0, f = d ? e : n, u = d ? s : o, p = c * Math.PI / t.points - Math.PI / 2, m = Math.cos(p) * f + a, g = Math.sin(p) * u + h;
      l.push(`${m},${g}`);
    }
    return l.join(" ");
  }
  styleToSvg(t) {
    const e = t.fill ?? "none", s = t.stroke ?? "none", i = t.strokeWidth ?? 0;
    return ` fill="${e}" stroke="${s}" stroke-width="${i}"`;
  }
  escapeXml(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  async resolveImageDataUrl(t, e, s) {
    const i = t.source ?? "";
    if (typeof i == "string" && i.startsWith("data:") && e === "original")
      return i;
    const n = await this.loadImage(i);
    let o = n.naturalWidth || n.width, a = n.naturalHeight || n.height;
    if (e === "display")
      o = Math.max(1, Math.round(t.width)), a = Math.max(1, Math.round(t.height));
    else if (e === "max") {
      const c = Math.max(o, a);
      if (c > s) {
        const d = s / c;
        o = Math.max(1, Math.round(o * d)), a = Math.max(1, Math.round(a * d));
      }
    }
    const h = document.createElement("canvas");
    h.width = o, h.height = a;
    const l = h.getContext("2d");
    return l && l.drawImage(n, 0, 0, o, a), h.toDataURL("image/png");
  }
  loadImage(t) {
    return new Promise((e, s) => {
      const i = new Image();
      i.crossOrigin = "anonymous", i.onload = () => e(i), i.onerror = () => s(new Error("Failed to load image")), i.src = t;
    });
  }
  toDataUrl(t) {
    return new Promise((e, s) => {
      const i = new FileReader();
      i.onerror = () => s(i.error), i.onload = () => e(String(i.result)), i.readAsDataURL(t);
    });
  }
  isEditingText() {
    const t = document.activeElement;
    if (!t) return !1;
    const e = t.tagName.toLowerCase();
    return e === "input" || e === "textarea" || t.isContentEditable;
  }
  async undo() {
    await this.history?.undo(), this.ensureExportStoreConsistency(), this.dispatchLayerHierarchyChanged(), this.pointerController?.clearSelection();
  }
  async redo() {
    await this.history?.redo(), this.ensureExportStoreConsistency(), this.dispatchLayerHierarchyChanged(), this.pointerController?.clearSelection();
  }
  async exportJSON() {
    return this.ensureExportStoreConsistency(), await this.history?.exportDocument() ?? null;
  }
  async importJSON(t) {
    this.history ? await this.history.importDocument(t) : this.importExportPresetStore(t), this.dispatchLayerHierarchyChanged(), this.pointerController?.clearSelection(), this.world.scale.set(1), this.world.position.set(0, 0), this.dispatchOnHost(
      new CustomEvent("viewport:changed", {
        detail: {
          x: this.world.position.x,
          y: this.world.position.y,
          zoom: this.world.scale.x,
          source: "import"
        }
      })
    );
  }
  getExportSettingIds(t) {
    return this.findNodeById(this.objectLayer, t) ? [...this.getLinkedPresetIds(t)] : [];
  }
  getAllExportSettings() {
    return Object.entries(this.exportPresetStore.presets).map(([t, e]) => ({
      id: t,
      preset: { ...e },
      linkedNodeIds: this.getExportPresetUsage(t)
    }));
  }
  async addExportSetting(t, e, s = {}) {
    if (!this.findNodeById(this.objectLayer, t)) return null;
    this.ensureNodePresetLinkList(t);
    const n = typeof e.id == "string" && e.id.trim() ? e.id.trim() : this.createExportPresetId("preset"), o = this.ensureUniquePresetId(n, "preset"), a = je({ ...e, id: o });
    this.exportPresetStore.presets[o] = a;
    const h = this.getLinkedPresetIds(t);
    return h.includes(o) || (this.exportPresetStore.nodePresetIds[t] = [...h, o]), s.recordHistory !== !1 && await this.history?.capture(), { ...a };
  }
  getExportSettingById(t) {
    const e = this.exportPresetStore.presets[t];
    return e ? { ...e } : null;
  }
  async editExportSetting(t, e, s = {}) {
    const i = this.exportPresetStore.presets[t];
    if (!i) return null;
    const n = je({ ...i, ...e, id: t });
    return this.exportPresetStore.presets[t] = n, s.recordHistory !== !1 && await this.history?.capture(), { ...n };
  }
  async deleteExportSetting(t, e = {}) {
    return this.exportPresetStore.presets[t] ? (Object.entries(this.exportPresetStore.nodePresetIds).forEach(([s, i]) => {
      const n = i.filter((o) => o !== t);
      n.length ? this.exportPresetStore.nodePresetIds[s] = n : delete this.exportPresetStore.nodePresetIds[s];
    }), delete this.exportPresetStore.presets[t], this.ensureExportStoreConsistency(), e.recordHistory !== !1 && await this.history?.capture(), !0) : !1;
  }
  async exportNodeByPreset(t, e) {
    const s = this.findNodeById(this.objectLayer, t);
    if (!s || !this.getLinkedPresetIds(t).includes(e)) return null;
    const n = this.exportPresetStore.presets[e];
    if (!n) return null;
    const o = je(n), a = s instanceof $, h = a ? this.getFrameBounds(s) : this.getBoundsFromNodes([s]), l = Es(s.name || s.id || "export"), c = o.format, d = `${l}${o.suffix || ""}.${c}`;
    let f = null;
    if (a && o.backgroundMode !== "auto") {
      const u = s, p = u.backgroundColor;
      o.backgroundMode === "transparent" ? u.setBackgroundColor(null) : u.setBackgroundColor(o.backgroundColor ?? "#ffffff"), f = () => u.setBackgroundColor(p);
    }
    try {
      if (o.format === "svg") {
        const m = await this.exportSvgNodes([s], {
          padding: o.padding,
          imageEmbed: o.imageEmbed,
          imageMaxEdge: o.imageMaxEdge,
          background: o.backgroundMode === "solid" ? o.backgroundColor ?? "#ffffff" : void 0,
          scale: o.scale,
          boundsOverride: h
        });
        return m ? {
          nodeId: s.id,
          presetId: o.id,
          format: "svg",
          filename: d,
          mimeType: "image/svg+xml",
          content: m,
          contentType: "text"
        } : null;
      }
      const u = o.backgroundMode === "solid" ? o.backgroundColor ?? "#ffffff" : void 0, p = await this.exportRasterNodes([s], {
        type: o.format,
        quality: o.quality,
        padding: o.padding,
        background: u,
        scale: o.scale,
        boundsOverride: h
      });
      return p ? {
        nodeId: s.id,
        presetId: o.id,
        format: o.format,
        filename: d,
        mimeType: o.format === "jpg" ? "image/jpeg" : "image/png",
        content: p,
        contentType: "dataUrl"
      } : null;
    } finally {
      f?.();
    }
  }
  async exportNodesByPreset(t) {
    const e = [];
    for (const s of t) {
      const i = await this.exportNodeByPreset(s.nodeId, s.presetId);
      i && e.push(i);
    }
    return e;
  }
  snapshotExportPresetStore() {
    const t = {};
    Object.entries(this.exportPresetStore.presets).forEach(([s, i]) => {
      t[s] = { ...i };
    });
    const e = {};
    return Object.entries(this.exportPresetStore.nodePresetIds).forEach(([s, i]) => {
      e[s] = [...i];
    }), { presets: t, nodePresetIds: e };
  }
  importExportPresetStore(t) {
    this.exportPresetStore = Kt(t.exportStore), this.ensureExportStoreConsistency();
  }
  ensureExportStoreConsistency() {
    const t = new Set(this.getAllBaseNodes(this.objectLayer).map((s) => s.id)), e = {};
    Object.entries(this.exportPresetStore.nodePresetIds).forEach(([s, i]) => {
      if (!t.has(s)) return;
      const n = i.filter((o, a, h) => h.indexOf(o) === a && !!this.exportPresetStore.presets[o]);
      n.length && (e[s] = n);
    }), this.exportPresetStore.nodePresetIds = e, this.pruneOrphanExportPresets();
  }
  pruneOrphanExportPresets() {
    const t = /* @__PURE__ */ new Set();
    Object.values(this.exportPresetStore.nodePresetIds).forEach((e) => {
      e.forEach((s) => t.add(s));
    }), Object.keys(this.exportPresetStore.presets).forEach((e) => {
      t.has(e) || delete this.exportPresetStore.presets[e];
    });
  }
  createExportPresetId(t = "preset") {
    const e = Es(t).toLowerCase().replace(/[.]/g, "_") || "preset";
    return this.ensureUniquePresetId(`exp_${e}`, e);
  }
  ensureUniquePresetId(t, e, s) {
    const i = s ?? this.exportPresetStore.presets, n = (t || "").trim();
    if (n && !i[n]) return n;
    const o = Es(e).toLowerCase().replace(/[.]/g, "_") || "preset";
    let a = `exp_${o}_${crypto.randomUUID().slice(0, 8)}`;
    for (; i[a]; )
      a = `exp_${o}_${crypto.randomUUID().slice(0, 8)}`;
    return a;
  }
  getLinkedPresetIds(t) {
    return (this.exportPresetStore.nodePresetIds[t] ?? []).filter((s) => !!this.exportPresetStore.presets[s]);
  }
  ensureNodePresetLinkList(t) {
    this.exportPresetStore.nodePresetIds[t] || (this.exportPresetStore.nodePresetIds[t] = []);
  }
  getExportPresetUsage(t) {
    return Object.entries(this.exportPresetStore.nodePresetIds).filter(([, e]) => e.includes(t)).map(([e]) => e);
  }
  hasDocumentContent() {
    return this.history?.hasContent() ?? !1;
  }
  async clearDocument() {
    await this.history?.clearDocument(), this.exportPresetStore = { ...vr }, this.dispatchLayerHierarchyChanged(), this.pointerController?.clearSelection();
  }
  setCursor(t) {
    this.resetCursor(), t && this.host?.classList.add(`ccd-cursor-${t}`);
  }
  resetCursor() {
    if (this.host)
      for (const t of Array.from(this.host.classList))
        t.startsWith("ccd-cursor-") && this.host.classList.remove(t);
  }
  useTool(t) {
    this.pointerController?.setTool(t);
    const e = gc[t];
    this.setCursor(e);
    const s = new CustomEvent("tool:changed", {
      detail: { tool: t }
    });
    this.dispatchOnHost(s);
  }
  dispatchLayerHierarchyChanged() {
    const t = Xt.getHierarchy(this.objectLayer), e = new CustomEvent("layer:changed", {
      detail: { hierarchy: t }
    });
    this.dispatchOnHost(e);
  }
  selectNodeById(t) {
    const e = t ? this.findNodeById(this.objectLayer, t) : null;
    this.pointerController?.selectNode(e);
  }
  selectNodesById(t) {
    const e = t.map((s) => this.findNodeById(this.objectLayer, s)).filter((s) => s !== null);
    this.pointerController?.selectNodes(e);
  }
  setHoverById(t) {
    const e = t ? this.findNodeById(this.objectLayer, t) : null;
    this.pointerController?.setHoverNode(e);
  }
  getFlatLayers(t = {}) {
    const { parentId: e = null, recursive: s = !0, topFirst: i = !0 } = t, n = this.resolveLayerParent(e);
    if (!n) return [];
    const o = [];
    return this.collectFlatLayers(n, e, 0, o, s, i), o;
  }
  canMoveLayer(t, e, s) {
    return this.validateLayerMove([t], e, s);
  }
  canMoveLayers(t, e, s) {
    return this.validateLayerMove(t, e, s);
  }
  async moveLayer(t, e, s, i = {}) {
    return this.moveLayers([t], e, s, i);
  }
  async moveLayers(t, e, s, i = {}) {
    if (!this.validateLayerMove(t, e, s).ok) return !1;
    const o = this.getMoveSourceNodes(t), a = this.findNodeById(this.objectLayer, e);
    if (!a) return !1;
    const h = s === "inside" ? a : a.parent;
    if (!h) return !1;
    const l = this.resolveInsertionIndex(o, h, a, s), c = o.slice().sort((u, p) => this.compareNodeStackOrder(u, p)), d = /* @__PURE__ */ new Map();
    c.forEach((u) => {
      d.set(u.id, {
        origin: u.toGlobal(new C(0, 0)),
        xAxis: u.toGlobal(new C(1, 0)),
        yAxis: u.toGlobal(new C(0, 1))
      }), u.parent?.removeChild(u);
    });
    let f = Math.max(0, Math.min(l, h.children.length));
    return c.forEach((u) => {
      h.addChildAt(u, f);
      const p = d.get(u.id);
      p && this.applyWorldTransformToParent(u, h, p), f += 1;
    }), this.dispatchLayerHierarchyChanged(), i.recordHistory !== !1 && await this.history?.capture(), !0;
  }
  /**
   * Apply property updates to one or more nodes by id.
   * Pass the ids/props you received from `layer:changed` or `properties:changed`.
   */
  applyNodeProperties(t) {
    const e = Array.isArray(t) ? t : [t], s = [];
    if (e.forEach(({ id: i, props: n }) => {
      const o = this.findNodeById(this.objectLayer, i);
      if (o) {
        if (o.type === "star") {
          const a = o, h = Object.prototype.hasOwnProperty.call(n, "points"), l = Object.prototype.hasOwnProperty.call(n, "innerRadius"), c = Object.prototype.hasOwnProperty.call(n, "outerRadius"), d = Object.prototype.hasOwnProperty.call(n, "innerRatio");
          if (h || l || c || d) {
            const f = a.outerRadius > 0 ? a.innerRadius / a.outerRadius : 0.5;
            if (h && (a.points = Number(n.points)), c) {
              const u = Number(n.outerRadius);
              a.outerRadius = u, o.width = u * 2, o.height = u * 2, !l && !d && (a.innerRadius = u * f);
            }
            if (l && (a.innerRadius = Number(n.innerRadius)), d) {
              const u = Number(n.innerRatio), p = Number.isFinite(u) ? Math.max(0, Math.min(1, u)) : f;
              a.innerRadius = a.outerRadius * p;
            }
            a.redraw?.();
          }
        }
        Object.entries(n).forEach(([a, h]) => {
          if (!(o.locked && a !== "locked" && a !== "visible") && !(o.type === "star" && (a === "points" || a === "innerRadius" || a === "outerRadius" || a === "innerRatio")))
            switch (a) {
              case "name":
                o.name = h;
                break;
              case "x":
                this.setNodeGlobalPosition(o, Number(h), void 0);
                break;
              case "y":
                this.setNodeGlobalPosition(o, void 0, Number(h));
                break;
              case "width":
                o.width = Number(h);
                break;
              case "height":
                o.height = Number(h);
                break;
              case "scaleX":
                o.scale.x = Number(h);
                break;
              case "scaleY":
                o.scale.y = Number(h);
                break;
              case "rotation":
                o.type !== "frame" && (o.rotation = Number(h));
                break;
              case "visible":
                o.visible = this.parseBoolean(h);
                break;
              case "locked":
                o.locked = this.parseBoolean(h);
                break;
              case "fill":
              case "stroke":
              case "strokeWidth":
              case "opacity":
                this.applyStyle(o, a, h);
                break;
              case "fontSize":
              case "fontFamily":
              case "fontWeight":
              case "fontStyle":
                o.type === "text" && this.applyStyle(o, a, h);
                break;
              case "radius":
                "radius" in o && (o.radius = Number(h), o.width = Number(h) * 2, o.height = Number(h) * 2, o.redraw?.());
                break;
              case "cornerRadius":
                "cornerRadius" in o && (o.cornerRadius = Number(h), o.redraw?.());
                break;
              case "text":
                "setText" in o && o.setText(h);
                break;
              case "background":
              case "backgroundColor":
                o.type === "frame" && o.setBackgroundColor(
                  h === null || h === "" ? null : String(h)
                );
                break;
              case "clipContent":
                o.type === "frame" && o.setClipContent(this.parseBoolean(h));
                break;
              case "startX":
              case "startY":
              case "endX":
              case "endY":
                if (o.type === "line") {
                  const l = this.getLinePointGlobal(o, "start"), c = this.getLinePointGlobal(o, "end"), d = { ...l }, f = { ...c };
                  a === "startX" && (d.x = Number(h)), a === "startY" && (d.y = Number(h)), a === "endX" && (f.x = Number(h)), a === "endY" && (f.y = Number(h));
                  const u = o.parent, p = u ? u.toLocal(new C(d.x, d.y)) : new C(d.x, d.y), m = u ? u.toLocal(new C(f.x, f.y)) : new C(f.x, f.y);
                  o.position.set(p.x, p.y), o.startX = 0, o.startY = 0, o.endX = m.x - p.x, o.endY = m.y - p.y, o.refresh?.(), o.redraw?.();
                }
                break;
            }
        }), s.push(o);
      }
    }), s.length) {
      s.some((o) => o.locked || !o.visible) && this.pointerController?.clearSelection();
      const i = s.map(
        (o) => typeof o.getInspectable == "function" ? o.getInspectable() : null
      ).filter((o) => o !== null), n = new CustomEvent("properties:changed", { detail: { nodes: i } });
      this.dispatchOnHost(n), this.dispatchLayerHierarchyChanged(), this.history?.capture();
    }
  }
  applyStyle(t, e, s) {
    if (t.type === "frame") {
      const o = t;
      if (e === "fill") {
        o.setBackgroundColor(s === null || s === "" ? null : String(s));
        return;
      }
      if (e === "stroke" || e === "strokeWidth")
        return;
      if (e === "opacity") {
        o.setStyle({ opacity: Number(s) });
        return;
      }
    }
    const i = e === "strokeWidth" ? Math.max(0, Math.round(Number.isFinite(Number(s)) ? Number(s) : 0)) : e === "fontFamily" ? ec(s) : e === "fontStyle" ? ic(s) : e === "fontWeight" ? sc(s) : s, n = { [e]: i };
    "setStyle" in t && typeof t.setStyle == "function" ? t.setStyle(n) : (t.style = { ...t.style, ...n }, t.redraw?.());
  }
  setNodeGlobalPosition(t, e, s) {
    const i = this.getNodeGlobalPosition(t), n = e ?? i.x, o = s ?? i.y, a = t.parent ? t.parent.toLocal(new C(n, o)) : new C(n, o);
    t.position.set(a.x, a.y);
  }
  getNodeGlobalPosition(t) {
    return t.parent ? t.parent.toGlobal(new C(t.position.x, t.position.y)) : new C(t.position.x, t.position.y);
  }
  getLinePointGlobal(t, e) {
    const s = new C(
      t.position.x + (e === "start" ? t.startX : t.endX),
      t.position.y + (e === "start" ? t.startY : t.endY)
    );
    return t.parent ? t.parent.toGlobal(s) : s;
  }
  resolveLayerParent(t) {
    if (t === null) return this.objectLayer;
    const e = this.findNodeById(this.objectLayer, t);
    return !e || !(e instanceof st || e instanceof $) ? null : e;
  }
  collectFlatLayers(t, e, s, i, n, o) {
    const a = t.children.filter((l) => l instanceof G);
    (o ? a.slice().reverse() : a.slice()).forEach((l) => {
      i.push({
        id: l.id,
        type: l.type,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
        parentId: e,
        depth: s,
        zIndex: t.getChildIndex(l),
        isGroup: l instanceof st,
        childCount: l.children.filter((c) => c instanceof G).length
      }), n && l instanceof st && this.collectFlatLayers(l, l.id, s + 1, i, n, o);
    });
  }
  validateLayerMove(t, e, s) {
    if (!t.length) return { ok: !1, reason: "No source ids provided." };
    const i = Array.from(new Set(t));
    if (i.includes(e))
      return { ok: !1, reason: "Source and target cannot be the same node." };
    if (i.map((l) => this.findNodeById(this.objectLayer, l)).some((l) => !l))
      return { ok: !1, reason: "Some source ids do not exist." };
    const o = this.getMoveSourceNodes(i);
    if (!o.length)
      return { ok: !1, reason: "No valid source nodes found." };
    const a = this.findNodeById(this.objectLayer, e);
    if (!a) return { ok: !1, reason: "Target node not found." };
    const h = s === "inside" ? a : a.parent;
    return h ? s === "inside" && !(a instanceof st || a instanceof $) ? { ok: !1, reason: "Only group or frame nodes can accept inside drops." } : h instanceof G && h.locked ? { ok: !1, reason: "Destination parent is locked." } : o.some((l) => l.locked) ? { ok: !1, reason: "Locked nodes cannot be moved." } : o.some((l) => l instanceof $) && h !== this.objectLayer ? { ok: !1, reason: "Frames must stay at the root level." } : o.some((l) => this.isAncestorNode(l, h)) ? { ok: !1, reason: "Cannot move a node into its own descendant." } : { ok: !0 } : { ok: !1, reason: "Target has no destination parent." };
  }
  resolveInsertionIndex(t, e, s, i) {
    if (i === "inside")
      return e.children.length;
    let n = e.getChildIndex(s);
    return i === "after" && (n += 1), t.forEach((o) => {
      if (o.parent !== e) return;
      e.getChildIndex(o) < n && (n -= 1);
    }), n;
  }
  getMoveSourceNodes(t) {
    const s = Array.from(new Set(t)).map((n) => this.findNodeById(this.objectLayer, n)).filter((n) => n !== null), i = new Set(s);
    return s.filter((n) => !this.hasAncestorInSet(n, i));
  }
  hasAncestorInSet(t, e) {
    let s = t.parent;
    for (; s; ) {
      if (s instanceof G && e.has(s)) return !0;
      if (s === this.objectLayer) break;
      s = s.parent;
    }
    return !1;
  }
  isAncestorNode(t, e) {
    let s = e;
    for (; s; ) {
      if (s === t) return !0;
      if (s === this.objectLayer) break;
      s = s.parent;
    }
    return !1;
  }
  compareNodeStackOrder(t, e) {
    const s = this.getNodePathIndices(t), i = this.getNodePathIndices(e), n = Math.min(s.length, i.length);
    for (let o = 0; o < n; o += 1)
      if (s[o] !== i[o]) return s[o] - i[o];
    return s.length - i.length;
  }
  getNodePathIndices(t) {
    const e = [];
    let s = t;
    for (; s && s !== this.objectLayer; ) {
      const i = s.parent;
      if (!i) break;
      e.push(i.getChildIndex(s)), s = i;
    }
    return e.reverse();
  }
  applyWorldTransformToParent(t, e, s) {
    const i = e.toLocal(s.origin), n = e.toLocal(s.xAxis), o = e.toLocal(s.yAxis), a = new C(n.x - i.x, n.y - i.y), h = new C(o.x - i.x, o.y - i.y), l = Math.hypot(a.x, a.y) || 1, c = Math.hypot(h.x, h.y) || 1, d = Math.atan2(a.y, a.x);
    t.position.copyFrom(i), t.rotation = d, t.scale.set(l, c);
  }
  findNodeById(t, e) {
    for (const s of t.children) {
      if (s.id === e) return s;
      if (s instanceof q) {
        const i = this.findNodeById(s, e);
        if (i) return i;
      }
    }
    return null;
  }
  dispatchOnHost(t) {
    this.dispatchEvent(t);
  }
  destroy() {
    this.app.ticker.remove(this.syncStageHitArea), this.app.ticker.remove(this.updateRuler), this.app.ticker.remove(this.updateZoomLabel), window.removeEventListener("keydown", this.onZoomKeyDown), window.removeEventListener("keydown", this.onUndoRedoKeyDown), window.removeEventListener("keydown", this.onToolKeyDown), this.pointerControllerKeyDownHandler && window.removeEventListener("keydown", this.pointerControllerKeyDownHandler), this.pointerControllerKeyUpHandler && window.removeEventListener("keyup", this.pointerControllerKeyUpHandler), this.app.canvas.removeEventListener("wheel", this.onCanvasWheel), this.host?.removeEventListener("dragover", this.onHostDragOver), this.host?.removeEventListener("drop", this.onHostDrop), this.host?.removeEventListener("paste", this.onHostPaste), window.removeEventListener("paste", this.onWindowPaste), this.host?.removeEventListener("pointerdown", this.onHostPointerDown), this.host?.removeEventListener("pointermove", this.onHostPointerMove), this.host?.removeEventListener("pointerup", this.onHostPointerUp), this.host?.removeEventListener("dblclick", this.onHostDoubleClick), this.host?.removeEventListener("pointercancel", this.onHostPointerCancel), this.pointerController && (this.pointerController.removeEventListener(
      "shape:created",
      this.onPointerControllerShapeCreated
    ), this.pointerController.removeEventListener(
      "viewport:changed",
      this.onPointerControllerViewportChanged
    ), this.pointerController.removeEventListener(
      "hover:changed",
      this.onPointerControllerHoverChanged
    )), this.pointerControllerKeyDownHandler = void 0, this.pointerControllerKeyUpHandler = void 0, this.pointerController = void 0, this.ruler = void 0, this.zoomLabel = void 0, this.history = void 0, this.host = void 0, this.isInitialized = !1, this.app.destroy(!0);
  }
  getLayerHierarchy() {
    return Xt.getHierarchy(this.objectLayer);
  }
  getFrames() {
    return this.getAllBaseNodes(this.objectLayer).filter((t) => t instanceof $);
  }
  getFrameById(t) {
    const e = this.findNodeById(this.objectLayer, t);
    return e instanceof $ ? e : null;
  }
  getPixiApp() {
    return this.app;
  }
}
export {
  V as $,
  xn as A,
  et as B,
  q as C,
  rt as D,
  z as E,
  Fr as F,
  ts as G,
  ut as H,
  Xr as I,
  Pi as J,
  Jt as K,
  aa as L,
  F as M,
  ma as N,
  Me as O,
  C as P,
  j as Q,
  Ys as R,
  ti as S,
  Ne as T,
  Gs as U,
  Fa as V,
  Ti as W,
  xs as X,
  Ai as Y,
  Do as Z,
  Ve as _,
  on as a,
  Bo as a0,
  Gr as a1,
  hi as a2,
  bn as a3,
  B as a4,
  W as a5,
  za as a6,
  ch as a7,
  ih as a8,
  Ah as a9,
  Eh as aa,
  Dh as ab,
  Bh as ac,
  zh as ad,
  Sn as ae,
  jt as af,
  qe as ag,
  yr as ah,
  Xn as ai,
  Xa as aj,
  $t as ak,
  Ln as al,
  $i as am,
  Wi as an,
  tt as ao,
  ro as ap,
  _r as aq,
  Bn as ar,
  xc as as,
  gc as at,
  yc as au,
  xt as b,
  Xh as c,
  th as d,
  ht as e,
  Ui as f,
  Za as g,
  _e as h,
  $e as i,
  Js as j,
  gn as k,
  Vr as l,
  lt as m,
  cn as n,
  qs as o,
  Th as p,
  Ih as q,
  bo as r,
  Gh as s,
  Fh as t,
  U as u,
  D as v,
  J as w,
  io as x,
  Yh as y,
  at as z
};

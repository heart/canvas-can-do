import { Container } from 'pixi.js';
import type { TextStyleFontWeight } from 'pixi.js';

export type NodeType = 'rectangle' | 'circle' | 'text' | 'line' | 'ellipse' | 'star' | 'image' | 'group';

export type PropertyType = 'string' | 'int' | 'float' | 'color' | 'boolean';
export type PropertyGroup =
  | 'Meta'
  | 'Transform'
  | 'Appearance'
  | 'Geometry'
  | 'Text'
  | 'Line'
  | 'Image';

export interface NodePropertyDescriptor {
  name: string;
  key: string;
  type: PropertyType;
  value: string | number | boolean | null;
  group?: PropertyGroup;
  desc?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface InspectableNode {
  id: string;
  type: NodeType;
  name: string;
  props: NodePropertyDescriptor[];
}

export type PropertiesChangedEvent = CustomEvent<{
  nodes: InspectableNode[];
}>;

export interface Style {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: TextStyleFontWeight;
  fontStyle?: 'normal' | 'italic' | 'oblique';
}

export class BaseNode extends Container {
  readonly id: string;
  readonly type: NodeType;
  name: string;
  style: Style;
  locked: boolean;
  protected _width: number = 0;
  protected _height: number = 0;

  constructor(options: {
    id?: string;
    type: NodeType;
    name?: string;
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
    this.name = options.name ?? this.defaultNameForType(options.type);
    this.style = options.style ?? {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1,
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

  protected defaultNameForType(type: NodeType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
    // Redraw visuals when dimensions change (after graphics exist)
    const self: any = this as any;
    if (typeof self.redraw === 'function' && self.graphics) {
      self.redraw();
    }
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
    // Redraw visuals when dimensions change (after graphics exist)
    const self: any = this as any;
    if (typeof self.redraw === 'function' && self.graphics) {
      self.redraw();
    }
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

  // Override in subclasses to return a deep clone; offset is applied to position
  // Default implementation throws to surface missing overrides.
  clone(_offsetX = 0, _offsetY = 0): BaseNode {
    throw new Error(`clone() not implemented for ${this.type}`);
  }

  protected toColorString(color: string | number | undefined): string | null {
    if (color === undefined) return null;
    if (typeof color === 'string') return color;
    const hex = Math.round(color).toString(16).padStart(6, '0');
    return `#${hex}`;
  }

  getProps(): NodePropertyDescriptor[] {
    return [
      {
        name: 'Name',
        key: 'name',
        type: 'string',
        value: this.name,
        desc: 'Display name',
        group: 'Meta',
      },
      {
        name: 'Visible',
        key: 'visible',
        type: 'boolean',
        value: this.visible,
        desc: 'Toggle visibility',
        group: 'Meta',
      },
      {
        name: 'Locked',
        key: 'locked',
        type: 'boolean',
        value: this.locked,
        desc: 'Lock editing',
        group: 'Meta',
      },
      {
        name: 'X',
        key: 'x',
        type: 'int',
        value: this.position.x,
        desc: 'X position',
        group: 'Transform',
      },
      {
        name: 'Y',
        key: 'y',
        type: 'int',
        value: this.position.y,
        desc: 'Y position',
        group: 'Transform',
      },
      {
        name: 'Width',
        key: 'width',
        type: 'int',
        value: this.width,
        desc: 'Width',
        min: 0,
        group: 'Transform',
      },
      {
        name: 'Height',
        key: 'height',
        type: 'int',
        value: this.height,
        desc: 'Height',
        min: 0,
        group: 'Transform',
      },
      {
        name: 'Scale X',
        key: 'scaleX',
        type: 'float',
        value: this.scale.x,
        desc: 'Horizontal scale',
        group: 'Transform',
      },
      {
        name: 'Scale Y',
        key: 'scaleY',
        type: 'float',
        value: this.scale.y,
        desc: 'Vertical scale',
        group: 'Transform',
      },
      {
        name: 'Rotation',
        key: 'rotation',
        type: 'float',
        value: this.rotation,
        desc: 'Rotation (radians)',
        group: 'Transform',
      },
      {
        name: 'Fill',
        key: 'fill',
        type: 'color',
        value: this.toColorString(this.style.fill),
        desc: 'Fill color',
        group: 'Appearance',
      },
      {
        name: 'Stroke',
        key: 'stroke',
        type: 'color',
        value: this.toColorString(this.style.stroke),
        desc: 'Stroke color',
        group: 'Appearance',
      },
      {
        name: 'Stroke Width',
        key: 'strokeWidth',
        type: 'float',
        value: this.style.strokeWidth ?? 1,
        desc: 'Stroke width',
        min: 0,
        group: 'Appearance',
      },
      {
        name: 'Opacity',
        key: 'opacity',
        type: 'float',
        value: this.style.opacity ?? 1,
        desc: 'Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        group: 'Appearance',
      },
    ];
  }

  getInspectable(): InspectableNode {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      props: this.getProps(),
    };
  }
}

declare global {
  interface WindowEventMap {
    'properties:changed': PropertiesChangedEvent;
  }
}

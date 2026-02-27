import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';

export class FrameNode extends BaseNode {
  readonly type = 'frame' as const;
  protected backgroundGraphics: Graphics;
  protected clipGraphics: Graphics;
  private _backgroundColor: string | null;
  private _borderColor: string;
  private _borderWidth: number;
  private _clipContent: boolean;

  constructor(options: {
    id?: string;
    name?: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number | { x: number; y: number };
    style?: Style;
    visible?: boolean;
    locked?: boolean;
    backgroundColor?: string | null;
    borderColor?: string;
    borderWidth?: number;
    // legacy alias for backward compatibility
    background?: string | null;
    clipContent?: boolean;
    children?: BaseNode[];
  }) {
    super({
      id: options.id,
      type: 'frame',
      name: options.name,
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    this._width = options.width;
    this._height = options.height;
    this._backgroundColor =
      options.backgroundColor !== undefined ? options.backgroundColor : (options.background ?? '#ffffff');
    this._borderColor = options.borderColor ?? '#A0A0A0';
    this._borderWidth = this.normalizeBorderWidth(options.borderWidth ?? 1);
    this._clipContent = options.clipContent ?? true;

    this.backgroundGraphics = new Graphics();
    this.clipGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);
    this.addChild(this.clipGraphics);
    this.redraw();

    options.children?.forEach((child) => {
      this.addChild(child);
    });
  }

  protected redraw(): void {
    const opacity = this.style.opacity ?? 1;
    const strokeColor = parseInt(this._borderColor.replace('#', ''), 16);

    this.backgroundGraphics.clear();
    this.backgroundGraphics.rect(0, 0, this.width, this.height);
    if (this._backgroundColor !== null) {
      const fillColor = parseInt(this._backgroundColor.replace('#', ''), 16);
      this.backgroundGraphics.fill({
        color: fillColor,
        alpha: opacity,
      });
    }
    this.backgroundGraphics.stroke({
      color: strokeColor ?? 0xa0a0a0,
      width: this._borderWidth,
      alpha: opacity,
    });

    this.clipGraphics.clear();
    this.clipGraphics.rect(0, 0, this.width, this.height);
    this.clipGraphics.fill({ color: 0xffffff, alpha: 1 });
    this.mask = this._clipContent ? this.clipGraphics : null;
  }

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
    this.redraw();
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
    this.redraw();
  }

  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    if (style.fill !== undefined) {
      this.setBackgroundColor(style.fill === null ? null : String(style.fill));
    }
    if (style.stroke !== undefined) {
      this.setBorderColor(String(style.stroke));
    }
    if (style.strokeWidth !== undefined) {
      this.setBorderWidth(Number(style.strokeWidth));
    }
    this.redraw();
    return this;
  }

  get backgroundColor(): string | null {
    return this._backgroundColor;
  }

  setBackgroundColor(backgroundColor: string | null): this {
    this._backgroundColor = backgroundColor;
    this.redraw();
    return this;
  }

  get borderColor(): string {
    return this._borderColor;
  }

  setBorderColor(borderColor: string): this {
    this._borderColor = borderColor;
    this.redraw();
    return this;
  }

  get borderWidth(): number {
    return this._borderWidth;
  }

  setBorderWidth(borderWidth: number): this {
    this._borderWidth = this.normalizeBorderWidth(borderWidth);
    this.redraw();
    return this;
  }

  private normalizeBorderWidth(value: number): number {
    return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
  }

  // legacy aliases
  get background(): string | null {
    return this.backgroundColor;
  }

  setBackground(background: string | null): this {
    return this.setBackgroundColor(background);
  }

  get clipContent(): boolean {
    return this._clipContent;
  }

  setClipContent(enabled: boolean): this {
    this._clipContent = enabled;
    this.redraw();
    return this;
  }

  getProps(): NodePropertyDescriptor[] {
    const baseProps = super
      .getProps()
      .filter((prop) => prop.key !== 'fill' && prop.key !== 'stroke' && prop.key !== 'strokeWidth');
    return [
      ...baseProps,
      {
        name: 'Background Color',
        key: 'backgroundColor',
        type: 'color',
        value: this.backgroundColor,
        desc: 'Frame background color (null = transparent)',
        group: 'Appearance',
      },
      {
        name: 'Border Color',
        key: 'borderColor',
        type: 'color',
        value: this.borderColor,
        desc: 'Frame border color',
        group: 'Appearance',
      },
      {
        name: 'Border Width',
        key: 'borderWidth',
        type: 'int',
        value: this.borderWidth,
        desc: 'Frame border width',
        min: 0,
        step: 1,
        group: 'Appearance',
      },
      {
        name: 'Clip Content',
        key: 'clipContent',
        type: 'boolean',
        value: this.clipContent,
        desc: 'Mask children to frame bounds',
        group: 'Appearance',
      },
    ];
  }

  clone(offsetX = 0, offsetY = 0): FrameNode {
    const clonedChildren = this.children
      .filter((child): child is BaseNode => child instanceof BaseNode)
      .map((child) => child.clone(0, 0));

    return new FrameNode({
      name: this.name,
      width: this.width,
      height: this.height,
      x: this.position.x + offsetX,
      y: this.position.y + offsetY,
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      style: { ...this.style },
      visible: this.visible,
      locked: this.locked,
      backgroundColor: this.backgroundColor,
      borderColor: this.borderColor,
      borderWidth: this.borderWidth,
      clipContent: this.clipContent,
      children: clonedChildren,
    });
  }
}

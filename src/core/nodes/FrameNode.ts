import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';

export class FrameNode extends BaseNode {
  readonly type = 'frame' as const;
  protected backgroundGraphics: Graphics;
  protected clipGraphics: Graphics;
  private _background: string | null;
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
    this._background = options.background ?? '#ffffff';
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
    const stroke = this.style.stroke ?? '#A0A0A0';
    const strokeWidth = this.style.strokeWidth ?? 1;
    const opacity = this.style.opacity ?? 1;
    const strokeColor = typeof stroke === 'string' ? parseInt(stroke.replace('#', ''), 16) : stroke;

    this.backgroundGraphics.clear();
    this.backgroundGraphics.rect(0, 0, this.width, this.height);
    if (this._background !== null) {
      const fillColor = parseInt(this._background.replace('#', ''), 16);
      this.backgroundGraphics.fill({
        color: fillColor,
        alpha: opacity,
      });
    }
    this.backgroundGraphics.stroke({
      color: strokeColor ?? 0xa0a0a0,
      width: strokeWidth,
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
    this.redraw();
    return this;
  }

  get background(): string | null {
    return this._background;
  }

  setBackground(background: string | null): this {
    this._background = background;
    this.redraw();
    return this;
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
    return [
      ...super.getProps(),
      {
        name: 'Background',
        key: 'background',
        type: 'color',
        value: this.background,
        desc: 'Frame background color (null = transparent)',
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
      background: this.background,
      clipContent: this.clipContent,
      children: clonedChildren,
    });
  }
}

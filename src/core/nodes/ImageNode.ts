import { Sprite, Texture } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';

export type ImageSource = string | File | Blob;

export class ImageNode extends BaseNode {
  readonly type = 'image' as const;
  protected sprite: Sprite;
  source?: ImageSource;

  constructor(options: {
    id?: string;
    texture: Texture;
    source?: ImageSource;
    width?: number;
    height?: number;
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
      type: 'image',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    this.source = options.source;
    this.sprite = new Sprite(options.texture);
    this.addChild(this.sprite);

    this._width = options.width ?? options.texture.width;
    this._height = options.height ?? options.texture.height;
    this.redraw();
  }

  static async fromSource(options: {
    source: ImageSource;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scale?: number | { x: number; y: number };
    style?: Style;
    visible?: boolean;
    locked?: boolean;
  }): Promise<ImageNode> {
    const { dataUrl, texture } = await ImageNode.prepareSource(options.source);
    const node = new ImageNode({
      texture,
      source: dataUrl,
      width: options.width,
      height: options.height,
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });
    return node;
  }

  private static async prepareSource(source: ImageSource): Promise<{ dataUrl: string; texture: Texture }> {
    const dataUrl = await ImageNode.toDataUrl(source);
    const texture = Texture.from(dataUrl);
    return { dataUrl, texture };
  }

  private static async toDataUrl(source: ImageSource): Promise<string> {
    if (typeof source === 'string') {
      if (source.startsWith('data:')) return source;
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const blob = await res.blob();
      return ImageNode.blobToDataUrl(blob);
    }
    return ImageNode.blobToDataUrl(source);
  }

  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  }

  protected redraw(): void {
    this.sprite.width = this._width;
    this.sprite.height = this._height;
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
    return this;
  }

  getProps(): NodePropertyDescriptor[] {
    return [
      ...super.getProps(),
      {
        name: 'Source',
        key: 'source',
        type: 'string',
        value: typeof this.source === 'string' ? this.source : '',
        desc: 'Image source',
      },
    ];
  }

  clone(offsetX = 0, offsetY = 0): ImageNode {
    return new ImageNode({
      texture: this.sprite.texture,
      source: this.source,
      width: this.width,
      height: this.height,
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

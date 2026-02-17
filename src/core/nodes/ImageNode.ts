import { Assets, Sprite, Texture } from 'pixi.js';
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
    const { texture, revoke } = await ImageNode.loadTexture(options.source);
    const node = new ImageNode({
      texture,
      source: options.source,
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
    if (revoke) revoke();
    return node;
  }

  private static async loadTexture(source: ImageSource): Promise<{ texture: Texture; revoke?: () => void }> {
    if (typeof source === 'string') {
      const texture = await Assets.load<Texture>(source);
      if (texture) return { texture };
      const fallback = await ImageNode.loadTextureFromUrl(source);
      return { texture: fallback };
    }

    const url = URL.createObjectURL(source);
    try {
      const texture = await Assets.load<Texture>(url);
      if (texture) return { texture, revoke: () => URL.revokeObjectURL(url) };
      const fallback = await ImageNode.loadTextureFromUrl(url);
      return { texture: fallback, revoke: () => URL.revokeObjectURL(url) };
    } catch {
      const fallback = await ImageNode.loadTextureFromUrl(url);
      return { texture: fallback, revoke: () => URL.revokeObjectURL(url) };
    }
  }

  private static loadTextureFromUrl(url: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(Texture.from(img));
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
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

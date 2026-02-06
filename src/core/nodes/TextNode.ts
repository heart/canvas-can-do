import { Text } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';

export class TextNode extends BaseNode {
  readonly type = 'text' as const;
  protected textSprite: Text;
  text: string;

  constructor(options: {
    id?: string;
    text: string;
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
      type: 'text',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    this.text = options.text;
    
    // Setup text sprite
    this.textSprite = new Text({
      text: this.text,
      style: {
        fill: this.style.fill ?? 0x000000,
        fontSize: 16
      }
    });
    this.addChild(this.textSprite);
    
    // Set initial dimensions
    this._width = this.textSprite.width;
    this._height = this.textSprite.height;
  }

  setText(text: string): this {
    this.text = text;
    this.textSprite.text = text;
    this._width = this.textSprite.width;
    this._height = this.textSprite.height;
    return this;
  }

  setStyle(style: Partial<Style>): this {
    this.style = { ...this.style, ...style };
    if (style.fill) {
      const fillColor = typeof style.fill === 'string' 
        ? parseInt(style.fill.replace('#', ''), 16) 
        : style.fill;
      this.textSprite.style.fill = fillColor;
    }
    return this;
  }

  getProps() {
    return [
      ...super.getProps(),
      {
        name: 'Text',
        key: 'text',
        type: 'string',
        value: this.text,
        desc: 'Text content',
      },
    ];
  }

  clone(offsetX = 0, offsetY = 0): TextNode {
    return new TextNode({
      text: this.text,
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

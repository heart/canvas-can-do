import { Text } from 'pixi.js';
import type { TextStyleFontWeight } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../fonts/fontOptions';

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
    const fontSize = this.style.fontSize ?? 20;
    const fontFamily = this.style.fontFamily ?? DEFAULT_FONT_FAMILY;
    const fontWeight = (this.style.fontWeight ?? 'normal') as TextStyleFontWeight;
    const fontStyle = this.style.fontStyle ?? 'normal';
    this.textSprite = new Text({
      text: this.text,
      style: {
        fill: this.style.fill ?? 0x000000,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
      },
    });
    this.textSprite.resolution = Math.max(1, window.devicePixelRatio || 1);
    this.textSprite.roundPixels = true;
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
    if (style.fill !== undefined) {
      const fillColor =
        typeof style.fill === 'string'
          ? parseInt(style.fill.replace('#', ''), 16)
        : style.fill;
      this.textSprite.style.fill = fillColor;
    }
    if (style.fontSize !== undefined) {
      this.textSprite.style.fontSize = style.fontSize;
    }
    if (style.fontFamily !== undefined) {
      this.textSprite.style.fontFamily = style.fontFamily;
    }
    if (style.fontWeight !== undefined) {
      this.textSprite.style.fontWeight = style.fontWeight as TextStyleFontWeight;
    }
    if (style.fontStyle !== undefined) {
      this.textSprite.style.fontStyle = style.fontStyle;
    }
    this._width = this.textSprite.width;
    this._height = this.textSprite.height;
    return this;
  }

  getProps(): NodePropertyDescriptor[] {
    return [
      ...super.getProps(),
      {
        name: 'Font Size',
        key: 'fontSize',
        type: 'float',
        value: this.style.fontSize ?? 20,
        desc: 'Font size',
        min: 1,
        group: 'Text',
      },
      {
        name: 'Font Family',
        key: 'fontFamily',
        type: 'enum',
        value: this.style.fontFamily ?? DEFAULT_FONT_FAMILY,
        options: [...FONT_FAMILY_OPTIONS],
        desc: 'Font family',
        group: 'Text',
      },
      {
        name: 'Font Weight',
        key: 'fontWeight',
        type: 'enum',
        value: (this.style.fontWeight ?? 'normal') as string,
        options: [...FONT_WEIGHT_OPTIONS],
        desc: 'Font weight',
        group: 'Text',
      },
      {
        name: 'Font Style',
        key: 'fontStyle',
        type: 'enum',
        value: this.style.fontStyle ?? 'normal',
        options: [...FONT_STYLE_OPTIONS],
        desc: 'Font style',
        group: 'Text',
      },
      {
        name: 'Text',
        key: 'text',
        type: 'string',
        value: this.text,
        desc: 'Text content',
        group: 'Text',
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

import { Container } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';

export class GroupNode extends BaseNode {
  readonly type = 'group' as const;
  
  constructor(options: {
    id?: string;
    children: BaseNode[];
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
      type: 'group',
      x: options.x,
      y: options.y,
      rotation: options.rotation,
      scale: options.scale,
      style: options.style,
      visible: options.visible,
      locked: options.locked,
    });

    // Add children
    options.children.forEach(child => {
      this.addChild(child);
    });

    // Calculate group bounds
    const bounds = this.getBounds();
    this._width = bounds.width;
    this._height = bounds.height;
  }

  // Override width/height to always reflect current bounds
  get width(): number {
    return this.getBounds().width;
  }

  get height(): number {
    return this.getBounds().height;
  }
}

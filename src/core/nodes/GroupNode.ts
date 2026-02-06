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

  // Setting width/height scales the group so children maintain relative layout.
  set width(value: number) {
    const current = this.getBounds().width || 1;
    const factor = value / current;
    this.scale.x *= factor;
  }

  set height(value: number) {
    const current = this.getBounds().height || 1;
    const factor = value / current;
    this.scale.y *= factor;
  }

  clone(offsetX = 0, offsetY = 0): GroupNode {
    const clonedChildren = this.children
      .filter((c): c is BaseNode => c instanceof BaseNode)
      .map(child => child.clone(0, 0));

    return new GroupNode({
      children: clonedChildren,
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

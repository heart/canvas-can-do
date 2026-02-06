import type { BaseNode } from './BaseNode';

export interface RectangleNode extends BaseNode {
  type: 'rectangle';
  width: number;
  height: number;
  x: number;
  y: number;
  cornerRadius?: number;
}

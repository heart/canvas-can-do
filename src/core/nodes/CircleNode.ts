import type { BaseNode } from './BaseNode';

export interface CircleNode extends BaseNode {
  type: 'circle';
  radius: number;
}

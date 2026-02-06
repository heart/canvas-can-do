import type { BaseNode } from './BaseNode';

export interface TextNode extends BaseNode {
  type: 'text';
  width: number;
  height: number;
  text?: string;
}

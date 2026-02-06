import { Transform2D } from '../math/Transform2D';
import type { Vec2 } from '../math/Vec2';

export type NodeType = 'rectangle' | 'circle' | 'text';

export interface Style {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface BaseNode {
  id: string;
  type: NodeType;

  parentId?: string;
  children?: string[];

  transform: Transform2D; // local transform
  style: Style;

  visible: boolean;
  locked: boolean;
}

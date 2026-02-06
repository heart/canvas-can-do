import type { BaseNode } from './core/nodes/BaseNode';

export type ShapeCreatedEvent = CustomEvent<{
  shape: BaseNode;
}>;

declare global {
  interface WindowEventMap {
    'shape:created': ShapeCreatedEvent;
  }
}

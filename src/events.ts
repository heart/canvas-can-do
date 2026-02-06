import type { RectangleNode } from './core/nodes/rectangle';

export type ShapeCreatedEvent = CustomEvent<{
  shape: RectangleNode;
}>;

declare global {
  interface WindowEventMap {
    'shape:created': ShapeCreatedEvent;
  }
}

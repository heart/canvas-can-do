import type { BaseNode } from './core/nodes/BaseNode';
import type { ToolName } from './index';

export type ShapeCreatedEvent = CustomEvent<{
  shape: BaseNode;
}>;

export type ToolChangedEvent = CustomEvent<{
  tool: ToolName;
}>;

declare global {
  interface WindowEventMap {
    'shape:created': ShapeCreatedEvent;
    'tool:changed': ToolChangedEvent;
  }
}

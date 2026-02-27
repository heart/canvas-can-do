import type { BaseNode } from './core/nodes/BaseNode';
import type { ToolName } from './index';
export type ShapeCreatedEvent = CustomEvent<{
    shape: BaseNode;
    parentId?: string | null;
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
//# sourceMappingURL=events.d.ts.map
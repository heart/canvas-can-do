import { Point } from 'pixi.js';
import type { LineNode } from '../nodes/LineNode';
export declare class LineTransformController {
    private activeNode;
    private startPoint;
    private activeHandle;
    private startState;
    startTransform(node: LineNode, point: Point, handle: 'start' | 'end' | 'move'): void;
    updateTransform(point: Point, shiftKey?: boolean): void;
    endTransform(): void;
    private snapPointTo45;
    private applyWorldEndpoints;
}
//# sourceMappingURL=LineTransformController.d.ts.map
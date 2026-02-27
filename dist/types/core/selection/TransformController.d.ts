import { Point } from 'pixi.js';
import type { BaseNode } from '../nodes/BaseNode';
export declare class TransformController {
    private mode;
    private startPoint;
    private startState;
    private activeNode;
    private activeHandle;
    constructor();
    startTransform(node: BaseNode, point: Point, handle?: string): void;
    updateTransform(point: Point, constrainRatio?: boolean): void;
    endTransform(): void;
    private toParentPoint;
}
//# sourceMappingURL=TransformController.d.ts.map
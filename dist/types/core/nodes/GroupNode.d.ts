import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';
export declare class GroupNode extends BaseNode {
    readonly type: "group";
    constructor(options: {
        id?: string;
        children: BaseNode[];
        x?: number;
        y?: number;
        rotation?: number;
        scale?: number | {
            x: number;
            y: number;
        };
        style?: Style;
        visible?: boolean;
        locked?: boolean;
    });
    get width(): number;
    get height(): number;
    set width(value: number);
    set height(value: number);
    clone(offsetX?: number, offsetY?: number): GroupNode;
}
//# sourceMappingURL=GroupNode.d.ts.map
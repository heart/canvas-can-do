import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export declare class LineNode extends BaseNode {
    readonly type: "line";
    protected graphics: Graphics;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    constructor(options: {
        id?: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
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
    protected redraw(): void;
    setStyle(style: Partial<Style>): this;
    refresh(): void;
    getProps(): NodePropertyDescriptor[];
    clone(offsetX?: number, offsetY?: number): LineNode;
}
//# sourceMappingURL=LineNode.d.ts.map
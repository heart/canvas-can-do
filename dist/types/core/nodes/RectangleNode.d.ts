import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export declare class RectangleNode extends BaseNode {
    readonly type: "rectangle";
    cornerRadius?: number;
    protected graphics: Graphics;
    constructor(options: {
        id?: string;
        width: number;
        height: number;
        cornerRadius?: number;
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
    getProps(): NodePropertyDescriptor[];
    clone(offsetX?: number, offsetY?: number): RectangleNode;
}
//# sourceMappingURL=RectangleNode.d.ts.map
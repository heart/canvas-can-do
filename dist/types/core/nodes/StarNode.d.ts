import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export declare class StarNode extends BaseNode {
    readonly type: "star";
    protected graphics: Graphics;
    points: number;
    innerRadius: number;
    outerRadius: number;
    constructor(options: {
        id?: string;
        points: number;
        innerRadius: number;
        outerRadius: number;
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
    clone(offsetX?: number, offsetY?: number): StarNode;
}
//# sourceMappingURL=StarNode.d.ts.map
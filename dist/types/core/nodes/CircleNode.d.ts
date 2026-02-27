import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export declare class CircleNode extends BaseNode {
    readonly type: "circle";
    radius: number;
    protected graphics: Graphics;
    constructor(options: {
        id?: string;
        radius: number;
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
}
//# sourceMappingURL=CircleNode.d.ts.map
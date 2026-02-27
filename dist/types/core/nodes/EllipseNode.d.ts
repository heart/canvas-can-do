import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style } from './BaseNode';
export declare class EllipseNode extends BaseNode {
    readonly type: "ellipse";
    protected graphics: Graphics;
    constructor(options: {
        id?: string;
        width: number;
        height: number;
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
    clone(offsetX?: number, offsetY?: number): EllipseNode;
}
//# sourceMappingURL=EllipseNode.d.ts.map
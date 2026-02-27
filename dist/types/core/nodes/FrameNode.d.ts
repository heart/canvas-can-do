import { Graphics } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export declare class FrameNode extends BaseNode {
    readonly type: "frame";
    protected backgroundGraphics: Graphics;
    protected clipGraphics: Graphics;
    private _backgroundColor;
    private _clipContent;
    constructor(options: {
        id?: string;
        name?: string;
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
        backgroundColor?: string | null;
        clipContent?: boolean;
        children?: BaseNode[];
    });
    protected redraw(): void;
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    setStyle(style: Partial<Style>): this;
    get backgroundColor(): string | null;
    setBackgroundColor(backgroundColor: string | null): this;
    get clipContent(): boolean;
    setClipContent(enabled: boolean): this;
    getProps(): NodePropertyDescriptor[];
    clone(offsetX?: number, offsetY?: number): FrameNode;
}
//# sourceMappingURL=FrameNode.d.ts.map
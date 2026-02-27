import { Text } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export declare class TextNode extends BaseNode {
    readonly type: "text";
    protected textSprite: Text;
    text: string;
    constructor(options: {
        id?: string;
        text: string;
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
    setText(text: string): this;
    setStyle(style: Partial<Style>): this;
    getProps(): NodePropertyDescriptor[];
    clone(offsetX?: number, offsetY?: number): TextNode;
}
//# sourceMappingURL=TextNode.d.ts.map
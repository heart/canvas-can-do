import { Sprite, Texture } from 'pixi.js';
import { BaseNode } from './BaseNode';
import type { Style, NodePropertyDescriptor } from './BaseNode';
export type ImageSource = string | File | Blob;
export declare class ImageNode extends BaseNode {
    readonly type: "image";
    protected sprite: Sprite;
    source?: ImageSource;
    constructor(options: {
        id?: string;
        texture: Texture;
        source?: ImageSource;
        width?: number;
        height?: number;
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
    static fromSource(options: {
        source: ImageSource;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        rotation?: number;
        scale?: number | {
            x: number;
            y: number;
        };
        style?: Style;
        visible?: boolean;
        locked?: boolean;
    }): Promise<ImageNode>;
    private static prepareSource;
    private static toDataUrl;
    private static blobToDataUrl;
    private static loadImage;
    protected redraw(): void;
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    setStyle(style: Partial<Style>): this;
    getProps(): NodePropertyDescriptor[];
    clone(offsetX?: number, offsetY?: number): ImageNode;
}
//# sourceMappingURL=ImageNode.d.ts.map
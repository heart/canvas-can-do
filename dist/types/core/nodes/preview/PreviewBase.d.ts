import { Graphics, Container } from 'pixi.js';
type Point = {
    x: number;
    y: number;
};
export declare abstract class PreviewBase {
    protected g: Graphics;
    protected active: boolean;
    start: Point;
    last: Point;
    protected previewLayer: Container;
    constructor(previewLayer: Container);
    begin(start: Point): void;
    update(curr: Point): void;
    end(): {
        x: number;
        y: number;
        w: number;
        h: number;
    } | null;
    cancel(): void;
    get graphics(): Graphics;
    protected abstract redraw(start: Point, end: Point): void;
    protected getRect(): {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    protected clear(): void;
}
export {};
//# sourceMappingURL=PreviewBase.d.ts.map
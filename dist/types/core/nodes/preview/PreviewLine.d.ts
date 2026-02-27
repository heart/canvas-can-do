import { PreviewBase } from './PreviewBase';
import type { Point } from './types';
export declare class PreviewLine extends PreviewBase {
    private shiftKey;
    setShiftKey(pressed: boolean): void;
    protected redraw(a: Point, b: Point): void;
    private snapPointTo45;
}
//# sourceMappingURL=PreviewLine.d.ts.map
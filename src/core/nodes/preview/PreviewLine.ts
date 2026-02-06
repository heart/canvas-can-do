import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewLine extends PreviewBase {
  protected redraw(a: Point, b: Point): void {
    this.g.clear();
    this.g.moveTo(a.x, a.y);
    this.g.lineTo(b.x, b.y);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 2 });
  }
}

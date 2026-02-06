import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewEllipse extends PreviewBase {
  protected redraw(a: Point, b: Point): void {
    const r = this.getRect();
    const centerX = r.x + r.w / 2;
    const centerY = r.y + r.h / 2;

    this.g.clear();
    this.g.ellipse(centerX, centerY, r.w / 2, r.h / 2);
    this.g.fill({ color: 0x000000, alpha: 0.08 });
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
  }
}

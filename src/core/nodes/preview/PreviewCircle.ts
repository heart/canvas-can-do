import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewCircle extends PreviewBase {
  protected redraw(a: Point, b: Point): void {
    const r = this.getRect();
    const radius = Math.min(r.w, r.h) / 2;
    const centerX = r.x + r.w / 2;
    const centerY = r.y + r.h / 2;

    this.g.clear();

    // Fill with transparency
    this.g.circle(centerX, centerY, radius);
    this.g.fill({ color: 0x000000, alpha: 0.08 });

    // Stroke
    this.g.circle(centerX, centerY, radius);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
  }
}

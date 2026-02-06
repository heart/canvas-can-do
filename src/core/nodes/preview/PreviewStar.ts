import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewStar extends PreviewBase {
  protected redraw(a: Point, b: Point): void {
    const r = this.getRect();
    const size = Math.min(r.w, r.h);
    const centerX = r.x + r.w / 2;
    const centerY = r.y + r.h / 2;
    const points = 5;
    const innerRadius = size * 0.4;
    const outerRadius = size * 0.8;

    this.g.clear();

    // Calculate star points
    const starPoints: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      starPoints.push(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
    }

    // Fill with transparency
    this.g.poly(starPoints);
    this.g.fill({ color: 0x000000, alpha: 0.08 });

    // Stroke
    this.g.poly(starPoints);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
  }
}

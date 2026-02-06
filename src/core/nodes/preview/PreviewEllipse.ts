import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewEllipse extends PreviewBase {
  private shiftKey = false;

  setShiftKey(pressed: boolean): void {
    this.shiftKey = pressed;
    if (this.active) {
      this.redraw(this.start, this.last);
    }
  }

  protected redraw(a: Point, b: Point): void {
    const r = this.getRect();
    const centerX = r.x + r.w / 2;
    const centerY = r.y + r.h / 2;

    // If shift is pressed, make it a circle based on the larger dimension
    let width = r.w;
    let height = r.h;
    let adjustedCenterX = centerX;
    let adjustedCenterY = centerY;

    if (this.shiftKey) {
      const size = Math.max(r.w, r.h);
      width = size;
      height = size;
      // Adjust center position to maintain the original center
      if (r.w < r.h) {
        adjustedCenterX = a.x + (b.x - a.x) / 2;
      } else {
        adjustedCenterY = a.y + (b.y - a.y) / 2;
      }
    }

    this.g.clear();
    this.g.ellipse(adjustedCenterX, adjustedCenterY, width / 2, height / 2);
    this.g.fill({ color: 0x000000, alpha: 0.08 });
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
  }
}

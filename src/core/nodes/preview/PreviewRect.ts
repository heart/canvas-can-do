import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewRect extends PreviewBase {
  private shiftKey = false;

  setShiftKey(pressed: boolean): void {
    this.shiftKey = pressed;
    if (this.active) {
      this.redraw(this.start, this.last);
    }
  }

  protected redraw(a: Point, b: Point): void {
    let r = this.getRect();

    // If shift is pressed, make it a square based on the larger dimension
    if (this.shiftKey) {
      const size = Math.max(r.w, r.h);
      if (r.w < r.h) {
        if (b.x < a.x) r.x = a.x - size;
        r.w = size;
      } else {
        if (b.y < a.y) r.y = a.y - size;
        r.h = size;
      }
    }

    this.g.clear();

    // Fill with transparency
    this.g.rect(r.x, r.y, r.w, r.h);
    this.g.fill({ color: 0x000000, alpha: 0.08 });

    // Stroke
    this.g.rect(r.x, r.y, r.w, r.h);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
  }
}

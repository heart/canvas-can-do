import { PreviewBase } from './PreviewBase';
import type { Point } from './types';

export class PreviewLine extends PreviewBase {
  private shiftKey = false;

  setShiftKey(pressed: boolean): void {
    this.shiftKey = pressed;
    if (this.active) {
      this.redraw(this.start, this.last);
    }
  }

  protected redraw(a: Point, b: Point): void {
    let endX = b.x;
    let endY = b.y;

    if (this.shiftKey) {
      const snapped = this.snapPointTo45(a, b);
      endX = snapped.x;
      endY = snapped.y;
    }

    this.g.clear();
    this.g.moveTo(a.x, a.y);
    this.g.lineTo(endX, endY);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 2 });
  }

  private snapPointTo45(start: Point, end: Point) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return { x: start.x, y: start.y };
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const snapped = Math.round(angle / step) * step;
    return {
      x: start.x + Math.cos(snapped) * length,
      y: start.y + Math.sin(snapped) * length,
    };
  }
}

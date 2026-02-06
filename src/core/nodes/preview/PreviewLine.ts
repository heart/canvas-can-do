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
      const dx = Math.abs(b.x - a.x);
      const dy = Math.abs(b.y - a.y);
      
      if (dx > dy) {
        // Make horizontal
        endY = a.y;
      } else {
        // Make vertical
        endX = a.x;
      }
    }

    this.g.clear();
    this.g.moveTo(a.x, a.y);
    this.g.lineTo(endX, endY);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 2 });
  }
}

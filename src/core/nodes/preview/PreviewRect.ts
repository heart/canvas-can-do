import { Graphics, Container } from 'pixi.js';

type Point = { x: number; y: number };

export class PreviewRect {
  private g = new Graphics();
  private active = false;
  private start: Point = { x: 0, y: 0 };

  previewLayer: Container;

  constructor(previewLayer: Container) {
    this.previewLayer = previewLayer;
  }

  begin(start: Point) {
    this.active = true;
    this.start = start;
    this.previewLayer.addChild(this.g);
    this.redraw(start, start);
  }

  update(curr: Point) {
    if (!this.active) return;
    this.redraw(this.start, curr);
  }

  end(): { x: number; y: number; w: number; h: number } | null {
    if (!this.active) return null;
    const rect = rectFromPoints(this.start, this.getLast());
    this.clear();
    return rect;
  }

  cancel() {
    this.clear();
  }

  // --- internal ---
  private last: Point = { x: 0, y: 0 };
  private getLast() {
    return this.last;
  }

  private redraw(a: Point, b: Point) {
    this.last = b;

    const r = rectFromPoints(a, b);

    this.g.clear();

    // fill แบบโปร่ง ๆ
    this.g.rect(r.x, r.y, r.w, r.h);
    this.g.fill({ color: 0x000000, alpha: 0.08 });

    // stroke
    this.g.rect(r.x, r.y, r.w, r.h);
    this.g.stroke({ color: 0x0be666, alpha: 0.8, width: 1 });
  }

  private clear() {
    if (!this.active) return;
    this.active = false;
    this.previewLayer.removeChild(this.g);
    this.g.clear();
  }
}

function rectFromPoints(a: Point, b: Point) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  return { x, y, w, h };
}

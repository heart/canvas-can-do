import { Graphics, Container } from 'pixi.js';

type Point = { x: number; y: number };

export abstract class PreviewBase {
  protected g = new Graphics();
  protected active = false;
  protected start: Point = { x: 0, y: 0 };
  protected last: Point = { x: 0, y: 0 };

  constructor(protected previewLayer: Container) {}

  begin(start: Point): void {
    this.active = true;
    this.start = start;
    this.previewLayer.addChild(this.g);
    this.redraw(start, start);
  }

  update(curr: Point): void {
    if (!this.active) return;
    this.last = curr;
    this.redraw(this.start, curr);
  }

  end(): { x: number; y: number; w: number; h: number } | null {
    if (!this.active) return null;
    const rect = this.getRect();
    this.clear();
    return rect;
  }

  cancel(): void {
    this.clear();
  }

  protected abstract redraw(start: Point, end: Point): void;

  protected getRect() {
    const x = Math.min(this.start.x, this.last.x);
    const y = Math.min(this.start.y, this.last.y);
    const w = Math.abs(this.last.x - this.start.x);
    const h = Math.abs(this.last.y - this.start.y);
    return { x, y, w, h };
  }

  protected clear(): void {
    if (!this.active) return;
    this.active = false;
    this.previewLayer.removeChild(this.g);
    this.g.clear();
  }
}

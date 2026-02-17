import { Container, Graphics, Text } from 'pixi.js';

export class RulerOverlay {
  private root: Container;
  private g: Graphics;
  private labels: Container;
  private uiLayer: Container;
  private getViewport: () => { width: number; height: number; scale: number; x: number; y: number };

  constructor(
    uiLayer: Container,
    getViewport: () => { width: number; height: number; scale: number; x: number; y: number }
  ) {
    this.uiLayer = uiLayer;
    this.getViewport = getViewport;
    this.root = new Container();
    this.g = new Graphics();
    this.labels = new Container();
    this.root.addChild(this.g);
    this.root.addChild(this.labels);
    this.uiLayer.addChild(this.root);
  }

  update() {
    const { width, height, scale, x, y } = this.getViewport();
    const rulerSize = 24;
    const rightX = width - rulerSize;

    this.g.clear();
    this.labels.removeChildren();

    // backgrounds
    this.g.rect(0, 0, width - rulerSize, rulerSize);
    this.g.rect(rightX, rulerSize, rulerSize, height - rulerSize);
    this.g.fill({ color: 0xf6f6f6, alpha: 1 });
    this.g.stroke({ color: 0xcccccc, width: 1, alpha: 1 });

    const step = this.getNiceStep(scale);
    const pxPerUnit = scale;
    // top ruler
    const startWorldX = (-x) / scale;
    const startIndexX = Math.floor(startWorldX / step) - 1;
    const endIndexX = Math.ceil((startWorldX + (width - rulerSize) / scale) / step) + 1;

    for (let i = startIndexX; i <= endIndexX; i++) {
      const worldX = i * step;
      const screenX = (worldX - startWorldX) * pxPerUnit;
      if (screenX < 0 || screenX > width - rulerSize) continue;
      const isMajor = i % 5 === 0;
      const tickH = isMajor ? 10 : 6;
      this.g.moveTo(screenX, rulerSize);
      this.g.lineTo(screenX, rulerSize - tickH);
      this.g.stroke({ color: 0x999999, width: 1, alpha: 1 });

      if (isMajor) {
        const label = new Text({
          text: `${Math.round(worldX)}`,
          style: {
            fontSize: 10,
            fill: 0x666666,
          },
        });
        label.position.set(screenX + 2, 2);
        this.labels.addChild(label);
      }
    }

    // right ruler
    const startWorldY = (-y) / scale;
    const startIndexY = Math.floor(startWorldY / step) - 1;
    const endIndexY = Math.ceil((startWorldY + (height - rulerSize) / scale) / step) + 1;

    for (let i = startIndexY; i <= endIndexY; i++) {
      const worldY = i * step;
      const screenY = rulerSize + (worldY - startWorldY) * pxPerUnit;
      if (screenY < rulerSize || screenY > height) continue;
      const isMajor = i % 5 === 0;
      const tickW = isMajor ? 10 : 6;
      this.g.moveTo(rightX, screenY);
      this.g.lineTo(rightX + tickW, screenY);
      this.g.stroke({ color: 0x999999, width: 1, alpha: 1 });

      if (isMajor) {
        const label = new Text({
          text: `${Math.round(worldY)}`,
          style: {
            fontSize: 10,
            fill: 0x666666,
          },
        });
        label.rotation = -Math.PI / 2;
        label.position.set(rightX + 10, screenY + 4);
        this.labels.addChild(label);
      }
    }
  }

  private getNiceStep(scale: number) {
    const desiredPx = 50;
    const raw = desiredPx / scale;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / pow;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * pow;
  }
}

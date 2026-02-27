import { Container } from 'pixi.js';
export declare class RulerOverlay {
    private root;
    private g;
    private labels;
    private uiLayer;
    private getViewport;
    constructor(uiLayer: Container, getViewport: () => {
        width: number;
        height: number;
        scale: number;
        x: number;
        y: number;
    });
    update(): void;
    private getNiceStep;
}
//# sourceMappingURL=RulerOverlay.d.ts.map
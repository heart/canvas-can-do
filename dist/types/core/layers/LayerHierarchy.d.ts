import { Container } from 'pixi.js';
export interface LayerNode {
    id: string;
    type: string;
    name: string;
    visible: boolean;
    locked: boolean;
    children?: LayerNode[];
}
export declare class LayerHierarchy {
    private static generateLayerName;
    static getHierarchy(container: Container): LayerNode;
}
export type LayerHierarchyChangedEvent = CustomEvent<{
    hierarchy: LayerNode;
    selectedIds?: string[];
}>;
declare global {
    interface WindowEventMap {
        'layer:changed': LayerHierarchyChangedEvent;
    }
}
//# sourceMappingURL=LayerHierarchy.d.ts.map
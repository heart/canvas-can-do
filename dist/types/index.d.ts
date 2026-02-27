import './ccd.css';
import { Application, Container, Point } from 'pixi.js';
import { PointerController } from './PointerController';
import { BaseNode } from './core/nodes/BaseNode';
import type { InspectableNode } from './core/nodes';
import { FrameNode } from './core/nodes/FrameNode';
import { HistoryManager } from './core/history/HistoryManager';
import type { SceneDocument } from './core/history/HistoryManager';
import { type NodeExportPreset } from './core/export/exportSettings';
export declare const version = "0.0.0";
export type { NodeExportPreset } from './core/export/exportSettings';
export type ToolName = 'select' | 'frame' | 'rectangle' | 'text' | 'line' | 'ellipse' | 'star' | 'pan';
export interface NodePropUpdate {
    id: string;
    props: Record<string, string | number | boolean | null>;
}
export interface AddedNodeResult {
    id: string;
    type: InspectableNode['type'];
    inspectable: InspectableNode;
    update: NodePropUpdate;
}
export interface AddFrameOptions {
    width: number;
    height: number;
    x?: number;
    y?: number;
    space?: 'world' | 'screen';
    name?: string;
    backgroundColor?: string | null;
    clipContent?: boolean;
}
export type LayerMovePosition = 'before' | 'after' | 'inside';
export interface FlatLayerItem {
    id: string;
    type: BaseNode['type'];
    name: string;
    visible: boolean;
    locked: boolean;
    parentId: string | null;
    depth: number;
    zIndex: number;
    isGroup: boolean;
    childCount: number;
}
export interface GetFlatLayersOptions {
    parentId?: string | null;
    recursive?: boolean;
    topFirst?: boolean;
}
export interface LayerMoveValidation {
    ok: boolean;
    reason?: string;
}
export interface NodeExportAsset {
    nodeId: string;
    presetId: string;
    format: 'png' | 'jpg' | 'svg';
    filename: string;
    mimeType: string;
    content: string;
    contentType: 'dataUrl' | 'text';
}
export interface ExportSettingRecord {
    id: string;
    preset: NodeExportPreset;
    linkedNodeIds: string[];
}
export interface ExportPresetEditOptions {
    recordHistory?: boolean;
}
export declare const TOOL_CURSOR: Record<ToolName, string | null>;
export declare class CCDApp extends EventTarget {
    app: Application<import("pixi.js").Renderer>;
    world: Container<import("pixi.js").ContainerChild>;
    objectLayer: Container<import("pixi.js").ContainerChild>;
    previewLayer: Container<import("pixi.js").ContainerChild>;
    toolsLayer: Container<import("pixi.js").ContainerChild>;
    helperLayer: Container<import("pixi.js").ContainerChild>;
    uiLayer: Container<import("pixi.js").ContainerChild>;
    host?: HTMLElement;
    pointerController?: PointerController;
    history?: HistoryManager;
    private ruler?;
    private zoomLabel?;
    private shortcutsEnabled;
    private objectSnapEnabled;
    private isInitialized;
    private exportPresetStore;
    private readonly syncStageHitArea;
    private readonly updateRuler;
    private readonly updateZoomLabel;
    private readonly onZoomKeyDown;
    private readonly onUndoRedoKeyDown;
    private readonly onToolKeyDown;
    private readonly onCanvasWheel;
    private readonly onHostDragOver;
    private readonly onHostDrop;
    private readonly onHostPaste;
    private readonly onWindowPaste;
    private readonly onPointerControllerShapeCreated;
    private readonly onPointerControllerViewportChanged;
    private readonly onPointerControllerHoverChanged;
    private readonly onHostPointerDown;
    private readonly onHostPointerMove;
    private readonly onHostPointerUp;
    private readonly onHostDoubleClick;
    private readonly onHostPointerCancel;
    private pointerControllerKeyDownHandler?;
    private pointerControllerKeyUpHandler?;
    activeTool: ToolName;
    constructor();
    init(host: HTMLElement): Promise<void>;
    setShortcutsEnabled(enabled: boolean): void;
    setObjectSnapEnabled(enabled: boolean): void;
    isObjectSnapEnabled(): boolean;
    initPointerController(): void;
    private handleZoomKeys;
    private handleToolKeys;
    private handleWheel;
    private normalizeWheel;
    private handleUndoRedoKeys;
    setZoom(newScale: number): void;
    setZoomAt(newScale: number, center: Point): void;
    panBy(dx: number, dy: number, source?: 'pan' | 'wheel'): void;
    private handleDrop;
    private handlePaste;
    private addTextAt;
    /**
     * Public API for adding plain text as a text node.
     * Default placement is the center of current viewport.
     */
    addText(text: string, options?: {
        x: number;
        y: number;
        space?: 'world' | 'screen';
    }): Promise<AddedNodeResult | null>;
    /**
     * Public API for adding an image from URL/data URL/File/Blob.
     * Default placement is the center of current viewport.
     */
    addImage(source: string | File | Blob, options?: {
        x: number;
        y: number;
        space?: 'world' | 'screen';
    }): Promise<AddedNodeResult | null>;
    /**
     * Public API for adding a frame node.
     * Default placement is the center of current viewport.
     */
    addFrame(options: AddFrameOptions): Promise<AddedNodeResult | null>;
    private addImageFromSource;
    private commitAddedNode;
    private getWorldPointFromClient;
    private exportRasterNodes;
    private exportSvgNodes;
    private getFrameBounds;
    private getBoundsFromNodes;
    private getAllBaseNodes;
    private applySelectionVisibility;
    private toColorNumber;
    private parseBoolean;
    private nodeToSvg;
    private starPointsToSvg;
    private styleToSvg;
    private escapeXml;
    private resolveImageDataUrl;
    private loadImage;
    private toDataUrl;
    private isEditingText;
    undo(): Promise<void>;
    redo(): Promise<void>;
    exportJSON(): Promise<SceneDocument | null>;
    importJSON(doc: SceneDocument): Promise<void>;
    getExportSettingIds(nodeId: string): string[];
    getAllExportSettings(): ExportSettingRecord[];
    addExportSetting(nodeId: string, preset: Omit<Partial<NodeExportPreset>, 'id'> & {
        id?: string;
    }, options?: ExportPresetEditOptions): Promise<NodeExportPreset | null>;
    getExportSettingById(presetId: string): NodeExportPreset | null;
    editExportSetting(presetId: string, patch: Partial<NodeExportPreset>, options?: ExportPresetEditOptions): Promise<NodeExportPreset | null>;
    deleteExportSetting(presetId: string, options?: ExportPresetEditOptions): Promise<boolean>;
    exportNodeByPreset(nodeId: string, presetId: string): Promise<NodeExportAsset | null>;
    exportNodesByPreset(requests: Array<{
        nodeId: string;
        presetId: string;
    }>): Promise<NodeExportAsset[]>;
    private snapshotExportPresetStore;
    private importExportPresetStore;
    private ensureExportStoreConsistency;
    private pruneOrphanExportPresets;
    private createExportPresetId;
    private ensureUniquePresetId;
    private getLinkedPresetIds;
    private ensureNodePresetLinkList;
    getExportPresetUsage(presetId: string): string[];
    hasDocumentContent(): boolean;
    clearDocument(): Promise<void>;
    setCursor(name: string | null): void;
    resetCursor(): void;
    useTool(toolName: ToolName): void;
    dispatchLayerHierarchyChanged(): void;
    selectNodeById(id: string | null): void;
    selectNodesById(ids: string[]): void;
    setHoverById(id: string | null): void;
    getFlatLayers(options?: GetFlatLayersOptions): FlatLayerItem[];
    canMoveLayer(sourceId: string, targetId: string, position: LayerMovePosition): LayerMoveValidation;
    canMoveLayers(sourceIds: string[], targetId: string, position: LayerMovePosition): LayerMoveValidation;
    moveLayer(sourceId: string, targetId: string, position: LayerMovePosition, options?: {
        recordHistory?: boolean;
    }): Promise<boolean>;
    moveLayers(sourceIds: string[], targetId: string, position: LayerMovePosition, options?: {
        recordHistory?: boolean;
    }): Promise<boolean>;
    /**
     * Apply property updates to one or more nodes by id.
     * Pass the ids/props you received from `layer:changed` or `properties:changed`.
     */
    applyNodeProperties(update: NodePropUpdate | NodePropUpdate[]): void;
    private applyStyle;
    private setNodeGlobalPosition;
    private getNodeGlobalPosition;
    private getLinePointGlobal;
    private resolveLayerParent;
    private collectFlatLayers;
    private validateLayerMove;
    private resolveInsertionIndex;
    private getMoveSourceNodes;
    private hasAncestorInSet;
    private isAncestorNode;
    private compareNodeStackOrder;
    private getNodePathIndices;
    private applyWorldTransformToParent;
    private findNodeById;
    private dispatchOnHost;
    destroy(): void;
    getLayerHierarchy(): import("./core/layers/LayerHierarchy").LayerNode;
    getFrames(): FrameNode[];
    getFrameById(id: string): FrameNode | null;
    getPixiApp(): Application<import("pixi.js").Renderer>;
}
//# sourceMappingURL=index.d.ts.map
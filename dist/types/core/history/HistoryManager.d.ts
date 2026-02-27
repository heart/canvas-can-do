import type { Container } from 'pixi.js';
import { BaseNode } from '../nodes/BaseNode';
import type { Style } from '../nodes/BaseNode';
import { type ExportPresetStore } from '../export/exportSettings';
export type SerializedNode = {
    id: string;
    type: BaseNode['type'];
    name: string;
    visible: boolean;
    locked: boolean;
    x: number;
    y: number;
    rotation: number;
    scale: {
        x: number;
        y: number;
    };
    style: Style;
    width?: number;
    height?: number;
    data?: Record<string, any>;
    children?: SerializedNode[];
};
type HistoryManagerOptions = {
    getExportStore?: () => ExportPresetStore;
    setExportStore?: (store: ExportPresetStore) => void;
};
export type SceneDocument = {
    version: 1;
    nodes: SerializedNode[];
    exportStore?: ExportPresetStore;
};
export declare class HistoryManager {
    private static readonly MAX_UNDO_STACK_SIZE;
    private undoStack;
    private redoStack;
    private lastSnapshotKey;
    private captureRequested;
    private captureInFlight;
    private objectLayer;
    private readonly getExportStore?;
    private readonly setExportStore?;
    constructor(objectLayer: Container, options?: HistoryManagerOptions);
    capture(): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    private serializeScene;
    exportDocument(): Promise<SceneDocument>;
    importDocument(doc: SceneDocument): Promise<void>;
    hasContent(): boolean;
    clearDocument(): Promise<void>;
    private flushCaptureQueue;
    private snapshotKey;
    private normalizeDocument;
    private normalizeNode;
    private toFiniteNumber;
    private toBoolean;
    private toColor;
    private toNullableColor;
    private serializeNode;
    private restore;
    private deserializeNode;
}
export {};
//# sourceMappingURL=HistoryManager.d.ts.map
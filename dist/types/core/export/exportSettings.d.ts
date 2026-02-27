export type ExportFormat = 'png' | 'jpg' | 'svg';
export type SvgImageEmbedMode = 'original' | 'display' | 'max';
export type ExportBackgroundMode = 'auto' | 'transparent' | 'solid';
export interface NodeExportPreset {
    id: string;
    format: ExportFormat;
    scale: number;
    suffix: string;
    quality?: number;
    padding?: number;
    backgroundMode?: ExportBackgroundMode;
    backgroundColor?: string;
    imageEmbed?: SvgImageEmbedMode;
    imageMaxEdge?: number;
}
export interface ExportPresetStore {
    presets: Record<string, NodeExportPreset>;
    nodePresetIds: Record<string, string[]>;
}
export declare const DEFAULT_NODE_EXPORT_PRESET: NodeExportPreset;
export declare const DEFAULT_EXPORT_PRESET_STORE: ExportPresetStore;
export declare function normalizeNodeExportPreset(input: unknown, index?: number): NodeExportPreset;
export declare function normalizeExportPresetStore(input: unknown): ExportPresetStore;
export declare function sanitizeExportFileBaseName(name: string): string;
//# sourceMappingURL=exportSettings.d.ts.map
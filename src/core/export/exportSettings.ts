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

export interface NodeExportSettings {
  presets: NodeExportPreset[];
}

export interface ExportPresetStore {
  presets: Record<string, NodeExportPreset>;
  nodePresetIds: Record<string, string[]>;
}

export const DEFAULT_NODE_EXPORT_PRESET: NodeExportPreset = {
  id: 'png-1x',
  format: 'png',
  scale: 1,
  suffix: '',
  padding: 0,
  backgroundMode: 'auto',
  imageEmbed: 'original',
  imageMaxEdge: 2048,
};

export const DEFAULT_NODE_EXPORT_SETTINGS: NodeExportSettings = {
  presets: [DEFAULT_NODE_EXPORT_PRESET],
};

export const DEFAULT_EXPORT_PRESET_STORE: ExportPresetStore = {
  presets: {},
  nodePresetIds: {},
};

function sanitizeFormat(value: unknown): ExportFormat {
  return value === 'jpg' || value === 'svg' ? value : 'png';
}

function sanitizeScale(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(0.01, Math.min(64, n));
}

function sanitizeQuality(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(1, n));
}

function sanitizePadding(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.round(n));
}

function sanitizeBackgroundMode(value: unknown): ExportBackgroundMode {
  if (value === 'transparent' || value === 'solid') return value;
  return 'auto';
}

function sanitizeImageEmbed(value: unknown): SvgImageEmbedMode {
  if (value === 'display' || value === 'max') return value;
  return 'original';
}

function sanitizeMaxEdge(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 2048;
  return Math.max(1, Math.round(n));
}

function makeFallbackPresetId(index: number): string {
  return `preset-${index + 1}`;
}

export function normalizeNodeExportPreset(input: unknown, index = 0): NodeExportPreset {
  const preset = (input && typeof input === 'object' ? input : {}) as Partial<NodeExportPreset>;
  return {
    id: typeof preset.id === 'string' && preset.id.trim() ? preset.id : makeFallbackPresetId(index),
    format: sanitizeFormat(preset.format),
    scale: sanitizeScale(preset.scale),
    suffix: typeof preset.suffix === 'string' ? preset.suffix : '',
    quality: sanitizeQuality(preset.quality),
    padding: sanitizePadding(preset.padding),
    backgroundMode: sanitizeBackgroundMode(preset.backgroundMode),
    backgroundColor:
      typeof preset.backgroundColor === 'string' && preset.backgroundColor.trim()
        ? preset.backgroundColor
        : undefined,
    imageEmbed: sanitizeImageEmbed(preset.imageEmbed),
    imageMaxEdge: sanitizeMaxEdge(preset.imageMaxEdge),
  };
}

export function normalizeNodeExportSettings(input: unknown): NodeExportSettings {
  const source = (input && typeof input === 'object' ? input : {}) as Partial<NodeExportSettings>;
  const presetsInput = Array.isArray(source.presets) ? source.presets : [];
  const normalizedPresets = presetsInput
    .map((preset, index) => normalizeNodeExportPreset(preset, index))
    .filter((preset, index, arr) => arr.findIndex((p) => p.id === preset.id) === index);

  return {
    presets: normalizedPresets.length
      ? normalizedPresets
      : DEFAULT_NODE_EXPORT_SETTINGS.presets.map((preset, index) =>
          normalizeNodeExportPreset(preset, index)
        ),
  };
}

export function cloneNodeExportSettings(settings: NodeExportSettings): NodeExportSettings {
  return {
    presets: settings.presets.map((preset) => ({ ...preset })),
  };
}

export function normalizeExportPresetStore(input: unknown): ExportPresetStore {
  const source = (input && typeof input === 'object' ? input : {}) as Partial<ExportPresetStore>;
  const presetsInput =
    source.presets && typeof source.presets === 'object' ? source.presets : {};
  const linksInput =
    source.nodePresetIds && typeof source.nodePresetIds === 'object' ? source.nodePresetIds : {};

  const presets: Record<string, NodeExportPreset> = {};
  Object.entries(presetsInput).forEach(([presetId, preset], index) => {
    const normalized = normalizeNodeExportPreset({ ...(preset as any), id: presetId }, index);
    presets[normalized.id] = normalized;
  });

  const nodePresetIds: Record<string, string[]> = {};
  Object.entries(linksInput).forEach(([nodeId, ids]) => {
    if (!Array.isArray(ids)) return;
    const list = ids
      .map((id) => String(id))
      .filter((id, index, arr) => Boolean(id) && arr.indexOf(id) === index && presets[id]);
    if (list.length) {
      nodePresetIds[nodeId] = list;
    }
  });

  return { presets, nodePresetIds };
}

export function sanitizeExportFileBaseName(name: string): string {
  return (name || 'export')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-') || 'export';
}

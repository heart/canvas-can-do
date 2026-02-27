import './style.css';
import { CCDApp } from '..';
import type { ToolName } from '..';
import type { LayerNode } from '../core/layers/LayerHierarchy';

const tools: ToolName[] = ['select', 'rectangle', 'ellipse', 'line', 'star', 'text', 'pan'];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="toolbar">
    ${tools
      .map(
        (tool) => `
      <button id="${tool}-btn" class="tool-btn">
        ${tool.toUpperCase()}
      </button>
    `
      )
      .join('')}
  </div>
  <div class="export-panel">
    <label>
      Frame
      <select id="export-frame">
        <option value="">First Frame</option>
      </select>
    </label>
    <label>
      Type
      <select id="export-type">
        <option value="png">PNG</option>
        <option value="jpg">JPG</option>
        <option value="svg">SVG</option>
      </select>
    </label>
    <label>
      Image Embed
      <select id="export-image-embed">
        <option value="original">Original</option>
        <option value="display">Scaled to Display</option>
        <option value="max">Scaled to Max Edge</option>
      </select>
    </label>
    <label>
      Max Edge
      <input id="export-image-max" type="number" value="2048" min="64" step="64"/>
    </label>
    <button id="export-btn" class="tool-btn">EXPORT</button>
  </div>
  <div class="io-panel">
    <button id="save-json-btn" class="tool-btn">SAVE JSON</button>
    <button id="load-json-btn" class="tool-btn">LOAD JSON</button>
    <textarea id="json-io" rows="6" placeholder="Paste JSON here"></textarea>
  </div>
  <div id="editor"></div>
  <div id="layer"></div>
`;

const app = new CCDApp();

const editor = document.getElementById('editor');
if (editor) {
  app.init(editor);
}

// Function to update active tool button
function updateActiveToolButton(tool: ToolName) {
  document.querySelectorAll('.tool-btn').forEach((el) => el.classList.remove('active'));
  const btn = document.getElementById(`${tool}-btn`);
  btn?.classList.add('active');
}

function updateLayer(node: LayerNode) {
  const layer = document.getElementById(`layer`);
  if (layer) {
    layer.innerHTML = JSON.stringify(node, null, 2);
  }
}

// Add click handlers for all tool buttons
tools.forEach((tool) => {
  const btn = document.getElementById(`${tool}-btn`);
  btn?.addEventListener('click', () => {
    updateActiveToolButton(tool);
    app.useTool(tool);
  });
});

// Listen for tool changes from the app
editor?.addEventListener('tool:changed', ((e: CustomEvent<{ tool: ToolName }>) => {
  console.log('changed', e.detail.tool);
  updateActiveToolButton(e.detail.tool);
}) as EventListener);

// Listen for tool changes from the app
editor?.addEventListener('layer:changed', ((
  e: CustomEvent<{ hierarchy: LayerNode; selectedIds?: string[] }>
) => {
  updateLayer(e.detail.hierarchy);
}) as EventListener);

editor?.addEventListener('viewport:changed', ((
  e: CustomEvent<{ hierarchy: LayerNode; selectedIds?: string[] }>
) => {
  console.log('viewport:changed', e.detail);
}) as EventListener);

const exportBtn = document.getElementById('export-btn');
const exportFrame = document.getElementById('export-frame') as HTMLSelectElement | null;
const exportType = document.getElementById('export-type') as HTMLSelectElement | null;
const exportEmbed = document.getElementById('export-image-embed') as HTMLSelectElement | null;
const exportMax = document.getElementById('export-image-max') as HTMLInputElement | null;
const saveJsonBtn = document.getElementById('save-json-btn');
const loadJsonBtn = document.getElementById('load-json-btn');
const jsonIo = document.getElementById('json-io') as HTMLTextAreaElement | null;

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadText(text: string, filename: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

exportBtn?.addEventListener('click', async () => {
  const frameId = exportFrame?.value || app.getFrames()[0]?.id;
  if (!frameId) return;
  const type = (exportType?.value ?? 'png') as 'png' | 'jpg' | 'svg';
  const embed = (exportEmbed?.value ?? 'original') as 'original' | 'display' | 'max';
  const maxEdge = Math.max(64, Number(exportMax?.value ?? 2048));
  const preset = await app.addExportSetting(frameId, {
    format: type,
    scale: 1,
    suffix: '',
    backgroundMode: type === 'jpg' ? 'solid' : 'auto',
    backgroundColor: type === 'jpg' ? '#ffffff' : undefined,
    imageEmbed: embed,
    imageMaxEdge: maxEdge,
  }, { recordHistory: false });
  if (!preset) return;

  try {
    const asset = await app.exportNodeByPreset(frameId, preset.id);
    if (!asset) return;
    if (asset.contentType === 'text') {
      downloadText(asset.content, asset.filename, asset.mimeType);
      return;
    }
    downloadDataUrl(asset.content, asset.filename);
  } finally {
    await app.deleteExportSetting(preset.id, { recordHistory: false });
  }
});

saveJsonBtn?.addEventListener('click', async () => {
  const doc = await app.exportJSON();
  if (!doc || !jsonIo) return;
  jsonIo.value = JSON.stringify(doc, null, 2);
});

loadJsonBtn?.addEventListener('click', async () => {
  if (!jsonIo) return;
  try {
    const doc = JSON.parse(jsonIo.value);
    await app.importJSON(doc);
  } catch (err) {
    console.error('Invalid JSON', err);
  }
});

// Start with select tool active
updateActiveToolButton('select');

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
window.addEventListener('tool:changed', ((e: CustomEvent<{ tool: ToolName }>) => {
  updateActiveToolButton(e.detail.tool);
}) as EventListener);

// Listen for tool changes from the app
window.addEventListener('layer:changed', ((e: CustomEvent<{ hierarchy: LayerNode }>) => {
  updateLayer(e.detail.hierarchy);
}) as EventListener);

// Start with select tool active
updateActiveToolButton('select');

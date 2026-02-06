import './style.css';
import { CCDApp } from '..';
import type { ToolName } from '..';

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

// Start with select tool active
updateActiveToolButton('select');

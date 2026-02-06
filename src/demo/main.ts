import './style.css';
import { CCDApp } from '..';
import type { ToolName } from '..';

const tools: ToolName[] = [
  'select',
  'rectangle',
  'circle',
  'ellipse',
  'line',
  'star',
  'text',
  'pan'
];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="toolbar">
    ${tools.map(tool => `
      <button id="${tool}-btn" class="tool-btn">
        ${tool.toUpperCase()}
      </button>
    `).join('')}
  </div>
  <div id="editor"></div>
`;

const app = new CCDApp();

const editor = document.getElementById('editor');
if (editor) {
  app.init(editor);
}

// Add click handlers for all tool buttons
tools.forEach(tool => {
  const btn = document.getElementById(`${tool}-btn`);
  btn?.addEventListener('click', () => {
    // Remove active class from all buttons
    document.querySelectorAll('.tool-btn').forEach(el => 
      el.classList.remove('active')
    );
    // Add active class to clicked button
    btn.classList.add('active');
    app.useTool(tool);
  });
});

// Start with select tool active
const selectBtn = document.getElementById('select-btn');
selectBtn?.classList.add('active');

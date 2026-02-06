import './style.css';
import { CCDApp } from '..';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <button id="rect-btn">RECT</button>
  <div id="editor" >
  </div>
`;

const app = new CCDApp();

const editor = document.getElementById('editor');
if (editor) {
  app.init(editor);
}

const rectBtn = document.getElementById('rect-btn');
rectBtn?.addEventListener('click', (e) => {
  app.useTool('rectangle');
});

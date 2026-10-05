import './styles.css';

const materials = [
  { id: 'void', name: 'Empty', short: 'Erase', color: '#121c26', texture: 'empty', mass: 0 },
  { id: 'steel', name: 'Hardened steel', short: 'Steel', color: '#6d8497', texture: 'steel', mass: 7.8, strength: 0.9 },
  { id: 'ceramic', name: 'Ceramic tile', short: 'Ceramic', color: '#d8c39a', texture: 'ceramic', mass: 3.8, strength: 0.76 },
  { id: 'kevlar', name: 'Aramid weave', short: 'Aramid', color: '#e6b94c', texture: 'kevlar', mass: 1.45, strength: 0.58 },
  { id: 'rubber', name: 'Elastomer', short: 'Rubber', color: '#2b806f', texture: 'rubber', mass: 1.1, strength: 0.28 },
  { id: 'concrete', name: 'Concrete', short: 'Concrete', color: '#9da2a1', texture: 'concrete', mass: 2.4, strength: 0.52 },
];

const state = {
  cols: 20, rows: 12, cell: 27, zoom: 1, tool: 'paint', material: 'steel',
  grid: [], projectile: { type: 'AP round', velocity: 820, caliber: 12.7 },
  running: false, animation: 0, impact: null, history: [], historyIndex: -1,
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const materialById = (id) => materials.find((item) => item.id === id) || materials[0];
const blankGrid = () => Array.from({ length: state.rows }, () => Array(state.cols).fill('void'));

function seedGrid() {
  state.grid = blankGrid();
  for (let y = 5; y < 9; y += 1) for (let x = 3; x < 17; x += 1) state.grid[y][x] = y === 5 || y === 8 ? 'ceramic' : 'steel';
  for (let y = 6; y < 8; y += 1) for (let x = 7; x < 13; x += 1) state.grid[y][x] = 'kevlar';
}

seedGrid();

function appTemplate() {
  return `
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Strata Forge home"><span class="brand-mark">✦</span><span>STRATA <b>FORGE</b></span></a>
      <nav class="topnav" aria-label="Primary navigation"><a href="#studio">Studio</a><a href="#materials">Materials</a><a href="#how-it-works">How it works</a></nav>
      <div class="top-actions"><button class="text-button" id="import-button">Import</button><button class="button button-small" id="export-button">Export design <span>↗</span></button><input id="file-input" type="file" accept="application/json" hidden /></div>
    </header>
    <main id="top">
      <section class="hero">
        <div class="hero-copy"><p class="eyebrow">IMPACT DESIGN STUDIO <span></span> v1.0</p><h1>Design for the<br /><em>moment of impact.</em></h1><p class="hero-text">Build layered protection, tune your materials, and see the physics play out. A focused sandbox for curious engineers.</p><a href="#studio" class="button button-primary">Open the studio <span>↓</span></a><div class="hero-meta"><span><i class="status-dot"></i> Browser-based simulation</span><span>● No account required</span></div></div>
        <div class="hero-art" aria-label="Animated armor impact preview"><div class="art-glow"></div><div class="art-rings"><span></span><span></span><span></span><span></span></div><div class="art-plate"></div><div class="art-bolt"></div><div class="art-label label-a">IMPACT VECTOR <b>→ 820 M/S</b></div><div class="art-label label-b">LAYER 03 <b>ARAMID WEAVE</b></div></div>
      </section>
      <section class="stats"><div><strong>06</strong><span>material responses</span></div><div><strong>∞</strong><span>configurations to test</span></div><div><strong>2D</strong><span>real-time sandbox</span></div><div class="stats-note">Turn an idea into<br /><b>evidence.</b></div></section>
      <section class="studio-section" id="studio">
        <div class="section-heading"><div><p class="eyebrow">01 / CONSTRUCTION</p><h2>Build your stack.</h2></div><p>Paint an armor cross-section cell by cell.<br />Every layer changes the outcome.</p></div>
        <div class="studio-layout">
          <aside class="panel controls-panel"><div class="panel-heading"><span>DESIGN TOOLS</span><button class="icon-button" id="reset-button" title="Reset design">↺</button></div><div class="tool-grid">${['paint','erase','fill','mirror','outline','snap'].map((tool) => `<button class="tool ${tool === 'paint' ? 'active' : ''}" data-tool="${tool}"><span class="tool-icon">${{paint:'⌁',erase:'⌫',fill:'◈',mirror:'⇋',outline:'▣',snap:'⊞'}[tool]}</span>${tool[0].toUpperCase() + tool.slice(1)}</button>`).join('')}</div><div class="divider"></div><div class="field-label">PROJECTILE PROFILE</div><select id="projectile-type"><option>AP round</option><option>Fragmentation</option><option>Blunt slug</option></select><label class="range-label">Velocity <output id="velocity-value">820 m/s</output></label><input id="velocity" type="range" min="200" max="1400" value="820" /><label class="range-label">Caliber <output id="caliber-value">12.7 mm</output></label><input id="caliber" type="range" min="5" max="30" step=".5" value="12.7" /><div class="divider"></div><div class="panel-heading"><span>QUICK ACTIONS</span></div><button class="wide-button" id="clear-button">Clear canvas <span>⌫</span></button><button class="wide-button" id="undo-button">Undo last action <span>⌘Z</span></button></aside>
          <div class="editor-wrap"><div class="editor-toolbar"><div class="toolbar-status"><span class="live-dot"></span> EDITOR LIVE <span class="toolbar-separator">/</span> <span id="cell-count">72 cells</span></div><div class="zoom-controls"><button id="zoom-out">−</button><span id="zoom-value">100%</span><button id="zoom-in">+</button></div></div><div class="canvas-shell"><canvas id="editor-canvas" aria-label="Armor grid editor"></canvas><div class="canvas-crosshair"></div></div><div class="editor-footer"><span><kbd>SHIFT</kbd> + drag to mirror paint</span><span>Grid snaps automatically</span><button id="save-button">Save design <span>↗</span></button></div></div>
          <aside class="panel palette-panel" id="materials"><div class="panel-heading"><span>MATERIAL PALETTE</span><span class="material-count">06</span></div><div class="material-list">${materials.slice(1).map((material) => `<button class="material-option ${material.id === 'steel' ? 'active' : ''}" data-material="${material.id}"><span class="swatch ${material.texture}" style="--swatch:${material.color}"></span><span><b>${material.name}</b><small>${material.mass} g/cm³</small></span><i>›</i></button>`).join('')}</div><div class="material-tip"><span>✦</span><p><b>Layering tip</b><br />Hard faces break up energy. Flexible layers catch what remains.</p></div></aside>
        </div>
      </section>
      <section class="simulation-section" id="simulation"><div class="section-heading"><div><p class="eyebrow">02 / VALIDATION</p><h2>Test the response.</h2></div><p>Launch a projectile at your design.<br />Watch force become a visible story.</p></div><div class="simulation-layout"><div class="sim-stage"><canvas id="simulation-canvas" aria-label="2D projectile impact simulation"></canvas><div class="sim-overlay"><span class="sim-badge"><i class="live-dot"></i> LIVE SIMULATION</span><span id="sim-state">READY TO FIRE</span></div><div class="sim-controls"><button class="button button-primary" id="fire-button">Fire projectile <span>→</span></button><button class="button button-ghost" id="step-button">Single step</button></div></div><aside class="panel telemetry"><div class="panel-heading"><span>IMPACT TELEMETRY</span><span class="telemetry-live">● READY</span></div><div class="impact-result" id="impact-result"><strong>—</strong><span>awaiting impact</span></div><div class="telemetry-row"><span>Residual velocity</span><b id="residual-velocity">—</b></div><div class="telemetry-row"><span>Energy absorbed</span><b id="energy-absorbed">—</b></div><div class="telemetry-row"><span>Damage profile</span><b id="damage-profile">—</b></div><div class="telemetry-chart"><div class="chart-label"><span>FORCE / TIME</span><span>0 — 4.0 ms</span></div><div class="chart-bars" id="chart-bars">${Array.from({length: 18}, (_, i) => `<i style="height:${12 + ((i * 17) % 54)}%"></i>`).join('')}</div></div><button class="wide-button" id="replay-button">Replay last test <span>↻</span></button></aside></div></section>
      <section class="materials-section" id="how-it-works"><div class="section-heading"><div><p class="eyebrow">03 / MATERIAL LIBRARY</p><h2>Every material tells<br />a different story.</h2></div><p>Real-world properties, simplified<br />for fast, visual exploration.</p></div><div class="material-cards">${materials.slice(1, 5).map((m, i) => `<article class="material-card"><div class="card-number">0${i + 1}</div><span class="swatch ${m.texture}" style="--swatch:${m.color}"></span><h3>${m.name}</h3><p>${['High hardness, brittle response. Shatters the projectile core.','Lightweight and tough. Captures fragments after the strike.','High tensile strength. Spreads force across the weave.','Damps shock and catches spall in motion.'][i]}</p><div class="card-stat"><span>Density</span><b>${m.mass} <small>g/cm³</small></b></div></article>`).join('')}</div></section>
    </main><footer><span class="brand"><span class="brand-mark">✦</span><span>STRATA <b>FORGE</b></span></span><span>Made for better questions.</span><span>© 2026 Strata Forge</span></footer>
  `;
}

document.querySelector('#app').innerHTML = appTemplate();
const editorCanvas = $('#editor-canvas');
const simulationCanvas = $('#simulation-canvas');
const editorContext = editorCanvas.getContext('2d');
const simulationContext = simulationCanvas.getContext('2d');

function resizeCanvas(canvas, context, ratio = 1) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  context.setTransform(dpr * ratio, 0, 0, dpr * ratio, 0, 0);
  return rect;
}

function drawCell(context, x, y, size, material) {
  const item = materialById(material);
  context.fillStyle = item.color; context.fillRect(x + 1, y + 1, size - 2, size - 2);
  if (item.texture !== 'empty') { context.globalAlpha = .18; context.strokeStyle = '#fff'; context.lineWidth = 1; for (let i = -size; i < size * 2; i += 7) { context.beginPath(); context.moveTo(x + i, y); context.lineTo(x + i + size, y + size); context.stroke(); } context.globalAlpha = 1; }
}

function drawEditor() {
  const rect = resizeCanvas(editorCanvas, editorContext, state.zoom);
  const size = state.cell; const width = state.cols * size; const height = state.rows * size;
  editorContext.clearRect(0, 0, rect.width / state.zoom, rect.height / state.zoom);
  editorContext.fillStyle = '#0d151e'; editorContext.fillRect(0, 0, width, height);
  state.grid.forEach((row, y) => row.forEach((material, x) => drawCell(editorContext, x * size, y * size, size, material)));
  editorContext.strokeStyle = 'rgba(166, 191, 202, .16)'; editorContext.lineWidth = 1;
  for (let x = 0; x <= state.cols; x += 1) { editorContext.beginPath(); editorContext.moveTo(x * size + .5, 0); editorContext.lineTo(x * size + .5, height); editorContext.stroke(); }
  for (let y = 0; y <= state.rows; y += 1) { editorContext.beginPath(); editorContext.moveTo(0, y * size + .5); editorContext.lineTo(width, y * size + .5); editorContext.stroke(); }
  $('#cell-count').textContent = `${state.grid.flat().filter((cell) => cell !== 'void').length} filled cells`;
  $('#zoom-value').textContent = `${Math.round(state.zoom * 100)}%`;
}

function snapshot() { state.history = state.history.slice(0, state.historyIndex + 1); state.history.push(state.grid.map((row) => [...row])); state.historyIndex += 1; if (state.history.length > 30) { state.history.shift(); state.historyIndex -= 1; } }
snapshot();
function gridPoint(event) { const rect = editorCanvas.getBoundingClientRect(); return { x: Math.floor((event.clientX - rect.left) / state.zoom / state.cell), y: Math.floor((event.clientY - rect.top) / state.zoom / state.cell) }; }
function paintAt(x, y, material = state.material) {
  if (x < 0 || x >= state.cols || y < 0 || y >= state.rows) return;
  const tool = state.tool; if (tool === 'fill') { const target = state.grid[y][x]; if (target === material) return; const queue = [[x, y]], seen = new Set(); while (queue.length) { const [cx, cy] = queue.pop(); const key = `${cx},${cy}`; if (seen.has(key) || cx < 0 || cy < 0 || cx >= state.cols || cy >= state.rows || state.grid[cy][cx] !== target) continue; seen.add(key); state.grid[cy][cx] = material; queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]); } } else { const value = tool === 'erase' ? 'void' : state.material; state.grid[y][x] = value; if (tool === 'mirror' || event?.shiftKey) state.grid[y][state.cols - x - 1] = value; }
  drawEditor();
}
let drawing = false;
editorCanvas.addEventListener('pointerdown', (event) => { drawing = true; editorCanvas.setPointerCapture(event.pointerId); snapshot(); const p = gridPoint(event); paintAt(p.x, p.y, state.material); });
editorCanvas.addEventListener('pointermove', (event) => { if (!drawing || state.tool === 'fill') return; const p = gridPoint(event); paintAt(p.x, p.y); });
editorCanvas.addEventListener('pointerup', () => { drawing = false; });

function drawSimulation() {
  const rect = resizeCanvas(simulationCanvas, simulationContext);
  const ctx = simulationContext; ctx.clearRect(0, 0, rect.width, rect.height);
  const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height); gradient.addColorStop(0, '#101d28'); gradient.addColorStop(1, '#091017'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.strokeStyle = 'rgba(137, 170, 180, .09)'; ctx.lineWidth = 1; for (let x = 0; x < rect.width; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke(); } for (let y = 0; y < rect.height; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke(); }
  const scale = Math.min(rect.width / 800, rect.height / 300); const armorX = rect.width * .48; const armorY = rect.height * .18; const armorW = rect.width * .36; const armorH = rect.height * .64; const cellW = armorW / state.cols; const cellH = armorH / state.rows;
  state.grid.forEach((row, y) => row.forEach((material, x) => { if (material !== 'void') drawCell(ctx, armorX + x * cellW, armorY + y * cellH, Math.max(cellW, cellH), material); }));
  ctx.strokeStyle = '#d7eced'; ctx.lineWidth = 2; ctx.strokeRect(armorX, armorY, armorW, armorH);
  const impact = state.impact; const progress = impact ? impact.progress : 0; const startX = rect.width * .08; const targetX = armorX + armorW * .52; const bulletX = startX + (targetX - startX) * Math.min(progress, 1); const bulletY = armorY + armorH * .5;
  ctx.save(); ctx.translate(bulletX, bulletY); ctx.rotate(0); ctx.fillStyle = '#e8b94c'; ctx.beginPath(); ctx.moveTo(-28 * scale, -7 * scale); ctx.lineTo(12 * scale, -7 * scale); ctx.lineTo(25 * scale, 0); ctx.lineTo(12 * scale, 7 * scale); ctx.lineTo(-28 * scale, 7 * scale); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff5bf'; ctx.fillRect(-22 * scale, -3 * scale, 14 * scale, 6 * scale); ctx.restore();
  if (impact && progress > .95) { const radius = Math.max(2, (progress - .95) * 300); ctx.strokeStyle = `rgba(255, 211, 101, ${1 - (progress - .95) * 10})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(targetX, bulletY, radius, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 14; i += 1) { const angle = i * .72; ctx.fillStyle = '#e8b94c'; ctx.fillRect(targetX + Math.cos(angle) * radius, bulletY + Math.sin(angle) * radius, 3, 3); } }
  ctx.fillStyle = '#91a7ae'; ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillText('PROJECTILE VECTOR', startX, bulletY - 22); ctx.fillText('TARGET STACK', armorX, armorY - 15);
}

function animate(timestamp) { if (!state.running) return; if (!state.impact) state.impact = { progress: 0 }; state.impact.progress += .012; drawSimulation(); if (state.impact.progress >= 1.14) { state.running = false; completeImpact(); } else requestAnimationFrame(animate); }
function completeImpact() { const velocity = Number(state.projectile.velocity); const steelCells = state.grid.flat().filter((x) => x === 'steel').length; const filled = state.grid.flat().filter((x) => x !== 'void').length; const absorption = Math.min(96, Math.round(38 + filled * 1.15 + steelCells * 0.3 + (state.projectile.caliber < 15 ? 9 : 0))); const residual = Math.max(0, Math.round(velocity * (1 - absorption / 100))); const status = residual < 180 ? 'STOPPED' : residual < 450 ? 'DEFELECTED' : 'PENETRATED'; $('#sim-state').textContent = status; $('.telemetry-live').textContent = '● COMPLETE'; $('#impact-result strong').textContent = status; $('#impact-result span').textContent = `${absorption}% energy absorbed`; $('#residual-velocity').textContent = `${residual} m/s`; $('#energy-absorbed').textContent = `${Math.round(velocity * velocity * .5 / 1000)} kJ`; $('#damage-profile').textContent = residual < 180 ? 'Localized' : residual < 450 ? 'Spall cone' : 'Full breach'; $('#chart-bars').innerHTML = Array.from({length: 18}, (_, i) => `<i style="height:${Math.max(8, 86 - Math.abs(i - 6) * 11 + (i % 3) * 5)}%"></i>`).join(''); drawSimulation(); }

function saveDesign() { localStorage.setItem('strata-forge-design', JSON.stringify({ grid: state.grid, projectile: state.projectile, version: 1 })); $('#save-button').textContent = 'Saved ✓'; setTimeout(() => { $('#save-button').innerHTML = 'Save design <span>↗</span>'; }, 1500); }
function exportDesign() { const blob = new Blob([JSON.stringify({ grid: state.grid, projectile: state.projectile, version: 1 }, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'strata-forge-design.json'; link.click(); URL.revokeObjectURL(link.href); }

document.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-tool]').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.tool = button.dataset.tool; }));
document.querySelectorAll('[data-material]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-material]').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.material = button.dataset.material; state.tool = 'paint'; document.querySelector('[data-tool="paint"]').classList.add('active'); }));
$('#velocity').addEventListener('input', (event) => { state.projectile.velocity = Number(event.target.value); $('#velocity-value').textContent = `${event.target.value} m/s`; });
$('#caliber').addEventListener('input', (event) => { state.projectile.caliber = Number(event.target.value); $('#caliber-value').textContent = `${event.target.value} mm`; });
$('#projectile-type').addEventListener('change', (event) => { state.projectile.type = event.target.value; });
$('#zoom-in').addEventListener('click', () => { state.zoom = Math.min(1.4, state.zoom + .1); drawEditor(); }); $('#zoom-out').addEventListener('click', () => { state.zoom = Math.max(.7, state.zoom - .1); drawEditor(); });
$('#clear-button').addEventListener('click', () => { snapshot(); state.grid = blankGrid(); drawEditor(); }); $('#reset-button').addEventListener('click', () => { snapshot(); seedGrid(); drawEditor(); });
$('#undo-button').addEventListener('click', () => { if (state.historyIndex > 0) { state.historyIndex -= 1; state.grid = state.history[state.historyIndex].map((row) => [...row]); drawEditor(); } });
$('#fire-button').addEventListener('click', () => { state.impact = { progress: 0 }; state.running = true; $('#sim-state').textContent = 'PROJECTILE IN FLIGHT'; $('.telemetry-live').textContent = '● RUNNING'; requestAnimationFrame(animate); });
$('#step-button').addEventListener('click', () => { state.impact = state.impact || { progress: 0 }; state.impact.progress = Math.min(1.14, state.impact.progress + .12); drawSimulation(); if (state.impact.progress >= 1.14) completeImpact(); });
$('#replay-button').addEventListener('click', () => { state.impact = { progress: 0 }; state.running = true; $('#sim-state').textContent = 'PROJECTILE IN FLIGHT'; requestAnimationFrame(animate); });
$('#save-button').addEventListener('click', saveDesign); $('#export-button').addEventListener('click', exportDesign); $('#import-button').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', (event) => { const [file] = event.target.files; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!Array.isArray(data.grid) || data.grid.length !== state.rows || data.grid.some((row) => row.length !== state.cols)) throw new Error('Invalid grid'); snapshot(); state.grid = data.grid; if (data.projectile) state.projectile = { ...state.projectile, ...data.projectile }; drawEditor(); } catch { alert('That file is not a compatible Strata Forge design.'); } }; reader.readAsText(file); event.target.value = ''; });
window.addEventListener('resize', () => { drawEditor(); drawSimulation(); }); drawEditor(); drawSimulation();

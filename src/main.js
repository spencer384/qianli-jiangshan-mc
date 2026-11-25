import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBlockTextures } from './textures.js';
import { createTerrainAndWater, getTerrainHeight, SCROLL_WIDTH } from './terrain.js';
import { createArchitectureAndFlora } from './architecture.js';
import { createAnimations } from './animations.js';

const SCENIC_SPOTS = [
  {
    id: 'siyin',
    name: '卷首四印',
    tag: '卷首 · 孤峰與水村',
    x: 274,
    pos: new THREE.Vector3(265, 16, 44),
    target: new THREE.Vector3(276, 4.0, 0),
    desc: '方塊化重構畫卷右端四方朱印裱邊，入畫處聳立石青方塊孤峰與竹林水村。',
  },
  {
    id: 'youwan',
    name: '右岸煙波灣',
    tag: '開展 · 方塊水灣',
    x: 238,
    pos: new THREE.Vector3(238, 14, 38),
    target: new THREE.Vector3(238, 1.5, 4),
    desc: '開闊的像素水灣，方塊白鷺與木舟輕泛於波面之上。',
  },
  {
    id: 'youer',
    name: '右二主山群',
    tag: '連綿 · 體素層巒',
    x: 196,
    pos: new THREE.Vector3(196, 22, 48),
    target: new THREE.Vector3(196, 8.5, -4),
    desc: '孔雀綠與石青方塊堆疊出的連綿群峰，山腳掩映階梯屋頂茅舍村落與木橋。',
  },
  {
    id: 'youyi',
    name: '右一大主山',
    tag: '峻拔 · 泊船灣',
    x: 132,
    pos: new THREE.Vector3(132, 24, 46),
    target: new THREE.Vector3(132, 9.5, -4),
    desc: '右側雄渾高峰以青金石與石青方塊築成，灣內停泊著方塊高桅帆船。',
  },
  {
    id: 'zhongyouwan',
    name: '中右開闊水灣',
    tag: '留白 · 氣韻貫通',
    x: 82,
    pos: new THREE.Vector3(82, 16, 42),
    target: new THREE.Vector3(82, 2.0, 4),
    desc: '主峰與右側山群之間的方塊水面留白，高桅江船靜泊水際。',
  },
  {
    id: 'zhufeng',
    name: '正中特大主峰',
    tag: '全卷核心 · 飛瀑亭橋',
    x: 0,
    pos: new THREE.Vector3(4, 34, 62),
    target: new THREE.Vector3(0, 14.0, -6),
    desc: '全卷最巍峨的雙頂主峰，以青金石與石青體素築頂，右側方塊飛瀑直瀉入潭，前景雙層亭拱橋上旅人往來不絕。',
  },
  {
    id: 'zhongzuo',
    name: '中左層巒山寺',
    tag: '幽境 · 方塊古剎',
    x: -64,
    pos: new THREE.Vector3(-62, 22, 42),
    target: new THREE.Vector3(-64, 8.5, -4),
    desc: '階梯狀體素山勢平臺建有朱柱山門、古剎與五層金頂方塊佛塔。',
  },
  {
    id: 'zuozhong',
    name: '左中銳峰群',
    tag: '奇峭 · 臨江石壁',
    x: -116,
    pos: new THREE.Vector3(-116, 18, 38),
    target: new THREE.Vector3(-116, 7.0, -4),
    desc: '險峻挺拔的方塊銳峰探入江心，層次分明的體素台階呈現獨特 Minecraft 美學。',
  },
  {
    id: 'dahu',
    name: '左端平遠大湖',
    tag: '平遠 · 遠山蘆洲',
    x: -200,
    pos: new THREE.Vector3(-200, 16, 48),
    target: new THREE.Vector3(-200, 2.0, 0),
    desc: '全卷最寬廣的像素湖面，遠方淡青方塊山影與前景甘蔗蘆葦、漁舟白鷺相映。',
  },
  {
    id: 'juanwei',
    name: '卷尾雙峰與雙印',
    tag: '收卷 · 峭拔雙尖',
    x: -278,
    pos: new THREE.Vector3(-268, 20, 44),
    target: new THREE.Vector3(-278, 8.0, -4),
    desc: '畫卷最左端陡然拔起兩座尖峭體素青峰，俯瞰山腳漁村與方琮款印裱邊。',
  },
];

// --- Scene & Renderer ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#c6dfeb');
scene.fog = new THREE.FogExp2('#c6dfeb', 0.0036);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 800);
const OVERVIEW_POS = new THREE.Vector3(0, 38, 108);
const OVERVIEW_TARGET = new THREE.Vector3(0, 9, -4);
camera.position.copy(OVERVIEW_POS);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 8;
controls.maxDistance = 260;
controls.screenSpacePanning = false;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
};
controls.touches = {
  ONE: THREE.TOUCH.PAN,
  TWO: THREE.TOUCH.DOLLY_ROTATE,
};
controls.target.copy(OVERVIEW_TARGET);

// --- Minecraft Crisp Sun Lighting ---
scene.add(new THREE.HemisphereLight('#ffffff', '#3e5e50', 1.35));

const sunLight = new THREE.DirectionalLight('#fff8e6', 1.9);
sunLight.position.set(90, 125, 65);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 420;
sunLight.shadow.camera.left = -280;
sunLight.shadow.camera.right = 280;
sunLight.shadow.camera.top = 95;
sunLight.shadow.camera.bottom = -95;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// --- Build Minecraft Voxel World ---
const textures = createBlockTextures();
const { waterTex, cloudBoxes, mistLayers } = createTerrainAndWater(scene, textures);
createArchitectureAndFlora(scene, textures);
const updateAnimations = createAnimations(scene);

// --- Camera Tweening & Controls ---
let viewMode = '3d';
let tweenState = null;
let tourActive = false;
let tourIndex = 0;
let tourTimer = 0;
const TOUR_DWELL = 5.0;

function flyTo(pos, target, duration = 1.2) {
  tweenState = {
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    endPos: pos.clone(),
    endTarget: target.clone(),
    elapsed: 0,
    duration,
  };
}

function zoomCamera(factor) {
  stopTour();
  tweenState = null;
  const offset = camera.position.clone().sub(controls.target);
  const dist = offset.length();
  const nextDist = THREE.MathUtils.clamp(dist * factor, controls.minDistance, controls.maxDistance);
  offset.setLength(nextDist);
  camera.position.copy(controls.target).add(offset);
}

function selectSpot(spot, fromTour = false) {
  if (!fromTour) stopTour();
  document.querySelectorAll('.spot-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === spot.id);
  });

  const card = document.getElementById('spot-card');
  document.getElementById('spot-card-title').textContent = spot.name;
  document.getElementById('spot-card-tag').textContent = spot.tag;
  document.getElementById('spot-card-desc').textContent = spot.desc;
  card.classList.remove('hidden');

  if (viewMode === 'scroll') {
    flyTo(new THREE.Vector3(spot.x, 28, 92), new THREE.Vector3(spot.x, 9, -4), 1.15);
  } else {
    flyTo(spot.pos, spot.target, 1.25);
  }

  if (!fromTour && window.innerWidth <= 768) {
    setSpotsOpen(false);
  }
}

function setViewMode(mode) {
  viewMode = mode;
  document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
  document.getElementById('btn-scroll').classList.toggle('active', mode === 'scroll');

  if (mode === 'scroll') {
    const cx = THREE.MathUtils.clamp(controls.target.x, -265, 265);
    flyTo(new THREE.Vector3(cx, 28, 94), new THREE.Vector3(cx, 9, -4), 1.0);
  } else {
    flyTo(OVERVIEW_POS, OVERVIEW_TARGET, 1.0);
  }
}

function stopTour() {
  tourActive = false;
  const btn = document.getElementById('btn-tour');
  btn.classList.remove('tour-active');
  btn.textContent = '導覽';
}

const spotsPanelEl = document.getElementById('spots-panel');
const btnSpotsToggle = document.getElementById('btn-spots-toggle');

function setSpotsOpen(open) {
  spotsPanelEl.classList.toggle('collapsed', !open);
  btnSpotsToggle.classList.toggle('active', open);
}

setSpotsOpen(window.innerWidth > 768);

btnSpotsToggle.addEventListener('click', () => {
  setSpotsOpen(spotsPanelEl.classList.contains('collapsed'));
});
document.getElementById('spots-close').addEventListener('click', () => setSpotsOpen(false));

function toggleTour() {
  if (tourActive) {
    stopTour();
    return;
  }
  tourActive = true;
  tourIndex = 0;
  tourTimer = 0;
  const btn = document.getElementById('btn-tour');
  btn.classList.add('tour-active');
  btn.textContent = '暫停導覽';
  selectSpot(SCENIC_SPOTS[0], true);
}

const spotsListEl = document.getElementById('spots-list');
SCENIC_SPOTS.forEach((spot, idx) => {
  const btn = document.createElement('button');
  btn.className = 'spot-btn';
  btn.dataset.id = spot.id;
  btn.innerHTML = `<span>${spot.name}</span><span class="spot-idx">${String(idx + 1).padStart(2, '0')}</span>`;
  btn.addEventListener('click', () => selectSpot(spot));
  spotsListEl.appendChild(btn);
});

document.getElementById('btn-3d').addEventListener('click', () => {
  stopTour();
  setViewMode('3d');
});
document.getElementById('btn-scroll').addEventListener('click', () => {
  stopTour();
  setViewMode('scroll');
});
document.getElementById('btn-zoom-in').addEventListener('click', () => zoomCamera(0.75));
document.getElementById('btn-zoom-out').addEventListener('click', () => zoomCamera(1.33));
document.getElementById('btn-reset').addEventListener('click', () => {
  stopTour();
  document.querySelectorAll('.spot-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById('spot-card').classList.add('hidden');
  setViewMode(viewMode);
});
document.getElementById('btn-tour').addEventListener('click', toggleTour);
document.getElementById('spot-card-close').addEventListener('click', () => {
  document.getElementById('spot-card').classList.add('hidden');
});

controls.addEventListener('start', () => {
  tweenState = null;
  if (tourActive) stopTour();
});

// --- Blocky Pixel Minimap ---
const minimapCanvas = document.getElementById('minimap-canvas');
const mctx = minimapCanvas.getContext('2d');
(function renderMinimap() {
  const w = minimapCanvas.width;
  const h = minimapCanvas.height;
  mctx.fillStyle = '#3b858c';
  mctx.fillRect(0, 0, w, h);

  for (let px = 0; px < w; px += 3) {
    const wx = (px / w - 0.5) * SCROLL_WIDTH;
    for (let py = 0; py < h; py += 3) {
      const wz = (py / h - 0.5) * 86;
      const th = getTerrainHeight(wx, wz);
      if (th > 23) mctx.fillStyle = '#143b68';
      else if (th > 12) mctx.fillStyle = '#1c527a';
      else if (th > 4) mctx.fillStyle = '#2e7353';
      else if (th > 1) mctx.fillStyle = '#a8834c';
      else if (th > 0) mctx.fillStyle = '#dfd2a8';
      else continue;
      mctx.fillRect(px, py, 3, 3);
    }
  }
})();

const minimapTrack = document.getElementById('minimap-track');
const minimapViewport = document.getElementById('minimap-viewport');
let minimapDragging = false;

function jumpFromMinimap(clientX) {
  stopTour();
  tweenState = null;
  const rect = minimapTrack.getBoundingClientRect();
  const t = THREE.MathUtils.clamp((clientX - rect.left) / rect.width, 0, 1);
  const worldX = (t - 0.5) * SCROLL_WIDTH;
  const dx = worldX - controls.target.x;
  controls.target.x = worldX;
  camera.position.x += dx;
}

minimapTrack.addEventListener('pointerdown', (e) => {
  minimapDragging = true;
  minimapTrack.setPointerCapture(e.pointerId);
  jumpFromMinimap(e.clientX);
});
minimapTrack.addEventListener('pointermove', (e) => {
  if (minimapDragging) jumpFromMinimap(e.clientX);
});
minimapTrack.addEventListener('pointerup', () => {
  minimapDragging = false;
});

function updateMinimapIndicator() {
  const halfSpan = Math.min(0.24, Math.max(0.05, camera.position.distanceTo(controls.target) / 680));
  const centerNorm = THREE.MathUtils.clamp(controls.target.x / SCROLL_WIDTH + 0.5, 0, 1);
  const leftPct = Math.max(0, (centerNorm - halfSpan) * 100);
  const widthPct = Math.min(100 - leftPct, halfSpan * 2 * 100);
  minimapViewport.style.left = `${leftPct}%`;
  minimapViewport.style.width = `${widthPct}%`;
}

// --- Render Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  waterTex.offset.x = (elapsed * 0.08) % 1;
  waterTex.offset.y = (elapsed * 0.03) % 1;

  for (const c of cloudBoxes) {
    c.mesh.position.x += c.speed * dt;
    if (c.mesh.position.x > 300) c.mesh.position.x = -300;
  }

  for (const m of mistLayers) {
    m.tex.offset.x = (elapsed * m.speedX) % 1;
    m.tex.offset.y = Math.sin(elapsed * 0.12 + m.phase) * 0.04;
  }

  if (tweenState) {
    tweenState.elapsed += dt;
    const raw = Math.min(1, tweenState.elapsed / tweenState.duration);
    const ease = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    camera.position.lerpVectors(tweenState.startPos, tweenState.endPos, ease);
    controls.target.lerpVectors(tweenState.startTarget, tweenState.endTarget, ease);
    if (raw >= 1) tweenState = null;
  }

  if (tourActive && !tweenState) {
    tourTimer += dt;
    if (tourTimer >= TOUR_DWELL) {
      tourTimer = 0;
      tourIndex = (tourIndex + 1) % SCENIC_SPOTS.length;
      selectSpot(SCENIC_SPOTS[tourIndex], true);
    }
  }

  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -295, 295);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -45, 45);
  controls.target.y = THREE.MathUtils.clamp(controls.target.y, -2, 42);

  controls.update();
  updateAnimations(dt, elapsed);
  updateMinimapIndicator();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

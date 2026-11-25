import * as THREE from 'three';

export const SCROLL_WIDTH = 600;
export const SCROLL_DEPTH = 116;
export const WATER_LEVEL = 0.25;
export const VOXEL_SIZE = 0.5;

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * (smoothNoise(x * freq, z * freq) * 2 - 1);
    freq *= 2.05;
    amp *= 0.48;
  }
  return val;
}

function ridgeFbm(x, z, octaves = 4) {
  let val = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1.0 - Math.abs(smoothNoise(x * freq, z * freq) * 2 - 1);
    val += amp * n * n;
    freq *= 2.1;
    amp *= 0.5;
  }
  return val;
}

function gaussian(x, z, cx, cz, rx, rz) {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  return Math.exp(-(dx * dx + dz * dz));
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function getRawTerrainHeight(x, z) {
  if (x > 291 || x < -291) {
    return -1.4;
  }

  let h = -2.2 + fbm(x * 0.05, z * 0.05, 3) * 0.6;
  const ridge = ridgeFbm(x * 0.04 + 1.7, z * 0.05 - 0.9, 4);

  // 1. 卷首孤峰與丘陵水村 (+254 .. +290)
  h += 17.5 * gaussian(x, z, 287, -20, 7.5, 7.0);
  h += 12.5 * gaussian(x, z, 268, 2, 12, 9);
  h += 9.5 * gaussian(x, z, 256, 8, 9, 7);
  h += ridge * 4.5 * gaussian(x, z, 266, 4, 18, 12);
  h = THREE.MathUtils.lerp(h, 2.0, smoothstep(0.4, 0.85, gaussian(x, z, 258, 12, 5.5, 4.5)));

  // 3. 右二主山群 (+166 .. +226)
  h += 23.0 * gaussian(x, z, 194, -10, 15, 11);
  h += 17.0 * gaussian(x, z, 212, -14, 12, 10);
  h += 15.0 * gaussian(x, z, 178, -6, 12, 10);
  h += 11.0 * gaussian(x, z, 198, 8, 15, 8);
  h += ridge * 6.0 * gaussian(x, z, 195, -6, 26, 16);

  // 4. 右一大主山群 (+102 .. +162)
  h += 27.0 * gaussian(x, z, 142, -12, 13, 11);
  h += 19.0 * gaussian(x, z, 124, -8, 14, 10);
  h += 12.5 * gaussian(x, z, 109, -4, 10, 8);
  h += ridge * 5.5 * gaussian(x, z, 130, -8, 24, 15);
  h = THREE.MathUtils.lerp(h, 2.2, smoothstep(0.4, 0.85, gaussian(x, z, 116, 8, 5.5, 4.5)));

  // 6. 正中特大主峰群 (-36 .. +56)
  h += 42.0 * gaussian(x, z, 0, -16, 15, 13);
  h += 31.0 * gaussian(x, z, 14, -18, 12, 11);
  h += 26.0 * gaussian(x, z, -16, -15, 12, 11);
  h += 18.0 * gaussian(x, z, 30, -10, 12, 10);
  h += 17.0 * gaussian(x, z, -30, -8, 11, 9);
  h += 12.0 * gaussian(x, z, 4, 6, 16, 8);
  h += ridge * 8.5 * gaussian(x, z, 2, -10, 32, 18);
  const wfCliff = gaussian(x, z, 22, -10, 3.2, 2.5);
  h = THREE.MathUtils.lerp(h, 19.5, smoothstep(0.4, 0.85, wfCliff));
  h -= 7.0 * gaussian(x, z, 22, 1.5, 6.2, 4.8);
  h -= 5.8 * gaussian(x, z, -2, 12, 13.5, 7.5);
  h += 4.2 * gaussian(x, z, -18, 12, 5.5, 5.0);
  h += 4.2 * gaussian(x, z, 14, 12, 5.5, 5.0);

  // 7. 中左層巒山群 (-88 .. -42)
  h += 24.5 * gaussian(x, z, -62, -11, 13, 10);
  h += 16.5 * gaussian(x, z, -76, -8, 11, 9);
  h += 13.0 * gaussian(x, z, -50, -4, 10, 8);
  h += ridge * 5.0 * gaussian(x, z, -64, -8, 22, 14);
  h = THREE.MathUtils.lerp(h, 5.0, smoothstep(0.4, 0.85, gaussian(x, z, -66, 4, 5.5, 4.5)));

  // 8. 左中銳峰群 (-140 .. -96)
  h += 20.5 * gaussian(x, z, -118, -9, 11, 9);
  h += 12.5 * gaussian(x, z, -106, -4, 9, 8);
  h += ridge * 4.5 * gaussian(x, z, -116, -6, 18, 12);

  // 9. 左端大平遠湖泊 (-256 .. -146)
  h += 7.5 * gaussian(x, z, -172, -26, 16, 7);
  h += 8.5 * gaussian(x, z, -206, -27, 18, 7);
  h += 5.5 * gaussian(x, z, -236, -24, 14, 6);
  h += 3.6 * gaussian(x, z, -210, 14, 10, 5.5);

  // 10. 卷尾雙尖青峰 (-290 .. -258)
  h += 27.0 * gaussian(x, z, -280, -14, 9, 9);
  h += 19.5 * gaussian(x, z, -270, -10, 8, 8);
  h += 11.0 * gaussian(x, z, -268, 6, 10, 7);
  h += ridge * 4.0 * gaussian(x, z, -275, -8, 15, 12);

  const edgeX = smoothstep(285, 293, Math.abs(x));
  const edgeZ = smoothstep(SCROLL_DEPTH * 0.42, SCROLL_DEPTH * 0.5, Math.abs(z));
  h = THREE.MathUtils.lerp(h, -1.6, Math.max(edgeX, edgeZ));

  return h;
}

// Quantized to 0.5 voxel grid so buildings, trees, and walkers sit flush on block tops
export function getTerrainHeight(x, z) {
  const gx = Math.round(x * 2) / 2;
  const gz = Math.round(z * 2) / 2;
  const stepY = Math.floor(getRawTerrainHeight(gx, gz) / VOXEL_SIZE);
  return (stepY + 0.5) * VOXEL_SIZE;
}

export function getCentralBridgeY(x) {
  const t = Math.max(0, Math.min(1, (x + 15) / 26));
  return Math.round((1.8 + Math.sin(t * Math.PI) * 2.3) * 4) / 4;
}

export function getRightBridgeY(x) {
  const t = Math.max(0, Math.min(1, (x - 154) / 20));
  return Math.round((1.5 + Math.sin(t * Math.PI) * 1.4) * 4) / 4;
}

export function createTerrainAndWater(scene, textures) {
  const nxMin = -584; // -292 / 0.5
  const nxMax = 584;
  const nzMin = -88; // -44 / 0.5
  const nzMax = 88;
  const widthCount = nxMax - nxMin + 1;
  const depthCount = nzMax - nzMin + 1;

  const grid = new Int16Array(widthCount * depthCount);
  const idx = (ix, iz) => (ix - nxMin) * depthCount + (iz - nzMin);

  for (let ix = nxMin; ix <= nxMax; ix++) {
    const wx = ix * VOXEL_SIZE;
    for (let iz = nzMin; iz <= nzMax; iz++) {
      const wz = iz * VOXEL_SIZE;
      grid[idx(ix, iz)] = Math.floor(getRawTerrainHeight(wx, wz) / VOXEL_SIZE);
    }
  }

  const buckets = {
    underwater: [],
    sand: [],
    ochre: [],
    malachite: [],
    azurite: [],
    lapisPeak: [],
  };

  for (let ix = nxMin; ix <= nxMax; ix++) {
    const wx = ix * VOXEL_SIZE;
    for (let iz = nzMin; iz <= nzMax; iz++) {
      const wz = iz * VOXEL_SIZE;
      const h = grid[idx(ix, iz)];

      // Skip deep flat ocean floor to keep triangle count lean and 60fps smooth
      if (h < -2) continue;

      const hL = ix > nxMin ? grid[idx(ix - 1, iz)] : h;
      const hR = ix < nxMax ? grid[idx(ix + 1, iz)] : h;
      const hF = iz > nzMin ? grid[idx(ix, iz - 1)] : h;
      const hB = iz < nzMax ? grid[idx(ix, iz + 1)] : h;
      const minNeighbor = Math.min(hL, hR, hF, hB);
      const startY = Math.max(-2, Math.min(h, minNeighbor + 1));

      for (let iy = startY; iy <= h; iy++) {
        const wy = iy * VOXEL_SIZE;
        let type = 'ochre';
        if (wy < 0) type = 'underwater';
        else if (wy <= 1.25) type = 'sand';
        else if (wy <= 4.25) type = 'ochre';
        else if (wy <= 12.25) type = 'malachite';
        else if (wy <= 23.0) type = 'azurite';
        else type = 'lapisPeak';

        buckets[type].push(wx, wy, wz);
      }
    }
  }

  const blockGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
  const dummy = new THREE.Object3D();

  const blockConfigs = [
    { key: 'underwater', tex: textures.underwater, roughness: 0.9, shadow: false },
    { key: 'sand', tex: textures.sand, roughness: 0.92, shadow: true },
    { key: 'ochre', tex: textures.ochre, roughness: 0.92, shadow: true },
    { key: 'malachite', tex: textures.malachite, roughness: 0.88, shadow: true },
    { key: 'azurite', tex: textures.azurite, roughness: 0.85, shadow: true },
    { key: 'lapisPeak', tex: textures.lapisPeak, roughness: 0.8, shadow: true },
  ];

  for (const cfg of blockConfigs) {
    const coords = buckets[cfg.key];
    const count = coords.length / 3;
    if (count === 0) continue;

    const mat = new THREE.MeshStandardMaterial({
      map: cfg.tex,
      roughness: cfg.roughness,
      metalness: 0.02,
    });
    const inst = new THREE.InstancedMesh(blockGeo, mat, count);
    inst.castShadow = cfg.shadow;
    inst.receiveShadow = true;

    for (let i = 0; i < count; i++) {
      dummy.position.set(coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

  // --- Minecraft Pixelated Water Plane ---
  const waterGeo = new THREE.PlaneGeometry(SCROLL_WIDTH - 16, SCROLL_DEPTH - 8);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    map: textures.water,
    color: '#73c7c4',
    transparent: true,
    opacity: 0.82,
    roughness: 0.25,
    metalness: 0.08,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_LEVEL;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // --- Minecraft Sky Dome + Square Sun + Blocky Clouds ---
  const skyGeo = new THREE.SphereGeometry(460, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      void main() {
        float h = clamp(normalize(vPos).y, 0.0, 1.0);
        vec3 horizon = vec3(0.78, 0.87, 0.92);
        vec3 zenith = vec3(0.45, 0.70, 0.93);
        gl_FragColor = vec4(mix(horizon, zenith, pow(h, 0.55)), 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const sunMesh = new THREE.Mesh(
    new THREE.BoxGeometry(24, 24, 2),
    new THREE.MeshBasicMaterial({ color: '#fff7c2' })
  );
  sunMesh.position.set(140, 155, -180);
  sunMesh.lookAt(0, 0, 0);
  scene.add(sunMesh);

  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1.0,
    emissive: '#e8f1f8',
    emissiveIntensity: 0.35,
  });
  const cloudBoxes = [];
  for (let i = 0; i < 28; i++) {
    const cx = (hash2(i, 11) - 0.5) * 560;
    const cy = 54 + Math.floor(hash2(i, 22) * 8);
    const cz = -42 + hash2(i, 33) * 58;
    const w = 12 + Math.floor(hash2(i, 44) * 18);
    const d = 6 + Math.floor(hash2(i, 55) * 8);
    const cloud = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), cloudMat);
    cloud.position.set(cx, cy, cz);
    cloudsGroup.add(cloud);
    cloudBoxes.push({ mesh: cloud, speed: 0.6 + hash2(i, 66) * 0.5 });
  }
  scene.add(cloudsGroup);

  // --- Lake Surface & Mid-Mountain Hazy Mist Layers (山水湖面朦朧薄霧) ---
  function createMistTexture(seedOffset) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 48; i++) {
      const rx = hash2(i + seedOffset, 1.3) * 256;
      const ry = hash2(i + seedOffset, 2.7) * 128;
      const rad = 18 + hash2(i + seedOffset, 4.1) * 34;
      const g = ctx.createRadialGradient(rx, ry, 2, rx, ry, rad);
      g.addColorStop(0, 'rgba(232, 244, 248, 0.28)');
      g.addColorStop(0.55, 'rgba(220, 238, 244, 0.14)');
      g.addColorStop(1, 'rgba(220, 238, 244, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(rx - rad, ry - rad, rad * 2, rad * 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 2);
    return tex;
  }

  const mistLayers = [];
  const mistConfigs = [
    { y: WATER_LEVEL + 0.38, opacity: 0.48, speedX: 0.012, phase: 0.0, z: 6, depth: 74 },
    { y: WATER_LEVEL + 0.95, opacity: 0.34, speedX: -0.009, phase: 1.7, z: 2, depth: 66 },
    { y: 6.2, opacity: 0.28, speedX: 0.007, phase: 3.1, z: -12, depth: 36 },
    { y: 10.5, opacity: 0.22, speedX: -0.006, phase: 4.5, z: -15, depth: 30 },
  ];

  mistConfigs.forEach((cfg, idx) => {
    const tex = createMistTexture(idx * 31);
    const geo = new THREE.PlaneGeometry(SCROLL_WIDTH - 24, cfg.depth);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: cfg.opacity,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, cfg.y, cfg.z);
    scene.add(mesh);
    mistLayers.push({ mesh, tex, speedX: cfg.speedX, phase: cfg.phase });
  });

  return { waterMesh, waterTex: textures.water, cloudBoxes, mistLayers };
}

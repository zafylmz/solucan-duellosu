import * as THREE from 'three';
import { RINGS, Z_SCALE } from './path.js';

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function rugTexture() {
  return canvasTexture(1024, 1024, (ctx) => {
    ctx.fillStyle = '#7d2434';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#e6c27a';
    ctx.lineWidth = 28;
    ctx.strokeRect(48, 48, 928, 928);
    ctx.strokeStyle = '#f6e6c8';
    ctx.lineWidth = 8;
    ctx.strokeRect(78, 78, 868, 868);
    ctx.fillStyle = '#c9843a';
    for (let y = 180; y <= 860; y += 220) {
      for (let x = 180; x <= 860; x += 220) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-34, -34, 68, 68);
        ctx.fillStyle = '#f8ead2';
        ctx.fillRect(-14, -14, 28, 28);
        ctx.restore();
        ctx.fillStyle = '#c9843a';
      }
    }
    ctx.beginPath();
    ctx.arc(512, 512, 110, 0, Math.PI * 2);
    ctx.fillStyle = '#f0d7a2';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(512, 512, 58, 0, Math.PI * 2);
    ctx.fillStyle = '#8d2c3a';
    ctx.fill();
  });
}

function skyTexture() {
  return canvasTexture(16, 512, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#7eb0dc');
    gradient.addColorStop(0.42, '#c5dff2');
    gradient.addColorStop(0.72, '#f3e7c4');
    gradient.addColorStop(1, '#d7e7c4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 512);
  });
}

function grassTexture() {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#6c9a48';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 700; i += 1) {
      const x = (i * 97) % 512;
      const y = (i * 57) % 512;
      ctx.fillStyle = i % 3 === 0 ? '#8fbf62' : '#4f7a34';
      ctx.fillRect(x, y, 3 + (i % 4), 2 + (i % 3));
    }
    ctx.fillStyle = '#e7b7c4';
    for (let i = 0; i < 40; i += 1) {
      ctx.fillRect((i * 131) % 512, (i * 89) % 512, 2, 2);
    }
  });
}

function fieldTexture() {
  return canvasTexture(64, 256, (ctx) => {
    for (let y = 0; y < 256; y += 16) {
      ctx.fillStyle = (y / 16) % 2 === 0 ? '#c6b15a' : '#7ea84e';
      ctx.fillRect(0, y, 64, 16);
    }
  });
}

function addCountryside(scene) {
  const trunk = new THREE.MeshToonMaterial({ color: 0x6b442c });
  const cypress = new THREE.MeshToonMaterial({ color: 0x2f6a3a });
  const canopy = new THREE.MeshToonMaterial({ color: 0x3d8a45 });
  const canopyDark = new THREE.MeshToonMaterial({ color: 0x2d6a38 });
  const leaf = new THREE.MeshToonMaterial({ color: 0x4e8f3e });
  const hillNear = new THREE.MeshToonMaterial({ color: 0x8eaf62 });
  const hillFar = new THREE.MeshToonMaterial({ color: 0xb7c99a });

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.02;
  scene.add(grass);

  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 16),
    new THREE.MeshStandardMaterial({ map: fieldTexture(), roughness: 1 }),
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, 0.01, -16);
  scene.add(field);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 4.2),
    new THREE.MeshStandardMaterial({ color: 0xc6a56e, roughness: 1 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, 7.1);
  scene.add(path);

  function hill(x, z, sx, sy, sz, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), material);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, sy * 0.05, z);
    scene.add(mesh);
  }
  hill(-10, -24, 12, 3.4, 7, hillFar);
  hill(8, -27, 14, 4.2, 8, hillFar);
  hill(0, -20, 9, 2.6, 5.5, hillNear);
  hill(-16, -18, 7, 2.2, 4, hillNear);
  hill(16, -19, 8, 2.4, 4.5, hillNear);

  function tree(x, z, kind, scale) {
    const group = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07 * scale, 0.11 * scale, kind === 'cypress' ? 0.9 * scale : 0.7 * scale, 6),
      trunk,
    );
    stem.position.y = (kind === 'cypress' ? 0.45 : 0.35) * scale;
    group.add(stem);
    if (kind === 'cypress') {
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.42 * scale, 2.5 * scale, 8), cypress);
      foliage.position.y = 1.7 * scale;
      group.add(foliage);
    } else {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.72 * scale, 10, 8), scale > 1.1 ? canopyDark : canopy);
      foliage.scale.y = 0.78;
      foliage.position.y = 1.15 * scale;
      group.add(foliage);
    }
    group.position.set(x, 0, z);
    scene.add(group);
  }

  const trees = [
    [-6.4, 2.6, 'round', 1.25],
    [6.6, 2.1, 'round', 1.15],
    [-7.4, -1.2, 'cypress', 1.35],
    [7.6, -0.6, 'cypress', 1.45],
    [-5.6, -5.2, 'round', 1.05],
    [5.8, -5.6, 'round', 1.2],
    [-3.4, -8.4, 'cypress', 1.1],
    [3.6, -8.8, 'round', 1],
    [0.2, -10.2, 'cypress', 0.9],
    [-8.8, -8, 'round', 0.85],
    [9.2, -7.4, 'cypress', 0.95],
  ];
  for (const [x, z, kind, scale] of trees) tree(x, z, kind, scale);

  const blooms = [0xf4b7c8, 0xfff1c9, 0xf0d18a, 0xe7b3c0, 0xf7d0dc];
  const beds = [
    [-1.2, 5.4], [1.2, 5.4], [-2.5, 5.8], [2.5, 5.8], [-3.6, 5.3], [3.6, 5.3],
    [0, 6.5], [-0.8, 6.7], [0.8, 6.7],
    [-5.3, 2.4], [5.3, 2.1], [-5.6, 0.1], [5.7, -0.2], [-5.1, -2.6], [5.2, -2.8],
    [-4.7, -4.6], [4.8, -4.8],
  ];
  beds.forEach(([x, z], index) => {
    const scale = 0.85 + (index % 3) * 0.15;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.32 * scale, 5), leaf);
    stem.position.set(x, 0.15 * scale, z);
    scene.add(stem);
    flower(scene, x, 0.32 * scale, z, scale * 0.9);
    const extra = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 * scale, 8, 6),
      new THREE.MeshToonMaterial({ color: blooms[index % blooms.length] }),
    );
    extra.position.set(x + 0.12, 0.22 * scale, z + 0.05);
    scene.add(extra);
  });
}

function flower(parent, x, y, z, scale) {
  const colors = [0xf4d5dc, 0xfff4e4, 0xe7b3c0, 0xf0d18a];
  const group = new THREE.Group();
  colors.forEach((color, index) => {
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.09 * scale, 8, 8),
      new THREE.MeshToonMaterial({ color }),
    );
    const angle = (index / colors.length) * Math.PI * 2;
    bloom.position.set(Math.cos(angle) * 0.08 * scale, Math.sin(angle) * 0.05 * scale, 0);
    group.add(bloom);
  });
  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * scale, 8, 8),
    new THREE.MeshToonMaterial({ color: 0xfff6ea }),
  );
  group.add(heart);
  group.position.set(x, y, z);
  parent.add(group);
}

export function createStage(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc5dff2);
  scene.fog = new THREE.Fog(0xd5e6c2, 28, 68);

  const widePos = new THREE.Vector3(0, 8.2, 12);
  const wideLook = new THREE.Vector3(0, 0.85, 0);
  const camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.1, 140);
  const currentLook = wideLook.clone();
  camera.position.copy(widePos);
  camera.lookAt(currentLook);

  const closeHead = new THREE.Vector3();
  const closeForward = new THREE.Vector3();
  const closeQuat = new THREE.Quaternion();
  const closePos = new THREE.Vector3();
  const closeLook = new THREE.Vector3();
  let rig = null;

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function closePose(anchor) {
    anchor.getWorldPosition(closeHead);
    const root = anchor.parent?.parent;
    if (root) root.getWorldQuaternion(closeQuat);
    else closeQuat.identity();
    closeForward.set(0, 0, 1).applyQuaternion(closeQuat);
    closeForward.y = 0;
    if (closeForward.lengthSq() < 1e-5) closeForward.set(0, 0, 1);
    closeForward.normalize();
    closePos.copy(closeHead).addScaledVector(closeForward, 3.55);
    closePos.y = 2.25;
    closeLook.copy(closeHead);
    closeLook.y = 1.25;
  }

  function releaseFocus() {
    rig = null;
  }

  function focusOn(anchor) {
    rig = {
      anchor,
      mode: 'in',
      t: 0,
      hold: 0,
      fromPos: camera.position.clone(),
      fromLook: currentLook.clone(),
    };
  }

  function updateCamera(dt) {
    if (!rig) {
      camera.position.copy(widePos);
      currentLook.copy(wideLook);
      camera.lookAt(currentLook);
      return false;
    }
    closePose(rig.anchor);
    if (rig.mode === 'in') {
      rig.t = Math.min(1, rig.t + dt / 0.7);
      const k = smoothstep(rig.t);
      camera.position.lerpVectors(rig.fromPos, closePos, k);
      currentLook.lerpVectors(rig.fromLook, closeLook, k);
      if (rig.t >= 1) {
        rig.mode = 'hold';
        rig.hold = 0;
      }
    } else if (rig.mode === 'hold') {
      camera.position.copy(closePos);
      currentLook.copy(closeLook);
      rig.hold += dt;
      if (rig.hold >= 1.2) {
        rig.mode = 'out';
        rig.t = 0;
        rig.fromPos = camera.position.clone();
        rig.fromLook = currentLook.clone();
      }
    } else {
      rig.t = Math.min(1, rig.t + dt / 1.15);
      const k = smoothstep(rig.t);
      camera.position.lerpVectors(rig.fromPos, widePos, k);
      currentLook.lerpVectors(rig.fromLook, wideLook, k);
      if (rig.t >= 1) rig = null;
    }
    camera.lookAt(currentLook);
    camera.updateMatrixWorld();
    return rig !== null;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(78, 28, 18),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0xd7e8f6, 0x7d9a58, 0.78));
  const key = new THREE.DirectionalLight(0xfff8f2, 1.25);
  key.position.set(1.6, 6.4, 5.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc5d4e8, 0.55);
  fill.position.set(-4.2, 3.2, 2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe2b0, 0.38);
  rim.position.set(0.4, 3.6, -6);
  scene.add(rim);
  const glow = new THREE.PointLight(0xfff3e4, 1.4, 9, 1.6);
  glow.position.set(0, 2.4, 2.4);
  scene.add(glow);

  addCountryside(scene);

  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(4.35, 64),
    new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.86 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, 0);
  scene.add(rug);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe1b4, transparent: true, opacity: 0.34, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.03, 0);
  scene.add(pool);

  for (const ring of RINGS) {
    const mark = new THREE.Mesh(
      new THREE.TorusGeometry(ring.radius, 0.02, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0xf3ddb0, transparent: true, opacity: 0.7 }),
    );
    mark.rotation.x = Math.PI / 2;
    mark.position.y = 0.025;
    const oval = new THREE.Group();
    oval.add(mark);
    oval.scale.set(1, 1, Z_SCALE);
    scene.add(oval);
  }

  const outerRadius = RINGS[RINGS.length - 1].radius;
  const farZ = -outerRadius * Z_SCALE - 0.55;
  const archRadius = outerRadius * 0.95;
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(archRadius, 0.055, 8, 40, Math.PI),
    new THREE.MeshToonMaterial({ color: 0xf2e2cf }),
  );
  arch.position.set(0, 0, farZ);
  scene.add(arch);
  for (let i = 0; i <= 14; i += 1) {
    const angle = Math.PI * (i / 14);
    flower(
      scene,
      Math.cos(angle) * archRadius,
      Math.sin(angle) * archRadius,
      farZ + 0.05,
      i % 3 === 0 ? 1.15 : 0.85,
    );
  }
  for (let i = 0; i <= 18; i += 1) {
    const angle = Math.PI * (i / 18);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe7a8 : 0xfff6ea }),
    );
    bulb.position.set(Math.cos(angle) * (archRadius - 0.18), Math.sin(angle) * (archRadius - 0.18) + 0.05, farZ + 0.12);
    scene.add(bulb);
  }
  flower(scene, -4.6, 0.16, 3.2, 0.8);
  flower(scene, 4.6, 0.16, 3.2, 0.8);

  const petalCount = 28;
  const petals = [];
  const petalGeo = new THREE.BufferGeometry();
  const petalPositions = new Float32Array(petalCount * 3);
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));
  const petalPoints = new THREE.Points(
    petalGeo,
    new THREE.PointsMaterial({ color: 0xf6c9c6, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  scene.add(petalPoints);
  for (let i = 0; i < petalCount; i += 1) {
    petals.push({
      x: (Math.random() - 0.5) * 3.2,
      y0: Math.random() * 3.4,
      z: -1.5 + Math.random() * 2.4,
      speed: 0.12 + Math.random() * 0.2,
      drift: Math.random() * Math.PI * 2,
    });
  }

  function resize() {
    const width = canvas.clientWidth || canvas.parentElement.clientWidth;
    const height = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  function update(time) {
    for (let i = 0; i < petals.length; i += 1) {
      const petal = petals[i];
      const fallen = (petal.y0 - time * petal.speed) % 3.5;
      petalPositions[i * 3] = petal.x + Math.sin(time * 0.7 + petal.drift) * 0.18;
      petalPositions[i * 3 + 1] = fallen < 0 ? fallen + 3.5 : fallen;
      petalPositions[i * 3 + 2] = petal.z;
    }
    petalGeo.attributes.position.needsUpdate = true;
  }

  function render() {
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    scene,
    camera,
    renderer,
    resize,
    update,
    updateCamera,
    focusOn,
    releaseFocus,
    isFocusing: () => rig !== null,
    widePos,
    render,
  };
}

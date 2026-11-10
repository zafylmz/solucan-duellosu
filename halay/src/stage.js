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

function floorTexture() {
  return canvasTexture(512, 512, (ctx) => {
    const gradient = ctx.createRadialGradient(256, 256, 40, 256, 256, 360);
    gradient.addColorStop(0, '#e7b184');
    gradient.addColorStop(0.45, '#b56548');
    gradient.addColorStop(1, '#6a2c32');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  });
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
  return canvasTexture(16, 256, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#5a2838');
    gradient.addColorStop(0.38, '#b15d68');
    gradient.addColorStop(0.7, '#f0b294');
    gradient.addColorStop(1, '#f8ddc0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);
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
  scene.background = new THREE.Color(0x3a1822);
  scene.fog = new THREE.Fog(0xe7b3a4, 20, 36);

  const widePos = new THREE.Vector3(0, 8.2, 12);
  const wideLook = new THREE.Vector3(0, 0.85, 0);
  const camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.1, 80);
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
    new THREE.SphereGeometry(36, 28, 18),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x8a4e48, 0.95));
  const key = new THREE.DirectionalLight(0xfff6ea, 2.15);
  key.position.set(1.6, 6.4, 5.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffb7a4, 0.72);
  fill.position.set(-4.2, 3.2, 2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffc56a, 1.05);
  rim.position.set(0.4, 3.6, -6);
  scene.add(rim);
  const glow = new THREE.PointLight(0xffe1c2, 5, 8, 1.5);
  glow.position.set(0, 2.5, 2.2);
  scene.add(glow);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshStandardMaterial({ map: floorTexture(), color: 0xffffff, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

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
  flower(scene, -3.7, 0.18, 0.4, 1.15);
  flower(scene, 3.7, 0.18, 0.4, 1.15);

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

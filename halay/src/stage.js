import * as THREE from 'three';
import { RINGS, Z_SCALE } from './path.js';

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function skyTexture() {
  return canvasTexture(16, 256, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#12182e');
    gradient.addColorStop(0.55, '#24324a');
    gradient.addColorStop(1, '#1c3324');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);
  });
}

function fieldTexture() {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#1a3d22';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i += 1) {
      const x = (i * 97) % 512;
      const y = (i * 53) % 512;
      ctx.fillStyle = i % 3 === 0 ? '#245c30' : '#102616';
      ctx.fillRect(x, y, 4 + (i % 5), 2);
    }
  });
}

function lambert(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function addPine(scene, x, z, scale) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.45 * scale, 6), lambert(0x6b4428));
  trunk.position.set(x, 0.22 * scale, z);
  const dark = lambert(0x123c22);
  const mid = lambert(0x1a5530);
  const cones = [
    [0.55, 0.7, 0.72],
    [0.42, 0.62, 1.15],
    [0.28, 0.5, 1.52],
  ];
  scene.add(trunk);
  for (const [radius, height, y] of cones) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * scale, height * scale, 7), y > 1 ? mid : dark);
    cone.position.set(x, y * scale, z);
    scene.add(cone);
  }
}

function addHouse(scene, x, z) {
  const group = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.15), lambert(0xcbb89a));
  wall.position.y = 0.45;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.7, 4), lambert(0x8e1c22));
  roof.position.y = 1.15;
  roof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.04), lambert(0x6b3a22));
  door.position.set(0, 0.24, 0.58);
  const window = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.04), new THREE.MeshBasicMaterial({ color: 0xffe1a8 }));
  window.position.set(0.42, 0.55, 0.58);
  group.add(wall, roof, door, window);
  const rise = new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 10), lambert(0x1e4a28));
  rise.scale.set(1.5, 0.42, 1.15);
  rise.position.set(x, 0.12, z);
  group.position.set(x, 0.48, z);
  group.scale.setScalar(1.35);
  scene.add(rise, group);
}

function addHills(scene) {
  const specs = [
    [-4.5, -8.5, 6.5, 1.7, 3.4, 0x1c4a2c],
    [4.2, -9.2, 7.2, 2.1, 3.8, 0x245836],
    [-0.4, -12.5, 10, 2.6, 5, 0x2a6240],
    [7.5, -7.4, 4.5, 1.4, 2.6, 0x163822],
    [-8, -6.8, 4.2, 1.3, 2.4, 0x14321e],
  ];
  for (const [x, z, sx, sy, sz, color] of specs) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), lambert(color));
    hill.scale.set(sx, sy, sz);
    hill.position.set(x, sy * 0.15, z);
    scene.add(hill);
  }
}

export function createStage(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12182c);
  scene.fog = new THREE.Fog(0x152033, 16, 40);

  const widePos = new THREE.Vector3(0, 6.2, 10.4);
  const wideLook = new THREE.Vector3(0, 0.55, -0.35);
  const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 120);
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
    closePos.copy(closeHead).addScaledVector(closeForward, 2.7);
    closePos.y = closeHead.y + 1.05;
    closeLook.copy(closeHead);
    closeLook.y = closeHead.y - 0.12;
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
    new THREE.SphereGeometry(60, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0x243044, 0x0c1810, 0.42));
  const moon = new THREE.DirectionalLight(0x9eb4d4, 0.28);
  moon.position.set(-4, 8, 2);
  scene.add(moon);

  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshLambertMaterial({ map: fieldTexture() }),
  );
  field.rotation.x = -Math.PI / 2;
  field.position.y = -0.02;
  scene.add(field);

  const dance = new THREE.Mesh(
    new THREE.CircleGeometry(3.15, 48),
    new THREE.MeshLambertMaterial({ color: 0x214c2c }),
  );
  dance.rotation.x = -Math.PI / 2;
  dance.position.y = 0.01;
  scene.add(dance);

  addHills(scene);
  addHouse(scene, 2.15, -7.4);
  const pines = [
    [-3.3, 1.6, 1.05],
    [3.5, 1.15, 0.9],
    [-4.4, -1.1, 1.35],
    [4.6, -1.6, 1.2],
    [-3.1, -4.6, 1.25],
    [4.2, -4.2, 1.15],
    [-1.5, -6.2, 1.45],
    [0.6, -8.8, 1.15],
    [-5.2, -5.4, 1.05],
    [5.6, -6.2, 1.3],
  ];
  for (const [x, z, scale] of pines) addPine(scene, x, z, scale);

  for (const ring of RINGS) {
    const mark = new THREE.Mesh(
      new THREE.TorusGeometry(ring.radius, 0.018, 5, 48),
      new THREE.MeshBasicMaterial({ color: 0xf3ddb0, transparent: true, opacity: 0.45 }),
    );
    mark.rotation.x = Math.PI / 2;
    mark.position.y = 0.03;
    const oval = new THREE.Group();
    oval.add(mark);
    oval.scale.set(1, 1, Z_SCALE);
    scene.add(oval);
  }

  const festoon = new THREE.Group();
  const wire = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.012, 6, 64),
    new THREE.MeshBasicMaterial({ color: 0x2a241c }),
  );
  wire.rotation.x = Math.PI / 2;
  festoon.add(wire);
  festoon.scale.set(1, 1, Z_SCALE);
  festoon.position.y = 2.25;
  scene.add(festoon);

  const lampColors = [0xffe08a, 0xff4f86, 0x4fd0ff, 0xff9a3c, 0xc58bff, 0x7dffb0, 0xfff1c4, 0xff6a4a];
  const lamps = [];
  for (let i = 0; i < 16; i += 1) {
    const color = lampColors[i % lampColors.length];
    const angle = (i / 16) * Math.PI * 2;
    const sag = 0.08 * Math.sin(angle * 2);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshBasicMaterial({ color }),
    );
    bulb.position.set(Math.cos(angle) * 1.72, sag, Math.sin(angle) * 1.72);
    festoon.add(bulb);
    const glow = new THREE.PointLight(color, 14, 7.5, 2);
    glow.position.copy(bulb.position);
    festoon.add(glow);
    lamps.push({ bulb, glow, base: 8 + (i % 3) * 2 });
  }

  const hoppa = document.createElement('div');
  hoppa.id = 'hoppa';
  hoppa.textContent = 'HOPPA!';
  canvas.parentElement?.appendChild(hoppa);

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
    for (let i = 0; i < lamps.length; i += 1) {
      const pulse = 0.72 + Math.sin(time * 2.4 + i * 0.7) * 0.28;
      lamps[i].glow.intensity = lamps[i].base * pulse;
      lamps[i].bulb.scale.setScalar(0.85 + pulse * 0.2);
    }
    const hop = Math.max(0, Math.sin((time * Math.PI * 2) / 1.15));
    const flash = hop > 0.72 ? (hop - 0.72) / 0.28 : 0;
    hoppa.style.opacity = String(flash);
    hoppa.style.transform = `translate(-50%, -50%) scale(${0.82 + flash * 0.28}) rotate(${(0.5 - flash) * 8}deg)`;
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

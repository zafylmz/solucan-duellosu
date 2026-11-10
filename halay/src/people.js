import * as THREE from 'three';

const UNIT_X = new THREE.Vector3(1, 0, 0);
const _local = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _hold = new THREE.Vector3();

const FONT = '700 68px "Liberation Serif", "Noto Sans", serif';

const DRESS_COLORS = [0xf6d5dc, 0xe7b4be, 0xf3e2c4, 0xd7a86a, 0xc46a6a, 0x8d4d66, 0x6f8f7a, 0xd4896a];
const SUIT_COLORS = [0x241c24, 0x1b2433, 0x3c2428, 0x1d2e2a, 0x3a2c22, 0x2c243c];
const SKIN_TONES = [0xf3c7a4, 0xe0ac86, 0xc68642, 0x8d5524];
const HAIR_TONES = [0x2a1a16, 0x4a2c22, 0x1a1a1a, 0x6b4226, 0x22262e];

let clothRamp;
let skinRamp;
let outlineMaterial;

function ramp(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = stops.length;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  stops.forEach((stop, index) => {
    ctx.fillStyle = stop;
    ctx.fillRect(index, 0, 1, 1);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function ramps() {
  if (!clothRamp) {
    clothRamp = ramp(['#6d584e', '#d9c2b2', '#fff8f3', '#fffdfb']);
    skinRamp = ramp(['#7a4e40', '#e2a888', '#ffd2b8', '#ffe8da']);
    outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x3a221c, side: THREE.BackSide });
  }
  return { clothRamp, skinRamp };
}

function toon(color, kind) {
  const maps = ramps();
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: kind === 'skin' ? maps.skinRamp : maps.clothRamp,
  });
}

function hashName(name) {
  let hash = 2166136261;
  for (const char of name) {
    hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  }
  return hash >>> 0;
}

function addSolid(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  const shell = new THREE.Mesh(geometry, outlineMaterial);
  shell.position.set(x, y, z);
  shell.scale.setScalar(1.045);
  parent.add(shell);
  return mesh;
}

function makeLabel(text) {
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = FONT;
  const chars = [...text];
  const shown = chars.length > 16 ? `${chars.slice(0, 15).join('')}…` : text;
  const textWidth = Math.ceil(measure.measureText(shown).width);
  const width = Math.max(160, Math.min(560, textWidth + 56));
  const height = 112;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.font = FONT;
  roundRect(ctx, 3, 3, width - 6, height - 6, 40);
  ctx.fillStyle = 'rgba(48, 18, 26, 0.82)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(232, 196, 138, 0.95)';
  ctx.stroke();
  ctx.fillStyle = '#fff8f1';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shown, width / 2, height / 2 + 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  sprite.center.set(0.5, 0.5);
  sprite.userData.aspect = height / width;
  sprite.renderOrder = 10;
  sprite.scale.set(0.6, 0.6 * (height / width), 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeArm(parent, side, sleeve, skin) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.24, 1.16, 0);
  const geometry = new THREE.CylinderGeometry(0.055, 0.048, 1, 8);
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate(0.5, 0, 0);
  const limb = new THREE.Mesh(geometry, sleeve);
  limb.scale.set(0.42, 1, 1);
  pivot.add(limb);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
  hand.position.set(0.42, 0, 0);
  pivot.add(hand);
  parent.add(pivot);
  pivot.userData.limb = limb;
  pivot.userData.hand = hand;
  pivot.userData.side = side;
  return pivot;
}

function face(head, parent, skin) {
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xfffaf6 });
  const pupil = new THREE.MeshBasicMaterial({ color: 0x2a1c18 });
  for (const x of [-0.075, 0.075]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), eyeWhite);
    white.position.set(x, 1.4, 0.18);
    white.scale.z = 0.6;
    parent.add(white);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), pupil);
    dot.position.set(x, 1.395, 0.2);
    parent.add(dot);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.01, 6, 10, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x8a4038 }),
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 1.32, 0.195);
  parent.add(smile);
  head.userData.faced = true;
}

/**
 * Stylized wedding guest, gelin, or damat. Faces +Z.
 * role: 'gelin' | 'damat' | 'guest'
 */
export function createPerson({ id, name, role }) {
  ramps();
  const guestHash = hashName(name);
  const dress = role === 'gelin' || (role === 'guest' && guestHash % 5 < 3);
  const cloth = role === 'gelin'
    ? 0xfffaf7
    : role === 'damat'
      ? 0x1a1720
      : (dress ? DRESS_COLORS : SUIT_COLORS)[guestHash % (dress ? DRESS_COLORS.length : SUIT_COLORS.length)];
  const skinColor = role === 'gelin'
    ? 0xf0c2a0
    : role === 'damat'
      ? 0xd29a72
      : SKIN_TONES[(guestHash >> 3) % SKIN_TONES.length];
  const hairColor = role === 'guest'
    ? HAIR_TONES[(guestHash >> 6) % HAIR_TONES.length]
    : 0x2a1a16;

  const clothMat = toon(cloth, 'cloth');
  const skinMat = toon(skinColor, 'skin');
  const hairMat = toon(hairColor, 'cloth');
  const whiteMat = toon(0xfffaf6, 'cloth');
  const goldMat = toon(0xe0b15a, 'cloth');
  const shoeMat = toon(0x241816, 'cloth');

  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(dress ? 0.34 : 0.28, 16),
    new THREE.MeshBasicMaterial({ color: 0x2a1216, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  bob.add(shadow);

  if (dress) {
    addSolid(bob, new THREE.ConeGeometry(0.3, 0.82, 10), clothMat, 0, 0.46, 0);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.028, 6, 14), clothMat);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = 0.08;
    bob.add(hem);
    addSolid(bob, new THREE.CylinderGeometry(0.13, 0.16, 0.32, 10), clothMat, 0, 1.02, 0);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.02, 6, 14), goldMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.88;
    bob.add(belt);
  } else {
    addSolid(bob, new THREE.CylinderGeometry(0.075, 0.08, 0.58, 8), clothMat, -0.1, 0.34, 0);
    addSolid(bob, new THREE.CylinderGeometry(0.075, 0.08, 0.58, 8), clothMat, 0.1, 0.34, 0);
    addSolid(bob, new THREE.BoxGeometry(0.16, 0.08, 0.22), shoeMat, -0.1, 0.05, 0.04);
    addSolid(bob, new THREE.BoxGeometry(0.16, 0.08, 0.22), shoeMat, 0.1, 0.05, 0.04);
    addSolid(bob, new THREE.BoxGeometry(0.5, 0.22, 0.26), clothMat, 0, 1.16, 0);
    addSolid(bob, new THREE.BoxGeometry(0.36, 0.3, 0.24), clothMat, 0, 0.92, 0);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.03), whiteMat);
    shirt.position.set(0, 1.2, 0.14);
    bob.add(shirt);
    const tie = new THREE.Mesh(
      new THREE.ConeGeometry(0.032, 0.14, 4),
      toon(role === 'damat' ? 0x7a2434 : 0x6e2430, 'cloth'),
    );
    tie.position.set(0, 1.08, 0.15);
    bob.add(tie);
  }

  const head = addSolid(bob, new THREE.SphereGeometry(0.2, 16, 14), skinMat, 0, 1.4, 0);
  face(head, bob, skinMat);

  if (dress) {
    addSolid(bob, new THREE.SphereGeometry(0.21, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, 0, 1.5, -0.02);
    if (role === 'gelin') {
      addSolid(bob, new THREE.SphereGeometry(0.09, 10, 8), hairMat, 0, 1.62, -0.04);
      const veilMat = new THREE.MeshStandardMaterial({
        color: 0xfffaf8,
        transparent: true,
        opacity: 0.42,
        roughness: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const veil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.46, 1.05, 12, 1, true), veilMat);
      veil.position.set(0, 1.05, -0.16);
      veil.scale.z = 0.55;
      bob.add(veil);
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 6, 16), goldMat);
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 1.56;
      bob.add(crown);
    }
  } else {
    addSolid(bob, new THREE.SphereGeometry(0.205, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat, 0, 1.5, -0.01);
  }

  const sleeve = dress ? skinMat : clothMat;
  const armL = makeArm(bob, 1, sleeve, skinMat);
  const armR = makeArm(bob, -1, sleeve, skinMat);

  if (role === 'gelin') {
    const bouquet = new THREE.Group();
    [0xf6d0d8, 0xfff6ea, 0xe7b3c2].forEach((color, index) => {
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), toon(color, 'cloth'));
      bloom.position.set((index - 1) * 0.045, 0.05, 0.02 * index);
      bouquet.add(bloom);
    });
    const wrap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 7), goldMat);
    wrap.position.y = -0.02;
    bouquet.add(wrap);
    armL.userData.hand.add(bouquet);
  }

  const shoulderL = new THREE.Object3D();
  shoulderL.position.set(0.22, 1.18, 0);
  const shoulderR = new THREE.Object3D();
  shoulderR.position.set(-0.22, 1.18, 0);
  bob.add(shoulderL, shoulderR);

  const headAnchor = new THREE.Object3D();
  headAnchor.position.set(0, 1.68, 0);
  bob.add(headAnchor);

  const label = makeLabel(name);
  const labelAspect = label.userData.aspect;
  let labelHeight = role === 'guest' ? 0.42 : 0.36;
  let labelWidth = labelHeight / labelAspect;
  if (labelWidth > 1.15) {
    labelWidth = 1.15;
    labelHeight = labelWidth * labelAspect;
  }
  label.scale.set(labelWidth, labelHeight, 1);
  label.position.set(0, role === 'gelin' ? 2.42 : 2.08, 0);
  bob.add(label);

  const baseScale = role === 'guest' ? 1 : 1.06;
  root.scale.setScalar(role === 'guest' ? 0.01 : baseScale);

  return {
    id,
    name,
    role,
    root,
    bob,
    armL,
    armR,
    shoulderL,
    shoulderR,
    headAnchor,
    label,
    baseScale,
    appear: role === 'guest' ? 0 : 1,
  };
}

function restArm(arm, phase) {
  const side = arm.userData.side;
  const swing = Math.sin(phase) * 0.16;
  _dir.set(side * 0.42, -0.82, 0.22 + swing).normalize();
  arm.quaternion.setFromUnitVectors(UNIT_X, _dir);
  arm.userData.limb.scale.set(0.4, 1, 1);
  arm.userData.hand.position.set(0.4, 0, 0);
}

function aimArm(arm, worldPoint) {
  _local.copy(worldPoint);
  arm.parent.worldToLocal(_local);
  _dir.copy(_local).sub(arm.position);
  const distance = _dir.length();
  if (distance < 1e-4) return;
  _dir.multiplyScalar(1 / distance);
  arm.quaternion.setFromUnitVectors(UNIT_X, _dir);
  const reach = Math.min(distance * 0.94, 0.8);
  arm.userData.limb.scale.set(reach, 1, 1);
  arm.userData.hand.position.set(reach, 0, 0);
}

/** One arm rests on the next dancer's nearer shoulder. The other arm keeps the step. */
export function poseArms(person, next, phase) {
  restArm(person.armL, phase);
  restArm(person.armR, phase + 0.6);
  if (!next || person.appear < 0.35) return;

  next.shoulderL.getWorldPosition(_a);
  next.shoulderR.getWorldPosition(_b);
  person.root.getWorldPosition(_hold);
  const target = _hold.distanceTo(_a) <= _hold.distanceTo(_b) ? _a : _b;
  _hold.copy(target);
  person.armL.getWorldPosition(_a);
  person.armR.getWorldPosition(_b);
  const arm = _a.distanceTo(_hold) <= _b.distanceTo(_hold) ? person.armL : person.armR;
  aimArm(arm, _hold);
}

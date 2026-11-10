import * as THREE from 'three';

const UNIT_X = new THREE.Vector3(1, 0, 0);
const _local = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _hold = new THREE.Vector3();

const FONT = '700 64px "Liberation Serif", "Noto Sans", serif';

const VESTS = [0xe23d3d, 0xf0b429, 0x2f6bff, 0x1f9d4a, 0xf27a1a, 0x7a3ee0, 0x12233f];
const SALVAR = [0x1c1c1c, 0x10243f, 0x6d2433, 0x143528];
const HAIR = [0x2a1a14, 0x4a2c1c, 0x111111, 0x6a3a22, 0xc9843a];

function hashName(name) {
  let hash = 2166136261;
  for (const char of name) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  return hash >>> 0;
}

function flat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function addMesh(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function makeLabel(text) {
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = FONT;
  const chars = [...text];
  const shown = chars.length > 16 ? `${chars.slice(0, 15).join('')}…` : text;
  const textWidth = Math.ceil(measure.measureText(shown).width);
  const width = Math.max(160, Math.min(520, textWidth + 48));
  const height = 96;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.font = FONT;
  roundRect(ctx, 4, 4, width - 8, height - 8, 36);
  ctx.fillStyle = 'rgba(28, 42, 18, 0.88)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffe08a';
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shown, width / 2, height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false }),
  );
  sprite.center.set(0.5, 0);
  sprite.userData.aspect = height / width;
  sprite.renderOrder = 10;
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
  pivot.position.set(side * 0.16, 0.72, 0);
  const geometry = new THREE.CylinderGeometry(0.04, 0.035, 1, 6);
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate(0.5, 0, 0);
  const limb = new THREE.Mesh(geometry, sleeve);
  limb.scale.set(0.34, 1, 1);
  pivot.add(limb);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skin);
  hand.position.set(0.34, 0, 0);
  pivot.add(hand);
  parent.add(pivot);
  pivot.userData.limb = limb;
  pivot.userData.hand = hand;
  pivot.userData.side = side;
  return pivot;
}

function addFace(parent, y, skin) {
  const head = addMesh(parent, new THREE.SphereGeometry(0.16, 12, 10), skin, 0, y, 0);
  const eye = new THREE.MeshBasicMaterial({ color: 0x1b140f });
  const white = new THREE.MeshBasicMaterial({ color: 0xfffaf6 });
  for (const x of [-0.055, 0.055]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), white);
    ball.scale.z = 0.65;
    ball.position.set(x, y + 0.02, 0.13);
    parent.add(ball);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), eye);
    dot.position.set(x, y + 0.018, 0.15);
    parent.add(dot);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.008, 5, 8, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x8a3a32 }),
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, y - 0.045, 0.145);
  parent.add(smile);
  return head;
}

/**
 * Flat-shaded folk dancer, read from above.
 * role: 'gelin' | 'damat' | 'guest'
 */
export function createPerson({ id, name, role }) {
  const guestHash = hashName(name || role);
  const skin = flat(role === 'gelin' ? 0xf3c7a8 : role === 'damat' ? 0xd7a57c : [0xf3c7a4, 0xe0ac86, 0xc68642, 0x8d5524][(guestHash >> 3) % 4]);
  const vestColor = role === 'gelin' ? 0xfffaf6 : role === 'damat' ? 0x1a1c22 : VESTS[guestHash % VESTS.length];
  const legColor = role === 'gelin' ? 0xfffaf6 : role === 'damat' ? 0x14161c : SALVAR[guestHash % SALVAR.length];
  const hairColor = HAIR[(guestHash >> 6) % HAIR.length];
  const vest = flat(vestColor);
  const legs = flat(legColor);
  const hair = new THREE.MeshBasicMaterial({ color: role === 'guest' ? hairColor : 0x2a1a14 });
  const white = flat(0xfffaf4);
  const gold = flat(0xe6b84a);

  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 14),
    new THREE.MeshBasicMaterial({ color: 0x1d3a16, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  bob.add(shadow);

  if (role === 'gelin') {
    addMesh(bob, new THREE.ConeGeometry(0.26, 0.62, 8), vest, 0, 0.36, 0);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 5, 12), gold);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = 0.08;
    bob.add(hem);
  } else {
    addMesh(bob, new THREE.CylinderGeometry(0.07, 0.08, 0.36, 6), legs, -0.08, 0.2, 0);
    addMesh(bob, new THREE.CylinderGeometry(0.07, 0.08, 0.36, 6), legs, 0.08, 0.2, 0);
    addMesh(bob, new THREE.BoxGeometry(0.34, 0.28, 0.18), vest, 0, 0.58, 0);
    if (role === 'damat') {
      addMesh(bob, new THREE.BoxGeometry(0.08, 0.16, 0.02), white, 0, 0.62, 0.09);
      const tie = addMesh(bob, new THREE.ConeGeometry(0.025, 0.12, 4), flat(0x111111), 0, 0.56, 0.1);
      tie.rotation.x = 0.15;
    } else {
      const sash = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 5, 10), flat(0xf2d36b));
      sash.rotation.x = Math.PI / 2;
      sash.position.y = 0.46;
      bob.add(sash);
    }
  }

  const headY = role === 'gelin' ? 0.86 : 0.9;
  addFace(bob, headY, skin);
  addMesh(
    bob,
    new THREE.SphereGeometry(0.165, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hair,
    0,
    headY + 0.06,
    -0.02,
  );

  if (role === 'gelin') {
    const veil = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffaf8, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
    );
    veil.rotation.x = -Math.PI / 2.4;
    veil.position.set(0, 0.7, -0.16);
    bob.add(veil);
  } else if (role === 'guest' && guestHash % 3 !== 0) {
    const scarf = addMesh(bob, new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: 0xc4162a }), 0, headY + 0.1, 0);
    scarf.scale.set(1.2, 0.45, 1.15);
  } else if (role === 'guest') {
    addMesh(bob, new THREE.CylinderGeometry(0.09, 0.11, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0xc4162a }), 0, headY + 0.14, 0);
  }

  const sleeve = role === 'damat' ? vest : role === 'gelin' ? skin : vest;
  const armL = makeArm(bob, 1, sleeve, skin);
  const armR = makeArm(bob, -1, sleeve, skin);

  const shoulderL = new THREE.Object3D();
  shoulderL.position.set(0.18, 0.74, 0);
  const shoulderR = new THREE.Object3D();
  shoulderR.position.set(-0.18, 0.74, 0);
  bob.add(shoulderL, shoulderR);

  const headAnchor = new THREE.Object3D();
  headAnchor.position.set(0, headY + 0.2, 0.06);
  bob.add(headAnchor);

  const label = makeLabel(name);
  const labelAspect = label.userData.aspect;
  let labelHeight = role === 'guest' ? 0.34 : 0.3;
  let labelWidth = labelHeight / labelAspect;
  if (labelWidth > 0.95) {
    labelWidth = 0.95;
    labelHeight = labelWidth * labelAspect;
  }
  label.scale.set(labelWidth, labelHeight, 1);
  label.position.set(0, headY + 0.42, -0.15);
  bob.add(label);

  const baseScale = role === 'guest' ? 1 : 1.08;
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

/** Keep the username toward the top of the top-down frame, above the head. */
export function placeLabel(person) {
  const yaw = person.root.rotation.y;
  const reach = person.role === 'guest' ? 0.52 : 0.7;
  const side = person.role === 'gelin' ? 0.32 : person.role === 'damat' ? -0.32 : 0;
  person.label.position.x = side * Math.cos(yaw) + reach * Math.sin(yaw);
  person.label.position.z = side * Math.sin(yaw) - reach * Math.cos(yaw);
}

function restArm(arm, phase) {
  const side = arm.userData.side;
  const swing = Math.sin(phase) * 0.18;
  _dir.set(side * 0.55, -0.55, 0.12 + swing).normalize();
  arm.quaternion.setFromUnitVectors(UNIT_X, _dir);
  arm.userData.limb.scale.set(0.36, 1, 1);
  arm.userData.hand.position.set(0.36, 0, 0);
}

function aimArm(arm, worldPoint) {
  _local.copy(worldPoint);
  arm.parent.worldToLocal(_local);
  _dir.copy(_local).sub(arm.position);
  const distance = _dir.length();
  if (distance < 1e-4) return;
  _dir.multiplyScalar(1 / distance);
  arm.quaternion.setFromUnitVectors(UNIT_X, _dir);
  const reach = Math.min(distance * 0.92, 0.62);
  arm.userData.limb.scale.set(reach, 1, 1);
  arm.userData.hand.position.set(reach, 0, 0);
}

export function poseArms(person, next, phase) {
  restArm(person.armL, phase);
  restArm(person.armR, phase + 0.6);
  if (!next || person.appear < 0.35) return;
  next.shoulderL.getWorldPosition(_a);
  next.shoulderR.getWorldPosition(_b);
  person.root.getWorldPosition(_hold);
  const target = _hold.distanceTo(_a) <= _hold.distanceTo(_b) ? _a : _b;
  person.armL.getWorldPosition(_a);
  person.armR.getWorldPosition(_b);
  const arm = _a.distanceTo(target) <= _b.distanceTo(target) ? person.armL : person.armR;
  aimArm(arm, target);
}

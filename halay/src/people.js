import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const _local = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _hold = new THREE.Vector3();

const FONT = '700 68px "Liberation Serif", "Noto Sans", serif';

const FILES = {
  gelin: '/models/gelin.glb',
  damat: '/models/damat.glb',
  kadin: '/models/kadin.glb',
  erkek: '/models/erkek.glb',
};

const RED = 0xc4162a;
const RED_DEEP = 0x9d1220;

let castPromise;

export function loadCast() {
  if (!castPromise) {
    const loader = new GLTFLoader();
    castPromise = Promise.all(
      Object.entries(FILES).map(async ([key, url]) => [key, await loader.loadAsync(url)]),
    ).then((entries) => Object.fromEntries(entries));
  }
  return castPromise;
}

function hashName(name) {
  let hash = 2166136261;
  for (const char of name) {
    hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  }
  return hash >>> 0;
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

function detachMaterials(root) {
  const map = new Map();
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    const cloned = list.map((mat) => {
      if (!map.has(mat.uuid)) {
        const copy = mat.clone();
        copy.metalness = 0;
        copy.roughness = mat.name === 'Eye' ? 0.2 : 0.64;
        map.set(mat.uuid, copy);
      }
      return map.get(mat.uuid);
    });
    obj.material = Array.isArray(obj.material) ? cloned : cloned[0];
  });
}

function paint(root, nodeName, colors) {
  const node = root.getObjectByName(nodeName);
  if (!node) return;
  node.traverse((obj) => {
    if (!obj.isMesh) return;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of list) {
      if (colors[mat.name] === undefined) continue;
      mat.color.set(colors[mat.name]);
      mat.metalness = 0;
      mat.roughness = 0.68;
    }
  });
}

function varySkin(root, tone) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of list) {
      if (mat.name === 'Skin' || mat.name === 'Skin_Darker') mat.color.multiplyScalar(tone);
    }
  });
}

function prepareArm(arm, side) {
  const lower = arm?.children.find((child) => child.name.startsWith('LowerArm'));
  if (!arm) return arm;
  arm.userData.side = side;
  arm.userData.restDir = (lower ? lower.position.clone() : new THREE.Vector3(side, 0, 0)).normalize();
  arm.userData.bindQuat = arm.quaternion.clone();
  return arm;
}

function toHead(head, x, y, z) {
  return head.worldToLocal(new THREE.Vector3(x, y, z));
}

/** Eyes, mouth, and a headscarf that leaves the face open. Coordinates match the GLB head. */
function addFace(model, head, role) {
  model.updateWorldMatrix(true, true);
  const white = new THREE.MeshStandardMaterial({ color: 0xfffaf8, roughness: 0.25, metalness: 0 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x1b120f, roughness: 0.3, metalness: 0 });
  const lip = new THREE.MeshStandardMaterial({ color: 0x8a4038, roughness: 0.5, metalness: 0 });
  for (const x of [-0.034, 0.034]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), white);
    eye.scale.set(1.05, 0.78, 0.5);
    eye.position.copy(toHead(head, x, 1.696, 0.168));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), pupil);
    dot.position.copy(toHead(head, x, 1.694, 0.18));
    head.add(eye, dot);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI), lip);
  smile.rotation.z = Math.PI;
  smile.position.copy(toHead(head, 0, 1.632, 0.168));
  head.add(smile);

  if (role === 'guest') {
    const cloth = new THREE.MeshStandardMaterial({
      color: RED,
      roughness: 0.66,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      cloth,
    );
    cap.scale.set(1.28, 0.62, 1.15);
    cap.position.copy(toHead(head, 0, 1.78, -0.01));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.012, 6, 16, Math.PI * 1.25), cloth);
    band.rotation.x = Math.PI / 2.15;
    band.rotation.z = Math.PI * 0.85;
    band.position.copy(toHead(head, 0, 1.755, 0.04));
    const left = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.32), cloth);
    left.position.copy(toHead(head, -0.1, 1.6, 0.0));
    left.rotation.y = 1.15;
    const right = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.32), cloth);
    right.position.copy(toHead(head, 0.1, 1.6, 0.0));
    right.rotation.y = -1.15;
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.42), cloth);
    tail.position.copy(toHead(head, 0, 1.5, -0.13));
    head.add(cap, band, left, right, tail);
  }

  if (role === 'gelin') {
    const cloth = new THREE.MeshStandardMaterial({
      color: 0xfffaf8,
      transparent: true,
      opacity: 0.42,
      roughness: 0.35,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const veil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.58, 14, 1, true), cloth);
    veil.position.copy(toHead(head, 0, 1.55, -0.06));
    head.add(veil);
  }
}

function dress(model, role) {
  if (role === 'gelin') {
    paint(model, 'Formal_Body', { LimeGreen: 0xfffbf8, Gold: 0xe6c56a });
    paint(model, 'Formal_Legs', { LimeGreen: 0xfffbf8 });
    paint(model, 'Formal_Feet', { Red: 0xfffbf8 });
    return;
  }
  if (role === 'damat') {
    paint(model, 'Suit_Body', { Suit: 0x16181d, Tie: 0x101114, White: 0xf7f4ee });
    paint(model, 'Suit_Legs', { Suit: 0x16181d });
    paint(model, 'Suit_Feet', { Black: 0x121214 });
    const pistol = model.getObjectByName('Pistol');
    if (pistol) pistol.visible = false;
    return;
  }
  paint(model, 'Casual_Body', { White: RED });
  paint(model, 'Casual_Legs', { Orange: RED_DEEP });
  paint(model, 'Casual_Feet', { Grey: 0x3a1218 });
  paint(model, 'Casual2_Body', { LightBrown: RED });
  paint(model, 'Casual2_Legs', { LightBlue: RED_DEEP });
  paint(model, 'Casual2_Feet', { Red_Dark: 0x3a1218, White: 0x2c1014 });
}

/**
 * Rigged Quaternius human. role: 'gelin' | 'damat' | 'guest'
 * Faces +Z. Guests wear red halay clothes and a red headscarf.
 */
export function createPerson({ id, name, role, cast }) {
  const guestHash = hashName(name);
  const sourceKey = role === 'guest' ? (guestHash % 2 === 0 ? 'kadin' : 'erkek') : role;
  const gltf = cast[sourceKey];
  const model = SkeletonUtils.clone(gltf.scene);
  detachMaterials(model);
  dress(model, role);
  if (role === 'guest') varySkin(model, 0.94 + (guestHash % 5) * 0.04);

  const head = model.getObjectByName('Head');
  if (head) addFace(model, head, role);

  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);
  bob.add(model);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 16),
    new THREE.MeshBasicMaterial({ color: 0x1c2418, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  bob.add(shadow);

  const armL = prepareArm(model.getObjectByName('UpperArm.L'), 1);
  const armR = prepareArm(model.getObjectByName('UpperArm.R'), -1);
  const shoulderL = model.getObjectByName('Shoulder.L');
  const shoulderR = model.getObjectByName('Shoulder.R');

  const headAnchor = new THREE.Object3D();
  headAnchor.position.set(0, 1.62, 0.08);
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
  label.position.set(0, role === 'gelin' ? 2.28 : 2.12, 0);
  bob.add(label);

  const clip = THREE.AnimationClip.findByName(
    gltf.animations,
    role === 'guest' ? 'Walk' : 'Idle_Neutral',
  );
  const mixer = new THREE.AnimationMixer(model);
  if (clip) {
    const action = mixer.clipAction(clip);
    action.timeScale = role === 'guest' ? 0.72 : 0.4;
    action.time = (guestHash % 90) / 20;
    action.play();
  }

  const baseScale = role === 'guest' ? 0.92 : 1;
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
    mixer,
    baseScale,
    appear: role === 'guest' ? 0 : 1,
  };
}

function aimArm(arm, worldPoint) {
  if (!arm?.parent || !arm.userData.restDir) return;
  _local.copy(worldPoint);
  arm.parent.worldToLocal(_local);
  _dir.copy(_local).sub(arm.position);
  if (_dir.lengthSq() < 1e-6) return;
  _dir.normalize();
  arm.quaternion.setFromUnitVectors(arm.userData.restDir, _dir);
}

/** One arm reaches the next dancer's nearer shoulder. The walk clip keeps the other arm. */
export function poseArms(person, next) {
  if (!next || person.appear < 0.35 || !person.armL || !person.armR) return;

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

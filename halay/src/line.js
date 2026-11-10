import { cleanName, GUEST_CAP } from '../shared/join.js';
import { LEADERS, RING_SPIN, Z_SCALE, ringSlots } from './path.js';
import { createPerson, poseArms } from './people.js';
import * as THREE from 'three';

const BEAT = Math.PI * 2 / 1.15;

function lerpAngle(current, target, amount) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * amount;
}

export function createLine(scene, camera, { onArrive } = {}) {
  const leaders = LEADERS.map((spec) => createPerson(spec));
  const guests = [];
  for (const person of leaders) scene.add(person.root);

  function everyone() {
    return leaders.concat(guests);
  }

  function addGuest(guest) {
    const name = cleanName(guest?.name);
    const id = String(guest?.id ?? '');
    if (!name || !id) return false;
    if (guests.some((person) => person.id === id)) return false;
    if (guests.length >= GUEST_CAP) return false;
    const person = createPerson({ id, name, role: 'guest' });
    scene.add(person.root);
    guests.push(person);
    onArrive?.(person);
    return true;
  }

  function update(time, dt) {
    const slots = ringSlots(guests.length);
    const blend = 1 - Math.exp(-dt * 3.2);
    guests.forEach((person, index) => {
      const slot = slots[index];
      if (person.angle === undefined) {
        person.angle = slot.angle;
        person.radius = slot.radius;
      } else {
        person.angle = lerpAngle(person.angle, slot.angle, blend);
        person.radius += (slot.radius - person.radius) * blend;
      }
      person.ringId = slot.ringId;
      const theta = person.angle + time * RING_SPIN;
      const phase = time * BEAT - index * 0.35;
      const step = Math.sin(phase) * 0.07;
      const bounce = Math.max(0, Math.sin(phase)) * 0.08;
      if (person.appear < 1) person.appear = Math.min(1, person.appear + dt / 0.45);
      const hop = person.appear < 1 ? Math.sin(person.appear * Math.PI) * 0.2 : 0;
      const eased = 1 - (1 - person.appear) ** 3;
      const tangentX = -Math.sin(theta);
      const tangentZ = Math.cos(theta);
      person.root.position.set(
        Math.cos(theta) * person.radius + tangentX * step,
        bounce + hop,
        (Math.sin(theta) * person.radius + tangentZ * step) * Z_SCALE,
      );
      const inwardX = -Math.cos(theta);
      const inwardZ = -Math.sin(theta);
      const faceX = tangentX * 0.75 + inwardX * 0.25;
      const faceZ = tangentZ * 0.75 + inwardZ * 0.25;
      person.root.rotation.y = Math.atan2(faceX, faceZ);
      person.root.rotation.z = Math.sin(phase) * 0.03;
      person.root.scale.setScalar(person.baseScale * eased);
    });

    leaders.forEach((person, index) => {
      const phase = time * BEAT - index * 0.4;
      const step = Math.sin(phase) * 0.05;
      const home = LEADERS[index];
      const bounce = Math.max(0, Math.sin(phase)) * 0.07;
      person.root.position.set(home.x + step, bounce, home.z);
      const dx = camera.position.x - person.root.position.x;
      const dz = camera.position.z - person.root.position.z;
      person.root.rotation.y = Math.atan2(dx, dz);
      person.root.rotation.z = Math.sin(phase) * 0.03;
      person.ringId = -1;
    });

    const pose = (person, next, phase) => {
      if (!next) {
        poseArms(person, null, phase);
        return;
      }
      const distance = person.root.position.distanceTo(next.root.position);
      poseArms(person, distance < 1.35 ? next : null, phase);
    };

    pose(leaders[0], leaders[1], time * BEAT);
    pose(leaders[1], null, time * BEAT + 0.4);
    guests.forEach((person, index) => {
      const mates = guests.filter((guest) => guest.ringId === person.ringId);
      const mateIndex = mates.indexOf(person);
      const next = mates.length > 1 ? mates[(mateIndex + 1) % mates.length] : null;
      pose(person, next, time * BEAT - index * 0.35);
    });
  }

  function snapshot() {
    const vector = new THREE.Vector3();
    return everyone().map((person) => {
      person.headAnchor.getWorldPosition(vector);
      const head = vector.clone();
      vector.project(camera);
      return {
        id: person.id,
        name: person.name,
        role: person.role,
        ringId: person.ringId,
        x: person.root.position.x,
        z: person.root.position.z,
        radius: Math.hypot(person.root.position.x, person.root.position.z),
        headX: head.x,
        headY: head.y,
        headZ: head.z,
        ndcX: vector.x,
        ndcY: vector.y,
      };
    });
  }

  return {
    addGuest,
    update,
    snapshot,
    guestCount: () => guests.length,
  };
}

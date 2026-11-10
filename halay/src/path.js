import { GUEST_CAP } from '../shared/join.js';

export { GUEST_CAP };

/** Three concentric circles around the couple. Capacities sum to GUEST_CAP. */
export const RINGS = [
  { id: 0, capacity: 8, radius: 0.86 },
  { id: 1, capacity: 12, radius: 1.46 },
  { id: 2, capacity: 16, radius: 2.06 },
];

export const RING_SPIN = 0.32;

/** Stretches depth so the rings read as circles in the top-down portrait camera. */
export const Z_SCALE = 1.18;

export const LEADERS = [
  { id: 'gelin', name: 'Gelin', role: 'gelin', x: 0.24, z: 0.04 },
  { id: 'damat', name: 'Damat', role: 'damat', x: -0.24, z: 0.04 },
];

/**
 * Evenly spaced seats on up to three rings.
 * Ring 1 fills before ring 2, then ring 3. Each occupied ring stays a full circle.
 */
export function ringSlots(count) {
  const slots = [];
  let remaining = count;
  for (const ring of RINGS) {
    const seats = Math.min(ring.capacity, remaining);
    if (seats <= 0) break;
    for (let index = 0; index < seats; index += 1) {
      slots.push({
        ringId: ring.id,
        radius: ring.radius,
        angle: (index / seats) * Math.PI * 2 - Math.PI / 2,
      });
    }
    remaining -= seats;
  }
  return slots;
}

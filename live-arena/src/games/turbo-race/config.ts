import type { GameSettings } from '@/lib/games/types';

export const defaultSettings: GameSettings = {
  laps: 2,
  likeThreshold: 15,
  maxRacers: 8,
  gifts: [
    { giftName: 'Rose', effect: 'speed', amount: 18 },
    { giftName: 'GG', effect: 'speed', amount: 28 },
    { giftName: 'Finger Heart', effect: 'shield', amount: 4000 },
    { giftName: 'Galaxy', effect: 'turbo', amount: 2500 },
  ],
};

export const BASE_SPEED = 0.16;
export const COUNTDOWN_MS = 3000;

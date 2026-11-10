import { defaultSettings } from '@/games/turbo-race/config';
import type { GameSettings } from '@/lib/games/types';
import { createToken } from '@/lib/token';

const KEY = 'live-arena-v1';

export interface ResultRow {
  username: string;
  place: number;
  at: number;
}

export interface StudioState {
  token: string;
  displayName: string;
  settings: GameSettings;
  audioEnabled: boolean;
  audioVolume: number;
  results: ResultRow[];
}

export function emptyStudio(): StudioState {
  return {
    token: createToken(),
    displayName: 'Yayıncı',
    settings: defaultSettings,
    audioEnabled: true,
    audioVolume: 0.85,
    results: [],
  };
}

export function loadStudio(): StudioState {
  if (typeof localStorage === 'undefined') return emptyStudio();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStudio();
    const parsed = JSON.parse(raw) as StudioState;
    if (!parsed.token || !parsed.settings) return emptyStudio();
    return { ...emptyStudio(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
  } catch {
    return emptyStudio();
  }
}

export function saveStudio(state: StudioState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

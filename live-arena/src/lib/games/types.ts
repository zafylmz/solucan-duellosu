import type { LiveEvent } from '../events/schema';

export type GameStatus = 'live' | 'planned' | 'disabled';

export interface GameCatalogItem {
  id: string;
  title: string;
  summary: string;
  status: GameStatus;
}

export interface GameSettings {
  laps: number;
  likeThreshold: number;
  maxRacers: number;
  gifts: { giftName: string; effect: 'speed' | 'turbo' | 'shield'; amount: number }[];
}

export interface GameInstance {
  start(): void;
  stop(): void;
  resume(): void;
  restart(): void;
  applySettings(settings: GameSettings): void;
  handleEvent(event: LiveEvent): void;
  removePlayer(username: string): void;
  blockPlayer(username: string): void;
  mutePlayer(username: string): void;
  setInteractions(enabled: boolean): void;
  destroy(): void;
}

export interface GameModule {
  id: string;
  create(parent: HTMLElement, hooks: GameHooks): GameInstance;
}

export interface GameHooks {
  onFinish(ranking: { username: string; place: number }[]): void;
  onSpeak(line: string): void;
  onChange(snapshot: { phase: string; racers: string[] }): void;
}

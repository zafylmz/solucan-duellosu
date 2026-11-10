import { viewerId, type LiveEvent } from '@/lib/events/schema';
import type { GameSettings } from '@/lib/games/types';
import { BASE_SPEED, COUNTDOWN_MS, defaultSettings } from './config';

export interface Racer {
  id: string;
  username: string;
  nickname: string;
  progress: number;
  lane: number;
  likes: number;
  likeBursts: number;
  boostUntil: number;
  giftBoost: number;
  giftBoostUntil: number;
  turboUntil: number;
  shieldUntil: number;
  finishedAt?: number;
}

export interface RaceState {
  phase: 'idle' | 'countdown' | 'racing' | 'finished';
  countdownEndsAt: number;
  startedAt: number | null;
  elapsedMs: number;
  paused: boolean;
  interactions: boolean;
  racers: Racer[];
  blocked: string[];
  muted: string[];
  settings: GameSettings;
  leaderId: string | null;
}

export function freshRace(settings: GameSettings = defaultSettings): RaceState {
  return {
    phase: 'idle',
    countdownEndsAt: 0,
    startedAt: null,
    elapsedMs: 0,
    paused: false,
    interactions: true,
    racers: [],
    blocked: [],
    muted: [],
    settings,
    leaderId: null,
  };
}

export interface StepResult {
  state: RaceState;
  lines: string[];
}

function clone(state: RaceState): RaceState {
  return {
    ...state,
    racers: state.racers.map((racer) => ({ ...racer })),
    blocked: [...state.blocked],
    muted: [...state.muted],
    settings: { ...state.settings, gifts: state.settings.gifts.map((gift) => ({ ...gift })) },
  };
}

function findGift(settings: GameSettings, name: string) {
  const key = name.trim().toLocaleLowerCase('tr-TR');
  return settings.gifts.find((gift) => gift.giftName.trim().toLocaleLowerCase('tr-TR') === key);
}

function rankingOf(state: RaceState) {
  return [...state.racers].sort((a, b) => {
    if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt;
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    return b.progress - a.progress;
  });
}

export function ranking(state: RaceState) {
  return rankingOf(state).map((racer, index) => ({
    username: racer.username,
    nickname: racer.nickname,
    place: index + 1,
    progress: racer.progress,
  }));
}

function beginIfNeeded(state: RaceState, now: number) {
  if (state.phase === 'idle' && state.racers.length > 0) {
    state.phase = 'countdown';
    state.countdownEndsAt = now + COUNTDOWN_MS;
  }
}

export function reduce(state: RaceState, event: LiveEvent, now: number): StepResult {
  const next = clone(state);
  const lines: string[] = [];
  const speak = (text: string, about: string) => {
    if (!next.muted.includes(about)) lines.push(text);
  };
  if (!next.interactions || event.type === 'DISCONNECT') return { state: next, lines };
  const id = viewerId(event.username);
  if (!id || next.blocked.includes(id)) return { state: next, lines };
  const existing = next.racers.find((racer) => racer.id === id);

  if (event.type === 'CHAT' || event.type === 'FOLLOW' || event.type === 'JOIN' || event.type === 'SUBSCRIBE') {
    if (!existing) {
      if (next.racers.length >= next.settings.maxRacers) return { state: next, lines };
      next.racers.push({
        id,
        username: event.username.replace(/^@+/, ''),
        nickname: event.nickname,
        progress: 0,
        lane: next.racers.length % 3,
        likes: 0,
        likeBursts: 0,
        boostUntil: 0,
        giftBoost: 0,
        giftBoostUntil: 0,
        turboUntil: 0,
        shieldUntil: 0,
      });
      speak(`${event.nickname} yarışa katıldı!`, id);
      beginIfNeeded(next, now);
    }
    return { state: next, lines };
  }

  if (!existing) return { state: next, lines };

  if (event.type === 'LIKE') {
    const count = event.likeCount ?? 1;
    existing.likes += count;
    const bursts = Math.floor(existing.likes / next.settings.likeThreshold);
    const extra = bursts - existing.likeBursts;
    if (extra > 0) {
      existing.likeBursts = bursts;
      existing.boostUntil = now + 2500;
      speak(`${existing.nickname} hız bonusu aldı!`, id);
    }
  }

  if (event.type === 'GIFT' && event.giftName) {
    const rule = findGift(next.settings, event.giftName);
    const count = event.giftCount ?? 1;
    if (rule?.effect === 'speed') {
      existing.giftBoost += rule.amount * count;
      existing.giftBoostUntil = now + 3500;
      speak(`${existing.nickname} hız hediyesi aldı!`, id);
    } else if (rule?.effect === 'turbo') {
      const extra = rule.amount * count;
      existing.turboUntil = Math.max(existing.turboUntil, now) + extra;
      speak(`${existing.nickname} turbo gönderdi!`, id);
    } else if (rule?.effect === 'shield') {
      existing.shieldUntil = Math.max(existing.shieldUntil, now) + rule.amount * count;
      speak(`${existing.nickname} kalkan aldı!`, id);
    }
  }

  return { state: next, lines };
}

export function tick(state: RaceState, dt: number, now: number): StepResult {
  const next = clone(state);
  const lines: string[] = [];
  if (next.paused) return { state: next, lines };
  if (next.phase === 'countdown' && now >= next.countdownEndsAt) {
    next.phase = 'racing';
    next.startedAt = now;
    lines.push('Yarış başladı!');
  }
  if (next.phase !== 'racing') return { state: next, lines };
  next.elapsedMs += dt * 1000;
  const previousLeader = next.leaderId;
  for (const racer of next.racers) {
    if (racer.finishedAt) continue;
    let speed = BASE_SPEED;
    if (now < racer.turboUntil) speed *= 1.85;
    if (now < racer.boostUntil) speed += 0.12;
    if (now < racer.giftBoostUntil) speed += racer.giftBoost / 220;
    racer.progress += speed * dt;
    if (racer.progress >= next.settings.laps && !racer.finishedAt) {
      racer.progress = next.settings.laps;
      racer.finishedAt = now;
    }
  }
  const order = rankingOf(next);
  next.leaderId = order[0]?.id ?? null;
  if (next.leaderId && previousLeader && next.leaderId !== previousLeader) {
    const leader = next.racers.find((racer) => racer.id === next.leaderId);
    if (leader && !next.muted.includes(leader.id)) lines.push(`${leader.nickname} liderliği ele geçirdi!`);
  }
  if (next.racers.length > 0 && next.racers.every((racer) => racer.finishedAt)) {
    next.phase = 'finished';
    const winner = rankingOf(next)[0];
    if (winner) lines.push(`Yarışın kazananı ${winner.nickname}!`);
  }
  return { state: next, lines };
}

export function restartRace(state: RaceState): RaceState {
  return {
    ...freshRace(state.settings),
    blocked: [...state.blocked],
    muted: [...state.muted],
    interactions: state.interactions,
  };
}

export function blockRacer(state: RaceState, username: string): RaceState {
  const next = clone(state);
  const id = viewerId(username);
  if (!next.blocked.includes(id)) next.blocked.push(id);
  next.racers = next.racers.filter((racer) => racer.id !== id);
  return next;
}

export function removeRacer(state: RaceState, username: string): RaceState {
  const next = clone(state);
  const id = viewerId(username);
  next.racers = next.racers.filter((racer) => racer.id !== id);
  return next;
}

export function muteRacer(state: RaceState, username: string): RaceState {
  const next = clone(state);
  const id = viewerId(username);
  if (!next.muted.includes(id)) next.muted.push(id);
  return next;
}

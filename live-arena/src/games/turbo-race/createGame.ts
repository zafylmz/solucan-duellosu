import Phaser from 'phaser';
import type { LiveEvent } from '@/lib/events/schema';
import type { GameHooks, GameInstance, GameSettings } from '@/lib/games/types';
import { defaultSettings } from './config';
import {
  blockRacer,
  freshRace,
  muteRacer,
  ranking,
  reduce,
  removeRacer,
  restartRace,
  tick,
  type Racer,
} from './rules';

const COLORS = [0x2f7bff, 0xff4d6d, 0x3dff9a, 0xffb703, 0xb388ff, 0xff7a45, 0x4cc9f0, 0xf72585];

export function createTurboRace(parent: HTMLElement, hooks: GameHooks): GameInstance {
  let state = freshRace(defaultSettings);
  let last = performance.now();
  const labels = new Map<string, Phaser.GameObjects.Text>();
  let road: Phaser.GameObjects.Graphics;
  let actors: Phaser.GameObjects.Graphics;
  let banner: Phaser.GameObjects.Text;
  let sceneReady = false;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 540,
    height: 960,
    backgroundColor: '#070b12',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: { create, update },
  });

  function create(this: Phaser.Scene) {
    road = this.add.graphics();
    actors = this.add.graphics();
    banner = this.add.text(270, 430, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '84px',
      color: '#f4f7fb',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    sceneReady = true;
    publish();
  }

  function update() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const stepped = tick(state, dt, Date.now());
    state = stepped.state;
    stepped.lines.forEach((line) => hooks.onSpeak(line));
    if (stepped.lines.some((line) => line.startsWith('Yarışın kazananı'))) hooks.onFinish(ranking(state));
    draw();
  }

  function draw() {
    if (!sceneReady) return;
    road.clear();
    actors.clear();
    road.fillStyle(0x101820, 1);
    road.fillRect(0, 0, 540, 960);
    road.fillStyle(0x1c2836, 1);
    road.fillRoundedRect(78, 0, 384, 960, 18);
    road.lineStyle(8, 0x2f7bff, 0.9);
    road.strokeRect(86, -10, 368, 980);
    const scroll = (state.racers[0] ? Math.max(...state.racers.map((racer) => racer.progress)) : 0) * 420;
    road.lineStyle(4, 0xf4f7fb, 0.55);
    for (let i = 0; i < 18; i += 1) {
      const y = ((i * 70 - (scroll % 70)) + 960) % 960;
      road.lineBetween(206, y, 206, y + 28);
      road.lineBetween(334, y, 334, y + 28);
    }
    const leader = Math.max(0, ...state.racers.map((racer) => racer.progress));
    if (state.phase === 'countdown' || leader < 0.2) {
      road.fillStyle(0xf4f7fb, 1);
      road.fillRect(96, 760, 348, 10);
    }
    if (leader > state.settings.laps - 0.35) {
      for (let i = 0; i < 12; i += 1) {
        road.fillStyle(i % 2 ? 0x111111 : 0xf4f7fb, 1);
        road.fillRect(96 + i * 29, 150, 29, 16);
      }
    }
    const ordered = [...state.racers].sort((a, b) => b.progress - a.progress);
    ordered.forEach((racer) => drawCar(racer, leader));
    banner.setText(bannerText());
    const seen = new Set(state.racers.map((racer) => racer.id));
    for (const [id, label] of labels) {
      if (!seen.has(id)) {
        label.destroy();
        labels.delete(id);
      }
    }
  }

  function drawCar(racer: Racer, leader: number) {
    const gap = Math.max(0, leader - racer.progress);
    const y = Math.min(860, 250 + gap * 480);
    const x = 142 + racer.lane * 128;
    const color = COLORS[racer.lane + (racer.username.length % 5)] ?? COLORS[0];
    const now = Date.now();
    if (now < racer.turboUntil) {
      actors.lineStyle(3, 0x3dff9a, 0.8);
      actors.lineBetween(x - 18, y + 54, x - 34, y + 78);
      actors.lineBetween(x + 18, y + 54, x + 36, y + 82);
      actors.fillStyle(0x3dff9a, 0.85);
      for (let i = 0; i < 4; i += 1) {
        const spark = (now / 40 + i * 17) % 36;
        actors.fillCircle(x - 10 + i * 7, y + 60 + spark, 2);
      }
    }
    actors.fillStyle(0x05070c, 0.45);
    actors.fillEllipse(x, y + 58, 62, 14);
    actors.fillStyle(0x101820, 1);
    actors.fillRoundedRect(x - 24, y - 14, 48, 12, 4);
    actors.fillStyle(color, 1);
    actors.fillRoundedRect(x - 26, y - 8, 52, 62, 12);
    actors.fillStyle(0xd7e6f5, 1);
    actors.fillRoundedRect(x - 16, y + 4, 32, 16, 4);
    actors.fillStyle(0xfff1b8, 1);
    actors.fillCircle(x - 14, y + 48, 3);
    actors.fillCircle(x + 14, y + 48, 3);
    actors.fillStyle(0x111111, 1);
    actors.fillCircle(x - 16, y + 52, 7);
    actors.fillCircle(x + 16, y + 52, 7);
    if (now < racer.shieldUntil) {
      actors.lineStyle(3, 0x7ee7ff, 0.9);
      actors.strokeCircle(x, y + 20, 38);
    }
    let label = labels.get(racer.id);
    if (!label) {
      label = actors.scene.add.text(x, y - 28, racer.username, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#f4f7fb',
        backgroundColor: '#101820cc',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 1);
      labels.set(racer.id, label);
    }
    label.setText(racer.username);
    label.setPosition(x, y - 16);
  }

  function bannerText() {
    if (state.phase === 'countdown') {
      const left = Math.max(1, Math.ceil((state.countdownEndsAt - Date.now()) / 1000));
      return String(left);
    }
    if (state.phase === 'finished') {
      const winner = ranking(state)[0];
      return winner ? winner.nickname : '';
    }
    return '';
  }

  function publish() {
    hooks.onChange({
      phase: state.phase,
      racers: ranking(state).map((row) => row.username),
    });
    window.__arena = {
      racers: () => state.racers.length,
      phase: () => state.phase,
      ranking: () => ranking(state).map((row) => row.username),
      boosts: () => state.racers.map((racer) => ({
        id: racer.id,
        giftBoost: racer.giftBoost,
        turboUntil: racer.turboUntil,
        likeBursts: racer.likeBursts,
      })),
    };
  }

  const instance: GameInstance = {
    start() {
      if (state.phase === 'idle' && state.racers.length > 0) {
        state = { ...state, phase: 'countdown', countdownEndsAt: Date.now() + 3000 };
      }
      state = { ...state, paused: false };
    },
    stop() {
      state = { ...state, paused: true };
    },
    resume() {
      state = { ...state, paused: false };
    },
    restart() {
      state = restartRace(state);
      publish();
    },
    applySettings(settings: GameSettings) {
      state = { ...state, settings };
    },
    handleEvent(event: LiveEvent) {
      const before = state.racers.length;
      const result = reduce(state, event, Date.now());
      state = result.state;
      result.lines.forEach((line) => hooks.onSpeak(line));
      if (state.racers.length > before) hooks.onChange({ phase: state.phase, racers: ranking(state).map((row) => row.username) });
      publish();
    },
    removePlayer(username: string) {
      state = removeRacer(state, username);
      publish();
    },
    blockPlayer(username: string) {
      state = blockRacer(state, username);
      publish();
    },
    mutePlayer(username: string) {
      state = muteRacer(state, username);
    },
    setInteractions(enabled: boolean) {
      state = { ...state, interactions: enabled };
    },
    destroy() {
      labels.forEach((label) => label.destroy());
      game.destroy(true);
      delete window.__arena;
    },
  };

  return instance;
}

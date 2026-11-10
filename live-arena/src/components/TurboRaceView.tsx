'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { createNarration } from '@/lib/audio/narration';
import { eventKey, subscribeLocalEvents } from '@/lib/events/local-bus';
import type { LiveEvent } from '@/lib/events/schema';
import type { GameInstance, GameSettings } from '@/lib/games/types';
import { loadStudio, saveStudio } from '@/lib/studio';

export function TurboRaceView({ token }: { token: string }) {
  const host = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameInstance | null>(null);
  const [open, setOpen] = useState(false);
  const [racers, setRacers] = useState<string[]>([]);
  const [phase, setPhase] = useState('idle');
  const [interactions, setInteractions] = useState(true);

  useEffect(() => {
    const narration = createNarration();
    const stored = loadStudio();
    narration.setEnabled(stored.audioEnabled);
    narration.setVolume(stored.audioVolume);
    let socket: Socket | null = null;
    let stopLocal = () => {};
    let dead = false;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen((value) => !value);
    };
    window.addEventListener('keydown', onKey);
    (async () => {
      const { createTurboRace } = await import('@/games/turbo-race/createGame');
      if (dead || !host.current) return;
      const game = createTurboRace(host.current, {
        onSpeak(line) {
          if (!line) return;
          narration.say(line);
          if (line.includes('katıldı')) narration.effect('join');
          if (line.includes('turbo')) narration.effect('turbo');
          if (line.includes('kazananı')) narration.effect('win');
        },
        onFinish(rows) {
          const current = loadStudio();
          current.results = rows.map((row) => ({ ...row, at: Date.now() }));
          saveStudio(current);
        },
        onChange(snapshot) {
          setRacers(snapshot.racers);
          setPhase(snapshot.phase);
        },
      });
      gameRef.current = game;
      const seen = new Set<string>();
      const accept = (event: LiveEvent) => {
        const key = eventKey(event);
        if (seen.has(key)) return;
        seen.add(key);
        game.handleEvent(event);
      };
      stopLocal = subscribeLocalEvents((eventToken, event) => {
        if (eventToken === token) accept(event);
      });
      socket = io({ reconnection: true });
      socket.on('connect', () => socket?.emit('join-room', { token }));
      socket.on('live-event', accept);
      socket.on('settings', (settings: GameSettings) => {
        if (!settings || !Array.isArray(settings.gifts)) return;
        game.applySettings(settings);
      });
      if (dead) {
        stopLocal();
        socket.disconnect();
        game.destroy();
        gameRef.current = null;
      }
    })();
    return () => {
      dead = true;
      window.removeEventListener('keydown', onKey);
      stopLocal();
      socket?.disconnect();
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-black">
      <div className="relative h-[100dvh] w-[min(100vw,calc(100dvh*9/16))]">
        <div ref={host} className="h-full w-full" />
        {open ? (
          <div className="absolute inset-0 overflow-auto bg-ink/90 p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-neon">Yayın menüsü</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full bg-electric px-3 py-2" type="button" onClick={() => gameRef.current?.start()}>Başlat</button>
              <button className="rounded-full border border-line px-3 py-2" type="button" onClick={() => gameRef.current?.stop()}>Durdur</button>
              <button className="rounded-full border border-line px-3 py-2" type="button" onClick={() => gameRef.current?.resume()}>Devam</button>
              <button className="rounded-full border border-line px-3 py-2" type="button" onClick={() => gameRef.current?.restart()}>Sıfırla</button>
              <button
                className="rounded-full border border-line px-3 py-2"
                type="button"
                onClick={() => {
                  const next = !interactions;
                  setInteractions(next);
                  gameRef.current?.setInteractions(next);
                }}
              >
                Etkileşim {interactions ? 'açık' : 'kapalı'}
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {racers.map((name) => (
                <li key={name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                  <span>{name}</span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => gameRef.current?.removePlayer(name)}>Çıkar</button>
                    <button type="button" onClick={() => gameRef.current?.blockPlayer(name)}>Engelle</button>
                    <button type="button" onClick={() => gameRef.current?.mutePlayer(name)}>Sustur</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {phase === 'finished' && !open ? (
          <div className="pointer-events-none absolute inset-x-8 bottom-16 rounded-3xl bg-ink/80 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-neon">Yarış bitti</p>
            <ol className="mt-2 space-y-1 text-lg">
              {racers.map((name, index) => <li key={name}>{index + 1}. {name}</li>)}
            </ol>
          </div>
        ) : null}
      </div>
    </main>
  );
}

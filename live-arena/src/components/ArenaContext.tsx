'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { demoEvent, type LiveEvent, type LiveEventType } from '@/lib/events/schema';
import type { GameSettings } from '@/lib/games/types';
import { loadStudio, saveStudio, type StudioState } from '@/lib/studio';
import { createToken } from '@/lib/token';

interface ArenaApi {
  studio: StudioState;
  status: 'connected' | 'connecting' | 'disconnected';
  update(patch: Partial<StudioState>): void;
  updateSettings(settings: GameSettings): void;
  renewToken(): void;
  send(type: LiveEventType, username: string, extra?: Partial<LiveEvent>): void;
}

const ArenaContext = createContext<ArenaApi | null>(null);

export function ArenaProvider({ children }: { children: React.ReactNode }) {
  const [studio, setStudio] = useState<StudioState | null>(null);
  const studioRef = useRef<StudioState | null>(null);
  studioRef.current = studio;
  const [status, setStatus] = useState<ArenaApi['status']>('connecting');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initial = loadStudio();
    saveStudio(initial);
    setStudio(initial);
  }, []);

  useEffect(() => {
    if (!studio) return;
    const client = io({ reconnection: true });
    client.on('connect', () => {
      const current = studioRef.current;
      if (!current) return;
      setStatus('connected');
      client.emit('join-room', { token: current.token });
      client.emit('settings', { token: current.token, settings: current.settings });
    });
    client.on('disconnect', () => setStatus('disconnected'));
    client.io.on('reconnect_attempt', () => setStatus('connecting'));
    setSocket(client);
    return () => {
      client.disconnect();
    };
  }, [studio?.token]);

  const api = useMemo<ArenaApi | null>(() => {
    if (!studio) return null;
    const persist = (next: StudioState) => {
      saveStudio(next);
      setStudio(next);
    };
    return {
      studio,
      status,
      update(patch) {
        persist({ ...studio, ...patch });
      },
      updateSettings(settings) {
        const next = { ...studio, settings };
        persist(next);
        socket?.emit('settings', { token: studio.token, settings });
      },
      renewToken() {
        persist({ ...studio, token: createToken() });
      },
      send(type, username, extra) {
        const event = demoEvent(type, username, extra);
        socket?.emit('live-event', { token: studio.token, event });
      },
    };
  }, [socket, status, studio]);

  if (!api) return <p className="p-8 text-white/70">Panel hazırlanıyor…</p>;
  return <ArenaContext.Provider value={api}>{children}</ArenaContext.Provider>;
}

export function useArena() {
  const value = useContext(ArenaContext);
  if (!value) throw new Error('Panel bağlamı yok');
  return value;
}

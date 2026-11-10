'use client';

import { useEffect, useState } from 'react';
import { useArena } from '@/components/ArenaContext';

export default function BroadcastPage() {
  const { studio, renewToken } = useArena();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/play/${studio.token}`;
  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-semibold">Yayın Ayarları</h1>
      <p className="mt-2 text-sm text-white/70">OBS veya LIVE Studio tarayıcı kaynağı. 1080×1920, özel CSS boş. Ekranda panel yoktur.</p>
      <p className="mt-4 break-all rounded-2xl border border-line bg-panel p-4 text-sm">{url}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-full bg-electric px-4 py-2"
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
        </button>
        <button className="rounded-full border border-line px-4 py-2" type="button" onClick={() => renewToken()}>Bağlantıyı yenile</button>
      </div>
    </section>
  );
}

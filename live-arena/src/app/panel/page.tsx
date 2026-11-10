'use client';

import Link from 'next/link';
import { useArena } from '@/components/ArenaContext';

export default function OverviewPage() {
  const { studio, status } = useArena();
  const href = `/play/${studio.token}`;
  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Genel Bakış</h1>
      <p className="mt-2 text-white/70">Yerel stüdyo açık. Olaylar demo sağlayıcıdan oyun sahnesine gider.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-xs text-white/50">Bağlantı</p>
          <p className="mt-2 text-xl">{status === 'connected' ? 'Canlı kanal açık' : 'Bekleniyor'}</p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-xs text-white/50">Oyun</p>
          <p className="mt-2 text-xl">Turbo Yarış</p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-xs text-white/50">Son yarış</p>
          <p className="mt-2 text-xl">{studio.results[0]?.username ?? 'Henüz yok'}</p>
        </article>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="rounded-full bg-electric px-4 py-2" href="/panel/tiktok">Demo olay</Link>
        <a className="rounded-full border border-line px-4 py-2" href={href} target="_blank" rel="noreferrer">Yayın sahnesini aç</a>
      </div>
    </section>
  );
}

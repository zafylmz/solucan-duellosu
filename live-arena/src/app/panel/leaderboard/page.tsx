'use client';

import { useArena } from '@/components/ArenaContext';

export default function LeaderboardPage() {
  const { studio } = useArena();
  return (
    <section className="max-w-lg">
      <h1 className="text-3xl font-semibold">Liderlik Tablosu</h1>
      {studio.results.length === 0 ? <p className="mt-4 text-white/60">Bitmiş yarış yok.</p> : (
        <ol className="mt-4 space-y-2">
          {studio.results.map((row) => (
            <li key={`${row.at}-${row.place}`} className="rounded-2xl border border-line px-4 py-3">
              {row.place}. {row.username}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

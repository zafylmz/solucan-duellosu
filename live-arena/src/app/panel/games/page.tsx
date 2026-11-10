'use client';

import { gameCatalog } from '@/lib/games/catalog';
import { useArena } from '@/components/ArenaContext';

export default function GamesPage() {
  const { studio, updateSettings } = useArena();
  const settings = studio.settings;
  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Oyunlarım</h1>
      <div className="mt-5 grid gap-3">
        {gameCatalog.map((game) => (
          <article key={game.id} className="rounded-2xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg">{game.title}</h2>
              <span className="text-xs uppercase tracking-wider text-neon">{game.status === 'live' ? 'Açık' : 'Sırada'}</span>
            </div>
            <p className="mt-1 text-sm text-white/65">{game.summary}</p>
          </article>
        ))}
      </div>
      <form
        className="mt-6 grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const laps = Number(data.get('laps'));
          const likeThreshold = Number(data.get('likes'));
          const maxRacers = Number(data.get('max'));
          if (![laps, likeThreshold, maxRacers].every((value) => Number.isInteger(value) && value >= 1)) return;
          updateSettings({ ...settings, laps, likeThreshold, maxRacers });
        }}
      >
        <label className="text-sm">Tur
          <input className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2" name="laps" type="number" min={1} max={5} defaultValue={settings.laps} />
        </label>
        <label className="text-sm">Beğeni eşiği
          <input className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2" name="likes" type="number" min={1} max={500} defaultValue={settings.likeThreshold} />
        </label>
        <label className="text-sm">En fazla yarışçı
          <input className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2" name="max" type="number" min={1} max={8} defaultValue={settings.maxRacers} />
        </label>
        <button className="rounded-full bg-neon px-4 py-2 font-semibold text-ink sm:col-span-3" type="submit">Kuralları kaydet</button>
      </form>
    </section>
  );
}

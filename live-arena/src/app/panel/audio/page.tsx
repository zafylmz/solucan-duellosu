'use client';

import { useArena } from '@/components/ArenaContext';

export default function AudioPage() {
  const { studio, update } = useArena();
  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold">Ses Ayarları</h1>
      <p className="mt-2 text-sm text-white/70">Türkçe anlatım tarayıcının konuşma motorunu kullanır. Olaylar kuyruğa girer.</p>
      <label className="mt-5 flex items-center gap-3">
        <input
          type="checkbox"
          checked={studio.audioEnabled}
          onChange={(event) => update({ audioEnabled: event.target.checked })}
        />
        Anlatım açık
      </label>
      <label className="mt-4 block text-sm">Ses
        <input
          className="mt-2 w-full"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={studio.audioVolume}
          onChange={(event) => update({ audioVolume: Number(event.target.value) })}
        />
      </label>
    </section>
  );
}

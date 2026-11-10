'use client';

import { useArena } from '@/components/ArenaContext';
import type { GameSettings } from '@/lib/games/types';

export default function GiftsPage() {
  const { studio, updateSettings } = useArena();
  const gifts = studio.settings.gifts;
  function save(next: GameSettings['gifts']) {
    updateSettings({ ...studio.settings, gifts: next });
  }
  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-semibold">Hediye Eşleştirmeleri</h1>
      <p className="mt-2 text-sm text-white/70">Turbo Yarış için. Kayıt bu tarayıcıda durur ve açık sahneye iletilir.</p>
      <div className="mt-5 space-y-3">
        {gifts.map((gift, index) => (
          <div key={`${gift.giftName}-${index}`} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_140px_100px_auto]">
            <input
              className="rounded-xl border border-line bg-ink px-3 py-2"
              value={gift.giftName}
              onChange={(event) => {
                const next = gifts.map((item, itemIndex) => itemIndex === index ? { ...item, giftName: event.target.value } : item);
                save(next);
              }}
            />
            <select
              className="rounded-xl border border-line bg-ink px-3 py-2"
              value={gift.effect}
              onChange={(event) => {
                const effect = event.target.value as GameSettings['gifts'][number]['effect'];
                save(gifts.map((item, itemIndex) => itemIndex === index ? { ...item, effect } : item));
              }}
            >
              <option value="speed">Hız</option>
              <option value="turbo">Turbo</option>
              <option value="shield">Kalkan</option>
            </select>
            <input
              className="rounded-xl border border-line bg-ink px-3 py-2"
              type="number"
              min={1}
              value={gift.amount}
              onChange={(event) => {
                save(gifts.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(event.target.value) } : item));
              }}
            />
            <button
              className="rounded-full border border-line px-3 py-2 text-sm"
              type="button"
              onClick={() => save(gifts.filter((_, itemIndex) => itemIndex !== index))}
            >
              Sil
            </button>
          </div>
        ))}
      </div>
      <button
        className="mt-4 rounded-full bg-neon px-4 py-2 font-semibold text-ink"
        type="button"
        onClick={() => save([...gifts, { giftName: 'Yeni Hediye', effect: 'speed', amount: 10 }])}
      >
        Hediye ekle
      </button>
    </section>
  );
}

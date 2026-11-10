'use client';

import { useArena } from '@/components/ArenaContext';

export default function AccountPage() {
  const { studio, update } = useArena();
  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold">Hesap Ayarları</h1>
      <p className="mt-2 text-sm text-white/70">Yerel profil. Supabase Auth sonraki aşamada bağlanır.</p>
      <label className="mt-5 block text-sm">Görünen ad
        <input
          className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2"
          value={studio.displayName}
          onChange={(event) => update({ displayName: event.target.value })}
        />
      </label>
    </section>
  );
}

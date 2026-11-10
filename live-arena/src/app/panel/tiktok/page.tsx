'use client';

import { useState } from 'react';
import { useArena } from '@/components/ArenaContext';

export default function TikTokPage() {
  const { send, status } = useArena();
  const [username, setUsername] = useState('ayse');
  const [giftName, setGiftName] = useState('Rose');
  const [giftCount, setGiftCount] = useState(1);
  const [likeCount, setLikeCount] = useState(15);
  const [note, setNote] = useState('Demo hazır.');

  function fire(kind: 'CHAT' | 'LIKE' | 'FOLLOW' | 'GIFT' | 'JOIN') {
    const name = username.trim();
    if (!name) return;
    if (kind === 'GIFT') send('GIFT', name, { giftName, giftCount, diamondValue: 1 });
    else if (kind === 'LIKE') send('LIKE', name, { likeCount });
    else send(kind, name);
    setNote(`${name} için ${kind} gönderildi.`);
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-semibold">TikTok Bağlantısı</h1>
      <p className="mt-2 text-sm text-white/70">
        Kanal durumu: {status === 'connected' ? 'bağlı' : status === 'connecting' ? 'yeniden bağlanıyor' : 'kopuk'}. Kopunca soket kendiliğinden yeniden dener.
      </p>
      <p className="mt-3 text-sm text-white/55">
        TikTok’un herkese açık bir canlı sohbet veya hediye API’si yok. Şifre ve çerez istenmez. Olaylar demo sağlayıcıdan gider.
      </p>
      <label className="mt-5 block text-sm">Kullanıcı adı
        <input className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2" value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-electric px-4 py-2" type="button" onClick={() => fire('CHAT')}>Yorum</button>
        <button className="rounded-full border border-line px-4 py-2" type="button" onClick={() => fire('FOLLOW')}>Takip</button>
        <button className="rounded-full border border-line px-4 py-2" type="button" onClick={() => fire('JOIN')}>Katılım</button>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">Beğeni
          <input className="mt-1 block w-24 rounded-xl border border-line bg-ink px-3 py-2" type="number" min={1} value={likeCount} onChange={(event) => setLikeCount(Number(event.target.value))} />
        </label>
        <button className="rounded-full border border-line px-4 py-2" type="button" onClick={() => fire('LIKE')}>Beğeni gönder</button>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">Hediye
          <input className="mt-1 block rounded-xl border border-line bg-ink px-3 py-2" value={giftName} onChange={(event) => setGiftName(event.target.value)} />
        </label>
        <label className="text-sm">Seri
          <input className="mt-1 block w-20 rounded-xl border border-line bg-ink px-3 py-2" type="number" min={1} value={giftCount} onChange={(event) => setGiftCount(Number(event.target.value))} />
        </label>
        <button className="rounded-full bg-neon px-4 py-2 font-semibold text-ink" type="button" onClick={() => fire('GIFT')}>Hediye gönder</button>
      </div>
      <p className="mt-4 text-sm text-white/70">{note}</p>
    </section>
  );
}

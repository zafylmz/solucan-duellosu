import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold tracking-[0.22em] text-neon">LIVE ARENA</p>
        <Link className="rounded-full bg-electric px-4 py-2 text-sm font-semibold" href="/panel">
          Panele gir
        </Link>
      </header>
      <section className="mt-16 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight md:text-6xl">
            Canlı yayınını dikey bir yarışa çevir.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/70">
            İzleyici yorumu ve takibi piste çıkar. Beğeni hız verir, hediye turbo olur. Bağlantıyı OBS tarayıcı kaynağına eklersin.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full bg-neon px-5 py-3 font-semibold text-ink" href="/panel/games">
              Turbo Yarış’ı aç
            </Link>
            <Link className="rounded-full border border-line px-5 py-3" href="/panel/tiktok">
              Demo olay gönder
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-electric">Bu aşama</p>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            <li>Yerel panel ve güvenli yayın bağlantısı</li>
            <li>Demo yorum, beğeni, takip ve hediye</li>
            <li>9:16 Turbo Yarış, kullanıcı adı arabanın üstünde</li>
            <li>Türkçe sesli anlatım ve ESC menüsü</li>
          </ul>
          <p className="mt-5 text-sm text-white/75">
            Ödeme ve lisans bu turda yok. Gerçek TikTok olayı için resmi bir canlı API bulunmuyor; şifre istenmez.
          </p>
        </div>
      </section>
    </main>
  );
}

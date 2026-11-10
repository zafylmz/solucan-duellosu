'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArenaProvider, useArena } from './ArenaContext';

const links = [
  ['/panel', 'Genel Bakış'],
  ['/panel/games', 'Oyunlarım'],
  ['/panel/tiktok', 'TikTok Bağlantısı'],
  ['/panel/broadcast', 'Yayın Ayarları'],
  ['/panel/gifts', 'Hediye Eşleştirmeleri'],
  ['/panel/audio', 'Ses Ayarları'],
  ['/panel/leaderboard', 'Liderlik Tablosu'],
  ['/panel/license', 'Lisans Bilgileri'],
  ['/panel/billing', 'Satın Alma Geçmişi'],
  ['/panel/account', 'Hesap Ayarları'],
];

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { status } = useArena();
  const label = status === 'connected' ? 'Bağlı' : status === 'connecting' ? 'Yeniden bağlanıyor' : 'Kopuk';
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-panel md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-neon">LIVE ARENA</Link>
          <p className="text-xs text-white/60 md:mt-3">{label}</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3">
          {links.map(([href, title]) => (
            <Link
              key={href}
              href={href}
              className={`block whitespace-nowrap rounded-xl px-3 py-2 text-sm ${path === href ? 'bg-electric text-white' : 'text-white/75 hover:bg-white/5'}`}
            >
              {title}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}

export function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <ArenaProvider>
      <Shell>{children}</Shell>
    </ArenaProvider>
  );
}

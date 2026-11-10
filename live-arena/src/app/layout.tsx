import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIVE ARENA',
  description: 'TikTok canlı yayınları için dikey oyun sahnesi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

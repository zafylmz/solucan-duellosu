import { TurboRaceView } from '@/components/TurboRaceView';
import { isValidToken } from '@/lib/token';

export default async function PlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidToken(token)) {
    return <main className="grid min-h-screen place-items-center bg-black text-white/70">Bağlantı geçersiz.</main>;
  }
  return <TurboRaceView token={token} />;
}

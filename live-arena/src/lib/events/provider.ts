import type { LiveEvent } from './schema';

export type ProviderStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Oyunlar sağlayıcıyı tanımaz. Yalnızca LiveEvent alır.
 * Demo sağlayıcı panelden elle olay üretir.
 * TikTok sağlayıcısı resmi bir canlı olay API'si onaylanınca aynı arayüze bağlanır.
 * Şifre ve oturum çerezi istenmez.
 */
export interface EventProvider {
  readonly id: 'demo' | 'tiktok';
  start(onEvent: (event: LiveEvent) => void): void;
  stop(): void;
  status(): ProviderStatus;
}

export function createDemoProvider(): EventProvider {
  let listening = false;
  return {
    id: 'demo',
    start() {
      listening = true;
    },
    stop() {
      listening = false;
    },
    status() {
      return listening ? 'connected' : 'disconnected';
    },
  };
}

/**
 * TikTok'un geliştirici belgelerinde genel bir canlı sohbet, hediye veya beğeni
 * akışı yok. Onay süreci garanti vermiyor. Resmi olmayan webcast istemcileri
 * protokol değişince kopuyor ve platformun güvenlik önlemlerini dolaşmak için
 * kullanılmayacak. Bu yüzden sağlayıcı bu aşamada bağlanmaz.
 */
export function createTikTokProvider(): EventProvider {
  return {
    id: 'tiktok',
    start() {
      throw new Error('Resmi TikTok canlı olay API’si yok. Demo sağlayıcıyı kullanın.');
    },
    stop() {},
    status: () => 'disconnected',
  };
}

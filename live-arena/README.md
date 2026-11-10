# LIVE ARENA

TikTok canlı yayınları için tarayıcıda çalışan dikey oyun stüdyosu. Bu klasör kendi kodu, kendi görselleri ve kendi adıyla durur. Başka bir ürünün arayüzü veya markası kullanılmaz.

İlk çalışan sürüm yerelde açılır. Ödeme, lisans kilidi ve yönetici paneli bu sürümde yok.

## Çalıştırma

```bash
cd live-arena
npm install
npm test
npm run typecheck
npm run dev
```

Adres: `http://127.0.0.1:3010`

Panel: `http://127.0.0.1:3010/panel`

OBS veya LIVE Studio tarayıcı kaynağı: `http://127.0.0.1:3010/play/<48-hex-token>`

Kaynak boyutu 1080×1920. Özel CSS boş bırakılır. Oyun alanı dışında panel yoktur. ESC menüsü yalnızca Escape ile açılır.

`PORT` için `.env.example` dosyasına bak. Supabase anahtarları bu aşamada gerekmez.

## Bu sürümde çalışanlar

- Koyu tema sitesi ve kullanıcı paneli
- Tahmin edilmesi zor yayın bağlantısı; panelden yenilenir
- Demo olaylar: yorum, beğeni, takip, hediye, izleyici katılımı
- Phaser 3 Turbo Yarış, 9:16
- Olaylar Socket.IO ile açık sahneye gider
- Türkçe anlatım kuyruğu, ses aç/kapa ve seviye
- ESC: çıkar, engelle, sustur, başlat, durdur, devam, sıfırla, etkileşim anahtarı

Aynı izleyici ikinci kez yarışçı olmaz. Hediye adedi hız, turbo ve kalkan süresini çarpar. Beğeni, eşik dolunca hız bonusu verir. Bağlantı kopunca soket yeniden dener; panel durumu gösterir.

## Bilerek olmayanlar

Satın alma düğmesi, sahte ödeme onayı ve lisans süresi kontrolü yok. Lisans ve satın alma sayfaları yalnızca sonraki aşamayı anlatır.

Gerçek TikTok olayı bağlanmaz. Geliştirici belgelerinde herkese açık bir canlı sohbet, hediye veya beğeni akışı yok. Veri taşınabilirliği de yayın odasının anlık akışı değil. Onay süreci garanti vermiyor. Resmi olmayan webcast istemcileri protokol değişince kopuyor; bu projede kullanılmıyor. Kullanıcıdan TikTok şifresi veya oturum çerezi istenmez.

## Mimari

Tek süreç. `server/index.ts` Next.js ile Socket.IO’yu `127.0.0.1:3010` üzerinde açar. Panel ve yayın sayfası `play:<token>` odasındadır. Ayarlar sunucunun belleğinde tutulur ve sahne bağlanınca tekrar gönderilir. Sunucu yeniden başlarsa panel bir kez daha bağlanınca ayarlar geri gelir.

Oyunlar `GameModule` arayüzünün arkasındadır: başlat, durdur, devam, yeniden başlat, ayar, oyuncu ekle/çıkar, olay, engelle, sustur, etkileşim. Yeni oyun, `src/games/<id>` ve `src/lib/games/catalog.ts` içine bir satırdır. Katalogdaki diğer on oyun henüz oynanmaz; yalnızca yerleri durur.

Turbo Yarış kuralları `src/games/turbo-race/rules.ts` içindedir ve Phaser’dan bağımsız test edilir. Sahne yalnızca çizer.

Olaylar Zod ile tek şekle iner: `CHAT`, `GIFT`, `LIKE`, `FOLLOW`, `SHARE`, `JOIN`, `SUBSCRIBE`, `DISCONNECT`. Demo sağlayıcı bu şekli üretir. `createTikTokProvider().start()` bağlanmayı reddeder. İleride resmi erişim onaylanırsa aynı arayüze bir adaptör eklenir.

## Klasörler

```text
live-arena/
  server/index.ts          Next + Socket.IO
  src/app/                 site, panel, /play/[token]
  src/components/          panel kabuğu ve yarış sahnesi
  src/games/turbo-race/    kurallar, ayar, Phaser sahnesi
  src/lib/events/          şema, demo ve TikTok sağlayıcı uçları
  src/lib/games/           ortak oyun arayüzü ve katalog
  src/lib/audio/           Türkçe anlatım kuyruğu
  supabase/schema.sql      sonraki aşamanın tablo taslağı
```

Yerel profil `localStorage` anahtarı `live-arena-v1` içindedir: bağlantı, görünen ad, yarış ayarı, hediye eşlemesi, ses ve son sıralama.

## Bağımlılıklar

Next.js, React, TypeScript, Tailwind CSS, Phaser 3, Socket.IO, Zod. Redis yok. Supabase istemcisi yok; şema SQL olarak duruyor. Ödeme SDK’sı yok.

## Supabase taslağı

`supabase/schema.sql` sonraki aşama içindir ve bir projeye uygulanmış değildir.

Tablolar: `profiles`, `games`, `broadcast_links`, `gift_mappings`, `audio_settings`, `race_results`, `blocked_viewers`, `licenses`, `payments`, `event_logs`.

Satır düzeyi güvenlik açıktır. Kullanıcı kendi satırını okur. `licenses` ve `payments` istemciden yalnızca okunur. Oyun kataloğu herkese açıktır. Yönetici işi service role ile sunucuda kalır; istemciye admin politikası verilmez. `payments` kart alanı tutmaz. Ödeme ancak sağlayıcı webhook’u sunucuda doğrulanınca `paid` olur.

## Aşamalar

1. Bu sürüm: site, panel, demo olay, Turbo Yarış.
2. Supabase Auth, satır düzeyi güvenlik ve kalıcı yayın bağlantısı.
3. Resmi TikTok canlı olay erişimi onaylanırsa sağlayıcı adaptörü.
4. Katalogdaki oyunların gerçek modülleri.
5. Lisans süresi ve Shopier veya iyzico webhook ödemesi.
6. Sunucu tarafında doğrulanan yönetici paneli.

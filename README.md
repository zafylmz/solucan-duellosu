# Solucan Düellosu

Kazılabilen toprakta, ipli solucanlarla yapay zekâya karşı 1'e 1 oynanan mobil oyun (prototip).

## Klasörler

- `www/` oyunun kendisi (tek HTML dosyası, yerel fontlar, ikonlar, çevrimdışı çalışma).
- `android/` Android uygulama projesi (Capacitor).
- `ios/` iPhone uygulama projesi (Capacitor). Derlemek için Mac + Xcode gerekir.
- `assets/` uygulama ikonu kaynağı.

## Telefona kurma

- **Android:** her `main` gönderiminde GitHub Actions APK derler. Reponun *Releases* bölümündeki
  `latest` sürümünden `solucan-duellosu.apk` dosyasını telefonda indirip açın
  ("bilinmeyen kaynaklardan yükleme" iznini bir kez vermeniz gerekir).
- **iPhone (ücretsiz yol):** GitHub Pages açıksa web sürümünü Safari'de açıp
  Paylaş → "Ana Ekrana Ekle" deyin, uygulama gibi tam ekran açılır.
- **iPhone (App Store / TestFlight):** Mac'te `npm ci && npx cap sync ios && npx cap open ios`,
  ardından Xcode'da Apple Developer hesabıyla imzalayıp yükleyin.

## Geliştirme

```
npm ci
npx cap sync        # www/ değişikliklerini android/ ve ios/ içine kopyalar
npx cap open android
```

## Özel odalar (Supabase)

Menüdeki **Özel odalar** AI maçından ayrı bir lobidir. Açık ve şifreli odalar ayrı listelenir.

1. Supabase projesinde `supabase/schema.sql` dosyasını SQL Editor’da çalıştırın.
2. Cursor Secrets / ortam değişkenleri (anon key istemcide RLS ile kullanılır):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Değerleri `www/sd-config.js` içine yazabilir veya sayfa yüklenmeden `window.SUPABASE_URL` / `window.SUPABASE_ANON_KEY` enjekte edebilirsiniz.
4. Secret yoksa lobi **yerel mock** moda düşer (`localStorage`); oyun kırılmaz, AI maçı çalışmaya devam eder.

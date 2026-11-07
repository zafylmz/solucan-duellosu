/**
 * Supabase istemci ayarları.
 *
 * Cursor Secrets / ortam değişkenleri (bind edilebilir isimler):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *
 * Değerler bu dosyaya yazılabilir veya sayfa yüklenmeden önce
 * window.SUPABASE_URL / window.SUPABASE_ANON_KEY olarak enjekte edilebilir.
 * İkisi de boşsa oda lobisi yerel (localStorage) mock moda düşer; AI maçı etkilenmez.
 */
export const SD_SUPABASE_URL =
  (typeof globalThis !== 'undefined' && globalThis.SUPABASE_URL) || '';
export const SD_SUPABASE_ANON_KEY =
  (typeof globalThis !== 'undefined' && globalThis.SUPABASE_ANON_KEY) || '';

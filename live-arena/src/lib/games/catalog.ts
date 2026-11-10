import type { GameCatalogItem } from './types';

/** Yeni oyun: bu listeye bir satır ve src/games/<id> modülü eklenir. */
export const gameCatalog: GameCatalogItem[] = [
  {
    id: 'turbo-race',
    title: 'Turbo Yarış',
    summary: 'Yorum ve takip ile piste çıkan, hediye ile hızlanan dikey yarış.',
    status: 'live',
  },
  { id: 'battle-arena', title: 'Savaş Arenası', summary: 'Hediyeler saldırı gücünü değiştirir.', status: 'planned' },
  { id: 'disco', title: 'Disco Dünyası', summary: 'Beğeniler pisti yakar.', status: 'planned' },
  { id: 'quiz', title: 'Bilgi Yarışması', summary: 'Yorumlar cevap olur.', status: 'planned' },
  { id: 'zombie', title: 'Zombi Hayatta Kalma', summary: 'Hediyeler mermi ve can verir.', status: 'planned' },
  { id: 'penalty', title: 'Futbol Penaltı', summary: 'Yorumlar şut çeker.', status: 'planned' },
  { id: 'fishing', title: 'Balık Tutma', summary: 'Hediyeler oltayı güçlendirir.', status: 'planned' },
  { id: 'tower', title: 'Kule Savunma', summary: 'Takipçiler kule kurar.', status: 'planned' },
  { id: 'draw', title: 'Çizim Yarışması', summary: 'Yorumlar temayı seçer.', status: 'planned' },
  { id: 'monster', title: 'Canavar Geliştirme', summary: 'Hediyeler canavarı büyütür.', status: 'planned' },
  { id: 'arena', title: 'Çok Oyunculu Arena', summary: 'Aynı olaylar başka kurallarla işler.', status: 'planned' },
];

export function liveGames() {
  return gameCatalog.filter((game) => game.status === 'live');
}

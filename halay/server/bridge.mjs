import { WebSocketServer } from 'ws';
import { GUEST_CAP, cleanName, commentJoins } from '../shared/join.js';

const port = Number(process.env.HALAY_BRIDGE_PORT || 8787);
const host = '127.0.0.1';

const guests = [];
let generation = 0;
let live = null;
let uniqueId = '';
let status = { state: 'idle', uniqueId: '', detail: 'Yayın seçilmedi. Elle katılım açık.' };

const wss = new WebSocketServer({ host, port });

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

function setStatus(state, detail) {
  status = { state, uniqueId, detail };
  broadcast({ type: 'status', status });
}

function sendSnapshot(socket) {
  socket.send(JSON.stringify({ type: 'snapshot', guests, cap: GUEST_CAP, status }));
}

function readComment(event) {
  const user = event?.user ?? {};
  const text = event?.content ?? event?.comment ?? '';
  const id = user.userId || user.id || user.secUid || user.displayId || user.uniqueId || user.nickname || '';
  const username = user.uniqueId || user.displayId || user.nickname || user.nickName || 'misafir';
  return {
    text: String(text),
    id: String(id),
    name: cleanName(String(username).replace(/^@+/, '')) || 'misafir',
  };
}

function detach() {
  generation += 1;
  const current = live;
  live = null;
  if (current) {
    Promise.resolve(current.disconnect()).catch((error) => {
      console.error('TikTok bağlantısı kapanırken hata:', error);
    });
  }
  return generation;
}

async function listen(rawId) {
  const id = String(rawId ?? '').trim().replace(/^@+/, '').slice(0, 64);
  if (!id) return;
  if (id === uniqueId && live && (status.state === 'live' || status.state === 'connecting')) {
    broadcast({ type: 'status', status });
    return;
  }

  detach();
  const token = generation;
  uniqueId = id;
  setStatus('connecting', `@${id} aranıyor`);

  let imported;
  try {
    imported = await import('tiktok-live-connector');
  } catch (error) {
    console.error(error);
    if (token !== generation) return;
    setStatus('error', 'tiktok-live-connector yüklenemedi. Elle katılım açık.');
    return;
  }
  if (token !== generation) return;

  const TikTokLiveConnection = imported.TikTokLiveConnection ?? imported.default?.TikTokLiveConnection;
  const WebcastEvent = imported.WebcastEvent ?? imported.default?.WebcastEvent;
  const ControlEvent = imported.ControlEvent ?? imported.default?.ControlEvent;
  if (!TikTokLiveConnection) {
    setStatus('error', 'TikTok istemcisi bulunamadı. Elle katılım açık.');
    return;
  }

  let connection;
  try {
    connection = new TikTokLiveConnection(id, {});
  } catch (error) {
    console.error(error);
    if (token !== generation) return;
    setStatus('error', 'Canlı yayın girişi başarısız. Elle katılım açık.');
    return;
  }
  live = connection;
  const chatEvent = WebcastEvent?.CHAT ?? 'chat';
  connection.on(chatEvent, (event) => {
    if (connection !== live) return;
    const comment = readComment(event);
    if (!commentJoins(comment.text) || !comment.id) return;
    const guestId = `tiktok:${comment.id}`;
    if (guests.some((guest) => guest.id === guestId)) return;
    if (guests.length >= GUEST_CAP) {
      setStatus(status.state, `Hat doldu (${GUEST_CAP} misafir).`);
      return;
    }
    const guest = { id: guestId, name: comment.name };
    guests.push(guest);
    broadcast({ type: 'join', guest });
    console.log(`Katıldı: ${guest.name}`);
  });

  const onError = (error) => {
    console.error('TikTok yayın hatası:', error?.info ?? error?.exception ?? error);
    if (connection !== live) return;
    const detail = status.state === 'live'
      ? 'Canlı yayın bağlantısı koptu. Elle katılım açık.'
      : 'Canlı yayın girişi başarısız. Elle katılım açık.';
    setStatus('error', detail);
  };
  if (ControlEvent?.ERROR) connection.on(ControlEvent.ERROR, onError);
  connection.on('error', onError);

  try {
    const state = await Promise.race([
      connection.connect(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TikTok giriş zaman aşımı')), 25000);
      }),
    ]);
    if (token !== generation) {
      Promise.resolve(connection.disconnect()).catch(() => {});
      return;
    }
    console.log(`Canlı oda: ${state?.roomId ?? 'bilinmiyor'}`);
    setStatus('live', `@${id} bağlı`);
  } catch (error) {
    console.error(error);
    if (token !== generation) return;
    if (live === connection) live = null;
    Promise.resolve(connection.disconnect()).catch(() => {});
    setStatus('error', 'Canlı yayın girişi başarısız. Elle katılım açık.');
  }
}

wss.on('connection', (socket) => {
  sendSnapshot(socket);
  socket.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (message?.type === 'listen') void listen(message.uniqueId);
    if (message?.type === 'stop') {
      detach();
      uniqueId = '';
      setStatus('idle', 'Yayın dinlenmiyor. Elle katılım açık.');
    }
  });
});

wss.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
});

console.log(`Halay köprüsü hazır: ws://${host}:${port}`);
console.log('Köprüyü bu komutla başlatın: npm run bridge');
console.log('OBS tarayıcı kaynağı: http://127.0.0.1:5173/?clean=1');

import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { liveEventSchema } from '../src/lib/events/schema';
import { isValidToken } from '../src/lib/token';

const port = Number(process.env.PORT || 3010);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname: '127.0.0.1', port });
const handle = app.getRequestHandler();
const settingsByToken = new Map<string, unknown>();
const hits = new Map<string, number[]>();

function allow(id: string) {
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((stamp) => now - stamp < 1000);
  if (recent.length >= 20) {
    hits.set(id, recent);
    return false;
  }
  recent.push(now);
  hits.set(id, recent);
  return true;
}

await app.prepare();
const server = createServer((req, res) => {
  if (req.url?.startsWith('/socket.io')) return;
  handle(req, res);
});
const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('join-room', (payload: { token?: string }) => {
    const token = payload?.token ?? '';
    if (!isValidToken(token)) return;
    socket.join(`play:${token}`);
    const settings = settingsByToken.get(token);
    if (settings) socket.emit('settings', settings);
    socket.emit('link-status', { state: 'connected' });
  });

  socket.on('live-event', (payload: { token?: string; event?: unknown }) => {
    const token = payload?.token ?? '';
    if (!isValidToken(token) || !allow(socket.id)) return;
    const parsed = liveEventSchema.safeParse(payload.event);
    if (!parsed.success) return;
    io.to(`play:${token}`).emit('live-event', parsed.data);
  });

  socket.on('settings', (payload: { token?: string; settings?: unknown }) => {
    const token = payload?.token ?? '';
    if (!isValidToken(token) || !payload.settings || typeof payload.settings !== 'object') return;
    settingsByToken.set(token, payload.settings);
    io.to(`play:${token}`).emit('settings', payload.settings);
  });

});

server.listen(port, '127.0.0.1', () => {
  console.log(`LIVE ARENA hazır: http://127.0.0.1:${port}`);
});

import type { LiveEvent } from './schema';

const CHANNEL = 'live-arena-events';

export function publishLocalEvent(token: string, event: LiveEvent) {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ token, event });
  channel.close();
}

export function subscribeLocalEvents(onEvent: (token: string, event: LiveEvent) => void) {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (message: MessageEvent<{ token?: string; event?: LiveEvent }>) => {
    if (!message.data?.event || typeof message.data.token !== 'string') return;
    onEvent(message.data.token, message.data.event);
  };
  return () => channel.close();
}

export function eventKey(event: LiveEvent) {
  return [event.timestamp, event.type, event.username, event.giftName ?? '', event.giftCount ?? 0, event.likeCount ?? 0].join(':');
}

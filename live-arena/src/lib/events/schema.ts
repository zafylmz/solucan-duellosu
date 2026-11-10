import { z } from 'zod';

export const eventTypes = ['CHAT', 'GIFT', 'LIKE', 'FOLLOW', 'SHARE', 'JOIN', 'SUBSCRIBE', 'DISCONNECT'] as const;

export const liveEventSchema = z.object({
  type: z.enum(eventTypes),
  username: z.string().trim().min(1).max(32),
  nickname: z.string().trim().min(1).max(32),
  giftName: z.string().trim().max(48).optional(),
  giftCount: z.number().int().positive().max(500).optional(),
  diamondValue: z.number().int().nonnegative().max(100000).optional(),
  likeCount: z.number().int().positive().max(10000).optional(),
  timestamp: z.number().int().nonnegative(),
});

export type LiveEvent = z.infer<typeof liveEventSchema>;
export type LiveEventType = LiveEvent['type'];

export function viewerId(username: string) {
  return username.trim().replace(/^@+/, '').toLocaleLowerCase('tr-TR');
}

export function demoEvent(
  type: LiveEventType,
  username: string,
  extra: Partial<Omit<LiveEvent, 'type' | 'username' | 'timestamp'>> = {},
): LiveEvent {
  const name = username.trim().replace(/^@+/, '');
  return liveEventSchema.parse({
    type,
    username: name,
    nickname: extra.nickname || name,
    giftName: extra.giftName,
    giftCount: extra.giftCount,
    diamondValue: extra.diamondValue,
    likeCount: extra.likeCount,
    timestamp: Date.now(),
  });
}

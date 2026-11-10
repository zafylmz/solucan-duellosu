import assert from 'node:assert/strict';
import test from 'node:test';
import { demoEvent, viewerId } from './schema';

test('demo chat normalizes the username', () => {
  const event = demoEvent('CHAT', ' @Ayşe ');
  assert.equal(event.type, 'CHAT');
  assert.equal(event.username, 'Ayşe');
  assert.equal(viewerId(event.username), 'ayşe');
});

test('gift series keeps a positive count', () => {
  const event = demoEvent('GIFT', 'mehmet', { giftName: 'Rose', giftCount: 5, diamondValue: 1 });
  assert.equal(event.giftCount, 5);
  assert.equal(event.giftName, 'Rose');
});

test('empty username is rejected', () => {
  assert.throws(() => demoEvent('LIKE', '   '));
});

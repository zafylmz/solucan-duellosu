import assert from 'node:assert/strict';
import test from 'node:test';
import { demoEvent } from '@/lib/events/schema';
import { blockRacer, freshRace, ranking, reduce, tick } from './rules';

test('the same viewer cannot join twice', () => {
  let state = freshRace();
  state = reduce(state, demoEvent('CHAT', 'Ayşe'), 0).state;
  state = reduce(state, demoEvent('FOLLOW', '@ayşe'), 1).state;
  state = reduce(state, demoEvent('CHAT', 'ayşe', { nickname: 'Ayse' }), 2).state;
  assert.equal(state.racers.length, 1);
});

test('a blocked viewer stays out', () => {
  let state = blockRacer(freshRace(), 'ali');
  state = reduce(state, demoEvent('CHAT', 'Ali'), 0).state;
  assert.equal(state.racers.length, 0);
});

test('likes grant one burst per threshold', () => {
  let state = reduce(freshRace(), demoEvent('JOIN', 'mehmet'), 0).state;
  state = reduce(state, demoEvent('LIKE', 'mehmet', { likeCount: 14 }), 10).state;
  assert.equal(state.racers[0]?.likeBursts, 0);
  state = reduce(state, demoEvent('LIKE', 'mehmet', { likeCount: 16 }), 20).state;
  assert.equal(state.racers[0]?.likeBursts, 2);
});

test('a gift series multiplies the speed bonus', () => {
  let state = reduce(freshRace(), demoEvent('CHAT', 'zeynep'), 0).state;
  state = reduce(state, demoEvent('GIFT', 'zeynep', { giftName: 'rose', giftCount: 5 }), 10).state;
  assert.equal(state.racers[0]?.giftBoost, 90);
});

test('turbo from Galaxy is timed', () => {
  let state = reduce(freshRace(), demoEvent('FOLLOW', 'can'), 0).state;
  state = reduce(state, demoEvent('GIFT', 'can', { giftName: 'Galaxy', giftCount: 2 }), 1000).state;
  assert.equal(state.racers[0]?.turboUntil, 1000 + 5000);
});

test('the race finishes and ranks the leader', () => {
  let state = reduce(freshRace(), demoEvent('CHAT', 'elif'), 0).state;
  state = tick(state, 0, 3000).state;
  assert.equal(state.phase, 'racing');
  state = tick(state, 20, 4000).state;
  assert.equal(state.phase, 'finished');
  assert.equal(ranking(state)[0]?.username, 'elif');
});

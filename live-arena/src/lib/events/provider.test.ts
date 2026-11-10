import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoProvider, createTikTokProvider } from './provider';

test('demo provider listens without a network call', () => {
  const demo = createDemoProvider();
  assert.equal(demo.status(), 'disconnected');
  demo.start(() => {});
  assert.equal(demo.status(), 'connected');
  demo.stop();
  assert.equal(demo.status(), 'disconnected');
});

test('tiktok provider refuses to connect', () => {
  assert.throws(() => createTikTokProvider().start(() => {}), /Demo sağlayıcı/);
});

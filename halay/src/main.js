import * as THREE from 'three';
import { GUEST_CAP, cleanName } from '../shared/join.js';
import { createStage } from './stage.js';
import { createLine } from './line.js';

const params = new URLSearchParams(location.search);
const bridgePort = params.get('bridge') || '8787';
const bridgeUrl = `ws://${location.hostname || '127.0.0.1'}:${bridgePort}`;

const frame = document.querySelector('#frame');
const canvas = document.querySelector('#view');
const nameInput = document.querySelector('#name');
const uniqueInput = document.querySelector('#unique');
const joinButton = document.querySelector('#join');
const statusNode = document.querySelector('#status');
const countNode = document.querySelector('#count');

const stage = createStage(canvas);
const line = createLine(stage.scene, stage.camera, {
  onArrive(person) {
    stage.focusOn(person.headAnchor);
  },
});

const preset = (params.get('live') || '').trim().replace(/^@+/, '');
if (preset) uniqueInput.value = preset;

let armedId = preset;
let socket;
let reconnectTimer;

function renderCount() {
  const count = line.guestCount();
  countNode.textContent = count >= GUEST_CAP
    ? `Hat doldu · ${count} / ${GUEST_CAP} misafir`
    : `Gelin ve damat ortada · ${count} / ${GUEST_CAP} misafir`;
  joinButton.disabled = count >= GUEST_CAP;
}

function setStatus(text) {
  statusNode.textContent = text;
}

function statusText(status) {
  if (!status) return 'Köprü hazır. Elle katılım açık.';
  if (status.state === 'live') return `Canlı yayın dinleniyor: @${status.uniqueId}`;
  if (status.state === 'connecting') return `Bağlanıyor: @${status.uniqueId}`;
  if (status.state === 'error') return status.detail || 'Canlı yayın girişi başarısız. Elle katılım açık.';
  if (status.state === 'closed') return 'Köprü kapalı. Elle katılım açık.';
  return status.detail || 'Köprü hazır. Elle katılım açık.';
}

function send(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function connectBridge() {
  window.clearTimeout(reconnectTimer);
  socket = new WebSocket(bridgeUrl);
  let settled = false;
  const drop = () => {
    if (settled) return;
    settled = true;
    setStatus('Köprü kapalı. Elle katılım açık.');
    reconnectTimer = window.setTimeout(connectBridge, 2000);
  };
  socket.addEventListener('open', () => {
    setStatus('Köprü hazır. Elle katılım açık.');
    if (armedId) send({ type: 'listen', uniqueId: armedId });
  });
  socket.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.type === 'snapshot') {
      for (const guest of message.guests || []) line.addGuest(guest);
      if (message.status?.uniqueId && !uniqueInput.value) uniqueInput.value = message.status.uniqueId;
      setStatus(statusText(message.status));
      renderCount();
    } else if (message.type === 'join') {
      line.addGuest(message.guest);
      renderCount();
    } else if (message.type === 'status') {
      setStatus(statusText(message.status));
    }
  });
  socket.addEventListener('close', drop);
  socket.addEventListener('error', () => socket.close());
}

document.querySelector('#join-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = cleanName(nameInput.value);
  if (!name) return;
  const added = line.addGuest({ id: `manual:${crypto.randomUUID()}`, name });
  if (added) {
    nameInput.value = '';
    nameInput.blur();
  }
  renderCount();
});

document.querySelector('#live-form').addEventListener('submit', (event) => {
  event.preventDefault();
  armedId = uniqueInput.value.trim().replace(/^@+/, '');
  if (!armedId) return;
  send({ type: 'listen', uniqueId: armedId });
  setStatus(`Bağlanıyor: @${armedId}`);
});

connectBridge();
renderCount();

const clock = new THREE.Clock();
let viewWidth = 0;
let viewHeight = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.2);
  const time = clock.elapsedTime;
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  if (width !== viewWidth || height !== viewHeight) {
    viewWidth = width;
    viewHeight = height;
    stage.resize();
  }
  line.update(time, dt);
  stage.update(time);
  stage.updateCamera(dt);
  stage.render();
  requestAnimationFrame(tick);
}
tick();

window.__halay = {
  join(name) {
    const added = line.addGuest({ id: `manual:${crypto.randomUUID()}`, name });
    renderCount();
    return added;
  },
  guestCount: () => line.guestCount(),
  cap: GUEST_CAP,
  snapshot: () => line.snapshot(),
  focusing: () => stage.isFocusing(),
  releaseFocus: () => stage.releaseFocus(),
  camera: () => ({
    x: stage.camera.position.x,
    y: stage.camera.position.y,
    z: stage.camera.position.z,
    focusing: stage.isFocusing(),
  }),
};

/**
 * Özel oda lobisi — Supabase veya yerel mock.
 * Secret isimleri: SUPABASE_URL, SUPABASE_ANON_KEY (Cursor publish reserved prefix yok).
 */
import { SD_SUPABASE_URL, SD_SUPABASE_ANON_KEY } from './sd-config.js';

const MOCK_KEY = 'sd-rooms-v1';
const PEPPER = 'sd-room-v1:';

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(PEPPER + (password || ''));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function readConfig() {
  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  const url = String(g.SUPABASE_URL || SD_SUPABASE_URL || '').trim();
  const key = String(g.SUPABASE_ANON_KEY || SD_SUPABASE_ANON_KEY || '').trim();
  return { url, key, ready: !!(url && key) };
}

function publicRoom(row) {
  return {
    id: row.id,
    name: row.name,
    has_password: !!(row.has_password ?? row.password_hash),
    status: row.status || 'waiting',
    created_at: row.created_at || new Date().toISOString(),
  };
}

/* ---------- Mock backend (localStorage + storage events) ---------- */
function mockLoad() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]');
  } catch (_) {
    return [];
  }
}
function mockSave(list) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(list));
}

const mockApi = {
  mode: 'mock',
  async list() {
    return mockLoad()
      .filter(r => r.status === 'waiting')
      .map(r => publicRoom(r))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  },
  async create(name, password) {
    const cleaned = String(name || '').trim();
    if (!cleaned || cleaned.length > 40) return { ok: false, error: 'bad_name' };
    if (password && String(password).length > 64) return { ok: false, error: 'bad_password' };
    const row = {
      id: uid(),
      name: cleaned,
      password_hash: password ? await hashPassword(password) : null,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
    const list = mockLoad();
    list.unshift(row);
    mockSave(list);
    return { ok: true, room: publicRoom(row) };
  },
  async join(id, password) {
    const list = mockLoad();
    const row = list.find(r => r.id === id && r.status === 'waiting');
    if (!row) return { ok: false, error: 'not_found' };
    if (row.password_hash) {
      const h = await hashPassword(password || '');
      if (h !== row.password_hash) return { ok: false, error: 'bad_password' };
    }
    return { ok: true, room: publicRoom(row) };
  },
  async close(id) {
    const list = mockLoad();
    const row = list.find(r => r.id === id);
    if (!row) return { ok: false, error: 'not_found' };
    row.status = 'closed';
    mockSave(list);
    return { ok: true };
  },
  subscribe(onChange) {
    const handler = e => {
      if (e.key === MOCK_KEY || e.key === null) onChange();
    };
    window.addEventListener('storage', handler);
    const poll = setInterval(onChange, 4000);
    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(poll);
    };
  },
};

/* ---------- Supabase backend ---------- */
async function makeSupabaseApi(url, key) {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.1');
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    mode: 'supabase',
    async list() {
      const { data, error } = await sb
        .from('rooms_lobby')
        .select('id,name,has_password,status,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(publicRoom);
    },
    async create(name, password) {
      const { data, error } = await sb.rpc('create_room', {
        p_name: name,
        p_password: password || null,
      });
      if (error) throw error;
      return data;
    },
    async join(id, password) {
      const { data, error } = await sb.rpc('join_room', {
        p_id: id,
        p_password: password || null,
      });
      if (error) throw error;
      return data;
    },
    async close(id) {
      const { data, error } = await sb.rpc('close_room', { p_id: id });
      if (error) throw error;
      return data;
    },
    subscribe(onChange) {
      const ch = sb
        .channel('rooms-lobby')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => onChange())
        .subscribe();
      const poll = setInterval(onChange, 12000);
      return () => {
        clearInterval(poll);
        sb.removeChannel(ch);
      };
    },
  };
}

async function createApi() {
  const cfg = readConfig();
  if (!cfg.ready) return mockApi;
  try {
    const api = await makeSupabaseApi(cfg.url, cfg.key);
    // Hızlı sağlık kontrolü — şema yoksa mock'a düş
    await api.list();
    return api;
  } catch (err) {
    console.warn('[odalar] Supabase kullanılamadı, yerel moda düşülüyor:', err);
    return mockApi;
  }
}

/* ---------- UI ---------- */
const ERR = {
  bad_name: 'Oda adı 1–40 karakter olmalı.',
  bad_password: 'Şifre hatalı veya çok uzun.',
  not_found: 'Oda bulunamadı veya kapandı.',
};

function $(id) {
  return document.getElementById(id);
}

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return '';
  }
}

function roomButton(room) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'room-item';
  btn.dataset.id = room.id;
  btn.dataset.locked = room.has_password ? '1' : '0';
  btn.innerHTML =
    `<span class="room-name"></span>` +
    `<span class="room-meta">${room.has_password ? 'Şifreli' : 'Açık'} · ${fmtTime(room.created_at)}</span>`;
  btn.querySelector('.room-name').textContent = room.name;
  return btn;
}

function renderLists(rooms) {
  const open = rooms.filter(r => !r.has_password);
  const locked = rooms.filter(r => r.has_password);
  const openEl = $('roomOpenList');
  const lockEl = $('roomLockList');
  openEl.replaceChildren();
  lockEl.replaceChildren();
  if (!open.length) {
    openEl.innerHTML = '<p class="room-empty">Şu an açık oda yok.</p>';
  } else {
    open.forEach(r => openEl.appendChild(roomButton(r)));
  }
  if (!locked.length) {
    lockEl.innerHTML = '<p class="room-empty">Şu an şifreli oda yok.</p>';
  } else {
    locked.forEach(r => lockEl.appendChild(roomButton(r)));
  }
}

export async function initRoomsLobby() {
  const api = await createApi();
  const modeBadge = $('roomMode');
  if (modeBadge) {
    modeBadge.textContent =
      api.mode === 'supabase' ? 'Supabase bağlı' : 'Yerel liste (Supabase ayarlı değil)';
  }

  const lobby = $('lobby');
  const waiting = $('roomWaiting');
  const pwdDlg = $('roomPwd');
  const errEl = $('roomErr');
  let unsub = null;
  let current = null;
  let currentIsHost = false;
  let pendingJoinId = null;

  function showErr(msg) {
    if (!errEl) return;
    errEl.textContent = msg || '';
    errEl.hidden = !msg;
  }

  async function refresh() {
    try {
      const rooms = await api.list();
      renderLists(rooms);
    } catch (e) {
      showErr('Oda listesi alınamadı.');
      console.warn(e);
    }
  }

  function openLobby() {
    lobby.hidden = false;
    waiting.hidden = true;
    pwdDlg.hidden = true;
    showErr('');
    refresh();
    if (!unsub) unsub = api.subscribe(() => refresh());
  }

  function closeLobby() {
    lobby.hidden = true;
    waiting.hidden = true;
    pwdDlg.hidden = true;
    if (unsub) {
      unsub();
      unsub = null;
    }
  }

  function enterWaiting(room, isHost) {
    current = room;
    currentIsHost = !!isHost;
    lobby.hidden = true;
    pwdDlg.hidden = true;
    waiting.hidden = false;
    $('roomWaitName').textContent = room.name;
    $('roomWaitKind').textContent = room.has_password ? 'Şifreli oda' : 'Açık oda';
    if ($('roomClose')) $('roomClose').hidden = !currentIsHost;
    showErr('');
  }

  $('roomsBtn')?.addEventListener('click', openLobby);
  $('roomBack')?.addEventListener('click', closeLobby);
  $('roomRefresh')?.addEventListener('click', () => refresh());

  $('roomCreate')?.addEventListener('click', async () => {
    showErr('');
    const name = $('roomName')?.value || '';
    const password = $('roomPass')?.value || '';
    const res = await api.create(name, password);
    if (!res?.ok) {
      showErr(ERR[res?.error] || 'Oda oluşturulamadı.');
      return;
    }
    if ($('roomName')) $('roomName').value = '';
    if ($('roomPass')) $('roomPass').value = '';
    await refresh();
    enterWaiting(res.room, true);
  });

  function askPassword(roomId) {
    pendingJoinId = roomId;
    if ($('roomPwdInput')) $('roomPwdInput').value = '';
    pwdDlg.hidden = false;
    $('roomPwdInput')?.focus();
  }

  $('roomPwdCancel')?.addEventListener('click', () => {
    pwdDlg.hidden = true;
    pendingJoinId = null;
  });

  async function submitPassword() {
    const id = pendingJoinId;
    const password = $('roomPwdInput')?.value || '';
    if (!id) return;
    const res = await api.join(id, password);
    if (!res?.ok) {
      showErr(ERR[res?.error] || 'Giriş başarısız.');
      if (res?.error === 'bad_password') return;
      pwdDlg.hidden = true;
      pendingJoinId = null;
      return;
    }
    pwdDlg.hidden = true;
    pendingJoinId = null;
    enterWaiting(res.room, false);
  }
  $('roomPwdOk')?.addEventListener('click', submitPassword);
  $('roomPwdInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitPassword();
    }
  });

  $('roomOpenList')?.addEventListener('click', async e => {
    const btn = e.target.closest('.room-item');
    if (!btn) return;
    showErr('');
    const res = await api.join(btn.dataset.id, null);
    if (!res?.ok) {
      showErr(ERR[res?.error] || 'Odaya girilemedi.');
      await refresh();
      return;
    }
    enterWaiting(res.room, false);
  });

  $('roomLockList')?.addEventListener('click', e => {
    const btn = e.target.closest('.room-item');
    if (!btn) return;
    showErr('');
    askPassword(btn.dataset.id);
  });

  // Lobiye dön: oda listede kalır (diğer oyuncular görsün). Kapatma ayrı.
  $('roomLeave')?.addEventListener('click', () => {
    current = null;
    currentIsHost = false;
    waiting.hidden = true;
    openLobby();
  });

  $('roomClose')?.addEventListener('click', async () => {
    if (current?.id) {
      try {
        await api.close(current.id);
      } catch (_) {}
    }
    current = null;
    currentIsHost = false;
    waiting.hidden = true;
    openLobby();
  });

  // Esc ile kapat
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!pwdDlg.hidden) {
      pwdDlg.hidden = true;
      pendingJoinId = null;
      return;
    }
    if (!waiting.hidden) return;
    if (!lobby.hidden) closeLobby();
  });
}

initRoomsLobby().catch(err => console.warn('[odalar]', err));

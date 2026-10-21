'use strict';

/* ---------- storage (IndexedDB, everything stays on this device) ---------- */

const DB = (() => {
  let dbp;
  function open() {
    dbp = dbp || new Promise((resolve, reject) => {
      const req = indexedDB.open('trip-planner', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction('kv', mode);
      const r = fn(t.objectStore('kv'));
      t.oncomplete = () => resolve(r && r.result);
      t.onerror = () => reject(t.error);
    });
  }
  return {
    get: (k) => tx('readonly', (s) => s.get(k)),
    set: (k, v) => tx('readwrite', (s) => s.put(v, k)),
  };
})();

/* ---------- seed: the first trip ---------- */

const SEED_TRIP = {
  id: 'gz-tao-dlc-2026',
  name: 'กวางโจว ชิงเต่า ต้าเหลียน',
  start: '2026-10-23',
  end: '2026-11-01',
  travelers: 'Prem & Fren',
  color: '#C8372D',
  cities: [
    { code: 'CAN', name: 'กวางโจว' },
    { code: 'TAO', name: 'ชิงเต่า' },
    { code: 'DLC', name: 'ต้าเหลียน' },
  ],
  flights: [
    { id: 'f1', date: '2026-10-23', flightNo: 'CZ8100', airline: 'China Southern', fromCode: 'BKK', fromName: 'สุวรรณภูมิ T1', toCode: 'CAN', toName: 'ไป๋หยุน กวางโจว T2', dep: '13:45', arr: '18:00', duration: '3 ชม. 15 นาที', pnr: '', note: '' },
    { id: 'f2', date: '2026-10-24', flightNo: 'CZ3573', airline: 'China Southern', fromCode: 'CAN', fromName: 'ไป๋หยุน กวางโจว T2', toCode: 'TAO', toName: 'เจียวตง ชิงเต่า', dep: '16:50', arr: '19:50', duration: '3 ชม.', pnr: '', note: '' },
    { id: 'f3', date: '2026-11-01', flightNo: 'MF8090', airline: 'Xiamen Airlines', fromCode: 'DLC', fromName: 'โจวซุ่ยจื่อ ต้าเหลียน', toCode: 'XMN', toName: 'เกาฉี เซียะเหมิน T3', dep: '08:00', arr: '12:10', duration: '4 ชม. 10 นาที', pnr: '', note: 'สายการบินแจ้งว่าเที่ยวบินมีการเปลี่ยนแปลง เช็คเวลาล่าสุดในแอปที่จองอีกครั้ง' },
    { id: 'f4', date: '2026-11-01', flightNo: 'MF833', airline: 'Xiamen Airlines', fromCode: 'XMN', fromName: 'เกาฉี เซียะเหมิน T3', toCode: 'BKK', toName: 'สุวรรณภูมิ', dep: '14:00', arr: '16:35', duration: '3 ชม. 35 นาที', pnr: '', note: 'ต่อเครื่องที่เซียะเหมิน 1 ชม. 50 นาที และต้องผ่าน ตม. ขาออกจีน' },
  ],
  hotels: [
    { id: 'h1', city: 'กวางโจว', name: 'Huifu Apartment (Guangzhou Beijing Road Pedestrian Street Ximenkou Subway Station)', nameZh: '惠福公寓(广州北京路步行街西门口地铁站店)', address: '', room: 'ห้องเตียงควีนไซส์สมาร์ท 1 ห้อง', checkIn: '2026-10-23', checkOut: '2026-10-24', checkInTime: '', checkOutTime: '', confirm: '', phone: '', note: '' },
    { id: 'h2', city: 'ชิงเต่า', name: 'Dreamer Family Homestay (Qingdao Beer Museum)', nameZh: '梦想家亲子民宿(青岛啤酒博物馆店)', address: '', room: 'Light Luxury Dream Loft Exquisite Double Occupancy Room 1 ห้อง', checkIn: '2026-10-24', checkOut: '2026-10-28', checkInTime: '', checkOutTime: '', confirm: '', phone: '', note: '' },
    { id: 'h3', city: 'ต้าเหลียน', name: 'Yuehe Seaview Art Hotel (Dalian Donggang Venice Water City)', nameZh: '悦禾海景艺术酒店(大连东港威尼斯水城店)', address: '', room: 'ห้องควีนดีลักซ์วิวทะเล (วิวทะเล 90°) 1 ห้อง', checkIn: '2026-10-29', checkOut: '2026-11-01', checkInTime: '', checkOutTime: '', confirm: '', phone: '', note: '' },
  ],
  activities: [],
  people: [
    { id: 'p1', name: 'Prem', passportName: '', passportNo: '', passportExp: '', qr: '' },
    { id: 'p2', name: 'Fren', passportName: '', passportNo: '', passportExp: '', qr: '' },
  ],
  notes: [
    { id: 'n1', label: 'ประกันการเดินทาง', value: '' },
    { id: 'n2', label: 'ซิม / eSIM', value: '' },
    { id: 'n3', label: 'เบอร์ฉุกเฉินในจีน', value: 'ตำรวจ 110 · รถพยาบาล 120 · ดับเพลิง 119' },
  ],
  dayTitles: {},
};

let data = { version: 1, trips: [] };

async function load() {
  try {
    const saved = await DB.get('data');
    data = saved && Array.isArray(saved.trips) ? saved : { version: 1, trips: [structuredClone(SEED_TRIP)] };
    if (!saved) await save();
  } catch (e) {
    data = { version: 1, trips: [structuredClone(SEED_TRIP)] };
    toast('บันทึกข้อมูลในเครื่องไม่ได้ (โหมดส่วนตัว?)');
  }
  if (migrate()) await save();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

/* v2: travelers got real names (devices that opened v1 still hold the old placeholders) */
function migrate() {
  if (data.version >= 2) return false;
  const names = { 'ฉัน': 'Prem', 'แฟน': 'Fren' };
  for (const t of data.trips) {
    if (t.travelers === 'ฉัน & แฟน') t.travelers = 'Prem & Fren';
    for (const p of t.people || []) if (names[p.name]) p.name = names[p.name];
  }
  data.version = 2;
  return true;
}

/* pass the trip that changed: it is stamped for sync and pushed shortly after */
async function save(t) {
  if (t) { t.updatedAt = Date.now(); t.edits = (t.edits || 0) + 1; }
  try { await DB.set('data', data); } catch (e) { toast('บันทึกไม่สำเร็จ'); }
  scheduleSync();
}

/* ---------- sync (Supabase, optional; the app works fully without it) ---------- */

const CFG = window.TRIP_CONFIG || {};
const syncReady = () => !!(CFG.supabaseUrl && CFG.supabaseAnonKey && SECRET);
const syncState = {};
// QR images and passport details never leave the device
const LOCAL_ONLY = ['qr', 'passportName', 'passportNo', 'passportExp'];

/* ---------- password: one shared password unlocks the app and keys the sync ---------- */

const KEY_STORE = 'trip-secret';
let SECRET = '';
const needsPassword = () => !!CFG.passwordCheck && !SECRET;
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/* first half checks the password offline, second half is the sync secret (never stored in the repo) */
async function derive(pw) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(CFG.passwordSalt), iterations: 300000, hash: 'SHA-256' }, key, 512);
  return { check: b64url(bits.slice(0, 32)), secret: b64url(bits.slice(32)) };
}
function readStoredSecret() {
  try { SECRET = localStorage.getItem(KEY_STORE) || sessionStorage.getItem(KEY_STORE) || ''; } catch (e) {}
}
async function unlock(pw, remember) {
  const d = await derive(pw);
  if (d.check !== CFG.passwordCheck) return false;
  SECRET = d.secret;
  try { (remember ? localStorage : sessionStorage).setItem(KEY_STORE, SECRET); } catch (e) {}
  return true;
}
function lockApp() {
  try { localStorage.removeItem(KEY_STORE); sessionStorage.removeItem(KEY_STORE); } catch (e) {}
  SECRET = '';
  location.hash = '#/';
  render();
}

async function rpc(fn, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(`${CFG.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: CFG.supabaseAnonKey,
        // legacy anon keys are JWTs and go in Authorization too; new sb_publishable_ keys must not
        ...(CFG.supabaseAnonKey.startsWith('eyJ') ? { Authorization: `Bearer ${CFG.supabaseAnonKey}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  } finally { clearTimeout(timer); }
}

function toRemote(t) {
  const c = structuredClone(t);
  delete c.syncKey; delete c.syncBase; delete c.syncedAt; delete c.edits;
  c.people = (c.people || []).map((p) => { const q = { ...p }; LOCAL_ONLY.forEach((k) => delete q[k]); return q; });
  return c;
}
function fromRemote(remote, local) {
  const t = structuredClone(remote);
  t.people = (t.people || []).map((p) => {
    const lp = (local?.people || []).find((x) => x.id === p.id) || {};
    const q = { ...p };
    LOCAL_ONLY.forEach((k) => { q[k] = lp[k] || ''; });
    return q;
  });
  return t;
}
function putTrip(t) {
  const i = data.trips.findIndex((x) => x.id === t.id);
  if (i >= 0) data.trips[i] = t; else data.trips.push(t);
}
/* take the server copy as is; it also becomes the base for the next merge */
function adopt(t, remote, at) {
  const n = fromRemote(remote, t);
  n.syncBase = structuredClone(remote); n.syncedAt = at; n.updatedAt = at;
  putTrip(n);
}

/* three-way merge against the last synced copy, so edits made on both phones
   (even offline) are kept: lists merge item by item via id, objects field by
   field, and only a field changed on both sides is settled in favour of local */
function same(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => same(a[k], b[k]));
}
const isIdList = (x) => Array.isArray(x) && x.every((o) => o && typeof o === 'object' && 'id' in o);
function merge3(b, l, r) {
  if (same(l, r)) return l;
  if (same(l, b)) return r;
  if (same(r, b)) return l;
  if (isIdList(l) && isIdList(r)) return mergeList(isIdList(b) ? b : [], l, r);
  if (l && r && typeof l === 'object' && typeof r === 'object' && !Array.isArray(l) && !Array.isArray(r)) {
    const o = {}, bb = b && typeof b === 'object' ? b : {};
    for (const k of new Set([...Object.keys(r), ...Object.keys(l)])) {
      const v = merge3(bb[k], l[k], r[k]);
      if (v !== undefined) o[k] = v;
    }
    return o;
  }
  return l;
}
function mergeList(b, l, r) {
  const find = (list, id) => list.find((x) => x.id === id);
  const out = [];
  for (const it of [...r, ...l.filter((x) => !find(r, x.id))]) {
    const bi = find(b, it.id), li = find(l, it.id), ri = find(r, it.id);
    if (li && ri) out.push(merge3(bi, li, ri));
    else if (!bi) out.push(li || ri);                  // added on one side
    else if (li && !same(li, bi)) out.push(li);        // deleted there, edited here: keep
    else if (ri && !same(ri, bi)) out.push(ri);        // deleted here, edited there: keep
  }
  return out;
}

async function syncTrip(id) {
  let t = trip(id);
  if (!syncReady() || !t) return false;
  let changed = false;
  try {
    const res = await rpc('trip_get', { p_id: id, p_secret: SECRET });
    t = trip(id);
    if (!t) return false;
    // edits counts local saves not yet on the server (clock-free, phones' clocks may differ)
    const dirty = !t.syncBase || (t.edits || 0) > 0;
    // both phones start from the built-in trip, so it is the base before the first sync
    const base = t.syncBase || (id === SEED_TRIP.id ? toRemote(SEED_TRIP) : undefined);
    let out = null;
    if (res && res.updated_at !== t.syncedAt) {
      // the other phone saved since our last sync
      if (!dirty) { adopt(t, res.data, res.updated_at); changed = true; }
      else out = merge3(base, toRemote(t), res.data);
    } else if (dirty) out = toRemote(t);
    if (out) {
      const before = t.edits;
      const stamp = Math.max(Date.now(), (res?.updated_at || 0) + 1);
      out.updatedAt = stamp;
      const put = await rpc('trip_put', { p_id: id, p_secret: SECRET, p_data: out, p_updated_at: stamp });
      t = trip(id);
      if (put && put.ok === false) scheduleSync();         // lost a race: merge again with the newer copy
      else if (!t) { /* deleted meanwhile */ }
      else if (t.edits !== before) scheduleSync();         // edited during upload: next round merges it in
      else { adopt(t, out, stamp); changed = true; }
    }
    syncState.ok = true;
  } catch (e) {
    syncState.ok = false;
    throw e;
  }
  return changed;
}

/* which trips exist is itself a synced list, so a trip added or deleted on one phone follows on the other */
const INDEX_ID = '_trips';
async function syncIndex() {
  const res = await rpc('trip_get', { p_id: INDEX_ID, p_secret: SECRET });
  const local = { trips: data.trips.map((t) => ({ id: t.id })) };
  const merged = res ? merge3(data.indexBase, local, res.data) : local;
  let changed = false;
  for (const { id } of merged.trips) {
    if (trip(id)) continue;
    const r = await rpc('trip_get', { p_id: id, p_secret: SECRET });
    if (!r) return false;  // not uploaded yet: leave the list alone this round
    adopt({ id }, r.data, r.updated_at); changed = true;
  }
  const keep = new Set(merged.trips.map((x) => x.id));
  if (data.trips.some((t) => !keep.has(t.id))) { data.trips = data.trips.filter((t) => keep.has(t.id)); changed = true; }
  if (!res || !same(merged, res.data)) {
    const put = await rpc('trip_put', { p_id: INDEX_ID, p_secret: SECRET, p_data: merged, p_updated_at: Math.max(Date.now(), (res?.updated_at || 0) + 1) });
    if (put && put.ok === false) { scheduleSync(); return changed; }
  }
  const baseMoved = !same(data.indexBase, merged);
  data.indexBase = merged;
  return changed || baseMoved;
}

let syncing = false;
async function syncAll() {
  if (!syncReady() || syncing) return;
  syncing = true;
  let changed = false;
  try {
    // trips first, so a new trip is on the server before the list points to it
    for (const t of [...data.trips]) changed = (await syncTrip(t.id)) || changed;
    changed = (await syncIndex()) || changed;
    syncState.error = '';
  } catch (e) {
    syncState.ok = false; syncState.error = String(e.message || e).slice(0, 300);
  }
  syncState.at = Date.now(); syncState.offline = !navigator.onLine;
  syncing = false;
  if (changed) { try { await DB.set('data', data); } catch (e) {} }
  if (!document.querySelector('dialog[open]')) render();
}
let syncTimer;
function scheduleSync() {
  if (!syncReady()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncAll, 800);
}
function syncLabel() {
  if (!syncReady()) return '';
  if (!syncState.at) return 'กำลังซิงก์…';
  const hm = new Date(syncState.at).toTimeString().slice(0, 5);
  return syncState.ok ? `ซิงก์แล้ว ${hm}` : syncState.offline ? 'ออฟไลน์ · จะซิงก์เมื่อมีเน็ต' : 'ซิงก์ไม่สำเร็จ · จะลองใหม่';
}

/* ---------- helpers ---------- */

const $app = document.getElementById('app');
const uid = () => Math.random().toString(36).slice(2, 10);
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function parseD(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function isoD(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
function todayISO() { return isoD(new Date()); }
function addDays(s, n) { const dt = parseD(s); dt.setDate(dt.getDate() + n); return isoD(dt); }
function diffDays(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
function fmtD(s, withDow = true) { if (!s) return ''; const dt = parseD(s); return `${withDow ? DOW[dt.getDay()] + ' ' : ''}${dt.getDate()} ${MON[dt.getMonth()]}`; }
function fmtRange(a, b) { return a && b ? `${fmtD(a, false)} – ${fmtD(b, false)}` : '[ยังไม่ระบุวัน]'; }
function tripDays(t) { const out = []; if (!t.start || !t.end) return out; for (let d = t.start; d <= t.end; d = addDays(d, 1)) out.push(d); return out; }
function nights(hh) { return hh.checkIn && hh.checkOut ? Math.max(0, diffDays(hh.checkIn, hh.checkOut)) : 0; }
function trip(id) { return data.trips.find((t) => t.id === id); }
function byTime(a, b) { return (a.date || '').localeCompare(b.date || '') || (a.dep || a.time || '').localeCompare(b.dep || b.time || ''); }
function amap(q) { return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}`; }
function apple(q) { return `https://maps.apple.com/?q=${encodeURIComponent(q)}`; }

function countdown(t) {
  const today = todayISO();
  if (!t.start) return '';
  if (today < t.start) { const n = diffDays(today, t.start); return n === 1 ? 'พรุ่งนี้!' : `อีก ${n} วัน`; }
  if (today <= t.end) return `กำลังเที่ยว · วันที่ ${diffDays(t.start, today) + 1}`;
  return 'จบแล้ว';
}

function hotelForNight(t, d) { return t.hotels.find((x) => x.checkIn && x.checkOut && x.checkIn <= d && d < x.checkOut); }

/* what happens on one day: flights, check-in/out, own activities, plus gaps worth warning about */
function dayInfo(t, d) {
  const items = [];
  const flights = t.flights.filter((f) => f.date === d).sort(byTime);
  const firstFlightId = [...t.flights].sort(byTime)[0]?.id;
  flights.forEach((f) => items.push({ kind: 'flight', sort: f.dep || '12:00', time: f.dep, f, first: f.id === firstFlightId }));
  t.hotels.filter((x) => x.checkOut === d).forEach((x) => items.push({ kind: 'out', sort: x.checkOutTime || '00:01', time: x.checkOutTime, x }));
  t.hotels.filter((x) => x.checkIn === d).forEach((x) => items.push({ kind: 'in', sort: x.checkInTime || '23:58', time: x.checkInTime, x }));
  t.activities.filter((a) => a.date === d).forEach((a) => items.push({ kind: 'act', sort: a.time || '23:59', time: a.time, a }));
  items.sort((a, b) => a.sort.localeCompare(b.sort));

  const stay = hotelForNight(t, d);
  const warnings = [];
  if (d < t.end && !stay) warnings.push('ยังไม่มีที่พักคืนนี้');
  const prev = [...tripDays(t)].filter((x) => x < d).reverse().map((x) => hotelForNight(t, x)).find(Boolean);
  const moves = flights.length || t.activities.some((a) => a.date === d && a.type === 'เดินทาง');
  if (stay && prev && prev.city !== stay.city && !moves) warnings.push(`ยังไม่มีการเดินทาง ${prev.city} → ${stay.city}`);

  const city = stay ? stay.city : d === t.end ? 'เดินทางกลับ' : '';
  const auto = flights.length ? flights.map((f) => `บิน ${f.fromCode} → ${f.toCode}`).join(' · ')
    : t.activities.find((a) => a.date === d)?.title || 'ยังไม่มีแผน';
  return { items, stay, warnings, city, title: t.dayTitles[d] || auto, count: items.length };
}

/* ---------- icons ---------- */

const svg = (p, w = 2) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ic = {
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  back: svg('<path d="M15 6l-6 6 6 6"/>'),
  next: svg('<path d="M9 6l6 6-6 6"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  qr: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-7"/>', 1.8),
  plane: svg('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>', 1.8),
  home: svg('<path d="M3 20V8l9-5 9 5v12"/><path d="M9 20v-6h6v6"/>', 1.8),
  pin: svg('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  more: svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', 2.5),
  sync: svg('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>'),
  car: svg('<path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>', 1.8),
};

/* ---------- views ---------- */

function viewHome() {
  const today = todayISO();
  const upcoming = data.trips.filter((t) => !t.end || t.end >= today).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const past = data.trips.filter((t) => t.end && t.end < today).sort((a, b) => b.start.localeCompare(a.start));
  const main = upcoming[0];
  return `<main class="screen">
    <header class="bar">
      <div class="grow stack-s"><span class="eyebrow">Prem &amp; Fren</span><h1 class="title-xl">ทริปของเรา</h1></div>
      <button class="icon-btn" data-act="backupMenu" aria-label="สำรอง / นำเข้าข้อมูล">${ic.more}</button>
      <button class="icon-btn dark" data-act="newTrip" aria-label="เพิ่มทริปใหม่">${ic.plus}</button>
    </header>
    ${main ? `<section class="stack">
      <h2 class="section-label">กำลังจะถึง</h2>
      ${tripCard(main)}
      <div class="grid-3">
        <a class="card quick" href="#/t/${main.id}/qr">${ic.qr}<span class="small bold">QR ตม.</span></a>
        <a class="card quick" href="#/t/${main.id}/docs/flight">${ic.plane}<span class="small bold">ตั๋วเครื่องบิน</span></a>
        <a class="card quick" href="#/t/${main.id}/docs/hotel">${ic.home}<span class="small bold">ที่พัก</span></a>
      </div>
    </section>` : ''}
    <section class="stack">
      <h2 class="section-label">ทริปถัดไป</h2>
      ${upcoming.slice(1).map(tripCard).join('')}
      <button class="empty-add" data-act="newTrip"><span class="plus">${ic.plus}</span>
        <span class="stack-s"><span class="bold" style="color:var(--ink)">วางแผนทริปใหม่</span><span class="small">${upcoming.length > 1 ? 'เพิ่มอีกทริป' : 'ยังไม่มีทริปอื่น'}</span></span></button>
    </section>
    <section class="stack">
      <h2 class="section-label">ทริปที่ผ่านมา</h2>
      ${past.length ? past.map((t) => `<a class="card day-row" href="#/t/${t.id}"><span class="grow stack-s" style="flex:1"><span class="bold">${h(t.name)}</span><span class="small muted">${fmtRange(t.start, t.end)}</span></span>${ic.next}</a>`).join('')
        : '<p class="small muted">ทริปที่จบแล้วจะย้ายมาเก็บไว้ที่นี่</p>'}
    </section>
    <p class="tiny muted" style="text-align:center">ข้อมูลทั้งหมดเก็บไว้ในเครื่องนี้ และใช้งานได้แม้ไม่มีอินเทอร์เน็ต</p>
  </main>`;
}

function tripCard(t) {
  const codes = (t.cities || []).map((c) => `<span>${h(c.code || c.name)}</span>`).join('<span class="dash"></span>');
  return `<a class="card trip-card" href="#/t/${t.id}">
    <div class="hero" style="background:${h(t.color)}">
      <div class="row between"><span class="pill-glass">${countdown(t)}</span><span class="small">${tripDays(t).length} วัน · ${(t.cities || []).length} เมือง</span></div>
      <div style="font-size:24px;font-weight:700;line-height:1.3">${h(t.name)}</div>
      ${codes ? `<div class="route">${codes}</div>` : ''}
    </div>
    <div class="row between small muted" style="padding:14px 20px"><span>${fmtRange(t.start, t.end)}</span><span class="row bold" style="gap:4px;color:var(--ink)">เปิดทริป ${ic.next}</span></div>
  </a>`;
}

function tripHead(t) {
  return `<header class="trip-head">
    <div class="row between">
      <a class="icon-btn glass" href="#/" aria-label="กลับหน้าแรก">${ic.back}</a>
      <span class="row" style="gap:8px">
        ${syncReady() ? `<button class="icon-btn glass" data-act="syncMenu" aria-label="ซิงก์กับอีกเครื่อง">${ic.sync}</button>` : ''}
        <button class="icon-btn glass" data-act="editTrip" data-id="${t.id}" aria-label="แก้ไขทริป">${ic.edit}</button>
      </span>
    </div>
    <div class="stack-s"><h1 class="title-l" style="font-size:26px">${h(t.name)}</h1><span class="small">${fmtRange(t.start, t.end)} · ${h(t.travelers)} · ${countdown(t)}</span>${syncReady() ? `<span class="tiny">${syncLabel()}</span>` : ''}</div>
    ${(t.cities || []).length ? `<div class="grid-3">${t.cities.map((c) => {
      const n = t.hotels.filter((x) => x.city === c.name).reduce((s, x) => s + nights(x), 0);
      return `<div class="city-tile"><span class="code">${h(c.code || '—')}</span><span class="small">${h(c.name)}</span><span class="tiny">${n} คืน</span></div>`;
    }).join('')}</div>` : ''}
  </header>`;
}

function tabs(t, active) {
  return `<nav class="tabs" aria-label="ส่วนของทริป">
    <a href="#/t/${t.id}" ${active === 'plan' ? 'aria-current="page"' : ''}>แผนรายวัน</a>
    <a href="#/t/${t.id}/docs" ${active === 'docs' ? 'aria-current="page"' : ''}>ข้อมูลสำคัญ</a>
  </nav>`;
}

function viewTrip(t) {
  const days = tripDays(t);
  const groups = [];
  days.forEach((d, i) => {
    const info = dayInfo(t, d);
    const label = info.city || 'ระหว่างทาง';
    if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, days: [] });
    groups[groups.length - 1].days.push({ d, i, info });
  });
  return `<div class="screen flush">
    ${tripHead(t)}
    <div class="pad stack" style="gap:20px">
      ${tabs(t, 'plan')}
      ${days.length ? '' : '<p class="muted">ใส่วันไป–วันกลับของทริปก่อน แล้วรายการวันจะขึ้นที่นี่</p>'}
      ${groups.map((g) => `<section class="stack">
        <div class="row between"><h2 class="h2">${h(g.label)}</h2><span class="small muted">${fmtRange(g.days[0].d, g.days[g.days.length - 1].d)}</span></div>
        ${g.days.map(({ d, i, info }) => `<a class="card day-row" href="#/t/${t.id}/d/${d}">
          <span class="day-badge"><span class="l">วันที่</span><span class="n">${i + 1}</span></span>
          <span class="stack-s" style="flex:1;min-width:0"><span class="bold">${h(info.title)}</span><span class="small muted">${fmtD(d)} · ${info.count} รายการ</span></span>
          ${info.warnings.length ? '<span class="dot-warn" title="มีเรื่องต้องเช็ค"></span>' : ''}${ic.next}
        </a>`).join('')}
      </section>`).join('')}
      ${days.length ? `<button class="btn dashed block" data-act="addAct" data-id="${t.id}" data-date="${t.start}">+ เพิ่มกิจกรรม</button>` : ''}
    </div>
  </div>`;
}

function viewDay(t, d) {
  const days = tripDays(t);
  const idx = days.indexOf(d);
  if (idx < 0) return viewTrip(t);
  const info = dayInfo(t, d);
  const s = info.stay;
  return `<div class="screen flush" style="padding-top:calc(16px + var(--safe-top))">
    <header class="bar pad">
      <a class="icon-btn" href="#/t/${t.id}" aria-label="กลับไปภาพรวมทริป">${ic.back}</a>
      <div class="grow stack-s"><span class="eyebrow">${h(info.city || '—')} · ${fmtD(d)}</span><h1 class="title-l">วันที่ ${idx + 1} · ${h(info.title)}</h1></div>
      <button class="icon-btn" data-act="editDayTitle" data-id="${t.id}" data-date="${d}" aria-label="ตั้งชื่อวันนี้">${ic.edit}</button>
    </header>
    <nav class="pills" aria-label="เลือกวัน">
      ${days.map((x, i) => `<a class="pill-day" href="#/t/${t.id}/d/${x}" ${x === d ? 'aria-current="page"' : ''}><span class="l">${fmtD(x, false).split(' ')[1]}</span><span class="n">${parseD(x).getDate()}</span></a>`).join('')}
    </nav>
    <div class="pad stack">
      ${info.warnings.map((w) => `<div class="warn">${h(w)}</div>`).join('')}
      ${s ? `<div class="card pad-s row">
        <span style="color:var(--ink)">${ic.home}</span>
        <span class="stack-s" style="flex:1;min-width:0"><span class="tiny muted">คืนนี้พักที่</span><span class="bold" style="font-size:14px">${h(s.name)}</span></span>
        <a class="link-accent" href="#/t/${t.id}/taxi/${s.id}">โชว์ที่อยู่</a>
      </div>` : ''}
    </div>
    <div class="pad">
      ${info.items.length ? `<ol class="timeline" aria-label="กิจกรรมของวัน">${info.items.map((it) => timelineItem(t, it)).join('')}</ol>`
        : '<p class="muted" style="padding:8px 0 16px">ยังไม่มีแผนของวันนี้</p>'}
      <button class="btn primary block" data-act="addAct" data-id="${t.id}" data-date="${d}">+ เพิ่มกิจกรรม</button>
    </div>
  </div>`;
}

function timelineItem(t, it) {
  let kind, title, note, actions = '', accent = false;
  if (it.kind === 'flight') {
    const f = it.f; accent = true;
    kind = 'เที่ยวบิน'; title = `${f.flightNo} ${f.fromCode} → ${f.toCode}`;
    note = `${f.dep}–${f.arr}${f.duration ? ` (${f.duration})` : ''} · ${f.fromName} → ${f.toName}`;
    actions = `<a class="btn" href="#/t/${t.id}/docs/flight">ดูตั๋ว</a>${it.first ? `<a class="btn" href="#/t/${t.id}/qr">QR ตม.</a>` : ''}`;
    if (f.note) note += `\n${f.note}`;
  } else if (it.kind === 'in' || it.kind === 'out') {
    const x = it.x;
    kind = it.kind === 'in' ? 'เช็คอิน' : 'เช็คเอาท์'; title = x.name; note = x.nameZh;
    actions = `<a class="btn" href="${amap(x.nameZh || x.name)}" target="_blank" rel="noopener">${ic.pin} แผนที่</a><a class="btn" href="#/t/${t.id}/taxi/${x.id}">${ic.car} โชว์ที่อยู่</a>`;
  } else {
    const a = it.a;
    kind = a.type || 'กิจกรรม'; title = a.title; note = [a.place, a.note].filter(Boolean).join('\n');
    actions = `${a.place ? `<a class="btn" href="${amap(a.place)}" target="_blank" rel="noopener">${ic.pin} แผนที่</a>` : ''}<button class="btn" data-act="editAct" data-id="${t.id}" data-aid="${a.id}">${ic.edit} แก้ไข</button>`;
  }
  return `<li class="tl-item">
    <div class="tl-time">${h(it.time || '')}</div>
    <div class="tl-rail"><span class="dot ${accent ? 'accent' : ''}"></span><span class="line"></span></div>
    <div class="card tl-card">
      <span class="chip">${h(kind)}</span>
      <span class="bold">${h(title)}</span>
      ${note ? `<span class="small muted" style="white-space:pre-line">${h(note)}</span>` : ''}
      <div class="tl-actions">${actions}</div>
    </div>
  </li>`;
}

const FILTERS = [['all', 'ทั้งหมด'], ['qr', 'ตม.'], ['flight', 'ตั๋วเครื่องบิน'], ['hotel', 'ที่พัก'], ['other', 'อื่น ๆ']];

function viewDocs(t, filter) {
  const f = FILTERS.some(([id]) => id === filter) ? filter : 'all';
  const show = (k) => f === 'all' || f === k;
  return `<div class="screen flush">
    ${tripHead(t)}
    <div class="pad stack" style="gap:20px">
      ${tabs(t, 'docs')}
      <div class="filters" role="group" aria-label="กรองประเภท">
        ${FILTERS.map(([id, label]) => `<a class="filter row" href="#/t/${t.id}/docs/${id}" aria-pressed="${f === id}">${label}</a>`).join('')}
      </div>

      ${show('qr') ? `<section class="stack">
        <div class="row between"><h2 class="h2">ตม. / ผู้เดินทาง</h2><button class="link-accent" data-act="addPerson" data-id="${t.id}">+ เพิ่มคน</button></div>
        <div class="grid-2">${t.people.map((p) => `<a class="qr-tile" href="#/t/${t.id}/qr/${p.id}">${ic.qr}<span class="bold">QR ตม. · ${h(p.name)}</span><span class="sub">${p.qr ? 'แตะเพื่อเปิดเต็มจอ' : 'ยังไม่ได้ใส่รูป QR'}</span></a>`).join('')}</div>
        <div class="card">${t.people.map((p) => `<button class="kv" style="width:100%;background:none;border-left:0;border-right:0;border-top:0;text-align:left" data-act="editPerson" data-id="${t.id}" data-pid="${p.id}">
          <span class="bold">${h(p.name)}</span><span class="v">${p.passportNo ? `พาสปอร์ต ${h(p.passportNo)}${p.passportExp ? `\nหมดอายุ ${fmtD(p.passportExp, false)} ${parseD(p.passportExp).getFullYear()}` : ''}` : 'ใส่ข้อมูลพาสปอร์ต'}</span></button>`).join('')}</div>
      </section>` : ''}

      ${show('flight') ? `<section class="stack">
        <div class="row between"><h2 class="h2">ตั๋วเครื่องบิน</h2><button class="link-accent" data-act="addFlight" data-id="${t.id}">+ เพิ่มเที่ยวบิน</button></div>
        ${[...t.flights].sort(byTime).map((fl) => `<article class="card pass">
          <div class="top">
            <div class="row between tiny muted"><span>${fmtD(fl.date)} · ${h(fl.airline)}</span><span>${h(fl.duration)}</span></div>
            <div class="codes">
              <span class="stack-s"><span class="code">${h(fl.fromCode)}</span><span class="bold">${h(fl.dep)}</span><span class="tiny muted">${h(fl.fromName)}</span></span>
              <span class="mid"><span class="ln"></span>${ic.plane}<span class="ln"></span></span>
              <span class="stack-s" style="align-items:flex-end;text-align:right"><span class="code">${h(fl.toCode)}</span><span class="bold">${h(fl.arr)}</span><span class="tiny muted">${h(fl.toName)}</span></span>
            </div>
            ${fl.note ? `<div class="warn">${h(fl.note)}</div>` : ''}
          </div>
          <div class="bottom">
            <span class="muted">เที่ยวบิน <b style="color:var(--ink)">${h(fl.flightNo)}</b> · PNR ${fl.pnr ? `<button class="link-accent" style="padding:0" data-act="copy" data-text="${h(fl.pnr)}">${h(fl.pnr)}</button>` : '<span>—</span>'}</span>
            <button class="link-accent" data-act="editFlight" data-id="${t.id}" data-fid="${fl.id}">แก้ไข</button>
          </div>
        </article>`).join('') || '<p class="muted small">ยังไม่มีเที่ยวบิน</p>'}
      </section>` : ''}

      ${show('hotel') ? `<section class="stack">
        <div class="row between"><h2 class="h2">ที่พัก</h2><button class="link-accent" data-act="addHotel" data-id="${t.id}">+ เพิ่มที่พัก</button></div>
        ${[...t.hotels].sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || '')).map((x) => `<article class="card pad-m stack" style="gap:8px">
          <div class="row between"><span class="chip">${h(x.city || 'ที่พัก')}</span><span class="tiny muted">${fmtRange(x.checkIn, x.checkOut)} · ${nights(x)} คืน</span></div>
          <span class="bold" style="font-size:16px">${h(x.name)}</span>
          ${x.nameZh ? `<button class="row small muted" style="background:none;border:0;padding:0;text-align:left;gap:6px" data-act="copy" data-text="${h(x.nameZh)}">${h(x.nameZh)} ${ic.copy}</button>` : ''}
          ${x.address ? `<span class="small muted">${h(x.address)}</span>` : ''}
          ${x.room ? `<span class="small">${h(x.room)}</span>` : ''}
          ${x.confirm ? `<span class="small muted">เลขยืนยัน: <b style="color:var(--ink)">${h(x.confirm)}</b></span>` : ''}
          ${x.phone ? `<a class="small link-accent" style="padding:0" href="tel:${h(x.phone)}">โทร ${h(x.phone)}</a>` : ''}
          ${x.note ? `<span class="small muted" style="white-space:pre-line">${h(x.note)}</span>` : ''}
          <div class="row wrap" style="gap:8px">
            <a class="btn flex1" href="#/t/${t.id}/taxi/${x.id}">${ic.car} โชว์ที่อยู่</a>
            <a class="btn flex1" href="${amap(x.nameZh || x.name)}" target="_blank" rel="noopener">高德 Amap</a>
            <a class="btn flex1" href="${apple(x.nameZh || x.name)}" target="_blank" rel="noopener">Apple Maps</a>
            <button class="btn" data-act="editHotel" data-id="${t.id}" data-hid="${x.id}" aria-label="แก้ไขที่พัก">${ic.edit}</button>
          </div>
        </article>`).join('') || '<p class="muted small">ยังไม่มีที่พัก</p>'}
      </section>` : ''}

      ${show('other') ? `<section class="stack">
        <div class="row between"><h2 class="h2">อื่น ๆ</h2><button class="link-accent" data-act="addNote" data-id="${t.id}">+ เพิ่ม</button></div>
        <div class="card">${t.notes.map((n) => `<button class="kv" style="width:100%;background:none;border-left:0;border-right:0;border-top:0;text-align:left" data-act="editNote" data-id="${t.id}" data-nid="${n.id}"><span>${h(n.label)}</span><span class="v">${h(n.value) || '—'}</span></button>`).join('') || '<p class="kv muted">ยังไม่มีข้อมูล</p>'}</div>
      </section>` : ''}
    </div>
  </div>`;
}

function viewQR(t, pid) {
  const p = t.people.find((x) => x.id === pid) || t.people[0];
  if (!p) return viewDocs(t, 'qr');
  return `<main class="full-dark"><div class="screen">
    <header class="bar"><h1 class="title-l grow">QR ตม. จีน</h1><a class="icon-btn glass" href="#/t/${t.id}/docs/qr" aria-label="ปิด">${ic.x}</a></header>
    <div class="seg" role="group" aria-label="เลือกผู้เดินทาง">${t.people.map((x) => `<button data-act="goQR" data-id="${t.id}" data-pid="${x.id}" aria-pressed="${x.id === p.id}">${h(x.name)}</button>`).join('')}</div>
    <div class="qr-box">
      ${p.qr ? `<img src="${p.qr}" alt="QR ตม. ของ ${h(p.name)}">` : `<button class="qr-empty" data-act="editPerson" data-id="${t.id}" data-pid="${p.id}"><span style="transform:scale(2)">${ic.qr}</span><span class="small bold" style="margin-top:12px">แตะเพื่อใส่รูป QR ของ${h(p.name)}</span></button>`}
      <div class="stack-s" style="align-items:center;text-align:center">
        <span class="bold" style="font-size:18px;letter-spacing:.02em">${h(p.passportName || p.name)}</span>
        ${p.passportNo ? `<span class="small muted">พาสปอร์ต ${h(p.passportNo)}</span>` : ''}
      </div>
    </div>
    <p class="small" style="text-align:center;color:#C9D1DA">เปิดความสว่างหน้าจอสูงสุดก่อนยื่นให้เจ้าหน้าที่</p>
    <button class="btn block" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3)" data-act="editPerson" data-id="${t.id}" data-pid="${p.id}">${p.qr ? 'เปลี่ยนรูป QR / แก้ข้อมูล' : 'ใส่รูป QR / ข้อมูลพาสปอร์ต'}</button>
  </div></main>`;
}

function viewTaxi(t, hid) {
  const x = t.hotels.find((y) => y.id === hid);
  if (!x) return viewDocs(t, 'hotel');
  return `<main class="taxi"><div class="screen">
    <header class="bar"><span class="grow eyebrow">โชว์ให้คนขับดู</span><button class="icon-btn" data-act="back" aria-label="ปิด">${ic.x}</button></header>
    <p class="bold" style="font-size:22px">请带我去这里</p>
    <p class="zh">${h(x.nameZh || x.name)}</p>
    ${x.address ? `<p class="zh-addr">${h(x.address)}</p>` : ''}
    ${x.phone ? `<p class="zh-addr">电话 ${h(x.phone)}</p>` : ''}
    <p class="muted">${h(x.name)}</p>
    <div class="grid-2">
      <a class="btn" href="${amap(x.nameZh || x.name)}" target="_blank" rel="noopener">高德 Amap</a>
      <a class="btn" href="${apple(x.nameZh || x.name)}" target="_blank" rel="noopener">Apple Maps</a>
    </div>
  </div></main>`;
}

/* ---------- forms (bottom sheet) ---------- */

const COLORS = [['#C8372D', 'แดง'], ['#1F5FAD', 'น้ำเงิน'], ['#1E7A5A', 'เขียว'], ['#7A3E9D', 'ม่วง'], ['#14202B', 'กรมท่า']];
const ACT_TYPES = ['เที่ยว', 'กิน', 'เดินทาง', 'ช้อปปิ้ง', 'อื่น ๆ'];

function fieldHTML(f, v) {
  const id = `f-${f.k}`;
  const cls = `field${f.half ? ' half' : ''}`;
  const ph = f.ph ? ` placeholder="${h(f.ph)}"` : '';
  if (f.t === 'select') {
    return `<div class="${cls}"><label for="${id}">${h(f.l)}</label><select id="${id}" name="${f.k}">${f.options.map(([val, lab]) => `<option value="${h(val)}" ${val === v ? 'selected' : ''}>${h(lab)}</option>`).join('')}</select></div>`;
  }
  if (f.t === 'textarea') return `<div class="${cls}"><label for="${id}">${h(f.l)}</label><textarea id="${id}" name="${f.k}"${ph}>${h(v)}</textarea></div>`;
  if (f.t === 'color') {
    return `<fieldset class="${cls}" style="border:0;margin:0;padding:0"><legend class="lbl" style="padding:0;margin-bottom:6px">${h(f.l)}</legend><div class="swatches">${COLORS.map(([hex, name]) => `<label><input type="radio" name="${f.k}" value="${hex}" ${hex === (v || COLORS[0][0]) ? 'checked' : ''} aria-label="${name}"><span style="background:${hex}"></span></label>`).join('')}</div></fieldset>`;
  }
  if (f.t === 'image') {
    return `<div class="${cls}"><label for="${id}">${h(f.l)}</label>
      ${v ? `<img src="${v}" alt="" style="width:120px;border-radius:8px;border:1px solid var(--line)"><label class="row small"><input type="checkbox" name="${f.k}__remove" style="width:20px;min-height:20px"> ลบรูปเดิม</label>` : ''}
      <input id="${id}" type="file" name="${f.k}" accept="image/*"></div>`;
  }
  return `<div class="${cls}"><label for="${id}">${h(f.l)}${f.req ? ' *' : ''}</label><input id="${id}" name="${f.k}" type="${f.t || 'text'}" value="${h(v)}"${ph}${f.t === 'text' || !f.t ? ' autocomplete="off"' : ''}></div>`;
}

function openSheet({ title, fields, values = {}, submit = 'บันทึก', onSave, onDelete }) {
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet';
  dlg.innerHTML = `<form novalidate>
    <div class="sheet-head"><h2 class="h2">${h(title)}</h2><button type="button" class="icon-btn" data-close aria-label="ปิด">${ic.x}</button></div>
    <div class="sheet-body">${fields.map((f) => fieldHTML(f, values[f.k])).join('')}</div>
    <div class="sheet-foot">${onDelete ? '<button type="button" class="btn danger" data-del>ลบ</button>' : ''}<button type="submit" class="btn primary flex1">${h(submit)}</button></div>
  </form>`;
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.querySelector('[data-close]').onclick = () => dlg.close();
  if (onDelete) dlg.querySelector('[data-del]').onclick = async () => { if (confirm('ลบรายการนี้?')) { await onDelete(); dlg.close(); } };
  dlg.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const out = {};
    for (const f of fields) {
      if (f.t === 'image') {
        const file = fd.get(f.k);
        if (file && file.size) out[f.k] = await imageToDataURL(file);
        else out[f.k] = fd.get(`${f.k}__remove`) ? '' : values[f.k] || '';
      } else out[f.k] = String(fd.get(f.k) ?? '').trim();
      if (f.req && !out[f.k]) { dlg.querySelector(`[name="${f.k}"]`).focus(); toast(`กรุณาใส่${f.l}`); return; }
    }
    await onSave(out);
    dlg.close();
  };
  dlg.showModal();
}

function openMenu(title, items) {
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet';
  dlg.innerHTML = `<form method="dialog">
    <div class="sheet-head"><h2 class="h2">${h(title)}</h2><button class="icon-btn" aria-label="ปิด">${ic.x}</button></div>
    <div class="sheet-body" style="flex-direction:column;flex-wrap:nowrap">${items.map((it, i) => `<button type="button" class="btn block" data-i="${i}" style="justify-content:flex-start;padding:0 16px">${h(it.label)}</button>${it.hint ? `<p class="tiny muted" style="margin-top:-8px">${h(it.hint)}</p>` : ''}`).join('')}</div>
  </form>`;
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return dlg.close();
    const b = e.target.closest('[data-i]');
    if (b) { dlg.close(); items[+b.dataset.i].run(); }
  });
  dlg.showModal();
}

/* QR screenshots are kept sharp: scale down only when huge, store as PNG */
function imageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1200;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านรูปไม่ได้')); };
    img.src = url;
  });
}

const TRIP_FIELDS = [
  { k: 'name', l: 'ชื่อทริป', req: true, ph: 'เช่น ญี่ปุ่น ฤดูใบไม้ผลิ' },
  { k: 'start', l: 'วันไป', t: 'date', half: true, req: true },
  { k: 'end', l: 'วันกลับ', t: 'date', half: true, req: true },
  { k: 'citiesText', l: 'เมือง (เรียงตามลำดับ คั่นด้วย ,  ใส่รหัสสนามบินในวงเล็บได้)', ph: 'โตเกียว (NRT), โอซาก้า (KIX)' },
  { k: 'travelers', l: 'ผู้ร่วมเดินทาง', ph: 'Prem & Fren' },
  { k: 'color', l: 'สีประจำทริป', t: 'color' },
];
const FLIGHT_FIELDS = [
  { k: 'date', l: 'วันที่', t: 'date', half: true, req: true },
  { k: 'flightNo', l: 'เลขเที่ยวบิน', half: true, ph: 'CZ8100' },
  { k: 'fromCode', l: 'ต้นทาง (รหัส)', half: true, ph: 'BKK' },
  { k: 'toCode', l: 'ปลายทาง (รหัส)', half: true, ph: 'CAN' },
  { k: 'dep', l: 'เวลาออก', t: 'time', half: true },
  { k: 'arr', l: 'เวลาถึง', t: 'time', half: true },
  { k: 'fromName', l: 'สนามบินต้นทาง / อาคาร' },
  { k: 'toName', l: 'สนามบินปลายทาง / อาคาร' },
  { k: 'airline', l: 'สายการบิน', half: true },
  { k: 'duration', l: 'ระยะเวลาบิน', half: true, ph: '3 ชม. 15 นาที' },
  { k: 'pnr', l: 'รหัสสำรองที่นั่ง (PNR)' },
  { k: 'note', l: 'โน้ต', t: 'textarea' },
];
const HOTEL_FIELDS = [
  { k: 'city', l: 'เมือง', req: true },
  { k: 'name', l: 'ชื่อที่พัก', req: true },
  { k: 'nameZh', l: 'ชื่อภาษาท้องถิ่น (ไว้ค้นแผนที่ / โชว์แท็กซี่)' },
  { k: 'address', l: 'ที่อยู่ภาษาท้องถิ่น', t: 'textarea' },
  { k: 'checkIn', l: 'เช็คอิน', t: 'date', half: true },
  { k: 'checkOut', l: 'เช็คเอาท์', t: 'date', half: true },
  { k: 'checkInTime', l: 'เวลาเช็คอิน', t: 'time', half: true },
  { k: 'checkOutTime', l: 'เวลาเช็คเอาท์', t: 'time', half: true },
  { k: 'room', l: 'ห้อง' },
  { k: 'confirm', l: 'เลขยืนยันการจอง', half: true },
  { k: 'phone', l: 'เบอร์โทรที่พัก', t: 'tel', half: true },
  { k: 'note', l: 'โน้ต', t: 'textarea' },
];
const PERSON_FIELDS = [
  { k: 'name', l: 'ชื่อเรียก', req: true },
  { k: 'qr', l: 'รูป QR ตม. (แคปหน้าจอจากแอป/เว็บ ตม.)', t: 'image' },
  { k: 'passportName', l: 'ชื่อตามพาสปอร์ต' },
  { k: 'passportNo', l: 'เลขพาสปอร์ต', half: true },
  { k: 'passportExp', l: 'วันหมดอายุ', t: 'date', half: true },
];
const NOTE_FIELDS = [
  { k: 'label', l: 'หัวข้อ', req: true },
  { k: 'value', l: 'รายละเอียด', t: 'textarea' },
];
function actFields(t) {
  return [
    { k: 'date', l: 'วัน', t: 'select', options: tripDays(t).map((d, i) => [d, `วันที่ ${i + 1} · ${fmtD(d)}`]) },
    { k: 'time', l: 'เวลา', t: 'time', half: true },
    { k: 'type', l: 'ประเภท', t: 'select', half: true, options: ACT_TYPES.map((x) => [x, x]) },
    { k: 'title', l: 'ทำอะไร', req: true, ph: 'เช่น เดินถนนปักกิ่ง' },
    { k: 'place', l: 'สถานที่ (ชื่อจีนจะค้นแผนที่ได้แม่นกว่า)' },
    { k: 'note', l: 'โน้ต', t: 'textarea' },
  ];
}

function parseCities(text) {
  return text.split(/[,،、\n]/).map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?)\s*\(([^)]+)\)$/);
    return m ? { name: m[1].trim(), code: m[2].trim().toUpperCase() } : { name: s, code: '' };
  });
}
const citiesText = (t) => (t.cities || []).map((c) => (c.code ? `${c.name} (${c.code})` : c.name)).join(', ');

/* generic list editing: add / edit / delete an item inside one of a trip's arrays */
function editItem(t, list, fields, item, title) {
  openSheet({
    title, fields, values: item || {},
    onSave: async (v) => {
      if (item) Object.assign(item, v); else t[list].push({ id: uid(), ...v });
      await save(t); render();
    },
    onDelete: item ? async () => { t[list] = t[list].filter((x) => x !== item); await save(t); render(); } : null,
  });
}

/* ---------- actions ---------- */

const actions = {
  newTrip() {
    openSheet({
      title: 'ทริปใหม่', fields: TRIP_FIELDS, values: { travelers: 'Prem & Fren', color: COLORS[1][0] }, submit: 'สร้างทริป',
      onSave: async (v) => {
        if (v.end < v.start) [v.start, v.end] = [v.end, v.start];
        const t = { id: uid(), name: v.name, start: v.start, end: v.end, travelers: v.travelers, color: v.color, cities: parseCities(v.citiesText),
          flights: [], hotels: [], activities: [], notes: [], dayTitles: {},
          people: [{ id: uid(), name: 'Prem', passportName: '', passportNo: '', passportExp: '', qr: '' }, { id: uid(), name: 'Fren', passportName: '', passportNo: '', passportExp: '', qr: '' }] };
        data.trips.push(t); await save(t); location.hash = `#/t/${t.id}`;
      },
    });
  },
  editTrip({ id }) {
    const t = trip(id);
    openSheet({
      title: 'แก้ไขทริป', fields: TRIP_FIELDS, values: { ...t, citiesText: citiesText(t) },
      onSave: async (v) => {
        if (v.end < v.start) [v.start, v.end] = [v.end, v.start];
        Object.assign(t, { name: v.name, start: v.start, end: v.end, travelers: v.travelers, color: v.color, cities: parseCities(v.citiesText) });
        await save(t); render();
      },
      onDelete: async () => { data.trips = data.trips.filter((x) => x !== t); await save(); location.hash = '#/'; },
    });
  },
  editDayTitle({ id, date }) {
    const t = trip(id);
    openSheet({
      title: `ชื่อของวัน ${fmtD(date)}`, fields: [{ k: 'title', l: 'ชื่อวัน (เว้นว่างเพื่อใช้ชื่ออัตโนมัติ)', ph: 'เช่น เดินเล่นชายหาด' }], values: { title: t.dayTitles[date] || '' },
      onSave: async (v) => { if (v.title) t.dayTitles[date] = v.title; else delete t.dayTitles[date]; await save(t); render(); },
    });
  },
  addAct({ id, date }) { const t = trip(id); editItem(t, 'activities', actFields(t), null, 'เพิ่มกิจกรรม'); setTimeout(() => { const s = document.querySelector('dialog [name="date"]'); if (s) s.value = date; }); },
  editAct({ id, aid }) { const t = trip(id); editItem(t, 'activities', actFields(t), t.activities.find((x) => x.id === aid), 'แก้ไขกิจกรรม'); },
  addFlight({ id }) { const t = trip(id); editItem(t, 'flights', FLIGHT_FIELDS, null, 'เพิ่มเที่ยวบิน'); },
  editFlight({ id, fid }) { const t = trip(id); editItem(t, 'flights', FLIGHT_FIELDS, t.flights.find((x) => x.id === fid), 'แก้ไขเที่ยวบิน'); },
  addHotel({ id }) { const t = trip(id); editItem(t, 'hotels', HOTEL_FIELDS, null, 'เพิ่มที่พัก'); },
  editHotel({ id, hid }) { const t = trip(id); editItem(t, 'hotels', HOTEL_FIELDS, t.hotels.find((x) => x.id === hid), 'แก้ไขที่พัก'); },
  addPerson({ id }) { const t = trip(id); editItem(t, 'people', PERSON_FIELDS, null, 'เพิ่มผู้เดินทาง'); },
  editPerson({ id, pid }) { const t = trip(id); editItem(t, 'people', PERSON_FIELDS, t.people.find((x) => x.id === pid), 'ผู้เดินทาง / QR ตม.'); },
  addNote({ id }) { const t = trip(id); editItem(t, 'notes', NOTE_FIELDS, null, 'เพิ่มข้อมูล'); },
  editNote({ id, nid }) { const t = trip(id); editItem(t, 'notes', NOTE_FIELDS, t.notes.find((x) => x.id === nid), 'แก้ไขข้อมูล'); },
  goQR({ id, pid }) { location.replace(`#/t/${id}/qr/${pid}`); },
  back() { history.length > 1 ? history.back() : (location.hash = '#/'); },
  async copy({ text }) {
    try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว'); } catch (e) { toast(text); }
  },
  syncMenu() {
    openMenu(`ซิงก์ · ${syncLabel()}`, [
      { label: 'ซิงก์ตอนนี้', hint: syncState.error ? `สาเหตุ: ${syncState.error}` : 'ปกติแอปซิงก์เองทุก 15 วินาที และทุกครั้งที่เปิดแอป', run: () => syncAll() },
    ]);
  },
  backupMenu() {
    openMenu('สำรอง / ย้ายข้อมูล', [
      { label: 'ส่งออกไฟล์สำรอง (.json)', hint: 'เก็บไว้ หรือย้ายไปเครื่องอื่น', run: exportData },
      { label: 'นำเข้าไฟล์สำรอง', hint: 'ทริปที่มีอยู่แล้วจะถูกแทนที่ด้วยข้อมูลในไฟล์', run: importData },
      ...(CFG.passwordCheck ? [{ label: 'ล็อกแอป', hint: 'ลืมรหัสที่จำไว้ในเครื่องนี้ ต้องใส่รหัสใหม่ตอนเปิดครั้งหน้า', run: lockApp }] : []),
    ]);
  },
};

async function exportData() {
  const name = `trip-backup-${todayISO()}.json`;
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'ข้อมูลทริป' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'application/json,.json';
  input.onchange = async () => {
    try {
      const incoming = JSON.parse(await input.files[0].text());
      if (!Array.isArray(incoming.trips)) throw new Error('bad');
      for (const t of incoming.trips) {
        const i = data.trips.findIndex((x) => x.id === t.id);
        t.edits = (t.edits || 0) + 1;
        if (i >= 0) data.trips[i] = t; else data.trips.push(t);
      }
      await save(); scheduleSync(); render(); toast(`นำเข้า ${incoming.trips.length} ทริปแล้ว`);
    } catch (e) { toast('ไฟล์นี้นำเข้าไม่ได้'); }
  };
  input.click();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !actions[el.dataset.act]) return;
  e.preventDefault();
  actions[el.dataset.act](el.dataset, el);
});

let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.append(el);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2200);
}

/* ---------- password screen ---------- */

function viewLock() {
  document.documentElement.style.setProperty('--accent', '#C8372D');
  $app.innerHTML = `<main class="screen lock">
    <div class="stack-s"><span class="eyebrow">Prem &amp; Fren</span><h1 class="title-xl">ทริปของเรา</h1></div>
    <form class="stack" novalidate>
      <div class="field"><label for="pw">รหัสผ่าน</label><input id="pw" name="pw" type="password" autocomplete="current-password" required></div>
      <label class="row small"><input type="checkbox" name="remember" checked> จำรหัสผ่านในเครื่องนี้</label>
      <button class="btn block primary" type="submit">เข้าแอป</button>
      <p class="tiny muted" role="status" aria-live="polite"></p>
    </form>
  </main>`;
  const form = $app.querySelector('form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button'), msg = form.querySelector('[role="status"]');
    if (!form.pw.value) { form.pw.focus(); return; }
    btn.disabled = true; msg.textContent = 'กำลังตรวจรหัส…';
    let ok = false;
    try { ok = await unlock(form.pw.value, form.remember.checked); } catch (err) { msg.textContent = 'ตรวจรหัสไม่ได้ในเบราว์เซอร์นี้'; btn.disabled = false; return; }
    if (!ok) { msg.textContent = 'รหัสผ่านไม่ถูกต้อง'; btn.disabled = false; form.pw.select(); return; }
    render(); syncAll();
  };
  form.pw.focus();
}

/* ---------- router ---------- */

let lastHash = null;
let wakeLock = null;

function render() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (needsPassword()) { viewLock(); return; }
  const t = parts[0] === 't' ? trip(parts[1]) : null;
  let html;
  if (!t) { html = viewHome(); document.documentElement.style.setProperty('--accent', '#C8372D'); }
  else {
    document.documentElement.style.setProperty('--accent', t.color || '#C8372D');
    const view = parts[2] || '';
    if (view === 'd') html = viewDay(t, parts[3]);
    else if (view === 'docs') html = viewDocs(t, parts[3]);
    else if (view === 'qr') html = viewQR(t, parts[3]);
    else if (view === 'taxi') html = viewTaxi(t, parts[3]);
    else html = viewTrip(t);
  }
  $app.innerHTML = html;
  const fullDark = !!$app.querySelector('.full-dark');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', fullDark ? '#14202B' : '#F2F4F7');
  toggleWakeLock(fullDark || !!$app.querySelector('.taxi'));
  if (hash !== lastHash) {
    const samePage = lastHash && lastHash.split('/').slice(0, 3).join('/') === hash.split('/').slice(0, 3).join('/') && /\/(d|docs)\//.test(hash);
    if (!samePage) window.scrollTo(0, 0);
    $app.querySelector('.pill-day[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    lastHash = hash;
  }
}

async function toggleWakeLock(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}

window.addEventListener('hashchange', render);

(async () => {
  await load();
  readStoredSecret();
  render();
  syncAll();
  setInterval(() => { if (document.visibilityState === 'visible') syncAll(); }, 15000);
  window.addEventListener('online', syncAll);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncAll(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();

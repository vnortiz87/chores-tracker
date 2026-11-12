// Core of the chores app: database (libSQL / SQLite), scheduling logic and the JSON API.
// Used by server.js (Docker / local) and api/[...path].js (Vercel).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';

export const PEOPLE = ['Vanessa', 'Katalina'];
const OWNERS = [...PEOPLE, 'Both'];
// occurrences per week
const FREQS = { daily: 7, weekly: 1, biweekly: 0.5, monthly: 12 / 52, quarterly: 4 / 52, semiannual: 2 / 52 };
const STATUSES = ['todo', 'doing', 'done'];

// ---------- database ----------
const DB_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || `file:${path.join(process.env.DATA_DIR || 'data', 'chores.db')}`;
if (DB_URL.startsWith('file:')) fs.mkdirSync(path.dirname(DB_URL.slice(5)), { recursive: true });
const client = createClient({ url: DB_URL, authToken: process.env.TURSO_AUTH_TOKEN || undefined });

const wrap = (ex) => {
  const all = async (sql, ...args) => {
    const rs = await ex.execute({ sql, args });
    return rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));
  };
  return {
    all,
    get: async (sql, ...args) => (await all(sql, ...args))[0],
    run: async (sql, ...args) => { const rs = await ex.execute({ sql, args }); return { lastInsertRowid: Number(rs.lastInsertRowid ?? 0) }; },
  };
};
export const db = wrap(client);
const tx = async (fn) => {
  const t = await client.transaction('write');
  try { const r = await fn(wrap(t)); await t.commit(); return r; }
  catch (e) { try { await t.rollback(); } catch { /* already closed */ } throw e; }
  finally { t.close(); }
};

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS chores(
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'Vanessa', frequency TEXT NOT NULL DEFAULT 'weekly',
  pref_dow INTEGER, time_of_day TEXT, minutes INTEGER NOT NULL DEFAULT 10,
  automated INTEGER NOT NULL DEFAULT 0, rotates INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0,
  next_due TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, nth INTEGER);
CREATE TABLE IF NOT EXISTS steps(
  id INTEGER PRIMARY KEY, chore_id INTEGER NOT NULL, label TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS step_checks(
  step_id INTEGER PRIMARY KEY, chore_id INTEGER NOT NULL, done_by TEXT, checked_at TEXT);
CREATE TABLE IF NOT EXISTS completions(
  id INTEGER PRIMARY KEY, chore_id INTEGER NOT NULL, chore_name TEXT NOT NULL, owner TEXT NOT NULL,
  done_by TEXT NOT NULL, minutes INTEGER NOT NULL, completed_at TEXT NOT NULL, completed_date TEXT NOT NULL,
  prev_due TEXT NOT NULL, prev_owner TEXT NOT NULL, via TEXT NOT NULL DEFAULT 'app', skipped INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_comp_date ON completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_comp_chore ON completions(chore_id);
CREATE TABLE IF NOT EXISTS projects(
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, owners TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, completed_at TEXT);
CREATE TABLE IF NOT EXISTS project_tasks(
  id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL, label TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;
let ready;
export const init = () => (ready ||= (async () => {
  await client.executeMultiple(SCHEMA);
  try { await client.execute('ALTER TABLE chores ADD COLUMN nth INTEGER'); } catch { /* column exists */ }
  try { await client.execute('ALTER TABLE completions ADD COLUMN skipped INTEGER NOT NULL DEFAULT 0'); } catch { /* column exists */ }
})());

// ---------- dates (in the household's timezone: set APP_TZ, e.g. America/New_York) ----------
const TZ = process.env.APP_TZ || process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
const localNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(localNow());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
function addMonths(s, n) {
  const d = parse(s), day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return ymd(d);
}
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const mondayOf = (s) => addDays(s, -((parse(s).getDay() + 6) % 7));

function advance(freq, base) {
  switch (freq) {
    case 'daily': return addDays(base, 1);
    case 'weekly': return addDays(base, 7);
    case 'biweekly': return addDays(base, 14);
    case 'monthly': return addMonths(base, 1);
    case 'quarterly': return addMonths(base, 3);
    case 'semiannual': return addMonths(base, 6);
  }
  return addDays(base, 7);
}
const effDow = (d) => (d === 7 ? 6 : d); // 7 = "weekend": scheduled on Saturday, stays due through Sunday
function snapToDow(date, dow, after) {
  dow = effDow(dow);
  let diff = (dow - parse(date).getDay() + 7) % 7;
  if (diff > 3) diff -= 7; // nearest matching weekday
  let out = addDays(date, diff);
  while (out <= after) out = addDays(out, 7);
  return out;
}
const MONTH_STEP = { monthly: 1, quarterly: 3, semiannual: 6 };
function nthWeekday(year, month0, dow, n) {
  const first = new Date(year, month0, 1);
  return ymd(new Date(year, month0, 1 + ((dow - first.getDay() + 7) % 7) + 7 * (n - 1)));
}
function nextDue(c, completedDate) {
  if (c.nth && c.pref_dow != null && MONTH_STEP[c.frequency]) {
    const b = parse(c.next_due > completedDate ? c.next_due : completedDate);
    const t = new Date(b.getFullYear(), b.getMonth() + MONTH_STEP[c.frequency], 1);
    return nthWeekday(t.getFullYear(), t.getMonth(), effDow(c.pref_dow), c.nth);
  }
  const base = c.frequency === 'daily' ? completedDate : (c.next_due > completedDate ? c.next_due : completedDate);
  let n = advance(c.frequency, base);
  if (c.pref_dow != null && c.frequency !== 'daily') n = snapToDow(n, c.pref_dow, completedDate);
  return n;
}
function firstDue(freq, dow, nth) {
  const t = today();
  if (nth && dow != null && MONTH_STEP[freq]) {
    const d = parse(t);
    const c = nthWeekday(d.getFullYear(), d.getMonth(), effDow(dow), nth);
    if (c >= t) return c;
    const n = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return nthWeekday(n.getFullYear(), n.getMonth(), effDow(dow), nth);
  }
  return dow != null && freq !== 'daily' ? snapToDow(t, dow, addDays(t, -1)) : t;
}

// ---------- helpers ----------
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg) => new HttpError(400, msg);
const other = (p) => (p === 'Vanessa' ? 'Katalina' : 'Vanessa');

async function slugify(d, name) {
  const base = String(name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'item';
  let s = base, i = 2;
  while (await d.get('SELECT 1 x FROM chores WHERE slug=?', s) || await d.get('SELECT 1 x FROM projects WHERE slug=?', s)) s = `${base}-${i++}`;
  return s;
}

const SETTING_DEFAULTS = {
  reminders_enabled: '0', ntfy_base: process.env.NTFY_BASE || 'https://ntfy.sh',
  topic_Vanessa: '', topic_Katalina: '', morning_time: '08:00', night_time: '19:30',
  base_url: process.env.BASE_URL || '',
};
const getSetting = async (k, d = db) => (await d.get('SELECT value FROM settings WHERE key=?', k))?.value ?? SETTING_DEFAULTS[k] ?? '';
const setSetting = (k, v) => db.run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, String(v));
const allSettings = async () => {
  const rows = Object.fromEntries((await db.all('SELECT key,value FROM settings')).map((r) => [r.key, r.value]));
  return Object.fromEntries(Object.keys(SETTING_DEFAULTS).map((k) => [k, rows[k] ?? SETTING_DEFAULTS[k]]));
};

// ---------- chores ----------
async function choreViews(rows) {
  if (!rows.length) return [];
  const steps = await db.all(`SELECT s.id, s.chore_id, s.label, (sc.step_id IS NOT NULL) AS checked FROM steps s
    LEFT JOIN step_checks sc ON sc.step_id=s.id ORDER BY s.position, s.id`);
  const last = await db.all(`SELECT c.chore_id, c.id, c.done_by, c.completed_at, c.skipped FROM completions c
    JOIN (SELECT chore_id, MAX(id) m FROM completions GROUP BY chore_id) x ON c.id=x.m`);
  const t = today();
  return rows.map((c) => {
    const l = last.find((x) => x.chore_id === c.id);
    return {
      ...c, automated: !!c.automated, rotates: !!c.rotates, archived: !!c.archived,
      steps: steps.filter((s) => s.chore_id === c.id).map((s) => ({ id: s.id, label: s.label, checked: !!s.checked })),
      last_done: l ? { id: l.id, done_by: l.done_by, completed_at: l.completed_at, skipped: !!l.skipped } : null,
      overdue_days: c.frequency === 'daily' ? 0 : Math.max(0, daysBetween(c.next_due, t) - (c.pref_dow === 7 ? 1 : 0)), // a missed daily chore is just today's chore
    };
  });
}
const choreById = async (id) => (await choreViews([await db.get('SELECT * FROM chores WHERE id=?', id)]))[0];

function cleanChore(b, partial = false) {
  const o = {};
  if (!partial || b.name !== undefined) { o.name = String(b.name || '').trim(); if (!o.name) throw bad('Name is required'); }
  if (!partial || b.owner !== undefined) { if (!OWNERS.includes(b.owner)) throw bad('Bad owner'); o.owner = b.owner; }
  if (!partial || b.frequency !== undefined) { if (!(b.frequency in FREQS)) throw bad('Bad frequency'); o.frequency = b.frequency; }
  if (!partial || b.pref_dow !== undefined) {
    const d = b.pref_dow === '' || b.pref_dow == null ? null : Number(b.pref_dow);
    if (d != null && !(d >= 0 && d <= 7)) throw bad('Bad day'); o.pref_dow = d;
  }
  if (!partial || b.nth !== undefined) {
    const n = b.nth === '' || b.nth == null ? null : Number(b.nth);
    if (n != null && !(n >= 1 && n <= 4)) throw bad('Bad week of month'); o.nth = n;
  }
  if (!partial || b.time_of_day !== undefined) {
    const t = b.time_of_day || null; if (t && !['morning', 'night'].includes(t)) throw bad('Bad time of day'); o.time_of_day = t;
  }
  if (!partial || b.minutes !== undefined) { const m = Math.round(Number(b.minutes)); if (!(m >= 0 && m <= 1440)) throw bad('Bad minutes'); o.minutes = m; }
  if (b.automated !== undefined) o.automated = b.automated ? 1 : 0;
  if (b.rotates !== undefined) o.rotates = b.rotates ? 1 : 0;
  if (b.notes !== undefined) o.notes = String(b.notes).slice(0, 2000);
  if (b.next_due !== undefined && b.next_due) { if (!/^\d{4}-\d{2}-\d{2}$/.test(b.next_due)) throw bad('Bad date'); o.next_due = b.next_due; }
  return o;
}

async function syncSteps(d, choreId, labels) {
  const clean = labels.map((s) => String(s).trim()).filter(Boolean).slice(0, 40);
  const existing = await d.all('SELECT id, label FROM steps WHERE chore_id=?', choreId);
  const keep = new Set();
  for (const [i, label] of clean.entries()) {
    const hit = existing.find((e) => e.label === label && !keep.has(e.id));
    if (hit) { keep.add(hit.id); await d.run('UPDATE steps SET position=? WHERE id=?', i, hit.id); }
    else { const r = await d.run('INSERT INTO steps(chore_id,label,position) VALUES(?,?,?)', choreId, label, i); keep.add(r.lastInsertRowid); }
  }
  for (const e of existing) if (!keep.has(e.id)) { await d.run('DELETE FROM step_checks WHERE step_id=?', e.id); await d.run('DELETE FROM steps WHERE id=?', e.id); }
}

async function completeChore(id, by, via = 'app', skipped = false) {
  if (!PEOPLE.includes(by)) throw bad('Who did it?');
  const c = await db.get('SELECT * FROM chores WHERE id=?', id);
  if (!c) throw new HttpError(404, 'Chore not found');
  const date = ymd(localNow());
  const recent = await db.get('SELECT id, done_by, skipped, completed_at FROM completions WHERE chore_id=? ORDER BY id DESC LIMIT 1', id);
  if (recent && recent.done_by === by && !!recent.skipped === !!skipped && Date.now() - Date.parse(recent.completed_at) < 5000) return recent.id;
  return tx(async (t) => {
    const r = await t.run(`INSERT INTO completions(chore_id,chore_name,owner,done_by,minutes,completed_at,completed_date,prev_due,prev_owner,via,skipped)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`, c.id, c.name, c.owner, by, c.automated || skipped ? 0 : c.minutes, new Date().toISOString(), date, c.next_due, c.owner, via, skipped ? 1 : 0);
    const owner = c.rotates && PEOPLE.includes(c.owner) ? other(c.owner) : c.owner;
    await t.run('UPDATE chores SET next_due=?, owner=? WHERE id=?', nextDue(c, date), owner, c.id);
    await t.run('DELETE FROM step_checks WHERE chore_id=?', c.id);
    return r.lastInsertRowid;
  });
}

// ---------- projects ----------
async function projectViews(rows) {
  if (!rows.length) return [];
  const tasks = await db.all('SELECT id,project_id,label,done FROM project_tasks ORDER BY position,id');
  return rows.map((p) => ({
    ...p, owners: p.owners ? p.owners.split(',').filter(Boolean) : [],
    tasks: tasks.filter((t) => t.project_id === p.id).map((t) => ({ id: t.id, label: t.label, done: !!t.done })),
  }));
}
const projectById = async (id) => (await projectViews([await db.get('SELECT * FROM projects WHERE id=?', id)]))[0];
async function syncTasks(d, pid, tasks) {
  const existing = (await d.all('SELECT id FROM project_tasks WHERE project_id=?', pid)).map((t) => t.id);
  const keep = new Set();
  for (const [i, t] of tasks.slice(0, 60).entries()) {
    const label = String(t.label || '').trim(); if (!label) continue;
    if (t.id && existing.includes(t.id)) { await d.run('UPDATE project_tasks SET label=?, done=?, position=? WHERE id=?', label, t.done ? 1 : 0, i, t.id); keep.add(t.id); }
    else { const r = await d.run('INSERT INTO project_tasks(project_id,label,done,position) VALUES(?,?,?,?)', pid, label, t.done ? 1 : 0, i); keep.add(r.lastInsertRowid); }
  }
  for (const id of existing) if (!keep.has(id)) await d.run('DELETE FROM project_tasks WHERE id=?', id);
}
function cleanProject(b) {
  const name = String(b.name || '').trim(); if (!name) throw bad('Name is required');
  const status = b.status || 'todo'; if (!STATUSES.includes(status)) throw bad('Bad status');
  const owners = (Array.isArray(b.owners) ? b.owners : []).filter((o) => PEOPLE.includes(o));
  return { name, status, owners: owners.join(','), notes: String(b.notes || '').slice(0, 4000) };
}

// ---------- stats ----------
async function fairness() {
  const t = today();
  const weekStart = mondayOf(t);
  const weeks = [];
  for (let i = 7; i >= 0; i--) { const s = addDays(weekStart, -7 * i); weeks.push({ start: s, end: addDays(s, 6), Vanessa: 0, Katalina: 0 }); }
  const months = [];
  const m0 = parse(t);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(m0.getFullYear(), m0.getMonth() - i, 1);
    months.push({ start: ymd(d), end: ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)), Vanessa: 0, Katalina: 0 });
  }
  const since = weeks[0].start < months[0].start ? weeks[0].start : months[0].start;
  for (const r of await db.all('SELECT done_by, minutes, completed_date d FROM completions WHERE completed_date>=? AND minutes>0', since)) {
    for (const b of weeks) if (r.d >= b.start && r.d <= b.end) b[r.done_by] += r.minutes;
    for (const b of months) if (r.d >= b.start && r.d <= b.end) b[r.done_by] += r.minutes;
  }
  const planned = { Vanessa: 0, Katalina: 0 }, byChore = [];
  for (const c of await db.all('SELECT * FROM chores WHERE archived=0 AND automated=0')) {
    const perWeek = c.minutes * FREQS[c.frequency];
    if (c.owner === 'Both') { planned.Vanessa += perWeek / 2; planned.Katalina += perWeek / 2; } else planned[c.owner] += perWeek;
    byChore.push({ id: c.id, name: c.name, owner: c.owner, frequency: c.frequency, minutes: c.minutes, per_week: Math.round(perWeek * 10) / 10 });
  }
  byChore.sort((a, b) => b.per_week - a.per_week);
  return { weeks, months, planned_week: planned, planned_month: { Vanessa: planned.Vanessa * 52 / 12, Katalina: planned.Katalina * 52 / 12 }, by_chore: byChore };
}

// Skipped days keep a streak alive but don't add to it.
function streakFrom(doneDates, skipDates = []) {
  const done = new Set(doneDates), skip = new Set(skipDates);
  if (!done.size) return { current: 0, best: 0 };
  const all = [...new Set([...done, ...skip])].sort();
  let best = 0, run_ = 0, prev = null;
  for (const d of all) {
    if (prev && daysBetween(prev, d) !== 1) run_ = 0;
    if (done.has(d)) run_++;
    best = Math.max(best, run_); prev = d;
  }
  const has = (d) => done.has(d) || skip.has(d);
  let d = has(today()) ? today() : addDays(today(), -1), cur = 0;
  while (has(d)) { if (done.has(d)) cur++; d = addDays(d, -1); }
  return { current: cur, best };
}

// ---------- reminders (ntfy push) ----------
async function notify(person, message) {
  const base = (await getSetting('ntfy_base')).replace(/\/+$/, ''), topic = await getSetting('topic_' + person);
  if (!base || !topic) return false;
  const headers = { Title: 'Chores', Tags: 'broom' };
  const url = await getSetting('base_url'); if (url) headers.Click = url;
  const r = await fetch(`${base}/${encodeURIComponent(topic)}`, { method: 'POST', body: message, headers });
  return r.ok;
}
const dueFor = async (person) => {
  const rows = await db.all(`SELECT * FROM chores WHERE archived=0 AND automated=0 AND next_due<=? AND (owner=? OR owner='Both') ORDER BY next_due`, today(), person);
  const g = localNow().getDay(), weekday = g >= 1 && g <= 5;
  return rows.filter((c) => !(weekday && c.frequency !== 'daily' && [0, 6, 7].includes(c.pref_dow))); // weekend chores wait for the weekend
};
async function reminderText(person, slot) {
  let list = await dueFor(person);
  if (slot === 'morning') list = list.filter((c) => c.time_of_day !== 'night');
  if (!list.length) return null;
  const over = list.filter((c) => c.frequency !== 'daily' && c.next_due < today()).length;
  const mins = list.reduce((a, c) => a + c.minutes, 0);
  const names = list.slice(0, 6).map((c) => c.name).join(', ') + (list.length > 6 ? ` +${list.length - 6} more` : '');
  return `${slot === 'morning' ? 'Good morning' : 'Evening check'}, ${person}: ${list.length} to do${over ? ` (${over} overdue)` : ''}, about ${mins} min.\n${names}`;
}
// Sends one slot to both people. `force` ignores the clock and the once-a-day guard (used by Vercel cron).
export async function sendSlot(slot, force = false) {
  if ((await getSetting('reminders_enabled')) !== '1') return 0;
  const now = localNow(), hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (!force && hm < (await getSetting(slot + '_time'))) return 0;
  let sent = 0;
  for (const p of PEOPLE) {
    const key = `last_sent_${p}_${slot}`;
    if (!force && (await getSetting(key)) === today()) continue;
    await setSetting(key, today());
    const text = await reminderText(p, slot);
    if (text) { try { if (await notify(p, text)) sent++; } catch (e) { console.error('reminder failed', e.message); } }
  }
  return sent;
}
export async function reminderTick() { await init(); for (const slot of ['morning', 'night']) await sendSlot(slot); }

// ---------- routes ----------
const routes = [];
const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

route('GET', '/api/today', async () => {
  const t = today();
  return {
    today: t,
    chores: await choreViews(await db.all('SELECT * FROM chores WHERE archived=0 AND next_due<=? ORDER BY next_due', t)),
    done_today: await db.all('SELECT * FROM completions WHERE completed_date=? ORDER BY id DESC', t),
  };
});
route('GET', '/api/chores', async ({ query }) => ({
  chores: await choreViews(await db.all(`SELECT * FROM chores ${query.archived === '1' ? '' : 'WHERE archived=0'} ORDER BY archived, owner, name`)),
}));
route('POST', '/api/chores', async ({ body }) => {
  const o = cleanChore(body);
  const id = await tx(async (t) => {
    const r = await t.run(`INSERT INTO chores(slug,name,owner,frequency,pref_dow,time_of_day,minutes,automated,rotates,notes,next_due,created_at,nth)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, await slugify(t, o.name), o.name, o.owner, o.frequency, o.pref_dow, o.time_of_day, o.minutes,
      o.automated || 0, o.rotates || 0, o.notes || '', o.next_due || firstDue(o.frequency, o.pref_dow, o.nth), new Date().toISOString(), o.nth ?? null);
    await syncSteps(t, r.lastInsertRowid, body.steps || []);
    return r.lastInsertRowid;
  });
  return choreById(id);
});
route('PUT', '/api/chores/:id', async ({ params, body }) => {
  const id = Number(params.id);
  if (!(await db.get('SELECT 1 x FROM chores WHERE id=?', id))) throw new HttpError(404, 'Not found');
  const o = cleanChore(body, true);
  await tx(async (t) => {
    const keys = Object.keys(o);
    if (keys.length) await t.run(`UPDATE chores SET ${keys.map((k) => k + '=?').join(',')} WHERE id=?`, ...keys.map((k) => o[k]), id);
    if (Array.isArray(body.steps)) await syncSteps(t, id, body.steps);
    if (body.archived !== undefined) await t.run('UPDATE chores SET archived=? WHERE id=?', body.archived ? 1 : 0, id);
  });
  return choreById(id);
});
route('POST', '/api/chores/:id/swap', async ({ params }) => {
  const c = await db.get('SELECT * FROM chores WHERE id=?', Number(params.id));
  if (!c) throw new HttpError(404, 'Not found');
  if (PEOPLE.includes(c.owner)) await db.run('UPDATE chores SET owner=? WHERE id=?', other(c.owner), c.id);
  return choreById(c.id);
});
route('POST', '/api/chores/:id/complete', async ({ params, body }) => {
  const id = Number(params.id);
  const cid = await completeChore(id, body.by, body.via === 'nfc' ? 'nfc' : 'app');
  return { completion_id: cid, chore: await choreById(id) };
});
route('POST', '/api/chores/:id/skip', async ({ params, body }) => {
  const id = Number(params.id);
  const cid = await completeChore(id, body.by, 'app', true);
  return { completion_id: cid, chore: await choreById(id) };
});
route('POST', '/api/chores/:id/steps/:sid/toggle', async ({ params, body }) => {
  const id = Number(params.id), sid = Number(params.sid);
  if (!PEOPLE.includes(body.by)) throw bad('Who did it?');
  if (!(await db.get('SELECT 1 x FROM steps WHERE id=? AND chore_id=?', sid, id))) throw new HttpError(404, 'Not found');
  if (await db.get('SELECT 1 x FROM step_checks WHERE step_id=?', sid)) await db.run('DELETE FROM step_checks WHERE step_id=?', sid);
  else await db.run('INSERT INTO step_checks(step_id,chore_id,done_by,checked_at) VALUES(?,?,?,?)', sid, id, body.by, new Date().toISOString());
  const left = (await db.get('SELECT COUNT(*) n FROM steps s WHERE s.chore_id=? AND NOT EXISTS(SELECT 1 FROM step_checks WHERE step_id=s.id)', id)).n;
  const completion_id = left === 0 ? await completeChore(id, body.by) : null;
  return { completion_id, completed: completion_id != null, chore: await choreById(id) };
});
route('DELETE', '/api/completions/:id', async ({ params }) => {
  const r = await db.get('SELECT * FROM completions WHERE id=?', Number(params.id));
  if (!r) throw new HttpError(404, 'Not found');
  // Put the chore back to how it was before it was done/skipped. If the same chore was marked the same way more than
  // once that day (for example a double tap), the earliest one decides, so a single tap fully restores it.
  const first = (await db.get('SELECT MIN(id) m FROM completions WHERE chore_id=? AND completed_date=? AND skipped=? AND id<=?', r.chore_id, r.completed_date, r.skipped, r.id)).m;
  const start = await db.get('SELECT * FROM completions WHERE id=?', first);
  await tx(async (t) => {
    await t.run('UPDATE chores SET next_due=?, owner=? WHERE id=?', start.prev_due, start.prev_owner, r.chore_id);
    await t.run('DELETE FROM completions WHERE chore_id=? AND id>=?', r.chore_id, first);
  });
  return { ok: true };
});
route('GET', '/api/history', async ({ query }) => {
  const where = [], args = [];
  if (PEOPLE.includes(query.person)) { where.push('done_by=?'); args.push(query.person); }
  if (query.chore_id) { where.push('chore_id=?'); args.push(Number(query.chore_id)); }
  if (query.status === 'skipped') where.push('skipped=1');
  if (query.status === 'done') where.push('skipped=0');
  const limit = Math.min(Number(query.limit) || 150, 1000);
  const items = await db.all(`SELECT * FROM completions ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ${limit}`, ...args);
  const daily = await db.all("SELECT id,name FROM chores WHERE archived=0 AND frequency='daily'");
  const dates = await db.all("SELECT chore_id, completed_date d, skipped FROM completions WHERE chore_id IN (SELECT id FROM chores WHERE archived=0 AND frequency='daily')");
  const streaks = daily.map((c) => {
    const mine = dates.filter((x) => x.chore_id === c.id);
    return { chore_id: c.id, name: c.name, ...streakFrom(mine.filter((x) => !x.skipped).map((x) => x.d), mine.filter((x) => x.skipped).map((x) => x.d)) };
  });
  return { items, streaks, chores: await db.all('SELECT id,name FROM chores ORDER BY name') };
});
route('GET', '/api/fairness', () => fairness());

route('GET', '/api/c/:slug', async ({ params }) => {
  const c = await db.get('SELECT * FROM chores WHERE slug=?', params.slug);
  if (c) return { kind: 'chore', item: (await choreViews([c]))[0] };
  const p = await db.get('SELECT * FROM projects WHERE slug=?', params.slug);
  if (p) return { kind: 'project', item: (await projectViews([p]))[0] };
  throw new HttpError(404, 'Nothing here with that tag');
});
route('GET', '/api/tags', async () => ({
  chores: await db.all('SELECT id,slug,name,owner FROM chores WHERE archived=0 ORDER BY name'),
  projects: await db.all("SELECT id,slug,name FROM projects WHERE status!='done' ORDER BY name"),
}));

route('GET', '/api/projects', async () => ({ projects: await projectViews(await db.all('SELECT * FROM projects ORDER BY id DESC')) }));
route('POST', '/api/projects', async ({ body }) => {
  const o = cleanProject(body);
  const id = await tx(async (t) => {
    const r = await t.run('INSERT INTO projects(slug,name,owners,status,notes,created_at,completed_at) VALUES(?,?,?,?,?,?,?)',
      await slugify(t, o.name), o.name, o.owners, o.status, o.notes, new Date().toISOString(), o.status === 'done' ? new Date().toISOString() : null);
    await syncTasks(t, r.lastInsertRowid, body.tasks || []);
    return r.lastInsertRowid;
  });
  return projectById(id);
});
route('PUT', '/api/projects/:id', async ({ params, body }) => {
  const id = Number(params.id), cur = await db.get('SELECT * FROM projects WHERE id=?', id);
  if (!cur) throw new HttpError(404, 'Not found');
  const o = cleanProject({ ...(await projectById(id)), ...body });
  await tx(async (t) => {
    await t.run('UPDATE projects SET name=?,owners=?,status=?,notes=?,completed_at=? WHERE id=?', o.name, o.owners, o.status, o.notes,
      o.status === 'done' ? (cur.completed_at || new Date().toISOString()) : null, id);
    if (Array.isArray(body.tasks)) await syncTasks(t, id, body.tasks);
  });
  return projectById(id);
});
route('DELETE', '/api/projects/:id', async ({ params }) => {
  const id = Number(params.id);
  await tx(async (t) => { await t.run('DELETE FROM project_tasks WHERE project_id=?', id); await t.run('DELETE FROM projects WHERE id=?', id); });
  return { ok: true };
});
route('POST', '/api/projects/:id/tasks/:tid/toggle', async ({ params }) => {
  await db.run('UPDATE project_tasks SET done=1-done WHERE id=? AND project_id=?', Number(params.tid), Number(params.id));
  return projectById(Number(params.id));
});

route('GET', '/api/settings', () => allSettings());
route('PUT', '/api/settings', async ({ body }) => {
  for (const k of Object.keys(SETTING_DEFAULTS)) if (body[k] !== undefined) await setSetting(k, String(body[k]).trim());
  return allSettings();
});
route('POST', '/api/reminders/test', async ({ body }) => {
  if (!PEOPLE.includes(body.person)) throw bad('Pick a person');
  const ok = await notify(body.person, `Test from the chores app for ${body.person}. ${(await dueFor(body.person)).length} chores due today.`).catch(() => false);
  if (!ok) throw bad('Could not send. Check the server and topic.');
  return { ok: true };
});

// ---------- http layer (plain Node req/res: works for node:http and Vercel) ----------
const PASSCODE = process.env.PASSCODE || '';
const CRON_SECRET = process.env.CRON_SECRET || '';
const TOKEN = PASSCODE ? crypto.createHmac('sha256', PASSCODE).update('chores-session-v1').digest('hex') : '';
function isAuthed(req) {
  if (!PASSCODE) return true;
  const m = /(?:^|;\s*)chores_auth=([a-f0-9]+)/.exec(req.headers.cookie || '');
  return !!m && m[1].length === TOKEN.length && crypto.timingSafeEqual(Buffer.from(m[1]), Buffer.from(TOKEN));
}
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now(), a = attempts.get(ip);
  if (!a || a.reset < now) { attempts.set(ip, { n: 1, reset: now + 15 * 60_000 }); return false; }
  return ++a.n > 10;
}
const send = (res, status, data, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
};
async function readBody(req) {
  if (req.method === 'GET' || req.method === 'DELETE') return {};
  if (req.body !== undefined && req.body !== null) { // Vercel pre-parses the body
    if (typeof req.body === 'string') { try { return req.body ? JSON.parse(req.body) : {}; } catch { throw bad('Bad JSON'); } }
    if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString() || '{}'); } catch { throw bad('Bad JSON'); } }
    return req.body;
  }
  const chunks = []; let size = 0;
  for await (const ch of req) { size += ch.length; if (size > 1e6) throw bad('Too large'); chunks.push(ch); }
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw bad('Bad JSON'); }
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://x');
  try {
    await init();
    if (url.pathname === '/api/cron') {
      if (!CRON_SECRET || req.headers.authorization !== `Bearer ${CRON_SECRET}`) throw new HttpError(401, 'Unauthorized');
      const slot = url.searchParams.get('slot') === 'night' ? 'night' : 'morning';
      return send(res, 200, { ok: true, slot, sent: await sendSlot(slot, true) });
    }
    if (PASSCODE && req.method === 'POST' && url.pathname === '/api/login') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'x';
      if (tooMany(ip)) throw new HttpError(429, 'Too many tries. Wait 15 minutes.');
      const code = String((await readBody(req)).code || '');
      const a = crypto.createHash('sha256').update(code).digest(), b = crypto.createHash('sha256').update(PASSCODE).digest();
      if (!crypto.timingSafeEqual(a, b)) throw new HttpError(401, 'Wrong passcode');
      const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
      return send(res, 200, { ok: true }, { 'Set-Cookie': `chores_auth=${TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}` });
    }
    if (url.pathname === '/api/session') return send(res, 200, { passcode: !!PASSCODE, authed: isAuthed(req) });
    if (!isAuthed(req)) throw new HttpError(401, 'Passcode required');
    const r = routes.find((r) => r.method === req.method && r.re.test(url.pathname));
    if (!r) throw new HttpError(404, 'Not found');
    const body = await readBody(req);
    const params = url.pathname.match(r.re).groups || {};
    send(res, 200, await r.fn({ params, query: Object.fromEntries(url.searchParams), body }));
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e.status ? e.message : 'Server error' });
  }
}

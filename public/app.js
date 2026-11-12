'use strict';
// ---------- constants + helpers ----------
const PEOPLE = ['Vanessa', 'Katalina'];
const CLS = { Vanessa: 'v', Katalina: 'k', Both: 'b' };
const FREQ = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', quarterly: 'Quarterly', semiannual: 'Every 6 months' };
const ORD = ['', '1st', '2nd', '3rd', '4th'];
const dowLabel = (d) => (d === 7 ? 'Weekend' : DOW[d]);
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STATUS = { todo: 'To do', doing: 'In progress', done: 'Done' };

const ICONS = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  projects: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  chart: '<path d="M5 20V11M11 20V4M17 20v-6M2.5 20h19"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  home: '<path d="M3 11l9-8 9 8M5.5 9.5V20h13V9.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h15M17 20l4-4-4-4M21 16H6"/>',
  undo: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3"/>',
  qr: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v0M17 20h4v-3"/>',
  bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 004 0"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  skip: '<path d="M5 5l7 7-7 7M13 5l7 7-7 7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const pdot = (p, sm) => `<span class="pdot ${CLS[p] || 'b'} ${sm ? 'sm' : ''}" title="${esc(p)}">${avatarSvg(p === 'Vanessa' ? 'vanessa' : p === 'Katalina' ? 'katalina' : 'joint')}</span>`;

// Avatars copied from the Sebastian Home dashboard
function avatarSvg(w) {
  var o='<svg viewBox="0 0 64 64" aria-hidden="true">';
  if(w==='vanessa'){
    o+='<rect width="64" height="64" fill="#F1D9C6"/><path d="M6 64C6 51 17 46 32 46S58 51 58 64Z" fill="#8C6A60"/><path d="M20 48L25 64" stroke="#2B2523" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="32" cy="46" rx="7" ry="6" fill="#D9A27C"/>'+
      '<g fill="#2A1F1C"><circle cx="14" cy="30" r="7"/><circle cx="18" cy="18" r="8"/><circle cx="29" cy="11" r="9"/><circle cx="41" cy="11" r="8.5"/><circle cx="50" cy="19" r="8"/><circle cx="51" cy="31" r="6.5"/></g>'+
      '<ellipse cx="32" cy="31" rx="15.5" ry="16.5" fill="#E3AE88"/><g fill="#2A1F1C"><circle cx="21" cy="20" r="5"/><circle cx="28.5" cy="16" r="5.5"/><circle cx="37" cy="16.5" r="5.5"/><circle cx="44" cy="21" r="4.6"/></g>'+
      '<circle cx="16.8" cy="37.5" r="2.3" fill="none" stroke="#D9A94A" stroke-width="1.4"/><circle cx="47.2" cy="37.5" r="2.3" fill="none" stroke="#D9A94A" stroke-width="1.4"/>'+
      '<path d="M22.5 25.5q3.5-2 7 0M34.5 25.5q3.5-2 7 0" fill="none" stroke="#2A1F1C" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="26" cy="30.5" rx="2" ry="2.7" fill="#3A2A1C"/><ellipse cx="38" cy="30.5" rx="2" ry="2.7" fill="#3A2A1C"/><circle cx="26.7" cy="29.5" r=".8" fill="#fff"/><circle cx="38.7" cy="29.5" r=".8" fill="#fff"/>'+
      '<ellipse cx="22" cy="37" rx="3" ry="1.9" fill="#E58B6B" opacity=".45"/><ellipse cx="42" cy="37" rx="3" ry="1.9" fill="#E58B6B" opacity=".45"/><path d="M25 37Q32 46 39 37Z" fill="#fff" stroke="#3A2A1C" stroke-width="1.3" stroke-linejoin="round"/>';
  }else if(w==='katalina'){
    o+='<rect width="64" height="64" fill="#D9E4DE"/><path d="M12 30C10 13 21 5 32 5S54 13 52 30C53 42 51 52 47 58L40 53H24L17 58C13 52 11 42 12 30Z" fill="#4A3228"/><path d="M9 64C9 52 19 48 32 48S55 52 55 64Z" fill="#F1ECF6" stroke="#D3CBDD" stroke-width="1.2"/><ellipse cx="32" cy="47" rx="6.5" ry="6" fill="#D7A284"/>'+
      '<ellipse cx="32" cy="31.5" rx="14.5" ry="16" fill="#E5B292"/><path d="M16.5 27C17 15 25 12 32 12S47 15 47.5 27C43 20 37 19 32 19S21 20 16.5 27Z" fill="#4A3228"/>'+
      '<rect x="18.5" y="9.5" width="11.5" height="6.5" rx="3.2" fill="#1D1A19"/><rect x="34" y="9.5" width="11.5" height="6.5" rx="3.2" fill="#1D1A19"/><path d="M30 12.5h4" stroke="#1D1A19" stroke-width="1.6"/>'+
      '<g fill="#F7F7FC" stroke="#CFCFE0" stroke-width="1"><ellipse cx="26.5" cy="5" rx="5.5" ry="3.4" transform="rotate(-15 26.5 5)"/><ellipse cx="37.5" cy="5" rx="5.5" ry="3.4" transform="rotate(15 37.5 5)"/><circle cx="32" cy="5.5" r="2.3"/></g>'+
      '<path d="M17.8 38v4.5M46.2 38v4.5" stroke="#C9CCD6" stroke-width="1.2"/><circle cx="17.8" cy="44" r="1.8" fill="#C9CCD6"/><circle cx="46.2" cy="44" r="1.8" fill="#C9CCD6"/>'+
      '<path d="M22.5 26.5q3.5-2.4 7 0M34.5 26.5q3.5-2.4 7 0" fill="none" stroke="#3A2A1C" stroke-width="1.9" stroke-linecap="round"/><ellipse cx="26" cy="32" rx="2" ry="2.7" fill="#3A2A1C"/><ellipse cx="38" cy="32" rx="2" ry="2.7" fill="#3A2A1C"/><circle cx="26.7" cy="31" r=".8" fill="#fff"/><circle cx="38.7" cy="31" r=".8" fill="#fff"/>'+
      '<ellipse cx="22" cy="38" rx="3" ry="1.9" fill="#E58B6B" opacity=".45"/><ellipse cx="42" cy="38" rx="3" ry="1.9" fill="#E58B6B" opacity=".45"/><path d="M25 38Q32 47 39 38Z" fill="#fff" stroke="#3A2A1C" stroke-width="1.3" stroke-linejoin="round"/>';
  }else if(w==='dax'){
    o+='<rect width="64" height="64" fill="#DDE3E6"/><path d="M10 64C10 54 19 51 32 51S54 54 54 64Z" fill="#7E8189"/><path d="M14 17C5 21 3 40 10 50C18 47 21 35 20 25Z" fill="#1F1E22"/><path d="M50 17C59 21 61 40 54 50C46 47 43 35 44 25Z" fill="#1F1E22"/>'+
      '<ellipse cx="32" cy="33" rx="19" ry="18" fill="#8E9199"/><ellipse cx="32" cy="42" rx="11.5" ry="8.5" fill="#BCBFC5"/><path d="M18 22q4-4 7-1M46 22q-4-4-7-1M28 17q4-3 8 0" fill="none" stroke="#A8ABB2" stroke-width="2" stroke-linecap="round"/>'+
      '<ellipse cx="24" cy="31.5" rx="3" ry="3.4" fill="#1A1416"/><ellipse cx="40" cy="31.5" rx="3" ry="3.4" fill="#1A1416"/><circle cx="25" cy="30.3" r="1" fill="#fff"/><circle cx="41" cy="30.3" r="1" fill="#fff"/>'+
      '<ellipse cx="32" cy="39.5" rx="4" ry="3" fill="#1A1416"/><ellipse cx="31" cy="38.5" rx="1.3" ry=".8" fill="#fff" opacity=".6"/><path d="M26 44Q32 54 38 44Z" fill="#5B2A33"/><ellipse cx="32" cy="48.8" rx="3.4" ry="2.8" fill="#E8798B"/>'+
      '<path d="M15 56Q32 63 49 56" fill="none" stroke="#6BB3A6" stroke-width="4.5" stroke-linecap="round"/><path d="M17 56.5Q32 62.5 47 56.5" fill="none" stroke="#CFE9E3" stroke-width="1.2" stroke-dasharray="2 3"/>';
  }else if(w==='mika'){
    o+='<rect width="64" height="64" fill="#F3E4D0"/><path d="M10 64C10 55 19 52 32 52S54 55 54 64Z" fill="#E0A058"/><path d="M14 61Q32 54 50 61" fill="none" stroke="#E7A8B5" stroke-width="5" stroke-linecap="round"/><rect x="29.5" y="56" width="5" height="4" rx="1.4" fill="#F06A3A"/>'+
      '<path d="M11 32C8 17 12 7 17 4C23 6 28 12 30 19Z" fill="#E0A058"/><path d="M15 27C14 18 15 12 18 9C21 11 24 14 25 19Z" fill="#E9B9A0"/><path d="M53 32C56 17 52 7 47 4C41 6 36 12 34 19Z" fill="#E0A058"/><path d="M49 27C50 18 49 12 46 9C43 11 40 14 39 19Z" fill="#E9B9A0"/>'+
      '<ellipse cx="32" cy="36" rx="20" ry="17" fill="#E0A058"/><ellipse cx="23" cy="43" rx="10" ry="8" fill="#FBF1E1"/><ellipse cx="41" cy="43" rx="10" ry="8" fill="#FBF1E1"/><ellipse cx="32" cy="45" rx="8" ry="7" fill="#FBF1E1"/>'+
      '<ellipse cx="24" cy="28.5" rx="3.2" ry="2.1" fill="#FBF1E1"/><ellipse cx="40" cy="28.5" rx="3.2" ry="2.1" fill="#FBF1E1"/><ellipse cx="24" cy="34" rx="2.8" ry="3.2" fill="#2A1C16"/><ellipse cx="40" cy="34" rx="2.8" ry="3.2" fill="#2A1C16"/><circle cx="24.9" cy="32.9" r=".9" fill="#fff"/><circle cx="40.9" cy="32.9" r=".9" fill="#fff"/>'+
      '<ellipse cx="32" cy="42" rx="3.6" ry="2.6" fill="#2A1C16"/><path d="M32 44.5v2.5M32 47q-3 3-6 .6M32 47q3 3 6 .6" fill="none" stroke="#2A1C16" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="32" cy="51" rx="2.6" ry="2.4" fill="#E8798B"/>';
  }else{
    o+='<rect width="64" height="64" fill="#E7E0D2"/><path d="M32 50C14 38 14 22 24 20C28 19 31 22 32 25C33 22 36 19 40 20C50 22 50 38 32 50Z" fill="#D58C55"/><path d="M26 26q-3 1-3 5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>';
  }
  return o+'</svg>';
}

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const state = { who: store.get('who', ''), filter: store.get('filter', ''), hist: { person: '', chore: '', status: '' }, fair: 'week', showArchived: false };

async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== '/login') { showLogin(); throw new Error('Passcode required'); }
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}

const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmtDay = (s) => parseYmd(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
function dueLabel(s) {
  const diff = Math.round((parseYmd(s) - parseYmd(todayStr())) / 864e5);
  if (diff === 0) return 'today'; if (diff === 1) return 'tomorrow'; if (diff === -1) return 'yesterday';
  return fmtDay(s);
}
const sameDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === todayStr(); };

function toast(msg, { undo, error } = {}) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' err' : '');
  el.innerHTML = `${icon(error ? 'x' : 'check')}<span>${esc(msg)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
  if (undo) $('button', el).onclick = async () => { el.remove(); try { await undo(); } catch (e) { toast(e.message, { error: true }); } };
  $('#toasts').append(el);
  setTimeout(() => el.remove(), undo ? 7000 : 3500);
}
const fail = (e) => toast(e.message || 'Something went wrong', { error: true });

function copyText(text) {
  const done = () => toast('Copied');
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done, () => legacyCopy(text, done));
  legacyCopy(text, done);
}
function legacyCopy(text, done) {
  const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.append(t); t.select();
  try { document.execCommand('copy'); done(); } catch { toast('Select and copy the link manually', { error: true }); }
  t.remove();
}

// ---------- shell ----------
const NAV = [['today', 'Today', 'today'], ['weekend', 'Weekend', 'calendar'], ['projects', 'Projects', 'projects'], ['history', 'History', 'history'], ['settings', 'Settings', 'settings']];

function buildShell() {
  $('#root').innerHTML = `
  <div class="app">
    <nav class="rail" aria-label="Main">
      <div class="brand">${icon('home')}<span>Chores</span></div>
      ${NAV.map(([id, label, ic]) => `<a class="nav-btn" href="#/${id}" data-nav="${id}"><span class="nico">${icon(ic)}${id === 'today' ? '<b class="dot" id="badge" hidden></b>' : ''}</span><span>${label}</span></a>`).join('')}
    </nav>
    <main class="stage">
      <header class="top"><div><h1 id="title"></h1><p id="sub"></p></div><div class="who" id="who"></div></header>
      <div class="content" id="content"></div>
    </main>
  </div>`;
  renderWho();
}

function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
}

function renderWho() {
  const el = $('#who'); if (!el) return;
  el.innerHTML = `<button type="button" class="btn icon" data-act="theme" aria-label="Switch day or night theme" title="Day or night">${icon(isDark() ? 'sun' : 'moon', 'sm')}</button>`;
}
function setTop(title, sub = '') { $('#title').textContent = title; $('#sub').textContent = sub; }
function setBadge(n) {
  const b = $('#badge'); if (b) { b.hidden = !n; b.textContent = n; b.classList.toggle('wide', n > 9); }
  try { n ? navigator.setAppBadge?.(n) : navigator.clearAppBadge?.(); } catch { /* unsupported */ }
}

function overlay(html) { $('#overlay').innerHTML = html ? `<div class="scrim" data-act="close"></div>${html}` : ''; }
const sheet = (html) => overlay(`<div class="sheet" role="dialog" aria-modal="true">${html}</div>`);
const overlayOpen = () => !!$('#overlay').firstChild;

function showLogin() {
  if ($('#loginform')) return;
  sheet(`<form id="loginform" class="stack form" data-form="login" style="text-align:center"><h2>Passcode</h2><p class="muted">Enter the passcode once. This phone will remember it.</p>
    <input class="tin" id="l_code" type="password" autocomplete="current-password" placeholder="Passcode" required style="text-align:center"><div class="err" id="ferr"></div><button class="btn primary big" type="submit">Open</button></form>`);
  setTimeout(() => $('#l_code')?.focus(), 50);
}

function askWho(then) {
  sheet(`<div class="whomodal"><h2>Who am I?</h2><p class="muted">Pick once. This phone will remember it.</p>
    ${PEOPLE.map((p) => `<button class="btn big" data-act="setwho" data-p="${p}">${pdot(p)} ${p}</button>`).join('')}</div>`);
  askWho.then = then;
}

// ---------- router ----------
let renderToken = 0;
async function render() {
  const token = ++renderToken;
  const path = location.pathname;
  if (path.startsWith('/c/')) { return viewConfirm(decodeURIComponent(path.slice(3))); }
  if (!$('#content')) buildShell();
  const route = (location.hash.replace(/^#\//, '') || 'today').split('?')[0];
  document.querySelectorAll('[data-nav]').forEach((a) => (a.dataset.nav === route ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const views = { today: viewToday, weekend: viewWeekend, projects: viewProjects, history: viewHistory, settings: viewSettings, tags: viewTags };
  try {
    const html = await (views[route] || viewToday)();
    if (token !== renderToken || !html) return;
    const c = $('#content'); const st = c.scrollTop;
    c.innerHTML = html; c.scrollTop = st;
    if (route !== 'today') api('/today').then((d) => setBadge(myDue(d.chores).length)).catch(() => {});
    afterRender[route]?.();
  } catch (e) { $('#content').innerHTML = `<div class="card"><div class="empty">${icon('x')}<span>${esc(e.message)}</span></div></div>`; }
}
const afterRender = {};
afterRender.today = afterRender.weekend = () => { if (state.fire) { state.fire = false; confetti(); } };
window.addEventListener('hashchange', render);

// ---------- Today ----------
// Whose chores are on screen: a person's name, or 'all'. Defaults to the person using this phone.
const viewAs = () => state.filter || state.who || 'all';
const ownerInView = (o) => viewAs() === 'all' || o === viewAs() || o === 'Both';
const doneInView = (x) => viewAs() === 'all' || x.owner === viewAs() || x.owner === 'Both' || x.done_by === viewAs();
const scopeBar = () => `<div class="seg scope" role="group" aria-label="Whose chores">${PEOPLE.map((p) => `<button type="button" data-act="scope" data-v="${p}" aria-pressed="${viewAs() === p}">${pdot(p, true)}${p}</button>`).join('')}<button type="button" data-act="scope" data-v="all" aria-pressed="${viewAs() === 'all'}">Everyone</button></div>`;
const whoTitle = (everyone, you, other) => (viewAs() === 'all' ? everyone : viewAs() === state.who ? you : other(viewAs()));

// Weekend chores (weekly or longer, on Sat/Sun/"weekend") stay off Today from Monday to Friday. They are on the Weekend tab.
const isWeekendChore = (c) => c.frequency !== 'daily' && [0, 6, 7].includes(c.pref_dow);
const hideOnToday = (c) => { const g = new Date().getDay(); return g >= 1 && g <= 5 && isWeekendChore(c); };
const myDue = (chores) => chores.filter((c) => !c.automated && !hideOnToday(c) && (c.owner === state.who || c.owner === 'Both'));
const todRank = (c) => (c.time_of_day === 'morning' ? 0 : c.time_of_day === 'night' ? 2 : 1);

function choreCard(c) {
  const chips = [];
  if (c.overdue_days > 0) chips.push(`<span class="chip hot">${c.overdue_days}d overdue</span>`);
  if (c.time_of_day) chips.push(`<span class="chip">${c.time_of_day === 'morning' ? 'Morning' : 'Night'}</span>`);
  chips.push(`<span>${c.minutes} min</span>`, `<span>· ${FREQ[c.frequency]}</span>`);
  const done = c.steps.filter((s) => s.checked).length;
  if (c.steps.length) chips.push(`<span class="chip ok">${done}/${c.steps.length} steps</span>`);
  return `<article class="card chore ${CLS[c.owner]}" data-owner="${esc(c.owner)}" data-id="${c.id}">
    <button class="tick" data-act="complete" data-id="${c.id}" aria-label="Mark ${esc(c.name)} done">${icon('check')}</button>
    <div class="grow">
      <div class="name">${esc(c.name)}</div>
      <div class="meta">${chips.join('')}</div>
      <button type="button" class="skiplink" data-act="skip" data-id="${c.id}" data-owner="${esc(c.owner)}">Skip</button>
      ${c.steps.length ? `<ul class="steps">${c.steps.map((s) => `<li><button type="button" data-act="step" data-id="${c.id}" data-sid="${s.id}" aria-pressed="${s.checked}"><span class="cb">${icon('check')}</span><span class="t">${esc(s.label)}</span></button></li>`).join('')}</ul>` : ''}
    </div>
    <span class="own">${pdot(c.owner)}</span>
  </article>`;
}

async function viewToday() {
  const d = await api('/today');
  setBadge(myDue(d.chores).length);
  const all = d.chores.filter((c) => !c.automated && !hideOnToday(c));
  const list = all.filter((c) => ownerInView(c.owner));
  const mins = list.reduce((a, c) => a + c.minutes, 0), over = list.filter((c) => c.overdue_days > 0).length;
  const done = d.done_today.filter(doneInView);
  const allDone = !list.length && done.length > 0;
  setTop('Today', `${fmtDay(d.today)} · ${list.length ? `${list.length} to do · about ${mins} min${over ? ` · ${over} overdue` : ''}` : allDone ? 'all done' : 'all clear'}`);
  const order = viewAs() === 'all' ? [state.who || 'Vanessa', state.who === 'Katalina' ? 'Vanessa' : 'Katalina', 'Both'] : [viewAs(), 'Both'];
  let body = '';
  for (const o of order.filter(Boolean)) {
    const items = list.filter((c) => c.owner === o).sort((a, b) => todRank(a) - todRank(b) || a.next_due.localeCompare(b.next_due));
    if (!items.length) continue;
    body += `<h2 class="grp">${pdot(o)}${o === 'Both' ? 'Shared' : esc(o) + (o === state.who ? ' (you)' : '')} <small>${items.length} · ${items.reduce((a, c) => a + c.minutes, 0)} min</small></h2><div class="stack" style="gap:0">${items.map(choreCard).join('')}</div>`;
  }
  if (allDone) body = celebrateCard(whoTitle('All done for today!', `All done${state.who ? ', ' + state.who : ''}!`, (p) => `${p}'s chores are done!`), done);
  else if (!body) body = `<div class="card"><div class="empty">${icon('sparkle')}<span><b>Nothing due${viewAs() === 'all' ? '' : viewAs() === state.who ? ' for you' : ' for ' + viewAs()}.</b> Enjoy it.</span></div></div>`;
  if (allDone && state.prevLeft > 0) state.fire = true;
  state.prevLeft = list.length;
  return `<div class="row sb" style="margin-bottom:6px;flex-wrap:wrap">
      ${scopeBar()}
    </div>${body}
    ${doneSection(done)}`;
}

function doneSection(items) {
  if (!items.length) return '';
  const row = (x) => `<article class="card chore isdone ${x.skipped ? 'skipped ' : ''}${CLS[x.owner] || 'b'}"><button class="tick" data-act="undo" data-cid="${x.id}" data-name="${esc(x.chore_name)}" data-owner="${esc(x.owner)}" aria-label="Undo ${esc(x.chore_name)}">${icon(x.skipped ? 'skip' : 'check')}</button><div class="grow"><div class="name">${esc(x.chore_name)}</div><div class="meta">${x.skipped ? '<span class="chip">Skipped</span>' : ''}<span>${esc(x.done_by)}${x.done_by !== x.owner && x.owner !== 'Both' ? ` for ${esc(x.owner)}` : ''} · ${fmtTime(x.completed_at)}</span></div></div><span class="own">${pdot(x.done_by)}</span></article>`;
  return `<h2 class="grp">Done <small>${items.filter((x) => !x.skipped).length} done${items.some((x) => x.skipped) ? ` · ${items.filter((x) => x.skipped).length} skipped` : ''} · ${items.reduce((s, x) => s + x.minutes, 0)} min · tap to undo</small></h2><div class="stack" style="gap:0">${items.map(row).join('')}</div>`;
}

const CHEERS = ['Nice work, team.', 'The house is happy.', 'Go put your feet up.', 'That is how it is done.', 'Tomorrow you start fresh.', 'Look at you two.'];
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#D58C55', '#6FA096', '#C9A24E', '#8DB0A3', '#F1D3B8', '#4D7469', '#E0A070'];
  const box = document.createElement('div'); box.className = 'confetti';
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('i'), r = Math.random;
    p.style.cssText = `left:${r() * 100}%;width:${6 + r() * 7}px;height:${9 + r() * 9}px;background:${colors[i % colors.length]};--dx:${(r() - .5) * 160}px;--r:${(r() - .5) * 1080}deg;--t:${2.4 + r() * 1.8}s;--d:${r() * .7}s`;
    box.append(p);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 5000);
}
function celebrateCard(title, done) {
  const n = done.filter((x) => !x.skipped).length, sk = done.length - n, mins = done.reduce((s, x) => s + x.minutes, 0);
  const who = [...new Set(done.map((x) => x.done_by))];
  return `<div class="card celebrate"><div class="cele-badge">${icon('check')}</div><h2>${esc(title)}</h2>
    <p class="muted">${n} done${sk ? ` · ${sk} skipped` : ''}${mins ? ` · ${mins} min` : ''}. ${CHEERS[new Date().getDate() % CHEERS.length]}</p>
    <div class="row" style="justify-content:center;gap:6px">${who.map((p) => pdot(p)).join('')}</div></div>`;
}

function needWho(fn) { if (!state.who) { askWho(fn); return false; } return true; }

async function doComplete(id, owner, cardEl) {
  if (!needWho(() => doComplete(id, owner, cardEl))) return;
  const me = state.who;
  try {
    if (cardEl) cardEl.style.opacity = '.55';
    const r = await api(`/chores/${id}/complete`, 'POST', { by: me });
    toast(owner !== me && owner !== 'Both' ? `${me} did ${owner}'s chore` : 'Done. Nice work.', { undo: () => api('/completions/' + r.completion_id, 'DELETE').then(render) });
    render();
  } catch (e) { if (cardEl) cardEl.style.opacity = ''; fail(e); }
}

// ---------- Weekend ----------
async function viewWeekend() {
  const [{ chores }, hist] = await Promise.all([api('/chores'), api('/history?limit=300')]);
  const now = new Date(), dow = now.getDay();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dow === 0 ? 7 : 7 - dow));
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  const list = chores.filter((c) => !c.archived && !c.automated && c.frequency !== 'daily' && [0, 6, 7].includes(c.pref_dow) && c.next_due <= endStr
    && ownerInView(c.owner));
  const mins = list.reduce((a, c) => a + c.minutes, 0);
  const ids = new Set(chores.filter((c) => !c.archived && c.frequency !== 'daily' && [0, 6, 7].includes(c.pref_dow)).map((c) => c.id));
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dow === 0 ? 1 : dow === 6 ? 0 : 99)).toLocaleDateString('en-CA');
  const done = hist.items.filter((x) => x.completed_date >= since && ids.has(x.chore_id) && doneInView(x));
  const allDone = !list.length && done.length > 0;
  setTop('Weekend', list.length ? `${list.length} to do · about ${mins} min` : allDone ? 'all done' : 'all clear');
  let body = '';
  for (const [d, label] of [[7, 'Saturday or Sunday'], [6, 'Saturday'], [0, 'Sunday']]) {
    const items = list.filter((c) => c.pref_dow === d).sort((a, b) => a.next_due.localeCompare(b.next_due) || todRank(a) - todRank(b));
    if (!items.length) continue;
    body += `<h2 class="grp">${label} <small>${items.length} · ${items.reduce((a, c) => a + c.minutes, 0)} min</small></h2><div class="stack" style="gap:0">${items.map(choreCard).join('')}</div>`;
  }
  if (allDone) body = celebrateCard(whoTitle('Weekend chores done!', `Weekend chores done${state.who ? ', ' + state.who : ''}!`, (p) => `${p}'s weekend chores are done!`), done);
  else if (!body) body = `<div class="card"><div class="empty">${icon('sparkle')}<span><b>Nothing left this weekend.</b> Enjoy it.</span></div></div>`;
  if (allDone && state.prevLeftW > 0) state.fire = true;
  state.prevLeftW = list.length;
  return `<div class="row sb" style="margin-bottom:6px">${scopeBar()}</div>${body}${doneSection(done)}`;
}

// ---------- Projects ----------
async function viewProjects() {
  const { projects } = await api('/projects');
  setTop('Projects', `${projects.filter((p) => p.status !== 'done').length} open`);
  const sec = (st) => {
    const items = projects.filter((p) => p.status === st);
    return `<h2 class="grp">${STATUS[st]} <small>${items.length}</small></h2>
    ${items.length ? `<div class="grid">${items.map(projectCard).join('')}</div>` : `<p class="small" style="margin:0 4px">Nothing here.</p>`}`;
  };
  return `<div class="row" style="margin-bottom:4px"><button class="btn primary" data-act="newproject">${icon('plus')}New project</button></div>${sec('doing')}${sec('todo')}${sec('done')}`;
}
function projectCard(p) {
  const done = p.tasks.filter((t) => t.done).length;
  const next = { todo: ['doing', 'Start'], doing: ['done', 'Finish'], done: ['todo', 'Reopen'] }[p.status];
  return `<article class="card${p.status === 'done' ? ' pdone' : ''}"><div class="row sb"><b style="font-size:17px">${esc(p.name)}</b><div class="row" style="gap:4px">${(p.owners.length ? p.owners : ['Both']).map((o) => pdot(o, true)).join('')}</div></div>
    ${p.notes ? `<p class="muted" style="margin-top:6px;font-size:14px;white-space:pre-wrap">${esc(p.notes.length > 140 ? p.notes.slice(0, 140) + '…' : p.notes)}</p>` : ''}
    ${p.tasks.length ? `<div class="bar" style="--pc:var(--primary)"><i style="width:${Math.round((done / p.tasks.length) * 100)}%"></i></div><ul class="steps">${p.tasks.map((t) => `<li><button type="button" data-act="ptask" data-id="${p.id}" data-tid="${t.id}" aria-pressed="${t.done}"><span class="cb">${icon('check')}</span><span class="t">${esc(t.label)}</span></button></li>`).join('')}</ul>` : ''}
    <div class="acts" style="margin-top:12px;justify-content:flex-start"><button class="btn sm ${p.status === 'done' ? '' : 'primary'}" data-act="pstatus" data-id="${p.id}" data-st="${next[0]}">${next[1]}</button><button class="btn sm ghost" data-act="editproject" data-id="${p.id}">${icon('edit', 'sm')}Edit</button></div></article>`;
}
function taskRow(t = {}) {
  return `<div class="row trow" data-id="${t.id || ''}"><input type="checkbox" ${t.done ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--primary)" aria-label="Done"><input class="tin" value="${esc(t.label || '')}" placeholder="Sub-task"><button type="button" class="btn icon sm ghost" data-act="rmtask" aria-label="Remove">${icon('x', 'sm')}</button></div>`;
}
function projectSheet(p) {
  const isNew = !p;
  p = p || { name: '', owners: [], status: 'todo', notes: '', tasks: [] };
  sheet(`<h2>${isNew ? 'New project' : 'Edit project'}</h2>
  <form class="stack form" data-form="project" data-id="${p.id || ''}" style="gap:12px">
    <label>Name<input class="tin" id="p_name" required value="${esc(p.name)}"></label>
    <div class="f2"><label>Status<select class="sel" id="p_status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <div><div class="small" style="font-weight:600;margin-bottom:8px">Owner(s)</div><div class="row">${PEOPLE.map((o) => `<label class="chk"><input type="checkbox" name="p_owner" value="${o}" ${p.owners.includes(o) ? 'checked' : ''}>${o}</label>`).join('')}</div></div></div>
    <label>Notes<textarea class="txt" id="p_notes">${esc(p.notes)}</textarea></label>
    <div><div class="small" style="font-weight:600;margin-bottom:8px">Sub-tasks</div><div class="stack" style="gap:8px" id="p_tasks">${p.tasks.map(taskRow).join('')}</div><button type="button" class="btn sm ghost" data-act="addtask" style="margin-top:8px">${icon('plus', 'sm')}Add sub-task</button></div>
    <div class="err" id="ferr"></div>
    <div class="acts">${isNew ? '' : `<button type="button" class="btn ghost" data-act="delproject" data-id="${p.id}" style="margin-right:auto">Delete</button>`}<button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary" type="submit">Save</button></div>
  </form>`);
}

// ---------- Fairness ----------
function barChart(buckets, planned, label) {
  const W = 360, H = 210, L = 32, R = 6, T = 16, B = 28;
  const vals = buckets.flatMap((b) => [b.Vanessa, b.Katalina]).concat([planned.Vanessa, planned.Katalina]);
  const max = Math.max(30, ...vals) * 1.12;
  const step = [10, 15, 20, 30, 60, 120, 240, 480].find((s) => max / s <= 4.5) || 480;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const gw = (W - L - R) / buckets.length, bw = Math.min(16, gw * 0.36);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Minutes completed per person">`;
  for (let v = 0; v <= max; v += step) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 5}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
  buckets.forEach((b, i) => {
    const cx = L + gw * i + gw / 2;
    PEOPLE.forEach((p, j) => {
      const x = cx + (j ? 1.5 : -bw - 1.5), v = b[p];
      s += `<rect x="${x}" y="${y(v)}" width="${bw}" height="${Math.max(0, y(0) - y(v))}" rx="3" fill="var(--p-${p.toLowerCase()})"><title>${p}: ${v} min</title></rect>`;
      if (v > 0 && buckets.length <= 8) s += `<text x="${x + bw / 2}" y="${y(v) - 3}" text-anchor="middle" style="font-size:9px">${v}</text>`;
    });
    s += `<text x="${cx}" y="${H - 9}" text-anchor="middle">${label(b)}</text>`;
  });
  PEOPLE.forEach((p) => { s += `<line x1="${L}" x2="${W - R}" y1="${y(planned[p])}" y2="${y(planned[p])}" stroke="var(--p-${p.toLowerCase()})" stroke-width="2" stroke-dasharray="5 4" opacity=".9"/>`; });
  return s + '</svg>';
}
async function viewFairness() {
  const f = await api('/fairness');
  setTop('Balance', 'Minutes completed vs. planned');
  const month = state.fair === 'month';
  const buckets = month ? f.months : f.weeks, planned = month ? f.planned_month : f.planned_week;
  const round = (o) => ({ Vanessa: Math.round(o.Vanessa), Katalina: Math.round(o.Katalina) });
  const pl = round(planned);
  const tot = { Vanessa: buckets.reduce((a, b) => a + b.Vanessa, 0), Katalina: buckets.reduce((a, b) => a + b.Katalina, 0) };
  const cur = buckets[buckets.length - 1];
  const share = (o) => { const t = o.Vanessa + o.Katalina; return t ? Math.round((o.Vanessa / t) * 100) : 50; };
  const splitBar = (o, unit) => { const v = share(o); return `<div class="split" role="img" aria-label="Vanessa ${v}%, Katalina ${100 - v}%"><div style="width:${v}%;background:var(--p-vanessa)">${v >= 14 ? v + '%' : ''}</div><div style="width:${100 - v}%;background:var(--p-katalina)">${100 - v >= 14 ? 100 - v + '%' : ''}</div></div>`; };
  const maxChore = Math.max(1, ...f.by_chore.map((c) => c.per_week));
  return `<div class="row sb" style="margin-bottom:12px"><div class="seg"><button data-act="fair" data-v="week" aria-pressed="${!month}">Weekly</button><button data-act="fair" data-v="month" aria-pressed="${month}">Monthly</button></div></div>
  <div class="grid">
    <section class="card"><div class="ch"><h2>${icon('chart')}Minutes completed</h2></div>
      ${barChart(buckets, planned, (b) => month ? parseYmd(b.start).toLocaleDateString(undefined, { month: 'short' }) : parseYmd(b.start).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))}
      <div class="legend" style="margin-top:8px"><span><i style="background:var(--p-vanessa)"></i>Vanessa</span><span><i style="background:var(--p-katalina)"></i>Katalina</span><span>Dashed line = planned per ${month ? 'month' : 'week'}</span></div>
    </section>
    <section class="card"><div class="ch"><h2>${month ? 'This month' : 'This week'}</h2></div>
      <div class="stats">${PEOPLE.map((p) => `<div class="${CLS[p]}"><div class="row" style="gap:8px">${pdot(p, true)}<b>${p}</b></div><div class="big-n tn" style="margin-top:6px">${cur[p]}<small class="muted" style="font-family:var(--font-body);font-size:14px"> / ${pl[p]} min</small></div><div class="bar"><i style="width:${Math.min(100, pl[p] ? (cur[p] / pl[p]) * 100 : 0)}%"></i></div></div>`).join('')}</div>
      <div class="ch" style="margin-top:20px"><h2>Actual split, last ${buckets.length} ${month ? 'months' : 'weeks'}</h2></div>${splitBar(tot)}
      <p class="small" style="margin-top:8px">${tot.Vanessa} min Vanessa · ${tot.Katalina} min Katalina. Credit goes to whoever completed it.</p>
    </section>
  </div>`;
}

// ---------- History ----------
async function viewHistory() {
  const h = state.hist;
  const qs = new URLSearchParams({ ...(h.person && { person: h.person }), ...(h.chore && { chore_id: h.chore }), ...(h.status && { status: h.status }), limit: 300 });
  const d = await api('/history?' + qs);
  setTop('History', `${d.items.length} completions`);
  const days = {};
  for (const x of d.items) (days[fmtDay(new Date(x.completed_at).toLocaleDateString('en-CA'))] ||= []).push(x);
  return `<div class="filters">
    <select class="sel" id="h_person" aria-label="Person"><option value="">Everyone</option>${PEOPLE.map((p) => `<option ${h.person === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
    <select class="sel" id="h_status" aria-label="Status"><option value="">Done & skipped</option><option value="done" ${h.status === 'done' ? 'selected' : ''}>Done only</option><option value="skipped" ${h.status === 'skipped' ? 'selected' : ''}>Skipped only</option></select>
    <select class="sel" id="h_chore" aria-label="Chore"><option value="">All chores</option>${d.chores.map((c) => `<option value="${c.id}" ${String(h.chore) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
  ${d.streaks.length ? `<div class="card" style="margin-bottom:16px"><div class="ch"><h2>${icon('flame')}Daily streaks</h2></div><div class="row" style="flex-wrap:wrap;gap:8px">${d.streaks.map((s) => `<span class="chip ${s.current >= 3 ? 'ok' : ''}">${icon('flame')}${esc(s.name)}: ${s.current} day${s.current === 1 ? '' : 's'} <span style="opacity:.7">(best ${s.best})</span></span>`).join('')}</div></div>` : ''}
  ${d.items.length ? Object.entries(days).map(([day, xs]) => `<h2 class="grp" style="font-size:18px">${day} <small>${xs.length}</small></h2><ul class="dl">${xs.map((x) => `<li>${pdot(x.done_by, true)}<div class="grow"><b>${esc(x.chore_name)}</b><div class="small">${esc(x.done_by)}${x.skipped ? ' skipped it' : x.done_by !== x.owner && x.owner !== 'Both' ? ` did ${esc(x.owner)}'s chore` : ''} · ${fmtTime(x.completed_at)}${x.via === 'nfc' ? ' · tag' : ''}</div></div>${x.skipped ? '<span class="chip">Skipped</span>' : `<span class="small tn">${x.minutes ? x.minutes + ' min' : ''}</span>`}</li>`).join('')}</ul>`).join('') : `<div class="card"><div class="empty">${icon('history')}<span>No completions yet.</span></div></div>`}`;
}

// ---------- Settings ----------
async function viewSettings() {
  const [{ chores }, s] = await Promise.all([api('/chores?archived=1'), api('/settings')]);
  setTop('Settings', 'Chores, tags and reminders');
  const shown = chores.filter((c) => state.showArchived || !c.archived);
  return `<div class="stack">
  <section class="card"><div class="ch"><h2>This phone</h2></div><div class="row sb" style="flex-wrap:wrap"><span class="muted">Chores you tick are credited to this person.</span>
    <div class="seg" role="group" aria-label="Who uses this phone">${PEOPLE.map((p) => `<button type="button" data-act="who" data-p="${p}" aria-pressed="${state.who === p}">${pdot(p, true)}${p}</button>`).join('')}</div></div></section>
  <section class="card"><div class="ch"><h2>Chores</h2><div class="row"><label class="chk small"><input type="checkbox" id="showarch" ${state.showArchived ? 'checked' : ''}>Archived</label><button class="btn sm primary" data-act="newchore">${icon('plus', 'sm')}Add</button></div></div>
    ${Object.keys(FREQ).map((f) => { const g = shown.filter((c) => c.frequency === f); return g.length ? `<h3 class="grp" style="font-size:16px;margin:14px 2px 2px">${FREQ[f]}</h3>` + g.map((c) => `<div class="srow ${c.archived ? 'arch' : ''}"><button class="srow grow" style="border:0;padding:0" data-act="editchore" data-id="${c.id}">${pdot(c.owner)}<span class="grow"><b>${esc(c.name)}</b><small>${FREQ[c.frequency]}${c.pref_dow != null && c.frequency !== 'daily' ? ' · ' + (c.nth ? ORD[c.nth] + ' ' : '') + dowLabel(c.pref_dow) : ''}${c.time_of_day ? ' · ' + c.time_of_day : ''} · ${c.automated ? 'automated' : c.minutes + ' min'}${c.steps.length ? ' · ' + c.steps.length + ' steps' : ''}${c.archived ? ' · archived' : ''}</small></span></button>
      ${c.owner !== 'Both' && !c.archived ? `<button class="btn icon sm" data-act="swap" data-id="${c.id}" aria-label="Swap owner">${icon('swap', 'sm')}</button>` : ''}</div>`).join('') : ''; }).join('')}
  </section>
  <section class="card"><div class="ch"><h2>${icon('qr')}NFC / QR tags</h2></div><p class="muted" style="margin-bottom:12px">Every chore and project has a stable link like <code>/c/dishwasher</code>. Write them to NFC tags or print QR codes.</p><a class="btn" href="#/tags">Open tag sheet</a></section>
  <section class="card"><div class="ch"><h2>${icon('bell')}Reminders</h2></div>
    <form class="stack form" data-form="settings" style="gap:12px">
      <label class="chk"><input type="checkbox" id="s_en" ${s.reminders_enabled === '1' ? 'checked' : ''}>Send phone reminders (via ntfy)</label>
      <p class="small">Install the free <b>ntfy</b> app on each phone and subscribe to your topic. Use a hard-to-guess topic name. Use ntfy.sh, or point this at your own ntfy server.</p>
      <label>ntfy server<input class="tin" id="s_base" value="${esc(s.ntfy_base)}" placeholder="https://ntfy.sh"></label>
      <div class="f2">${PEOPLE.map((p) => `<label>${p}'s topic<input class="tin" id="s_t_${p}" value="${esc(s['topic_' + p])}" placeholder="e.g. chores-${p.toLowerCase()}-x7k2"></label>`).join('')}</div>
      <div class="f2"><label>Morning reminder<input class="tin" type="time" id="s_am" value="${esc(s.morning_time)}"></label><label>Evening reminder<input class="tin" type="time" id="s_pm" value="${esc(s.night_time)}"></label></div>
      <label>This app's address (used for tags and tap-to-open)<input class="tin" id="s_url" value="${esc(s.base_url)}" placeholder="${esc(location.origin)}"></label>
      <div class="err" id="ferr"></div>
      <div class="acts" style="justify-content:flex-start"><button class="btn primary" type="submit">Save</button>${PEOPLE.map((p) => `<button type="button" class="btn" data-act="testnotify" data-p="${p}">Test ${p}</button>`).join('')}</div>
    </form></section>
  <p class="small" style="text-align:center">To install: open this page on your phone, then Share → Add to Home Screen (iPhone) or menu → Install app (Android).</p></div>`;
}
function choreSheet(c) {
  const isNew = !c;
  c = c || { name: '', owner: state.who || 'Vanessa', frequency: 'weekly', pref_dow: null, time_of_day: null, minutes: 10, automated: false, rotates: false, notes: '', steps: [], archived: false, next_due: '' };
  sheet(`<h2>${isNew ? 'New chore' : 'Edit chore'}</h2>
  <form class="stack form" data-form="chore" data-id="${c.id || ''}" style="gap:12px">
    <label>Name<input class="tin" id="c_name" required value="${esc(c.name)}"></label>
    <div class="f2"><label>Owner<select class="sel" id="c_owner">${['Vanessa', 'Katalina', 'Both'].map((o) => `<option ${c.owner === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <label>Estimated minutes<input class="tin" id="c_min" type="number" min="0" max="1440" inputmode="numeric" value="${c.minutes}"></label></div>
    <div class="f2"><label>Frequency<select class="sel" id="c_freq">${Object.entries(FREQ).map(([k, v]) => `<option value="${k}" ${c.frequency === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Preferred day<select class="sel" id="c_dow"><option value="">Any</option>${DOW.map((d, i) => `<option value="${i}" ${c.pref_dow === i ? 'selected' : ''}>${d}</option>`).join('')}<option value="7" ${c.pref_dow === 7 ? 'selected' : ''}>Weekend (Sat or Sun)</option></select></label></div>
    <label>Which one (monthly or longer)<select class="sel" id="c_nth"><option value="">Any</option>${[1, 2, 3, 4].map((n) => `<option value="${n}" ${c.nth === n ? 'selected' : ''}>${ORD[n]} of the month</option>`).join('')}</select></label>
    <div class="f2"><label>Time of day<select class="sel" id="c_tod"><option value="">Any</option><option value="morning" ${c.time_of_day === 'morning' ? 'selected' : ''}>Morning</option><option value="night" ${c.time_of_day === 'night' ? 'selected' : ''}>Night</option></select></label>
      <label>Next due<input class="tin" type="date" id="c_due" value="${esc(c.next_due)}"></label></div>
    <label>Checklist steps (one per line)<textarea class="txt" id="c_steps" placeholder="Leave empty for a simple chore">${esc(c.steps.map((s) => s.label).join('\n'))}</textarea></label>
    <label>Notes<input class="tin" id="c_notes" value="${esc(c.notes || '')}"></label>
    <label class="chk"><input type="checkbox" id="c_auto" ${c.automated ? 'checked' : ''}>Automated (robot vacuum etc.), not counted in minutes</label>
    <label class="chk"><input type="checkbox" id="c_rot" ${c.rotates ? 'checked' : ''}>Rotate owner every time it's completed</label>
    <div class="err" id="ferr"></div>
    <div class="acts">${isNew ? '' : `<button type="button" class="btn ghost" data-act="archive" data-id="${c.id}" data-v="${c.archived ? 0 : 1}" style="margin-right:auto">${c.archived ? 'Restore' : 'Archive'}</button>`}<button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary" type="submit">Save</button></div>
  </form>`);
}

// ---------- Tags ----------
async function viewTags() {
  const [t, s] = await Promise.all([api('/tags'), api('/settings')]);
  const base = (s.base_url || location.origin).replace(/\/+$/, '');
  setTop('Tags', 'Links for NFC tags and QR codes');
  const card = (kind, x) => {
    const url = `${base}/c/${x.slug}`;
    let qr = ''; try { const q = qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch { /* too long */ }
    return `<article class="card tag"><div class="qr">${qr}</div><div><b>${esc(x.name)}</b> <span class="small">${kind}</span><code>${esc(url)}</code><button class="btn sm noprint" data-act="copy" data-url="${esc(url)}">Copy link</button></div></article>`;
  };
  return `<div class="row noprint" style="margin-bottom:14px;flex-wrap:wrap"><button class="btn primary" onclick="window.print()">Print sheet</button><a class="btn" href="#/settings">Back</a>
    <span class="small">Links use <b>${esc(base)}</b>. Change it under Settings → "This app's address" if that's not how your phones reach the server.</span></div>
  <h2 class="grp">Chores</h2><div class="grid">${t.chores.map((c) => card('chore', c)).join('')}</div>
  ${t.projects.length ? `<h2 class="grp">Projects</h2><div class="grid">${t.projects.map((p) => card('project', p)).join('')}</div>` : ''}`;
}

// ---------- /c/<slug> confirm page ----------
async function viewConfirm(slug) {
  const root = $('#root');
  root.innerHTML = '<div class="app" style="grid-template-columns:1fr"><main class="stage"><div class="content" id="content"><div class="spin">Loading…</div></div></main></div>';
  const out = $('#content');
  let by = state.who;
  try {
    const { kind, item } = await api('/c/' + encodeURIComponent(slug));
    const paint = (done) => {
      const isChore = kind === 'chore';
      const chooser = `<div class="by"><span class="small" style="font-weight:600">Done by</span><div class="seg">${PEOPLE.map((p) => `<button data-act="by" data-p="${p}" aria-pressed="${by === p}">${pdot(p, true)}${p}</button>`).join('')}</div></div>`;
      const home = `<a class="btn" href="/#/today">Open Today</a>`;
      if (done) { out.innerHTML = `<div class="confirm"><div class="bigcheck">${icon('check')}</div><h1>${esc(done.title)}</h1><p class="muted">${esc(done.sub)}</p><div class="row" style="justify-content:center">${done.undo ? '<button class="btn" data-act="cundo">Undo</button>' : ''}${home}</div></div>`; return; }
      if (isChore) {
        const last = item.last_done;
        const warn = last && sameDay(last.completed_at) ? `<div class="warn">${esc(last.done_by)} already ${last.skipped ? 'skipped' : 'did'} this today at ${fmtTime(last.completed_at)}.</div>` : '';
        out.innerHTML = `<div class="confirm"><div class="row" style="justify-content:center">${pdot(item.owner)}<span class="muted">${item.owner === 'Both' ? 'Shared' : esc(item.owner) + "'s"} chore · ${FREQ[item.frequency]} · ${item.minutes} min</span></div>
          <h1>Mark “${esc(item.name)}” done?</h1>
          <p class="muted">${item.overdue_days > 0 ? `Overdue by ${item.overdue_days} day${item.overdue_days === 1 ? '' : 's'}.` : `Next due ${dueLabel(item.next_due)}.`}${item.steps.length ? ' This marks every step done.' : ''}</p>${warn}${chooser}
          <button class="btn primary big" data-act="cdone" ${by ? '' : 'disabled'}>${icon('check')}Mark done</button><button type="button" class="skiplink" data-act="cskip" ${by ? '' : 'disabled'}>Skip this time</button>${home}</div>`;
      } else {
        const nx = { todo: ['doing', 'Start project'], doing: ['done', 'Mark done'], done: ['todo', 'Reopen'] }[item.status];
        out.innerHTML = `<div class="confirm"><span class="chip">${STATUS[item.status]}</span><h1>${esc(item.name)}</h1><p class="muted">${item.tasks.filter((t) => t.done).length}/${item.tasks.length} sub-tasks done</p>
          <button class="btn primary big" data-act="cproj" data-st="${nx[0]}">${nx[1]}</button>${home}</div>`;
      }
    };
    confirmCtx = {
      paint, item,
      setBy(p) { by = p; state.who = p; store.set('who', p); paint(); },
      async done() {
        try {
          const r = await api(`/chores/${item.id}/complete`, 'POST', { by, via: 'nfc' });
          confirmCtx.cid = r.completion_id;
          paint({ title: `Nice, ${by}!`, sub: `${item.name} is done. Next due ${dueLabel(r.chore.next_due)}.`, undo: true });
        } catch (e) { fail(e); }
      },
      async skip() {
        try {
          const r = await api(`/chores/${item.id}/skip`, 'POST', { by });
          confirmCtx.cid = r.completion_id;
          paint({ title: 'Skipped', sub: `${item.name} is skipped and logged. Next due ${dueLabel(r.chore.next_due)}.`, undo: true });
        } catch (e) { fail(e); }
      },
      async undo() { try { await api('/completions/' + confirmCtx.cid, 'DELETE'); paint(); toast('Undone'); } catch (e) { fail(e); } },
      async proj(st) { try { const p = await api('/projects/' + item.id, 'PUT', { status: st }); item.status = p.status; paint({ title: STATUS[p.status], sub: item.name }); } catch (e) { fail(e); } },
    };
    paint();
  } catch (e) {
    out.innerHTML = `<div class="confirm"><h1>Tag not found</h1><p class="muted">${esc(e.message)}</p><a class="btn" href="/#/today">Open Today</a></div>`;
  }
}
let confirmCtx = null;

// ---------- actions ----------
const busy = new Set();
async function once(key, fn) { if (busy.has(key)) return; busy.add(key); try { return await fn(); } finally { busy.delete(key); } }

const acts = {
  close: () => overlay(''),
  theme: () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('theme', next);
    renderWho();
  },
  who: (t) => { state.prevLeft = state.prevLeftW = undefined; state.filter = t.dataset.p; store.set('filter', t.dataset.p); state.who = t.dataset.p; store.set('who', state.who); renderWho(); render(); },
  setwho: (t) => { state.who = t.dataset.p; store.set('who', state.who); overlay(''); renderWho(); const f = askWho.then; askWho.then = null; if (f) f(); else render(); },
  scope: (t) => { state.prevLeft = state.prevLeftW = undefined; state.filter = t.dataset.v; store.set('filter', t.dataset.v); render(); },
  complete: (t) => once('c' + t.dataset.id, () => doComplete(Number(t.dataset.id), t.closest('[data-owner]')?.dataset.owner, t.closest('.chore'))),
  step: (t) => once('s' + t.dataset.sid, async () => {
    if (!needWho(() => acts.step(t))) return;
    try {
      const r = await api(`/chores/${t.dataset.id}/steps/${t.dataset.sid}/toggle`, 'POST', { by: state.who });
      if (r.completed) toast('All steps done. Chore complete.', { undo: () => api('/completions/' + r.completion_id, 'DELETE').then(render) });
      await render();
    } catch (e) { fail(e); }
  }),
  skip: (t) => once('c' + t.dataset.id, async () => {
    if (!needWho(() => acts.skip(t))) return;
    const card = t.closest('.chore'); if (card) card.style.opacity = '.55';
    try {
      const r = await api(`/chores/${t.dataset.id}/skip`, 'POST', { by: state.who });
      toast('Skipped. It is logged in History.', { undo: () => api('/completions/' + r.completion_id, 'DELETE').then(render) });
      await render();
    } catch (e) { if (card) card.style.opacity = ''; fail(e); }
  }),
  undo: (t) => once('u' + t.dataset.cid, async () => {
    try {
      await api('/completions/' + t.dataset.cid, 'DELETE');
      const o = t.dataset.owner, other = o && o !== viewAs() && o !== 'Both' && viewAs() !== 'all';
      toast(other ? `Restored. ${t.dataset.name} is back on ${o}'s list. Switch to Everyone to see it.` : `Restored ${t.dataset.name || 'chore'}.`);
      await render();
    } catch (e) { fail(e); }
  }),
  newchore: () => choreSheet(),
  editchore: async (t) => { const { chores } = await api('/chores?archived=1'); choreSheet(chores.find((c) => c.id === Number(t.dataset.id))); },
  swap: (t) => api(`/chores/${t.dataset.id}/swap`, 'POST').then(render).catch(fail),
  archive: (t) => api('/chores/' + t.dataset.id, 'PUT', { archived: t.dataset.v === '1' }).then(() => { overlay(''); render(); }).catch(fail),
  fair: (t) => { state.fair = t.dataset.v; render(); },
  newproject: () => projectSheet(),
  editproject: async (t) => { const { projects } = await api('/projects'); projectSheet(projects.find((p) => p.id === Number(t.dataset.id))); },
  delproject: (t) => { if (confirm('Delete this project?')) api('/projects/' + t.dataset.id, 'DELETE').then(() => { overlay(''); render(); }).catch(fail); },
  pstatus: (t) => api('/projects/' + t.dataset.id, 'PUT', { status: t.dataset.st }).then(render).catch(fail),
  ptask: (t) => api(`/projects/${t.dataset.id}/tasks/${t.dataset.tid}/toggle`, 'POST').then(render).catch(fail),
  addtask: () => { $('#p_tasks').insertAdjacentHTML('beforeend', taskRow()); $('#p_tasks .trow:last-child .tin').focus(); },
  rmtask: (t) => t.closest('.trow').remove(),
  copy: (t) => copyText(t.dataset.url),
  testnotify: (t) => api('/reminders/test', 'POST', { person: t.dataset.p }).then(() => toast('Sent. Check your phone.')).catch(fail),
  by: (t) => confirmCtx?.setBy(t.dataset.p),
  cdone: () => confirmCtx?.done(),
  cskip: () => confirmCtx?.skip(),
  cundo: () => confirmCtx?.undo(),
  cproj: (t) => confirmCtx?.proj(t.dataset.st),
};
document.addEventListener('click', (e) => { const t = e.target.closest('[data-act]'); if (t && acts[t.dataset.act]) { if (t.tagName === 'A') return; acts[t.dataset.act](t, e); } });

document.addEventListener('change', (e) => {
  const id = e.target.id;
  if (id === 'h_person') { state.hist.person = e.target.value; render(); }
  if (id === 'h_status') { state.hist.status = e.target.value; render(); }
  if (id === 'h_chore') { state.hist.chore = e.target.value; render(); }
  if (id === 'showarch') { state.showArchived = e.target.checked; render(); }
});

document.addEventListener('submit', async (e) => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const err = $('#ferr'); if (err) err.textContent = '';
  try {
    if (f.dataset.form === 'login') {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: $('#l_code').value }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Wrong passcode'); }
      overlay(''); await render(); if (!state.who) askWho();
    } else if (f.dataset.form === 'chore') {
      const body = {
        name: $('#c_name').value, owner: $('#c_owner').value, frequency: $('#c_freq').value, pref_dow: $('#c_dow').value, nth: $('#c_nth').value,
        time_of_day: $('#c_tod').value, minutes: $('#c_min').value, notes: $('#c_notes').value, next_due: $('#c_due').value,
        automated: $('#c_auto').checked, rotates: $('#c_rot').checked, steps: $('#c_steps').value.split('\n'),
      };
      f.dataset.id ? await api('/chores/' + f.dataset.id, 'PUT', body) : await api('/chores', 'POST', body);
      overlay(''); toast('Saved'); render();
    } else if (f.dataset.form === 'project') {
      const body = {
        name: $('#p_name').value, status: $('#p_status').value, notes: $('#p_notes').value,
        owners: [...document.querySelectorAll('[name=p_owner]:checked')].map((x) => x.value),
        tasks: [...document.querySelectorAll('#p_tasks .trow')].map((r) => ({ id: Number(r.dataset.id) || undefined, label: $('.tin', r).value, done: $('input[type=checkbox]', r).checked })),
      };
      f.dataset.id ? await api('/projects/' + f.dataset.id, 'PUT', body) : await api('/projects', 'POST', body);
      overlay(''); toast('Saved'); render();
    } else if (f.dataset.form === 'settings') {
      await api('/settings', 'PUT', {
        reminders_enabled: $('#s_en').checked ? '1' : '0', ntfy_base: $('#s_base').value, topic_Vanessa: $('#s_t_Vanessa').value, topic_Katalina: $('#s_t_Katalina').value,
        morning_time: $('#s_am').value, night_time: $('#s_pm').value, base_url: $('#s_url').value,
      });
      toast('Settings saved');
    }
  } catch (x) { if (err) err.textContent = x.message; else fail(x); }
});

// ---------- boot ----------
document.addEventListener('visibilitychange', () => { if (!document.hidden && !overlayOpen()) render(); });
setInterval(() => { if (!document.hidden && !overlayOpen() && !location.pathname.startsWith('/c/') && ['', '#/today', '#/projects'].includes(location.hash)) render(); }, 45000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
render().then(() => { if (!location.pathname.startsWith('/c/') && !state.who) askWho(); });

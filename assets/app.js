const $ = (s) => document.querySelector(s);
const TZ = 'Africa/Cairo';
const R = document.documentElement;
const ST = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch { return null; } };
const I = {
  ar: { all: 'الكل', eu: 'أوروبا', eng: 'إنجلترا', esp: 'إسبانيا', ita: 'إيطاليا', ger: 'ألمانيا', fra: 'فرنسا', egy: 'مصر', ksa: 'السعودية', yd: 'أمس', td: 'اليوم', tm: 'غداً', upd: 'آخر تحديث: ', none: 'لا توجد مباريات في هذا اليوم.', back: 'رجوع', nev: 'لا توجد أحداث مسجلة لهذه المباراة.', foot: 'النتائج تتحدث كل ساعتين وليست مباشرة.', name: 'كورة ستاتس', live: 'جارية', ft: 'انتهت' },
  en: { all: 'All', eu: 'Europe', eng: 'England', esp: 'Spain', ita: 'Italy', ger: 'Germany', fra: 'France', egy: 'Egypt', ksa: 'Saudi Arabia', yd: 'Yesterday', td: 'Today', tm: 'Tomorrow', upd: 'Last updated: ', none: 'No matches on this day.', back: 'Back', nev: 'No events recorded for this match.', foot: 'Results update every 2 hours and are not live.', name: 'Kora Stats', live: 'LIVE', ft: 'FT' }
};
let lang = ST('lang') === 'en' ? 'en' : 'ar', theme = ST('theme') === 'dark' ? 'dark' : 'light', cty = 'all', day = 0, db = null;
const T = (k) => I[lang][k] || k;
const LOC = () => (lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const key = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });
const dayKey = (n) => key(Date.now() + n * 864e5);
const hm = (d) => new Date(d).toLocaleTimeString(LOC(), { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const ico = { goal: '⚽', yellow: '🟨', red: '🟥' };

function apply() {
  R.lang = lang; R.dir = lang === 'ar' ? 'rtl' : 'ltr'; R.dataset.theme = theme;
  $('#lang').textContent = lang === 'ar' ? 'EN' : 'ع';
  $('#theme').textContent = theme === 'dark' ? '☀' : '☾';
  $('#logo').textContent = T('name'); $('#foot').textContent = T('foot');
  document.title = T('name') + (lang === 'ar' ? ' | نتائج المباريات' : ' | Football Results');
  chips(); days(); list(); sheet();
}
function chips() {
  const cs = ['all', ...new Set((db?.leagues || []).map((l) => l.c))];
  $('#chips').innerHTML = cs.map((c) => `<button data-c="${c}" class="${c === cty ? 'on' : ''}">${T(c)}</button>`).join('');
}
function days() {
  $('#days').innerHTML = [[-1, 'yd'], [0, 'td'], [1, 'tm']].map(([n, k]) => `<button data-d="${n}" class="${n === day ? 'on' : ''}">${T(k)}</button>`).join('');
}
function team(t, r) { return `<div class="t ${r ? 'r' : ''}"><img src="${esc(t.logo)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span>${esc(t.name)}</span></div>`; }
function score(m) {
  const live = m.state === 'in';
  const mid = m.state === 'pre' ? `<b>${hm(m.date)}</b>` : `<b>${esc(m.home.score)} - ${esc(m.away.score)}</b>`;
  const sub = m.state === 'pre' ? '' : live ? T('live') : T('ft');
  return `<div class="sc ${live ? 'live' : ''}">${mid}<small>${sub}</small></div>`;
}
function goals(m) {
  const g = m.events.filter((e) => e.kind === 'goal');
  if (!g.length) return '';
  const f = (s) => g.filter((e) => e.side === s).map((e) => `${esc(e.player)} ${esc(e.min)}`).join('، ');
  return `<div class="gl"><span>${f('home')}</span><span>${f('away')}</span></div>`;
}
function list() {
  if (!db) return;
  $('#upd').textContent = db.updated ? T('upd') + new Date(db.updated).toLocaleString(LOC(), { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }) : '';
  const dk = dayKey(day);
  const out = db.leagues.filter((l) => cty === 'all' || l.c === cty).map((l) => {
    const ms = db.matches.filter((m) => m.league === l.slug && key(m.date) === dk).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!ms.length) return '';
    return `<section class="lg"><h2>${esc(l[lang])}</h2>${ms.map((m) => `<button class="m" data-m="${esc(m.id)}">${team(m.home)}${score(m)}${team(m.away, 1)}${goals(m)}</button>`).join('')}</section>`;
  }).join('');
  $('#list').innerHTML = out || `<p class="empty">${T('none')}</p>`;
}
function sheet() {
  const id = decodeURIComponent(location.hash.slice(1)), el = $('#sheet');
  const m = db?.matches.find((x) => x.id === id);
  if (!m) { el.hidden = true; document.body.style.overflow = ''; return; }
  const l = db.leagues.find((x) => x.slug === m.league);
  const ev = m.events.map((e) => `<p class="${e.side === 'away' ? 'aw' : ''}"><span class="mn">${esc(e.min)}</span><span>${ico[e.kind]} ${esc(e.player)}</span></p>`).join('');
  const col = (t) => team(t).replace('class="t "', 'class="t" style="flex-direction:column"');
  el.innerHTML = `<div class="in"><button class="back" id="back">${T('back')}</button><div class="hd">${col(m.home)}${score(m)}${col(m.away)}</div><p class="upd">${esc(l?.[lang] || '')} · ${new Date(m.date).toLocaleString(LOC(), { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' })}</p><div class="ev">${ev || `<p>${T('nev')}</p>`}</div></div>`;
  el.hidden = false; document.body.style.overflow = 'hidden';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.c) { cty = b.dataset.c; chips(); list(); }
  else if (b.dataset.d) { day = +b.dataset.d; days(); list(); }
  else if (b.dataset.m) location.hash = encodeURIComponent(b.dataset.m);
  else if (b.id === 'back') { history.length > 1 ? history.back() : (location.hash = ''); }
  else if (b.id === 'lang') { lang = lang === 'ar' ? 'en' : 'ar'; ST('lang', lang); apply(); }
  else if (b.id === 'theme') { theme = theme === 'dark' ? 'light' : 'dark'; ST('theme', theme); apply(); }
});
window.addEventListener('hashchange', sheet);
async function load() {
  try { const r = await fetch('/data/matches.json?t=' + Date.now()); if (r.ok) db = await r.json(); } catch {}
  apply();
}
apply(); load(); setInterval(load, 600000);

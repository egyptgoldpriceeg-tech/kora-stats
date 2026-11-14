import { readFile, writeFile } from 'node:fs/promises';
const FILE = 'data/matches.json';
// ترتيب الدوريات حسب الأهمية. أضف سطراً جديداً لإضافة دوري.
const LEAGUES = [
  { slug: 'uefa.champions', ar: 'دوري أبطال أوروبا', en: 'Champions League', c: 'eu' },
  { slug: 'eng.1', ar: 'الدوري الإنجليزي', en: 'Premier League', c: 'eng' },
  { slug: 'esp.1', ar: 'الدوري الإسباني', en: 'La Liga', c: 'esp' },
  { slug: 'ita.1', ar: 'الدوري الإيطالي', en: 'Serie A', c: 'ita' },
  { slug: 'ger.1', ar: 'الدوري الألماني', en: 'Bundesliga', c: 'ger' },
  { slug: 'fra.1', ar: 'الدوري الفرنسي', en: 'Ligue 1', c: 'fra' },
  { slug: 'uefa.europa', ar: 'الدوري الأوروبي', en: 'Europa League', c: 'eu' },
  { slug: 'egy.1', ar: 'الدوري المصري', en: 'Egyptian Premier League', c: 'egy' },
  { slug: 'ksa.1', ar: 'الدوري السعودي', en: 'Saudi Pro League', c: 'ksa' }
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
async function getJSON(url) {
  let err;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'kora-stats-bot' } });
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return await r.json();
    } catch (e) { err = e; if (i < 2) await sleep(5000 * (i + 1)); }
  }
  throw err;
}
function parse(ev, slug) {
  const comp = ev.competitions?.[0];
  if (!comp) return null;
  const side = (ha) => {
    const c = comp.competitors?.find((x) => x.homeAway === ha);
    return c && { id: c.team?.id, name: c.team?.displayName || c.team?.name || '', logo: c.team?.logo || '', score: c.score ?? '' };
  };
  const home = side('home'), away = side('away');
  if (!home || !away) return null;
  const st = ev.status?.type || {};
  const events = (comp.details || []).map((d) => ({
    min: d.clock?.displayValue || '',
    side: d.team?.id === home.id ? 'home' : 'away',
    kind: d.scoringPlay ? 'goal' : d.redCard ? 'red' : d.yellowCard ? 'yellow' : 'other',
    player: d.athletesInvolved?.[0]?.displayName || '',
    text: d.type?.text || ''
  })).filter((e) => e.kind !== 'other');
  return { id: slug + '_' + ev.id, league: slug, date: ev.date, state: st.state || 'pre', status: st.shortDetail || st.detail || '', home, away, events };
}
async function main() {
  let db = { updated: null, leagues: [], matches: [] };
  try { db = JSON.parse(await readFile(FILE, 'utf8')); } catch {}
  const now = Date.now();
  const range = ymd(new Date(now - 86400000)) + '-' + ymd(new Date(now + 86400000));
  let ok = 0;
  for (const L of LEAGUES) {
    try {
      const j = await getJSON('https://site.api.espn.com/apis/site/v2/sports/soccer/' + L.slug + '/scoreboard?limit=100&dates=' + range);
      const list = (j.events || []).map((e) => parse(e, L.slug)).filter(Boolean);
      db.matches = db.matches.filter((m) => m.league !== L.slug).concat(list);
      ok++;
      console.log(L.slug, list.length);
    } catch (e) { console.warn('failed', L.slug, e.message); }
  }
  if (!ok) { console.error('all sources failed, keeping old data'); process.exit(1); }
  db.leagues = LEAGUES.map(({ slug, ar, en, c }, i) => ({ slug, ar, en, c, rank: i }));
  db.matches = db.matches.filter((m) => Math.abs(new Date(m.date) - now) < 4 * 86400000);
  db.updated = new Date().toISOString();
  await writeFile(FILE, JSON.stringify(db));
}
main().catch((e) => { console.error(e); process.exit(1); });

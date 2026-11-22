/* 代幣從哪裡來、哪幾天有來（2026-11-23）。只讀寫 localStorage，沒有畫面；decor.js（發幣）和 journal.js（上線日誌）共用。
   課程頁寫的紀錄（lessons/pdf-chapter.js）：
     pd-done      [課號…]                 完成本課
     pd-quiz      { 課號: 1 }             課後測驗全對（沒按「直接看答案」）
     pd-chapters  { 課號: [第幾章…] }      讀完一章（讀到章末）
     pd-time      { total, days:{日期:秒}, lessons:{課號:秒} }   學習時間
     pd-visits    { 日期: 1 }             哪幾天有來（首頁和課程頁都會記）
   這裡寫的：
     pd-awards    { 'streak:7@2026-11-20': 10 }   連續回來的獎勵。發過就留著：之後斷掉，已經拿到的代幣不會被收回。
   每個金額都在 decor/catalog.json 的 currency。 */
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null || typeof v !== 'object' ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dayOf = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const shift = (key, n) => { const d = dayOf(key); d.setDate(d.getDate() + n); return dayKey(d); };

/* 今天來過了。回傳 true ＝ 今天第一次。keep=false（?fresh）時不寫。 */
export function markVisit(keep = true) {
  const v = read('pd-visits', {}), k = dayKey(); if (v[k]) return false;
  v[k] = 1; if (keep) write('pd-visits', v); return true;
}
/* { 日期: 那天在課程頁的秒數（只來首頁沒上課是 0） }。學習時間有紀錄的日子也算有來。 */
export function days() {
  const out = {}, v = read('pd-visits', {}), t = read('pd-time', {}).days || {};
  Object.keys(v).forEach((k) => { if (/^\d{4}-\d\d-\d\d$/.test(k)) out[k] = 0; });
  Object.keys(t).forEach((k) => { if (/^\d{4}-\d\d-\d\d$/.test(k)) out[k] = +t[k] || 0; });
  return out;
}
/* 到今天為止連續幾天（今天還沒來就從昨天往回算）、最長幾天、總共幾天 */
export function streak(map = days(), today = dayKey()) {
  let end = map[today] !== undefined ? today : shift(today, -1), now = 0, start = null;
  while (map[end] !== undefined) { now++; start = end; end = shift(end, -1); }
  const keys = Object.keys(map).sort(); let best = 0, run = 0, prev = null;
  keys.forEach((k) => { run = prev && shift(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  return { now, start, best, total: keys.length };
}
/* 連續天數到了哪幾個門檻就記下來（只加不減）。回傳整份 pd-awards。 */
export function awardStreak(cur, keep = true) {
  const a = read('pd-awards', {}), s = streak(); let changed = false;
  Object.entries(cur.streak || {}).forEach(([n, coins]) => { const key = `streak:${n}@${s.start}`; if (s.now >= +n && !a[key]) { a[key] = +coins; changed = true; } });
  if (changed && keep) write('pd-awards', a);
  return a;
}
/* 下一個連續天數門檻：{ at: 7, coins: 10, left: 2 }；都拿完了回傳 null */
export function nextStreak(cur, s = streak()) {
  const n = Object.keys(cur.streak || {}).map(Number).sort((a, b) => a - b).find((x) => x > s.now);
  return n ? { at: n, coins: cur.streak[n], left: n - s.now } : null;
}

/* 每一筆拿到代幣的事：{ key, label, n }。key 不會變，decor.js 用它記「這筆螃蟹交給你了沒」。
   lessons ＝ 現在站上有的課（F4.byId），title(id) 給課名。 */
export function sources(cur, { has = () => true, firstTask = false, keep = true } = {}) {
  const out = [];
  const done = [...new Set(read('pd-done', []))].filter(has);
  done.forEach((id) => out.push({ key: `lesson:${id}`, label: `完成 ${id}`, n: cur.perLesson }));
  const quiz = read('pd-quiz', {});
  Object.keys(quiz).filter((id) => quiz[id] && has(id)).forEach((id) => out.push({ key: `quiz:${id}`, label: `${id} 測驗全對`, n: cur.perQuiz }));
  const ch = read('pd-chapters', {});
  Object.keys(ch).filter(has).forEach((id) => [...new Set(Array.isArray(ch[id]) ? ch[id] : [])].forEach((i) => out.push({ key: `chapter:${id}:${i}`, label: `讀完 ${id} 第 ${i + 1} 章`, n: cur.perChapter })));
  if (firstTask) out.push({ key: 'task:t1', label: '完成 60 秒體驗', n: cur.firstTask });
  const aw = awardStreak(cur, keep);
  Object.keys(aw).sort().forEach((key) => { const m = key.match(/^streak:(\d+)@/); if (m) out.push({ key, label: `連續 ${m[1]} 天回來`, n: +aw[key] || 0 }); });
  return out.filter((s) => s.n > 0);
}

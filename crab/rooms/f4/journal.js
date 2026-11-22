/* 上線日誌（2026-11-23）：右下角「日誌」鈕，打開一張月曆，看哪幾天有來、那天在課程頁多久，和連續幾天。
   資料全在 coins.js（pd-visits、pd-time）。decor.js 叫 mountJournal()；只在 3D 書桌的寬版出現。樣式在 decor.css 最後。 */
import { days, streak, nextStreak, dayKey } from './coins.js';

const WK = ['日', '一', '二', '三', '四', '五', '六'];
const mins = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} 小時${m % 60 ? ` ${m % 60} 分` : ''}` : `${m} 分`; };

export function mountJournal({ ctl, stage, currency, tell = () => {}, busy = () => false }) {
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'btn-journal'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'journal');
  ctl.prepend(btn);
  const box = document.createElement('section'); box.className = 'journal'; box.id = 'journal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '上線日誌'); box.hidden = true;
  box.innerHTML = `<header><h2>上線日誌</h2><button type="button" class="x" aria-label="關閉上線日誌">×</button></header>
    <p class="sum"></p>
    <div class="mon"><button type="button" class="prev" aria-label="上個月">‹</button><h3></h3><button type="button" class="next" aria-label="下個月">›</button></div>
    <ol class="wk" aria-hidden="true">${WK.map((w) => `<li>${w}</li>`).join('')}</ol>
    <ol class="grid"></ol>
    <p class="key" aria-hidden="true"><i class="came"></i>有來<i class="study"></i>有上課</p>
    <p class="tip" aria-live="polite"></p>
    <p class="award"></p>`;
  stage.appendChild(box);
  const $ = (q) => box.querySelector(q);
  let map = {}, view = new Date(), open = false, picked = null;

  const paintBtn = () => { const s = streak(); btn.innerHTML = `日誌<b>${s.now}</b>`; btn.title = `上線日誌（連續 ${s.now} 天）`; };
  const tipFor = (key) => {
    const [, m, d] = key.split('-').map(Number), s = map[key];
    return `${m} 月 ${d} 日：${s === undefined ? '沒有來' : s >= 30 ? `有來，在課程頁 ${mins(s)}` : '有來，沒有上課'}`;
  };
  function paint() {
    map = days(); const s = streak(map), today = dayKey();
    const total = Object.values(map).reduce((n, x) => n + x, 0);
    $('.sum').innerHTML = `<span><b>${s.now}</b>連續天數</span><span><b>${s.total}</b>累積天數</span><span><b>${s.best}</b>最長連續</span>`;
    const y = view.getFullYear(), m = view.getMonth();
    $('.mon h3').textContent = `${y} 年 ${m + 1} 月`;
    const first = Object.keys(map).sort()[0] || today, now = new Date();
    $('.prev').disabled = `${y}-${String(m + 1).padStart(2, '0')}` <= first.slice(0, 7);
    $('.next').disabled = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth());
    const lead = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
    let h = '<li class="pad" aria-hidden="true"></li>'.repeat(lead), came = 0, secs = 0;
    for (let d = 1; d <= n; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, v = map[key];
      const cls = [v === undefined ? '' : v >= 30 ? 'came study' : 'came', key === today ? 'today' : '', key > today ? 'later' : ''].filter(Boolean).join(' ');
      if (v !== undefined) { came++; secs += v; }
      h += `<li><button type="button" class="${cls}" data-day="${key}" aria-label="${tipFor(key)}"${key > today ? ' disabled' : ''}>${d}</button></li>`;
    }
    $('.grid').innerHTML = h;
    $('.tip').textContent = picked && picked.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`) ? tipFor(picked) : came ? `這個月來了 ${came} 天${secs >= 60 ? `，在課程頁 ${mins(secs)}` : ''}。點日期看那一天。` : '這個月還沒有紀錄。';
    const nx = nextStreak(currency, s);
    $('.award').innerHTML = nx ? `再連續 <b>${nx.left}</b> 天，滿 ${nx.at} 天可得 <b>${nx.coins}</b> ${currency.name}` : `連續回來的獎勵都拿到了`;
    $('.award').dataset.total = total;
    paintBtn();
  }
  function show(on, focus = true) {
    if (on === open || (on && busy())) return; open = on; box.hidden = !on; btn.setAttribute('aria-expanded', String(on));
    if (on) { view = new Date(); picked = null; paint(); tell('上線日誌已開啟。'); if (focus) $('.x').focus({ preventScroll: true }); }
    else if (focus) btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', () => show(!open));
  $('.x').addEventListener('click', () => show(false));
  $('.prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); picked = null; paint(); });
  $('.next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); picked = null; paint(); });
  $('.grid').addEventListener('click', (e) => { const b = e.target.closest('button[data-day]'); if (!b) return; picked = b.dataset.day; $('.tip').textContent = tipFor(picked); box.querySelectorAll('.grid .on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); show(false); } }, true);
  addEventListener('pointerdown', (e) => { if (open && !box.contains(e.target) && !btn.contains(e.target)) show(false, false); }, true);
  addEventListener('storage', (e) => { if (e.key === 'pd-visits' || e.key === 'pd-time') { if (open) paint(); else paintBtn(); } });
  paintBtn();
  return { btn, show, paint, get open() { return open; } };
}

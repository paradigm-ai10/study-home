/* 首版開課「試看」：開課選單在線上（或沒有存檔伺服器時）按「套用試看」，選的課存在這台瀏覽器的 localStorage
   'paradigm.firstTrial'；有這筆時，這支把頁面上的首版資料換成試看的清單，只有這台瀏覽器看得到，正本和線上版都不變。
   載入順序：放在 roadmap8.js（或 心智圖/data8.js）後面、讀它們的程式前面。它會改：
     window.ROADMAP8.first／counts.first_release／topics[].lessons、window.STAGES（首頁）
     window.MAP8.first／topics[].req/ele 的 first 旗標與 first 數量（捲軸地圖裡的地圖）
   頂層頁面另外在左下角放一條「試看中」小條：回選單、取消試看。
   window.FIRST_TRIAL = { on, ids, picker } 給其他程式看。 */
(() => {
  const KEY = 'paradigm.firstTrial';
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
  const here = document.currentScript && document.currentScript.src;
  // the picker sits next to this file
  const picker = here ? new URL('picker/', here).href : null;   // the online copy gets 'picker/' from the copy step
  window.FIRST_TRIAL = { on: false, ids: null, picker };
  if (!saved || !Array.isArray(saved.ids) || !saved.ids.length) return;

  const R8 = window.ROADMAP8, M8 = window.MAP8;
  const all = {};
  if (R8) R8.topics.forEach((t) => (t.all || []).forEach(([id, title, type, group]) => { all[id] = { id, title, type, group, topic: t }; }));
  if (M8) M8.topics.forEach((t) => t.req.concat(t.ele).forEach((l) => { if (!all[l.id]) all[l.id] = { id: l.id, title: l.title, topicId: t.id }; }));
  const ids = saved.ids.filter((id) => all[id]);
  if (!ids.length) return;
  const n = {}; ids.forEach((id, i) => { n[id] = i + 1; });

  if (R8) {
    R8.first = ids.slice();
    if (R8.counts) R8.counts.first_release = ids.length;
    R8.topics.forEach((t) => {
      t.lessons = (t.all || []).filter(([id]) => n[id]).map(([id, title, type, group]) => Object.assign({ id, title, type, n: n[id] }, group ? { group } : {}));
    });
    if (Array.isArray(window.STAGES)) {
      window.STAGES.forEach((s) => {
        const t = R8.topics.find((x) => x.id === s.id); if (!t) return;
        s.lessons = t.lessons.slice().sort((a, b) => a.n - b.n).map((l) => Object.assign({}, l, { can: t.outcome }));
      });
    }
  }
  if (M8) {
    const on = new Set(ids);
    M8.topics.forEach((t) => { t.req.concat(t.ele).forEach((l) => { l.first = on.has(l.id); }); t.first = t.req.concat(t.ele).filter((l) => l.first).length; });
    const tOf = {}; M8.topics.forEach((t) => t.req.concat(t.ele).forEach((l) => { tOf[l.id] = { title: l.title, topic: t.id }; }));
    M8.first = ids.filter((id) => tOf[id]).map((id) => ({ id, title: tOf[id].title, topic: tOf[id].topic }));
    if (M8.counts) M8.counts.first_release = M8.first.length;
  }
  window.FIRST_TRIAL = { on: true, ids, picker, base: saved.base || null, version: saved.version || null };

  // the little bar, on the top page only (not inside the map frame)
  if (window.top !== window) return;
  const bar = () => {
    if (document.getElementById('first-trial-bar')) return;
    const d = document.createElement('div');
    d.id = 'first-trial-bar'; d.setAttribute('role', 'status');
    d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:8px;background:#3A2E5C;color:#FFFBF3;font:14px/1.4 "Outfit","Huninn",-apple-system,"PingFang TC",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)';
    const stale = R8 && saved.version && String(saved.version) !== String(R8.version) ? `（課程地圖已更新到 v${R8.version}，清單可能過時）` : '';
    d.innerHTML = `<span>試看中：首版 ${ids.length} 課，只有這台瀏覽器看得到${stale}</span>`
      + (picker ? `<a href="${picker}" style="color:#FFC857">回選單</a>` : '')
      + '<button type="button" style="font:inherit;color:#FFFBF3;background:none;border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:2px 10px;cursor:pointer">取消試看</button>';
    d.querySelector('button').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
    document.body.appendChild(d);
  };
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);
})();

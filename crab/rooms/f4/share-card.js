/* 分享卡（學員證／雜誌封面）的共用部分：你的進度、把字排到書桌圖上、分享用的文字、能不能叫出系統的分享選單。
   不用 three.js。兩個地方用它：decor.js（電腦的佈置模式，書桌圖是當場從 3D 拍的）和 share-m.js（手機直式，書桌圖是預先拍好的 img/share-*.webp）。
   2026-11-23 從 decor.js 拆出來，排版一個字都沒改。 */
export const SHARE = { handle: '@paradigmai_tw', url: 'paradigm-study.pages.dev' };          // 網址：Cloudflare 那個（協作說明：之後正式用這個）
export const STYLES = [['pass', '學員證'], ['magazine', '雜誌封面']];
const DEV = /^(localhost|127\.|\[::1\]|.*\.localhost$)/.test(location.hostname);
/* what the card says about you: which role you are working toward and how far (first-release lessons in that role's topics),
   the lesson you finished last, and the time spent on lesson pages (pd-time, written by the lesson pages). `over` is for testing. */
export function stats(over) {
  const M8 = window.ROADMAP8 || {}, first = new Set(M8.first || []), title = {}, topicOf = {};
  (M8.topics || []).forEach((t) => (t.all || []).forEach(([id, ti]) => { title[id] = ti; topicOf[id] = t.id; }));
  let done = []; try { done = JSON.parse(localStorage.getItem('pd-done') || '[]'); } catch (e) { done = []; }
  let secs = 0; try { secs = +(JSON.parse(localStorage.getItem('pd-time') || '{}') || {}).total || 0; } catch (e) { secs = 0; }
  if (over) { if (over.done) done = over.done; if (over.secs != null) secs = over.secs; }
  done = done.filter((id) => title[id]);
  const roles = (M8.roles || []).map((r) => { const ids = [...first].filter((id) => r.topics.includes(topicOf[id])); return { name: r.name, total: ids.length, n: ids.filter((id) => done.includes(id)).length }; }).filter((r) => r.total);
  const role = roles.find((r) => r.n < r.total) || roles[roles.length - 1] || { name: 'AI Power User', total: 0, n: 0 };
  const m = Math.floor(secs / 60), time = m < 1 ? '' : m < 60 ? `${m} 分鐘` : `${Math.floor(m / 60)} 小時${m % 60 ? ` ${m % 60} 分` : ''}`;
  const last = done[done.length - 1];
  let per = {}; try { per = (JSON.parse(localStorage.getItem('pd-time') || '{}') || {}).lessons || {}; } catch (e) { per = {}; }
  if (over && over.per) per = over.per;
  return { role, lessons: done.length, time, last: last ? title[last] : '', list: done.map((id) => ({ id, title: title[id], min: Math.round((+per[id] || 0) / 60) })) };
}
/* one card, 1080×1920. pic ＝ the desk picture for this style (magazine 1080×1920, pass 720×600); back ＝ the desk behind the pass (any size, it is blurred) */
export function compose(style, st, pic, back) {
  const W = 1080, H = 1920;
  const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d');
  const ZH = 'Huninn, "PingFang TC", sans-serif', EN = 'Outfit, sans-serif', CREAM = '#FFF4E0', SUN = '#FFC857', GRAPE = '#3A2E5C', CORAL = '#FF6B57';
  const fit = (s, max) => { if (g.measureText(s).width <= max) return s; while (s.length > 1 && g.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };
  const text = (s, x, y, font, color, { align = 'left', alpha = 1, sp = 0 } = {}) => { g.font = font; g.fillStyle = color; g.globalAlpha = alpha; g.textAlign = align; g.letterSpacing = sp + 'px'; g.fillText(s, x, y); g.globalAlpha = 1; g.letterSpacing = '0px'; g.textAlign = 'left'; };
  const lead = st.role.total && st.role.n >= st.role.total ? '我已經是' : '我正在成為';
  const d = new Date(), date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  // the progress as one small mark per lesson (18 lessons, 18 marks): you can count them, a bar you cannot
  const ticks = (x, y, w, h, on, off) => { const n = st.role.total || 1, gap = Math.min(10, w / n * 0.28), tw = (w - gap * (n - 1)) / n; for (let i = 0; i < n; i++) { g.fillStyle = i < st.role.n ? on : off; g.beginPath(); g.roundRect(x + i * (tw + gap), y, tw, h, Math.min(h / 2, 6)); g.fill(); } };
  const barcode = (x, y, w, h, color) => { g.fillStyle = color; for (let cx = x, i = 0; cx < x + w; i++) { const bw = [2, 5, 2, 7, 3, 2, 6, 2, 4, 3][(i * 7 + st.role.n) % 10]; g.fillRect(cx, y, bw, h); cx += bw + [3, 2, 5, 2][i % 4]; } };
  g.textBaseline = 'alphabetic';

  if (style === 'magazine') {
    /* 雜誌封面：滿版書桌，刊頭橫跨上方，封面標題寫在桌面前緣空的木頭上（2026-11-23 磨細：字不再壓到筆和信封，
       大字收緊字距、小字放寬，暗角只鋪在字後面而且用畫面裡的暮色） */
    g.drawImage(pic, 0, 0);
    const X = 72, XR = W - 72;
    g.font = `600 100px ${EN}`; const fs = Math.floor((XR - X) / g.measureText('PARADIGM').width * 100 * 1.012);
    const top = g.createLinearGradient(0, 0, 0, 560); top.addColorStop(0, 'rgba(52,34,62,.5)'); top.addColorStop(1, 'rgba(52,34,62,0)'); g.fillStyle = top; g.fillRect(0, 0, W, 560);
    g.save(); g.shadowColor = 'rgba(30,18,40,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 4;
    text('PARADIGM', X - 6, 352, `600 ${fs}px ${EN}`, CREAM, { sp: -2 }); g.restore();
    g.fillStyle = CREAM; g.fillRect(X, 380, XR - X, 2);
    text('AI 學習誌', X, 420, `400 26px ${ZH}`, CREAM, { sp: 7 }); text(`${date}　第 ${st.role.n} 課`, XR, 420, `400 26px ${ZH}`, CREAM, { align: 'right', sp: 1 });
    const low = g.createLinearGradient(0, 1250, 0, 1760); low.addColorStop(0, 'rgba(46,28,44,0)'); low.addColorStop(0.5, 'rgba(46,28,44,.36)'); low.addColorStop(1, 'rgba(46,28,44,.5)'); g.fillStyle = low; g.fillRect(0, 1250, W, H - 1250);
    text(lead, X, 1420, `400 30px ${ZH}`, CREAM, { alpha: 0.9, sp: 4 });
    g.font = `500 104px ${EN}`; text(fit(st.role.name, XR - X), X - 5, 1524, `500 104px ${EN}`, CREAM, { sp: -2.5 });
    ticks(X, 1562, XR - X, 10, SUN, 'rgba(255,244,224,.28)');
    text(`已完成 ${st.role.n}／${st.role.total} 課`, X, 1628, `400 34px ${ZH}`, CREAM, { sp: 1 }); if (st.time) text(`學習 ${st.time}`, XR, 1628, `400 34px ${ZH}`, CREAM, { align: 'right', sp: 1 });
    text(SHARE.handle, X, 1690, `600 28px ${EN}`, SUN); text(SHARE.url, XR, 1690, `500 24px ${EN}`, CREAM, { align: 'right', alpha: 0.8 });
  } else if (style === 'pass') {
    /* 學員證：掛繩識別證，大頭照是你的螃蟹，後面是自己的書桌（模糊） */
    g.filter = 'blur(26px) brightness(.55) saturate(1.1)'; g.drawImage(back, -60, -100, W + 120, H + 200); g.filter = 'none';
    const vig = g.createRadialGradient(W / 2, 960, 420, W / 2, 960, 1250); vig.addColorStop(0, 'rgba(20,12,34,0)'); vig.addColorStop(1, 'rgba(20,12,34,.55)'); g.fillStyle = vig; g.fillRect(0, 0, W, H);
    const strap = g.createLinearGradient(460, 0, 620, 0); strap.addColorStop(0, '#241C3D'); strap.addColorStop(0.5, '#4A3B78'); strap.addColorStop(1, '#241C3D');
    g.fillStyle = strap; g.beginPath(); g.moveTo(470, 0); g.lineTo(520, 0); g.lineTo(552, 372); g.lineTo(524, 372); g.closePath(); g.fill(); g.beginPath(); g.moveTo(560, 0); g.lineTo(610, 0); g.lineTo(556, 372); g.lineTo(528, 372); g.closePath(); g.fill();
    const cx0 = 130, cy0 = 330, cw = 820, chh = 1250, L = cx0 + 50, Rr = cx0 + cw - 50;
    g.fillStyle = CREAM; g.shadowColor = 'rgba(8,4,20,.5)'; g.shadowBlur = 90; g.shadowOffsetY = 44; g.beginPath(); g.roundRect(cx0, cy0, cw, chh, 40); g.fill();      // far, soft: the room
    g.shadowColor = 'rgba(8,4,20,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.beginPath(); g.roundRect(cx0, cy0, cw, chh, 40); g.fill(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;   // near, tight: the card's own edge
    const edge = g.createLinearGradient(0, cy0, 0, cy0 + 90); edge.addColorStop(0, 'rgba(255,255,255,.75)'); edge.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = edge; g.lineWidth = 3; g.beginPath(); g.roundRect(cx0 + 1.5, cy0 + 1.5, cw - 3, chh - 3, 39); g.stroke();   // light catching the top edge
    g.fillStyle = 'rgba(42,33,68,.85)'; g.beginPath(); g.roundRect(W / 2 - 70, cy0 + 28, 140, 26, 13); g.fill();
    text('PARADIGM AI', L, cy0 + 122, `600 28px ${EN}`, GRAPE, { sp: 5 }); text('LEARNER PASS', Rr, cy0 + 122, `500 22px ${EN}`, GRAPE, { align: 'right', alpha: 0.62, sp: 4 });
    g.save(); g.beginPath(); g.roundRect(L, cy0 + 156, 720, 600, 26); g.clip(); g.drawImage(pic, L, cy0 + 156); g.restore();
    g.strokeStyle = 'rgba(58,46,92,.16)'; g.lineWidth = 2; g.beginPath(); g.roundRect(L + 1, cy0 + 157, 718, 598, 25); g.stroke();
    text(lead, L, cy0 + 826, `400 28px ${ZH}`, GRAPE, { alpha: 0.66, sp: 3 });
    g.font = `500 88px ${EN}`; text(fit(st.role.name, 720), L - 4, cy0 + 918, `500 88px ${EN}`, GRAPE, { sp: -2.2 });
    ticks(L, cy0 + 950, 720, 12, CORAL, 'rgba(58,46,92,.16)');
    [['已完成', `${st.role.n}／${st.role.total} 課`], ['學習時間', st.time || '剛開始'], ['日期', date]].forEach(([a, b], i) => { const x = L + i * 248; text(a, x, cy0 + 1024, `400 24px ${ZH}`, GRAPE, { alpha: 0.6 }); text(b, x, cy0 + 1070, `400 32px ${ZH}`, GRAPE, { sp: 0.5 }); });
    barcode(L, cy0 + 1118, 330, 70, GRAPE); text(SHARE.handle, Rr, cy0 + 1170, `600 28px ${EN}`, GRAPE, { align: 'right' });
    text(SHARE.url, W / 2, 1668, `500 26px ${EN}`, CREAM, { align: 'center', alpha: 0.8 });
  }
  return out;
}
export const shareText = (st = stats()) => {
  const a = st.role.n ? `我在 Paradigm AI 學習站完成了 ${st.role.n} 課，${st.role.name} 的進度 ${st.role.n}／${st.role.total}${st.time ? `，學習 ${st.time}` : ''}。` : '我開始在 Paradigm AI 學習站學 AI 了。';
  return a + (st.last ? `\n剛學完：${st.last}` : '') + `\n一起來學：https://${SHARE.url}/\n${SHARE.handle}`;
};
/* 手機分享選單：觸控裝置而且瀏覽器能分享檔案時，點預覽＝打開系統的分享選單（存到相簿、IG、LINE…）；其他情況下載。 */
export const fileOf = (blob, name) => new File([blob], `paradigm-${name}.png`, { type: 'image/png' });
if (DEV && /[?&]sharetest\b/.test(location.search)) { navigator.share = async (d) => { window.__shared = d; if (/sharetest=cancel/.test(location.search)) throw new DOMException('x', 'AbortError'); }; navigator.canShare = () => true; }   // our machines only: a pretend share sheet, to test on a laptop
export const CAN_SHARE = (() => { try { if (DEV && /[?&]sharetest\b/.test(location.search)) return true; return !!navigator.share && !!navigator.canShare && matchMedia('(pointer: coarse)').matches && navigator.canShare({ files: [fileOf(new Blob(['x'], { type: 'image/png' }), 'x')] }); } catch (e) { return false; } })();
export const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `paradigm-${name}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

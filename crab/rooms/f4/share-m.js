/* 手機直式的「分享圖片」入口（2026-11-23，Thomas：手機直式也要能分享）。
   手機直式沒有佈置模式，多半也沒有 3D（只有海報），所以這裡不拍書桌：用預先拍好的三張圖（img/share-*.webp，
   由 src/share-pics.cjs 產生，鏡頭跟電腦版的分享卡一樣）加上你的進度，排成同樣的學員證／雜誌封面。
   右下角一顆小按鈕 → 從下面升起兩張預覽 → 點哪張就打開系統的分享選單（不能分享的瀏覽器改成下載）。
   只在窄畫面（≤767px，跟 index.html 藏起書桌開關的寬度一樣）出現；寬畫面走 decor.js 的佈置模式。 */
import { STYLES, stats, compose, fileOf, CAN_SHARE, download } from './share-card.js';

const narrow = matchMedia('(max-width: 767px)');
const LABEL = CAN_SHARE ? '分享圖片' : '存成圖片';
const liveP = document.getElementById('live');
const tell = (s) => { if (liveP) liveP.textContent = s; };

const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'btn-share-m'; btn.textContent = LABEL;
btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
const sheet = document.createElement('section'); sheet.className = 'share-sheet'; sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', '選一種圖片樣式');
sheet.innerHTML = `<div class="in"><header><p>${CAN_SHARE ? '選一張分享' : '選一張存下來'}</p><button type="button" class="x" aria-label="關閉">關閉</button></header><div class="two">`
  + STYLES.map(([id, name]) => `<button type="button" data-style="${id}"><canvas width="324" height="576"></canvas><span>${name}</span></button>`).join('') + '</div></div>';
document.body.append(btn, sheet);

const img = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
let pics = null;                                        // the three desk pictures, fetched the first time the sheet opens
const shots = {};                                       // the two finished cards as files (promises), started as soon as the previews are drawn: a share must follow the tap at once
const close = (focus) => { if (sheet.hidden) return; sheet.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('has-share'); if (focus) btn.focus({ preventScroll: true }); };
async function open() {
  sheet.hidden = false; btn.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('has-share');
  try {
    pics = pics || await Promise.all(['magazine', 'pass', 'back'].map((n) => img(`img/share-${n}.webp`)));
    try { await document.fonts.load('40px Huninn'); await document.fonts.load('600 46px Outfit'); await document.fonts.load('500 32px Outfit'); } catch (e) { /* the fallback font will do */ }
    const st = stats(), [mag, pass, back] = pics;
    for (const [id] of STYLES) {
      if (sheet.hidden) return;
      const full = compose(id, st, id === 'pass' ? pass : mag, back), c = sheet.querySelector(`[data-style="${id}"] canvas`), g = c.getContext('2d');
      g.imageSmoothingQuality = 'high'; g.drawImage(full, 0, 0, c.width, c.height);
      const bt = c.closest('button'); bt.classList.add('wait'); shots[id] = new Promise((ok) => full.toBlob(ok, 'image/png')); shots[id].then(() => bt.classList.remove('wait'));
      await new Promise((r) => requestAnimationFrame(r));
    }
  } catch (e) { console.info('[share-m] could not make the cards:', e); tell('圖片沒有做成功，再試一次。'); close(true); }
}
btn.addEventListener('click', () => { if (sheet.hidden) open(); else close(true); });
sheet.addEventListener('click', async (e) => {
  if (e.target === sheet || e.target.closest('.x')) { close(true); return; }
  const b = e.target.closest('button[data-style]'); if (!b) return;
  const style = b.dataset.style, name = b.querySelector('span').textContent;
  if (!shots[style]) return;                            // the preview is not drawn yet
  const blob = await shots[style];                      // normally ready long before the tap; if not, a short wait (a share refused for coming too late falls back to saving)
  if (!blob) { tell('圖片沒有做成功，再試一次。'); return; }
  if (CAN_SHARE) {
    try { await navigator.share({ files: [fileOf(blob, name)], title: 'Paradigm AI 學習站' }); tell(`${name}的圖片分享出去了。`); close(true); return; }
    catch (err) { if (err && err.name === 'AbortError') return; console.info('[share-m] share failed, saving instead:', err); }
  }
  download(blob, name); tell(`${name}的圖片存好了。`); close(true);
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { e.stopPropagation(); close(true); } }, true);
narrow.addEventListener('change', () => { if (!narrow.matches) close(false); });
window.__shareM = { open, close, shots };

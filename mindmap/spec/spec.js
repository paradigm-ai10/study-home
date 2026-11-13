/* 網站學習地圖・設計規格的共用程式：畫布大小與縮放規則。
   規則：畫布 1280×680。視窗剛好 1280×680 時 1：1；大螢幕等比放大，最多 1.25 倍；小於這個大小最多縮到 0.9 倍，再小就讓頁面捲動。
   滑過卡片、右側面板是一般網頁文字，固定字級，不跟地圖縮放。
   選版頁的評分條在畫面底部佔 36px：載入 review-kit 時自動扣掉（也可用 SPEC.setInset 指定）。 */
window.SPEC = (() => {
  const svg = document.getElementById('map');
  // a version may draw on a taller or wider canvas: its viewBox says so (default 1280×680)
  const vb = svg.viewBox && svg.viewBox.baseVal;
  const CW = (vb && vb.width) || 1280, CH = (vb && vb.height) || 680, MIN = 0.9, MAX = 1.25;
  // the map sits in its own scroll box, so a map wider than a phone scrolls inside it and never widens the page
  // (a wider page makes phones zoom the layout and push the fixed card and panel off screen)
  const stage = document.createElement('div');
  stage.id = 'stage';
  svg.parentNode.insertBefore(stage, svg);
  stage.appendChild(svg);
  let s = 1, inset = null;   // null = decide from the page: 36px when the review bar is on the page
  const autoInset = () => (document.querySelector('script[src*="review-kit/bar.js"]') && !/[?&]still/.test(location.search) ? 36 : 0);
  const listeners = [];
  function fit() {
    const ins = inset == null ? autoInset() : inset;
    const h = innerHeight - ins;
    s = Math.max(MIN, Math.min(MAX, Math.min(innerWidth / CW, h / CH)));
    svg.style.width = Math.round(CW * s) + 'px';
    svg.style.height = Math.round(CH * s) + 'px';
    stage.style.bottom = ins + 'px';
    stage.style.overflow = (CW * s > innerWidth + 1 || CH * s > h + 1) ? 'auto' : 'hidden';
    listeners.forEach((f) => f(s));
  }
  // map coordinates → screen px (for placing HTML cards next to SVG things)
  function toScreen(x, y) {
    const r = svg.getBoundingClientRect();
    return [r.left + x * (r.width / CW), r.top + y * (r.height / CH)];
  }
  addEventListener('resize', fit);
  // the review bar's <script> comes after the map's scripts, so look again once the page is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  return { CW, CH, svg, stage, fit, toScreen, onFit: (f) => listeners.push(f), scale: () => s, setInset: (px) => { inset = px; fit(); } };
})();

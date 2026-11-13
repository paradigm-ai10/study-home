/* Learning-map integration options (2026-11-13). The approved map (mindmap/r15-side, framed by map/embed.html) replaces
   the old big map (map-view.js) in one of three ways, chosen by ?mapmode=a|b|c (remembered for the browser session;
   ?mapmode=off forgets it). With no mode this file does nothing and the home page behaves as before.
     a  the desk paper unfolds to fill the screen, then the map draws itself on it (overlay on both versions)
     b  the map is its own page, map.html; both versions go there (3D: the paper covers the screen first)
     c  3D: the paper unfolds with the finished map already on it; plain page: the map sits in the page; deep links go to map.html
   Loaded in <head>, not deferred: it must take #map out of the address before map-view.js looks for it. */
(() => {
  const Q = new URLSearchParams(location.search), SK = 'paradigm.f4.mapmode', SEEN = 'paradigm.f4.mapSeen';
  let mode = Q.get('mapmode');
  try { if (mode) { if (/^[abc]$/.test(mode)) sessionStorage.setItem(SK, mode); else sessionStorage.removeItem(SK); } else mode = sessionStorage.getItem(SK); } catch (e) { /* no storage: the address decides */ }
  if (!/^[abc]$/.test(mode || '')) return;
  const html = document.documentElement, SIMPLE = html.dataset.view === 'simple';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.dataset.mapmode = mode;
  const PAGE = `map.html?mapmode=${mode}&from=${SIMPLE ? 'simple' : '3d'}`;
  const EMBED = 'map/embed.html';
  const seen = () => { try { return !!sessionStorage.getItem(SEEN) && !Q.has('mapgrow'); } catch (e) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem(SEEN, '1'); } catch (e) { /* fine */ } };

  // index.html#map (lesson pages link here): the old map must not answer it
  const deep = location.hash === '#map';
  if (deep) history.replaceState(history.state, '', location.pathname + location.search);
  if (deep && mode !== 'a') { location.replace(PAGE); return; }

  const start = () => {
    const F4 = window.F4; if (!F4 || !window.MapChrome) return;
    const is3d = () => html.classList.contains('is-3d') && !SIMPLE;

    /* where the paper starts: the paper map on the 3D desk (projected to the screen), or the thing you clicked (from map-view.js) */
    function deskRect() {
      const f2 = window.__f2; if (!f2 || !f2.props || !f2.props.map || !is3d()) return null;
      const cam = f2.camera; cam.updateMatrixWorld(); const V = cam.matrixWorldInverse.elements, P = cam.projectionMatrix.elements;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const W = innerWidth, H = innerHeight;
      f2.props.map.root.traverse((o) => {
        if (!o.isMesh || !o.geometry) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox; const M = o.matrixWorld.elements;
        for (let i = 0; i < 8; i++) {
          const lx = i & 1 ? b.max.x : b.min.x, ly = i & 2 ? b.max.y : b.min.y, lz = i & 4 ? b.max.z : b.min.z;
          const wx = M[0] * lx + M[4] * ly + M[8] * lz + M[12], wy = M[1] * lx + M[5] * ly + M[9] * lz + M[13], wz = M[2] * lx + M[6] * ly + M[10] * lz + M[14];
          const vx = V[0] * wx + V[4] * wy + V[8] * wz + V[12], vy = V[1] * wx + V[5] * wy + V[9] * wz + V[13], vz = V[2] * wx + V[6] * wy + V[10] * wz + V[14];
          const cx = P[0] * vx + P[4] * vy + P[8] * vz + P[12], cy = P[1] * vx + P[5] * vy + P[9] * vz + P[13], cw = P[3] * vx + P[7] * vy + P[11] * vz + P[15];
          if (cw <= 0) continue; const sx = (cx / cw * 0.5 + 0.5) * W, sy = (1 - (cy / cw * 0.5 + 0.5)) * H;
          x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
        }
      });
      if (!(x1 > x0 && y1 > y0)) return null;
      return { left: x0, top: y0, width: x1 - x0, height: y1 - y0, tilt: -7 };
    }
    let from = null;
    function startRect() {
      const d = deskRect(); if (d) return d;
      if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); if (r.width > 4) return { left: r.left, top: r.top, width: r.width, height: Math.max(r.height, r.width * 0.56), tilt: 0 }; }
      return { left: innerWidth / 2 - 90, top: innerHeight / 2 - 50, width: 180, height: 100, tilt: 0 };
    }
    const toRect = (r) => `translate(${r.left.toFixed(1)}px, ${r.top.toFixed(1)}px) scale(${(r.width / innerWidth).toFixed(4)}, ${(r.height / innerHeight).toFixed(4)}) rotate(${r.tilt || 0}deg)`;
    const EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
    const SLOW = Math.max(0.2, parseFloat(Q.get('mapslow')) || 1);   // ?mapslow=3: the unfold three times slower, to look at it

    /* ================= option B: its own page ================= */
    if (mode === 'b') {
      let going = false;
      const go = (el) => {
        if (going) return; going = true; from = el || document.activeElement;
        if (!is3d() || REDUCED) { location.href = PAGE; return; }
        if (F4.card) F4.close();
        F4.emit('card:open', { kind: 'map', id: 'map' });           // the camera and the crab go to the paper
        setTimeout(() => {
          const c = document.createElement('div'); c.className = 'mi-cover'; c.id = 'mi-cover'; document.body.appendChild(c);
          html.classList.add('has-map');
          c.style.transform = toRect(startRect()); void c.offsetWidth;
          c.style.transition = `transform ${460 * SLOW}ms ${EASE}`; c.style.transform = 'none';
          setTimeout(() => { location.href = PAGE; }, 460 * SLOW + 20);
        }, 720);
      };
      // back from map.html (the page may come out of the back/forward cache with the paper still over it)
      addEventListener('pageshow', () => {
        const c = document.getElementById('mi-cover'); if (!c && !going) return;
        if (c) c.remove(); html.classList.remove('has-map'); going = false;
        if (is3d()) F4.emit('card:close', { kind: 'map', id: 'map' });
      });
      F4.onMap = () => go(document.activeElement);
      const old = document.getElementById('mv-open');
      if (old) { const a = document.createElement('a'); a.id = 'mv-open'; a.className = old.className; a.href = PAGE; a.textContent = '開啟學習地圖'; old.replaceWith(a); }
      window.F4mapInt = { mode, open: go };
      return;
    }

    /* ================= options A and C: the paper unfolds over the page ================= */
    const GROW = mode === 'a';                                        // a: the map draws itself after the unfold; c: it is already on the paper
    const root = document.createElement('div');
    root.className = 'mi'; root.dataset.mode = mode; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'AI 學習地圖');
    root.innerHTML = '<div class="mi-shade"></div><div class="mi-sheet"></div>';
    document.body.appendChild(root);
    const sheet = root.querySelector('.mi-sheet');
    let frame = null, chrome = null, ready = false, isOpen = false, busy = false, pending = 0, back = null, pushed = false, played = false;
    function ensureFrame() {
      if (frame) return;
      frame = document.createElement('iframe'); frame.title = 'AI 學習地圖'; frame.src = EMBED + (GROW ? '?wait' : '?still');
      sheet.appendChild(frame);
      chrome = MapChrome.mount(sheet, frame, { closeLabel: is3d() ? '× 返回書桌' : '× 關閉地圖', onClose: () => shut() });
    }
    addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || !frame || e.source !== frame.contentWindow) return;
      if (e.data.t === 'map:ready') { ready = true; chrome.sync(); if (isOpen && !busy) reveal(); }
      else if (e.data.t === 'map:close') shut();
    });
    // the frame is fetched ahead of the first click, once the page is idle (not on phones or data saver)
    const lite = (navigator.connection && navigator.connection.saveData) || matchMedia('(max-width: 767px)').matches;
    if (!lite) setTimeout(() => (window.requestIdleCallback || setTimeout)(ensureFrame), 2500);

    // the paper is flat: hand over to the map's own opening (first time this session), or show it finished
    function reveal() {
      if (!ready) return;
      chrome.sync();
      if (GROW && !played && !seen() && !REDUCED) chrome.post({ t: 'map:play' }); else chrome.post({ t: 'map:still' });
      played = true; markSeen();
    }
    function open(fromEl) {
      if (isOpen || busy || pending) return;
      back = document.activeElement; from = fromEl || back;
      ensureFrame();
      const go = () => {
        busy = true; isOpen = true;
        root.classList.add('is-on'); html.classList.add('has-map');
        if (location.hash !== '#map') { history.pushState({ map: 1 }, '', '#map'); pushed = true; }
        const done = () => { busy = false; sheet.style.transition = ''; root.classList.add('is-open', 'is-go'); reveal(); chrome.x.focus({ preventScroll: true }); };
        if (REDUCED) { done(); return; }
        sheet.style.transition = 'none'; sheet.style.transform = toRect(startRect()); void sheet.offsetWidth;
        sheet.style.transition = `transform ${620 * SLOW}ms ${EASE}`; sheet.style.transform = 'none';
        requestAnimationFrame(() => { root.classList.add('is-go'); if (!GROW) root.classList.add('is-open'); });
        setTimeout(done, 620 * SLOW + 20);
      };
      if (is3d()) {
        if (F4.card) F4.close();
        F4.emit('card:open', { kind: 'map', id: 'map' });           // the camera and the crab go to the paper first
        pending = setTimeout(() => { pending = 0; go(); }, REDUCED ? 0 : 720);
      } else go();
    }
    function shut(fromHistory) {
      if (!isOpen || busy) return;
      if (pushed && !fromHistory) { history.back(); return; }         // the address goes back first; popstate then closes
      pushed = false; busy = true; root.classList.remove('is-open', 'is-go');
      chrome.post({ t: 'map:shut' });
      const done = () => {
        root.classList.remove('is-on'); html.classList.remove('has-map'); sheet.style.transform = ''; sheet.style.transition = ''; isOpen = false; busy = false;
        if (is3d()) F4.emit('card:close', { kind: 'map', id: 'map' });
        if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
      };
      if (REDUCED) { done(); return; }
      setTimeout(() => { sheet.style.transition = `transform 480ms ${EASE}`; sheet.style.transform = toRect(startRect()); setTimeout(done, 500); }, GROW ? 200 : 60);
    }
    F4.on('card:open', (c) => { if (pending && !(c && c.kind === 'map')) { clearTimeout(pending); pending = 0; } });
    F4.on('state', () => { if (chrome && ready) chrome.sync(); });
    addEventListener('storage', (e) => { if (e.key === 'pd-done' && chrome && ready) setTimeout(() => chrome.sync(), 50); });
    addEventListener('popstate', () => { if (isOpen && location.hash !== '#map') shut(true); else if (!isOpen && location.hash === '#map') { pushed = true; open(null); } });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (pending) { clearTimeout(pending); pending = 0; e.stopPropagation(); F4.emit('card:close', { kind: 'map', id: 'map' }); return; }
      if (isOpen) { e.stopPropagation(); shut(); }
    }, true);

    F4.onMap = () => open(document.activeElement);
    const old = document.getElementById('mv-open');
    if (SIMPLE && mode === 'a' && old) { const b = old.cloneNode(true); b.textContent = '展開學習地圖'; b.addEventListener('click', () => open(b)); old.replaceWith(b); }

    // option C on the plain page: the finished map sits in the page; "show me the map" scrolls to it
    if (SIMPLE && mode === 'c') {
      const sub = document.getElementById('map-sub'), sec = document.getElementById('map'), h2 = document.getElementById('map-h');
      // its own full-width band above the two columns (the map needs 1280 px; the section's column is half that)
      const band = document.createElement('section'); band.id = 'mi-band'; band.setAttribute('aria-labelledby', 'mi-band-h');
      band.innerHTML = `<div class="wrap"><div class="sec-h"><h2 id="mi-band-h" tabindex="-1">AI 學習地圖</h2><p>${sub.textContent}　點選主題查看課程；滑過查看學習成果。</p></div></div>`;
      const box = document.createElement('div'); box.className = 'mi-inline';
      const f = document.createElement('iframe'); f.title = 'AI 學習地圖'; f.loading = 'lazy'; f.src = EMBED + '?still'; box.appendChild(f);
      const ch = MapChrome.mount(box, f, { closeLabel: '以獨立頁面開啟', onClose: () => { location.href = PAGE; } });
      band.appendChild(box);
      let row = sec.parentNode; while (row.parentNode && row.parentNode.tagName !== 'MAIN') row = row.parentNode;
      row.before(band);
      h2.textContent = '課程清單';
      addEventListener('message', (e) => { if (e.origin === location.origin && e.source === f.contentWindow && e.data && e.data.t === 'map:ready') ch.sync(); });
      F4.on('state', () => ch.sync());
      const bh = band.querySelector('h2');
      F4.onMap = () => { F4.close(); bh.scrollIntoView({ block: 'start', behavior: 'auto' }); bh.focus({ preventScroll: true }); };
    }
    window.F4mapInt = { mode, open, shut, get isOpen() { return isOpen; } };
    // #map arrived with the page (option A): open once the page is up; on the 3D page, once the desk is live
    if (deep) {
      const t0 = performance.now();
      (function wait() {
        const up = SIMPLE || html.classList.contains('is-3d') || html.classList.contains('is-poster');
        if (up || performance.now() - t0 > 5000) setTimeout(() => open(null), SIMPLE ? 200 : 900); else setTimeout(wait, 200);
      })();
    }
  };
  // after every deferred script (app.js, simple.js, map-view.js) has run, so F4.onMap set here is the last word
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* The big learning map (2026-11-12, Thomas: 「地圖要真的像在那張地圖上，點開展開像一個 AI 學習 map，點進去才是 content」).
   Clicking 學習地圖 (the paper map on the desk, the index, or any 看學習地圖 button) unfolds the paper to fill the screen:
   3 stages, 12 module stops on one road (map version 7, ../../../roadmap7.js). A stop shows its lessons; an open lesson
   shows its short intro (課程頁 not written yet: LESSON_PAGES in ../../routes.js). Same file on the 3D page and the plain page.
   Styles: map-view.css. It takes over F4.onMap, so app.js / simple.js call it without knowing it is here. */
(() => {
  const F4 = window.F4, M7 = window.ROADMAP7;
  if (!F4 || !M7) return;
  const html = document.documentElement;
  const SIMPLE = F4.simple;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MODS = []; M7.stages.forEach((s, si) => s.modules.forEach((m) => MODS.push(Object.assign({ stage: si }, m))));
  const modOf = {}; MODS.forEach((m) => m.lessons.forEach((l) => { modOf[l.id] = m; }));
  const pageOf = (id) => (window.LESSON_PAGES && window.LESSON_PAGES[id]) || null;

  /* ---------- the drawing: where each stop sits on a 1200 × 720 sheet ---------- */
  const AT = {
    L0: [130, 560], L1: [255, 385], L2: [415, 525], L3: [520, 300], L4: [650, 480],
    L5: [790, 175], L6: [935, 240], L7: [800, 335], L8: [950, 405], L9: [820, 505],
    L10: [1105, 245], L11: [1105, 420],
  };
  const SY = 1.28;   // the side column leaves a squarer space: stretch the drawing downward (shapes only, never the words)
  Object.keys(AT).forEach((k) => { AT[k][1] = Math.round(AT[k][1] * SY); });
  const REGION = [   // a soft blob per stage, label in its top-left corner
    { d: 'M60 205 C 70 120, 250 95, 400 130 C 560 165, 700 150, 712 260 C 726 380, 735 610, 640 660 C 520 712, 210 705, 95 650 C 20 610, 45 300, 60 205 Z', fill: 'rgba(255, 200, 87, .18)', stroke: 'rgba(192, 53, 31, .38)', lx: 92, ly: 168 },
    { d: 'M738 92 C 820 60, 1010 70, 1018 150 C 1030 260, 1030 460, 1000 560 C 975 625, 790 630, 748 560 C 712 490, 708 140, 738 92 Z', fill: 'rgba(58, 46, 92, .06)', stroke: 'rgba(58, 46, 92, .28)', lx: 760, ly: 120 },
    { d: 'M1045 140 C 1090 120, 1172 130, 1176 190 C 1182 300, 1182 450, 1160 505 C 1140 545, 1060 545, 1046 495 C 1030 420, 1028 170, 1045 140 Z', fill: 'rgba(58, 46, 92, .06)', stroke: 'rgba(58, 46, 92, .28)', lx: 1050, ly: 112 },
  ];
  // one smooth road through the stops in order (Catmull-Rom turned into curves)
  function road(ids) {
    const p = ids.map((id) => AT[id]); let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += ` C ${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6}, ${c[0] - (e[0] - b[0]) / 6} ${c[1] - (e[1] - b[1]) / 6}, ${c[0]} ${c[1]}`;
    }
    return d;
  }
  const S1 = M7.stages[0].modules.map((m) => m.id), REST = MODS.filter((m) => m.stage > 0).map((m) => m.id);

  function svg() {
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known);
    const hereMod = n.kind === 'lesson' ? (modOf[n.lesson.id] || {}).id : 'L0';
    let out = `<svg viewBox="0 0 1200 ${Math.round(720 * SY)}" role="group" aria-label="學習地圖：12 個模組">`;
    REGION.forEach((r, i) => {
      const s = M7.stages[i];
      const ly = Math.round(r.ly * SY), narrow = i === 2;
      out += `<g transform="scale(1 ${SY})"><path class="mv-region" d="${r.d}" fill="${r.fill}" stroke="${r.stroke}" vector-effect="non-scaling-stroke"/></g>`
        + (narrow ? `<text class="mv-region-label" x="${r.lx}" y="${ly}">階段 ${esc(s.no)}</text><text class="mv-region-sub" x="${r.lx}" y="${ly + 24}">${esc(s.name)}</text>`
          : `<text class="mv-region-label" x="${r.lx}" y="${ly}">階段 ${esc(s.no)}　${esc(s.name)}</text>`)
        + `<text class="mv-region-sub" x="${r.lx}" y="${ly + (narrow ? 46 : 24)}">${i === 0 ? esc(s.desc) : '即將推出'}</text>`;
    });
    out += `<path class="mv-road" d="${road(S1.concat(REST.slice(0, 1)))}" stroke="#E2503C"/>`;
    out += `<path class="mv-road" d="${road(REST)}" stroke="rgba(58,46,92,.35)"/>`;
    MODS.forEach((m) => {
      const [x, y] = AT[m.id]; const open = m.lessons.length > 0; const k = m.lessons.filter((l) => known.has(l.id)).length;
      const meta = open ? `開 ${m.lessons.length} 課・共 ${m.count} 課` : `共 ${m.count} 課`;
      out += `<g class="mv-stop${open ? '' : ' is-later'}" data-mod="${m.id}" tabindex="0" role="button" aria-label="${esc(m.id + ' ' + m.name + '，' + meta)}">`
        + `<g class="disc"><circle class="ring" cx="${x}" cy="${y}" r="30" fill="${open ? '#FF6B57' : '#E9DCC2'}" stroke="rgba(58,46,92,.35)" stroke-width="1.5"/>`
        + `<text class="id" x="${x}" y="${y}" fill="${open ? '#FFF4E0' : 'rgba(58,46,92,.55)'}">${m.id}</text></g>`
        + `<text class="name" x="${x}" y="${y + 52}">${esc(m.name)}</text>`
        + `<text class="meta" x="${x}" y="${y + 71}">${meta}</text>`
        + (k ? `<g transform="translate(${x + 20} ${y - 46})"><path d="M0 0 V28" stroke="#3A2E5C" stroke-width="2"/><path d="M1 1 L19 6 L1 12 Z" fill="#C0351F"/><text x="24" y="10" class="meta" style="text-anchor:start">${k}/${m.lessons.length}</text></g>` : '')
        + `</g>`;
    });
    // the pin: where you are now
    const [hx, hy] = AT[hereMod] || AT.L0;
    out += `<g class="mv-here" aria-hidden="true"><path d="M${hx - 34} ${hy - 78} c -13 0 -22 10 -22 22 c 0 16 22 34 22 34 s 22 -18 22 -34 c 0 -12 -9 -22 -22 -22 z" fill="#3A2E5C"/><circle cx="${hx - 34}" cy="${hy - 56}" r="7.5" fill="#FFC857"/></g>`;
    out += `<text class="mv-legend" x="40" y="${Math.round(720 * SY) - 18}">紅色的站有課可以學，灰色的站即將推出。點一個站看裡面的課。</text></svg>`;
    return out;
  }

  /* ---------- the side column ---------- */
  const lesBtn = (l, known, nextId) => `<li><button type="button" class="mv-les" data-les="${l.id}"><span class="i">${l.id}</span><span class="t">${esc(l.title)}</span><span class="m">${l.min} 分鐘</span>${known.has(l.id) ? '<span class="s">✓ 會了</span>' : l.id === nextId ? '<span class="s"><b>下一步</b></span>' : ''}</button></li>`;
  function sideOverview() {
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known); const nextId = n.kind === 'lesson' ? n.lesson.id : null;
    const open = MODS.flatMap((m) => m.lessons);
    return `<p class="kick">怎麼走</p><h3>從 L0 出發，一站一站往右走</h3>
      <p class="dim">${known.size ? `你會了 ${known.size} / ${open.length} 課。` : ''}${nextId ? `下一步是 ${esc(nextId)}。` : n.kind === 'task' ? '還沒開始的話，先做 60 秒任務。' : '不知道從哪開始，就用「幫我挑」。'}會的可以跳過，順序只是建議。</p>
      <p class="kick">第一版開放的 ${open.length} 課</p><ol>${open.map((l) => lesBtn(l, known, nextId)).join('')}</ol>`;
  }
  function sideModule(id) {
    const m = MODS.find((x) => x.id === id); if (!m) return sideOverview();
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known); const nextId = n.kind === 'lesson' ? n.lesson.id : null;
    const s = M7.stages[m.stage]; const openIds = new Set(m.lessons.map((l) => l.id));
    const rest = m.all.filter(([lid]) => !openIds.has(lid));
    return `<button type="button" class="mv-back" data-act="overview">← 整張地圖</button>
      <p class="kick">階段 ${esc(s.no)}・${esc(m.id)}</p><h3>${esc(m.name)}</h3><p>${esc(m.tagline)}</p>
      <p class="dim">共 ${m.count} 課${m.hours ? `，必修約 ${m.hours} 小時` : ''}。${m.lessons.length ? `第一版先開 ${m.lessons.length} 課。` : '這一站還沒開放，即將推出。'}</p>
      ${m.lessons.length ? `<ol>${m.lessons.map((l) => lesBtn(l, known, nextId)).join('')}</ol>` : ''}
      ${rest.length ? `<details class="mv-soon"${m.lessons.length ? '' : ' open'}><summary>還有 ${rest.length} 課即將推出</summary><ul>${rest.map(([lid, t]) => `<li><span>${esc(lid)}</span>${esc(t)}</li>`).join('')}</ul></details>` : ''}`;
  }
  function sideLesson(id) {
    const m = modOf[id]; const l = m && m.lessons.find((x) => x.id === id); if (!l) return sideOverview();
    const href = pageOf(id); const known = F4.state.known.includes(id);
    return `<button type="button" class="mv-back" data-act="mod" data-mod="${m.id}">← ${esc(m.id)} ${esc(m.name)}</button>
      <p class="kick">${esc(l.id)}・約 ${l.min} 分鐘${known ? '・✓ 你會了' : ''}</p><h3>${esc(l.title)}</h3>
      <div class="mv-box"><p>學完你能：${esc(l.can)}。</p></div>
      ${href ? `<a class="mv-go" href="${esc(href)}">開始上課</a>` : `<p class="dim">課程頁即將上線，做好會在這裡打開。</p><span class="mv-go is-off" aria-disabled="true">課程頁即將上線</span>`}`;
  }

  /* ---------- the sheet ---------- */
  const root = document.createElement('div');
  root.className = 'mv'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'AI 學習地圖');
  root.innerHTML = `<div class="mv-shade" data-act="close"></div>
    <div class="mv-sheet"><header class="mv-head"><h2>AI 學習地圖</h2><p>${M7.stages.length} 個階段・${MODS.length} 個模組・${M7.total} 課｜第一版開放 ${MODS.reduce((a, m) => a + m.lessons.length, 0)} 課</p>
      <button type="button" class="mv-x" data-act="close" aria-label="收起地圖">×</button></header>
      <div class="mv-art"></div><aside class="mv-side" aria-live="polite"></aside></div>`;
  document.body.appendChild(root);
  const sheet = root.querySelector('.mv-sheet'), art = root.querySelector('.mv-art'), side = root.querySelector('.mv-side');
  let isOpen = false, busy = false, sel = null, back = null, from = null;

  function paint() { art.innerHTML = svg(); select(sel, true); }
  function select(id, quiet) {
    sel = id;
    art.querySelectorAll('.mv-stop').forEach((g) => g.classList.toggle('is-sel', g.dataset.mod === id));
    if (!quiet) { side.innerHTML = id ? sideModule(id) : sideOverview(); side.scrollTop = 0; }
  }

  // where the paper starts from: the paper map on the 3D desk (projected to the screen), or the thing you clicked
  function deskRect() {
    const f2 = window.__f2; if (!f2 || !f2.props || !f2.props.map || !html.classList.contains('is-3d')) return null;
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
  function startRect() {
    const d = deskRect(); if (d) return d;
    if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); if (r.width > 4) return { left: r.left, top: r.top, width: r.width, height: Math.max(r.height, r.width * 0.6), tilt: 0 }; }
    return { left: innerWidth / 2 - 80, top: innerHeight / 2 - 50, width: 160, height: 100, tilt: 0 };
  }
  function toRect(r) {
    const f = sheet.getBoundingClientRect();
    return `translate(${(r.left - f.left).toFixed(1)}px, ${(r.top - f.top).toFixed(1)}px) scale(${(r.width / f.width).toFixed(4)}, ${(r.height / f.height).toFixed(4)}) rotate(${r.tilt || 0}deg)`;
  }

  function open(fromEl) {
    if (isOpen || busy) return;
    back = document.activeElement; from = fromEl || back;
    const go = () => {
      busy = true; isOpen = true; sel = null;
      paint(); side.innerHTML = sideOverview();
      root.classList.add('is-on'); html.classList.add('has-map');
      if (REDUCED) { root.classList.add('is-open'); busy = false; root.querySelector('.mv-x').focus({ preventScroll: true }); return; }
      sheet.style.transition = 'none'; sheet.style.transform = toRect(startRect());
      void sheet.offsetWidth;
      sheet.style.transition = 'transform 620ms cubic-bezier(0.77, 0, 0.175, 1)';
      sheet.style.transform = 'none';
      requestAnimationFrame(() => root.classList.add('is-open'));
      setTimeout(() => { busy = false; sheet.style.transition = ''; root.querySelector('.mv-x').focus({ preventScroll: true }); }, 640);
    };
    // on the live desk: the camera and the crab go to the paper first, then it unfolds from there
    if (html.classList.contains('is-3d') && !SIMPLE) {
      if (F4.card) F4.close();
      F4.emit('card:open', { kind: 'map', id: 'map' });
      setTimeout(go, REDUCED ? 0 : 720);
    } else go();
  }
  function shut() {
    if (!isOpen || busy) return;
    busy = true; root.classList.remove('is-open');
    const done = () => { root.classList.remove('is-on'); html.classList.remove('has-map'); sheet.style.transform = ''; sheet.style.transition = ''; isOpen = false; busy = false;
      if (html.classList.contains('is-3d') && !SIMPLE) F4.emit('card:close', { kind: 'map', id: 'map' });
      if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); };
    if (REDUCED) { done(); return; }
    setTimeout(() => {
      sheet.style.transition = 'transform 480ms cubic-bezier(0.77, 0, 0.175, 1)';
      sheet.style.transform = toRect(startRect());
      setTimeout(done, 500);
    }, 160);
  }

  root.addEventListener('click', (e) => {
    const stop = e.target.closest('.mv-stop'); if (stop) { select(stop.dataset.mod); return; }
    const les = e.target.closest('[data-les]'); if (les) { side.innerHTML = sideLesson(les.dataset.les); side.scrollTop = 0; const b = side.querySelector('.mv-back'); if (b) b.focus({ preventScroll: true }); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'close') shut();
    else if (a.dataset.act === 'overview') select(null);
    else if (a.dataset.act === 'mod') select(a.dataset.mod);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); shut(); return; }
    const stop = e.target.closest && e.target.closest('.mv-stop');
    if (stop && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(stop.dataset.mod); }
    if (e.key === 'Tab') {               // keep the keyboard inside the open map
      const f = [...root.querySelectorAll('button, a[href], [tabindex="0"], summary')].filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  F4.on('state', () => { if (isOpen) paint(); });

  // every 看學習地圖 (index, desk, cards, buttons) now opens this
  F4.onMap = () => open(document.activeElement);
  // the plain page keeps its list too; a button above it opens the big map
  const sub = document.getElementById('map-sub');
  if (SIMPLE && sub && !document.getElementById('mv-open')) {
    const b = document.createElement('button'); b.type = 'button'; b.id = 'mv-open'; b.className = 'btn-link'; b.textContent = '打開大地圖';
    b.addEventListener('click', () => open(b)); sub.after(b);
  }
  window.F4map = { open, shut, select, get open_() { return isOpen; } };
})();

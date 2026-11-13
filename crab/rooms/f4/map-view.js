/* The big learning map (2026-11-12, Thomas: 「地圖要真的像在那張地圖上，點開展開像一個 AI 學習 map，點進去才是 content」).
   Clicking 學習地圖 (the paper map on the desk, the index, or any 看學習地圖 button) unfolds the paper to fill the screen:
   map v8.5 (2026-11-13): 3 stages, 4 roles, 17 topic stops on one road (../../../roadmap8.js, made by make_roadmap8.py). A stop shows its lessons; an open lesson
   shows its short intro (課程頁 not written yet: LESSON_PAGES in ../../routes.js). Same file on the 3D page and the plain page.
   Styles: map-view.css. It takes over F4.onMap, so app.js / simple.js call it without knowing it is here. */
(() => {
  const F4 = window.F4, R8 = window.ROADMAP8;
  if (!F4 || !R8) return;
  const html = document.documentElement;
  const SIMPLE = F4.simple;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TOPICS = R8.topics;
  const topicOf = {}; TOPICS.forEach((t) => t.lessons.forEach((l) => { topicOf[l.id] = t; }));
  const roleOf = {}; R8.roles.forEach((r) => { roleOf[r.id] = r; });
  const stageNo = ['', '第一階段', '第二階段', '第三階段'];
  const pageOf = (id) => (window.LESSON_PAGES && window.LESSON_PAGES[id]) || null;

  /* ---------- the drawing: where each topic sits on a 1200 × 720 sheet (stretched down by SY) ---------- */
  const AT = {
    T1: [100, 565], T2: [180, 385], T3: [250, 555], T4: [340, 330], T5: [440, 555], T6: [470, 300], T7: [540, 430],
    T8: [665, 210], T9: [725, 340], T10: [665, 480], T11: [725, 610],
    T12: [885, 300], T13: [885, 490],
    T14: [1060, 200], T15: [1090, 340], T16: [1050, 470], T17: [1085, 600],   // map v8.5: 17 topics (builder 8–11, orchestrator 12–13, product engineer 14–17)
  };
  const SY = 1.28;   // the side column leaves a squarer space: stretch the drawing downward (shapes only, never the words)
  Object.keys(AT).forEach((k) => { AT[k][1] = Math.round(AT[k][1] * SY); });
  const REGION = {   // a soft blob per role, its name in the top-left corner
    'power-user': { d: 'M60 200 C 80 130, 300 110, 450 140 C 560 160, 590 230, 585 330 C 590 460, 600 640, 520 670 C 400 705, 160 700, 80 650 C 30 600, 40 300, 60 200 Z', fill: 'rgba(255, 200, 87, .18)', stroke: 'rgba(192, 53, 31, .38)', lx: 82, ly: 168 },
    builder: { d: 'M615 140 C 650 105, 770 110, 785 160 C 800 280, 805 560, 785 640 C 760 690, 640 690, 615 640 C 590 540, 590 200, 615 140 Z', fill: 'rgba(58, 46, 92, .06)', stroke: 'rgba(58, 46, 92, .28)', lx: 616, ly: 118 },
    orchestrator: { d: 'M825 170 C 850 140, 945 140, 955 185 C 968 300, 968 480, 950 540 C 930 580, 845 580, 828 540 C 810 470, 808 230, 825 170 Z', fill: 'rgba(58, 46, 92, .06)', stroke: 'rgba(58, 46, 92, .28)', lx: 820, ly: 150 },
    'product-engineer': { d: 'M990 120 C 1030 95, 1170 100, 1180 150 C 1190 300, 1192 560, 1170 640 C 1150 690, 1010 690, 992 640 C 972 560, 970 200, 990 120 Z', fill: 'rgba(58, 46, 92, .06)', stroke: 'rgba(58, 46, 92, .28)', lx: 984, ly: 98, small: true },
  };
  // one smooth road through the stops in order (Catmull-Rom turned into curves)
  function road(ids) {
    const p = ids.map((id) => AT[id]); let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += ` C ${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6}, ${c[0] - (e[0] - b[0]) / 6} ${c[1] - (e[1] - b[1]) / 6}, ${c[0]} ${c[1]}`;
    }
    return d;
  }
  const FIRST_ROLE = R8.roles[0].topics, LATER = TOPICS.filter((t) => !FIRST_ROLE.includes(t.id)).map((t) => t.id);

  function svg() {
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known);
    const hereTopic = n.kind === 'lesson' ? (topicOf[n.lesson.id] || {}).id : 'T1';
    let out = `<svg viewBox="0 0 1200 ${Math.round(720 * SY)}" role="group" aria-label="學習地圖：${TOPICS.length} 個主題">`;
    R8.roles.forEach((role, i) => {
      const r = REGION[role.id]; if (!r) return;
      const ly = Math.round(r.ly * SY);
      out += `<g transform="scale(1 ${SY})"><path class="mv-region" d="${r.d}" fill="${r.fill}" stroke="${r.stroke}" vector-effect="non-scaling-stroke"/></g>`
        + `<text class="mv-region-label" x="${r.lx}" y="${ly}"${r.small ? ' style="font-size:17px"' : ''}>${esc(role.name)}</text>`
        + `<text class="mv-region-sub" x="${r.lx}" y="${ly + 24}">${esc(stageNo[role.stage] || '')}${i === 0 ? '・' + esc((R8.stages[0] || {}).tagline || '') : '・即將推出'}</text>`;
    });
    out += `<path class="mv-road" d="${road(FIRST_ROLE.concat(LATER.slice(0, 1)))}" stroke="#E2503C"/>`;
    out += `<path class="mv-road" d="${road(LATER)}" stroke="rgba(58,46,92,.35)"/>`;
    TOPICS.forEach((t) => {
      const [x, y] = AT[t.id] || [600, 400]; const open = t.lessons.length > 0; const k = t.lessons.filter((l) => known.has(l.id)).length;
      const pages = t.lessons.filter((l) => pageOf(l.id)).length;   // first-release lessons with a lesson page now; the rest say 即將上線
      const meta = pages ? `開放 ${pages} 課・共 ${t.count} 課` : open ? `首版 ${t.lessons.length} 課即將上線` : `共 ${t.count} 課`;
      out += `<g class="mv-stop${open ? '' : ' is-later'}" data-mod="${t.id}" tabindex="0" role="button" aria-label="${esc('主題 ' + t.no + ' ' + t.name + '，' + meta)}">`
        + `<g class="disc"><circle class="ring" cx="${x}" cy="${y}" r="28" fill="${open ? '#FF6B57' : '#E9DCC2'}" stroke="rgba(58,46,92,.35)" stroke-width="1.5"/>`
        + `<text class="id" x="${x}" y="${y}" fill="${open ? '#FFF4E0' : 'rgba(58,46,92,.55)'}">${t.no}</text></g>`
        + `<text class="name" x="${x}" y="${y + 50}">${esc(t.name)}</text>`
        + `<text class="meta" x="${x}" y="${y + 69}">${meta}</text>`
        + (k ? `<g transform="translate(${x + 20} ${y - 44})"><path d="M0 0 V28" stroke="#3A2E5C" stroke-width="2"/><path d="M1 1 L19 6 L1 12 Z" fill="#C0351F"/><text x="24" y="10" class="meta" style="text-anchor:start">${k}/${t.lessons.length}</text></g>` : '')
        + `</g>`;
    });
    // the pin: where you are now
    const [hx, hy] = AT[hereTopic] || AT.T1;
    out += `<g class="mv-here" aria-hidden="true"><path d="M${hx - 34} ${hy - 78} c -13 0 -22 10 -22 22 c 0 16 22 34 22 34 s 22 -18 22 -34 c 0 -12 -9 -22 -22 -22 z" fill="#3A2E5C"/><circle cx="${hx - 34}" cy="${hy - 56}" r="7.5" fill="#FFC857"/></g>`;
    out += `<text class="mv-legend" x="40" y="${Math.round(720 * SY) - 18}">紅色：首版課程　灰色：即將推出　點選主題查看課程</text></svg>`;
    return out;
  }

  /* ---------- the side column ---------- */
  const lesBtn = (l, known, nextId) => `<li><button type="button" class="mv-les" data-les="${l.id}"><span class="i">${l.id}</span><span class="t">${esc(l.title)}</span><span class="m">${esc(l.type || '')}</span>${known.has(l.id) ? '<span class="s">✓ 已完成</span>' : l.id === nextId ? '<span class="s"><b>下一步</b></span>' : pageOf(l.id) ? '' : '<span class="s">即將上線</span>'}</button></li>`;
  const openLessons = () => R8.first.map((id) => (topicOf[id] || { lessons: [] }).lessons.find((l) => l.id === id)).filter(Boolean);
  function sideOverview() {
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known); const nextId = n.kind === 'lesson' ? n.lesson.id : null;
    const open = openLessons(), opened = open.filter((l) => pageOf(l.id));
    return `<p class="kick">學習路徑</p><h3>${esc(R8.roles[0].name)}：主題 ${FIRST_ROLE[0].replace('T', '')} → ${FIRST_ROLE[FIRST_ROLE.length - 1].replace('T', '')}</h3>
      <p class="dim">${known.size ? `已完成 ${known.size} / ${opened.length} 課。` : ''}${nextId ? `下一步：${esc(nextId)}。` : n.kind === 'done' ? `已開放 ${opened.length} 課全部完成。` : n.kind === 'task' ? '尚未開始：建議先完成 60 秒體驗。' : '起點未定：建議進行程度評估。'}可依程度跳過；順序為建議路徑。</p>
      <p class="kick">首版課程（${open.length} 課，已開放 ${opened.length} 課）</p><ol>${open.map((l) => lesBtn(l, known, nextId)).join('')}</ol>`;
  }
  function sideModule(id) {
    const t = TOPICS.find((x) => x.id === id); if (!t) return sideOverview();
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known); const nextId = n.kind === 'lesson' ? n.lesson.id : null;
    const role = roleOf[t.role] || {}; const openIds = new Set(t.lessons.map((l) => l.id));
    const rest = t.all.filter(([lid]) => !openIds.has(lid));
    return `<button type="button" class="mv-back" data-act="overview">← 返回總覽</button>
      <p class="kick">${esc(stageNo[t.stage] || '')}・${esc(role.name || '')}・主題 ${t.no}</p><h3>${esc(t.name)}</h3>
      <div class="mv-box"><p>實作成果：${esc(t.outcome)}</p></div>
      <p class="dim">必修 ${t.required} 課、選修 ${t.electives} 課。${t.lessons.length ? `首版 ${t.lessons.length} 課（已開放 ${t.lessons.filter((l) => pageOf(l.id)).length} 課）。` : '本主題即將推出。'}</p>
      ${t.lessons.length ? `<ol>${t.lessons.map((l) => lesBtn(l, known, nextId)).join('')}</ol>` : ''}
      ${rest.length ? `<details class="mv-soon"${t.lessons.length ? '' : ' open'}><summary>其餘 ${rest.length} 課即將推出</summary><ul>${rest.map(([lid, title, type]) => `<li><span>${esc(lid)}</span>${esc(title)}${type ? `（${esc(type)}）` : ''}</li>`).join('')}</ul></details>` : ''}`;
  }
  function sideLesson(id) {
    const t = topicOf[id]; const l = t && t.lessons.find((x) => x.id === id); if (!l) return sideOverview();
    const href = pageOf(id); const known = F4.state.known.includes(id);
    return `<button type="button" class="mv-back" data-act="mod" data-mod="${t.id}">← 主題 ${t.no} ${esc(t.name)}</button>
      <p class="kick">${esc(l.id)}・${esc(l.type || '')}${known ? '・✓ 已完成' : ''}</p><h3>${esc(l.title)}</h3>
      <div class="mv-box"><p>所屬主題的實作成果：${esc(t.outcome)}</p></div>
      ${href ? `<a class="mv-go" href="${esc(href)}">開始上課</a>` : `<p class="dim">課程頁即將上線。</p><span class="mv-go is-off" aria-disabled="true">課程頁即將上線</span>`}`;
  }

  /* ---------- the sheet ---------- */
  const root = document.createElement('div');
  root.className = 'mv'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'AI 學習地圖');
  root.innerHTML = `<div class="mv-shade" data-act="close"></div>
    <div class="mv-sheet"><header class="mv-head"><h2>AI 學習地圖</h2><p>${R8.counts.stages} 個階段・${R8.counts.topics} 個主題・必修 ${R8.counts.required} 課、選修 ${R8.counts.electives} 課｜首版 ${R8.first.length} 課（已開放 ${R8.first.filter((id) => pageOf(id)).length} 課）</p>
      <button type="button" class="mv-x" data-act="close" aria-label="收起地圖">×</button></header>
      <div class="mv-art"></div><aside class="mv-side" aria-live="polite"></aside></div>`;
  document.body.appendChild(root);
  const sheet = root.querySelector('.mv-sheet'), art = root.querySelector('.mv-art'), side = root.querySelector('.mv-side');
  let isOpen = false, busy = false, sel = null, back = null, from = null, pending = 0;
  F4.on('card:open', (c) => { if (pending && !(c && c.kind === 'map')) { clearTimeout(pending); pending = 0; } });

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
    if (isOpen || busy || pending) return;
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
      pending = setTimeout(() => { pending = 0; go(); }, REDUCED ? 0 : 720);
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
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (pending) { clearTimeout(pending); pending = 0; e.stopPropagation(); F4.emit('card:close', { kind: 'map', id: 'map' }); return; }   // still flying to the paper: stay on the desk
    if (isOpen && !root.contains(e.target)) { e.stopPropagation(); shut(); }
  }, true);   // focus can drop to <body> after a panel swap
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); shut(); return; }
    const stop = e.target.closest && e.target.closest('.mv-stop');
    if (stop && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(stop.dataset.mod); const f = side.querySelector('.mv-les, .mv-back'); if (f) f.focus({ preventScroll: true }); }
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
    const b = document.createElement('button'); b.type = 'button'; b.id = 'mv-open'; b.className = 'btn-link'; b.textContent = '展開學習地圖';
    b.addEventListener('click', () => open(b)); sub.after(b);
  }
  window.F4map = { open, shut, select, get open_() { return isOpen; } };
  // index.html#map (the lesson pages link 學習地圖 here): open the big map once the page is up; on the 3D page, once the desk is live
  if (location.hash === '#map') {
    const t0 = performance.now();
    (function wait() {
      const ready = SIMPLE || html.classList.contains('is-3d') || html.classList.contains('is-poster');
      if (ready || performance.now() - t0 > 5000) setTimeout(() => open(null), SIMPLE ? 200 : 900); else setTimeout(wait, 200);
    })();
  }
})();

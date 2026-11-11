/* f4 — everything on the first screen that does not need 3D.
   What you have learned (kept in this browser only), the 60-second task, the three "pick for me" questions,
   the map panel, and "this page is not built yet, do this instead". All of it works on the poster alone.
   The live desk (study.js) is fetched after the first screen is up; it only listens to what happens here
   (window.F4.on(...)) and calls F4.enter(id) when you click a thing on the desk. */
(() => {
  const html = document.documentElement;
  const Q = new URLSearchParams(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const card = $('#card'), live = $('#live'), hero = $('#hero'), progressEl = $('#progress');
  const btnTask = $('#btn-task'), btnPick = $('#btn-pick'), ways = $('#ways');
  const KEY = 'paradigm.f4';
  const VIEW_KEY = 'paradigm.f4.view';       // which of the two versions you picked: '3d' (index.html) or 'simple' (simple.html)
  const SIMPLE = html.dataset.view === 'simple';
  const WEEK = 7 * 864e5;

  /* ---------------------------------------------------------------- the 33 lessons (../../../syllabus.js) */
  const STAGES = Array.isArray(window.STAGES) ? window.STAGES : [];
  const LESSONS = [];
  STAGES.forEach((s, si) => s.lessons.forEach((l) => LESSONS.push(Object.assign({}, l, { stage: si }))));
  const byId = {}; LESSONS.forEach((l) => { byId[l.id] = l; });
  const TOTAL = LESSONS.length || 33;
  const ROUTES = {}; (Array.isArray(window.CRAB_ROUTES) ? window.CRAB_ROUTES : []).forEach((r) => { ROUTES[r.id] = r; });
  const lessonHref = (l) => (l && l.page ? '../../../' + l.page : null);

  // the seven things on the desk: what they are called here, and one plain line each
  const ENTRY = {
    pick: { name: '幫我挑', line: '回答 3 題，告訴你從第幾課開始。' },
    map: { name: '學習地圖', line: '33 課從簡單排到難，會的可以跳過。' },
    free: { name: '領取資源', line: 'IG 留言領的 Skill 檔、PDF、提示詞都在這。' },
    solve: { name: '解決一件事', line: '例如整理共筆、回一堆信，帶來一步步用 AI 做完。' },
    words: { name: 'AI 名詞小字典', line: 'Skill、MCP、Agent 是什麼？一個詞一句話，附例子。' },
    news: { name: 'AI 新聞', line: '每週四整理一次，只挑跟你有關的。' },
    ask: { name: '你想學什麼', line: '留一句話，我們挑來做下一支片。' },
  };

  /* ---------------------------------------------------------------- what this browser remembers: things done and learned, not things clicked */
  const CARRY = KEY + '.carry';
  let switched = false;                    // you came here from the other version a moment ago
  function load() {
    let s = {}; let carried = null;
    // the other version of this page may have just handed its progress over (the switch does that): take it, it is the newest
    try { carried = sessionStorage.getItem(CARRY); if (carried) sessionStorage.removeItem(CARRY); } catch (e) { carried = null; }
    try { if (carried) { s = JSON.parse(carried) || {}; s.visits = Math.max(0, (s.visits || 1) - 1); switched = true; } else if (!Q.has('fresh')) s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    return { known: Array.isArray(s.known) ? s.known.filter((id) => byId[id]) : [], done: s.done || {}, log: Array.isArray(s.log) ? s.log : [], start: byId[s.start] ? s.start : null, goal: s.goal || null, level: s.level == null ? null : s.level, visits: (s.visits || 0) + 1, last: s.last || null };
  }
  const state = load();
  const save = () => { try { if (!Q.has('fresh') || Q.has('keep')) localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  save();
  const weekCount = () => state.log.filter((t) => Date.now() - t < WEEK).length;
  const did = (what) => { state.log.push(Date.now()); state.last = what; if (state.log.length > 200) state.log = state.log.slice(-200); };
  function nextStep() {
    if (!state.done.t1) return { kind: 'task', label: '60 秒任務', min: 1 };
    if (!state.start) return { kind: 'pick', label: '幫我挑', min: 1 };
    const l = byId[state.start];
    return { kind: 'lesson', label: `第 ${l.n} 課「${l.title}」`, short: `第 ${l.n} 課`, min: l.min, lesson: l };
  }
  function greeting() {
    const n = nextStep(); const w = weekCount();
    const week = w >= 2 ? `這週做了 ${w} 件。` : '';
    if (state.visits <= 1 && !state.done.t1 && !state.start) return '第一次來嗎？先試一個小的，60 秒就好。';
    if (switched) return n.kind === 'task' ? '要不要先試那個 60 秒的？' : n.kind === 'pick' ? '進度帶過來了。下一步：幫我挑，3 題就好。' : `進度帶過來了。下一步是${n.short}，大約 ${n.min} 分鐘。`;
    if (n.kind === 'task') return '你回來了。要不要先試那個 60 秒的？';
    if (n.kind === 'pick') return `你回來了！上次做完 60 秒任務。${week}下一步：幫我挑，3 題就好。`;
    return `你回來了！${state.known.length ? `你會了 ${state.known.length} 課。` : ''}${week}下一步是${n.short}，大約 ${n.min} 分鐘。`;
  }

  /* ---------------------------------------------------------------- a tiny bus the live desk listens to */
  const subs = {};
  const on = (evt, fn) => { (subs[evt] = subs[evt] || []).push(fn); };
  const emit = (evt, data) => { (subs[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };
  const announce = (text) => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); };

  /* ---------------------------------------------------------------- the first screen keeps itself up to date */
  function refresh() {
    const n = nextStep(); const w = weekCount(); const k = state.known.length;
    const parts = []; if (k) parts.push(`你會了 ${k} / ${TOTAL} 課`); if (w) parts.push(`這週做了 ${w} 件`);
    progressEl.textContent = parts.join('・');
    btnTask.textContent = n.kind === 'task' ? '給我一個 60 秒任務' : n.kind === 'pick' ? '下一步：幫我挑（3 題）' : `下一步：${n.short}（約 ${n.min} 分鐘）`;
    btnTask.dataset.next = n.kind;
    btnPick.textContent = state.start ? '重新幫我挑' : state.done.t1 ? '再做一次 60 秒任務' : '我會一點了，幫我挑從哪課開始';
    btnPick.dataset.next = state.start ? 'pick' : state.done.t1 ? 'task' : 'pick';
    emit('state', state);
  }

  /* ---------------------------------------------------------------- the card */
  let cur = null;                          // { kind, id }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function show(kind, id, body) {
    const was = cur;
    cur = { kind, id };
    card.innerHTML = '<button type="button" class="x" data-act="close" aria-label="關掉這張卡">×</button>' + body;
    card.classList.add('on'); html.classList.add('has-card');
    ways.querySelectorAll('a').forEach((a) => a.classList.toggle('is-on', a.dataset.id === id));
    const h = card.querySelector('h2'); if (h) { h.id = 'card-title'; h.tabIndex = -1; h.focus({ preventScroll: true }); }
    if (!was || was.kind !== kind || was.id !== id) emit('card:open', { kind, id });
  }
  function close(silent) {
    if (!cur) return;
    const was = cur; cur = null;
    card.classList.remove('on'); html.classList.remove('has-card');
    ways.querySelectorAll('a').forEach((a) => a.classList.remove('is-on'));
    if (!silent) emit('card:close', was);
  }
  const nextButton = (cls = 'go') => {
    const n = nextStep();
    if (n.kind === 'task') return `<button type="button" class="${cls}" data-act="task">先做 60 秒任務</button>`;
    if (n.kind === 'pick') return `<button type="button" class="${cls}" data-act="pick">幫我挑從哪課開始</button>`;
    const href = lessonHref(n.lesson);
    return href ? `<a class="${cls}" href="${esc(href)}">開始${esc(n.short)}</a>` : `<a class="${cls}" href="https://claude.ai" target="_blank" rel="noopener">打開 Claude 試一次</a>`;
  };

  /* ---- the 60-second task: one question, answered right here, no login */
  const TASK = {
    q: '這兩句問 AI 的話，哪一句會得到比較好的答案？',
    a: '幫我寫讀書計畫。',
    b: '我大二，下週三考微積分第 3 到 5 章，每天晚上只有 2 小時。幫我排 5 天的讀書計畫，用表格。',
    why: 'B 說了你是誰、要做什麼、有什麼限制。AI 不用猜，答案就會準。',
  };
  function openTask() {
    show('task', 'solve', `
      <p class="kicker">60 秒任務</p>
      <h2>${esc(TASK.q)}</h2>
      <div class="opts">
        <button type="button" class="opt" data-k="A" data-act="answer" data-v="a">${esc(TASK.a)}</button>
        <button type="button" class="opt" data-k="B" data-act="answer" data-v="b">${esc(TASK.b)}</button>
      </div>`);
    announce('60 秒任務：' + TASK.q);
  }
  function answerTask(v) {
    const first = !state.done.t1;
    state.done.t1 = state.done.t1 || Date.now(); if (first) did('t1'); save();
    const count = Object.keys(state.done).length;
    show('task', 'solve', `
      <p class="kicker">60 秒任務</p>
      <h2>${v === 'b' ? '對，是 B。' : '差一點，是 B。'}</h2>
      <div class="opts">
        <button type="button" class="opt${v === 'a' ? ' is-chosen' : ''}" data-k="A" disabled>${esc(TASK.a)}</button>
        <button type="button" class="opt is-right${v === 'b' ? ' is-chosen' : ''}" data-k="B" disabled>${esc(TASK.b)}</button>
      </div>
      <p class="why">${esc(TASK.why)}</p>
      <p class="win">你做到第 ${count} 件了！</p>
      <p class="small">把 B 那句換成你自己的事，貼給 Claude 試一次，就是真的會了。</p>
      <div class="row">
        <a class="go" href="https://claude.ai" target="_blank" rel="noopener">打開 Claude 試一次</a>
        <button type="button" class="go alt" data-act="pick">下一步：幫我挑</button>
      </div>`);
    announce(`你做到第 ${count} 件了！${TASK.why}`);
    refresh(); emit('task:done', { first, right: v === 'b' });
  }

  /* ---- pick for me: three questions, then where to start, with what you already know ticked off */
  const P = { step: 0, level: null, goal: null, checks: {} };
  const LEVELS = ['沒用過', '用過幾次', '常常用'];
  const GOALS = ['讀書', '工作', '生活'];
  const SKILLS = [['chat', '開新對話，問它問題'], ['files', '上傳檔案或圖片給它讀'], ['project', '用 Project 放一個主題的資料']];
  function recommend(level, checks) {
    const known = [];
    if (level >= 1) known.push('what-is-ai');
    if (checks.chat) known.push('tools-plans');
    if (checks.files) known.push('files-web');
    if (checks.project) known.push('projects');
    const has = (id) => known.includes(id);
    let start;
    if (level === 2 && checks.project) start = 'skills';                       // already settled in: go straight to making it work your way
    else if (level === 2) start = ['instructions', 'projects'].find((id) => !has(id));
    else start = (LESSONS.find((l) => !has(l.id)) || LESSONS[0] || {}).id;
    return { known: known.filter((id) => byId[id]), start: byId[start] ? start : (LESSONS[0] || {}).id };
  }
  function openPick(step) {
    if (step == null) { P.step = 0; P.level = null; P.goal = null; P.checks = {}; } else P.step = step;
    const head = `<p class="kicker">幫我挑</p><p class="steps">${P.step + 1} / 3</p>`;
    if (P.step === 0) {
      show('pick', 'pick', head + `<h2>你用過 Claude 或 ChatGPT 嗎？</h2><div class="opts">${LEVELS.map((t, i) => `<button type="button" class="opt" data-k="${i + 1}" data-act="level" data-v="${i}">${t}</button>`).join('')}</div>`);
    } else if (P.step === 1) {
      show('pick', 'pick', head + `<h2>想先拿 AI 做什麼？</h2><div class="opts">${GOALS.map((t, i) => `<button type="button" class="opt" data-k="${i + 1}" data-act="goal" data-v="${t}">${t}</button>`).join('')}</div>`);
    } else {
      show('pick', 'pick', head + `<h2>這些你會了嗎？</h2><p class="small">會的點一下。都還不會，直接看結果就好。</p>
        <div class="opts">${SKILLS.map(([k, t]) => `<button type="button" class="opt check" data-k="" data-act="check" data-v="${k}" aria-pressed="${P.checks[k] ? 'true' : 'false'}">${t}</button>`).join('')}</div>
        <div class="row"><button type="button" class="go" data-act="result">看結果</button></div>`);
    }
    if (step == null) announce('幫我挑，共 3 題。第 1 題：你用過 Claude 或 ChatGPT 嗎？');
  }
  function pickResult() {
    const r = recommend(P.level || 0, P.checks);
    const first = !state.start;
    state.known = r.known; state.start = r.start; state.goal = P.goal; state.level = P.level || 0;
    if (first) did('pick'); save();
    const l = byId[r.start]; const n = r.known.length; const href = lessonHref(l);
    const line = `${n ? `你已經會 ${n} 件，先幫你打勾了。` : ''}從第 ${l.n} 課「${l.title}」開始，大約 ${l.min} 分鐘。`;
    show('pick', 'pick', `
      <p class="kicker">幫我挑</p>
      <h2>${esc(line)}</h2>
      <p>學完你能：${esc(l.can)}。</p>
      ${P.goal ? `<p class="small">你說想先用在「${esc(P.goal)}」，記下來了。${l.n > 2 ? '前面的課想回頭看，地圖上都在。' : ''}</p>` : ''}
      ${href ? '' : `<p class="small">這一課還在做，上線後會亮在地圖上。先做下面這個，不會白等。</p>`}
      <div class="row">
        ${href ? `<a class="go" href="${esc(href)}">開始第 ${l.n} 課</a>` : (state.done.t1 ? `<a class="go" href="https://claude.ai" target="_blank" rel="noopener">打開 Claude 試一次</a>` : `<button type="button" class="go" data-act="task">先做 60 秒任務</button>`)}
        <button type="button" class="go alt" data-act="map">看學習地圖</button>
      </div>`);
    announce(line);
    refresh(); emit('pick:done', { first, known: r.known, start: r.start });
  }

  /* ---- the map: where you are among the 33 */
  function openMap() {
    const k = state.known.length; const w = weekCount(); const n = nextStep();
    const here = n.kind === 'lesson' ? n.lesson.stage : (state.done.t1 ? 0 : -1);
    show('map', 'map', `
      <p class="kicker">學習地圖</p>
      <h2>${k ? `你會了 ${k} / ${TOTAL} 課。` : `${TOTAL} 課，從簡單排到難。`}</h2>
      <p class="small">${w ? `這週做了 ${w} 件。` : ''}會的可以跳過，順序只是建議。</p>
      <ol class="stages">${STAGES.map((s, i) => {
        const d = s.lessons.filter((l) => state.known.includes(l.id)).length;
        return `<li class="${i === here ? 'is-here' : ''}">${esc(s.name)}<span>${d} / ${s.lessons.length}</span><small>${i === here && n.kind === 'lesson' ? `下一步：第 ${n.lesson.n} 課「${esc(n.lesson.title)}」，約 ${n.lesson.min} 分鐘` : esc(s.for)}</small></li>`;
      }).join('')}</ol>
      <div class="row">${nextButton()}${n.kind === 'lesson' && !lessonHref(n.lesson) ? '<span class="small" style="font-size:13px;color:var(--grape-2)">課程頁還在做，先用這個練。</span>' : ''}</div>`);
    announce(k ? `學習地圖：你會了 ${k} / ${TOTAL} 課。` : `學習地圖：${TOTAL} 課，從簡單排到難。`);
  }

  /* ---- a thing that is not built yet: say so, and give the next step instead of a dead end */
  function openSoon(id) {
    const e = ENTRY[id]; if (!e) return;
    show('soon', id, `
      <p class="kicker">${esc(e.name)}</p>
      <h2>這一頁還在做。</h2>
      <p>${esc(e.line)}</p>
      <p class="small">做好之前，先做這個：</p>
      <div class="row">${nextButton()}<button type="button" class="go alt" data-act="map">看學習地圖</button></div>`);
    announce(`${e.name}還在做。${e.line}`);
  }

  const showMap = () => (window.F4 && window.F4.onMap ? window.F4.onMap() : openMap());

  /* ---- going into one of the seven (from the index, or from the thing on the desk) */
  function enter(id) {
    const r = ROUTES[id];
    if (r && r.href) { emit('leave', { id, href: r.href }); setTimeout(() => { location.href = r.href; }, html.classList.contains('is-3d') ? 750 : 0); return; }
    if (id === 'pick') openPick(); else if (id === 'map') showMap(); else openSoon(id);
  }
  const act = (name) => { if (name === 'task') openTask(); else if (name === 'pick') openPick(); else if (name === 'lesson') { const n = nextStep(); const href = n.lesson && lessonHref(n.lesson); if (href) location.href = href; else showMap(); } };

  card.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, v = b.dataset.v;
    if (a === 'close') { close(); btnTask.focus({ preventScroll: true }); }
    else if (a === 'answer') answerTask(v);
    else if (a === 'task') openTask();
    else if (a === 'pick') openPick();
    else if (a === 'map') showMap();
    else if (a === 'level') { P.level = +v; openPick(1); }
    else if (a === 'goal') { P.goal = v; openPick(2); }
    else if (a === 'check') { P.checks[v] = !P.checks[v]; b.setAttribute('aria-pressed', P.checks[v] ? 'true' : 'false'); }
    else if (a === 'result') pickResult();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cur) { close(); btnTask.focus({ preventScroll: true }); } });
  btnTask.addEventListener('click', () => act(btnTask.dataset.next || 'task'));
  btnPick.addEventListener('click', () => act(btnPick.dataset.next || 'pick'));
  ways.addEventListener('click', (e) => { const a = e.target.closest('a[data-id]'); if (!a) return; e.preventDefault(); enter(a.dataset.id); });

  window.F4 = { state, on, emit, enter, openTask, openPick, openMap, openSoon, close, nextStep, greeting, weekCount, ENTRY, ROUTES, LESSONS, STAGES, byId, TOTAL, lessonHref, onMap: null, simple: SIMPLE, t0: performance.now(), get card() { return cur; } };
  refresh();
  html.classList.add('is-ready');
  performance.mark('f4-first-screen-ready');

  /* ---------------------------------------------------------------- two versions of this page: the switch remembers which one you picked.
     index.html reads the same key in its <head> and sends you to simple.html if that is what you chose (or if your system asks for less motion). */
  document.querySelectorAll('a[data-view-to]').forEach((a) => {
    const to = a.dataset.viewTo; const q = new URLSearchParams(location.search); q.delete('view');
    if (to === '3d') q.set('view', '3d');             // said out loud in the address, so it holds even where nothing can be stored
    const qs = q.toString().replace(/=(?=&|$)/g, '');
    a.href = a.getAttribute('href').split('?')[0] + (qs ? '?' + qs : '');
    a.addEventListener('click', () => {
      try { if (!Q.has('fresh') || Q.has('keep')) localStorage.setItem(VIEW_KEY, to); } catch (e) { /* private mode */ }
      try { sessionStorage.setItem(CARRY, JSON.stringify(state)); } catch (e) { /* then the stored copy will have to do */ }
      // the move between the two pages (switch-fx.js / .css): only this click plays it; on the plain page it starts from the little desk photo
      try {
        const ph = document.getElementById('desk-photo'); const r = ph ? ph.getBoundingClientRect() : null;
        sessionStorage.setItem('paradigm.f4.switching', JSON.stringify({ to, at: Date.now(),
          ox: r ? (r.left + r.width / 2) / innerWidth * 100 : null, oy: r ? (r.top + r.height / 2) / innerHeight * 100 : null }));
      } catch (e) { /* then it just changes page */ }
    });
  });
  if (SIMPLE) {                                       // the plain version: no desk to load; only fetch its picture ahead, so the switch flies into it
    const warm = () => { const i = new Image(); i.decoding = 'async'; i.src = 'poster.webp'; };
    const idle0 = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500));
    if (document.readyState === 'complete') idle0(warm); else window.addEventListener('load', () => idle0(warm));
    return;
  }

  /* ---------------------------------------------------------------- the live desk: only after the first screen is up, and only if the connection can take it */
  const conn = navigator.connection || {};
  // desktop-first: a narrow desktop window (e.g. a side panel) still gets the live desk; only real touch phones stay on the poster
  const isPhone = !Q.has('live') && matchMedia('(max-width: 767px) and (pointer: coarse) and (hover: none)').matches;
  const stayOnPoster = Q.has('poster') || isPhone || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')  /* not 3g: Chrome's estimate often says 3g on fine desktop connections */ || /Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent || '');
  function load3D() {
    if (stayOnPoster) { html.classList.add('is-poster'); return; }
    import('./study.js').catch((e) => { console.info('[f4] staying on the poster:', e && e.message); html.classList.add('is-poster'); });
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 250));
  if (html.dataset.arrive === 'pack') load3D();        // came with the crab's bundle (pack-fx.js): the desk is wanted now, the crab is in the air
  else if (document.readyState === 'complete') idle(load3D); else window.addEventListener('load', () => idle(load3D));
})();

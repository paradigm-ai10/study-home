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

  /* ---------------------------------------------------------------- the map, version 8 (../../../roadmap8.js, made by make_roadmap8.py): v8.5: 3 stages, 4 roles, 17 topics, 137 lessons.
     The first release is 20 of them; STAGES here are the AI Power User topics, each with its first-release lessons (FIRST).
     Only the ones with a lesson page (LESSON_PAGES in ../../routes.js) are open: LESSONS, the path that progress, the next step and 程度評估 follow.
     A new lesson page goes into LESSON_PAGES and joins the path by itself, in first-release order. */
  const STAGES = Array.isArray(window.STAGES) ? window.STAGES : [];
  const FIRST = [];
  STAGES.forEach((s, si) => s.lessons.forEach((l) => FIRST.push(Object.assign({}, l, { stage: si }))));
  const LESSONS = FIRST.filter((l) => window.LESSON_PAGES && window.LESSON_PAGES[l.id]);
  const byId = {}; LESSONS.forEach((l) => { byId[l.id] = l; });
  const TOTAL = LESSONS.length || 8;
  const MAP8 = window.ROADMAP8 || null;
  const FIRST_N = MAP8 ? MAP8.first.length : FIRST.length;   // the whole first release (some lessons are in later roles' topics)   // the whole map (topics, roles, counts), for showing what comes later
  const minTxt = (m) => (m ? `約 ${m} 分鐘` : '');   // v8 lessons carry no minutes yet: then no time is shown
  const ROUTES = {}; (Array.isArray(window.CRAB_ROUTES) ? window.CRAB_ROUTES : []).forEach((r) => { ROUTES[r.id] = r; });
  const lessonHref = (l) => (l && window.LESSON_PAGES && window.LESSON_PAGES[l.id]) || null;   // ../../routes.js: filled in once each lesson page exists

  // the seven things on the desk: what they are called here, and one plain line each
  const ENTRY = {
    pick: { name: '程度評估', line: '3 題評估，推薦起始課程。' },
    map: { name: '學習地圖', line: MAP8 ? `${MAP8.counts.stages} 階段・${MAP8.counts.topics} 主題・必修 ${MAP8.counts.required} 課、選修 ${MAP8.counts.electives} 課，首版 ${FIRST_N} 課（已開放 ${TOTAL} 課）。` : '學習地圖。' },
    free: { name: '資源下載', line: 'Skill 檔案、PDF 講義與提示詞範本。' },
    solve: { name: '實作案例', line: '以實際任務示範 AI 工作流程：文件整理、郵件處理等。' },
    words: { name: 'AI 名詞辭典', line: 'Skill、MCP、Agent 等術語的定義與範例。' },
    news: { name: 'AI 新聞', line: '每週四更新：模型、功能與工具動態精選。' },
    ask: { name: '主題提案', line: '提出想學的主題，作為後續內容規劃依據。' },
  };

  /* ---------------------------------------------------------------- what this browser remembers: things done and learned, not things clicked */
  const CARRY = KEY + '.carry';
  let switched = false;                    // you came here from the other version a moment ago
  // progress saved before 2026-11-12 used the old 33-lesson ids: carry over what still means something, drop the rest
  // only v8 lesson ids (1-1 … 15-x) count: anything saved under the older maps (33-lesson ids, L0-01 …) is dropped
  // an older id (v8.1, or v8.0's 5-5) is read through roadmap8.js's idmap once, by lookup: a current id is never translated again, so nothing chains
  const IDMAP = (window.ROADMAP8 && window.ROADMAP8.idmap) || {};
  const newId = (id) => (byId[id] ? id : IDMAP[id] && byId[IDMAP[id]] ? IDMAP[id] : null);
  function load() {
    let s = {}; let carried = null;
    // the other version of this page may have just handed its progress over (the switch does that): take it, it is the newest
    try { carried = sessionStorage.getItem(CARRY); if (carried) sessionStorage.removeItem(CARRY); } catch (e) { carried = null; }
    try { if (carried) { s = JSON.parse(carried) || {}; s.visits = Math.max(0, (s.visits || 1) - 1); switched = true; } else if (!Q.has('fresh')) s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    const self = Array.isArray(s.self) ? s.self : Array.isArray(s.known) ? s.known : [];   // older saves had only 'known': keep it as what you ticked
    return { self: [...new Set(self.map(newId).filter(Boolean))], known: [], done: s.done || {}, log: Array.isArray(s.log) ? s.log : [], start: newId(s.start), goal: s.goal || null, level: s.level == null ? null : s.level, visits: (s.visits || 0) + 1, last: s.last || null };
  }
  const state = load();
  // lessons finished on the lesson pages (課程/lesson-page.js keeps them in localStorage 'pd-done'): count them as learned here too.
  // One way only: what you tick in 程度評估 stays in this page's own record and is not written into pd-done.
  function mergeDone() {
    if (Q.has('fresh') && !Q.has('keep')) return false;   // ?fresh: as if this were the first visit
    let d = []; try { d = JSON.parse(localStorage.getItem('pd-done') || '[]'); } catch (e) { d = []; }
    if (!Array.isArray(d)) return false;
    const keep = d.filter((id) => !/^L\d+-\d+$/.test(id));            // lessons from map v7 (L0-01 …) are gone: clear them out of the shared record too
    if (keep.length !== d.length) { d = keep; try { localStorage.setItem('pd-done', JSON.stringify(d)); } catch (e) { /* private mode */ } }
    const before = state.known.join();
    state.known = [...new Set(state.self.concat(d.map(newId).filter(Boolean)))];   // pd-done is read through newId (old ids by the v8.1→v8.5 table), never rewritten here   // known = ticked in 程度評估 + finished on a lesson page, both now
    return state.known.join() !== before;
  }
  if (!mergeDone()) state.known = state.self.slice();
  const save = () => { try { if (!Q.has('fresh') || Q.has('keep')) localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  save();
  const weekCount = () => state.log.filter((t) => Date.now() - t < WEEK).length;
  const did = (what) => { state.log.push(Date.now()); state.last = what; if (state.log.length > 200) state.log = state.log.slice(-200); };
  function nextStep() {
    if (LESSONS.length && LESSONS.every((x) => state.known.includes(x.id))) return { kind: 'done', label: `已開放 ${TOTAL} 課全部完成`, short: `已開放 ${TOTAL} 課全部完成`, min: null };
    if (!state.start && state.known.length) state.start = (LESSONS.find((x) => !state.known.includes(x.id)) || LESSONS[0]).id;   // lessons done on the lesson pages: carry on from there
    if (!state.start && !state.done.t1) return { kind: 'task', label: '60 秒體驗', min: 1 };   // a level check already done (even without the 60-second task) decides the next step
    if (!state.start) return { kind: 'pick', label: '程度評估', min: 1 };
    let l = byId[state.start];
    if (state.known.includes(l.id)) {          // the start is done already (a lesson page said so): point at the next one not done
      const i = LESSONS.findIndex((x) => x.id === l.id);
      const after = LESSONS.slice(i + 1).concat(LESSONS.slice(0, i)).find((x) => !state.known.includes(x.id));
      if (after) l = after;
      else return { kind: 'done', label: `已開放 ${TOTAL} 課全部完成`, short: `已開放 ${TOTAL} 課全部完成`, min: null };   // nothing left in the first release
    }
    return { kind: 'lesson', label: `${l.id}「${l.title}」`, short: l.id, min: l.min, lesson: l };
  }
  function greeting() {
    const n = nextStep(); const w = weekCount();
    const week = w >= 2 ? `本週完成 ${w} 項。` : '';
    if (state.visits <= 1 && !state.done.t1 && !state.start) return '第一次來嗎？先試一個小的，60 秒就好。';
    if (switched) return n.kind === 'task' ? '要不要先試那個 60 秒的？' : n.kind === 'pick' ? '進度已同步。下一步：程度評估（3 題）。' : `進度帶過來了。下一步是${n.short}${n.min ? `，大約 ${n.min} 分鐘` : ''}。`;
    if (n.kind === 'done') return `已開放的 ${TOTAL} 課都完成了。其他課陸續推出，地圖上看得到。`;
    if (n.kind === 'task') return '你回來了。要不要先試那個 60 秒的？';
    if (n.kind === 'pick') return `歡迎回來。60 秒體驗已完成。${week}下一步：程度評估（3 題）。`;
    return `你回來了！${state.known.length ? `已完成 ${state.known.length} 課。` : ''}${week}下一步是${n.short}${n.min ? `，大約 ${n.min} 分鐘` : ''}。`;
  }

  /* ---------------------------------------------------------------- a tiny bus the live desk listens to */
  const subs = {};
  const on = (evt, fn) => { (subs[evt] = subs[evt] || []).push(fn); };
  const emit = (evt, data) => { (subs[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };
  const announce = (text) => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); };

  /* ---------------------------------------------------------------- the first screen keeps itself up to date */
  // back from a lesson page (also from the back/forward cache), or a lesson finished in another tab: pick up what changed
  const recheck = () => { if (mergeDone()) { save(); refresh(); } };
  addEventListener('pageshow', (e) => { if (e.persisted) recheck(); });
  addEventListener('storage', (e) => { if (e.key === 'pd-done') recheck(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recheck(); });
  function refresh() {
    const n = nextStep(); const w = weekCount(); const k = state.known.length;
    const parts = []; if (k) parts.push(`已完成 ${k} / ${TOTAL} 課`); if (w) parts.push(`本週完成 ${w} 項`);
    progressEl.textContent = parts.join('・');
    btnTask.textContent = n.kind === 'done' ? '查看學習地圖' : n.kind === 'task' ? '開始 60 秒體驗' : n.kind === 'pick' ? '下一步：程度評估（3 題）' : `下一步：${n.short}${n.min ? `（約 ${n.min} 分鐘）` : ''}`;
    btnTask.dataset.next = n.kind === 'done' ? 'map' : n.kind;
    btnPick.textContent = state.start ? '重新評估' : state.done.t1 ? '再次進行 60 秒體驗' : '已有基礎？進行程度評估';
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
    ways.querySelectorAll('a').forEach((a) => a.classList.toggle('is-on', kind !== 'task' && a.dataset.id === id));   // the 60-second card sits on the notepad (id solve) but is not 實作案例
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
    if (n.kind === 'task') return `<button type="button" class="${cls}" data-act="task">先進行 60 秒體驗</button>`;
    if (n.kind === 'done') return `<button type="button" class="${cls}" data-act="map">查看學習地圖</button>`;
    if (n.kind === 'pick') return `<button type="button" class="${cls}" data-act="pick">進行程度評估</button>`;
    const href = lessonHref(n.lesson);
    return href ? `<a class="${cls}" href="${esc(href)}">開始 ${esc(n.short)}</a>` : `<a class="${cls}" href="https://claude.ai" target="_blank" rel="noopener">前往 Claude 實測</a>`;
  };

  /* ---- the 60-second task: one question, answered right here, no login */
  const TASK = {
    q: '以下兩則提示，何者能取得較高品質的回答？',
    a: '幫我寫讀書計畫。',
    b: '我大二，下週三考微積分第 3 到 5 章，每天晚上只有 2 小時。幫我排 5 天的讀書計畫，用表格。',
    why: 'B 明確提供背景、任務與限制條件，模型無須推測需求，輸出因此更精準。這即是 Prompt 四要素（2-1）的核心原則。',
  };
  function openTask() {
    show('task', 'solve', `
      <p class="kicker">60 秒體驗</p>
      <h2>${esc(TASK.q)}</h2>
      <div class="opts">
        <button type="button" class="opt" data-k="A" data-act="answer" data-v="a">${esc(TASK.a)}</button>
        <button type="button" class="opt" data-k="B" data-act="answer" data-v="b">${esc(TASK.b)}</button>
      </div>`);
    announce('60 秒體驗：' + TASK.q);
  }
  function answerTask(v) {
    const first = !state.done.t1;
    state.done.t1 = state.done.t1 || Date.now(); if (first) did('t1'); save();
    const count = Object.keys(state.done).length;
    show('task', 'solve', `
      <p class="kicker">60 秒體驗</p>
      <h2>${v === 'b' ? '正確：B。' : '正確答案：B。'}</h2>
      <div class="opts">
        <button type="button" class="opt${v === 'a' ? ' is-chosen' : ''}" data-k="A" disabled>${esc(TASK.a)}</button>
        <button type="button" class="opt is-right${v === 'b' ? ' is-chosen' : ''}" data-k="B" disabled>${esc(TASK.b)}</button>
      </div>
      <p class="why">${esc(TASK.why)}</p>
      <p class="win">已完成 ${count} 項任務。</p>
      <p class="small">建議將 B 改寫為自身情境，於 Claude 實際測試一次。</p>
      <div class="row">
        <a class="go" href="https://claude.ai" target="_blank" rel="noopener">前往 Claude 實測</a>
        <button type="button" class="go alt" data-act="pick">下一步：程度評估</button>
      </div>`);
    announce(`已完成 ${count} 項任務。${TASK.why}`);
    refresh(); emit('task:done', { first, right: v === 'b' });
  }

  /* ---- pick for me: three questions, then where to start, with what you already know ticked off */
  const P = { step: 0, level: null, goal: null, checks: {} };
  const LEVELS = ['尚未使用', '偶爾使用', '經常使用'];
  const GOALS = ['Prompt 撰寫', '檔案問答與研究', '個人化指令與 Skills', '排程與自動化'];
  const GOAL_START = { 'Prompt 撰寫': '2-1', '檔案問答與研究': '3-1', '個人化指令與 Skills': '4-1', '排程與自動化': '6-3' };
  const SKILLS = [['1-1', '已有 Claude 帳號並完成過任務'], ['2-1', '用 Prompt 四要素描述需求'], ['3-1', '讓 Claude 只根據上傳檔案回答'], ['4-1', '設定過個人化指令'], ['4-4', '使用過內建 Skill']];
  // map v8.5 (2026-11-13; only lessons with a page are recommended): never used → 1-1; used a few times → 1-4; uses it a lot → by what they want to learn (2-1 / 3-1 / 4-1 / 6-3; map v8.1, 6-3 was 5-5 in v8.0).
  // The whole table, for checking: 首頁資料夾的 程度評估對應表.md
  // What they tick in question 3 counts as learned; if the start is one of those, move on to the next lesson not learned.
  function recommend(level, goal, checks) {
    const known = SKILLS.map(([id]) => id).filter((id) => checks[id] && byId[id]);
    if (level >= 1 && !known.includes('1-1')) known.push('1-1');
    const done = state.known.filter((id) => !state.self.includes(id));   // finished on the lesson pages
    const all = [...new Set(known.concat(done))];
    let start = level === 0 ? '1-1' : level === 1 ? '1-4' : GOAL_START[goal] || '2-1';
    if (all.includes(start)) {
      const i = LESSONS.findIndex((l) => l.id === start);
      const after = LESSONS.slice(i + 1).concat(LESSONS.slice(0, i)).find((l) => !all.includes(l.id));
      start = after ? after.id : start;
    }
    return { known, start: byId[start] ? start : (LESSONS[0] || {}).id, all: all.length };
  }
  function openPick(step) {
    if (step == null) { P.step = 0; P.level = null; P.goal = null; P.checks = {}; } else P.step = step;
    const many = P.level === 2;                     // only people who use it a lot get the 'what do you want to learn' question
    const head = `<p class="kicker">程度評估</p><p class="steps">${P.step === 2 ? '最後一題' : `第 ${P.step + 1} 題`}</p>`;   // the total depends on the first answer, so no 'n / total'
    if (P.step === 0) {
      show('pick', 'pick', head + `<h2>Claude／ChatGPT 使用經驗</h2><div class="opts">${LEVELS.map((t, i) => `<button type="button" class="opt" data-k="${i + 1}" data-act="level" data-v="${i}">${t}</button>`).join('')}</div>`);
    } else if (P.step === 1) {
      show('pick', 'pick', head + `<h2>優先學習目標</h2><div class="opts">${GOALS.map((t, i) => `<button type="button" class="opt" data-k="${i + 1}" data-act="goal" data-v="${t}">${t}</button>`).join('')}</div>`);
    } else {
      show('pick', 'pick', head + `<h2>已具備的能力</h2><p class="small">勾選已熟悉的項目（可複選）；若皆未接觸，直接查看結果。</p>
        <div class="opts">${SKILLS.map(([k, t]) => `<button type="button" class="opt check" data-k="" data-act="check" data-v="${k}" aria-pressed="${P.checks[k] ? 'true' : 'false'}">${t}</button>`).join('')}</div>
        <div class="row"><button type="button" class="go" data-act="result">查看評估結果</button></div>`);
    }
    if (step == null) announce('程度評估，共 3 題。第 1 題：Claude／ChatGPT 使用經驗。');
  }
  function pickResult() {
    const r = recommend(P.level || 0, P.goal, P.checks);
    const first = !state.start;
    state.self = r.known; mergeDone(); state.start = r.start; state.goal = P.goal; state.level = P.level || 0;   // mergeDone: keep the lessons finished on the lesson pages
    if (first) did('pick'); save();
    const l = byId[r.start]; const n = r.all; const href = lessonHref(l);
    const line = `建議起點：${l.id}「${l.title}」${l.min ? `（約 ${l.min} 分鐘）` : ''}。${n ? `已標記完成 ${n} 課。` : ''}`;
    show('pick', 'pick', `
      <p class="kicker">程度評估</p>
      <h2>${esc(line)}</h2>
      <p>所屬主題的實作成果：${esc(l.can)}</p>
      ${P.goal && P.level === 2 && GOAL_START[P.goal] === r.start ? `<p class="small">依優先目標「${esc(P.goal)}」安排。${l.n > 2 ? '先修課程可於學習地圖查閱。' : ''}</p>` : ''}
      ${href ? '' : `<p class="small">課程頁製作中，上線後將於學習地圖開放。</p>`}
      <div class="row">
        ${href ? `<a class="go" href="${esc(href)}">開始 ${esc(l.id)}</a>` : (state.done.t1 ? `<a class="go" href="https://claude.ai" target="_blank" rel="noopener">前往 Claude 實測</a>` : `<button type="button" class="go" data-act="task">先進行 60 秒體驗</button>`)}
        <button type="button" class="go alt" data-act="map">查看學習地圖</button>
      </div>`);
    announce(line);
    refresh(); emit('pick:done', { first, known: r.known, start: r.start });
  }

  /* ---- the map card (only when map-view.js is missing): the AI Power User topics with their open lessons; the later roles come later */
  function openMap() {
    const k = state.known.length; const w = weekCount(); const n = nextStep();
    const here = n.kind === 'lesson' ? n.lesson.stage : (state.done.t1 ? 0 : -1);
    const all = MAP8 ? MAP8.counts.required + MAP8.counts.electives : 137;
    const s1 = MAP8 && MAP8.roles[0], later = MAP8 ? MAP8.roles.slice(1) : [];
    show('map', 'map', `
      <p class="kicker">學習地圖</p>
      <h2>${k ? `已完成 ${k} / ${TOTAL} 課。` : `首波開放 ${TOTAL} 課／共 ${all} 課`}</h2>
      <p class="small">${w ? `本週完成 ${w} 項。` : ''}可依程度跳過；順序為建議路徑。</p>
      ${s1 ? `<p class="small map-stage">第一階段　${esc(s1.name)}：${esc(s1.line)}</p>` : ''}
      <ol class="stages">${STAGES.map((s, i) => {
        const d = s.lessons.filter((l) => state.known.includes(l.id)).length;
        const soon = (s.count || s.lessons.length) - s.lessons.length;
        const nextId = n.kind === 'lesson' ? n.lesson.id : null;
        const ls = s.lessons.map((l) => `${state.known.includes(l.id) ? '✓ ' : ''}${esc(l.id)} ${esc(l.title)}${l.id === nextId ? `<b class="map-next">下一步${l.min ? `・約 ${l.min} 分鐘` : ''}</b>` : ''}`).join('<br>');
        return `<li class="${i === here ? 'is-here' : ''}">${esc(s.name)}<span>${d} / ${s.lessons.length}</span><small>${ls}${soon ? `<br>其餘 ${soon} 課即將推出` : ''}</small></li>`;
      }).join('')}</ol>
      ${later.length ? `<p class="small map-later">${later.map((g) => `${esc(g.name)}（主題 ${g.topics.map((t) => esc(t.replace('T', ''))).join('、')}）即將推出`).join('<br>')}</p>` : ''}
      <div class="row">${nextButton()}${n.kind === 'lesson' && !lessonHref(n.lesson) ? '<span class="small" style="font-size:13px;color:var(--grape-2)">課程頁製作中。</span>' : ''}</div>`);
    announce(k ? `學習地圖：已完成 ${k} / ${TOTAL} 課。` : `學習地圖：首波開放 ${TOTAL} 課，共 ${all} 課。`);
  }

  /* ---- a thing that is not built yet: say so, and give the next step instead of a dead end */
  function openSoon(id) {
    const e = ENTRY[id]; if (!e) return;
    show('soon', id, `
      <p class="kicker">${esc(e.name)}</p>
      <h2>此頁面建置中。</h2>
      <p>${esc(e.line)}</p>
      <p class="small">建議先進行：</p>
      <div class="row">${nextButton()}${nextStep().kind === 'done' ? '' : '<button type="button" class="go alt" data-act="map">查看學習地圖</button>'}</div>`);
    announce(`${e.name}建置中。${e.line}`);
  }

  const showMap = () => (window.F4 && window.F4.onMap ? window.F4.onMap() : openMap());

  /* ---- going into one of the seven (from the index, or from the thing on the desk) */
  function enter(id) {
    const r = ROUTES[id];
    if (r && r.href) { emit('leave', { id, href: r.href }); setTimeout(() => { location.href = r.href; }, html.classList.contains('is-3d') ? 750 : 0); return; }
    if (id === 'pick') openPick(); else if (id === 'map') showMap(); else openSoon(id);
  }
  const act = (name) => { if (name === 'map') showMap(); else if (name === 'task') openTask(); else if (name === 'pick') openPick(); else if (name === 'lesson') { const n = nextStep(); const href = n.lesson && lessonHref(n.lesson); if (href) location.href = href; else showMap(); } };

  card.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, v = b.dataset.v;
    if (a === 'close') { close(); btnTask.focus({ preventScroll: true }); }
    else if (a === 'answer') answerTask(v);
    else if (a === 'task') openTask();
    else if (a === 'pick') openPick();
    else if (a === 'map') showMap();
    else if (a === 'level') { P.level = +v; if (P.level !== 2) P.goal = null; openPick(P.level === 2 ? 1 : 2); }
    else if (a === 'goal') { P.goal = v; openPick(2); }
    else if (a === 'check') { P.checks[v] = !P.checks[v]; b.setAttribute('aria-pressed', P.checks[v] ? 'true' : 'false'); }
    else if (a === 'result') pickResult();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cur) { close(); btnTask.focus({ preventScroll: true }); return; }
    if (e.key === 'Tab' && cur && card.classList.contains('on')) {      // the card is a dialog: Tab goes round inside it
      const f = [...card.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  btnTask.addEventListener('click', () => act(btnTask.dataset.next || 'task'));
  const fromHash = (wait) => { const h = location.hash.slice(1); if (ENTRY[h] && h !== 'map') setTimeout(() => enter(h), wait); };   // index.html#words etc. (#map: map-view.js)
  fromHash(SIMPLE ? 150 : 900);
  addEventListener('hashchange', () => fromHash(0));
  btnPick.addEventListener('click', () => act(btnPick.dataset.next || 'pick'));
  ways.addEventListener('click', (e) => { const a = e.target.closest('a[data-id]'); if (!a) return; e.preventDefault(); enter(a.dataset.id); });

  window.F4 = { state, on, emit, enter, openTask, openPick, openMap, openSoon, close, nextStep, greeting, weekCount, ENTRY, ROUTES, LESSONS, FIRST, FIRST_N, STAGES, byId, TOTAL, lessonHref, onMap: null, simple: SIMPLE, t0: performance.now(), get card() { return cur; } };
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

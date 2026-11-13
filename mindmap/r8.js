/* 第八輪共用程式庫 R8（2026-11-13，課程正本 v8）。
   Thomas：喜歡第七輪「課程結構表」——讓人知道每個階段會學什麼、會成為什麼、實際會做出什麼；要加強的是「順序感」，
   可以在三個階段下面加一個像 timeline 的東西，一眼看出先學什麼、後學什麼。
   這裡放各版共用的東西，版面各自寫在 r8-*.js：
   - 資料：window.MAP8（data8.js，由 tools/build_data.py 從正本產生），不寫死 3 階段、15 主題，版面用資料算位置。
   - 畫布與字級：規格/spec.js、規格/spec.css（1280×680、1：1 時字 15–28px）。
   - 鉛筆畫風：rough.js 線條、紙張底、階段色排線陰影；正式字 Noto Sans TC，手寫字 Iansui 只給註記。
   - 三層互動：第一眼只有名稱 → 滑過出現卡片（一般網頁文字）→ 點開右側面板看全部。滑過時相關的東西一起亮、其他變淡。
   - 開場動畫：依學習順序 1 → 15 一個一個畫出來，約 5–6 秒；?speed=2 慢一倍、?still 不播。 */
window.R8 = (() => {
  const D = window.MAP8, NS = 'http://www.w3.org/2000/svg';
  const TOPICS = D.topics, STAGES = D.stages, ROLES = D.roles;
  const byT = {}, byR = {}, byS = {};
  TOPICS.forEach((t) => { byT[t.id] = t; });
  ROLES.forEach((r) => { byR[r.id] = r; });
  STAGES.forEach((s) => { byS[s.no] = s; });
  const topicsOf = (s) => TOPICS.filter((t) => t.stage === s);
  const rolesOf = (s) => ROLES.filter((r) => r.stage === s);
  const roleOf = (t) => byR[t.role];

  // ---------- pencil palette (same as the pencil theme in wb.js) ----------
  const PEN = { ink: '#2E2D2B', terra: '#B4502D', grey: '#A29E96', muted: '#67635C', paper: '#FBF8F1', hi: '#F1DFA8', line: '#4A4640' };
  const ST = {
    1: { fill: '#D9A63A', pen: '#C98F1E', dark: '#7A5206', soft: 'rgba(217,166,58,.07)' },
    2: { fill: '#6D97C9', pen: '#4F7FB8', dark: '#2D578A', soft: 'rgba(109,151,201,.07)' },
    3: { fill: '#9D88CC', pen: '#8268BE', dark: '#553A9E', soft: 'rgba(157,136,204,.07)' },
  };
  const col = (s) => ST[s] || ST[3];
  // per-page settings: CFG.roleCode(r) → the role's label on the map (1, 2-1, 2-2, 3), so cards and the panel say the same thing
  const CFG = { roleCode: null };
  const roleKick = (r) => (CFG.roleCode ? `角色 ${CFG.roleCode(r)}` : `角色 ${ROLES.indexOf(r) + 1} / ${ROLES.length}`);

  // ---------- DOM helpers ----------
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const txt = (s, attrs, parent) => { const t = el('text', attrs, parent); t.textContent = s; return t; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // width in em: CJK = 1, Latin ≈ 0.56, space ≈ 0.3
  const ems = (s) => [...String(s)].reduce((a, c) => a + (/[⺀-￿]/.test(c) ? 1 : c === ' ' ? 0.3 : 0.56), 0);
  const textW = (s, px) => ems(s) * px;
  // wrap a sentence to lines of at most `max` em, breaking between CJK characters or Latin words
  function wrap(s, max) {
    const toks = String(s).match(/[A-Za-z0-9.+\-/]+|\s+|./g) || [], lines = [''];
    toks.forEach((t) => { const cur = lines[lines.length - 1]; if (cur && ems(cur + t) > max) { if (t.trim()) lines.push(t); } else lines[lines.length - 1] = cur + t; });
    return lines.map((l) => l.trim()).filter(Boolean);
  }

  // ---------- the canvas ----------
  const svg = SPEC.svg, W = SPEC.CW, H = SPEC.CH;
  const rc = rough.svg(svg);
  const layer = (cls) => el('g', { class: cls || '' }, svg);
  const L = { back: layer('back'), mid: layer('mid'), front: layer('front') };

  // ---------- pencil drawing ----------
  const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  const mk = (color, seed, more) => Object.assign({ stroke: color, strokeWidth: 1.8, roughness: 1.6, bowing: 1, seed }, more || {});
  const hatch = (color, seed, more) => Object.assign({ fill: color, fillStyle: 'hachure', hachureGap: 4.5, fillWeight: 0.9, hachureAngle: -38 + (seed % 5) * 6, stroke: 'none', roughness: 1.2, seed }, more || {});
  const solid = (color, seed) => ({ fill: color, fillStyle: 'solid', stroke: 'none', roughness: 0, seed: seed || 1 });
  // a hand-drawn card: hatched shadow in the stage colour, paper backing, a highlight backing (shown on hover), pencil outline
  function sketchBox(g, x, y, w, h, s, seed, o) {
    o = o || {};
    const r = o.r || 10;
    if (o.shadow !== false) g.appendChild(rc.path(rr(x + 5, y + 5, w, h, r), hatch(col(s).fill, seed, { hachureGap: o.gap || 4.5 })));
    g.appendChild(rc.path(rr(x, y, w, h, r), solid(o.paper || PEN.paper, 3)));
    const hi = rc.path(rr(x, y, w, h, r), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    g.appendChild(rc.path(rr(x, y, w, h, r), mk(o.stroke || PEN.line, seed + 1, { strokeWidth: o.sw || 1.8, roughness: o.rough || 1.3, bowing: 1.2 })));
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  }
  // a stage container: soft wash of the stage colour and a pencil edge
  function stageBox(g, s, x, y, w, h, o) {
    o = o || {};
    g.appendChild(rc.path(rr(x, y, w, h, o.r || 16), solid(col(s).soft, 11 + s)));
    g.appendChild(rc.path(rr(x, y, w, h, o.r || 16), mk(col(s).pen, 1104 + s, { strokeWidth: o.sw || 2.2, roughness: 1, bowing: 1 })));
    return { x, y, w, h };
  }
  function line(g, x0, y0, x1, y1, color, seed, more) { g.appendChild(rc.line(x0, y0, x1, y1, mk(color, seed, more))); }
  function head(g, tip, from, color, seed, size) {
    const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]), Ls = size || 12;
    const p1 = [tip[0] - Ls * Math.cos(a - 0.5), tip[1] - Ls * Math.sin(a - 0.5)], p2 = [tip[0] - Ls * Math.cos(a + 0.5), tip[1] - Ls * Math.sin(a + 0.5)];
    g.appendChild(rc.path(`M${p1[0]} ${p1[1]} L${tip[0]} ${tip[1]} L${p2[0]} ${p2[1]}`, mk(color, seed, { strokeWidth: 2, roughness: 0.8 })));
  }
  // a pencil arrow along a quadratic curve p0 → c → p1
  function arrow(g, p0, c, p1, color, seed, width) {
    g.appendChild(rc.path(`M${p0[0]} ${p0[1]} Q${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`, mk(color, seed, { strokeWidth: width || 2.2, roughness: 1 })));
    head(g, p1, c, color, seed + 1);
  }
  // handwritten note (Iansui) — only for annotations, never for names
  const hand = (g, s, x, y, o) => { o = o || {}; return txt(s, { class: 't-note', x, y, 'text-anchor': o.anchor || 'start', style: o.color ? `fill:${o.color}` : null }, g); };
  // a numbered circle; filled = paper, ring in the stage colour
  function num(g, n, x, y, s, o) {
    o = o || {};
    const d = o.d || 28;
    g.appendChild(rc.circle(x, y, d, { fill: o.fill || PEN.paper, fillStyle: 'solid', stroke: o.stroke || col(s).pen, strokeWidth: o.sw || 2, roughness: 1.1, seed: 600 + n }));
    if (o.hi !== false) { const h = rc.circle(x, y, d, solid(PEN.hi, 5)); h.setAttribute('class', 'hi'); g.appendChild(h); g.appendChild(rc.circle(x, y, d, mk(o.stroke || col(s).pen, 640 + n, { strokeWidth: o.sw || 2, roughness: 1.1 }))); }
    txt(String(n), { class: 't-num', x, y: y + 5.5, 'text-anchor': 'middle', style: `fill:${o.color || col(s).dark}` }, g);
  }
  // lesson dots: one dot per lesson — filled = 必修, ring = 選修, terracotta = 首版開放. Returns the width used.
  // one lesson mark: filled graphite dot = 必修, graphite ring = 選修, brick-red diamond = 首版開放 (shape differs, not only colour)
  function mark(g, kind, cx, cy, r) {
    r = r || 3.1;
    if (kind === 'first') { const d = r + 1.6; return el('path', { class: 'lm-first', d: `M${cx} ${cy - d} L${cx + d} ${cy} L${cx} ${cy + d} L${cx - d} ${cy} Z`, fill: PEN.terra }, g); }
    if (kind === 'req') return el('circle', { cx, cy, r, fill: PEN.line }, g);
    return el('circle', { cx, cy, r: r - 0.5, fill: 'none', stroke: PEN.line, 'stroke-width': 1.3 }, g);
  }
  function dots(g, t, x, y, o) {
    o = o || {};
    const step = o.step || 9.5, r = o.r || 3.1;
    let i = 0;
    const put = (l, req) => { mark(g, l.first ? 'first' : req ? 'req' : 'ele', x + i * step, y, r); i++; };
    t.req.forEach((l) => put(l, true));
    if (o.gap !== false && t.ele.length) i += 0.5;
    t.ele.forEach((l) => put(l, false));
    return i * step;
  }
  function work(g, cx, cy, color, seed) {
    const c = color || PEN.line, x = cx - 5.5, y = cy - 7;
    g.appendChild(rc.path(`M${x} ${y} H${x + 7.5} L${x + 11} ${y + 3.5} V${y + 14} H${x} Z`, { fill: PEN.paper, fillStyle: 'solid', stroke: c, strokeWidth: 1.3, roughness: 0.7, seed: seed || 990 }));
    g.appendChild(rc.path(`M${x + 7.5} ${y} V${y + 3.5} H${x + 11}`, { stroke: c, strokeWidth: 1.1, roughness: 0.5, seed: (seed || 990) + 1 }));
    g.appendChild(rc.line(x + 2.5, y + 7.5, x + 8.5, y + 7.5, { stroke: c, strokeWidth: 1, roughness: 0.4, seed: (seed || 990) + 2 }));
    g.appendChild(rc.line(x + 2.5, y + 10.5, x + 7, y + 10.5, { stroke: c, strokeWidth: 1, roughness: 0.4, seed: (seed || 990) + 3 }));
  }
  function legend(g, x, y, o) {
    o = o || {};
    // every first-release lesson is a required one, so say so (the diamond replaces a filled dot)
    const allReq = D.first.every((l) => byT[l.topic].req.some((q) => q.id === l.id));
    let items = [['req', '必修'], ['ele', '選修'], ['first', allReq ? '首版開放（必修）' : '首版開放']].concat(o.role ? [['role', '成為角色']] : [], o.work ? [['work', '實作成果']] : []);
    if (o.only) items = items.filter(([k]) => o.only.includes(k));   // list only the marks this version actually draws
    let cx = x;
    const parts = [];
    items.forEach(([k, label]) => {
      const w = (k === 'role' || k === 'work' ? 20 : 12) + textW(label, 15) + 18;
      parts.push([k, label, w]);
    });
    const total = parts.reduce((a, p) => a + p[2], 0);
    if (o.anchor === 'end') cx = x - total;
    parts.forEach(([k, label, w]) => {
      if (k === 'work') work(g, cx + 5, y - 5, PEN.muted, 985);
      else if (k === 'role') { if (o.role === 'flag') { line(g, cx + 1, y - 13, cx + 1, y + 2, PEN.muted, 980, { strokeWidth: 1.4, roughness: 0.4 }); g.appendChild(rc.polygon([[cx + 1, y - 13], [cx + 11, y - 9.5], [cx + 1, y - 6]], { fill: PEN.muted, fillStyle: 'solid', stroke: PEN.muted, strokeWidth: 1, roughness: 0.4, seed: 981 })); } else { g.appendChild(rc.circle(cx + 4, y - 5, 18, mk(PEN.muted, 982, { strokeWidth: 1.5, roughness: 0.8 }))); const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? 2.8 : 6; pts.push([cx + 4 + R * Math.cos(a), y - 5 + R * Math.sin(a)]); } g.appendChild(rc.polygon(pts, { fill: PEN.muted, fillStyle: 'solid', stroke: PEN.muted, strokeWidth: 1, roughness: 0.4, seed: 983 })); } }
      else mark(g, k, cx + 4, y - 5, 3.2);
      txt(label, { class: 't-legend', x: cx + (k === 'role' || k === 'work' ? 21 : 13), y }, g);
      cx += w;
    });
    return total;
  }

  // ---------- standard pieces ----------
  // the title line: "AI 學習地圖" + one meta line next to it
  function header(g, x, y, o) {
    o = o || {};
    txt(D.title, { class: 't-title', x, y }, g);
    if (o.quiet) return;
    const c = D.counts;
    txt(o.meta || `${c.stages} 個階段 · ${c.topics} 個主題 · 必修 ${c.required} 課、選修 ${c.electives} 課 · ${c.outcomes} 個實作成果`,
      { class: 't-meta', x: x + textW(D.title, 28) + 18, y }, g);
  }
  // a topic card: number, name, lesson dots. Returns { g, box }. o: { h, dots:false, numD }
  function topicCard(parent, t, x, y, w, o) {
    o = o || {};
    const h = o.h || (o.dots === false ? 38 : 44);
    const g = el('g', { class: 'hot dimmable topic', 'data-t': t.id, tabindex: 0, role: 'button', 'aria-label': `主題 ${t.no}：${t.name}` }, parent);
    const box = sketchBox(g, x, y, w, h, t.stage, 200 + t.no * 7, { gap: o.gap });
    num(g, t.no, x + 22, y + h / 2, t.stage, { d: o.numD || 26, hi: false });
    const nx = x + 44;
    if (o.dots === false) txt(t.name, { class: 't-module', x: nx, y: y + h / 2 + 6 }, g);
    else { txt(t.name, { class: 't-module', x: nx, y: y + 20 }, g); dots(g, t, nx + 3, y + 33); }
    g.box = box;
    return { g, box };
  }
  // a role badge: "成為" kicker + role name. data-r for hover / click.
  function roleBadge(parent, r, x, y, w, o) {
    o = o || {};
    const h = o.h || 56, s = r.stage;
    const g = el('g', { class: 'hot dimmable role', 'data-r': r.id, tabindex: 0, role: 'button', 'aria-label': `角色：${r.name}` }, parent);
    const box = sketchBox(g, x, y, w, h, s, 900 + ROLES.indexOf(r) * 11, { stroke: col(s).pen, sw: 2.2 });
    medal(g, x + 24, y + h / 2, s, 950 + ROLES.indexOf(r));
    txt(o.kicker || '學完成為', { class: 't-tag', x: x + 46, y: y + h / 2 - 5 }, g);
    txt(r.name, { class: 't-role', x: x + 46, y: y + h / 2 + 17, style: `fill:${col(s).dark}` }, g);
    g.box = box;
    return { g, box };
  }
  // a little medal: a ring with a star, the role's mark
  function medal(g, cx, cy, s, seed) {
    g.appendChild(rc.circle(cx, cy, 24, mk(col(s).pen, seed, { strokeWidth: 1.8, roughness: 1 })));
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? 4 : 8.5; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    g.appendChild(rc.polygon(pts, { fill: col(s).fill, fillStyle: 'solid', stroke: col(s).pen, strokeWidth: 1.2, roughness: 0.6, seed: seed + 3 }));
  }
  // a stage heading: "第一階段" + tagline. data-s for hover / click. Returns the group.
  function stageHead(parent, s, x, y, o) {
    o = o || {};
    const st = byS[s];
    const g = el('g', { class: 'hot dimmable stage', 'data-s': s, tabindex: 0, role: 'button', 'aria-label': `${st.name}：${st.tagline}` }, parent);
    const w = o.w || 300, h = o.h || 54;
    el('rect', { x: x - 8, y: y - 26, width: w, height: h, fill: '#fff', 'fill-opacity': 0 }, g);
    const hi = rc.path(rr(x - 8, y - 26, w, h, 8), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    g.box = { x: x - 8, y: y - 26, w, h };
    txt(st.name, { class: 't-stage', x, y, style: `fill:${col(s).dark}` }, g);
    if (o.quiet) { /* name only; the tagline is in the hover card */ }
    else if (o.inline) txt(st.tagline, { class: 't-meta', x: x + textW(st.name, 21) + 12, y }, g);
    else txt(st.tagline, { class: 't-meta', x, y: y + 22 }, g);
    return g;
  }

  // ---------- interaction: hover card, linked highlight, side panel ----------
  const card = document.getElementById('card') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'card' }));
  card.className = 'card'; card.hidden = false; card.setAttribute('aria-hidden', 'true');
  let panel = document.getElementById('panel');
  if (!panel) {
    panel = document.body.appendChild(document.createElement('aside'));
    panel.id = 'panel';
  }
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = '<button class="x" aria-label="關閉">×</button><div class="body"></div>';
  const pbody = panel.querySelector('.body');

  const frHtml = (t) => { const f = t.req.concat(t.ele).filter((l) => l.first); return f.length ? `<div class="lab">首版開放</div>${f.map((l) => `<div class="fr">${esc(l.title)}</div>`).join('')}` : ''; };
  const stageTopics = (s) => topicsOf(+s);
  const span = (ts) => `${ts[0].no}–${ts[ts.length - 1].no}`;
  // a topic with sub-topics (v8.5: 網站設計 has 6): listed on the hover card; the panel groups its lessons under them
  const groupsHtml = (t) => (t.groups ? `<div class="lab">${t.groups.length} 個小主題</div><ol class="oc">${t.groups.map((g, i) => `<li><b>${i + 1}</b>${esc(g)}</li>`).join('')}</ol>` : '');
  function cardHtml(kind, id) {
    if (kind === 'o') {
      const ts = stageTopics(id), st = byS[id];
      return `<div class="kick">${st.name} · ${ts.length} 個實作成果</div><div class="nm">做出實作成果，才算完成主題</div>
        <ol class="oc">${ts.map((t) => `<li><b>${t.no}</b> ${esc(t.outcome)}</li>`).join('')}</ol><div class="more">點一下看這個階段</div>`;
    }
    if (kind === 'g') {
      const ts = stageTopics(id), nx = byS[+id + 1];
      return `<div class="kick">通過驗收 · ${byS[id].name} → ${nx ? nx.name : '完成'}</div><div class="nm">完成主題 ${span(ts)} 的實作成果</div>
        <div class="txt">每個主題都有一個實作成果，做出來才算完成這個主題。</div><div class="more">點一下看這個階段的主題與實作成果</div>`;
    }
    if (kind === 'f') {
      return `<div class="kick">首版開放 · ${D.first.length} 課</div><div class="nm">首版開放課程</div>
        ${D.first.map((l) => `<div class="fr">${esc(l.title)}</div>`).join('')}<div class="more">點一下看清單</div>`;
    }
    if (kind === 't') {
      const t = byT[id], st = byS[t.stage];
      return `<div class="kick">${st.name} · 主題 ${t.no} / ${TOPICS.length}</div><div class="nm">${esc(t.name)}</div>
        <div class="lab">實作成果</div><div class="txt">${esc(t.outcome)}</div>
        ${groupsHtml(t)}<div class="cnt">必修 ${t.req.length} 課 · 選修 ${t.ele.length} 課</div>${frHtml(t)}<div class="more">點一下看全部課程</div>`;
    }
    if (kind === 'r') {
      const r = byR[id];
      return `<div class="kick">${roleKick(r)} · 學完主題 ${r.from}–${r.to}</div><div class="nm">${esc(r.name)}</div>
        <div class="txt">${esc(r.line)}</div><div class="lab">學完你能</div><ul>${r.can.slice(0, 3).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        ${r.hours ? `<div class="cnt">${r.topics.length} 個主題 · 必修 ${r.req} 課 · 選修 ${r.ele} 課<br>估計 ${r.hours} 小時（只算必修）</div>` : ''}<div class="more">點一下看全部 ${r.can.length} 項</div>`;
    }
    const st = byS[id], ts = topicsOf(+id), many = st.roles.length > 1;
    const canHtml = st.roles.map((rid) => { const r = byR[rid]; return `${many ? `<div class="sub">${esc(r.name)}</div>` : ''}<ul>${r.can.slice(0, many ? 2 : 3).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`; }).join('');
    return `<div class="kick">${st.name} · 主題 ${ts[0].no}–${ts[ts.length - 1].no}</div><div class="nm">${esc(st.tagline)}</div>
      <div class="txt">學完成為 ${st.roles.map((r) => esc(byR[r].name)).join('、')}</div>
      <div class="lab">學完你能</div>${canHtml}
      <div class="cnt">${ts.length} 個主題 · 必修 ${ts.reduce((a, t) => a + t.req.length, 0)} 課 · 選修 ${ts.reduce((a, t) => a + t.ele.length, 0)} 課${st.hours ? `<br>估計 ${st.hours} 小時（只算必修）` : ''}</div><div class="more">點一下看全部</div>`;
  }
  // which topics light up for a hovered thing
  function related(kind, id) {
    if (kind === 'o' || kind === 'g') return { t: byS[id].topics, r: byS[id].roles, s: [+id], o: [id], g: [id] };
    if (kind === 'f') { const ts = [...new Set(D.first.map((l) => l.topic))]; return { t: ts, r: [], s: [], f: [id] }; }
    if (kind === 't') return { t: [id], r: [byT[id].role], s: [byT[id].stage] };
    if (kind === 'r') return { t: byR[id].topics, r: [id], s: [byR[id].stage] };
    return { t: byS[id].topics, r: byS[id].roles, s: [+id], o: [id], g: [id] };
  }
  function light(set) {
    svg.classList.toggle('focus', !!set);
    svg.querySelectorAll('[data-t],[data-r],[data-s],[data-o],[data-g],[data-f]').forEach((n) => {
      const on = !!set && KINDS.some((k) => n.dataset[k] != null && (set[k] || []).map(String).includes(String(n.dataset[k])));
      n.classList.toggle('on', on || n === hoverN);
    });
  }
  const KINDS = ['t', 'r', 's', 'o', 'g', 'f'];
  function kindOf(n) { const k = KINDS.find((k) => n.dataset[k] != null); return [k, n.dataset[k]]; }
  // try right, left, below, above the hovered thing; keep inside the window and off whatever lights up with it
  function placeCard(n) {
    const r = (n.box ? boxRect(n.box) : n.getBoundingClientRect()), cw = card.offsetWidth || 300, ch = card.offsetHeight || 200;
    const B = 44, others = [...svg.querySelectorAll('.on')].filter((o) => o !== n && !n.contains(o)).map((o) => (o.box ? boxRect(o.box) : o.getBoundingClientRect()));
    const clampY = (y) => Math.max(12, Math.min(innerHeight - ch - B, y)), clampX = (x) => Math.max(12, Math.min(innerWidth - cw - 12, x));
    const tries = [[r.right + 14, clampY(r.top - 6)], [r.left - cw - 14, clampY(r.top - 6)], [clampX(r.left + (r.right - r.left) / 2 - cw / 2), r.bottom + 12], [clampX(r.left + (r.right - r.left) / 2 - cw / 2), r.top - ch - 12]];
    const cost = ([x, y]) => {
      if (x < 8 || x + cw > innerWidth - 8 || y < 8 || y + ch > innerHeight - B + 4) return 1e9;
      const hit = (q) => Math.max(0, Math.min(x + cw, q.right) - Math.max(x, q.left)) * Math.max(0, Math.min(y + ch, q.bottom) - Math.max(y, q.top));
      return hit(r) * 10 + others.reduce((a, q) => a + hit(q), 0);
    };
    let best = tries[0], bc = cost(best);
    tries.slice(1).forEach((t) => { const c = cost(t); if (c < bc) { best = t; bc = c; } });
    if (bc >= 1e9) best = [clampX(r.right + 14), clampY(r.top - 6)];
    card.style.left = Math.round(best[0]) + 'px'; card.style.top = Math.round(best[1]) + 'px';
  }
  function boxRect(b) { const [l, t] = SPEC.toScreen(b.x, b.y), [r, bt] = SPEC.toScreen(b.x + b.w, b.y + b.h); return { left: l, top: t, right: r, bottom: bt }; }
  let hoverN = null, leaveT = 0;
  function enter(n) {
    clearTimeout(leaveT); hoverN = n;
    const [k, id] = kindOf(n);
    // the panel already shows this one: just light it, no card on top of the map
    if (panelKey === k + ':' + id || (panelKey === 's:' + id && (k === 'o' || k === 'g'))) { light(related(k, id)); card.classList.remove('show'); return; }
    card.innerHTML = cardHtml(k, id);
    light(related(k, id));
    placeCard(n); card.classList.add('show');
  }
  function leave() { leaveT = setTimeout(() => { hoverN = null; card.classList.remove('show'); light(panelSet); }, 90); }

  // ---------- side panel ----------
  let panelSet = null;
  let opener = null, panelKey = null, panelSide = 'auto';
  function openPanel(kind, id, from, viaKey) {
    if (kind === 'o' || kind === 'g') kind = 's';
    panelKey = kind + ':' + id;
    if (from) opener = from;
    let h = '';
    if (kind === 't') {
      const t = byT[id], st = byS[t.stage], r = byR[t.role], i = TOPICS.indexOf(t);
      const li = (l) => `<li><span class="id">${l.id}</span><span>${esc(l.title)}${l.ele ? '<span class="e">選修</span>' : ''}</span>${l.first ? '<span class="f">首版開放</span>' : ''}</li>`;
      h = `<div class="kick">${st.name} · 主題 ${t.no} / ${TOPICS.length} · ${esc(r.name)}</div><h2>${esc(t.name)}</h2>
        <div class="box"><b>實作成果</b>　${esc(t.outcome)}</div>
        ${t.groups ? `<div class="cnt">必修 ${t.req.length} 課 · 選修 ${t.ele.length} 課 · ${t.groups.length} 個小主題</div>` + t.groups.map((g, k) => {
          const ls = t.req.filter((l) => l.group === g).concat(t.ele.filter((l) => l.group === g).map((l) => Object.assign({ ele: true }, l)));
          return `<h3>小主題 ${k + 1}　${esc(g)}</h3><ol>${ls.map(li).join('')}</ol>`;
        }).join('') : `<h3>必修 ${t.req.length} 課</h3><ol>${t.req.map(li).join('')}</ol>
        <h3>選修 ${t.ele.length} 課</h3><ul>${t.ele.map(li).join('')}</ul>`}
        <div class="nav"><button data-go="${i - 1}" ${i ? '' : 'disabled'}>← 上一個主題</button><button data-go="${i + 1}" ${i < TOPICS.length - 1 ? '' : 'disabled'}>下一個主題 →</button></div>`;
    } else if (kind === 'r') {
      const r = byR[id], st = byS[r.stage];
      h = `<div class="kick">${st.name} · ${roleKick(r)}</div><h2>${esc(r.name)}</h2><div class="box">${esc(r.line)}</div>
        ${r.hours ? `<div class="cnt">${r.topics.length} 個主題 · 必修 ${r.req} 課 · 選修 ${r.ele} 課 · 估計 ${r.hours} 小時（${esc(D.hours_note)}）</div>` : ''}
        <h3>學完你能</h3><ul>${r.can.map((c) => `<li class="can"><span>${esc(c)}</span></li>`).join('')}</ul>
        <h3>要學的主題</h3><ol>${r.topics.map((tid) => `<li><span class="id">${byT[tid].no}</span><button class="lnk" data-open="${tid}">${esc(byT[tid].name)}</button></li>`).join('')}</ol>`;
    } else if (kind === 'f') {
      h = `<div class="kick">首版開放 · ${D.first.length} 課</div><h2>首版開放課程</h2>
        <ol>${D.first.map((l) => `<li><span class="id">${l.id}</span><button class="lnk" data-open="${l.topic}">${esc(l.title)}</button></li>`).join('')}</ol>`;
    } else {
      const st = byS[id];
      h = `<div class="kick">${st.name}</div><h2>${esc(st.tagline)}</h2>
        <h3>學完成為</h3><ul>${st.roles.map((rid) => `<li><button class="lnk" data-role="${rid}">${esc(byR[rid].name)}</button></li>`).join('')}</ul>
        ${st.roles.map((rid) => { const r = byR[rid]; return `<h3>學完你能${st.roles.length > 1 ? `（${esc(r.name)}）` : ''}</h3><ul>${r.can.map((c) => `<li class="can"><span>${esc(c)}</span></li>`).join('')}</ul>`; }).join('')}
        ${st.hours ? `<div class="cnt">估計 ${st.hours} 小時（${esc(D.hours_note)}）</div>` : ''}
        <h3>主題與實作成果</h3><ol>${st.topics.map((tid) => `<li><span class="id">${byT[tid].no}</span><span><button class="lnk" data-open="${tid}">${esc(byT[tid].name)}</button><span class="oc">${esc(byT[tid].outcome)}</span></span></li>`).join('')}</ol>`;
    }
    pbody.innerHTML = h; panel.scrollTop = 0;
    // open on the side away from the thing clicked, so it stays visible
    // decide again on every open, also when stepping to the next topic inside the panel
    const ref = from || svg.querySelector(`[data-${kind}="${id}"]`) || opener;
    if (panelSide !== 'auto') panel.classList.toggle('left', panelSide === 'left');
    else if (panel.classList.contains('open') && !from) {
      // stepping inside the panel: stay on the same side, unless the new topic would be hidden under the panel
      if (ref) {
        const q = ref.box ? boxRect(ref.box) : ref.getBoundingClientRect(), pw = panel.offsetWidth + 20;
        const covered = panel.classList.contains('left') ? q.right < pw + 10 || q.left < pw : q.left > innerWidth - pw - 10 || q.right > innerWidth - pw;
        if (covered) panel.classList.toggle('left', !panel.classList.contains('left'));
      }
    }
    else if (ref) { const rr2 = ref.box ? boxRect(ref.box) : ref.getBoundingClientRect(); panel.classList.toggle('left', (rr2.left + rr2.right) / 2 > innerWidth / 2); }
    panel.inert = false; panel.removeAttribute('aria-hidden');
    panel.classList.add('open'); document.body.classList.add('panel-open');
    if (viaKey) setTimeout(() => panel.querySelector('.x').focus(), 30);
    panelSet = related(kind, id); light(panelSet);
    card.classList.remove('show');
  }
  function closePanel() {
    if (!panel.classList.contains('open')) return;
    const back = panel.contains(document.activeElement) ? opener : null;
    panel.classList.remove('open'); document.body.classList.remove('panel-open'); panelSet = null; panelKey = null; light(null);
    panel.inert = true; panel.setAttribute('aria-hidden', 'true');
    if (back && back.focus) back.focus({ preventScroll: true });
  }
  panel.inert = true; panel.setAttribute('aria-hidden', 'true');
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) closePanel();
    else if (b.dataset.go != null) openPanel('t', TOPICS[+b.dataset.go].id);
    else if (b.dataset.open) openPanel('t', b.dataset.open);
    else if (b.dataset.role) openPanel('r', b.dataset.role);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
  svg.addEventListener('click', (e) => { if (!e.target.closest('.hot')) closePanel(); });

  function bind() {
    svg.querySelectorAll('.hot').forEach((n) => {
      n.addEventListener('mouseenter', () => enter(n));
      n.addEventListener('mouseleave', leave);
      n.addEventListener('focus', () => enter(n));
      n.addEventListener('blur', leave);
      const go = (viaKey) => { const [k, id] = kindOf(n); openPanel(k, id, n, viaKey); };
      n.addEventListener('click', () => go(false));
      n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(true); } });
    });
    // e. one keyboard stop per thing: a topic or role drawn twice (table + timeline) is reached once by Tab
    const seen = new Set();
    svg.querySelectorAll('.hot').forEach((n) => {
      const [k, id] = kindOf(n), key = k + ':' + id;
      if (seen.has(key)) n.setAttribute('tabindex', '-1'); else { seen.add(key); n.setAttribute('tabindex', '0'); }
      if (!n.getAttribute('role')) n.setAttribute('role', 'button');
    });
    SPEC.onFit(() => { if (hoverN && card.classList.contains('show')) placeCard(hoverN); });
  }

  // ---------- opening animation: drawn in learning order ----------
  // rare (once per visit, replayable) → explanation. Pencil: each line is drawn like a hand sketching it, then its words fade in.
  const EASE_IO = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const STILL = /[?&]still/.test(location.search), REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = parseFloat((location.search.match(/[?&]speed=([\d.]+)/) || [])[1]) || 1;
  const paths = (e) => (e.tagName === 'path' ? [e] : [...e.querySelectorAll('path')]).filter((p) => !p.closest('.hi') && !p.classList.contains('hi'));
  function drawIn(p, delay, dur) {
    // fills, and dashed lines (drawing them would overwrite their dash pattern), fade in instead of being drawn
    const thin = parseFloat(p.getAttribute('stroke-width') || 1) < 1.1 && p.getAttribute('fill') === 'none';
    if (p.getAttribute('stroke') === 'none' || p.getAttribute('stroke') == null || p.getAttribute('stroke-dasharray') || thin) {
      p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur * 0.6, delay: delay + dur * 0.4, easing: 'ease', fill: 'backwards' });
      return;
    }
    p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1 1';
    p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: EASE_IO, fill: 'backwards' });
  }
  function fadeIn(n, delay, dur) { n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay, easing: 'ease', fill: 'backwards' }); }
  // T.draw(e, dur, adv): draw e's lines; T.pop(e, adv): sketch e quickly then fade its words; T.at(ms): jump the clock; T.wait(ms)
  function timeline() {
    const items = []; let t = 0;
    const api = {
      draw(e, dur, adv) { dur = (dur || 500) * SPEED; if (e) items.push({ e, k: 'draw', t, dur }); t += adv == null ? dur * 0.7 : adv * SPEED; return api; },
      pop(e, adv) { if (e) items.push({ e, k: 'pop', t }); t += (adv == null ? 160 : adv) * SPEED; return api; },
      fade(e, adv) { if (e) items.push({ e, k: 'fade', t }); t += (adv == null ? 120 : adv) * SPEED; return api; },
      wait(ms) { t += ms * SPEED; return api; },
      get length() { return t; },
      run() {
        if (STILL) return;
        items.forEach(({ e }) => [e, ...e.querySelectorAll('*')].forEach((n) => n.getAnimations().forEach((a) => a.cancel())));
        if (REDUCED) { items.forEach(({ e }) => fadeIn(e, 0, 200)); return; }
        svg.classList.add('playing'); clearTimeout(api._pt);
        const done = () => { clearTimeout(api._pt); svg.classList.remove('playing'); removeEventListener('pointerdown', skip, true); removeEventListener('keydown', skip, true); };
        const skip = (e) => { if (e.target && e.target.closest && e.target.closest('.replay-svg, .replay, .rvk')) return; svg.querySelectorAll('*').forEach((n) => n.getAnimations().forEach((a) => a.finish())); done(); };
        api._pt = setTimeout(done, t + 400);
        addEventListener('pointerdown', skip, true); addEventListener('keydown', skip, true);
        items.forEach(({ e, k, t: at, dur }) => {
          if (k === 'draw') { paths(e).forEach((p) => drawIn(p, at, dur)); [...e.querySelectorAll('text, circle, rect')].forEach((n) => fadeIn(n, at + dur * 0.5, 300 * SPEED)); return; }
          if (k === 'fade') { fadeIn(e, at, 320 * SPEED); return; }
          const d = 520 * SPEED;
          paths(e).forEach((p) => drawIn(p, at, d));
          [...e.querySelectorAll('text, circle')].forEach((n) => fadeIn(n, at + d * 0.5, 280 * SPEED));
        });
      },
    };
    return api;
  }
  // the replay control: a handwritten "↻ 重播" inside the map at (x, y), or a page button when no place is given
  function replay(T, at) {
    const go = () => { closePanel(); T.run(); };
    if (at) {
      const g = el('g', { class: 'replay-svg', role: 'button', tabindex: 0, 'aria-label': '依學習順序重新播放' }, L.front);
      hand(g, '↻ 重播', at[0], at[1], { anchor: at[2] || 'start' });
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      T.fade(g, 0);
      return;
    }
    const b = document.body.appendChild(document.createElement('button'));
    b.className = 'replay'; b.textContent = '↻ 重播';
    b.addEventListener('click', go);
  }
  // call last: bind interaction, fit, start the animation, add the replay control. o.replay = [x, y, anchor] puts it in the map.
  function finish(T, o) {
    o = o || {}; window.__r8T = T; if (o.panel) panelSide = o.panel; bind(); SPEC.fit();
    if (!T) return;
    replay(T, o.replay);
    if (STILL) return;
    svg.style.visibility = 'hidden';
    let started = false;
    const go = () => { if (started) return; started = true; svg.style.visibility = ''; T.run(); };
    document.fonts.ready.then(go); setTimeout(go, 800);
  }

  return { D, TOPICS, STAGES, ROLES, byT, byR, byS, topicsOf, rolesOf, roleOf, PEN, ST, CFG, col, el, txt, esc, ems, textW, wrap,
    svg, W, H, rc, L, rr, mk, hatch, solid, sketchBox, stageBox, line, head, arrow, hand, num, dots, mark, work, legend, medal,
    header, topicCard, roleBadge, stageHead, light, openPanel, closePanel, timeline, finish, SPEED };
})();

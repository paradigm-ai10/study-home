/* r15-side 第十五輪：r14-side（拉高＋時間軸在側邊）照 design-taste-frontend 審查修正。審查報告：審查_r14-side_taste_20261113.md。
   Thomas：「照他說的改，然後明寫估計，試試看鼠尾草綠好了。」
   1  一般筆電放得下：畫布 1420×790（1280×716 的視窗縮到 0.9 剛好放下），最小字 17px（螢幕上 15.3px）。字級在 r15.css。
   2  階段名前面的數字圓拿掉（同一區不再有三個「1」）。
   3  滑過卡片、面板的角色編號跟地圖一樣寫 1／2-1／2-2／3（R8.CFG.roleCode）。
   4  階段名不壓主幹：第一、三階段在中心左邊、國界的上下兩側；第二階段接在分岔口右邊，虛線從它後面才開始。
   5  時數明寫「估計」。
   6  第三階段改鼠尾草綠（不用紫色）。
   7  左側主題的編號放在靠枝幹那端，1–7、14–17 各成一直排。
   8  右欄：字 17px、內容靠上、框加寬到放得下最長的角色名；角色編號做成框上緣的標籤。
   10 拿掉「滑過看學完能做什麼」那行說明，每個角色框裡放「學完你能 ›」。
   11 「從這裡開始 →」指著主題 1，可以點（開主題 1）。
   12 圓角只留兩種：膠囊（節點、編號）和 8（框、卡片、面板）。
   13 手寫字只載入用到的字（HTML 的字型連結）。
   14 第二階段的分隔線往下移（2-1 有 4 個主題、2-2 只有 2 個），圖例移到地圖右下的空位。
   15 左右邊距一樣（16）。 */
TREE.ready(() => {
  const { el, txt, rc, mk, solid, PEN, L, rr, ROLES, TOPICS, STAGES, byS, byR, rolesOf, col, D } = R8;
  // 6: sage green for stage 3, set before anything is drawn
  Object.assign(R8.ST[3], { fill: '#8FB088', pen: '#6B9465', dark: '#3A6038', soft: 'rgba(143,176,136,.07)' });
  const code = (r) => { const rs = rolesOf(r.stage); return rs.length > 1 ? `${r.stage}-${rs.indexOf(r) + 1}` : String(r.stage); };
  const split = (r) => rolesOf(r.stage).length > 1;
  const hexA = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  const tw = TREE.tw;
  R8.CFG.roleCode = code;   // 3

  // ---------- frame: equal 16px margins; the side column is as wide as the longest role name needs ----------
  const M = 16, W = 1420, H = 790, SPINE = W - M - 13, BAND_R = SPINE - 13 - 4;
  const BW = Math.max(176, Math.ceil(Math.max(...ROLES.map((r) => tw(r.name, 't-band', 17)))) + 24), BX0 = BAND_R - BW;
  const LEFT = M, TOP = M, RIGHT = BX0 - 14, BOT = H - M;
  const cx = 566, cy = 395, F = [cx + 162, cy + 34], BX = cx + 50, BY = cy + 32;
  const STEM = 44;

  // 7: a topic. The number sits at the branch end on both sides, so the numbers read down one column.
  function leaf(r, t, k, stems) {
    const c = TREE.roleCol(r), p = TREE.POS[r.id], b = TREE.nodeBox(r), y = p.y0 + k * p.gap, left = p.side === 'L', dir = left ? -1 : 1;
    const jx = left ? b.x - STEM : b.x + b.w + STEM, sx = left ? b.x : b.x + b.w, sy = b.y + b.h / 2;
    const sg = el('g', { class: 'dimmable', 'data-t': t.id }, stems);
    sg.appendChild(rc.path(`M${sx} ${sy} C${sx + dir * 28} ${sy} ${jx - dir * 24} ${y} ${jx} ${y}`, mk(c.pen, 500 + t.no, { strokeWidth: 2, roughness: 0.7 })));
    const nw = tw(t.name, 't-module', 18), dw = t.first ? 10 + t.first * 9 : 0, w = 34 + nw + dw + 6, x0 = left ? jx - w : jx;
    const g = el('g', { class: 'hot dimmable leaf', 'data-t': t.id, 'aria-label': `主題 ${t.no}：${t.name}` }, L.mid);
    el('rect', { x: x0 - 4, y: y - 31, width: w + 8, height: 35, fill: '#fff', 'fill-opacity': 0 }, g);
    const hi = rc.path(rr(x0 - 4, y - 31, w + 8, 33, 8), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    R8.line(g, x0, y, x0 + w, y, c.pen, 540 + t.no, { strokeWidth: 1.8, roughness: 0.6 });
    R8.num(g, t.no, left ? jx - 15 : jx + 15, y - 15, r.stage, { d: 26, hi: false, stroke: c.pen, color: c.dark });
    const nx = left ? jx - 34 - dw : jx + 34;   // left side: the name ends here; right side: it starts here
    txt(t.name, { class: 't-module', x: nx, y: y - 8, 'text-anchor': left ? 'end' : 'start' }, g);
    for (let i = 0; i < t.first; i++) R8.mark(g, 'first', (left ? nx : nx + nw) + 12 + i * 9, y - 14, 3);
    g.box = { x: x0 - 4, y: y - 31, w: w + 8, h: 33 };
    return { t, stem: sg, g, y, x0, w };
  }

  const out = TREE.build({
    legend: [RIGHT - 14, BOT - 12, 'end'], label: code, darkBadge: true, center: { x: cx, y: cy }, leaf,
    pos: {
      'power-user': { x: 494, y: 184, side: 'L', y0: 66, gap: 42 },
      'builder': { x: F[0] + 18, y: 200, side: 'R', y0: 114, gap: 58 },
      'orchestrator': { x: F[0] + 30, y: 616, side: 'R', y0: 588, gap: 66 },
      'product-engineer': { x: 468, y: 640, side: 'L', y0: 558, gap: 54 },
    },
    from: (r) => (split(r) ? F : [cx, cy]),
    taper: (r) => (split(r) ? [17, 8] : [24, 8]),
    bend: { 'builder': 0.1, 'orchestrator': -0.1 },
  });
  const T = R8.timeline();

  // the stage-2 trunk: centre → fork
  const trunk = el('g', { class: 'dimmable', 'data-s': 2 }, L.back);
  L.back.insertBefore(trunk, L.back.firstChild);
  TREE.taper(trunk, [cx, cy], F, 0.02, 26, 18, { fill: col(2).fill, pen: col(2).pen }, 1201);
  trunk.appendChild(rc.circle(F[0], F[1], 20, { fill: col(2).fill, fillStyle: 'solid', stroke: col(2).pen, strokeWidth: 1.3, roughness: 0.8, seed: 1202 }));

  // ---------- the ground: one patch per role; it lights with its role ----------
  const AREA = {
    'power-user': [[LEFT, TOP], [BX, TOP], [BX, cy - 50], [cx, cy - 58], [cx - 60, cy - 54], [cx - 112, cy - 28], [cx - 124, cy + 4], [cx - 110, BY], [LEFT, BY]],
    'product-engineer': [[LEFT, BY], [cx - 110, BY], [cx - 80, cy + 50], [cx, cy + 60], [BX, cy + 56], [BX, BOT], [LEFT, BOT]],
    'builder': [[BX, TOP], [RIGHT, TOP], [RIGHT, F[1]], [F[0], F[1]], [cx + 120, cy], [cx + 100, cy - 28], [BX, cy - 50]],
    'orchestrator': [[BX, cy + 56], [cx + 100, cy + 32], [cx + 120, cy], [F[0], F[1]], [RIGHT, F[1]], [RIGHT, BOT], [BX, BOT]],
  };
  const ground = el('g', {}, L.back);
  L.back.insertBefore(ground, L.back.firstChild);
  const patches = {};
  ROLES.forEach((r, i) => {
    const c = col(r.stage), deeper = split(r) && rolesOf(r.stage).indexOf(r) > 0;
    const g = el('g', { class: 'dimmable region', 'data-r': r.id }, ground);
    g.appendChild(rc.polygon(AREA[r.id], { fill: hexA(deeper ? c.dark : c.fill, deeper ? 0.1 : 0.13), fillStyle: 'solid', stroke: 'none', roughness: 1.3, seed: 1230 + i }));
    const glow = rc.polygon(AREA[r.id], { fill: hexA(c.fill, 0.3), fillStyle: 'solid', stroke: c.pen, strokeWidth: 2.4, roughness: 1.1, seed: 1240 + i });
    glow.setAttribute('class', 'glow'); g.appendChild(glow);
    patches[r.id] = g;
  });

  // ---------- 2, 4: stage names: no number, clear of the trunks ----------
  const LH = 38, lw = (st) => tw(st.name, 't-stage', 22) + 28, ex = cx - 118;   // ex: the centre's left-most point
  const at = { 1: [ex - 14 - lw(byS[1]), BY - 12 - LH], 2: [F[0] + 34, F[1] - LH / 2], 3: [ex - 14 - lw(byS[3]), BY + 12] };
  const labels = {};
  STAGES.forEach((st) => {
    const s = st.no, [x, y] = at[s], w = lw(st), c = col(s);
    const g = el('g', { class: 'hot dimmable stage', 'data-s': s, 'aria-label': `${st.name}：${st.tagline}` }, L.mid);
    g.appendChild(rc.path(rr(x, y, w, LH, 8), solid(PEN.paper, 3)));
    g.appendChild(rc.path(rr(x, y, w, LH, 8), { fill: hexA(c.fill, 0.42), fillStyle: 'hachure', hachureGap: 2.6, fillWeight: 1.6, hachureAngle: -20, stroke: 'none', roughness: 1.1, seed: 1262 + s }));
    const hi = rc.path(rr(x, y, w, LH, 8), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    g.appendChild(rc.path(rr(x, y, w, LH, 8), mk(c.pen, 1266 + s, { strokeWidth: 1.6, roughness: 0.9 })));
    txt(st.name, { class: 't-stage', x: x + w / 2, y: y + 27, 'text-anchor': 'middle', style: `fill:${c.dark};letter-spacing:.06em` }, g);
    g.box = { x, y, w, h: LH };
    labels[s] = g;
  });
  // borders: stages = dash-dot frontier; inside stage 2 = a light dashed line that starts after the stage name
  const border = el('g', {}, L.back);
  ground.after(border);
  const bl = (x0, y0, x1, y1, seed, dash, w) => border.appendChild(rc.line(x0, y0, x1, y1, mk(PEN.muted, seed, { strokeWidth: w || 1.5, roughness: 1.4, bowing: 1.5, strokeLineDash: dash })));
  bl(BX, TOP + 4, BX, cy - 54, 1251, [12, 6, 2, 6]);
  bl(BX, cy + 62, BX, BOT - 4, 1252, [12, 6, 2, 6]);
  bl(LEFT + 4, BY, cx - 114, BY, 1253, [12, 6, 2, 6]);
  bl(at[2][0] + lw(byS[2]) + 12, F[1], RIGHT - 4, F[1], 1254, [5, 7], 1.1);

  // ---------- 11: where to start: points at topic 1 and opens it ----------
  const l1 = out.roles[0].leaves[0], sLab = '從這裡開始 →', sw = tw(sLab, 't-note', 19);
  const start = el('g', { class: 'hot dimmable', 'data-t': l1.t.id, 'aria-label': `從這裡開始：主題 ${l1.t.no} ${l1.t.name}` }, L.front);
  const sx1 = l1.x0 - 16, sx0 = sx1 - sw;
  el('rect', { x: sx0 - 8, y: l1.y - 31, width: sw + 16, height: 35, fill: '#fff', 'fill-opacity': 0 }, start);
  const shi = rc.path(rr(sx0 - 8, l1.y - 31, sw + 16, 33, 8), solid(PEN.hi, 4)); shi.setAttribute('class', 'hi'); start.appendChild(shi);
  R8.hand(start, sLab, sx1, l1.y - 8, { anchor: 'end', color: '#9A3F1E' });
  start.box = { x: sx0 - 8, y: l1.y - 31, w: sw + 16, h: 33 };

  // ---------- the side column: roles and their topics, top to bottom ----------
  const SP = 30, Y0 = 88, SAME = 24, GATE = 36, MINH = 112;
  const head = el('g', {}, L.back);
  txt('學習順序', { class: 't-row', x: BX0, y: 40 }, head);
  txt(`必修 ${D.counts.required} 課・估計 ${D.hours} 小時`, { class: 't-legend', x: BX0, y: 64 }, head);   // 5: says 估計
  const sy = {}, band = {}, gateY = {};
  let y = Y0;
  ROLES.forEach((r, i) => {
    const top = y, hgt = Math.max(r.topics.length * SP, MINH), pad = (hgt - r.topics.length * SP) / 2;
    r.topics.forEach((tid, k) => { sy[tid] = top + pad + SP / 2 + k * SP; });
    y = top + hgt;
    band[r.id] = { y0: top, y1: y };
    const nx = ROLES[i + 1];
    if (nx) { if (nx.stage !== r.stage) { gateY[r.stage] = y + GATE / 2; y += GATE; } else y += SAME; }
  });
  const tl = el('g', {}, L.mid);
  const segs = {}; let py = Y0 - 4;
  TOPICS.forEach((t, i) => {
    const g = el('g', {}, tl);
    R8.line(g, SPINE, py, SPINE, sy[t.id] - 14, col(t.stage).pen, 1500 + i, { strokeWidth: 2.2, roughness: 0.6 });
    segs[t.id] = g; py = sy[t.id] + 14;
  });
  const endSeg = el('g', {}, tl), YE = sy[TOPICS[TOPICS.length - 1].id] + 14;
  R8.line(endSeg, SPINE, YE, SPINE, YE + 12, PEN.muted, 1599, { strokeWidth: 2, roughness: 0.5 });
  R8.head(endSeg, [SPINE, YE + 18], [SPINE, YE], PEN.muted, 1598, 10);
  const stops = {};
  TOPICS.forEach((t) => {
    const c = TREE.roleCol(byR[t.role]), g = el('g', { class: 'hot dimmable stop', 'data-t': t.id, 'aria-label': `第 ${t.no} 站：${t.name}` }, tl);
    el('rect', { x: SPINE - 14, y: sy[t.id] - 14, width: 28, height: 28, fill: '#fff', 'fill-opacity': 0 }, g);
    R8.num(g, t.no, SPINE, sy[t.id], t.stage, { d: 26, stroke: c.pen, color: c.dark });
    g.box = { x: SPINE - 13, y: sy[t.id] - 13, w: 26, h: 26 };
    stops[t.id] = g;
  });
  // 8, 10: role bands. The code is a tab on the top edge; name, lessons, estimated hours and the link read from the top.
  const bands = {}, arrows = [];
  ROLES.forEach((r, i) => {
    const c = TREE.roleCol(r), { y0, y1 } = band[r.id], h = y1 - y0, bf = TREE.badgeFill(r), pw = code(r).length > 1 ? 40 : 26;
    const g = el('g', { class: 'hot dimmable', 'data-r': r.id, 'aria-label': `${code(r)}：${r.name}，必修 ${r.req} 課，估計 ${r.hours} 小時。看學完你能做什麼` }, tl);
    g.appendChild(rc.path(rr(BX0, y0, BW, h, 8), solid(PEN.paper, 3)));
    const hi = rc.path(rr(BX0, y0, BW, h, 8), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    g.appendChild(rc.path(rr(BX0, y0, BW, h, 8), { fill: hexA(c.fill, 0.18), fillStyle: 'solid', stroke: c.pen, strokeWidth: 1.8, roughness: 0.7, seed: 1520 + i }));
    g.appendChild(rc.path(rr(BX0 + 12, y0 - 12, pw, 24, 12), { fill: bf, fillStyle: 'solid', stroke: bf, strokeWidth: 1.2, roughness: 0.6, seed: 1530 + i }));
    txt(code(r), { class: 't-num', x: BX0 + 12 + pw / 2, y: y0 + 6, 'text-anchor': 'middle', style: 'fill:#fff' }, g);
    txt(r.name, { class: 't-band', x: BX0 + 12, y: y0 + 37, style: `fill:${c.dark}` }, g);
    txt(`必修 ${r.req} 課`, { class: 't-legend', x: BX0 + 12, y: y0 + 59, style: 'fill:#4F4B44' }, g);
    txt(`估計 ${r.hours} 小時`, { class: 't-legend', x: BX0 + 12, y: y0 + 80, style: 'fill:#4F4B44' }, g);
    txt('學完你能 ›', { class: 't-legend t-link', x: BX0 + 12, y: y0 + 102, style: `fill:${c.dark}` }, g);
    g.box = { x: BX0, y: y0 - 12, w: BW, h: h + 12 };
    bands[r.id] = g;
    const nx = ROLES[i + 1];
    if (nx && nx.stage === r.stage) {   // same stage: a small arrow down between the two bands
      const a = el('g', {}, tl), ax = BX0 + BW / 2;
      R8.line(a, ax, y1 + 2, ax, band[nx.id].y0 - 6, PEN.muted, 1540 + i, { strokeWidth: 1.6, roughness: 0.4 });
      R8.head(a, [ax, band[nx.id].y0 - 2], [ax, y1], PEN.muted, 1545 + i, 7);
      arrows.push(a);
    }
  });
  // gates between stages: the note on the right of the gap (the next band's tab is on the left), a tick across the spine
  const gates = {};
  Object.keys(gateY).forEach((k) => {
    const s = +k, gy = gateY[s], gLab = '↓ 通過驗收', gw = tw(gLab, 't-note', 19), gx1 = BX0 + BW - 8;
    const g = el('g', { class: 'hot dimmable', 'data-g': s, 'aria-label': `通過驗收：完成${byS[s].name}，進入${byS[s + 1].name}` }, tl);
    el('rect', { x: gx1 - gw - 6, y: gy - 14, width: gw + 12, height: 28, fill: '#fff', 'fill-opacity': 0 }, g);
    const ghi = rc.path(rr(gx1 - gw - 6, gy - 14, gw + 12, 28, 8), solid(PEN.hi, 4)); ghi.setAttribute('class', 'hi'); g.appendChild(ghi);
    R8.hand(g, gLab, gx1, gy + 7, { anchor: 'end', color: PEN.muted });
    R8.line(g, SPINE - 12, gy, SPINE + 12, gy, PEN.ink, 1550 + s, { strokeWidth: 2.2, roughness: 0.4 });
    g.box = { x: gx1 - gw - 6, y: gy - 14, w: gw + 12, h: 28 };
    gates[s] = g;
  });
  R11.graphite();

  // ---------- opening: role by role: its ground, (stage name, trunk), branch, node, topics; the column keeps pace ----------
  T.pop(out.center, 200).fade(border, 0).fade(head, 0).fade(out.legend, 0).fade(start, 80);
  let last = 0;
  out.roles.forEach((xr, i) => {
    const r = xr.r;
    if (r.stage !== last) {
      if (last) T.pop(gates[last], 60);
      T.fade(labels[r.stage], 0);
      if (split(r)) T.draw(trunk, 340, 220);
      last = r.stage;
    }
    T.fade(patches[r.id], 0);
    if (i && ROLES[i - 1].stage === r.stage) T.draw(arrows[0], 100, 30);
    T.pop(bands[r.id], 0).draw(xr.branch, 400, 260).pop(xr.node, 100);
    xr.leaves.forEach((l) => { T.draw(l.stem, 160, 36).pop(l.g, 0).draw(segs[l.t.id], 100, 0).pop(stops[l.t.id], 96); });
  });
  T.draw(endSeg, 160, 40);
  R8.finish(T, { replay: [BX0, H - 12, 'start'] });   // under the bands, clear of the spine's arrow
});

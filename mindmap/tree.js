/* 第十輪共用：樹枝狀學習地圖（2026-11-13，課程 v8.5）。
   Thomas：「我還是比較想要樹枝狀的……大主題在中間，分成枝幹，第一個大枝幹就是 AI Power User」，
   參考：Julian Stodd 的手繪心智圖、MIT Open Learning 的概念圖——要有「map」的感覺。
   樹枝狀的缺點是看不出階段、每根大枝幹看起來一樣重要；各版用不同方法解決（時間軸、路線、領地），樹本身共用這裡：
   - 中心：AI 學習地圖。四根大枝幹＝四個角色，照學習順序順時針排：左上 1 → 右上 2 → 右下 3 → 左下 4。
   - 大枝幹是由粗到細的彩色鉛筆枝幹（階段色；同一階段的第二個角色用深一階）；角色節點左邊有順序編號。
   - 小枝幹＝主題：從角色節點長出來，主題名坐在枝幹上（心智圖的寫法），前面是主題編號 1–17，後面是首版開放的菱形。
   - 互動與動畫沿用 r8.js：第一眼只有名稱；滑過看卡片；點開看全部；開場照順序一根一根長出來。 */
window.TREE = (() => {
  const { el, txt, rc, mk, solid, col, PEN, L, textW, ROLES, byT, D, rolesOf, rr, svg } = R8;
  // real text widths once the web fonts are in (the estimate is off by up to 20px on Latin names); falls back to the estimate
  const tw = (s, cls, px) => { const t = txt(s, { class: cls, x: -9999, y: -9999 }, svg); const w = t.getComputedTextLength(); t.remove(); return w > 0 ? w : textW(s, px); };
  // run the layout after the fonts load (at most 1 s), so measured widths are right
  const ready = (fn) => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]).then(fn);
  const C = { x: 640, y: 322, rx: 118, ry: 52 };
  // node centre, which side its topics grow to, first topic baseline, spacing
  const POS = {
    'power-user':       { x: 520, y: 150, side: 'L', y0: 78, gap: 38 },
    'builder':          { x: 790, y: 150, side: 'R', y0: 76, gap: 58 },
    'orchestrator':     { x: 800, y: 470, side: 'R', y0: 444, gap: 58 },
    'product-engineer': { x: 500, y: 500, side: 'L', y0: 426, gap: 52 },
  };
  let NODE_H = 46, KICK = false, LABEL = null, DARKB = false;   // DARKB: badges in the stage's dark colour, so the white number reads (4.5:1)   // LABEL(r) → text in the order badge (round 12: 1, 2-1, 2-2, 3)
  const STEM = 56;
  const shade = (r) => rolesOf(r.stage).indexOf(r);
  const roleCol = (r) => { const c = col(r.stage); return shade(r) ? { fill: c.pen, pen: c.dark, dark: c.dark } : { fill: c.fill, pen: c.pen, dark: c.dark }; };
  const order = (r) => ROLES.indexOf(r) + 1;
  const badgeFill = (r) => (shade(r) ? '#1E3E66' : col(r.stage).dark);

  // a tapered coloured-pencil branch along a quadratic curve p0 → p1 (thick at the centre, thin at the node)
  function taper(g, p0, p1, bend, w0, w1, c, seed) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy);
    const cp = [(p0[0] + p1[0]) / 2 - dy / len * bend * len, (p0[1] + p1[1]) / 2 + dx / len * bend * len];
    const a = [], b = [], N = 26;
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * cp[0] + t * t * p1[0], y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * cp[1] + t * t * p1[1];
      const tx = 2 * (1 - t) * (cp[0] - p0[0]) + 2 * t * (p1[0] - cp[0]), ty = 2 * (1 - t) * (cp[1] - p0[1]) + 2 * t * (p1[1] - cp[1]), tl = Math.hypot(tx, ty);
      const w = (w0 + (w1 - w0) * t) / 2, ux = -ty / tl, uy = tx / tl;
      a.push([x + ux * w, y + uy * w]); b.unshift([x - ux * w, y - uy * w]);
    }
    g.appendChild(rc.polygon(a.concat(b), { fill: c.fill, fillStyle: 'hachure', hachureGap: 3, fillWeight: 1.2, hachureAngle: -40, stroke: c.pen, strokeWidth: 1.3, roughness: 0.6, seed }));
    return cp;
  }

  const badgeW = (r) => (LABEL && String(LABEL(r)).length > 1 ? tw(String(LABEL(r)), 't-num', 15) + 18 : 28);
  const nodeBox = (r) => { const p = POS[r.id], w = 50 + (badgeW(r) - 28) + tw(r.name, 't-role', 19) + 18; return { x: p.x - w / 2, y: p.y - NODE_H / 2, w, h: NODE_H }; };
  // the role node: a rounded pencil box, order number in the role colour, the role name
  function node(parent, r, o) {
    o = o || {};
    const c = roleCol(r), b = nodeBox(r), n = order(r), seed = 900 + n * 13, lab = LABEL ? String(LABEL(r)) : String(n), bw = badgeW(r), nx = b.x + 48 + (bw - 28);
    const g = el('g', { class: 'hot dimmable role', 'data-r': r.id, 'aria-label': `${LABEL ? lab : '第 ' + n + ' 根大枝幹'}：${r.name}` }, parent);
    g.appendChild(rc.path(rr(b.x + 5, b.y + 5, b.w, b.h, 22), { fill: c.fill, fillStyle: 'hachure', hachureGap: 3.6, fillWeight: 1, hachureAngle: -36, stroke: 'none', roughness: 1, seed }));
    g.appendChild(rc.path(rr(b.x, b.y, b.w, b.h, 22), solid(PEN.paper, 3)));
    const hi = rc.path(rr(b.x, b.y, b.w, b.h, 22), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    g.appendChild(rc.path(rr(b.x, b.y, b.w, b.h, 22), mk(c.pen, seed + 1, { strokeWidth: 2.3, roughness: 1.1 })));
    const bf = DARKB ? badgeFill(r) : c.fill;
    if (bw > 28) g.appendChild(rc.path(rr(b.x + 11, b.y + b.h / 2 - 14, bw, 28, 14), { fill: bf, fillStyle: 'solid', stroke: c.pen, strokeWidth: 1.6, roughness: 0.8, seed: seed + 2 }));
    else g.appendChild(rc.circle(b.x + 25, b.y + b.h / 2, 28, { fill: bf, fillStyle: 'solid', stroke: c.pen, strokeWidth: 1.6, roughness: 0.8, seed: seed + 2 }));
    txt(lab, { class: 't-num', x: b.x + 11 + bw / 2, y: b.y + b.h / 2 + 5.5, 'text-anchor': 'middle', style: 'fill:#fff' }, g);
    if (KICK) {   // the stage name above the role name
      txt(R8.byS[r.stage].name, { class: 't-tag', x: nx, y: b.y + 24 }, g);
      txt(r.name, { class: 't-role', x: nx, y: b.y + 48, style: `fill:${c.dark}` }, g);
    } else txt(r.name, { class: 't-role', x: nx, y: b.y + b.h / 2 + 7, style: `fill:${c.dark}` }, g);
    g.box = b;
    return g;
  }

  const leafW = (t) => 30 + tw(t.name, 't-module', 17) + (t.first ? 12 + t.first * 10 : 0) + 8;
  // a topic: the name sits on its own small branch; number in front, first-release diamonds behind
  function leaf(r, t, k, stems) {
    const c = roleCol(r), p = POS[r.id], b = nodeBox(r), y = p.y0 + k * p.gap, left = p.side === 'L';
    const jx = left ? b.x - STEM : b.x + b.w + STEM, w = leafW(t), x0 = left ? jx - w : jx;
    const sx = left ? b.x : b.x + b.w, sy = b.y + b.h / 2, dir = left ? -1 : 1;
    const sg = el('g', { class: 'dimmable', 'data-t': t.id }, stems);
    sg.appendChild(rc.path(`M${sx} ${sy} C${sx + dir * 34} ${sy} ${jx - dir * 30} ${y} ${jx} ${y}`, mk(c.pen, 500 + t.no, { strokeWidth: 2, roughness: 0.7 })));
    const g = el('g', { class: 'hot dimmable leaf', 'data-t': t.id, 'aria-label': `主題 ${t.no}：${t.name}` }, L.mid);
    el('rect', { x: x0 - 4, y: y - 28, width: w + 8, height: 32, fill: '#fff', 'fill-opacity': 0 }, g);
    const hi = rc.path(rr(x0 - 4, y - 28, w + 8, 30, 6), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    R8.line(g, x0, y, x0 + w, y, c.pen, 540 + t.no, { strokeWidth: 1.8, roughness: 0.6 });
    R8.num(g, t.no, x0 + 12, y - 13, r.stage, { d: 24, hi: false, stroke: c.pen, color: c.dark });
    txt(t.name, { class: 't-module', x: x0 + 29, y: y - 7 }, g);
    for (let i = 0; i < t.first; i++) R8.mark(g, 'first', x0 + 29 + tw(t.name, 't-module', 17) + 12 + i * 10, y - 12, 3);
    g.box = { x: x0 - 4, y: y - 28, w: w + 8, h: 30 };
    return { t, stem: sg, g, y, x0, w };
  }

  // the centre: a double pencil ellipse with the map's name
  function center() {
    const g = el('g', { class: 'center' }, L.mid);
    g.appendChild(rc.ellipse(C.x + 6, C.y + 7, C.rx * 2, C.ry * 2, { fill: '#D9CDB5', fillStyle: 'hachure', hachureGap: 3.5, fillWeight: 1, stroke: 'none', roughness: 1, seed: 21 }));
    g.appendChild(rc.ellipse(C.x, C.y, C.rx * 2, C.ry * 2, solid(PEN.paper, 3)));
    g.appendChild(rc.ellipse(C.x, C.y, C.rx * 2, C.ry * 2, mk(PEN.line, 22, { strokeWidth: 2.6, roughness: 1.1 })));
    g.appendChild(rc.ellipse(C.x, C.y, C.rx * 2 - 12, C.ry * 2 - 10, mk(PEN.line, 23, { strokeWidth: 1.1, roughness: 1.4 })));
    txt(D.title, { class: 't-title', x: C.x, y: C.y + 10, 'text-anchor': 'middle' }, g);
    return g;
  }

  // 首版開放 legend, hoverable: lists the open lessons. at = [x, y, anchor]
  function legend(at) {
    const [x, y, anchor] = at || [1240, 40, 'end'];
    const lab = `首版開放 ${D.first.length} 課`, w = tw(lab, 't-legend', 15) + 28, x0 = anchor === 'end' ? x - w : x;
    const g = el('g', { class: 'hot dimmable', 'data-f': 1, 'aria-label': lab }, L.front);
    el('rect', { x: x0, y: y - 20, width: w, height: 28, fill: '#fff', 'fill-opacity': 0 }, g);
    const hi = rc.path(rr(x0, y - 20, w, 28, 6), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
    R8.mark(g, 'first', x0 + 11, y - 5, 3.2);
    txt(lab, { class: 't-legend', x: x0 + 22, y }, g);
    g.box = { x: x0, y: y - 20, w, h: 28 };
    return g;
  }

  // build the tree. o.pos overrides node positions; o.bend per role id
  // round 11 additions (defaults keep round 10 unchanged): o.from(r, i) = where the big branch starts (default the centre),
  // o.taper = [w0, w1], o.leaf(r, t, k, stems) = draw a topic another way, o.legend === false = no legend here
  function build(o) {
    o = o || {};
    if (o.kicker) { KICK = true; NODE_H = 62; }
    if (o.label) LABEL = o.label;
    if (o.darkBadge) DARKB = true;
    if (o.center) Object.assign(C, o.center);
    if (o.pos) for (const k in o.pos) Object.assign(POS[k], o.pos[k]);
    const branches = el('g', {}, L.back), stems = el('g', {}, L.back);
    const out = { roles: [] };
    ROLES.forEach((r, i) => {
      const p = POS[r.id], bg = el('g', { class: 'dimmable', 'data-r': r.id }, branches);
      const bend = (o.bend && o.bend[r.id] != null) ? o.bend[r.id] : [-0.14, 0.14, -0.12, 0.12][i % 4];
      const tp = typeof o.taper === 'function' ? o.taper(r, i) : o.taper, tw0 = tp ? tp[0] : 24, tw1 = tp ? tp[1] : 8;
      taper(bg, o.from ? o.from(r, i) : [C.x, C.y], [p.x, p.y], bend, tw0, tw1, roleCol(r), 60 + i * 7);
      const ng = node(L.mid, r);
      const leaves = r.topics.map((tid, k) => (o.leaf || leaf)(r, byT[tid], k, stems));
      out.roles.push({ r, p, branch: bg, node: ng, leaves, box: nodeBox(r) });
    });
    out.center = center();
    if (o.legend !== false) out.legend = legend(o.legend);
    return out;
  }

  // the opening: centre, then each branch in learning order, its node, its topics one by one. hooks run around each branch.
  function play(T, out, hooks) {
    hooks = hooks || {};
    T.pop(out.center, 220).fade(out.legend, 0);
    if (hooks.start) hooks.start();
    out.roles.forEach((x, i) => {
      if (hooks.before) hooks.before(x, i);
      T.draw(x.branch, 440, 300).pop(x.node, 110);
      x.leaves.forEach((l) => { T.draw(l.stem, 200, 50).pop(l.g, 115); });
      if (hooks.after) hooks.after(x, i);
    });
  }

  return { C, POS, build, play, roleCol, order, badgeFill, nodeBox, ready, tw, taper, node, center, leaf, leafW, STEM };
})();

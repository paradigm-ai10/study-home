/* 第十一輪共用（2026-11-13，課程 v8.5）：用 diagram-design skill 的規則整理樹枝狀學習地圖。
   Thomas：裝好 diagram-design 後「開始設計，用至少五個 version」。方向沿用第十輪：大主題在中間、四根大枝幹＝四個角色。
   diagram-design 給的規則，五版都照做：
   - 圖例是畫面最下面一條橫的，上面一條細線；只列這一版真的有畫的記號（不再浮在右上角）。
   - 強調色（磚紅）一張圖最多 2 個：「從這裡開始」和一個焦點。首版開放的菱形改成石墨色，靠形狀辨認，不靠顏色。
   - 一張圖最多 9 個節點、一層最多 5 個分支：我們有 4 個角色＋17 個主題，超出；第一版（總覽）用「先總覽、再展開」解決，其他版標明超出。
   各版的差別在怎麼讓人看出「先學哪根、後學哪根」。 */
window.R11 = (() => {
  const { el, txt, rc, mk, solid, PEN, L, rr, D, col, STAGES, rolesOf } = R8;
  const RULE_Y = 636, STRIP_Y = 664;
  const tw = (s, cls, px) => TREE.tw(s, cls, px);

  // first-release diamonds in graphite: the shape says it, the accent is kept for 1–2 things
  function graphite() { R8.svg.querySelectorAll('.lm-first').forEach((p) => p.setAttribute('fill', PEN.line)); }

  // a small hatched bar in a stage colour (legend swatch)
  function swatch(g, x, y, s, o) {
    o = o || {};
    const c = col(s);
    g.appendChild(rc.path(rr(x, y - 11, 24, 10, 4), { fill: c.fill, fillStyle: 'hachure', hachureGap: 2.4, fillWeight: 1, stroke: c.pen, strokeWidth: 1.2, roughness: 0.6, seed: 1650 + s }));
    return 24;
  }
  const diamond = (g, x, y) => { R8.mark(g, 'first', x + 5, y - 5, 3.2).setAttribute('fill', PEN.line); return 12; };

  // the legend strip: items = [{ glyph(g, x, y) → width, label, hot: {data-…}, aria, cls }]; returns { groups, end }
  function strip(items, o) {
    o = o || {};
    const base = el('g', { class: 'strip' }, L.front);
    R8.line(base, 40, RULE_Y, 1240, RULE_Y, PEN.grey, 1601, { strokeWidth: 1, roughness: 0.3, bowing: 0.2 });
    let x = o.x || 40;
    const groups = [];
    items.forEach((it) => {
      if (it.gap) { x += it.gap; return; }
      const g = el('g', Object.assign({ class: it.hot ? 'hot dimmable' : 'dimmable' }, it.hot || {}, it.aria ? { 'aria-label': it.aria } : {}), base);
      const lw = it.label ? tw(it.label, 't-legend', 15) : 0, gw = it.glyphW || 24;
      const w = gw + (it.label ? 8 + lw : 0);
      if (it.hot) {
        el('rect', { x: x - 6, y: STRIP_Y - 21, width: w + 12, height: 30, fill: '#fff', 'fill-opacity': 0 }, g);
        const hi = rc.path(rr(x - 6, STRIP_Y - 21, w + 12, 30, 6), solid(PEN.hi, 4)); hi.setAttribute('class', 'hi'); g.appendChild(hi);
        g.box = { x: x - 6, y: STRIP_Y - 21, w: w + 12, h: 30 };
      }
      if (it.glyph) it.glyph(g, x, STRIP_Y);
      if (it.label) txt(it.label, { class: 't-legend' + (it.cls ? ' ' + it.cls : ''), x: x + gw + 8, y: STRIP_Y }, g);
      groups.push(g);
      x += w + (it.after == null ? 30 : it.after);
    });
    return { base, groups, end: x };
  }
  // the three stages as legend items (hot: they open the stage panel)
  const stageItems = (o) => STAGES.map((st) => ({
    glyph: (g, x, y) => swatch(g, x, y, st.no), label: st.name, hot: { 'data-s': st.no }, aria: `${st.name}：${st.tagline}`, after: 22, glyphW: 24,
  }));
  const firstItem = () => ({ glyph: diamond, glyphW: 12, label: `首版開放 ${D.first.length} 課`, hot: { 'data-f': 1 }, aria: `首版開放 ${D.first.length} 課` });

  // a quiet text control inside the map (not part of the diagram): e.g. 「＋ 顯示全部主題名稱」
  function control(label, x, y, anchor, onClick) {
    const g = el('g', { class: 'r11-ctl', role: 'button', tabindex: 0, 'aria-label': label }, L.front);
    const t = txt(label, { class: 't-legend', x, y, 'text-anchor': anchor || 'start' }, g);
    g.addEventListener('click', (e) => { e.stopPropagation(); onClick(t); });
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(t); } });
    return g;
  }

  // point on an ellipse around the centre, angle in degrees (0 = right, clockwise on screen)
  const onEllipse = (cx, cy, rx, ry, a) => { const t = a * Math.PI / 180; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; };

  return { RULE_Y, STRIP_Y, graphite, swatch, diamond, strip, stageItems, firstItem, control, onEllipse, tw };
})();

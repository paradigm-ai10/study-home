/* Bridge between the approved map (mindmap/r15-side) and the page that frames it. Runs inside map/embed.html.
   From the frame:  {t:'map:play'}      show the map and run its own opening growth from the start
                    {t:'map:still'}     show the map finished, no growth
                    {t:'map:progress', done:[lesson ids], next:'1-4'|null, pages:{id: absolute url}}
                    {t:'map:focus', topic:'T1'}   open that topic in the map's own panel (its own highlight)
   To the frame:    {t:'map:ready'}     drawn and listening
                    {t:'map:close'}     Esc pressed with no panel open
   The drawing itself is never touched: progress shows only as small notes beside lessons in the map's panel. */
(() => {
  const html = document.documentElement, svg = document.getElementById('map');
  const up = (m) => { if (parent !== window) parent.postMessage(m, location.origin); };
  let prog = { done: [], next: null, pages: {} };
  const finishAll = () => svg.querySelectorAll('*').forEach((n) => n.getAnimations().forEach((a) => a.finish()));

  function play() {
    html.classList.remove('wait');
    const T = window.__r8T; if (T && T.run) T.run();   // restarts from zero; before the map is built it starts by itself
  }
  function still() {
    html.classList.remove('wait'); finishAll();
    // the map may not have started its growth yet (fonts): keep finishing for a moment
    const iv = setInterval(finishAll, 60); setTimeout(() => clearInterval(iv), 1600);
  }

  // progress notes in the panel's lesson lists
  function decorate() {
    const done = new Set(prog.done);
    document.querySelectorAll('#panel .body li').forEach((li) => {
      const idEl = li.querySelector(':scope > .id'); if (!idEl) return;
      const id = idEl.textContent.trim(); if (!/^\d+-/.test(id)) return;
      li.querySelectorAll('.pg').forEach((x) => x.remove());
      const note = done.has(id) ? ['done', '✓ 已完成'] : id === prog.next ? ['next', '下一步'] : null;
      if (note) { const s = document.createElement('span'); s.className = 'pg ' + note[0]; s.textContent = note[1]; if (!li.querySelector('.f')) s.style.marginLeft = 'auto'; li.appendChild(s); }
      const href = prog.pages && prog.pages[id], title = idEl.nextElementSibling;
      if (href && title && title.tagName === 'SPAN' && !title.querySelector('a.go')) {
        const a = document.createElement('a'); a.className = 'go'; a.href = href; a.target = '_top';
        while (title.firstChild && title.firstChild.nodeType === 3) a.appendChild(title.firstChild);
        title.insertBefore(a, title.firstChild);
      }
    });
  }
  const body = document.querySelector('#panel .body');
  if (body) new MutationObserver(decorate).observe(body, { childList: true });

  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data.t !== 'string') return;
    const m = e.data;
    if (m.t === 'map:play') play();
    else if (m.t === 'map:still') still();
    else if (m.t === 'map:progress') { prog = { done: m.done || [], next: m.next || null, pages: m.pages || {} }; decorate(); }
    else if (m.t === 'map:focus' && window.R8 && R8.byT[m.topic]) R8.openPanel('t', m.topic);
    else if (m.t === 'map:shut' && window.R8) R8.closePanel();
  });
  // Esc: the map closes its own panel first; with nothing open, tell the frame
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.body.classList.contains('panel-open')) up({ t: 'map:close' }); }, true);
  const ready = () => up({ t: 'map:ready' });
  if (window.TREE && TREE.ready) TREE.ready(ready); else addEventListener('load', ready);
})();

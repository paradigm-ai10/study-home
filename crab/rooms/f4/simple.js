/* f4, the plain version (simple.html): draws what app.js knows. Nothing is decided here:
   the task, the three questions, what is remembered and where each entrance goes are all app.js (window.F4),
   the same as on the 3D page. This file only paints the progress note and the map, and repaints when something changes. */
(() => {
  const F4 = window.F4; if (!F4) return;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stagesEl = $('#stages'), strip = $('#note-strip');
  const open = new Set();          // the stages that are unfolded
  let chosen = false;              // once you fold or unfold one yourself, the page stops deciding for you

  function render() {
    const st = F4.state, n = F4.nextStep(), known = new Set(st.known), k = st.known.length, w = F4.weekCount();
    const nextId = n.kind === 'lesson' ? n.lesson.id : null;

    /* the note */
    $('#note-next').textContent = n.kind === 'task' ? '從 60 秒任務開始' : n.kind === 'pick' ? '下一步：幫我挑' : `下一步：${n.short}`;
    const what = $('#note-what'); what.hidden = n.kind !== 'lesson'; what.textContent = n.kind === 'lesson' ? n.lesson.title : '';
    $('#note-min').textContent = n.kind === 'pick' ? '3 題，約 1 分鐘' : `約 ${n.min} 分鐘`;
    $('#note-count').textContent = (k ? `你會了 ${k} / ${F4.TOTAL} 課。` : `${F4.TOTAL} 課，還沒開始。`) + (st.done.t1 ? '60 秒任務做完了。' : '') + (w >= 2 ? `這週做了 ${w} 件。` : '');
    strip.innerHTML = F4.STAGES.map((s, i) => '<span>' + F4.LESSONS.filter((l) => l.stage === i).map((l) => `<i class="${known.has(l.id) ? 'is-known' : l.id === nextId ? 'is-next' : ''}"></i>`).join('') + '</span>').join('');

    /* the map: five stages, the lessons inside in order */
    if (!chosen) { open.clear(); if (n.kind === 'lesson') open.add(n.lesson.stage); }
    stagesEl.innerHTML = F4.STAGES.map((s, i) => {
      const ls = F4.LESSONS.filter((l) => l.stage === i); const d = ls.filter((l) => known.has(l.id)).length; const on = open.has(i);
      return `<li class="stage${on ? ' is-open' : ''}">
        <button type="button" class="stage-h" data-i="${i}" aria-expanded="${on}" aria-controls="stage-${i}">
          <span class="name">${esc(s.name)}</span><span class="for">給${esc(s.for)}</span>
          <span class="num${d ? ' has' : ''}">${d} / ${ls.length}</span><span class="tog">${on ? '收起' : '展開'}</span>
        </button>
        <ol class="lessons" id="stage-${i}"${on ? '' : ' hidden'}>${ls.map((l) => {
          const href = F4.lessonHref(l); const isK = known.has(l.id), isN = l.id === nextId;
          const title = href ? `<a href="${esc(href)}">${esc(l.title)}</a>` : esc(l.title);
          return `<li class="${isK ? 'is-known' : isN ? 'is-next' : ''}"><span class="n">${l.n}</span><span class="t">${title}<span class="can">學完你能：${esc(l.can)}</span></span><span class="m">${l.min} 分鐘</span><span class="s">${isK ? '✓ 會了' : isN ? '<b>下一步</b>' : ''}</span></li>`;
        }).join('')}</ol>
      </li>`;
    }).join('');

    const ready = F4.LESSONS.filter((l) => F4.lessonHref(l));
    $('#map-sub').textContent = `${F4.TOTAL} 課，從簡單排到難。會的可以跳過。` + (ready.length === F4.TOTAL ? '' : ready.length ? `有底線的可以直接上（目前是第 ${ready.map((l) => l.n).join('、')} 課），其他還在做。` : '課程頁都還在做。');

    /* the other things: say up front which ones are not built yet */
    document.querySelectorAll('#ways a[data-id]').forEach((a) => {
      const r = F4.ROUTES[a.dataset.id]; let em = a.querySelector('em');
      if (r && r.href) { if (em) em.remove(); return; }
      if (!em) { em = document.createElement('em'); em.textContent = '還在做'; a.append(em); }
    });
  }

  stagesEl.addEventListener('click', (e) => {
    const b = e.target.closest('.stage-h'); if (!b) return;
    const i = +b.dataset.i; chosen = true;
    if (open.has(i)) open.delete(i); else open.add(i);
    render();
    const again = stagesEl.querySelector(`.stage-h[data-i="${i}"]`); if (again) again.focus({ preventScroll: true });
  });

  // "show me the map" from a card or the main button: the map is on this page, so go to it and unfold where you are
  F4.onMap = () => {
    F4.close();
    const n = F4.nextStep(); if (n.kind === 'lesson') { open.add(n.lesson.stage); render(); }
    const h = $('#map-h'); h.scrollIntoView({ block: 'start', behavior: 'auto' }); h.focus({ preventScroll: true });
  };
  $('#shade').addEventListener('click', () => F4.close());
  F4.on('state', render);
  render();
})();

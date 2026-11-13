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
    $('#note-next').textContent = n.kind === 'done' ? `已開放 ${F4.TOTAL} 課全部完成` : n.kind === 'task' ? '起點：60 秒體驗' : n.kind === 'pick' ? '下一步：程度評估' : `下一步：${n.short}`;
    const what = $('#note-what'); what.hidden = n.kind !== 'lesson'; what.textContent = n.kind === 'lesson' ? n.lesson.title : '';
    $('#note-min').textContent = n.kind === 'done' ? '其他課陸續推出' : n.kind === 'pick' ? '3 題・約 1 分鐘' : (n.min ? `約 ${n.min} 分鐘` : n.lesson && F4.STAGES[n.lesson.stage] ? `主題 ${F4.STAGES[n.lesson.stage].name}` : '');
    $('#note-count').textContent = `已完成 ${k} / ${F4.TOTAL} 課` + (st.done.t1 ? '・60 秒體驗已完成' : '') + (w >= 2 ? `・本週 ${w} 項` : '');
    strip.innerHTML = F4.STAGES.map((s, i) => '<span>' + F4.LESSONS.filter((l) => l.stage === i).map((l) => `<i class="${known.has(l.id) ? 'is-known' : l.id === nextId ? 'is-next' : ''}"></i>`).join('') + '</span>').join('');

    /* the map (version 7): stage 1's five modules with the lessons open now, then what comes later */
    const R8 = window.ROADMAP8, s1 = R8 && R8.roles[0];   // map v8: the first role's topics, then the later roles
    if (!chosen) { open.clear(); if (n.kind === 'lesson') open.add(n.lesson.stage); }
    stagesEl.innerHTML = (s1 ? `<li class="stage-group">第一階段　${esc(s1.name)}<span>${esc(s1.line)}</span></li>` : '') + F4.STAGES.map((s, i) => {
      const ls = F4.FIRST.filter((l) => l.stage === i); const op = ls.filter((l) => F4.lessonHref(l)); const d = op.filter((l) => known.has(l.id)).length; const on = open.has(i);   // first-release lessons; the ones without a page yet say 即將上線
      return `<li class="stage${on ? ' is-open' : ''}">
        <button type="button" class="stage-h" data-i="${i}" aria-expanded="${on}" aria-controls="stage-${i}">
          <span class="name">${esc(s.name)}</span><span class="for">${esc(s.for)}</span>
          <span class="num${d ? ' has' : ''}">${op.length ? `${d} / ${op.length}` : ls.length ? '即將上線' : '即將推出'}${s.count > ls.length ? `<small>共 ${s.count} 課</small>` : ''}</span><span class="tog">${on ? '收起' : '展開'}</span>
        </button>
        <ol class="lessons" id="stage-${i}"${on ? '' : ' hidden'}>${ls.map((l) => {
          const href = F4.lessonHref(l); const isK = known.has(l.id), isN = l.id === nextId;
          const title = href ? `<a href="${esc(href)}">${esc(l.title)}</a>` : esc(l.title);
          return `<li class="${isK ? 'is-known' : isN ? 'is-next' : ''}"><span class="n">${esc(l.id)}</span><span class="t">${title}</span><span class="m">${l.min ? `${l.min} 分鐘` : esc(l.type || '')}</span><span class="s">${isK ? '✓ 已完成' : isN ? '<b>下一步</b>' : href ? '' : '即將上線'}</span></li>`;
        }).join('')}${s.count > ls.length ? `<li class="soon"><span class="n"></span><span class="t">其餘 ${s.count - ls.length} 課即將推出</span></li>` : ''}</ol>
      </li>`;
    }).join('') + (R8 ? R8.roles.slice(1).map((g) => `<li class="stage-group is-later">${['', '第一階段', '第二階段', '第三階段'][g.stage] || ''}　${esc(g.name)}<span>${esc(g.line)}｜${g.topics.map((tid) => { const t = R8.topics.find((x) => x.id === tid); return t ? esc(t.no + ' ' + t.name) + (t.lessons.length ? `（首版 ${t.lessons.length} 課即將上線）` : '') : ''; }).join('、')}｜即將推出</span></li>`).join('') : '');

    $('#map-sub').textContent = R8 ? `${R8.counts.stages} 階段・${R8.counts.topics} 主題・必修 ${R8.counts.required} 課、選修 ${R8.counts.electives} 課；首版 ${F4.FIRST_N} 課（已開放 ${F4.TOTAL} 課），可依程度跳過。` : '';

    /* the other things: say up front which ones are not built yet */
    document.querySelectorAll('#ways a[data-id]').forEach((a) => {
      const r = F4.ROUTES[a.dataset.id]; let em = a.querySelector('em');
      if (r && r.href) { if (em) em.remove(); return; }
      if (!em) { em = document.createElement('em'); em.textContent = '建置中'; a.append(em); }
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

/* Shared by the three map-integration options (map-int.js on the home page, ../map.html):
   - MapChrome.progress(): what this browser has learned, read-only (home page: from F4; elsewhere: from the same storage keys)
   - MapChrome.mount(host, frame, opts): the two small controls that float over the framed map (bottom-left, where the
     drawing is empty at every size it fits): a close/back button and a progress chip. The map's drawing is not touched.
   Needs ../../routes.js (LESSON_PAGES) and ../../../roadmap8.js (ROADMAP8) on the page. */
window.MapChrome = (() => {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LINKS = !/[?&]maplinks=0/.test(location.search);   // lesson names in the panel become links when the lesson has a page (LESSON_PAGES); ?maplinks=0 turns it off

  function progress() {
    const R8 = window.ROADMAP8 || { topics: [], first: [], idmap: {} }, PAGES = window.LESSON_PAGES || {};
    const title = {}, topicOf = {};
    R8.topics.forEach((t) => { (t.all || []).forEach(([id, ti]) => { title[id] = ti; topicOf[id] = t; }); t.lessons.forEach((l) => { title[l.id] = l.title; topicOf[l.id] = t; }); });
    const open = R8.first.filter((id) => PAGES[id]);
    let known = [], next = null, kind = 'pick';
    if (window.F4 && F4.state) {
      known = F4.state.known.slice(); const n = F4.nextStep(); kind = n.kind; if (n.kind === 'lesson') next = n.lesson.id;
    } else {
      // the same record app.js keeps (paradigm.f4) + lessons finished on lesson pages (pd-done); read only, nothing is written
      const newId = (id) => (title[id] ? id : R8.idmap[id] && title[R8.idmap[id]] ? R8.idmap[id] : null);
      let s = {}, d = [];
      try { s = JSON.parse(localStorage.getItem('paradigm.f4') || '{}') || {}; } catch (e) { s = {}; }
      try { d = JSON.parse(localStorage.getItem('pd-done') || '[]'); } catch (e) { d = []; }
      const self = Array.isArray(s.self) ? s.self : Array.isArray(s.known) ? s.known : [];
      known = [...new Set(self.concat(Array.isArray(d) ? d : []).map(newId).filter(Boolean))];
      const left = open.filter((id) => !known.includes(id)), start = newId(s.start);
      if (open.length && !left.length) kind = 'done';
      else if (start || known.length) { kind = 'lesson'; const i = Math.max(0, open.indexOf(start)); next = open.slice(i).concat(open.slice(0, i)).find((id) => !known.includes(id)) || left[0] || null; }
      else kind = (s.done && s.done.t1) ? 'pick' : 'task';
    }
    const pages = {};
    if (LINKS) Object.keys(PAGES).forEach((id) => { if (PAGES[id]) pages[id] = new URL(PAGES[id], window.MAP_PAGES_BASE || location.href).href; });
    const t = next ? topicOf[next] : null;
    return { done: known, next, kind, nextTitle: next ? title[next] : '', topic: t ? t.id : 'T1', topicNo: t ? t.no : 1, openCount: open.length, doneOpen: open.filter((id) => known.includes(id)).length, pages };
  }

  function mount(host, frame, o) {
    const bar = document.createElement('div'); bar.className = 'mc';
    bar.innerHTML = `<button type="button" class="mc-x">${esc(o.closeLabel)}</button><button type="button" class="mc-prog" hidden></button>`;
    host.appendChild(bar);
    const x = bar.querySelector('.mc-x'), chip = bar.querySelector('.mc-prog');
    const post = (m) => { try { frame.contentWindow.postMessage(m, location.origin); } catch (e) { /* not loaded yet */ } };
    let p = null;
    function sync() {
      p = progress();
      const head = p.doneOpen ? `已完成 ${p.doneOpen} / ${p.openCount} 課` : '';
      const tail = p.kind === 'lesson' ? `下一步：${p.next} ${p.nextTitle}` : p.kind === 'done' ? '已開放課程全部完成' : `建議起點：主題 1（可先完成程度評估）`;
      chip.innerHTML = `${head ? `<span>${esc(head)}</span>` : ''}<b>${esc(tail)}</b><i aria-hidden="true">在地圖上顯示 ›</i>`;
      chip.setAttribute('aria-label', `${head ? head + '。' : ''}${tail}。在地圖上顯示`);
      chip.hidden = false;
      post({ t: 'map:progress', done: p.done, next: p.next, pages: p.pages });
    }
    x.addEventListener('click', () => o.onClose());
    chip.addEventListener('click', () => post({ t: 'map:focus', topic: p ? p.topic : 'T1' }));
    return { bar, x, sync, post };
  }
  return { progress, mount };
})();

/* The plain page's switch to the 3D desk: the crab packs the page up and jumps over (pack-fx.js, the heavy part: three.js and the crab).
   This small file is the only part every visitor loads. It
     - fetches the heavy part when you reach for a switch link (pointer near it, hover, focus, touch), or, unless you have
       picked the plain version before, a few quiet seconds after the page is up;
     - takes the click: plays the move and then changes page; if the crab is not ready within a moment, plays the short
       crab-less version (the photo pops, the cream page drops) so the press never goes unanswered;
     - leaves the old behaviour alone for less-motion systems, new-tab clicks and pages with no WebGL;
     - puts the page back as it was if you come Back to it.
   app.js has already stored your choice and your progress on the same click (its listener is added first). */
(() => {
  const html = document.documentElement;
  const links = [...document.querySelectorAll('a[data-view-to="3d"]')]; if (!links.length) return;
  const photo = document.getElementById('desk-photo');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const NOTE = 'paradigm.f4.switching', SEEN = 'paradigm.f4.packSeen';
  const Q = new URLSearchParams(location.search), keep = !Q.has('fresh') || Q.has('keep');
  // the whole story once; after that the short one (?short and ?long force either, for checking)
  const isShort = () => { if (Q.has('long')) return false; if (Q.has('short')) return true; try { return keep && localStorage.getItem(SEEN) === '1'; } catch (e) { return false; } };
  let mod = null, busy = false, sheet = null, anims = [];

  /* the stage: night behind the page, and the page as a cream sheet that can drop (styles: pack-fx.css) */
  const boot = window.__packBoot = {
    sheet() { if (!sheet) { sheet = document.createElement('div'); sheet.className = 'pk-sheet'; sheet.setAttribute('aria-hidden', 'true'); html.insertBefore(sheet, document.body); } return sheet; },
    stage(on) { boot.sheet(); html.classList.toggle('pk-on', on); if (!on) html.classList.remove('pk-night'); },
    go(href, skipped, short) {                                       // skipped: you cut it short, so the desk does not play its half either
      try { sessionStorage.setItem(NOTE, JSON.stringify({ to: '3d', at: Date.now(), pack: 1, skip: skipped ? 1 : 0, short: short ? 1 : 0 })); } catch (e) { /* then it just changes page */ }
      try { if (!skipped && keep) localStorage.setItem(SEEN, '1'); } catch (e) { /* private mode: it will be the long one again */ }
      location.href = href;
    },
  };

  const warm = () => mod || (mod = import('./pack-fx.js').then((m) => m.prepare().then(() => m)).catch((e) => { console.info('[pack] no crab, short version:', e && e.message); return null; }));
  links.forEach((a) => { ['pointerenter', 'focus', 'touchstart'].forEach((ev) => a.addEventListener(ev, warm, { passive: true })); });
  /* and, on a computer with a decent connection, a few quiet seconds after the page is up: so a first visit gets the whole story
     even if the click comes fast (Thomas, 2026-11-11). Not on phones, data-saver, slow connections or less-motion systems,
     and not for someone who has picked the plain version (they pressed "切到簡潔版" on an earlier visit): they asked for no 3D,
     so for them it stays "when you reach for the link". */
  const conn = navigator.connection || {};
  const light = calm.matches || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || matchMedia('(max-width: 767px) and (pointer: coarse) and (hover: none)').matches || /Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent || '');
  let picked = null; try { picked = keep ? localStorage.getItem('paradigm.f4.view') : null; } catch (e) { /* private mode: treated as a first visit */ }
  if (!light && picked !== 'simple' && html.dataset.arrive !== 'unpack') {
    const soon = () => setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(() => { if (!document.hidden) warm(); }, { timeout: 3000 }) : warm()), 2500);
    if (document.readyState === 'complete') soon(); else addEventListener('load', soon);
  }
  /* a tab left in the background does not keep the crab's canvas: it is let go after half a minute and fetched again when you reach for the link */
  let away = 0;
  document.addEventListener('visibilitychange', () => {
    clearTimeout(away);
    if (document.hidden) away = setTimeout(() => { if (busy || !mod) return; const m0 = mod; mod = null; m0.then((m) => { if (m && m.release) m.release(); }); }, 30000);
  });
  if (!calm.matches) {                                               // reaching toward a link counts: the fetch gets a head start on the click
    const near = (e) => {
      for (const a of links) { const r = a.getBoundingClientRect(); if (e.clientX > r.left - 220 && e.clientX < r.right + 220 && e.clientY > r.top - 160 && e.clientY < r.bottom + 160) { removeEventListener('pointermove', near); warm(); return; } }
    };
    addEventListener('pointermove', near, { passive: true });
  }

  /* no crab in time: the photo pops and the page drops anyway (about 0.7 s) */
  function short(href) {
    boot.stage(true); html.classList.add('pk-night');
    const main = document.querySelector('main'), H = innerHeight;
    const drop = [{ transform: 'none' }, { transform: `translate3d(0,${Math.round(H * 1.14)}px,0) rotate(2.4deg)` }];
    const o = { duration: 380, delay: 260, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' };   // falling: slow to start, then gone
    if (photo) anims.push(photo.animate([{ transform: 'scale(.92)' }, { transform: 'scale(1.08) rotate(4deg)', offset: 0.55 }, { transform: 'scale(1) rotate(3deg)' }], { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' }));
    anims.push(main.animate(drop, o), boot.sheet().animate(drop, o));
    anims[anims.length - 1].finished.then(() => boot.go(href), () => {});
  }

  links.forEach((a) => a.addEventListener('click', (e) => {
    if (calm.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (html.classList.contains('has-card')) return;                 // a task card is open (only the keyboard can get here): just change page, nothing to pack around it
    if (!window.WebGL2RenderingContext && !document.startViewTransition) return;       // very old browser: just change page
    e.preventDefault(); if (busy) return; busy = true;
    const href = a.href, viaKey = e.detail === 0;                    // Enter on the link: the short one, a key press should not start a long show
    if (photo) photo.classList.add('pk-wait');                       // answers the press at once, while the crab is (maybe) still on its way
    Promise.race([warm(), new Promise((r) => setTimeout(() => r(null), 1200))]).then((m) => {
      if (photo) photo.classList.remove('pk-wait');
      if (m) m.play(href, { short: isShort() || viaKey }).catch(() => short(href)); else short(href);
    });
  }));

  /* arrived from the desk with the bundle (switch-fx.js set html[data-arrive="unpack"] and hid the things): the crab brings them back */
  if (html.dataset.arrive === 'unpack') warm().then((m) => { if (m) return m.playBack(); delete html.dataset.arrive; }).catch(() => { delete html.dataset.arrive; });

  /* Back to this page from the desk: everything where it was */
  addEventListener('pageshow', (e) => {
    if (!e.persisted && !busy) return;
    anims.forEach((x) => x.cancel()); anims = []; busy = false;
    if (photo) photo.classList.remove('pk-wait');
    if (mod) mod.then((m) => { if (m) m.reset(); else boot.stage(false); }); else boot.stage(false);
  });
})();

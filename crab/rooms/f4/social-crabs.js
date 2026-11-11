/* Social links as little block crabs that scurry along the bottom (2026-11-12 meeting).
   Change the accounts here only. A third, smaller crab tags along with no sign; give it one when YouTube is added.
   Where they live: the 3D desk on a computer = a fixed strip between the index card and the switches;
   the plain page = a strip under the headline; phones = a strip under the index. Styles: social-crabs.css. */
(function () {
  const SOCIALS = [
    { id: 'ig', name: 'Instagram', label: 'IG', handle: '@paradigmai_tw', href: 'https://www.instagram.com/paradigmai_tw/' },
    { id: 'threads', name: 'Threads', label: 'Threads', handle: '@paradigmai_tw', href: 'https://www.threads.com/@paradigmai_tw' },
  ];
  const html = document.documentElement;
  const SIMPLE = html.dataset.view === 'simple';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrowQ = matchMedia('(max-width: 767px)');

  const ICON = {   // plain shapes, no brand logos
    ig: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="8" r="2.7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="11.6" cy="4.4" r=".9" fill="currentColor"/></svg>',
    threads: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.6 7.4c-.3-2.2-1.7-3.3-3.6-3.3-2.3 0-3.8 1.7-3.8 4s1.5 3.9 3.8 3.9c1.6 0 2.9-.8 3.1-2.2.2-1.5-1-2.3-2.6-2.2-1.4.1-2 .9-1.8 1.7.2.8 1.3 1.1 2.2.7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };
  const BODY = '<svg viewBox="0 0 56 40" aria-hidden="true">'
    + '<g class="sc-legs sc-legs-a"><line x1="15" y1="27" x2="8" y2="37"/><line x1="19" y1="29" x2="14" y2="39"/><line x1="23" y1="30" x2="20" y2="39.5"/></g>'
    + '<g class="sc-legs sc-legs-b"><line x1="41" y1="27" x2="48" y2="37"/><line x1="37" y1="29" x2="42" y2="39"/><line x1="33" y1="30" x2="36" y2="39.5"/></g>'
    + '<g class="sc-claw sc-claw-l"><ellipse cx="6" cy="16" rx="5.4" ry="4.8" fill="#FF7A66"/><path d="M2.2 14.2 L6.5 16.4" stroke="#C0351F" stroke-width="1.3" stroke-linecap="round"/></g>'
    + '<g class="sc-claw sc-claw-r"><ellipse cx="50" cy="16" rx="5.4" ry="4.8" fill="#FF7A66"/><path d="M53.8 14.2 L49.5 16.4" stroke="#C0351F" stroke-width="1.3" stroke-linecap="round"/></g>'
    + '<rect x="10" y="7" width="36" height="25" rx="7.5" fill="#FF6B57"/>'
    + '<rect x="10" y="23" width="36" height="9" rx="5" fill="#E2503C" opacity=".55"/>'
    + '<rect x="13" y="9" width="12" height="4" rx="2" fill="#FFF4E0" opacity=".28"/>'
    + '<g class="sc-eyes"><ellipse cx="22.5" cy="18" rx="2.7" ry="4.1" fill="#2A1F3D"/><ellipse cx="33.5" cy="18" rx="2.7" ry="4.1" fill="#2A1F3D"/>'
    + '<circle cx="23.4" cy="16.4" r=".95" fill="#fff"/><circle cx="34.4" cy="16.4" r=".95" fill="#fff"/></g></svg>';

  const lane = document.createElement('div');
  lane.className = 'sc-lane';
  lane.setAttribute('role', 'navigation');
  lane.setAttribute('aria-label', '我們的社群');

  const crabs = SOCIALS.map((s) => {
    const a = document.createElement('a');
    a.className = 'sc-crab';
    a.href = s.href; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', s.name + ' ' + s.handle + '（另開新分頁）');
    // pictures of the clay crab from the 3D desk (src/mini-sprites.cjs): standing and mid-step, swapped while it walks
    a.innerHTML = '<span class="sc-sign">' + ICON[s.id] + '<span>' + s.name + '</span><span class="sc-handle">' + s.handle + '</span></span><span class="sc-body"><img class="sc-img sc-fa" src="img/mini-' + s.id + '-a.png" alt="" draggable="false"><img class="sc-img sc-fb" src="img/mini-' + s.id + '-b.png" alt="" draggable="false"></span>';
    lane.appendChild(a);
    return { el: a, w: 120, x: 0, to: 0, speed: 0, wait: 0, held: false };
  });
  const babyEl = document.createElement('span');
  babyEl.className = 'sc-crab is-baby'; babyEl.setAttribute('aria-hidden', 'true');
  babyEl.innerHTML = '<span class="sc-body">' + BODY + '</span>';
  lane.appendChild(babyEl); babyEl.style.display = 'none';   // the clay crabs come as two; the little one stays home for now
  const baby = { el: babyEl, w: 40, x: 0, follow: crabs[crabs.length - 1] };

  crabs.forEach((c) => {
    const hold = (on) => { c.held = on; c.el.classList.toggle('is-held', on); if (on) c.el.classList.remove('is-walking'); };
    c.el.addEventListener('pointerenter', () => hold(true));
    c.el.addEventListener('pointerleave', () => hold(false));
    c.el.addEventListener('focus', () => hold(true));
    c.el.addEventListener('blur', () => hold(false));
  });

  /* ---------- where the strip goes ---------- */
  let W = 0, mode = '';
  function place() {
    const narrow = narrowQ.matches;
    const want = SIMPLE ? 'simple' : narrow ? 'phone' : 'desk';
    if (want !== mode) {
      mode = want;
      lane.classList.toggle('is-fixed', want === 'desk');
      lane.classList.toggle('is-flow', want === 'phone');
      lane.classList.toggle('is-wrap', want === 'simple');
      lane.style.left = lane.style.right = '';
      if (want === 'simple') {             // a .wrap shell keeps the strip on the same column as the words
        const shell = document.createElement('div'); shell.className = 'wrap sc-shell'; shell.appendChild(lane);
        const lead = document.querySelector('main .lead') || document.getElementById('hero'); lead.after(shell);
      }
      else if (want === 'phone') { const ways = document.getElementById('ways'); (ways || document.body).after(lane); }
      else document.body.appendChild(lane);
    }
    if (mode === 'desk') {
      const idx = document.getElementById('ways'), ctl = document.getElementById('ctl');
      const l = idx ? idx.getBoundingClientRect().right + 28 : 24;
      const cr = ctl && ctl.offsetWidth ? ctl.getBoundingClientRect().left : innerWidth - 24;
      lane.style.left = Math.round(l) + 'px';
      lane.style.right = Math.round(innerWidth - cr + 28) + 'px';
    }
    W = lane.clientWidth;

    crabs.forEach((c) => { c.x = Math.min(c.x, Math.max(0, W - c.w)); c.to = Math.min(c.to, Math.max(0, W - c.w)); });
  }

  /* ---------- scurrying ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  function pickTarget(c) {
    const max = Math.max(0, W - c.w), others = crabs.filter((o) => o !== c);
    const gap = Math.min(84, W / 4);          // keep the signs apart, so both stay readable
    let to = c.x;
    for (let i = 0; i < 12; i++) {
      to = rnd(0, max);
      if (Math.abs(to - c.x) < 50) continue;
      if (others.every((o) => Math.abs(to - o.to) > gap && Math.abs(to - o.x) > gap)) break;
    }
    c.to = to; c.speed = rnd(42, 72);
  }
  function draw(c) {
    c.el.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,0,0)';
  }
  function step(dt) {
    crabs.forEach((c) => {
      if (c.held) return;
      if (c.wait > 0) {
        c.wait -= dt;
        if (c.wait <= 0) { pickTarget(c); }
        return;
      }
      const d = c.to - c.x;
      if (Math.abs(d) < 1) {
        c.el.classList.remove('is-walking');
        c.wait = rnd(1.2, 3.4);
        if (Math.random() < 0.35) { c.el.classList.remove('is-waving'); void c.el.offsetWidth; c.el.classList.add('is-waving'); }
        return;
      }
      c.el.classList.add('is-walking');
      c.el.classList.toggle('to-left', d < 0); c.el.classList.toggle('to-right', d > 0);
      c.x += Math.sign(d) * Math.min(Math.abs(d), c.speed * dt);
      draw(c);
    });
    // the little one keeps close behind the last crab, a bit quicker and a bit late
    const p = baby.follow, side = p.el.classList.contains('to-left') ? 1 : -1;
    let goal = p.x + (side > 0 ? p.w + 4 : -baby.w - 4);
    goal = Math.max(0, Math.min(W - baby.w, goal));
    const bd = goal - baby.x;
    babyEl.classList.toggle('is-walking', Math.abs(bd) > 1.5);
    babyEl.classList.toggle('to-left', bd < 0); babyEl.classList.toggle('to-right', bd > 0);
    baby.x += Math.sign(bd) * Math.min(Math.abs(bd), 95 * dt);
    babyEl.style.transform = 'translate3d(' + baby.x.toFixed(1) + 'px,0,0)';
  }

  function start() {
    place();
    crabs.forEach((c, i) => { c.x = c.to = Math.max(0, (W - c.w) * (i === 0 ? 0.12 : 0.7)); c.wait = rnd(0.4, 1.6) + i * 0.5; draw(c); });
    baby.x = Math.min(W - baby.w, crabs[crabs.length - 1].x + 60); babyEl.style.transform = 'translate3d(' + baby.x.toFixed(1) + 'px,0,0)';
    addEventListener('resize', place);
    addEventListener('load', place);           // the index card settles once fonts are in
    setTimeout(place, 1500);
    narrowQ.addEventListener && narrowQ.addEventListener('change', place);
    if (REDUCED) return;                      // less motion: they stand still, still clickable
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (W > 0) step(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // mini-crabs.js (the clay crabs on the 3D desk) asks the flat ones to step aside while it is out; the links stay for the keyboard
  window.__socialLane = { hide(on) { lane.classList.toggle('is-off', !!on); } };
})();

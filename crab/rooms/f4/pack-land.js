/* "The crab packs up and moves", the 3D desk's half (the plain page's half is pack-fx.js; spec: ../BRIEF_轉場打包.md).
   study.js loads this only when you arrive from the plain page with the bundle (html[data-arrive="pack"]) and calls
   pre(dt) and post() from its own frame, so this runs on the desk's clock (and in its ?capture mode, frame by frame).

   4. land    the crab comes down from over your head onto its spot, bundle on its back: flat for two frames, the lamp
              dips, everything on the desk jumps, then it springs back up
   5. unpack  a hop, the bundle slips off and opens into the cloth under its feet; slips of paper fly out, each to the
              thing it belongs to (the headline and the button first, so the page can be used at once), and each thing
              lights up as its slip arrives; the cloth folds itself back into the little parcel; a wave
   A click or a key at any moment ends it there with everything in place. */
import { makeBundle, makeCloth } from './pack-bundle.js';
import { suck, quadMatrix, suckFade } from './pack-genie.js';

/* ?tempo= (kept for the tab by pack-fx.js): the same speed as the plain page's half */
const SPEED = 1.25;   // how fast all of it plays, against the timetables as written (Thomas, 2026-11-12: "a bit faster"). Keep the two files alike.
const TEMPO = (() => { let v = NaN; try { const q = new URLSearchParams(location.search).get('tempo'); if (q) sessionStorage.setItem('paradigm.f4.tempo', q); v = +(q || sessionStorage.getItem('paradigm.f4.tempo')); } catch (e) { /* private mode */ } return v > 0.2 && v < 5 ? v : SPEED; })();

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ring = (x, decay, hz) => (x <= 0 ? 0 : Math.exp(-decay * x) * Math.cos(Math.PI * 2 * hz * x));

/* the slips of paper keep their size next to the desk: a window twice as big gets slips up to 1.8 times as big */
const chipK = () => Math.min(1.8, Math.max(1, Math.min(innerWidth / 1440, innerHeight / 900))).toFixed(3);

export function land(c) {
  const { THREE, scene, camera, html, crabRoot, squash, nodes, acts, play, S, L, LIFE, chainSw, props, IDS, greet, CRAB_SCALE } = c;
  const stage = document.getElementById('stage'), hero = document.getElementById('hero'), index = document.getElementById('ways');
  /* seconds on the desk's clock, from the moment the live desk is up. The second time on (short), the same things happen at once. */
  const K = c.short
    ? { fall: [0.04, 0.30], off: [0.50, 0.68], chips0: 0.72, step: 0.05, fly: 0.36, hold: 0.2, fade: 0.14 }
    : { fall: [0.08, 0.48], off: [0.95, 1.25], chips0: 1.38, step: 0.14, fly: 0.55, hold: 0.42, fade: 0.2 };   // (2026-11-12: slower, one slip at a time, each readable where it lands)
  const DROP = 5.6;                                                  // how far above its spot it starts: out of the picture
  const home = S.crabHome.clone();
  const R = CRAB_SCALE * 0.98;
  const bundle = makeBundle(THREE, { fill: 1 }); scene.add(bundle);
  const cloth = makeCloth(THREE, { r: 1.12 }); cloth.visible = false; cloth.rotation.y = 0.35; cloth.material.color.setScalar(0.6); scene.add(cloth);   // (flat under the lamp it would bleach to pink)
  const clothAt = new THREE.Vector3(home.x - 0.05, 0.012, home.z - 0.1), clothS = cloth.scale.clone();
  const parcelNode = nodes.parcel || nodes.top || squash, parcelPart = nodes['part:parcel'];
  if (parcelPart) parcelPart.visible = false;

  const v = new THREE.Vector3(), q = new THREE.Quaternion(), pw = new THREE.Vector3();
  const scr = (w) => { v.copy(w).project(camera); return [(v.x * 0.5 + 0.5) * S.W, (-v.y * 0.5 + 0.5) * S.H]; };
  const mid = (el) => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2]; };
  const nameOf = (id) => { const b = index.querySelector(`a[data-id="${id}"] b`); return b ? b.textContent : id; };

  /* what comes out, in this order: what you need first, then round the desk */
  const chips = [
    { id: 'title', text: hero.querySelector('h1').textContent.trim(), cls: 'is-title', to: () => mid(hero.querySelector('h1')), arrive: () => html.classList.add('pk-hero') },
    { id: 'index', text: '學習進度', cls: 'is-note', to: () => mid(index), arrive: () => html.classList.add('pk-index') },
    ...['map', 'words', 'pick', 'news', 'free', 'solve', 'ask'].filter((id) => IDS.includes(id)).map((id) => ({
      id, text: nameOf(id), to: () => { const p = props[id]; return scr(v.copy(p.pos).setY(p.size.y * 0.55 + 0.05)); }, prop: props[id] })),
  ];
  chips.forEach((ch, i) => {
    const el = document.createElement('div'); el.className = 'pk-chip' + (ch.cls ? ' ' + ch.cls : ''); el.textContent = ch.text; el.setAttribute('aria-hidden', 'true'); el.style.visibility = 'hidden'; el.style.setProperty('--pk-k', chipK());
    stage.append(el); ch.el = el; ch.w = el.offsetWidth; ch.h = el.offsetHeight; ch.at = K.chips0 + i * K.step; ch.dir = i % 2 ? 1 : -1; ch.done = false;
  });
  const tEnd = K.chips0 + (chips.length - 1) * K.step + K.fly + K.hold + K.fade;
  const fold = [tEnd + 0.06, tEnd + 0.34];

  let tau = 0, hitAt = -1, offDone = false, waved = false, over = false;
  /* the quiet line that says a press skips this (the whole story only) */
  const hint = document.createElement('div'); hint.className = 'pk-skip'; hint.textContent = '點擊略過'; hint.setAttribute('aria-hidden', 'true');
  if (!c.short) { document.body.append(hint); requestAnimationFrame(() => requestAnimationFrame(() => hint.classList.add('is-on'))); }

  function cleanup() {
    if (over) return; over = true;
    removeEventListener('pointerdown', skip, true); removeEventListener('keydown', skip, true); hint.remove();
    chips.forEach((ch) => { ch.el.remove(); if (ch.prop) { ch.prop.flash = 0; ch.prop.dy = 0; } });
    IDS.forEach((id) => { props[id].dy = 0; props[id].flash = 0; });
    scene.remove(bundle); scene.remove(cloth);
    [bundle, cloth].forEach((o) => o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }));
    if (parcelPart) parcelPart.visible = true;
    crabRoot.visible = true; crabRoot.position.copy(home);
    html.classList.add('pk-hero', 'pk-index'); delete html.dataset.arrive; html.classList.remove('pk-hero', 'pk-index');
    LIFE.lastActive = S.t;
  }
  function skip(e) { if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; cleanup(); if (!waved) greet(); }
  addEventListener('pointerdown', skip, true); addEventListener('keydown', skip, true);

  return {
    get tau() { return tau; }, get over() { return over; }, end: tEnd + 1.0,
    /* before the crab's own frame: where it is, what the things on the desk do, where the slips of paper are */
    pre(dt) {
      if (over) return;
      tau += dt * TEMPO; LIFE.lastActive = S.t; S.nextFidget = S.t + 3;
      const f = seg(tau, K.fall[0], K.fall[1]);
      crabRoot.visible = tau >= K.fall[0];
      crabRoot.position.copy(home);
      if (f < 1) crabRoot.position.y = DROP * (1 - f * f);           // falling: faster all the way down
      else if (hitAt < 0) {                                          // 咚
        hitAt = tau; L.flick = 'blink'; L.flickT = 0; chainSw.a.v += 2.4; chainSw.pull.v -= 4; play('eyes_wide', { force: true });
      }
      const x = hitAt < 0 ? -1 : tau - hitAt;
      const o = seg(tau, K.off[0], K.off[1]);
      if (hitAt >= 0) crabRoot.position.y = 0.34 * Math.sin(Math.PI * seg(tau, K.off[0], K.off[0] + 0.3));      // the hop that shrugs the bundle off
      if (o > 0 && !offDone) { offDone = true; play('shell_puff', { force: true, speed: 1.5 }); }

      /* everything on the desk jumps at the thump (the further away, the later and the less), and again, a little, when its slip arrives */
      IDS.forEach((id) => {
        const p = props[id]; const d = Math.hypot(p.pos.x - home.x, p.pos.z - home.z);
        let dy = x < 0 ? 0 : 0.11 / (1 + d * 0.35) * Math.max(0, ring(x - d * 0.012, 9, 4.6));
        if (p.gotAt != null) { dy += 0.045 * Math.max(0, ring(tau - p.gotAt, 10, 5)); p.flash = tau - p.gotAt < 0.42 ? 1 : 0; }
        p.dy = dy;
      });

      /* the slips of paper: each is pulled out of the open cloth (its far side first, stretched, the near side lets go last),
         lands on the thing it belongs to and stays there long enough to be read; that thing lights up */
      const from = scr(v.copy(clothAt).setY(0.05)); const mw = 18 * +chipK();
      for (const ch of chips) {
        const p = seg(tau, ch.at, ch.at + K.fly); const st = ch.el.style;
        if (p <= 0) continue;
        const to = ch.to(); const at0 = `translate3d(${(to[0] - ch.w / 2).toFixed(1)}px,${(to[1] - ch.h / 2).toFixed(1)}px,0) `;
        if (p >= 1) {
          if (!ch.done) { ch.done = true; if (ch.arrive) ch.arrive(); if (ch.prop) ch.prop.gotAt = tau; }
          const t1 = ch.at + K.fly + (ch.prop ? K.hold : 0.05), g = seg(tau, t1, t1 + K.fade);     // (the headline and the index are there themselves now)
          if (g >= 1) { st.visibility = 'hidden'; continue; }
          const pop = 1 + 0.12 * ring(tau - (ch.at + K.fly), 12, 5);
          st.visibility = 'visible'; st.opacity = (1 - g).toFixed(3); st.transform = at0 + `scale(${(pop * (1 - 0.2 * g)).toFixed(4)})`;
          continue;
        }
        st.visibility = 'visible'; st.opacity = p < 0.1 ? (p / 0.1).toFixed(3) : '1';
        st.transform = at0 + quadMatrix(ch.w, ch.h, suck(ch.w, ch.h, from[0] - to[0], from[1] - to[1], 1 - p, mw, 0, 110 * +chipK()));
      }
      if (tau >= fold[0] && !waved && tau >= fold[1] + 0.05) { waved = true; play('wave_R', { force: true }); greet(); }
      if (tau >= fold[0] && tau - dt < fold[0]) play('parcel_wiggle', { force: true, speed: 1.4 });
    },
    /* after the crab's own squash is set: the fall, the thump, and the bundle and cloth, which follow the finished pose */
    post() {
      if (over) return false;
      const f = seg(tau, K.fall[0], K.fall[1]); const x = hitAt < 0 ? -1 : tau - hitAt;
      let sx = 1, sy = 1, e = 0;
      if (x < 0) { sy = 1 + 0.2 * f; sx = 1 - 0.1 * f; }             // stretched on the way down
      else { e = x < 0.07 ? 1 : Math.exp(-(x - 0.07) * 7.5) * Math.cos((x - 0.07) * 13); sy = 1 - 0.5 * e; sx = 1 + 0.3 * e; }   // half flat, held two frames, then up past itself and settle
      squash.scale.x *= sx; squash.scale.y *= sy; squash.scale.z *= sx;

      const o = seg(tau, K.off[0], K.off[1]);
      crabRoot.updateMatrixWorld(true); parcelNode.getWorldPosition(pw);
      bundle.visible = crabRoot.visible && o < 1;
      if (bundle.visible) {
        if (o <= 0) {                                                // on its back, squashed with it
          bundle.position.copy(pw); squash.getWorldQuaternion(q); bundle.quaternion.copy(q);
          bundle.scale.set(R * (1 + 0.22 * e), R * (1 - 0.34 * e), R * (1 + 0.22 * e));
        } else {                                                     // tossed up off its back, down to its feet, flattening as it opens
          const g = inOut(o);
          bundle.position.set(lerp(pw.x, clothAt.x, g), lerp(pw.y, 0.02, g) + 0.55 * Math.sin(Math.PI * o), lerp(pw.z, clothAt.z + 0.25, g));
          bundle.quaternion.identity(); bundle.rotation.z = -0.5 * Math.sin(Math.PI * o);
          const fl = outCubic(seg(o, 0.55, 1)); bundle.scale.set(R * (1 + 0.25 * fl), R * (1 - 0.72 * fl), R * (1 + 0.25 * fl));
          bundle.children[0].material.color.setScalar(lerp(1, 0.6, fl));   // lying flat under the lamp it would bleach: ends the shade the open cloth is
        }
      }
      /* the cloth: open under its feet while the slips fly, then gathered back up into the parcel on its head */
      const open = seg(tau, lerp(K.off[0], K.off[1], 0.7), K.off[1] + 0.14), back = seg(tau, fold[0], fold[1]);
      cloth.visible = open > 0 && back < 1;
      if (cloth.visible) {
        const s = lerp(0.3, 1, outBack(open)) * (1 - 0.88 * inOut(back));   // out of the flattening bundle, never from nothing
        cloth.scale.set(clothS.x * s, clothS.y * s, clothS.z * s);
        cloth.position.lerpVectors(clothAt, pw, inOut(back)); cloth.position.y += 0.5 * Math.sin(Math.PI * back);
        cloth.rotation.y = 0.35 + 2.2 * back;
      }
      if (parcelPart) parcelPart.visible = tau >= K.off[1] - 0.04;    // its own little parcel is back where the bundle sat
      if (tau >= fold[1] + 0.75) { cleanup(); return false; }
      return true;
    },
  };
}

/* The way back (3D → plain), the desk's half: everything on the desk flashes and sends its slip to the crab, the bundle is on
   its back, a squat, and it jumps up out of the picture. Then done() changes the page; the plain page plays the rest (pack-fx.js). */
export function leave(c, done) {
  const { THREE, scene, camera, html, crabRoot, squash, nodes, play, S, LIFE, props, IDS, CRAB_SCALE } = c;
  const stage = document.getElementById('stage'), hero = document.getElementById('hero'), index = document.getElementById('ways');
  const K = { bundle: 0.12, chips0: 0.40, step: 0.12, show: 0.18, fly: 0.46 };   // then (set below, once the slips are counted): squat, jump, end
  const home = crabRoot.position.clone(); const R = CRAB_SCALE * 0.98;
  const bundle = makeBundle(THREE, { fill: 1 }); bundle.visible = false; scene.add(bundle);
  const parcelNode = nodes.parcel || nodes.top || squash, parcelPart = nodes['part:parcel'];
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), pw = new THREE.Vector3();
  const scr = (w) => { v.copy(w).project(camera); return [(v.x * 0.5 + 0.5) * S.W, (-v.y * 0.5 + 0.5) * S.H]; };
  const mid = (el) => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2]; };
  const nameOf = (id) => { const b = index.querySelector(`a[data-id="${id}"] b`); return b ? b.textContent : id; };
  const chips = [
    ...['ask', 'solve', 'free', 'news', 'pick', 'words', 'map'].filter((id) => IDS.includes(id)).map((id) => ({ text: nameOf(id), from: (() => { const p = props[id]; return scr(v.copy(p.pos).setY(p.size.y * 0.55 + 0.05)); })(), prop: props[id] })),
    { text: '學習進度', cls: 'is-note', from: mid(index), take: 'pk-took-index' },
    { text: hero.querySelector('h1').textContent.trim(), cls: 'is-title', from: mid(hero.querySelector('h1')), take: 'pk-took-hero' },
  ];
  chips.forEach((ch, i) => {
    const el = document.createElement('div'); el.className = 'pk-chip' + (ch.cls ? ' ' + ch.cls : ''); el.textContent = ch.text; el.setAttribute('aria-hidden', 'true'); el.style.visibility = 'hidden'; el.style.setProperty('--pk-k', chipK());
    stage.append(el); ch.el = el; ch.w = el.offsetWidth; ch.h = el.offsetHeight; ch.at = K.chips0 + i * K.step; ch.inAt = ch.at + K.show + K.fly * 0.9; ch.took = false;
  });
  { const last = K.chips0 + Math.max(0, chips.length - 1) * K.step + K.show + K.fly; K.squat = [last + 0.08, last + 0.26]; K.jump = [last + 0.26, last + 0.62]; K.end = last + 0.64; }
  html.classList.add('pk-leaving');                                  // the words and the index fade; the picture is no longer the thing that flies (switch-fx.css)
  play('shell_puff', { force: true, speed: 1.6 });
  let tau = 0, gone = false;
  return {
    get tau() { return tau; }, end: K.end,
    pre(dt) {
      tau += dt * TEMPO; LIFE.lastActive = S.t; S.nextFidget = S.t + 3;
      IDS.forEach((id) => { props[id].flash = 0; props[id].dy = 0; });
      /* the pocket is the bundle on its back: each thing on the desk lights up, its slip shows on it, and the slip is sucked in, one after another */
      crabRoot.updateMatrixWorld(true); parcelNode.getWorldPosition(pw); const to = scr(pw); const mw = 16 * +chipK();
      for (const ch of chips) {
        const st = ch.el.style; if (tau < ch.at) continue;
        if (!ch.took) { ch.took = true; if (ch.take) html.classList.add(ch.take); }
        const p0 = seg(tau, ch.at, ch.at + K.show), u = seg(tau, ch.at + K.show, ch.at + K.show + K.fly);
        if (ch.prop) { ch.prop.flash = tau < ch.at + K.show + 0.12 ? 1 : 0; ch.prop.dy = 0.05 * Math.max(0, ring(tau - ch.at, 10, 5)); }
        if (u >= 1) { st.visibility = 'hidden'; continue; }
        const at0 = `translate3d(${(ch.from[0] - ch.w / 2).toFixed(1)}px,${(ch.from[1] - ch.h / 2).toFixed(1)}px,0) `;
        st.visibility = 'visible';
        if (u <= 0) { st.opacity = Math.min(1, p0 * 2).toFixed(3); st.transform = at0 + `scale(${lerp(0.6, 1, outBack(p0)).toFixed(4)})`; }
        else { st.opacity = suckFade(u).toFixed(3); st.transform = at0 + quadMatrix(ch.w, ch.h, suck(ch.w, ch.h, to[0] - ch.from[0], to[1] - ch.from[1], u, mw, 0, 110 * +chipK())); }
      }
      const j = seg(tau, K.jump[0], K.jump[1]);
      crabRoot.position.copy(home); crabRoot.position.y = 6.2 * Math.pow(j, 1.7);        // off the desk, faster and faster
      if (tau >= K.end && !gone) { gone = true; crabRoot.visible = false; chips.forEach((ch) => ch.el.remove()); done(); }
    },
    post() {
      const sq = outCubic(seg(tau, K.squat[0], K.squat[1])), j = seg(tau, K.jump[0], K.jump[1]);
      let got = ring(tau - K.bundle, 13, 5); for (const ch of chips) got += 0.7 * Math.max(0, ring(tau - ch.inAt, 16, 6));   // it lands on its back, and bulges at every swallow
      let sy = 1 - 0.06 * got - 0.26 * sq * (1 - seg(j, 0, 0.12)), sx = 1 + 0.05 * got + 0.16 * sq * (1 - seg(j, 0, 0.12));
      if (j > 0) { const st = Math.sin(Math.PI * Math.min(1, j * 2)); sy += 0.22 * st; sx -= 0.1 * st; }
      squash.scale.x *= sx; squash.scale.y *= sy; squash.scale.z *= sx;
      bundle.visible = tau >= K.bundle && !gone; if (parcelPart) parcelPart.visible = !bundle.visible;
      if (bundle.visible) {
        crabRoot.updateMatrixWorld(true); parcelNode.getWorldPosition(bundle.position); squash.getWorldQuaternion(q); bundle.quaternion.copy(q);
        const born = lerp(0.5, 1, outBack(seg(tau, K.bundle, K.bundle + 0.16)));
        bundle.scale.set(R * born * (1 + 0.1 * got), R * born * (1 - 0.14 * got), R * born * (1 + 0.1 * got));
      }
      return true;
    },
  };
}

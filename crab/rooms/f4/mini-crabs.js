/* Two little clay crabs on the 3D desk, wearing the social links on their chests (2026-11-12, Thomas: 社群小螃蟹要像真的在書桌上).
   They are the desk crab itself, cloned and shrunk (same clay, same moves), each with the account printed on its chest.
   They scuttle sideways along the front of the desk, stop and look about; pointing at one turns it to you, it waves and
   names the account; clicking opens the account in a new tab. Only on the live desk in the wide layout: on phones, the
   poster and the plain page, social-crabs.js shows pictures of the same crabs instead (it hides its strip while these run).
   Needs window.__f2 from study.js; touches nothing in it. */
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const SOCIALS = [
  { id: 'ig', label: 'IG', name: 'Instagram', handle: '@paradigmai_tw', href: 'https://www.instagram.com/paradigmai_tw/', flag: '#FF6B57' },
  { id: 'threads', label: 'Threads', name: 'Threads', handle: '@paradigmai_tw', href: 'https://www.threads.com/@paradigmai_tw', flag: '#3A2E5C' },
];
const html = document.documentElement;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MINI = 0.27;                         // of the desk crab's size

function waitFor(test, ms = 25000) {
  return new Promise((ok, no) => { const t0 = performance.now(); (function poll() { const v = test(); if (v) ok(v); else if (performance.now() - t0 > ms) no(new Error('timeout')); else setTimeout(poll, 250); })(); });
}

function badgeTexture(s) {          // the name printed on its chest: a cream patch with the account name
  const c = document.createElement('canvas'); c.width = 512; c.height = 192; const g = c.getContext('2d');
  const r = 60; g.fillStyle = '#FFF4E0';
  g.beginPath(); g.moveTo(r, 8); g.arcTo(504, 8, 504, 184, r); g.arcTo(504, 184, 8, 184, r); g.arcTo(8, 184, 8, 8, r); g.arcTo(8, 8, 504, 8, r); g.closePath(); g.fill();
  g.fillStyle = '#3A2E5C'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `600 ${s.label.length > 3 ? 104 : 124}px Outfit, "Huninn", system-ui, sans-serif`;
  g.fillText(s.label, 256, 104);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

async function main() {
  const f2 = await waitFor(() => window.__f2 && window.__f2.acts && window.__f2.acts.idle && html.classList.contains('is-3d') && window.__f2);
  const { scene, camera, acts, S } = f2;
  const canvas = f2.canvas || document.querySelector('#view canvas');
  const src = acts.idle.getMixer().getRoot();          // the desk crab's model (clay already on it)
  const clipOf = (n) => acts[n] && acts[n].getClip();

  const label = document.createElement('a');           // the account name over the crab you point at (also the keyboard way in: social-crabs.js keeps its links)
  label.className = 'mc-label'; label.target = '_blank'; label.rel = 'noopener'; label.tabIndex = -1;
  document.body.appendChild(label);

  const crabs = SOCIALS.map((s, i) => {
    const root = new THREE.Group(); root.name = 'mini-crab-' + s.id;
    const body = new THREE.Group(); root.add(body);       // bob and hop
    const turn = new THREE.Group(); body.add(turn);       // which way it looks
    const model = cloneSkinned(src); model.position.set(0, 0, 0); model.rotation.set(0, 0, 0);
    // the copy keeps whatever pose the desk crab was in (squashed, mid-hop): put every bone back to its resting pose
    model.traverse((o) => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.pose(); });
    model.scale.copy(src.scale);
    const holder = new THREE.Group(); holder.scale.setScalar(MINI); holder.add(model); turn.add(holder);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    // how big it ended up, for the flag and the hit box
    root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(holder); const size = box.getSize(new THREE.Vector3());
    // the account name on its chest (Thomas: a flag looked odd): find the front of the body just under the eyes, stick a patch there
    const probe = new THREE.Raycaster(); const chestY = box.min.y + size.y * 0.29; let front = box.max.z;
    probe.set(new THREE.Vector3(0, chestY, box.max.z + 1), new THREE.Vector3(0, 0, -1));
    const hitFront = probe.intersectObject(holder, true)[0]; if (hitFront) front = hitFront.point.z;
    const bw = size.x * 0.4, badge = new THREE.Mesh(new THREE.PlaneGeometry(bw, bw * 0.375), new THREE.MeshStandardMaterial({ map: badgeTexture(s), transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }));
    badge.position.set(0, chestY, front + size.z * 0.012); turn.add(badge);
    // its own small warm light from the front, so it is not lost in the dark at the edge of the desk
    const glow = new THREE.PointLight(0xffd9a8, 1.6, size.y * 5, 2); glow.position.set(0, size.y * 1.4, size.z * 1.6); turn.add(glow);
    // what the pointer hits: a box round the crab and its flag (drawn nowhere)
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x * 1.1, size.y * 1.3, size.z * 1.3), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, size.y * 0.6, 0); hit.userData.mini = i; root.add(hit);
    scene.add(root);
    const mixer = new THREE.AnimationMixer(model); const a = {};
    ['idle', 'legs_tap', 'wave_R', 'wave_L', 'blink', 'eyes_wide', 'shift_L', 'shift_R', 'hop'].forEach((n) => {
      const c = clipOf(n); if (!c) return; const act = mixer.clipAction(c); a[n] = act;
      if (n === 'idle') act.play(); else { act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = false; }
    });
    return { s, root, body, turn, badge, glow, hit, mixer, a, size, x: 0, to: 0, speed: 0, wait: 0.6 + i * 0.9, held: false, face: 0, phase: Math.random() * 6 };
  });
  const play = (c, n, speed = 1) => { const act = c.a[n]; if (!act) return; act.reset(); act.setEffectiveTimeScale(speed); act.setEffectiveWeight(1); act.play(); };

  /* where they live (Thomas, 11/12: 「社群小螃蟹要在大 crab 附近，偶爾跟牠有互動」): one on each side of the big crab, a little in front,
     pacing a short beat; when the big crab walks off to something on the desk, they trot after it */
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  const big = new THREE.Vector3(), anchor = new THREE.Vector3(), tmp = new THREE.Vector3(), camXZ = new THREE.Vector3();
  let bigW = 0, anchorSet = false;
  const bigBox = new THREE.Box3();
  function measureBig() { bigBox.setFromObject(src); const w = bigBox.max.x - bigBox.min.x; if (w > 0.2 && w < 6) bigW = w; }
  const BIG_MOVES = ['wave_L', 'wave_R', 'hop', 'sorry', 'shell_puff', 'eyes_wide', 'legs_tap', 'parcel_wiggle', 'lean_bubbles', 'wiggle', 'intro', 'shift_L', 'shift_R'];
  const bigBusy = () => BIG_MOVES.some((n) => acts[n] && acts[n].isRunning());
  const bigPlay = (n) => { const x = acts[n]; if (!x || x.isRunning()) return; x.reset(); x.timeScale = 1; x.setEffectiveWeight(1); x.play(); };   // the same as study.js play()

  /* who is on: the live desk, not while the crab packs up, the big map is open, or the poster is all there is */
  const active = () => html.classList.contains('is-3d') && !html.classList.contains('pk-leaving') && !html.dataset.arrive && !html.classList.contains('has-map') && S.introDone && bigW > 0;
  let shown = null;
  function setShown(on) {
    if (on === shown) return; shown = on;
    crabs.forEach((c) => { c.root.visible = on; });
    if (window.__socialLane) window.__socialLane.hide(on);      // the flat crabs step aside while the clay ones are out
    if (!on) setHeld(null);
  }

  /* pointing and clicking (before study.js sees it, so the desk does not also react) */
  let held = null, downOn = null;
  function miniAt(e) {
    if (!shown) return null; const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
    v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera);
    const h = ray.intersectObjects(crabs.map((c) => c.hit), false)[0]; return h ? crabs[h.object.userData.mini] : null;
  }
  function setHeld(c) {
    if (held === c) return;
    if (held) held.held = false;
    held = c; canvas.style.cursor = c ? 'pointer' : '';
    if (c) { c.held = true; play(c, Math.random() < 0.5 ? 'wave_R' : 'wave_L'); label.textContent = `${c.s.name}　${c.s.handle}`; label.href = c.s.href; label.classList.add('on'); }
    else label.classList.remove('on');
  }
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; setHeld(miniAt(e)); }, true);
  addEventListener('pointerdown', (e) => { const c = miniAt(e); downOn = c; if (c) { e.stopPropagation(); } }, true);
  addEventListener('pointerup', (e) => {
    const c = miniAt(e); const was = downOn; downOn = null;
    if (c && c === was) { e.stopPropagation(); play(c, 'hop'); window.open(c.s.href, '_blank', 'noopener'); }
    else if (was) e.stopPropagation();
  }, true);

  /* moving */
  const rnd = (a, b) => a + Math.random() * (b - a);
  crabs.forEach((c, i) => { c.side = i === 0 ? -1 : 1; c.off = rnd(-0.6, 0.6); c.to = c.off; c.mode = 'roam'; c.t = 0; });
  // its spot beside the big crab (off = -1..1 inside that spot)
  function home(c, off, out) {
    const m = c.size.x;
    if (S.layout === 'tall') return out.set(anchor.x + c.side * (bigW * 0.24 + off * m * 0.3), 0, anchor.z + bigW * 0.5 + off * m * 0.15);   // phones: the big crab fills the width, so in front of its feet
    return out.set(anchor.x + c.side * (bigW * 0.62 + m * 0.75 + off * m * 0.8), 0, anchor.z + bigW * 0.22 + off * m * 0.25);
  }
  // in front of the big crab, to say hello
  const greetSpot = (c, out) => out.set(anchor.x + c.side * c.size.x * 0.75, 0, anchor.z + bigW * 0.62);

  /* now and then (every 20 to 40 seconds), only when nothing else is going on: say hello, or copy what the big crab does */
  let nextShow = performance.now() + rnd(14000, 22000), lastKind = 'mimic', lastCopy = 0;
  const calm = () => S.introDone && !S.busy && !S.walk && !S.focus && !S.celebrating && !(window.F4 && window.F4.card) && !held && S.t - (S.lastInteract || -99) > 4 && !bigBusy();
  function copyBig(n, why) {           // both little ones do what the big one just did, a beat apart
    lastCopy = performance.now();
    crabs.forEach((c, i) => { if (c.mode === 'roam' && !c.held) setTimeout(() => play(c, n), 380 + i * 240); });
  }
  function startShow(now) {
    const kind = lastKind === 'greet' ? 'mimic' : 'greet'; lastKind = kind;
    if (kind === 'greet') {
      const c = crabs[Math.random() < 0.5 ? 0 : 1]; c.mode = 'greet'; c.t = 0;
    } else {
      const n = ['hop', 'wave_R', 'wave_L', 'shell_puff'][Math.floor(Math.random() * 4)];
      bigPlay(n); copyBig(n, 'show');
    }
    nextShow = now + rnd(20000, 40000);
  }
  // the big crab's own moves (hover, poke, idle life): sometimes the little ones join in
  const wasRunning = {};
  function watchBig(now) {
    ['hop', 'wave_R', 'wave_L', 'shell_puff', 'wiggle'].forEach((n) => {
      const r = !!(acts[n] && acts[n].isRunning());
      if (r && !wasRunning[n] && now - lastCopy > 12000 && Math.random() < 0.35) copyBig(n, 'join');
      wasRunning[n] = r;
    });
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!bigW && S.introDone && !S.walk) measureBig();
    src.getWorldPosition(big); big.y = 0;
    if (!anchorSet) { anchor.copy(big); anchorSet = true; }
    else anchor.lerp(big, 1 - Math.exp(-dt * 2.2));          // they follow the big crab, a little behind
    setShown(active());
    if (shown) {
      camera.getWorldPosition(camXZ);
      if (!REDUCED && now > nextShow) { if (calm()) startShow(now); else nextShow = now + 3000; }
      if (!REDUCED) watchBig(now);
      crabs.forEach((c) => {
        let goal = tmp;
        if (c.mode === 'greet') {
          c.t += dt; greetSpot(c, goal);
          if (c.t > 0.2 && c.root.position.distanceTo(goal) < 0.03 && !c.said) {   // arrived: hop; the big crab looks, then waves back
            c.said = true; play(c, 'hop'); bigPlay('eyes_wide');
            setTimeout(() => bigPlay(c.side < 0 ? 'wave_L' : 'wave_R'), 420);
            setTimeout(() => { c.mode = 'roam'; c.said = false; c.off = c.to = rnd(-0.5, 0.5); }, 2000);
          }
          if (c.t > 8 || !calm() && c.t > 0.5 && (S.busy || S.walk || S.focus)) { c.mode = 'roam'; c.said = false; }
        } else {
          if (!c.held && !REDUCED) {
            if (c.wait > 0) { c.wait -= dt; if (c.wait <= 0) { c.to = rnd(-1, 1); c.speed = rnd(0.5, 0.8); } }
            else if (Math.abs(c.to - c.off) < 0.02) { c.off = c.to; c.wait = rnd(1.6, 4.2); const r = Math.random(); if (r < 0.25) play(c, 'blink'); else if (r < 0.4) play(c, Math.random() < 0.5 ? 'shift_L' : 'shift_R'); }
            else c.off += Math.sign(c.to - c.off) * Math.min(Math.abs(c.to - c.off), c.speed * dt);
          }
          home(c, c.off, goal);
        }
        // step toward the goal (fast enough to keep up when the big crab walks away)
        const p = c.root.position; const dx = goal.x - p.x, dz = goal.z - p.z; const dist = Math.hypot(dx, dz);
        const speed = c.mode === 'greet' ? c.size.x * 2.2 : Math.max(c.size.x * 1.4, dist * 2.4);
        const walking = dist > 0.004 && !c.held;
        if (walking) { const k = Math.min(1, speed * dt / dist); p.x += dx * k; p.z += dz * k; c.face = Math.sign(dx) || c.face; }
        c.phase += dt * (walking ? 14 : 2);
        c.body.position.y = walking ? Math.abs(Math.sin(c.phase)) * c.size.y * 0.09 : 0;
        c.body.rotation.z = walking ? -c.face * 0.07 + Math.sin(c.phase) * 0.03 : 0;
        if (walking && c.a.legs_tap && !c.a.legs_tap.isRunning()) play(c, 'legs_tap', 2.2);
        // facing: you, or the big crab while saying hello
        const lookAt = c.mode === 'greet' && c.said ? anchor : camXZ;
        const yaw = Math.atan2(lookAt.x - p.x, lookAt.z - p.z) + (walking ? c.face * 0.18 : 0);
        c.turn.rotation.y += (yaw - c.turn.rotation.y) * Math.min(1, dt * 6);
        c.mixer.update(dt);
      });
      if (held) {   // the name rides above the crab you point at
        held.root.getWorldPosition(tmp); tmp.y += held.size.y * 1.6; tmp.project(camera);
        const r = canvas.getBoundingClientRect();
        label.style.transform = `translate(${(r.left + (tmp.x * 0.5 + 0.5) * r.width).toFixed(1)}px, ${(r.top + (-tmp.y * 0.5 + 0.5) * r.height).toFixed(1)}px) translate(-50%, -100%)`;
      }
    } else crabs.forEach((c) => { home(c, c.off, c.root.position); });   // out of sight: wait at their spots
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  /* for the plain page and phones: pictures of these same crabs, standing and mid-step (run once with puppeteer, src/mini-sprites.cjs) */
  function sprites(px = 240) {
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setSize(px, px, false); r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = f2.renderer.toneMapping; r.toneMappingExposure = f2.renderer.toneMappingExposure;
    const sc = new THREE.Scene(); sc.environment = scene.environment;
    sc.add(new THREE.HemisphereLight(0xfff1dc, 0x4a3a5c, 1.3));
    const key = new THREE.DirectionalLight(0xffe2b8, 2.4); key.position.set(-2, 4, 3); sc.add(key);
    const rim = new THREE.DirectionalLight(0xb8a8ff, 0.8); rim.position.set(3, 2, -3); sc.add(rim);
    const cam = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    const out = {};
    crabs.forEach((c) => {
      const keep = { p: c.root.position.clone(), parent: c.root.parent, by: c.body.position.y, bz: c.body.rotation.z, ty: c.turn.rotation.y, vis: c.root.visible };
      sc.add(c.root); c.root.position.set(0, 0, 0); c.turn.rotation.y = 0; c.root.visible = true; c.body.position.y = 0; c.body.rotation.z = 0; c.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(c.turn); const ctr = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3());
      const d = Math.max(sz.x, sz.y) * 0.56 / Math.tan(14 * Math.PI / 180);
      cam.position.set(ctr.x, ctr.y + d * 0.32, ctr.z + d); cam.lookAt(ctr.x, ctr.y - sz.y * 0.04, ctr.z);
      ['a', 'b'].forEach((k) => {
        c.mixer.stopAllAction(); c.a.idle.play();
        if (k === 'b' && c.a.legs_tap) { c.a.legs_tap.reset().play(); c.mixer.update(0.16); c.body.position.y = c.size.y * 0.08; c.body.rotation.z = -0.07; }
        else { c.mixer.update(0.001); c.body.position.y = 0; c.body.rotation.z = 0; }
        r.render(sc, cam); out[c.s.id + '-' + k] = r.domElement.toDataURL('image/png');
      });
      keep.parent.add(c.root); c.root.position.copy(keep.p); c.body.position.y = keep.by; c.body.rotation.z = keep.bz; c.turn.rotation.y = keep.ty; c.root.visible = keep.vis;
    });
    r.dispose(); return out;
  }
  window.__mini = { crabs, setShown, sprites, show: () => startShow(performance.now()), get anchor() { return anchor; }, get bigW() { return bigW; } };
}
main().catch((e) => console.info('[mini-crabs] staying flat:', e && e.message));

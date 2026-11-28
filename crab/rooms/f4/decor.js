/* 書桌佈置 v2（標竿版，2026-11-21；Thomas：質感要好很多、更 sophisticated）
   Finish lessons, earn tokens, spend them on things for the desk.
   - 佈置模式: the page's words step back, the chair leans toward the window, a tray of things comes up along the bottom.
     Every card is a small turning 3D picture (decor-view.js); pointing at one shows a pale copy of it where it would go.
   - 兌換: the crab's own gift box shakes, the thing pops out and turns in the lamplight just above it (close to the chair, so
     you can see how it is made), then flies to its place; the chair follows it there for a look, and comes back.
   - On the desk the things answer the hand: the globe can be spun, the lights change their pattern when clicked.
   Everything about the things themselves is in decor/catalog.json (format: decor/README.md).
   Needs window.__f2 (study.js) and window.F4 (app.js). Only on the live desk. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { sources, markVisit } from './coins.js';
import { mountJournal } from './journal.js';
import { SHARE, STYLES, stats, compose, shareText as shareTextOf, fileOf, CAN_SHARE, download } from './share-card.js';

const html = document.documentElement;
const Q = new URLSearchParams(location.search);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY = 'paradigm.decor';
const DEV = /^(localhost|127\.|\[::1\]|.*\.localhost$)/.test(location.hostname);   // ?coins= and ?decorslow= are for us, on our own machines only
const KEEP = !Q.has('fresh') || Q.has('keep');
/* 開發者模式（Thomas，2026-11-21）：網址加 ?dev=paradigm 打開，之後這個瀏覽器一直是開的（線上也可以）；?dev=off 或擺飾架上的「關閉」關掉。
   開著時代幣固定 9999，擺飾架多一排「清空擺飾／關閉」。這不是保密機制，知道暗號的人都能開；代幣本來就只存在自己的瀏覽器裡。 */
const DEV_KEY = 'paradigm.decor.dev';
/* 上線前要改回 false（Thomas，2026-11-21：「之後都先開這個，上線前再換回去」）。true ＝ 每個人一打開就是開發者模式，除非自己關掉。 */
const DEV_DEFAULT = true;
try { if (Q.get('dev') === 'paradigm') localStorage.setItem(DEV_KEY, '1'); else if (Q.get('dev') === 'off') localStorage.setItem(DEV_KEY, '0'); } catch (e) { /* private mode */ }
let DEVMODE = DEV_DEFAULT; try { const v = localStorage.getItem(DEV_KEY); DEVMODE = v === '1' || (v !== '0' && DEV_DEFAULT); } catch (e) { DEVMODE = DEV_DEFAULT; }          // same rule as app.js: ?fresh never writes into the visitor's saved progress
const V3 = THREE.Vector3, lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp, rad = THREE.MathUtils.degToRad;
const now = () => performance.now() / 1000;
const easeIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const backOut = (u) => 1 + 2.4 * Math.pow(u - 1, 3) + 1.4 * Math.pow(u - 1, 2);
const linear = (u) => u;

function waitFor(test, ms = 25000) {
  return new Promise((ok, no) => { const t0 = performance.now(); (function poll() { const v = test(); if (v) ok(v); else if (performance.now() - t0 > ms) no(new Error('timeout')); else setTimeout(poll, 250); })(); });
}

/* ------------------------------------------------------------------ what you own (this browser only) */
function load() {
  let s = {}; try { if (KEEP) s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
  return { owned: Array.isArray(s.owned) ? s.owned : [], placed: s.placed && typeof s.placed === 'object' ? s.placed : {}, seen: +s.seen || 0, paid: Array.isArray(s.paid) ? s.paid : [], kept: Array.isArray(s.kept) ? s.kept : [] };   // paid ＝ 螃蟹已經交給你的那幾筆（coins.js 的 key）
}
const mine = load();
const save = () => { if (acct() !== 'off') return acctSave(); try { if (KEEP) localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) { /* private mode */ } };   // 帳號（2026-11-24）：登入或訪客走 acctSave
/* 帳號（2026-11-24）：登入以後餘額、兌換、擺了什麼聽帳號（PD_ACCOUNT）的；沒有帳號功能（'off'）時上面照舊 */
const acct = () => { const A = window.PD_ACCOUNT; return !A || A.status === 'off' ? 'off' : A.status === 'in' ? 'in' : 'guest'; };
const arr = (v) => (Array.isArray(v) ? v.slice() : []);
const local = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return s && typeof s === 'object' && !Array.isArray(s) ? s : {}; } catch (e) { return {}; } };
const putLocal = (part) => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(local(), part))); } catch (e) { /* private mode */ } };   // 只改給的那幾欄，其他照留
let acctSent = '', acctFlying = 0;                     // 上次送出去的擺放；還沒回來的 savePlaced 有幾個
function acctMine(byId, slots) {                       // 登入：擺飾照伺服器的，paid 照舊看這台；訪客：沒有兌換來的東西，紀念品看這台
  const A = window.PD_ACCOUNT, on = acct() === 'in', d = (on && A.decor) || {}, s = local();
  mine.owned = arr(d.owned).filter((id) => byId[id]); mine.placed = {};
  Object.entries(d.placed || {}).forEach(([slot, id]) => { if (slots[slot] && mine.owned.includes(id)) mine.placed[slot] = id; });
  mine.seen = on ? +d.seen || 0 : +s.seen || 0; mine.kept = on ? arr(d.kept) : arr(s.kept); mine.paid = arr(s.paid);
  acctSent = JSON.stringify([mine.placed, mine.seen, mine.kept]);
}
function acctSave() {                                  // 代替 save()：擺放送伺服器（不等它），paid 只寫這台再請 account.js 對一次
  const A = window.PD_ACCOUNT;
  if (acct() === 'guest') { putLocal({ kept: mine.kept }); return; }       // 訪客只會改到紀念品
  if (JSON.stringify(arr(local().paid)) !== JSON.stringify(mine.paid)) { putLocal({ paid: mine.paid }); A.syncNow(); }
  const sig = JSON.stringify([mine.placed, mine.seen, mine.kept]); if (sig === acctSent) return;
  acctSent = sig; acctFlying++;
  A.savePlaced(mine.placed, mine.seen, mine.kept).then((r) => { if (!r || !r.ok) acctSent = ''; }, () => { acctSent = ''; }).then(() => { acctFlying--; });
}

async function main() {
  const [f2, cat] = await Promise.all([
    waitFor(() => window.__f2 && window.__f2.acts && window.__f2.crabRoot && html.classList.contains('is-3d') && window.__f2),
    fetch('decor/catalog.json').then((r) => r.json()),
  ]);
  const F4 = window.F4; const { scene, camera, S, L, acts, crabRoot } = f2;
  const canvas = f2.canvas || document.querySelector('#view canvas');
  const items = cat.items, byId = Object.fromEntries(items.map((i) => [i.id, i]));
  /* 帳號（2026-11-24）：開頁面時已經登入或是訪客，先換成帳號那邊的擺飾；餘額怎麼算、開發者模式只在 'off' */
  if (acct() !== 'off') acctMine(byId, cat.slots);
  let acctWas = acct(), acctReady = acct() !== 'in', acctRedeeming = false;     // acctReady：登入後第一次對完才發幣
  const devOn = () => DEVMODE && acct() === 'off';
  const acctBalance = () => { const c = window.PD_ACCOUNT.coins; return c && c.balance === null ? Infinity : Math.max(0, +(c && c.balance) || 0); };   // null ＝ 團隊帳號，無限
  const num = (n) => (n === Infinity ? '無限' : n);
  mine.owned = mine.owned.filter((id) => byId[id]);
  Object.keys(mine.placed).forEach((slot) => { if (!cat.slots[slot] || !mine.owned.includes(mine.placed[slot])) delete mine.placed[slot]; });

  /* tokens: only lessons finished on a lesson page count (pd-done), not the ones ticked as "already know" in 程度評估 */
  const lessonsDone = () => { let d = []; try { d = JSON.parse(localStorage.getItem('pd-done') || '[]'); } catch (e) { d = []; } return new Set(d.filter((id) => !F4 || !F4.byId || F4.byId[id])).size; };
  /* 2026-11-23：代幣的來源改由 coins.js 一筆一筆列出來（完成一課、測驗全對、讀完一章、60 秒體驗、連續回來） */
  markVisit(KEEP);
  const allSources = () => sources(cat.currency, { has: (id) => !F4 || !F4.byId || !!F4.byId[id], firstTask: !!(F4 && F4.state.done && F4.state.done.t1), keep: KEEP });
  /* 帳號（2026-11-24）：下面四行外面多包一層：訪客不發幣；登入時只發伺服器收下的（acctUnpaid），花掉的和餘額看伺服器 */
  const unpaid = () => (acct() === 'guest' || !acctReady ? [] : acct() === 'in' ? acctUnpaid() : allSources().filter((x) => !mine.paid.includes(x.key)));
  const earned = () => (acct() !== 'off' ? allSources().reduce((n, x) => n + x.n, 0) : DEVMODE ? 9999 : DEV && Q.has('coins') ? +Q.get('coins') || 0 : allSources().reduce((n, x) => n + x.n, 0));
  const spent = () => (acct() === 'in' ? +((window.PD_ACCOUNT.coins || {}).spent) || 0 : mine.owned.reduce((n, id) => n + byId[id].price, 0));
  const balance = () => (acct() === 'in' ? acctBalance() : Math.max(0, earned() - spent()));
  /* 帳號（2026-11-24）：登入時只發伺服器也收下、還值代幣、伺服器也還沒記成給過的那幾筆（金額照伺服器的），結尾的餘額才對得上；
     這台有伺服器還不知道的，就請 account.js 對一次：同時只對一次，同一批 60 秒內不重問，對的時候先不發，沒對成功就等下次 */
  let acctSyncing = false; const acctAsked = new Map();
  function acctUnpaid() {
    const A = window.PD_ACCOUNT, have = new Map((A.earned || []).map((e) => [e.key, e]));
    const left = allSources().filter((x) => !mine.paid.includes(x.key)), unknown = left.filter((x) => !have.has(x.key));
    if (unknown.length && !acctSyncing && unknown.some((x) => !(Date.now() - (acctAsked.get(x.key) || 0) < 60000))) {
      acctSyncing = true; unknown.forEach((x) => acctAsked.set(x.key, Date.now()));
      A.syncNow().then(() => { acctSyncing = false; }, () => { acctSyncing = false; });
    }
    if (acctSyncing) return [];
    return left.filter((x) => { const e = have.get(x.key); return e && e.n > 0 && !e.paid; }).map((x) => ({ ...x, n: have.get(x.key).n }));
  }

  /* ------------------------------------------------------------------ small tools */
  let uiReady = false;                                   // the button exists (the first frame runs before it is made: a narrow window used to stop everything here)
  let decorating = false, hot = null, showing = false, wasWide = true;  // 佈置模式 on; the card you are looking at; a hand-over is playing
  let skip = false;                                     // a click or Esc during the hand-over: jump to the end of every step
  const SLOW = (DEV && +Q.get('decorslow')) || 1;                // ?decorslow=10 plays every hand-over ten times slower (for looking at it frame by frame)
  const anim = (dur, fn, ease = easeIO) => new Promise((ok) => {
    dur *= SLOW;
    if (REDUCED || skip) { fn(1, 1); ok(); return; }
    const t0 = now(); (function step() { const u = skip ? 1 : Math.min(1, (now() - t0) / dur); fn(ease(u), u); if (u < 1) requestAnimationFrame(step); else ok(); })();
  });
  const wait = (s) => anim(s, () => {});
  const softTex = (stops) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([p, col]) => r.addColorStop(p, col));
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const glowTex = softTex([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,.42)'], [1, 'rgba(255,255,255,0)']]);
  const ringTex = softTex([[0, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]);
  const sprite = (tex, color, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.scale.setScalar(size); s.raycast = () => {}; s.renderOrder = 4; return s; };

  // the chair: study.js blends from home to (focusPos, focusTarget) by S.push; with nothing focused those are ours to set
  const camDir = () => new V3().copy(S.home.pos).sub(S.home.target).normalize();
  function camTo(point, zoom) {
    S.focusTargetT.copy(point); S.focusPosT.copy(point).addScaledVector(camDir(), S.home.dist * zoom);
    if (S.push.x < 0.05) { S.focusPos.copy(S.focusPosT); S.focusTarget.copy(S.focusTargetT); }
    S.push.target = 1; S.dragYaw.target = 0; S.dragPitch.target = 0;
  }
  const camHome = () => { S.push.target = 0; };
  const DECOR_CAM = [new V3(1.35, 0.7, -0.9), 1.12];   // 佈置模式: lean toward the window, where most of the places are

  /* ------------------------------------------------------------------ the things */
  const loader = new GLTFLoader(); const files = new Map();
  const file = (it) => { if (!files.has(it.id)) files.set(it.id, loader.loadAsync('decor/' + it.file)); return files.get(it.id); };
  async function build(it) {
    const g = await file(it); const inner = g.scene.clone(true); inner.scale.setScalar(it.scale || 1);
    const root = new THREE.Group(); root.name = 'decor:' + it.id; root.add(inner);
    root.traverse((o) => { if (!o.isMesh) return; o.castShadow = !it.slot.startsWith('hang') && !o.material.transparent && !/spines|pebbles|petals|ink|ticks|paint|weed|pads|stems/.test(o.name); o.receiveShadow = !o.material.transparent; if (o.material.transparent) { o.material.depthWrite = false; o.renderOrder = 2; } });
    const box = new THREE.Box3().setFromObject(root); root.userData.size = box.getSize(new V3()); root.userData.mid = box.getCenter(new V3());
    return root;
  }
  // things that sit against the dark window need a little light of their own to keep their colour
  const selfLit = (o, k) => { if (!o || !o.isMesh || !o.material || !o.material.emissive) return; const m = o.material = own(o.material); m.emissive.copy(m.color).multiplyScalar(k); if (m.map) { m.emissiveMap = m.map; m.emissive.multiplyScalar(1.6); } };
  const own = (m) => { const c = m.clone(); c.userData.own = true; return c; };       // a copy this thing may change, and must free when it goes
  // a pool of light lying on a surface (additive, costs one draw; a real light would recompile every shader on the desk)
  const pool = (color, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); m.material.userData.own = true; m.userData.ownGeo = true; m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.raycast = () => {}; return m; };
  const free = (root) => root.traverse((o) => { const m = o.material; if (m && (m.userData.own || o.isSprite || o.isPoints)) m.dispose(); if (o.isPoints || o.userData.ownGeo) o.geometry.dispose(); });
  const SILL_Y = 1.05;
  const hitBox = (root) => { const s = root.userData.size, m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(s.x, 0.25), Math.max(s.y, 0.25), Math.max(s.z, 0.25)), new THREE.MeshBasicMaterial({ visible: false })); m.userData.ownGeo = true; m.position.copy(root.userData.mid); root.add(m); return m; };
  // small sounds, only ever in answer to a click on the thing itself
  let AC = null;
  const tone = (f, dur, gain = 0.035, type = 'sine', when = 0) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + when; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + dur); } catch (e) { /* no sound, no matter */ } };
  const chimeSound = () => { tone(2093, 1.6, 0.03); tone(3136, 1.1, 0.014); tone(4186, 0.7, 0.008, 'sine', 0.02); };
  const ding = () => { tone(1568, 0.9, 0.03); tone(3136, 0.5, 0.01); };
  const clack = () => { tone(150 + Math.random() * 60, 0.035, 0.03, 'square'); tone(900, 0.02, 0.008, 'square'); };
  const live = {};                                      // slot -> { id, it, root, b (behaviour), landAt, flying }
  const keepLive = [], extraHits = [];                  // 課程紀念品 on their stand; other things on the desk that answer a click

  const BEHAVE = {
    /* the bowl of ramen: three soft wisps rise from the broth and thin out (sprites, no light) */
    steam(root) {
      const wisps = [0, 1, 2].map((i) => { const w = sprite(glowTex, new THREE.Color('#FFF1DC'), 0.12); w.material.blending = THREE.NormalBlending; w.userData.ph = i / 3; root.add(w); return w; });
      const top = root.userData.size.y * 0.8;
      return { tick(t) { wisps.forEach((w, i) => { const u = (t * 0.33 + w.userData.ph) % 1; w.position.set(Math.sin(t * 0.9 + i * 2.1) * 0.02 + (i - 1) * 0.022, top + u * 0.26, Math.cos(t * 0.7 + i) * 0.015); w.scale.setScalar(0.07 + u * 0.13); w.material.opacity = (REDUCED ? 0.1 : 0.2) * Math.sin(u * Math.PI); }); } };
    },
    /* the string of lights: every bulb has its own filament; they breathe, hold steady or chase (click to change);
       one warm light really shines from them onto the frame, the sill and whatever stands there; brighter with the lamp off */
    twinkle(root, it) {
      const bulbs = [];
      root.traverse((o) => {
        if (!/^bulb_\d+/.test(o.name)) return;
        const fil = o.children.find((c) => /^fil_/.test(c.name)), glass = null;
        if (!fil) return;
        fil.material = own(fil.material);
        const halo = sprite(glowTex, fil.material.emissive.clone(), 0.52); halo.position.set(0, -0.078, 0); o.add(halo);
        bulbs.push({ o, fil, glass, halo, base: Math.min(fil.material.emissiveIntensity || 6, 7), gbase: glass ? glass.material.emissiveIntensity : 0, phase: bulbs.length * 1.7, rate: 0.9 + (bulbs.length * 0.37) % 0.6 });
      });
      bulbs.sort((a, b) => a.o.position.x - b.o.position.x);
      const glasses = []; root.traverse((o) => { if (/^glass_all/.test(o.name) && o.isMesh) { o.material = own(o.material); glasses.push({ o, base: o.material.emissiveIntensity }); } });
      const P = cat.slots[it.slot].pos;                   // the light it throws: one pool along the sill under it, one on the glass behind
      const onSill = pool(0xffc98a, root.userData.size.x * 1.12, 1.0); onSill.position.set(0, SILL_Y + 0.016 - P[1], -0.42); root.add(onSill);
      const onGlass = pool(0xffc98a, root.userData.size.x * 1.15, 1.5); onGlass.rotation.x = 0; onGlass.position.set(0, -0.32, -0.1); root.add(onGlass);
      const hit = hitBox(root);
      const MODES = [['breathe', '慢慢呼吸。'], ['chase', '一顆接一顆。'], ['steady', '全部亮著。']]; let mode = 0, lit = 0;
      return {
        hit, cursor: 'pointer',
        click() { mode = (mode + 1) % MODES.length; f2.say(MODES[mode][1], { hold: 1.8 }); },
        tick(t, age) {
          const dark = L && L.on === false ? 1.5 : 1; let sum = 0;
          bulbs.forEach((b, i) => {
            const on = REDUCED ? 1 : clamp((age - 0.25 - i * 0.075) / 0.2, 0, 1);              // lit left to right as it settles
            let k = 1;
            if (!REDUCED && MODES[mode][0] === 'breathe') k = 0.8 + 0.2 * Math.sin(t * b.rate + b.phase);
            else if (!REDUCED && MODES[mode][0] === 'chase') k = 0.35 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.6 - i * 0.62), 3);
            k *= on * dark; sum += k;
            b.fil.material.emissiveIntensity = b.base * k; b.halo.material.opacity = 0.34 * k;
          });
          lit = sum / Math.max(1, bulbs.length); onSill.material.opacity = 0.2 * lit; onGlass.material.opacity = 0.075 * lit; glasses.forEach((g) => { g.o.material.emissiveIntensity = g.base * (0.5 + lit); });
        },
      };
    },
    /* the globe: turns slowly on its tilted axis; a drag spins it and it coasts back down to its own pace */
    spin(root, it) {
      const ball = root.getObjectByName('globe_ball'); if (!ball) return null;
      ball.material = own(ball.material); ball.material.emissiveMap = ball.material.map; ball.material.emissive.setRGB(0.24, 0.225, 0.2); ball.material.envMapIntensity = 1.3;   // the sill is a dim corner
      ball.rotation.y = rad(it.face ?? 0);
      const BASE = 0.2; let vel = BASE + 7, last = 0;      // put down with a flick of the claw
      return {
        hit: ball, cursor: 'grab',
        drag(dx) { vel = clamp(vel * 0.4 + dx * 0.9, -14, 14); },
        click() { vel = Math.sign(vel || 1) * 9; },
        tick(t) { const dt = Math.min(0.05, t - last); last = t; if (REDUCED) return; vel = lerp(vel, BASE * Math.sign(vel || 1), 1 - Math.exp(-dt * 1.1)); ball.rotation.y += vel * dt; },
      };
    },

    /* the cactus: springs back when poked; its flower puffs up for a moment */
    wobble(root) {
      const sway = root.getObjectByName('cactus_sway') || root, flower = root.getObjectByName('cactus_flower');
      let ang = 0, vel = 0, puff = 0, last = 0;
      return {
        hit: hitBox(root), cursor: 'pointer',
        click() { vel += (Math.random() < 0.5 ? -1 : 1) * 4.2; puff = 1; },
        drag(dx) { vel += dx * 0.5; },
        tick(t) { const dt = Math.min(0.05, t - last); last = t; if (REDUCED) return; vel += (-70 * ang - 4.5 * vel) * dt; ang += vel * dt; sway.rotation.z = ang; sway.rotation.x = ang * 0.35; puff = Math.max(0, puff - dt * 1.4); if (flower) flower.scale.setScalar(1 + 0.45 * Math.sin(puff * Math.PI) ); },
      };
    },
    /* the candle: a flame that leans and gutters, lighting what is near it; click to blow it out or light it again */
    flame(root) {
      const fl = root.getObjectByName('candle_flame'), wax = root.getObjectByName('candle_wax'); if (!fl) return null;
      fl.material = own(fl.material); const base = Math.min(fl.material.emissiveIntensity || 8, 9);
      if (wax) { wax.material = own(wax.material); wax.material.emissive.setRGB(1, 0.62, 0.3); }
      const lamp = pool(0xffab5e, 1.5, 1.5); lamp.position.set(0, 0.014, 0); root.add(lamp);     // its light on the sill round it
      const halo = sprite(glowTex, 0xffb060, 0.62); halo.position.set(0, 0.04, 0); fl.add(halo);
      let lit = true, k = 0, last = 0;
      return {
        hit: hitBox(root), cursor: 'pointer',
        click() { lit = !lit; f2.say(lit ? '點著了。' : '呼——吹熄了。', { hold: 1.8 }); },
        tick(t, age) {
          const dt = Math.min(0.05, t - last); last = t; k = lerp(k, lit && age > 0.3 ? 1 : 0, 1 - Math.exp(-dt * 5));
          const f = REDUCED ? 1 : 0.86 + 0.09 * Math.sin(t * 11.3) + 0.05 * Math.sin(t * 23.7 + 1.3) + 0.04 * Math.sin(t * 5.1);
          fl.visible = k > 0.03; fl.scale.set(k * (0.9 + 0.1 * f), k * f * 1.08, k * (0.9 + 0.1 * f)); fl.rotation.z = REDUCED ? 0 : 0.12 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 7.7);
          fl.material.emissiveIntensity = base * f; halo.material.opacity = 0.5 * k * f; lamp.material.opacity = 0.34 * k * f; if (wax) wax.material.emissiveIntensity = 0.22 * k;
        },
      };
    },
    /* the lucky cat: its paw never stops beckoning; click and it gets keen */
    beckon(root) {
      const arm = root.getObjectByName('cat_arm'); if (!arm) return null; let keen = 0, ph = 0, last = 0;
      return {
        hit: hitBox(root), cursor: 'pointer',
        click() { keen = 1; f2.say('招、招、招。', { hold: 1.8 }); },
        tick(t) { const dt = Math.min(0.05, t - last); last = t; keen = Math.max(0, keen - dt / 3); ph += dt * (2.3 + keen * 6); arm.rotation.x = REDUCED ? 0.2 : 0.26 + 0.3 * Math.sin(ph); },
      };
    },
    /* the snow globe: shake it (click or drag) and the snow flies, swirls, and settles again */
    snow(root) {
      const g = root.getObjectByName('sg_glass'); if (!g) return null;
      g.geometry.computeBoundingSphere(); const R = g.geometry.boundingSphere.radius * 0.93, C = g.position.clone(), floor = C.y - R * 0.52;
      const N = 150, pos = new Float32Array(N * 3), vel = [], geo = new THREE.BufferGeometry();
      for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, r = R * 0.62 * Math.sqrt(Math.random()); pos.set([C.x + r * Math.cos(a), floor + Math.random() * 0.012, C.z + r * Math.sin(a)], i * 3); vel.push(new V3()); }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
      pts.frustumCulled = false; pts.raycast = () => {}; pts.renderOrder = 1; g.parent.add(pts); g.renderOrder = 3;
      let energy = 0, last = 0;
      const shake = (amt) => { energy = Math.min(1.2, energy + amt); for (let i = 0; i < N; i++) vel[i].set((Math.random() - 0.5) * 0.5, 0.25 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5).multiplyScalar(amt); };
      return {
        hit: g, cursor: 'pointer',
        click() { shake(1); }, drag(dx) { if (Math.abs(dx) > 0.25) shake(0.5); },
        tick(t, age) {
          const dt = Math.min(0.05, t - last); last = t; if (REDUCED) return; if (age > 0.2 && age < 0.3 && energy === 0) shake(0.8);
          energy = Math.max(0, energy - dt / 5);
          for (let i = 0; i < N; i++) {
            const v = vel[i], x = pos[i * 3] - C.x, y = pos[i * 3 + 1], z = pos[i * 3 + 2] - C.z;
            if (y <= floor && v.y <= 0) { v.set(0, 0, 0); continue; }
            v.y -= 0.34 * dt; v.x += (-z * 1.6 * energy - v.x * 1.8) * dt; v.z += (x * 1.6 * energy - v.z * 1.8) * dt; if (v.y < -0.075) v.y = -0.075;
            let nx = x + v.x * dt, ny = y + v.y * dt, nz = z + v.z * dt; const d = Math.hypot(nx, ny - C.y, nz);
            if (d > R && ny > floor) { const s = R / d; nx *= s; nz *= s; ny = C.y + (ny - C.y) * s; v.x *= -0.2; v.z *= -0.2; if (ny > C.y) v.y = Math.min(v.y, 0); }
            pos[i * 3] = C.x + nx; pos[i * 3 + 1] = Math.max(floor, ny); pos[i * 3 + 2] = C.z + nz;
          }
          geo.attributes.position.needsUpdate = true;
        },
      };
    },
    /* the wind bell: it and its paper strip sway in a draught; click for a gust, and it rings */
    chime(root) {
      const sw = root.getObjectByName('furin_swing'), cl = root.getObjectByName('furin_clapper'), pa = root.getObjectByName('furin_paper'); if (!sw) return null;
      let gust = 0, last = 0;
      return {
        hit: hitBox(root), cursor: 'pointer',
        click(quiet) { gust = 1; if (!quiet) { chimeSound(); f2.say('叮鈴——', { hold: 1.6 }); } },     // quiet: the crab's own nudge (use.*) never makes a sound nobody asked for
        tick(t) {
          const dt = Math.min(0.05, t - last); last = t; if (REDUCED) return; gust = Math.max(0, gust - dt / 3.5);
          const w = Math.sin(t * 0.9) + 0.5 * Math.sin(t * 2.3 + 1), w2 = Math.sin(t * 1.4 + 2) + 0.4 * Math.sin(t * 3.1), k = 1 + gust * 4;
          sw.rotation.z = 0.022 * w * k; sw.rotation.x = 0.016 * w2 * k;
          if (cl) { cl.rotation.z = 0.07 * Math.sin(t * 2.1 - 0.4) * k; cl.rotation.x = 0.05 * Math.sin(t * 1.7 + 1) * k; }
          if (pa) { pa.rotation.z = 0.16 * w * k; pa.rotation.y = 0.7 * Math.sin(t * 0.8) + gust * 2.4 * Math.sin(t * 6); }
        },
      };
    },
    /* the paper stars: each sways and turns on its thread; click for a breath of air */
    dangle(root) {
      const stars = []; root.traverse((o) => { if (/^star_\d+/.test(o.name)) stars.push({ o, paper: o.children.find((c) => /^paper_/.test(c.name)), ph: stars.length * 1.9, dir: stars.length % 2 ? 1 : -1 }); });
      stars.forEach((s) => selfLit(s.paper, 0.3));
      let gust = 0, last = 0;
      return {
        hit: hitBox(root), cursor: 'pointer',
        click() { gust = 1; },
        tick(t) {
          const dt = Math.min(0.05, t - last); last = t; if (REDUCED) return; gust = Math.max(0, gust - dt / 4);
          stars.forEach((s) => { s.o.rotation.z = (0.07 + gust * 0.22) * Math.sin(t * (1.0 + (s.ph % 0.5)) + s.ph); if (s.paper) s.paper.rotation.y += dt * s.dir * (0.35 + gust * 3.2); });
        },
      };
    },
    /* the fish bowl: two goldfish circle the weed, tails going; click to feed them and they dart about */
    swim(root) {
      const fish = [['fish', 0.125, 0.25, 0.55, 0], ['fish2', 0.1, 0.165, -0.7, 2.2]].map(([n, r, y, sp, a]) => ({ o: root.getObjectByName(n), tail: root.getObjectByName(n + '_tail'), r, y, sp, a })).filter((f) => f.o);
      if (!fish.length) return null; let keen = 0, last = 0;
      fish.forEach((f) => f.o.traverse((o) => { if (o.isMesh && !/eye/.test(o.material.name)) selfLit(o, 0.32); }));
      root.traverse((o) => { if (!o.isMesh) return; if (/^fb_water/.test(o.name)) { selfLit(o, 0.4); o.material.opacity = 0.4; } else if (/^fb_(pebbles|weed)/.test(o.name)) selfLit(o, 0.22); });   // the corner of the desk it stands in is dim
      return {
        hit: root.getObjectByName('fb_glass') || hitBox(root), cursor: 'pointer',
        click() { keen = 1; f2.say('開飯了。', { hold: 1.6 }); },
        tick(t) {
          const dt = Math.min(0.05, t - last); last = t; if (REDUCED) return; keen = Math.max(0, keen - dt / 3);
          fish.forEach((f, i) => {
            const sp = f.sp * (1 + keen * 2.6); f.a += dt * sp; const a = f.a, dir = Math.sign(sp);
            f.o.position.set(f.r * Math.cos(a), f.y + 0.028 * Math.sin(a * 2.3 + i) + keen * 0.05 * (i ? 1 : 0.4), -f.r * 0.8 * Math.sin(a));
            f.o.rotation.y = Math.atan2(0.8 * Math.cos(a) * dir, -Math.sin(a) * dir); f.o.rotation.z = 0.12 * Math.sin(a * 2.3 + i + 1.2);
            if (f.tail) f.tail.rotation.y = 0.55 * Math.sin(t * (8 + keen * 9) + i);
          });
        },
      };
    },
    /* the typewriter: click and it types a few letters, the carriage stepping along; at the end of the line, the bell and the return */
    type(root) {
      const car = root.getObjectByName('tw_carriage'), paper = root.getObjectByName('tw_paper'); if (!car) return null;
      const x0 = car.position.x; let mute = false, col = 5, left = 0, next = 0, back = -1, feed = 0, tgt = x0 + (7 - col) * 0.02;
      car.position.x = tgt;
      return {
        hit: hitBox(root), cursor: 'pointer',
        click(quiet) { if (back < 0) left += 5; mute = !!quiet; },
        tick(t) {
          if (back >= 0) { const u = Math.min(1, (t - back) / 0.42); car.position.x = lerp(car.userData.from, x0 + 7 * 0.02, easeIO(u)); if (paper) paper.position.y = feed + 0.014 * easeOut(u); if (u >= 1) { back = -1; col = 0; feed += 0.014; if (feed > 0.06) feed = 0; tgt = car.position.x; } return; }
          if (left > 0 && t >= next) {
            left--; col++; next = t + 0.1 + Math.random() * 0.07; tgt = x0 + (7 - col) * 0.02; if (!mute) clack();
            if (col >= 14) { left = 0; back = t + 0.12; car.userData.from = tgt; if (!mute) { ding(); f2.say('叮！換行。', { hold: 1.4 }); } }
          }
          car.position.x = lerp(car.position.x, tgt, 0.45);
        },
      };
    },
  };

  function settle(entry) {                               // it is in its place now: start whatever it does
    const it = entry.it, slot = cat.slots[it.slot];
    entry.root.position.fromArray(slot.pos); entry.root.rotation.set(0, rad(slot.rotY || 0), 0); entry.root.scale.setScalar(1);
    entry.flying = false; entry.landAt = now(); if (!entry.b) { entry.b = BEHAVE[it.behave] ? BEHAVE[it.behave](entry.root, it) : null; entry.bornAt = now(); }
  }
  async function mount(id) {                             // there already when the page opens: no ceremony
    const it = byId[id]; if (!it || !it.ready) return;
    if (cat.slots[it.slot].wear) { const e = { id, it, root: null, wear: true, sway: [] }; live[it.slot] = e; const parts = await dress(it); if (live[it.slot] !== e) { undress(parts); return; } Object.assign(e, parts); return; }
    const entry = { id, it, root: null, b: null, landAt: 0, flying: true }; live[it.slot] = entry;
    const root = await build(it); if (live[it.slot] !== entry) return;
    entry.root = root; scene.add(root); settle(entry); entry.landAt = -99; entry.bornAt = -99;
  }
  function remove(slot) { const e = live[slot]; if (!e) return; delete live[slot]; if (e.root) { scene.remove(e.root); free(e.root); } }

  /* ---------------- the hand-over */
  const model = acts.idle.getMixer().getRoot(); let giftNode = null;
  model.traverse((o) => { if (!giftNode && /gift|parcel|present/i.test(o.name)) giftNode = o; });
  const giftPos = (out) => (giftNode ? giftNode.getWorldPosition(out).add(tmp.set(0, 0.12, 0)) : out.copy(crabRoot.position).add(tmp.set(0.3, 1.82, 0.05)));
  const tmp = new V3();
  const glow = sprite(glowTex, 0xffd9a0, 2.6); scene.add(glow);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, color: 0xffdca8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  ring.rotation.x = -Math.PI / 2; ring.renderOrder = 3; ring.raycast = () => {}; scene.add(ring);
  // a puff of paper bits from the gift box
  const BITS = 30, bitsGeo = new THREE.BufferGeometry(), bitsPos = new Float32Array(BITS * 3), bitsCol = new Float32Array(BITS * 3), bitsVel = [];
  const PAL = [new THREE.Color(0xffc857), new THREE.Color(0xff6b57), new THREE.Color(0xfff4e0), new THREE.Color(0xc9b6f2)];
  for (let i = 0; i < BITS; i++) { const c = PAL[i % PAL.length]; bitsCol.set([c.r, c.g, c.b], i * 3); bitsVel.push(new V3()); }
  bitsGeo.setAttribute('position', new THREE.BufferAttribute(bitsPos, 3)); bitsGeo.setAttribute('color', new THREE.BufferAttribute(bitsCol, 3));
  const bits = new THREE.Points(bitsGeo, new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true }));
  bits.frustumCulled = false; bits.raycast = () => {}; scene.add(bits); let bitsAt = -99;
  function burst(p) {
    if (REDUCED) return; bitsAt = now();
    for (let i = 0; i < BITS; i++) { bitsPos.set([p.x, p.y, p.z], i * 3); const a = Math.random() * 6.283, s = 0.6 + Math.random() * 1.1; bitsVel[i].set(Math.cos(a) * s * 0.7, 1.6 + Math.random() * 1.8, Math.sin(a) * s * 0.7); }
  }

  /* ---------------- 螃蟹的衣服 (2026-11-21): things the crab wears instead of things on the desk.
     A garment's glb is a skinned mesh made round the crab's own shell, with the same bone names (src/decor/wear_common.py).
     Here it is bound to the live crab's bones, so it squashes, puffs and leans with every move the crab makes.
     Loose ends (a scarf's tails) are nodes named sway:<bone>:<name>; they are hung on that bone and swing behind its motion. */
  let shellMesh = null; model.traverse((o) => { if (!shellMesh && o.isSkinnedMesh && /shell/.test(o.userData.name || o.name)) shellMesh = o; });
  async function dress(it) {
    const g = await file(it); const src = cloneSkinned(g.scene); src.updateMatrixWorld(true);
    const at = {}; shellMesh.skeleton.bones.forEach((b, i) => { at[b.name] = i; });
    const meshes = [], sway = [];
    src.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o); else if (/^sway:/.test(o.userData.name || o.name)) sway.push(o); });
    meshes.forEach((m) => {
      const names = m.skeleton.bones.map((b) => b.name), ok = names.every((n) => n in at);
      if (!ok) { console.info('[decor] garment bones do not match the crab:', names.filter((n) => !(n in at))); return; }
      m.bind(new THREE.Skeleton(names.map((n) => shellMesh.skeleton.bones[at[n]]), names.map((n) => shellMesh.skeleton.boneInverses[at[n]])), shellMesh.bindMatrix);
      m.position.copy(shellMesh.position); m.quaternion.copy(shellMesh.quaternion); m.scale.copy(shellMesh.scale);
      m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.raycast = () => {}; m.userData.wear = true; m.name = 'wear:' + it.id;
      shellMesh.parent.add(m);
    });
    const hung = sway.map((o) => {
      const bi = at[(o.userData.name || o.name).split(':')[1]] ?? at.body, bone = shellMesh.skeleton.bones[bi];
      const local = new THREE.Matrix4().copy(shellMesh.skeleton.boneInverses[bi]).multiply(shellMesh.bindMatrix).multiply(o.matrixWorld);
      bone.add(o); local.decompose(o.position, o.quaternion, o.scale); o.userData.wear = true;
      o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.raycast = () => {}; } });
      return { o, rest: o.quaternion.clone(), ax: 0, az: 0, vx: 0, vz: 0, p: null, v: new V3(), len: 0.9 + Math.random() * 0.25 };
    });
    return { root: null, meshes, sway: hung };
  }
  const undress = (e) => { (e.meshes || []).forEach((m) => m.removeFromParent()); (e.sway || []).forEach((s) => s.o.removeFromParent()); };
  const show = (e, on) => { (e.meshes || []).forEach((m) => { m.visible = on; }); (e.sway || []).forEach((s) => { s.o.visible = on; }); };
  const swQ = new THREE.Quaternion(), swE = new THREE.Euler(), swP = new V3(), swA = new V3();
  function swing(e, t, dt) {                              // the loose ends lag behind whatever the crab does, then settle
    if (!e.sway || !e.sway.length || dt <= 0) return;
    e.sway.forEach((s, i) => {
      s.o.parent.getWorldPosition(swP);
      if (!s.p) { s.p = swP.clone(); return; }
      swA.copy(swP).sub(s.p).divideScalar(dt); s.p.copy(swP);                    // how fast the bone is going
      const axW = clamp((swA.x - s.v.x) / dt, -60, 60), azW = clamp((swA.z - s.v.z) / dt, -60, 60), ayW = clamp((swA.y - s.v.y) / dt, -60, 60); s.v.copy(swA);
      if (REDUCED) return;
      const K = 46 * s.len, D = 4.2;
      s.vz += (-K * s.az - D * s.vz - 0.5 * axW) * dt; s.vx += (-K * s.ax - D * s.vx + 0.5 * azW + 0.16 * Math.abs(ayW)) * dt;
      s.az = clamp(s.az + s.vz * dt, -1.1, 1.1); s.ax = clamp(s.ax + s.vx * dt, -0.5, 1.1);
      swE.set(s.ax + 0.02 * Math.sin(t * 1.3 + i * 2), 0, s.az + 0.025 * Math.sin(t * 0.9 + i));
      s.o.quaternion.copy(s.rest).multiply(swQ.setFromEuler(swE));
    });
  }
  const crabMid = (out) => out.copy(crabRoot.position).add(tmp.set(0, 0.62, 0.1));
  // out of the gift box and straight onto the crab: the box shakes, a flash of warm light, and it is wearing the thing
  async function putOn(it, mode = 'full') {
    if (live[it.slot]) await putAway(it.slot, true);
    const e = { id: it.id, it, root: null, wear: true, sway: [] }; live[it.slot] = e;
    const full = mode === 'full' && !REDUCED;
    skip = false; showing = true; S.busy = true; if (f2.LIFE && f2.LIFE.mode) f2.endLife(false);
    if (full) html.classList.add('is-decor-show');
    const parts = await dress(it); if (live[it.slot] !== e) { undress(parts); showing = false; return; }
    Object.assign(e, parts); show(e, false);
    const C = crabMid(new V3());
    if (full) { camTo(new V3(C.x, C.y + 0.12, C.z), 0.62); f2.play('parcel_wiggle', { force: true }); await wait(0.5); }
    burst(giftPos(new V3())); glow.position.copy(C); glow.position.z += 0.5;
    await anim(full ? 0.3 : 0.2, (k, u) => { glow.material.opacity = 0.85 * easeOut(u); glow.scale.setScalar(lerp(1.6, 3.4, easeOut(u))); }, linear);
    show(e, true); f2.play('shell_puff', { force: true }); if (S.boing) S.boing.v -= 1.6;
    await anim(0.55, (k, u) => { glow.material.opacity = 0.85 * (1 - easeOut(u)); glow.scale.setScalar(lerp(3.4, 4.2, u)); }, linear);
    glow.material.opacity = 0; glow.scale.setScalar(2.6);
    if (full) { await wait(0.5); f2.play('wiggle', { force: true }); await wait(1.5); }
    showing = false; html.classList.remove('is-decor-show');
    if (decorating) camTo(...DECOR_CAM); else { camHome(); S.busy = false; }
    if (full && !skip) f2.say(it.line || '穿上了，好看嗎？', { hold: 2.8 });
  }
  async function takeOff(e, fast) {
    if (!e.meshes) return;
    if (!fast && !REDUCED) {
      const C = crabMid(new V3()); glow.position.copy(C); glow.position.z += 0.5;
      await anim(0.18, (k, u) => { glow.material.opacity = 0.7 * u; glow.scale.setScalar(lerp(1.8, 3.2, u)); }, linear);
      undress(e); f2.play('settle', { force: true });
      await anim(0.4, (k, u) => { glow.material.opacity = 0.7 * (1 - easeOut(u)); }, linear); glow.material.opacity = 0; glow.scale.setScalar(2.6);
    } else undress(e);
  }

  // out of the crab's gift box, a turn in the light, then over to its place. mode 'full' (just bought) or 'quick' (put back out)
  async function present(id, mode = 'full') {
    const it = byId[id], slot = cat.slots[it.slot]; if (!it.ready || !slot) return;
    showGhost(null);
    if (slot.wear) return putOn(it, mode);
    if (live[it.slot]) await putAway(it.slot, true);
    const entry = { id, it, root: null, b: null, landAt: 0, flying: true }; live[it.slot] = entry;
    const full = mode === 'full' && !REDUCED;
    skip = false; showing = true; S.busy = true; if (f2.LIFE && f2.LIFE.mode) f2.endLife(false);
    if (full) html.classList.add('is-decor-show');
    const root = await build(it); if (live[it.slot] !== entry) { showing = false; return; }
    entry.root = root; root.visible = false; scene.add(root);                     // it appears as it leaves the box, already a seventh of its size, never from nothing
    entry.b = BEHAVE[it.behave] ? BEHAVE[it.behave](root, it) : null; entry.bornAt = now() + (full ? 0.5 : 0);     // already alive in the air: the bulbs come on as it comes out
    const size = root.userData.size, big = Math.max(size.x, size.y, size.z), wideThing = size.x > size.y * 2.2;
    const P = new V3().fromArray(slot.pos), rotY = rad(slot.rotY || 0);
    const G = giftPos(new V3()), show = Math.min(1.35, (full ? (wideThing ? 2.7 : 1.3) : 0.7) / big);
    const R = new V3(crabRoot.position.x + 0.05, 2.5 + size.y * show * 0.1, crabRoot.position.z + 0.35);
    const mid = root.userData.mid, lift = -mid.y * show, hangs = it.slot.startsWith('hang');     // held by its middle, whether it stands or hangs
    if (full) { camTo(new V3(crabRoot.position.x + 0.1, 1.85, crabRoot.position.z + 0.2), 0.6); f2.play('parcel_wiggle', { force: true }); await wait(0.4); }
    burst(G); glow.position.copy(R); root.visible = true;
    await anim(full ? 0.6 : 0.4, (e, u) => {
      root.position.lerpVectors(G, R, easeOut(u)); root.position.y += lift * easeOut(u);
      root.scale.setScalar(lerp(0.14 * show, show, backOut(u))); root.rotation.y = rotY - (1 - e) * 3.2; glow.material.opacity = 0.55 * e;
    });
    if (full) {
      f2.play('eyes_wide', { force: true });
      await anim(1.2, (e, u) => { root.rotation.y = rotY + (wideThing ? Math.sin(u * Math.PI * 2) * 0.5 : u * Math.PI * 2); root.position.y = R.y + lift + Math.sin(u * Math.PI * 2) * 0.035; }, linear);
      const h = size.y, wide = size.x > size.y * 2.2;
      const zoom = wide ? clamp(size.x / (1.6 * Math.tan(rad(camera.fov / 2)) * camera.aspect * S.home.dist), 0.5, 0.95) : clamp(h / (0.8 * Math.tan(rad(camera.fov / 2)) * S.home.dist), 0.3, 0.8);
      camTo(new V3(P.x + mid.x, P.y + mid.y, P.z), zoom);
    }
    const from = root.position.clone(), s0 = root.scale.x, apex = Math.max(from.y, P.y) + 0.9;
    await anim(full ? 0.95 : 0.7, (e, u) => {
      root.position.lerpVectors(from, P, e); root.position.y = lerp(lerp(from.y, apex, u), lerp(apex, P.y, u), u);   // up and over
      root.scale.setScalar(lerp(s0, 1, e)); root.rotation.y = rotY + (1 - e) * (wideThing ? 0.6 : Math.PI * 2); glow.material.opacity = 0.55 * (1 - u); glow.position.copy(root.position);
    });
    settle(entry);
    if (!hangs) { ring.position.set(P.x, P.y + 0.012, P.z); ring.userData.at = now(); ring.userData.r = Math.max(size.x, size.z) * 1.9; }
    if (full) { f2.play('hop', { force: true }); await wait(1.5); }
    showing = false; html.classList.remove('is-decor-show');
    if (decorating) camTo(...DECOR_CAM); else { camHome(); S.busy = false; }
    if (full && !skip) f2.say(it.line || '擺好了，這樣好看多了。', { hold: 2.8 });
  }
  async function putAway(slot, fast) {                   // back into the gift box
    const e = live[slot]; if (!e) return; delete live[slot]; if (e.wear) return takeOff(e, fast); if (!e.root) return;
    const from = e.root.position.clone(), G = giftPos(new V3()), s0 = e.root.scale.x;
    await anim(fast ? 0.3 : 0.55, (k, u) => { e.root.position.lerpVectors(from, G, k); e.root.position.y += Math.sin(u * Math.PI) * 0.8; e.root.scale.setScalar(lerp(s0, 0.12 * s0, k)); e.root.rotation.y += 0.25; });
    scene.remove(e.root); free(e.root); if (!fast && !REDUCED) f2.play('parcel_wiggle', { force: true });
  }

  /* ---------------- a pale copy where it would go (while you look at its card) */
  let ghost = null;
  async function showGhost(id) {
    const it = id && byId[id]; const want = it && it.ready && !cat.slots[it.slot].wear && !(live[it.slot] && live[it.slot].id === id) ? id : null;
    if (ghost && ghost.id === want) return;
    if (ghost) { if (ghost.root) { scene.remove(ghost.root); free(ghost.root); } ghost = null; }
    if (!want) return;
    const g = { id: want, root: null, at: now() }; ghost = g;
    const root = await build(it); if (ghost !== g) return;
    root.traverse((o) => {
      if (!o.isMesh) return; o.castShadow = false; o.raycast = () => {};
      const m = own(o.material); m.transparent = true; m.opacity = 0.42; m.depthWrite = false; if (m.emissive) { m.emissive.setRGB(0.55, 0.42, 0.24); m.emissiveMap = null; m.emissiveIntensity = 1; } o.material = m;
    });
    const slot = cat.slots[it.slot]; root.position.fromArray(slot.pos); root.rotation.y = rad(slot.rotY || 0);
    if (live[it.slot] && live[it.slot].root) root.position.y += 0.001;
    g.root = root; scene.add(root);
  }

  /* ---------------- every frame (study.js draws; this only moves things) */
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), pv = new V3();
  let lastT = now();
  (function tick() {
    const t = now(), dt = Math.min(0.05, t - lastT); lastT = t;
    for (const slot in live) {
      const e = live[slot]; if (e.wear) { swing(e, t, dt); continue; } if (!e.root) continue; const a = t - e.landAt;
      if (e.flying) { if (e.b && e.b.tick) e.b.tick(t, t - e.bornAt, dt); continue; }
      if (!REDUCED && a < 2.2) {
        if (slot.startsWith('hang')) e.root.rotation.z = 0.045 * Math.exp(-a * 2.4) * Math.sin(a * 8);          // the line swings a little as it is hung
        else { const sy = 1 - 0.13 * Math.exp(-a * 7) * Math.cos(a * 21); e.root.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy)); }   // lands with a small squash
      } else if (e.root.scale.y !== 1) { e.root.scale.setScalar(1); e.root.rotation.z = 0; }
      if (e.b && e.b.tick) e.b.tick(t, t - e.bornAt, dt);
    }
    if (ring.userData.at) { const u = (t - ring.userData.at) / 0.8; if (u >= 1) { ring.material.opacity = 0; ring.userData.at = 0; } else { ring.scale.setScalar(ring.userData.r * (0.4 + 0.9 * easeOut(u))); ring.material.opacity = 0.75 * (1 - u); } }
    for (const e of keepLive) if (e.b && e.b.tick && !e.flying) e.b.tick(t, t - e.bornAt, dt);
    const ba = t - bitsAt;
    if (ba < 1.3) { for (let i = 0; i < BITS; i++) { const v = bitsVel[i]; v.y -= 6.5 * dt; bitsPos[i * 3] += v.x * dt; bitsPos[i * 3 + 1] += v.y * dt; bitsPos[i * 3 + 2] += v.z * dt; } bitsGeo.attributes.position.needsUpdate = true; bits.material.opacity = clamp(1.3 - ba, 0, 1); } else if (bits.material.opacity) bits.material.opacity = 0;
    if (ghost && ghost.root) { const k = 0.34 + 0.12 * Math.sin((t - ghost.at) * 3.2); ghost.root.traverse((o) => { if (o.isMesh) o.material.opacity = k; }); }
    const wide = S.layout === 'wide';
    if (wide !== wasWide && uiReady) { wasWide = wide; btn.hidden = !wide; jr.btn.hidden = !wide; if (!wide) jr.show(false, false); if (!wide && decorating) decorate(false); for (const k in live) if (live[k].root && !live[k].wear) live[k].root.visible = wide; if (keepRoot) keepRoot.visible = wide; }
    if (decorating || showing) S.lastInteract = S.t;
    if (decorating && !showing) placeMarks();
    requestAnimationFrame(tick);
  })();

  /* ---------------- hands on the things (spin the globe, change the lights) */
  const ndc = (e) => { const r = canvas.getBoundingClientRect(); return v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const under = (e) => {
    if (showing || (F4 && F4.card) || html.classList.contains('has-map')) return null;
    const hits = Object.values(live).filter((x) => x.b && x.b.hit && !x.flying).concat(extraHits); if (!hits.length) return null;
    ray.setFromCamera(ndc(e), camera); const h = ray.intersectObjects(hits.map((x) => x.b.hit), false)[0];
    return h ? hits.find((x) => x.b.hit === h.object) : null;
  };
  let hand = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (showing || paying) { skip = true; e.stopImmediatePropagation(); return; }
    if (e.button !== 0 || hand) return; const x = under(e); if (!x) return;
    e.stopImmediatePropagation(); hand = { x, id: e.pointerId, px: e.clientX, moved: 0 };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (x.b.cursor === 'grab') canvas.style.cursor = 'grabbing';
  }, true);
  canvas.addEventListener('pointermove', (e) => {
    if (hand && hand.id === e.pointerId) { const dx = e.clientX - hand.px; hand.px = e.clientX; hand.moved += Math.abs(dx); if (hand.x.b.drag) hand.x.b.drag(dx * 0.05); e.stopImmediatePropagation(); return; }
    const x = e.pointerType === 'mouse' ? under(e) : null; canvas.style.cursor = x ? x.b.cursor || 'pointer' : '';
    if (x) e.stopImmediatePropagation();
  }, true);
  const drop = (e) => { if (!hand || hand.id !== e.pointerId) return; const h = hand; hand = null; canvas.style.cursor = ''; e.stopImmediatePropagation(); if (h.moved < 5 && h.x.b.click) h.x.b.click(); S.lastInteract = S.t; };
  canvas.addEventListener('pointerup', drop, true); canvas.addEventListener('pointercancel', drop, true);

  /* ------------------------------------------------------------------ 佈置模式: the tray */
  const stage = document.getElementById('stage'), ctl = document.getElementById('ctl'), liveP = document.getElementById('live');
  const tell = (s) => { if (liveP) liveP.textContent = s; };
  const COIN = '<svg class="coin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2"/><circle cx="8" cy="8" r="4.6"/></svg>';
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'btn-decor'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'decor-tray');
  ctl.prepend(btn); uiReady = true;
  const tray = document.createElement('section'); tray.className = 'decor-tray'; tray.id = 'decor-tray'; tray.setAttribute('aria-label', '書桌佈置'); tray.inert = true;
  tray.innerHTML = `<header><div><h2>書桌佈置</h2><p class="how"></p></div><p class="purse" aria-live="polite"></p><div class="share"><button type="button" class="snap">存成圖片</button><button type="button" class="copy">複製文字</button></div><button type="button" class="done">完成佈置</button></header><p class="tabs" role="tablist"><button type="button" role="tab" data-tab="things" aria-selected="true">擺飾</button><button type="button" role="tab" data-tab="keeps" aria-selected="false">紀念品</button></p><ul class="shelf"></ul><ul class="shelf keeps" hidden></ul>`;
  stage.appendChild(tray);
  const scrim = document.createElement('div'); scrim.className = 'decor-scrim'; scrim.setAttribute('aria-hidden', 'true'); stage.insertBefore(scrim, tray);
  const skipHint = document.createElement('p'); skipHint.className = 'decor-skip'; skipHint.setAttribute('aria-hidden', 'true'); skipHint.textContent = '點一下跳過'; stage.appendChild(skipHint);
  const marks = document.createElement('div'); marks.className = 'decor-marks'; marks.setAttribute('aria-hidden', 'true'); stage.appendChild(marks);
  const markEl = {}; Object.entries(cat.slots).forEach(([id, s]) => { if (!s.pos) return; const m = document.createElement('i'); m.innerHTML = `<b>${s.label}</b>`; marks.appendChild(m); markEl[id] = m; });
  const shelf = tray.querySelector('.shelf'), purse = tray.querySelector('.purse');
  if (DEVMODE) {
    const bar = document.createElement('p'); bar.className = 'devbar'; bar.innerHTML = '<b>開發者模式</b><span>代幣不會用完</span><button type="button" data-dev="reset">清空擺飾</button><button type="button" data-dev="off">關閉開發者模式</button>';
    tray.querySelector('header').after(bar);
    bar.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-dev]'); if (!b || showing) return;
      if (b.dataset.dev === 'reset') { for (const slot of Object.keys(live)) await putAway(slot, true); mine.owned = []; mine.placed = {}; mine.kept = []; keepLive.splice(0).forEach((e) => { keepRoot.remove(e.root); free(e.root); }); save(); draw(); tell('擺飾已清空。'); }
      else { try { localStorage.setItem(DEV_KEY, '0'); } catch (err) { /* private mode */ } const u = new URL(location.href); u.searchParams.delete('dev'); location.replace(u.href); }
    });
  }
  tray.querySelector('.how').textContent = `完成一課 ${cat.currency.perLesson}、測驗全對 ${cat.currency.perQuiz}、讀完一章 ${cat.currency.perChapter}、60 秒體驗 ${cat.currency.firstTask}；連續幾天回來另外有${cat.currency.name}。`;
  let studio = null, shown = -1;
  // tokens you have not been told about yet (a lesson finished since you last looked): a dot on the button, and the crab mentions it once
  const fresh = () => (devOn() ? 0 : Math.max(0, earned() - mine.seen));   // 帳號（2026-11-24）：開發者模式只在 'off' 算數
  let told = false;

  function placeMarks() {                                // a small ring at every empty place; the one you are looking at wears its name
    const r = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    for (const id in markEl) {
      const s = cat.slots[id], m = markEl[id]; const hotSlot = hot && byId[hot].slot === id;
      pv.fromArray(s.pos); if (id !== 'hang') pv.y += 0.02; pv.project(camera);
      const on = pv.z < 1 && (!live[id] || hotSlot); m.classList.toggle('on', on); m.classList.toggle('hot', !!hotSlot);
      if (on) m.style.transform = `translate(${((pv.x * 0.5 + 0.5) * r.width + r.left - sr.left).toFixed(1)}px, ${((-pv.y * 0.5 + 0.5) * r.height + r.top - sr.top).toFixed(1)}px)`;
    }
  }
  function stateOf(it, bal) {
    if (!it.ready) return { cls: 'soon', label: '', price: it.price, dis: true };
    const own = mine.owned.includes(it.id), on = mine.placed[it.slot] === it.id;
    const w = cat.slots[it.slot].wear;
    if (own) return on ? { cls: 'placed', label: w ? '脫下來' : '收起來', act: 'take' } : { cls: 'own', label: w ? '穿上' : '擺上去', act: 'put' };
    return bal >= it.price ? { cls: 'buy', label: `兌換`, price: it.price, act: 'buy' } : { cls: 'short', label: `還差 ${it.price - bal}`, price: it.price, dis: true };
  }
  let hold = null;                                       // while the crab is handing tokens over, the button counts up to the real number
  function drawBtn() { if (acct() === 'guest') return acctGuestBtn(); const bal = hold ?? balance(); btn.innerHTML = `佈置<b>${COIN}${num(bal)}</b>`; btn.title = `書桌佈置（${cat.currency.name} ${num(bal)}）`; btn.classList.toggle('has-new', fresh() > 0 && !decorating); }   // 帳號（2026-11-24）：訪客的鈕另外畫；num() 把團隊帳號的無限寫成字
  function draw() {
    const bal = balance();
    drawBtn();
    if (shown < 0) shown = bal;
    if (shown !== bal && !REDUCED && isFinite(shown - bal) /* 帳號（2026-11-24）：無限的不用數上去 */) { const from = shown, t0 = now(); shown = bal; (function roll() { const u = Math.min(1, (now() - t0) / 0.35); purse.innerHTML = `${COIN}<b>${Math.round(lerp(from, bal, easeOut(u)))}</b><span>${cat.currency.name}</span>`; if (u < 1) requestAnimationFrame(roll); })(); }
    else { shown = bal; purse.innerHTML = `${COIN}<b>${num(bal)}</b><span>${cat.currency.name}</span>`; }   // 帳號（2026-11-24）：團隊帳號寫「無限」
    items.forEach((it) => {
      let li = shelf.querySelector(`li[data-id="${it.id}"]`);
      if (!li) {
        li = document.createElement('li'); li.dataset.id = it.id; li.style.setProperty('--i', Math.min(7, shelf.children.length));
        li.innerHTML = `<div class="pic">${it.ready ? '<canvas width="368" height="288"></canvas>' : '<span>製作中</span>'}</div><h3>${it.name}</h3><p>${cat.slots[it.slot].label}${it.blurb ? '・' + it.blurb : ''}</p><button type="button"></button>`;
        shelf.appendChild(li);
      }
      const st = stateOf(it, bal), b = li.querySelector('button');
      li.className = st.cls; b.disabled = !!st.dis; b.dataset.act = st.act || '';
      b.innerHTML = st.price && st.cls === 'buy' ? `${st.label}<i>${COIN}${st.price}</i>` : st.price ? `<i>${COIN}${st.price}</i>${st.label}` : st.label;
      b.setAttribute('aria-label', `${it.name}：${st.label}${st.price ? '，' + st.price + ' ' + cat.currency.name : ''}`);
    });
  }
  async function pictures() {                            // the cards' small turning pictures
    if (!studio) { const m = await import('./decor-view.js'); studio = m.makeStudio({ px: 368 }); }
    for (const it of items) { if (!it.ready) continue; const c = shelf.querySelector(`li[data-id="${it.id}"] canvas`); if (c && !c.dataset.done) { await studio.shoot(it, c, 0.55); c.dataset.done = '1'; } }
  }
  let turning = 0;
  function setHot(id) {
    if (hot === id) return; hot = id; showGhost(decorating ? id : null);
    const my = ++turning; const it = id && byId[id]; if (!it || !it.ready || !studio || REDUCED) return;
    const c = shelf.querySelector(`li[data-id="${id}"] canvas`); const t0 = now();
    (async function spin() { if (my !== turning || !decorating) return; await studio.shoot(it, c, 0.55 + (now() - t0) * 0.9); requestAnimationFrame(spin); })();
  }
  shelf.addEventListener('pointerover', (e) => { const li = e.target.closest('li'); if (li) setHot(li.dataset.id); });
  shelf.addEventListener('pointerleave', () => setHot(null));
  shelf.addEventListener('focusin', (e) => { const li = e.target.closest('li'); if (li) setHot(li.dataset.id); });

  function decorate(on) {
    if (on === decorating || showing || paying) return; decorating = on; if (on) jr.show(false, false);
    html.classList.toggle('is-decor', on); tray.inert = !on; btn.setAttribute('aria-expanded', String(on));
    if (on) {
      if (f2.skipIntro) f2.skipIntro(); if (F4 && F4.card && F4.close) F4.close();
      if (f2.LIFE && f2.LIFE.mode) f2.endLife(false);
      if (!devOn()) { mine.seen = earned(); save(); } told = true;   // 帳號（2026-11-24）：開發者模式只在 'off' 算數
      S.busy = true; camTo(...DECOR_CAM); draw(); pictures(); tell('書桌佈置已開啟。');
      const first = shelf.querySelector('button:not(:disabled)'); if (first) setTimeout(() => first.focus({ preventScroll: true }), 260);
    } else { setHot(null); if (typeof closePick === 'function') closePick(false); S.busy = false; camHome(); btn.focus({ preventScroll: true }); }
  }
  btn.addEventListener('click', () => (acct() === 'guest' ? acctSignIn() : decorate(!decorating)));   // 帳號（2026-11-24）：訪客按了開登入框
  tray.querySelector('.done').addEventListener('click', () => decorate(false));
  addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; const pk = tray.querySelector('.decor-pick'); if (pk && !pk.hidden) { closePick(true); return; } if (showing || paying) skip = true; else if (decorating) decorate(false); });   // Esc: the picture chooser first, then 佈置模式
  shelf.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]'); if (!b || !b.dataset.act || showing || acctRedeeming) return;   // 帳號（2026-11-24）：兌換的請求還沒回來時不收
    const it = byId[b.closest('li').dataset.id], act = b.dataset.act; setHot(null);
    if (act === 'buy') {
      if (balance() < it.price) return;
      /* 帳號（2026-11-24）：登入時先請伺服器兌換，換成了才往下播；沒換成就說原因 */
      if (acct() === 'in' && !(await acctRedeem(it, b))) return;
      mine.owned.push(it.id); mine.placed[it.slot] = it.id; save(); draw(); tell(cat.slots[it.slot].wear ? `已兌換${it.name}，螃蟹穿上了。` : `已兌換${it.name}，放在${cat.slots[it.slot].label}。`);
      await present(it.id, e.detail === 0 ? 'quick' : 'full');       // Enter or Space: the short way (keyboard actions are not made to wait)
    } else if (act === 'put') { mine.placed[it.slot] = it.id; save(); draw(); tell(cat.slots[it.slot].wear ? `螃蟹穿上${it.name}了。` : `${it.name}擺上去了。`); await present(it.id, 'quick'); }
    else { delete mine.placed[it.slot]; save(); draw(); tell(cat.slots[it.slot].wear ? `${it.name}脫下來了。` : `${it.name}收起來了。`); await putAway(it.slot); }
    draw(); const again = shelf.querySelector(`li[data-id="${it.id}"] button`); if (again && decorating) again.focus({ preventScroll: true });
  });

  /* ------------------------------------------------------------------ 發幣（2026-11-23）：回到首頁時，上次之後新拿到的代幣由螃蟹交給你
     螃蟹跑到桌子右前方，代幣一枚一枚從牠那裡跳進右下角的「佈置」鈕，鈕上的數字跟著加；每一筆在鈕的上方寫是怎麼來的。
     代幣是畫在頁面上的小圓（不是 3D、沒有燈）。點一下或 Esc 直接結束。這一筆一開始就記成「給過了」，播到一半關掉也不會再發一次。
     本機可以用 ?payout=demo 看一次假的。 */
  const jr = mountJournal({ ctl, stage, currency: cat.currency, tell, busy: () => showing || paying || decorating });
  jr.btn.hidden = S.layout !== 'wide';
  let paying = false;
  const PAY_AT = new V3(1.15, 0, 0.95);                  // where the crab stands to hand them over: the near right of the desk, toward the button
  const payLayer = document.createElement('div'); payLayer.className = 'decor-pay'; payLayer.setAttribute('aria-hidden', 'true'); stage.appendChild(payLayer);
  const payList = document.createElement('ol'); payList.className = 'decor-paylist'; payList.setAttribute('aria-hidden', 'true'); stage.appendChild(payList);
  const flights = new Set();
  function merge(list) {                                 // many small ones (a lesson read chapter by chapter) become one line each kind
    if (list.length <= 5) return list.map((x) => ({ label: x.label, n: x.n }));
    const kinds = { lesson: (c) => `完成 ${c} 課`, quiz: (c) => `${c} 課測驗全對`, chapter: (c) => `讀完 ${c} 章` }, out = [], by = {};
    list.forEach((x) => { const k = x.key.split(':')[0]; if (!kinds[k]) { out.push({ label: x.label, n: x.n }); return; } if (!by[k]) { by[k] = { c: 0, n: 0, label: x.label }; out.push(by[k]); } by[k].c++; by[k].n += x.n; by[k].label = by[k].c > 1 ? kinds[k](by[k].c) : x.label; });
    return out;
  }
  function crabOnScreen(out) {
    const r = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    giftPos(pv).project(camera);                          // out of the gift box on its head
    return out.set((pv.x * 0.5 + 0.5) * r.width + r.left - sr.left, (-pv.y * 0.5 + 0.5) * r.height + r.top - sr.top);
  }
  function fly(from, to, i) {                            // one token: up out of the crab's box, over, and into the button
    const el = document.createElement('i'); el.innerHTML = `<span>${COIN}</span>`; payLayer.appendChild(el);
    const dx = to.x - from.x, dy = to.y - from.y, up = Math.min(-70, dy * 0.25 - 150) - (i % 3) * 14, dur = 640 * SLOW;
    el.style.translate = `${from.x.toFixed(1)}px ${from.y.toFixed(1)}px`;
    const a = el.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx.toFixed(1)}px)` }], { duration: dur, easing: 'cubic-bezier(.3, .1, .6, 1)', fill: 'forwards' });
    const b = el.firstChild.animate([
      { transform: 'translateY(0) scale(.35) rotateY(0deg)', opacity: 0, easing: 'cubic-bezier(.2, .7, .4, 1)' },
      { transform: `translateY(${up.toFixed(1)}px) scale(1.15) rotateY(360deg)`, opacity: 1, offset: 0.42, easing: 'cubic-bezier(.6, 0, .85, .45)' },
      { transform: `translateY(${dy.toFixed(1)}px) scale(.7) rotateY(720deg)`, opacity: 1 },
    ], { duration: dur, fill: 'forwards' });
    flights.add(a); flights.add(b);
    return a.finished.catch(() => {}).then(() => { flights.delete(a); flights.delete(b); el.remove(); });
  }
  async function payout(list, { demo = false } = {}) {
    if (paying || !list.length) return; paying = true; skip = false;
    const total = list.reduce((n, x) => n + x.n, 0), end = balance();
    if (!demo) { mine.paid = [...new Set(mine.paid.concat(list.map((x) => x.key)))]; save(); }
    hold = Math.max(0, end - total); drawBtn();
    S.busy = true; if (f2.LIFE && f2.LIFE.mode) f2.endLife(false); jr.show(false, false);
    html.classList.add('is-pay'); payList.innerHTML = '';
    tell(`螃蟹給你 ${total} ${cat.currency.name}：${list.map((x) => x.label).join('、')}。`);
    const moving = !REDUCED, rows = merge(list), from = new THREE.Vector2(), to = new THREE.Vector2();
    if (moving) { const T = f2.walkTo(PAY_AT.clone()); await wait(T + 0.2); f2.play('parcel_wiggle', { force: true }); await wait(0.35); }
    for (const row of rows) {
      const li = document.createElement('li'); li.innerHTML = `<span>${row.label}</span><b>+${row.n}</b>`; payList.appendChild(li);
      while (payList.children.length > 4) payList.firstChild.remove();
      const k = Math.min(row.n, 6), each = Math.floor(row.n / k); let left = row.n;
      if (moving && !skip) {
        const br = btn.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        to.set(br.left - sr.left + br.width - 30, br.top - sr.top + br.height / 2 - 8); crabOnScreen(from);
        const landed = [];
        for (let i = 0; i < k; i++) {
          const v = i === k - 1 ? left : each; left -= v;
          landed.push(fly(from, to, i).then(() => { hold = Math.min(end, hold + v); drawBtn(); if (!skip) btn.animate([{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], { duration: 200, easing: 'ease-out' }); }));
          if (i === 0) burst(giftPos(new V3()));
          await wait(0.09); if (skip) break;
        }
        if (skip) flights.forEach((f) => f.finish());
        await Promise.all(landed); hold = Math.min(end, hold + left); drawBtn();
        await wait(0.28);
      } else { hold = Math.min(end, hold + row.n); drawBtn(); await wait(0.18); }
    }
    hold = null; draw();
    if (moving && !skip) f2.play('hop', { force: true });
    f2.say(`這次給你 ${total} ${cat.currency.name}，現在有 ${num(balance())}。按右下角的「佈置」可以換東西。`, { hold: 5 });   // 帳號（2026-11-24）：團隊帳號寫「無限」
    await wait(1.6);
    html.classList.remove('is-pay'); payLayer.innerHTML = '';
    if (moving) f2.walkTo(S.crabHome.clone()); else crabRoot.position.copy(S.crabHome);
    S.busy = false; paying = false; skip = false;
  }
  const DEMO_PAY = DEV && Q.get('payout') === 'demo' ? [{ key: 'lesson:4-4', label: '完成 4-4', n: 10 }, { key: 'quiz:4-4', label: '4-4 測驗全對', n: 5 }, { key: 'chapter:4-4:0', label: '讀完 4-4 第 1 章', n: 1 }, { key: 'chapter:4-4:1', label: '讀完 4-4 第 2 章', n: 1 }, { key: 'streak:3@demo', label: '連續 3 天回來', n: 5 }] : null;
  let demoDone = false, readyAt = 0;
  setInterval(() => {
    if (!S.introDone) return; if (!readyAt) readyAt = now();
    if (now() - readyAt < 2.8 || paying || S.busy || decorating || showing || jr.open || (F4 && F4.card) || S.layout !== 'wide' || document.hidden || html.classList.contains('has-map') || html.classList.contains('pk-leaving')) return;
    if (DEMO_PAY && !demoDone) { demoDone = true; payout(DEMO_PAY, { demo: true }); return; }
    const list = unpaid(); if (list.length) { payout(list); return; }
    if (keepRoot) { const fin = finished(), nk = keeps.find((k) => hasKeep(k, fin) && !mine.kept.includes(k.id)); if (nk) giveKeep(nk); }
  }, 1200);

  /* ------------------------------------------------------------------ 課程紀念品（2026-11-23）：每完成一課送一件買不到的小東西，擺在桌子右前方的展示台上
     資料在 catalog.json 的 keepshelf（展示台）和 keeps（一課一件：lesson 課號、seat 第幾格、ready 模型做好了沒）。
     有沒有拿到只看 pd-done（開發者模式：做好的都算拿到）。mine.kept ＝ 螃蟹已經親手放上去的；新拿到的那件回首頁時由螃蟹放。
     圖鑑在佈置模式的「紀念品」分頁：沒拿到的是剪影，寫完成哪一課可得。 */
  const keeps = cat.keeps || [], KS = cat.keepshelf;
  let keepRoot = null; const seatAt = {};
  const finished = () => { let d = []; try { d = JSON.parse(localStorage.getItem('pd-done') || '[]'); } catch (e) { d = []; } return new Set(d); };
  const hasKeep = (k, fin = finished()) => !!k.ready && (devOn() || fin.has(k.lesson));   // 帳號（2026-11-24）：開發者模式只在 'off' 算數，別改回 DEVMODE（DEV_DEFAULT 是 true，訪客會拿到全部紀念品）
  const keepItem = (k) => ({ ...k, slot: 'keep' });
  async function seatKeep(k) {                           // on its seat, no ceremony
    if (!keepRoot || keepLive.some((e) => e.id === k.id)) return null;
    const root = await build(keepItem(k)); root.position.copy(seatAt[k.seat] || seatAt[0]); keepRoot.add(root);
    const e = { id: k.id, root, b: BEHAVE[k.behave] ? BEHAVE[k.behave](root, k) : null, bornAt: now(), flying: false }; keepLive.push(e); return e;
  }
  async function giveKeep(k) {                           // the crab takes it out of its box and sets it on the stand; the chair leans over to look
    if (paying || showing) return; paying = true; skip = false; S.busy = true; if (f2.LIFE && f2.LIFE.mode) f2.endLife(false); jr.show(false, false);
    mine.kept.push(k.id); save();
    const e = await seatKeep(k); if (!e) { paying = false; S.busy = false; return; }
    const root = e.root, P = root.position.clone(), W = keepRoot.localToWorld(P.clone()); e.flying = true;
    tell(`完成 ${k.lesson} 的紀念品：${k.name}。放在${KS.label}上了。`);
    if (!REDUCED) {
      html.classList.add('is-decor-show'); showing = true;
      camTo(new V3(crabRoot.position.x + 0.1, 1.85, crabRoot.position.z + 0.2), 0.6); f2.play('parcel_wiggle', { force: true }); await wait(0.45);
      const G = keepRoot.worldToLocal(giftPos(new V3())); burst(giftPos(new V3()));
      const R = keepRoot.worldToLocal(new V3(crabRoot.position.x + 0.05, 2.45, crabRoot.position.z + 0.35)), big = 3.2;
      await anim(0.6, (q, u) => { root.position.lerpVectors(G, R, easeOut(u)); root.scale.setScalar(lerp(0.3, big, backOut(u))); root.rotation.y = -(1 - q) * 3.2; });
      f2.play('eyes_wide', { force: true });
      await anim(1.5, (q, u) => { root.rotation.y = u * Math.PI * 2; root.rotation.x = 0.5 * Math.sin(u * Math.PI); root.position.y = R.y + Math.sin(u * Math.PI * 2) * 0.035; }, linear);
      camTo(new V3(W.x, 0.25, W.z), 0.42);
      const from = root.position.clone(), apex = Math.max(from.y, P.y) + 0.7;
      await anim(1.0, (q, u) => { root.position.lerpVectors(from, P, q); root.position.y = lerp(lerp(from.y, apex, u), lerp(apex, P.y, u), u); root.scale.setScalar(lerp(big, 1, q)); root.rotation.y = (1 - q) * Math.PI * 2; root.rotation.x = 0; });
      ring.position.set(W.x, W.y + 0.012, W.z); ring.userData.at = now(); ring.userData.r = 0.5;
      f2.play('hop', { force: true }); await wait(1.7);
      showing = false; html.classList.remove('is-decor-show');
    }
    root.position.copy(P); root.scale.setScalar(1); root.rotation.set(0, 0, 0); e.flying = false; e.bornAt = now();
    if (decorating) camTo(...DECOR_CAM); else camHome();
    f2.say(`這是 ${k.lesson} 的紀念品：${k.name}。${k.line || ''}`, { hold: 4.6 });
    S.busy = decorating; paying = false; skip = false; drawKeeps();
  }
  if (KS) loader.loadAsync('decor/' + KS.file).then(async (g) => {
    keepRoot = new THREE.Group(); keepRoot.name = 'decor:keepshelf'; keepRoot.add(g.scene);
    keepRoot.position.fromArray(KS.pos); keepRoot.rotation.y = rad(KS.rotY || 0); keepRoot.visible = S.layout === 'wide';
    keepRoot.traverse((o) => { if (/^seat_(\d+)/.test(o.name)) seatAt[+RegExp.$1] = o.position.clone(); if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(keepRoot);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.9), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, 0.3, 0); keepRoot.add(hit);
    let looking = 0;
    extraHits.push({ b: { hit, cursor: 'pointer', click() {
      if (paying || showing || decorating || S.busy && !looking) return;
      clearTimeout(looking); if (looking) { looking = 0; camHome(); S.busy = false; return; }
      S.busy = true; camTo(new V3(KS.pos[0], 0.25, KS.pos[2]), 0.42); const n = keepLive.length;
      f2.say(n ? `課程紀念品，現在有 ${n} 件。每完成一課多一件。` : '這裡放課程紀念品。每完成一課，我就放一件上去。', { hold: 4 });
      looking = setTimeout(() => { looking = 0; if (!decorating && !paying && !showing) { camHome(); S.busy = false; } }, 5200);
    } } });
    const fin = finished();
    for (const k of keeps) if (hasKeep(k, fin) && mine.kept.includes(k.id)) await seatKeep(k);
    drawKeeps();
  }).catch(() => {});
  const keepShelf = tray.querySelector('.shelf.keeps'), tabs = tray.querySelector('.tabs');
  if (!keeps.length) tabs.hidden = true;                // no keepsakes in the catalogue yet: no empty tab
  function drawKeeps() {
    const fin = finished(), got = keeps.filter((k) => hasKeep(k, fin)).length;
    tabs.querySelector('[data-tab="keeps"]').textContent = `紀念品 ${got}／${keeps.length}`;
    keeps.forEach((k) => {
      let li = keepShelf.querySelector(`li[data-id="${k.id}"]`);
      if (!li) { li = document.createElement('li'); li.dataset.id = k.id; li.style.setProperty('--i', Math.min(7, keepShelf.children.length)); li.innerHTML = `<div class="pic">${k.ready ? '<canvas width="368" height="288"></canvas>' : '<span>製作中</span>'}</div><h3></h3><p></p>`; keepShelf.appendChild(li); }
      const own = hasKeep(k, fin), href = F4 && F4.lessonHref ? F4.lessonHref(k.lesson) : null;
      li.className = own ? 'kept' : k.ready ? 'locked' : 'locked soon';
      li.querySelector('h3').textContent = k.name;
      li.querySelector('p').innerHTML = own ? `${k.lesson} 的紀念品${k.blurb ? '・' + k.blurb : ''}` : `完成 ${k.lesson} 可得${href ? `　<a href="${href}">去上課</a>` : ''}`;
    });
  }
  async function keepPictures() {
    if (!studio) { const m = await import('./decor-view.js'); studio = m.makeStudio({ px: 368 }); }
    for (const k of keeps) { if (!k.ready) continue; const c = keepShelf.querySelector(`li[data-id="${k.id}"] canvas`); if (c && !c.dataset.done) { await studio.shoot(keepItem(k), c, 0.55); c.dataset.done = '1'; } }
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return; const k = b.dataset.tab === 'keeps';
    tabs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    shelf.hidden = k; keepShelf.hidden = !k; setHot(null); if (k) { drawKeeps(); keepPictures(); camTo(new V3(KS.pos[0] - 0.5, 0.5, KS.pos[2] - 0.6), 0.8); } else camTo(...DECOR_CAM);
  });
  /* ------------------------------------------------------------------ 存成圖片（2026-11-22）：書桌和螃蟹一張 1080×1920 直式圖，沒有任何按鈕，角落印帳號和網址 */
  /* 分享卡的兩種版面（Thomas 2026-11-23 從 8 版裡留下這兩個；其他 6 版的程式在 可刪/存圖前/decor.v3八版.js）：
     magazine＝書桌滿版，PARADIGM 刊頭橫跨上方；pass＝掛繩學員證，大頭照是你的螃蟹，背景是模糊的書桌。 */
  const SHOT = {
    w: 1080, h: 1920, fov: 31, style: 'pass',
    cams: {
      magazine: { w: 1080, h: 1920, target: new V3(0.86, 0.5, -0.6), yaw: 5, elev: 13, dist: 14.0 },
      pass: { w: 720, h: 600, target: new V3(0.0, 0.66, 0.1), yaw: 8, elev: 10, dist: 4.9 },
      back: { w: 1080, h: 1920, target: new V3(0.86, 0.62, -0.6), yaw: 5, elev: 13, dist: 13.3 },   // the blurred desk behind the pass
    },
  };
  const shotCam = new THREE.PerspectiveCamera(SHOT.fov, 1, 0.5, 80);
  function shoot(c) {                                    // one frame of the desk from the card's own camera, borrowed from the page's renderer and given back in the same task
    const R = f2.renderer, el = rad(c.elev), yw = rad(c.yaw), t = c.target;
    shotCam.fov = SHOT.fov; shotCam.aspect = c.w / c.h; shotCam.layers.mask = camera.layers.mask;
    shotCam.position.set(t.x + Math.sin(yw) * Math.cos(el) * c.dist, t.y + Math.sin(el) * c.dist, t.z + Math.cos(yw) * Math.cos(el) * c.dist);
    shotCam.lookAt(t); shotCam.updateProjectionMatrix();
    const ghostWas = hot; if (ghostWas) showGhost(null);
    const minis = scene.children.filter((o) => o.visible && /^mini-crab-/.test(o.name)); minis.forEach((o) => { o.visible = false; });   // the two little social crabs: on a card they read as clutter
    const pr = R.getPixelRatio();
    R.setPixelRatio(1); R.setSize(c.w, c.h, false); R.render(scene, shotCam);
    minis.forEach((o) => { o.visible = true; });
    const pic = document.createElement('canvas'); pic.width = c.w; pic.height = c.h; pic.getContext('2d').drawImage(R.domElement, 0, 0);
    R.setPixelRatio(pr); f2.fit();
    if (ghostWas && decorating) showGhost(ghostWas);
    return pic;
  }
  const snapshot = (over, style = SHOT.style) => compose(style, stats(over), shoot(SHOT.cams[style]), style === 'pass' ? shoot(SHOT.cams.back) : null);
  /* 存成圖片：先跳出兩張小預覽（學員證／雜誌封面，都是用你現在的書桌算的），點哪張就存哪張（Thomas 2026-11-23：給學員選） */
  /* 手機分享選單（2026-11-23）：觸控裝置而且瀏覽器能分享檔案時，點預覽＝打開系統的分享選單（存到相簿、IG、LINE…）；其他情況照舊下載。
     分享一定要緊接在點擊之後，所以兩張大圖在預覽畫好時就先轉成檔案（shots），點的時候不用再等。 */
  const SNAP_LABEL = CAN_SHARE ? '分享圖片' : '存成圖片', shots = {};
  const snapBtn = tray.querySelector('.snap'), shareBox = tray.querySelector('.share');
  const pick = document.createElement('div'); pick.className = 'decor-pick'; pick.hidden = true; pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', '選一種圖片樣式');
  pick.innerHTML = `<p>${CAN_SHARE ? '選一張分享' : '選一張存下來'}</p><div>` + STYLES.map(([id, name]) => `<button type="button" data-style="${id}"><canvas width="216" height="384"></canvas><span>${name}</span></button>`).join('') + '</div>';
  shareBox.appendChild(pick); snapBtn.setAttribute('aria-haspopup', 'true'); snapBtn.setAttribute('aria-expanded', 'false');
  const closePick = (focus) => { if (pick.hidden) return; pick.hidden = true; snapBtn.setAttribute('aria-expanded', 'false'); if (focus) snapBtn.focus({ preventScroll: true }); };
  async function openPick() {
    pick.hidden = false; snapBtn.setAttribute('aria-expanded', 'true');
    try { await document.fonts.load('40px Huninn'); await document.fonts.load('600 46px Outfit'); await document.fonts.load('500 32px Outfit'); } catch (e) { /* the fallback font will do */ }
    for (const [id] of STYLES) { if (pick.hidden) return; const c = pick.querySelector(`[data-style="${id}"] canvas`), g2 = c.getContext('2d'); g2.imageSmoothingQuality = 'high'; const full = snapshot(null, id); g2.drawImage(full, 0, 0, c.width, c.height); if (CAN_SHARE) { shots[id] = null; full.toBlob((bl) => { shots[id] = bl; }, 'image/png'); } await new Promise((r) => requestAnimationFrame(r)); }
    const first = pick.querySelector('button'); if (first && !pick.hidden) first.focus({ preventScroll: true });
  }
  snapBtn.addEventListener('click', () => { if (showing) return; if (pick.hidden) openPick(); else closePick(true); });
  addEventListener('pointerdown', (e) => { if (!pick.hidden && !shareBox.contains(e.target)) closePick(false); });
  pick.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-style]'); if (!b || showing) return; const style = b.dataset.style, name = b.querySelector('span').textContent;
    try {
      if (CAN_SHARE && shots[style]) {                    // the system share sheet; no await before it, or the tap no longer counts
        try { await navigator.share({ files: [fileOf(shots[style], name)], title: 'Paradigm AI 學習站' }); tell(`${name}的圖片分享出去了。`); snapBtn.textContent = '分享好了'; closePick(true); setTimeout(() => { snapBtn.textContent = SNAP_LABEL; }, 1800); return; }
        catch (err) { if (err && err.name === 'AbortError') return; console.info('[decor] share failed, saving instead:', err); }   // closed the sheet: leave the previews open
      }
      const blob = (CAN_SHARE && shots[style]) || await new Promise((ok) => snapshot(null, style).toBlob(ok, 'image/png'));
      download(blob, name); tell(`${name}的圖片存好了。`); snapBtn.textContent = '存好了';
    } catch (err) { console.info('[decor] snapshot failed:', err); tell('圖片沒有存成功，再試一次。'); snapBtn.textContent = '再試一次'; }
    closePick(true); setTimeout(() => { snapBtn.textContent = SNAP_LABEL; }, 1800);
  });
  snapBtn.textContent = SNAP_LABEL;
  tray.querySelector('.copy').addEventListener('click', async (e) => {
    const b = e.currentTarget, s = shareTextOf(); let ok = false;
    try { await navigator.clipboard.writeText(s); ok = true; } catch (err) {
      const ta = document.createElement('textarea'); ta.value = s; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (er) { ok = false; } ta.remove();
    }
    b.textContent = ok ? '複製好了' : '複製失敗'; tell(ok ? '分享文字已複製。' : '文字沒有複製成功。'); setTimeout(() => { b.textContent = '複製文字'; }, 1800);
  });


  /* ------------------------------------------------------------------ 第 6 項（2026-11-23）：沒人理牠的時候，螃蟹自己去用你買的東西
     Left alone for half a minute, the crab goes over to one of the things you own (on the sill, hanging, on the desk, on the stand, or
     what it is wearing), does something with it, says a line, and comes back. Which claw, where it stands and what it says: USES.
     It never holds you up: move the mouse or touch anything and it drops what it is doing at once (S.busy is given back first).
     Timed on the desk's own clock (f2.later), so window.__f2.advance() steps it too. No sounds: the bell and the typewriter are nudged quietly. */
  const AT = { L: [0.78, -1.12], R: [1.9, -0.98], K: [2.62, 0.42] };      // where it stands: under the left of the sill, in front of the right of the sill and the back of the desk, beside the stand
  const USES = {
    garland: { act: 'eyes_wide', poke: true, line: '燈換個閃法，心情也換一下。' },
    stars: { act: 'hop', poke: true, line: '跳一下，星星就轉了。' },
    furin: { act: 'hop', poke: true, line: '有風。風鈴在動。' },
    cactus: { at: 'L', act: 'snap_R', poke: true, line: '戳一下。……好，不戳了。' },
    candle: { at: 'L', act: 'lean_bubbles', line: '聞起來像剛曬好的被子。' },
    luckycat: { at: 'L', act: 'wave_L', poke: true, line: '牠招手，我也招手。' },
    globe: { at: 'R', act: 'wave_R', poke: true, line: '轉到哪，下次就去哪。' },
    snowglobe: { at: 'R', act: 'wiggle', poke: true, line: '搖一搖，下雪了。' },
    fishbowl: { at: 'R', act: 'lean_bubbles', poke: true, line: '開飯了，慢慢吃。' },
    typewriter: { at: 'R', act: 'legs_tap', poke: true, line: '我也來寫一段 prompt。' },
    wear_raincoat: { act: 'shell_puff', line: '穿著雨衣，外面的雨就跟我沒關係了。' },
    wear_sweater: { act: 'wiggle', line: '這件毛衣，很暖。' },
    wear_scarf: { act: 'wiggle', line: '圍巾甩一下。帥吧。' },
    keep_ramen: { at: 'K', act: 'lean_bubbles', line: '只聞不吃。……再聞一下。' },
    keep_notes: { at: 'K', act: 'eyes_wide', line: '目的、任務、限制、格式。再背一次。' },
    keep_cookbook: { at: 'K', act: 'lean_bubbles', line: '今天照食譜做哪一道？' },
    keep_plug: { at: 'K', act: 'snap_L', line: '插著呢，資料都通。' },
  };
  const use = { on: false, tok: 0, t0: 0, beat: -1, last: null };
  const usable = () => {                                  // what is out on the desk right now and has something written for it
    const ids = []; for (const slot in live) { const id = mine.placed[slot]; if (USES[id] && (live[slot].wear || live[slot].root)) ids.push(id); }
    for (const e of keepLive) if (USES[e.id] && !e.flying) ids.push(e.id);
    return ids;
  };
  const entryOf = (id) => { for (const slot in live) if (mine.placed[slot] === id) return live[slot]; return keepLive.find((e) => e.id === id) || null; };
  const useFree = () => S.introDone && !S.busy && !S.walk && !S.focus && !S.celebrating && !(F4 && F4.card) && !decorating && !showing && !paying && !REDUCED && S.layout === 'wide' && !document.hidden;
  function endUse(walkHome) {
    if (!use.on) return; use.on = false; use.tok++; S.busy = decorating;
    if (walkHome && !S.focus && !decorating && crabRoot.position.distanceTo(S.crabHome) > 0.05) f2.walkTo(S.crabHome.clone());
  }
  function useThing(id, test) {                           // returns false if there is nothing to do with it just now. test: from the console, with the pane hidden
    const u = USES[id], e = entryOf(id); if (!u || !e || use.on || !(useFree() || (test && DEV && !S.busy && !decorating))) return false;
    if (f2.LIFE && f2.LIFE.mode) f2.endLife(false);
    use.on = true; use.last = id; use.t0 = S.t; S.busy = true; const tok = ++use.tok;
    const step = (sec, fn) => f2.later(sec, () => { if (tok === use.tok && use.on) fn(); });
    const T = u.at ? f2.walkTo(new V3(AT[u.at][0], 0, AT[u.at][1])) : 0;
    step(T + 0.2, () => { f2.play(u.act, { force: true }); });
    step(T + 0.55, () => { if (u.poke && e.b && e.b.click) e.b.click(true); f2.say(u.line, { hold: 2.8 }); });   // after its own click, so this is the line that stays
    step(T + 3.1, () => { const back = u.at ? f2.walkTo(S.crabHome.clone()) : 0; step(back + 0.15, () => endUse(false)); });
    return true;
  }
  (function watch() {                                     // twice in a quiet spell (after about 28 and 44 seconds), before it nods off; a different thing each time
    requestAnimationFrame(watch);
    const active = Math.max(S.lastInteract || 0, S.lastPointer || 0, (f2.LIFE && f2.LIFE.lastActive) || 0), idle = S.t - active;
    if (use.on) { if (active > use.t0 + 0.05 || decorating || showing || paying || S.focus || (F4 && F4.card)) endUse(true); return; }
    if (idle < 1) { use.beat = -1; return; }
    const beat = idle < 28 ? -1 : Math.floor((idle - 28) / 16);
    if (beat < 0 || beat > 1 || beat === use.beat || (f2.LIFE && f2.LIFE.mode === 'doze')) return;
    if (!useFree()) return;                               // try again next frame: the beat is not spent until something happened
    use.beat = beat;
    const ids = usable(); if (!ids.length) return;
    const pick = ids.filter((id) => id !== use.last); useThing((pick.length ? pick : ids)[Math.floor(Math.random() * (pick.length || ids.length))]);
  })();

  if (F4 && F4.on) { F4.on('state', draw); F4.on('card:open', () => { if (decorating) decorate(false); }); }
  addEventListener('storage', (e) => { if (['pd-done', 'pd-quiz', 'pd-chapters', 'pd-awards'].includes(e.key)) draw(); });
  draw();
  Object.values(mine.placed).forEach(mount);

  /* 帳號（2026-11-24）：登入、登出、伺服器的資料變了，就重讀 mine，桌上、螃蟹身上、紀念品台、鈕和擺飾架跟著換（不重播儀式） */
  function acctPull() {
    const st = acct(), A = window.PD_ACCOUNT;
    if (st === 'off' && acctWas === 'off') return;
    if (acctRedeeming || acctFlying || showing || paying) { clearTimeout(acctPull.t); acctPull.t = setTimeout(acctPull, 400); return; }   // 正在播或正在送：等一下再對
    if (st === 'in' && acctWas !== 'in') { acctReady = false; A.syncNow().then(() => { acctReady = true; }); }   // 剛登入：這台的進度送上去之後才發幣
    acctWas = st;
    if (st !== 'in' && decorating) decorate(false);
    acctMine(byId, cat.slots);
    for (const slot of Object.keys(live)) if (live[slot].id !== mine.placed[slot]) { if (live[slot].wear) undress(live[slot]); remove(slot); }
    Object.values(mine.placed).forEach((id) => { if (!live[byId[id].slot]) mount(id); });
    acctKeeps(); acctBars(); draw(); drawKeeps();
  }
  let keepChain = Promise.resolve();
  function acctKeeps(again = true) {                      // 紀念品台上只留 mine.kept 裡、而且這台完成過的
    keepChain = keepChain.then(async () => {
      if (!keepRoot) return; const fin = finished(), ids = new Set();
      const drop = (e) => { keepLive.splice(keepLive.indexOf(e), 1); keepRoot.remove(e.root); free(e.root); };
      // 展示台剛載好時，它自己也在放；同一件被放了兩次就拿掉後來的（正在飛的不動）
      keepLive.slice().forEach((e) => { const k = keeps.find((x) => x.id === e.id); if (!e.flying && (!k || !hasKeep(k, fin) || !mine.kept.includes(e.id) || ids.has(e.id))) drop(e); else ids.add(e.id); });
      for (const k of keeps) if (hasKeep(k, fin) && mine.kept.includes(k.id)) await seatKeep(k);
      if (again) setTimeout(() => acctKeeps(false), 3000);                                  // 再檢查一次重複的
    }).catch(() => {});
  }
  function acctBars() {                                   // 開發者那一排只在 'off'；團隊帳號多一排「清空擺飾」
    const st = acct(), A = window.PD_ACCOUNT, dev = tray.querySelector('.devbar:not(.acct-team)'), team = st === 'in' && !!(A.me && A.me.team);
    if (dev) dev.hidden = st !== 'off';
    let tb = tray.querySelector('.acct-team');
    if (team && !tb) {
      tb = document.createElement('p'); tb.className = 'devbar acct-team'; tb.innerHTML = '<b>團隊帳號：代幣無限</b><button type="button">清空擺飾</button>';
      tray.querySelector('header').after(tb);
      tb.querySelector('button').addEventListener('click', async (e) => {
        const b = e.currentTarget; if (showing || paying) return; const r = await window.PD_ACCOUNT.resetDecor(), ok = !!(r && r.ok);
        tell(ok ? '擺飾已清空。' : '暫時連不上，等一下再試。'); b.textContent = ok ? '清空了' : '暫時連不上'; setTimeout(() => { b.textContent = '清空擺飾'; }, 1800);
      });
    }
    if (tb) tb.hidden = !team;
  }
  function acctGuestBtn() { btn.textContent = '登入，佈置你的書桌'; btn.title = '登入就能用上課賺的代幣佈置書桌'; btn.classList.remove('has-new'); }
  function acctSignIn() { const UI = window.PD_ACCOUNT_UI; if (UI && UI.open) UI.open('登入就能用上課賺的代幣佈置書桌'); }
  async function acctRedeem(it, b) {                      // true ＝ 伺服器換好了（餘額和 decor 已經更新）
    if (acctRedeeming) return false; acctRedeeming = true; b.disabled = true;
    let r = null; try { r = await window.PD_ACCOUNT.redeem(it.id); } catch (e) { r = null; } finally { acctRedeeming = false; }
    if (r && r.ok) { mine.owned = mine.owned.filter((id) => id !== it.id); return true; }      // 下面那行會把它加進來
    const msg = r && r.error === 'poor' ? '代幣不夠' : '暫時連不上，等一下再換';      // 佈置模式看不到螃蟹的話，寫在那顆鈕上 1.8 秒（跟「存成圖片」一樣）
    tell(msg + '。'); draw(); const until = now() + 1.8;
    (function note() { if (now() >= until) { draw(); return; } const nb = shelf.querySelector(`li[data-id="${it.id}"] button`); if (nb) { nb.textContent = msg; nb.disabled = true; } requestAnimationFrame(note); })();   // 中間別的地方重畫也蓋不掉
    return false;
  }
  addEventListener('pd-account', acctPull);
  addEventListener('storage', (e) => { if (e.key === KEY && acct() === 'in') mine.paid = arr(local().paid); });
  if (window.PD_ACCOUNT && window.PD_ACCOUNT.ready) window.PD_ACCOUNT.ready.then(() => { acctReady = true; acctPull(); });
  acctPull();

  window.__decor = { useThing, endUse, usable, use, USES, giveKeep, keeps, keepLive, payout, unpaid, allSources, journal: jr, snapshot, shoot, SHOT, shareText: (over) => shareTextOf(stats(over)), stats, mine, balance, present, putAway, mount, decorate, live, cat, draw, showGhost };
}
main().catch((e) => console.info('[decor] not started:', e && e.message));

/* f4 雨夜書桌 — f3's desk, as the live picture behind a first screen that already works without it.
   app.js owns what you do (the 60-second task, pick for me, your progress); this file only makes the crab and the desk
   answer: it listens on window.F4 and calls F4.enter(id) when you click a thing.
   From f3: f2's desk (your own desk, seen from your chair) on a rainy evening: wet glass you can wipe, curtains,
   rain you can hear, a crab with a life of its own that remembers where you have been.
   From f2: your own desk at dusk, seen from your chair. The lamp has just been switched on.
   The crab lives on the desk and has laid out seven things; each one is a way in.
   What is baked (set.glb + tex/): wall, window, books, lamp stand, mug, plant, in two light states (dusk, lamp)
   that the page adds together, so the lamp can really be switched on and off.
   What is live: the crab, the seven props, the desk top, the lamp's pool of light and its shadows, the sky.
   f4: the first screen (poster, the sentence, the main button, the index) is plain HTML and app.js; this module is
   fetched after that is up and only listens to it (window.F4). The poster stays underneath the canvas. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';   // crab-f4.glb is meshopt-compressed (src/squeeze_crab.mjs)

const html = document.documentElement;
const Q = new URLSearchParams(location.search);
const STILL = Q.has('still');
const CAPTURE = Q.has('capture');
const DEBUG = Q.has('debug');
const UA = navigator.userAgent || '';
const INAPP = /Instagram|FBAN|FBAV|Line\//i.test(UA);
const mqSmall = matchMedia('(max-width: 767px)');
const mqTouch = matchMedia('(hover: none)');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const LIGHT = INAPP || mqSmall.matches || Q.has('light');           // phones: smaller shadow map, lighter clay, pixel ratio 1.5
let SHADOWS = !Q.has('noshadow');                                   // dropped at run time if the device cannot keep up
let REDUCED = mqReduce.matches || Q.has('reduced');
mqReduce.addEventListener?.('change', (e) => { REDUCED = e.matches; });
const isTouch = () => mqTouch.matches || Q.has('touch');
if (CAPTURE) html.classList.add('is-capture');

const $ = (s, r = document) => r.querySelector(s);
const view = $('#view');
const ways = $('#ways');
const bubbleEl = $('#bubble');
const bubbleP = bubbleEl.querySelector('p');
const tagEl = $('#tag');
const zzzEl = $('#zzz');
const fadeEl = $('#fade');
const btnRain = $('#btn-rain'), btnLamp = $('#btn-lamp'), btnCurtain = $('#btn-curtain');

/* ------------------------------------------------------------------ the seven things on the desk (their words live in app.js) */
const F4 = window.F4;
const IDS = ['map', 'pick', 'solve', 'words', 'free', 'news', 'ask'];
const tags = {};
ways.querySelectorAll('a[data-id]').forEach((a) => { tags[a.dataset.id] = a; });
const nameOf = (id) => F4.ENTRY[id].name;
const hintOf = (id) => F4.ENTRY[id].line;
// what the map on the desk shows: which islands you have started, where you are, how many lessons you know
const mapState = () => {
  const st = F4.state; const n = F4.nextStep();
  const counts = F4.STAGES.map((g) => g.lessons.filter((l) => st.known.includes(l.id)).length);
  const lit = counts.map((c, i) => c > 0 || (i === 0 && !!st.done.t1));
  return { lit, counts, here: n.kind === 'lesson' ? n.lesson.stage : 0, known: st.known.length, total: F4.TOTAL, done: Object.keys(st.done).length };
};
const ISLANDS = [[0.2, 0.66, 0.11, '#cfdcae'], [0.4, 0.34, 0.1, '#f6d6a8'], [0.57, 0.7, 0.085, '#d8cdea'], [0.75, 0.4, 0.105, '#f8dd94'], [0.9, 0.72, 0.07, '#f5bfae']];

/* ------------------------------------------------------------------ small tools */
class Spring {
  // response (seconds) and damping ratio; change the target any time, the velocity carries over
  constructor(x = 0, response = 0.4, damping = 1) { this.x = x; this.v = 0; this.target = x; this.tune(response, damping); }
  tune(response, damping) { const w = (2 * Math.PI) / response; this.k = w * w; this.c = 2 * damping * w; return this; }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240))); const h = dt / n;
    for (let i = 0; i < n; i++) { const a = this.k * (this.target - this.x) - this.c * this.v; this.v += a * h; this.x += this.v * h; }
    return this.x;
  }
  snap(x) { this.x = this.target = x; this.v = 0; }
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeIO = (x) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const rubber = (x, limit) => { const s = Math.sign(x), a = Math.abs(x); return a <= limit ? x : s * (limit + (a - limit) * limit / (limit + (a - limit) * 2.4)); };
const D2R = Math.PI / 180;

let ready = false, dead = false;
let hot = null, hotSource = null;
const hotListeners = [];
function setHot(id, source = 'canvas') {
  if (id === hot) { if (id) hotSource = source; return; }
  hot = id; hotSource = id ? source : null;
  if (!F4.card) IDS.forEach((k) => tags[k].classList.toggle('is-on', k === id));
  html.classList.toggle('is-hot', !!id && source === 'canvas');
  hotListeners.forEach((f) => f(id, source));
}

/* ------------------------------------------------------------------ if the desk cannot come up, the poster stays: everything on it already works */
const failTimer = setTimeout(() => { if (!ready) fallback('slow load'); }, Math.max(3000, 25000 - (performance.now() - F4.t0)));
let renderer;
function fallback(why) {
  if (ready || dead) return;
  dead = true;
  html.classList.add('is-poster');
  try { renderer && renderer.setAnimationLoop(null); renderer && renderer.dispose(); } catch (e) { /* ignore */ }
  const c = view.querySelector('canvas'); if (c) c.remove();
  console.info('[f4] staying on the poster:', why);
}
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { return false; }
}

/* ------------------------------------------------------------------ where everything is (three.js axes: x right, y up, z toward the chair) */
const DOME = new THREE.Vector3(-1.0, 2.05, 0.9);          // centre of the glass shade
const WALL_Z = -2.7;
const WIN = { x0: -0.5, x1: 4.5, y0: 1.05, y1: 5.6 };
const MUG = new THREE.Vector3(-1.5, 0, -1.85);
const LAMP_BASE = new THREE.Vector3(-2.65, 0, -1.05);
const CRAB_SCALE = 1.45;

// two arrangements of the same desk: wide screens spread the things out, tall screens stack them toward the chair
const LAYOUT = {
  wide: {
    crab: [0.0, 0.1],
    map: { p: [2.0, 1.15], r: -7, s: 0.88 },
    pick: { p: [1.3, -1.72], r: 10 },
    solve: { p: [-1.04, 1.3], r: 12 },
    words: { p: [-2.4, -0.12], r: 20 },
    free: { p: [2.4, -0.3], r: -14 },
    news: { p: [3.5, -1.3], r: -18 },
    ask: { p: [-0.64, 2.06], r: 6 },
    cam: { fov: 27, target: [0.1, 0.78, 0.0], elev: 20.5, minDist: 9.5, halfW: 4.05 },
  },
  tall: {
    crab: [0.5, 0.1],
    news: { p: [1.5, -1.85], r: -8, s: 0.85 },
    pick: { p: [-1.02, 1.62], r: 10, s: 0.95 },
    free: { p: [1.4, 1.4], r: -20, s: 0.88 },
    words: { p: [-0.85, 2.8], r: 22, s: 0.84 },
    ask: { p: [0.9, 2.85], r: -4, s: 0.78 },
    solve: { p: [-0.9, 4.15], r: 10, s: 0.95 },
    map: { p: [0.72, 4.3], r: -4, s: 0.7 },
    cam: { fov: 38, target: [0.42, 0.72, -0.1], elev: 24, minDist: 6, halfW: 1.45 },   // phones: crab big, in the middle, between the words and the index
  },
};
// where each tag's thread ends (prop space) and how the crab answers a hover
const PROP = {
  map: { tag: [1.02, 0.16, -0.78], tagT: [-0.7, 0.66, 0.34], react: 'eyes_wide' },
  pick: { tag: [0.05, 1.72, 0], tagT: [-0.2, 1.75, 0], react: 'legs_tap' },
  solve: { tag: [-0.2, 0.36, -0.2], tagT: [-0.3, 0.3, -0.35], react: 'snap_L' },
  words: { tag: [-0.35, 0.7, 0], tagT: [-0.45, 0.62, -0.1], react: 'shell_puff' },
  free: { tag: [-0.5, 0.98, 0], tagT: [0.25, 0.95, 0], react: 'parcel_wiggle' },
  news: { tag: [0.1, 1.05, 0], tagT: [-0.3, 1.0, 0], react: 'lean_bubbles' },
  ask: { tag: [-0.45, 0.2, -0.3], tagT: [-0.5, 0.2, -0.35], react: 'wave_R' },
};

/* ------------------------------------------------------------------ the crab's clay (same look as c5: see ../../c5/crab.js) */
const SH = {
  uKeyDir: { value: new THREE.Vector3(0, 1, 0) }, uKeyCol: { value: new THREE.Vector3(1, 1, 1) },
  tClay: { value: null }, uTex: { value: 1 }, uUpV: { value: new THREE.Vector3(0, 1, 0) },
};
const CLAY_COMMON = /* glsl */`
varying vec3 vRest; varying vec3 vRestN;
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform float uHi; uniform vec3 uUpV;
uniform vec3 uSSS; uniform float uSSSAmt; uniform float uBump; uniform float uMottle;
uniform sampler2D tClay; uniform float uTex;
float triHeight(vec3 p) {
  vec3 w = pow(abs(normalize(vRestN)), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-5);
  const float s = 3.2;
  float hx = texture2D(tClay, p.yz * s).r, hy = texture2D(tClay, p.xz * s + 0.37).r, hz = texture2D(tClay, p.xy * s + 0.71).r;
  return hx * w.x + hy * w.y + hz * w.z;
}
float cH31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float cNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(cH31(i), cH31(i + vec3(1, 0, 0)), f.x), mix(cH31(i + vec3(0, 1, 0)), cH31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(cH31(i + vec3(0, 0, 1)), cH31(i + vec3(1, 0, 1)), f.x), mix(cH31(i + vec3(0, 1, 1)), cH31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float clayHeight(vec3 p) {
  float h = (cNoise(p * 5.5 + 1.7) - 0.5) * 0.0018;
  h += (cNoise(p * 14.0) - 0.5) * 0.0009;
#ifndef CLAY_LIGHT
  h += (triHeight(p) - 0.5) * 0.0007 * uTex;
  h += (cNoise(p * 210.0 + 2.3) - 0.5) * 0.00008;
#else
  h += (cNoise(p * 36.0 + 3.1) - 0.5) * 0.0009;
#endif
  return h;
}
`;
function clayMaterial(hex, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: hex, roughness: o.rough ?? 0.62, metalness: 0,
    sheen: o.sheen ?? 0.2, sheenRoughness: o.sheenRough ?? 0.62, sheenColor: new THREE.Color(o.sheenColor ?? 0xffd2a4),
    vertexColors: true, envMapIntensity: o.env ?? 0.7, specularIntensity: o.spec ?? 0.3,
  });
  const uHi = { value: 0 };
  m.userData.uHi = uHi;
  const U = {
    uSSS: { value: new THREE.Color(o.sss ?? 0xff7a38) }, uSSSAmt: { value: o.sssAmt ?? 0.22 },
    uBump: { value: o.bump ?? 1.0 }, uMottle: { value: o.mottle ?? 0.08 },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, { uKeyDir: SH.uKeyDir, uKeyCol: SH.uKeyCol, uHi, tClay: SH.tClay, uTex: SH.uTex, uUpV: SH.uUpV });
    if (LIGHT) sh.defines = Object.assign(sh.defines || {}, { CLAY_LIGHT: '' });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRest; varying vec3 vRestN;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvRestN = objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + CLAY_COMMON)
      .replace('#include <color_fragment>', /* glsl */`
        float aoV = 1.0;
        #if defined( USE_COLOR_ALPHA ) || defined( USE_COLOR )
          aoV = vColor.r;
        #endif
        diffuseColor.rgb *= mix(1.0, aoV, 0.3);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.0, 0.86, 0.76), (1.0 - aoV) * 0.3);
        diffuseColor.rgb *= 1.0 + 0.05 * max(0.0, dot(normalize(vNormal), uUpV));
        diffuseColor.rgb *= 1.0 + (cNoise(vRest * 4.0 + 11.0) - 0.5) * uMottle + (cNoise(vRest * 23.0 + 5.0) - 0.5) * uMottle * 0.35;
      `)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        {
          vec3 sp = -vViewPosition;
          vec3 dpdx = dFdx(sp), dpdy = dFdy(sp);
          float hh = clayHeight(vRest) * uBump;
          float dhx = dFdx(hh), dhy = dFdy(hh);
          vec3 r1 = cross(dpdy, normal), r2 = cross(normal, dpdx);
          float det = dot(dpdx, r1);
          vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
          vec3 nb = abs(det) * normal - grad;
          normal = dot(nb, nb) > 1e-12 ? normalize(nb) : normal;
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          float fr = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          totalEmissiveRadiance += vec3(1.0, 0.6, 0.36) * uHi * (0.05 + 0.34 * fr * fr);
        }`)
      .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
        {
          float ndl = dot(normal, uKeyDir);
          float band = smoothstep(-0.5, 0.06, ndl) * (1.0 - smoothstep(0.06, 0.62, ndl));
          reflectedLight.directDiffuse += diffuseColor.rgb * uSSS * uKeyCol * band * uSSSAmt * RECIPROCAL_PI;
        }`)
      .replace('#include <aomap_fragment>', /* glsl */`#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= aoV;
        reflectedLight.indirectSpecular *= mix(1.0, aoV, 0.8);
      `);
  };
  m.customProgramCacheKey = () => 'f2-clay' + (LIGHT ? 'L' : 'H');
  return m;
}

/* ------------------------------------------------------------------ pictures drawn on paper (map, note, card, dial …) */
const FONT_ZH = '"Huninn", "PingFang TC", "Noto Sans TC", sans-serif';
const FONT_EN = '"Outfit", "Huninn", sans-serif';
const paints = [];                   // redraw once the web fonts have arrived
function paper(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = opts.flipY ?? false; tex.anisotropy = 8;
  const paint = (...a) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); draw(ctx, w, h, ...a); tex.needsUpdate = true; };
  paint(...(opts.args || []));
  paints.push(() => paint(...(tex.userData.args || opts.args || [])));
  tex.userData.paint = (...a) => { tex.userData.args = a; paint(...a); };
  return tex;
}
function speckle(ctx, w, h, n, col) {
  let s = 12345;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) ctx.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5);
}
function drawMap(ctx, w, h, st) {
  st = st || { lit: [], counts: [], here: 0, known: 0, total: 33, done: 0 };
  ctx.fillStyle = '#f3e7cb'; ctx.fillRect(0, 0, w, h);
  speckle(ctx, w, h, 900, 'rgba(120,90,50,0.07)');
  // the sea is the paper; five islands, one for each stretch of the course. The ones you have started are lit.
  const isl = ISLANDS;
  ctx.lineJoin = 'round';
  isl.forEach(([x, y, r, col], k) => {
    const on = !!st.lit[k];
    if (on) {
      const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w * 1.5);
      g.addColorStop(0, 'rgba(255,200,87,0.85)'); g.addColorStop(0.55, 'rgba(255,200,87,0.4)'); g.addColorStop(1, 'rgba(255,200,87,0)');
      ctx.fillStyle = g; ctx.fillRect((x - r * 1.6) * w, y * h - r * w * 1.6, r * w * 3.2, r * w * 3.2);
    }
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = r * w * (0.5 + 0.09 * Math.sin(a * 3 + k * 1.7) + 0.06 * Math.sin(a * 5 + k));
      const px = x * w + Math.cos(a) * rr * 1.25, py = y * h + Math.sin(a) * rr * 0.9;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.globalAlpha = on ? 1 : 0.55; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = on ? '#ff6b57' : 'rgba(58,46,92,0.32)'; ctx.lineWidth = on ? 5 : 2.5; ctx.stroke();
    ctx.strokeStyle = on ? 'rgba(255,107,87,0.2)' : 'rgba(58,46,92,0.12)'; ctx.lineWidth = on ? 14 : 9; ctx.stroke();
  });
  // the route
  ctx.setLineDash([10, 13]); ctx.lineCap = 'round'; ctx.strokeStyle = '#ff6b57'; ctx.lineWidth = 6;
  ctx.beginPath();
  isl.forEach(([x, y], k) => {
    if (!k) ctx.moveTo(x * w, y * h);
    else { const [px, py] = isl[k - 1]; ctx.bezierCurveTo((px + 0.07) * w, (py + (k % 2 ? -0.22 : 0.2)) * h, (x - 0.08) * w, (y + (k % 2 ? -0.06 : 0.12)) * h, x * w, y * h); }
  });
  ctx.stroke(); ctx.setLineDash([]);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  isl.forEach(([x, y], k) => {
    ctx.fillStyle = st.lit[k] ? '#ff6b57' : '#3a2e5c'; ctx.beginPath(); ctx.arc(x * w, y * h, 19, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff4e0'; ctx.font = `600 24px ${FONT_EN}`; ctx.fillText(String(k + 1), x * w, y * h + 1.5);
  });
  // title, top right, and how far you are
  ctx.textAlign = 'right'; ctx.fillStyle = '#3a2e5c';
  ctx.font = `66px ${FONT_ZH}`; ctx.fillText('學習地圖', 0.955 * w, 0.14 * h);
  const line = st.known ? `你會了 ${st.known} / ${st.total} 課` : st.done ? '第 1 站亮了' : `${st.total} 課`;
  ctx.font = `34px ${FONT_ZH}`; ctx.fillStyle = st.known || st.done ? '#c83a26' : 'rgba(58,46,92,0.62)'; ctx.fillText(line, 0.95 * w, 0.255 * h);
  // compass, top left
  ctx.save(); ctx.translate(0.075 * w, 0.17 * h); ctx.strokeStyle = 'rgba(58,46,92,0.5)'; ctx.fillStyle = 'rgba(58,46,92,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(8, 0); ctx.lineTo(0, 44); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
  // folds
  ctx.strokeStyle = 'rgba(120,90,50,0.16)'; ctx.lineWidth = 3;
  [0.25, 0.5, 0.75].forEach((x) => { ctx.beginPath(); ctx.moveTo(x * w, 0); ctx.lineTo(x * w, h); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(58,46,92,0.25)'; ctx.lineWidth = 6; ctx.strokeRect(14, 14, w - 28, h - 28);
}
function drawSticky(ctx, w, h, p = 0) {
  ctx.fillStyle = '#ffd273'; ctx.fillRect(0, 0, w, h);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // the box
  ctx.strokeStyle = '#3a2e5c'; ctx.lineWidth = 9;
  ctx.strokeRect(0.12 * w, 0.3 * h, 0.2 * w, 0.2 * h);
  // the troublesome thing: a tangled line
  ctx.lineWidth = 7; ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const t = i / 60; const x = (0.42 + 0.44 * t) * w; const y = (0.4 + 0.045 * Math.sin(t * 21) * (1 - p * 0.85) + 0.02 * Math.sin(t * 47) * (1 - p)) * h;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.28; ctx.lineWidth = 6;
  [0.64, 0.78].forEach((y, k) => { ctx.beginPath(); ctx.moveTo(0.12 * w, y * h); ctx.lineTo((k ? 0.6 : 0.86) * w, y * h); ctx.stroke(); });
  ctx.globalAlpha = 1;
  // the tick, drawn as you look
  if (p > 0.01) {
    const pts = [[0.14, 0.4], [0.21, 0.48], [0.38, 0.22]];
    ctx.strokeStyle = '#ff6b57'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    const a = Math.min(1, p * 2.4), b = clamp((p - 0.4) / 0.6, 0, 1);
    ctx.lineTo(lerp(pts[0][0], pts[1][0], a) * w, lerp(pts[0][1], pts[1][1], a) * h);
    if (b > 0) ctx.lineTo(lerp(pts[1][0], pts[2][0], b) * w, lerp(pts[1][1], pts[2][1], b) * h);
    ctx.stroke();
  }
}
function drawCard(ctx, w, h) {
  ctx.fillStyle = '#f6ecd6'; ctx.fillRect(0, 0, w, h);
  speckle(ctx, w, h, 300, 'rgba(120,90,50,0.06)');
  ctx.fillStyle = '#3a2e5c'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = `64px ${FONT_ZH}`; ctx.fillText('你想學什麼？', 0.09 * w, 0.3 * h);
  ctx.strokeStyle = '#ff6b57'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.setLineDash([2, 16]);
  ctx.beginPath(); ctx.moveTo(0.09 * w, 0.58 * h); ctx.lineTo(0.9 * w, 0.58 * h); ctx.stroke();
  ctx.strokeStyle = 'rgba(58,46,92,0.3)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0.09 * w, 0.8 * h); ctx.lineTo(0.9 * w, 0.8 * h); ctx.stroke();
  ctx.setLineDash([]);
}
function drawEnvelope(ctx, w, h) {
  ctx.fillStyle = '#f8f1e2'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a2e5c'; ctx.fillRect(w * 0.07, h * 0.76, w * 0.2, h * 0.1); ctx.fillStyle = '#f8f1e2'; ctx.font = `${Math.round(h * 0.062)}px ${FONT_ZH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('限時專送', w * 0.17, h * 0.812);
  // airmail edge in our two colours
  const b = 22; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.rect(b, b, w - 2 * b, h - 2 * b); ctx.clip('evenodd');
  for (let i = -h; i < w + h; i += 44) {
    ctx.fillStyle = (Math.round(i / 44) % 2) ? '#ff6b57' : '#3a2e5c';
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 22, 0); ctx.lineTo(i + 22 - h, h); ctx.lineTo(i - h, h); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // the seams of the back of an envelope
  ctx.strokeStyle = 'rgba(120,90,50,0.22)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(b, h - b); ctx.lineTo(w / 2, h * 0.42); ctx.lineTo(w - b, h - b); ctx.stroke();
}
function drawSpine(ctx, w, h) {
  ctx.fillStyle = '#2f5d50'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f1dfa8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(h * 0.5)}px ${FONT_ZH}`; ctx.fillText('AI 名詞小字典', w / 2, h * 0.53);
  ctx.fillRect(0.04 * w, 0.1 * h, 0.92 * w, 4); ctx.fillRect(0.04 * w, 0.9 * h - 4, 0.92 * w, 4);
}
function drawCoverLabel(ctx, w, h) {
  ctx.fillStyle = '#f1e4c6'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2f5d50'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(h * 0.29)}px ${FONT_ZH}`; ctx.fillText('AI 名詞小字典', w / 2, h * 0.42);
  ctx.font = `500 ${Math.round(h * 0.17)}px ${FONT_EN}`; ctx.globalAlpha = 0.7; ctx.fillText('A  —  Z', w / 2, h * 0.78); ctx.globalAlpha = 1;
}
function drawDial(ctx, w, h) {
  ctx.fillStyle = '#1d1512'; ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffcf80'); g.addColorStop(1, '#ff9a3a');
  ctx.fillStyle = g; ctx.fillRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = '#3a2413'; ctx.strokeStyle = '#3a2413';
  for (let i = 0; i <= 40; i++) { const x = 30 + (w - 60) * i / 40; const big = i % 5 === 0; ctx.fillRect(x - (big ? 1.5 : 1), h * 0.56, big ? 3 : 2, big ? h * 0.24 : h * 0.13); }
  ctx.font = `600 ${Math.round(h * 0.2)}px ${FONT_EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ['88', '92', '96', '100', '104'].forEach((s, i) => ctx.fillText(s, 30 + (w - 60) * (i * 10) / 40 + (i === 0 ? 8 : i === 4 ? -12 : 0), h * 0.33));
}
function drawSpeaker(ctx, w, h) {
  ctx.fillStyle = '#8a6a48'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(40,24,12,0.55)';
  for (let y = 6; y < h; y += 12) for (let x = (Math.round(y / 12) % 2) * 6 + 6; x < w; x += 12) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
}
function drawGiftTag(ctx, w, h) {
  ctx.fillStyle = '#f6ecd6'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a2e5c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(h * 0.52)}px ${FONT_ZH}`; ctx.fillText('給你', w * 0.56, h * 0.54);
  ctx.beginPath(); ctx.arc(w * 0.12, h * 0.5, h * 0.09, 0, 7); ctx.fill();
}
function drawCity(ctx, w, h) {
  // the town across the street, as three masks: red = near roofs, green = far roofs, blue = lit windows
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  let s = 77;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const base = h;                                   // bottom of the canvas = 2 degrees under the painted horizon
  const row = (col, hMin, hMax, wMin, wMax, extras) => {
    let x = -20;
    while (x < w) {
      const bw = wMin + r() * (wMax - wMin); const bh = hMin + r() * (hMax - hMin);
      ctx.fillStyle = col; ctx.fillRect(x, base - bh, bw + 1, bh);
      if (extras) {
        const k = r();
        if (k < 0.34) {                              // a water tower on legs: the roofline of every Taiwanese town
          const tx = x + bw * (0.2 + r() * 0.5), tw = 15 + r() * 7, th = 15 + r() * 6;
          ctx.fillRect(tx, base - bh - 8 - th, tw, th); ctx.fillRect(tx + 2, base - bh - 8, 2, 8); ctx.fillRect(tx + tw - 4, base - bh - 8, 2, 8);
          ctx.beginPath(); ctx.ellipse(tx + tw / 2, base - bh - 8 - th, tw / 2, 3, 0, 0, 7); ctx.fill();
        } else if (k < 0.6) {                        // the stair head
          ctx.fillRect(x + bw * (0.1 + r() * 0.5), base - bh - 14 - r() * 8, 26 + r() * 16, 24);
        } else if (k < 0.8) {                        // an aerial
          const ax = x + bw * (0.2 + r() * 0.6); ctx.fillRect(ax, base - bh - 34 - r() * 14, 2, 50); ctx.fillRect(ax - 7, base - bh - 28, 16, 2); ctx.fillRect(ax - 5, base - bh - 20, 12, 2);
        }
        if (r() < 0.5) ctx.fillRect(x, base - bh - 4, bw, 2);        // a parapet rail
        // a few windows with the light on
        const n = 1 + Math.floor(r() * 6.5);
        for (let i = 0; i < n; i++) { ctx.fillStyle = `rgb(0,0,${Math.round(50 + r() * 205)})`; ctx.fillRect(x + 8 + r() * (bw - 20), base - bh + 10 + r() * Math.max(4, bh - 36), 7, 9); }
      }
      x += bw + (extras ? r() * 5 : 0);
    }
  };
  row('#00ff00', h * 0.3, h * 0.5, 26, 80, false);
  row('#ff0000', h * 0.16, h * 0.38, 70, 190, true);
  ctx.globalCompositeOperation = 'source-over';
}
function glowTexture(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(0.28, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ------------------------------------------------------------------ rain you can hear (e10's light-rain mix): made in the browser, silent until asked */
class RainSound {
  constructor() { this.ctx = null; this.on = false; this.muffle = 0; }
  build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    const ctx = this.ctx = new AC();
    const len = ctx.sampleRate * 3; const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let b0 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.985 * b0 + 0.015 * w; d[i] = w * 0.55 + b0 * 6.0; } }
    this.buf = buf;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.tone = ctx.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 9000; this.tone.Q.value = 0.2;
    this.master.connect(this.tone); this.tone.connect(ctx.destination);
    const layer = (type, f, q, gain, rate) => {
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.loopStart = Math.random(); s.loopEnd = 3;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain; s.connect(fl); fl.connect(g); g.connect(this.master); s.start(0, Math.random() * 2);
      return g;
    };
    // light, steady rain (Thomas: the first mix sounded like a downpour): mostly a soft hiss, hardly any low rumble
    layer('highpass', 3200, 0.3, 0.03, 1.0);
    this.body = layer('bandpass', 1100, 0.5, 0.035, 0.9);
    layer('lowpass', 220, 0.4, 0.025, 0.61);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 0.012; lfo.connect(lg); lg.connect(this.body.gain); lfo.start();
    return true;
  }
  tick() {      // one drop on the glass or the sill
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = this.buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 2600; f.Q.value = 3 + Math.random() * 5;
    const g = ctx.createGain(); const pk = (0.012 + Math.random() * 0.04) * (1 - 0.6 * this.muffle);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.07);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) p.pan.value = Math.random() * 1.6 - 0.8;
    s.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(this.master); } else g.connect(this.master);
    s.start(t, Math.random() * 2.5, 0.2);
  }
  set(on) {
    if (on && !this.ctx && !this.build()) return false;
    this.on = on; const ctx = this.ctx; if (!ctx) return false;
    if (on) ctx.resume();
    this.master.gain.cancelScheduledValues(ctx.currentTime); this.master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, on ? 0.8 : 0.18);
    if (!on) setTimeout(() => { if (!this.on) ctx.suspend(); }, 900);
    return true;
  }
  setMuffle(k) { this.muffle = k; if (this.ctx) this.tone.frequency.setTargetAtTime(9000 - 6800 * k, this.ctx.currentTime, 0.2); }   // 0 = window, 1 = behind closed curtains
}
const RAIN = new RainSound();

/* the mist remembers where it was wiped: a small texture that slowly fogs over again (e10's Wiper) */
class Wiper {
  constructor(aspect) {
    const w = 768, h = Math.round(w / aspect);
    const opt = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.a = new THREE.WebGLRenderTarget(w, h, opt); this.b = new THREE.WebGLRenderTarget(w, h, opt);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tPrev: { value: null }, uA: { value: new THREE.Vector2(-9, -9) }, uB: { value: new THREE.Vector2(-9, -9) }, uR: { value: 0.035 }, uOn: { value: 0 }, uDt: { value: 0 }, uAsp: { value: aspect }, uBack: { value: 1 / 22 }, uPx: { value: 1 / h } },
      depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D tPrev; uniform vec2 uA, uB; uniform float uR, uOn, uDt, uAsp, uBack, uPx; varying vec2 vUv;
        float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
        float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0); return length(pa - ba * h); }
        void main(){
          float v = texture2D(tPrev, vUv).r;
          // here and there a thin thread of what was wiped above creeps down
          float cx = vUv.x * 46.0, c = h11(floor(cx) * 3.17);
          float thread = smoothstep(0.5, 0.2, abs(fract(cx) - 0.5)) * step(0.9, c);
          float up = texture2D(tPrev, vUv + vec2(0.0, uPx * 1.2)).r;
          v = max(v, up * thread * (0.9 + 0.08 * h11(c * 7.0)) - 0.03);
          v = max(0.0, v - uDt * uBack);
          vec2 a = vec2(uAsp, 1.0);
          float brush = smoothstep(uR, uR * 0.4, seg(vUv * a, uA * a, uB * a)) * uOn;
          gl_FragColor = vec4(max(v, brush), 0.0, 0.0, 1.0);
        }`,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.last = null; this.pending = [];
  }
  get texture() { return this.a.texture; }
  stroke(u, v) { if (u == null) { this.last = null; return; } this.pending.push([this.last ? this.last[0] : u, this.last ? this.last[1] : v, u, v]); this.last = [u, v]; }   // null lifts the finger
  step(renderer, dt) {
    const U_ = this.mat.uniforms;
    const n = Math.max(1, Math.min(4, this.pending.length));
    for (let i = 0; i < n; i++) {
      const s = this.pending.shift();
      U_.tPrev.value = this.a.texture; U_.uDt.value = i === 0 ? dt : 0;
      if (s) { U_.uA.value.set(s[0], s[1]); U_.uB.value.set(s[2], s[3]); U_.uOn.value = 1; } else U_.uOn.value = 0;
      renderer.setRenderTarget(this.b); renderer.render(this.scene, this.cam);
      const x = this.a; this.a = this.b; this.b = x;
    }
    this.pending.length = 0;
    renderer.setRenderTarget(null);
  }
  clear(renderer) { const c = renderer.getClearColor(new THREE.Color()), al = renderer.getClearAlpha(); [this.a, this.b].forEach((rt) => { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); }); renderer.setRenderTarget(null); renderer.setClearColor(c, al); }
}
const GLSL_NOISE = /* glsl */`
  float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
`;

/* ------------------------------------------------------------------ boot */
if (Q.has('nogl') || !webglOK()) fallback('no WebGL2');
else boot().catch((e) => { console.error('[f4] 3D failed', e); fallback('error'); });

async function boot() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); canvas.tabIndex = -1;
  view.append(canvas);                  // over the poster, which stays underneath for good

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LIGHT ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x17122a, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 0.5, 80);

  /* ---------------- load */
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const tl = new THREE.TextureLoader();
  const baked = (url) => tl.loadAsync(url).then((t) => { t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t; });
  const [setG, propsG, crabG, gains, tDetD, tDetL, tWallD, tWallL, tDeskD, tWood, tClay] = await Promise.all([
    loader.loadAsync('set.glb'), loader.loadAsync('props.glb'), loader.loadAsync('crab-f4.glb'),
    fetch('tex/gains.json').then((r) => r.json()),
    baked('tex/detail_dusk.webp'), baked('tex/detail_lamp.webp'), baked('tex/wall_dusk.webp'), baked('tex/wall_lamp.webp'),
    tl.loadAsync('tex/desk_dusk.webp'), tl.loadAsync('tex/wood.webp'),
    LIGHT ? Promise.resolve(null) : tl.loadAsync('../../c5/clay_height.webp'),
  ]);
  if (dead) return;
  clearTimeout(failTimer);                 // everything has arrived: from here it is only building, which a slow phone may take a while over
  if (tClay) { tClay.wrapS = tClay.wrapT = THREE.RepeatWrapping; tClay.colorSpace = THREE.NoColorSpace; tClay.anisotropy = 4; SH.tClay.value = tClay; } else SH.uTex.value = 0;

  /* ---------------- light state: L.lamp is the lamp (0 off … 1 on), L.adapt is the eye getting used to it */
  const L = { on: true, lamp: 0, glass: 0, adapt: new Spring(0, 1.6, 1), flick: null, flickT: 0 };
  const U = {                           // shared uniforms
    uLamp: { value: 0 }, uDuskLevel: { value: 1 }, uTime: { value: 0 }, uGlass: { value: 0 }, uNight: { value: 0 },
  };

  // the lamp as baked was #ffb46a (linear 1, .46, .14): far too orange. A warm bulb seen by an eye that has settled is nearer (1, .70, .42).
  const LAMP_TINT = new THREE.Vector3(1.0, 1.52, 2.9);
  const LAMP_RGB = 0xffdaae;
  /* ---------------- the baked set */
  const bakedMat = (tD, tL, gD, gL, side = THREE.FrontSide) => new THREE.ShaderMaterial({
    uniforms: { tDusk: { value: tD }, tLamp: { value: tL }, uGD: { value: gD }, uGL: { value: gL }, uLamp: U.uLamp, uDuskLevel: U.uDuskLevel, uTint: { value: LAMP_TINT } },
    side,
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDusk; uniform sampler2D tLamp; uniform float uGD; uniform float uGL; uniform float uLamp; uniform float uDuskLevel; uniform vec3 uTint;
      varying vec2 vUv;
      void main() {
        vec3 d = texture2D(tDusk, vUv).rgb; d *= d; d *= d;          // stored as the 4th root: the dark end keeps its steps
        d *= vec3(0.74, 0.84, 1.12);                                   // f3: a rainy night, not a sunset
        vec3 l = texture2D(tLamp, vUv).rgb; l *= l; l *= l;
        gl_FragColor = vec4(d * (uGD * uDuskLevel) + l * uTint * (uGL * uLamp), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const LAMP_GAIN = 0.72;
  const matDetail = bakedMat(tDetD, tDetL, gains.detail_dusk, gains.detail_lamp * LAMP_GAIN, THREE.DoubleSide);
  const matWall = bakedMat(tWallD, tWallL, gains.wall_dusk, gains.wall_lamp * LAMP_GAIN);
  tWood.colorSpace = THREE.SRGBColorSpace; tWood.wrapS = tWood.wrapT = THREE.RepeatWrapping; tWood.repeat.set(3.4, 1.6); tWood.flipY = false;
  tWood.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tDeskD.colorSpace = THREE.SRGBColorSpace; tDeskD.flipY = false;
  const matDesk = new THREE.MeshStandardMaterial({ map: tWood, roughness: 0.56, metalness: 0, lightMap: tDeskD, lightMapIntensity: 1, envMapIntensity: 0.15 });
  matDesk.onBeforeCompile = (sh) => {
    // the evening light on the desk is in its light map already; keep the sky dome light off it
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>',
      THREE.ShaderChunk.lights_fragment_begin.replace(/#if \( NUM_HEMI_LIGHTS > 0 \)[\s\S]*?#endif/, ''));
  };
  matDesk.customProgramCacheKey = () => 'f2-desk';
  const setRoot = setG.scene; scene.add(setRoot);
  const groupOf = (o) => { for (let x = o; x; x = x.parent) { const n = x.userData.name || x.name; if (n === 'detail' || n === 'wall' || n === 'desk') return n; } return null; };
  let deskMesh = null;
  setRoot.traverse((o) => {
    if (!o.isMesh) return;
    const g = groupOf(o);
    if (g === 'desk') { o.material = matDesk; o.receiveShadow = true; deskMesh = o; }
    else if (g === 'wall') { o.material = matWall; }
    else { o.material = matDetail; o.castShadow = true; }
  });

  /* ---------------- lights */
  const hemi = new THREE.HemisphereLight(0x6d7fe0, 0x262036, 1);           // the evening sky coming in at the window
  const rim = new THREE.DirectionalLight(0xa3aaff, 1);                     // the last light, from behind: an edge on everything
  rim.position.set(3.2, 3.4, -7); rim.target.position.set(0, 0.4, 0);
  const spot = new THREE.SpotLight(LAMP_RGB, 0, 0, 1.33, 1, 1.55);            // the pool under the shade
  spot.position.set(DOME.x, DOME.y - 0.02, DOME.z); spot.target.position.set(DOME.x, 0, DOME.z);
  const glow = new THREE.PointLight(0xffc890, 0, 0, 2);                    // what comes through the milk glass
  glow.position.set(DOME.x, DOME.y + 0.1, DOME.z);
  const bounce = new THREE.HemisphereLight(0x000000, 0xffc890, 0);         // lamp light coming back up off the desk
  scene.add(hemi, rim, rim.target, spot, spot.target, glow, bounce);
  spot.castShadow = SHADOWS; spot.shadow.mapSize.setScalar(LIGHT ? 1024 : 2048); spot.shadow.camera.near = 0.3; spot.shadow.camera.far = 9;
  spot.shadow.focus = 0.9; spot.shadow.bias = LIGHT ? -0.001 : -0.0005; spot.shadow.normalBias = LIGHT ? 0.045 : 0.03;
  const SPOT_I = 21.5, GLOW_I = 2.2;

  /* ---------------- what the shiny things reflect: one little world with the lamp, one without */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const makeEnv = (lampOn) => {
    const s = new THREE.Scene();
    const basic = (c, side) => new THREE.MeshBasicMaterial({ color: c, side: side ?? THREE.DoubleSide });
    s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 20, 12), basic(new THREE.Color(lampOn ? 0x1c1418 : 0x0e0c1c), THREE.BackSide)));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), basic(new THREE.Color(0.55, 0.42, 1.0))); win.position.set(5, 6, -14); win.lookAt(0, 0.6, 0); s.add(win);
    const hor = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.2), basic(new THREE.Color(2.0, 0.9, 0.5))); hor.position.set(5, 1.8, -13.9); hor.lookAt(0, 0.6, 0); s.add(hor);
    if (lampOn) {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), basic(new THREE.Color(11, 6.4, 2.9))); lamp.position.set(-5.5, 9.5, 5); lamp.lookAt(0, 0.6, 0); s.add(lamp);
      const desk = new THREE.Mesh(new THREE.CircleGeometry(14, 24), basic(new THREE.Color(0.5, 0.26, 0.12))); desk.rotation.x = -Math.PI / 2; desk.position.y = -3; s.add(desk);
    }
    const t = pmrem.fromScene(s, 0.02).texture;
    s.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    return t;
  };
  const envOn = makeEnv(true), envOff = makeEnv(false);
  pmrem.dispose();
  scene.environment = envOff;

  /* ---------------- the lamp's glass shade, its halo, the pull chain */
  const domePts = []; for (let k = 0; k <= 14; k++) { const a = (k / 14) * 98 * D2R; domePts.push(new THREE.Vector2(Math.max(0.0001, 0.73 * Math.sin(a)), 0.4 * Math.cos(a))); }
  const domeMat = new THREE.ShaderMaterial({
    uniforms: { uGlass: U.uGlass, uDuskLevel: U.uDuskLevel }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vP; varying vec3 vWP;
      void main() { vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uGlass; uniform float uDuskLevel;
      varying vec3 vP; varying vec3 vWP;
      void main() {
        vec3 outw = normalize(vec3(vP.x / 0.533, vP.y / 0.16, vP.z / 0.533));    // the shade is half an ellipsoid
        float f = dot(outw, normalize(cameraPosition - vWP));
        bool inside = f < 0.0; float ndv = abs(f);
        float hgt = clamp((vP.y + 0.06) / 0.46, 0.0, 1.0);                     // 0 at the rim, 1 on top
        // lit from inside: hot and pale where the glass faces you, deep orange where it turns away and up on the cap
        vec3 warm = mix(vec3(1.0, 0.50, 0.17), vec3(1.0, 0.80, 0.50), smoothstep(0.05, 0.95, ndv));
        float e = (1.15 + 2.1 * ndv * ndv) * mix(1.0, 0.7, hgt * hgt);
        if (inside) { warm = vec3(1.0, 0.86, 0.62); e = 3.4; }                 // looking up into the shade
        // off: milk glass under the evening sky
        float up = (inside ? -outw.y : outw.y) * 0.5 + 0.5;
        vec3 cold = vec3(0.34, 0.33, 0.50) * (0.3 + 0.7 * up) * 0.33 * uDuskLevel + pow(1.0 - ndv, 3.0) * vec3(0.10, 0.09, 0.2) * uDuskLevel;
        // any current at all and the glass already reads warm, only dimmer
        gl_FragColor = vec4(mix(cold, warm * e * max(uGlass, 0.22), smoothstep(0.0, 0.3, uGlass)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.LatheGeometry(domePts, 56), domeMat);
  dome.position.copy(DOME); dome.scale.setScalar(0.9); scene.add(dome);
  const haloMat = new THREE.SpriteMaterial({ map: glowTexture('rgba(255,196,128,0.85)', 'rgba(255,150,70,0.26)'), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0 });
  const halo = new THREE.Sprite(haloMat); halo.position.copy(DOME); halo.scale.setScalar(5.6); halo.renderOrder = 30; scene.add(halo);
  const brass = new THREE.MeshStandardMaterial({ color: 0xc49a52, roughness: 0.36, metalness: 1, envMapIntensity: 1.3 });
  const chain = new THREE.Group(); chain.position.set(DOME.x - 0.6, DOME.y - 0.03, DOME.z - 0.16); scene.add(chain);
  const chainLen = 0.6;
  const chainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, chainLen, 6), brass); chainRod.position.y = -chainLen / 2;
  const chainBead = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), brass); chainBead.position.y = -chainLen - 0.04;
  chain.add(chainRod, chainBead);
  const chainSw = { a: new Spring(0, 1.3, 0.12), b: new Spring(0, 1.5, 0.12), pull: new Spring(0, 0.22, 0.45) };

  /* ---------------- the rainy night outside, behind wet, misted glass you can wipe */
  const tCity = paper(2048, 256, drawCity, { flipY: true }); tCity.colorSpace = THREE.NoColorSpace; tCity.generateMipmaps = true; tCity.minFilter = THREE.LinearMipmapLinearFilter;
  const PANE = { w: WIN.x1 - WIN.x0 + 0.6, h: WIN.y1 - WIN.y0 + 0.6 };
  const GLASS_Z = WALL_Z - 0.3;
  const wiper = new Wiper(PANE.w / PANE.h); wiper.clear(renderer);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      uElH: { value: -0.2 }, uTime: U.uTime, uGlass: U.uGlass, uBright: { value: 1 }, tCity: { value: tCity }, uDomeM: { value: new THREE.Vector3() },
      tWipe: { value: wiper.texture }, uAsp: { value: PANE.w / PANE.h }, uMist: { value: parseFloat(Q.get('mist') || '0.66') },
    },
    vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uElH; uniform float uTime; uniform float uGlass; uniform float uBright; uniform float uAsp; uniform float uMist;
      uniform sampler2D tCity; uniform sampler2D tWipe; uniform vec3 uDomeM;
      varying vec3 vW; varying vec2 vUv;
      ${GLSL_NOISE}
      // what is out there, as a function of the direction you look in (so it sits at infinity however the chair moves)
      vec3 outside(vec3 d, float lod, float soft) {
        float e = degrees(asin(clamp(d.y, -1.0, 1.0)) - uElH);            // degrees above the painted horizon
        float a = degrees(atan(d.x, -d.z));
        // low rain cloud lit from underneath by the town: no sunset left, only a dull warm band on the horizon
        vec3 c = vec3(0.50, 0.29, 0.25);
        c = mix(c, vec3(0.27, 0.17, 0.28), smoothstep(0.0, 2.4, e));
        c = mix(c, vec3(0.125, 0.105, 0.235), smoothstep(1.4, 6.0, e));
        c = mix(c, vec3(0.062, 0.062, 0.16), smoothstep(5.0, 13.0, e));
        c = mix(c, vec3(0.03, 0.035, 0.10), smoothstep(11.0, 28.0, e));
        float cl = vnoise(vec2(a * 0.06 + uTime * 0.006, e * 0.5)) * 0.6 + vnoise(vec2(a * 0.17 - 3.0, e * 1.3 + 7.0)) * 0.4;
        c *= 0.8 + 0.55 * smoothstep(0.35, 0.75, cl) * smoothstep(0.8, 8.0, e);
        // the town across the lane
        vec2 uv = vec2(a / 64.0 + 0.5, clamp((e + 2.0) / 8.0, 0.0, 1.0));
        vec3 m = textureLod(tCity, uv, lod).rgb;
        float below = 1.0 - smoothstep(-2.2, -1.8, e);
        c = mix(c, vec3(0.09, 0.072, 0.145), m.g * 0.86);                 // far roofs, soft in the rain
        float top = clamp(m.r - textureLod(tCity, uv + vec2(0.0, 3.0 / 256.0), lod).r, 0.0, 1.0);
        c = mix(c, vec3(0.024, 0.019, 0.048), max(m.r, below));           // near roofs, dark and wet
        c += vec3(0.17, 0.18, 0.32) * top * (1.0 - soft);                 // the wet edge of a roof holding a little sky
        // windows with the light on, and their glow in the wet air
        float tw = 0.8 + 0.2 * sin(uTime * 0.9 + h21(floor(uv * vec2(400.0, 40.0))) * 30.0);
        c += vec3(1.7, 1.05, 0.44) * smoothstep(0.14, 0.24, m.b) * tw * (1.0 - below);
        c += vec3(1.0, 0.55, 0.2) * textureLod(tCity, uv, lod + 2.5).b * 4.5;
        // lamps and a couple of shop signs down in the lane: soft discs that swell in the mist and turn up small and sharp inside every drop
        for (int i = 0; i < 7; i++) {
          float fi = float(i);
          vec2 lp = vec2(-4.5 + fi * 3.7 + 1.3 * sin(fi * 2.7), -0.7 + 1.0 * h11(fi * 3.1 + 0.7));
          float rr = 0.34 + 0.26 * h11(fi * 5.7) + soft * 1.1;
          float dd = length((vec2(a, e) - lp) * vec2(1.0, 1.25));
          vec3 lc = i == 2 ? vec3(0.2, 0.62, 0.6) : (i == 5 ? vec3(0.9, 0.3, 0.42) : vec3(1.0, 0.64, 0.28));
          float fl = 0.88 + 0.12 * sin(uTime * (1.3 + fi * 0.37) + fi);
          c += lc * (smoothstep(rr, rr * 0.4, dd) * (1.25 - 0.85 * soft) + 0.2 * exp(-dd * dd / (rr * rr * 9.0))) * fl;
        }
        // a car goes by now and then: its lights wash along the wet lane
        float car = fract(uTime / 19.0);
        float cx = mix(-24.0, 42.0, car);
        c += vec3(1.0, 0.88, 0.66) * 0.55 * exp(-pow((a - cx) / 6.0, 2.0)) * exp(-pow((e + 1.3) / 1.5, 2.0)) * smoothstep(0.0, 0.06, car) * smoothstep(1.0, 0.92, car);
        return c;
      }
      // drops that gather, wait, then run down the pane (e10). xy = how the drop bends the view, z = drop, w = the clear trail it leaves
      float wigAt(float y, float n) { return sin(y * 7.0 + n * 6.2831) * 0.07 + sin(y * 17.0 + n * 3.1) * 0.025; }
      vec4 runners(vec2 p, float t, float cols, float seed) {
        const float TALL = 0.22;
        float cx = floor(p.x * cols);
        float c0 = h11(cx * 1.731 + seed), c1 = h11(cx * 5.127 + seed * 3.1);
        vec2 q = vec2(p.x * cols, (p.y + t * (0.02 + 0.03 * c1) + c0 * 7.0) * cols * TALL);
        vec2 id = floor(q), f = fract(q);
        float n0 = h21(id + seed * 13.0), n1 = h21(id.yx * 1.7 + 3.3 + seed);
        if (n0 < 0.42) return vec4(0.0);
        float ph = fract(t * (0.07 + 0.11 * n1) + n0 * 9.0);
        float run = smoothstep(0.5, 1.0, ph); run *= run;
        float y = mix(0.84, 0.1, run);
        float base = 0.5 + (n0 - 0.5) * 0.4;
        float x = base + wigAt(id.y + y, n0);
        float R = 0.15 + 0.11 * n1;
        vec2 d = vec2(f.x - x, (f.y - y) / TALL * 0.82);
        float life = smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.94, 1.0, ph));
        float m = smoothstep(R, R * 0.5, length(d)) * life;
        float tx = base + wigAt(id.y + f.y, n0);
        float tw = R * 0.62 * mix(0.35, 1.0, smoothstep(0.84, y, f.y));
        float tr = step(y, f.y) * step(f.y, 0.86) * smoothstep(tw, tw * 0.35, abs(f.x - tx)) * smoothstep(0.0, 0.08, run) * life;
        return vec4(d / R * m, m, tr);
      }
      vec3 beads(vec2 p, float t) {           // small beads that sit on the glass, swell and go
        vec2 q = p * 62.0; vec2 id = floor(q), f = fract(q) - 0.5;
        float n = h21(id), n2 = h21(id + 17.3);
        float life = fract(t * 0.035 + n * 7.0);
        float R = (0.1 + 0.24 * n2) * smoothstep(0.0, 0.25, life) * (1.0 - smoothstep(0.8, 1.0, life)) * step(0.5, n);
        vec2 d = f - (vec2(n, n2) - 0.5) * 0.55;
        float m = smoothstep(R, R * 0.4, length(d)) * step(0.001, R);
        return vec3(d / max(R, 1e-3) * m, m);
      }
      float streaks(vec2 p, float t) {        // rain in the air: thin fast lines, not many
        float s = 0.0;
        for (int i = 0; i < 2; i++) {
          float fi = float(i);
          vec2 q = vec2((p.x + p.y * 0.07) * (90.0 + fi * 60.0), p.y * (2.6 + fi * 1.4) + t * (3.2 + fi * 1.5));
          vec2 id = floor(q), f = fract(q);
          float n = h21(id + fi * 31.0);
          s += step(0.87, n) * smoothstep(0.22, 0.0, abs(f.x - 0.5)) * smoothstep(0.0, 0.25, f.y) * smoothstep(1.0, 0.55, f.y) * (0.6 - 0.2 * fi);
        }
        return s;
      }
      void main() {
        float t = uTime;
        vec2 p = vec2(vUv.x * uAsp, vUv.y);
        float wipe = texture2D(tWipe, vUv).r;
        vec4 r1 = runners(p, t, 20.0, 1.0), r2 = runners(p + 3.7, t * 1.13, 33.0, 2.0);
        vec3 bd = beads(p, t);
        vec2 lens = r1.xy + r2.xy + bd.xy * 0.7;
        float drop = clamp(r1.z + r2.z + bd.z, 0.0, 1.0);
        float trail = max(r1.w, r2.w);
        // condensation: thicker low down and round the edges, gone where a drop has just run or a finger has been
        float edge = 1.0 - smoothstep(0.0, 0.3, min(min(vUv.x, 1.0 - vUv.x) * uAsp, min(vUv.y * 1.5, 1.0 - vUv.y)));
        float mist0 = uMist * clamp(0.62 + 0.38 * edge + 0.3 * (vnoise(p * 3.2) - 0.5) + 0.12 * (1.0 - vUv.y), 0.0, 1.0);
        float clearK = max(max(smoothstep(0.06, 0.55, wipe), trail * 0.9), drop);
        float mist = mist0 * (1.0 - clearK);

        vec3 d = normalize(vW - cameraPosition);
        // a drop is a little lens: it shows a wide, upside-down piece of the view
        vec3 dl = normalize(d - vec3(lens * 0.22, 0.0) + vec3((vnoise(p * 9.0 + t * 0.04) - 0.5), (vnoise(p * 9.0 + 7.1 - t * 0.03) - 0.5), 0.0) * 0.003 * (1.0 - mist));
        vec3 col = outside(dl, mix(0.3, 4.6, mist), mist);
        float lum = dot(col, vec3(0.3, 0.5, 0.2));
        col += vec3(0.78, 0.8, 1.0) * streaks(p, t) * (0.012 + 0.28 * lum) * (1.0 - mist * 0.75);
        col *= uBright;
        // the mist: milky, lifts the darks, glows where there is light behind it
        vec3 glowCol = outside(d, 6.0, 1.0);
        col = mix(col, col * 0.82 + vec3(0.045, 0.04, 0.07) * uBright + glowCol * uBright * 0.22, mist);
        // each drop: a darker lip, and a warm glint from the room when the lamp is on
        float rim = smoothstep(0.4, 1.0, length(lens));
        col *= 1.0 - 0.4 * drop * rim;
        col += vec3(1.0, 0.86, 0.62) * uGlass * pow(max(0.0, dot(normalize(vec3(lens, 0.7)), normalize(vec3(-0.45, 0.55, 0.7)))), 20.0) * drop * 0.5;
        // a faint bright ridge of water along the edge of what was wiped
        float we = smoothstep(0.06, 0.28, wipe) * (1.0 - smoothstep(0.28, 0.7, wipe));
        col += vec3(1.0, 0.9, 0.74) * (0.3 + 0.7 * uGlass) * we * 0.04;
        // the glass as a mirror: the lamp in it, and the room's own glow low on the pane
        vec3 r = normalize(uDomeM - cameraPosition);
        float g = max(dot(d, r), 0.0);
        col += vec3(1.0, 0.62, 0.30) * uGlass * (pow(g, 900.0) * 1.0 + pow(g, 90.0) * 0.09) * (1.0 + mist);
        col += vec3(0.07, 0.035, 0.016) * uGlass * (0.6 + 0.8 * mist);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(PANE.w, PANE.h), skyMat);
  sky.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, GLASS_Z); scene.add(sky);
  skyMat.uniforms.uDomeM.value.set(DOME.x, DOME.y, 2 * GLASS_Z - DOME.z);
  // pointer on the glass -> a wipe
  const paneHit = (v, out) => {                      // where a pointer ray meets the pane, in pane uv; false if it misses
    ray.setFromCamera(v, camera);
    const o = ray.ray.origin, d = ray.ray.direction; if (Math.abs(d.z) < 1e-5) return false;
    const k = (GLASS_Z - o.z) / d.z; if (k <= 0) return false;
    const x = o.x + d.x * k, y = o.y + d.y * k;
    if (x < WIN.x0 + 0.02 || x > WIN.x1 - 0.02 || y < WIN.y0 + 0.05 || y > WIN.y1) return false;
    out.set((x - (WIN.x0 - 0.3)) / PANE.w, (y - (WIN.y0 - 0.3)) / PANE.h); return true;
  };

  /* ---------------- curtains: linen that pleats as it is pulled; shut, the rain is only a sound */
  const CURT = { open: true, k: new Spring(1, 0.9, 0.86), pull: 0, z: -2.12, top: 6.0, bot: 1.1 };
  const curtainMat = (dir, outer) => new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uOpen: { value: 1 }, uDir: { value: dir }, uOuter: { value: outer }, uTime: U.uTime, uPull: { value: 0 }, uLamp: U.uLamp, uDuskLevel: U.uDuskLevel, uDome: { value: DOME },
      uZ: { value: CURT.z }, uTop: { value: CURT.top }, uBot: { value: CURT.bot }, uWOpen: { value: 0.52 }, uWClosed: { value: 3.08 } },
    vertexShader: /* glsl */`
      uniform float uOpen, uDir, uOuter, uTime, uPull, uZ, uTop, uBot, uWOpen, uWClosed;
      varying vec3 vN; varying vec3 vW; varying float vFold; varying vec2 vQ;
      void main() {
        float u = position.x + 0.5, v = 0.5 - position.y;        // u: 0 at the wall side, 1 at the leading edge; v: 0 at the pole, 1 at the hem
        float width = mix(uWClosed, uWOpen, uOpen);
        const float N = 6.5;
        float ph = u * N * 6.2831853 + uDir * 0.7 + 0.7 * sin(u * 9.0 + uDir * 2.0);     // pleats are never quite even
        float amp = mix(0.016, 0.042, uOpen) * (0.5 + 0.5 * v);
        float lag = uPull * 0.24 * v * v * u;                    // the hem trails behind the hand
        float x = uOuter + uDir * u * width + lag;
        float z = uZ + amp * sin(ph) + 0.004 * sin(uTime * 0.7 + u * 5.0 + v * 2.2) * v;
        float y = mix(uTop, uBot, v) + 0.008 * cos(ph) * v * uOpen;
        vec3 P = vec3(x, y, z);
        vec3 T = vec3(uDir * width, 0.0, amp * cos(ph) * (N * 6.2831853 + 6.3 * cos(u * 9.0 + uDir * 2.0)) * 0.5);
        vN = normalize(cross(T, vec3(0.0, 1.0, 0.0))) * uDir;
        vFold = sin(ph); vW = P; vQ = vec2(u, v);
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpen, uTime, uLamp, uDuskLevel; uniform vec3 uDome;
      varying vec3 vN; varying vec3 vW; varying float vFold; varying vec2 vQ;
      ${GLSL_NOISE}
      void main() {
        vec3 n = normalize(vN); if (n.z < 0.0) n = -n;
        vec3 toL = uDome - vW; float d2 = dot(toL, toL);
        float lam = 0.5 + 0.5 * max(0.0, dot(n, normalize(toL)));
        float ao = mix(0.68, 1.0, smoothstep(-1.0, 0.6, vFold)) * mix(1.0, 0.9, uOpen);
        float weave = 0.96 + 0.04 * (vnoise(vec2(vQ.x * 260.0, vQ.y * 40.0)) + vnoise(vec2(vQ.x * 40.0, vQ.y * 520.0)) - 1.0);
        vec3 linen = vec3(0.93, 0.80, 0.62) * weave * mix(1.0, 0.86, smoothstep(0.975, 0.99, vQ.y));
        vec3 lamp = vec3(1.0, 0.70, 0.43) * uLamp * 7.5 / (2.0 + d2);          // falls off away from the shade
        vec3 dusk = vec3(0.105, 0.11, 0.23) * uDuskLevel * 0.3;
        vec3 col = linen * (lamp * lam + dusk) * ao;
        // the wet night behind the cloth, the rain's shadow running down it
        float rain = 0.7 + 0.3 * vnoise(vec2(vW.x * 30.0, vW.y * 2.4 + uTime * 1.1)) * (0.6 + 0.4 * vnoise(vec2(vW.x * 9.0, vW.y * 1.1 + uTime * 0.5)));
        float thin = mix(0.95, 0.3, uOpen) * (0.7 + 0.3 * vFold);
        col += linen * vec3(0.16, 0.17, 0.34) * thin * rain * 0.16 * uDuskLevel;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const curtainGeo = new THREE.PlaneGeometry(1, 1, 96, 18);
  const curtains = [curtainMat(1, WIN.x0 - 0.5), curtainMat(-1, WIN.x1 + 0.5)].map((m) => { const c = new THREE.Mesh(curtainGeo, m); c.frustumCulled = false; scene.add(c); return c; });
  // the pole and its rings (mostly above the frame; you see them when you lean back)
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, WIN.x1 - WIN.x0 + 1.5, 10).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4a3524 }));
    pole.position.set((WIN.x0 + WIN.x1) / 2, CURT.top + 0.03, CURT.z); scene.add(pole);
  }
  function setCurtain(open, instant) {
    CURT.open = open; CURT.k.target = open ? 1 : 0; if (instant) CURT.k.snap(open ? 1 : 0);
    setBtn(btnCurtain, open, '開', '關');
    RAIN.setMuffle(open ? 0 : 1);
  }
  function toggleCurtain() {
    setCurtain(!CURT.open); S.lastInteract = S.t; wiper.stroke(null);
    later(0.7, () => { if (!S.busy) say(CURT.open ? '還在下，小小的。' : '拉上了。現在只聽得到雨。', { hold: 2.6 }); });
  }
  function setRain(on) {
    const ok = RAIN.set(on); setBtn(btnRain, RAIN.on, '開', '關'); RAIN.setMuffle(CURT.open ? 0 : 1);
    if (on && !ok) say('這個瀏覽器放不出聲音。', { hold: 2.4 });
  }
  function pokeClock() {
    const d = new Date(); const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    S.clockRing = 1.1; S.lastInteract = S.t;
    say(`現在 ${hh}:${mm}。${d.getHours() >= 23 || d.getHours() < 5 ? '很晚了，學一點就好。' : d.getHours() < 11 ? '早安。' : '剛好，坐一下。'}`, { hold: 3.0 });
  }

  /* ---------------- steam off the mug, dust in the lamplight */
  const steamMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uLamp: U.uLamp, uDuskLevel: U.uDuskLevel }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uLamp; uniform float uDuskLevel; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float y = vUv.y; float t = uTime;
        float sway = sin(y * 4.2 + t * 0.9) * 0.10 * y + sin(y * 9.0 - t * 0.6) * 0.03 * y;
        float x = (vUv.x - 0.5 + sway) / mix(0.16, 0.42, y);
        float n = vnoise(vec2(vUv.x * 4.0 + sway * 3.0, y * 3.0 - t * 0.42)) * 0.6 + vnoise(vec2(vUv.x * 9.0, y * 7.0 - t * 0.7)) * 0.4;
        float a = smoothstep(1.0, 0.15, abs(x)) * smoothstep(0.0, 0.12, y) * smoothstep(1.0, 0.3, y) * smoothstep(0.28, 0.74, n);
        vec3 col = mix(vec3(0.45, 0.46, 0.75) * uDuskLevel * 0.3, vec3(1.0, 0.80, 0.58), uLamp);
        gl_FragColor = vec4(col, a * mix(0.10, 0.26, uLamp));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const steam = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.25), steamMat);
  steam.position.set(MUG.x, 0.62 + 0.62, MUG.z); steam.renderOrder = 6; scene.add(steam);

  const DUST_N = LIGHT ? 26 : 60;
  const dustGeo = new THREE.BufferGeometry();
  {
    const p = new Float32Array(DUST_N * 3), s = new Float32Array(DUST_N * 2);
    for (let i = 0; i < DUST_N; i++) {
      const a = rand(0, 6.283), r = Math.sqrt(Math.random()) * 2.3;
      p[i * 3] = DOME.x + Math.cos(a) * r; p[i * 3 + 1] = rand(0.15, 1.9); p[i * 3 + 2] = DOME.z + Math.sin(a) * r * 0.8;
      s[i * 2] = rand(0, 100); s[i * 2 + 1] = rand(0.5, 1.0);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); dustGeo.setAttribute('seed', new THREE.BufferAttribute(s, 2));
  }
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uLamp: U.uLamp, uPx: { value: 1 }, uDome: { value: DOME } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec2 seed; uniform float uTime; uniform float uPx; uniform vec3 uDome; varying float vA;
      void main() {
        vec3 p = position; float t = uTime * 0.11 + seed.x;
        p.x += sin(t * 1.3) * 0.22 + sin(t * 0.37) * 0.3; p.y += sin(t * 0.9 + seed.x) * 0.16 + 0.06 * sin(t * 2.3); p.z += cos(t * 1.1) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // only what floats inside the cone under the shade catches the light
        vec3 q = p - uDome; float cone = 1.0 - smoothstep(0.55, 1.0, length(q.xz) / max(0.2, -q.y * 1.5 + 0.35));
        vA = cone * seed.y * (0.6 + 0.4 * sin(uTime * 0.8 + seed.x * 7.0));
        gl_PointSize = uPx * (2.2 + 2.4 * seed.y) * (9.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uLamp; varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(1.0, 0.78, 0.5) * a * vA * uLamp * 0.5, 1.0); }`,
  });
  const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 7; scene.add(dust);

  /* ---------------- soft shadows that travel with things (contact; on phones they are the only shadows) */
  const blobTex = glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.55)'); blobTex.colorSpace = THREE.NoColorSpace;
  const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const blobs = [];
  function addBlob(parent, sx, sz, opts = {}) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blobTex, color: 0x0d0714, transparent: true, depthWrite: false, opacity: 0.5, toneMapped: false }));
    m.scale.set(sx, 1, sz); m.position.set(opts.x || 0, opts.y ?? 0.012, opts.z || 0); m.renderOrder = 2;
    parent.add(m); blobs.push({ m, on: opts.on ?? 0.34, off: opts.off ?? 0.62 });        // opacity with / without the shadow map
    return m;
  }
  addBlob(scene, 1.9, 1.7, { x: LAMP_BASE.x - 0.2, z: LAMP_BASE.z - 0.15, on: 0 }); addBlob(scene, 1.25, 1.1, { x: MUG.x - 0.08, z: MUG.z - 0.12, on: 0 });

  /* ---------------- the seven props */
  const propsRoot = propsG.scene; scene.add(propsRoot);
  const N = {};                                                   // every node by the name it had in Blender
  propsRoot.traverse((o) => { N[o.userData.name || o.name] = o; });
  const std = (color, roughness = 0.75, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, envMapIntensity: 0.6, ...extra });
  const tMap = paper(1280, 853, drawMap, { args: [mapState()] }); const tSticky = paper(384, 384, drawSticky, { args: [0] }); const tCard = paper(640, 408, drawCard);
  const PM = {
    paper_map: std(0xffffff, 0.92, { map: tMap, side: THREE.DoubleSide }),
    steel: std(0xd0d0d0, 0.3, { metalness: 1 }), coral: std(0xff6b57, 0.45),
    pencil_yellow: std(0xf2b93b, 0.5), pencil_coral: std(0xf07a5e, 0.5), eraser: std(0xe58f86, 0.9), pencil_wood: std(0xe0b88a, 0.8), graphite: std(0x3a3636, 0.5),
    brass, glaze_grape: new THREE.MeshPhysicalMaterial({ color: 0x43356b, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 0.9 }),
    cream_glaze: std(0xf1e4c6, 0.4), bamboo: std(0xd9b77c, 0.7),
    sticky: std(0xffc857, 0.85), sticky_top: std(0xffffff, 0.85, { map: tSticky, side: THREE.DoubleSide }),
    cloth_green: std(0x2f5d50, 0.95), pages: std(0xefe4c8, 0.9), label_cream: std(0xf1e4c6, 0.8), tab_grape: std(0x6b5aa0, 0.7),
    kraft: std(0xc89b6a, 0.92), string_coral: std(0xe0553f, 0.8), paper_yellow: std(0xf3c15a, 0.78), string_grape: std(0x3a2e5c, 0.8), paper_cream: std(0xffffff, 0.85, { map: tCard, side: THREE.DoubleSide }),
    walnut: std(0x6a4128, 0.5), enamel_cream: std(0xf1e4c6, 0.42), dial_dark: std(0x2a211c, 0.5), chrome: std(0xd6d2c8, 0.25, { metalness: 1, envMapIntensity: 1.2 }),
    paper_white: std(0xf8f1e2, 0.88), paper_flap: std(0xefe5cf, 0.88, { side: THREE.DoubleSide }), pen_grape: new THREE.MeshPhysicalMaterial({ color: 0x43356b, roughness: 0.28, clearcoat: 0.6, envMapIntensity: 0.9 }),
  };
  const plainCream = std(0xf6ecd6, 0.85);
  propsRoot.traverse((o) => {
    if (!o.isMesh) return;
    const mn = o.material && o.material.name;
    const nm = o.userData.name || o.name || '';
    o.material = (mn === 'paper_cream' && !/^ask:card/.test(nm)) ? plainCream : (PM[mn] || std(0xcccccc));
    o.castShadow = true; o.receiveShadow = true;
  });
  // decals: flat pictures laid on the props (prop space; +z is the side that faces the chair)
  const decal = (parent, w, h, tex, pos, rot, extra = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...extra }));
    tex.flipY = true; tex.needsUpdate = true;
    m.position.set(...pos); if (rot) m.rotation.set(...rot); m.receiveShadow = true; parent.add(m); return m;
  };
  const flat = [-Math.PI / 2, 0, 0];
  decal(N['prop:ask'], 1.34, 0.9, paper(804, 540, drawEnvelope), [0, 0.0312, 0], flat);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.014, 20), PM.coral); seal.position.set(0, 0.008, 0.47); seal.castShadow = true; N['ask:flap'].add(seal);
  decal(N['prop:words'], 0.98, 0.25, paper(784, 200, drawSpine), [0, 0.23, 0.4852], null);
  decal(N['words:cover'], 0.62, 0.3, paper(496, 240, drawCoverLabel), [0, 0.0478, -0.47], flat);
  decal(N['free:tag'], 0.34, 0.2, paper(272, 160, drawGiftTag), [0, 0.0088, 0], flat);
  decal(N['prop:news'], 0.5, 0.5, paper(256, 256, drawSpeaker), [-0.3, 0.45, 0.2405], null).geometry = new THREE.CircleGeometry(0.25, 40);
  const tDial = paper(368, 160, drawDial); tDial.flipY = true;
  const dialMat = new THREE.MeshBasicMaterial({ map: tDial, color: 0xffffff });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.2), dialMat); dial.position.set(0.32, 0.58, 0.248); N['prop:news'].add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.17, 0.004), new THREE.MeshBasicMaterial({ color: 0xe0402c })); needle.position.set(0.2, 0.58, 0.252); N['prop:news'].add(needle);
  const dialGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,190,110,0.5)', 'rgba(255,150,70,0.14)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  dialGlow.position.set(0.32, 0.58, 0.3); dialGlow.scale.setScalar(0.95); N['prop:news'].add(dialGlow);

  // rest pose of every node that moves
  const rest = new Map();
  const R0 = (n) => { if (!rest.has(n)) rest.set(n, { p: n.position.clone(), q: n.quaternion.clone() }); return rest.get(n); };
  const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
  const qT = new THREE.Quaternion(), vT = new THREE.Vector3();
  const turn = (n, axis, ang) => { const r = R0(n); n.quaternion.copy(r.q).premultiply(qT.setFromAxisAngle(axis, ang)); };   // about an axis of the parent

  const props = {};
  const hitTargets = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: DEBUG, wireframe: true, color: 0x00ffaa });
  IDS.forEach((id) => {
    const root = N['prop:' + id];
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const pad = id === 'map' ? 0.02 : 0.1;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x + pad * 2, Math.max(size.y, 0.14) + pad, size.z + pad * 2), hitMat);
    hit.position.copy(c); hit.userData.id = id; root.add(hit); hitTargets.push(hit);
    props[id] = { id, root, size, centre: c, h: new Spring(0, 0.3, 0.9), radius: Math.max(size.x, size.z) / 2, pos: new THREE.Vector3(), scale: 1 };
  });
  /* ---------------- finer things (f3): small parts added here rather than re-baked */
  const part = (parent, geo, mat, pos, rot) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const FINE = {};
  {
    // radio: a carrying handle, slats over the speaker, a pilot light
    const R_ = N['prop:news'];
    part(R_, new THREE.TorusGeometry(0.36, 0.022, 8, 28, Math.PI), brass, [-0.08, 0.84, 0]);
    part(R_, new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), brass, [-0.44, 0.86, 0]); part(R_, new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), brass, [0.28, 0.86, 0]);
    [-0.16, -0.08, 0, 0.08, 0.16].forEach((dy) => part(R_, new THREE.BoxGeometry(2 * Math.sqrt(0.245 * 0.245 - dy * dy), 0.02, 0.014), PM.enamel_cream, [-0.3, 0.45 + dy, 0.249]));
    FINE.pilot = part(R_, new THREE.SphereGeometry(0.024, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7a2a1c }), [0.585, 0.26, 0.245]);
    // dictionary: page edges you can count, a brass magnifier resting on the cover
    const W_ = N['prop:words'];
    const tEdge = paper(256, 128, (c, w, h) => { c.fillStyle = '#efe4c8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(120,96,60,0.28)'; for (let y = 3; y < h; y += 5) c.fillRect(0, y + (y % 3), w, 1); c.fillStyle = 'rgba(120,96,60,0.12)'; for (let i = 0; i < 6; i++) c.fillRect(0, 12 + i * 19, w, 3); });
    tEdge.flipY = true;
    const edgeMat = std(0xffffff, 0.92, { map: tEdge });
    part(W_, new THREE.PlaneGeometry(0.85, 0.38), edgeMat, [0.612, 0.23, -0.02], [0, Math.PI / 2, 0]);
    part(W_, new THREE.PlaneGeometry(0.85, 0.38), edgeMat, [-0.612, 0.23, -0.02], [0, -Math.PI / 2, 0]);
    const C_ = N['words:cover'];
    part(C_, new THREE.TorusGeometry(0.13, 0.02, 8, 28), brass, [0.42, 0.066, -0.2], [Math.PI / 2, 0, 0]);
    part(C_, new THREE.CylinderGeometry(0.115, 0.115, 0.008, 24), new THREE.MeshPhysicalMaterial({ color: 0xcfe0e6, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.35, envMapIntensity: 1.4 }), [0.42, 0.064, -0.2]);
    part(C_, new THREE.CylinderGeometry(0.022, 0.026, 0.26, 10), PM.walnut, [0.56, 0.066, -0.02], [Math.PI / 2, 0, 0.66]);
    // parcels: stamps and a postmark on the big box
    const tStamp = paper(336, 192, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      [[0.08, '#ff6b57'], [0.4, '#3a2e5c']].forEach(([x, col], i) => { c.fillStyle = '#f6ecd6'; c.fillRect(x * w, 0.12 * h, 0.27 * w, 0.62 * h); c.fillStyle = col; c.fillRect(x * w + 8, 0.12 * h + 8, 0.27 * w - 16, 0.62 * h - 16); c.fillStyle = '#f6ecd6'; c.beginPath(); c.arc(x * w + 0.135 * w, 0.4 * h, 16 - i * 4, 0, 7); c.fill(); });
      c.strokeStyle = 'rgba(40,30,60,0.6)'; c.lineWidth = 4; for (let i = 0; i < 4; i++) { c.beginPath(); for (let x = 0.5; x <= 0.98; x += 0.02) { const y = 0.3 + i * 0.12 + 0.03 * Math.sin(x * 40); if (x === 0.5) c.moveTo(x * w, y * h); else c.lineTo(x * w, y * h); } c.stroke(); }
    });
    tStamp.flipY = true;
    part(N['prop:free'], new THREE.PlaneGeometry(0.42, 0.24), std(0xffffff, 0.85, { map: tStamp, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0.2, 0.33, 0.383]);
    // map: a brass compass holding the far corner down; its needle swings when you look
    const cmp = new THREE.Group(); cmp.position.set(-1.13, 0.075, -0.6); N['prop:map'].add(cmp);
    part(cmp, new THREE.CylinderGeometry(0.17, 0.17, 0.07, 28), brass, [0, 0.035, 0]);
    part(cmp, new THREE.CylinderGeometry(0.145, 0.145, 0.006, 28), PM.enamel_cream, [0, 0.072, 0]);
    FINE.needle = part(cmp, new THREE.BoxGeometry(0.03, 0.006, 0.23), PM.coral, [0, 0.08, 0]);
    part(cmp, new THREE.CylinderGeometry(0.02, 0.02, 0.014, 10), brass, [0, 0.084, 0]);
    // the cup is for drawing lots: every stick in it is a bamboo slip with a red tip, and the cup says so
    ['s0', 's2', 's4'].forEach((k, i) => {
      const n = N['pick:' + k]; n.children.slice().forEach((c) => { c.visible = false; });
      N['pick:s' + [1, 3, 5][i]].children.forEach((c) => { const m = c.clone(); m.position.y += [0.05, -0.08, -0.03][i]; n.add(m); });
    });
    const tLot = paper(256, 192, (c, w, h) => {
      c.fillStyle = '#f6ecd6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff6b57'; c.lineWidth = 8; c.strokeRect(12, 12, w - 24, h - 24);
      c.fillStyle = '#3a2e5c'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `92px ${FONT_ZH}`; c.fillText('抽籤', w / 2, h * 0.54);
    });
    tLot.flipY = true;
    part(N['prop:pick'], new THREE.CylinderGeometry(0.407, 0.407, 0.38, 24, 1, true, -0.64, 1.28), std(0xffffff, 0.8, { map: tLot, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0, 0.32, 0], [0, -0.27, 0]).castShadow = false;
  }
  {
    // mug (baked): a tea-bag string over the rim, its paper tag hanging outside
    const cord = std(0xf4ead4, 0.9);
    const dirx = 0.42, dirz = 0.9, r = 0.305;
    const pts = [[0.1, 0.5, 0.05], [dirx * r * 0.7, 0.66, dirz * r * 0.7], [dirx * (r + 0.02), 0.645, dirz * (r + 0.02)], [dirx * (r + 0.045), 0.5, dirz * (r + 0.045)], [dirx * (r + 0.04), 0.34, dirz * (r + 0.04)]].map((q) => new THREE.Vector3(MUG.x + q[0], q[1], MUG.z + q[2]));
    part(scene, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.008, 5), cord);
    const tTea = paper(96, 96, (c, w, h) => { c.fillStyle = '#f6ecd6'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff6b57'; c.beginPath(); c.arc(w / 2, h * 0.56, 22, 0, 7); c.fill(); c.fillStyle = '#3a2e5c'; c.fillRect(w * 0.44, 4, w * 0.12, 8); });
    tTea.flipY = true;
    part(scene, new THREE.PlaneGeometry(0.14, 0.14), std(0xffffff, 0.85, { map: tTea, side: THREE.DoubleSide }), [MUG.x + dirx * (r + 0.05), 0.275, MUG.z + dirz * (r + 0.05)], [0, Math.atan2(dirx, dirz), 0.12]);
    // lamp: a brass rim on the shade, and a braided cloth cord running back to the wall with its switch
    part(scene, new THREE.TorusGeometry(0.655, 0.017, 8, 64), brass, [DOME.x, DOME.y - 0.05, DOME.z], [Math.PI / 2, 0, 0]);
    const tBraid = paper(64, 64, (c, w, h) => { c.fillStyle = '#e9dcc0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c4513e'; c.lineWidth = 9; for (let i = -64; i < 128; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 64); c.stroke(); } c.strokeStyle = 'rgba(58,46,92,0.5)'; c.lineWidth = 3; for (let i = -48; i < 128; i += 32) { c.beginPath(); c.moveTo(i + 64, 0); c.lineTo(i, 64); c.stroke(); } });
    tBraid.wrapS = tBraid.wrapT = THREE.RepeatWrapping; tBraid.repeat.set(26, 1);
    const cpts = [[LAMP_BASE.x + 0.5, 0.03, LAMP_BASE.z - 0.1], [LAMP_BASE.x + 0.78, 0.025, LAMP_BASE.z - 0.3], [LAMP_BASE.x + 0.62, 0.025, LAMP_BASE.z - 0.72], [LAMP_BASE.x + 0.35, 0.025, LAMP_BASE.z - 1.0], [LAMP_BASE.x + 0.55, 0.025, LAMP_BASE.z - 1.35], [LAMP_BASE.x + 0.7, 0.03, WALL_Z + 0.06]].map((q) => new THREE.Vector3(...q));
    part(scene, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cpts), 90, 0.024, 7), std(0xffffff, 0.95, { map: tBraid }));
    part(scene, new THREE.BoxGeometry(0.1, 0.07, 0.2), PM.enamel_cream, [cpts[2].x, 0.04, cpts[2].z], [0, 0.3, 0]);
    part(scene, new THREE.BoxGeometry(0.05, 0.02, 0.06), PM.coral, [cpts[2].x, 0.08, cpts[2].z], [0, 0.3, 0]);
  }
  /* a wind-up alarm clock by the mug: it shows your own time */
  const alarm = new THREE.Group(); alarm.position.set(-0.78, 0, -2.0); alarm.rotation.y = 0.2; scene.add(alarm);
  const CLK = { hands: {}, ring: 0 };
  {
    const enamel = new THREE.MeshPhysicalMaterial({ color: 0xffc857, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8 });
    const face = new THREE.Group(); face.position.y = 0.4; face.rotation.x = -0.1; alarm.add(face);
    part(face, new THREE.CylinderGeometry(0.3, 0.3, 0.17, 40).rotateX(Math.PI / 2), enamel);
    part(face, new THREE.TorusGeometry(0.3, 0.02, 8, 48), brass, [0, 0, 0.086]);
    const tFace = paper(256, 256, (c, w, h) => {
      c.fillStyle = '#fff4e0'; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2);
      c.fillStyle = '#3a2e5c'; for (let i = 0; i < 60; i++) { c.save(); c.rotate(i * Math.PI / 30); c.fillRect(-1.5, -118, i % 5 ? 2 : 5, i % 5 ? 8 : 18); c.restore(); }
      c.font = `600 34px ${FONT_EN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; [[12, 0, -78], [3, 80, 2], [6, 0, 82], [9, -80, 2]].forEach(([n, x, y]) => c.fillText(String(n), x, y));
      c.setTransform(1, 0, 0, 1, 0, 0);
    });
    tFace.flipY = true;
    part(face, new THREE.CircleGeometry(0.272, 48), std(0xffffff, 0.7, { map: tFace }), [0, 0, 0.088]);
    const hand = (w, len, col, z) => { const g = new THREE.BoxGeometry(w, len, 0.006).translate(0, len / 2 - 0.02, 0); return part(face, g, std(col, 0.5), [0, 0, z]); };
    CLK.hands.h = hand(0.026, 0.15, 0x3a2e5c, 0.094); CLK.hands.m = hand(0.018, 0.22, 0x3a2e5c, 0.098); CLK.hands.s = hand(0.007, 0.24, 0xff6b57, 0.102);
    part(face, new THREE.CylinderGeometry(0.02, 0.02, 0.016, 12).rotateX(Math.PI / 2), brass, [0, 0, 0.106]);
    [-1, 1].forEach((sx) => {
      part(alarm, new THREE.SphereGeometry(0.105, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), brass, [sx * 0.17, 0.69, 0], [0, 0, -sx * 0.42]);
      part(alarm, new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8), brass, [sx * 0.15, 0.66, 0], [0, 0, -sx * 0.42]);
      part(alarm, new THREE.CylinderGeometry(0.022, 0.03, 0.16, 8), brass, [sx * 0.2, 0.07, 0.02], [0, 0, sx * 0.5]);
    });
    CLK.hammer = part(alarm, new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), brass, [0, 0.76, 0]);
    part(alarm, new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), brass, [0, 0.8, 0]);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.44, 8, 6), hitMat); hit.position.y = 0.42; hit.userData.id = 'clock'; alarm.add(hit); hitTargets.push(hit);
    addBlob(alarm, 1.15, 0.8, { on: 0.3, off: 0.6 });
  }
  /* a note on the desk: your next step (what you have done is kept in this browser only) */
  const tNote = paper(256, 256, (c, w, h, n) => {
    c.fillStyle = '#ffd98a'; c.fillRect(0, 0, w, h);
    if (!n) return;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(58,46,92,0.7)'; c.font = `31px ${FONT_ZH}`; c.fillText('下一步', 24, 50);
    const big = n.short || n.label;
    c.fillStyle = '#3a2e5c'; c.font = `${big.length > 5 ? 40 : 54}px ${FONT_ZH}`; c.fillText(big, 22, 122);
    c.strokeStyle = '#ff6b57'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(24, 166); c.lineTo(160, 162); c.stroke();
    c.fillStyle = 'rgba(58,46,92,0.78)'; c.font = `30px ${FONT_ZH}`; c.fillText(`約 ${n.min} 分鐘`, 24, 210);
  }, { args: [F4.nextStep()] });
  tNote.flipY = true;
  const note = part(scene, new THREE.PlaneGeometry(0.74, 0.74), std(0xffffff, 0.85, { map: tNote, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0.45, 0.008, 1.05], [-Math.PI / 2, 0, -0.1]);
  note.castShadow = false;

  /* every prop gets its own copy of its materials, so the one you point at can light up by itself */
  IDS.forEach((id) => {
    const p = props[id]; const cache = new Map(); p.mats = [];
    p.root.traverse((o) => {
      if (!o.isMesh || o.material === hitMat || !o.material.isMeshStandardMaterial) return;
      let m = cache.get(o.material);
      if (!m) { m = o.material.clone(); cache.set(o.material, m); if (m.map) { m.emissiveMap = m.map; m.userData.glow = new THREE.Color(1.0, 0.9, 0.74); } else m.userData.glow = m.color.clone().lerp(new THREE.Color(1.0, 0.82, 0.55), 0.3); m.emissive.setRGB(0, 0, 0); p.mats.push(m); }
      o.material = m;
    });
  });

  // contact shadows under the things that stand up
  addBlob(N['prop:pick'], 1.5, 1.4); addBlob(N['prop:words'], 2.0, 1.55); addBlob(N['prop:free'], 1.75, 1.45); addBlob(N['prop:news'], 2.1, 1.1, { z: -0.03 });
  addBlob(N['prop:solve'], 1.35, 1.3, { on: 0.25, off: 0.5 });
  addBlob(N['prop:map'], 3.2, 2.2, { on: 0, off: 0.3 }); addBlob(N['prop:ask'], 1.9, 1.3, { on: 0, off: 0.4 });

  const gather = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: glowTexture('rgba(255,214,150,0.9)', 'rgba(255,170,90,0.35)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  gather.position.y = 0.02; gather.renderOrder = 3; scene.add(gather);
  const gatherK = new Spring(0, 0.35, 1);

  /* ---- how each thing answers when you look at it (k: 0 … 1, already sprung) */
  const anim = {};
  {
    const pin = N['map:pin']; const r = R0(pin); const hop = new Spring(0, 0.42, 0.32);
    anim.map = (dt, k, t) => { hop.target = k; hop.step(dt); pin.position.y = r.p.y + Math.max(-0.02, hop.x) * 0.2 + k * 0.03 * Math.sin(t * 5.0); pin.rotation.z = (hop.x - k) * 0.5; };
  }
  {
    const chosen = N['pick:chosen']; const r = R0(chosen); const up = new THREE.Vector3(0, 1, 0).applyQuaternion(r.q);
    const rise = new Spring(0, 0.5, 0.42);
    const sticks = [0, 1, 2, 3, 4, 5].map((i) => ({ n: N['pick:s' + i], a: new Spring(0, 0.34, 0.16), b: new Spring(0, 0.3, 0.16) }));
    sticks.forEach((s) => R0(s.n));
    let was = 0;
    anim.pick = (dt, k, t, target) => {
      if (target > 0.5 && was <= 0.5 && !REDUCED) sticks.forEach((s) => { s.a.v += rand(-1.6, 1.6); s.b.v += rand(-1.6, 1.6); });   // the cup gets a shake
      was = target;
      rise.target = target; rise.step(dt);
      chosen.position.copy(r.p).addScaledVector(up, rise.x * 0.5);
      turn(chosen, AZ, (rise.x - k) * 0.25 + k * 0.04 * Math.sin(t * 6));
      sticks.forEach((s) => { s.a.step(dt); s.b.step(dt); const rr = R0(s.n); s.n.quaternion.copy(rr.q).premultiply(qT.setFromAxisAngle(AX, s.a.x * 0.09)).premultiply(qT.setFromAxisAngle(AZ, s.b.x * 0.09)); });
    };
  }
  {
    const pencil = N['solve:pencil']; const r = R0(pencil); const roll = new Spring(0, 0.5, 0.5); let drawn = -1;
    anim.solve = (dt, k) => {
      const p = sstep(0.15, 1.0, k);
      if (Math.abs(p - drawn) > 0.015 || (p === 0 && drawn !== 0) || (p === 1 && drawn !== 1)) { drawn = p; tSticky.userData.paint(p); }
      roll.target = k; roll.step(dt);
      pencil.position.copy(r.p); pencil.position.x += roll.x * 0.07; pencil.position.z -= roll.x * 0.05;
      pencil.quaternion.copy(r.q).multiply(qT.setFromAxisAngle(AY, roll.x * 1.6));
    };
  }
  {
    const cover = N['words:cover']; R0(cover); const open = new Spring(0, 0.5, 0.5);
    anim.words = (dt, k, t, target) => { open.target = target; open.step(dt); turn(cover, AX, Math.max(0, open.x) * 0.62 + k * 0.02 * Math.sin(t * 3.1)); };
  }
  {
    const top = N['free:top']; const r = R0(top); const hop = new Spring(0, 0.4, 0.3);
    const tag = N['free:tag']; R0(tag);
    anim.free = (dt, k, t, target) => {
      hop.target = target; hop.step(dt);
      top.position.copy(r.p); top.position.y += Math.max(0, hop.x) * 0.2;
      top.quaternion.copy(r.q).multiply(qT.setFromAxisAngle(AY, (hop.x - k) * 0.5 + k * 0.07 * Math.sin(t * 8.0))).multiply(qT.setFromAxisAngle(AZ, k * 0.05 * Math.sin(t * 6.3)));
    };
  }
  {
    const ant = N['news:antenna']; R0(ant); const up = new Spring(0, 0.6, 0.48); const nd = new Spring(0, 0.7, 0.55);
    const k0 = N['news:knob0'], k1 = N['news:knob1']; R0(k0); R0(k1);
    anim.news = (dt, k, t, target) => {
      up.target = target; up.step(dt); nd.target = target; nd.step(dt);
      turn(ant, AZ, lerp(1.5, -0.3, up.x));
      turn(k1, AZ, -nd.x * 2.4); turn(k0, AZ, -k * 0.5);
      needle.position.x = lerp(0.18, 0.4, nd.x) + (target > 0.5 ? 0.004 * Math.sin(t * 13) : 0);
      const breath = 0.86 + 0.07 * Math.sin(t * 1.7) + 0.5 * k;
      dialMat.color.setScalar(breath * (0.9 + 0.35 * U.uDuskLevel.value / 4));
      dialGlow.material.opacity = 0.45 + 0.5 * k;
    };
  }
  {
    const flap = N['ask:flap'], card = N['ask:card'], pen = N['ask:pen']; R0(flap); const rc = R0(card); const rp = R0(pen);
    const f = new Spring(0, 0.55, 0.62), c = new Spring(0, 0.6, 0.7);
    anim.ask = (dt, k, t, target) => {
      f.target = target; f.step(dt); c.target = sstep(0.35, 0.8, f.x) * (target > 0.5 ? 1 : 0); c.step(dt);
      turn(flap, AX, -clamp(f.x, 0, 1.2) * 2.55);
      const s = sstep(0, 0.7, c.x), st = sstep(0.45, 1, c.x);
      card.position.copy(rc.p); card.position.z -= s * 0.78; card.position.y += s * 0.02;
      card.quaternion.copy(rc.q).premultiply(qT.setFromAxisAngle(AX, st * 1.08 + k * 0.02 * Math.sin(t * 2.6)));
      pen.quaternion.copy(rp.q).premultiply(qT.setFromAxisAngle(AY, k * 0.06 * Math.sin(t * 5.2) - c.x * 0.12));
    };
  }

  /* ---------------- the crab */
  const crabRoot = new THREE.Group(); scene.add(crabRoot);          // where it stands
  const lookGroup = new THREE.Group(); crabRoot.add(lookGroup);      // slow body turn
  const squash = new THREE.Group(); lookGroup.add(squash);           // the boing
  const model = crabG.scene; model.scale.setScalar(CRAB_SCALE); squash.add(model);
  const nodes = {};
  model.traverse((o) => { nodes[o.userData.name || o.name] = o; });
  const clay = clayMaterial(0xd47d62, { dis: false });
  const clayLimb = clayMaterial(0xd47d62, { sssAmt: 0.5 });
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x0c0a0a, roughness: 0.4, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.25, envMapIntensity: 0.35, specularIntensity: 0.4, emissive: 0x000000 });
  const eyeCatch = { value: 1 };
  eyeMat.onBeforeCompile = (sh) => {
    sh.uniforms.uCatch = eyeCatch;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRest;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRest; uniform float uCatch;')
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float ex = vRest.x - sign(vRest.x) * 0.2;
        float ey = vRest.y - clamp(vRest.y, 0.452, 0.548);
        float er = length(vec2(ex, ey)) / 0.046;
        diffuseColor.rgb = mix(vec3(0.085, 0.055, 0.05), vec3(0.012, 0.01, 0.01), smoothstep(0.1, 0.85, er));`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          float front = smoothstep(0.262, 0.285, vRest.z);
          float c1 = 1.0 - smoothstep(0.0035, 0.0075, length(vec2(ex + 0.012, vRest.y - 0.531) * vec2(1.0, 0.78)));
          float c2 = 1.0 - smoothstep(0.0015, 0.004, length(vec2(ex - 0.012, vRest.y - 0.476)));
          totalEmissiveRadiance += vec3(1.0, 0.92, 0.80) * (c1 * 1.7 + c2 * 0.5) * front * uCatch;
        }`);
  };
  eyeMat.customProgramCacheKey = () => 'f2-eye';
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.32, specularIntensity: 0.85, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const paperMat = clayMaterial(0xf3c15a, { sss: 0xff9a3a, sssAmt: 0.35, sheen: 0.25, sheenColor: 0xfff1c9, rough: 0.74, mottle: 0.05 });
  const stringMat = clayMaterial(0x3a2e5c, { sss: 0x6b4fa8, sssAmt: 0.2, sheen: 0.6, sheenColor: 0x9b8ad0, rough: 0.82, mottle: 0.03, bump: 0.6 });
  const isLump = (o) => { for (let x = o; x && x !== model; x = x.parent) if (/^lump:/.test(x.userData.name || '')) return true; return false; };
  const partOf = (o) => { for (let x = o; x; x = x.parent) { const m = (x.userData.name || '').match(/^part:([a-z-]+)/); if (m) return m[1]; } return null; };
  const crabMeshes = [];
  model.traverse((o) => {
    if (/^lump:/.test(o.userData.name || '')) { o.visible = false; return; }       // the pieces c5 assembles itself from: not used here
    if (!o.isMesh || isLump(o)) return;
    const p = partOf(o); const mn = o.material && o.material.name;
    if (mn === 'hit' || mn === 'bubble') { o.visible = false; return; }
    const isLens = (o.userData.name || o.name) === 'eye_lens';
    if (mn === 'eye') { o.material = isLens ? lensMat : eyeMat; if (isLens) o.renderOrder = 3; }
    else if (mn === 'paper') o.material = paperMat;
    else if (mn === 'string') o.material = stringMat;
    else o.material = (p === 'legs' || (p && p.startsWith('claw'))) ? clayLimb : clay;
    o.castShadow = mn !== 'eye'; o.receiveShadow = p !== 'legs' && !isLens;
    if (o.isSkinnedMesh) o.frustumCulled = false;
    if (p === 'parcel') { o.userData.id = 'free'; hitTargets.push(o); }
    crabMeshes.push(o);
  });
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 0.62), hitMat); body.position.set(0, 0.4, 0); body.userData.id = 'crab';
    model.add(body); hitTargets.push(body);
  }
  const crabBlob = addBlob(scene, 2.3, 1.5, { on: 0.2, off: 0.66 });

  /* flags: one in the crab's claw when you finish something, one planted on every island of the map you have started */
  const flagMat = std(0xff6b57, 0.6, { side: THREE.DoubleSide });
  const makeFlag = (hgt) => {
    const g = new THREE.Group();
    part(g, new THREE.CylinderGeometry(0.012, 0.012, hgt, 6), PM.steel, [0, hgt / 2, 0]);
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, hgt, 0, hgt * 0.5, hgt * 0.84, 0, 0, hgt * 0.68, 0]), 3)); tri.computeVertexNormals();
    part(g, tri, flagMat);
    return g;
  };
  // where an island of the picture is on the sheet itself (the sheet is a flat rectangle with a few folds, mapped corner to corner)
  const sheet = N['map:sheet'];
  const onSheet = (() => {
    const pos = sheet.geometry.attributes.position, uv = sheet.geometry.attributes.uv; const n = pos.count;
    let iA = 0, iB = 0, iC = 0;
    for (let i = 1; i < n; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      if (u + v < uv.getX(iA) + uv.getY(iA)) iA = i;
      if (u - v > uv.getX(iB) - uv.getY(iB)) iB = i;
      if (v - u > uv.getY(iC) - uv.getX(iC)) iC = i;
    }
    const A = new THREE.Vector3().fromBufferAttribute(pos, iA), B = new THREE.Vector3().fromBufferAttribute(pos, iB).sub(A), C = new THREE.Vector3().fromBufferAttribute(pos, iC).sub(A);
    const uA = uv.getX(iA), vA = uv.getY(iA), du = (uv.getX(iB) - uA) || 1, dv = (uv.getY(iC) - vA) || 1;
    const q = new THREE.Vector3();
    return (u, v, out) => {
      out.copy(A).addScaledVector(B, (u - uA) / du).addScaledVector(C, (v - vA) / dv);
      let best = 1e9, y = out.y;                              // sit on the paper, folds and all
      for (let i = 0; i < n; i++) { q.fromBufferAttribute(pos, i); const d = (q.x - out.x) ** 2 + (q.z - out.z) ** 2; if (d < best) { best = d; y = q.y; } }
      out.y = y; return out;
    };
  })();
  const mapFlags = ISLANDS.map(([u, v]) => {
    const g = makeFlag(0.44); onSheet(u, v, g.position); g.position.x += 0.13; g.position.z -= 0.07; g.rotation.y = -0.3; sheet.add(g);
    g.visible = false; g.scale.setScalar(0.001);
    return { g, k: new Spring(0, 0.5, 0.42) };
  });
  const pin = N['map:pin'];
  const placePin = (stage) => {
    const [u, v] = ISLANDS[clamp(stage, 0, ISLANDS.length - 1)];
    onSheet(u, v, tmpP); sheet.localToWorld(tmpP); pin.parent.worldToLocal(tmpP);
    pin.position.x = tmpP.x - 0.13; pin.position.z = tmpP.z + 0.07;
  };
  const tmpP = new THREE.Vector3();
  const crabFlag = makeFlag(0.5); scene.add(crabFlag);
  const flagK = new Spring(0, 0.4, 0.5);
  function syncMap(pop) {
    const st = mapState();
    tMap.userData.paint(st);
    st.lit.forEach((on, i) => { const f = mapFlags[i]; f.k.target = on ? 1 : 0; if (!pop) f.k.snap(on ? 1 : 0); });
    propsRoot.updateMatrixWorld(true); placePin(st.here);
    tNote.userData.paint(F4.nextStep());
  }
  /* things the crab uses when nobody is asking it for anything */
  const LIFE = { mode: null, t: 0, k: new Spring(0, 0.45, 0.7), phones: false, phK: new Spring(0, 0.5, 0.5), dozeK: new Spring(0, 1.2, 1), sip: new Spring(0, 0.5, 0.8), lastActive: 0 };
  const book = new THREE.Group(); book.position.set(-0.3, 0.012, 0.84); book.rotation.y = 0.16;      /* beside the note, not on it */ crabRoot.add(book); book.scale.setScalar(0.001); book.visible = false;
  {
    const tPage = paper(256, 320, (c, w, h) => { c.fillStyle = '#fbf3df'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(58,46,92,0.5)'; for (let i = 0; i < 11; i++) c.fillRect(26, 34 + i * 24, (i % 4 === 3 ? 120 : 204), 5); c.fillStyle = '#ff6b57'; c.fillRect(26, 34 + 11 * 24, 90, 6); });
    tPage.flipY = true;
    const pm = std(0xffffff, 0.9, { map: tPage, side: THREE.DoubleSide });
    part(book, new THREE.BoxGeometry(0.98, 0.03, 0.66), std(0x3a2e5c, 0.8), [0, 0.015, 0]);
    part(book, new THREE.PlaneGeometry(0.45, 0.6), pm, [-0.235, 0.034, 0], [-Math.PI / 2, 0, 0]).rotation.y = 0.07;
    part(book, new THREE.PlaneGeometry(0.45, 0.6), pm, [0.235, 0.034, 0], [-Math.PI / 2, 0, 0]).rotation.y = -0.07;
    LIFE.leaf = new THREE.Group(); LIFE.leaf.position.set(0, 0.04, 0); book.add(LIFE.leaf);
    part(LIFE.leaf, new THREE.PlaneGeometry(0.44, 0.58).translate(0.22, 0, 0), pm, [0, 0, 0], [-Math.PI / 2, 0, 0]);
  }
  const cup = new THREE.Group(); scene.add(cup);
  {
    part(cup, new THREE.CylinderGeometry(0.085, 0.07, 0.15, 16), PM.enamel_cream, [0, 0.075, 0]);
    part(cup, new THREE.CylinderGeometry(0.087, 0.087, 0.03, 16), PM.coral, [0, 0.1, 0]);
    part(cup, new THREE.TorusGeometry(0.045, 0.014, 6, 12), PM.enamel_cream, [0.09, 0.075, 0], [0, 0, 0]);
    cup.position.set(0.72 * CRAB_SCALE, 0.36 * CRAB_SCALE, 0.02); cup.scale.setScalar(CRAB_SCALE);
    model.updateMatrixWorld(true); nodes['part:claw-right'].attach(cup); cup.userData.s0 = cup.scale.clone(); cup.scale.setScalar(0.0001); cup.visible = false;
  }
  {
    crabFlag.position.set(-0.74 * CRAB_SCALE, 0.34 * CRAB_SCALE, 0.04); crabFlag.rotation.z = 0.16; crabFlag.scale.setScalar(CRAB_SCALE);
    model.updateMatrixWorld(true); (nodes['part:claw-left'] || model).attach(crabFlag); crabFlag.userData.s0 = crabFlag.scale.clone(); crabFlag.scale.setScalar(0.0001); crabFlag.visible = false;
  }
  const phones = new THREE.Group(); scene.add(phones);
  {
    const band = std(0x3a2e5c, 0.5), pad = std(0xff6b57, 0.6);
    const arc = part(phones, new THREE.TorusGeometry(0.5, 0.028, 8, 36, Math.PI), band, [0, 0.45, 0]); arc.scale.y = 0.66;
    [-1, 1].forEach((sx) => { part(phones, new THREE.CylinderGeometry(0.14, 0.14, 0.09, 20).rotateZ(Math.PI / 2), band, [sx * 0.5, 0.44, 0]); part(phones, new THREE.CylinderGeometry(0.1, 0.1, 0.1, 20).rotateZ(Math.PI / 2), pad, [sx * 0.5, 0.44, 0]); });
    phones.scale.setScalar(CRAB_SCALE);
    model.updateMatrixWorld(true); (nodes.top || model).attach(phones); phones.userData.s0 = phones.scale.clone(); phones.scale.setScalar(0.0001); phones.visible = false;
  }

  const mixer = new THREE.AnimationMixer(model);
  const acts = {};
  crabG.animations.forEach((src) => {
    const clip = src.clone();
    if (clip.name !== 'idle') THREE.AnimationUtils.makeClipAdditive(clip, Math.ceil(clip.duration * 60) + 5, clip, 60);
    const a = mixer.clipAction(clip);
    if (clip.name === 'idle') a.play(); else { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; }
    acts[clip.name] = a;
  });
  const running = (n) => acts[n] && acts[n].isRunning();
  function play(n, { speed = 1, force = false } = {}) {
    const a = acts[n]; if (!a) return;
    if (!force && a.isRunning()) return;
    a.reset(); a.timeScale = speed; a.setEffectiveWeight(1); a.play();
  }
  const BIG = ['wave_L', 'wave_R', 'hop', 'sorry', 'shell_puff', 'eyes_wide', 'legs_tap', 'parcel_wiggle', 'lean_bubbles', 'wiggle', 'intro', 'shift_L', 'shift_R'];
  const busyBig = () => BIG.some(running);

  /* ---------------- hit targets for the lamp */
  {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), hitMat); d.scale.y = 0.6; d.position.copy(DOME).y += 0.12; d.userData.id = 'lamp'; scene.add(d); hitTargets.push(d);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), hitMat); b.position.y = -chainLen; b.userData.id = 'lamp'; chain.add(b); hitTargets.push(b);
  }

  /* ---------------- hit targets for the curtains: the two gathered sides, and the whole window once they are shut */
  const curtHit = [[WIN.x0 - 0.25, 0.56], [WIN.x1 + 0.25, 0.56], [(WIN.x0 + WIN.x1) / 2, WIN.x1 - WIN.x0]].map(([x, w]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.6), hitMat); m.position.set(x, CURT.bot + 1.3, CURT.z + 0.03); m.userData.id = 'curtain'; scene.add(m); hitTargets.push(m); return m;
  });
  curtHit[2].layers.set(1);

  /* ---------------- state */
  const S = {
    t: 0, W: 1, H: 1, layout: 'wide',
    pointer: new THREE.Vector2(), pointerIn: false, pointerMoved: false, lastPointer: -10, lastInteract: -10,
    camYaw: new Spring(0, 0.9, 1), camPitch: new Spring(0, 0.9, 1), dragYaw: new Spring(0, 0.8, 0.9), dragPitch: new Spring(0, 0.8, 0.9),
    push: new Spring(0, 0.75, 1), focusPos: new THREE.Vector3(), focusTarget: new THREE.Vector3(),
    home: { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 27 },
    eyeX: new Spring(0, 0.075, 0.92), eyeY: new Spring(0, 0.075, 0.92), headYaw: new Spring(0, 0.42, 0.72), headPitch: new Spring(0, 0.42, 0.7),
    bodyYaw: new Spring(0, 0.7, 0.8), boing: new Spring(0, 0.34, 0.42), lean: new Spring(0, 0.3, 0.6),
    gaze: new THREE.Vector3(0, 0.6, 5), wanderAt: 0, eyeHoldAt: 0, micro: new THREE.Vector2(), eyeOff: new THREE.Vector2(), topExtra: new THREE.Quaternion(),
    nextBlink: 1.8, nextFidget: rand(6, 10), lastReact: {},
    crabHome: new THREE.Vector3(), walk: null, hi: new Spring(0, 0.25, 1),
    busy: false, intro: STILL || REDUCED ? 99 : 0, introDone: STILL || REDUCED,     // the entrance never holds anything back: the first screen is already live
    focus: null, focusAt: 0, focusPosT: new THREE.Vector3(), focusTargetT: new THREE.Vector3(), celebrating: false, hinted: false,
  };
  let packHook = null;
  // came here by "the crab packs up" on the plain page (switch-fx.js saw the note): no usual entrance, it drops in with the bundle instead
  const ARRIVE = html.dataset.arrive === 'pack' && !STILL && !REDUCED && !F4.card ? (window.__f4Arrive || {}) : null;
  if (ARRIVE) { S.introDone = true; S.intro = 99; }
  const queue = [];
  const later = (sec, fn) => queue.push({ at: S.t + sec, fn });
  const runQueue = () => { for (let i = queue.length - 1; i >= 0; i--) if (S.t >= queue[i].at) { const q = queue.splice(i, 1)[0]; q.fn(); } };

  /* ---------------- the crab's voice */
  let sayUntil = 0, sayKind = null;
  function say(text, { title = null, hold = 3.2, kind = 'line' } = {}) {
    bubbleP.textContent = '';
    if (title) { const b = document.createElement('b'); b.textContent = title; bubbleP.append(b); }
    bubbleP.append(document.createTextNode(text));
    bubbleEl.classList.add('on'); sayKind = kind; sayUntil = hold === Infinity ? Infinity : S.t + hold;
    S.bubbleW = 0;
  }
  function hush(kind) { if (kind && sayKind !== kind) return; bubbleEl.classList.remove('on'); sayKind = null; sayUntil = 0; }

  /* ---------------- camera + layout for the shape of the window */
  function applyLayout(name, instant) {
    S.layout = name;
    const Lq = LAYOUT[name];
    S.crabHome.set(Lq.crab[0], 0, Lq.crab[1]);
    IDS.forEach((id) => {
      const p = props[id]; const q = Lq[id];
      p.pos.set(q.p[0], 0, q.p[1]); p.rot = q.r * D2R; p.scale = q.s || 1;
      p.root.position.copy(p.pos); p.root.rotation.set(0, p.rot, 0); p.root.scale.setScalar(p.scale);
    });
    if (!S.walk) crabRoot.position.copy(S.crabHome);
    void instant;
  }
  function fit() {
    const w = view.clientWidth, h = view.clientHeight;
    if (!w || !h) return;
    S.W = w; S.H = h; S.tagW = 0;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const name = aspect < 1.05 ? 'tall' : 'wide';
    if (name !== S.layout || !S.fitted) applyLayout(name, true);
    S.fitted = true;
    const c = LAYOUT[name].cam;
    camera.aspect = aspect; camera.fov = c.fov; camera.updateProjectionMatrix();
    const tv = Math.tan(c.fov * D2R / 2);
    const dist = Math.max(c.minDist, c.halfW / (tv * aspect));
    const el = c.elev * D2R;
    S.home.target.set(...c.target);
    S.home.pos.copy(S.home.target).add(new THREE.Vector3(0, Math.sin(el), Math.cos(el)).multiplyScalar(dist));
    S.home.dist = dist;
    dustMat.uniforms.uPx.value = renderer.getPixelRatio() * (h / 900);
    if (ready) { frame(0.0001); }                    // a resize clears the canvas: draw at once, do not wait for the next tick
  }

  /* ---------------- pointer */
  const ray = new THREE.Raycaster();
  let drag = null;
  const ndc = (e) => { const r = canvas.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  function pick(v) {
    ray.setFromCamera(v, camera);
    const hits = ray.intersectObjects(hitTargets, false);
    return hits.length ? hits[0].object.userData.id : null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !ready) return;
    skipIntro();
    S.pointer.copy(ndc(e)); S.pointerMoved = true; S.lastPointer = S.t;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, yaw0: S.dragYaw.x, pitch0: S.dragPitch.x, type: e.pointerType };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    S.pointer.copy(ndc(e)); S.pointerMoved = true; S.pointerIn = true; S.lastPointer = S.t;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 7) { drag.moved = true; html.classList.add('is-drag'); if (hotSource === 'canvas') setHot(null); }
    if (drag.moved && !S.busy) {
      S.dragYaw.snap(rubber(drag.yaw0 - dx * 0.0032, 0.36)); S.dragPitch.snap(rubber(drag.pitch0 + dy * 0.0016, 0.1));
      S.lastInteract = S.t;
    }
  });
  const endDrag = (e, cancel) => {
    if (!drag || drag.id !== e.pointerId) return;
    html.classList.remove('is-drag');
    const d = drag; drag = null;
    if (d.moved || cancel) { S.lastInteract = S.t; return; }
    const id = pick(ndc(e));
    if (!id) return;
    if (id === 'lamp') { toggleLamp(); return; }
    if (id === 'crab') { pokeCrab(); return; }
    if (id === 'curtain') { toggleCurtain(); return; }
    if (id === 'clock') { pokeClock(); return; }
    if (IDS.includes(id) && !S.busy) { S.lastInteract = S.t; F4.enter(id); }
  };
  canvas.addEventListener('pointerup', (e) => endDrag(e, false));
  canvas.addEventListener('pointercancel', (e) => endDrag(e, true));
  canvas.addEventListener('pointerleave', (e) => { S.pointerIn = false; wiper.stroke(null); if (e.pointerType === 'mouse' && hotSource === 'canvas') setHot(null); });

  // the tags are real links: hover, focus, Enter all work
  IDS.forEach((id) => {
    const a = tags[id];
    a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && ready && !S.busy) { setHot(id, 'tag'); } });
    a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && hotSource === 'tag' && !S.busy) setHot(null); });
    a.addEventListener('focus', () => { if (ready && !S.busy && a.matches(':focus-visible')) setHot(id, 'tag'); });
    a.addEventListener('blur', () => { if (hotSource === 'tag' && !S.busy) setHot(null); });
  });
  btnLamp.addEventListener('click', () => { skipIntro(); toggleLamp(); });
  window.addEventListener('keydown', () => { LIFE.lastActive = S.t; });
  btnRain.addEventListener('click', () => { skipIntro(); setRain(!RAIN.on); });
  btnCurtain.addEventListener('click', () => { skipIntro(); toggleCurtain(); });
  const setBtn = (b, on, onText, offText) => { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.querySelector('b').textContent = on ? onText : offText; };

  /* ---------------- hover: the thing wakes, the crab looks and answers */
  hotListeners.push((id, source) => {
    if (id && IDS.includes(id)) {
      if (!isTouch() && !S.busy && !F4.card && source !== 'go') say(hintOf(id), { title: nameOf(id), hold: Infinity, kind: 'hint' });
      const now = S.t;
      if (!REDUCED && !S.busy && source !== 'go' && now - (S.lastReact[id] || -9) > 1.8) {
        S.lastReact[id] = now;
        let clip = PROP[id].react;
        if (id === 'solve') { play('snap_L', { force: true }); later(0.16, () => play('snap_R', { force: true })); clip = null; }
        if (id === 'ask') clip = props[id].pos.x < crabRoot.position.x ? 'wave_L' : 'wave_R';
        if (clip) play(clip);
        if (now - S.lastInteract > 2.2) S.boing.v += 1.4;
      }
      S.lastInteract = now;
    } else if (sayKind === 'hint') hush('hint');
    void source;
  });

  /* ---------------- the lamp */
  function setLamp(on, instant) {
    L.on = on;
    html.classList.toggle('lamp-off', !on);
    setBtn(btnLamp, on, '開', '關');
    if (instant || REDUCED) { L.lamp = L.glass = on ? 1 : 0; L.flick = null; L.adapt.snap(on ? 1 : 0); }
    else { L.flick = on ? 'on' : 'off'; L.flickT = 0; }
    L.adapt.target = on ? 1 : 0;
    scene.environment = on ? envOn : envOff;
  }
  function toggleLamp() {
    setLamp(!L.on);
    chainSw.pull.v -= 9; chainSw.a.v += rand(1.5, 2.5); chainSw.b.v += rand(-1.2, 1.2);
    S.lastInteract = S.t;
    if (!L.on) {
      if (!REDUCED) { play('eyes_wide', { force: true }); S.boing.v += 1.2; }
      later(0.55, () => { if (!L.on) say('欸，燈呢？', { hold: 2.6 }); });
    } else {
      later(0.5, () => { if (L.on) say('亮了，謝謝。', { hold: 2.0 }); });
      if (!REDUCED) later(0.3, () => play('hop', { force: true }));
    }
  }
  function updateLamp(dt) {
    if (L.flick === 'on') {
      // a filament bulb catching: a first try, a dip, then it holds; the glass warms a moment behind
      L.flickT += dt; const x = L.flickT;
      L.lamp = x < 0.05 ? x / 0.05 * 0.7 : x < 0.13 ? lerp(0.7, 0.12, (x - 0.05) / 0.08) : x < 0.3 ? lerp(0.12, 1.08, easeIO((x - 0.13) / 0.17)) : lerp(1.08, 1.0, sstep(0.3, 0.6, x));
      L.glass = L.lamp;
      if (x > 0.62) { L.lamp = L.glass = 1; L.flick = null; }
    } else if (L.flick === 'blink') {
      // two quick dips, like a bulb settling; your eyes do not have time to adjust, so the room itself stays as it was
      L.flickT += dt; const x = L.flickT;
      L.lamp = x < 0.06 ? lerp(1.0, 0.1, x / 0.06) : x < 0.17 ? lerp(0.1, 0.9, (x - 0.06) / 0.11) : x < 0.25 ? lerp(0.9, 0.18, (x - 0.17) / 0.08) : lerp(0.18, 1.0, easeIO(clamp((x - 0.25) / 0.22, 0, 1)));
      L.glass = Math.max(L.lamp, 0.3);
      if (x > 0.47) { L.lamp = L.glass = 1; L.flick = null; }
    } else if (L.flick === 'off') {
      L.flickT += dt;
      L.lamp = Math.max(0, L.lamp - dt * 9);                       // the light is gone at once …
      L.glass = Math.max(0, L.glass - dt * (L.glass > 0.25 ? 4.5 : 0.9));     // … the glass keeps a glow for a breath
      if (L.lamp === 0 && L.glass === 0) L.flick = null;
    }
    L.adapt.step(dt);
    const lamp = L.lamp, adapt = clamp(L.adapt.x, 0, 1);
    const duskLevel = lerp(4.6, 1.5, adapt);                       // with the lamp off, your eyes open up to the evening
    CURT.k.step(dt); const co = clamp(CURT.k.x, 0, 1);
    curtains.forEach((c) => { c.material.uniforms.uOpen.value = co; c.material.uniforms.uPull.value = clamp(-CURT.k.v * 0.5, -1, 1) * c.material.uniforms.uDir.value; });
    curtHit[2].layers.set(co < 0.5 ? 0 : 1);
    U.uLamp.value = lamp; U.uGlass.value = L.glass; U.uDuskLevel.value = duskLevel * lerp(0.62, 1, co);     // curtains shut: less of the night gets in
    matDesk.lightMapIntensity = Math.PI * gains.desk_dusk * duskLevel;
    hemi.intensity = 0.34 * duskLevel; rim.intensity = 0.4 * duskLevel;
    spot.intensity = SPOT_I * lamp; glow.intensity = GLOW_I * lamp; bounce.intensity = 0.55 * lamp;
    haloMat.opacity = 0.5 * L.glass;
    skyMat.uniforms.uBright.value = lerp(1.7, 0.95, adapt);
    scene.environmentIntensity = lerp(0.5, 0.85, adapt);
    eyeCatch.value = lerp(0.3, 1.0, lamp);
    blobs.forEach((b) => { const o = (SHADOWS ? b.on : b.off) * lerp(0.55, 1.0, lamp); b.m.material.opacity = o; b.m.visible = o > 0.004; });
  }

  /* ---------------- going somewhere */
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpV2 = new THREE.Vector2();
  function walkTo(target, dur) {
    const from = crabRoot.position.clone(); const d = from.distanceTo(target);
    if (d < 0.02) { crabRoot.position.copy(target); return 0; }
    const T = dur ?? (0.26 + d * 0.2);
    S.walk = { from, to: target.clone(), t: 0, T, hops: Math.max(1, Math.round(d / 0.75)), d, lastHop: 0 };
    return T;
  }
  // where the crab stands for each thing on a wide desk: beside or just behind it, so both can be seen
  const STAND = { solve: [-0.88, 0.35], pick: [-0.15, -1.0], map: [1.1, -0.25], words: [-1.25, 0.3], free: [1.0, 0.1], news: [1.05, -0.25], ask: [-0.45, 0.7] };
  function standPoint(id, out) {
    const p = props[id];
    if (S.layout === 'wide' && STAND[id]) return out.set(STAND[id][0], 0, STAND[id][1]);
    out.copy(p.pos).sub(S.crabHome); out.y = 0;
    const d = out.length(); const reach = clamp(d - (p.radius * p.scale + 1.0), 0, 1.5);
    return out.multiplyScalar(d > 1e-3 ? reach / d : 0).add(S.crabHome);
  }
  function setFocus(id) {
    const p = props[id]; const top = id === 'map';
    standPoint(id, tmpA);
    S.focusTargetT.copy(p.pos).lerp(tmpA, top ? 0.0 : 0.5); S.focusTargetT.y = top ? 0.15 : 0.55;
    if (top) S.focusTargetT.z -= 0.32;                            // room above the map for the crab
    const dir = tmpB.copy(S.home.pos).sub(S.home.target).normalize();
    if (top) dir.set(0, 0.84, 0.54);                              // over the map, looking down at it
    // the words are on the left and the card on the right: what is left in the middle decides how close the chair can come
    const W = S.W, left = Math.min(360, W * 0.3), right = Math.min(448, W * 0.42);
    const band = Math.max(240, W - left - right);
    const hw = S.home.dist * Math.tan(camera.fov * D2R / 2) * camera.aspect;      // half the desk the chair sees from home
    const need = top ? 2.5 : 3.1;                                 // how much desk has to fit in that band
    const zoom = clamp((W * need) / (2 * hw * band), 0.6, 1.0);
    const nx = (left + band / 2) / W * 2 - 1;                     // where the middle of the band is on screen
    S.focusTargetT.x -= nx * hw * zoom;
    S.focusPosT.copy(S.focusTargetT).addScaledVector(dir, S.home.dist * zoom);
  }
  const focusIdOf = (c) => (c.kind === 'task' ? 'solve' : c.id);
  function focusOn(id, instant) {
    if (!props[id]) return;
    if (LIFE.mode) endLife(false);
    S.focus = id; S.focusAt = S.t; S.lastInteract = S.t; hush('hint');
    setFocus(id);
    if (S.push.x < 0.05 || instant) { S.focusPos.copy(S.focusPosT); S.focusTarget.copy(S.focusTargetT); }
    S.push.target = 1; S.dragYaw.target = 0; S.dragPitch.target = 0;
    setHot(id, 'go');
    if (instant || REDUCED) { crabRoot.position.copy(standPoint(id, tmpA)); S.walk = null; if (instant) S.push.snap(1); return 0; }
    return walkTo(standPoint(id, tmpA));
  }
  function unfocus() {
    if (!S.focus && !S.celebrating) return;
    S.focus = null; S.celebrating = false; S.push.target = 0; flagK.target = 0;
    syncMap(false);
    if (REDUCED) crabRoot.position.copy(S.crabHome); else walkTo(S.crabHome);
    if (hotSource === 'go') setHot(null);
  }
  // something got done: the flag comes up in its claw, it carries it to the map and plants it
  function celebrate(kind, info) {
    S.celebrating = true; S.lastInteract = S.t;
    const line = kind === 'pick' ? (info.known.length ? '會的那幾課，旗子都幫你插好了。' : '起點幫你標在地圖上了。') : info.first ? '第 1 面旗，插到地圖上了。' : '再做一次也算。多做幾次就順了。';
    if (REDUCED || STILL) { focusOn('map', STILL); syncMap(false); say(line, { hold: 4.6 }); S.celebrating = false; return; }
    crabFlag.visible = true; flagK.target = 1; S.boing.v += 3.0;
    play('wave_L', { force: true });
    later(0.7, () => { if (S.celebrating) play('hop', { force: true }); });
    later(1.3, () => {
      if (!S.celebrating) return;
      const T = focusOn('map');
      later(T + 0.15, () => { if (!S.celebrating) return; syncMap(true); flagK.target = 0; S.boing.v += 2.2; say(line, { hold: 4.6 }); });
      later(T + 1.4, () => { S.celebrating = false; });
    });
  }
  F4.on('card:open', (c) => {
    skipIntro();                       // you pressed something: the entrance is over, here is your card
    const id = focusIdOf(c); hush();
    if (S.celebrating) { S.celebrating = false; syncMap(true); }
    flagK.target = 0;
    const T = focusOn(id);
    if (T === undefined) return;
    later(T + 0.05, () => {
      if (S.focus !== id || S.celebrating) return;
      if (c.kind === 'task') { play('wave_R', { force: true }); if (!F4.state.done.t1) say('給你，一題就好。', { hold: 2.6 }); return; }
      const r = PROP[id].react; play(r === 'legs_tap' ? 'hop' : r, { force: true });
    });
  });
  F4.on('card:close', () => unfocus());
  F4.on('task:done', (d) => celebrate('task', d));
  F4.on('pick:done', (d) => celebrate('pick', d));
  F4.on('state', () => { tNote.userData.paint(F4.nextStep()); later(0.05, () => { if (!S.celebrating) syncMap(true); }); });
  F4.on('leave', () => { S.busy = true; hush(); fadeEl.classList.add('on'); });
  let pokes = 0;
  function pokeCrab() {
    if (S.busy) return;
    skipIntro();
    if (LIFE.mode) endLife(LIFE.mode === 'doze');
    S.boing.v += 3.2; S.lastInteract = S.t; pokes++;
    if (!F4.state.done.t1 && !F4.card) { F4.openTask(); return; }       // first things first: it hands you the 60-second task
    if (pokes % 3 === 0) {                       // every third poke: headphones on, or off again
      LIFE.phones = !LIFE.phones; LIFE.phK.target = LIFE.phones ? 1 : 0; phones.visible = true;
      if (!REDUCED) play('shell_puff', { force: true });
      say(LIFE.phones ? (RAIN.on ? '戴上了。這雨聲剛剛好。' : '戴上了。雨聲的開關在右下角。') : '好，拿下來了。', { hold: 3.0 });
      return;
    }
    if (!REDUCED) play(pokes % 2 ? 'wiggle' : 'hop', { force: true });
    const n = F4.nextStep();
    say([`下一步是${n.short || n.label}，便條紙上有寫。`, '想學什麼？點那封信跟我們說。', '不知道從哪課開始？筆筒裡抽一支籤。', '再戳一下試試看。'][pokes % 4], { hold: 3.0 });
  }

  /* ---------------- a life of its own: reads, sips, stretches; left alone long enough, it nods off */
  function startLife(mode) {
    LIFE.mode = mode; LIFE.t = 0;
    if (mode === 'read') { book.visible = true; LIFE.k.target = 1; }
    if (mode === 'sip') { cup.visible = true; LIFE.sip.target = 1; play('wave_R', { force: true, speed: 0.5 }); }
    if (mode === 'stretch') { play('shell_puff', { force: true, speed: 0.8 }); later(0.25, () => { play('snap_L', { force: true }); play('snap_R', { force: true }); }); S.boing.v += 2.4; }
    if (mode === 'doze') { acts.blink.reset(); acts.blink.play(); acts.blink.time = 0.083; acts.blink.paused = true; /* 0.083 s into the blink the lids are fully down */ LIFE.dozeK.target = 1; zzzEl.classList.add('on'); hush(); }
  }
  function endLife(woken) {
    const m = LIFE.mode; LIFE.mode = null;
    LIFE.k.target = 0; LIFE.sip.target = 0;
    if (m === 'doze') {
      acts.blink.paused = false; LIFE.dozeK.target = 0; zzzEl.classList.remove('on');
      if (woken && !REDUCED) { play('eyes_wide', { force: true }); S.boing.v += 2.6; later(0.35, () => { if (!S.busy && !sayKind) say('啊，我沒有睡著。', { hold: 2.2 }); }); }
    }
  }
  function updateLife(dt, t) {
    const active = Math.max(S.lastInteract, S.lastPointer, LIFE.lastActive);
    const idle = t - active;
    const free = S.introDone && !S.busy && !hot && !S.walk && !S.focus && !S.celebrating && !F4.card && !REDUCED && !STILL;
    if (LIFE.mode && (!free || idle < 0.4)) endLife(true);
    else if (free && !LIFE.mode) {
      // a slow round of small things, then sleep
      const beat = Math.floor((idle - 15) / 9);
      if (idle > 52) startLife('doze');
      else if (idle > 15 && beat !== LIFE.beat) { LIFE.beat = beat; startLife(['read', 'sip', 'stretch', 'read'][beat % 4]); }
    }
    if (idle < 1) LIFE.beat = -1;
    if (LIFE.mode) {
      LIFE.t += dt;
      if (LIFE.mode === 'read' && LIFE.t > 7.5) endLife(false);
      if (LIFE.mode === 'sip' && LIFE.t > 3.4) endLife(false);
      if (LIFE.mode === 'stretch' && LIFE.t > 2.2) endLife(false);
    }
    // the book opens on the desk in front of it; a page turns now and then
    const bk = LIFE.k.step(dt); book.scale.setScalar(Math.max(0.001, bk * 0.85)); if (bk < 0.02 && LIFE.k.target === 0) book.visible = false;
    if (book.visible) { const ph = (LIFE.t % 2.6) / 0.7; LIFE.leaf.rotation.z = ph < 1 ? easeIO(ph) * Math.PI : 0; }
    // the cup comes up in its right claw
    const sp = LIFE.sip.step(dt); cup.scale.copy(cup.userData.s0).multiplyScalar(Math.max(0.0001, sp)); if (sp < 0.02 && LIFE.sip.target === 0) cup.visible = false;
    // headphones
    const pk = LIFE.phK.step(dt); phones.scale.copy(phones.userData.s0).multiplyScalar(Math.max(0.0001, pk)); if (pk < 0.02 && !LIFE.phones) phones.visible = false;
    LIFE.dozeK.step(dt);
  }

  /* ---------------- per frame */
  const qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), qE = new THREE.Quaternion();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.2);
  const viewerLocal = () => model.worldToLocal(tmpC.copy(camera.position));
  const scheduleBlink = (soon) => { S.nextBlink = S.t + (soon ?? rand(2.2, 5.6)); };
  const blink = () => { if (STILL) return; play('blink', { force: true, speed: rand(0.92, 1.1) }); if (Math.random() < 0.22) later(0.23, () => play('blink', { force: true })); };
  const WANDER = [
    () => S.gaze.copy(viewerLocal()), () => S.gaze.copy(viewerLocal()), () => S.gaze.copy(viewerLocal()),
    () => S.gaze.set(-0.9, 1.6, 0.9),            // up at the lamp
    () => S.gaze.set(1.6, 0.9, -1.6),            // out of the window
    () => S.gaze.set(1.3, 0.0, 1.4), () => S.gaze.set(-1.2, 0.05, 1.3),
  ];
  const vp = new THREE.Vector3();
  const project = (world) => { vp.copy(world).project(camera); return vp; };

  /* the entrance (f3's, on top of a poster that is already lit): the crab is flat on the desk, the lamp flickers twice,
     it springs up and waves. Nothing waits for it: the sentence, the button and the index are live the whole time,
     and pressing anything cuts it short. */
  function skipIntro() {
    if (S.introDone) return;
    S.introDone = true; S.intro = 99; LIFE.lastActive = S.t;
    L.flick = null; L.lamp = L.glass = 1;
    if (acts.intro) { acts.intro.paused = false; acts.intro.timeScale = 3.2; }      // up at once, but still a spring, not a cut
    S.boing.v += 2.2;
    html.classList.remove('is-intro');
  }
  function updateIntro(dt) {
    if (S.introDone) { S.intro += dt; return; }
    const a = S.intro; S.intro += dt; const b = S.intro;
    const at = (x) => a < x && b >= x;
    if (at(0.3)) { L.flick = 'blink'; L.flickT = 0; chainSw.pull.v -= 6; chainSw.a.v += 1.4; }
    if (at(0.62)) { acts.intro.paused = false; S.boing.v += 0.6; }
    if (at(1.2)) html.classList.remove('is-intro');
    if (at(1.95)) { play('wave_R', { force: true }); if (!F4.card && !sayKind) say(F4.greeting(), { hold: 5.6 }); }
    if (at(2.15)) { S.introDone = true; LIFE.lastActive = S.t; }
  }

  function frame(dt) {
    dt = Math.min(dt, 1 / 20);
    S.t += dt; const t = S.t;
    U.uTime.value = t;
    runQueue();
    updateIntro(dt);
    updateLamp(dt);

    /* camera: home, a little parallax with the pointer, drag to look round, lean in when going */
    const px = S.pointerIn && !isTouch() ? S.pointer.x : 0, py = S.pointerIn && !isTouch() ? S.pointer.y : 0;
    S.camYaw.target = REDUCED ? 0 : -px * 0.05; S.camPitch.target = REDUCED ? 0 : py * 0.018;
    S.camYaw.step(dt); S.camPitch.step(dt);
    if ((!drag || !drag.moved) && t - S.lastInteract > 1.4) { S.dragYaw.target = 0; S.dragPitch.target = 0; S.dragYaw.step(dt); S.dragPitch.step(dt); }
    { const fk = 1 - Math.exp(-dt * 5.0); S.focusPos.lerp(S.focusPosT, fk); S.focusTarget.lerp(S.focusTargetT, fk); }     // from one thing to the next without a jump
    S.push.step(dt);
    const k = clamp(S.push.x, 0, 1.1);
    tmpA.copy(S.home.pos).lerp(S.focusPos, k); tmpB.copy(S.home.target).lerp(S.focusTarget, k);
    const off = tmpC.copy(tmpA).sub(tmpB);
    const yaw = (S.camYaw.x + S.dragYaw.x) * (1 - 0.7 * k), pitch = (S.camPitch.x + S.dragPitch.x) * (1 - 0.7 * k);
    off.applyAxisAngle(AY, yaw);
    const right = vT.set(off.z, 0, -off.x).normalize(); off.applyAxisAngle(right, -pitch);
    camera.position.copy(tmpB).add(off); camera.lookAt(tmpB); camera.updateMatrixWorld();
    SH.uUpV.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
    // keep the painted horizon a little above the sill, wherever the chair is
    const hy = WIN.y0 + (S.layout === 'tall' ? 0.75 : 0.5);
    skyMat.uniforms.uElH.value = Math.atan2(hy - camera.position.y, Math.hypot(camera.position.z - WALL_Z, camera.position.x - 2.0));

    /* hover */
    if (S.focus && !hot) setHot(S.focus, 'go');
    if (S.pointerMoved && ready && !(drag && drag.moved) && !S.busy && S.pointerIn && !isTouch()) {
      S.pointerMoved = false;
      const id = pick(S.pointer);
      // nothing in the way and the pointer is on the glass: it wipes the mist
      if (!id && CURT.k.x > 0.6 && paneHit(S.pointer, tmpV2)) { wiper.stroke(tmpV2.x, tmpV2.y); S.wiped = (S.wiped || 0) + 1; } else wiper.stroke(null);
      if (id && IDS.includes(id)) setHot(id, 'canvas');
      else {
        if (hotSource === 'canvas') setHot(S.focus, 'go'); html.classList.toggle('is-hot', id === 'lamp' || id === 'crab' || id === 'curtain' || id === 'clock');
        if (id === 'lamp' && !sayKind && t - (S.lampHint || -99) > 12) { S.lampHint = t; say(L.on ? '那條鍊子可以拉。' : '拉一下，燈就回來。', { hold: 2.4 }); }
      }
    }

    /* props */
    IDS.forEach((id) => {
      const p = props[id];
      const target = hot === id ? 1 : 0;
      p.h.target = Math.max(target, p.flash || 0); p.h.step(dt);                                // p.flash, p.dy: the unpacking (pack-land.js) lights a thing and bumps it without hovering it
      anim[id](dt, clamp(p.h.x, 0, 1.2), t, target);
      const k = clamp(p.h.x, 0, 1.15);
      p.root.position.y = k * (id === 'map' || id === 'ask' ? 0.02 : 0.075) + (p.dy || 0);        // it lifts toward you …
      const g = k * (0.2 + 0.035 * Math.sin(t * 4.0)) * lerp(0.7, 1.0, L.lamp);
      for (const m of p.mats) m.emissive.copy(m.userData.glow).multiplyScalar(g * (m.map ? 0.75 : 1));   // … and takes a little light of its own
    });

    gatherK.target = hot && IDS.includes(hot) ? 1 : 0; gatherK.step(dt);
    if (hot && IDS.includes(hot)) { const p = props[hot]; const r = Math.max(1.5, p.radius * p.scale * 3.3); gather.position.x = p.pos.x; gather.position.z = p.pos.z; gather.scale.set(r, 1, r * 0.86); }
    gather.material.opacity = clamp(gatherK.x, 0, 1) * lerp(0.1, 0.3, L.lamp);

    FINE.needle.rotation.y = 0.5 + Math.sin(t * 0.7) * 0.05 + clamp(props.map.h.x, 0, 1.2) * Math.sin(t * 9.0) * 0.5;
    FINE.pilot.material.color.setRGB(0.5 + 2.2 * clamp(props.news.h.x, 0, 1), 0.16 + 0.3 * clamp(props.news.h.x, 0, 1), 0.1);
    {
      const d = new Date(); const sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
      CLK.hands.s.rotation.z = -Math.floor(sec) * Math.PI / 30; CLK.hands.m.rotation.z = -min * Math.PI / 30; CLK.hands.h.rotation.z = -hr * Math.PI / 6;
      S.clockRing = Math.max(0, (S.clockRing || 0) - dt);
      alarm.rotation.z = S.clockRing > 0 ? Math.sin(t * 70) * 0.035 * Math.min(1, S.clockRing * 3) : 0; CLK.hammer.rotation.z = S.clockRing > 0 ? Math.sin(t * 70) * 0.6 : 0;
    }

    if (packHook) packHook.pre(dt);                                   // arriving from the plain page with the bundle (pack-land.js)

    /* the crab walks in hops */
    if (S.walk) {
      const w = S.walk; w.t += dt; const u = clamp(w.t / w.T, 0, 1); const e = easeIO(u);
      crabRoot.position.lerpVectors(w.from, w.to, e);
      const ph = e * w.hops; const hopN = Math.floor(ph);
      crabRoot.position.y = Math.abs(Math.sin(ph * Math.PI)) * 0.2 * Math.min(1, w.d);
      if (hopN !== w.lastHop) { w.lastHop = hopN; S.boing.v -= 2.4; }
      S.lean.target = clamp((w.to.x - w.from.x) * 0.16, -0.2, 0.2) * Math.sin(u * Math.PI);
      if (u >= 1) { crabRoot.position.copy(w.to); S.walk = null; S.boing.v -= 2.0; S.lean.target = 0; }
    }
    S.lean.step(dt);

    updateLife(dt, t);
    if (zzzEl.classList.contains('on')) { tmpA.copy(crabRoot.position); tmpA.x += 0.75; tmpA.y += 0.95 * CRAB_SCALE; const v = project(tmpA); zzzEl.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * S.W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * S.H).toFixed(1)}px, 0)`; }

    /* where it looks */
    if (!REDUCED && !STILL) {
      const fresh = t - S.lastPointer < 3.2;
      if (hot && IDS.includes(hot) && !(hotSource === 'go' && t - S.focusAt > 1.8)) {
        model.worldToLocal(S.gaze.copy(props[hot].pos).setY(0.3 + props[hot].size.y * 0.6));
      } else if (LIFE.mode === 'read' || LIFE.mode === 'doze') {
        S.gaze.set(LIFE.mode === 'read' ? -0.2 : 0.03, -0.25, 1.0);      // down at the page (or at nothing, eyes shut)
      } else if (!S.introDone || S.busy || S.focus) {
        S.gaze.copy(viewerLocal());
      } else if (fresh && S.pointerIn && !isTouch()) {
        ray.setFromCamera(S.pointer, camera); if (ray.ray.intersectPlane(plane, tmpA)) model.worldToLocal(S.gaze.copy(tmpA));
      } else if (t > S.wanderAt) {
        S.wanderAt = t + rand(1.4, 3.6);
        WANDER[Math.floor(Math.random() * WANDER.length)]();
        if (Math.random() < 0.35) scheduleBlink(0.02);
      }
    } else S.gaze.copy(viewerLocal());

    if (!STILL && S.introDone) {
      if (t > S.nextBlink) { if (LIFE.mode !== 'doze') blink(); scheduleBlink(); }
      if (!REDUCED && t > S.nextFidget) {
        S.nextFidget = t + rand(6.5, 12);
        if (!busyBig() && !hot && !S.busy && !S.focus && !LIFE.mode && t - S.lastInteract > 2) { const r = Math.random(); play(r < 0.3 ? 'shift_L' : r < 0.6 ? 'shift_R' : r < 0.75 ? 'snap_L' : r < 0.9 ? 'snap_R' : 'hop'); }
      }
    }

    // Take last frame's hand-made layer (eye offset, head turn) back off before the mixer runs. The mixer only rewrites a value
    // when it changed, so resetting the whole rig every frame would lose any pose that is held still: the crab lying flat
    // before the light comes on, or a hold inside a clip.
    const eyes = nodes['part:eyes'];
    if (eyes) { eyes.position.x -= S.eyeOff.x; eyes.position.y -= S.eyeOff.y; }
    if (nodes.top) nodes.top.quaternion.multiply(qE.copy(S.topExtra).invert()).normalize();
    mixer.update(dt);
    if (REDUCED) BIG.concat(['snap_L', 'snap_R']).forEach((n) => { if (running(n)) acts[n].stop(); });

    /* eyes lead, the top follows, the whole body turns last */
    const E = tmpA.set(0, 0.5, 0.28);
    const d = tmpB.copy(S.gaze).sub(E);
    const ax = Math.atan2(d.x, Math.max(0.05, d.z)), ay = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const ex = clamp(ax * 0.03, -0.016, 0.016), ey = clamp(ay * 0.026, -0.011, 0.013);
    if (Math.hypot(ex - S.eyeX.target, ey - S.eyeY.target) > 0.003 || t > S.eyeHoldAt) {
      S.eyeX.target = ex; S.eyeY.target = ey; S.eyeHoldAt = t + rand(0.5, 1.2);
      S.micro.set(rand(-1, 1), rand(-1, 1)).multiplyScalar(0.0016);
    }
    S.eyeX.step(dt); S.eyeY.step(dt);
    const nod = LIFE.phones ? Math.sin(t * 6.6) * 0.045 * clamp(LIFE.phK.x, 0, 1) : 0;
    S.headYaw.target = clamp(ax * 0.09, -0.07, 0.07) + (LIFE.phones ? Math.sin(t * 3.3) * 0.03 : 0); S.headPitch.target = clamp(-ay * 0.12, -0.06, 0.06) + nod + (LIFE.mode === 'read' ? 0.05 : 0);
    S.headYaw.step(dt); S.headPitch.step(dt);
    const turnAmt = hot && IDS.includes(hot) ? 0.6 : 0.3;
    S.bodyYaw.target = clamp(Math.atan2(d.x, Math.max(0.4, Math.abs(d.z) * 0.6 + 0.4)) * turnAmt, -0.55, 0.55); S.bodyYaw.step(dt);
    lookGroup.rotation.set(0, S.bodyYaw.x, -S.lean.x);
    S.eyeOff.set(S.eyeX.x + S.micro.x, S.eyeY.x + S.micro.y);
    if (eyes) { eyes.position.x += S.eyeOff.x; eyes.position.y += S.eyeOff.y; }
    if (nodes.top) { qy.setFromAxisAngle(AY, S.headYaw.x); qx.setFromAxisAngle(AX, S.headPitch.x); S.topExtra.multiplyQuaternions(qy, qx); nodes.top.quaternion.multiply(S.topExtra); }
    S.boing.step(dt);
    const b = clamp(S.boing.x * 0.05, -0.12, 0.12);
    const dz = clamp(LIFE.dozeK.x, 0, 1), br = dz * 0.022 * Math.sin(t * 1.3);
    squash.scale.set((1 - b * 0.5) * (1 + dz * 0.02 - br * 0.5), (1 + b) * (1 - dz * 0.05 + br) + (LIFE.phones ? Math.abs(Math.sin(t * 6.6)) * 0.012 : 0), (1 - b * 0.5) * (1 + dz * 0.02 - br * 0.5));
    squash.rotation.x = -clamp(LIFE.sip.x, 0, 1) * 0.16 * sstep(0.9, 1.8, LIFE.t) * (1 - sstep(2.4, 3.2, LIFE.t)) + dz * 0.05;
    if (packHook && packHook.post() === false) packHook = null;
    // the crab glows a touch when its own parcel is the hot thing
    S.hi.target = hot === 'free' ? 1 : 0; S.hi.step(dt);
    paperMat.userData.uHi.value = S.hi.x; stringMat.userData.uHi.value = S.hi.x * 0.6;

    /* the lamp as the clay sees it */
    crabRoot.getWorldPosition(tmpA); tmpA.y += 0.6;
    tmpB.copy(DOME).sub(tmpA); const dl = tmpB.length();
    SH.uKeyDir.value.copy(tmpB.normalize()).transformDirection(camera.matrixWorldInverse);
    const kc = (SPOT_I * L.lamp) / Math.pow(dl, 1.55);
    SH.uKeyCol.value.set(1.0 * kc, 0.70 * kc, 0.43 * kc);
    // its soft shadow slides away from the lamp
    tmpC.set(crabRoot.position.x - DOME.x, 0, crabRoot.position.z - DOME.z).normalize();
    const lift = Math.min(crabRoot.position.y, 1.2);                  // (it can come down from above the picture: the blob does not grow past a jump's worth)
    crabBlob.position.set(crabRoot.position.x + tmpC.x * (0.16 + lift) * L.lamp, 0.013, crabRoot.position.z + tmpC.z * (0.16 + lift) * L.lamp);
    crabBlob.scale.set(2.3 * (1 + lift), 1, 1.5 * (1 + lift));

    /* the chain */
    chainSw.a.step(dt); chainSw.b.step(dt); chainSw.pull.step(dt);
    chain.rotation.set(chainSw.b.x * 0.16 + Math.sin(t * 0.9) * 0.012, 0, chainSw.a.x * 0.16 + Math.sin(t * 0.7) * 0.015);
    chain.position.y = DOME.y - 0.03 + chainSw.pull.x * 0.012;
    steam.rotation.y = Math.atan2(camera.position.x - steam.position.x, camera.position.z - steam.position.z);

    /* flags */
    mapFlags.forEach((f) => { const fk = f.k.step(dt); f.g.visible = fk > 0.02; f.g.scale.setScalar(Math.max(0.001, fk)); f.g.rotation.z = (f.k.target - fk) * 0.5; });
    { const fk = flagK.step(dt); crabFlag.visible = fk > 0.02; crabFlag.scale.copy(crabFlag.userData.s0).multiplyScalar(Math.max(0.0001, fk)); }
    /* nobody has pressed anything for a while: say where to start, once */
    if (!S.hinted && !STILL && t > 9.5 && t - S.lastInteract > 9 && !F4.card && !F4.state.done.t1 && !sayKind && !hot) {
      S.hinted = true; LIFE.lastActive = t;
      if (!REDUCED) play('wave_L', { force: true });
      say('不知道點哪個？按左上的「給我一個 60 秒任務」就好。', { hold: 5.5 });
    }

    wiper.step(renderer, dt); skyMat.uniforms.tWipe.value = wiper.texture;
    if (RAIN.on && Math.random() < dt * 3.2) RAIN.tick();
    renderer.render(scene, camera);

    /* the one tag: tied to the thing you are pointing at (the index card, bottom left, is always there) */
    const W = S.W, H = S.H;
    if (hot && IDS.includes(hot)) {
      const p = props[hot]; const a = PROP[hot].tag;
      tmpA.set(a[0], a[1], a[2]).multiplyScalar(p.scale).applyAxisAngle(AY, p.rot).add(p.root.position);
      const v = project(tmpA);
      if (S.tagFor !== hot) { S.tagFor = hot; tagEl.querySelector('b').textContent = nameOf(hot); S.tagW = 0; }
      const tw = S.tagW || (S.tagW = tagEl.offsetWidth || 90);
      const x = clamp((v.x * 0.5 + 0.5) * W - 12, 6, W - tw - 6), y = clamp((-v.y * 0.5 + 0.5) * H, 70, H - 10);
      tagEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(0, -100%)`;
      tagEl.classList.add('on');
    } else tagEl.classList.remove('on');
    if (!L.on && S.introDone && !S.busy && !F4.card && !sayKind && t - S.lastInteract > 7 && t - (S.askedLight || -99) > 20) { S.askedLight = t; say('幫我把燈開回來，好嗎？', { hold: 3.4 }); }
    if (sayUntil && t > sayUntil) hush();
    if (bubbleEl.classList.contains('on')) {
      tmpA.copy(crabRoot.position); tmpA.y += 0.98 * CRAB_SCALE + 0.3;
      const v = project(tmpA);
      if (!S.bubbleW) S.bubbleW = bubbleP.offsetWidth || 200;
      const half = S.bubbleW / 2 + 10;
      const x = clamp((v.x * 0.5 + 0.5) * W, half, W - half), y = Math.max(86, (-v.y * 0.5 + 0.5) * H);
      bubbleEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  }

  /* ---------------- start */
  fit();
  new ResizeObserver(() => fit()).observe(view);
  setLamp(true, true);
  if (F4.card) { S.introDone = true; S.intro = 99; }                  // you were already answering on the poster: no entrance
  if (ARRIVE && !F4.card && html.dataset.arrive === 'pack') crabRoot.visible = false;   // still in the air: the first frame is the empty desk the plain page ended on
  if (!S.introDone) {
    html.classList.add('is-intro');                                   // (a quicker hand-over from the poster: see index.html)
    acts.intro.reset(); acts.intro.timeScale = 1; acts.intro.play(); acts.intro.paused = true;      // flat on the desk until the lamp has flickered
  }
  syncMap(false);
  S.gaze.copy(viewerLocal());
  // paint the papers again once the fonts are really there
  const fontsReady = Promise.all([document.fonts.load(`40px ${FONT_ZH}`, '學習地圖你想學什麼下一步抽籤限時專送會了課秒任務幫我挑第分鐘約站亮AI名詞小字典給'), document.fonts.load(`600 24px ${FONT_EN}`, '1234567890 / A—Z')]).catch(() => {});
  fontsReady.then(() => paints.forEach((p) => p()));

  // the shaders are built off to the side where the browser can (KHR_parallel_shader_compile); the poster and its buttons stay live meanwhile
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (e) { renderer.compile(scene, camera); }
  if (dead) return;
  frame(1 / 60);
  clearTimeout(failTimer);
  ready = true;
  html.classList.add('is-3d');
  performance.mark('f4-3d-ready');
  if (F4.card) { skipIntro(); focusOn(focusIdOf(F4.card), true); }    // you were already answering on the poster: the desk comes up at that thing
  const packCtx = { THREE, scene, camera, view, html, crabRoot, squash, model, nodes, acts, play, S, L, LIFE, chainSw, props, IDS, N, CRAB_SCALE };
  if (F4.card) { /* handled above */ }
  else if (ARRIVE && !crabRoot.visible) {
    window.__f4Landing = true;
    const greet = () => { if (F4.card || sayKind) return; say(F4.greeting(), { hold: 5.6 }); };
    import('./pack-land.js').then((m) => { packHook = m.land({ ...packCtx, short: !!ARRIVE.short, greet }); window.__f4Land = packHook; })
      .catch((e) => { console.info('[f4] no landing:', e && e.message); crabRoot.visible = true; delete html.dataset.arrive; greet(); });
  }
  else if (!STILL && S.introDone) later(0.9, () => { if (F4.card || sayKind) return; if (!REDUCED) play('wave_R', { force: true }); say(F4.greeting(), { hold: 5.6 }); });

  /* the switch back to the plain page: the crab gathers the desk into its bundle and jumps off; the plain page plays the rest.
     Only once the live desk is up and still; less-motion systems and new-tab clicks keep the plain page change. */
  let leavingNow = false;
  document.querySelectorAll('a[data-view-to="simple"]').forEach((a) => a.addEventListener('click', (e) => {
    if (REDUCED || STILL || CAPTURE && !window.__f4LeaveTest || F4.card || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); if (leavingNow || packHook && !packHook.over) return;   // (a press during the arrival has already ended it: pack-land.js skip; a second press while it packs changes nothing)
    leavingNow = true; const href = a.href; let went = false;
    const go = () => { if (went) return; went = true; try { sessionStorage.setItem('paradigm.f4.switching', JSON.stringify({ to: 'simple', at: Date.now(), pack: 1 })); } catch (x) { /* then it just changes page */ } location.href = href; };
    unfocus();
    import('./pack-land.js').then((m) => { packHook = m.leave(packCtx, go); window.__f4Leave = packHook; }).catch(go);
  }));
  window.addEventListener('pageshow', (e) => { if (e.persisted && html.classList.contains('pk-leaving')) location.reload(); });   // Back to a desk the crab has left: start it again

  window.__f2 = {
    advance(ms, step = 1000 / 60) { let left = ms; while (left > 0.0001) { const d = Math.min(step, left); frame(d / 1000); left -= d; } },
    hot: (id) => setHot(id, id ? 'tag' : null), focusOn, unfocus, celebrate, syncMap, mapFlags, skipIntro, lamp: (on) => setLamp(on, true), toggleLamp, pokeCrab, startLife, endLife, LIFE, setCurtain, setRain, wiper, RAIN, CURT,
    stats: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, tex: renderer.info.memory.textures, layout: S.layout, intro: S.intro }),
    S, L, scene, camera, renderer, props, LAYOUT, applyLayout, fit, canvas, acts,
  };
  if (CAPTURE) return;
  const clock = new THREE.Clock();
  let live = !document.hidden;
  document.addEventListener('visibilitychange', () => { live = !document.hidden; if (live) clock.getDelta(); });
  let slowN = 0, slowSum = 0, tuned = false;
  renderer.setAnimationLoop(() => {
    if (!live) return;
    const dt = clock.getDelta();
    frame(dt);
    // a device that cannot hold about 38 fps gives up the shadow map and some pixels; the soft blobs take over
    if (!tuned && S.t > 3.6 && dt < 0.2) {
      slowN++; slowSum += dt;
      if (slowN === 90) {
        tuned = true;
        if (slowSum / slowN > 0.026) { SHADOWS = false; spot.castShadow = false; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); fit(); console.info('[f4] light mode: shadows off'); }
      }
    }
  });
}

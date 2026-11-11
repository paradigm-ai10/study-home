/* "The crab packs up and moves": the plain page's half of the switch to the 3D desk (simple.html → index.html).
   Spec: ../BRIEF_轉場打包.md, storyboard: 截圖/轉場打包/分鏡/分鏡.md.

   1. out    the little desk photo ducks, pops, and the real crab (same model, same clay as the 3D page) jumps out of it
   2. pack   it throws its dotted cloth open on the page; each thing on the page peels off as a sheet of paper, folds in half
             twice and lands on the cloth, nearest first, until there is a pile; the corners come up, it is tied, and the crab
             swings the bundle onto its back
   3. leap   one beat on the empty page, then it jumps over your head; the cream page drops away and the rainy desk is behind it
   then the page changes (pack-boot.js → go). The 3D page's half is a later stage.

   Everything is drawn from one function of time, frame(t): the live run just feeds it the clock, the film script
   (src/pack-film.cjs) feeds it t = 0, 1/30, 2/30 … so what is checked frame by frame is exactly what plays.
   Loaded only when you reach for a switch link (pack-boot.js); nothing here runs, and no canvas draws, outside the ~3.2 s it plays. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';   // crab-f4.glb is meshopt-compressed (src/squeeze_crab.mjs)
import { makeBundle } from './pack-bundle.js';

const html = document.documentElement;
const $ = (s) => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ring = (x, decay, hz) => (x <= 0 ? 0 : Math.exp(-decay * x) * Math.cos(Math.PI * 2 * hz * x));   // a damped wobble that starts at 1

/* ------------------------------------------------------------------ when things happen (seconds) */
const FULL = {
  dip: 0.10,                       // the photo ducks until here, then pops and the crab is out
  touch: 0.42,                     // the crab lands on the page
  cloth: [0.48, 0.72],             // its parcel comes off its head and opens into the cloth
  pack0: 0.70, step: 0.08,         // the first thing peels off; one more every step
  fold: 0.15, fly: 0.24,           // each: peel and fold, then over to the pile
  wrap: [1.91, 2.15],              // corners up, tied
  hoist: [2.15, 2.43],             // onto its back
  squat: [2.43, 2.57],             // the page is empty: the one held beat
  leap: [2.57, 3.04],              // up at you (biggest about 2.8, the desk already showing behind it), then over your head
  fall: [2.60, 2.88],              // the cream page drops
  end: 3.06,
};
/* the second time on: the same story in a breath. No cloth: out of the photo, everything on the page goes straight into
   the bundle on its back at once, and it is away. */
const QUICK = {
  dip: 0.08, touch: 0.36, cloth: [9, 9.2], pack0: 0.40, step: 0.016, fold: 0.10, fly: 0.20,
  wrap: [0.70, 0.88], hoist: [0.756, 0.766], squat: [0.90, 1.00], leap: [1.00, 1.47], fall: [1.03, 1.31], end: 1.49,
};
/* coming back from the desk (3D → plain): it drops in with the bundle, the things fly back to their places, it hops into the photo */
const BACK = { fall: [0, 0.30], burst0: 0.40, step: 0.03, fly: 0.36, shrink: [0.40, 1.02], home: [1.10, 1.40], end: 1.56 };
export let T = FULL;
/* nearest to the crab first, the headline last: the page empties from the bottom right to the top left.
   [selector, the size it is folded down to (px), does the crab snap a claw for it] */
const ITEMS = [
  ['#ways a[data-id="ask"]',   [88, 50], 1],
  ['#ways a[data-id="news"]',  [88, 50], 0],
  ['#ways a[data-id="words"]', [88, 50], 1],
  ['#ways a[data-id="solve"]', [88, 50], 0],
  ['#ways a[data-id="free"]',  [88, 50], 1],
  ['aside .sec-h',             [70, 36], 0],
  ['.note',                    [86, 66], 1],
  ['#map',                     [108, 78], 1],
  ['.hero .cta',               [82, 44], 0],
  ['.hero .sub',               [88, 38], 1],
  ['.hero h1',                 [98, 54], 1],
];
const JX = [-10, 9, -4, 12, -8, 4, -12, 8, 0, -6, 6], JR = [-9, 7, -4, 10, -7, 5, 8, -6, 3, -8, 2];   // how each lies on the pile

/* ------------------------------------------------------------------ the crab's clay: the same shader as study.js (keep the two alike; this is its lighter variant, no height texture) */
const SH = { uKeyDir: { value: new THREE.Vector3(0, 1, 0) }, uKeyCol: { value: new THREE.Vector3(1, 1, 1) }, uUpV: { value: new THREE.Vector3(0, 1, 0) } };
const CLAY_COMMON = /* glsl */`
varying vec3 vRest; varying vec3 vRestN;
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uUpV;
uniform vec3 uSSS; uniform float uSSSAmt; uniform float uBump; uniform float uMottle;
float cH31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float cNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(cH31(i), cH31(i + vec3(1, 0, 0)), f.x), mix(cH31(i + vec3(0, 1, 0)), cH31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(cH31(i + vec3(0, 0, 1)), cH31(i + vec3(1, 0, 1)), f.x), mix(cH31(i + vec3(0, 1, 1)), cH31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float clayHeight(vec3 p) {
  float h = (cNoise(p * 5.5 + 1.7) - 0.5) * 0.0018;
  h += (cNoise(p * 14.0) - 0.5) * 0.0009;
  h += (cNoise(p * 36.0 + 3.1) - 0.5) * 0.0009;
  return h;
}
`;
function clayMaterial(hex, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: hex, roughness: o.rough ?? 0.62, metalness: 0,
    sheen: o.sheen ?? 0.2, sheenRoughness: o.sheenRough ?? 0.62, sheenColor: new THREE.Color(o.sheenColor ?? 0xffd2a4),
    vertexColors: true, specularIntensity: o.spec ?? 0.3,
  });
  const U = { uSSS: { value: new THREE.Color(o.sss ?? 0xff7a38) }, uSSSAmt: { value: o.sssAmt ?? 0.22 }, uBump: { value: o.bump ?? 1.0 }, uMottle: { value: o.mottle ?? 0.08 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, SH);
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
  m.customProgramCacheKey = () => 'pack-clay';
  return m;
}

/* ------------------------------------------------------------------ built once, on the first reach for the switch */
let R = null;        // renderer, scene, crab … (null until prepare() has run)
let M = null;        // what was measured on the page for this run
let raf = 0, playing = false, skipOff = null, mode = '';   // mode: 'go' packing up to leave, 'back' handing things back

export function prepare() {
  if (prepare.p) return prepare.p;
  prepare.p = (async () => {
    const canvas = document.createElement('canvas'); canvas.className = 'pk-canvas'; canvas.setAttribute('aria-hidden', 'true');
    html.append(canvas);                                             // beside <body>, not in it: the page can drop away without taking the crab along
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 1.6, 0.4, 80);   // the storyboard's camera: looking down at the page as if it lay on a table
    camera.position.set(0.1, 4.4724, 9.8757); camera.lookAt(0.1, 0.78, 0);

    /* daylight on a cream page, warm enough that the clay reads as the crab from the photo */
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0xf2b08c, 1.9));
    const key = new THREE.DirectionalLight(0xffe6c8, 3.3); key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30 }); key.shadow.radius = 7; key.shadow.bias = -0.0006;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffc857, 0.7); rim.position.set(4, 3, -5); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: 0x3a2e5c, opacity: 0.2 }));
    floor.receiveShadow = true; scene.add(floor);

    const [gltf] = await Promise.all([
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('crab-f4.glb'),
      ...['crab-small-empty.webp', 'img/desk-empty.webp'].map((src) => { const i = new Image(); i.src = src; return i.decode().catch(() => {}); }),
    ]);
    const crabRoot = new THREE.Group(), squash = new THREE.Group(); scene.add(crabRoot); crabRoot.add(squash);
    const model = gltf.scene; model.scale.setScalar(1.45); squash.add(model);
    const nodes = {}; model.traverse((o) => { nodes[o.userData.name || o.name] = o; });

    const clay = clayMaterial(0xd47d62), clayLimb = clayMaterial(0xd47d62, { sssAmt: 0.5 });
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x0c0a0a, roughness: 0.4, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.25, specularIntensity: 0.4 });
    eyeMat.onBeforeCompile = (sh) => {                               // the two catchlights, as on the desk
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRest;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRest;')
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
            totalEmissiveRadiance += vec3(1.0, 0.92, 0.80) * (c1 * 1.7 + c2 * 0.5) * front;
          }`);
    };
    eyeMat.customProgramCacheKey = () => 'pack-eye';
    const paperMat = clayMaterial(0xf3c15a, { sss: 0xff9a3a, sssAmt: 0.35, sheen: 0.25, sheenColor: 0xfff1c9, rough: 0.74, mottle: 0.05 });
    const stringMat = clayMaterial(0x3a2e5c, { sss: 0x6b4fa8, sssAmt: 0.2, sheen: 0.6, sheenColor: 0x9b8ad0, rough: 0.82, mottle: 0.03, bump: 0.6 });
    const isLump = (o) => { for (let x = o; x && x !== model; x = x.parent) if (/^lump:/.test(x.userData.name || '')) return true; return false; };
    const partOf = (o) => { for (let x = o; x; x = x.parent) { const m = (x.userData.name || '').match(/^part:([a-z-]+)/); if (m) return m[1]; } return null; };
    model.traverse((o) => {
      if (/^lump:/.test(o.userData.name || '')) { o.visible = false; return; }
      if (!o.isMesh || isLump(o)) return;
      const p = partOf(o), mn = o.material && o.material.name;
      if (mn === 'hit' || mn === 'bubble' || (o.userData.name || o.name) === 'eye_lens') { o.visible = false; return; }
      if (mn === 'eye') o.material = eyeMat;
      else if (mn === 'paper') o.material = paperMat;
      else if (mn === 'string') o.material = stringMat;
      else o.material = (p === 'legs' || (p && p.startsWith('claw'))) ? clayLimb : clay;
      o.castShadow = mn !== 'eye'; o.receiveShadow = p !== 'legs';
      if (o.isSkinnedMesh) o.frustumCulled = false;
    });

    /* every clip is held at a chosen time and weight each frame: nothing advances on its own, so frame(t) is the whole truth */
    const mixer = new THREE.AnimationMixer(model); const acts = {};
    gltf.animations.forEach((src) => {
      const clip = src.clone();
      if (clip.name !== 'idle') THREE.AnimationUtils.makeClipAdditive(clip, Math.ceil(clip.duration * 60) + 5, clip, 60);
      const a = mixer.clipAction(clip); a.play(); a.paused = true; a.weight = clip.name === 'idle' ? 1 : 0; acts[clip.name] = a;
    });

    /* the tied bundle is its own object and follows the parcel's place on the shell: clips squash bones, the bundle must not inherit that */
    const bundle = makeBundle(THREE, { fill: 1 }); bundle.visible = false; scene.add(bundle);
    /* the cloth while it lies open is part of the page, not of the 3D scene: the folded things (real page elements) have to lie on top of it */
    const cloth = document.createElement('div'); cloth.className = 'pk-cloth'; cloth.setAttribute('aria-hidden', 'true'); document.body.append(cloth);

    R = { canvas, renderer, scene, camera, key, floor, crabRoot, squash, model, nodes, mixer, acts, bundle, cloth };
    size();
    crabRoot.position.set(0, 0, 0); bundle.visible = true; nodes['part:parcel'] && (nodes['part:parcel'].visible = true);
    try { await renderer.compileAsync(scene, camera); } catch (e) { /* older three: compiles on first draw */ }
    renderer.render(scene, camera); renderer.clear();                // textures and shadow map are up before the first real frame
    bundle.visible = false;
    return true;
  })();
  return prepare.p;
}

function size() {
  const { renderer, camera, key } = R; const W = innerWidth, H = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  SH.uKeyDir.value.copy(key.position).normalize().transformDirection(camera.matrixWorldInverse);
  SH.uKeyCol.value.set(1.15, 0.86, 0.6);
  SH.uUpV.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
}

/* ------------------------------------------------------------------ page ↔ world */
const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v2 = new THREE.Vector2(), tmp = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
function groundAt(x, y) {                                            // the spot on the "table" under a point of the page
  ray.setFromCamera(v2.set(x / innerWidth * 2 - 1, -(y / innerHeight * 2 - 1)), R.camera);
  const p = new THREE.Vector3(); ray.ray.intersectPlane(ground, p); return p;
}
function screenOf(p) { tmp.copy(p).project(R.camera); return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight]; }

/* ------------------------------------------------------------------ set the stage for one run */
function arm(opts = {}) {
  const short = !!opts.short; T = short ? QUICK : FULL;
  const boot = window.__packBoot; boot.stage(true);                 // the night behind the page, the page as a sheet that can drop (pack-fx.css)
  size();
  const W = innerWidth, H = innerHeight;
  const photo = $('#desk-photo'); const pr = photo.getBoundingClientRect();
  const seen = pr.width > 0 && pr.bottom > 30 && pr.top < H - 20 && pr.right > 0 && pr.left < W;
  const gy = clamp(Math.max(pr.bottom + 20, H * 0.9), H * 0.55, H - 46);          // the line the crab stands on
  const from = seen ? [pr.left + pr.width * 0.45, pr.top + pr.height * 0.66] : [W * 0.8, H + 70];   // where the crab stands in the photo
  const x1 = clamp((seen ? pr.left : W * 0.72) - 132, 440, W - 170);              // lands clear of the photo
  const G0 = groundAt(from[0], Math.min(from[1], H + 70)), G1 = groundAt(x1, gy);
  const a = screenOf(G0), b = screenOf(G0.clone().add(new THREE.Vector3(1, 0, 0)));
  const ppu = Math.hypot(b[0] - a[0], b[1] - a[1]);                                 // pixels per world unit, at the photo
  const S = 0.85, s0 = seen ? clamp(pr.width * 0.56 / (2.175 * ppu), 0.08, S) : S * 0.7;   // in the photo its body is 56% of the picture's width
  /* over your head: a point just in front of the camera and above its view, by way of one low and close */
  const cam = R.camera; const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const PM = cam.position.clone().addScaledVector(fwd, 4.3).addScaledVector(up, -0.82);
  const PL = cam.position.clone().addScaledVector(fwd, 2.7).addScaledVector(up, 1.75);
  const PC = PM.clone().multiplyScalar(2).addScaledVector(G1, -0.5).addScaledVector(PL, -0.5);   // the curve's handle, so it passes through PM halfway

  /* the cloth lies flat on the page (the page is paper seen from straight on), to the crab's left */
  const CS = clamp(H * 0.25, 170, 228);
  const cc = short ? [x1, gy - 205] : [clamp(x1 - 158 - CS / 2, CS * 0.62, W), gy - CS * 0.36];   // (short: no cloth, the pile is the bundle on its back)
  const cloth = R.cloth; cloth.style.width = cloth.style.height = CS + 'px'; cloth.style.display = 'block';
  const GB = groundAt(cc[0], cc[1] + CS * 0.46);                                    // where the tied bundle sits

  const items = ITEMS.map(([sel, mini0, snap], k) => {
    const el = $(sel); if (!el) return null;
    const r = el.getBoundingClientRect(); const at = T.pack0 + k * T.step;
    if (!r.width || r.bottom < -300 || r.top > H + 500) { el.style.visibility = 'hidden'; return { el, skip: true, at, snap }; }
    el.classList.add('pk-item');
    const mini = short ? [mini0[0] * 0.5, mini0[1] * 0.5] : mini0;
    const tx = cc[0] + JX[k] * CS / 220 * (short ? 0.4 : 1), ty = cc[1] + (short ? 0 : 22 - k * 5.4);
    return { el, k, at, snap, paper: !el.classList.contains('note'), cx: r.left + r.width / 2, cy: r.top + r.height / 2, tx, ty,
      msx: mini[0] / r.width, msy: mini[1] / r.height, rot: JR[k], dir: k % 2 ? 1 : -1, arc: 34 + Math.hypot(tx - (r.left + r.width / 2), ty - (r.top + r.height / 2)) * 0.1, state: '', op: '' };
  }).filter(Boolean);
  const lands = items.map((i) => i.at + T.fold + T.fly);
  const snaps = items.filter((i) => i.snap).map((i, n) => ({ at: i.at + T.fold + T.fly, side: n % 2 ? 'snap_L' : 'snap_R' }));
  const rule = $('.wrap > hr.rule'), ruleAt = (items.find((i) => i.el.id === 'map') || { at: 1.4 }).at;
  const main = $('main'); const mr = main.getBoundingClientRect();
  main.style.transformOrigin = `${(W / 2 - mr.left).toFixed(1)}px ${(H * 0.3 - mr.top).toFixed(1)}px`;
  M = { short, W, H, photo, seen, G0, G1, PL, PC, GB, S, s0, CS, cc, head: [x1, gy - 170], items, lands, snaps, rule, ruleAt, main, cloth, sheet: boot.sheet(), photoSrc: photo.getAttribute('src'), empty: false, night: false, clothT: '' };
}

/* ------------------------------------------------------------------ one frame */
function setClip(name, time, weight) { const a = R.acts[name]; if (!a) return; a.weight = weight; if (weight > 0) a.time = clamp(time, 0, a.getClip().duration - 0.001); }
const bez = (out, A, C, B, u) => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return out.set(a * A.x + b * C.x + c * B.x, a * A.y + b * C.y + c * B.y, a * A.z + b * C.z + c * B.z); };
const tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3();

export function frame(t) {
  const { renderer, scene, camera, crabRoot, squash, nodes, mixer, acts, bundle, floor } = R; const m = M;
  const { G0, G1, PL, PC, GB, S, s0, CS, cc } = m;
  const w = seg(t, T.wrap[0], T.wrap[1]), h = seg(t, T.hoist[0], T.hoist[1]);

  /* ---- the photo: ducks, then pops open and stays a little crooked; the crab in it is gone */
  {
    const x = t - T.dip; let s, rot;
    if (x < 0) { s = 1 - 0.08 * outCubic(seg(t, 0, T.dip)); rot = 0; }
    else { s = 1 - 0.08 * ring(x, 9, 3.2); rot = 3.5 * (1 - Math.exp(-10 * x)) + 3 * Math.exp(-8 * x) * Math.sin(Math.PI * 2 * 3.2 * x); }
    m.photo.style.transform = t <= 0 ? '' : `rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    const empty = x >= 0; if (empty !== m.empty) { m.empty = empty; m.photo.src = empty ? 'crab-small-empty.webp' : m.photoSrc; }
  }

  /* ---- what has landed on the pile so far: the cloth and the crab both feel each one */
  let thump = 0; for (const c of m.lands) thump += ring(t - c, 18, 6);

  /* ---- the cloth: thrown open, lies there while the pile grows, then its corners come up */
  {
    const cu = seg(t, T.cloth[0], T.cloth[1]); let tr = 'none', op = 1, rad = 7;
    if (t >= T.cloth[0] && w < 0.8) {
      const e = outCubic(cu);
      const x = lerp(m.head[0], cc[0], e), y = lerp(m.head[1], cc[1], e) - 70 * Math.sin(Math.PI * cu);
      const open = t - T.cloth[1];
      let sx = lerp(0.1, 1, outCubic(seg(cu, 0, 0.8))) * (1 + 0.07 * ring(open, 13, 5)), sy = lerp(0.1, 1, outCubic(seg(cu, 0.15, 1))) * (1 + 0.07 * ring(open - 0.03, 13, 5));
      const g = inOut(w); const pinch = 1 - 0.24 * g; sx *= pinch * (1 + 0.02 * thump); sy *= pinch * (1 - 0.03 * thump);
      rad = lerp(7, CS / 2, g); op = 1 - seg(w, 0.5, 0.8);
      tr = `translate3d(${(x - CS / 2).toFixed(1)}px,${(y - CS / 2).toFixed(1)}px,0) rotate(${(lerp(46, -5, e) + 30 * g).toFixed(2)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    }
    const key = tr + op.toFixed(2);
    if (key !== m.clothT) { m.clothT = key; const s = m.cloth.style; if (tr === 'none') s.visibility = 'hidden'; else { s.visibility = 'visible'; s.transform = tr; s.opacity = op.toFixed(3); s.borderRadius = rad.toFixed(1) + 'px'; } }
  }

  /* ---- the things on the page: peel off as paper, fold in half twice, over to the pile; they stay there, a little stack */
  for (const it of m.items) {
    if (it.skip) continue;
    const a = it.at, b = a + T.fold, c = b + T.fly; let state = '', op = '';
    if (t >= a) {
      const f = seg(t, a, b);
      let x = 0, y = -9 * outCubic(seg(f, 0, 0.4)), sy = 1 - 0.45 * outCubic(seg(f, 0, 0.55)), sx = 1 - 0.4 * outCubic(seg(f, 0.45, 1)), rot = it.dir * 2.5 * f;
      if (t >= b) {
        const p = seg(t, b, c), q = inOut(p), g = outCubic(p);
        x = (it.tx - it.cx) * q; y = lerp(-9, it.ty - it.cy, q) - it.arc * Math.sin(Math.PI * p);
        sx = lerp(0.6, it.msx, g); sy = lerp(0.55, it.msy, g); rot = lerp(it.dir * 2.5, it.rot, q);
      }
      if (t >= c) { const z = ring(t - c, 20, 7); sy *= 1 - 0.2 * z; sx *= 1 + 0.1 * z; }
      if (w > 0) { const g = inOut(w); x += (cc[0] - it.tx) * g; y += (cc[1] - it.ty) * g; sx *= 1 - 0.45 * g; sy *= 1 - 0.45 * g; rot += 30 * g; op = (1 - seg(w, 0.3, 0.6)).toFixed(3); }
      state = w >= 0.6 ? 'gone' : `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    }
    if (state === it.state && op === it.op) continue;
    const s = it.el.style;
    if (state === 'gone') { s.visibility = 'hidden'; s.transform = ''; s.opacity = ''; }
    else {
      if (!it.state !== !state) { s.zIndex = state ? 10 + it.k : ''; s.willChange = state ? 'transform' : ''; if (it.paper) it.el.classList.toggle('pk-paper', !!state); }
      s.visibility = ''; s.transform = state; s.opacity = op;
    }
    it.state = state; it.op = op;
  }
  if (m.rule) m.rule.style.opacity = t < m.ruleAt ? '' : (1 - seg(t, m.ruleAt, m.ruleAt + 0.15)).toFixed(3);

  /* ---- the crab */
  const out = seg(t, T.dip, T.touch), sq = seg(t, T.squat[0], T.squat[1]), lp = seg(t, T.leap[0], T.leap[1]);
  const toss = seg(t, T.cloth[0] - 0.04, T.cloth[0] + 0.2);                       // the little hop as it throws the cloth open
  const busy = seg(t, T.cloth[0], T.cloth[0] + 0.16) * (1 - seg(t, T.hoist[1] - 0.1, T.hoist[1] + 0.08));   // turned toward the cloth while it packs
  const pos = crabRoot.position; let scale = S, rotX = 0, rotY = 0, rotZ = 0, sx = 1, sy = 1;
  if (t < T.touch) {                                                 // out of the photo, through the air
    pos.lerpVectors(G0, G1, out); pos.y = 4 * 1.05 * out * (1 - out) * lerp(s0, S, out) / S * 1.1;
    scale = lerp(s0, S, outCubic(out)); rotY = -0.35 * (1 - out); rotZ = 0.24 * Math.sin(Math.PI * Math.min(1, out * 1.25));
    const st = Math.sin(Math.PI * out); sx = 1 - 0.1 * st; sy = 1 + 0.16 * st;
  } else if (t < T.leap[0]) {                                        // on the page: throws the cloth, minds the pile, ties it, shoulders it, squats
    const thud = ring(t - T.touch, 15, 4.2); sx = 1 + 0.2 * thud; sy = 1 - 0.24 * thud;
    pos.copy(G1); pos.x += Math.sin(t * 7.5) * 0.035 * busy;
    pos.y = 0.2 * Math.sin(Math.PI * toss) + 0.16 * Math.sin(Math.PI * seg(h, 0, 0.7));
    rotY = -0.22 * busy; rotZ = 0.05 * busy + 0.1 * Math.sin(Math.PI * w);          // leans in to tie the knot
    sy *= 1 - 0.045 * thump; sx *= 1 + 0.03 * thump;                               // a nod for each thing that lands
    const got = ring(t - T.hoist[1], 14, 4.5); sy *= 1 - 0.2 * got; sx *= 1 + 0.15 * got;   // the bundle comes down on its back
    const d = outCubic(sq); sy *= 1 - 0.24 * d; sx *= 1 + 0.15 * d;
  } else {                                                           // over your head
    const u = lp < 0.5 ? outCubic(lp * 2) * 0.5 : 0.5 + Math.pow((lp - 0.5) * 2, 1.7) * 0.5;      // fast off the page, a breath at the top of the jump, then away
    bez(pos, G1, PC, PL, u);
    const st = Math.sin(Math.PI * Math.min(1, lp * 2.4)); sy = lerp(0.76, 1, seg(lp, 0, 0.08)) + 0.2 * st; sx = lerp(1.15, 1, seg(lp, 0, 0.08)) - 0.1 * st;
    rotX = -0.22 * outCubic(seg(lp, 0, 0.5)); rotZ = -0.05 * Math.sin(Math.PI * lp);
  }
  crabRoot.visible = t >= T.dip;
  crabRoot.scale.setScalar(scale); crabRoot.rotation.set(rotX, rotY, rotZ, 'YXZ'); squash.scale.set(sx, sy, sx);

  Object.values(acts).forEach((a) => { if (a.getClip().name !== 'idle') a.weight = 0; });
  acts.idle.time = (0.4 + t) % 8;
  setClip('eyes_wide', lerp(0.3, 0.6, out), t < T.touch + 0.2 ? 1 - seg(t, T.touch, T.touch + 0.2) : 0);
  setClip('hop', lerp(0.3, 0.55, out), t < T.touch ? Math.sin(Math.PI * out) : 0);
  setClip('legs_tap', (t * 2.4) % 1.1, busy * (1 - h) * 0.8);
  { let last = null; for (const s of m.snaps) if (t >= s.at - 0.17 && t < s.at - 0.17 + 1.05 / 2.4) last = s; if (last && w <= 0) setClip(last.side, (t - (last.at - 0.17)) * 2.4, 1); }
  if (t >= T.cloth[0] - 0.1 && t < T.cloth[0] + 0.3) { setClip('snap_R', (t - (T.cloth[0] - 0.1)) * 2.6, 1); setClip('parcel_wiggle', (t - (T.cloth[0] - 0.1)) * 2.6, 1); }   // the throw
  if (w > 0 && h <= 0) { const x = (t - T.wrap[0]) * 2.2; setClip('snap_L', x, 1); setClip('snap_R', x, 1); }               // both claws for the knot
  if (h > 0 && t < T.hoist[1] + 0.2) { setClip('wave_R', lerp(0.2, 0.5, outCubic(seg(h, 0, 0.5))), 1 - seg(t, T.hoist[1], T.hoist[1] + 0.2)); }   // one claw up to swing it over
  if (sq > 0 && lp <= 0) setClip('settle', 0.25 * sq, sq);
  if (lp > 0) { const v = outCubic(seg(lp, 0, 0.25)); setClip('wave_L', lerp(0.2, 0.5, v), v); setClip('wave_R', lerp(0.2, 0.5, v), v); setClip('eyes_wide', lerp(0.3, 0.5, v), v); setClip('hop', lerp(0.3, 0.48, lp), v); }
  mixer.update(0);

  /* ---- the cloth came out of its little parcel; tied, the bundle sits on the page, then goes onto its back, over the parcel */
  if (nodes['part:parcel']) nodes['part:parcel'].visible = t < T.hoist[1] - 0.03;
  bundle.visible = w >= 0.42 && crabRoot.visible;
  if (bundle.visible) {
    crabRoot.updateMatrixWorld(true);
    const r = S * 1.45 * 0.98; const born = lerp(0.5, 1, outBack(seg(w, 0.42, 1)));    // starts the size the gathered cloth has shrunk to
    if (h <= 0) {                                                    // just tied, on the page
      bundle.position.copy(GB); bundle.quaternion.identity(); bundle.rotation.z = 0.12 * ring(t - (T.wrap[0] + 0.1), 9, 4);
      bundle.scale.set(r * born, r * born * (1 - 0.1 * ring(t - T.wrap[1], 14, 5)), r * born);
    } else {
      (nodes.parcel || nodes.top || squash).getWorldPosition(tmpB);
      if (h < 1) {                                                   // swung up and over, one turn on the way
        const e = inOut(h); tmpC.copy(GB).lerp(tmpB, 0.5); tmpC.y += 2.5 * S;
        bez(bundle.position, GB, tmpC, tmpB, e); bundle.quaternion.identity(); bundle.rotation.z = -Math.PI * 2 * e; bundle.scale.setScalar(r);
      } else {
        bundle.position.copy(tmpB); squash.getWorldQuaternion(tmpQ); bundle.quaternion.copy(tmpQ);
        const got = ring(t - T.hoist[1], 14, 4.5); const k = scale / S;
        bundle.scale.set(r * k * (1 + 0.12 * got), r * k * (1 - 0.16 * got) * (lp > 0 ? 1 : lerp(1, 0.92, outCubic(sq))), r * k * (1 + 0.12 * got));
      }
    }
  }
  floor.material.opacity = 0.2 * (1 - seg(t, T.leap[0], T.leap[0] + 0.1));

  /* ---- the cream page drops; the top line stays and turns into the desk's */
  const f = seg(t, T.fall[0], T.fall[1]);
  const night = t >= T.fall[0]; if (night !== m.night) { m.night = night; html.classList.toggle('pk-night', night); }
  const drop = f <= 0 ? '' : `translate3d(0,${(f * f * m.H * 1.22).toFixed(1)}px,0) rotate(${(2.4 * f).toFixed(2)}deg)`;
  if (drop !== m.drop) { m.drop = drop; m.main.style.transform = drop; m.sheet.style.transform = drop; }

  renderer.render(scene, camera);
}

/* ------------------------------------------------------------------ run it; a click or Esc at any moment jumps to the end */
export async function play(href, opts = {}) {
  if (playing) { if (mode !== 'back') return; reset(); delete html.dataset.arrive; }   // pressed while the crab was still handing things back: that ends, this starts
  playing = true; mode = 'go';
  await prepare(); if (mode !== 'go') return; arm(opts);
  // while this plays, fetch what the 3D page will ask for the moment it opens, so the crab is not left hanging in the air
  ['study.js', 'pack-land.js', 'set.glb', 'props.glb', 'tex/gains.json', 'tex/detail_dusk.webp', 'tex/detail_lamp.webp', 'tex/wall_dusk.webp', 'tex/wall_lamp.webp', 'tex/desk_dusk.webp', 'tex/wood.webp', '../../c5/clay_height.webp']
    .forEach((u) => { fetch(u).catch(() => {}); });
  const done = (skipped) => { cancelAnimationFrame(raf); if (skipOff) skipOff(); window.__packBoot.go(href, skipped === true, !!opts.short); };
  const skip = (e) => { if (e.type === 'keydown' && e.key !== 'Escape') return; e.preventDefault(); done(true); };
  setTimeout(() => { if (!playing || mode !== 'go') return; addEventListener('pointerdown', skip, true); addEventListener('keydown', skip, true); }, 450);   // not at once: the second press of a double click is not "skip this"
  skipOff = () => { removeEventListener('pointerdown', skip, true); removeEventListener('keydown', skip, true); skipOff = null; };
  let t0 = 0;
  const tick = (now) => {
    if (!t0) t0 = now;                                               // the clock starts on the first frame that is actually drawn
    const t = (now - t0) / 1000; frame(Math.min(t, T.end));
    if (t >= T.end) done(); else raf = requestAnimationFrame(tick);
  };
  frame(0); raf = requestAnimationFrame(tick);
}

/* back to how the page was (coming Back to this page, or the film script starting over) */
export function reset() {
  cancelAnimationFrame(raf); if (skipOff) skipOff(); playing = false; mode = '';
  if (M) {
    M.items.forEach((it) => { const s = it.el.style; s.transform = s.opacity = s.visibility = s.willChange = s.zIndex = ''; it.el.classList.remove('pk-item', 'pk-paper'); });
    if (M.rule) M.rule.style.opacity = '';
    M.photo.style.transform = ''; if (M.empty) M.photo.src = M.photoSrc;
    M.main.style.transform = M.main.style.transformOrigin = ''; M.sheet.style.transform = '';
    M = null;
  }
  html.classList.remove('pk-night');
  if (R) { R.bundle.visible = false; R.renderer.clear(); const s = R.cloth.style; s.display = 'none'; s.visibility = 'hidden'; s.transform = ''; }
  window.__packBoot.stage(false);
}

/* for the film script and for checking by hand: __pack.arm(); __pack.frame(0.8) */
/* ------------------------------------------------------------------ the way back (3D → plain): one frame, and the run */
export function frameBack(t) {
  const { renderer, scene, camera, crabRoot, squash, nodes, mixer, acts, bundle } = R; const m = M; const B = BACK;
  const { G0, G1, S, s0, cc } = m;
  /* the things: out of the bundle, growing back into themselves, each to its own place */
  for (const it of m.items) {
    if (it.skip) continue;
    const a = B.burst0 + (m.items.length - 1 - it.k) * B.step; const u = seg(t, a, a + B.fly); const s = it.el.style;
    let state;
    if (u <= 0) state = 'gone'; else if (u >= 1) state = '';
    else {
      const e = outCubic(u), g = inOut(u);
      const x = (it.tx - it.cx) * (1 - g), y = (it.ty - it.cy) * (1 - g) - it.arc * Math.sin(Math.PI * u);
      const land = u > 0.8 ? 1 + 0.04 * Math.sin(Math.PI * (u - 0.8) / 0.2) : 1;
      state = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(it.rot * (1 - g)).toFixed(2)}deg) scale(${(lerp(it.msx, 1, e) * land).toFixed(4)},${(lerp(it.msy, 1, e) * land).toFixed(4)})`;
    }
    if (state === it.state) continue;
    if (state === 'gone') { s.visibility = 'hidden'; }
    else { s.visibility = 'visible'; s.transform = state; s.zIndex = state ? 10 + it.k : ''; if (it.paper) it.el.classList.toggle('pk-paper', !!state && u < 0.8); s.opacity = state && u < 0.2 ? (u / 0.2).toFixed(3) : ''; }
    it.state = state;
  }
  if (m.rule) m.rule.style.opacity = seg(t, B.burst0 + 0.2, B.burst0 + 0.5).toFixed(3);
  /* the crab: down from above with the bundle, a thump, then home into the photo the way it came out */
  const f = seg(t, B.fall[0], B.fall[1]), u = seg(t, B.home[0], B.home[1]), out = 1 - u;
  const pos = crabRoot.position; let scale = S, rotY = 0, rotZ = 0, sx = 1, sy = 1;
  if (u > 0) {
    pos.lerpVectors(G0, G1, out); pos.y = 4 * 1.05 * out * (1 - out) * lerp(s0, S, out) / S * 1.1;
    scale = lerp(s0, S, outCubic(out)); rotY = -0.35 * (1 - out); rotZ = 0.24 * Math.sin(Math.PI * Math.min(1, out * 1.25));
    const st = Math.sin(Math.PI * out); sx = 1 - 0.1 * st; sy = 1 + 0.16 * st;
  } else {
    pos.copy(G1); pos.y = 4.6 * (1 - f * f);
    if (f < 1) { sy = 1 + 0.18 * f; sx = 1 - 0.09 * f; } else { const th = ring(t - B.fall[1], 14, 4.2); sx = 1 + 0.26 * th; sy = 1 - 0.32 * th; }
    const d = outCubic(seg(t, B.home[0] - 0.12, B.home[0])); sy *= 1 - 0.18 * d; sx *= 1 + 0.1 * d;
  }
  crabRoot.visible = u < 1; crabRoot.scale.setScalar(scale); crabRoot.rotation.set(0, rotY, rotZ, 'YXZ'); squash.scale.set(sx, sy, sx);
  Object.values(acts).forEach((a) => { if (a.getClip().name !== 'idle') a.weight = 0; });
  acts.idle.time = (0.4 + t) % 8;
  if (t >= B.burst0 - 0.05 && t < B.burst0 + 0.45) setClip('shell_puff', (t - (B.burst0 - 0.05)) * 2.2, 1);
  if (u > 0) { setClip('hop', lerp(0.3, 0.55, out), Math.sin(Math.PI * out)); setClip('eyes_wide', 0.45, Math.sin(Math.PI * out)); }
  mixer.update(0);
  const shrink = seg(t, B.shrink[0], B.shrink[1]);
  if (nodes['part:parcel']) nodes['part:parcel'].visible = shrink >= 1;
  bundle.visible = shrink < 1 && crabRoot.visible;
  if (bundle.visible) {
    crabRoot.updateMatrixWorld(true); (nodes.parcel || nodes.top || squash).getWorldPosition(bundle.position);
    squash.getWorldQuaternion(tmpQ); bundle.quaternion.copy(tmpQ);
    const th = f < 1 ? 0 : ring(t - B.fall[1], 14, 4.2); const r = S * 1.45 * 0.98 * (1 - 0.72 * inOut(shrink));
    bundle.scale.set(r * (1 + 0.18 * th), r * (1 - 0.26 * th), r * (1 + 0.18 * th));
  }
  R.floor.material.opacity = 0.2;
  /* the photo gets its crab back, with a little pop */
  { const x = t - (B.home[0] + (B.home[1] - B.home[0]) * 0.9); const empty = x < 0; if (empty !== m.empty) { m.empty = empty; m.photo.src = empty ? 'crab-small-empty.webp' : m.photoSrc; }
    m.photo.style.transform = x < 0 ? '' : `scale(${(1 + 0.1 * ring(x, 9, 3.4)).toFixed(4)})`; }
  renderer.render(scene, camera);
}
function armBack() {
  arm({ short: true });
  M.items.forEach((it) => { if (!it.skip) { it.el.style.visibility = 'hidden'; it.state = 'gone'; } });
  if (M.rule) M.rule.style.opacity = '0';
  M.empty = true; M.photo.src = 'crab-small-empty.webp'; M.back = true;
  delete html.dataset.arrive;                                       // from here the inline styles hold the page
}
export async function playBack() {
  if (playing) return; playing = true; mode = 'back';
  await prepare();
  if (mode !== 'back') return;                                       // the visitor has already pressed "to the desk": play() took over
  if (html.dataset.arrive !== 'unpack') { playing = false; mode = ''; return; }   // took too long: the page has already been shown as it is
  window.__packBack = true; armBack();
  const skip = (e) => { if (e.type === 'keydown' && e.key !== 'Escape') return; reset(); };
  setTimeout(() => { if (!playing) return; addEventListener('pointerdown', skip, true); addEventListener('keydown', skip, true); }, 0);
  skipOff = () => { removeEventListener('pointerdown', skip, true); removeEventListener('keydown', skip, true); skipOff = null; };
  let t0 = 0;
  const tick = (now) => { if (!t0) t0 = now; const t = (now - t0) / 1000; frameBack(Math.min(t, BACK.end)); if (t >= BACK.end) reset(); else raf = requestAnimationFrame(tick); };
  frameBack(0); raf = requestAnimationFrame(tick);
}

/* let the canvas go (a tab left in the background; pack-boot.js): the GPU memory is freed, and prepare() can build it again */
export function release() {
  if (playing || !R) return;
  reset();
  try { R.renderer.dispose(); R.renderer.forceContextLoss(); } catch (e) { /* already gone */ }
  R.canvas.remove(); R.cloth.remove(); R = null; prepare.p = null;
}

window.__pack = { release, get drawn() { return R ? R.renderer.info.render.frame : -1; }, get T() { return T; }, BACK, ITEMS, prepare, arm: async (opts) => { await prepare(); if (M) reset(); arm(opts); frame(0); }, armBack: async () => { await prepare(); if (M) reset(); html.dataset.arrive = 'unpack'; armBack(); frameBack(0); }, frame, frameBack, play, playBack, reset, get ready() { return !!R; }, get m() { return M; } };

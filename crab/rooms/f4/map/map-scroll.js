/* The learning map as a scroll you pick up off the desk (2026-11-13, Thomas: 地圖本來就在桌上，拿起來、像捲軸打開；
   紙軸要更精緻). Second build: the scroll is a real object: paper wound on turned wooden rods with brass collars.
   On by default as s3. ?mapmode=s1 | s2 | s3 picks one (remembered for the browser session); ?mapmode=off turns it off:
     s1  橫卷・雙軸   two rods; the sheet winds in from both ends, comes up to you, opens from the middle
     s2  掛圖・下拉   rods lie across; it winds up to the far edge, hangs at the top of the screen and drops open
     s3  橫卷・單軸   it winds to the left rod, comes up, and the right rod rolls away across the screen

   How it is put together
   - 3D desk (study.js, untouched; reached through window.__f2): two slim rods lie at the ends of the paper map. On
     opening the compass hops off, a scroll mesh (paper strip + rods) takes the sheet's place, winds shut where it
     lies and comes up to the camera.
   - Held in front of you, the same scroll is drawn by a second, transparent WebGL canvas laid over the page (flat
     camera, one pixel = one unit): the rods and paper rolls stay real 3D, lit by a warm key light, and turn as the
     paper leaves them. The flat paper between them is a DOM element holding the map's frame (mindmap/r15-side in
     map/embed.html), clipped to what has been unrolled. The mesh on the desk dissolves into this one over the last
     few hundredths of the flight, while both show the same pose.
   - Plain page / poster: no desk, so the overlay scroll rises from the button you pressed.
   Paper follows the 3d-paper-material skill (warped two-scale fibre field → relief, sheen, a back the colour of the
   stock, wound layers for thickness); the rods follow 3d-wood-material (grain along the member's own axis feeding
   colour and relief together, oil-wax clearcoat, rounded turned ends, no sharp arris).
   Loaded in <head>, not deferred: it takes #map out of the address before map-view.js looks for it.
   Styles: map-scroll.css. Needs map-chrome.js. */
(() => {
  const Q = new URLSearchParams(location.search), SK = 'paradigm.f4.mapmode', SEEN = 'paradigm.f4.mapSeen';
  const MODES = {
    // hand: how far shut it still is when the page's paper takes over (set so the unroll starts at the speed the flight ended with)
    s1: { wind: 'x', both: true, aspect: 1.731, hand: 0.71, openMs: 1000, bounce: 0.006, name: '橫卷・雙軸' },
    s2: { wind: 'z', both: false, aspect: 1.604, hand: 0.72, openMs: 1150, bounce: 0.012, name: '掛圖・下拉' },
    s3: { wind: 'x', both: false, aspect: 1.731, hand: 0.73, openMs: 1250, bounce: 0.006, name: '橫卷・單軸' },
  };
  // The scroll is how the home page opens its map (Thomas, 2026-11-14: s3, the hand scroll with one moving rod).
  // ?mapmode=s1 | s2 tries the other two; ?mapmode=off brings back the old big map (map-view.js); a | b | c are map-int.js's.
  const DEFAULT = 's3';
  let mode = Q.get('mapmode');
  try { if (mode && /^(s[123]?|off)$/.test(mode)) sessionStorage.setItem(SK, mode); else if (!mode) mode = sessionStorage.getItem(SK); } catch (e) { /* no storage: the address decides */ }
  if (mode === 's') mode = 's1';
  if (!mode) mode = DEFAULT;
  const M = MODES[mode]; if (!M) return;
  const html = document.documentElement, SIMPLE = html.dataset.view === 'simple';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SLOW = Math.max(0.2, parseFloat(Q.get('mapslow')) || 1);       // ?mapslow=3: everything three times slower, to look at it
  html.dataset.mapmode = 's'; html.dataset.mapscroll = mode;
  const EMBED = 'map/embed.html';
  const seen = () => { try { return !!sessionStorage.getItem(SEEN) && !Q.has('mapgrow'); } catch (e) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem(SEEN, '1'); } catch (e) { /* fine */ } };

  const deep = location.hash === '#map';                                // lesson pages link to index.html#map
  if (deep) history.replaceState(history.state, '', location.pathname + location.search);

  /* ---------- small helpers ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);          // ease in-out cubic
  const out = (t) => 1 - Math.pow(1 - t, 3);                                                // ease out cubic
  const sm = (t) => t * t * (3 - 2 * t);                                                    // smoothstep: never quite still in the middle
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);                                  // where t is inside [a, b]
  const tween = (ms, fn) => new Promise((ok) => {                       // fn(0…1) every frame for ms
    const d = ms * SLOW; const t0 = performance.now();
    (function step(now) { const t = clamp((now - t0) / d, 0, 1); fn(t); if (t < 1) requestAnimationFrame(step); else ok(); })(t0);
  });

  /* ---------- the scroll's own measures (in the desk sheet's units: the sheet is 3 × 2) ---------- */
  const WX = M.wind === 'x';
  const HX = 1.5, HZ = HX / M.aspect;                // half the sheet, across and down (the same proportions as the open paper)
  const UH = WX ? HX : HZ, VH = WX ? HZ : HX;        // half the paper along the winding direction / along the rods
  // the colour of the silk mounting: ?silk=tea | ink | rust | moss | plum (remembered for the session)
  const SILKS = {
    tea:  { warp: [0x9c, 0x80, 0x50], weft: [0xc4, 0xaa, 0x72], sheen: 0xe6d6a6, line: 0x3a2c14, name: '茶金' },
    ink:  { warp: [0x20, 0x43, 0x4a], weft: [0x34, 0x6a, 0x6c], sheen: 0x86b6b0, line: 0x0c1c20, name: '黛青' },
    rust: { warp: [0x8a, 0x3d, 0x2a], weft: [0xb2, 0x5a, 0x3c], sheen: 0xe8a888, line: 0x2c100a, name: '赭紅' },
    moss: { warp: [0x4d, 0x5e, 0x3c], weft: [0x6f, 0x82, 0x56], sheen: 0xb8c8a0, line: 0x18200e, name: '苔綠' },
    plum: { warp: [0x4a, 0x38, 0x62], weft: [0x66, 0x48, 0x7c], sheen: 0x8f7ab8, line: 0x1c1228, name: '葡萄紫' },
  };
  let silkId = Q.get('silk');
  try { if (silkId && SILKS[silkId]) sessionStorage.setItem('paradigm.f4.silk', silkId); else silkId = sessionStorage.getItem('paradigm.f4.silk'); } catch (e) { /* the address decides */ }
  const SILK = SILKS[silkId] || SILKS.tea;
  const FACE = 'map/face-' + (WX ? 'x' : 'z');       // the open paper itself, photographed (src/map-face.cjs): .webp and .json
  const LAMP = 0xF4E3CB;                             // the desk lamp on the paper (the same warm wash lies over the open paper, map-scroll.css)
  const A = 0.06;                                    // half the strip left flat when it is wound shut
  const ROD_R = 0.028, RC = 0.04;                    // the wooden rod, and the first turn of paper on it
  const TH = 0.00276;                                // paper thickness: a roll holding 1.45 of paper is about 0.054 across its radius
  const KNOB = 0.095;                                // how far a rod sticks out past the paper at each end
  const KS = 1.45;                                   // the turned ends, scaled from the first lathe profile
  const rollR = (L) => Math.sqrt(RC * RC + TH * Math.max(0, L) / Math.PI);                 // radius of a roll holding L of paper
  const turns = (L) => (2 * Math.PI / TH) * (rollR(L) - RC);                               // how far the rod has turned to wind it (radians)
  // the flat part of the paper, [lo, hi] along the winding direction, when it is wound w of the way shut
  const interval = (w) => (M.both ? [-lerp(UH, A, w), lerp(UH, A, w)] : [-UH, lerp(UH, -UH + 2 * A, w)]);
  const DIST = 3.0;                                  // how far in front of the camera the scroll is held

  /* ---------- materials and parts shared by the desk mesh and the overlay ---------- */
  let kit = null;
  function makeKit(THREE) {
    if (kit) return kit;
    const rnd = (() => { let s = 20261113; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
    const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
    // paper relief: a mid-grey ground, formation clouds, then two families of long fibres whose direction wanders
    // (straight parallel strokes read as scratches), and a few faint laid lines
    const [cf, gf] = canvas(512, 512);
    gf.fillStyle = '#808080'; gf.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++) { const x = rnd() * 512, y = rnd() * 512, r = 18 + rnd() * 60, g = gf.createRadialGradient(x, y, 0, x, y, r), v = rnd() < 0.5 ? 255 : 0; g.addColorStop(0, `rgba(${v},${v},${v},0.05)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`); gf.fillStyle = g; gf.fillRect(x - r, y - r, 2 * r, 2 * r); }
    const fibre = (n, len, width, alpha, bias) => { for (let i = 0; i < n; i++) { let x = rnd() * 512, y = rnd() * 512, a = bias + (rnd() - 0.5) * 1.5; gf.beginPath(); gf.moveTo(x, y); for (let k = 0; k < 7; k++) { a += (rnd() - 0.5) * 0.5; x += Math.cos(a) * len / 7; y += Math.sin(a) * len / 7; gf.lineTo(x, y); } const v = rnd() < 0.72 ? 255 : 30; gf.strokeStyle = `rgba(${v},${v},${v},${alpha * (0.5 + rnd() * 0.5)})`; gf.lineWidth = width * (0.6 + rnd() * 0.8); gf.stroke(); } };
    fibre(900, 120, 1.1, 0.16, 0.12); fibre(700, 90, 0.9, 0.13, 1.5); fibre(2600, 26, 0.6, 0.1, 0.7);
    gf.globalAlpha = 0.05; gf.fillStyle = '#000'; for (let y = 0; y < 512; y += 6) gf.fillRect(0, y, 512, 1); gf.globalAlpha = 1;
    const tFibre = new THREE.CanvasTexture(cf); tFibre.wrapS = tFibre.wrapT = THREE.RepeatWrapping; tFibre.colorSpace = THREE.NoColorSpace; tFibre.anisotropy = 8;
    /* ---- silk (3d-cloth-material). The mounting is ONE material: the back of the sheet, the band at each end of its face,
       the first turn round each rod and the wound rolls all use it, in the desk scene and in the overlay alike, so the
       silk has one colour and one lustre from the desk to your hands. The weave is baked as real interlacement, not noise:
       a 5-harness satin (warp over four, under one), every thread with its own width and tone, 40 threads to the tile, two
       dyes (so it is slightly shot), height → normal map. Silk: low roughness, anisotropy, a small sheen in the dye's colour. */
    const CLOTH = 5;                                   // weave tiles per sheet unit: uv on every silk part is (sheet units × CLOTH)
    const NT = 40, TP = 8, SZ = NT * TP;
    const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const md = (i) => ((i % NT) + NT) % NT, warpUp = (A, B) => ((2 * md(A) + md(B)) % 5) !== 0;
    const hgt = new Float32Array(SZ * SZ), [cs, gs] = canvas(SZ, SZ), img = gs.createImageData(SZ, SZ);
    const WARP = SILK.warp, WEFT = SILK.weft, SHOT = 0.7;
    for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
      const A = Math.floor(x / TP), B = Math.floor(y / TP), fx = (x + 0.5) / TP - A - 0.5, fy = (y + 0.5) / TP - B - 0.5;
      const wA = 0.8 + 0.17 * hsh(A, 1), wB = 0.8 + 0.17 * hsh(B, 2);
      // each thread is up or down in this cell, and eases towards what it is in the next cell along its own length
      const upW = warpUp(A, B) ? 0.5 : -0.5, upWn = warpUp(A, B + Math.sign(fy)) ? 0.5 : -0.5, lvW = upW + (upWn - upW) * 0.5 * ss(0.05, 0.5, Math.abs(fy));
      const upF = -upW, upFn = warpUp(A + Math.sign(fx), B) ? -0.5 : 0.5, lvF = upF + (upFn - upF) * 0.5 * ss(0.05, 0.5, Math.abs(fx));
      const pw = 1 - (fx / (wA / 2)) ** 2, pf = 1 - (fy / (wB / 2)) ** 2;
      const hW = pw > 0 ? Math.sqrt(pw) * 0.5 + lvW : -9, hF = pf > 0 ? Math.sqrt(pf) * 0.5 + lvF : -9, h = Math.max(hW, hF, -0.6), top = hF > hW;
      const hn = clamp((h + 0.6) / 1.6, 0, 1); hgt[y * SZ + x] = hn;
      const tone = (0.86 + 0.28 * (top ? hsh(B, 4) : hsh(A, 3))) * (0.5 + 0.5 * ss(0.05, 0.85, hn)), m = top ? SHOT : 0, k = (y * SZ + x) * 4;
      for (let c = 0; c < 3; c++) img.data[k + c] = clamp((WARP[c] + (WEFT[c] - WARP[c]) * m) * tone, 0, 255);
      img.data[k + 3] = 255;
    }
    gs.putImageData(img, 0, 0);
    const [cn, gn] = canvas(SZ, SZ), nim = gn.createImageData(SZ, SZ), HS = 6;
    for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
      const hAt = (dx, dy) => hgt[((y + dy + SZ) % SZ) * SZ + ((x + dx + SZ) % SZ)];
      const nx = -(hAt(1, 0) - hAt(-1, 0)) * HS, ny = (hAt(0, 1) - hAt(0, -1)) * HS, l = Math.hypot(nx, ny, 1), k = (y * SZ + x) * 4;
      nim.data[k] = (nx / l * 0.5 + 0.5) * 255; nim.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; nim.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; nim.data[k + 3] = 255;
    }
    gn.putImageData(nim, 0, 0);
    const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 16; return t; };
    const silk = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: tex(cs, true), normalMap: tex(cn, false), normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.36, metalness: 0,
      anisotropy: 0.85, sheen: 0.5, sheenRoughness: 0.28, sheenColor: new THREE.Color(SILK.sheen).multiplyScalar(0.62) });

    /* ---- wood (3d-wood-material). ONE timber material for every rod, on the desk and in your hands: the stock physical
       material, patched. A small periodic noise field is read at several stretches in the rod's own space (so the grain runs
       along the rod and straight through the turned ends): growth rings drifting off the pith with their own late-wood
       widths, pores, fibres, darker matt end grain. The same fields give colour, roughness and relief, and each fine layer
       fades by its own footprint on screen, so the thin rod on the desk does not shimmer. Finish: wax (a light clearcoat). */
    const FS = 512, [cfl, gfl] = canvas(FS, FS), fim = gfl.createImageData(FS, FS);
    const lat = (seed) => { const a = new Float32Array(64 * 64); for (let i = 0; i < a.length; i++) a[i] = hsh(i, seed); return a; }, L1 = lat(11), L2 = lat(23);
    const vn = (L, x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), g = (i, j) => L[(((yi + j) % 64 + 64) % 64) * 64 + ((xi + i) % 64 + 64) % 64]; return (g(0, 0) * (1 - sx) + g(1, 0) * sx) * (1 - sy) + (g(0, 1) * (1 - sx) + g(1, 1) * sx) * sy; };
    for (let y = 0; y < FS; y++) for (let x = 0; x < FS; x++) {
      const px = x / 8, py = y / 8, k = (y * FS + x) * 4, a = vn(L1, px, py);
      fim.data[k] = a * 255; fim.data[k + 1] = (0.6 * a + 0.27 * vn(L2, px * 2, py * 2) + 0.13 * vn(L1, px * 4 + 7, py * 4 + 3)) * 255; fim.data[k + 2] = vn(L2, px + 17, py + 5) * 255; fim.data[k + 3] = 255;
    }
    gfl.putImageData(fim, 0, 0);
    const tField = tex(cfl, false);
    const wood = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, ior: 1.43, specularIntensity: 0.72, clearcoat: 0.22, clearcoatRoughness: 0.38 });
    wood.onBeforeCompile = (sh) => {
      sh.uniforms.uField = { value: tField };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uField; varying vec3 vOP; varying vec3 vON;
struct Wood { vec3 col; float rough; float h; };
vec3 wf(vec2 p) { return texture2D(uField, p / 64.0).rgb; }
Wood woodAt(vec3 P, vec3 N) {
  vec3 q = P * 30.0;                                   // the rod in timber units: its radius is a little under 1
  float along = q.y; vec2 cr = q.xz;
  vec3 slow = wf(vec2(along * 0.35, 3.7));
  vec2 pith = vec2((slow.r - 0.5) * 0.5, 0.48 + (slow.b - 0.5) * 0.3);          // the pith wanders, off the rod's own axis
  float radius = length((cr + pith) * vec2(1.0, 0.56));
  float arc = atan(cr.y, cr.x) * 0.7427;               // across the grain, round the rod (scaled so the field meets itself at the back)
  vec3 broad = wf(vec2(cr.x * 0.9 + 5.0, along * 0.9));
  float growth = radius * 13.0 + (broad.g - 0.5) * 2.5;
  float ring = floor(growth), ph = fract(growth);
  float annual = fract(sin(ring * 12.9898 + 4.1) * 43758.5453);
  float lw = 0.065 + annual * 0.21, gw = fwidth(growth);
  float late = smoothstep(0.94 - lw, 0.97 - lw, ph) * (1.0 - smoothstep(0.965, 1.0, ph));
  late = mix(late, lw * 0.5, smoothstep(0.16, 0.72, gw));
  vec2 pc = vec2(arc * 96.0, along * 7.5), fc = vec2(arc * 219.43, along * 2.4);
  float pores = smoothstep(0.59, 0.75, wf(pc).r) * (1.0 - smoothstep(0.5, 1.6, length(fwidth(pc))));
  float fibres = wf(fc).g * (1.0 - smoothstep(0.6, 2.0, length(fwidth(fc))));
  float eg = pow(abs(normalize(N).y), 6.0);            // end grain, on the turned tips
  float tone = 0.075 + late * 0.40 + (1.0 - late) * 0.07 + pores * 0.25 - fibres * 0.16 + (broad.g - 0.5) * 0.23;
  Wood w;
  w.col = mix(vec3(0.160, 0.072, 0.021), vec3(0.021, 0.0066, 0.001), clamp(tone, 0.035, 0.83)) * (0.93 + annual * 0.095) * (1.0 - eg * (0.045 + pores * 0.10));
  w.rough = 0.91 + late * 0.13 + pores * 0.19 + (broad.b - 0.5) * 0.20 + eg * 0.14;
  w.h = late * 0.30 - pores * 0.42 + fibres * 0.09;
  return w;
}
vec3 woodBump(vec3 n, vec3 vp, float h) {
  vec3 dpx = dFdx(vp), dpy = dFdy(vp);
  float sc = length(dpx) / max(1e-7, length(dFdx(vOP)));            // scene units per rod unit: the relief keeps its size at any scale
  float hh = h * 0.0009 * sc, dhx = dFdx(hh), dhy = dFdy(hh);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float det = dot(dpx, r1);
  vec3 g = sign(det) * (dhx * r1 + dhy * r2);
  float lim = 0.38 * abs(det), gl = length(g); if (gl > lim) g *= lim / gl;      // a steep ring edge must not turn the normal inside out
  return normalize(abs(det) * n - g);
}`)
        .replace('#include <map_fragment>', '#include <map_fragment>\nWood W = woodAt(vOP, vON); diffuseColor.rgb *= W.col;')
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = clamp(roughness * W.rough, 0.35, 1.0);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = woodBump(normal, -vViewPosition, W.h);');
    };
    wood.customProgramCacheKey = () => 'paradigm-scroll-rod-wood-1';
    const brass = new THREE.MeshStandardMaterial({ color: 0xb8904a, metalness: 1, roughness: 0.28 });

    // one rod: the dowel, and at each end a brass collar and a turned finial (a lathe profile, no sharp arris)
    const prof = new THREE.SplineCurve([[ROD_R / KS, 0], [0.027, 0.004], [0.034, 0.014], [0.0365, 0.026], [0.033, 0.037], [0.0255, 0.044], [0.0275, 0.05], [0.0235, 0.057], [0.012, 0.0615], [0.0001, 0.0625]].map(([r, y]) => new THREE.Vector2(r * KS, y * KS))).getPoints(40);
    const gKnob = new THREE.LatheGeometry(prof, 48); gKnob.computeVertexNormals();
    const gDowel = new THREE.CylinderGeometry(ROD_R, ROD_R, 2 * VH + 0.04, 32, 1, false);
    const CR = ROD_R + 0.0075, CH = 0.018;                             // the brass collar between the paper's edge and the turned end
    const gCollar = new THREE.CylinderGeometry(CR, CR, CH, 40, 1, false), gRing = new THREE.TorusGeometry(CR, 0.003, 10, 40), gBoss = new THREE.SphereGeometry(0.0075, 20, 12);
    function rod() {
      const g = new THREE.Group(); const d = new THREE.Mesh(gDowel, wood); g.add(d);
      for (const s of [1, -1]) {
        const c = new THREE.Mesh(gCollar, brass); c.position.y = s * (VH + 0.004 + CH / 2); g.add(c);
        for (const o of [0.004, 0.004 + CH]) { const r = new THREE.Mesh(gRing, brass); r.rotation.x = Math.PI / 2; r.position.y = s * (VH + o); g.add(r); }
        const k = new THREE.Mesh(gKnob, wood); k.position.y = s * (VH + 0.004 + CH); if (s < 0) k.rotation.x = Math.PI; g.add(k);
        const bs = new THREE.Mesh(gBoss, brass); bs.position.y = s * (VH + 0.004 + CH + 0.0625 * KS - 0.002); g.add(bs);
      }
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return g;
    }
    // the first turn of the mounting round a rod: there even when nothing else is wound on it
    const gSleeve = new THREE.CylinderGeometry(RC * 0.985, RC * 0.985, 2 * VH, 40, 1, true);
    // cloth uv for a cylinder of radius R (sheet units) and the rods' length: round it, and along it
    const clothCyl = (g, R) => { const u = g.attributes.uv; if (!g.userData.uv0) g.userData.uv0 = u.array.slice(); const b = g.userData.uv0; for (let i = 0; i < u.count; i++) u.setXY(i, b[i * 2] * 2 * Math.PI * R * CLOTH, b[i * 2 + 1] * 2 * VH * CLOTH); u.needsUpdate = true; };
    clothCyl(gSleeve, RC);
    kit = { tFibre, silk, wood, brass, rod, gSleeve, clothCyl, CLOTH, KNOB_R: 0.0365 * KS };
    return kit;
  }

  /* ---------- the scroll in the 3D desk scene ---------- */
  let three = null, building = null;
  function build3d() {
    if (three) return Promise.resolve(three);
    if (building) return building;
    building = (async () => {
      const f2 = window.__f2; if (!f2 || !f2.props || !f2.props.map) return null;
      const THREE = await import('three'); const K = makeKit(THREE);
      const root = f2.props.map.root; let sheet = null;
      root.traverse((o) => { if (o.isMesh && o.name === 'mapsheet') sheet = o; });
      if (!sheet) return null;
      const pin = root.children.find((o) => o.name === 'mappin') || null;
      const compass = root.children.find((o) => o.isGroup && !o.name && o.children.length >= 4) || null;
      const blob = root.children.find((o) => o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.map) || null;

      // the face of the sheet is the open paper itself: the same picture the page shows when it is unrolled
      const tFace = await new THREE.TextureLoader().loadAsync(FACE + '.webp'); tFace.colorSpace = THREE.SRGBColorSpace; tFace.anisotropy = f2.renderer.capabilities.getMaxAnisotropy();
      const meta = await fetch(FACE + '.json').then((r) => r.json()).catch(() => ({ pts: [] }));
      const uvAt = (x, z) => [(x + HX) / (2 * HX), 1 - (z + HZ) / (2 * HZ)];
      const NU = 260, n = (NU + 1) * 2;
      const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), uv2 = new Float32Array(n * 2), idx = [];
      for (let i = 0; i <= NU; i++) {
        const u = -UH + (2 * UH * i) / NU;
        for (let j = 0; j < 2; j++) {
          const v = j ? VH : -VH, k = i * 2 + j, x = WX ? u : v, z = WX ? v : u; const [s, t] = uvAt(x, z);
          uv[k * 2] = s; uv[k * 2 + 1] = t; uv2[k * 2] = x * K.CLOTH; uv2[k * 2 + 1] = z * K.CLOTH;
        }
        if (i < NU) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; if (WX) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }   // facing +Y when flat
      }
      // the face is paper between two silk bands (the mounting comes round the ends); the back is silk all over
      const BAND = 0.085, nb = Math.round(BAND / (2 * UH / NU)), I6 = (q0, q1) => idx.slice(q0 * 6, q1 * 6);
      const flip = (a) => { const o = a.slice(); for (let i = 0; i < o.length; i += 3) { const t = o[i + 1]; o[i + 1] = o[i + 2]; o[i + 2] = t; } return o; };
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(I6(nb, NU - nb));
      const aUv2 = new THREE.BufferAttribute(uv2, 2), nBack = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
      const geoBand = new THREE.BufferGeometry(); geoBand.setAttribute('position', geo.attributes.position); geoBand.setAttribute('uv', aUv2); geoBand.setIndex(I6(0, nb).concat(I6(NU - nb, NU)));
      const geoB = new THREE.BufferGeometry(); geoB.setAttribute('position', geo.attributes.position); geoB.setAttribute('uv', aUv2); geoB.setAttribute('normal', nBack); geoB.setIndex(flip(idx));
      const geoN = new THREE.BufferGeometry(); geoN.setAttribute('position', geo.attributes.position); geoN.setIndex(idx);   // the whole strip, for its normals
      const Y0 = 0.03;                                                   // the paper's height over the desk when it lies flat
      const front = sheet.material.clone(); front.map = tFace; front.side = THREE.FrontSide; front.emissive = new THREE.Color(0, 0, 0); front.emissiveMap = tFace; front.polygonOffset = false;
      const G = new THREE.Group();
      const mF = new THREE.Mesh(geo, front), mB = new THREE.Mesh(geoB, K.silk), mBand = new THREE.Mesh(geoBand, K.silk);
      mF.frustumCulled = mB.frustumCulled = mBand.frustumCulled = false;
      const mkRod = () => { const o = new THREE.Group(), r = K.rod(); r.add(new THREE.Mesh(K.gSleeve, K.silk)); o.add(r); if (WX) o.rotation.x = Math.PI / 2; else o.rotation.z = Math.PI / 2; o.userData.rod = r; return o; };
      const rodLo = mkRod(), rodHi = mkRod();
      G.add(mF, mB, mBand, rodLo, rodHi);
      G.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      // This scroll IS the map on the desk: it lies there open, in the place of study.js's own sheet (which stays, unseen,
      // to carry the flags), and it is this same object that winds up and comes to you.
      sheet.material.visible = false;
      const rest = () => { root.add(G); G.position.copy(sheet.position); G.quaternion.copy(sheet.quaternion); G.scale.copy(sheet.scale); G.visible = true; G.traverse((o) => { if (o.isMesh) o.renderOrder = 0; }); };
      // the flags stand by topics 1 to 5 of the real map, the pin by the one you are on
      const at = (i) => { const p = meta.pts && meta.pts[i]; return p ? [(p[0] - 0.5) * 2 * HX, (p[1] - 0.5) * 2 * HZ] : null; };
      (f2.mapFlags || []).forEach((f, i) => { const p = at(i); if (p) f.g.position.set(p[0] - 0.05, Y0 + 0.004, p[1] - 0.02); });
      const vp = new THREE.Vector3();
      function placePin() {
        if (!pin || !window.F4) return; const nx = F4.nextStep(), p = at(nx.kind === 'lesson' ? clamp(nx.lesson.stage, 0, 4) : 0); if (!p) return;
        vp.set(p[0] - 0.05, 0, p[1] + 0.03); sheet.localToWorld(vp); pin.parent.worldToLocal(vp); pin.position.x = vp.x; pin.position.z = vp.z;
      }

      function setState(lo, hi) {                                        // the flat part is [lo, hi]; the rest is wound on the two rods
        const Llo = lo + UH, Lhi = UH - hi, Rlo = rollR(Llo), Rhi = rollR(Lhi), k2 = 2 * Math.PI / TH;
        for (let i = 0; i <= NU; i++) {
          const u = -UH + (2 * UH * i) / NU; let U = u, Y = 0;
          if (u < lo) { const R = rollR(Llo - (lo - u)), th = k2 * (Rlo - R); U = lo - R * Math.sin(th); Y = Rlo - R * Math.cos(th); }
          else if (u > hi) { const R = rollR(Lhi - (u - hi)), th = k2 * (Rhi - R); U = hi + R * Math.sin(th); Y = Rhi - R * Math.cos(th); }
          for (let j = 0; j < 2; j++) { const k = (i * 2 + j) * 3, v = j ? VH : -VH; pos[k] = WX ? U : v; pos[k + 1] = Y0 + Y; pos[k + 2] = WX ? v : U; }
        }
        geo.attributes.position.needsUpdate = true; geoN.computeVertexNormals(); const nn = geoN.attributes.normal; geo.attributes.normal = geoBand.attributes.normal = nn;
        for (let i = 0; i < nn.array.length; i++) nBack.array[i] = -nn.array[i]; nBack.needsUpdate = true;
        for (const [o, e, R, L, s] of [[rodLo, lo, Rlo, Llo, 1], [rodHi, hi, Rhi, Lhi, -1]]) {
          if (WX) o.position.set(e, Y0 + R, 0); else o.position.set(0, Y0 + R, e);
          o.userData.rod.rotation.y = s * turns(L);
        }
      }

      const V = () => new THREE.Vector3(), dP = V(), dS = V(), cP = V(), xa = V(), ya = V(), za = V(), tmp = V(), fwd = V(), cS = V();
      const dQ = new THREE.Quaternion(), cQ = new THREE.Quaternion(), Mx = new THREE.Matrix4();
      // lying on the desk, away from the lamp, the blue of the window would turn the paper lavender: a little warmth of its own
      // keeps it the same cream it is when you hold it
      const REST = new THREE.Color(0x3a2a16), tmpC = new THREE.Color();
      // k: 0 on the desk … 1 held in front of the camera, centred on the screen point (sx, sy), covering wPx × hPx there
      function place(k, w, lift, sx, sy, wPx, hPx) {
        const cam = f2.camera, rect = f2.canvas.getBoundingClientRect();
        root.updateWorldMatrix(true, true); sheet.matrixWorld.decompose(dP, dQ, dS); dP.y += lift;
        cam.updateMatrixWorld(); cam.matrixWorld.extractBasis(xa, ya, za); fwd.copy(za).negate();
        tmp.set(((sx - rect.left) / rect.width) * 2 - 1, -(((sy - rect.top) / rect.height) * 2 - 1), 0.5).unproject(cam).sub(cam.position).normalize();
        cP.copy(cam.position).addScaledVector(tmp, DIST / Math.max(0.2, tmp.dot(fwd)));
        Mx.makeBasis(xa, za, tmp.copy(ya).negate()); cQ.setFromRotationMatrix(Mx);                   // paper faces you; its far edge is up
        const ppu = (rect.height / 2) / (DIST * Math.tan((cam.fov * Math.PI / 180) / 2));           // pixels per unit at that distance
        cS.set(wPx / (2 * HX) / ppu, (WX ? hPx / (2 * HZ) : wPx / (2 * HX)) / ppu, hPx / (2 * HZ) / ppu);
        const e = sm(k);
        G.position.lerpVectors(dP, cP, e).addScaledVector(ya, Math.sin(Math.PI * e) * (WX ? 0.08 : 0));   // a slight arc on the way (none for the wall map: it would leave the screen)
        G.quaternion.slerpQuaternions(dQ, cQ, e);
        G.scale.set(dS.x * Math.pow(cS.x / dS.x, e), dS.y * Math.pow(cS.y / dS.y, e), dS.z * Math.pow(cS.z / dS.z, e));
        const [lo, hi] = interval(w); setState(lo, hi);
        // away from the lamp the face stops taking the desk's light and shows its own colour, so that in front of you it is
        // exactly the page's paper; the silk keeps a little light of its own
        const g = e * e;
        front.color.setRGB(0.92 * (1 - g), 0.88 * (1 - g), 0.8 * (1 - g)); front.emissive.set(LAMP).multiplyScalar(g).add(tmpC.copy(REST).multiplyScalar(1 - g));   // …and that colour is the paper under the lamp
      }
      const cmp0 = compass ? compass.position.clone() : null;
      function hopCompass(t, away) {                                     // t 0…1; away: it lands a little to the side, off the paper
        if (!compass) return;
        const side = away ? out(t) : 1 - out(t);
        compass.position.set(cmp0.x - 0.5 * side, cmp0.y + Math.sin(Math.PI * t) * 0.24 - 0.045 * side, cmp0.z - (WX ? 0.1 : 0.62) * side);
        compass.rotation.y = side * 0.5;
      }
      // taken: it leaves the desk (and the flags, the soft shadow and study.js's hover lift with it); home: it lies there again
      function take(on) {
        sheet.visible = !on; if (blob) blob.visible = !on;
        if (on) { f2.scene.add(G); G.visible = true; G.traverse((o) => { if (o.isMesh) o.renderOrder = 999; }); }
        else { rest(); const [lo, hi] = interval(0); setState(lo, hi); front.color.setRGB(0.92, 0.88, 0.8); front.emissive.copy(REST); placePin(); }
      }
      const pinTo = (k) => { if (pin) { pin.visible = k > 0.02; pin.scale.setScalar(Math.max(0.001, k)); } };   // the pin shrinks away with the hop, and grows back
      take(false);
      F4.on('state', () => setTimeout(placePin, 0));
      three = { THREE, f2, G, place, take, hopCompass, pinTo, placePin };
      return three;
    })().catch((e) => { console.info('[map-scroll] desk scroll not built:', e && e.message); building = null; return null; });
    return building;
  }

  /* ---------- the scroll held in front of you: rods and rolls in a transparent canvas over the page ---------- */
  let over = null, overBuilding = null;
  function buildOverlay(host) {
    if (over) return Promise.resolve(over);
    if (overBuilding) return overBuilding;
    overBuilding = (async () => {
      const THREE = await import('three'); const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
      const K = makeKit(THREE);
      const canvas = document.createElement('canvas'); canvas.className = 'ms-gl'; host.appendChild(canvas);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
      renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.94;
      const scene = new THREE.Scene();
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.42; pm.dispose();
      // the desk lamp is up and to the left; the window's evening light comes from the right, cooler and weaker
      const key = new THREE.DirectionalLight(0xffdcae, 1.7); key.position.set(-0.55, 0.7, 0.75); scene.add(key);
      const fill = new THREE.DirectionalLight(0xb9c2ff, 0.55); fill.position.set(0.85, -0.25, 0.5); scene.add(fill);
      scene.add(new THREE.HemisphereLight(0xfff0d8, 0x3a2c48, 0.55));
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -4000, 4000); cam.position.z = 1000;
      const rig = new THREE.Group(); scene.add(rig);
      const gCyl = new THREE.CylinderGeometry(1, 1, 1, 56, 1, true);
      // soft shadow a roll lays on the flat paper beside it
      const sc = document.createElement('canvas'); sc.width = 64; sc.height = 4; const sg = sc.getContext('2d'); const gr = sg.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(46,30,12,0.46)'); gr.addColorStop(0.35, 'rgba(46,30,12,0.16)'); gr.addColorStop(1, 'rgba(46,30,12,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 64, 4);
      const tShade = new THREE.CanvasTexture(sc); tShade.colorSpace = THREE.SRGBColorSpace;
      const mkRoll = (dir) => {                                           // dir: +1 the flat paper lies to its + side, -1 to its - side
        const g = new THREE.Group(), spin = new THREE.Group();
        // wound silk: three sleeves, each a little shorter and wider than the one inside it, so the turns show at the ends;
        // the band of the mounting on the face of the paper beside the roll; and the sheet's own edge as a fine line along
        // the roll, which goes round with it (the weave's seam lies under that line)
        const gRoll = gCyl.clone(), layers = [0, 1, 2].map(() => { const m = new THREE.Mesh(gRoll, K.silk); spin.add(m); return m; });
        const gBand = new THREE.PlaneGeometry(1, 1), band = new THREE.Mesh(gBand, K.silk); gBand.userData.uv0 = gBand.attributes.uv.array.slice(); g.add(band);
        const lap = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: SILK.line, transparent: true, opacity: 0.55, toneMapped: false })); spin.add(lap);
        const rod = K.rod(); spin.add(rod);
        const shade = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tShade, transparent: true, depthWrite: false, toneMapped: false }));
        g.add(spin, shade); if (!WX) g.rotation.z = -Math.PI / 2;        // rods across the screen: the roll's own +x points down the page
        rig.add(g); return { g, spin, layers, lap, gRoll, gBand, band, rod, shade, dir };
      };
      const lo = mkRoll(1), hi = mkRoll(-1);
      let vw = 0, vh = 0;
      function resize() {
        vw = innerWidth; vh = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(vw, vh, false);
        cam.left = -vw / 2; cam.right = vw / 2; cam.top = vh / 2; cam.bottom = -vh / 2; cam.updateProjectionMatrix();
      }
      // draw the scroll with its flat part [a, b] (sheet units), on paper W × H px; T = { x, y, s, rot } moves the whole thing (px, radians)
      function draw(a, b, W, H, T) {
        const S = WX ? H / (2 * HZ) : W / (2 * HX), along = WX ? W / (2 * HX) : H / (2 * HZ);   // px per unit: for the rods' own size, and along the winding direction
        for (const [r, e, L] of [[lo, a, a + UH], [hi, b, UH - b]]) {
          const R = rollR(L) * S, len = 2 * VH * S, step = Math.max(1.2, Math.min(3, (R - RC * S) / 2 + 1.2));
          r.g.position.set(WX ? e * along : 0, WX ? 0 : -e * along, 0);
          r.layers.forEach((m, i) => { const Ri = Math.max(RC * S * 0.96, R - (2 - i) * step); m.scale.set(Ri, len - i * 7, Ri); });
          r.lap.scale.set(1.1, len - 14, 1.6); r.lap.position.set(0, 0, R + 0.2);
          r.rod.scale.setScalar(S);
          r.spin.position.z = R; r.spin.rotation.y = -r.dir * turns(L);
          K.clothCyl(r.gRoll, R / S);
          // the silk band on the paper's face: what of it is not yet wound in
          const bw = clamp(r === lo ? (-UH + 0.085) - a : b - (UH - 0.085), 0, 0.085), bu = r.gBand.attributes.uv, b0 = r.gBand.userData.uv0;
          r.band.visible = bw > 0.002; r.band.scale.set(Math.max(0.01, bw * along), len, 1); r.band.position.set(r.dir * bw * along / 2, 0, 0.4);
          for (let i = 0; i < bu.count; i++) bu.setXY(i, b0[i * 2] * bw * K.CLOTH, b0[i * 2 + 1] * 2 * VH * K.CLOTH); bu.needsUpdate = true;
          // the lamp is up and to the left: only the roll on that side of the paper lays a real shadow on it
          const lit = r === lo, sw = lit ? 26 + R * 0.9 : 9; r.shade.scale.set(sw * r.dir, len, 1); r.shade.position.set(r.dir * (R * 0.72 + sw / 2), 0, 1);
          r.shade.material.opacity = clamp((b - a) / 0.5, 0, 1) * (lit ? 1 : 0.55);
        }
        const t = T || { x: 0, y: 0, s: 1, rot: 0 };
        rig.position.set(t.x, -t.y, 0); rig.scale.setScalar(t.s); rig.rotation.z = -t.rot;
        renderer.render(scene, cam);
      }
      resize();
      over = { canvas, draw, resize };
      return over;
    })().catch((e) => { console.info('[map-scroll] overlay not built:', e && e.message); overBuilding = null; return null; });
    return overBuilding;
  }

  /* ---------- the page side: the flat paper with the map's frame, and the sequence ---------- */
  const start = () => {
    const F4 = window.F4; if (!F4 || !window.MapChrome) return;
    const is3d = () => html.classList.contains('is-3d') && !SIMPLE && !!window.__f2;

    const root = document.createElement('div');
    root.className = 'ms'; root.dataset.scroll = mode; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'AI 學習地圖');
    root.innerHTML = '<div class="ms-shade"></div><div class="ms-scroll"><div class="ms-cast"></div><div class="ms-paper"><div class="ms-tint"></div></div></div>';
    document.body.appendChild(root);
    const scroll = root.querySelector('.ms-scroll'), paper = root.querySelector('.ms-paper'), cast = root.querySelector('.ms-cast');
    let frame = null, chrome = null, ready = false, isOpen = false, busy = false, pending = 0, back = null, pushed = false, played = false, from = null;
    let W = 0, H = 0, ov = null;                                        // the paper's size when fully open; the overlay

    function size() {
      // room all round for the rods' ends: they stick out past the paper along their own length
      const mAlong = Math.round(KNOB * (WX ? innerHeight / (2 * HZ) : innerWidth / (2 * HX))) + 10;
      const mx = WX ? clamp(innerWidth * 0.03, 22, 44) : mAlong, my = WX ? mAlong : clamp(innerHeight * 0.04, 22, 40);
      W = Math.max(320, innerWidth - 2 * mx); H = Math.max(300, innerHeight - 2 * my);
      scroll.style.width = W + 'px'; scroll.style.height = H + 'px';
      fitFrame();
      if (ov) ov.resize();
    }
    // show the scroll wound w of the way shut (0 = fully open)
    function show(w, T) {
      const [a, b] = interval(w), along = WX ? W / (2 * HX) : H / (2 * HZ), c0 = (WX ? W : H) / 2 + a * along, c1 = (WX ? W : H) / 2 - b * along;
      paper.style.clipPath = WX ? `inset(0 ${c1.toFixed(1)}px 0 ${c0.toFixed(1)}px)` : `inset(${c0.toFixed(1)}px 0 ${c1.toFixed(1)}px 0)`;
      const f = ((b - a) * along) / (WX ? W : H), mid = ((a + b) / 2) * along;
      cast.style.transform = WX ? `translateX(${mid.toFixed(1)}px) scaleX(${f.toFixed(4)})` : `translateY(${mid.toFixed(1)}px) scaleY(${f.toFixed(4)})`;
      scroll.style.transform = T ? `translate(${T.x.toFixed(1)}px, ${T.y.toFixed(1)}px) rotate(${T.rot.toFixed(4)}rad) scale(${T.s.toFixed(4)})` : '';
      if (ov) ov.draw(a, b, W, H, T);
    }
    // The map sits on the paper clear of the silk at both ends, with a little more room on its right, where its own
    // column of text runs to the edge. It needs about 1300 × 724 to show whole: on a smaller paper the frame keeps that
    // size inside and is scaled down to fit, so nothing is cut off.
    function fitFrame() {
      if (!frame) return;
      const l = WX ? 34 : 18, r = WX ? 54 : 18, t = WX ? 0 : 36, b = WX ? 0 : 36, aw = W - l - r, ah = H - t - b, k = Math.min(1, aw / 1300, ah / 724);
      Object.assign(frame.style, { left: l + 'px', top: t + 'px', right: 'auto', bottom: 'auto', width: (aw / k).toFixed(1) + 'px', height: (ah / k).toFixed(1) + 'px', transformOrigin: '0 0', transform: k < 1 ? `scale(${k.toFixed(4)})` : '' });
    }
    function ensureFrame() {
      if (frame) return;
      frame = document.createElement('iframe'); frame.title = 'AI 學習地圖'; frame.src = EMBED + '?still';   // the map is already on this paper: it does not draw itself in
      paper.insertBefore(frame, paper.firstChild);
      chrome = MapChrome.mount(paper, frame, { closeLabel: SIMPLE ? '× 收起地圖' : '× 放回書桌', onClose: () => shut() });
      fitFrame();
    }
    addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || !frame || e.source !== frame.contentWindow) return;
      if (e.data.t === 'map:ready') { ready = true; chrome.sync(); if (isOpen && !busy) reveal(); }
      else if (e.data.t === 'map:close') shut();
    });
    // everything is fetched and built ahead of the first click, once the page is idle (not on phones or data saver)
    const lite = (navigator.connection && navigator.connection.saveData) || matchMedia('(max-width: 767px)').matches;
    const prebuild = async () => { size(); ensureFrame(); ov = await buildOverlay(root); if (ov) { size(); show(1); } };
    if (!lite) setTimeout(() => (window.requestIdleCallback || setTimeout)(prebuild), 2200);
    // the rods lie on the desk from the start
    if (!SIMPLE) { const t0 = performance.now(); (function poll() { if (window.__f2 && window.__f2.props && window.__f2.props.map) build3d(); else if (performance.now() - t0 < 30000) setTimeout(poll, 300); })(); }

    // the paper carries the finished map from the start (the map's own "重播" still replays its drawing-in for whoever wants it)
    let revealed = false;
    function reveal() {
      if (!ready || revealed) return; revealed = true;
      chrome.sync();
      chrome.post({ t: 'map:still' });
      played = true; markSeen();
    }
    function fromRect() {                                               // where the scroll comes from when there is no desk: the thing you pressed
      if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); if (r.width > 4) return r; }
      return { left: innerWidth / 2 - 40, top: innerHeight * 0.62, width: 80, height: 40 };
    }
    // wound shut, a single-rod scroll sits at one edge of the paper; this is where that is, from the centre (px)
    const shutAt = () => { const [a, b] = interval(1), m = (a + b) / 2; return WX ? { x: m * W / (2 * HX), y: 0 } : { x: 0, y: m * H / (2 * HZ) }; };
    // the path from the button to its place in front of you (k 0 → 1): small and tilted at first
    function riseT(k) {
      const r = fromRect(), e = io(k), q = 1 - e, s0 = clamp((r.height * 1.6) / (WX ? H : W), 0.05, 0.3), s = lerp(s0, 1, e), at = shutAt();
      const tx = r.left + r.width / 2 - innerWidth / 2, ty = r.top + r.height / 2 - innerHeight / 2, rot = (WX ? -1.36 : 0.22) * q;   // (e is eased below, so the arc starts and ends gently)
      // keep the wound scroll itself (not the paper's centre) on the path: undo where it sits inside the paper
      const cx = Math.cos(rot) * at.x - Math.sin(rot) * at.y, cy = Math.sin(rot) * at.x + Math.cos(rot) * at.y;
      return { x: tx * q + at.x * e - cx * s, y: ty * q + at.y * e - cy * s - Math.sin(Math.PI * e) * 46, s, rot };
    }

    // a close asked for while it is still opening (Esc, Back) is kept and done the moment the opening ends
    let queued = false, leanDone = null;
    const wait = (ms) => new Promise((ok) => { leanDone = () => { clearTimeout(pending); pending = 0; leanDone = null; ok(); }; pending = setTimeout(leanDone, ms * SLOW); });

    async function open(fromEl) {
      if (isOpen || busy) return;
      back = document.activeElement; from = fromEl || back;
      busy = true; isOpen = true; revealed = false; queued = false;
      const again = seen();                                             // not the first time this session: the same moves, shorter
      size(); ensureFrame();
      if (!ov) { ov = await buildOverlay(root); size(); }
      if (location.hash !== '#map') { history.pushState({ map: 1 }, '', '#map'); pushed = true; }
      const cx = innerWidth / 2, cy = innerHeight / 2;
      const finish = () => { busy = false; root.classList.add('is-lit', 'is-open'); reveal(); chrome.x.focus({ preventScroll: true }); if (queued) { queued = false; shut(); } };
      if (REDUCED) { root.classList.add('is-on', 'is-go', 'is-held', 'is-gl'); html.classList.add('has-map'); show(0); finish(); return; }

      let t3 = null, w0 = 1;
      if (is3d()) {
        if (F4.card) F4.close();
        F4.emit('card:open', { kind: 'map', id: 'map' });               // the chair and the crab lean in over the paper
        t3 = await build3d();
      }
      html.classList.add('has-map');
      if (t3) {
        if (!again) await wait(300);
        if (queued) {                                                   // asked to close while still leaning in: nothing has left the desk yet
          queued = false; isOpen = false; busy = false; html.classList.remove('has-map'); F4.emit('card:close', { kind: 'map', id: 'map' });
          if (pushed) { pushed = false; history.back(); } return;
        }
        t3.take(true); t3.place(0, 0, 0, cx, cy, W, H);
        root.classList.add('is-on'); show(1); if (ov) ov.canvas.style.opacity = '0';
        // 0–0.28 the compass hops off and the pin goes with it · 0.04–0.5 the sheet winds shut where it lies · 0.3–0.93 it
        // comes up to your eyes, already opening again over the last stretch · 0.94–1 the overlay's scroll fades in over the same pose
        const windEnd = M.both ? 0.46 : 0.52;
        await tween(again ? 950 : (M.both ? 1500 : 1650), (t) => {
          t3.hopCompass(seg(t, 0, 0.28), true); t3.pinTo(1 - seg(t, 0, 0.16));
          const re = seg(t, 0.76, 1), w = io(seg(t, 0.04, windEnd)) - (1 - M.hand) * re * re;
          t3.place(seg(t, 0.3, 0.93), w, out(seg(t, 0.05, 0.4)) * 0.16, cx, cy, W, H);
          const f = seg(t, 0.94, 1);
          if (f > 0 && ov) { root.classList.add('is-gl'); ov.canvas.style.opacity = f.toFixed(3); show(w); }
        });
        w0 = M.hand; show(w0);
        root.classList.add('is-held', 'is-go', 'is-gl', 'is-lit'); if (ov) ov.canvas.style.opacity = ''; t3.G.visible = false;   // from here it is the page's own paper; the desk dims behind it
      } else {
        // no desk (plain page, poster): the wound scroll rises from what you pressed
        root.classList.add('is-on', 'is-held', 'is-gl', 'is-lit');
        requestAnimationFrame(() => root.classList.add('is-go'));
        await tween(again ? 480 : 680, (t) => show(1, riseT(t)));
        show(1);
      }
      // it unrolls; the drawing comes onto the paper while it is still opening
      let told = false;
      // the wall map falls: it gathers speed, then the paper runs out; the hand scrolls are drawn open and slow into place
      const ease = !WX ? (t) => (t < 0.62 ? 0.8 * Math.pow(t / 0.62, 1.7) : 0.8 + 0.2 * (1 - Math.pow(1 - (t - 0.62) / 0.38, 2))) : t3 ? (t) => 1 - Math.pow(1 - t, 2.3) : (t) => 1 - Math.pow(1 - t, 3);
      root.classList.add('is-lit');
      await tween(again ? M.openMs * 0.62 : M.openMs, (t) => { show(lerp(w0, 0, ease(t))); if (!told && t > 0.3) { told = true; reveal(); } });
      await tween(220, (t) => show(M.bounce * Math.sin(Math.PI * t) * (1 - t * 0.4)));   // the rod reaches the end of the paper and settles back
      show(0);
      finish();
    }

    async function shut(fromHistory) {
      if (!isOpen) return;
      if (busy) { queued = true; if (fromHistory) pushed = false; if (leanDone) leanDone(); return; }   // still opening: close as soon as that is done
      if (pushed && !fromHistory) { history.back(); return; }           // the address goes back first; popstate then closes
      pushed = false; busy = true; root.classList.remove('is-open', 'is-go');   // the desk comes back up as the paper winds
      chrome.post({ t: 'map:shut' });
      const cx = innerWidth / 2, cy = innerHeight / 2;
      const done = () => {
        root.classList.remove('is-on', 'is-go', 'is-held', 'is-lit', 'is-gl'); html.classList.remove('has-map'); scroll.style.transform = ''; scroll.style.opacity = ''; isOpen = false; busy = false;
        if (ov) ov.canvas.style.opacity = '';
        if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
      };
      if (REDUCED) { if (is3d()) F4.emit('card:close', { kind: 'map', id: 'map' }); done(); return; }
      const t3 = is3d() ? three : null, w1 = t3 ? M.hand : 1, ms = M.openMs * 0.42;
      await tween(ms, (t) => show(lerp(0, w1, 1 - (1 - t) * (1 - t))));
      if (t3) {
        t3.G.visible = true; t3.place(1, M.hand, 0.16, cx, cy, W, H);
        root.classList.remove('is-held');
        F4.emit('card:close', { kind: 'map', id: 'map' });              // the chair rolls back as the scroll goes home
        // it finishes winding shut, goes back down to the desk and opens flat as it lands; the compass and the pin come back
        let home = false;
        await tween(M.both ? 950 : 1050, (t) => {
          if (ov) ov.canvas.style.opacity = (1 - seg(t, 0, 0.06)).toFixed(3);
          const sk = seg(t, 0, 0.16), w = t < 0.5 ? M.hand + (1 - M.hand) * (1 - (1 - sk) * (1 - sk)) : 1 - io(seg(t, 0.5, 0.92));
          if (!home) t3.place(1 - seg(t, 0.06, 0.74), w, (1 - out(seg(t, 0.62, 0.92))) * 0.16, cx, cy, W, H);
          if (!home && t >= 0.93) { home = true; t3.take(false); }       // flat on the desk again: the sheet itself takes over while the compass is in the air
          t3.hopCompass(seg(t, 0.72, 1), false); t3.pinTo(seg(t, 0.8, 1));
        });
        if (!home) t3.take(false);
        t3.pinTo(1);
      } else {
        await tween(480, (t) => { show(1, riseT(1 - t)); scroll.style.opacity = String(1 - seg(t, 0.75, 1)); if (ov) ov.canvas.style.opacity = String(1 - seg(t, 0.75, 1)); });
        if (is3d()) F4.emit('card:close', { kind: 'map', id: 'map' });
      }
      done();
    }

    addEventListener('resize', () => { if (isOpen && !busy) { size(); show(0); } });
    F4.on('state', () => { if (chrome && ready) chrome.sync(); });
    addEventListener('storage', (e) => { if (e.key === 'pd-done' && chrome && ready) setTimeout(() => chrome.sync(), 50); });
    addEventListener('popstate', () => { if (isOpen && location.hash !== '#map') shut(true); else if (!isOpen && !busy && location.hash === '#map') { pushed = true; open(null); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) { e.stopPropagation(); shut(); } }, true);
    root.querySelector('.ms-shade').addEventListener('click', () => shut());

    F4.onMap = () => open(document.activeElement);
    const old = document.getElementById('mv-open');
    if (SIMPLE && old) { const b = old.cloneNode(true); b.textContent = '展開學習地圖'; b.addEventListener('click', () => open(b)); old.replaceWith(b); }
    window.F4mapScroll = { mode, open, shut, get isOpen() { return isOpen; }, get busy() { return busy; }, build3d };

    if (deep) {
      const t0 = performance.now();
      (function wait() {
        const up = SIMPLE || html.classList.contains('is-3d') || html.classList.contains('is-poster');
        if (up || performance.now() - t0 > 5000) setTimeout(() => open(null), SIMPLE ? 200 : 1100); else setTimeout(wait, 200);
      })();
    }
  };
  // after every deferred script (app.js, simple.js, map-view.js) has run, so F4.onMap set here is the last word
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

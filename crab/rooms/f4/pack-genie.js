/* "Sucked into the pocket": a box is pulled into a point, the side nearest the point first, so it stretches into a funnel and
   then the rest of it is dragged in after. Used for the things on the plain page (pack-fx.js) and the slips of paper on the
   desk (pack-land.js); played backwards it is a thing being pulled out of the pocket.
   All of it is one CSS matrix3d (a 2D projective map), so only `transform` changes. */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* The four corners (tl, tr, br, bl; each [x, y] measured from the box's own centre) of a w×h box whose centre is `dx, dy`
   away from the pocket's mouth, u of the way in (0 = lying where it was, 1 = all in).
   mouth: how wide the mouth is. oy: the box is lifted this far off the page before it goes (px, negative is up).
   cap: the most it may be stretched, px (a small slip of paper a long way off would otherwise be pulled into a thread).
   bend: [x, y] px, a detour at the middle of the way (over the crab's head, when the crab stands between the thing and the pocket). */
export function suck(w, h, dx, dy, u, mouth = 26, oy = 0, cap = Infinity, bend = null) {
  const hw = w / 2, hh = h / 2; const rest = [[-hw, -hh + oy], [hw, -hh + oy], [hw, hh + oy], [-hw, hh + oy]];
  if (u <= 0) return rest;
  const dist = Math.hypot(dx, dy) || 1, nx = dx / dist, ny = dy / dist;          // toward the mouth
  const px = -ny, py = nx;                                                       // across the pull
  /* which side goes first: the bottom or top for a pull that is mostly up-and-down (things on a page are wide), else a side */
  const vertical = Math.abs(dy) * 1.25 >= Math.abs(dx) * (w / Math.max(1, h)) * 0.5;
  let lead, tail;
  if (vertical) { lead = dy > 0 ? [3, 2] : [0, 1]; tail = dy > 0 ? [0, 1] : [3, 2]; }      // [left one, right one]
  else { lead = dx > 0 ? [1, 2] : [0, 3]; tail = dx > 0 ? [0, 3] : [1, 2]; }               // [top one, bottom one]
  const a = inOut(seg(u, 0, 0.58));                                  // the near side reaches the mouth while the far side has hardly moved
  let b = Math.pow(seg(u, 0.26, 1), 2.3);                            // then the far side lets go and is dragged in, faster and faster
  if (cap < dist) b = Math.max(b, a - cap / dist);                   // (capped: the far side follows that close behind, a comet rather than a thread)
  const m = mouth / 2, sw = dist * 0.07;                             // a slight curl on the way in, so it reads as a pull and not a slide
  const sgn = vertical ? [-1, 1] : [-1, 1];
  const out = rest.map((p) => p.slice());
  const put = (i, k, p, back, curl) => {
    /* where this corner ends: at the mouth, spread across it (so left stays left), `back` px short of its far lip */
    const ax = vertical ? sgn[k] * m : 0, ay = vertical ? 0 : sgn[k] * m;
    const tx = dx + ax - nx * back, ty = dy + ay - ny * back;
    const sn = Math.sin(Math.PI * p), c = curl * sn;
    out[i][0] = lerp(rest[i][0], tx, p) + (bend ? bend[0] * sn : px * c); out[i][1] = lerp(rest[i][1], ty, p) + (bend ? bend[1] * sn : py * c);
  };
  put(lead[0], 0, a, 0, sw); put(lead[1], 1, a, 0, sw);
  put(tail[0], 0, b, 9, sw * 0.4); put(tail[1], 1, b, 9, sw * 0.4);
  return out;
}

/* The CSS transform that puts a w×h box (transform-origin at its centre, the default) onto those four corners. */
export function quadMatrix(w, h, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1; let g = 0, k = 0;
  if (Math.abs(den) > 1e-9) { g = (sx * dy2 - dx2 * sy) / den; k = (dx1 * sy - sx * dy1) / den; }
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3, f = y0;
  /* that maps the unit square; the box runs from -w/2 to w/2, so u = x/w + 1/2, v = y/h + 1/2 */
  const A = a / w, B = b / h, C = a / 2 + b / 2 + c, D = d / w, E = e / h, F = d / 2 + e / 2 + f, G = g / w, H = k / h, I = g / 2 + k / 2 + 1;
  const n = (x) => +x.toFixed(6);
  return `matrix3d(${n(A / I)},${n(D / I)},0,${n(G / I)},${n(B / I)},${n(E / I)},0,${n(H / I)},0,0,1,0,${n(C / I)},${n(F / I)},0,1)`;
}

/* how see-through it is on the way in: solid until it is nearly gone */
export const suckFade = (u) => (u > 0.86 ? Math.max(0, 1 - (u - 0.86) / 0.14) : 1);

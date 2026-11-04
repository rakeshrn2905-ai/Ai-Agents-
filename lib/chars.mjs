// Characters: objChar() = object with a Style 5 face + stick arms/legs (the "hook -> how -> why"
// format), human() = Style 5 historical cartoon person (~4 heads tall). Origin = feet on the ground.
import { INK, PAL, LW, cel, ell, box, rrect, tube, arm, leg, flame, shade, tint, wobble, clamp } from './draw.mjs';
import { face } from './face.mjs';

// ---------- body library (units at scale 1; y grows downward, ground = 0) ----------
// Each body draws itself and returns anchors: face [x,y,size], shoulders, hips, top, tip (for flames/props).
export const BODIES = {
  match(c, col) {
    const base = col.base || PAL.wood;
    box(c, -36, -430, 72, 370, base, { r: 18 });
    // grain lines
    c.strokeStyle = shade(base, 0.3); c.lineWidth = 3;
    for (const gx of [-14, 12]) { c.beginPath(); c.moveTo(gx, -380); c.lineTo(gx, -90); c.stroke(); }
    ell(c, 0, -455, 52, 64, col.head || PAL.red);
    return { face: [0, -320, 24], shL: [-36, -250], shR: [36, -250], hipL: [-18, -62], hipR: [18, -62], top: [0, -520], tip: [0, -520] };
  },
  lamp(c, col) { // Döbereiner's lamp: glass jar, inner bell, brass lid, valve, nozzle
    const g = col.base || PAL.glass;
    c.save(); c.globalAlpha = 0.92;
    box(c, -130, -360, 260, 300, g, { r: 26, k: 0.12 });
    c.restore();
    c.fillStyle = 'rgba(90,169,160,0.35)'; c.beginPath(); rrect(c, -120, -250, 240, 180, 18); c.fill(); // acid level
    box(c, -150, -400, 300, 52, PAL.brass, { r: 12 });
    box(c, -26, -470, 52, 74, PAL.brass, { r: 10 });
    tube(c, 20, -455, 92, -500, 18, PAL.brass, 6);
    ell(c, -60, -428, 22, 16, shade(PAL.brass, 0.1)); // valve knob
    c.strokeStyle = '#FFFFFF'; c.globalAlpha = 0.6; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-100, -330); c.lineTo(-100, -230); c.stroke(); c.globalAlpha = 1;
    return { face: [0, -300, 34], shL: [-130, -230], shR: [130, -230], hipL: [-60, -62], hipR: [60, -62], top: [0, -470], tip: [102, -508] };
  },
  matchbox(c, col) {
    const base = col.base || PAL.coral;
    box(c, -150, -230, 300, 170, base, { r: 12 });
    c.fillStyle = shade(PAL.wood, 0.35); c.fillRect(-150, -100, 300, 22);
    for (let i = 0; i < 4; i++) ell(c, -60 + i * 40, -244, 16, 16, PAL.red, { lw: 4, k: 0 });
    c.strokeStyle = INK; c.lineWidth = LW; c.beginPath(); rrect(c, -150, -230, 300, 170, 12); c.stroke();
    return { face: [0, -170, 28], shL: [-150, -150], shR: [150, -150], hipL: [-60, -62], hipR: [60, -62], top: [0, -260], tip: [0, -260] };
  },
  candle(c, col) {
    box(c, -55, -340, 110, 280, col.base || '#F6E7C8', { r: 14 });
    c.beginPath(); c.moveTo(0, -340); c.lineTo(0, -372); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    return { face: [0, -250, 22], shL: [-55, -210], shR: [55, -210], hipL: [-26, -62], hipR: [26, -62], top: [0, -372], tip: [0, -372] };
  },
  book(c, col) {
    const base = col.base || PAL.navy;
    box(c, -130, -380, 260, 320, base, { r: 10 });
    c.fillStyle = PAL.paper; c.fillRect(110, -370, 14, 300);
    box(c, -90, -340, 180, 46, PAL.gold, { r: 6, lw: 4, k: 0 });
    return { face: [-10, -220, 30], shL: [-130, -230], shR: [130, -230], hipL: [-60, -62], hipR: [60, -62], top: [0, -380], tip: [0, -380] };
  },
  clock(c, col) {
    ell(c, 0, -230, 160, 160, col.base || PAL.gold);
    ell(c, 0, -230, 126, 126, PAL.paper, { k: 0.06 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = INK; c.beginPath(); c.arc(Math.cos(a) * 108, -230 + Math.sin(a) * 108, 6, 0, 7); c.fill(); }
    return { face: [0, -220, 34], shL: [-160, -220], shR: [160, -220], hipL: [-50, -76], hipR: [50, -76], top: [0, -390], tip: [0, -390] };
  },
  phone(c, col) { // old candlestick-style telephone body
    const base = col.base || '#3B3B3B';
    box(c, -110, -150, 220, 90, base, { r: 22 });
    box(c, -34, -420, 68, 280, base, { r: 22 });
    ell(c, 0, -440, 70, 34, base);
    return { face: [0, -320, 22], shL: [-34, -280], shR: [34, -280], hipL: [-50, -62], hipR: [50, -62], top: [0, -470], tip: [0, -470] };
  },
  can(c, col) { // generic cylinder object
    const base = col.base || PAL.teal;
    box(c, -110, -360, 220, 300, base, { r: 30 });
    ell(c, 0, -360, 110, 26, tint(base, 0.25), { k: 0 });
    return { face: [0, -230, 32], shL: [-110, -220], shR: [110, -220], hipL: [-50, -62], hipR: [50, -62], top: [0, -386], tip: [0, -386] };
  },
  crate(c, col) { // generic box object
    const base = col.base || PAL.wood;
    box(c, -150, -330, 300, 270, base, { r: 8 });
    c.strokeStyle = shade(base, 0.35); c.lineWidth = 6;
    c.beginPath(); c.moveTo(-140, -320); c.lineTo(140, -70); c.moveTo(140, -320); c.lineTo(-140, -70); c.stroke();
    return { face: [0, -200, 32], shL: [-150, -210], shR: [150, -210], hipL: [-60, -62], hipR: [60, -62], top: [0, -330], tip: [0, -330] };
  },
  ball(c, col) { // generic round object (planet, fruit, bomb...)
    ell(c, 0, -210, 150, 150, col.base || PAL.sky);
    return { face: [0, -200, 34], shL: [-150, -200], shR: [150, -200], hipL: [-50, -70], hipR: [50, -70], top: [0, -360], tip: [0, -360] };
  },
};

// ---------- poses ----------
const ARM_POSES = { // hand offsets from shoulder, in units of scale (x is mirrored for the left arm)
  down: [[30, 115], [30, 115]], wave: [[60, 100], [80, -110]], point: [[30, 110], [150, -30]],
  cheer: [[-70, -120], [70, -120]], hips: [[45, 40], [45, 40]], shrug: [[70, -30], [70, -30]],
  hold: [[30, 110], [110, 10]], think: [[30, 110], [-10, -70]], present: [[30, 110], [140, 20]],
};
function armTargets(pose, t) {
  if (typeof pose === 'object' && !Array.isArray(pose)) return [pose.l, pose.r];
  const p = ARM_POSES[pose] || ARM_POSES.down;
  if (pose === 'wave') return [p[0], [p[1][0] + wobble(t, 2, 30), p[1][1]]];
  return p;
}

/** Object character. o = {body, x, y, s, mood, look, armPose, legPose, colors, t, squash, lean, flip, flame, blink} */
export function objChar(c, o) {
  const s = o.s ?? 1, t = o.t ?? 0, flip = o.flip ? -1 : 1;
  const bodyFn = typeof o.body === 'function' ? o.body : BODIES[o.body] || BODIES.can;
  const squash = o.squash ?? 0; // >0 squash, <0 stretch
  const bob = o.legPose === 'walk' ? Math.abs(Math.sin(t * 8)) * -10 : 0;
  c.save(); c.translate(o.x, o.y + bob * s); c.scale(s * flip, s);
  // measure anchors without drawing by drawing to the real canvas inside a transform:
  c.save(); c.translate(0, 0); c.scale(1 + squash * 0.25, 1 - squash * 0.25); c.rotate((o.lean || 0) * Math.PI / 180);
  // legs first (behind body)
  const A = probe(bodyFn, o.colors || {});
  const legLen = 80, lp = o.legPose || 'stand';
  for (const [i, hip] of [A.hipL, A.hipR].entries()) {
    const side = i === 0 ? -1 : 1;
    let fx = hip[0] + side * 14, fy = 0;
    if (lp === 'walk') { fx = hip[0] + Math.sin(t * 8 + i * Math.PI) * 34; fy = -Math.max(0, Math.sin(t * 8 + i * Math.PI)) * 22; }
    if (lp === 'jump') { fx = hip[0] + side * 26; fy = -30; }
    if (lp === 'wide') fx = hip[0] + side * 46;
    leg(c, hip[0], hip[1] - 4, fx, fy - 2, legLen, 1, side, side);
  }
  const a = bodyFn(c, o.colors || {});
  // arms
  const [tl, tr] = armTargets(o.armPose || 'down', t);
  arm(c, a.shL[0], a.shL[1], a.shL[0] - tl[0], a.shL[1] + tl[1], 150, 1, -1);
  arm(c, a.shR[0], a.shR[1], a.shR[0] + tr[0], a.shR[1] + tr[1], 150, 1, 1);
  if (o.flame) flame(c, a.tip[0], a.tip[1] + 6, 70 * o.flame, t);
  c.save(); if (flip < 0) { c.translate(a.face[0], 0); c.scale(-1, 1); c.translate(-a.face[0], 0); }
  face(c, a.face[0], a.face[1], a.face[2], { mood: o.mood, look: o.look || [0, 0], blink: o.blink || 0 });
  c.restore();
  c.restore(); c.restore();
  return a;
}
// Anchors are needed before drawing (legs go behind the body), so run the body on a throwaway context.
const _cache = new Map();
function probe(fn, colors) {
  if (_cache.has(fn)) return _cache.get(fn);
  const noop = new Proxy({}, { get: (_, k) => (k === 'globalAlpha' || k === 'lineWidth' ? 1 : () => {}), set: () => true });
  const a = fn(noop, colors); _cache.set(fn, a); return a;
}

// ---------- Style 5 human ----------
const HAIR = {
  short(c, col) { cel(c, (c) => { c.arc(0, -8, 64, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); }, col, [-64, -72, 128, 64], { k: 0.15 }); },
  bald() {},
  curly(c, col) { for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.15); ell(c, Math.cos(a) * 56, -6 + Math.sin(a) * 56, 22, 22, col, { k: 0, lw: 5 }); } },
  wig(c, col) { for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) ell(c, sx * 62, -10 + i * 30, 20, 16, col, { k: 0.1, lw: 5 }); HAIR.short(c, col); },
  bun(c, col) { ell(c, 0, -72, 30, 26, col, { k: 0.15 }); HAIR.short(c, col); },
};
const HATS = {
  top(c, col) { box(c, -44, -170, 88, 110, col, { r: 6 }); box(c, -74, -70, 148, 20, col, { r: 8 }); },
  bicorne(c, col) { cel(c, (c) => { c.moveTo(-110, -40); c.quadraticCurveTo(0, -150, 110, -40); c.quadraticCurveTo(0, -70, -110, -40); }, col, [-110, -150, 220, 110]); ell(c, 30, -76, 12, 12, PAL.coral, { k: 0, lw: 4 }); },
  tricorn(c, col) { cel(c, (c) => { c.moveTo(-90, -40); c.lineTo(0, -120); c.lineTo(90, -40); c.quadraticCurveTo(0, -60, -90, -40); }, col, [-90, -120, 180, 80]); },
  cap(c, col) { cel(c, (c) => { c.arc(0, -20, 62, Math.PI, 0); c.lineTo(100, -20); c.closePath(); }, col, [-62, -82, 162, 62]); },
};

/** human(c, {x, y, s, mood, look, costume:{coat, trim, trousers}, hair:{style,color}, hat:{style,color}, armPose, legPose, t, flip}) */
export function human(c, o) {
  const s = o.s ?? 1, t = o.t ?? 0, flip = o.flip ? -1 : 1;
  const cos = { coat: PAL.navy, trim: PAL.gold, trousers: '#E9E2D2', ...(o.costume || {}) };
  const bob = o.legPose === 'walk' ? Math.abs(Math.sin(t * 8)) * -8 : 0;
  c.save(); c.translate(o.x, o.y + bob * s); c.scale(s * flip, s);
  // legs (thin black limbs)
  const lp = o.legPose || 'stand';
  for (const [i, side] of [[0, -1], [1, 1]]) {
    let fx = side * 30, fy = 0;
    if (lp === 'walk') { fx = Math.sin(t * 8 + i * Math.PI) * 40; fy = -Math.max(0, Math.sin(t * 8 + i * Math.PI)) * 22; }
    leg(c, side * 26, -190, fx, fy - 2, 200, 1, side, 1);
  }
  // coat/body: trapezoid, cel-shaded
  cel(c, (c) => { c.moveTo(-58, -380); c.lineTo(58, -380); c.lineTo(86, -170); c.quadraticCurveTo(0, -150, -86, -170); c.closePath(); }, cos.coat, [-86, -380, 172, 230]);
  seg(c, 0, -370, 0, -175, 4, shade(cos.coat, 0.4));
  for (let i = 0; i < 3; i++) ell(c, 14, -330 + i * 50, 7, 7, cos.trim, { lw: 3, k: 0 });
  // arms
  const [tl, tr] = armTargets(o.armPose || 'down', t);
  arm(c, -56, -360, -56 - tl[0], -360 + tl[1], 190, 1, -1);
  arm(c, 56, -360, 56 + tr[0], -360 + tr[1], 190, 1, 1);
  // collar + neck + head
  box(c, -14, -410, 28, 40, '#FFFFFF', { r: 6, k: 0, lw: 5 });
  cel(c, (c) => { c.moveTo(-48, -386); c.lineTo(0, -350); c.lineTo(48, -386); c.lineTo(30, -396); c.lineTo(0, -372); c.lineTo(-30, -396); c.closePath(); }, '#FFFFFF', null, { lw: 4 });
  c.save(); c.translate(0, -470);
  ell(c, 0, 0, 64, 64, '#FFFFFF', { k: 0.06 });
  const hair = o.hair || { style: 'short', color: '#5A3B22' };
  (HAIR[hair.style] || HAIR.short)(c, hair.color);
  c.save(); if (flip < 0) c.scale(-1, 1);
  face(c, 0, 4, 30, { mood: o.mood, look: o.look || [0, 0], blink: o.blink || 0 });
  c.restore();
  if (o.hat) (HATS[o.hat.style] || HATS.top)(c, o.hat.color || INK);
  c.restore();
  c.restore();
}
function seg(c, x1, y1, x2, y2, lw, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); }
export { clamp };

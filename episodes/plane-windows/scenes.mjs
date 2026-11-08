// Bespoke scenes for "Why Plane Windows Are Round" (de Havilland Comet, 1954).
// Taste: only a cartoon plane's metal cracks. No people, no fire, no crash.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, rrect, shade } from '../../lib/draw.mjs';
import { face } from '../../lib/face.mjs';
import { label } from '../../lib/text.mjs';

const BODY = '#F4F6F8', STRIPE = '#2D6FCC', METAL = '#CBD5DE', RED = '#E0453A';

/** Cartoon jet facing right, centre origin. square: window shape. crack: 0..1 crack growth from a window corner. */
export function plane(c, x, y, s, { square = true, mood = 'grin', look = [0, 0], T = 0, crack = 0, rot = 0, stripe = STRIPE, name = '' } = {}) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  cel(c, (c) => { c.moveTo(-330, -40); c.lineTo(-420, -230); c.lineTo(-330, -230); c.lineTo(-220, -60); c.closePath(); }, stripe, null, { lw: 7 });   // tail fin
  cel(c, (c) => { c.moveTo(-60, 30); c.lineTo(-200, 230); c.lineTo(-110, 230); c.lineTo(80, 40); c.closePath(); }, shade(BODY, 0.12), null, { lw: 7 }); // far wing
  cel(c, (c) => { c.moveTo(-400, -70); c.lineTo(280, -80); c.quadraticCurveTo(470, -70, 480, 10); c.quadraticCurveTo(470, 80, 280, 80); c.lineTo(-360, 70); c.quadraticCurveTo(-440, 0, -400, -70); c.closePath(); }, BODY, [-440, -80, 920, 160], { k: 0.12, side: 'bottom' });
  c.fillStyle = stripe; c.fillRect(-380, 22, 690, 18);
  for (let i = 0; i < 7; i++) { // windows
    const wx = -300 + i * 72, wy = -36;
    if (square) box(c, wx - 18, wy - 20, 36, 40, '#9FD8F0', { r: 3, lw: 5, k: 0 }); else box(c, wx - 17, wy - 22, 34, 44, '#9FD8F0', { r: 17, lw: 5, k: 0 });
  }
  if (name) { c.font = '900 30px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = stripe; c.fillText(name, -260, 4); }
  box(c, 300, -54, 120, 74, '#FFFFFF', { r: 30, lw: 5, k: 0 });
  face(c, 360, -18, 26, { mood, look, blink: ((T * 0.43) % 1) > 0.96 ? 1 : 0 });
  cel(c, (c) => { c.moveTo(-40, 40); c.lineTo(-190, 250); c.lineTo(-90, 250); c.lineTo(110, 50); c.closePath(); }, BODY, [-190, 40, 300, 210], { k: 0.15 }); // near wing
  ell(c, -40, 120, 46, 26, METAL, { k: 0.2 }); // engine
  if (crack > 0) { // zigzag crack from the corner of the 3rd window
    const pts = [[-138, -16], [-120, 4], [-130, 22], [-108, 40], [-118, 60]], n = 1 + Math.floor(crack * (pts.length - 1));
    c.strokeStyle = INK; c.lineWidth = 7; c.lineJoin = 'round'; c.beginPath(); pts.slice(0, n + 1).forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
  }
  c.restore();
}
function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const sky = () => once('sky', (c) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3FA4E6'); g.addColorStop(1, '#BDE6F7'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#FFFFFF'; for (const [x, y, r] of [[150, 620, 52], [215, 600, 66], [285, 625, 48], [820, 1450, 60], [890, 1430, 76], [965, 1455, 56], [120, 1600, 46], [180, 1585, 58]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
});
const panelBg = () => once('panel', (c) => { // brushed aluminium skin with rivets (cutaway scenes)
  c.fillStyle = '#E3EAF0'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(120,140,160,0.25)'; c.lineWidth = 3; for (let y = 0; y < H; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#9AA8B5'; for (let x = 60; x < W; x += 120) for (const y of [560, 1440]) { c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }
  c.strokeStyle = '#9AA8B5'; c.lineWidth = 6; for (const y of [540, 1460]) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
});

// Stress lines around a hole: streamlines of flow past a cylinder, psi = y (1 - R^2 / r^2).
// p = 2 -> round hole, large p -> square hole (superellipse norm), so lines crowd hard at the corners.
function rNorm(x, y, p) { return p === 2 ? Math.hypot(x, y) : Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(y), p), 1 / p); }
function streamY(x, psi, R, p) {
  let lo = 0; if (Math.abs(x) < R) { let a = 0, b = R * 1.01; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; rNorm(x, m, p) < R ? (a = m) : (b = m); } lo = b; }
  let hi = psi + 3 * R;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, r = rNorm(x, m, p); const f = m * (1 - (R * R) / Math.max(r * r, 1e-6)) - psi; f < 0 ? (lo = m) : (hi = m); }
  return (lo + hi) / 2;
}
function stressField(c, cx, cy, R, p, t, { lines = 7, flow = true, hot = false } = {}) {
  for (let k = 1; k <= lines; k++) for (const sgn of [-1, 1]) {
    const psi = k * R * 0.17;
    c.beginPath();
    for (let x = -540; x <= 540; x += 6) { const yy = streamY(x, psi, R, p); x === -540 ? c.moveTo(cx + x, cy + sgn * yy) : c.lineTo(cx + x, cy + sgn * yy); }
    c.strokeStyle = k <= 2 && hot ? RED : '#3A6FB0'; c.lineWidth = k <= 2 ? 6 : 4; c.stroke();
    if (flow) for (let j = 0; j < 4; j++) { // little dots travelling along each line
      const x = -540 + ((t * 260 + j * 270 + k * 40) % 1080), yy = streamY(x, psi, R, p);
      ell(c, cx + x, cy + sgn * yy, 8, 8, k <= 2 && hot ? RED : '#3A6FB0', { lw: 0, k: 0 });
    }
  }
}
function morphHole(c, cx, cy, R, m) { // m: 0 square .. 1 round
  box(c, cx - R, cy - R, 2 * R, 2 * R, '#9FD8F0', { r: lerp(6, R, m), lw: 10, k: 0 });
}
function hole(c, cx, cy, R, square) {
  if (square) box(c, cx - R, cy - R, 2 * R, 2 * R, '#9FD8F0', { r: 6, lw: 10, k: 0 });
  else ell(c, cx, cy, R, R, '#9FD8F0', { lw: 10, k: 0 });
  c.save(); c.globalAlpha = 0.6; c.strokeStyle = '#FFFFFF'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - R * 0.5, cy - R * 0.2); c.lineTo(cx - R * 0.15, cy - R * 0.55); c.stroke(); c.restore();
}

export const SCENES = {
  // 0 hook: the jet flies along, a crack zips out of a square window, the jet gasps
  phook(c, t, beat, ctx) {
    c.drawImage(sky(), 0, 0);
    plane(c, 490 + Math.sin(t * 2) * 10, 1000 + Math.sin(t * 2.6) * 14, 0.92, { mood: t > 0.35 ? 'shock' : 'worried', T: ctx.T, crack: clamp(t / 0.5), rot: -0.04 + Math.sin(t * 9) * (t > 0.4 ? 0.015 : 0) });
    if (t > 0.45) burst(c, 490 - 125 * 0.92, 1000 + 10, 120, t - 0.45, 10, RED);
  },
  // 1: the Comet - first jet airliner, squarish windows (labelled)
  comet(c, t, beat, ctx) {
    c.drawImage(sky(), 0, 0);
    const k = easeOut(clamp(t / 0.8));
    plane(c, lerp(-300, 500, k), 1020 + Math.sin(t * 2.6) * 12, 0.92, { mood: 'proud', T: ctx.T, name: 'COMET' });
    label(c, 'SQUARISH WINDOWS', 500 - 228 * 0.92, 1020 - 36 * 0.92, 330, 760, clamp((t - 1.2) / 0.4), { size: 52 });
  },
  // 2: pumped full of air - fuselage cross-section swells, arrows push out
  pump(c, t, beat, ctx) {
    c.drawImage(sky(), 0, 0);
    const k = 0.9 + 0.1 * easeInOut(clamp(t / 1.2)), r = 300 * k, cx = 540, cy = 1040;
    ell(c, cx, cy, r, r, BODY, { k: 0.12 });
    ell(c, cx, cy, r - 40, r - 40, '#D7F0FA', { lw: 5, k: 0 });
    c.fillStyle = STRIPE; c.fillRect(cx - r * 0.85, cy + r * 0.35, r * 1.7, 14);
    for (let i = 0; i < 8; i++) { // pressure arrows pushing outward, pulsing
      const a = i / 8 * Math.PI * 2 + 0.2, d = r - 150 + Math.sin(t * 6 + i) * 12;
      c.save(); c.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d); c.rotate(a);
      c.fillStyle = RED; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(-40, -12); c.lineTo(10, -12); c.lineTo(10, -28); c.lineTo(44, 0); c.lineTo(10, 28); c.lineTo(10, 12); c.lineTo(-40, 12); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    popWord(c, 'AIR IN!', cx, cy, clamp((t - 0.3) / 0.3), 84);
  },
  // 3: the metal stretches again and again - a skin panel breathes in and out
  stretch(c, t, beat, ctx) {
    c.drawImage(panelBg(), 0, 0);
    const k = 1 + 0.06 * Math.sin(t * 6);
    c.save(); c.translate(540, 1000); c.scale(k, 1 / Math.sqrt(k)); hole(c, 0, 0, 150, true); c.restore();
    for (const sx of [-1, 1]) { // stretch arrows left and right
      const x = 540 + sx * (330 + Math.sin(t * 6) * 26);
      c.save(); c.translate(x, 1000); c.scale(sx, 1);
      c.fillStyle = PAL.gold; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -18); c.lineTo(70, -18); c.lineTo(70, -40); c.lineTo(120, 0); c.lineTo(70, 40); c.lineTo(70, 18); c.lineTo(0, 18); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    popWord(c, 'STRETCH...', 540, 760, clamp((t - 0.2) / 0.3), 70);
    popWord(c, '...AND AGAIN', 540, 1260, clamp((t - 1.1) / 0.3), 70, PAL.gold);
  },
  // 4: at a sharp corner the stress piles up - labelled stress-line cutaway
  corner(c, t, beat, ctx) {
    c.drawImage(panelBg(), 0, 0);
    stressField(c, 540, 1000, 150, 10, t, { hot: true });
    hole(c, 540, 1000, 150, true);
    const glow = 0.5 + 0.5 * Math.sin(t * 10);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.save(); c.globalAlpha = 0.35 + 0.4 * glow; ell(c, 540 + dx * 150, 1000 + dy * 150, 34, 34, RED, { lw: 0, k: 0 }); c.restore(); }
    label(c, 'STRESS PILES UP', 540 + 150, 1000 - 150, W - 150, 720, clamp((t - 0.5) / 0.4), { size: 52 });
  },
  // 5: cracks grew - a zigzag crack runs out from the corner, the panel splits
  crack(c, t, beat, ctx) {
    c.drawImage(panelBg(), 0, 0);
    const split = easeOut(clamp((t - 2.2) / 0.8)) * 26;
    c.save(); c.translate(-split, 0);
    hole(c, 540, 1000, 150, true);
    const pts = [[690, 850], [740, 800], [720, 760], [790, 700], [770, 650], [840, 590], [830, 545]];
    const n = clamp(t / 1.8) * (pts.length - 1);
    c.strokeStyle = INK; c.lineWidth = 12; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); c.moveTo(...pts[0]);
    for (let i = 1; i <= Math.ceil(n); i++) { const f = Math.min(1, n - (i - 1)); c.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); } c.stroke();
    c.restore();
    if (t > 0.2) burst(c, 690, 850, 90, (t - 0.2) % 0.6, 8, RED);
  },
  // 5a: 1954 - the Comet's own square window corner cracks
  cometcrack(c, t, beat, ctx) {
    c.drawImage(sky(), 0, 0);
    const shake = t > 1.6 ? Math.sin(t * 40) * 4 : 0;
    plane(c, 500 + shake, 1020 + Math.sin(t * 2.6) * 10, 0.92, { mood: t > 1.0 ? 'shock' : 'worried', T: ctx.T, name: 'COMET', crack: clamp((t - 0.4) / 1.2) });
    label(c, 'CRACK AT THE CORNER', 500 - 138 * 0.92, 1020 - 16 * 0.92, 330, 760, clamp((t - 1.0) / 0.4), { size: 52 });
  },
  // 6: so windows were made round - the square morphs into a circle, red stress lines calm to blue
  morph(c, t, beat, ctx) {
    c.drawImage(panelBg(), 0, 0);
    const m = easeInOut(clamp((t - 0.3) / 1.3)), p = lerp(10, 2, m);
    stressField(c, 540, 1000, 155, p, t, { hot: m < 0.6 });
    morphHole(c, 540, 1000, 155, m);
    label(c, m < 0.6 ? 'SQUARE' : 'ROUND', 540 + 110, 1000 - 110, W - 150, 720, 1, { size: 56 });
    if (m >= 1) burst(c, 540, 1000, 220, t - 1.6, 12, PAL.gold);
  },
  // (unused) a curve lets the stress flow around - smooth lines, no hot spot
  curve(c, t, beat, ctx) {
    c.drawImage(panelBg(), 0, 0);
    stressField(c, 540, 1000, 160, 2, t, { hot: false });
    hole(c, 540, 1000, 160, false);
    label(c, 'STRESS FLOWS AROUND', 540 + 113, 1000 - 113, W - 150, 720, clamp((t - 0.4) / 0.4), { size: 52 });
  },
  // 7 payoff: a modern jet with round windows, happy, same sky as the hook
  payoff(c, t, beat, ctx) {
    c.drawImage(sky(), 0, 0);
    plane(c, 490 + Math.sin(t * 2) * 10, 1050 + Math.sin(t * 2.6) * 14, 0.92, { square: false, mood: t > 0.4 ? 'chuckle' : 'grin', T: ctx.T, rot: -0.04, stripe: '#E0A63A' });
  },
};

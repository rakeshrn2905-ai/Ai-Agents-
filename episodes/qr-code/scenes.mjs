// Bespoke scenes for "QR Codes Came From a Board Game" (Masahiro Hara, Denso Wave, 1994).
// Human cast only (Hara, a factory worker); objects have no faces. The code shown is a random pattern, not a real QR.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade } from '../../lib/draw.mjs';
import { human } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const K = 190 / 150, N = 21, BOARD = '#E3B565';
const blinkAt = (T, x) => (((T * 0.37 + (x % 7) / 7) % 1) > 0.96 ? 1 : 0);
const HARA = { costume: { coat: '#3A6FB0', trim: '#FFFFFF', trousers: '#3A4A6A' }, hair: { style: 'short', color: '#2A2622' }, hat: { style: 'cap', color: '#2D3E5C' } };
const WORKER = { costume: { coat: '#E0A63A', trim: '#FFFFFF', trousers: '#5A5A5A' }, hair: { style: 'short', color: '#5A3B22' }, hat: { style: 'cap', color: '#C8382C' } };
const handR = (o, tgt) => [o.x + (56 + tgt[0] * K) * o.s, o.y + (-360 + tgt[1] * K) * o.s];

// 21 x 21 module grid: three finder squares + deterministic filler (not a decodable code)
const GRID = (() => {
  const g = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, q) => ((r * 73 + q * 151 + r * q * 31 + ((r ^ q) * 17)) % 7) < 3 ? 1 : 0));
  const finder = (r0, q0) => { for (let r = -1; r <= 7; r++) for (let q = -1; q <= 7; q++) { const rr = r0 + r, qq = q0 + q; if (rr < 0 || qq < 0 || rr >= N || qq >= N) continue;
    const ring = Math.max(Math.abs(r - 3), Math.abs(q - 3)); g[rr][qq] = ring === 4 ? 0 : ring === 3 ? 1 : ring === 2 ? 0 : 1; } };
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0); return g;
})();
const isFinder = (r, q) => (r < 7 && q < 7) || (r < 7 && q >= N - 7) || (r >= N - 7 && q < 7);
/** The code. m = 0: Go stones on a wooden board, m = 1: square QR modules on white. shown = fraction of cells placed. hi = highlight finders. */
function code(c, cx, cy, size, { m = 0, shown = 1, hi = 0, rot = 0 } = {}) {
  const cell = size / N, x0 = -size / 2, y0 = -size / 2;
  c.save(); c.translate(cx, cy); c.rotate(rot);
  box(c, x0 - 26, y0 - 26, size + 52, size + 52, m > 0.5 ? '#FFFFFF' : BOARD, { r: 14, k: m > 0.5 ? 0.04 : 0.12 });
  if (m < 0.9) { c.globalAlpha = 1 - m; c.strokeStyle = 'rgba(90,60,20,0.55)'; c.lineWidth = 2; for (let i = 0; i < N; i++) { const p = x0 + (i + 0.5) * cell; c.beginPath(); c.moveTo(p, y0 + cell / 2); c.lineTo(p, y0 + size - cell / 2); c.moveTo(x0 + cell / 2, p); c.lineTo(x0 + size - cell / 2, p); c.stroke(); } c.globalAlpha = 1; }
  const count = Math.floor(shown * N * N);
  for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) {
    if (((r * 37 + q * 91) % (N * N)) >= count && shown < 1) continue;
    const v = GRID[r][q], x = x0 + q * cell, y = y0 + r * cell, rad = lerp(cell * 0.46, 0, m);
    if (m >= 1 && !v) continue;
    c.fillStyle = v ? (hi > 0 && isFinder(r, q) ? '#D9303A' : '#1F1B18') : '#FFFFFF';
    if (m < 1) { c.beginPath(); const pad = lerp(cell * 0.04, 0, m), w = cell - pad * 2; c.roundRect(x + pad, y + pad, w, w, Math.max(0, rad)); c.fill(); if (!v || m < 0.5) { c.strokeStyle = 'rgba(31,27,24,0.6)'; c.lineWidth = 1.5; c.stroke(); } }
    else c.fillRect(x - 0.5, y - 0.5, cell + 1, cell + 1);
  }
  c.restore();
}
function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
function phone(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); box(c, -34, -70, 68, 140, '#2A2622', { r: 14, k: 0 }); box(c, -27, -60, 54, 112, '#7FD0F5', { r: 8, lw: 0, k: 0 }); c.restore(); }
function barcode(c, x, y, w, h) { box(c, x, y, w, h, '#FFFFFF', { r: 4, lw: 4, k: 0 }); c.fillStyle = INK; for (let i = 0, px = x + 8; px < x + w - 10; i++) { const bw = 3 + ((i * 7) % 4) * 2; c.fillRect(px, y + 6, bw, h - 12); px += bw + 4 + (i % 3) * 2; } }
function crate(c, x, y, n = 3) { box(c, x - 120, y - 190, 240, 190, '#C98B5E', { r: 8, k: 0.18 }); for (let i = 0; i < n; i++) barcode(c, x - 100, y - 176 + i * 56, 200, 46); }

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const floor = (c, col) => { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); };
const room = () => once('room', (c) => { // bright games room: hook + loop
  c.fillStyle = '#FF9F6B'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = 'rgba(255,255,255,0.16)'; for (let x = 0; x < W; x += 180) c.fillRect(x, 0, 90, GROUND);
  floor(c, '#5CC8BE');
});
const factory = () => once('factory', (c) => {
  c.fillStyle = '#BFE3F2'; c.fillRect(0, 0, W, GROUND);
  for (let x = 60; x < W; x += 340) { box(c, x, 520, 240, 200, '#FFFFFF', { r: 8, k: 0 }); c.strokeStyle = '#8FB8D8'; c.lineWidth = 10; c.beginPath(); c.moveTo(x + 120, 520); c.lineTo(x + 120, 720); c.moveTo(x, 620); c.lineTo(x + 240, 620); c.stroke(); }
  box(c, -20, GROUND - 150, W + 40, 50, '#6E7881', { r: 10, k: 0.15 }); for (let x = 30; x < W; x += 120) ell(c, x, GROUND - 100, 26, 26, '#3B3F46', { lw: 5, k: 0 }); // conveyor
  for (const x of [80, W - 80]) box(c, x - 16, GROUND - 100, 32, 100, '#5A606A', { r: 4, k: 0 });
  floor(c, '#C9CFD4');
});
const canteen = () => once('canteen', (c) => {
  c.fillStyle = '#FFE08A'; c.fillRect(0, 0, W, GROUND);
  c.strokeStyle = 'rgba(200,140,40,0.3)'; c.lineWidth = 8; for (let y = 80; y < GROUND; y += 110) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  floor(c, '#B07A45');
});

function hookLayout(c, t, ctx, s, mood, cy = 1010, size = 520) {
  code(c, 720, cy, size, { m: 0 });
  const tgt = [110, 10], o = { ...HARA, x: 250, y: GROUND, s, t: ctx.T, mood, armPose: { l: [30, 110], r: tgt }, look: [1, 0], blink: blinkAt(ctx.T, 1) };
  human(c, o);
  const [hx, hy] = handR(o, tgt); phone(c, hx + 6, hy - 50, s);
  // scan line sweeping the board
  const sy = cy - size / 2 + ((t * 420) % size);
  c.save(); c.globalAlpha = 0.85; c.fillStyle = '#35D07F'; c.fillRect(720 - size / 2 - 10, sy, size + 20, 10); c.restore();
}

export const SCENES = {
  // 0 hook: a man scans a Go board whose stones are laid out like a QR code
  qhook(c, t, beat, ctx) { c.drawImage(room(), 0, 0); hookLayout(c, t, ctx, 0.95, 'shock'); if (t > 0.5) popWord(c, 'BEEP!', 300, 600, clamp((t - 0.5) / 0.25), 84, PAL.gold); },
  // 1: 1994 - engineer Masahiro Hara
  hara(c, t, beat, ctx) {
    c.drawImage(factory(), 0, 0);
    const k = easeOut(clamp(t / 0.8));
    human(c, { ...HARA, x: lerp(-200, 420, k), y: GROUND, s: 1.2, t: ctx.T, mood: 'proud', legPose: k < 1 ? 'walk' : 'stand', armPose: k < 1 ? 'down' : 'hips', blink: blinkAt(ctx.T, 2) });
    crate(c, 860, GROUND - 150, 2);
    popWord(c, '1994', 780, 900, clamp((t - 0.5) / 0.3), 120, PAL.gold);
  },
  // 1b: ...had a problem at a car parts factory - crates covered in barcodes pile up
  problem(c, t, beat, ctx) {
    c.drawImage(factory(), 0, 0);
    for (let i = 0; i < 4; i++) { const x = ((t * 190 + i * 300) % 1320) - 120; crate(c, x, GROUND - 150, 3); }
    human(c, { ...HARA, x: 240, y: GROUND, s: 1.1, t: ctx.T, mood: 'worried', armPose: 'think', blink: blinkAt(ctx.T, 2) });
    label(c, 'CAR PARTS', 760, GROUND - 340, 780, 800, clamp((t - 0.6) / 0.4), { size: 52 });
  },
  // 2: barcodes held too little - a worker scans box after box
  scan(c, t, beat, ctx) {
    c.drawImage(factory(), 0, 0);
    crate(c, 760, GROUND - 150, 3);
    const tgt = [120, 20], o = { ...WORKER, x: 300, y: GROUND, s: 1.15, t: ctx.T, mood: 'sad', armPose: { l: [22, 135], r: tgt }, look: [1, 0], blink: blinkAt(ctx.T, 3) };
    human(c, o);
    const [hx, hy] = handR(o, tgt), row = Math.floor(t * 2.2) % 3, ty = GROUND - 150 - 153 + row * 56;
    box(c, hx - 10, hy - 26, 90, 46, '#3B3F46', { r: 12, k: 0.15 }); box(c, hx - 4, hy + 16, 34, 60, '#3B3F46', { r: 10, k: 0.15 });      // hand scanner
    c.strokeStyle = '#E0453A'; c.lineWidth = 7; c.beginPath(); c.moveTo(hx + 80, hy - 4); c.lineTo(660, ty); c.stroke();
    c.save(); c.globalAlpha = 0.5; c.fillStyle = '#E0453A'; c.fillRect(660, ty - 20, 200, 40); c.restore();
    for (let i = 0; i < 3; i++) popWord(c, 'BEEP', 560 + i * 150, 820 - i * 70, clamp((t - 0.3 - i * 0.45) / 0.25), 60, i === 1 ? PAL.gold : '#FFFFFF');
  },
  // 3: playing Go at lunch - stones land on the grid one by one
  go(c, t, beat, ctx) {
    c.drawImage(canteen(), 0, 0);
    code(c, 700, 1000, 540, { m: 0, shown: clamp(t / 2.6) });
    human(c, { ...HARA, x: 230, y: GROUND, s: 0.85, t: ctx.T, mood: t > 2.4 ? 'grin' : 'neutral', armPose: t > 2.4 ? 'cheer' : 'think', look: [1, -0.5], blink: blinkAt(ctx.T, 4) });
    label(c, 'BLACK + WHITE = DATA', 700 + 150, 1000 - 200, 640, 620, clamp((t - 2.8) / 0.4), { size: 50 });
  },
  // 4: three corner squares - stones become square modules, corners light up, the code spins and still reads
  corners(c, t, beat, ctx) {
    c.drawImage(canteen(), 0, 0);
    const m = easeInOut(clamp(t / 0.7)), rot = easeInOut(clamp((t - 1.5) / 1.2)) * Math.PI / 2;
    code(c, 540, 1010, 600, { m, hi: t > 0.7 ? 1 : 0, rot });
    if (t > 0.7 && t < 1.5) { label(c, 'CORNER SQUARES', 540 - 300 + 100, 1010 - 300 + 100, 300, 600, clamp((t - 0.7) / 0.3), { size: 52 }); }
    if (t > 1.5) { const sy = 1010 - 300 + (((t - 1.5) * 600) % 600); c.save(); c.globalAlpha = 0.85; c.fillStyle = '#35D07F'; c.fillRect(540 - 320, sy, 640, 10); c.restore(); popWord(c, 'ANY ANGLE', 540, 600, clamp((t - 1.7) / 0.3), 80, PAL.gold); }
  },
  // 5: free for everyone
  free(c, t, beat, ctx) {
    c.drawImage(room(), 0, 0);
    code(c, 700, 1040, 440, { m: 1 });
    human(c, { ...HARA, x: 230, y: GROUND, s: 1.1, t: ctx.T, mood: 'grin', armPose: 'present', blink: blinkAt(ctx.T, 5) });
    const k = easeOutBack(clamp((t - 0.4) / 0.35));
    if (k > 0) { c.save(); c.translate(700, 720); c.rotate(-0.1); c.scale(k, k); box(c, -170, -70, 340, 140, '#35B56A', { r: 20, k: 0.15 }); c.font = '900 100px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('FREE', 0, 6); c.restore(); }
  },
  // 6 payoff: back to the hook (loop) - question + subscribe
  payoff(c, t, beat, ctx) {
    c.drawImage(room(), 0, 0);
    hookLayout(c, t, ctx, 0.72, 'grin', 1245, 290);
  },
};

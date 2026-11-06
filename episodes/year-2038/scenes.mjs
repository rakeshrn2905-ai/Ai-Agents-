// Bespoke scenes for "In 2038, Some Clocks Will Hit 1901" (the Year 2038 problem).
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade, tint } from '../../lib/draw.mjs';
import { objChar, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const BEIGE = '#E9DDBE', SCREEN = '#CFEFD8', SEPIA = '#E8C99A';
const MAX = 2147483647;
const fmt = (n) => (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-GB');

// computer character: CRT monitor, text on the top half of the screen, face on the bottom half
BODIES.computer = (c, col) => {
  box(c, -175, -420, 350, 290, BEIGE, { r: 24, k: 0.18 });
  box(c, -145, -395, 290, 220, col.screenBg || SCREEN, { r: 14, lw: 6, k: 0 });
  if (col.screen) {
    c.font = `900 ${col.screenSize || 64}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = col.screenInk || '#1F6F4A'; c.fillText(col.screen, 0, -345);
  }
  if (col.hat) { // 1901 top hat on the monitor
    box(c, -70, -560, 140, 130, INK, { r: 8, k: 0.1, stroke: INK });
    box(c, -70, -470, 140, 22, '#C8382C', { r: 4, lw: 4, k: 0 });
    box(c, -120, -440, 240, 26, INK, { r: 10, k: 0 });
  }
  box(c, -40, -130, 80, 40, shade(BEIGE, 0.1), { r: 6 });   // neck
  box(c, -130, -95, 260, 36, BEIGE, { r: 12 });             // foot
  return { face: [0, -235, 30], shL: [-175, -270], shR: [175, -270], hipL: [-60, -62], hipR: [60, -62], top: [0, -420], tip: [0, -420] };
};

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const room = () => once('room', (c) => { // bright, saturated computer room (hook + loop)
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#3FA7D6'); g.addColorStop(1, '#7CCBE8');
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  for (let x = 40; x < W; x += 160) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, 0, 60, GROUND); } // stripes
  box(c, 0, GROUND - 120, W, 120, '#F2B33D', { r: 0, k: 0.15 });  // desk top
  c.fillStyle = '#E0663F'; c.fillRect(0, GROUND, W, H - GROUND);
  c.strokeStyle = shade('#E0663F', 0.2); c.lineWidth = 4;
  for (let y = GROUND + 90; y < H; y += 110) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const grid = () => once('grid', (c) => {
  c.fillStyle = '#1F2A44'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(95,220,160,0.13)'; c.lineWidth = 2;
  for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
});

function calendar(c, x, y, year, k = 1, col = '#FFFFFF') { // wall calendar page
  c.save(); c.translate(x, y); c.scale(k, k);
  box(c, -150, -170, 300, 340, col, { r: 14, k: 0.06 });
  box(c, -150, -170, 300, 80, '#C8382C', { r: 14, k: 0 });
  for (const rx of [-80, 80]) ell(c, rx, -170, 14, 14, '#7A7A7A', { lw: 4, k: 0 });
  c.font = '900 110px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(String(year), 0, 40);
  c.restore();
}
function counter(c, value, y, { size = 92, label: lab, col = '#5FDCA0' } = {}) { // big digital counter
  const txt = fmt(value);
  c.save(); c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = Math.min(W - 80, c.measureText(txt).width + 80);
  box(c, (W - w) / 2, y - size * 0.8, w, size * 1.6, '#0F1626', { r: 20, lw: 7, k: 0 });
  c.fillStyle = col; c.fillText(txt, W / 2, y + 4);
  if (lab) { c.font = '900 44px "Noto Sans"'; c.fillStyle = '#FFFFFF'; c.fillText(lab, W / 2, y - size * 0.8 - 44); }
  c.restore();
}
function glitch(c, src, t, amt) { // horizontal slice jitter + sepia wash
  for (let i = 0; i < 14; i++) {
    const y = ((i * 137 + Math.floor(t * 30) * 59) % H), h = 30 + (i * 31) % 90, dx = Math.sin(t * 50 + i) * 60 * amt;
    c.drawImage(src, 0, y, W, h, dx, y, W, h);
  }
  c.save(); c.globalAlpha = 0.35 * amt; c.fillStyle = '#B8875A'; c.fillRect(0, 0, W, H); c.restore();
}

export const SCENES = {
  // 0 hook: the computer is already wearing a 1901 top hat; its screen glitches 2038 -> 1901
  y2038hook(c, t, beat, ctx) {
    c.drawImage(room(), 0, 0);
    calendar(c, 860, 1000, Math.floor(t * 10) % 2 ? 1901 : 2038, 0.75, SEPIA);
    objChar(c, { body: 'computer', colors: { screen: '1901', screenBg: SEPIA, screenInk: '#6B3E22', hat: true }, x: 380, y: GROUND - 110 - Math.max(0, 1 - t / 0.25) * 60, s: 1.25, t: ctx.T, mood: 'shock', armPose: 'shrug', legPose: t < 0.25 ? 'jump' : 'stand' });
    if (t > 0.25) burst(c, 380, GROUND - 120, 170, t - 0.25, 10, '#FFFFFF');
  },
  // 1: "in 2038" - the calendar slams onto the wall
  calendar2038(c, t, beat, ctx) {
    c.drawImage(room(), 0, 0);
    calendar(c, 540, 760, 2038, 1.35 * easeOutBack(t / 0.35));
    objChar(c, { body: 'computer', colors: { screen: '2038' }, x: 280, y: GROUND - 110, s: 0.8, t: ctx.T, mood: 'worried', armPose: 'point' });
  },
  // 2: seconds since 1970, counting up fast
  seconds(c, t, beat, ctx) {
    c.drawImage(grid(), 0, 0);
    const v = Math.floor(lerp(0, 1.7e9, easeInOut(clamp(t / 3))));
    counter(c, v, 640, { label: 'SECONDS SINCE 1970' });
    objChar(c, { body: 'computer', colors: { screen: '1, 2, 3...', screenSize: 52 }, x: 540, y: 1360, s: 1.05, t: ctx.T, mood: 'grin', armPose: 'hips' });
  },
  // 3: the 32 bits - boxes light up one by one
  bits(c, t, beat, ctx) {
    c.drawImage(grid(), 0, 0);
    const on = Math.floor(clamp(t / 1.6) * 32);
    for (let i = 0; i < 32; i++) {
      const col = i % 8, row = Math.floor(i / 8), x = 130 + col * 105, y = 560 + row * 130;
      box(c, x, y, 90, 110, i < on ? '#5FDCA0' : '#33415F', { r: 12, lw: 5, k: 0 });
      c.font = '900 64px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = i < on ? '#0F1626' : '#5B6A88'; c.fillText(i < on ? '1' : '0', x + 45, y + 58);
    }
  },
  // 4: the ceiling: just over 2 billion
  maxvalue(c, t, beat, ctx) {
    c.drawImage(grid(), 0, 0);
    counter(c, MAX, 760, { label: 'THE BIGGEST IT CAN HOLD', col: '#FFD166' });
    objChar(c, { body: 'computer', colors: { screen: 'FULL!', screenSize: 60 }, x: 540, y: 1360, s: 1.05, t: ctx.T, mood: 'worried', armPose: 'shrug' });
  },
  // 5: 19 Jan 2038 03:14 - the last seconds tick down
  countdown(c, t, beat, ctx) {
    c.drawImage(room(), 0, 0);
    calendar(c, 860, 1000, 2038, 0.75);
    const v = MAX - 3 + Math.min(3, Math.floor(t * 1.2));
    counter(c, v, 500, { size: 70, col: '#FFD166' });
    objChar(c, { body: 'computer', colors: { screen: '03:14:0' + (4 + Math.min(3, Math.floor(t * 1.2))), screenSize: 56 }, x: 380, y: GROUND - 110, s: 1.25, t: ctx.T, mood: 'worried', armPose: 'shrug', lean: Math.sin(t * 20) * 2 });
  },
  // 6: overflow - flips negative, glitch, back to 1901 (the top hat pops on)
  overflow(c, t, beat, ctx) {
    const flipAt = beat.flipAt ?? 0.5, flipped = t > flipAt;
    c.drawImage(room(), 0, 0);
    calendar(c, 860, 1000, flipped ? 1901 : 2038, 0.75, flipped ? SEPIA : '#FFFFFF');
    counter(c, flipped ? -MAX - 1 : MAX, 500, { size: 70, col: flipped ? '#FF6B6B' : '#FFD166' });
    objChar(c, { body: 'computer', colors: flipped ? { screen: '1901', screenBg: SEPIA, screenInk: '#6B3E22', hat: t > flipAt + 0.6 } : { screen: '03:14:07', screenSize: 56 }, x: 380, y: GROUND - 110, s: 1.25, t: ctx.T, mood: flipped ? 'shock' : 'worried', armPose: flipped ? 'cheer' : 'shrug' });
    if (flipped && t < flipAt + 0.6) glitch(c, room(), t, 1 - (t - flipAt) / 0.6); // the room itself jitters for a moment
  },
  // 7 payoff: same room as the hook (loop). Layout keeps 560-820 free for the engine's CTA text.
  payoff(c, t, beat, ctx) {
    c.drawImage(room(), 0, 0);
    calendar(c, 860, 1000, 2038, 0.75);
    objChar(c, { body: 'computer', colors: { screen: '2038 :)', screenSize: 56 }, x: 380, y: GROUND - 110, s: 1.1, t: ctx.T, mood: 'chuckle', armPose: 'wave' });
  },
};

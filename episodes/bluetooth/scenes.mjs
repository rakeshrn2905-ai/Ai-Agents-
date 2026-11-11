// Bespoke scenes for "Bluetooth Is Named After a Viking King" (Harald Bluetooth, 10th century).
// Rakesh: no object characters with faces here - real people only (Harald, Vikings, the engineer). No horned helmets, no fighting.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade } from '../../lib/draw.mjs';
import { human } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const K = 190 / 150, BLUE = '#2D6FCC', SEA = '#2B9FD8', SEA_L = '#5CC1EC';
const blinkAt = (T, x) => (((T * 0.37 + (x % 7) / 7) % 1) > 0.96 ? 1 : 0);
const HARALD = { costume: { coat: '#B5452F', trim: PAL.gold, trousers: '#6E5A3A' }, hair: { style: 'short', color: '#C9772E' }, beard: { color: '#C9772E' }, hat: { style: 'crown', color: PAL.gold } };
const viking = (coat, hairCol) => ({ costume: { coat, trim: '#E9E2D2', trousers: '#6E5A3A' }, hair: { style: 'short', color: hairCol }, beard: { color: hairCol }, hat: { style: 'gi', color: '#B8C2C9' } });
const ENGINEER = { costume: { coat: '#4E9A6A', trim: '#FFFFFF', trousers: '#3A4A6A' }, hair: { style: 'short', color: '#5A3B22' } };

function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
/** King Harald: blue cloak behind, crown, red beard. opts.buds = white wireless earbuds. Returns nothing. */
function harald(c, ctx, o) {
  const s = o.s ?? 1;
  c.save(); c.translate(o.x, o.y); c.scale(s, s);
  cel(c, (c) => { c.moveTo(-70, -385); c.lineTo(70, -385); c.lineTo(130, -110); c.quadraticCurveTo(0, -80, -130, -110); c.closePath(); }, BLUE, [-130, -385, 260, 300], { k: 0.2 }); // cloak
  c.restore();
  human(c, { ...HARALD, t: ctx.T, blink: blinkAt(ctx.T, o.x), ...o });
  c.save(); c.translate(o.x, o.y); c.scale(s, s);
  box(c, -78, -402, 156, 30, '#D9D2C2', { r: 14, lw: 5, k: 0.1 });                          // fur collar
  ell(c, 56, -386, 15, 15, PAL.gold, { lw: 4, k: 0.2 });                                    // brooch
  if (o.buds) for (const sx of [-1, 1]) { ell(c, sx * 66, -462, 11, 14, '#FFFFFF', { lw: 4, k: 0 }); box(c, sx * 66 - 5, -452, 10, 28, '#FFFFFF', { r: 5, lw: 4, k: 0 }); }
  c.restore();
}
/** Hand position of a human for a pose target [tx, ty] (150-unit pose coords), right hand. */
const handR = (o, tgt) => [o.x + (56 + tgt[0] * K) * (o.s ?? 1), o.y + (-360 + tgt[1] * K) * (o.s ?? 1)];
const handL = (o, tgt) => [o.x + (-56 - tgt[0] * K) * (o.s ?? 1), o.y + (-360 + tgt[1] * K) * (o.s ?? 1)];
function phone(c, x, y, s, glow = 0) { // modern smartphone, no face
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -34, -70, 68, 140, '#2A2622', { r: 14, k: 0 }); box(c, -27, -60, 54, 112, '#7FD0F5', { r: 8, lw: 0, k: 0 });
  if (glow > 0) for (let i = 0; i < 3; i++) { const ph = (glow * 1.4 + i / 3) % 1; c.save(); c.globalAlpha = 1 - ph; c.strokeStyle = '#FFFFFF'; c.lineWidth = 7; c.beginPath(); c.arc(0, -70, 30 + ph * 70, -Math.PI * 0.85, -Math.PI * 0.15); c.stroke(); c.restore(); }
  c.restore();
}
function shield(c, x, y, r, col) {
  ell(c, x, y, r, r, col, { k: 0.18 }); ell(c, x, y, r * 0.3, r * 0.3, '#C9D3DE', { lw: 5, k: 0.2 });
  c.strokeStyle = 'rgba(42,38,34,0.5)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke();
}
function longship(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -10, -520, 20, 440, '#7A4A2A', { r: 6, k: 0.2 });                                  // mast
  cel(c, (c) => { c.moveTo(-200, -500); c.lineTo(200, -500); c.quadraticCurveTo(230, -340, 200, -180); c.lineTo(-200, -180); c.quadraticCurveTo(-170, -340, -200, -500); c.closePath(); }, '#F6EBD2', [-200, -500, 400, 320], { k: 0.1 });
  c.save(); c.beginPath(); c.moveTo(-200, -500); c.lineTo(200, -500); c.quadraticCurveTo(230, -340, 200, -180); c.lineTo(-200, -180); c.quadraticCurveTo(-170, -340, -200, -500); c.clip();
  c.fillStyle = '#D9303A'; for (let i = 0; i < 4; i++) c.fillRect(-220 + i * 120, -500, 60, 320); c.restore();     // striped sail
  cel(c, (c) => { c.moveTo(-330, -120); c.quadraticCurveTo(-390, -260, -330, -300); c.quadraticCurveTo(-300, -160, -240, -90); c.lineTo(240, -90); c.quadraticCurveTo(300, -160, 330, -300); c.quadraticCurveTo(390, -260, 330, -120); c.quadraticCurveTo(200, 30, 0, 30); c.quadraticCurveTo(-200, 30, -330, -120); c.closePath(); }, '#9C6A3E', [-390, -300, 780, 330], { k: 0.2 });
  for (let i = 0; i < 5; i++) shield(c, -200 + i * 100, -70, 38, ['#D9303A', '#E0A63A', '#3E9A4A', '#2D6FCC', '#D9303A'][i]);
  c.restore();
}
/** Rune strokes. kind 'H' = stave + X (Hagall), 'B' = stave + two points (Bjarkan). */
function rune(c, x, y, h, kind, col = '#FFFFFF', lw = 16) {
  const w = h * 0.5;
  c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  c.moveTo(x, y - h); c.lineTo(x, y + h);
  if (kind === 'H') { c.moveTo(x - w, y - h / 2); c.lineTo(x + w, y + h / 2); c.moveTo(x - w, y + h / 2); c.lineTo(x + w, y - h / 2); }
  else { c.moveTo(x, y - h); c.lineTo(x + w, y - h / 2); c.lineTo(x, y); c.lineTo(x + w, y + h / 2); c.lineTo(x, y + h); }
  c.stroke();
}

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const floor = (c, col) => { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); };
const skyG = (c, to = GROUND) => { const g = c.createLinearGradient(0, 0, 0, to); g.addColorStop(0, '#4FB0E8'); g.addColorStop(1, '#C9ECF8'); c.fillStyle = g; c.fillRect(0, 0, W, to);
  c.fillStyle = '#FFFFFF'; for (const [x, y, r] of [[140, 600, 46], [200, 580, 60], [265, 605, 42]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } };
const harbour = () => once('harbour', (c) => {
  skyG(c, 1150); c.fillStyle = SEA_L; c.fillRect(0, 1100, W, GROUND - 1100); c.fillStyle = SEA; c.fillRect(0, 1200, W, GROUND - 1200);
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 6; for (let i = 0; i < 9; i++) { const x = (i * 197) % W, y = 1230 + (i * 53) % 150; c.beginPath(); c.arc(x, y, 24, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  longship(c, 800, 1260, 0.62);
  c.fillStyle = '#C9A46A'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = shade('#C9A46A', 0.25); c.lineWidth = 5; for (let x = 0; x < W; x += 150) { c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, H); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const hall = () => once('hall', (c) => {
  c.fillStyle = '#E8B978'; c.fillRect(0, 0, W, GROUND);
  c.strokeStyle = 'rgba(120,70,30,0.35)'; c.lineWidth = 8; for (let x = 0; x < W; x += 130) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GROUND); c.stroke(); }
  for (const [x, col] of [[150, '#D9303A'], [930, '#3E9A4A']]) shield(c, x, 760, 80, col);
  box(c, 380, 760, 320, GROUND - 760, '#8A5A34', { r: 16, k: 0.18 }); box(c, 350, 700, 380, 80, '#7A4A2A', { r: 20, k: 0.18 });   // throne back
  for (const x of [372, 708]) ell(c, x, 700, 34, 34, PAL.gold, { k: 0.2 });
  floor(c, '#B07A45');
});
const meadow = () => once('meadow', (c) => {
  skyG(c); ell(c, 250, 1250, 560, 240, '#8FD06A', { k: 0, lw: 6 }); ell(c, 880, 1270, 520, 240, '#7CC45A', { k: 0, lw: 6 });
  c.fillStyle = '#6DBB4C'; c.fillRect(0, GROUND - 100, W, H - GROUND + 100); c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(0, GROUND - 100); c.lineTo(W, GROUND - 100); c.stroke();
});
const office = () => once('office', (c) => {
  c.fillStyle = '#F2E2C4'; c.fillRect(0, 0, W, GROUND);
  box(c, 660, 520, 300, 260, '#BFE6F5', { r: 8, k: 0 }); c.strokeStyle = '#FFFFFF'; c.lineWidth = 12; for (let y = 560; y < 780; y += 44) { c.beginPath(); c.moveTo(660, y); c.lineTo(960, y); c.stroke(); } // blinds
  box(c, 90, 540, 220, 160, '#FFFFFF', { r: 6, k: 0.05 }); c.fillStyle = PAL.coral; c.fillRect(90, 540, 220, 44);                    // wall calendar
  floor(c, '#9FB8C8');
});
function desk(c) { box(c, 520, GROUND - 330, 520, 40, '#C98B5E', { r: 8, k: 0.15 }); for (const x of [560, 990]) box(c, x, GROUND - 292, 30, 292, '#A8703E', { r: 4, k: 0.15 }); }
function oldPC(c, x, y) { box(c, x - 110, y - 200, 220, 170, '#E3DAC4', { r: 14, k: 0.15 }); box(c, x - 86, y - 180, 172, 120, '#3F8FD6', { r: 8, lw: 5, k: 0 }); box(c, x - 40, y - 34, 80, 34, '#D2C8B0', { r: 4, lw: 5, k: 0 }); }

export const SCENES = {
  // 0 hook: a Viking king on a sunny harbour, wireless earbuds in, phone in his hand
  vhook(c, t, beat, ctx) {
    c.drawImage(harbour(), 0, 0);
    const tgt = [110, 10 + Math.sin(t * 6) * 6], o = { x: 400, y: GROUND - Math.abs(Math.sin(t * 6)) * 14, s: 1.15, mood: 'grin', armPose: { l: [45, 40], r: tgt }, buds: true };
    harald(c, ctx, o);
    const [hx, hy] = handR(o, tgt); phone(c, hx + 6, hy - 50, 1.15, ctx.T);
    for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1, nx = 620 + i * 50, ny = 780 - ph * 120; c.save(); c.globalAlpha = 1 - ph; ell(c, nx, ny, 20, 15, PAL.gold, { lw: 5, k: 0, rot: -0.4 }); c.strokeStyle = INK; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(nx + 17, ny - 4); c.lineTo(nx + 17, ny - 70); c.lineTo(nx + 44, ny - 56); c.stroke(); c.restore(); }
  },
  // 1: a thousand years ago - King Harald in his hall
  king(c, t, beat, ctx) {
    c.drawImage(hall(), 0, 0);
    harald(c, ctx, { x: 540, y: GROUND, s: 1.15, mood: 'proud', armPose: 'hips' });
    for (const [i, x] of [150, 930].entries()) { const o = { ...viking(i ? '#3E7A4A' : '#7A4A6A', i ? '#5A3B22' : '#E0C27A'), x, y: GROUND, s: 0.85, t: ctx.T + i, mood: 'grin', armPose: 'cheer', blink: blinkAt(ctx.T, x), flip: !!i }; human(c, o); }
    popWord(c, 'DENMARK', 540, 580, clamp((t - 1.6) / 0.3), 76, PAL.gold);
  },
  // 2: he united Denmark and Norway - two sides, shields, the king joins them
  unite(c, t, beat, ctx) {
    c.drawImage(meadow(), 0, 0);
    const gap = lerp(200, 0, easeInOut(clamp((t - 0.4) / 1.0)));
    for (const [i, sx] of [-1, 1].entries()) {
      const x = 540 + sx * (330 + gap), tgt = [100, 20];
      const o = { ...viking(i ? '#3E7A4A' : '#B5452F', i ? '#5A3B22' : '#E0C27A'), x, y: GROUND - 60, s: 0.9, t: ctx.T + i, mood: t > 1.4 ? 'grin' : 'neutral', armPose: i ? { l: tgt, r: [22, 135] } : { l: [22, 135], r: tgt }, blink: blinkAt(ctx.T, x) };
      human(c, o);
      const [sx2, sy2] = i ? handL(o, tgt) : handR(o, tgt); shield(c, sx2 - sx * 10, sy2, 78, i ? '#3E9A4A' : '#D9303A');
      label(c, i ? 'NORWAY' : 'DENMARK', x, GROUND - 60 - 600 * 0.9, i ? W - 220 : 220, 640, clamp((t - 0.2 - i * 0.3) / 0.4), { size: 52 });
    }
    harald(c, ctx, { x: 540, y: GROUND - 20, s: 1.0, mood: 'proud', armPose: 'cheer' });
    if (t > 1.4) burst(c, 540, GROUND - 560, 95, t - 1.4, 10, PAL.gold);
  },
  // 3: the 1990s - an engineer reading a book about Vikings
  engineer(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0); desk(c); oldPC(c, 800, GROUND - 330);
    const tgt = [100, 0], o = { ...ENGINEER, x: 300, y: GROUND, s: 1.15, t: ctx.T, mood: 'neutral', armPose: { l: [30, 110], r: tgt }, look: [1, 0.5], blink: blinkAt(ctx.T, 2) };
    human(c, o);
    const [hx, hy] = handR(o, tgt);
    box(c, hx - 30, hy - 120, 150, 180, '#8A3B4A', { r: 8, k: 0.15 }); box(c, hx - 12, hy - 100, 114, 140, '#F6EBD2', { r: 4, lw: 4, k: 0 });  // book, held in the hand
    shield(c, hx + 45, hy - 30, 36, '#D9303A');
    label(c, 'VIKING HISTORY', hx + 45, hy - 120, 620, 760, clamp((t - 1.0) / 0.4), { size: 50 });
  },
  // 4: unite phones and computers without wires
  link(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    box(c, 0, 0, W, GROUND, 'rgba(242,226,196,0.85)', { r: 0, lw: 0, k: 0 });
    c.save(); c.translate(250, 1080); c.scale(1.5, 1.5); box(c, -44, -110, 88, 220, '#3B3F46', { r: 16, k: 0.15 }); box(c, -32, -90, 64, 70, '#9FE0C8', { r: 6, lw: 4, k: 0 });
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) ell(c, -22 + q * 22, 2 + r * 24, 7, 7, '#C9D3DE', { lw: 0, k: 0 }); box(c, 20, -170, 10, 64, '#3B3F46', { r: 4, lw: 4, k: 0 }); c.restore(); // 1990s mobile
    box(c, 640, 880, 320, 220, '#E3DAC4', { r: 14, k: 0.15 }); box(c, 664, 904, 272, 172, '#3F8FD6', { r: 8, lw: 5, k: 0 }); box(c, 600, 1100, 400, 50, '#D2C8B0', { r: 10, k: 0.15 }); // laptop
    for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i / 4) % 1; c.save(); c.globalAlpha = Math.sin(ph * Math.PI); c.strokeStyle = BLUE; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.arc(lerp(330, 620, ph), 1000, 60, -0.9, 0.9); c.stroke(); c.restore(); }
    label(c, 'NO WIRES', 480, 1000, 540, 720, clamp((t - 1.6) / 0.4), { size: 56 });
  },
  // 5: so he borrowed the king's name
  name(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0); desk(c); oldPC(c, 800, GROUND - 330);
    human(c, { ...ENGINEER, x: 300, y: GROUND - Math.abs(Math.sin(t * 7)) * 20, s: 1.15, t: ctx.T, mood: 'grin', armPose: 'cheer', blink: 0 });
    popWord(c, '"BLUETOOTH!"', 600, 700, clamp((t - 0.2) / 0.3), 84, PAL.gold);
  },
  // 6: the logo - H and B runes on a runestone slide together into one symbol
  runes(c, t, beat, ctx) {
    c.drawImage(meadow(), 0, 0);
    cel(c, (c) => { c.moveTo(250, GROUND - 60); c.quadraticCurveTo(200, 700, 420, 640); c.quadraticCurveTo(640, 580, 800, 700); c.quadraticCurveTo(900, 900, 840, GROUND - 60); c.closePath(); }, '#9AA3A8', [220, 600, 660, 780], { k: 0.18 });
    const m = easeInOut(clamp((t - 1.6) / 0.9)), cy = 1000, h = 150;
    rune(c, lerp(400, 540, m), cy, h, 'H', m >= 1 ? '#FFFFFF' : '#FFE9A8'); rune(c, lerp(680, 540, m), cy, h, 'B', m >= 1 ? '#FFFFFF' : '#BFE6F5');
    if (m < 0.2) { popWord(c, 'H', 400, cy + 230, clamp((t - 0.4) / 0.3), 80, PAL.gold); popWord(c, 'B', 680, cy + 230, clamp((t - 0.8) / 0.3), 80); }
    if (m >= 1) { burst(c, 540, cy, 260, t - 2.5, 14, '#FFFFFF'); label(c, 'H + B', 540 + 75, cy - 75, W - 190, 700, clamp((t - 2.6) / 0.4), { size: 60 }); }
  },
  // 7 payoff: back on the harbour (loop) - Harald dances to his music
  payoff(c, t, beat, ctx) {
    c.drawImage(harbour(), 0, 0);
    const tgt = [110, 10 + Math.sin(t * 6) * 6], o = { x: 400, y: GROUND - Math.abs(Math.sin(t * 6)) * 14, s: 0.7, mood: 'chuckle', armPose: { l: [70, -100], r: tgt }, buds: true };
    harald(c, ctx, o);
    const [hx, hy] = handR(o, tgt); phone(c, hx + 5, hy - 36, 0.75, ctx.T);
  },
};

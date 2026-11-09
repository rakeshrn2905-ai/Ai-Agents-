// Bespoke scenes for "Treadmills Began as a Prison Punishment" (William Cubitt's treadwheel, 1818).
// Taste: friendly cartoon prisoners in plain grey, no injuries; the ball and chain is a comic 'prison' symbol.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade } from '../../lib/draw.mjs';
import { human } from '../../lib/chars.mjs';
import { face } from '../../lib/face.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const WOOD = '#B07A45', GREY = '#A9B2BA', STONE = '#E2D3B5';
const PRISONER = { costume: { coat: GREY, trim: '#6E7881', trousers: '#C9CFD4' }, hat: { style: 'cap', color: '#7C868F' }, hair: { style: 'short', color: '#5A3B22' } };
const CUBITT = { costume: { coat: '#2D3E5C', trim: PAL.gold, trousers: '#E9E2D2' }, hat: { style: 'top', color: '#2A2622' }, hair: { style: 'short', color: '#8A5A34' } };
const RUNNER = { costume: { coat: '#E0453A', trim: '#FFFFFF', trousers: '#2D3E5C' }, hair: { style: 'curly', color: '#3B2A1E' } };
const blinkAt = (T, x) => (((T * 0.37 + (x % 7) / 7) % 1) > 0.96 ? 1 : 0);

function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
/** Gym treadmill (origin = floor under the belt centre); returns the belt top y. */
function treadmill(c, x, y, s, t, { chain = true, mood = 'shock' } = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -300, -110, 600, 90, '#3B3F46', { r: 30, k: 0.15 });                        // deck
  c.fillStyle = '#23262B'; c.fillRect(-270, -110, 540, 18);
  c.strokeStyle = '#5A606A'; c.lineWidth = 6; for (let i = 0; i < 9; i++) { const bx = -270 + ((i * 64 - t * 380) % 540 + 540) % 540; c.beginPath(); c.moveTo(bx, -108); c.lineTo(bx + 20, -94); c.stroke(); } // belt moving
  box(c, -300, -30, 40, 30, '#2A2622', { r: 6, lw: 4, k: 0 }); box(c, 260, -30, 40, 30, '#2A2622', { r: 6, lw: 4, k: 0 });
  c.strokeStyle = INK; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(250, -100); c.lineTo(300, -560); c.stroke();
  c.strokeStyle = '#C9D3DE'; c.lineWidth = 12; c.stroke();
  box(c, 210, -660, 220, 130, '#3B3F46', { r: 18, k: 0.1 });                            // console with a face
  box(c, 228, -644, 184, 98, '#9FE0C8', { r: 12, lw: 5, k: 0 });
  face(c, 320, -598, 24, { mood, blink: blinkAt(t, 3) });
  if (chain) { // comic ball and chain on the back foot
    c.strokeStyle = '#6E6E6E'; c.lineWidth = 8;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(-310 - i * 26, -12 + i * 4, 14, 9, 0, 0, Math.PI * 2); c.stroke(); }
    ell(c, -480, 0 - 40, 50, 50, '#3B3B3B', { k: 0.2 });
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 6; c.beginPath(); c.arc(-490, -50, 26, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
  }
  c.restore();
  return y - 110 * s;
}
/** Penal treadwheel: big wooden wheel with step slats round the rim, turning. */
function wheel(c, cx, cy, R, t, speed = 0.6) {
  box(c, cx - 30, cy - 10, 60, GROUND - cy + 10, shade(WOOD, 0.2), { r: 8, k: 0.15 });     // stand
  ell(c, cx, cy, R, R, WOOD, { k: 0.18 });
  ell(c, cx, cy, R - 60, R - 60, '#D2A26E', { lw: 6, k: 0 });
  const a0 = -t * speed;
  for (let i = 0; i < 18; i++) { // spokes + step slats
    const a = a0 + i * Math.PI * 2 / 18;
    if (i % 3 === 0) { c.strokeStyle = shade(WOOD, 0.3); c.lineWidth = 14; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 60), cy + Math.sin(a) * (R - 60)); c.stroke(); }
    c.save(); c.translate(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10)); c.rotate(a);
    box(c, -18, -34, 36, 68, '#8A5A34', { r: 6, lw: 5, k: 0 }); c.restore();
  }
  ell(c, cx, cy, 40, 40, '#6E6E6E', { k: 0.2 });
}
/** A prisoner stepping on top of the wheel, hands on a rail above. */
function stepper(c, ctx, x, footY, s, mood = 'worried') {
  c.strokeStyle = INK; c.lineWidth = 16; c.lineCap = 'round';
  const railY = footY - 470 * s;
  c.beginPath(); c.moveTo(x - 300, railY); c.lineTo(x + 300, railY); c.stroke(); c.strokeStyle = '#8A5A34'; c.lineWidth = 8; c.stroke();
  // hands on the rail: shoulders at (+-56, -360), rail at local y -470 -> offsets in 150-units (K = 190/150)
  const K = 190 / 150, dy = (-470 + 360) / K;
  human(c, { ...PRISONER, x, y: footY, s, t: ctx.T, mood, legPose: 'walk', armPose: { l: [10 / K, dy], r: [10 / K, dy] }, blink: blinkAt(ctx.T, x) });
}

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const gym = () => once('gym', (c) => {
  c.fillStyle = '#5CC8BE'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = '#FFD45A'; c.fillRect(0, 900, W, 70);                                    // wall stripe
  for (let i = 0; i < 6; i++) ell(c, 120 + i * 170, 1200, 60, 18, 'rgba(255,255,255,0.18)', { lw: 0, k: 0 }); // floor shine
  for (const [x, col] of [[90, '#E0453A'], [170, '#3A5BA8'], [250, '#E0A63A']]) { box(c, x - 34, 1040, 68, 22, '#5A5A5A', { r: 8, lw: 4, k: 0 }); ell(c, x - 40, 1051, 20, 30, col, { lw: 4, k: 0 }); ell(c, x + 40, 1051, 20, 30, col, { lw: 4, k: 0 }); } // dumbbells
  box(c, 40, 1080, 260, 20, '#5A5A5A', { r: 6, lw: 4, k: 0 });
  c.fillStyle = '#E9D9BE'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const yard = () => once('yard', (c) => { // bright 1818 prison yard
  const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#4FB0E8'); g.addColorStop(1, '#BFE6F5'); c.fillStyle = g; c.fillRect(0, 0, W, 900);
  c.fillStyle = STONE; c.fillRect(0, 700, W, GROUND - 700);
  c.strokeStyle = 'rgba(120,90,50,0.3)'; c.lineWidth = 4; for (let y = 700; y < GROUND; y += 70) for (let x = ((y / 70) % 2) * 60; x < W; x += 120) c.strokeRect(x, y, 116, 66);
  c.strokeStyle = INK; c.lineWidth = 7; c.strokeRect(-10, 700, W + 20, GROUND - 700);
  for (const x of [200, 540, 880]) { box(c, x - 50, 760, 100, 130, '#5B7FA3', { r: 50, lw: 6, k: 0 }); c.strokeStyle = INK; c.lineWidth = 6; for (let bx = x - 30; bx <= x + 30; bx += 20) { c.beginPath(); c.moveTo(bx, 770); c.lineTo(bx, 890); c.stroke(); } }
  c.fillStyle = '#C9B48A'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const mill = () => once('mill', (c) => {
  c.fillStyle = '#F0CF8E'; c.fillRect(0, 0, W, GROUND);
  c.strokeStyle = 'rgba(150,90,40,0.3)'; c.lineWidth = 6; for (let x = 0; x < W; x += 110) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GROUND); c.stroke(); }
  c.fillStyle = '#B07A45'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});

export const SCENES = {
  // 0 hook: a runner on a gym treadmill - and the treadmill wears a ball and chain
  thook(c, t, beat, ctx) {
    c.drawImage(gym(), 0, 0);
    const top = treadmill(c, 600, GROUND, 0.95, ctx.T, { chain: true, mood: 'shock' });
    human(c, { ...RUNNER, x: 530, y: top + 4, s: 1.0, t: ctx.T * 1.6, mood: 'shock', legPose: 'walk', armPose: { l: [40, 60], r: [40, 60] }, blink: blinkAt(ctx.T, 470) });
    if (t > 0.1) burst(c, 600 - 480 * 0.95, GROUND - 40, 90, (t - 0.1) % 0.8, 8, INK);
  },
  // 1: 1818 - William Cubitt walks into a prison yard
  cubitt(c, t, beat, ctx) {
    c.drawImage(yard(), 0, 0);
    const k = easeOut(clamp(t / 0.9));
    human(c, { ...CUBITT, x: lerp(-200, 540, k), y: GROUND, s: 1.25, t: ctx.T, mood: 'proud', legPose: k < 1 ? 'walk' : 'stand', armPose: k < 1 ? 'down' : 'hips', blink: blinkAt(ctx.T, 1) });
  },
  // 1b: ...saw prisoners sitting around doing nothing
  idle(c, t, beat, ctx) {
    c.drawImage(yard(), 0, 0);
    for (const [i, x] of [160, 380, 600].entries()) human(c, { ...PRISONER, x, y: GROUND, s: 0.85, t: ctx.T + i, mood: i === 1 ? 'smug' : 'neutral', armPose: i === 1 ? 'think' : 'hips', blink: blinkAt(ctx.T, x) });
    human(c, { ...CUBITT, x: 900, y: GROUND, s: 1.05, t: ctx.T, mood: 'angry', armPose: 'hips', flip: true, blink: 0 });
    for (const [x, d] of [[160, 0], [380, 0.4], [600, 0.8]]) popWord(c, 'Z', x + 70, GROUND - 640 * 0.85 - ((t + d) % 1.2) * 60, 1, 54, '#FFFFFF');
  },
  // 2: a giant wheel of steps that never ends (labelled cutaway)
  wheelbeat(c, t, beat, ctx) {
    c.drawImage(yard(), 0, 0);
    wheel(c, 540, 1180, 240, t);
    stepper(c, ctx, 540, 1180 - 250, 0.75);
    label(c, 'STEPS', 540 + 260 * Math.cos(-0.3), 1180 + 260 * Math.sin(-0.3), W - 160, 1250, clamp((t - 0.6) / 0.4), { size: 52 });
    label(c, 'HANDRAIL', 540 - 260, 1180 - 250 - 470 * 0.75, 200, 1050, clamp((t - 1.2) / 0.4), { size: 52 });
  },
  // 3: climbed it for hours - the sun races across the sky
  hours(c, t, beat, ctx) {
    c.drawImage(yard(), 0, 0);
    const a = Math.PI * (1 - clamp(t / 1.6));
    ell(c, 540 + Math.cos(a) * 420, 640 - Math.sin(a) * 130, 54, 54, '#FFD45A', { lw: 6, k: 0 });
    wheel(c, 540, 1180, 240, t, 1.4);
    stepper(c, ctx, 540, 1180 - 250, 0.75, 'sad');
    for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; c.save(); c.globalAlpha = 1 - ph; ell(c, 590 + i * 20, 1180 - 250 - 520 * 0.75 + ph * 60, 8, 12, '#9FD8F0', { lw: 3, k: 0 }); c.restore(); } // sweat drops
  },
  // 4: the wheel ground grain or pumped water
  grind(c, t, beat, ctx) {
    c.drawImage(mill(), 0, 0);
    wheel(c, 420, 1220, 200, t, 1.0);
    c.strokeStyle = INK; c.lineWidth = 18; c.beginPath(); c.moveTo(110, 1220); c.lineTo(830, 1220); c.stroke(); c.strokeStyle = '#8A8A8A'; c.lineWidth = 10; c.stroke(); // drive shaft both ways
    // right: millstone + flour
    c.save(); c.translate(830, 1080); c.rotate(-t * 1.0); ell(c, 0, 0, 140, 140, '#C9C2B0', { k: 0.18 }); c.strokeStyle = 'rgba(42,38,34,0.4)'; c.lineWidth = 6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i) * 130, Math.sin(i) * 130); c.stroke(); } c.restore();
    ell(c, 830, 1080, 28, 28, '#6E6E6E', { k: 0 });
    box(c, 860, GROUND - 120, 170, 120, '#E9D9BE', { r: 14, k: 0.15 });
    c.font = '900 40px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#8A5A34'; c.fillText('FLOUR', 945, GROUND - 46);
    for (let i = 0; i < 4; i++) { const ph = (t * 1.2 + i / 4) % 1; c.save(); c.globalAlpha = 1 - ph; ell(c, 945 + ph * 30, GROUND - 140 - ph * 110, 22 + ph * 16, 16 + ph * 10, '#FFFFFF', { lw: 0, k: 0 }); c.restore(); }
    label(c, 'GRAIN MILL', 830, 940, 820, 720, clamp((t - 0.3) / 0.4), { size: 52 });
    // left: water pump - pipe up from the shaft, spout pouring into a bucket
    box(c, 70, 960, 80, 260, '#5B7FA3', { r: 12, k: 0.15 }); box(c, 150, 960, 70, 36, '#5B7FA3', { r: 10, k: 0.15 });
    for (let i = 0; i < 6; i++) { const ph = (t * 2 + i / 6) % 1; ell(c, 205, 1000 + ph * 290, 11, 15, '#5CC1EC', { lw: 3, k: 0 }); }
    box(c, 150, GROUND - 120, 120, 120, '#9AA3A8', { r: 10, k: 0.15 }); ell(c, 210, GROUND - 120, 60, 14, '#5CC1EC', { lw: 4, k: 0 });
    label(c, 'WATER PUMP', 110, 960, 300, 870, clamp((t - 0.9) / 0.4), { size: 48 });
  },
  // 5: some wheels powered nothing - shaft runs into a wall
  nothing(c, t, beat, ctx) {
    c.drawImage(yard(), 0, 0);
    wheel(c, 420, 1180, 240, t, 1.0);
    stepper(c, ctx, 420, 1180 - 250, 0.75, 'angry');
    c.strokeStyle = INK; c.lineWidth = 18; c.beginPath(); c.moveTo(420, 1180); c.lineTo(860, 1180); c.stroke(); c.strokeStyle = '#8A8A8A'; c.lineWidth = 10; c.stroke();
    box(c, 860, 1120, 120, 120, '#E9E2D2', { r: 10, lw: 6, k: 0.1 });
    popWord(c, '?', 920, 1180, clamp((t - 0.4) / 0.3), 110, PAL.gold);
    label(c, 'CONNECTED TO NOTHING', 920, 1240, 760, 1360, clamp((t - 0.9) / 0.4), { size: 50 });
  },
  // 6: Britain stopped around 1900 - a CLOSED board slams onto the wheel
  closed(c, t, beat, ctx) {
    c.drawImage(yard(), 0, 0);
    wheel(c, 540, 1180, 240, 0, 0);
    const k = easeOutBack(clamp((t - 0.3) / 0.35));
    if (k > 0) { c.save(); c.translate(540, 1100); c.rotate(-0.12); c.scale(k, k); box(c, -260, -80, 520, 160, '#E0453A', { r: 14, k: 0.15 });
      c.font = '900 92px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('CLOSED', 0, 6); c.restore(); }
    if (t > 0.3) burst(c, 540, 1100, 300, t - 0.3, 12, INK);
  },
  // 7 payoff: back in the gym - the runner pays and runs, no chain now
  payoff(c, t, beat, ctx) {
    c.drawImage(gym(), 0, 0);
    const top = treadmill(c, 600, GROUND, 0.8, ctx.T, { chain: false, mood: 'grin' });
    human(c, { ...RUNNER, x: 540, y: top + 4, s: 0.8, t: ctx.T * 1.6, mood: 'grin', legPose: 'walk', armPose: { l: [40, 60], r: [40, 60] }, blink: blinkAt(ctx.T, 480) });
    const k = easeOutBack(clamp((t - 0.2) / 0.35));
    if (k > 0) { c.save(); c.translate(180, 1150); c.scale(k, k); box(c, -120, -70, 240, 140, '#FFFFFF', { r: 14, k: 0.06 }); c.font = '900 56px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = PAL.coral; c.fillText('GYM', 0, -18); c.fillStyle = INK; c.font = '900 40px "Noto Sans"'; c.fillText('PASS', 0, 36); c.restore(); }
  },
};

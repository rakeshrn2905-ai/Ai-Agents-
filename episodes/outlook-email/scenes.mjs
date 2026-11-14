// Bespoke scenes for "Outlook Went Down. Email Is 55 Years Old." (in the news, 12 Nov 2026 -> Ray Tomlinson, 1971).
// Human cast; objects have no faces. No Microsoft logo or screenshots: a generic envelope on a generic monitor.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade } from '../../lib/draw.mjs';
import { human } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const BLUE = '#2D7FD6', RED = '#E0453A';
const blinkAt = (T, x) => (((T * 0.37 + (x % 7) / 7) % 1) > 0.96 ? 1 : 0);
const WORKER = { costume: { coat: '#7A5BC8', trim: '#FFFFFF', trousers: '#3A4A6A' }, hair: { style: 'bun', color: '#3B2A1E' } };
const WORKER2 = { costume: { coat: '#2F9A8A', trim: '#FFFFFF', trousers: '#5A5A5A' }, hair: { style: 'short', color: '#C9772E' } };
const RAY = { costume: { coat: '#C98B3E', trim: '#FFFFFF', trousers: '#6E5A3A' }, hair: { style: 'short', color: '#5A3B22' }, beard: { color: '#5A3B22' } };

function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
function envelope(c, x, y, w, col = '#FFFFFF') {
  const h = w * 0.66; box(c, x - w / 2, y - h / 2, w, h, col, { r: w * 0.06, k: 0.06, lw: Math.max(4, w * 0.03) });
  c.strokeStyle = INK; c.lineWidth = Math.max(4, w * 0.03); c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x, y + h * 0.08); c.lineTo(x + w / 2, y - h / 2); c.stroke();
}
/** Modern monitor on a desk. state 'down' = envelope with a red cross, 'ok' = envelope with a green tick. */
function monitor(c, x, y, s, state, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -30, -70, 60, 70, '#8E9AA6', { r: 6, k: 0.15 }); box(c, -110, -14, 220, 22, '#8E9AA6', { r: 10, k: 0.15 });
  box(c, -230, -400, 460, 330, '#2A2622', { r: 22, k: 0 }); box(c, -210, -380, 420, 290, state === 'down' ? '#FFE3DE' : '#DDF3FF', { r: 10, lw: 0, k: 0 });
  envelope(c, 0, -240, 230);
  if (state === 'down') { const p = 1 + Math.sin(t * 10) * 0.08; c.strokeStyle = RED; c.lineWidth = 26 * p; c.lineCap = 'round'; c.beginPath(); c.moveTo(-70, -310); c.lineTo(70, -170); c.moveTo(70, -310); c.lineTo(-70, -170); c.stroke(); }
  else { c.strokeStyle = '#35B56A'; c.lineWidth = 26; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-60, -240); c.lineTo(-15, -190); c.lineTo(75, -300); c.stroke(); }
  c.restore();
}
function mainframe(c, x, y, t, col = '#8FB8C8') { // 1971 computer cabinet: tape reels + blinking lights (no face)
  box(c, x - 150, y - 620, 300, 620, col, { r: 14, k: 0.18 });
  for (const rx of [-70, 70]) { ell(c, x + rx, y - 500, 56, 56, '#F4EDE0', { k: 0.1 }); c.save(); c.translate(x + rx, y - 500); c.rotate(t * 2.5); c.strokeStyle = INK; c.lineWidth = 6; for (let i = 0; i < 3; i++) { c.rotate(Math.PI * 2 / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(46, 0); c.stroke(); } c.restore(); ell(c, x + rx, y - 500, 12, 12, INK, { lw: 0, k: 0 }); }
  box(c, x - 120, y - 400, 240, 150, '#2A2622', { r: 8, k: 0 });
  for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) ell(c, x - 95 + q * 38, y - 370 + r * 44, 11, 11, ((Math.floor(t * 4) + r * 3 + q * 5) % 4 === 0) ? '#FFD45A' : ((r + q) % 2 ? '#E0453A' : '#35B56A'), { lw: 0, k: 0 });
  box(c, x - 120, y - 220, 240, 180, shade(col, 0.15), { r: 8, lw: 5, k: 0 });
}

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const floor = (c, col) => { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); };
const office = () => once('office', (c) => {
  c.fillStyle = '#FFD86B'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = 'rgba(255,255,255,0.22)'; for (let x = 0; x < W; x += 200) c.fillRect(x, 0, 100, GROUND);
  box(c, 440, GROUND - 330, 620, 40, '#C98B5E', { r: 8, k: 0.15 }); for (const x of [480, 1000]) box(c, x, GROUND - 292, 30, 292, '#A8703E', { r: 4, k: 0.15 }); // desk
  floor(c, '#5CC8BE');
});
const lab = () => once('lab', (c) => { // 1971 computer lab, bright
  c.fillStyle = '#F6C98A'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = '#E8A85A'; c.fillRect(0, GROUND - 300, W, 300); c.strokeStyle = 'rgba(120,70,30,0.3)'; c.lineWidth = 6; for (let x = 0; x < W; x += 90) { c.beginPath(); c.moveTo(x, GROUND - 300); c.lineTo(x, GROUND); c.stroke(); } // wood panelling
  floor(c, '#B5653A');
});
const sheet = () => once('sheet', (c) => { c.fillStyle = BLUE; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 3; for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } });

function hookLayout(c, t, ctx, s, mood, down = true) {
  monitor(c, 750, GROUND - 330, s, down ? 'down' : 'ok', t);
  human(c, { ...WORKER, x: 300, y: GROUND, s: 1.05 * s, t: ctx.T, mood, armPose: down ? 'shrug' : 'cheer', look: [1, 0], blink: blinkAt(ctx.T, 1) });
}

export const SCENES = {
  // 0 hook: an office worker stares at a monitor - the email envelope has a big red cross
  ohook(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0); hookLayout(c, t, ctx, 1, 'shock');
    popWord(c, '12 NOV', 300, 620, clamp((t - 0.6) / 0.25), 70, PAL.gold);
  },
  // 1: but email itself is 55 years old - an envelope with a 1971 stamp, the years roll back
  old(c, t, beat, ctx) {
    c.drawImage(sheet(), 0, 0);
    const k = easeOutBack(clamp(t / 0.35));
    c.save(); c.translate(540, 1000); c.scale(k, k); c.rotate(Math.sin(t * 3) * 0.04); envelope(c, 0, 0, 620, '#FFF8E8');
    box(c, 150, -170, 120, 130, '#E0453A', { r: 8, lw: 5, k: 0.1 }); c.font = '900 44px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('1971', 210, -105); c.restore();
    const yr = Math.round(lerp(2026, 1971, easeInOut(clamp((t - 0.4) / 1.2))));
    popWord(c, String(yr), 540, 1340, clamp((t - 0.3) / 0.3), 130, PAL.gold);
  },
  // 2a: 1971 - engineer Ray Tomlinson in his lab
  ray(c, t, beat, ctx) {
    c.drawImage(lab(), 0, 0);
    mainframe(c, 220, GROUND, ctx.T); mainframe(c, 860, GROUND, ctx.T + 1, '#9FC8A8');
    const k = easeOut(clamp(t / 0.7));
    human(c, { ...RAY, x: 540, y: GROUND + (1 - k) * 60, s: 1.05, t: ctx.T, mood: 'proud', armPose: 'hips', blink: blinkAt(ctx.T, 2) });
  },
  // 2b: the first email hops from one computer to the one standing next to it, through the network
  first(c, t, beat, ctx) {
    c.drawImage(lab(), 0, 0);
    mainframe(c, 220, GROUND, ctx.T); mainframe(c, 860, GROUND, ctx.T + 1, '#9FC8A8');
    human(c, { ...RAY, x: 540, y: GROUND, s: 0.95, t: ctx.T, mood: 'grin', armPose: t > 2.2 ? 'hips' : 'point', blink: blinkAt(ctx.T, 2) });
    c.setLineDash([18, 16]); c.strokeStyle = '#FFFFFF'; c.lineWidth = 8; c.beginPath(); c.moveTo(220, GROUND - 630); c.quadraticCurveTo(540, 430, 860, GROUND - 630); c.stroke(); c.setLineDash([]);
    const p = easeInOut(clamp((t - 0.5) / 1.6)), ex = lerp(220, 860, p), ey = (1 - p) * (1 - p) * (GROUND - 630) + 2 * (1 - p) * p * 430 + p * p * (GROUND - 630);
    envelope(c, ex, ey - 40, 120);
    if (p >= 1) burst(c, 860, GROUND - 660, 120, t - 2.1, 10, PAL.gold);
    label(c, 'SIDE BY SIDE', 540, 800, 470, 690, clamp((t - 2.4) / 0.4), { size: 50 });
  },
  // 3: the @ sign splits the person's name from the machine (labelled cutaway)
  at(c, t, beat, ctx) {
    c.drawImage(sheet(), 0, 0);
    const y = 1000, k = easeOutBack(clamp((t - 1.3) / 0.4));
    box(c, 60, y - 110, 380, 220, '#FFFFFF', { r: 24, k: 0.05 }); box(c, 640, y - 110, 380, 220, '#FFFFFF', { r: 24, k: 0.05 });
    c.font = '900 84px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('NAME', 250, y + 4); c.fillText('MACHINE', 830, y + 4, 340);
    if (k > 0) { c.save(); c.translate(540, y); c.scale(k, k); c.rotate(Math.sin(t * 4) * 0.06); ell(c, 0, 0, 96, 96, PAL.gold, { k: 0.15 }); c.font = '900 130px "Noto Sans"'; c.fillStyle = INK; c.fillText('@', 0, -6); c.restore(); burst(c, 540, y, 150, t - 1.3, 12, '#FFFFFF'); }
    label(c, 'WHO', 250, y - 110, 250, 720, clamp((t - 0.3) / 0.4), { size: 56 });
    label(c, 'WHERE', 830, y - 110, 830, 720, clamp((t - 0.7) / 0.4), { size: 56 });
    label(c, '"AT"', 540, y + 96, 540, 1300, clamp((t - 1.9) / 0.4), { size: 60 });
  },
  // 4: the first message was so boring he forgot it
  forgot(c, t, beat, ctx) {
    c.drawImage(lab(), 0, 0);
    mainframe(c, 860, GROUND, ctx.T, '#9FC8A8');
    human(c, { ...RAY, x: 330, y: GROUND, s: 1.15, t: ctx.T, mood: 'chuckle', armPose: 'shrug', blink: 0 });
    const k = easeOutBack(clamp((t - 0.5) / 0.35));
    if (k > 0) { c.save(); c.translate(520, 700); c.scale(k, k); ell(c, 0, 0, 190, 120, '#FFFFFF', { k: 0.05 }); ell(c, -130, 130, 30, 22, '#FFFFFF', { k: 0 }); ell(c, -170, 180, 16, 12, '#FFFFFF', { k: 0 });
      c.font = '900 110px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = PAL.coral; c.fillText('? ? ?', 0, 4); c.restore(); }
  },
  // 5: today, when email stops, work stops - two workers frozen at dead screens
  stops(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    monitor(c, 750, GROUND - 330, 0.85, 'down', t);
    human(c, { ...WORKER, x: 210, y: GROUND, s: 0.95, t: ctx.T, mood: 'sad', armPose: 'down', blink: 0 });
    human(c, { ...WORKER2, x: 430, y: GROUND, s: 0.95, t: ctx.T + 1, mood: 'worried', armPose: 'think', blink: 0 });
    popWord(c, 'STOP', 320, 640, clamp((t - 0.9) / 0.25), 110, RED);
  },
  // 6 payoff: back at the hook desk (loop), the tick is back - question + subscribe
  payoff(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    monitor(c, 910, GROUND - 330, 0.42, 'ok', t);
    human(c, { ...WORKER, x: 300, y: GROUND, s: 0.72, t: ctx.T, mood: 'grin', armPose: 'cheer', look: [1, 0], blink: blinkAt(ctx.T, 1) });
  },
};

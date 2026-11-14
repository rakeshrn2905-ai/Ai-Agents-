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
/** App tile drawn like Outlook's: blue square, white envelope, an "O" badge (our own drawing, for news context). */
function outlookTile(c, x, y, w) {
  box(c, x - w / 2, y - w / 2, w, w, '#1F6FD0', { r: w * 0.2, k: 0.15, lw: Math.max(3, w * 0.05) });
  envelope(c, x + w * 0.1, y + w * 0.05, w * 0.56);
  ell(c, x - w * 0.2, y - w * 0.05, w * 0.22, w * 0.22, '#0F4FA8', { lw: Math.max(2, w * 0.03), k: 0 });
  c.font = `900 ${w * 0.3}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('O', x - w * 0.2, y - w * 0.04);
}
/** Monitor on a desk showing an Outlook-style inbox. state 'down' = red error banner, 'ok' = green banner. */
function monitor(c, x, y, s, state, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -30, -70, 60, 70, '#8E9AA6', { r: 6, k: 0.15 }); box(c, -110, -14, 220, 22, '#8E9AA6', { r: 10, k: 0.15 });
  box(c, -250, -430, 500, 360, '#2A2622', { r: 22, k: 0 });
  c.save(); c.beginPath(); c.rect(-232, -412, 464, 324); c.clip();
  c.fillStyle = '#FFFFFF'; c.fillRect(-232, -412, 464, 324);
  c.fillStyle = '#1F6FD0'; c.fillRect(-232, -412, 464, 56);                                   // blue title bar
  c.font = '900 30px "Noto Sans"'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('Outlook', -170, -383);
  c.fillStyle = '#EAF2FC'; c.fillRect(-232, -356, 110, 268);                                 // folder pane
  c.fillStyle = '#1F6FD0'; c.font = '900 20px "Noto Sans"'; c.fillText('Inbox', -220, -330); c.fillStyle = '#8E9AA6'; c.fillText('Sent', -220, -296); c.fillText('Drafts', -220, -262);
  for (let i = 0; i < 4; i++) { const ry = -340 + i * 62; c.fillStyle = state === 'down' ? '#E3E6EA' : '#1F6FD0'; c.beginPath(); c.arc(-96, ry + 22, 14, 0, 7); c.fill();
    c.fillStyle = state === 'down' ? '#D5D9DE' : '#3B3F46'; c.fillRect(-70, ry + 8, 200, 12); c.fillStyle = '#C9CFD4'; c.fillRect(-70, ry + 28, 270, 9); c.fillStyle = '#E3E6EA'; c.fillRect(-122, ry + 54, 354, 2); }
  c.restore();
  outlookTile(c, -200, -384, 40);
  const p = state === 'down' ? 1 + Math.sin(t * 10) * 0.04 : 1;
  c.save(); c.translate(55, -240); c.scale(p, p); box(c, -150, -42, 300, 84, state === 'down' ? RED : '#35B56A', { r: 14, k: 0.12, lw: 6 });
  c.font = '900 30px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText(state === 'down' ? "CAN'T CONNECT" : 'CONNECTED', 0, 2); c.restore();
  c.restore();
}
/** Server rack (no face). status: 'ok' | 'off' | 'hot'. load 0..1 draws a load bar above it. ang tilts it about its bottom-right corner. */
function rack(c, x, y, status, t, load = -1, ang = 0) {
  c.save(); c.translate(x + 70, y); c.rotate(ang); c.translate(-70, 0);
  box(c, -70, -400, 140, 400, status === 'off' ? '#7C868F' : '#3F4A5A', { r: 12, k: 0.18 });
  for (let r = 0; r < 5; r++) { box(c, -54, -380 + r * 72, 108, 52, status === 'off' ? '#9AA3A8' : '#566377', { r: 6, lw: 4, k: 0 });
    for (let q = 0; q < 3; q++) ell(c, -34 + q * 22, -354 + r * 72, 7, 7, status === 'off' ? '#5A606A' : status === 'hot' ? RED : ((Math.floor(t * 5) + r + q) % 3 ? '#35D07F' : '#BFF5D6'), { lw: 0, k: 0 }); }
  if (load >= 0) { box(c, -60, -470, 120, 34, '#FFFFFF', { r: 10, lw: 5, k: 0 }); c.fillStyle = load > 0.8 ? RED : load > 0.5 ? PAL.gold : '#35B56A'; c.fillRect(-54, -464, 108 * clamp(load), 22); }
  c.restore();
}
function mark(c, x, y, ok, k) { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); ell(c, 0, 0, 44, 44, ok ? '#35B56A' : RED, { k: 0.1 });
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); if (ok) { c.moveTo(-20, 0); c.lineTo(-5, 16); c.lineTo(22, -16); } else { c.moveTo(-17, -17); c.lineTo(17, 17); c.moveTo(17, -17); c.lineTo(-17, 17); } c.stroke(); c.restore(); }
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

const serverRoom = () => once('servers', (c) => {
  c.fillStyle = '#BFE3F2'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = 0; x < W; x += 160) c.fillRect(x, 0, 80, GROUND);
  floor(c, '#8FA3B5');
});
const RX = [130, 320, 510, 700, 890], RY = GROUND - 170;
const platform = (c) => box(c, 20, RY, W - 40, 60, '#6E7F92', { r: 12, k: 0.15 });

function hookLayout(c, t, ctx, s, mood, down = true) {
  monitor(c, 750, GROUND - 330, s, down ? 'down' : 'ok', t);
  human(c, { ...WORKER, x: 300, y: GROUND, s: 1.05 * s, t: ctx.T, mood, armPose: down ? 'shrug' : 'cheer', look: [1, 0], blink: blinkAt(ctx.T, 1) });
}

export const SCENES = {
  // 0 hook: a worker stares at an Outlook-style inbox that can't connect
  ohook(c, t, beat, ctx) { c.drawImage(office(), 0, 0); hookLayout(c, t, ctx, 1, 'shock'); },
  // 1: 12 November - email and Teams stopped for hours (two app tiles, a clock racing)
  hours(c, t, beat, ctx) {
    c.drawImage(sheet(), 0, 0);
    const k1 = easeOutBack(clamp(t / 0.3)), k2 = easeOutBack(clamp((t - 0.35) / 0.3));
    c.save(); c.translate(300, 900); c.scale(k1, k1); outlookTile(c, 0, 0, 260); c.restore();
    if (k2 > 0) { c.save(); c.translate(780, 900); c.scale(k2, k2); box(c, -130, -130, 260, 260, '#5B5FC7', { r: 52, k: 0.15, lw: 13 }); c.font = '900 170px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('T', 0, 6); c.restore(); }
    mark(c, 400, 790, false, clamp((t - 0.8) / 0.25)); mark(c, 880, 790, false, clamp((t - 1.0) / 0.25));
    label(c, 'EMAIL', 300, 1030, 300, 1150, clamp((t - 0.5) / 0.3), { size: 54 }); label(c, 'TEAMS', 780, 1030, 780, 1150, clamp((t - 0.7) / 0.3), { size: 54 });
    ell(c, 540, 1310, 90, 90, '#FFFFFF', { k: 0.06 }); c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 10; const a = -Math.PI / 2 + t * 6; c.beginPath(); c.moveTo(540, 1310); c.lineTo(540 + Math.cos(a) * 64, 1310 + Math.sin(a) * 64); c.stroke();
    c.lineWidth = 13; const b = -Math.PI / 2 + t * 0.5; c.beginPath(); c.moveTo(540, 1310); c.lineTo(540 + Math.cos(b) * 40, 1310 + Math.sin(b) * 40); c.stroke();
    popWord(c, '12 NOV', 540, 640, clamp((t - 0.2) / 0.3), 96, PAL.gold);
  },
  // 2: why - servers get an automatic health check; some fail it and switch off
  check(c, t, beat, ctx) {
    c.drawImage(serverRoom(), 0, 0); platform(c);
    const sweep = clamp((t - 0.8) / 2.0), sx = lerp(40, W - 40, sweep), bad = [1, 3];
    RX.forEach((x, i) => { const passed = sx > x + 70, off = passed && bad.includes(i) && t > 3.4; rack(c, x, RY, off ? 'off' : 'ok', ctx.T);
      mark(c, x, RY - 480, !bad.includes(i), passed ? clamp((t - 0.8 - (x + 70 - 40) / (W - 80) * 2.0) / 0.25) : 0); });
    if (sweep > 0 && sweep < 1) { c.save(); c.globalAlpha = 0.8; c.fillStyle = '#35D07F'; c.fillRect(sx - 6, RY - 440, 12, 440); c.restore(); }
    label(c, 'HEALTH CHECK', Math.min(sx, 760), RY - 440, 300, 640, clamp((t - 0.9) / 0.3) * (t < 3.2 ? 1 : 0), { size: 52 });
    if (t > 3.4) label(c, 'SWITCHED OFF', RX[1], RY - 300, 330, 640, clamp((t - 3.4) / 0.3), { size: 52 });
  },
  // 3: their work moved to the servers still running, until those were overloaded too - like dominoes
  domino(c, t, beat, ctx) {
    c.drawImage(serverRoom(), 0, 0); platform(c);
    const live = [0, 2, 4], load = clamp(0.45 + t / 2.6 * 0.6);
    RX.forEach((x, i) => {
      if (!live.includes(i)) { rack(c, x, RY, 'off', ctx.T); return; }
      const n = live.indexOf(i), fall = easeInOut(clamp((t - 3.0 - n * 0.4) / 0.45));
      rack(c, x, RY, load > 0.8 ? 'hot' : 'ok', ctx.T, fall > 0 ? -1 : load, fall * 0.42);
    });
    for (const [from, to] of [[1, 0], [1, 2], [3, 2], [3, 4]]) { const ph = (t * 1.2 + from * 0.2) % 1; if (t > 2.8) break; c.save(); c.globalAlpha = Math.sin(ph * Math.PI); envelope(c, lerp(RX[from], RX[to], ph), RY - 560 - Math.sin(ph * Math.PI) * 70, 70); c.restore(); }
    if (t > 1.6 && t < 3.0) label(c, 'OVERLOADED', RX[2], RY - 470, 540, 640, clamp((t - 1.6) / 0.3), { size: 56 });
    if (t > 3.0) burst(c, RX[4] + 190, RY - 330, 110, t - 4.1, 10, INK);
  },
  // 4: it wasn't a hack, and it wasn't extra traffic
  nothack(c, t, beat, ctx) {
    c.drawImage(sheet(), 0, 0);
    const k1 = easeOutBack(clamp(t / 0.3)), k2 = easeOutBack(clamp((t - 0.9) / 0.3));
    c.save(); c.translate(300, 960); c.scale(k1, k1); box(c, -170, -190, 340, 380, '#FFFFFF', { r: 28, k: 0.05 });
    c.strokeStyle = INK; c.lineWidth = 22; c.beginPath(); c.arc(0, -40, 60, Math.PI, 0); c.stroke(); box(c, -90, -40, 180, 150, PAL.gold, { r: 18, k: 0.15 }); ell(c, 0, 30, 20, 20, INK, { lw: 0, k: 0 }); c.restore();   // padlock
    if (k2 > 0) { c.save(); c.translate(780, 960); c.scale(k2, k2); box(c, -170, -190, 340, 380, '#FFFFFF', { r: 28, k: 0.05 });
      c.strokeStyle = '#C9CFD4'; c.lineWidth = 5; for (let y = -120; y <= 120; y += 60) { c.beginPath(); c.moveTo(-130, y); c.lineTo(130, y); c.stroke(); }
      c.strokeStyle = '#1F6FD0'; c.lineWidth = 14; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); for (let i = 0; i <= 8; i++) { const px = -130 + i * 32.5, py = 20 + Math.sin(i * 1.3) * 12; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); c.restore(); } // flat traffic line
    mark(c, 430, 800, true, clamp((t - 0.4) / 0.25)); mark(c, 910, 800, true, clamp((t - 1.3) / 0.25));
    popWord(c, 'NOT A HACK', 300, 1240, clamp((t - 0.3) / 0.3), 50); popWord(c, 'NORMAL TRAFFIC', 780, 1240, clamp((t - 1.2) / 0.3), 44, PAL.gold);
  },
  // 5: email is 55 years old - Ray Tomlinson's first email, 1971, hopping between two computers
  first(c, t, beat, ctx) {
    c.drawImage(lab(), 0, 0);
    mainframe(c, 220, GROUND, ctx.T); mainframe(c, 860, GROUND, ctx.T + 1, '#9FC8A8');
    human(c, { ...RAY, x: 540, y: GROUND, s: 0.95, t: ctx.T, mood: 'grin', armPose: 'hips', blink: blinkAt(ctx.T, 2) });
    c.setLineDash([18, 16]); c.strokeStyle = '#FFFFFF'; c.lineWidth = 8; c.beginPath(); c.moveTo(220, GROUND - 630); c.quadraticCurveTo(540, 430, 860, GROUND - 630); c.stroke(); c.setLineDash([]);
    const p = easeInOut(clamp((t - 0.3) / 1.4)), ex = lerp(220, 860, p), ey = (1 - p) * (1 - p) * (GROUND - 630) + 2 * (1 - p) * p * 430 + p * p * (GROUND - 630);
    envelope(c, ex, ey - 40, 120);
    label(c, 'FIRST EMAIL, 1971', 540, 800, 440, 690, clamp((t - 0.6) / 0.4), { size: 50 });
  },
  // 6 payoff: back at the hook desk (loop), connected again - question + subscribe
  payoff(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    monitor(c, 900, GROUND - 330, 0.36, 'ok', t);
    human(c, { ...WORKER, x: 300, y: GROUND, s: 0.72, t: ctx.T, mood: 'grin', armPose: 'cheer', look: [1, 0], blink: blinkAt(ctx.T, 1) });
  },
};

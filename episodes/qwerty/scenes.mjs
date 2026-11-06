// Bespoke scenes for "Your Keyboard Is 150 Years Old" (QWERTY).
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade, tint, seg } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const TOP = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];

export function key(c, x, y, sz, ch, col = '#FFFFFF', ink = INK) { // one keycap
  box(c, x - sz / 2, y - sz / 2, sz, sz, col, { r: sz * 0.18, lw: Math.max(3, sz * 0.06), k: 0.12 });
  c.font = `900 ${Math.round(sz * 0.56)}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = ink; c.fillText(ch, x, y + sz * 0.03);
}

// modern keyboard: a slab of keycaps, face on the space bar row
BODIES.keyboard = (c) => {
  box(c, -230, -260, 460, 200, '#C9D3DE', { r: 26, k: 0.15 });  // light body so the face reads
  for (let i = 0; i < 6; i++) key(c, -175 + i * 70, -215, 56, TOP[i], '#F4EDE0');
  for (let i = 0; i < 6; i++) key(c, -175 + i * 70, -150, 56, '', '#DCE3EA');
  return { face: [0, -96, 24], shL: [-230, -170], shR: [230, -170], hipL: [-70, -62], hipR: [70, -62], top: [0, -260], tip: [0, -260] };
};
// 1874-style typewriter: black body with gold trim, round keys, paper in the roller, monocle on the face
BODIES.typewriter = (c, col) => {
  box(c, -210, -330, 420, 50, '#2A2622', { r: 24, k: 0.1 });                          // roller
  box(c, -120, -420, 240, 110, '#FFFFFF', { r: 4, lw: 5, k: 0 });                      // paper
  if (col.paper) { c.font = '900 44px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(col.paper, 0, -370); }
  cel(c, (c) => { c.moveTo(-230, -290); c.lineTo(230, -290); c.lineTo(260, -70); c.lineTo(-260, -70); c.closePath(); }, '#262B33', [-260, -290, 520, 220], { k: 0.2 });
  c.strokeStyle = PAL.gold; c.lineWidth = 6; c.beginPath(); c.moveTo(-225, -280); c.lineTo(225, -280); c.stroke();
  box(c, -95, -270, 190, 110, '#F4EDE0', { r: 26, lw: 5, k: 0.06 });               // cream face plate (face must read on the black body)
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { ell(c, -180 + i * 60 + r * 30, -125 + r * 34, 20, 14, '#F4EDE0', { lw: 4, k: 0 }); }
  return { face: [0, -218, 30], shL: [-235, -200], shR: [235, -200], hipL: [-90, -62], hipR: [90, -62], top: [0, -420], tip: [0, -420] };
};
// smartphone with a tiny QWERTY on its screen
BODIES.smartphone = (c) => {
  box(c, -100, -440, 200, 380, '#2A2622', { r: 36, k: 0.1 });
  box(c, -82, -420, 164, 340, '#BFE6F5', { r: 22, lw: 4, k: 0 });
  for (let i = 0; i < 6; i++) key(c, -62 + i * 25, -130, 22, TOP[i], '#FFFFFF');
  return { face: [0, -300, 26], shL: [-100, -250], shR: [100, -250], hipL: [-40, -62], hipR: [40, -62], top: [0, -440], tip: [0, -440] };
};
function monocle(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = PAL.gold; c.lineWidth = 6; c.beginPath(); c.arc(17, -217, 16, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(30, -205); c.quadraticCurveTo(46, -150, 30, -110); c.lineWidth = 3; c.stroke(); c.restore(); }

export const sholes = { costume: { coat: '#6B4A2E', trim: PAL.gold, trousers: '#3A3A3A' }, hair: { style: 'short', color: '#9A9A9A' }, beard: { color: '#B0B0B0' } };

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const modern = () => once('modern', (c) => { // bright modern desk: hook + loop
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#F28C8C'); g.addColorStop(1, '#F7C28B');
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  for (let i = 0; i < 9; i++) ell(c, 80 + (i * 137) % 920, 120 + (i * 211) % 700, 10, 10, 'rgba(255,255,255,0.45)', { lw: 0, k: 0 });
  box(c, 0, GROUND - 120, W, 120, '#5AA9A0', { r: 0, k: 0.15 });  // desk
  c.fillStyle = '#2D3E5C'; c.fillRect(0, GROUND, W, H - GROUND);
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const office = () => once('office', (c) => { // bright Victorian office: gold/teal wallpaper
  c.fillStyle = '#E0B54A'; c.fillRect(0, 0, W, GROUND);
  for (let x = 0; x < W; x += 120) for (let y = 0; y < GROUND; y += 140) { c.fillStyle = '#5AA9A0'; c.beginPath(); c.moveTo(x + 60, y + 20); c.lineTo(x + 90, y + 70); c.lineTo(x + 60, y + 120); c.lineTo(x + 30, y + 70); c.closePath(); c.fill(); }
  box(c, 0, GROUND - 120, W, 120, '#8A5A34', { r: 0, k: 0.15 });  // wooden desk
  c.fillStyle = '#7A3B2E'; c.fillRect(0, GROUND, W, H - GROUND);
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const plain = () => once('plain', (c) => { c.fillStyle = '#F4EDE0'; c.fillRect(0, 0, W, H); });

export const SCENES = {
  // 0 hook: an odd pair in frame 1 - a modern keyboard and a monocled Victorian typewriter (already falling in)
  qhook(c, t, beat, ctx) {
    c.drawImage(modern(), 0, 0);
    objChar(c, { body: 'keyboard', x: 290, y: GROUND - 110, s: 0.9, t: ctx.T, mood: 'shock', armPose: 'shrug' });
    const ty = GROUND - 110 - Math.max(0, 1 - t / 0.25) * 70, ts = 0.95;
    objChar(c, { body: 'typewriter', colors: { paper: 'QWERTY' }, x: 765, y: ty, s: ts, t: ctx.T, mood: 'smug', armPose: 'hips', legPose: t < 0.25 ? 'jump' : 'stand' });
    monocle(c, 765, ty, ts);
    if (t > 0.25) burst(c, 765, GROUND - 120, 150, t - 0.25, 10, '#FFFFFF');
  },
  // 1: the 1874 typewriter, QWERTY on its paper
  typewriter1874(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    const s = 1.25 * easeOutBack(clamp(t / 0.35));
    objChar(c, { body: 'typewriter', colors: { paper: 'QWERTY' }, x: 540, y: GROUND - 110, s, t: ctx.T, mood: 'proud', armPose: 'present' });
    label(c, '1874', 540, GROUND - 110 - 420 * 1.25 + 30, 150, 640, clamp((t - 0.8) / 0.5), { size: 60 });
  },
  // 2: Sholes keeps shuffling the keys (keycaps swap places)
  shuffle(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    const order = ['Q', 'W', 'E', 'R', 'T', 'Y'], alt = ['A', 'W', 'E', '.', 'T', 'Y'];
    const phase = Math.floor(t / 0.7) % 3, p = clamp((t % 0.7) / 0.35);
    for (let i = 0; i < 6; i++) {
      const x0 = 165 + i * 150, swap = (i + phase) % 3 === 0;
      const x = swap ? lerp(x0, 165 + ((i + 3) % 6) * 150, easeInOut(p)) : x0, y = 620 - (swap ? Math.sin(p * Math.PI) * 120 : 0);
      key(c, x, y, 120, phase === 2 ? order[i] : alt[i], swap ? '#FFD166' : '#FFFFFF');
    }
    human(c, { ...sholes, x: 540, y: GROUND + 20, s: 1.15, t: ctx.T, mood: 'worried', armPose: 'cheer' });
  },
  // 3: typebars striking - do they jam? (labelled cutaway)
  jam(c, t, beat, ctx) {
    c.drawImage(plain(), 0, 0);
    const cx = 540, cy = 1180, R = 400, hit = [cx, cy - 330];
    const bars = [];
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 9; bars.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    box(c, cx - 440, cy - 20, 880, 70, '#262B33', { r: 24, k: 0.1 });                 // basket base
    const strike = easeOut(clamp((t - 0.4) / 0.3)), clash = t > 0.7;
    bars.forEach(([px, py], i) => {
      const rest = [px + (cx - px) * 0.45, py + (cy - 120 - py) * 0.45];
      const moving = i === 3 || i === 5;
      const end = moving ? [lerp(rest[0], hit[0], strike), lerp(rest[1], hit[1], strike)] : rest;
      seg(c, px, py, end[0], end[1], moving ? 16 : 11, moving ? PAL.coral : '#3A3F4B');
      ell(c, end[0], end[1], moving ? 18 : 12, moving ? 18 : 12, moving ? PAL.gold : '#5B6A88', { lw: 4, k: 0 });
      ell(c, px, py, 12, 12, '#262B33', { lw: 3, k: 0 });
    });
    if (clash) burst(c, hit[0], hit[1], 150, t - 0.7, 12, PAL.gold);
    label(c, 'JAMMING?', hit[0], hit[1], 150, 560, clamp((t - 0.9) / 0.5), { size: 56 });
  },

  // 4: 1893 - typewriter makers merge
  merge(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    const p = easeInOut(clamp(t / 1.6));
    for (const [i, x0] of [[0, 160], [1, 540], [2, 920]].map(([i, x]) => [i, x])) {
      const x = lerp(x0, 540 + (i - 1) * 290, p), s = 0.5;
      objChar(c, { body: 'typewriter', x, y: GROUND - 110, s, t: ctx.T + i, mood: p > 0.9 ? 'grin' : 'neutral', armPose: p > 0.9 ? 'cheer' : 'down', legPose: p < 1 ? 'walk' : 'stand' });
    }
    if (p > 0.95) burst(c, 540, GROUND - 420, 220, t - 1.6, 12, '#FFFFFF');
  },
  // 5: QWERTY becomes the standard - the top row stamps down
  standard(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    for (let i = 0; i < 6; i++) { const k = easeOutBack(clamp((t - i * 0.12) / 0.3)); if (k > 0) { c.save(); c.translate(165 + i * 150, 760); c.scale(k, k); key(c, 0, 0, 130, TOP[i], '#FFFFFF'); c.restore(); } }
    objChar(c, { body: 'typewriter', colors: { paper: 'QWERTY' }, x: 540, y: GROUND - 110, s: 0.9, t: ctx.T, mood: 'proud', armPose: 'cheer' });
  },
  // 6 payoff: same modern desk as the hook (loop): phone, keyboard and the old typewriter together
  payoff(c, t, beat, ctx) {
    c.drawImage(modern(), 0, 0);
    objChar(c, { body: 'keyboard', x: 250, y: GROUND - 110, s: 0.75, t: ctx.T, mood: 'grin', armPose: 'wave' });
    objChar(c, { body: 'smartphone', x: 540, y: GROUND - 110, s: 0.95, t: ctx.T, mood: 'chuckle', armPose: 'cheer' });
    objChar(c, { body: 'typewriter', colors: { paper: 'QWERTY' }, x: 840, y: GROUND - 110, s: 0.6, t: ctx.T, mood: 'smug', armPose: 'hips' });
    monocle(c, 840, GROUND - 110, 0.6);
  },
};

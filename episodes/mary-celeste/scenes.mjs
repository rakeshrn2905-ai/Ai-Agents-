// Bespoke scenes for "The Ghost Ship Found With Nobody on Board" (Mary Celeste, 1872).
// Taste: bright daytime sea (never a dark night scene), no bodies, no spooky spirits; the people simply fade from a portrait.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade, tint } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { face } from '../../lib/face.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const HULL = '#A64B2A', SAIL = '#F6EBD2', WOOD = '#C98B5E', SEA = '#2B9FD8', SEA_L = '#5CC1EC';
const SEA_Y = 1250;

/** The Mary Celeste: two-masted brigantine with a face on the hull. Origin = waterline centre. */
export function ship(c, x, y, s, { mood = 'worried', look = [0, 0], T = 0, rock = 0, torn = false, faceOn = true } = {}) {
  c.save(); c.translate(x, y); c.rotate(rock); c.scale(s, s);
  // masts + rigging
  c.strokeStyle = INK; c.lineWidth = 3;
  for (const mx of [-130, 140]) { c.beginPath(); c.moveTo(mx, -720); c.lineTo(-330, -130); c.moveTo(mx, -720); c.lineTo(330, -130); c.stroke(); }
  for (const mx of [-130, 140]) box(c, mx - 12, -740, 24, 640, '#7A4A2A', { r: 6, k: 0.2 });
  box(c, 300, -170, 190, 16, '#7A4A2A', { r: 6, k: 0, lw: 5 });                          // bowsprit
  // square sails that billow in the wind
  const puff = 14 + Math.sin(T * 3) * 6;
  for (const mx of [-130, 140]) for (const [top, h, w] of [[-690, 150, 230], [-520, 170, 270]]) {
    cel(c, (c) => { c.moveTo(mx - w / 2, top); c.lineTo(mx + w / 2, top); c.quadraticCurveTo(mx + w / 2 + puff, top + h / 2, mx + w / 2, top + h);
      c.lineTo(mx - w / 2, top + h); c.quadraticCurveTo(mx - w / 2 + puff, top + h / 2, mx - w / 2, top); c.closePath(); }, SAIL, [mx - w / 2, top, w, h], { k: 0.12 });
    if (torn && top === -520 && mx > 0) { c.fillStyle = SEA_L; c.beginPath(); c.moveTo(mx + 40, top + h); c.lineTo(mx + 90, top + 70); c.lineTo(mx + 120, top + h); c.fill(); }
  }
  cel(c, (c) => { c.moveTo(300, -170); c.lineTo(470, -170); c.lineTo(300, -560); c.closePath(); }, SAIL, null, { lw: 6 }); // jib
  // hull
  cel(c, (c) => { c.moveTo(-340, -170); c.lineTo(360, -170); c.quadraticCurveTo(330, 20, 230, 60); c.lineTo(-250, 60); c.quadraticCurveTo(-330, 0, -340, -170); c.closePath(); }, HULL, [-340, -170, 700, 230], { k: 0.2 });
  box(c, -330, -150, 680, 22, '#F2D27A', { r: 8, lw: 5, k: 0 });                         // gold stripe
  c.font = '900 34px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F6EBD2'; c.fillText('MARY CELESTE', -190, -96);
  if (faceOn) { box(c, 70, -116, 200, 96, '#F6EBD2', { r: 40, lw: 5, k: 0 }); face(c, 170, -70, 30, { mood, look, blink: ((T * 0.41) % 1) > 0.96 ? 1 : 0 }); }
  c.restore();
}
function waves(c, y, t, col = SEA, amp = 14) { // front wave band, hides the hull bottom
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x / 70 + t * 2.2) * amp);
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
  for (let x = 0; x <= W; x += 20) { const yy = y + Math.sin(x / 70 + t * 2.2) * amp; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke();
}
function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
BODIES.cask = (c, col) => { // wooden barrel with iron hoops
  const base = col.base || '#C98B5E';
  box(c, -120, -330, 240, 270, base, { r: 70, k: 0.18 });
  for (const yy of [-290, -110]) box(c, -118, yy, 236, 18, '#6E6E6E', { r: 6, lw: 4, k: 0 });
  return { face: [0, -200, 30], shL: [-120, -210], shR: [120, -210], hipL: [-50, -66], hipR: [50, -66], top: [0, -330], tip: [0, -330] };
};

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const sea = () => once('sea', (c) => {
  const g = c.createLinearGradient(0, 0, 0, SEA_Y); g.addColorStop(0, '#4FB0E8'); g.addColorStop(1, '#C9ECF8'); c.fillStyle = g; c.fillRect(0, 0, W, SEA_Y);
  c.fillStyle = '#FFFFFF'; for (const [x, y, r] of [[140, 560, 46], [200, 540, 60], [265, 565, 42], [700, 700, 38], [750, 685, 50]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.fillStyle = SEA_L; c.fillRect(0, SEA_Y - 60, W, H);
});
const deckSet = () => once('deck', (c) => { // on the Dei Gratia's deck, looking out to sea
  const g = c.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, '#4FB0E8'); g.addColorStop(1, '#C9ECF8'); c.fillStyle = g; c.fillRect(0, 0, W, 1100);
  c.fillStyle = SEA_L; c.fillRect(0, 1100, W, H);
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 5; for (let i = 0; i < 12; i++) { const x = (i * 173) % W, y = 1140 + (i * 61) % 200; c.beginPath(); c.arc(x, y, 22, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  c.fillStyle = '#B9875A'; c.fillRect(0, 1380, W, H - 1380);
  c.strokeStyle = shade('#B9875A', 0.25); c.lineWidth = 4; for (let y = 1440; y < H; y += 70) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
});
const galley = () => once('galley', (c) => {
  c.fillStyle = '#F0CF8E'; c.fillRect(0, 0, W, GROUND);
  c.strokeStyle = 'rgba(150,90,40,0.3)'; c.lineWidth = 6; for (let y = 60; y < GROUND; y += 90) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  ell(c, 880, 560, 90, 90, '#9FD8F0', { lw: 14, k: 0 }); // porthole
  c.fillStyle = WOOD; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const hold = () => once('hold', (c) => {
  c.fillStyle = '#E2B47A'; c.fillRect(0, 0, W, GROUND);
  c.strokeStyle = 'rgba(120,70,30,0.35)'; c.lineWidth = 8; for (let x = 0; x < W; x += 120) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GROUND); c.stroke(); }
  for (const x of [120, 960]) box(c, x - 26, 0, 52, GROUND, '#9C6A3E', { r: 0, k: 0.2 }); // beams
  c.fillStyle = '#B07A45'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const cabin = () => once('cabin', (c) => {
  c.fillStyle = '#8FC9C2'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = 0; x < W; x += 120) c.fillRect(x, 0, 60, GROUND);
  c.fillStyle = WOOD; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});

const SAILOR = { costume: { coat: '#3A5BA8', trim: '#FFFFFF', trousers: '#F4EDE0' }, hat: { style: 'cap', color: '#2D3E5C' }, hair: { style: 'short', color: '#5A3B22' } };

export const SCENES = {
  // 0 hook: the ship sails on a bright sea - its face looks around the empty deck
  mhook(c, t, beat, ctx) {
    c.drawImage(sea(), 0, 0);
    ship(c, 520, SEA_Y + 20 + Math.sin(t * 2.4) * 10, 0.78, { mood: 'shock', look: [Math.sin(t * 3) , 0], T: ctx.T, rock: Math.sin(t * 2) * 0.04 });
    waves(c, SEA_Y + 60, ctx.T);
    popWord(c, '?', 860, 760 - easeOut(clamp(t / 0.3)) * 40, clamp(t / 0.25) + 0.001, 150, PAL.gold);
  },
  // 1: 1872 - a sailor on the Dei Gratia spots her through a telescope
  spotted(c, t, beat, ctx) {
    c.drawImage(deckSet(), 0, 0);
    ship(c, 840, 1110 + Math.sin(t * 2) * 4, 0.28, { faceOn: false, T: ctx.T, rock: Math.sin(t * 2) * 0.03 });
    const s = 1.15, sx = 300, gy = 1660;
    human(c, { ...SAILOR, x: sx, y: gy, s, t: ctx.T, mood: 'shock', armPose: 'point', look: [1, 0] });
    // telescope: from the eye through the right hand (hand at local (246, -398))
    const ex = sx + 40 * s, ey = gy - 470 * s, hx = sx + 246 * s, hy = gy - 398 * s, dx = hx - ex, dy = hy - ey, L = Math.hypot(dx, dy);
    c.save(); c.translate(ex, ey); c.rotate(Math.atan2(dy, dx));
    box(c, 10, -16, L * 0.6, 32, '#C9A043', { r: 8, k: 0.15 }); box(c, L * 0.55, -22, L * 0.6, 44, '#C9A043', { r: 8, k: 0.15 }); c.restore();
    // ship's rail in front of the sailor's legs
    box(c, -20, 1500, W + 40, 34, '#8A5A34', { r: 10, k: 0.15 });
    for (let x = 40; x < W; x += 130) box(c, x, 1530, 26, 140, '#8A5A34', { r: 6, k: 0.15 });
  },
  // 1b: drifting in the Atlantic - small ship, big sea, a dotted drift path
  adrift(c, t, beat, ctx) {
    c.drawImage(sea(), 0, 0);
    c.setLineDash([18, 22]); c.strokeStyle = '#FFFFFF'; c.lineWidth = 8; c.beginPath(); c.moveTo(80, SEA_Y + 140); c.quadraticCurveTo(300, SEA_Y + 40, lerp(320, 560, easeOut(clamp(t / 2.5))), SEA_Y + 70); c.stroke(); c.setLineDash([]);
    ship(c, lerp(380, 600, easeInOut(clamp(t / 2.6))), SEA_Y + 30 + Math.sin(t * 2) * 8, 0.62, { mood: 'worried', T: ctx.T, rock: Math.sin(t * 1.6) * 0.07, torn: true });
    waves(c, SEA_Y + 60, ctx.T);
  },
  // 2: her lifeboat was gone - empty davits, ropes swinging, dotted outline where it hung
  lifeboat(c, t, beat, ctx) {
    c.drawImage(sea(), 0, 0);
    box(c, -20, 1060, W + 40, 120, HULL, { r: 0, k: 0.15 });                                  // ship's side
    box(c, -20, 1040, W + 40, 30, '#F2D27A', { r: 6, k: 0, lw: 5 });
    for (const dx of [260, 820]) { // davits: curved posts
      c.strokeStyle = INK; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(dx, 1060); c.lineTo(dx, 700); c.quadraticCurveTo(dx, 620, dx + (dx < 540 ? 90 : -90), 620); c.stroke();
      c.strokeStyle = '#E9E2D2'; c.lineWidth = 20; c.stroke();
      const sw = Math.sin(t * 3 + dx) * 0.25, rx = dx + (dx < 540 ? 90 : -90);
      c.save(); c.translate(rx, 630); c.rotate(sw); c.strokeStyle = '#8A6A3E'; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 300); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.arc(0, 318, 18, Math.PI * 0.1, Math.PI * 1.9); c.stroke(); c.restore();
    }
    c.setLineDash([20, 16]); c.strokeStyle = '#FFFFFF'; c.lineWidth = 9; c.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
    c.beginPath(); c.moveTo(330, 900); c.lineTo(750, 900); c.quadraticCurveTo(700, 1010, 600, 1010); c.lineTo(420, 1010); c.quadraticCurveTo(360, 1000, 330, 900); c.stroke();
    c.setLineDash([]); c.globalAlpha = 1;
    popWord(c, 'GONE!', 540, 800, clamp((t - 0.5) / 0.3), 96, PAL.gold);
    waves(c, 1300, ctx.T, SEA, 18);
  },
  // 3: six months of food and water still on board
  galleyb(c, t, beat, ctx) {
    c.drawImage(galley(), 0, 0);
    box(c, 60, 820, 600, 26, '#8A5A34', { r: 6 });
    for (let i = 0; i < 5; i++) box(c, 90 + i * 112, 720, 80, 100, ['#E9D9BE', '#D9604C', '#E0A63A', '#8FA889', '#E9D9BE'][i], { r: 14, k: 0.15 }); // jars + sacks
    box(c, 60, 1080, 600, 26, '#8A5A34', { r: 6 });
    for (let i = 0; i < 4; i++) { cel(c, (c) => { c.moveTo(100 + i * 140, 1080); c.quadraticCurveTo(80 + i * 140, 960, 140 + i * 140, 950); c.quadraticCurveTo(200 + i * 140, 960, 180 + i * 140, 1080); c.closePath(); }, '#E9D9BE', [80 + i * 140, 950, 120, 130], { k: 0.15 }); }
    objChar(c, { body: 'cask', colors: { base: '#9FB8C8' }, x: 820, y: GROUND, s: 1.1, t: ctx.T, mood: 'grin', armPose: 'cheer', squash: Math.abs(Math.sin(t * 5)) * 0.08 });
    label(c, 'WATER', 820, GROUND - 330 * 1.1, 820, 760, clamp((t - 0.4) / 0.4), { size: 52 });
    objChar(c, { body: 'cask', colors: { base: '#C98B5E' }, x: 330, y: GROUND, s: 0.9, t: ctx.T + 1, mood: 'proud', armPose: 'hips' });
    popWord(c, '6 MONTHS', 360, 640, clamp((t - 0.7) / 0.3), 84, PAL.gold);
  },
  // 4: the cargo of alcohol was barely touched - rows of happy barrels
  holdb(c, t, beat, ctx) {
    c.drawImage(hold(), 0, 0);
    box(c, 40, 1050, W - 80, 24, '#8A5A34', { r: 6 });                                      // back shelf of stacked barrels
    for (let i = 0; i < 6; i++) { const x = 120 + i * 168; box(c, x - 62, 900, 124, 150, '#C98B5E', { r: 40, k: 0.18 });
      for (const yy of [925, 1010]) box(c, x - 61, yy, 122, 12, '#6E6E6E', { r: 4, lw: 3, k: 0 }); }
    for (let i = 0; i < 4; i++) objChar(c, { body: 'cask', x: 180 + i * 240, y: GROUND, s: 0.72, t: ctx.T + i, mood: i === 2 ? 'smug' : 'grin', armPose: 'down', squash: Math.abs(Math.sin(t * 4 + i)) * 0.06 });
    popWord(c, '1,701 BARRELS', 540, 820, clamp((t - 0.4) / 0.3), 80, PAL.gold);
  },
  // 5: the captain, his wife, their daughter and seven crew - a portrait that slowly empties
  portrait(c, t, beat, ctx) {
    c.drawImage(cabin(), 0, 0);
    const fx = 540, fy = 980, fw = 760, fh = 560;
    box(c, fx - fw / 2 - 30, fy - fh / 2 - 30, fw + 60, fh + 60, PAL.gold, { r: 10, k: 0.15 });
    box(c, fx - fw / 2, fy - fh / 2, fw, fh, '#F4EDE0', { r: 4, k: 0 });
    const fade = 1 - easeInOut(clamp((t - 2.6) / 1.2));
    c.save(); c.beginPath(); c.rect(fx - fw / 2, fy - fh / 2, fw, fh); c.clip(); c.globalAlpha = 0.2 + 0.8 * fade;
    const base = fy + fh / 2 - 20;
    human(c, { x: fx - 190, y: base, s: 0.95, t: ctx.T, mood: 'proud', costume: { coat: '#2D3E5C', trim: PAL.gold, trousers: '#E9E2D2' }, hat: { style: 'cap', color: '#2D3E5C' }, hair: { style: 'short', color: '#5A3B22' }, beard: { color: '#5A3B22' }, armPose: 'down' });
    human(c, { x: fx + 30, y: base, s: 0.9, t: ctx.T + 1, mood: 'grin', costume: { coat: '#C0607A', trim: '#FFFFFF', trousers: '#C0607A' }, hair: { style: 'bun', color: '#7A4A2A' }, armPose: 'down' });
    human(c, { x: fx + 230, y: base, s: 0.55, t: ctx.T + 2, mood: 'grin', costume: { coat: '#E0A63A', trim: '#FFFFFF', trousers: '#E0A63A' }, hair: { style: 'curly', color: '#7A4A2A' }, armPose: 'wave' });
    c.restore();
    // seven sailor caps on pegs above the portrait = the seven crew
    for (let i = 0; i < 7; i++) {
      const x = 180 + i * 120, k = easeOutBack(clamp((t - 0.6 - i * 0.12) / 0.3));
      if (k <= 0) continue;
      c.save(); c.globalAlpha = 0.25 + 0.75 * fade; c.translate(x, 590); c.scale(k, k);
      ell(c, 0, 0, 12, 12, '#8A5A34', { lw: 4, k: 0 }); c.translate(0, 70); c.scale(0.7, 0.7);
      cel(c, (c) => { c.arc(0, -20, 62, Math.PI, 0); c.lineTo(100, -20); c.closePath(); }, '#2D3E5C', [-62, -82, 162, 62]); c.restore();
    }
    if (t > 3.2) popWord(c, '?', 540, 980, clamp((t - 3.2) / 0.3), 200, PAL.gold);
  },
  // 6 payoff: back on the hook's sea - the empty ship sails on, still unsolved
  payoff(c, t, beat, ctx) {
    c.drawImage(sea(), 0, 0);
    ship(c, 540, SEA_Y + 20 + Math.sin(t * 2.4) * 10, 0.55, { mood: 'worried', look: [Math.sin(t * 3), 0], T: ctx.T, rock: Math.sin(t * 2) * 0.04 });
    waves(c, SEA_Y + 60, ctx.T);
    popWord(c, '?', 220, 1100, clamp((t - 0.4) / 0.3), 110, PAL.gold);
    popWord(c, '?', 870, 1060, clamp((t - 0.8) / 0.3), 130);
  },
};

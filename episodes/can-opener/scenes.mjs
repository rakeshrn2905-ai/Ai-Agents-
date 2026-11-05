// Bespoke scenes for "Cans Came 40 Years Before Can Openers".
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, rrect, shade, tint } from '../../lib/draw.mjs';
import { objChar, BODIES } from '../../lib/chars.mjs';
import { actor } from '../../lib/scenes.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const STEEL = '#A9B4BC', IRON = '#5E6870', PEA = '#7DBA4A';

// ---------- object bodies ----------
BODIES.tincan = (c, col) => {
  const lidOff = col.lidOff ?? 0; // 0 = closed, >0 = lid popped up
  box(c, -115, -360, 230, 300, STEEL, { r: 16, k: 0.2 });
  c.strokeStyle = shade(STEEL, 0.3); c.lineWidth = 4;
  for (const y of [-330, -90]) { c.beginPath(); c.moveTo(-112, y); c.lineTo(112, y); c.stroke(); } // rims
  box(c, -115, -300, 230, 170, '#F4EDE0', { r: 4, lw: 5, k: 0.1 });                                   // paper label
  for (let i = 0; i < 3; i++) ell(c, -60 + i * 22, -165, 11, 11, PEA, { lw: 3, k: 0 });                 // little peas icon
  if (col.open) { ell(c, 0, -360, 115, 24, '#3A3F44', { k: 0 }); for (let i = 0; i < 5; i++) ell(c, -60 + i * 30, -368 + (i % 2) * 6, 14, 14, PEA, { lw: 3, k: 0 }); }
  else if (lidOff < 600) ell(c, 0, -360 - lidOff, 115, 24, tint(STEEL, 0.2), { k: 0 });              // lid (flies away when popped)
  return { face: [0, -235, 30], shL: [-115, -200], shR: [115, -200], hipL: [-50, -62], hipR: [50, -62], top: [0, -385], tip: [0, -385] };
};
BODIES.hammer = (c) => {
  box(c, -26, -330, 52, 270, PAL.wood, { r: 12 });          // handle
  box(c, -120, -460, 240, 130, IRON, { r: 14, k: 0.25 });   // iron head
  box(c, 96, -450, 34, 110, shade(IRON, 0.2), { r: 8 });     // striking face
  return { face: [-10, -395, 26], shL: [-26, -260], shR: [26, -260], hipL: [-18, -62], hipR: [18, -62], top: [0, -460], tip: [130, -395] };
};
BODIES.opener = (c) => {
  box(c, -36, -360, 72, 300, '#C0623E', { r: 30 });           // painted wooden handle
  cel(c, (c) => { c.moveTo(-30, -360); c.lineTo(30, -360); c.lineTo(30, -430); c.quadraticCurveTo(30, -500, -40, -505); c.lineTo(-40, -470); c.quadraticCurveTo(-2, -470, -2, -430); c.lineTo(-30, -430); c.closePath(); }, STEEL, [-40, -505, 70, 145]); // hooked blade
  return { face: [0, -260, 24], shL: [-36, -230], shR: [36, -230], hipL: [-18, -62], hipR: [18, -62], top: [-40, -505], tip: [-40, -490] };
};

// ---------- sets ----------
const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const kitchen = () => once('kitchen', (c) => { // bright Victorian kitchen for the hook and the payoff (loop)
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#FAD26E'); g.addColorStop(1, '#F2A65A');
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  for (let x = 0; x < W; x += 90) for (let y = 980; y < GROUND; y += 90) box(c, x + 4, y + 4, 82, 82, (x / 90 + y / 90) % 2 ? '#5AA9A0' : '#8FD0C4', { r: 6, lw: 3, k: 0 }); // tiles
  box(c, 610, 300, 340, 400, '#B07A45', { r: 8 });
  const sky = c.createLinearGradient(0, 318, 0, 682); sky.addColorStop(0, '#9FB8C8'); sky.addColorStop(1, '#DCEBF2');
  c.fillStyle = sky; c.fillRect(628, 318, 304, 364); c.strokeStyle = INK; c.lineWidth = LW; c.strokeRect(628, 318, 304, 364);
  c.lineWidth = 12; c.strokeStyle = '#B07A45'; c.beginPath(); c.moveTo(780, 318); c.lineTo(780, 682); c.moveTo(628, 500); c.lineTo(932, 500); c.stroke();
  box(c, 60, 560, 440, 26, shade('#B07A45', 0.1), { r: 4 });                                         // shelf
  for (let i = 0; i < 4; i++) { const x = 90 + i * 100; box(c, x, 460, 70, 100, i % 2 ? PAL.sage : PAL.coral, { r: 10, lw: 5 }); box(c, x - 4, 450, 78, 16, '#F4EDE0', { r: 4, lw: 4, k: 0 }); }
  c.fillStyle = '#C8664A'; c.fillRect(0, GROUND, W, H - GROUND);                                    // terracotta floor
  c.strokeStyle = shade('#C8664A', 0.2); c.lineWidth = 4;
  for (let y = GROUND + 80; y < H; y += 110) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const blueprint = () => once('blueprint', (c) => {
  c.fillStyle = '#2D4F6E'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 2;
  for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
});

function peas(c, x, y, n, r = 16) { for (let i = 0; i < n; i++) ell(c, x + ((i * 37) % 120) - 60, y - Math.floor(i / 5) * 24 - (i % 2) * 6, r, r, PEA, { lw: 4, k: 0.15 }); }

// Can cross-section: wall thickness animates (thick iron -> thin steel)
function section(c, wall, t) {
  const x = 290, y = 620, w = 500, h = 760;
  box(c, x, y, w, h, IRON, { r: 20, k: 0 });                                    // outer wall
  box(c, x + wall, y + wall, w - 2 * wall, h - 2 * wall, '#C9D3D9', { r: 10, lw: 4, k: 0 }); // tin lining
  box(c, x + wall + 10, y + wall + 10, w - 2 * wall - 20, h - 2 * wall - 20, '#EAF3E2', { r: 8, lw: 3, k: 0 });
  for (let i = 0; i < 26; i++) ell(c, x + wall + 50 + (i % 6) * ((w - 2 * wall - 100) / 5), y + h - wall - 50 - Math.floor(i / 6) * 60, 22, 22, PEA, { lw: 4, k: 0.15 });
  return { x, y, w, h };
}

// ---------- scenes ----------
export const SCENES = {
  // 0 hook: bright kitchen, the can already slamming down, the hammer grinning beside it
  canhook(c, t, beat, ctx) {
    c.drawImage(kitchen(), 0, 0);
    actor(c, { who: 'tincan', mood: 'shock', action: 'slam', armPose: 'shrug', s: 1.25 }, t, ctx, 330);
    actor(c, { who: 'hammer', mood: 'smug', action: t > 0.25 ? 'bounce' : undefined, armPose: 'hips', s: 1.15 }, t, ctx, 770);
    if (t > 0.25) burst(c, 330, GROUND - 20, 160, t - 0.25, 10, PAL.gold);
  },

  // 2: x-ray of an early can - thick iron wall, tin lining, food
  thickwall(c, t, beat, ctx) {
    c.drawImage(blueprint(), 0, 0);
    const wall = lerp(20, 70, easeOut(t / 0.6));
    const s = section(c, wall, t);
    label(c, 'THICK IRON', s.x + wall / 2, s.y + 260, 120, 520, clamp((t - 0.4) / 0.5));
    label(c, 'TIN LINING', s.x + s.w - wall - 6, s.y + 420, W - 120, 760, clamp((t - 1.0) / 0.5));
    label(c, 'FOOD', s.x + s.w / 2, s.y + s.h - 120, W - 120, 1450, clamp((t - 1.6) / 0.5));
  },

  // 3: on the scales, the can outweighs the food
  scales(c, t, beat, ctx) {
    c.drawImage(kitchen(), 0, 0);
    const tilt = -0.16 * easeOutBack(t / 0.7);                    // left side (can) goes down
    const px = 540, py = 820;
    box(c, px - 20, py, 40, GROUND - py - 40, PAL.brass, { r: 8 }); box(c, px - 140, GROUND - 60, 280, 50, PAL.brass, { r: 12 });
    c.save(); c.translate(px, py); c.rotate(tilt);
    box(c, -400, -16, 800, 32, PAL.brass, { r: 10 });
    c.restore();
    const end = (side) => [px + side * 380 * Math.cos(tilt), py + side * 380 * Math.sin(tilt)];
    for (const side of [-1, 1]) {
      const [ex, ey] = end(side);
      c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 110, ey + 150); c.moveTo(ex, ey); c.lineTo(ex + 110, ey + 150); c.stroke();
      cel(c, (c) => { c.moveTo(ex - 150, ey + 150); c.lineTo(ex + 150, ey + 150); c.quadraticCurveTo(ex, ey + 220, ex - 150, ey + 150); }, PAL.brass, [ex - 150, ey + 150, 300, 70]);
      if (side < 0) objChar(c, { body: 'tincan', x: ex, y: ey + 160, s: 0.55, t: ctx.T, mood: 'worried', armPose: 'shrug' });
      else peas(c, ex, ey + 138, 9, 18);
    }
  },

  // 4: hammer + chisel - the hammer jumps and strikes, the can winces
  hammering(c, t, beat, ctx) {
    c.drawImage(kitchen(), 0, 0);
    const hitAt = beat.hitAt ?? 0.9, hit = t > hitAt;
    objChar(c, { body: 'tincan', x: 330, y: GROUND, s: 1.2, t: ctx.T, mood: hit ? 'shock' : 'worried', armPose: 'shrug', lean: hit ? Math.sin((t - hitAt) * 30) * 4 * Math.exp(-(t - hitAt) * 4) : 0 });
    // chisel stuck in the lid
    c.save(); c.translate(360, GROUND - 470); c.rotate(0.25);
    box(c, -14, -170, 28, 150, PAL.wood, { r: 8 }); cel(c, (c) => { c.moveTo(-12, -20); c.lineTo(12, -20); c.lineTo(4, 20); c.lineTo(-4, 20); c.closePath(); }, STEEL, [-12, -20, 24, 40], { lw: 5 });
    c.restore();
    // chisel top is at about (402, GROUND-635); the hammer (flipped, s 1.05) has its striking face 136 px left of
    // its x and 415 px above its feet, so at impact it stands at (540, GROUND-220), in the air.
    const hx0 = 700, hx1 = 540, hyImpact = GROUND - 220;
    let hx, hy, lean;
    if (!hit) { const p = clamp(t / hitAt); hx = lerp(hx0, hx1, easeInOut(p)); hy = GROUND - Math.sin(p * Math.PI * 0.9) * 420 * (1 - p) - 220 * easeInOut(p); lean = lerp(-10, 25, p); }
    else { const q = clamp((t - hitAt - 0.25) / 0.5); hx = lerp(hx1, hx0, easeOut(q)); hy = lerp(hyImpact, GROUND, easeOut(q)); lean = lerp(25, 0, q); }
    objChar(c, { body: 'hammer', x: hx, y: hy, s: 1.05, t: ctx.T, mood: hit ? 'grin' : 'smug', armPose: 'cheer', lean, flip: true, legPose: hy < GROUND - 5 ? 'jump' : 'stand' });
    if (hit) burst(c, 402, GROUND - 640, 120, t - hitAt, 12, PAL.gold);
  },

  // 5: the wall gets thinner (1850s)
  thinwall(c, t, beat, ctx) {
    c.drawImage(blueprint(), 0, 0);
    const wall = lerp(70, 18, easeInOut(t / 0.9));
    const s = section(c, wall, t);
    label(c, 'THINNER', s.x + wall / 2, s.y + 300, 120, 560, clamp((t - 0.7) / 0.5));
  },

  // 6: the can opener walks in and pops the lid
  opening(c, t, beat, ctx) {
    c.drawImage(kitchen(), 0, 0);
    const popAt = beat.popAt ?? 1.5, open = t > popAt;
    const lid = open ? 1400 * Math.pow(clamp((t - popAt) / 0.7), 1.6) : 0; // lid flies up and out of frame
    objChar(c, { body: 'tincan', colors: { lidOff: lid, open: open && lid > 120 }, x: 330, y: GROUND, s: 1.2, t: ctx.T, mood: open ? 'grin' : 'worried', armPose: open ? 'cheer' : 'down' });
    if (open) { burst(c, 330, GROUND - 470, 150, t - popAt, 12, PAL.gold); peas(c, 330, GROUND - 470 - 60 * easeOut((t - popAt) / 0.5), 5, 14); }
    actor(c, { who: 'opener', mood: 'proud', action: 'walkin', from: 'right', armPose: 'point', s: 1.2, flip: true }, t, ctx, 720); // faces the can
  },

  // 7 payoff: same kitchen as the hook (seamless loop); the hammer sulks, the opener celebrates
  payoff(c, t, beat, ctx) {
    c.drawImage(kitchen(), 0, 0);
    objChar(c, { body: 'tincan', colors: { open: true }, x: 330, y: GROUND, s: 1.15, t: ctx.T, mood: 'chuckle', armPose: 'wave' });
    actor(c, { who: 'opener', mood: 'grin', action: 'bounce', armPose: 'cheer', s: 1.05, flip: true }, t, ctx, 620);
    actor(c, { who: 'hammer', mood: 'sad', action: 'sad', armPose: 'down', s: 0.8, flip: true }, t, ctx, 860);
  },
};

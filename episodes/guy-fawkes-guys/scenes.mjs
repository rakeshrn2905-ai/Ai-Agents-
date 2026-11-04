// Bespoke scenes for "'Guys' Comes From a 1605 Gunpowder Plot". Reuses the lib primitives.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, flame, burst, box, ell, cel, rrect, shade, tint } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { actor } from '../../lib/scenes.mjs';
import { setCanvas, GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

// ---------- new object bodies ----------
BODIES.barrel = (c, col) => {
  const base = col.base || '#8A5A34';
  cel(c, (c) => { c.moveTo(-120, -380); c.quadraticCurveTo(-160, -220, -120, -60); c.lineTo(120, -60); c.quadraticCurveTo(160, -220, 120, -380); c.closePath(); }, base, [-150, -380, 300, 320]);
  c.strokeStyle = shade(base, 0.35); c.lineWidth = 4;
  for (const x of [-60, 0, 60]) { c.beginPath(); c.moveTo(x, -378); c.quadraticCurveTo(x * 1.25, -220, x, -62); c.stroke(); }
  for (const y of [-340, -100]) { c.fillStyle = '#5B5B5B'; c.fillRect(-142, y - 12, 284, 24); c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(-142, y - 12, 284, 24); }
  ell(c, 0, -380, 120, 22, tint(base, 0.15), { k: 0 });
  return { face: [0, -230, 32], shL: [-138, -230], shR: [138, -230], hipL: [-60, -62], hipR: [60, -62], top: [0, -400], tip: [0, -400] };
};
BODIES.letter = (c) => {
  box(c, -150, -300, 300, 200, PAL.paper, { r: 8, k: 0.08 });
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(-150, -300); c.lineTo(0, -190); c.lineTo(150, -300); c.stroke();
  ell(c, 0, -190, 26, 26, PAL.red, { lw: 5, k: 0.2 });
  return { face: [0, -245, 26], shL: [-150, -200], shR: [150, -200], hipL: [-50, -100], hipR: [50, -100], top: [0, -300], tip: [0, -300] };
};

// ---------- sets ----------
const cache = {};
function once(name, draw) {
  if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; }
  return cache[name];
}
function stoneWall(c, top, bottom) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 4;
  for (let y = 0; y < GROUND; y += 80) for (let x = ((y / 80) % 2) * 70; x < W; x += 140) { c.beginPath(); rrect(c, x, y, 136, 76, 10); c.stroke(); }
}
function smallBarrel(c, x, y, s = 0.35) { c.save(); c.translate(x, y); c.scale(s, s); BODIES.barrel(c, {}); c.restore(); }
const cellar = () => once('cellar', (c) => {
  stoneWall(c, '#4A4038', '#6B5B4B');
  for (const ax of [270, 810]) { // arches
    c.fillStyle = '#2E2722'; c.beginPath(); c.moveTo(ax - 190, GROUND); c.lineTo(ax - 190, 560); c.arc(ax, 560, 190, Math.PI, 0); c.lineTo(ax + 190, GROUND); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
  }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) smallBarrel(c, 140 + i * 160 + r * 80, GROUND - 10 - r * 105, 0.33); // stacked barrels
  c.fillStyle = '#5A4A3A'; c.fillRect(0, GROUND, W, H - GROUND);
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});
const night = () => once('night', (c) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141C3A'); g.addColorStop(0.7, '#2D3E5C'); g.addColorStop(1, '#2D3E5C');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc((i * 397) % W, (i * 613) % 900, 2 + (i % 3), 0, 7); c.fill(); }
  const roofs = [[0, 980, 260], [240, 900, 220], [440, 1010, 260], [680, 930, 200], [860, 990, 220]];
  for (const [x, y, w] of roofs) { c.fillStyle = '#1B2238'; c.fillRect(x, y, w, GROUND - y); c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + w / 2, y - 90); c.lineTo(x + w + 10, y); c.fill();
    for (let wy = y + 50; wy < GROUND - 120; wy += 150) { c.fillStyle = '#F4D27A'; c.fillRect(x + 40, wy, 50, 70); c.fillRect(x + w - 90, wy, 50, 70); } }
  c.fillStyle = '#3A3226'; c.fillRect(0, GROUND, W, H - GROUND);
  c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});

function firework(c, x, y, t, col) {
  const p = (t % 1.6) / 1.6; if (p > 0.85) return;
  const r = 40 + 170 * easeOut(p / 0.85);
  c.save(); c.globalAlpha = 1 - p; c.strokeStyle = col; c.lineWidth = 7; c.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); }
  c.restore();
}
function bonfire(c, x, y, t, k = 1) {
  for (const [dx, a] of [[-120, 0.5], [120, -0.5], [-60, 0.2], [60, -0.2]]) { c.save(); c.translate(x + dx, y - 20); c.rotate(a); box(c, -16, -170, 32, 190, '#7A4E2D', { r: 8, lw: 6 }); c.restore(); }
  flame(c, x - 70, y - 40, 260 * k, t); flame(c, x + 70, y - 40, 240 * k, t + 0.4); flame(c, x, y - 40, 380 * k, t + 0.2);
}

const fawkesCard = { costume: { coat: '#2A2E3A', trim: PAL.gold, trousers: '#3A3A3A' }, hair: { style: 'short', color: '#6B3E22' }, beard: { color: '#6B3E22' }, hat: { style: 'capotain', color: '#1E1E1E' } };
const kingCard = { costume: { coat: '#8B1E2D', trim: PAL.gold, trousers: '#E9E2D2' }, hair: { style: 'curly', color: '#7A5A3A' }, beard: { color: '#7A5A3A' }, hat: { style: 'crown', color: PAL.gold } };
const guyCard = { costume: { coat: '#8FA889', trim: '#C9A043', trousers: '#B07A45' }, hair: { style: 'bald', color: '#000' }, hat: { style: 'top', color: '#5B4636' } };

// ---------- scenes ----------
export const SCENES = {
  // 0: frame-1 hook: barrel slams in, Fawkes already sneaking with a lantern glow
  guyhook(c, t, beat, ctx) {
    c.drawImage(cellar(), 0, 0);
    const glow = c.createRadialGradient(760, 1050, 30, 760, 1050, 520); glow.addColorStop(0, 'rgba(255,214,120,0.45)'); glow.addColorStop(1, 'rgba(255,214,120,0)');
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    actor(c, { who: 'barrel', mood: 'worried', action: 'slam', armPose: 'shrug', s: 1.25 }, t, ctx, 300);
    human(c, { ...fawkesCard, x: 760, y: GROUND, s: 1.45, t: ctx.T, mood: 'smug', armPose: 'hold', legPose: t < 0.9 ? 'walk' : 'stand', flip: true });
    flame(c, 760 - 150, GROUND - 600, 46, ctx.T); // lantern flame in his hand
  },

  // 1-2: x-ray cross-section of Parliament: Lords above, barrels below; king appears for phrase 2
  parliament(c, t, beat, ctx) {
    stoneWall(c, '#5E2C2C', '#7C3B3B');
    // Lords chamber (top)
    c.fillStyle = '#7C3B3B'; c.fillRect(0, 0, W, 860);
    for (let i = 0; i < 4; i++) box(c, 60 + i * 250, 640, 210, 70, '#B8323A', { r: 10 }); // red benches
    box(c, 440, 380, 200, 330, PAL.gold, { r: 14 }); box(c, 480, 430, 120, 200, '#B8323A', { r: 10, k: 0.1 }); // throne
    c.fillStyle = '#3A3028'; c.fillRect(0, 860, W, 50); c.strokeStyle = INK; c.lineWidth = 8; c.strokeRect(-10, 860, W + 20, 50); // floor slab
    // undercroft (bottom)
    c.fillStyle = '#3E352D'; c.fillRect(0, 910, W, H - 910);
    const shown = beat.countBarrels ? Math.min(36, Math.floor(clamp(t / 1.6) * 36)) : 36;
    for (let i = 0; i < shown; i++) { const r = Math.floor(i / 9), col = i % 9; smallBarrel(c, 110 + col * 108 + (r % 2) * 40, 1440 - r * 112, 0.3); }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 1460, W, H - 1460);
    if (beat.king) {
      const k = easeOutBack(t / 0.4);
      human(c, { ...kingCard, x: 540, y: 860 + (1 - k) * 300, s: 0.78, t: ctx.T, mood: 'shock', armPose: 'shrug' });
    } else {
      human(c, { ...fawkesCard, x: 900, y: 1500, s: 0.62, t: ctx.T, mood: 'smug', armPose: 'hips' });
    }
    if (!beat.king) {
      label(c, `${shown} BARRELS`, 540, 1250, 150, 1000, clamp((t - 0.9) / 0.5));
    }
  },

  // 3: the warning letter flies in, Fawkes is caught (shake set in storyboard)
  caught(c, t, beat, ctx) {
    c.drawImage(cellar(), 0, 0);
    const p = easeOut(t / 0.7);
    objChar(c, { body: 'letter', x: lerp(-200, 300, p), y: lerp(700, GROUND - 150, p) - Math.sin(p * Math.PI) * 300, s: 1.1, t: ctx.T, mood: 'grin', armPose: 'point', legPose: 'jump' });
    const at = beat.caughtAt ?? 1.4, caught = t > at;
    human(c, { ...fawkesCard, x: 760, y: GROUND, s: 1.45, t: ctx.T, mood: caught ? 'shock' : 'worried', armPose: caught ? 'cheer' : 'down' });
    if (caught) { burst(c, 760, 760, 260, t - at, 12, PAL.gold); }
  },

  // 4: bonfire night; the "guy" dummy appears on top for "Later, they burned dummies of him"
  bonfire(c, t, beat, ctx) {
    c.drawImage(night(), 0, 0);
    firework(c, 260, 380, ctx.T, PAL.gold); firework(c, 820, 300, ctx.T + 0.7, PAL.coral); firework(c, 560, 520, ctx.T + 1.2, PAL.teal);
    const guyAt = beat.guyAt ?? 2.2;
    if (t > guyAt) human(c, { ...guyCard, x: 540, y: GROUND - 230 + (1 - easeOutBack((t - guyAt) / 0.4)) * 400, s: 0.8, t: ctx.T, mood: 'worried', armPose: 'shrug' });
    bonfire(c, 540, GROUND + 10, ctx.T, clamp(t / 0.3));
    actor(c, { who: 'barrel', mood: 'grin', action: 'bounce', armPose: 'cheer', s: 0.7 }, t, ctx, 150);
    actor(c, { who: 'letter', mood: 'grin', action: 'bounce', armPose: 'cheer', s: 0.7 }, t + 0.3, ctx, 930);
  },

  // 5: dictionary card: the meaning changes over time
  dictionary(c, t, beat, ctx) {
    c.drawImage(setCanvas('paper'), 0, 0);
    box(c, 90, 520, 900, 900, '#FFFDF6', { r: 30, k: 0.04 });
    c.font = '900 96px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('guy', 540, 640);
    c.font = 'italic 700 40px "Noto Sans"'; c.fillStyle = '#6B635B'; c.fillText('noun', 540, 715);
    const rows = beat.rows || [];
    rows.forEach((r, i) => {
      const age = t - (r.at ?? i * 0.9); if (age < 0) return;
      const k = easeOutBack(age / 0.35), y = 860 + i * 180;
      c.save(); c.translate(540, y); c.scale(k, k);
      box(c, -400, -70, 180, 140, i === rows.length - 1 ? PAL.gold : PAL.sky, { r: 18, lw: 6, k: 0.1 });
      c.font = '900 54px "Noto Sans"'; c.fillStyle = INK; c.textAlign = 'center'; c.fillText(r.year, -310, 4);
      c.font = '800 50px "Noto Sans"'; c.textAlign = 'left'; c.fillText(r.text, -190, 4);
      c.restore();
    });
  },

  // 6: payoff: everyone is a "guy" now
  payoff(c, t, beat, ctx) { // named payoff so the engine adds DID YOU KNOW? COMMENT BELOW
    c.drawImage(night(), 0, 0);
    firework(c, 300, 360, ctx.T, PAL.gold); firework(c, 800, 420, ctx.T + 0.8, PAL.coral);
    bonfire(c, 540, GROUND - 120, ctx.T, 0.55);
    actor(c, { who: 'barrel', mood: 'grin', action: 'bounce', armPose: 'wave', s: 0.8 }, t, ctx, 170);
    human(c, { ...kingCard, x: 400, y: GROUND + 40, s: 0.95, t: ctx.T, mood: 'chuckle', armPose: 'wave' });
    human(c, { ...fawkesCard, x: 680, y: GROUND + 40, s: 0.95, t: ctx.T, mood: 'grin', armPose: 'cheer' });
    actor(c, { who: 'letter', mood: 'grin', action: 'bounce', armPose: 'cheer', s: 0.75 }, t + 0.4, ctx, 930);
  },
};

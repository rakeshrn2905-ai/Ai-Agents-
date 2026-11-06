// Bespoke scenes for "Cleopatra Was Closer to 1969 Than the Pyramids".
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, reveal, shade, tint } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const SAND = '#E8C27A', STONE = '#D9B26A';

export const cleo = { costume: { coat: '#F4EDE0', trim: PAL.gold, trousers: '#F4EDE0' }, hair: { style: 'bob', color: '#1E1A18' }, hat: { style: 'diadem', color: PAL.gold }, necklace: {} };
export const astro = { costume: { coat: '#F2F2F2', trim: '#C8382C', trousers: '#F2F2F2' }, hair: { style: 'short', color: '#7A5A3A' }, hat: { style: 'helmet' } };

// a stone block with a face, pushed up the ramp while the pyramid is being built
BODIES.block = (c) => {
  box(c, -120, -300, 240, 240, STONE, { r: 10, k: 0.22 });
  c.strokeStyle = shade(STONE, 0.3); c.lineWidth = 4; c.beginPath(); c.moveTo(-100, -200); c.lineTo(-40, -205); c.moveTo(30, -120); c.lineTo(95, -118); c.stroke();
  return { face: [0, -180, 30], shL: [-120, -170], shR: [120, -170], hipL: [-50, -62], hipR: [50, -62], top: [0, -300], tip: [0, -300] };
};

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
function pyramid(c, cx, base, half, height, courses = 9) {
  cel(c, (c) => { c.moveTo(cx - half, base); c.lineTo(cx, base - height); c.lineTo(cx + half, base); c.closePath(); }, STONE, [cx - half, base - height, half * 2, height], { k: 0.25 });
  c.strokeStyle = shade(STONE, 0.28); c.lineWidth = 3;
  for (let i = 1; i < courses; i++) { const y = base - height * i / courses, w = half * (1 - i / courses); c.beginPath(); c.moveTo(cx - w, y); c.lineTo(cx + w, y); c.stroke(); }
}
const desert = () => once('desert', (c) => { // bright, saturated: the hook and the loop
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#5DB7E8'); g.addColorStop(0.75, '#BFE6F5'); g.addColorStop(1, '#F7D38A');
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  ell(c, 860, 360, 90, 90, '#FFE27A', { lw: 0, k: 0 });
  pyramid(c, 250, GROUND - 40, 230, 300, 7); pyramid(c, 560, GROUND - 40, 330, 440, 9); pyramid(c, 880, GROUND - 40, 170, 220, 6);
  const s = c.createLinearGradient(0, GROUND - 80, 0, H); s.addColorStop(0, '#F2C46A'); s.addColorStop(1, '#E0A040');
  c.fillStyle = s; c.beginPath(); c.moveTo(0, GROUND - 40); c.quadraticCurveTo(W * 0.4, GROUND - 110, W, GROUND - 30); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = LW; c.beginPath(); c.moveTo(0, GROUND - 40); c.quadraticCurveTo(W * 0.4, GROUND - 110, W, GROUND - 30); c.stroke();
});
const building = () => once('building', (c) => { // the Great Pyramid under construction, with a ramp
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#6FC1EC'); g.addColorStop(1, '#F7D38A');
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  // unfinished pyramid: flat top
  cel(c, (c) => { c.moveTo(150, GROUND - 40); c.lineTo(430, GROUND - 600); c.lineTo(650, GROUND - 600); c.lineTo(930, GROUND - 40); c.closePath(); }, STONE, [150, GROUND - 600, 780, 560], { k: 0.25 });
  c.strokeStyle = shade(STONE, 0.28); c.lineWidth = 3;
  for (let i = 1; i < 8; i++) { const y = GROUND - 40 - i * 70, d = i * 70 * (280 / 560); c.beginPath(); c.moveTo(150 + d, y); c.lineTo(930 - d, y); c.stroke(); }
  cel(c, (c) => { c.moveTo(-20, GROUND - 40); c.lineTo(430, GROUND - 600); c.lineTo(470, GROUND - 600); c.lineTo(60, GROUND - 40); c.closePath(); }, '#C98B5E', [-20, GROUND - 600, 490, 560], { k: 0.2 }); // mud-brick ramp
  c.fillStyle = '#E0A040'; c.fillRect(0, GROUND - 40, W, H - GROUND + 40);
  c.strokeStyle = INK; c.lineWidth = LW; c.beginPath(); c.moveTo(0, GROUND - 40); c.lineTo(W, GROUND - 40); c.stroke();
});
const moon = () => once('moon', (c) => { // bright-ish lunar set for the 1969 beat
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16224A'); g.addColorStop(1, '#2D3E5C');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc((i * 397) % W, (i * 613) % 1100, 2 + (i % 3), 0, 7); c.fill(); }
  ell(c, 820, 330, 110, 110, '#5DB7E8', { k: 0.2 }); c.fillStyle = PAL.sage; c.beginPath(); c.arc(790, 310, 40, 0, 7); c.fill(); // Earth
  c.fillStyle = '#C9CBD1'; c.beginPath(); c.moveTo(0, GROUND - 60); c.quadraticCurveTo(W / 2, GROUND - 140, W, GROUND - 60); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = LW; c.stroke();
  for (const [x, y, r] of [[200, GROUND + 80, 60], [700, GROUND + 200, 90], [480, GROUND + 380, 50]]) { c.fillStyle = '#AEB1B8'; c.beginPath(); c.ellipse(x, y, r, r * 0.35, 0, 0, 7); c.fill(); c.lineWidth = 4; c.stroke(); }
});

// true-scale timeline: 2600 BC .. 2000 AD
const YX = (yr) => 210 + (yr + 2600) / 4600 * 670; // margins keep the year labels inside the frame after camera drift
function timeline(c, t, upTo, shown = 0) {
  c.fillStyle = '#F4EDE0'; c.fillRect(0, 0, W, H);
  const y = 850; // keeps both gap brackets clear of the caption at y~1500
  reveal(c, [[90, y], [990, y]], shown ? 1 : clamp(t / 0.4), 12); // line already drawn if marks were shown before
  const marks = [[-2560, 'PYRAMID', '2560 BC', STONE], [-30, 'CLEOPATRA', '30 BC', PAL.gold], [1969, 'MOON', '1969', '#5DB7E8']];
  marks.slice(0, upTo).forEach(([yr, name, txt, col], i) => {
    const x = YX(yr), k = i < shown ? 1 : easeOutBack(clamp((t - 0.2 - (i - shown) * 0.15) / 0.35)); // earlier marks stay put
    c.save(); c.translate(x, y); c.scale(k, k);
    ell(c, 0, 0, 26, 26, col);
    c.font = '900 56px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 12; c.strokeStyle = INK; c.strokeText(txt, 0, 90); c.fillStyle = '#FFFFFF'; c.fillText(txt, 0, 90);
    c.restore();
    if (k > 0.5) { // icon above each mark
      c.save(); c.translate(x, y - 60);
      if (name === 'PYRAMID') pyramid(c, 0, 0, 100, 160, 5);
      if (name === 'CLEOPATRA') human(c, { ...cleo, x: 0, y: 0, s: 0.6, t, mood: 'proud' });
      if (name === 'MOON') human(c, { ...astro, x: 0, y: 0, s: 0.6, t, mood: 'grin' });
      c.restore();
    }
  });
  return y;
}
function gap(c, x1, x2, y, text, p, col) { // bracket under the line with the gap length
  if (p <= 0) return;
  const xe = lerp(x1, x2, easeOut(p));
  c.strokeStyle = col; c.lineWidth = 10; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y); c.lineTo(xe, y); c.stroke();
  c.beginPath(); c.moveTo(x1, y - 22); c.lineTo(x1, y + 22); c.moveTo(xe, y - 22); c.lineTo(xe, y + 22); c.stroke();
  if (p > 0.6) {
    c.font = '900 64px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, (x1 + x2) / 2, y + 80); c.fillStyle = col; c.fillText(text, (x1 + x2) / 2, y + 80);
  }
}

export const SCENES = {
  // 0 hook: odd pair from frame 1 - Cleopatra beside an astronaut in front of the pyramids; punch-out camera
  cleohook(c, t, beat, ctx) {
    c.drawImage(desert(), 0, 0);
    human(c, { ...cleo, x: 300, y: GROUND + 30, s: 1.3, t: ctx.T, mood: 'shock', armPose: 'shrug' });
    const drop = clamp(t / 0.3); // astronaut lands (already in frame at t=0)
    human(c, { ...astro, x: 760, y: GROUND + 30 - (1 - drop * drop) * 260, s: 1.3, t: ctx.T, mood: 'grin', armPose: t > 0.3 ? 'wave' : 'cheer', legPose: drop < 1 ? 'walk' : 'stand' });
    if (t > 0.3) burst(c, 760, GROUND + 20, 140, t - 0.3, 10, '#FFFFFF');
  },
  // 1: "than to the building of the Great Pyramid" - blocks being pushed up the ramp
  pyramidbuild(c, t, beat, ctx) {
    c.drawImage(building(), 0, 0);
    const p = (t * 0.35) % 1;
    objChar(c, { body: 'block', x: lerp(120, 380, p), y: lerp(GROUND - 120, GROUND - 600, p) + 6, s: 0.5, t: ctx.T, mood: 'worried', armPose: 'shrug', lean: -28, legPose: 'walk' });
    objChar(c, { body: 'block', x: 760, y: GROUND - 40, s: 0.85, t: ctx.T, mood: 'grin', armPose: 'cheer', legPose: 'walk' });
  },
  // 2-4: the timeline, built mark by mark, then the two gaps
  timeline(c, t, beat, ctx) {
    const y = timeline(c, t, beat.upTo ?? 3, beat.shown ?? 0);
    if (beat.gapA != null) gap(c, YX(-2560), YX(-30), y + 170, '2,500 YRS', clamp((t - beat.gapA) / 0.6), PAL.coral);
    if (beat.gapB != null) gap(c, YX(-30), YX(1969), y + 330, '2,000 YRS', clamp((t - beat.gapB) / 0.6), PAL.teal);
  },
  // 4: Moon beat - astronaut on the Moon with a flag pole (no real flags/logos)
  moonwalk(c, t, beat, ctx) {
    c.drawImage(moon(), 0, 0);
    human(c, { ...astro, x: 540, y: GROUND + 40 - Math.abs(Math.sin(t * 3)) * 60, s: 1.3, t: ctx.T, mood: 'grin', armPose: 'cheer' });
  },
  // 5: to Cleopatra the pyramids were already ancient - she inspects them like a tourist
  ancient(c, t, beat, ctx) {
    c.drawImage(desert(), 0, 0);
    human(c, { ...cleo, x: 840, y: GROUND + 30, s: 1.2, t: ctx.T, mood: 'smug', armPose: 'point', flip: true });
    label(c, '2,500 YEARS OLD', 500, 1080, 150, 640, clamp((t - 0.5) / 0.5)); // anchored on the big pyramid's face
  },
  // 6 payoff: same desert as the hook (seamless loop) - Cleopatra and the astronaut wave together
  payoff(c, t, beat, ctx) {
    c.drawImage(desert(), 0, 0);
    human(c, { ...cleo, x: 320, y: GROUND + 30, s: 1.1, t: ctx.T, mood: 'grin', armPose: 'wave' });
    human(c, { ...astro, x: 760, y: GROUND + 30, s: 1.1, t: ctx.T, mood: 'chuckle', armPose: 'wave' });
  },
};

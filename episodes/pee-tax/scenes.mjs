// Bespoke scenes for "Rome Had a Pee Tax" - brain-rot format test: fast cuts, punch-ins, shakes, an SFX on every beat.
// Taste: no liquid shown, ever. Pots, sparkles, smell lines and coins only.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, rrect, shade, tint } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const TERRA = '#C8663E', MARBLE = '#F2EEE6', PURPLE = '#6B2E7A', GOLDC = '#F2B33D';
export const vesp = { costume: { coat: MARBLE, trim: PURPLE, trousers: MARBLE }, hair: { style: 'short', color: '#8A8A8A' }, hat: { style: 'laurel', color: '#4E9A3E' } }; // wreath needs an explicit colour (default is ink)
export const titus = { costume: { coat: MARBLE, trim: '#C8382C', trousers: MARBLE }, hair: { style: 'curly', color: '#5A3B22' } };

// collection pot (amphora) with a face - lid on, nothing visible inside
BODIES.amphora = (c) => {
  cel(c, (c) => { c.moveTo(-60, -400); c.lineTo(60, -400); c.quadraticCurveTo(170, -300, 120, -120); c.quadraticCurveTo(100, -60, 0, -60); c.quadraticCurveTo(-100, -60, -120, -120); c.quadraticCurveTo(-170, -300, -60, -400); c.closePath(); }, TERRA, [-160, -400, 320, 340]);
  box(c, -75, -430, 150, 40, shade(TERRA, 0.15), { r: 12 });
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 95, -350, 34, sx < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, sx < 0 ? Math.PI * 1.5 : Math.PI * 0.5, sx > 0); c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); }
  c.strokeStyle = shade(TERRA, 0.3); c.lineWidth = 6; c.beginPath(); c.moveTo(-120, -250); c.lineTo(120, -250); c.stroke();
  return { face: [0, -190, 30], shL: [-130, -220], shR: [130, -220], hipL: [-50, -62], hipR: [50, -62], top: [0, -430], tip: [0, -430] };
};
// a folded toga with a purple stripe
BODIES.toga = (c) => {
  cel(c, (c) => { c.moveTo(-130, -330); c.quadraticCurveTo(0, -380, 130, -330); c.lineTo(110, -70); c.quadraticCurveTo(0, -40, -110, -70); c.closePath(); }, '#FFFFFF', [-130, -380, 260, 340], { k: 0.12 });
  c.strokeStyle = PURPLE; c.lineWidth = 16; c.beginPath(); c.moveTo(-100, -330); c.quadraticCurveTo(-40, -200, -80, -80); c.stroke();
  return { face: [20, -210, 28], shL: [-125, -230], shR: [125, -230], hipL: [-45, -62], hipR: [45, -62], top: [0, -380], tip: [0, -380] };
};
// gold coin with a face
BODIES.coin = (c) => {
  ell(c, 0, -220, 150, 150, GOLDC, { k: 0.2 });
  ell(c, 0, -220, 118, 118, tint(GOLDC, 0.15), { k: 0, lw: 4 });
  return { face: [0, -210, 32], shL: [-150, -220], shR: [150, -220], hipL: [-50, -76], hipR: [50, -76], top: [0, -370], tip: [0, -370] };
};

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
function sky(c, top, bottom) { const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, W, GROUND); }
function floor(c, col) { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); }
function column(c, x, top, h) { box(c, x - 40, top, 80, h, MARBLE, { r: 6, k: 0.18 }); box(c, x - 60, top - 30, 120, 34, MARBLE, { r: 6 }); box(c, x - 60, top + h - 4, 120, 34, MARBLE, { r: 6 }); }
const forum = () => once('forum', (c) => { sky(c, '#3FA7D6', '#9FD8F0'); for (const x of [120, 400, 680, 960]) column(c, x, 620, 760); box(c, 30, 540, 1020, 80, TERRA, { r: 10 }); floor(c, '#E8C27A'); });
const fullery = () => once('fullery', (c) => { sky(c, '#F2B33D', '#F7D38A'); for (let x = 0; x < W; x += 180) box(c, x + 10, 300, 160, 120, '#E0663F', { r: 10, lw: 5, k: 0.15 }); floor(c, '#C8663E'); });
const palace = () => once('palace', (c) => { sky(c, '#8E44AD', '#C39BD3'); for (const x of [160, 920]) column(c, x, 520, 860); floor(c, '#F2EEE6'); });
const latrine = () => once('latrine', (c) => { // cartoon marble bench, nothing gross
  sky(c, '#5AA9A0', '#9FD8C9'); for (let x = 0; x < W; x += 90) for (let y = 0; y < GROUND; y += 90) if ((x / 90 + y / 90) % 2) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x, y, 90, 90); }
  box(c, 40, GROUND - 260, 1000, 90, MARBLE, { r: 14, k: 0.15 }); for (let i = 0; i < 5; i++) ell(c, 140 + i * 200, GROUND - 230, 45, 18, '#7A7A7A', { k: 0, lw: 4 });
  box(c, 60, GROUND - 170, 960, 170, shade(MARBLE, 0.08), { r: 0, k: 0.1 }); floor(c, '#E8C27A');
});
const paris = () => once('paris', (c) => { // Paris street with a green 'vespasienne' urinal booth (cartoon)
  sky(c, '#F28C8C', '#F7C28B');
  for (const [x, w, col] of [[0, 300, '#F2EEE6'], [300, 260, '#E8D9BE'], [560, 260, '#F2EEE6'], [820, 260, '#E8D9BE']]) { box(c, x, 520, w, GROUND - 520, col, { r: 0, k: 0.1 }); for (let wy = 600; wy < GROUND - 200; wy += 180) for (let wx = x + 40; wx < x + w - 60; wx += 100) box(c, wx, wy, 60, 110, '#5DB7E8', { r: 4, lw: 4, k: 0 }); }
  floor(c, '#9C9184');
});
function booth(c, x, y, s) { // green Paris urinal booth with a sign
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -140, -560, 280, 460, '#2E7D5B', { r: 30, k: 0.2 });
  cel(c, (c) => { c.moveTo(-170, -560); c.quadraticCurveTo(0, -680, 170, -560); c.closePath(); }, '#2E7D5B', [-170, -680, 340, 120]);
  box(c, -150, -110, 300, 40, '#1F5A41', { r: 8 });
  box(c, -125, -500, 250, 60, '#F4EDE0', { r: 8, lw: 5, k: 0 });
  c.font = '900 34px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('VESPASIENNE', 0, -468);
  c.restore();
}
function smell(c, x, y, t, n = 3) { // cartoon smell lines
  c.save(); c.strokeStyle = '#7DBA4A'; c.lineWidth = 9; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { c.beginPath(); for (let k = 0; k <= 20; k++) { const yy = y - k * 9, xx = x + (i - 1) * 50 + Math.sin(k * 0.6 + t * 8 + i) * 14; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  c.restore();
}
function sparkles(c, x, y, t, n = 6) { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + t * 2, r = 140 + 30 * Math.sin(t * 6 + i); burst(c, x + Math.cos(a) * r, y + Math.sin(a) * r, 26, ((t * 1.5 + i * 0.17) % 1) * 0.5, 4, '#FFFFFF'); } }
function stamp(c, x, y, t, text = 'TAXED') { // rubber stamp slams on
  const k = t < 0 ? 0 : t < 0.15 ? lerp(2.2, 1, t / 0.15) : 1; if (!k) return;
  c.save(); c.translate(x, y); c.rotate(-0.2); c.scale(k, k);
  c.strokeStyle = '#C8382C'; c.lineWidth = 14; c.beginPath(); c.roundRect(-190, -70, 380, 140, 20); c.stroke();
  c.font = '900 96px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#C8382C'; c.fillText(text, 0, 6);
  c.restore();
}

export const SCENES = {
  // 0 hook: Roman street, the pot slams in already in frame and gets TAXED
  peehook(c, t, beat, ctx) {
    c.drawImage(forum(), 0, 0);
    objChar(c, { body: 'amphora', x: 400, y: GROUND - Math.max(0, 1 - t / 0.2) * 140, s: 1.3, t: ctx.T, mood: 'shock', armPose: 'shrug', legPose: t < 0.2 ? 'jump' : 'stand' });
    objChar(c, { body: 'coin', x: 830, y: GROUND, s: 0.85, t: ctx.T, mood: 'grin', armPose: 'cheer', legPose: 'walk' });
    stamp(c, 420, 960, t - 0.35);
  },
  // 1-2: the laundry - togas bounce in a tub; then they sparkle
  laundry(c, t, beat, ctx) {
    c.drawImage(fullery(), 0, 0);
    box(c, 140, GROUND - 330, 800, 330, '#8A5A34', { r: 30, k: 0.2 });                    // wooden tub (no liquid shown)
    for (let i = 0; i < 3; i++) objChar(c, { body: 'toga', x: 280 + i * 260, y: GROUND - 200 - Math.abs(Math.sin(t * 7 + i)) * 80, s: 0.75, t: ctx.T + i, mood: i === 1 ? 'shock' : 'grin', armPose: 'cheer' });
    objChar(c, { body: 'amphora', x: 890, y: GROUND, s: 0.6, t: ctx.T, mood: 'smug', armPose: 'point', lean: -18, flip: true });
    if (beat.clean) { sparkles(c, 540, GROUND - 480, t, 8); label(c, 'AMMONIA', 940, GROUND - 300, W - 120, 640, clamp((t - 0.2) / 0.4)); }
  },
  // 3: Emperor Vespasian slams in
  emperor(c, t, beat, ctx) {
    c.drawImage(palace(), 0, 0);
    human(c, { ...vesp, x: 540, y: GROUND - Math.max(0, 1 - t / 0.2) * 120, s: 1.45, t: ctx.T, mood: 'smug', armPose: 'hips' });
    burst(c, 540, GROUND - 20, 200, t - 0.2, 12, GOLDC);
  },
  // 4: the public toilets' pee gets TAXED (pots lined up, stamp slams)
  taxed(c, t, beat, ctx) {
    c.drawImage(latrine(), 0, 0);
    for (let i = 0; i < 3; i++) objChar(c, { body: 'amphora', x: 230 + i * 310, y: GROUND, s: 0.7, t: ctx.T + i, mood: t > 0.4 ? 'shock' : 'neutral', armPose: 'shrug' });
    stamp(c, 540, 820, t - 0.35);
  },
  // 5: Titus complains - smell lines
  titus(c, t, beat, ctx) {
    c.drawImage(palace(), 0, 0);
    human(c, { ...titus, x: 540, y: GROUND, s: 1.45, t: ctx.T, mood: 'angry', armPose: 'shrug', lean: Math.sin(t * 18) * 2 });
    smell(c, 300, 900, ctx.T); smell(c, 790, 900, ctx.T + 1);
  },
  // 6-7: the coin to the nose; then "No."
  coinnose(c, t, beat, ctx) {
    c.drawImage(palace(), 0, 0);
    const s = 1.2;
    human(c, { ...vesp, x: 300, y: GROUND, s, t: ctx.T, mood: 'smug', armPose: 'point' });
    human(c, { ...titus, x: 760, y: GROUND, s, t: ctx.T, mood: beat.no ? 'proud' : 'worried', armPose: 'down', flip: true, lean: beat.no ? Math.sin(t * 14) * 5 : 0 });
    // 'point' puts Vespasian's right hand at local (56 + 150K, -360 - 30K), K = 190/150 -> (246, -398)
    const hx = 300 + 246 * s, hy = GROUND - 398 * s;
    objChar(c, { body: 'coin', x: hx + 10, y: hy + 330 * 0.42, s: 0.42, t: ctx.T, mood: 'grin', armPose: 'down', legPose: 'jump' });
  },
  // 8: money doesn't stink - coins rain
  coinrain(c, t, beat, ctx) {
    c.drawImage(palace(), 0, 0);
    for (let i = 0; i < 9; i++) { const x = 90 + (i * 131) % 900, y = ((t * 900 + i * 260) % 1500) - 200; ell(c, x, y, 46, 46, GOLDC, { k: 0.2 }); }
    human(c, { ...vesp, x: 540, y: GROUND, s: 1.4, t: ctx.T, mood: 'grin', armPose: 'cheer' });
  },
  // 9 payoff: Paris named urinals after him
  payoff(c, t, beat, ctx) { // a Paris booth dropped into the Roman street from the hook: absurd + seamless loop
    c.drawImage(forum(), 0, 0);
    booth(c, 760, GROUND, 0.85);   // sizes keep heads and the booth roof below the CTA text band
    human(c, { ...vesp, x: 360, y: GROUND, s: 1.0, t: ctx.T, mood: 'shock', armPose: 'point' });
  },
};

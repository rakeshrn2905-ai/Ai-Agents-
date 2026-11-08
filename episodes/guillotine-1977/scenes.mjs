// Bespoke scenes for "France Used the Guillotine Until 1977".
// Taste: no people shown or named, no blood. The guillotine is a faceless antique object; the characters are 1977 things.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade, tint } from '../../lib/draw.mjs';
import { objChar, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const ORANGE = '#E8892E', BROWN = '#8A5A34', MUSTARD = '#E0B54A', TEAL70 = '#2E8B8B', WOOD = '#9B6B3E', STEEL = '#B8C2C9';

// faceless guillotine (antique object): two posts, crossbar, angled blade, base
export function guillotine(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  box(c, -150, -60, 300, 60, shade(WOOD, 0.1), { r: 8 });                 // base
  box(c, -120, -760, 46, 710, WOOD, { r: 8, k: 0.2 }); box(c, 74, -760, 46, 710, WOOD, { r: 8, k: 0.2 }); // posts
  box(c, -150, -800, 300, 56, WOOD, { r: 10, k: 0.15 });                  // crossbar
  cel(c, (c) => { c.moveTo(-74, -720); c.lineTo(74, -720); c.lineTo(74, -640); c.lineTo(-74, -600); c.closePath(); }, STEEL, [-74, -720, 148, 120], { k: 0.15 }); // angled blade, held at the top
  box(c, -74, -250, 148, 40, shade(WOOD, 0.2), { r: 6 });                 // lower crossbar (empty)
  c.restore();
}
BODIES.cassette = (c) => {
  box(c, -170, -300, 340, 220, '#3A3F4B', { r: 18, k: 0.12 });
  box(c, -140, -280, 280, 70, ORANGE, { r: 8, lw: 5, k: 0 });                // label
  box(c, -110, -200, 220, 80, '#F4EDE0', { r: 30, lw: 5, k: 0 });            // window (face sits here)
  for (const sx of [-1, 1]) ell(c, sx * 70, -160, 22, 22, '#3A3F4B', { lw: 4, k: 0 });
  return { face: [0, -158, 22], shL: [-170, -200], shR: [170, -200], hipL: [-60, -80], hipR: [60, -80], top: [0, -300], tip: [0, -300] };
};
BODIES.tv70 = (c, col) => {
  box(c, -200, -420, 400, 330, WOOD, { r: 26, k: 0.18 });                    // wooden cabinet
  box(c, -165, -390, 250, 200, col.screen || '#9FD8F0', { r: 30, lw: 6, k: 0 });
  if (col.stars) { for (let i = 0; i < 14; i++) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-150 + (i * 53) % 230, -375 + (i * 37) % 170, 3 + (i % 3), 0, 7); c.fill(); }
    cel(c, (c) => { c.moveTo(-60, -260); c.lineTo(-10, -300); c.lineTo(30, -290); c.lineTo(-20, -250); c.closePath(); }, '#F4EDE0', [-60, -300, 90, 50], { lw: 4, k: 0 }); }
  for (const yy of [-370, -320, -270]) ell(c, 140, yy, 16, 16, MUSTARD, { lw: 4, k: 0 });  // knobs
  box(c, -150, -170, 300, 60, '#F4EDE0', { r: 14, lw: 5, k: 0 });             // face panel under the screen
  return { face: [0, -142, 22], shL: [-200, -260], shR: [200, -260], hipL: [-110, -90], hipR: [110, -90], top: [0, -420], tip: [0, -420] };
};
BODIES.discoball = (c) => {
  ell(c, 0, -240, 150, 150, '#C9D3DE', { k: 0.2 });
  c.strokeStyle = 'rgba(42,38,34,0.35)'; c.lineWidth = 3;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-150, -240 + i * 40); c.lineTo(150, -240 + i * 40); c.stroke(); c.beginPath(); c.moveTo(i * 40, -390); c.lineTo(i * 40, -90); c.stroke(); }
  box(c, -60, -280, 120, 70, '#F4EDE0', { r: 26, lw: 4, k: 0 });             // face patch
  return { face: [0, -246, 20], shL: [-150, -240], shR: [150, -240], hipL: [-50, -100], hipR: [50, -100], top: [0, -390], tip: [0, -390] };
};

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
function floor(c, col) { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); }
const room70 = () => once('room70', (c) => { // bright 1970s living room: hook + loop
  c.fillStyle = '#F2C45A'; c.fillRect(0, 0, W, GROUND);
  for (let x = 0; x < W + 120; x += 180) for (let y = 0; y < GROUND; y += 180) { ell(c, x, y, 70, 70, ORANGE, { lw: 0, k: 0 }); ell(c, x, y, 40, 40, '#F2C45A', { lw: 0, k: 0 }); ell(c, x + 90, y + 90, 30, 30, TEAL70, { lw: 0, k: 0 }); }
  floor(c, BROWN);
  c.fillStyle = '#E07A3E'; for (let x = 0; x < W; x += 60) c.fillRect(x, GROUND + 20, 30, H - GROUND - 20); // shag rug stripes
});
const square = () => once('square', (c) => { // Paris square, 1792 (no people)
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#5DB7E8'); g.addColorStop(1, '#BFE6F5'); c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  for (const [x, w] of [[0, 330], [330, 300], [630, 450]]) { box(c, x, 620, w, GROUND - 620, '#E8D9BE', { r: 0, k: 0.1 }); for (let wy = 700; wy < GROUND - 180; wy += 170) for (let wx = x + 40; wx < x + w - 60; wx += 110) box(c, wx, wy, 60, 110, '#5B7FA3', { r: 4, lw: 4, k: 0 }); }
  for (const fx of [120, 960]) { box(c, fx - 6, 380, 12, 300, '#6B4A2E', { r: 4 }); box(c, fx + 6, 390, 50, 90, '#2D3E9C', { r: 0, lw: 4, k: 0 }); box(c, fx + 56, 390, 50, 90, '#FFFFFF', { r: 0, lw: 4, k: 0 }); box(c, fx + 106, 390, 50, 90, '#D9303A', { r: 0, lw: 4, k: 0 }); }
  c.fillStyle = '#C9B48A'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
  box(c, 260, GROUND - 120, 560, 120, WOOD, { r: 8, k: 0.15 });           // wooden platform
});
const prison = () => once('prison', (c) => {
  c.fillStyle = '#8FB8D8'; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = '#B9B2A5'; c.fillRect(0, 500, W, GROUND - 500);
  c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 4; for (let y = 500; y < GROUND; y += 80) for (let x = ((y / 80) % 2) * 70; x < W; x += 140) c.strokeRect(x, y, 136, 76);
  c.strokeStyle = INK; c.lineWidth = 8; c.strokeRect(-10, 500, W + 20, GROUND - 500);
  floor(c, '#9C9184');
});
const museum = () => once('museum', (c) => {
  c.fillStyle = '#F2EEE6'; c.fillRect(0, 0, W, GROUND);
  for (const x of [80, 1000]) box(c, x - 30, 300, 60, GROUND - 300, '#E0D8C8', { r: 6, k: 0.15 });
  floor(c, '#C9B48A');
});
const mapbg = () => once('mapbg', (c) => { c.fillStyle = '#9FD8F0'; c.fillRect(0, 0, W, H); });
function france(c, cx, cy, s) { // simplified France outline (cartoon)
  const pts = [[-40, -300], [60, -260], [190, -200], [230, -60], [200, 60], [230, 180], [150, 260], [40, 300], [-60, 270], [-150, 300], [-200, 200], [-170, 60], [-250, -30], [-300, -70], [-200, -150], [-120, -170]];
  cel(c, (c) => { pts.forEach(([x, y], i) => (i ? c.lineTo(cx + x * s, cy + y * s) : c.moveTo(cx + x * s, cy + y * s))); c.closePath(); }, '#8FA889', [cx - 300 * s, cy - 300 * s, 530 * s, 600 * s], { k: 0.12 });
}

function cast70(c, ctx, t, mood = 'shock') {
  objChar(c, { body: 'cassette', x: 220, y: GROUND, s: 0.8, t: ctx.T, mood, armPose: 'shrug' });
  objChar(c, { body: 'tv70', colors: {}, x: 860, y: GROUND, s: 0.75, t: ctx.T + 1, mood, armPose: 'shrug' });
}

export const SCENES = {
  // 0 hook: the guillotine slams into a bright 1977 living room (odd pairing), 1977 things react
  ghook(c, t, beat, ctx) {
    c.drawImage(room70(), 0, 0);
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(230, 0); c.lineTo(230, 960 - 390 * 0.45); c.stroke(); // hanging string
    objChar(c, { body: 'discoball', x: 230, y: 960, s: 0.45, t: ctx.T, mood: 'shock', armPose: 'cheer', legPose: 'jump' });
    guillotine(c, 540, GROUND - Math.max(0, 1 - t / 0.22) * 120, 0.9);
    cast70(c, ctx, t);
    if (t > 0.22) burst(c, 540, GROUND - 30, 200, t - 0.22, 12, '#FFFFFF');
  },
  // 1: same year as Star Wars - the TV shows a starfield and a little ship (generic, no film imagery)
  sameyear(c, t, beat, ctx) {
    c.drawImage(room70(), 0, 0);
    objChar(c, { body: 'tv70', colors: { screen: '#1F2A44', stars: true }, x: 540, y: GROUND, s: 1.35, t: ctx.T, mood: 'grin', armPose: 'cheer' });
    objChar(c, { body: 'cassette', x: 170, y: GROUND, s: 0.6, t: ctx.T + 1, mood: 'shock', armPose: 'shrug' });
    objChar(c, { body: 'discoball', x: 920, y: GROUND, s: 0.55, t: ctx.T + 2, mood: 'shock', armPose: 'shrug' });
  },
  // 2: 1792, the Revolution - Paris square with tricolours (no people)
  y1792(c, t, beat, ctx) {
    c.drawImage(square(), 0, 0);
    guillotine(c, 540, GROUND - 120, 0.8 * easeOutBack(clamp(t / 0.35)));
  },
  // 3: after 1939 - prison gates swing shut in front of it
  walls(c, t, beat, ctx) {
    c.drawImage(prison(), 0, 0);
    box(c, 240, 600, 600, GROUND - 600, '#2E3640', { r: 0, k: 0 });          // dark gateway, behind it
    guillotine(c, 540, GROUND, 0.75);
    const gw = 300 * easeInOut(clamp((t - 0.6) / 0.9));                        // gates close from both sides
    for (const gx of [240, 840 - gw]) {
      if (gw < 2) continue;
      box(c, gx, 600, gw, GROUND - 600, '#5B6A78', { r: 4, k: 0.15 });
      c.strokeStyle = INK; c.lineWidth = 6;
      for (let bx = 25; bx < gw; bx += 50) { c.beginPath(); c.moveTo(gx + bx, 600); c.lineTo(gx + bx, GROUND); c.stroke(); }
    }
  },
  // 4: the last one - map of France, pin drops on Marseille, calendar SEP 1977
  marseille(c, t, beat, ctx) {
    c.drawImage(mapbg(), 0, 0);
    france(c, 540, 1000, 1.25);
    const k = easeOutBack(clamp((t - 0.4) / 0.35)), px = 540 + 95 * 1.25, py = 1000 + 255 * 1.25 - 60;
    if (k > 0) { c.save(); c.translate(px, py); c.scale(k, k); ell(c, 0, -60, 38, 38, '#C8382C', { k: 0.2 }); c.beginPath(); c.moveTo(-14, -40); c.lineTo(0, 10); c.lineTo(14, -40); c.fillStyle = '#C8382C'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); }
    label(c, 'MARSEILLE', px, py - 60, 150, 1250, clamp((t - 0.8) / 0.5), { size: 52 }); // clear of the caption
    const kc = easeOutBack(clamp((t - 1.4) / 0.35));
    if (kc > 0) { c.save(); c.translate(830, 600); c.scale(kc, kc); box(c, -130, -140, 260, 280, '#FFFFFF', { r: 14, k: 0.06 }); box(c, -130, -140, 260, 70, '#C8382C', { r: 14, k: 0 }); c.font = '900 50px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('SEP', 0, -105); c.fillStyle = INK; c.font = '900 88px "Noto Sans"'; c.fillText('1977', 0, 40); c.restore(); }
  },
  // 5: 1981 - roped off in a museum
  museumbeat(c, t, beat, ctx) {
    c.drawImage(museum(), 0, 0);
    guillotine(c, 540, GROUND - 40, 0.75);
    for (const x of [200, 880]) { box(c, x - 12, GROUND - 200, 24, 200, PAL.gold, { r: 6 }); ell(c, x, GROUND - 205, 26, 26, PAL.gold, { k: 0.2 }); }
    c.strokeStyle = '#C8382C'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(200, GROUND - 190); c.quadraticCurveTo(540, GROUND - 90 + Math.sin(t * 3) * 6, 880, GROUND - 190); c.stroke();
    const k = easeOutBack(clamp((t - 0.5) / 0.35));
    if (k > 0) { c.save(); c.translate(540, 560); c.scale(k, k); box(c, -220, -60, 440, 120, '#2D3E5C', { r: 14, k: 0 }); c.font = '900 64px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('MUSEUM', 0, 4); c.restore(); }
  },
  // 6 payoff: back in the 1977 room (loop) - everyone dances, the guillotine stands in the corner
  payoff(c, t, beat, ctx) {
    c.drawImage(room70(), 0, 0);
    guillotine(c, 900, GROUND, 0.55);
    objChar(c, { body: 'cassette', x: 200, y: GROUND - Math.abs(Math.sin(t * 6)) * 40, s: 0.7, t: ctx.T, mood: 'chuckle', armPose: 'cheer' });
    objChar(c, { body: 'tv70', colors: {}, x: 560, y: GROUND - Math.abs(Math.sin(t * 6 + 1)) * 40, s: 0.7, t: ctx.T + 1, mood: 'grin', armPose: 'wave' });
  },
};

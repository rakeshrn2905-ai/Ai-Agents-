// Bespoke scenes for "The Sandwich Is Named After a Real Earl (1762)".
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade, tint } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const BREAD = '#E8B76A', CRUST = '#B9783A', HAM = '#E88A8A', LETTUCE = '#7DBA4A';
export const earl = { costume: { coat: '#B23A48', trim: PAL.gold, trousers: '#F4EDE0' }, hair: { style: 'wig', color: '#F2EEE6' } };
export const cook = { costume: { coat: '#2D3E5C', trim: PAL.gold, trousers: '#F4EDE0' }, hair: { style: 'wig', color: '#E8E2D2' }, hat: { style: 'tricorn', color: '#1E1E1E' } };

function sandwichShape(c) { // bread / lettuce / ham / bread, drawn around (0,0) in a 300 x 200 box
  cel(c, (c) => { c.moveTo(-150, 40); c.quadraticCurveTo(0, 90, 150, 40); c.lineTo(150, 70); c.quadraticCurveTo(0, 120, -150, 70); c.closePath(); }, BREAD, [-150, 40, 300, 80]);
  c.fillStyle = LETTUCE; c.beginPath(); for (let i = 0; i <= 12; i++) { const x = -160 + i * 26.6; c.lineTo(x, 20 + (i % 2) * 22); } c.lineTo(150, 50); c.lineTo(-150, 50); c.closePath(); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  box(c, -150, -10, 300, 34, HAM, { r: 14, lw: 5, k: 0.15 });
  cel(c, (c) => { c.moveTo(-150, -10); c.quadraticCurveTo(-150, -110, 0, -110); c.quadraticCurveTo(150, -110, 150, -10); c.closePath(); }, BREAD, [-150, -110, 300, 100], { k: 0.15 });
  c.strokeStyle = CRUST; c.lineWidth = 8; c.beginPath(); c.moveTo(-140, -20); c.quadraticCurveTo(-140, -100, 0, -100); c.quadraticCurveTo(140, -100, 140, -20); c.stroke();
}
BODIES.sandwich = (c) => {
  c.save(); c.translate(0, -230); c.scale(1.2, 1.2); sandwichShape(c); c.restore();
  return { face: [0, -300, 30], shL: [-180, -230], shR: [180, -230], hipL: [-60, -100], hipR: [60, -100], top: [0, -370], tip: [0, -370] };
};
function sandwichProp(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); sandwichShape(c); c.restore(); }
function card(c, x, y, a, s, suit) { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); box(c, -60, -85, 120, 170, '#FFFFFF', { r: 12, lw: 5, k: 0.06 }); c.font = '900 70px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = suit.red ? '#C8382C' : INK; c.fillText(suit.r, 0, 5); c.restore(); }

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
function wall(c, top, bottom) { const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, W, GROUND); }
function floor(c, col) { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); }
const dining = () => once('dining', (c) => { // bright Georgian dining room: hook
  wall(c, '#7CC6D9', '#B7E3EC');
  for (let x = 60; x < W; x += 240) box(c, x, 0, 30, GROUND - 120, '#FFFFFF', { r: 0, lw: 0, k: 0 });
  box(c, 430, 560, 220, 200, PAL.gold, { r: 10 }); box(c, 448, 578, 184, 164, '#9FB8C8', { r: 6, k: 0.1 });       // portrait frame (below the title even at punch-in zoom)
  ell(c, 540, 640, 34, 34, '#FFFFFF', { k: 0.05 }); box(c, 492, 676, 96, 62, '#B23A48', { r: 16, k: 0.1 });     // little portrait of the earl
  box(c, 0, GROUND - 120, W, 120, '#8A5A34', { r: 0, k: 0.15 }); floor(c, '#C8663E');
});
const gaming = () => once('gaming', (c) => { // card room
  wall(c, '#2E7D5B', '#5AA9A0');
  for (let x = 0; x < W; x += 150) { c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x, 0, 70, GROUND); }
  box(c, 60, GROUND - 260, 960, 160, '#1F6B48', { r: 30, k: 0.15 });  // green baize table
  box(c, 100, GROUND - 100, 40, 100, '#6B4A2E', { r: 6 }); box(c, 940, GROUND - 100, 40, 100, '#6B4A2E', { r: 6 });
  floor(c, '#8A5A34');
});
const admiralty = () => once('admiralty', (c) => { // office background (desk is drawn in front of the earl)
  wall(c, '#F2B33D', '#F7D38A');
  box(c, 640, 260, 360, 260, '#F4EDE0', { r: 8, k: 0.06 }); c.strokeStyle = '#5DB7E8'; c.lineWidth = 6; c.beginPath(); c.moveTo(670, 450); c.quadraticCurveTo(820, 320, 970, 420); c.stroke(); // chart
  floor(c, '#7A3B2E');
});
function deskFront(c) { // foreground desk with papers and a ship model
  box(c, 60, GROUND - 260, 960, 70, '#8A5A34', { r: 10, k: 0.15 }); box(c, 80, GROUND - 190, 920, 190, '#6B4A2E', { r: 0, k: 0.12 });
  box(c, 140, GROUND - 320, 200, 60, '#F4EDE0', { r: 4, lw: 4, k: 0 }); box(c, 170, GROUND - 340, 200, 60, '#FFFFFF', { r: 4, lw: 4, k: 0 });
  cel(c, (c) => { c.moveTo(780, GROUND - 260); c.lineTo(980, GROUND - 260); c.lineTo(950, GROUND - 300); c.lineTo(810, GROUND - 300); c.closePath(); }, CRUST, [780, GROUND - 300, 200, 40]);
  c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(880, GROUND - 300); c.lineTo(880, GROUND - 460); c.stroke();
  cel(c, (c) => { c.moveTo(886, GROUND - 450); c.lineTo(960, GROUND - 330); c.lineTo(886, GROUND - 330); c.closePath(); }, '#FFFFFF', [886, GROUND - 450, 74, 120]);
}
const beach = () => once('beach', (c) => { // Hawaii: bright sea, palm, sun
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#3FA7D6'); g.addColorStop(1, '#9FE0F0'); c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  ell(c, 830, 330, 100, 100, '#FFE27A', { lw: 0, k: 0 });
  c.fillStyle = '#1F8FBF'; c.fillRect(0, GROUND - 260, W, 160); c.strokeStyle = '#FFFFFF'; c.lineWidth = 6; for (let x = 20; x < W; x += 140) { c.beginPath(); c.arc(x, GROUND - 230, 30, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  cel(c, (c) => { c.moveTo(80, GROUND - 100); c.quadraticCurveTo(130, 700, 210, 520); c.lineTo(235, 530); c.quadraticCurveTo(165, 720, 115, GROUND - 100); c.closePath(); }, CRUST, [80, 520, 155, GROUND - 620]); // palm trunk
  for (const a of [-2.6, -2.0, -1.2, -0.5, 0.2]) { c.save(); c.translate(222, 520); c.rotate(a); cel(c, (c) => { c.moveTo(0, 0); c.quadraticCurveTo(110, -60, 230, 10); c.quadraticCurveTo(110, -10, 0, 0); }, '#3F9A4A', [0, -60, 230, 70]); c.restore(); }
  c.fillStyle = '#F2D38A'; c.fillRect(0, GROUND - 100, W, H - GROUND + 100); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND - 100); c.lineTo(W, GROUND - 100); c.stroke();
});

export const SCENES = {
  // 0 hook: a giant sandwich slams onto the table next to the earl (odd pair, already moving)
  sandhook(c, t, beat, ctx) {
    c.drawImage(dining(), 0, 0);
    human(c, { ...earl, x: 300, y: GROUND + 20, s: 1.3, t: ctx.T, mood: 'shock', armPose: 'shrug' });
    objChar(c, { body: 'sandwich', x: 770, y: GROUND - 110 - Math.max(0, 1 - t / 0.25) * 90, s: 1.1, t: ctx.T, mood: 'grin', armPose: 'cheer', legPose: t < 0.25 ? 'jump' : 'stand' });
    if (t > 0.25) burst(c, 770, GROUND - 120, 160, t - 0.25, 10, '#FFFFFF');
  },
  // 1: the Earl of Sandwich, proud, in front of his portrait
  theearl(c, t, beat, ctx) {
    c.drawImage(dining(), 0, 0);
    human(c, { ...earl, x: 540, y: GROUND + 20, s: 1.2 * easeOutBack(clamp(t / 0.3)), t: ctx.T, mood: 'proud', armPose: 'hips' }); // head stays below the portrait
  },
  // 2: legend - gambling, sandwich in hand, cards flying
  gambling(c, t, beat, ctx) {
    c.drawImage(gaming(), 0, 0);
    for (let i = 0; i < 6; i++) { const p = ((t * 0.7 + i / 6) % 1); card(c, 120 + i * 170, 900 - p * 500, Math.sin(t * 3 + i) * 0.5, 0.75, [{ r: 'A' }, { r: 'K', red: 1 }, { r: 'Q' }, { r: 'J', red: 1 }, { r: 'A', red: 1 }, { r: 'K' }][i]); }
    const s = 1.25;
    human(c, { ...earl, x: 470, y: GROUND + 20, s, t: ctx.T, mood: 'grin', armPose: 'hold' });
    // 'hold' puts the right hand at local (195, -347): the sandwich sits in that palm
    sandwichProp(c, 470 + 195 * s, GROUND + 20 - 347 * s - 20, 0.45);
  },
  // 3: biographer's view - working at his Admiralty desk, sandwich beside the papers
  desk(c, t, beat, ctx) {
    c.drawImage(admiralty(), 0, 0);
    human(c, { ...earl, x: 540, y: GROUND + 20, s: 1.3, t: ctx.T, mood: 'worried', armPose: { l: [40, 140], r: [60, 150] } });
    deskFront(c);                                  // desk in front: he stands behind it
    sandwichProp(c, 300, GROUND - 330, 0.45);      // sandwich next to the papers
  },
  // 4: he didn't invent it - older bread-and-meat meals; the WORD stamped 1762
  word1762(c, t, beat, ctx) {
    c.drawImage(once('paper', (c) => { c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H); }), 0, 0);
    objChar(c, { body: 'sandwich', x: 540, y: 1320, s: 1.0, t: ctx.T, mood: 'proud', armPose: 'present' });
    const k = easeOutBack(clamp((t - 0.6) / 0.35));
    if (k > 0) { c.save(); c.translate(540, 700); c.rotate(-0.08); c.scale(k, k);
      box(c, -330, -110, 660, 220, '#FFFFFF', { r: 20, lw: 8, k: 0 });
      c.font = '900 110px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('"sandwich"', 0, -20);
      c.font = '900 56px "Noto Sans"'; c.fillStyle = '#C8382C'; c.fillText('IN USE BY 1762', 0, 60); c.restore(); }
  },
  // 5 payoff: Hawaii - Captain Cook names the Sandwich Islands
  payoff(c, t, beat, ctx) {
    c.drawImage(beach(), 0, 0);
    // signpost on the beach (sized so heads stay below the CTA band at y 560-820)
    box(c, 870, GROUND - 520, 24, 460, CRUST, { r: 6 });
    box(c, 720, GROUND - 560, 330, 120, '#F4EDE0', { r: 12, k: 0.08 });
    c.font = '900 40px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('SANDWICH', 885, GROUND - 525); c.fillText('ISLANDS', 885, GROUND - 478);
    human(c, { ...cook, x: 600, y: GROUND - 60, s: 0.85, t: ctx.T, mood: 'grin', armPose: 'present' });
    objChar(c, { body: 'sandwich', x: 300, y: GROUND - 60, s: 0.7, t: ctx.T, mood: 'chuckle', armPose: 'cheer' });
  },
};

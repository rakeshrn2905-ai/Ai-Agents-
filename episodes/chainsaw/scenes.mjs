// Bespoke scenes for "Chainsaws Were Invented for Childbirth" (Aitken & Jeffray, 1780s).
// Taste: no patient, no body, no blood, no operation. Only two doctors, a clock, and the tool on a blueprint.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { GROUND } from '../../lib/sets.mjs';
import { label } from '../../lib/text.mjs';

const ORANGE = '#F08A2E', STEEL = '#C9D3DE', WOODC = '#B07A45';
const blinkAt = (T, x) => (((T * 0.37 + (x % 7) / 7) % 1) > 0.96 ? 1 : 0);
const DOC1 = { costume: { coat: '#2F6F6A', trim: PAL.gold, trousers: '#E9E2D2' }, hair: { style: 'wig', color: '#E9E2D2' } };
const DOC2 = { costume: { coat: '#8A3B4A', trim: PAL.gold, trousers: '#E9E2D2' }, hair: { style: 'wig', color: '#D9D2C2' } };
const LOGGER = { costume: { coat: '#D9303A', trim: '#2A2622', trousers: '#3A5BA8' }, hat: { style: 'cap', color: '#7A5233' }, hair: { style: 'short', color: '#5A3B22' }, beard: { color: '#5A3B22' } };

function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
BODIES.chainsaw = (c) => { // friendly chainsaw standing on its engine, guide bar pointing up
  box(c, -44, -640, 88, 360, STEEL, { r: 44, k: 0.15 });                                  // guide bar
  c.fillStyle = INK; for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 44, -610 + i * 36); c.lineTo(sx * 62, -598 + i * 36); c.lineTo(sx * 44, -586 + i * 36); c.fill(); } // teeth
  c.strokeStyle = INK; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(-150, -200); c.quadraticCurveTo(-230, -330, -110, -330); c.stroke(); // handle
  c.strokeStyle = '#3B3B3B'; c.lineWidth = 8; c.stroke();
  box(c, -160, -320, 320, 260, ORANGE, { r: 30, k: 0.18 });                               // engine body
  box(c, -120, -290, 240, 130, '#FFF4DC', { r: 26, lw: 5, k: 0 });                        // face plate
  return { face: [0, -228, 30], shL: [-160, -190], shR: [160, -190], hipL: [-70, -66], hipR: [70, -66], top: [0, -640], tip: [0, -640] };
};
function pram(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const wx of [-90, 90]) { ell(c, wx, -40, 40, 40, '#FFFFFF', { lw: 8, k: 0 }); ell(c, wx, -40, 10, 10, INK, { lw: 0, k: 0 }); }
  cel(c, (c) => { c.moveTo(-150, -230); c.lineTo(150, -230); c.quadraticCurveTo(150, -80, 0, -80); c.quadraticCurveTo(-150, -80, -150, -230); c.closePath(); }, '#7FC8F0', [-150, -230, 300, 150], { k: 0.15 });
  cel(c, (c) => { c.moveTo(-150, -230); c.arc(-150 + 150, -230, 150, Math.PI, Math.PI * 1.5); c.lineTo(0, -230); c.closePath(); }, '#F2A3C0', [-150, -380, 150, 150], { k: 0.15 }); // hood
  c.strokeStyle = INK; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(150, -230); c.lineTo(230, -330); c.stroke();
  c.restore();
}
/** The 1780s tool: a fine toothed chain between two handles, see-sawing. crank=true: later crank version. */
function chainTool(c, cx, cy, t, crank = false) {
  if (!crank) {
    const sh = Math.sin(t * 7) * 60, sag = 70;
    const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([cx - 270 + sh + u * 540, cy + Math.sin(u * Math.PI) * sag]); }
    c.strokeStyle = INK; c.lineWidth = 20; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.strokeStyle = STEEL; c.lineWidth = 10; c.stroke();
    c.fillStyle = INK; pts.forEach(([x, y], i) => { if (i % 2 === 0 && i > 0 && i < 24) { c.beginPath(); c.moveTo(x - 9, y + 8); c.lineTo(x, y + 28); c.lineTo(x + 9, y + 8); c.fill(); } });
    for (const sx of [-1, 1]) box(c, cx + sx * 270 + sh - 22, cy - 80, 44, 160, WOODC, { r: 20, k: 0.18 });
    return [[cx + sh, cy + sag + 20], [cx - 270 + sh, cy - 80]];
  }
  box(c, cx - 300, cy - 36, 420, 72, STEEL, { r: 36, k: 0.15 });                          // guide blade
  c.fillStyle = INK; for (let i = 0; i < 13; i++) { const x = cx - 290 + ((i * 32 + t * 120) % 400); for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(x - 8, cy + sy * 36); c.lineTo(x, cy + sy * 56); c.lineTo(x + 8, cy + sy * 36); c.fill(); } }
  box(c, cx + 100, cy - 60, 150, 120, WOODC, { r: 20, k: 0.18 });                         // grip block
  ell(c, cx + 175, cy, 70, 70, '#E0A63A', { k: 0.2 });                                    // crank wheel
  c.save(); c.translate(cx + 175, cy); c.rotate(t * 5); c.strokeStyle = INK; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(110, 0); c.stroke();
  ell(c, 110, 0, 22, 22, WOODC, { lw: 6, k: 0 }); c.restore();
  return [[cx + 175, cy - 70]];
}

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
const floor = (c, col) => { c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke(); };
const nursery = () => once('nursery', (c) => {
  c.fillStyle = '#FFD86B'; c.fillRect(0, 0, W, GROUND);
  for (let x = 60; x < W; x += 150) for (let y = 560 + ((x / 150) % 2) * 75; y < GROUND - 40; y += 150) ell(c, x, y, 20, 20, '#FF9F6B', { lw: 0, k: 0 });
  floor(c, '#7FD6C2');
});
const study = () => once('study', (c) => {
  c.fillStyle = '#F4D9A8'; c.fillRect(0, 0, W, GROUND);
  box(c, 60, 520, 300, 420, '#8A5A34', { r: 8, k: 0.15 });                                 // bookcase
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) box(c, 80 + i * 44, 545 + r * 135, 36, 105, [PAL.coral, PAL.navy, PAL.gold, PAL.teal, '#8FA889', '#8A3B4A'][(i + r) % 6], { r: 3, lw: 4, k: 0 });
  box(c, 720, 520, 260, 300, '#BFE6F5', { r: 8, k: 0 }); c.strokeStyle = '#8A5A34'; c.lineWidth = 14; c.beginPath(); c.moveTo(850, 520); c.lineTo(850, 820); c.moveTo(720, 670); c.lineTo(980, 670); c.stroke();
  floor(c, '#B07A45');
});
const blueprint = () => once('blueprint', (c) => {
  c.fillStyle = '#3F8FD6'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 3;
  for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
});
const forest = () => once('forest', (c) => {
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#4FB0E8'); g.addColorStop(1, '#C9ECF8'); c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  for (const [x, w] of [[60, 120], [330, 90]]) { box(c, x, 300, w, GROUND - 300, '#A8603A', { r: 0, k: 0.2 }); ell(c, x + w / 2, 330, w * 1.5, 190, '#3E9A4A', { k: 0.15 }); }
  box(c, 700, -20, 330, GROUND + 20, '#B5653A', { r: 0, k: 0.22 });                        // giant redwood
  c.strokeStyle = shade('#B5653A', 0.3); c.lineWidth = 6; for (const dx of [60, 130, 210, 270]) { c.beginPath(); c.moveTo(700 + dx, 0); c.lineTo(700 + dx - 10, GROUND); c.stroke(); }
  floor(c, '#6DBB4C');
});

export const SCENES = {
  // 0 hook: a chainsaw with a stethoscope stands next to a baby pram (odd pairing)
  chook(c, t, beat, ctx) {
    c.drawImage(nursery(), 0, 0);
    pram(c, 790, GROUND, 1.0);
    const drop = t < 0.25 ? (1 - t / 0.25) * 90 : 0, sq = t >= 0.25 ? Math.max(0, 0.5 * Math.cos((t - 0.25) * 18) * Math.exp(-(t - 0.25) * 6)) : 0;
    objChar(c, { body: 'chainsaw', x: 330, y: GROUND - drop, s: 0.95, t: ctx.T, mood: 'grin', armPose: 'wave', squash: sq, blink: blinkAt(ctx.T, 3) });
    if (t > 0.25) burst(c, 330, GROUND - 20, 200, t - 0.25, 12, '#FFFFFF');
  },
  // 1: the 1780s - two Scottish doctors with a problem
  doctors(c, t, beat, ctx) {
    c.drawImage(study(), 0, 0);
    human(c, { ...DOC1, x: 330, y: GROUND, s: 1.2, t: ctx.T, mood: 'worried', armPose: 'think', blink: blinkAt(ctx.T, 1) });
    human(c, { ...DOC2, x: 760, y: GROUND, s: 1.2, t: ctx.T + 1, mood: 'worried', armPose: 'hips', blink: blinkAt(ctx.T, 5) });
    popWord(c, '?', 545, 760 - Math.sin(t * 3) * 12, clamp((t - 1.6) / 0.3), 160, PAL.coral);
  },
  // 2: the problem - too slow by knife. A clock spins, a small knife lies on a tray. No patient.
  slow(c, t, beat, ctx) {
    c.drawImage(study(), 0, 0);
    box(c, 0, 0, W, GROUND, 'rgba(244,217,168,0.82)', { r: 0, lw: 0, k: 0 });
    ell(c, 540, 860, 230, 230, '#FFFFFF', { k: 0.08 }); ell(c, 540, 860, 200, 200, '#FFF8E8', { lw: 5, k: 0 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ell(c, 540 + Math.cos(a) * 172, 860 + Math.sin(a) * 172, 9, 9, INK, { lw: 0, k: 0 }); }
    c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 14; const am = -Math.PI / 2 + t * 4; c.beginPath(); c.moveTo(540, 860); c.lineTo(540 + Math.cos(am) * 150, 860 + Math.sin(am) * 150); c.stroke();
    c.lineWidth = 18; const ah = -Math.PI / 2 + t * 0.4; c.beginPath(); c.moveTo(540, 860); c.lineTo(540 + Math.cos(ah) * 95, 860 + Math.sin(ah) * 95); c.stroke();
    box(c, 250, GROUND - 150, 580, 40, '#C9D3DE', { r: 16, k: 0.15 });                       // tray
    box(c, 430, GROUND - 190, 100, 34, WOODC, { r: 12, k: 0.15 }); cel(c, (c) => { c.moveTo(530, GROUND - 188); c.lineTo(680, GROUND - 172); c.lineTo(530, GROUND - 158); c.closePath(); }, '#E9EEF2', null, { lw: 5 }); // small knife
    label(c, 'BY HAND', 600, GROUND - 172, 800, 1200, clamp((t - 0.8) / 0.4), { size: 52 });
  },
  // 3: the invention - blueprint of the chain with tiny teeth and two handles (labelled)
  tool(c, t, beat, ctx) {
    c.drawImage(blueprint(), 0, 0);
    const [teeth, handle] = chainTool(c, 540, 980, t);
    label(c, 'TINY TEETH', teeth[0], teeth[1], 760, 1290, clamp((t - 0.8) / 0.4), { size: 52 });
    label(c, 'HANDLE', handle[0], handle[1], 260, 700, clamp((t - 2.0) / 0.4), { size: 52 });
  },
  // 4: later, a hand crank
  crank(c, t, beat, ctx) {
    c.drawImage(blueprint(), 0, 0);
    const [cr] = chainTool(c, 520, 1000, t, true);
    label(c, 'HAND CRANK', cr[0], cr[1], 760, 740, clamp((t - 0.3) / 0.4), { size: 52 });
  },
  // 5: a century on - a logger and a full-size saw at a giant redwood
  redwood(c, t, beat, ctx) {
    c.drawImage(forest(), 0, 0);
    human(c, { ...LOGGER, x: 190, y: GROUND, s: 1.0, t: ctx.T, mood: 'proud', armPose: 'point', blink: blinkAt(ctx.T, 2) });
    const k = easeOutBack(clamp((t - 0.3) / 0.5));
    objChar(c, { body: 'chainsaw', x: 500, y: GROUND, s: 0.35 + 0.55 * k, t: ctx.T, mood: 'grin', armPose: 'cheer', squash: Math.abs(Math.sin(t * 12)) * 0.06, blink: 0 });
    for (let i = 0; i < 5; i++) { const ph = (t * 1.6 + i / 5) % 1; c.save(); c.globalAlpha = 1 - ph; ell(c, 700 - ph * 90, GROUND - 240 + ph * 160 + i * 8, 10, 6, '#F2D27A', { lw: 3, k: 0 }); c.restore(); } // sawdust
    cel(c, (c) => { c.moveTo(700, GROUND - 300); c.lineTo(790, GROUND - 250); c.lineTo(700, GROUND - 200); c.closePath(); }, '#F2D27A', null, { lw: 6 }); // notch in the trunk
    popWord(c, '1905', 330, 760, clamp((t - 1.0) / 0.3), 110, PAL.gold);
  },
  // 6 payoff: back in the nursery (loop) - question + subscribe
  payoff(c, t, beat, ctx) {
    c.drawImage(nursery(), 0, 0);
    pram(c, 790, GROUND, 0.8);
    objChar(c, { body: 'chainsaw', x: 330, y: GROUND - Math.abs(Math.sin(t * 5)) * 24, s: 0.54, t: ctx.T, mood: 'chuckle', armPose: 'shrug', blink: 0 });
  },
};

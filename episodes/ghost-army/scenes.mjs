// Bespoke scenes for "The WW2 Army That Fought With Balloons" (the Ghost Army).
// Taste: no combat, no weapons fired, no enemy uniforms or symbols. The "enemy" is a pair of binoculars in a bush.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, burst, box, ell, cel, shade, tint } from '../../lib/draw.mjs';
import { objChar, human, BODIES } from '../../lib/chars.mjs';
import { face } from '../../lib/face.mjs';
import { GROUND } from '../../lib/sets.mjs';

const OLIVE = '#7FA046', OLIVE_D = '#5E7A32', GI_COAT = '#9DAE5E', MANILA = '#EBC874', STAMP = '#D9303A';
const GI = { costume: { coat: GI_COAT, trim: PAL.gold, trousers: '#C9B48A' }, hat: { style: 'gi', color: '#6E7F3C' }, hair: { style: 'short', color: '#5A3B22' } };
const soldier = (c, ctx, o) => human(c, { ...GI, t: ctx.T, blink: ((ctx.T * 0.37 + (o.x % 7) / 7) % 1) > 0.96 ? 1 : 0, ...o });

/** Inflatable rubber tank with a face. Origin = bottom centre (tread base). k = inflation 0..1. */
export function tank(c, x, y, s, { k = 1, mood = 'grin', look = [0, 0], T = 0, squash = 0 } = {}) {
  c.save(); c.translate(x, y); c.scale(s * (0.9 + 0.1 * k) * (1 + squash * 0.2), s * Math.max(0.12, k) * (1 - squash * 0.2));
  box(c, -250, -86, 500, 86, OLIVE_D, { r: 43, k: 0.15 });                              // tread
  for (let i = 0; i < 6; i++) ell(c, -200 + i * 80, -43, 26, 26, '#A9BC6A', { lw: 5, k: 0 }); // wheels
  box(c, -235, -205, 470, 136, OLIVE, { r: 60, k: 0.18 });                               // puffy hull
  box(c, 100, -282, 230, 46, OLIVE, { r: 23, k: 0.15 });                                 // soft barrel
  box(c, -135, -320, 270, 132, OLIVE, { r: 64, k: 0.18 });                               // puffy turret
  box(c, -16, -346, 32, 30, '#C9C2B0', { r: 6, lw: 5, k: 0 });                           // air valve
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 12; c.lineCap = 'round';         // rubber shine
  c.beginPath(); c.arc(-60, -250, 50, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
  c.beginPath(); c.arc(-150, -130, 44, Math.PI * 1.05, Math.PI * 1.4); c.stroke();
  c.beginPath(); c.moveTo(150, -268); c.lineTo(260, -268); c.stroke();
  if (k > 0.55) face(c, 30, -136, 30, { mood, look, blink: ((T * 0.41) % 1) > 0.96 ? 1 : 0 });
  c.restore();
}
const usStar = (c, x, y, r) => { // white five-point star in a white ring (Allied vehicle marking)
  c.save(); c.translate(x, y); c.strokeStyle = '#FFFFFF'; c.lineWidth = 7; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
  c.fillStyle = '#FFFFFF'; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.38 : r * 0.9; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.restore();
};
function popWord(c, text, x, y, k, size = 60, col = '#FFFFFF') {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOutBack(k), easeOutBack(k)); c.rotate(-0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
}
function medal(c, x, y, r) { // gold medal (disc + star), top of the disc at (x, y)
  ell(c, x, y + r, r, r, PAL.gold, { k: 0.2 });
  ell(c, x, y + r, r * 0.68, r * 0.68, '#F2C14E', { lw: 4, k: 0 });
  c.fillStyle = '#B8862A'; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.2 : r * 0.48; c.lineTo(x + Math.cos(a) * rr, y + r + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}
function ribbon(c, x1, y1, x2, y2, w) { // red-white-blue ribbon from the neck to the medal
  for (const [dx, col] of [[-w / 3, PAL.red], [0, '#FFFFFF'], [w / 3, '#3A5BA8']]) {
    c.beginPath(); c.moveTo(x1 + dx, y1); c.lineTo(x2 + dx * 0.5, y2); c.lineWidth = w / 3 + 1; c.strokeStyle = col; c.lineCap = 'butt'; c.stroke();
  }
  c.beginPath(); c.moveTo(x1 - w / 2, y1); c.lineTo(x2 - w / 4, y2); c.moveTo(x1 + w / 2, y1); c.lineTo(x2 + w / 4, y2); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
}

BODIES.speaker = (c) => { // loudspeaker horn with a face on its round back
  cel(c, (c) => { c.moveTo(40, -330); c.lineTo(230, -420); c.lineTo(230, -120); c.lineTo(40, -210); c.closePath(); }, '#C9D3DE', [40, -420, 190, 300], { k: 0.2 });
  ell(c, 230, -270, 26, 150, '#8E9AA6', { k: 0 });
  ell(c, -40, -270, 110, 110, '#E9EEF2', { k: 0.15 });
  return { face: [-40, -262, 30], shL: [-150, -270], shR: [70, -270], hipL: [-50, -170], hipR: [10, -170], top: [-40, -380], tip: [-40, -380] };
};
BODIES.radio = (c) => { // WW2 field radio: big box, dials, whip antenna
  c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(110, -380); c.lineTo(160, -640); c.stroke();
  ell(c, 160, -646, 12, 12, PAL.red, { lw: 4, k: 0 });
  box(c, -190, -400, 380, 330, '#8C9A5B', { r: 22, k: 0.18 });
  box(c, -160, -370, 320, 150, '#F4EDE0', { r: 16, lw: 5, k: 0 });                          // face panel
  for (const [dx, col] of [[-110, PAL.gold], [0, PAL.coral], [110, PAL.teal]]) ell(c, dx, -160, 30, 30, col, { lw: 5, k: 0.2 });
  return { face: [0, -298, 30], shL: [-190, -250], shR: [190, -250], hipL: [-90, -70], hipR: [90, -70], top: [0, -400], tip: [160, -646] };
};
BODIES.folder = (c) => { // manila TOP SECRET folder
  box(c, -150, -470, 120, 50, MANILA, { r: 10, k: 0 });                                      // tab
  box(c, -190, -440, 380, 380, MANILA, { r: 14, k: 0.15 });
  return { face: [0, -230, 30], shL: [-190, -250], shR: [190, -250], hipL: [-80, -60], hipR: [80, -60], top: [0, -440], tip: [0, -440] };
};

const cache = {};
const once = (name, draw) => { if (!cache[name]) { const cv = createCanvas(W, H); draw(cv.getContext('2d')); cache[name] = cv; } return cache[name]; };
function sky(c, top = '#4FB0E8', bottom = '#BFE6F5') {
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = '#FFFFFF'; for (const [x, y, r] of [[160, 620, 50], [220, 600, 64], [290, 625, 46], [800, 700, 44], [860, 680, 58], [925, 705, 42]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
}
function hills(c) {
  ell(c, 200, 1180, 520, 200, '#8FD06A', { k: 0, lw: 6 }); ell(c, 900, 1200, 520, 220, '#7CC45A', { k: 0, lw: 6 });
  for (const [x, y] of [[90, 1060], [980, 1050]]) { box(c, x - 10, y, 20, 70, '#7A5233', { r: 4, lw: 5, k: 0 }); ell(c, x, y - 30, 60, 70, '#3E9A4A', { lw: 6, k: 0.15 }); }
  c.fillStyle = '#6DBB4C'; c.fillRect(0, GROUND - 120, W, H - GROUND + 120);
  c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(0, GROUND - 120); c.lineTo(W, GROUND - 120); c.stroke();
  c.strokeStyle = 'rgba(42,90,40,0.35)'; c.lineWidth = 5;
  for (let i = 0; i < 40; i++) { const x = (i * 211) % W, y = GROUND - 90 + ((i * 97) % (H - GROUND + 60)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8, y - 22); c.moveTo(x + 14, y); c.lineTo(x + 18, y - 18); c.stroke(); }
}
const field = () => once('field', (c) => { sky(c); hills(c); });
const camp = () => once('camp', (c) => {
  sky(c, '#5DB7E8', '#D4EEF8'); hills(c);
  cel(c, (c) => { c.moveTo(560, 1300); c.lineTo(820, 900); c.lineTo(1080, 1300); c.closePath(); }, '#D8C99A', [560, 900, 520, 400], { k: 0.2 }); // canvas tent
  cel(c, (c) => { c.moveTo(780, 1300); c.lineTo(820, 1060); c.lineTo(860, 1300); c.closePath(); }, '#8C7A4E', null, { lw: 5 });
});
const office = () => once('office', (c) => {
  c.fillStyle = '#F2C45A'; c.fillRect(0, 0, W, GROUND);
  c.strokeStyle = 'rgba(200,120,40,0.35)'; c.lineWidth = 14; for (let x = 40; x < W; x += 90) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GROUND); c.stroke(); }
  box(c, 640, 380, 300, 360, '#9FD8F0', { r: 8, k: 0 }); // window
  c.strokeStyle = PAL.wood; c.lineWidth = 14; c.beginPath(); c.moveTo(790, 380); c.lineTo(790, 740); c.moveTo(640, 560); c.lineTo(940, 560); c.stroke();
  c.fillStyle = '#B07A45'; c.fillRect(0, GROUND, W, H - GROUND); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
});

export const SCENES = {
  // 0 hook: a soldier holds a whole tank over his head (it's a balloon). The tank drops onto his hands in frame.
  ahook(c, t, beat, ctx) {
    c.drawImage(field(), 0, 0);
    const s = 1.0, sx = 540;
    const drop = t < 0.25 ? (1 - t / 0.25) * 50 : 0, sq = t >= 0.25 ? Math.max(0, 0.6 * Math.cos((t - 0.25) * 16) * Math.exp(-(t - 0.25) * 5)) : 0;
    const bob = Math.sin(t * 3) * 10;
    // straight arms overhead, hands at local (+-96, -545): the tank's tread rests on them
    tank(c, sx - 30, GROUND - 548 * s + 6 - drop + bob * 0.2, 0.86, { mood: 'shock', T: ctx.T, squash: sq });
    soldier(c, ctx, { x: sx, y: GROUND, s, mood: 'grin', armPose: { l: [30, -145], r: [30, -145] } });
    if (t > 0.22) burst(c, sx, GROUND - 560 * s, 220, t - 0.22, 12, '#FFFFFF');
  },
  // 1: an army of artists - a painter soldier, palette in one hand, brush on the canvas
  artists(c, t, beat, ctx) {
    c.drawImage(camp(), 0, 0);
    const s = 1.1, sx = 250;
    const brushK = Math.sin(t * 7) * 0.5 + 0.5;
    const pose = { l: [22, 120], r: [140, -10 - brushK * 30] };
    // easel + canvas (behind the soldier's brush hand)
    c.strokeStyle = '#7A5233'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(640, 860); c.lineTo(560, GROUND); c.moveTo(780, 860); c.lineTo(860, GROUND); c.moveTo(710, 900); c.lineTo(710, GROUND); c.stroke();
    box(c, 520, 820, 380, 300, '#FFFFFF', { r: 6, k: 0 });
    c.save(); c.beginPath(); c.rect(520, 820, 380 * clamp(0.25 + t / 2.2), 300); c.clip();
    c.fillStyle = '#BFE6F5'; c.fillRect(524, 824, 372, 200); c.fillStyle = '#8FD06A'; c.fillRect(524, 1024, 372, 92);
    tank(c, 700, 1080, 0.48, { k: 1, mood: 'grin', T: ctx.T }); c.restore();
    box(c, 520, 820, 380, 300, 'rgba(0,0,0,0)', { r: 6, k: 0 });
    soldier(c, ctx, { x: sx, y: GROUND, s, mood: 'proud', armPose: pose, look: [1, 0] });
    // brush from the right hand to the canvas edge
    const K = 190 / 150, hx = sx + (56 + pose.r[0] * K) * s, hy = GROUND + (-360 + pose.r[1] * K) * s;
    c.strokeStyle = '#7A5233'; c.lineWidth = 9; c.beginPath(); c.moveTo(hx - 20, hy + 6); c.lineTo(hx + 50, hy - 8); c.stroke();
    ell(c, hx + 58, hy - 10, 14, 9, PAL.coral, { lw: 4, k: 0 });
    // palette in the left hand
    const px = sx + (-56 - pose.l[0] * K) * s, py = GROUND + (-360 + pose.l[1] * K) * s;
    ell(c, px - 30, py + 4, 70, 42, '#E8C48A', { k: 0.1 });
    for (const [dx, dy, col] of [[-70, -6, PAL.red], [-40, -22, PAL.gold], [-6, -18, '#3A5BA8'], [-56, 22, '#3E9A4A']]) ell(c, px + dx, py + dy + 4, 11, 9, col, { lw: 3, k: 0 });
  },
  // 2: inflatable tanks - a soldier pumps, the tank swells from flat to full
  inflate(c, t, beat, ctx) {
    c.drawImage(field(), 0, 0);
    const s = 1.05, sx = 250, pump = Math.sin(t * 9);
    const hy = -250 + pump * 32;                                                     // hands ride the pump handle
    const K = 190 / 150, pose = { l: [(-56 + 44) / K, (hy + 360) / K], r: [(-56 + 44) / K, (hy + 360) / K] };
    // hose from the pump to the tank's valve side
    const k = easeOut(clamp(t / 1.3));
    c.strokeStyle = INK; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx + 30, GROUND - 10); c.quadraticCurveTo(450, GROUND + 10, 520, GROUND - 60); c.stroke();
    c.strokeStyle = '#3B3B3B'; c.lineWidth = 9; c.stroke();
    tank(c, 740, GROUND, 0.82, { k, mood: k > 0.95 ? 'grin' : 'shock', T: ctx.T });
    soldier(c, ctx, { x: sx, y: GROUND, s, mood: 'smug', armPose: pose });
    // pump: barrel in front of the legs, T-handle in both hands
    box(c, sx - 22, GROUND + (hy + 20) * s, 44, GROUND - (GROUND + (hy + 20) * s), '#C9D3DE', { r: 10, k: 0.2 });
    box(c, sx - 26, GROUND + (-200) * s, 52, 200 * s, '#E05A4A', { r: 12, k: 0.2 });
    box(c, sx - 70, GROUND + (hy - 10) * s, 140, 22, '#7A5233', { r: 10, lw: 5, k: 0 });
    box(c, sx - 60, GROUND - 14, 120, 20, '#5A5A5A', { r: 6, lw: 5, k: 0 });
    if (t > 1.2) burst(c, 740, GROUND - 320 * 0.82, 160, t - 1.2, 10, '#FFFFFF');
  },
  // 3: fake sounds - a truck with a loudspeaker blasts recorded trucks and marching
  sounds(c, t, beat, ctx) {
    c.drawImage(field(), 0, 0);
    const tx = 310, ty = GROUND;
    // truck
    box(c, tx - 220, ty - 270, 330, 190, OLIVE, { r: 16, k: 0.18 });                 // cargo bed
    box(c, tx + 110, ty - 250, 150, 170, OLIVE_D, { r: 20, k: 0.15 });               // cab
    box(c, tx + 160, ty - 230, 80, 70, '#BFE6F5', { r: 8, lw: 5, k: 0 });
    usStar(c, tx - 55, ty - 175, 52);
    for (const wx of [tx - 150, tx + 190]) { ell(c, wx, ty - 60, 58, 58, '#3B3B3B', { k: 0 }); ell(c, wx, ty - 60, 22, 22, '#C9C2B0', { lw: 5, k: 0 }); }
    // speaker character stands on the cargo bed
    objChar(c, { body: 'speaker', x: tx - 40, y: ty - 270 + 88 * 0.95, s: 0.95, t: ctx.T, mood: 'grin', armPose: 'cheer', squash: Math.abs(Math.sin(t * 14)) * 0.12 });
    // sound waves rolling out to the right
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.9 + i / 4) % 1, r = 80 + ph * 520;
      c.save(); c.globalAlpha = 1 - ph; c.strokeStyle = '#FFFFFF'; c.lineWidth = 14; c.lineCap = 'round';
      c.beginPath(); c.arc(tx + 180, ty - 450, r, -0.55, 0.55); c.stroke(); c.restore();
    }
    popWord(c, 'RUMBLE!', 790, 760, clamp((t - 0.3) / 0.3), 72, PAL.gold);
    popWord(c, 'STOMP!', 700, 1000, clamp((t - 0.9) / 0.3), 68);
    popWord(c, 'VROOM!', 860, 1230, clamp((t - 1.5) / 0.3), 68, PAL.gold);
  },
  // 4: fake radio chatter - a soldier talks into the handset, the radio crackles
  radio(c, t, beat, ctx) {
    c.drawImage(camp(), 0, 0);
    const s = 1.1, sx = 270;
    soldier(c, ctx, { x: sx, y: GROUND, s, mood: 'smug', armPose: 'think' });
    // handset in the right hand (hand at local (43, -449)), curly cord to the radio
    const hx = sx + 43 * s, hy = GROUND - 449 * s;
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(hx + 10, hy + 30);
    for (let i = 0; i <= 20; i++) { const u = i / 20; c.lineTo(lerp(hx + 10, 600, u) + Math.sin(u * 40) * 8, lerp(hy + 30, GROUND - 260, u) + Math.cos(u * 40) * 8); } c.stroke();
    box(c, hx - 18, hy - 50, 36, 110, '#3B3B3B', { r: 16, k: 0.15 });
    objChar(c, { body: 'radio', x: 740, y: GROUND, s: 1.0, t: ctx.T, mood: 'grin', armPose: 'shrug', squash: Math.abs(Math.sin(t * 10)) * 0.06 });
    // antenna sparks
    const ax = 740 + 160, ay = GROUND - 646;
    for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; c.save(); c.globalAlpha = 1 - ph; c.strokeStyle = PAL.gold; c.lineWidth = 9; c.beginPath(); c.arc(ax, ay, 30 + ph * 110, -Math.PI * 0.9, -Math.PI * 0.1); c.stroke(); c.restore(); }
    popWord(c, '"MOVING OUT!"', 560, 780, clamp((t - 0.35) / 0.3), 54);
    popWord(c, '"COPY THAT!"', 760, 1560 - 600, clamp((t - 1.1) / 0.3), 54, PAL.gold);
  },
  // 5: fool the enemy - binoculars in a bush stare at a row of balloon tanks
  fool(c, t, beat, ctx) {
    c.drawImage(field(), 0, 0);
    for (const [i, x] of [500, 700, 900].entries()) tank(c, x, 1150 + i * 30, 0.5, { mood: i === 1 ? 'smug' : 'grin', T: ctx.T + i });
    // bush with binoculars (left), the binoculars pop up and scan
    const up = easeOutBack(clamp(t / 0.5)) * 70, by0 = 1290;
    ell(c, 230, by0, 220, 150, '#3E9A4A', { k: 0.18 });
    const bx = 240, by = by0 - 110 - up, look = Math.sin(t * 2.2) * 10;
    box(c, bx - 90, by - 34, 180, 68, '#3B3B3B', { r: 24, k: 0 });
    for (const dx of [-50, 50]) { ell(c, bx + dx + look, by, 42, 42, '#4A4A4A', { k: 0 }); ell(c, bx + dx + look, by, 28, 28, '#9FD8F0', { lw: 4, k: 0 }); ell(c, bx + dx + look + 9, by - 10, 9, 9, '#FFFFFF', { lw: 0, k: 0 }); }
    ell(c, 110, by0 + 40, 140, 110, '#4DAA56', { k: 0.15 }); ell(c, 360, by0 + 50, 150, 110, '#4DAA56', { k: 0.15 }); // leaves in front
    popWord(c, '?', 300, by - 150, clamp((t - 0.8) / 0.3), 130, PAL.gold);
    popWord(c, '?', 400, by - 250, clamp((t - 1.2) / 0.3), 96);
    popWord(c, 'REAL TANKS?', 760, 880, clamp((t - 1.6) / 0.3), 76);
  },
  // 6: top secret until 1996 - the folder gets stamped, the year rolls to 1996
  secret(c, t, beat, ctx) {
    c.drawImage(office(), 0, 0);
    const sq = t > 0.5 ? Math.max(0, 0.5 * Math.cos((t - 0.5) * 18) * Math.exp(-(t - 0.5) * 6)) : 0;
    const a = objChar(c, { body: 'folder', x: 380, y: GROUND, s: 1.05, t: ctx.T, mood: t > 0.5 ? 'worried' : 'neutral', armPose: 'hips', squash: sq });
    if (t > 0.5) { c.save(); c.translate(380, GROUND - 360 * 1.05); c.rotate(-0.12); c.font = '900 64px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.strokeStyle = STAMP; c.lineWidth = 8; c.strokeRect(-200, -46, 400, 92); c.fillStyle = STAMP; c.fillText('TOP SECRET', 0, 4); c.restore(); }
    // rubber stamp comes down at 0.5 s
    const sy = t < 0.5 ? lerp(700, 1040, easeInOut(t / 0.5)) : lerp(1040, 700, easeOut((t - 0.5) / 0.4));
    if (t < 0.9) box(c, 560, sy - 150, 60, 120, '#7A5233', { r: 14, k: 0.15 }); if (t < 0.9) box(c, 520, sy - 40, 140, 40, STAMP, { r: 6, k: 0.15 });
    if (t > 0.5) burst(c, 380, GROUND - 380, 260, t - 0.5, 12, STAMP);
    // year sign rolls 1945 -> 1996
    const k = easeOutBack(clamp((t - 0.8) / 0.35));
    if (k > 0) {
      const yr = Math.round(lerp(1945, 1996, easeOut(clamp((t - 0.9) / 1.4))));
      c.save(); c.translate(820, 1000); c.scale(k, k); box(c, -170, -150, 340, 300, '#FFFFFF', { r: 14, k: 0.06 }); box(c, -170, -150, 340, 80, '#3A5BA8', { r: 14, k: 0 });
      c.font = '900 50px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('SECRET', 0, -110);
      c.fillStyle = yr === 1996 ? STAMP : INK; c.font = '900 110px "Noto Sans"'; c.fillText(String(yr), 0, 40); c.restore();
    }
  },
  // 7 payoff: back on the hook's field - a gold medal drops onto the soldier, the tank cheers
  payoff(c, t, beat, ctx) {
    c.drawImage(field(), 0, 0);
    const s = 1.0, sx = 360;
    soldier(c, ctx, { x: sx, y: GROUND, s, mood: t > 0.6 ? 'chuckle' : 'shock', armPose: 'cheer', legPose: 'stand' });
    const land = clamp(t / 0.5), my = lerp(-200, GROUND - 330 * s, easeOutBack(land));
    if (land >= 1) ribbon(c, sx, GROUND - 392 * s, sx, my + 4, 30);
    medal(c, sx, my, 44);
    if (t > 0.5) burst(c, sx, my + 44, 130, t - 0.5, 12, PAL.gold);
    tank(c, 790, GROUND - Math.abs(Math.sin(t * 6)) * 30, 0.62, { mood: 'grin', T: ctx.T });
  },
};

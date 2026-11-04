// Painted full-colour sets (not white paper). Each is drawn once into a cached canvas.
import { createCanvas } from '@napi-rs/canvas';
import { W, H, INK, PAL, LW, box, ell, rrect, shade, tint, cel } from './draw.mjs';

export const GROUND = 1420; // default floor line where characters stand

function wall(c, top, bottom) {
  const g = c.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
}
function floorBoards(c, col) {
  c.fillStyle = col; c.fillRect(0, GROUND, W, H - GROUND);
  c.strokeStyle = shade(col, 0.25); c.lineWidth = 4;
  for (let y = GROUND + 60; y < H; y += 90) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let i = 0; i < 14; i++) { const y = GROUND + 60 + (i % 6) * 90, x = (i * 263) % W; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 90); c.stroke(); }
  c.fillStyle = shade(col, 0.4); c.fillRect(0, GROUND - 10, W, 18);
}
function windowFrame(c, x, y, w, h, sky = PAL.sky, night = false) {
  box(c, x - 18, y - 18, w + 36, h + 36, PAL.wood, { r: 8 });
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, night ? '#22305A' : tint(sky, 0.1)); g.addColorStop(1, night ? '#4A5A8A' : tint(sky, 0.55));
  c.fillStyle = g; c.fillRect(x, y, w, h);
  if (!night) { c.fillStyle = '#fff'; for (const [cx, cy, r] of [[x + w * 0.3, y + h * 0.3, 40], [x + w * 0.42, y + h * 0.27, 52], [x + w * 0.55, y + h * 0.31, 38]]) { c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); } }
  else { c.fillStyle = '#F4EDE0'; c.beginPath(); c.arc(x + w * 0.7, y + h * 0.3, 36, 0, 7); c.fill(); }
  c.strokeStyle = INK; c.lineWidth = LW; c.strokeRect(x, y, w, h);
  c.lineWidth = 12; c.strokeStyle = PAL.wood; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
}
function shelf(c, x, y, w, items) {
  box(c, x, y, w, 26, shade(PAL.wood, 0.1), { r: 4 });
  let px = x + 30;
  for (const it of items) {
    if (it === 'flask') { cel(c, (c) => { c.moveTo(px + 14, y - 90); c.lineTo(px + 30, y - 90); c.lineTo(px + 30, y - 60); c.lineTo(px + 58, y); c.lineTo(px - 14, y); c.lineTo(px + 14, y - 60); c.closePath(); }, PAL.glass, [px - 14, y - 90, 72, 90], { k: 0.12 }); px += 100; }
    if (it === 'jar') { box(c, px, y - 80, 60, 80, PAL.sage, { r: 10 }); px += 90; }
    if (it === 'books') { for (const [i, col] of [PAL.coral, PAL.navy, PAL.gold, PAL.teal].entries()) box(c, px + i * 34, y - 110 + (i % 2) * 14, 30, 110 - (i % 2) * 14, col, { r: 3, lw: 5 }); px += 160; }
    if (it === 'candle') { box(c, px, y - 70, 30, 70, '#F6E7C8', { r: 5, lw: 5 }); px += 70; }
  }
}
function bench(c, y = GROUND - 10) {
  box(c, 40, y - 150, W - 80, 46, PAL.wood, { r: 8 });
  for (const lx of [90, W - 130]) box(c, lx, y - 104, 40, 114, shade(PAL.wood, 0.15), { r: 4 });
}

export const SETS = {
  workshop(c) { // 1800s workshop / lab bench
    wall(c, '#E9C98F', '#D9A866'); floorBoards(c, '#8A5A34');
    windowFrame(c, 600, 330, 340, 420);
    shelf(c, 70, 520, 420, ['flask', 'jar', 'books']);
    shelf(c, 70, 820, 420, ['candle', 'flask', 'jar']);
    c.fillStyle = 'rgba(255,240,200,0.18)'; c.beginPath(); c.moveTo(600, 330); c.lineTo(940, 330); c.lineTo(1080, 1420); c.lineTo(420, 1420); c.closePath(); c.fill();
  },
  lab(c) {
    wall(c, '#CFE3DD', '#9FC7BE');
    c.strokeStyle = 'rgba(42,38,34,0.12)'; c.lineWidth = 3;
    for (let x = 0; x < W; x += 90) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GROUND); c.stroke(); }
    for (let y = 0; y < GROUND; y += 90) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    floorBoards(c, '#6E7F86');
    shelf(c, 80, 600, 920, ['flask', 'flask', 'jar', 'books', 'flask', 'jar']);
  },
  parlour(c) { // Victorian sitting room
    wall(c, '#7C3B3B', '#5E2C2C');
    c.fillStyle = 'rgba(224,166,58,0.14)';
    for (let x = 40; x < W; x += 120) for (let y = 60; y < GROUND; y += 140) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20, y + 30); c.lineTo(x, y + 60); c.lineTo(x - 20, y + 30); c.fill(); }
    floorBoards(c, '#7A4E2D');
    windowFrame(c, 620, 360, 320, 400, PAL.sky, true);
    box(c, 90, 420, 300, 380, PAL.gold, { r: 10 }); box(c, 120, 450, 240, 320, '#3E5A6E', { r: 6, k: 0.1 }); // painting
  },
  street(c) { // old town street
    const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#9FB8C8'); g.addColorStop(1, '#E9D9BE');
    c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
    const houses = [[0, 520, 300, '#C98B5E'], [300, 420, 260, '#8FA889'], [560, 560, 280, '#D9604C'], [840, 460, 240, '#5AA9A0']];
    for (const [x, y, w, col] of houses) {
      box(c, x, y, w, GROUND - y, col, { r: 0 });
      cel(c, (c) => { c.moveTo(x - 10, y); c.lineTo(x + w / 2, y - 120); c.lineTo(x + w + 10, y); c.closePath(); }, '#5B4636', [x, y - 120, w, 120]);
      for (let wy = y + 80; wy < GROUND - 200; wy += 220) for (let wx = x + 40; wx < x + w - 80; wx += 120) box(c, wx, wy, 70, 100, '#F4E3B0', { r: 4, lw: 5, k: 0 });
    }
    c.fillStyle = '#9C9184'; c.fillRect(0, GROUND, W, H - GROUND);
    c.strokeStyle = '#7E746A'; c.lineWidth = 4;
    for (let y = GROUND + 50; y < H; y += 70) for (let x = (y / 70 % 2) * 60; x < W; x += 120) { c.beginPath(); rrect(c, x, y, 110, 60, 14); c.stroke(); }
  },
  space(c) { // future / Mars / 2100
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141C3A'); g.addColorStop(0.7, '#2D3E5C'); g.addColorStop(1, '#C0623E');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + (i % 5) / 10})`; c.beginPath(); c.arc((i * 397) % W, (i * 613) % 1200, 2 + (i % 3), 0, 7); c.fill(); }
    ell(c, 820, 360, 130, 130, '#D9604C'); c.fillStyle = '#C04E3A'; c.fillRect(0, GROUND, W, H - GROUND);
    c.strokeStyle = INK; c.lineWidth = LW; c.beginPath(); c.moveTo(0, GROUND); c.quadraticCurveTo(W / 2, GROUND - 60, W, GROUND); c.stroke();
  },
  paper(c) { // brand paper - only for diagram panels
    c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H);
  },
};

const cache = new Map();
export function setCanvas(name) {
  if (!cache.has(name)) {
    const cv = createCanvas(W, H); const c = cv.getContext('2d');
    (SETS[name] || SETS.workshop)(c);
    cache.set(name, cv);
  }
  return cache.get(name);
}

// Titles (Noto Sans 900, white/gold, thick black stroke, pop-in) and captions at y ~ 1500.
import { GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { W, INK, PAL, easeOutBack, clamp } from './draw.mjs';

const fonts = fileURLToPath(new URL('../assets/fonts/', import.meta.url));
GlobalFonts.registerFromPath(fonts + 'NotoSans.ttf', 'Noto Sans');
GlobalFonts.registerFromPath(fonts + 'Caveat.ttf', 'Caveat');

const SAFE = 120; // label margin that survives a 1.2x camera zoom
export const CAPTION_Y = 1500; // rule: middle-lower, never at the bottom (Shorts UI covers it)

export function wrap(c, text, maxW) {
  const words = text.split(/\s+/); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Big pop-in title. age = seconds since it appeared. Gold words: wrap them in *asterisks*. */
export function titleText(c, text, age, { y = 300, size = 104, maxW = W - 120, fill = '#fff', gold = PAL.gold, stroke = 18 } = {}) {
  if (age < 0 || !text) return;
  const k = easeOutBack(age / 0.28);
  c.save(); c.translate(W / 2, y); c.scale(k, k); c.rotate((1 - clamp(age / 0.28)) * -0.06);
  c.font = `900 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const lines = wrap(c, text.replace(/\*/g, ''), maxW);
  const golds = new Set((text.match(/\*([^*]+)\*/g) || []).flatMap((m) => m.slice(1, -1).split(/\s+/)));
  lines.forEach((ln, i) => {
    const ly = (i - (lines.length - 1) / 2) * size * 1.08;
    // per-word colour
    const words = ln.split(' '); const total = c.measureText(ln).width; let x = -total / 2;
    for (const w of words) {
      const ww = c.measureText(w + ' ').width;
      c.textAlign = 'left';
      c.lineWidth = stroke; c.strokeStyle = INK; c.strokeText(w, x, ly);
      c.fillStyle = golds.has(w) ? gold : fill; c.fillText(w, x, ly);
      x += ww;
    }
  });
  c.restore();
}

/** Caption for the phrase being spoken. No name tags, no "illustration" labels. */
export function caption(c, text, age, { y = CAPTION_Y, size = 66 } = {}) {
  if (!text || age < 0) return;
  const k = 0.85 + 0.15 * easeOutBack(age / 0.18);
  c.save(); c.translate(W / 2, y); c.scale(k, k);
  c.font = `800 ${size}px "Noto Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const lines = wrap(c, text.toUpperCase(), W - 160);
  lines.forEach((ln, i) => {
    const ly = (i - (lines.length - 1) / 2) * size * 1.12;
    c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(ln, 0, ly);
    c.fillStyle = '#fff'; c.fillText(ln, 0, ly);
  });
  c.restore();
}

/** Small diagram label with a leader line (used in cutaways). */
export function label(c, text, x, y, tx, ty, p = 1, { size = 46 } = {}) {
  if (p <= 0) return;
  c.save();
  c.font = `900 ${size}px "Noto Sans"`;
  const pad = 18, bw = c.measureText(text).width + pad * 2;
  const left = tx < x; // decide the side once, then keep the box on screen
  tx = left ? Math.max(tx, SAFE + bw) : Math.min(tx, W - SAFE - bw);
  c.globalAlpha = clamp(p * 2);
  c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + (tx - x) * clamp(p * 1.5), y + (ty - y) * clamp(p * 1.5)); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill();
  if (p > 0.5) {
    const k = easeOutBack((p - 0.5) * 2); c.translate(tx, ty); c.scale(k, k);
    const bx = left ? -bw : 0;
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 5;
    c.beginPath(); c.roundRect(bx, -size * 0.75, bw, size * 1.5, 16); c.fill(); c.stroke();
    c.fillStyle = INK; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(text, bx + pad, 2);
  }
  c.restore();
}

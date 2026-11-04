// Style 5 face: two black vertical-oval eyes with a white glint, expressive brows,
// small curved nose, pink cheek blush. Drawn on whatever surface is underneath.
import { INK, PAL, clamp } from './draw.mjs';

export const MOODS = ['neutral', 'proud', 'worried', 'shock', 'grin', 'smug', 'chuckle', 'angry', 'sad'];

/** face(c, x, y, s, {mood, look:[dx,dy] in -1..1, blink 0..1, nose, blush}) - s = eye spacing unit. */
export function face(c, x, y, s, { mood = 'neutral', look = [0, 0], blink = 0, nose = true, blush = true } = {}) {
  const ex = s * 0.55, ey = 0, eh = s * (mood === 'shock' ? 0.42 : 0.34), ew = s * (mood === 'shock' ? 0.2 : 0.17);
  const lx = look[0] * s * 0.1, ly = look[1] * s * 0.08;
  c.save(); c.translate(x, y);
  if (blush) {
    c.fillStyle = PAL.blush; c.globalAlpha = 0.75;
    c.beginPath(); c.ellipse(-s * 0.95, s * 0.42, s * 0.24, s * 0.13, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(s * 0.95, s * 0.42, s * 0.24, s * 0.13, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }
  // eyes
  const closed = mood === 'chuckle' || blink > 0.6;
  for (const side of [-1, 1]) {
    const cx = side * ex + lx, cy = ey + ly;
    if (closed) {
      c.beginPath(); c.arc(cx, cy + s * 0.08, ew * 1.3, Math.PI * 1.1, Math.PI * 1.9);
      c.lineWidth = s * 0.09; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke();
      continue;
    }
    const k = 1 - clamp(blink) * 0.9;
    c.fillStyle = INK; c.beginPath(); c.ellipse(cx, cy, ew, eh * k, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx + ew * 0.3, cy - eh * 0.38 * k, ew * 0.36, ew * 0.36 * k, 0, 0, Math.PI * 2); c.fill();
    if (mood === 'smug') { // heavy upper lids
      c.fillStyle = INK; c.fillRect(cx - ew * 1.4, cy - eh * 1.1, ew * 2.8, eh * 0.85);
    }
  }
  // brows
  const brow = {
    neutral: [0.0, 0], proud: [-0.1, 0.1], worried: [0.35, 0.15], shock: [0, 0.35], grin: [-0.05, 0.12],
    smug: [-0.3, 0], chuckle: [-0.05, 0.1], angry: [-0.45, -0.05], sad: [0.4, 0.05],
  }[mood] || [0, 0];
  for (const side of [-1, 1]) {
    const bx = side * ex + lx * 0.5, by = -eh - s * 0.28 - brow[1] * s;
    const tilt = brow[0] * side; // inner end up when positive
    c.beginPath();
    c.moveTo(bx - side * s * 0.22, by - tilt * s * 0.2);
    c.quadraticCurveTo(bx, by - s * 0.07, bx + side * s * 0.22, by + tilt * s * 0.2);
    c.lineWidth = s * 0.1; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke();
  }
  // nose
  if (nose) {
    c.beginPath(); c.moveTo(lx * 0.6 + s * 0.04, s * 0.18); c.quadraticCurveTo(lx * 0.6 + s * 0.2, s * 0.32, lx * 0.6 - s * 0.02, s * 0.38);
    c.lineWidth = s * 0.07; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke();
  }
  // mouth
  const my = s * 0.66;
  c.lineWidth = s * 0.08; c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  switch (mood) {
    case 'shock':
      c.fillStyle = INK; c.ellipse(0, my + s * 0.08, s * 0.16, s * 0.22, 0, 0, Math.PI * 2); c.fill(); break;
    case 'grin': case 'chuckle':
      c.moveTo(-s * 0.36, my - s * 0.04); c.quadraticCurveTo(0, my + s * 0.5, s * 0.36, my - s * 0.04); c.closePath();
      c.fillStyle = INK; c.fill();
      c.fillStyle = '#E86A6A'; c.beginPath(); c.ellipse(0, my + s * 0.2, s * 0.14, s * 0.07, 0, 0, Math.PI * 2); c.fill(); break;
    case 'worried': case 'sad':
      c.moveTo(-s * 0.26, my + s * 0.12); c.quadraticCurveTo(0, my - s * 0.08, s * 0.26, my + s * 0.12); c.stroke(); break;
    case 'smug':
      c.moveTo(-s * 0.22, my + s * 0.04); c.quadraticCurveTo(s * 0.1, my + s * 0.14, s * 0.32, my - s * 0.08); c.stroke(); break;
    case 'angry':
      c.moveTo(-s * 0.24, my + s * 0.06); c.lineTo(s * 0.24, my + s * 0.06); c.stroke(); break;
    case 'proud':
      c.moveTo(-s * 0.28, my); c.quadraticCurveTo(0, my + s * 0.22, s * 0.28, my); c.stroke(); break;
    default:
      c.moveTo(-s * 0.2, my + s * 0.02); c.quadraticCurveTo(0, my + s * 0.14, s * 0.2, my + s * 0.02); c.stroke();
  }
  c.restore();
}

// Style 5 drawing primitives: cel-shaded shapes, thick ink outlines, thin black
// limbs with IK, mitten palms (thumb bump, no fingers), flames, easing.
export const W = 1080, H = 1920, FPS = 30;

export const PAL = {
  paper: '#F4EDE0', ink: '#2A2622', navy: '#2D3E5C', coral: '#D9604C',
  gold: '#E0A63A', sky: '#9FB8C8', teal: '#5AA9A0', sage: '#8FA889',
  white: '#FFFFFF', blush: '#F2A3A0', wood: '#B07A45', brass: '#C9A043',
  red: '#C8382C', glass: '#CFE6EE',
};
export const INK = PAL.ink;
export const LW = 7; // standard outline width at scale 1

// ---------- colour + easing ----------
/** Parse '#rgb', '#rrggbb' or 'rgb(r,g,b)' into [r, g, b]. */
export function rgb(col) {
  if (col.startsWith('rgb')) return col.match(/[\d.]+/g).slice(0, 3).map(Number);
  let h = col.slice(1); if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255];
}
export function shade(col, k = 0.22) {
  const [r, g, b] = rgb(col).map((v) => Math.max(0, Math.min(255, Math.round(v * (1 - k)))));
  return `rgb(${r},${g},${b})`;
}
export function tint(col, k = 0.3) {
  const [r, g, b] = rgb(col).map((v) => Math.round(v + (255 - v) * k));
  return `rgb(${r},${g},${b})`;
}
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const wobble = (t, f = 2, a = 1) => Math.sin(t * Math.PI * 2 * f) * a;

// ---------- shapes ----------
/** Fill a path with base colour, cel-shade one side, then ink outline.
 *  build(c) adds the path; box = [x, y, w, h] bounds used for the shade band. */
export function cel(c, build, base, box, { lw = LW, side = 'right', k = 0.22, stroke = INK } = {}) {
  c.beginPath(); build(c);
  c.fillStyle = base; c.fill();
  if (box && k > 0) {
    c.save(); c.beginPath(); build(c); c.clip();
    c.fillStyle = shade(base, k);
    const [x, y, w, h] = box;
    if (side === 'right') c.fillRect(x + w * 0.64, y - 2, w * 0.4, h + 4);
    else if (side === 'left') c.fillRect(x - 2, y - 2, w * 0.36, h + 4);
    else c.fillRect(x - 2, y + h * 0.66, w + 4, h * 0.4);
    c.restore();
  }
  if (lw > 0) { c.beginPath(); build(c); c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); }
}
export function rrect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
export function ell(c, x, y, rx, ry, fill, opt = {}) {
  cel(c, (c) => c.ellipse(x, y, rx, ry, opt.rot || 0, 0, Math.PI * 2), fill, [x - rx, y - ry, rx * 2, ry * 2], opt);
}
export function box(c, x, y, w, h, fill, opt = {}) {
  cel(c, (c) => rrect(c, x, y, w, h, opt.r ?? 10), fill, [x, y, w, h], opt);
}
export function seg(c, x1, y1, x2, y2, lw = LW, col = INK) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.stroke();
}
/** Thick rounded tube (e.g. stick body, pipe) with outline. */
export function tube(c, x1, y1, x2, y2, w, fill, lw = LW) {
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w + lw * 2; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = fill; c.stroke();
}

// ---------- limbs ----------
/** Two-bone IK. Returns the joint (elbow/knee) position. bend = +1 / -1 picks the side. */
export function ik(ax, ay, bx, by, l1, l2, bend = 1) {
  let dx = bx - ax, dy = by - ay; let d = Math.hypot(dx, dy) || 1e-6;
  const maxD = l1 + l2 - 0.01;
  if (d > maxD) { bx = ax + dx / d * maxD; by = ay + dy / d * maxD; dx = bx - ax; dy = by - ay; d = maxD; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = ax + dx * a / d, my = ay + dy * a / d;
  return { jx: mx - bend * h * dy / d, jy: my + bend * h * dx / d, bx, by };
}
/** Mitten palm: compact black oval with a thumb bump, oriented along `ang`. */
export function palm(c, x, y, r, ang = 0, thumb = 1) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = INK;
  c.beginPath(); c.ellipse(r * 0.2, 0, r * 1.05, r * 0.82, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(-r * 0.1, -thumb * r * 0.78, r * 0.42, r * 0.34, -0.5 * thumb, 0, Math.PI * 2); c.fill();
  c.restore();
}
/** Thin black arm from shoulder (sx,sy) to hand (hx,hy), bent with IK, mitten at the end. */
export function arm(c, sx, sy, hx, hy, len, s = 1, bend = 1) {
  const r = ik(sx, sy, hx, hy, len / 2, len / 2, bend);
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(r.jx, r.jy); c.lineTo(r.bx, r.by);
  c.lineWidth = 6 * s; c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  palm(c, r.bx, r.by, 11 * s, Math.atan2(r.by - r.jy, r.bx - r.jx), bend);
}
/** Thin black leg from hip to foot with a small black shoe. */
export function leg(c, hx, hy, fx, fy, len, s = 1, bend = -1, dir = 1) {
  const r = ik(hx, hy, fx, fy, len / 2, len / 2, bend);
  c.beginPath(); c.moveTo(hx, hy); c.lineTo(r.jx, r.jy); c.lineTo(r.bx, r.by);
  c.lineWidth = 6.5 * s; c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.ellipse(r.bx + dir * 9 * s, r.by, 17 * s, 9 * s, 0, 0, Math.PI * 2); c.fill();
}

// ---------- effects ----------
/** Layered cartoon flame; t drives the flicker. */
export function flame(c, x, y, size, t, alpha = 1) {
  if (size <= 0) return;
  c.save(); c.globalAlpha = alpha;
  const fl = 1 + Math.sin(t * 31) * 0.06 + Math.sin(t * 17) * 0.05;
  const sway = Math.sin(t * 9) * size * 0.08;
  const layer = (k, col, lw) => {
    const h = size * k * fl, w = size * k * 0.42;
    c.beginPath(); c.moveTo(x, y);
    c.bezierCurveTo(x - w, y - h * 0.15, x - w * 0.6, y - h * 0.65, x + sway, y - h);
    c.bezierCurveTo(x + w * 0.6, y - h * 0.65, x + w, y - h * 0.15, x, y);
    c.fillStyle = col; c.fill();
    if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
  };
  layer(1, '#F28C28', 5); layer(0.7, '#F9C23C'); layer(0.38, '#FFF4C2');
  c.restore();
}
/** Little action burst lines around a point (used on impacts). */
export function burst(c, x, y, r, t, n = 8, col = INK) {
  const k = easeOut(t / 0.25), a = 1 - clamp((t - 0.15) / 0.3);
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ang = i / n * Math.PI * 2 + 0.3;
    c.beginPath();
    c.moveTo(x + Math.cos(ang) * r * (0.6 + 0.4 * k), y + Math.sin(ang) * r * (0.6 + 0.4 * k));
    c.lineTo(x + Math.cos(ang) * r * (0.9 + 0.6 * k), y + Math.sin(ang) * r * (0.9 + 0.6 * k));
    c.stroke();
  }
  c.restore();
}
/** Stroke-reveal: draw a polyline progressively (0..1). */
export function reveal(c, pts, p, lw = 6, col = INK) {
  if (p <= 0 || pts.length < 2) return;
  let total = 0; const L = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); total += d; }
  let left = total * clamp(p);
  c.beginPath(); c.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const k = Math.min(1, left / L[i - 1]);
    c.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); left -= L[i - 1];
  }
  c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}

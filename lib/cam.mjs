// Camera: push-ins, x-ray zooms, shake. camApply clamps so the frame never shows black edges.
import { W, H, clamp, easeInOut } from './draw.mjs';

/** cam = {zoom>=1, cx, cy (world focus), shake (px), rot (rad)} */
export function camApply(c, cam = {}) {
  const z = Math.max(1, cam.zoom ?? 1);
  let cx = cam.cx ?? W / 2, cy = cam.cy ?? H / 2;
  const halfW = W / (2 * z), halfH = H / (2 * z);
  // clamp focus so the viewport stays inside the 1080x1920 world (no black edges)
  cx = clamp(cx, halfW, W - halfW); cy = clamp(cy, halfH, H - halfH);
  let sx = 0, sy = 0;
  if (cam.shake) {
    const t = cam.t ?? 0;
    sx = Math.sin(t * 91) * cam.shake; sy = Math.cos(t * 73) * cam.shake;
    // shaking needs a little extra zoom so edges stay covered
  }
  const zz = z * (cam.shake ? 1 + (2 * cam.shake) / W : 1);
  c.translate(W / 2 + sx, H / 2 + sy); c.rotate(cam.rot || 0); c.scale(zz, zz); c.translate(-cx, -cy);
}

/** Interpolate between two camera states with easing. */
export function camLerp(a, b, p) {
  const e = easeInOut(p);
  const out = {};
  for (const k of ['zoom', 'cx', 'cy']) out[k] = (a[k] ?? (k === 'zoom' ? 1 : k === 'cx' ? W / 2 : H / 2)) * (1 - e) + (b[k] ?? (k === 'zoom' ? 1 : k === 'cx' ? W / 2 : H / 2)) * e;
  return out;
}

/** Shake envelope: big at the hit, decaying over `dur` seconds. */
export function shakeAt(t, hitT, amp = 22, dur = 0.4) {
  const d = t - hitT; if (d < 0 || d > dur) return 0;
  return amp * (1 - d / dur);
}

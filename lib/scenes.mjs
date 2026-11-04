// Scene library for the "hook -> how -> why" format. A scene is f(c, t, beat, ctx):
// t = seconds since the beat started, beat = the beats.json entry, ctx = {cast, T (global time), dur}.
// Scenes draw the set + characters only; the engine adds the camera, titles, captions and transitions.
import { W, H, INK, PAL, clamp, lerp, easeOut, easeOutBack, easeInOut, flame, burst, box, ell, reveal, tube, shade } from './draw.mjs';
import { objChar, human, BODIES } from './chars.mjs';
import { setCanvas, GROUND } from './sets.mjs';
import { label, titleText } from './text.mjs';

// ---------- character placement + actions ----------
function slots(n) {
  if (n <= 1) return [W / 2];
  if (n === 2) return [W * 0.3, W * 0.7];
  return [W * 0.2, W * 0.5, W * 0.8];
}
/** Draw one cast member doing an action. spec = {who, mood, action, armPose, legPose, look, x, s, flip} */
export function actor(c, spec, t, ctx, x, y = GROUND) {
  const card = ctx.cast[spec.who] || { body: spec.who };
  const s = spec.s ?? card.s ?? 1;
  let yy = y, squash = 0, flameK = card.flame ?? 0, armPose = spec.armPose, legPose = spec.legPose, mood = spec.mood || card.mood || 'neutral';
  let xx = spec.x ?? x, lean = 0;
  switch (spec.action) {
    case 'slam': { // drops in from above, squashes on landing at 0.3s
      const p = clamp(t / 0.3); yy = lerp(-400, y, p * p);
      squash = t < 0.3 ? -0.3 : Math.max(0, 0.5 * Math.cos((t - 0.3) * 18) * Math.exp(-(t - 0.3) * 6));
      break;
    }
    case 'walkin': { const p = easeOut(t / 0.9); xx = lerp(spec.from === 'left' ? -250 : W + 250, xx, p); legPose = p < 1 ? 'walk' : legPose; break; }
    case 'bounce': yy = y - Math.abs(Math.sin(t * 6)) * 40; squash = Math.abs(Math.cos(t * 6)) < 0.2 ? 0.3 : 0; break;
    case 'flame': flameK = Math.min(1, t / 0.15) * (1 + 0.15 * Math.sin(t * 40)); break; // flame flick
    case 'strike': { // flame bursts out at 0.5s
      flameK = t > 0.5 ? easeOutBack((t - 0.5) / 0.3) : 0; armPose = armPose || 'cheer';
      if (t > 0.45 && t < 1) burst(c, xx, y - 540 * s, 90, t - 0.45, 10, PAL.gold);
      break;
    }
    case 'fizzle': flameK = Math.max(0, 1 - t / 0.8) * (card.flame ?? 1); mood = spec.mood || 'worried'; break;
    case 'shake': lean = Math.sin(t * 22) * 6; break;
    case 'sad': lean = -4; mood = spec.mood || 'sad'; break;
    case 'exit': { const p = easeInOut(t / 0.9); xx = lerp(xx, spec.to === 'left' ? -300 : W + 300, p); legPose = 'walk'; break; }
  }
  const o = { ...card, ...spec, x: xx, y: yy, s, t: ctx.T, squash, lean, mood, armPose: armPose || card.armPose || 'down', legPose: legPose || 'stand', flame: flameK,
    blink: ((ctx.T * 0.37 + (xx % 7) / 7) % 1) > 0.96 ? 1 : 0, look: spec.look || card.look };
  if (card.human) human(c, { ...card.human, ...o });
  else objChar(c, o);
}
function cast(c, t, beat, ctx, y) {
  const list = beat.chars || [];
  const xs = slots(list.length);
  const k = beat.charScale ?? (list.length <= 1 ? 1.6 : list.length === 2 ? 1.35 : 1.0); // big on a phone
  list.forEach((spec, i) => actor(c, { ...spec, s: (spec.s ?? (ctx.cast[spec.who]?.s ?? 1)) * k }, t, ctx, xs[i], y));
}

// ---------- x-ray internals for cutaways (body-specific, optional) ----------
export const XRAY = {
  lamp(c, t, p) { // zinc + acid -> hydrogen -> platinum sponge -> flame
    c.save(); c.globalAlpha = clamp(p * 2);
    box(c, 52, -330, 56, 150, '#9AA3A8', { r: 6 });                 // zinc block (beside the face)
    for (let i = 0; i < 9; i++) {                                     // hydrogen bubbles rising
      const ph = (t * 0.8 + i / 9) % 1;
      c.strokeStyle = INK; c.lineWidth = 4; c.fillStyle = '#fff';
      c.beginPath(); c.arc(62 + (i % 3) * 18, lerp(-190, -380, ph), 8 + (i % 2) * 4, 0, 7); c.fill(); c.stroke();
    }
    ell(c, 104, -514, 22, 14, '#B9B9B9', { k: 0 });                 // platinum sponge
    c.restore();
  },
  match(c, t, p) { // head chemistry layers + wooden splint
    c.save(); c.globalAlpha = clamp(p * 2);
    ell(c, 0, -455, 36, 44, '#E8E2D0', { k: 0 }); ell(c, 0, -460, 22, 26, '#8C8C8C', { k: 0 });
    c.restore();
  },
};
// Named label anchors per body (local coords at scale 1). Generic ones work for every body.
export const PARTS = {
  _generic: { top: [0, -380], middle: [0, -230], bottom: [0, -90], left: [-120, -230], right: [120, -230] },
  lamp: { zinc: [80, -260], acid: [-80, -150], hydrogen: [80, -370], valve: [-60, -428], nozzle: [100, -500], platinum: [104, -514] },
  match: { head: [0, -460], tip: [0, -510], stick: [0, -250] },
  matchbox: { striker: [0, -90], box: [0, -170] },
  candle: { wick: [0, -360], wax: [0, -200] },
};

// ---------- scenes ----------
export const SCENES = {
  /** Frame-1 hook: set, characters already moving (slam-in, flame flick), slow push-in. */
  hook(c, t, beat, ctx) { c.drawImage(setCanvas(beat.set || 'workshop'), 0, 0); cast(c, t, beat, ctx); },

  /** Characters on a set doing actions. */
  explain(c, t, beat, ctx) { c.drawImage(setCanvas(beat.set || 'workshop'), 0, 0); cast(c, t, beat, ctx); },

  /** Labelled cutaway diagram: one object drawn big, x-ray internals, labels appear one by one. */
  cutaway(c, t, beat, ctx) {
    c.drawImage(setCanvas(beat.set || 'workshop'), 0, 0);
    c.fillStyle = 'rgba(45,62,92,0.82)'; c.fillRect(0, 0, W, H); // x-ray dim
    // blueprint grid
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 2;
    for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    const spec = { ...(beat.chars?.[0] || {}), who: beat.who || beat.chars?.[0]?.who };
    const card = ctx.cast[spec.who] || { body: spec.who };
    const s = beat.scale ?? 1.7, ox = W / 2, oy = 1380;
    const p = clamp(t / 0.5);
    objChar(c, { ...card, ...spec, x: ox, y: oy, s, t: ctx.T, mood: spec.mood || 'proud', flame: card.flame ?? (beat.flame ? 1 : 0), armPose: spec.armPose || 'present' });
    const xr = XRAY[card.body];
    if (xr) { c.save(); c.translate(ox, oy); c.scale(s, s); xr(c, ctx.T, p); c.restore(); }
    const parts = { ...PARTS._generic, ...(PARTS[card.body] || {}) };
    const labels = beat.labels || [];
    const per = Math.max(0.6, ((beat.end - beat.start) - 0.4) / Math.max(1, labels.length));
    labels.forEach((lb, i) => {
      const a = parts[lb.part] || parts.middle;
      const px = ox + a[0] * s, py = oy + a[1] * s;
      const side = lb.side || (i % 2 === 0 ? -1 : 1);
      const tx = side < 0 ? 90 : W - 90, ty = clamp(py - 60 + (i % 2) * 40, 520, 1380);
      label(c, lb.text, px, py, tx, ty, clamp((t - 0.3 - i * per) / 0.5));
    });
  },

  /** "Which came first?" timeline: items pop onto an arrow with their years. */
  timeline(c, t, beat, ctx) {
    c.drawImage(setCanvas(beat.set || 'paper'), 0, 0);
    const y = 1160, items = beat.items || [];
    reveal(c, [[90, y], [W - 90, y]], clamp(t / 0.4), 12);
    if (t > 0.35) { c.fillStyle = INK; c.beginPath(); c.moveTo(W - 60, y); c.lineTo(W - 110, y - 30); c.lineTo(W - 110, y + 30); c.fill(); }
    items.forEach((it, i) => {
      const x = items.length === 1 ? W / 2 : lerp(250, W - 250, i / (items.length - 1));
      const at = 0.4 + i * (it.delay ?? 0.9);
      const k = easeOutBack((t - at) / 0.35);
      if (t < at) return;
      c.save(); c.translate(x, y); c.scale(k, k);
      ell(c, 0, 0, 22, 22, i === (beat.winner ?? 0) ? PAL.gold : PAL.coral);
      c.font = '900 88px "Noto Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = 16; c.strokeStyle = INK; c.strokeText(it.year, 0, 110); c.fillStyle = i === (beat.winner ?? 0) ? PAL.gold : '#fff'; c.fillText(it.year, 0, 110);
      if (it.label) { c.font = '900 50px "Noto Sans"'; c.lineWidth = 12; c.strokeText(it.label, 0, 190); c.fillStyle = '#fff'; c.fillText(it.label, 0, 190); }
      c.restore();
      if (it.who) actor(c, { who: it.who, mood: it.mood || (i === (beat.winner ?? 0) ? 'proud' : 'worried'), s: 0.9, action: t - at < 0.4 ? 'slam' : it.action }, t - at, ctx, x, y - 40);
    });
  },

  /** Big moment: one character centre stage, burst + shake handled by the engine. */
  reveal(c, t, beat, ctx) {
    c.drawImage(setCanvas(beat.set || 'workshop'), 0, 0);
    c.save(); c.globalAlpha = 0.35 * clamp(t / 0.2);
    const g = c.createRadialGradient(W / 2, 1000, 50, W / 2, 1000, 700); g.addColorStop(0, '#FFF4C2'); g.addColorStop(1, 'rgba(255,244,194,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    cast(c, t, beat, ctx);
    burst(c, W / 2, 900, 220, t, 14, PAL.gold);
  },

  /** Payoff -> "DID YOU KNOW? COMMENT BELOW" -> visual loop back to the hook. */
  payoff(c, t, beat, ctx) {
    c.drawImage(setCanvas(beat.set || 'workshop'), 0, 0);
    cast(c, t, beat, ctx);
  },
};
export { titleText };

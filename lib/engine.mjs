// Frame engine: beats.json + caps_raw.json -> frames. Adds camera moves, whip-pans between
// beats, shake on the big moment, titles timed to beats, captions at y~1500, CTA + loop ending.
// Modes: still <t...> (PNGs for QA) and video (raw RGBA piped into ffmpeg).
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { W, H, FPS, clamp, easeInOut, PAL } from './draw.mjs';
import { camApply, shakeAt } from './cam.mjs';
import { titleText, caption } from './text.mjs';
import { SCENES as BASE } from './scenes.mjs';

const WHIP = 0.24; // seconds for a whip-pan

export function loadEpisode(dir) {
  const beats = JSON.parse(fs.readFileSync(path.join(dir, 'beats.json'), 'utf8'));
  const capsPath = path.join(dir, 'caps_raw.json');
  const caps = fs.existsSync(capsPath) ? JSON.parse(fs.readFileSync(capsPath, 'utf8')) : [];
  return { beats, caps };
}

function beatAt(beats, T) {
  for (let i = beats.length - 1; i >= 0; i--) if (T >= beats[i].start) return i;
  return 0;
}

function cameraFor(beat, t, dur) {
  const p = clamp(t / dur);
  const cam = { t };
  switch (beat.camera) {
    case 'push': cam.zoom = 1 + 0.08 * easeInOut(p); cam.cy = 1050; break;
    case 'pushfast': cam.zoom = 1 + 0.18 * easeInOut(clamp(t / 0.6)); cam.cy = 1000; break;
    case 'xray': cam.zoom = 1.0 + 0.12 * easeInOut(clamp(t / 0.8)); cam.cy = 1000; break;
    case 'pull': cam.zoom = 1.12 - 0.12 * easeInOut(p); cam.cy = 1050; break;
    case 'drift': cam.zoom = 1.06; cam.cx = 540 - 30 + 60 * p; cam.cy = 1000; break;
    default: cam.zoom = 1.02;
  }
  if (beat.shake != null) cam.shake = shakeAt(t, beat.shake, beat.shakeAmp ?? 24);
  return cam;
}

function drawBeat(c, scenes, ep, i, T) {
  const beat = ep.beats.beats[i];
  const t = T - beat.start, dur = beat.end - beat.start;
  const ctx = { cast: ep.beats.cast || {}, T, dur };
  c.save();
  camApply(c, cameraFor(beat, t, dur));
  (scenes[beat.scene] || scenes.explain)(c, t, beat, ctx);
  c.restore();
  // titles: pop-in timed to beat start (+ optional offset to land on the spoken word)
  if (beat.title) titleText(c, beat.title, t - (beat.titleAt ?? 0), { y: beat.titleY ?? 300, size: beat.titleSize ?? 104 });
  if (beat.scene === 'payoff') {
    const ctaAt = beat.ctaAt ?? Math.max(0.8, dur - 2.2);
    if (t >= ctaAt) {
      titleText(c, 'DID YOU KNOW?', t - ctaAt, { y: 640, size: 96, fill: PAL.gold });
      titleText(c, 'COMMENT BELOW', t - ctaAt - 0.25, { y: 760, size: 84 });
    }
  }
}

export function renderFrame(c, scenes, ep, T, scratch) {
  const beats = ep.beats.beats;
  const i = beatAt(beats, T);
  const next = beats[i + 1], cur = beats[i];
  // whip-pan around each boundary (outgoing slides left, incoming slides in from the right)
  const toNext = next ? next.start - T : Infinity, fromCur = T - cur.start;
  const inWhip = (toNext < WHIP / 2 && (next.transition ?? 'whip') === 'whip') ? { a: i, b: i + 1, p: 0.5 - toNext / WHIP }
    : (i > 0 && fromCur < WHIP / 2 && (cur.transition ?? 'whip') === 'whip') ? { a: i - 1, b: i, p: 0.5 + fromCur / WHIP } : null;
  if (inWhip) {
    const [ca, cb] = scratch;
    const ta = Math.min(T, beats[inWhip.a].end - 1 / FPS), tb = Math.max(T, beats[inWhip.b].start);
    drawBeat(ca.getContext('2d'), scenes, ep, inWhip.a, ta);
    drawBeat(cb.getContext('2d'), scenes, ep, inWhip.b, tb);
    const e = easeInOut(inWhip.p), off = e * W;
    for (let k = 0; k < 4; k++) { // motion smear
      c.globalAlpha = k === 0 ? 1 : 0.25;
      c.drawImage(ca, -off - k * 40, 0); c.drawImage(cb, W - off - k * 40, 0);
    }
    c.globalAlpha = 1;
  } else {
    drawBeat(c, scenes, ep, i, T);
  }
  // loop ending: last 0.35s crossfades into the hook's opening frame
  const total = ep.beats.duration;
  if (ep.beats.loop !== false && T > total - 0.35) {
    const [, , cl] = scratch; const cc = cl.getContext('2d');
    drawBeat(cc, scenes, ep, 0, 0.32);
    c.globalAlpha = clamp((T - (total - 0.35)) / 0.35); c.drawImage(cl, 0, 0); c.globalAlpha = 1;
  }
  // caption for the phrase being spoken
  const cap = ep.caps.find((p) => T >= p.start && T <= p.end + 0.12);
  if (cap && ep.beats.captions !== false) caption(c, cap.text, T - cap.start);
}

export async function main(argv, extraScenes = {}) {
  const [dir, mode = 'still', ...times] = argv;
  if (!dir) { console.error('usage: node render.mjs <episodeDir> still <t...> | video'); process.exit(1); }
  const ep = loadEpisode(dir);
  const scenes = { ...BASE, ...extraScenes };
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  const scratch = [createCanvas(W, H), createCanvas(W, H), createCanvas(W, H)];
  const clear = (ctx) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); };
  const frame = (T) => { clear(c); scratch.forEach((s) => clear(s.getContext('2d'))); renderFrame(c, scenes, ep, T, scratch); };

  if (mode === 'still') {
    const out = path.join(dir, 'stills'); fs.mkdirSync(out, { recursive: true });
    const ts = times.length ? times.map(Number) : ep.beats.beats.map((b) => +(b.start + Math.min(1.2, (b.end - b.start) / 2)).toFixed(2));
    for (const T of ts) { frame(T); fs.writeFileSync(path.join(out, `t${T.toFixed(2)}.png`), cv.toBuffer('image/png')); }
    console.log(`stills -> ${out} (${ts.join(', ')})`);
    return;
  }
  const n = Math.round(ep.beats.duration * FPS);
  const outFile = path.join(dir, 'video_noaudio.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    // Master quality: near-transparent x264 tuned for flat cartoon art, BT.709 colour (what YouTube assumes),
    // closed GOP at half the frame rate (YouTube's upload recommendation).
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'animation', '-profile:v', 'high',
    '-g', '15', '-bf', '2', '-flags', '+cgop',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    frame(f / FPS);
    const buf = c.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 90 === 0) process.stdout.write(`frame ${f}/${n}\r`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (code) => (code === 0 ? r() : j(new Error('ffmpeg failed ' + code)))));
  console.log(`video -> ${outFile} (${n} frames, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

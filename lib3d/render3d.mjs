// 3D renderer: three.js in headless Chromium (software WebGL), frames piped into ffmpeg.
// Every frame is still drawn in code - no external video AI. Usage:
//   node lib3d/render3d.mjs <episodeDir> still <t...>      -> <ep>/stills/t*.jpg
//   node lib3d/render3d.mjs <episodeDir> video [fps]       -> <ep>/video_noaudio.mp4
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // pre-installed globally in the cloud image
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };
const [dir, mode = 'still', ...rest] = process.argv.slice(2);
if (!dir) { console.error('usage: node lib3d/render3d.mjs <episodeDir> still <t...> | video [fps]'); process.exit(1); }
const W = 1080, H = 1920;

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/lib3d/page.html?ep=${encodeURIComponent(dir)}`);
await page.waitForFunction('window.READY === true', null, { timeout: 60000 });
const duration = await page.evaluate('window.DURATION');
const shot = async (t) => { await page.evaluate((tt) => window.renderAt(tt), t); return page.screenshot({ type: 'jpeg', quality: 95 }); };

if (mode === 'still') {
  const out = path.join(dir, 'stills'); fs.mkdirSync(out, { recursive: true });
  for (const t of rest.map(Number)) fs.writeFileSync(path.join(out, `t${t.toFixed(2)}.jpg`), await shot(t));
  console.log(`stills -> ${out} (${rest.join(', ')})`);
} else {
  const fps = Number(rest[0] || 30), n = Math.round(duration * fps), outFile = path.join(dir, 'video_noaudio.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(fps), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-profile:v', 'high',
    '-g', String(Math.round(fps / 2)), '-bf', '2', '-flags', '+cgop', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    const buf = await shot(f / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`video -> ${outFile} (${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
await browser.close(); server.close();

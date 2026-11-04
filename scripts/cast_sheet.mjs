// Cast sheet for QA: every character standing, walking (two phases) and mirrored, big enough to
// check limbs, hands and faces.  node scripts/cast_sheet.mjs [episodeDir] out.png
import { createCanvas } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { objChar, human, BODIES } from '../lib/chars.mjs';
import { PAL } from '../lib/draw.mjs';

const [epDir, out = 'cast_sheet.png'] = process.argv.slice(2).length > 1 ? process.argv.slice(2) : [null, process.argv[2] || 'cast_sheet.png'];
if (epDir && fs.existsSync(path.join(epDir, 'scenes.mjs'))) await import(pathToFileURL(path.resolve(epDir, 'scenes.mjs')).href);
const cv = createCanvas(2600, 1500), c = cv.getContext('2d');
c.fillStyle = PAL.paper; c.fillRect(0, 0, 2600, 1500);
const person = { costume: { coat: '#2A2E3A', trim: PAL.gold }, hair: { style: 'short', color: '#6B3E22' }, beard: {}, hat: { style: 'capotain', color: '#1E1E1E' } };
const poses = [{}, { legPose: 'walk', t: 0.1 }, { armPose: 'cheer', legPose: 'walk', t: 0.5 }, { flip: true, armPose: 'point' }];
poses.forEach((p, i) => human(c, { ...person, x: 180 + i * 300, y: 680, s: 1, ...p }));
const bodies = Object.keys(BODIES);
bodies.forEach((b, i) => {
  const col = i % 8, row = Math.floor(i / 8);
  objChar(c, { body: b, x: 1350 + (i % 4) * 300 - (col >= 4 ? 0 : 0), y: 640 + row * 0, s: 0.5 }); // placeholder, replaced below
});
c.fillStyle = PAL.paper; c.fillRect(1200, 0, 1400, 1500);
bodies.forEach((b, i) => {
  objChar(c, { body: b, x: 1330 + (i % 4) * 320, y: 560 + Math.floor(i / 4) * 470, s: 0.55 });
});
bodies.slice(0, 4).forEach((b, i) => objChar(c, { body: b, x: 180 + i * 300, y: 1420, s: 0.7, legPose: 'walk', t: 0.15 }));
fs.writeFileSync(out, cv.toBuffer('image/png'));
console.log(`cast sheet -> ${out} (${bodies.length} bodies)`);

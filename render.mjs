// Render an episode. Bespoke scenes for one video go in episodes/<slug>/scenes.mjs
// (export const SCENES = { name(c, t, beat, ctx) {...} }) and override/extend lib/scenes.mjs.
//   node render.mjs episodes/<slug> still 0.5 4.2 9   -> episodes/<slug>/stills/*.png
//   node render.mjs episodes/<slug> video             -> episodes/<slug>/video_noaudio.mp4
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { main } from './lib/engine.mjs';

const dir = process.argv[2];
let extra = {};
const custom = dir && path.resolve(dir, 'scenes.mjs');
if (custom && fs.existsSync(custom)) extra = (await import(pathToFileURL(custom).href)).SCENES || {};
await main(process.argv.slice(2), extra);

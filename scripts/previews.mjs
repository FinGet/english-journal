import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { getEpisodePaths } from './project-paths.mjs';
import { checkProductionFile } from './quality.mjs';
import { compositionFrames } from '../src/production/validate.mjs';

const { values } = parseArgs({ options: { episode: { type: 'string' }, edition: { type: 'string' }, frames: { type: 'string' }, guides: { type: 'boolean', default: false } } });
const paths = getEpisodePaths(values.episode, values.edition);
checkProductionFile(paths.motion);
const p = JSON.parse(readFileSync(paths.motion, 'utf8'));
const totalFrames = compositionFrames(p, JSON.parse(readFileSync('brand.config.json', 'utf8')));
const candidates = [...p.shots.flatMap(s => [s.from, s.from + 9, Math.min(s.to - 1, s.from + 35), s.to - 1]), p.durationInFrames, p.durationInFrames + 9, p.durationInFrames + 45, totalFrames - 1];
const frames = values.frames ? values.frames.split(',').map(Number) : [...new Set([...candidates, ...p.captions.map(c => Math.round((c.from + c.to) / 2))])].sort((a, b) => a - b);
if (frames.some(f => !Number.isInteger(f) || f < 0 || f >= totalFrames)) throw new Error('Preview frame outside the composition');
const dir = `${paths.work}/previews`;
mkdirSync(dir, { recursive: true });
const serveUrl = await bundle({ entryPoint: 'src/index.tsx' });
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const inputProps = { motionSrc: paths.motionSrc, debugOverlay: values.guides };
try {
  const composition = await selectComposition({ serveUrl, id: 'EnglishJournal', inputProps, puppeteerInstance: browser });
  for (const frame of frames) {
    await renderStill({ serveUrl, composition, inputProps, puppeteerInstance: browser, frame, imageFormat: 'png', scale: .5, output: `${dir}/${String(frame).padStart(4, '0')}.png` });
    console.log(`Preview frame ${frame}`);
  }
  writeFileSync(`${paths.work}/preview-frames.json`, JSON.stringify({ motionSrc: paths.motionSrc, frames, scale: .5, guides: values.guides }, null, 2) + '\n');
} finally { await browser.close({ silent: true }); }

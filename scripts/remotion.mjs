import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { getEpisodePaths } from "./project-paths.mjs";
import { checkProductionFile } from './quality.mjs';
import { finishDelivery } from './delivery.mjs';
import { compositionFrames } from '../src/production/validate.mjs';

const project = JSON.parse(readFileSync('project.config.json', 'utf8'));
const [command, ...args] = process.argv.slice(2);
const { values } = parseArgs({ args, options: { episode: { type: "string" }, edition: { type: "string" }, scale: { type: "string", default: String(command === 'sample' ? .5 : command === 'cover' ? project.cover.scale : project.export.scale) }, frame: { type: "string", default: "30" }, name: { type: "string", default: "preview" }, guides: { type: 'boolean', default: false }, from: { type: 'string', default: '0' }, to: { type: 'string' } } });
if (!["studio", "still", "render", "cover", "sample"].includes(command)) throw new Error("Expected studio, still, cover, sample or render");
const paths = getEpisodePaths(values.episode, values.edition);
if (!/^\d+$/.test(values.frame) || !/^[a-z0-9-]+$/.test(values.name)) throw new Error("Invalid frame or output name");
if (![...(command === 'sample' ? [.5] : []), 1, 4 / 3, 2].includes(Number(values.scale))) throw new Error("scale must be 1 (1080p), 1.3333333333333333 (2K) or 2 (4K); sample also supports 0.5");
if (!existsSync(paths.motion)) throw new Error(`Missing ${paths.motion}; run npm run setup first`);
const cli = resolve("node_modules/@remotion/cli/remotion-cli.js");
const production = JSON.parse(readFileSync(paths.motion, 'utf8'));
const totalFrames = production.format === 'english-journal/v2' ? compositionFrames(production, JSON.parse(readFileSync('brand.config.json', 'utf8'))) : production.durationInFrames;
const sampleEnd = values.to ?? String(Math.min(179, totalFrames - 1));
if (command === 'sample' && (![values.from, sampleEnd].every(n => /^\d+$/.test(n)) || Number(sampleEnd) < Number(values.from) || Number(sampleEnd) >= totalFrames)) throw new Error('Invalid representative sample frame range');
if (production.format !== 'english-journal/v2') throw new Error('Historical format: import this recording as a new v2 edition');
if (command !== 'studio') checkProductionFile(paths.motion, { final: command === 'render' || command === 'cover', cover: command === 'cover', report: `${paths.work}/preflight.json` });
if (values.guides && (command === 'render' || command === 'cover')) throw new Error('Preview guides cannot be exported as a final video or cover');
const props = `--props=${JSON.stringify({ motionSrc: paths.motionSrc, ...(values.guides ? { debugOverlay: true } : {}) })}`;
const directory = command === "still" ? `${paths.work}/previews` : command === 'sample' ? `${paths.work}/samples` : paths.output;
if (command !== "studio") mkdirSync(directory, { recursive: true });
const output = command === 'cover' ? `${directory}/cover.png` : command === 'sample' ? `${directory}/${values.name}.mp4` : `${directory}/video.mp4`;
if (['render', 'cover'].includes(command) && existsSync(output)) {
  const backup = `${paths.work}/previous-exports/${Date.now()}`;
  mkdirSync(backup, { recursive: true }); copyFileSync(output, `${backup}/${command === 'cover' ? 'cover.png' : 'video.mp4'}`);
}
const isProductionRender = command === 'render' && production.format === 'english-journal/v2';
const work = paths.work;
if (isProductionRender) mkdirSync(work, { recursive: true });
const renderOutput = isProductionRender ? `${work}/master.mp4` : output;
const extra = command === "studio" ? [] : [command === 'cover' ? 'JournalCover' : "EnglishJournal", command === "still" ? `${directory}/${values.name}.png` : renderOutput];
// Studio follows the live episode config unless an episode was explicitly selected.
const inputProps = command === "studio" && values.episode === undefined && values.edition === undefined ? [] : [props];
execFileSync(process.execPath, [cli, command === 'cover' ? 'still' : command === 'sample' ? 'render' : command, "src/index.tsx", ...extra, ...inputProps, ...(['still', 'cover'].includes(command) ? [`--frame=${command === 'cover' ? 0 : values.frame}`, `--scale=${values.scale}`] : ['render', 'sample'].includes(command) ? [`--scale=${values.scale}`, `--concurrency=${project.export.concurrency}`, ...(command === 'sample' ? [`--frames=${values.from}-${sampleEnd}`] : [])] : [])], { stdio: "inherit" });
if (isProductionRender) finishDelivery({ master: renderOutput, output, work, production: { ...production, durationInFrames: totalFrames }, scale: Number(values.scale) });

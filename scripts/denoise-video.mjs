import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { denoiseVideo } from './denoise.mjs';
import { getEpisodePaths } from './project-paths.mjs';
import { readFileSync } from 'node:fs';

try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const project = JSON.parse(readFileSync('project.config.json', 'utf8'));
const { values } = parseArgs({ options: { video: { type: 'string' }, episode: { type: 'string' }, edition: { type: 'string' }, work: { type: 'string' }, db: { type: 'string', default: String(project.audio.denoiseDb) } } });
if (!values.video) throw new Error('Required: npm run denoise -- --video raw-or-trimmed-original.mp4 [--episode N] [--db 6|12]');
const paths = getEpisodePaths(values.episode, values.edition);
const result = denoiseVideo({ video: resolve(values.video), work: values.work ?? `${paths.work}/denoise`, db: values.db });
console.log(`${result.reused ? 'Reused' : 'Created'} independent denoised copy (${result.db}dB limit): ${result.video}`);
console.log('Original media was preserved. Use raw audio for pause decisions; do not denoise an already processed voice twice.');

import { parseArgs } from 'node:util';
import { getEpisodePaths } from './project-paths.mjs';
import { checkProductionFile } from './quality.mjs';

const { values } = parseArgs({ options: { episode: { type: 'string' }, edition: { type: 'string' } } });
const paths = getEpisodePaths(values.episode, values.edition);
checkProductionFile(paths.motion, { report: `${paths.work}/preflight.json` });

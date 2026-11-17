import { constants, copyFileSync, mkdirSync } from 'node:fs';
import { getEpisodePaths } from './project-paths.mjs';

for (const name of ['brand', 'episode']) {
  try { copyFileSync(new URL(`../${name}.config.example.json`, import.meta.url), `${name}.config.json`, constants.COPYFILE_EXCL); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
}
const paths = getEpisodePaths();
mkdirSync(paths.assets, { recursive: true });
mkdirSync(paths.work, { recursive: true });
mkdirSync(paths.cache, { recursive: true });
console.log('Kept existing configuration and media. Import a real recording with npm run episode:new; setup does not create synthetic video, captions or scene experiments.');

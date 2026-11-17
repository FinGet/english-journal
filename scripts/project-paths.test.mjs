import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { episodeId, getEpisodePaths } from './project-paths.mjs';

test('edition paths share the selected media and keep working files out of final exports', () => {
  const paths = getEpisodePaths(9, 'journal');
  assert.equal(paths.motionSrc, 'ep09/journal/motion.json');
  assert.equal(paths.video, 'public/ep09/journal/program.mp4');
  assert.equal(paths.work, 'output/_work/ep09/journal');
  assert.equal(paths.output, 'output/ep09');
  for (const n of [0, -1, '9/../1', 10000, '']) assert.throws(() => episodeId(n));
  for (const edition of ['../other', '', 'a/b']) assert.throws(() => getEpisodePaths(9, edition));
});

test('setup preserves real material and never creates synthetic subtitles or video', t => {
  const dir = mkdtempSync(join(tmpdir(), 'journal-setup-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'public/ep01/journal'), { recursive: true });
  writeFileSync(join(dir, 'public/ep01/journal/source.mp4'), 'original media');
  writeFileSync(join(dir, 'brand.config.json'), '{"name":"Existing account"}');
  const script = fileURLToPath(new URL('./setup.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(dir, 'brand.config.json'), 'utf8'), '{"name":"Existing account"}');
  assert.equal(readFileSync(join(dir, 'public/ep01/journal/source.mp4'), 'utf8'), 'original media');
  assert(!existsSync(join(dir, 'public/ep01/journal/motion.json')));
  assert(!existsSync(join(dir, 'public/ep01/journal/program.mp4')));
});

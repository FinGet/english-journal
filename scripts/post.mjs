import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validatePublication } from '../src/production/validate.mjs';
import { getEpisodePaths } from './project-paths.mjs';

export function parsePost(text) {
  const lines = text.replace(/\r\n/g, '\n').trim().split('\n');
  const title = lines.shift()?.replace(/^#\s+/, '').trim();
  if (lines.shift()?.trim() !== '') throw new Error('post.md needs a title, a blank line, then one short paragraph');
  const post = { title, body: lines.join('\n').trim() };
  validatePublication(post);
  return post;
}

export function writePost({ production, output, work }) {
  validatePublication(production.publication);
  const { title, body } = production.publication;
  const text = `# ${title.trim()}\n\n${body.trim()}\n`;
  const target = `${output}/post.md`;
  mkdirSync(output, { recursive: true });
  if (existsSync(target)) {
    if (readFileSync(target, 'utf8') === text) return target;
    const backup = `${work}/previous-exports/${Date.now()}`;
    mkdirSync(backup, { recursive: true });
    copyFileSync(target, `${backup}/post.md`);
  }
  writeFileSync(`${target}.partial`, text);
  renameSync(`${target}.partial`, target);
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { episode: { type: 'string' }, edition: { type: 'string' } } });
  const paths = getEpisodePaths(values.episode, values.edition);
  const production = JSON.parse(readFileSync(paths.motion, 'utf8'));
  console.log(`Wrote ${writePost({ production, output: paths.output, work: paths.work })}`);
}

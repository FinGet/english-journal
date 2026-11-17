import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsePost, writePost } from './post.mjs';

test('post titles count Unicode characters and publication stays one short paragraph', () => {
  assert.equal(parsePost(`# ${'😀'.repeat(20)}\n\n一段文案。\n`).title, '😀'.repeat(20));
  assert.throws(() => parsePost(`# ${'字'.repeat(21)}\n\n文案。`), /20 characters/);
  assert.throws(() => parsePost('# 标题\n\n第一段\n第二段'), /one short paragraph/);
  assert.throws(() => parsePost('# 标题'), /blank line/);
});

test('post regeneration preserves changed copy in work, outside the final directory', t => {
  const root = mkdtempSync(join(tmpdir(), 'journal-post-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, 'output'), work = join(root, 'work');
  const production = { publication: { title: 'AI 蠢到让人抓狂', body: '本来想要惊喜，结果等来的是惊吓。' } };
  const path = writePost({ production, output, work });
  const first = readFileSync(path, 'utf8');
  assert.deepEqual(parsePost(first), production.publication);
  production.publication.body = '这次聊聊使用 AI 剪辑的挫败感。';
  writePost({ production, output, work });
  assert.equal(readFileSync(join(work, 'previous-exports', readdirSync(join(work, 'previous-exports'))[0], 'post.md'), 'utf8'), first);
  assert.deepEqual(readdirSync(output), ['post.md']);
});

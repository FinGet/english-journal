import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, truncateSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { journalChats, publishBundle, resolveJournalChat, transferVideo, UPLOAD_LIMIT } from './publish-feishu.mjs';
import { sha256 } from './quality.mjs';

const response = payload => new Response(JSON.stringify({ code: 0, ...payload }), { headers: { 'Content-Type': 'application/json' } });

test('journal lookup paginates and never falls back to an unrelated group', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(String(url));
    return response({ data: calls.length === 1 ? { items: [{ name: 'expression', chat_id: 'oc_wrong' }], has_more: true, page_token: 'next' } : { items: [{ name: 'journal', chat_id: 'oc_right' }], has_more: false } });
  });
  assert.deepEqual((await journalChats('test-token')).map(c => c.chat_id), ['oc_right']);
  assert.match(calls[1], /page_token=next/);
});

test('ambiguous journal groups require an explicit ID', async t => {
  t.mock.method(globalThis, 'fetch', async () => response({ data: { items: [{ name: 'journal', chat_id: 'oc_one' }, { name: 'journal', chat_id: 'oc_two' }], has_more: false } }));
  await assert.rejects(resolveJournalChat('test-token'), /Multiple journal groups/);
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'journal-feishu-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const out = join(root, 'output'), work = join(root, 'work');
  mkdirSync(out);
  writeFileSync(join(out, 'cover.png'), 'cover'); writeFileSync(join(out, 'video.mp4'), 'video');
  return { token: 'test-token', chatId: 'oc_journal', out, work, video: join(out, 'video.mp4'), bundle: { title: 'AI 蠢到让人抓狂', body: '一次 AI 剪辑后的思考。', duration: 98_000, hashes: { 'post.md': 'p', 'cover.png': 'c', 'video.mp4': sha256(join(out, 'video.mp4')) } } };
}

test('large originals pass through unchanged unless preview compression was requested', t => {
  const args = fixture(t);
  truncateSync(args.video, UPLOAD_LIMIT);
  assert.equal(transferVideo(args.out, args.work, args.bundle), args.video);
});

test('uploads complete before card/media messages; reruns do not duplicate a sent bundle', async t => {
  const args = fixture(t), calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push(String(url));
    if (String(url).endsWith('/images')) return response({ data: { image_key: 'image-test' } });
    if (String(url).endsWith('/files')) return response({ data: { file_key: 'file-test' } });
    const message = JSON.parse(options.body);
    assert.equal(message.receive_id, 'oc_journal');
    if (message.msg_type === 'interactive') assert.equal(JSON.parse(message.content).header.title.content, args.bundle.title);
    else assert.deepEqual(JSON.parse(message.content), { file_key: 'file-test', image_key: 'image-test' });
    return response({ data: { message_id: `message-${message.msg_type}` } });
  });
  await publishBundle(args);
  assert(calls[0].endsWith('/images') && calls[1].endsWith('/files'));
  assert.equal(calls.length, 4);
  await publishBundle(args);
  assert.equal(calls.length, 4);
});

test('an upload failure leaves the group without partial messages', async t => {
  const args = fixture(t), calls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(String(url));
    if (String(url).endsWith('/images')) return response({ data: { image_key: 'image-test' } });
    throw new Error('upload failed');
  });
  await assert.rejects(publishBundle(args), /upload failed/);
  assert(!calls.some(url => url.includes('/messages')));
});

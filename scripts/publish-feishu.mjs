import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parsePost } from './post.mjs';
import { getEpisodePaths } from './project-paths.mjs';
import { probe, sha256 } from './quality.mjs';

// Adapted from the expression publisher; this client has no sibling-project imports.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const API = 'https://open.feishu.cn/open-apis';
export const UPLOAD_LIMIT = 30_000_000;
const digest = text => createHash('sha256').update(text).digest('hex');

export async function feishuRequest(path, { token, method = 'GET', body, timeout = 30_000 } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json; charset=utf-8';
  const response = await fetch(API + path, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
  const payload = await response.json();
  if (!response.ok || payload.code !== 0) throw new Error(`Feishu ${response.status}/${payload.code}: ${payload.msg ?? 'Request failed'}`);
  return payload;
}

async function tenantToken() {
  const app_id = process.env.FEISHU_APP_ID, app_secret = process.env.FEISHU_APP_SECRET;
  if (!app_id || !app_secret) throw new Error('Set FEISHU_APP_ID and FEISHU_APP_SECRET in this project’s .env or shell environment');
  const response = await feishuRequest('/auth/v3/tenant_access_token/internal', { method: 'POST', body: { app_id, app_secret } });
  if (!response.tenant_access_token) throw new Error('Feishu did not return a tenant token');
  return response.tenant_access_token;
}

export async function journalChats(token) {
  const matches = [];
  let page;
  do {
    const query = new URLSearchParams({ page_size: '100', ...(page ? { page_token: page } : {}) });
    const { data } = await feishuRequest(`/im/v1/chats?${query}`, { token });
    matches.push(...(data.items ?? []).filter(chat => chat.name?.trim().toLowerCase() === 'journal'));
    const next = data.has_more ? data.page_token : undefined;
    if (data.has_more && (!next || next === page)) throw new Error('Invalid Feishu group pagination');
    page = next;
  } while (page);
  return matches;
}

export async function resolveJournalChat(token, explicitId) {
  if (explicitId) {
    if (!/^oc_[a-zA-Z0-9]+$/.test(explicitId)) throw new Error('Invalid journal chat ID');
    return explicitId;
  }
  const matches = await journalChats(token);
  if (matches.length !== 1) throw new Error(matches.length ? 'Multiple journal groups found; set JOURNAL_FEISHU_CHAT_ID explicitly' : 'The bot cannot see journal. Add the existing app bot to that group, then retry.');
  return matches[0].chat_id;
}

export function prepareBundle(out) {
  for (const name of ['post.md', 'cover.png', 'video.mp4']) {
    const path = join(out, name);
    if (!existsSync(path) || !statSync(path).isFile() || !statSync(path).size) throw new Error(`Missing final artifact: ${path}`);
  }
  const publication = parsePost(readFileSync(join(out, 'post.md'), 'utf8'));
  const media = probe(join(out, 'video.mp4'));
  const seconds = Number(media.format.duration);
  if (!media.streams.some(s => s.codec_type === 'video') || !media.streams.some(s => s.codec_type === 'audio') || !Number.isFinite(seconds) || seconds <= 0) throw new Error('Exported video must contain video, audio and a valid duration');
  if (statSync(join(out, 'cover.png')).size >= 10_000_000) throw new Error('Feishu cover upload requires a PNG below 10 MB');
  return { ...publication, seconds, duration: Math.round(seconds * 1000), hashes: Object.fromEntries(['post.md', 'cover.png', 'video.mp4'].map(name => [name, sha256(join(out, name))])) };
}

export function transferVideo(out, work, bundle, { preview = false } = {}) {
  const original = join(out, 'video.mp4');
  // Attempt original-file delivery by default; let the server enforce its current limit.
  if (statSync(original).size < UPLOAD_LIMIT || !preview) return original;
  mkdirSync(work, { recursive: true });
  const target = join(work, `video-${bundle.hashes['video.mp4']}-v1.mp4`);
  if (existsSync(target) && statSync(target).size > 0 && statSync(target).size < UPLOAD_LIMIT) return target;
  const bitrate = Math.floor((28_000_000 * 8 / bundle.seconds - 128_000) * .94);
  if (bitrate < 200_000) throw new Error('Video is too long for a useful 30 MB transfer copy; use a different delivery method');
  const staged = join(work, 'transfer.partial.mp4'), passlog = join(work, 'transfer-pass');
  const videoArgs = ['-vf', 'scale=w=min(1080\\,iw):h=-2', '-c:v', 'libx264', '-b:v', String(bitrate), '-preset', 'medium', '-pix_fmt', 'yuv420p', '-passlogfile', passlog];
  console.log('Creating an explicitly requested compressed preview; use the original final video for publication.');
  execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-y', '-i', original, ...videoArgs, '-pass', '1', '-an', '-f', 'null', process.platform === 'win32' ? 'NUL' : '/dev/null'], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-y', '-i', original, ...videoArgs, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', staged], { stdio: 'inherit' });
  const compressed = probe(staged);
  if (!statSync(staged).size || statSync(staged).size >= UPLOAD_LIMIT || Math.abs(Number(compressed.format.duration) - bundle.seconds) > .1 || !compressed.streams.some(s => s.codec_type === 'audio') || !compressed.streams.some(s => s.codec_type === 'video')) throw new Error('Transfer copy failed size/duration/audio checks; no messages sent');
  renameSync(staged, target);
  return target;
}

async function upload(token, kind, path, duration) {
  const form = new FormData();
  if (kind === 'image') form.set('image_type', 'message');
  else {
    form.set('file_type', 'mp4'); form.set('file_name', 'video.mp4'); form.set('duration', String(duration));
  }
  form.set(kind === 'image' ? 'image' : 'file', new Blob([readFileSync(path)], { type: kind === 'image' ? 'image/png' : 'video/mp4' }), kind === 'image' ? 'cover.png' : 'video.mp4');
  let data;
  try {
    ({ data } = await feishuRequest(`/im/v1/${kind === 'image' ? 'images' : 'files'}`, { token, method: 'POST', body: form, timeout: 180_000 }));
  } catch (error) {
    if (kind === 'video' && statSync(path).size >= UPLOAD_LIMIT) throw new Error(`Original-file upload failed; no compressed fallback was sent. Original preserved at ${path}. ${error.message}`);
    throw error;
  }
  const key = kind === 'image' ? data.image_key : data.file_key;
  if (!key) throw new Error(`Feishu did not return an uploaded ${kind} key`);
  return key;
}

export async function publishBundle({ token, chatId, out, video, bundle, work }) {
  mkdirSync(work, { recursive: true });
  const videoSha256 = sha256(video);
  const fingerprint = digest(JSON.stringify({ chatId, hashes: bundle.hashes, videoSha256 }));
  const receiptPath = join(work, `sent-${fingerprint}.json`);
  const receipt = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, 'utf8')) : { chatId, hashes: bundle.hashes, videoSha256, compressedPreview: videoSha256 !== bundle.hashes['video.mp4'] };
  const save = () => { writeFileSync(`${receiptPath}.partial`, JSON.stringify(receipt, null, 2) + '\n'); renameSync(`${receiptPath}.partial`, receiptPath); };
  if (receipt.videoMessageId) { console.log('This exact bundle was already sent to journal.'); return receipt; }
  // Upload both files before posting anything. Persist each step for safe manual retries.
  if (!receipt.imageKey) { receipt.imageKey = await upload(token, 'image', join(out, 'cover.png')); save(); }
  if (!receipt.fileKey) { receipt.fileKey = await upload(token, 'video', video, bundle.duration); save(); }
  const send = async (type, content) => {
    const { data } = await feishuRequest('/im/v1/messages?receive_id_type=chat_id', { token, method: 'POST', body: { receive_id: chatId, msg_type: type, content: JSON.stringify(content), uuid: digest(`${fingerprint}:${type}`).slice(0, 32) } });
    if (!data.message_id) throw new Error('Feishu did not return a message ID');
    return data.message_id;
  };
  if (!receipt.cardMessageId) {
    receipt.cardMessageId = await send('interactive', {
      config: { wide_screen_mode: true },
      header: { title: { tag: 'plain_text', content: videoSha256 === bundle.hashes['video.mp4'] ? bundle.title : `预览版 · ${bundle.title}` }, template: 'turquoise' },
      elements: [
        { tag: 'div', text: { tag: 'plain_text', content: bundle.body } },
        { tag: 'hr' },
        { tag: 'img', img_key: receipt.imageKey, alt: { tag: 'plain_text', content: '3:4 封面' }, mode: 'fit_horizontal', preview: true },
      ],
    });
    save(); console.log('Sent publication copy and cover to journal.');
  }
  receipt.videoMessageId = await send('media', { file_key: receipt.fileKey, image_key: receipt.imageKey });
  receipt.sentAt = new Date().toISOString(); save();
  console.log('Sent playable video to journal.');
  return receipt;
}

async function main() {
  process.chdir(ROOT);
  try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const { values } = parseArgs({ options: { episode: { type: 'string' }, edition: { type: 'string' }, out: { type: 'string' }, 'chat-id': { type: 'string' }, check: { type: 'boolean' }, preview: { type: 'boolean', default: false }, 'list-chats': { type: 'boolean' } } });
  if (values['list-chats']) {
    console.log(JSON.stringify(await journalChats(await tenantToken()).then(chats => chats.map(({ name, chat_id }) => ({ name, chat_id }))), null, 2));
    return;
  }
  const paths = getEpisodePaths(values.episode, values.edition);
  const out = resolve(values.out ?? paths.output);
  if (dirname(out) !== resolve('output') || !/^ep[0-9]{2,4}$/.test(basename(out))) throw new Error('Send only a final output/epXX bundle');
  const bundle = prepareBundle(out);
  const originalExceedsUploadLimit = statSync(join(out, 'video.mp4')).size >= UPLOAD_LIMIT;
  if (values.check) { console.log(JSON.stringify({ out, title: bundle.title, body: bundle.body, duration: bundle.duration, originalExceedsUploadLimit, compressedPreviewRequested: values.preview }, null, 2)); return; }
  const token = await tenantToken();
  const chatId = await resolveJournalChat(token, values['chat-id'] ?? process.env.JOURNAL_FEISHU_CHAT_ID);
  const work = resolve('output/_work', basename(out), 'feishu');
  const video = transferVideo(out, work, bundle, { preview: values.preview });
  await publishBundle({ token, chatId, out, video, bundle, work });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(`Feishu delivery failed: ${error.message}`); process.exitCode = 1; });

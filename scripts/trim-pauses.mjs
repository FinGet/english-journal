import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { probe, sha256 } from './quality.mjs';

const { values } = parseArgs({ options: { video: { type: 'string' }, words: { type: 'string' }, out: { type: 'string' }, apply: { type: 'boolean', default: false } } });
if (!values.video || !values.words || !values.out) throw new Error('Required: npm run trim -- --video original.mp4 --words source-asr.json --out work/trim [--apply]');
const dir = resolve(values.out), planPath = join(dir, 'edit.json');
mkdirSync(dir, { recursive: true });
const inputHash = sha256(values.video), wordsHash = sha256(values.words);
if (!values.apply) {
  if (existsSync(planPath)) throw new Error('Keep the existing trim report; use another output directory for a new plan');
  const media = probe(values.video), stream = media.streams.find(s => s.codec_type === 'video');
  if (stream?.avg_frame_rate !== '30/1' || stream?.r_frame_rate !== '30/1' || !Number.isInteger(Number(stream.nb_frames))) throw new Error('Pause planning requires a CFR30 working original; preserve the source separately when making a proxy');
  const total = Number(stream.nb_frames), seconds = total / 30;
  const data = JSON.parse(readFileSync(values.words, 'utf8'));
  const words = Array.isArray(data) ? data : data.segments?.flatMap(s => s.words ?? []);
  if (!words?.length || words.some(w => !Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < 0 || w.end < w.start || w.end > seconds + .05 || !(w.word ?? w.text)?.trim())) throw new Error('Expected real source-clock words with start/end in seconds');
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', values.video, '-map', '0:a:0', '-af', 'silencedetect=noise=-60dB:d=1', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr);
  const removed = [];
  let silence;
  for (const match of result.stderr.matchAll(/silence_(start|end):\s*([-+\d.eE]+)/g)) {
    const t = Number(match[2]);
    if (match[1] === 'start') { silence = t; continue; }
    if (silence !== undefined) {
      const from = Math.ceil((silence + .5) * 30), to = Math.floor((t - .5) * 30);
      if (silence > 0 && t < seconds - .1 && to > from && !words.some(w => w.start <= to / 30 && w.end >= from / 30)) removed.push({ from, to });
    }
    silence = undefined;
  }
  const cuts = [];
  let sourceIn = 0, from = 0;
  for (const interval of [...removed, { from: total, to: total }]) {
    if (interval.from > sourceIn) { cuts.push({ sourceIn, sourceOut: interval.from, from, reason: removed.length ? 'Keep original speech; remove only measured long silence with 0.5s protection at each side' : 'Reviewed without safe pause cuts' }); from += interval.from - sourceIn; }
    sourceIn = interval.to;
  }
  const mapped = frame => { for (const c of cuts) { if (frame < c.sourceIn) return c.from; if (frame < c.sourceOut) return c.from + frame - c.sourceIn; } return from; };
  const mappedWords = words.map(w => ({ from: mapped(Math.round(w.start * 30)), to: mapped(Math.round(w.end * 30)), text: (w.word ?? w.text).trim() }));
  const plan = { source: resolve(values.video), inputHash, wordsHash, fps: 30, sourceFrames: total, outputFrames: from, removed, cuts };
  writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(join(dir, 'words-program.json'), JSON.stringify(mappedWords, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(join(dir, 'trim-report.md'), `# Pause trim dry-run\n\nSource: ${plan.source}\n\n${total} → ${from} frames. Only audio-confirmed silence; 0.5s protected at each side.\n\n${removed.map(c => `- Remove ${(c.from / 30).toFixed(3)}–${(c.to / 30).toFixed(3)}s`).join('\n') || 'No safe cuts; preserve the recording.'}\n\nReview this plan before running --apply. Original source is never replaced.\n`, { flag: 'wx' });
  console.log(`Created dry-run: ${join(dir, 'trim-report.md')}. Review before --apply.`);
} else {
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  if (plan.inputHash !== inputHash || plan.wordsHash !== wordsHash || plan.source !== resolve(values.video)) throw new Error('Source/word timeline changed after the trim report; generate a new plan');
  let end = 0, sourceEnd = 0;
  if (!Array.isArray(plan.cuts) || !plan.cuts.length) throw new Error('Invalid trim plan');
  for (const c of plan.cuts) {
    if (![c.sourceIn, c.sourceOut, c.from].every(Number.isInteger) || c.from !== end || c.sourceIn < sourceEnd || c.sourceOut <= c.sourceIn || c.sourceOut > plan.sourceFrames) throw new Error('Invalid trim interval');
    end += c.sourceOut - c.sourceIn; sourceEnd = c.sourceOut;
  }
  if (end !== plan.outputFrames) throw new Error('Trim length mismatch');
  const program = join(dir, 'program.mp4');
  if (existsSync(program)) throw new Error('Program already exists; preserve this version');
  const filters = plan.cuts.flatMap((c, i) => [
    `[0:v]trim=start_frame=${c.sourceIn}:end_frame=${c.sourceOut},setpts=PTS-STARTPTS[v${i}]`,
    `[0:a]aresample=48000:async=1:first_pts=0,apad,atrim=start=${c.sourceIn / 30}:end=${c.sourceOut / 30},asetpts=PTS-STARTPTS[a${i}]`,
  ]);
  filters.push(`${plan.cuts.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${plan.cuts.length}:v=1:a=1[v][a]`);
  execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-n', '-i', values.video, '-filter_complex', filters.join(';'), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-t', String(end / 30), '-movflags', '+faststart', program], { stdio: 'inherit' });
  const video = probe(program).streams.find(s => s.codec_type === 'video');
  if (Number(video?.nb_frames) !== end) throw new Error('Prepared program frame count differs from the approved edit');
  console.log(`Created ${program}. Original media retained; captions must use words-program.json on the output clock.`);
}

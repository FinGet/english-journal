import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { compositionFrames, validateProduction, validateBrand } from '../src/production/validate.mjs';
import { makeProduction, importEpisode } from './new-episode.mjs';
import { checkProductionFile } from './quality.mjs';
import { getEpisodePaths } from './project-paths.mjs';
import { finishDelivery } from './delivery.mjs';
import { prepareVoice } from './audio.mjs';
import { fileURLToPath } from 'node:url';
import { ACTION_TIMES, OUTRO_SOUND_CUES, actionState } from '../src/production/outro-motion.mjs';

test('outro actions activate in order and follow reaches a drawn check before the final hold', () => {
  assert.deepEqual(ACTION_TIMES, [24, 40, 58]);
  assert.equal(actionState(23, 0).activation, 0);
  assert.equal(actionState(35, 0).activation, 1);
  assert.equal(actionState(35, 1).activation, 0);
  assert.equal(actionState(55, 1).activation, 1);
  assert.equal(actionState(55, 2).plus, 1);
  assert.equal(actionState(55, 2).check, 0);
  const confirmed = actionState(74, 2);
  assert.equal(confirmed.plus, 0);
  assert.equal(confirmed.check, 1);
  assert.equal(confirmed.confirmed, true);
  assert(actionState(48, 1).scale > 1);
  assert.equal(actionState(89, 2).scale, 1);
  assert.equal(actionState(89, 2).burst, 0);
  assert.deepEqual(OUTRO_SOUND_CUES.map(cue => cue.at), [24, 40, 66]);
  assert(OUTRO_SOUND_CUES.every(cue => cue.at + cue.duration <= 90));
});

const base = () => makeProduction({ episode: 87, title: 'Learning to Listen', prefix: 'ep87/journal', frames: 60, sourceFrames: 60, sourceHash: 'a'.repeat(64), programHash: 'b'.repeat(64),
  captions: [{ from: 0, to: 15, english: 'Hello.', chinese: '你好' }, { from: 30, to: 50, english: 'Again.', chinese: '又见面了' }],
  words: [{ from: 0, to: 15, text: 'Hello.' }, { from: 30, to: 50, text: 'Again.' }] });

test('a new topic needs no EP10 code and preserves genuine caption gaps', () => {
  const p = base();
  assert.equal(validateProduction(p).episode, 87);
  assert.equal(p.captions[1].from - p.captions[0].to, 15);
  assert.throws(() => validateProduction(p, { final: true }), /requires confirmed/);
  p.review = { transcript: 'confirmed', direction: 'ready', notes: 'Reviewed fixture' };
  assert.doesNotThrow(() => validateProduction(p, { final: true }));
});

test('timeline and original wording errors fail before rendering', () => {
  for (const mutate of [
    p => { p.captions[1].from = 14; },
    p => { p.captions[1].english = 'Changed.'; },
    p => { p.media.cuts[0].from = 1; },
    p => { p.media.cuts[0].sourceOut = 59; },
    p => { p.shots[0].to = 59; },
    p => { p.shots[0].visual = { kind: 'unregistered-topic' }; },
    p => { p.shots[0].titles[0].text = '中文标题'; },
    p => { p.media.program = '../different-take.mp4'; },
    p => { p.cues = [{ at: 50, duration: 20, src: 'sfx.wav', volume: .2 }]; },
  ]) { const p = base(); mutate(p); assert.throws(() => validateProduction(p)); }
});

test('scene-specific content is bounded by its semantic shot', () => {
  const p = base();
  p.shots[0].visual = { kind: 'flow', nodes: [{ text: 'Listen', at: 5 }, { text: 'Think', at: 15 }], result: 'Respond', resultAt: 30, note: 'Make room for a reply' };
  assert.doesNotThrow(() => validateProduction(p));
  p.shots[0].visual.resultAt = 60;
  assert.throws(() => validateProduction(p), /outside shot/);
});

test('a cover uses a real program frame and requires its own approval', () => {
  const p = base();
  p.review.transcript = 'confirmed';
  p.cover = { frame: 45, title: ['Listen First.'], status: 'draft' };
  assert.doesNotThrow(() => validateProduction(p));
  assert.throws(() => validateProduction(p, { final: true, cover: true }), /approve/);
  p.cover.status = 'approved';
  assert.doesNotThrow(() => validateProduction(p, { final: true, cover: true }));
  p.cover.frame = 60;
  assert.throws(() => validateProduction(p), /Cover frame/);
});

test('one brand contract enforces English graphics and complete color tokens', () => {
  const brand = JSON.parse(readFileSync(new URL('../brand.config.json', import.meta.url)));
  assert.doesNotThrow(() => validateBrand(brand));
  assert.equal(compositionFrames(base(), brand), 150, 'Shared outro appends 90 frames without changing the source/word clock');
  brand.series = '中文'; assert.throws(() => validateBrand(brand), /English/);
});

test('real media import, take identity, alternate episode routing and non-destructive rerun', t => {
  const cwd = process.cwd(), dir = mkdtempSync(join(tmpdir(), 'journal-v2-'));
  t.after(() => { process.chdir(cwd); rmSync(dir, { recursive: true, force: true }); });
  const video = join(dir, 'input.mp4'), transcript = join(dir, 'transcript.json');
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=gray:s=108x192:r=30:d=2', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', video]);
  writeFileSync(transcript, JSON.stringify({ captions: base().captions, words: base().words }));
  copyFileSync(new URL('../brand.config.json', import.meta.url), join(dir, 'brand.config.json'));
  copyFileSync(new URL('../project.config.json', import.meta.url), join(dir, 'project.config.json'));
  mkdirSync(join(dir, 'public/brand/sfx'), { recursive: true });
  for (const file of ['like', 'save', 'follow']) {
    copyFileSync(new URL(`../public/brand/sfx/${file}.wav`, import.meta.url), join(dir, `public/brand/sfx/${file}.wav`));
  }
  process.chdir(dir);
  mkdirSync('public/ep87', { recursive: true }); writeFileSync('public/ep87/motion.json', '{"original":"kept"}');
  const options = { episode: '87', video, transcript, title: 'Learning to Listen', select: true };
  importEpisode(options);
  assert.equal(readFileSync('public/ep87/motion.json', 'utf8'), '{"original":"kept"}');
  assert.equal(getEpisodePaths(87).motionSrc, 'ep87/journal/motion.json');
  assert.equal(getEpisodePaths(12).motionSrc, 'ep12/journal/motion.json');
  assert.equal(checkProductionFile('public/ep87/journal/motion.json').frames, 60);
  assert.throws(() => importEpisode(options), /already exists/);
  assert.throws(() => checkProductionFile('public/ep87/journal/motion.json', { final: true }), /requires confirmed/);
  const motion = 'public/ep87/journal/motion.json', p = JSON.parse(readFileSync(motion));
  p.media.programSha256 = 'c'.repeat(64); writeFileSync(motion, JSON.stringify(p));
  assert.throws(() => checkProductionFile(motion), /Footage changed/);
  assert(existsSync('output/_work/ep87/journal/director-plan.md'));
  const output = join(dir, 'video.mp4');
  const delivered = finishDelivery({ master: video, output, work: dir, production: base(), scale: .1 });
  assert.equal(delivered.frames, 60);
  assert(Math.abs(Number(delivered.after.input_i) - Number(delivered.before.input_i)) < .2, 'Delivery preserves the prepared voice/SFX balance instead of normalizing the entire mix');
  const previous = readFileSync(output);
  assert.throws(() => finishDelivery({ master: video, output, work: dir, production: { ...base(), durationInFrames: 61 }, scale: .1 }), /frame count/);
  assert.deepEqual(readFileSync(output), previous, 'Failed delivery must preserve the last good export');
  const prepared = join(dir, 'voice.wav');
  const voice = prepareVoice({ input: video, output: prepared });
  assert.equal(voice.method, 'fixed-gain');
  assert(Math.abs(Number(voice.after.input_i) + 18) < .2);
  assert(Number(voice.after.input_tp) <= -1.9);
  assert.throws(() => prepareVoice({ input: video, output: prepared }), /Preserve/);
  const sourceWords = join(dir, 'source-asr.json');
  writeFileSync(sourceWords, JSON.stringify([{ start: 0, end: .5, word: 'Hello.' }]));
  execFileSync(process.execPath, [fileURLToPath(new URL('./trim-pauses.mjs', import.meta.url)), '--video', video, '--words', sourceWords, '--out', join(dir, 'trim')]);
  const edit = JSON.parse(readFileSync(join(dir, 'trim/edit.json')));
  assert.equal(edit.outputFrames, 60, 'Continuous tone is not silence: an unrecognized region must not be deleted');
  assert.equal(edit.cuts.length, 1);
  assert(!existsSync(join(dir, 'trim/program.mp4')), 'Dry-run does not apply the plan');
});

import { execFileSync, spawnSync } from 'node:child_process';
import { constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { probe, sha256 } from './quality.mjs';

export function measureLoudness(file) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'loudnorm=I=-18:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr);
  const match = result.stderr.match(/\{[^{}]+"input_i"[^{}]+\}/g)?.at(-1);
  if (!match) throw new Error('Missing loudness measurement');
  return JSON.parse(match);
}

// A fixed gain preserves emphasis and pauses; peak-limited recordings may remain quieter.
export function prepareVoice({ input, output }) {
  if (resolve(input) === resolve(output) || existsSync(output) || existsSync(`${output}.json`)) throw new Error('Preserve the input and existing prepared voice; choose a new output path');
  const project = JSON.parse(readFileSync('project.config.json', 'utf8'));
  const settings = project.audio;
  const seconds = Number(probe(input).format.duration);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Invalid voice source duration');
  mkdirSync(dirname(output), { recursive: true });
  const temp = mkdtempSync(join(dirname(output), '.voice-'));
  try {
    const raw = join(temp, 'original.wav'), prepared = join(temp, 'prepared.wav');
    execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-i', input, '-map', '0:a:0', '-vn', '-af', `aresample=${settings.sampleRate}:async=1:first_pts=0,apad`, '-t', String(seconds), '-ar', String(settings.sampleRate), '-ac', '1', '-c:a', 'pcm_s16le', raw]);
    const before = measureLoudness(raw);
    if (![before.input_i, before.input_tp].every(n => Number.isFinite(Number(n)))) throw new Error('Voice is silent or cannot be measured');
    const requestedGainDb = settings.targetLufs - Number(before.input_i);
    const gainDb = Math.min(requestedGainDb, settings.preparationPeakDbtp - Number(before.input_tp));
    execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-i', raw, '-af', `volume=${gainDb}dB`, '-ar', String(settings.sampleRate), '-ac', '1', '-c:a', 'pcm_s16le', prepared]);
    const after = measureLoudness(prepared);
    if (Number(after.input_tp) > settings.preparationPeakDbtp + .1 || Math.abs(Number(probe(prepared).format.duration) - seconds) > .01) throw new Error('Prepared voice changed duration or exceeded peak headroom');
    const receipt = { input: resolve(input), inputHash: sha256(input), outputHash: sha256(prepared), method: 'fixed-gain', gainDb, requestedGainDb, peakLimited: gainDb < requestedGainDb, targetLufs: settings.targetLufs, before, after, seconds, sampleRate: settings.sampleRate, volume: 1 };
    copyFileSync(prepared, output, constants.COPYFILE_EXCL);
    writeFileSync(`${output}.json`, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    console.log(`Prepared voice: ${output}; ${after.input_i} LUFS, ${after.input_tp} dBTP. Playback gain stays 1.${receipt.peakLimited ? ' Peak protection kept the voice below the requested loudness; dynamics were preserved.' : ''}`);
    return receipt;
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

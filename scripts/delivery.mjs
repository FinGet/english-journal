import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { probe, sha256 } from './quality.mjs';
import { measureLoudness } from './audio.mjs';

export function finishDelivery({ master, output, work, production, scale }) {
  const project = JSON.parse(readFileSync('project.config.json', 'utf8'));
  const before = measureLoudness(master);
  if (!Number.isFinite(Number(before.input_i))) throw new Error('Rendered audio is silent or invalid');
  const staged = `${work}/delivery.mp4`;
  // Voice was prepared before preview. Do not normalize the complete voice/SFX mix again.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', master, '-c:v', 'copy', '-c:a', 'aac', '-ar', String(project.audio.sampleRate), '-b:a', '192k', '-t', String(production.durationInFrames / production.fps), '-movflags', '+faststart', staged]);
  const media = probe(staged), video = media.streams.find(s => s.codec_type === 'video'), audio = media.streams.find(s => s.codec_type === 'audio');
  if (Number(video?.nb_frames) !== production.durationInFrames || video?.width !== Math.round(project.video.width * scale) || video?.height !== Math.round(project.video.height * scale)) throw new Error('Delivery dimensions or video frame count differ from the composition');
  if (!audio || Math.abs(Number(audio.duration) * production.fps - production.durationInFrames) > 1) throw new Error('Delivery audio/video clocks differ');
  const after = measureLoudness(staged);
  if (!Number.isFinite(Number(after.input_i)) || Number(after.input_tp) > project.audio.deliveryPeakDbtp) throw new Error('Delivery true peak exceeds the series ceiling; revise the prepared voice or sound cues without compressing the whole mix');
  const report = { frames: Number(video.nb_frames), width: video.width, height: video.height, audioSeconds: Number(audio.duration), before, after, voiceTargetLufs: project.audio.targetLufs, sha256: sha256(staged), note: 'Final mix was not loudness-normalized. This technical check does not constitute listening review or target-device verification.' };
  writeFileSync(`${work}/delivery.json`, JSON.stringify(report, null, 2) + '\n');
  copyFileSync(staged, `${output}.partial`);
  renameSync(`${output}.partial`, output);
  console.log(`Delivered ${output}: ${report.frames} frames; mix ${after.input_i} LUFS, ${after.input_tp} dBTP.`);
  return report;
}

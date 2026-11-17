import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { compositionFrames, productionAssets, validateBrand, validateProduction } from '../src/production/validate.mjs';

export const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
export const probe = file => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
export function checkProductionFile(file, { final = false, cover = false, report } = {}) {
  const p = validateProduction(JSON.parse(readFileSync(file, 'utf8')), { final, cover });
  const brand = JSON.parse(readFileSync('brand.config.json', 'utf8'));
  validateBrand(brand);
  const root = realpathSync('public');
  const assets = [...new Set([...productionAssets(p), ...brand.outroSfx.map(sound => sound.src), 'heart.svg', 'star.svg'])].map(src => {
    const path = resolve('public', src);
    if (!existsSync(path) || !realpathSync(path).startsWith(root + sep)) throw new Error(`Missing asset or asset outside public: ${src}`);
    return { src, sha256: sha256(path) };
  });
  const hash = src => assets.find(a => a.src === src).sha256;
  if (hash(p.media.source) !== p.media.sourceSha256 || hash(p.media.program) !== p.media.programSha256) throw new Error('Footage changed: regenerate the timeline against this exact take');
  const source = probe(resolve('public', p.media.source));
  if (Math.abs(Number(source.format.duration) * p.fps - p.media.sourceDurationInFrames) > 1) throw new Error('Source duration differs from edit map');
  const program = probe(resolve('public', p.media.program));
  const video = program.streams.find(s => s.codec_type === 'video');
  if (!video || video.r_frame_rate !== '30/1' || video.avg_frame_rate !== '30/1' || Number(video.nb_frames) !== p.durationInFrames) throw new Error('Program must be CFR 30fps with exactly the manifest frame count');
  const audio = p.media.audio ? probe(resolve('public', p.media.audio)) : program;
  if (!audio.streams.some(s => s.codec_type === 'audio') || Math.abs(Number(audio.format.duration) * p.fps - p.durationInFrames) > 1) throw new Error('Voice and program clocks differ or voice is missing');
  const warnings = [];
  if (p.review.transcript !== 'confirmed' || p.review.direction !== 'ready') warnings.push('DRAFT: transcript/direction review is incomplete; final export is blocked.');
  const result = { format: p.format, episode: p.episode, frames: p.durationInFrames, seconds: p.durationInFrames / p.fps, deliveryFrames: compositionFrames(p, brand), outroFrames: p.outro === false ? 0 : brand.outroFrames, captions: p.captions.length, shots: p.shots.length, review: p.review, assets, warnings };
  if (report) { mkdirSync(resolve(report, '..'), { recursive: true }); writeFileSync(report, JSON.stringify(result, null, 2) + '\n'); }
  console.log(`Checked Journal v2 EP${p.episode}: ${result.shots} semantic shots, ${result.captions} bilingual captions, ${result.frames} frames. ${warnings.join(' ')}`);
  return result;
}

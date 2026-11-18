import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { episodeId } from './project-paths.mjs';
import { probe, sha256 } from './quality.mjs';
import { validateProduction } from '../src/production/validate.mjs';

// Input transcript is explicitly on the program clock, never the raw-source clock.
export function makeProduction({ episode, title, topic = title, prefix, frames, sourceFrames, sourceHash, programHash, captions, words, cuts, audio = false, sourceName = 'source.mp4' }) {
  return validateProduction({
    format: 'english-journal/v2', episode, title, topic, fps: 30, durationInFrames: frames,
    media: { source: `${prefix}/${sourceName}`, sourceSha256: sourceHash, sourceDurationInFrames: sourceFrames,
      program: `${prefix}/program.mp4`, programSha256: programHash, ...(audio ? { audio: `${prefix}/voice.wav` } : {}),
      cuts: cuts ?? [{ sourceIn: 0, sourceOut: frames, from: 0, reason: 'Reviewed without cuts; original recording retained' }], position: '50% 70%', volume: 1 },
    captions, words,
    shots: [{ id: 'opening', from: 0, to: frames, portrait: 'hero', titles: [{ at: 0, text: title }], visual: { kind: 'speaker' },
      intent: 'Draft: identify the central thought of this recording', action: 'Draft: retain the continuous real speaker', outcome: 'Draft: write semantic scenes before final export' }],
    cues: [], review: { transcript: 'draft', direction: 'draft', notes: 'Imported on the program clock. Confirm original wording and translation, then write a semantic shot plan.' },
  });
}

export function importEpisode(options) {
  const episode = Number(options.episode), id = episodeId(episode);
  const edition = options.edition ?? 'journal';
  if (!/^[a-z][a-z0-9-]*$/.test(edition)) throw new Error('Invalid edition name');
  const prefix = `${id}/${edition}`, dir = `public/${prefix}`;
  if (existsSync(dir)) throw new Error(`${dir} already exists; use a new edition name to preserve reviewed material`);
  if (!options.video || !options.transcript || !options.title) throw new Error('Required: --episode N --video program.mp4 --transcript reviewed.json --title "Short English title"');
  const sourcePath = options.source ?? options.video;
  const sourceName = `source${extname(sourcePath).toLowerCase() || '.mp4'}`;
  if (resolve(sourcePath) !== resolve(options.video) && !options.edit) throw new Error('A different raw source requires --edit with a frame-based cuts array');
  const transcript = JSON.parse(readFileSync(options.transcript, 'utf8'));
  const video = probe(options.video), source = probe(sourcePath);
  const stream = video.streams.find(s => s.codec_type === 'video');
  if (stream?.avg_frame_rate !== '30/1' || stream?.r_frame_rate !== '30/1' || !Number.isInteger(Number(stream.nb_frames))) throw new Error('Input program must already be CFR 30fps; preserve the raw source when preparing the program');
  const frames = Number(stream.nb_frames);
  if (!options.audio && !video.streams.some(s => s.codec_type === 'audio')) throw new Error('Program has no voice; provide --audio voice.wav');
  if (options.audio) {
    if (!options.audio.toLowerCase().endsWith('.wav')) throw new Error('--audio must be a WAV file');
    const a = probe(options.audio);
    if (!a.streams.some(s => s.codec_type === 'audio') || Math.abs(Number(a.format.duration) * 30 - frames) > 1) throw new Error('Voice duration differs from program');
  }
  const p = makeProduction({ episode, title: options.title, topic: options.topic, prefix, frames,
    sourceFrames: Math.round(Number(source.format.duration) * 30), sourceHash: sha256(sourcePath), programHash: sha256(options.video),
    captions: transcript.captions, words: transcript.words, cuts: options.edit ? JSON.parse(readFileSync(options.edit, 'utf8')).cuts : undefined, audio: Boolean(options.audio), sourceName });
  mkdirSync(dir, { recursive: true });
  for (const [from, name] of [[sourcePath, sourceName], [options.video, 'program.mp4'], ...(options.audio ? [[options.audio, 'voice.wav']] : [])]) copyFileSync(from, `${dir}/${name}`, constants.COPYFILE_EXCL);
  writeFileSync(`${dir}/motion.json`, JSON.stringify(p, null, 2) + '\n', { flag: 'wx' });
  const work = `output/_work/${id}/${edition}`;
  mkdirSync(work, { recursive: true });
  writeFileSync(`${work}/director-plan.md`, `# ${options.title}\n\nDraft. Read the full transcript before choosing visuals.\n\nApply docs/visual-direction.md proactively: extract the objects, environment, recognizable structural/material details, meaningful actions and outcomes, framing/scale and asset method from the full speech. Implement them before user review; do not ask the user to supply a per-episode visual checklist. Choose accurate assets, code drawings or suitably licensed open-source icons/illustrations as needed. Do not stop at text cards or the existing component catalog. Full-frame environments can hide the portrait while preserving the continuous media clock.\n\nFor each semantic paragraph: intent | real words | subject and environment | recognizable details | start → action → visible result | framing and portrait reason | handoff | assets and sources.\n\nKeep any continuous unillustrated or static scene within four seconds, even across title/shot changes. Longer scenes need meaningful ongoing action, not decorative loops. Prefer recognizable objects and operations over text cards: browser for a computer website/developer panel, group-chat for illustrated phone/group settings, and media treatment book for an actual book cover with physical pages. Label interfaces as illustrations; do not fabricate real chat records.\n\nChoose visuals by the semantic task; see docs/visual-components.md. Use evidence for a real image and its detail, dialogue for genuine exchanges or explicitly labelled thoughts, and timeline for an experience with turning points. These three use a chip portrait. For scene actions, object reorganization, influence/block/feedback, schematic journeys and emotional turns, see docs/narrative-components.md (scene/transformation/relationship/map/emotion). Emotion retains a hero portrait with empty titles; the other new visuals use a chip. Keep schematic scenes/routes explicit and never invent emotional scores. All cue frames use the program clock; evidence needs actual image dimensions and normalized focus regions. Do not copy illustrative examples into a real episode as facts.\n\nList named events, places, settings, people, teams/organizations and works. For each: spoken anchor | what viewers should recognize | use a real image or why not | verified identity/event/date/result or unresolved discrepancy | source and rights status | on/off frames. Reuse suitable assets first, then research accurate sources when needed; never substitute an unrelated event or generated image for documentary evidence. Record selected assets in assets-sources.md in this work directory.\n\nBefore final export, add publication.title (at most 20 Unicode characters) and publication.body (one short Chinese paragraph) to motion.json, grounded in the full recording and its real emotion. Generate output/epXX/post.md with npm run post; see docs/publishing.md.\n\nDetail and realism are required production quality: make object structure, interface operations, proportions/perspective/occlusion, material/lighting and motion outcomes credible and readable at phone size. For each key scene record the actual reviewed range/size, observed problems, fixes and recheck result. Fix rough, implausible or missing detail before delivery. Component count and passing technical checks are not proof of craftsmanship; perform this review yourself without making it another user approval step.\n\nDo not mark direction ready until this plan is implemented and representative transitions are reviewed.\n`, { flag: 'wx' });
  if (options.select) {
    if (existsSync('episode.config.json')) copyFileSync('episode.config.json', `${work}/previous-episode.config.json`, constants.COPYFILE_EXCL);
    writeFileSync('episode.config.json', JSON.stringify({ episode, motionSrc: `${prefix}/motion.json` }, null, 2) + '\n');
  }
  console.log(`Imported ${prefix}/motion.json as a draft. Edit its semantic shots, verify bilingual captions, then preview with npm run dev.`);
  return p;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: Object.fromEntries(['episode', 'edition', 'video', 'source', 'edit', 'audio', 'transcript', 'title', 'topic'].map(key => [key, { type: 'string' }]).concat([['select', { type: 'boolean', default: false }]])) });
  importEpisode(values);
}

// This contract runs in Studio metadata and in the export preflight.
const fail = (condition, message) => { if (!condition) throw new Error(message); };
export const safeAsset = (path) => typeof path === 'string' && /^[a-zA-Z0-9_./-]+$/.test(path) && !path.startsWith('/') && !path.split('/').some(p => p === '..' || !p);
const canonical = text => text.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
const english = (text, label, max = 100) => {
  fail(typeof text === 'string' && text.trim() && text.length <= max, `${label}: empty or too long`);
  fail(!/\p{Script=Han}/u.test(text), `${label}: on-screen graphics must be English`);
};
export function validateBrand(brand) {
  fail(typeof brand.name === 'string' && brand.name.trim() && brand.name.length <= 24, 'Account name missing or too long');
  fail(Number.isInteger(brand.outroFrames) && brand.outroFrames >= 90 && brand.outroFrames <= 180, 'Series outro must last 3–6 seconds at 30fps');
  fail(Array.isArray(brand.outroSfx) && brand.outroSfx.length === 3, 'Outro needs like, save and follow sounds');
  for (const sound of brand.outroSfx) fail(safeAsset(sound.src) && Number.isFinite(sound.volume) && sound.volume > 0 && sound.volume <= .35, 'Invalid outro sound asset or volume');
  for (const key of ['series', 'slogan']) english(brand[key], `Brand ${key}`, 60);
  fail(typeof brand.mark === 'string' && brand.mark.trim() && brand.mark.length <= 6, 'Brand mark missing or too long');
  fail(typeof brand.font === 'string' && brand.font.trim(), 'Brand font missing');
  for (const key of ['background', 'ink', 'muted', 'accent', 'line', 'paper']) fail(/^#[\da-f]{6}$/i.test(brand.palette?.[key]), `Invalid brand color: ${key}`);
}
export const compositionFrames = (production, brand) => production.durationInFrames + (production.outro === false ? 0 : brand.outroFrames);
export function validatePublication(post) {
  fail(typeof post?.title === 'string' && post.title.trim() && !/[\r\n]/.test(post.title) && Array.from(post.title.trim()).length <= 20, 'Post title must be a single line of at most 20 characters');
  fail(typeof post.body === 'string' && post.body.trim() && !/[\r\n]/.test(post.body.trim()) && Array.from(post.body.trim()).length <= 300, 'Post body must be one short paragraph of at most 300 characters');
}
export function validateProduction(p, { final = false, cover = false } = {}) {
  fail(p?.format === 'english-journal/v2', 'Unknown production format');
  fail(Number.isInteger(p.episode) && p.episode > 0 && p.episode < 10000, 'Invalid episode');
  fail(p.fps === 30 && Number.isInteger(p.durationInFrames) && p.durationInFrames > 0, 'Invalid frame clock');
  fail(p.outro === undefined || typeof p.outro === 'boolean', 'Invalid outro setting');
  english(p.title, 'Episode title', 70); english(p.topic, 'Topic', 70);
  const asset = (src) => fail(safeAsset(src), `Unsafe asset path: ${src}`);
  const frame = f => Number.isInteger(f) && f >= 0 && f <= p.durationInFrames;
  for (const src of [p.media?.source, p.media?.program, ...(p.media?.audio ? [p.media.audio] : [])]) asset(src);
  for (const key of ['sourceSha256', 'programSha256']) fail(/^[a-f0-9]{64}$/.test(p.media[key]), `Missing media identity: ${key}`);
  fail(Number.isInteger(p.media.sourceDurationInFrames) && p.media.sourceDurationInFrames > 0, 'Invalid source duration');
  if (p.media.volume !== undefined) fail(Number.isFinite(p.media.volume) && p.media.volume >= 0 && p.media.volume <= 4, 'Voice volume must be a finite fixed gain from 0 to 4');
  fail(/^\d+(\.\d+)?% \d+(\.\d+)?%$/.test(p.media.position), 'Invalid portrait focal position');
  let end = 0, sourceEnd = 0;
  fail(p.media.cuts?.length > 0, 'Missing source-to-output edit map');
  for (const c of p.media.cuts) {
    fail([c.sourceIn, c.sourceOut, c.from].every(Number.isInteger) && c.from === end && c.sourceIn >= sourceEnd && c.sourceOut > c.sourceIn && c.sourceOut <= p.media.sourceDurationInFrames, 'Invalid or noncontiguous edit map');
    fail(typeof c.reason === 'string' && c.reason.trim(), 'Missing edit decision reason');
    end += c.sourceOut - c.sourceIn; sourceEnd = c.sourceOut;
  }
  fail(end === p.durationInFrames, 'Edit map does not match program length');
  fail(Array.isArray(p.captions) && p.captions.length > 0, 'Missing bilingual captions');
  end = 0;
  for (const c of p.captions) {
    fail(frame(c.from) && frame(c.to) && c.to > c.from && c.from >= end, 'Invalid or overlapping captions');
    english(c.english, 'English caption', 74);
    fail(typeof c.chinese === 'string' && c.chinese.trim() && c.chinese.length <= 42, 'Chinese caption missing or too long');
    end = c.to; // Real pauses may stay empty; captions never bridge them automatically.
  }
  fail(Array.isArray(p.words) && p.words.length > 0, 'Missing spoken-word timeline');
  let previous = 0;
  for (const w of p.words) {
    fail(frame(w.from) && frame(w.to) && w.to >= w.from && w.from >= previous && typeof w.text === 'string' && w.text.trim(), 'Invalid word timeline');
    previous = w.from;
  }
  fail(canonical(p.captions.map(c => c.english).join(' ')) === canonical(p.words.map(w => w.text).join(' ')), 'Captions differ from the reviewed spoken words');
  fail(Array.isArray(p.shots) && p.shots.length > 0, 'Missing semantic shot plan');
  end = 0;
  const ids = new Set();
  for (const s of p.shots) {
    fail(/^[a-z][a-z0-9-]*$/.test(s.id) && !ids.has(s.id), 'Invalid or duplicate shot ID'); ids.add(s.id);
    fail(frame(s.from) && frame(s.to) && s.from === end && s.to > s.from, `Shot gap/overlap: ${s.id}`); end = s.to;
    for (const key of ['intent', 'action', 'outcome']) fail(typeof s[key] === 'string' && s[key].trim(), `Missing ${s.id} ${key}`);
    fail(['hero', 'side', 'chip'].includes(s.portrait), `Unknown portrait: ${s.id}`);
    const at = n => fail(frame(n) && n >= s.from && n < s.to, `Cue outside shot: ${s.id}`);
    fail(Array.isArray(s.titles), `Missing title beats: ${s.id}`);
    for (const t of s.titles) { at(t.at); english(t.text, 'Shot title', 48); if (t.until !== undefined) fail(frame(t.until) && t.until > t.at && t.until <= s.to, 'Invalid title hold'); }
    const v = s.visual;
    fail(v && ['speaker', 'media', 'contrast', 'sequence', 'flow', 'comparison', 'closing'].includes(v.kind), `Unknown visual: ${s.id}`);
    if (v.kind === 'media') {
      fail(['stack', 'push'].includes(v.treatment) && v.images?.length > 0 && v.images.length <= 3, 'Invalid media treatment');
      for (const image of v.images) { asset(image.src); at(image.at); if (image.label) english(image.label, 'Media label', 32); }
    }
    if (v.kind === 'contrast') { fail(v.items?.length >= 2 && v.items.length <= 4, 'Contrast needs 2–4 beats'); for (const item of v.items) { at(item.at); english(item.text, 'Contrast text', 32); } }
    if (v.kind === 'sequence') {
      english(v.label, 'Sequence label', 28); english(v.result, 'Sequence result', 32); at(v.resultAt);
      fail(v.steps?.length >= 2 && v.steps.length <= 4, 'Sequence needs 2–4 steps');
      let previousAt = s.from;
      for (const step of v.steps) {
        at(step.at); english(step.text, 'Sequence step', 18);
        fail(step.at >= previousAt && step.at <= v.resultAt, 'Sequence steps must be ordered before the result');
        previousAt = step.at;
      }
    }
    if (v.kind === 'flow') {
      fail(v.nodes?.length >= 2 && v.nodes.length <= 3, 'Flow needs 2–3 inputs');
      for (const node of v.nodes) { at(node.at); english(node.text, 'Flow node', 18); }
      at(v.resultAt); english(v.result, 'Flow result', 18); english(v.note, 'Flow note', 44);
    }
    if (v.kind === 'comparison') {
      asset(v.image); english(v.left, 'Comparison label', 18); english(v.right, 'Comparison label', 18);
      fail(v.items?.length > 0 && v.items.length <= 4, 'Comparison needs 1–4 items');
      for (const item of v.items) { at(item.at); english(item.text, 'Comparison item', 24); fail(['left', 'right'].includes(item.side), 'Unknown comparison side'); }
    }
    if (v.kind === 'closing') { at(v.at); english(v.prompt, 'Closing prompt', 40); }
  }
  fail(end === p.durationInFrames, 'Shot plan must cover the full program');
  fail(Array.isArray(p.cues), 'Missing audio cue list');
  for (const c of p.cues) { asset(c.src); fail(frame(c.at) && Number.isInteger(c.duration) && c.duration > 0 && c.at + c.duration <= p.durationInFrames && Number.isFinite(c.volume) && c.volume >= 0 && c.volume <= .35, 'Invalid sound cue'); }
  fail(['draft', 'confirmed'].includes(p.review?.transcript) && ['draft', 'ready'].includes(p.review?.direction), 'Missing review status');
  if (p.publication !== undefined) validatePublication(p.publication);
  if (p.cover) {
    fail(frame(p.cover.frame) && p.cover.frame < p.durationInFrames, 'Cover frame must reference the actual speaking program');
    fail(Array.isArray(p.cover.title) && p.cover.title.length >= 1 && p.cover.title.length <= 3, 'Cover headline needs one to three short lines');
    for (const line of p.cover.title) fail(typeof line === 'string' && line.trim() && Array.from(line).length <= 8, 'Cover headline: use at most eight characters per line');
    fail(/\p{Script=Han}/u.test(p.cover.title.join('')), 'Cover headline must include the Chinese episode topic');
    if (p.cover.subtitle !== undefined) english(p.cover.subtitle, 'Cover subtitle', 48);
    if (p.cover.portrait !== undefined) { asset(p.cover.portrait); fail(p.cover.portrait.toLowerCase().endsWith('.png'), 'Cover portrait must be a transparent PNG cutout'); }
    fail(['draft', 'approved'].includes(p.cover.status), 'Missing cover approval status');
  }
  if (cover && final) {
    fail(p.cover?.status === 'approved', 'Choose the real portrait frame and headline in Studio, then approve the cover before final cover export');
    fail(Boolean(p.cover.portrait), 'Final cover requires a prepared transparent portrait cutout');
  }
  if (final) fail(p.review.transcript === 'confirmed', 'Final export requires confirmed transcript; drafts remain available in Studio');
  if (final && !cover) fail(p.review.direction === 'ready', 'Final video export requires a ready director plan; drafts remain available in Studio');
  if (final && !cover) validatePublication(p.publication);
  return p;
}
export function productionAssets(p) {
  const sources = [p.media.source, p.media.program, ...(p.media.audio ? [p.media.audio] : []), ...p.cues.map(c => c.src)];
  if (p.cover?.portrait) sources.push(p.cover.portrait);
  for (const { visual: v } of p.shots) {
    if (v.kind === 'media') sources.push(...v.images.map(i => i.src));
    if (v.kind === 'comparison') sources.push(v.image);
  }
  return [...new Set(sources)];
}

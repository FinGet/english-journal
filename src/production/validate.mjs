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
// Adjacent portrait-only shots remain one hold even if their titles or IDs change.
export function unillustratedHolds(shots, maxFrames = 120) {
  const holds = [];
  let current;
  for (const shot of shots) {
    if (['speaker', 'contrast', 'emotion', 'closing'].includes(shot.visual.kind)) {
      if (current?.to === shot.from) { current.to = shot.to; current.shots.push(shot.id); }
      else { current = { from: shot.from, to: shot.to, shots: [shot.id] }; holds.push(current); }
    } else current = undefined;
  }
  return holds.filter(hold => hold.to - hold.from > maxFrames);
}
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
    fail(v && ['speaker', 'media', 'browser', 'group-chat', 'contrast', 'sequence', 'flow', 'comparison', 'evidence', 'dialogue', 'timeline', 'scene', 'transformation', 'relationship', 'map', 'spaceflight', 'emotion', 'closing'].includes(v.kind), `Unknown visual: ${s.id}`);
    if (v.kind === 'spaceflight') {
      english(v.label, 'Illustrated flight label', 40);
      fail(s.portrait === 'chip', 'Spaceflight needs a chip portrait for continuous media beneath its immersive scene');
      for (const cue of [v.revealAt, v.launchAt, v.cruiseAt]) at(cue);
      fail(s.from < v.revealAt && v.revealAt < v.launchAt && v.launchAt < v.cruiseAt, 'Spaceflight must establish its world, reveal the rocket, launch, then cruise in order');
    }
    if (v.kind === 'media') {
      fail(['stack', 'push', 'book'].includes(v.treatment) && v.images?.length > 0 && v.images.length <= 3, 'Invalid media treatment');
      if (v.treatment === 'book') fail(v.images.length === 1, 'A book treatment needs one actual cover image');
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
    if (['evidence', 'dialogue', 'timeline'].includes(v.kind)) {
      fail(s.portrait === 'chip', `${v.kind} needs a chip portrait to keep its content visible`);
      const beats = v.kind === 'evidence' ? v.focuses : v.kind === 'dialogue' ? v.messages : v.events;
      const min = v.kind === 'evidence' ? 1 : 2;
      const max = v.kind === 'evidence' ? 3 : v.kind === 'dialogue' ? 6 : 5;
      fail(Array.isArray(beats) && beats.length >= min && beats.length <= max, `${v.kind} needs ${min}–${max} beats`);
      let previousAt = s.from - 1;
      for (const beat of beats) {
        at(beat?.at);
        fail(beat.at > previousAt, `${v.kind} beats must be strictly ordered`);
        previousAt = beat.at;
      }
    }
    if (v.kind === 'evidence') {
      asset(v.image); english(v.sourceLabel, 'Evidence source label', 32);
      fail([v.imageSize?.width, v.imageSize?.height].every(n => Number.isInteger(n) && n > 0 && n <= 100000), 'Evidence needs the actual image pixel dimensions');
      for (const focus of v.focuses) {
        english(focus.label, 'Evidence focus label', 36);
        const r = focus.region;
        fail(r && [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width >= .05 && r.height >= .05 && r.x + r.width <= 1 + 1e-9 && r.y + r.height <= 1 + 1e-9, 'Evidence region must fit within the full image (0–1, minimum size 0.05)');
      }
    }
    if (v.kind === 'dialogue') {
      english(v.left, 'Dialogue speaker', 24); english(v.right, 'Dialogue speaker', 24);
      for (const message of v.messages) {
        fail(['left', 'right'].includes(message.side), 'Unknown dialogue side');
        english(message.text, 'Dialogue message', 56);
      }
    }
    if (v.kind === 'timeline') {
      english(v.label, 'Timeline label', 28);
      for (const event of v.events) {
        english(event.when, 'Timeline time label', 18); english(event.text, 'Timeline event', 48);
        if (event.image !== undefined) asset(event.image);
      }
    }
    const count = (items, min, max, label) => fail(Array.isArray(items) && items.length >= min && items.length <= max, `${label} needs ${min}–${max} items`);
    const ordered = (beats, min, max) => {
      count(beats, min, max, v.kind);
      let previousAt = s.from - 1;
      for (const beat of beats) {
        at(beat?.at); fail(beat.at > previousAt, `${v.kind} beats must be strictly ordered`); previousAt = beat.at;
      }
    };
    const named = (items, min, max) => {
      count(items, min, max, v.kind);
      const entities = new Map();
      for (const item of items) {
        fail(typeof item?.id === 'string' && /^[a-z][a-z0-9-]*$/.test(item.id) && !entities.has(item.id), `Invalid or duplicate ${v.kind} entity ID`);
        entities.set(item.id, item);
      }
      return entities;
    };
    const point = item => fail([item?.x, item?.y].every(n => Number.isFinite(n) && n >= .15 && n <= .85), `${v.kind} coordinates must be within 0.15–0.85`);
    if (['browser', 'group-chat'].includes(v.kind)) {
      fail(s.portrait === 'chip', `${v.kind} needs a chip portrait to keep the interface visible`);
      ordered(v.beats, 1, 8);
      fail(v.beats[0].at === s.from, 'An illustrated interface needs its first state at the shot start');
    }
    if (v.kind === 'browser') {
      english(v.siteTitle, 'Browser title', 32); english(v.url, 'Displayed browser address', 64);
      for (const beat of v.beats) fail(['load', 'style', 'assist', 'inspect', 'responsive', 'empty'].includes(beat.action), 'Unknown browser action');
    }
    if (v.kind === 'group-chat') {
      english(v.oldName, 'Original group name', 40); english(v.newName, 'New group name', 48);
      if (v.since !== undefined) fail(typeof v.since === 'string' && /^\d{4}$/.test(v.since), 'Group origin needs a four-digit year');
      count(v.topics, 0, 4, 'Illustrated conversation topics');
      for (const topic of v.topics) { at(topic.at); english(topic.text, 'Illustrated topic', 28); }
      for (const beat of v.beats) fail(['chat', 'info', 'rename', 'saved', 'topics'].includes(beat.action), 'Unknown group interface action');
    }
    const endpoints = (edge, entities) => {
      const from = entities.get(edge?.from), to = entities.get(edge?.to);
      fail(from && to && from.id !== to.id, `${v.kind} connection needs two different known entities`);
      at(edge.at); fail(edge.at >= from.at && edge.at >= to.at, `${v.kind} connection precedes its entities`);
      fail(from.x !== to.x || from.y !== to.y, `${v.kind} connected entities must have different positions`);
      return [from, to];
    };
    if (['scene', 'transformation', 'relationship', 'map'].includes(v.kind)) fail(s.portrait === 'chip', `${v.kind} needs a chip portrait to keep its content visible`);
    if (v.kind === 'scene') {
      english(v.setting, 'Scene setting', 28);
      const actors = named(v.actors, 2, 5);
      for (const actor of v.actors) {
        at(actor.at); point(actor); english(actor.label, 'Scene actor', 18);
        fail(['person', 'desk', 'phone', 'door', 'object'].includes(actor.shape), 'Unknown scene shape');
      }
      ordered(v.beats, 1, 5);
      for (const beat of v.beats) {
        const actor = actors.get(beat.actor);
        fail(actor && beat.at >= actor.at, 'Scene action needs an actor already on stage');
        point(beat); english(beat.text, 'Scene action', 40);
      }
    }
    if (v.kind === 'transformation') {
      english(v.subject, 'Transformation subject', 28); named(v.items, 3, 6);
      for (const item of v.items) english(item.text, 'Transformation item', 16);
      ordered(v.states, 2, 4);
      for (const state of v.states) {
        english(state.label, 'Transformation state', 28);
        fail(['scattered', 'grouped', 'aligned'].includes(state.layout), 'Unknown transformation layout');
      }
    }
    if (v.kind === 'relationship') {
      english(v.label, 'Relationship label', 28);
      const nodes = named(v.nodes, 2, 6);
      for (const node of v.nodes) { at(node.at); point(node); english(node.text, 'Relationship node', 18); }
      count(v.edges, 1, 8, 'Relationship edges');
      for (const edge of v.edges) {
        const [from, to] = endpoints(edge, nodes);
        fail(Math.hypot((to.x - from.x) * 880, (to.y - from.y) * 600) > 210, 'Relationship nodes need more space for a readable connection');
        fail(['influence', 'block', 'feedback'].includes(edge.type), 'Unknown relationship connection type');
        if (edge.label !== undefined) english(edge.label, 'Relationship edge label', 16);
      }
    }
    if (v.kind === 'map') {
      english(v.label, 'Map label', 28);
      fail(v.terrain === undefined || ['street', 'space'].includes(v.terrain), 'Unknown map terrain');
      const places = named(v.places, 2, 6);
      for (const place of v.places) { at(place.at); point(place); english(place.label, 'Map place', 18); }
      ordered(v.legs, 1, 5);
      let previousLeg;
      for (const leg of v.legs) {
        endpoints(leg, places); at(leg.arriveAt);
        fail(leg.arriveAt > leg.at, 'Map arrival must follow departure');
        fail(!previousLeg || (leg.at >= previousLeg.arriveAt && leg.from === previousLeg.to), 'Map legs must form one continuous route without time overlaps');
        previousLeg = leg;
      }
    }
    if (v.kind === 'emotion') {
      fail(s.portrait === 'hero' && s.titles.length === 0, 'Emotion needs a hero portrait and empty titles; its own label supplies the heading');
      ordered(v.beats, 2, 5);
      for (const beat of v.beats) {
        fail(['tense', 'frustrated', 'hopeful', 'calm', 'confident'].includes(beat.mood), 'Unknown emotion mood');
        english(beat.label, 'Emotion label', 28); count(beat.words, 0, 3, 'Emotion keywords');
        for (const word of beat.words) english(word, 'Emotion keyword', 12);
      }
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
    if (p.cover.portraitBottom !== undefined) fail(Number.isInteger(p.cover.portraitBottom) && p.cover.portraitBottom >= -360 && p.cover.portraitBottom <= 0, 'Cover portrait bottom must be an integer from -360 to 0');
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
    if (v.kind === 'comparison' || v.kind === 'evidence') sources.push(v.image);
    if (v.kind === 'timeline') sources.push(...v.events.filter(event => event.image !== undefined).map(event => event.image));
  }
  return [...new Set(sources)];
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { makeProduction } from './new-episode.mjs';
import { productionAssets, unillustratedHolds, validateProduction } from '../src/production/validate.mjs';

const fixtures = {
  browser: { kind: 'browser', siteTitle: 'Frontend workspace', url: 'localhost:3000', beats: [{ at: 60, action: 'load' }, { at: 120, action: 'style' }, { at: 180, action: 'assist' }] },
  'group-chat': { kind: 'group-chat', oldName: 'Frontend Evolution', newName: 'Natural Selection, Ahead Four', since: '2019', topics: [{ at: 70, text: 'Web development' }], beats: [{ at: 60, action: 'chat' }, { at: 100, action: 'info' }, { at: 160, action: 'rename' }, { at: 260, action: 'saved' }] },
  scene: { kind: 'scene', setting: 'After the meeting', actors: [
    { id: 'me', label: 'Me', shape: 'person', at: 60, x: .2, y: .5 },
    { id: 'desk', label: 'The table', shape: 'desk', at: 60, x: .8, y: .5 },
  ], beats: [{ at: 100, actor: 'me', x: .6, y: .5, text: 'I walked over.' }] },
  transformation: { kind: 'transformation', subject: 'A plan', items: [
    { id: 'a', text: 'Ideas' }, { id: 'b', text: 'Priorities' }, { id: 'c', text: 'Next steps' },
  ], states: [{ at: 60, label: 'Loose ends', layout: 'scattered' }, { at: 120, label: 'Connections', layout: 'grouped' }, { at: 180, label: 'A clear plan', layout: 'aligned' }] },
  relationship: { kind: 'relationship', label: 'A feedback loop', nodes: [
    { id: 'delay', text: 'Delay', at: 60, x: .2, y: .3 },
    { id: 'pressure', text: 'Pressure', at: 60, x: .8, y: .3 },
    { id: 'avoid', text: 'Avoidance', at: 60, x: .5, y: .8 },
  ], edges: [{ from: 'delay', to: 'pressure', at: 100, type: 'influence' }, { from: 'pressure', to: 'avoid', at: 140, type: 'block' }, { from: 'avoid', to: 'delay', at: 180, type: 'feedback' }] },
  map: { kind: 'map', label: 'My commute', places: [
    { id: 'home', label: 'Home', at: 60, x: .2, y: .7 },
    { id: 'station', label: 'Station', at: 60, x: .5, y: .4 },
    { id: 'office', label: 'Office', at: 60, x: .8, y: .2 },
  ], legs: [{ from: 'home', to: 'station', at: 100, arriveAt: 160 }, { from: 'station', to: 'office', at: 180, arriveAt: 240 }] },
  emotion: { kind: 'emotion', beats: [
    { at: 60, mood: 'tense', label: 'I nearly stayed silent.', words: ['What if?'] },
    { at: 120, mood: 'confident', label: 'I said what I meant.', words: ['Speak up'] },
    { at: 180, mood: 'calm', label: 'Enough for today.', words: [] },
  ] },
};

const production = kind => {
  const p = makeProduction({ episode: 88, title: 'A new day', prefix: 'ep88/journal', frames: 300, sourceFrames: 300,
    sourceHash: 'a'.repeat(64), programHash: 'b'.repeat(64),
    captions: [{ from: 0, to: 30, english: 'Hello.', chinese: '你好' }], words: [{ from: 0, to: 30, text: 'Hello.' }] });
  p.shots = [{ ...p.shots[0], to: 60 }, { ...p.shots[0], id: 'story', from: 60, titles: [], portrait: kind === 'emotion' ? 'hero' : 'chip', visual: structuredClone(fixtures[kind]) }];
  return p;
};

test('new narrative visuals preserve the production clock and require compatible portrait layouts', () => {
  for (const kind of Object.keys(fixtures)) {
    const p = production(kind);
    assert.doesNotThrow(() => validateProduction(p));
    p.shots[1].portrait = 'side';
    assert.throws(() => validateProduction(p), /portrait/);
    const draft = production(kind), v = draft.shots[1].visual;
    const beat = (v.beats ?? v.states ?? v.edges ?? v.legs)[0];
    beat.at = 20;
    assert.throws(() => validateProduction(draft), /outside shot/);
  }
});

const rejects = (kind, mutations) => {
  for (const mutate of mutations) {
    const p = production(kind); mutate(p.shots[1].visual);
    assert.throws(() => validateProduction(p), kind);
  }
};

test('scene actions need real actor references, finite coordinates and valid appearance times', () => {
  rejects('scene', [
    v => { v.actors[1].id = 'me'; }, v => { v.actors[0].shape = 'unknown'; },
    v => { v.beats[0].actor = 'missing'; }, v => { v.actors[0].at = 110; },
    v => { v.beats[0].x = Number.NaN; }, v => { v.actors[0].y = .9; },
    v => { v.beats.push({ ...v.beats[0] }); }, v => { v.beats[0].text = '中文动作'; },
  ]);
});

test('illustrated interfaces keep actions and topics on the source clock and reject unsupported states', () => {
  rejects('browser', [
    v => { v.beats[0].at = 61; }, v => { v.beats[1].action = 'visit-external-site'; },
    v => { v.beats[2].at = 300; }, v => { v.url = '中文网址'; },
  ]);
  rejects('group-chat', [
    v => { v.beats[0].at = 61; }, v => { v.topics[0].at = 40; },
    v => { v.beats[1].action = 'send-real-message'; }, v => { v.since = 'last year'; },
    v => { v.newName = ''; }, v => { v.topics[0].text = 'x'.repeat(29); },
  ]);
});

test('title changes and decorative emotion frames do not reset a continuous portrait hold', () => {
  const shots = [
    { id: 'a', from: 0, to: 90, visual: { kind: 'speaker' } },
    { id: 'b', from: 90, to: 150, visual: { kind: 'emotion' } },
    { id: 'c', from: 150, to: 330, visual: { kind: 'browser' } },
    { id: 'd', from: 330, to: 450, visual: { kind: 'closing' } },
  ];
  assert.deepEqual(unillustratedHolds(shots, 120), [{ from: 0, to: 150, shots: ['a', 'b'] }]);
  assert.deepEqual(unillustratedHolds(shots, 150), []);
});

test('physical books retain one actual local cover instead of stacking unrelated pictures', () => {
  const p = production('browser');
  p.shots[1].visual = { kind: 'media', treatment: 'book', images: [{ at: 60, src: 'ep88/journal/book.jpg', label: 'The book' }] };
  assert.doesNotThrow(() => validateProduction(p));
  assert(productionAssets(p).includes('ep88/journal/book.jpg'));
  p.shots[1].visual.images.push({ at: 100, src: 'ep88/journal/other.jpg' });
  assert.throws(() => validateProduction(p), /one actual cover/);
});

test('transformation keeps a bounded set of uniquely identified objects and ordered states', () => {
  rejects('transformation', [
    v => { v.items[1].id = 'a'; }, v => { v.items = v.items.slice(0, 2); },
    v => { v.items[0].text = 'x'.repeat(17); }, v => { v.states[1].at = v.states[0].at; },
    v => { v.states[0].layout = 'random'; }, v => { v.states = [v.states[0]]; },
  ]);
});

test('relationship rejects dangling, premature, unreadable and unknown connections', () => {
  rejects('relationship', [
    v => { v.edges[0].from = 'missing'; }, v => { v.edges[0].to = 'delay'; },
    v => { v.nodes[0].at = 110; }, v => { v.edges[0].type = 'causation-score'; },
    v => { v.nodes[1].x = .21; }, v => { v.edges[0].label = 'x'.repeat(17); },
  ]);
});

test('map legs form a timed continuous journey and cannot arrive outside the shot', () => {
  const p = production('map');
  p.shots[1].visual.terrain = 'space';
  assert.doesNotThrow(() => validateProduction(p));
  p.shots[1].visual.terrain = 'street';
  assert.doesNotThrow(() => validateProduction(p));
  rejects('map', [
    v => { v.terrain = 'real-star-chart'; },
    v => { v.legs[0].arriveAt = 100; }, v => { v.legs[0].arriveAt = 300; },
    v => { v.legs[1].at = 150; }, v => { v.legs[1].from = 'home'; },
    v => { v.places[1].at = 120; }, v => { v.legs[0].to = 'missing'; },
    v => { v.places[1].x = .2; v.places[1].y = .7; },
  ]);
});

test('immersive spaceflight keeps reveal, departure and cruise on ordered program anchors', () => {
  const make = () => {
    const p = production('browser');
    p.shots[1].visual = { kind: 'spaceflight', label: 'An illustrated departure', revealAt: 90, launchAt: 160, cruiseAt: 230 };
    return p;
  };
  const p = make();
  assert.doesNotThrow(() => validateProduction(p));
  assert.deepEqual(productionAssets(p), productionAssets(production('browser')));
  for (const [field, value] of [['revealAt', 20], ['launchAt', 90], ['cruiseAt', 300], ['launchAt', Number.NaN]]) {
    const invalid = make(); invalid.shots[1].visual[field] = value;
    assert.throws(() => validateProduction(invalid), /outside shot|in order/);
  }
  p.shots[1].portrait = 'hero';
  assert.throws(() => validateProduction(p), /portrait/);
});

test('emotion uses a hero, its own heading and bounded words without numerical scores', () => {
  rejects('emotion', [
    v => { v.beats[0].mood = 'score-90'; }, v => { v.beats[0].words = ['a', 'b', 'c', 'd']; },
    v => { v.beats[0].words = ['x'.repeat(13)]; }, v => { v.beats[1].at = 60; },
    v => { v.beats[0].label = 'x'.repeat(29); },
  ]);
  const p = production('emotion');
  p.shots[1].titles = [{ at: 60, text: 'A second heading' }];
  assert.throws(() => validateProduction(p), /empty titles/);
});

export type Caption = { from: number; to: number; english: string; chinese: string };
export type Stamp = { from: number; to: number; text: string };
export type TitleBeat = { at: number; until?: number; text: string };
export type ShotTransition =
  | { style: 'cut' | 'fade' | 'depth' | 'focus' | 'push' | 'hyperspace' | 'glitch' | 'particle' }
  | { style: 'slide'; from: 'left' | 'right' | 'top' | 'bottom' }
  | { style: 'whip'; direction: 'left' | 'right' | 'up' | 'down' };
export type Visual =
  | { kind: 'speaker' }
  | { kind: 'media'; images: { src: string; at: number; label?: string }[]; treatment: 'stack' | 'push' }
  | { kind: 'browser'; siteTitle: string; url: string; beats: { at: number; action: 'load' | 'style' | 'assist' | 'inspect' | 'responsive' | 'empty' }[] }
  | { kind: 'group-chat'; oldName: string; newName: string; since?: string; topics: { text: string; at: number }[]; beats: { at: number; action: 'chat' | 'info' | 'rename' | 'saved' | 'topics' }[] }
  | { kind: 'contrast'; items: { text: string; at: number; emphasis?: boolean }[] }
  | { kind: 'sequence'; label: string; steps: { text: string; at: number }[]; result: string; resultAt: number }
  | { kind: 'flow'; nodes: { text: string; at: number }[]; result: string; resultAt: number; note: string }
  | { kind: 'comparison'; image: string; left: string; right: string; items: { side: 'left' | 'right'; text: string; at: number }[] }
  | { kind: 'evidence'; image: string; imageSize: { width: number; height: number }; sourceLabel: string; focuses: { at: number; label: string; region: { x: number; y: number; width: number; height: number } }[] }
  | { kind: 'dialogue'; left: string; right: string; messages: { side: 'left' | 'right'; text: string; at: number }[] }
  | { kind: 'timeline'; label: string; events: { at: number; when: string; text: string; image?: string }[] }
  | { kind: 'scene'; setting: string; actors: { id: string; label: string; shape: 'person' | 'desk' | 'phone' | 'door' | 'object'; at: number; x: number; y: number }[]; beats: { at: number; actor: string; x: number; y: number; text: string }[] }
  | { kind: 'transformation'; subject: string; items: { id: string; text: string }[]; states: { at: number; label: string; layout: 'scattered' | 'grouped' | 'aligned' }[] }
  | { kind: 'relationship'; label: string; nodes: { id: string; text: string; at: number; x: number; y: number }[]; edges: { from: string; to: string; at: number; type: 'influence' | 'block' | 'feedback'; label?: string }[] }
  | { kind: 'map'; label: string; terrain?: 'street' | 'space'; places: { id: string; label: string; at: number; x: number; y: number }[]; legs: { from: string; to: string; at: number; arriveAt: number }[] }
  | { kind: 'emotion'; beats: { at: number; mood: 'tense' | 'frustrated' | 'hopeful' | 'calm' | 'confident'; label: string; words: string[] }[] }
  | { kind: 'closing'; prompt: string; at: number };
export type Shot = {
  id: string; from: number; to: number;
  transition?: ShotTransition;
  intent: string; action: string; outcome: string;
  portrait: 'hero' | 'side' | 'chip';
  titles: TitleBeat[]; visual: Visual;
};
export type Production = {
  format: 'english-journal/v2'; episode: number; title: string; topic: string;
  fps: 30; durationInFrames: number;
  outro?: boolean;
  media: {
    source: string; sourceSha256: string; sourceDurationInFrames: number;
    program: string; programSha256: string; audio?: string; volume?: number;
    cuts: { sourceIn: number; sourceOut: number; from: number; reason: string }[];
    position: string;
  };
  captions: Caption[]; words: Stamp[]; shots: Shot[];
  cues: { at: number; duration: number; src: string; volume: number }[];
  review: { transcript: 'draft' | 'confirmed'; direction: 'draft' | 'ready'; notes: string };
  publication?: { title: string; body: string };
  cover?: { frame: number; title: string[]; subtitle?: string; portrait?: string; portraitBottom?: number; status: 'draft' | 'approved'; note?: string };
};
export type Brand = {
  series: string; name: string; slogan: string; mark: string; outroFrames: number;
  outroSfx: { src: string; volume: number }[];
  palette: { background: string; ink: string; muted: string; accent: string; line: string; paper: string };
  font: string;
};
export type ProductionProps = { motionSrc: string; production?: Production; debugOverlay?: boolean };

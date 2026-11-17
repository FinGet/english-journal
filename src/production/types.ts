export type Caption = { from: number; to: number; english: string; chinese: string };
export type Stamp = { from: number; to: number; text: string };
export type TitleBeat = { at: number; until?: number; text: string };
export type Visual =
  | { kind: 'speaker' }
  | { kind: 'media'; images: { src: string; at: number; label?: string }[]; treatment: 'stack' | 'push' }
  | { kind: 'contrast'; items: { text: string; at: number; emphasis?: boolean }[] }
  | { kind: 'flow'; nodes: { text: string; at: number }[]; result: string; resultAt: number; note: string }
  | { kind: 'comparison'; image: string; left: string; right: string; items: { side: 'left' | 'right'; text: string; at: number }[] }
  | { kind: 'closing'; prompt: string; at: number };
export type Shot = {
  id: string; from: number; to: number;
  intent: string; action: string; outcome: string;
  portrait: 'hero' | 'side' | 'chip';
  titles: TitleBeat[]; visual: Visual;
};
export type Production = {
  format: 'english-journal/v2'; episode: number; title: string; topic: string;
  fps: 30; durationInFrames: number;
  media: {
    source: string; sourceSha256: string; sourceDurationInFrames: number;
    program: string; programSha256: string; audio?: string; volume?: number;
    cuts: { sourceIn: number; sourceOut: number; from: number; reason: string }[];
    position: string;
  };
  captions: Caption[]; words: Stamp[]; shots: Shot[];
  cues: { at: number; duration: number; src: string; volume: number }[];
  review: { transcript: 'draft' | 'confirmed'; direction: 'draft' | 'ready'; notes: string };
  cover?: { frame: number; title: string[]; status: 'draft' | 'approved'; note?: string };
};
export type Brand = {
  series: string; name: string; slogan: string; mark: string; outroFrames: number;
  outroSfx: { src: string; volume: number }[];
  palette: { background: string; ink: string; muted: string; accent: string; line: string; paper: string };
  font: string;
};
export type ProductionProps = { motionSrc: string; production?: Production; debugOverlay?: boolean };

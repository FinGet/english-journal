import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";

/**
 * Series sound layer (SERIES.md §1.7). Files live in public/sfx/ (CC0 Kenney + self-made whoosh,
 * see ASSETS.md). One sound per landing; never on the motion itself.
 */
export type SfxName =
  // series base: paper & pen
  | "page"
  | "pen"
  | "pop"
  | "tick"
  | "drop"
  | "whoosh"
  // UI
  | "tap"
  | "key"
  | "notify"
  | "scroll"
  | "confirm"
  | "select"
  | "error"
  | "glass"
  | "bong"
  // world-specific
  | "computer"
  | "stamp"
  | "thrust"
  | "field"
  | "heart"
  | "sync";

export type Cue = {
  at: number;
  name: SfxName;
  /** 0–1, relative to the voice. Default 0.3 ≈ well under the voice. */
  vol?: number;
  /** Frames to keep the sound (long files get cut with a fade). */
  dur?: number;
};

export const Sfx: React.FC<Cue> = ({ at, name, vol = 0.3, dur = 60 }) => (
  <Sequence from={Math.round(at)} durationInFrames={dur} layout="none" name={`sfx:${name}`}>
    <Audio
      src={staticFile(`sfx/${name}.wav`)}
      volume={(f) => vol * interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
  </Sequence>
);

export const SfxTrack: React.FC<{ cues: Cue[] }> = ({ cues }) => (
  <>
    {cues.map((c, i) => (
      <Sfx key={`${c.name}-${c.at}-${i}`} {...c} />
    ))}
  </>
);

/** Helper: evenly spaced repeats (typing, ticks, heartbeats). */
export const repeat = (name: SfxName, from: number, count: number, every: number, vol?: number): Cue[] =>
  new Array(count).fill(0).map((_, i) => ({ at: from + i * every, name, vol }));

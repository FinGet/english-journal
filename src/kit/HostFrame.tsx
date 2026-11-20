import React from "react";
import { Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { CANVAS, INK, shadow } from "./tokens";

/**
 * The real host. One continuous video whose frame morphs between layouts
 * (SERIES.md §1.5) instead of being cut away.
 */
export type HostRect = { x: number; y: number; w: number; h: number; r: number; videoH: number };

export const HOST = {
  /** A — full screen. */
  full: { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h, r: 0, videoH: CANVAS.h },
  /** B — card under the stage. */
  card: { x: 240, y: 930, w: 600, h: 520, r: 40, videoH: 1070 },
  /** C — circle window bottom-right over a full-screen world. */
  circle: { x: 760 - 190, y: 1230 - 190, w: 380, h: 380, r: 190, videoH: 720 },
} satisfies Record<string, HostRect>;

export type HostKey = { at: number; to: HostRect; dur?: number };

const lerpRect = (a: HostRect, b: HostRect, t: number): HostRect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
  r: a.r + (b.r - a.r) * t,
  videoH: a.videoH + (b.videoH - a.videoH) * t,
});

/** Resolve the host rect at frame f from a list of keyframes (first key is the start layout). */
export const resolveHost = (keys: HostKey[], f: number): HostRect => {
  let rect = keys[0].to;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const dur = k.dur ?? 22;
    if (f < k.at) break;
    const t = interpolate(f, [k.at, k.at + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.65, 0, 0.35, 1), // slow – fast – slow
    });
    rect = lerpRect(rect, k.to, t);
  }
  return rect;
};

type Props = {
  src: string;
  keys: HostKey[];
  /** Source frame offset (e.g. the scene's start when used inside a Sequence). */
  trimBefore?: number;
  /** Face centre in the source frame, 0–1. */
  face?: { x: number; y: number };
  /** Source aspect (w/h). */
  aspect?: number;
  /** Extra zoom on top of the layout, e.g. slow push or jump-cut punch-in. */
  zoom?: number;
  filter?: string;
  muted?: boolean;
};

export const HostFrame: React.FC<Props> = ({
  src,
  keys,
  trimBefore,
  face = { x: 0.5, y: 0.56 },
  aspect = 720 / 1280,
  zoom = 1,
  filter,
  muted = true,
}) => {
  const f = useCurrentFrame();
  const r = resolveHost(keys, f);

  // Fit the video so the face sits at the window centre while always covering it.
  const vh = Math.max(r.videoH * zoom, r.h, r.w / aspect);
  const vw = vh * aspect;
  const left = Math.min(0, Math.max(r.w - vw, r.w / 2 - vw * face.x));
  const top = Math.min(0, Math.max(r.h - vh, r.h / 2 - vh * face.y));

  // Frame chrome fades in as the host leaves full screen.
  const framed = interpolate(r.w, [CANVAS.w - 80, CANVAS.w], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        borderRadius: r.r,
        overflow: "hidden",
        boxShadow: framed > 0 ? `0 0 0 ${6 * framed}px ${INK.white}, ${shadow(1.4 * framed)}` : undefined,
        backgroundColor: "#d9d2c6",
      }}
    >
      <OffthreadVideo
        src={src}
        muted={muted}
        trimBefore={trimBefore}
        pauseWhenBuffering
        style={{ position: "absolute", left, top, width: vw, height: vh, maxWidth: "none", filter }}
      />
      {/* inner edge light, like a print under a warm lamp */}
      {framed > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: r.r,
            boxShadow: `inset 0 2px 0 rgba(255,255,255,${0.5 * framed}), inset 0 -30px 60px rgba(60,35,10,${0.12 * framed})`,
          }}
        />
      ) : null}
    </div>
  );
};

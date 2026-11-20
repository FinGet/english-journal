import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Sfx } from "./Sfx";
import { FONT, INK } from "./tokens";

/**
 * Hand-written margin note with a hand-drawn arrow (series signature, SERIES.md §1.4).
 * The arrow draws itself, then the words are "written" left to right.
 */
export const MarginNote: React.FC<{
  at: number;
  /** Frame at which the note fades out (optional). */
  until?: number;
  x: number;
  y: number;
  text: string;
  /** Arrow from the note toward a target, relative to (x, y). Omit for no arrow. */
  arrowTo?: { dx: number; dy: number };
  color?: string;
  size?: number;
  rotate?: number;
  /** Pen-stroke sound when the note starts (series default). */
  sound?: boolean;
}> = ({ at, until, x, y, text, arrowTo, color = INK.redpen, size = 46, rotate = -4, sound = true }) => {
  const f = useCurrentFrame();
  const pen = sound ? <Sfx at={at} name="pen" vol={0.28} /> : null;
  if (f < at) return pen;
  const out = until === undefined ? 1 : interpolate(f, [until, until + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (out <= 0) return null;
  const k = f - at;
  const arrowP = interpolate(k, [0, 12], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const write = interpolate(k, [6, 6 + text.length * 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // A slightly wobbly curve: bows away from the straight line, like a real pen stroke.
  let arrow: React.ReactNode = null;
  if (arrowTo) {
    const { dx, dy } = arrowTo;
    const bow = 0.28;
    const cx = dx / 2 - dy * bow + (random(`${text}-w`) - 0.5) * 20;
    const cy = dy / 2 + dx * bow;
    const len = Math.hypot(dx, dy) * 1.2;
    const ang = Math.atan2(dy - cy, dx - cx);
    const head = 22;
    const h1 = `${dx - head * Math.cos(ang - 0.5)},${dy - head * Math.sin(ang - 0.5)}`;
    const h2 = `${dx - head * Math.cos(ang + 0.5)},${dy - head * Math.sin(ang + 0.5)}`;
    arrow = (
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        <path d={`M0 0 Q${cx} ${cy} ${dx} ${dy}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - arrowP)} />
        {arrowP > 0.95 ? <path d={`M${h1} L${dx},${dy} L${h2}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
    );
  }

  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: out }}>
      {pen}
      {arrow}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(-50%, -110%) rotate(${rotate}deg)`,
          fontFamily: FONT.hand,
          fontWeight: 700,
          fontSize: size,
          color,
          whiteSpace: "nowrap",
          clipPath: `inset(-20% ${100 - write * 100}% -20% -5%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Highlighter swipe behind inline text, triggered at `at`. */
export const Highlight: React.FC<{ at: number; children: React.ReactNode; color?: string; dur?: number }> = ({
  at,
  children,
  color = INK.highlighter,
  dur = 8,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(98deg, transparent 0.5%, ${color} 1%, ${color} ${p}%, transparent ${p}%)`,
        backgroundSize: "100% 62%",
        backgroundPosition: "0 78%",
        backgroundRepeat: "no-repeat",
        padding: "0 6px",
      }}
    >
      {children}
    </span>
  );
};

import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FONT, INK } from "../../tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

export type TerminalLine = {
  at: number;
  /** Mono label column, e.g. "ISSUED BY". */
  k: string;
  /** Value: main text + optional muted note. */
  v: string;
  note?: string;
  /** Highlighter-yellow, bigger: the line that matters. */
  strong?: boolean;
};

/**
 * Sci-fi / ops console panel on dark glass: blinking status dot, title, channel tag,
 * key-value lines that slide in on their own frames, and an optional rubber stamp.
 * Tilts in from below at `at`, recedes at `outAt`.
 */
export const TerminalPanel: React.FC<{
  f: number;
  at: number;
  outAt?: number;
  title: string;
  channel?: string;
  lines: TerminalLine[];
  stamp?: { at: number; text: string; color?: string };
  accent?: string;
  x?: number;
  y?: number;
  width?: number;
}> = ({ f, at, outAt = Infinity, title, channel, lines, stamp, accent = "#6FE3FF", x = 120, y = 300, width = 840 }) => {
  const s = spring({ frame: f - at, fps: 30, config: { damping: 200 }, durationInFrames: 20 });
  const out = Number.isFinite(outAt) ? interpolate(f, [outAt, outAt + 22], [0, 1], { ...clamp, easing: ease }) : 0;
  if (f < at || out >= 1) return null;
  const blink = Math.floor(f / 10) % 2 === 0;
  const exec = stamp ? spring({ frame: f - stamp.at, fps: 30, config: { damping: 11, stiffness: 200 } }) : 0;
  const stampColor = stamp?.color ?? "#3DDC97";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        padding: "26px 34px 22px",
        borderRadius: 26,
        background: "linear-gradient(160deg, rgba(30,40,86,0.78), rgba(10,14,34,0.82))",
        border: "1.5px solid rgba(111,227,255,0.35)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(111,227,255,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        transform: `perspective(1600px) rotateX(${(1 - s) * 18}deg) translateY(${(1 - s) * 40 - out * 60}px) scale(${1 - out * 0.1})`,
        opacity: s * (1 - out),
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: FONT.ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, color: accent }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: blink ? INK.redpen : "rgba(229,72,46,0.3)", boxShadow: blink ? "0 0 10px #E5482D" : "none" }} />
          {title}
        </span>
        {channel ? <span style={{ fontFamily: "Menlo, monospace", fontSize: 16, color: "rgba(111,227,255,0.55)" }}>{channel}</span> : null}
      </div>
      {lines.map((l) => {
        if (f < l.at) return null;
        const t = interpolate(f, [l.at, l.at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div key={l.k} style={{ display: "flex", alignItems: "baseline", gap: 18, padding: "14px 0", borderTop: "1px solid rgba(111,227,255,0.14)", opacity: t, transform: `translateX(${(1 - t) * 18}px)` }}>
            <span style={{ width: 150, fontFamily: "Menlo, monospace", fontSize: 18, color: "rgba(111,227,255,0.7)", letterSpacing: 2 }}>{l.k}</span>
            <span style={{ fontFamily: FONT.ui, fontWeight: l.strong ? 800 : 600, fontSize: l.strong ? 34 : 28, color: l.strong ? INK.highlighter : "#EAF6FF" }}>
              {l.v}
              {l.note ? <span style={{ fontWeight: 500, color: "#9FB3C8" }}> {l.note}</span> : null}
            </span>
          </div>
        );
      })}
      {stamp && f >= stamp.at ? (
        <div style={{ position: "absolute", right: 30, bottom: 24, transform: `rotate(-8deg) scale(${interpolate(exec, [0, 1], [2, 1])})`, opacity: Math.min(1, exec * 2), border: `4px solid ${stampColor}`, color: stampColor, borderRadius: 10, padding: "4px 14px", fontFamily: FONT.ui, fontWeight: 900, fontSize: 26, letterSpacing: 4 }}>
          {stamp.text}
        </div>
      ) : null}
    </div>
  );
};

import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FONT, INK, shadow } from "../../tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const META = "#9A948A";

export type SharePart = { label: string; pct: number; color: string };
export type ShareRow = { label: string; parts: SharePart[]; focus?: boolean };

/**
 * A floating card comparing composition across rows (e.g. "2019 vs 2026 topics").
 * Each row is a 100% stacked bar that fills in, staggered; the headline % is the first part.
 */
export const ShareBars: React.FC<{
  f: number;
  at: number;
  until?: number;
  title: string;
  rows: ShareRow[];
  x?: number;
  y?: number;
  width?: number;
  tilt?: number;
}> = ({ f, at, until = Infinity, title, rows, x = 560, y = 300, width = 420, tilt = 2 }) => {
  const s = spring({ frame: f - at, fps: 30, config: { damping: 200 }, durationInFrames: 18 });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 12], [0, 1], clamp) : 0;
  if (f < at || out >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width, padding: "26px 28px 28px", borderRadius: 26, backgroundColor: "#FBF9F4", boxShadow: shadow(1.6), transform: `translateX(${(1 - s) * 80}px) rotate(${tilt - s * 0.5}deg)`, opacity: s * (1 - out) }}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 18, letterSpacing: 3, color: META }}>{title}</div>
      {rows.map((r, i) => {
        const p = interpolate(f, [at + 10 + i * 16, at + 40 + i * 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div key={r.label} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.ui, fontSize: 20, fontWeight: 700, color: r.focus ? INK.ink : META, letterSpacing: 1 }}>
              <span>{r.label}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(r.parts[0].pct * p)}%</span>
            </div>
            <div style={{ display: "flex", height: 26, borderRadius: 13, overflow: "hidden", backgroundColor: "#EDE8DF", marginTop: 8 }}>
              {r.parts.map((pt) => (
                <div key={pt.label} style={{ width: `${pt.pct * p}%`, backgroundColor: pt.color, borderRight: "2px solid #FBF9F4" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              {r.parts.map((pt) => (
                <span key={pt.label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT.zh, fontSize: 18, color: "#6B665D" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: pt.color }} />
                  {pt.label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FONT, INK } from "../../tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out3 = Easing.out(Easing.cubic);

export type RankedStep = {
  /** Frame the candidate bars appear. */
  at: number;
  /** Frame the top candidate is picked (PICKED badge). */
  pick: number;
  /** Headline once this step is picked (e.g. the sentence so far). */
  headline: string;
  /** [label, percent] sorted high → low. */
  candidates: [string, number][];
};

/**
 * A ranked list of horizontal bars that changes step by step, picking the top bar each time —
 * next-word prediction, polls, "what most people choose". The last candidate is the highlighted long tail.
 */
export const RankedBars: React.FC<{
  f: number;
  /** Visibility envelope: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]. */
  show: [number, number, number, number];
  label: string;
  /** Headline before the first pick. */
  initial: string;
  steps: RankedStep[];
  pickLabel?: string;
  colors?: { pick: string; bar: string; tail: string; meta: string };
  x?: number;
  y?: number;
  width?: number;
  children?: React.ReactNode;
}> = ({ f, show, label, initial, steps, pickLabel = "PICKED · 最可能", colors = { pick: "#5F6F93", bar: "#B9C3D8", tail: "#F2643F", meta: "#8C877D" }, x = 100, y = 290, width = 880, children }) => {
  const vis = interpolate(f, show, [0, 1, 1, 0], clamp);
  if (vis <= 0) return null;
  const idx = Math.max(0, steps.filter((s) => f >= s.at).length - 1);
  const step = steps[idx];
  const picked = steps.filter((s) => f >= s.pick).length;
  const headline = picked > 0 ? steps[picked - 1].headline : initial;
  const caret = Math.floor(f / 8) % 2 === 0;
  // Shrink long headlines to stay on one line within the panel width.
  const hSize = Math.min(64, Math.floor(width / (Math.max(...steps.map((s) => s.headline.length), initial.length) * 0.5)));
  return (
    <div style={{ position: "absolute", left: x, top: y, width, opacity: vis, transform: `translateY(${(1 - vis) * 20}px)` }}>
      <div style={{ fontFamily: "Menlo, monospace", fontSize: 18, letterSpacing: 2, color: colors.pick }}>{label}</div>
      <div style={{ fontFamily: FONT.serif, fontWeight: 800, fontSize: hSize, color: INK.ink, marginTop: 14, minHeight: 80, whiteSpace: "nowrap" }}>
        {headline}
        <span style={{ display: "inline-block", width: 5, height: (hSize * 58) / 64, marginLeft: 8, backgroundColor: colors.pick, verticalAlign: -6, opacity: caret && picked < steps.length ? 1 : 0 }} />
      </div>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
        {f >= step.at
          ? step.candidates.map(([w, pct], i) => {
              const grow = interpolate(f, [step.at + i * 3, step.at + i * 3 + 16], [0, 1], { ...clamp, easing: out3 });
              const isPick = i === 0 && f >= step.pick;
              const tail = i === step.candidates.length - 1;
              const col = tail ? colors.tail : isPick ? colors.pick : colors.bar;
              return (
                <div key={`${idx}-${w}`} style={{ display: "flex", alignItems: "center", gap: 16, opacity: grow }}>
                  <span style={{ width: 230, textAlign: "right", fontFamily: FONT.ui, fontWeight: isPick || tail ? 800 : 600, fontSize: 26, color: tail ? colors.tail : INK.ink, whiteSpace: "nowrap" }}>{w}</span>
                  <div style={{ flex: 1, height: 30, position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: `${Math.max(1.2, pct * 1.6) * grow}%`, height: "100%", borderRadius: 6, backgroundColor: col, boxShadow: isPick ? `0 0 0 3px ${INK.highlighter}` : undefined }} />
                    {isPick ? (
                      <span style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 15, letterSpacing: 2, color: INK.ink, backgroundColor: INK.highlighter, padding: "3px 10px", borderRadius: 5, whiteSpace: "nowrap", transform: `scale(${spring({ frame: f - step.pick, fps: 30, config: { damping: 12, stiffness: 200 } })})`, transformOrigin: "0 50%" }}>{pickLabel}</span>
                    ) : null}
                  </div>
                  <span style={{ width: 70, fontFamily: FONT.ui, fontWeight: 700, fontSize: 22, color: tail ? colors.tail : colors.meta, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                </div>
              );
            })
          : null}
      </div>
      {children}
    </div>
  );
};

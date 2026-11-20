import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FONT, INK, shadow } from "./tokens";

/**
 * Persistent journal tag, top-left (SERIES.md §1.4). Doubles as chapter progress:
 * one dot per chapter, the current one filled with highlighter.
 */
export const EntryTag: React.FC<{
  entry: number;
  chapters?: number[]; // start frames of each chapter
  dark?: boolean;
}> = ({ entry, chapters = [], dark = false }) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const current = chapters.filter((c) => f >= c).length - 1;
  const fg = dark ? "#F3EEE4" : INK.ink;
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 168,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 20px 10px 10px",
        borderRadius: 18,
        backgroundColor: dark ? "rgba(20,22,34,0.55)" : "rgba(255,253,248,0.82)",
        boxShadow: dark ? "none" : shadow(0.6),
        backdropFilter: "blur(6px)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * -16}px)`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          backgroundColor: INK.ink,
          color: INK.highlighter,
          fontFamily: FONT.serif,
          fontWeight: 800,
          fontSize: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(entry).padStart(2, "0")}
      </div>
      <div>
        <div style={{ fontFamily: FONT.zh, fontWeight: 600, fontSize: 28, color: fg, lineHeight: 1.1 }}>张木示</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <span style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 17, letterSpacing: 2.5, color: INK.muted }}>
            ENGLISH JOURNAL
          </span>
          {chapters.length > 1 ? (
            <span style={{ display: "flex", gap: 6 }}>
              {chapters.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === current ? 18 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: i === current ? INK.highlighter : i < current ? fg : "rgba(140,135,125,0.4)",
                    boxShadow: i === current ? `0 0 0 1.5px ${INK.ink}` : undefined,
                  }}
                />
              ))}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { Paper } from "./Paper";
import { FONT, INK, shadow } from "./tokens";

/**
 * Series cover template (SERIES.md §1.10). 3:4, 1086×1448.
 * Fixed: paper, series tag (top-left), Chinese topic block (upper-left), presenter cut-out with a paper
 * outline (lower-right). Per episode: entry number, topic, presenter frame, and one element from the
 * episode's world (`world`, lower-left, may tuck behind the presenter).
 */
export const COVER = { w: 1086, h: 1448 };

export type CoverProps = {
  entry: number;
  /** 1–3 lines. Wrap the key phrase in <Mark> for the highlighter. */
  topic: React.ReactNode[];
  /** Transparent PNG of the presenter (staticFile path) and how it sits on the cover. */
  presenter: { src: string; x: number; y: number; width: number };
  /** One element from the episode's world. */
  world?: React.ReactNode;
  /** Small line under the topic, e.g. the method in one line. Optional. */
  sub?: React.ReactNode;
};

/** Highlighter stroke behind the key phrase of the topic. */
export const Mark: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ position: "relative", whiteSpace: "nowrap" }}>
    <span
      style={{
        position: "absolute",
        left: "-0.06em",
        right: "-0.06em",
        bottom: "0.04em",
        height: "0.46em",
        background: INK.highlighter,
        borderRadius: "0.08em",
        transform: "rotate(-1deg)",
      }}
    />
    <span style={{ position: "relative" }}>{children}</span>
  </span>
);

const SeriesTag: React.FC<{ entry: number }> = ({ entry }) => (
  <div
    style={{
      position: "absolute",
      left: 70,
      top: 64,
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "12px 28px 12px 12px",
      borderRadius: 22,
      background: "rgba(255,253,248,0.9)",
      boxShadow: shadow(0.7),
      fontFamily: FONT.ui,
    }}
  >
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 16,
        background: INK.ink,
        color: INK.highlighter,
        fontFamily: FONT.serif,
        fontWeight: 800,
        fontSize: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {String(entry).padStart(2, "0")}
    </div>
    <div>
      <div style={{ fontSize: 30, fontWeight: 700, color: INK.ink }}>张木示</div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 3.5, color: INK.muted, marginTop: 2 }}>ENGLISH JOURNAL</div>
    </div>
  </div>
);

/** Paper outline around the cut-out: stacked hard shadows in 12 directions, then the warm lamp shadow. */
const outline = (px: number, color: string) =>
  new Array(12)
    .fill(0)
    .map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `drop-shadow(${(Math.cos(a) * px).toFixed(1)}px ${(Math.sin(a) * px).toFixed(1)}px 0 ${color})`;
    })
    .join(" ");

export const Cover: React.FC<CoverProps> = ({ entry, topic, presenter, world, sub }) => (
  <AbsoluteFill style={{ width: COVER.w, height: COVER.h, overflow: "hidden" }}>
    <Paper />
    {world}
    <Img
      src={presenter.src}
      style={{
        position: "absolute",
        left: presenter.x,
        top: presenter.y,
        width: presenter.width,
        filter: `${outline(7, INK.white)} drop-shadow(0 18px 30px rgba(70,45,20,0.28))`,
      }}
    />
    <SeriesTag entry={entry} />
    <div style={{ position: "absolute", left: 70, top: 196, width: COVER.w - 140, fontFamily: FONT.zh, color: INK.ink }}>
      {topic.map((line, i) => (
        <div key={i} style={{ fontSize: i === 0 ? 150 : 104, fontWeight: 900, lineHeight: 1.18, letterSpacing: -2 }}>
          {line}
        </div>
      ))}
      {sub ? <div style={{ marginTop: 18, fontFamily: FONT.ui, fontSize: 30, color: INK.muted, fontWeight: 500 }}>{sub}</div> : null}
    </div>
  </AbsoluteFill>
);

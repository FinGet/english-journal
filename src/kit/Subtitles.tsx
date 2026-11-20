import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { FONT, INK } from "./tokens";

export type Caption = { from: number; to: number; english: string; chinese: string };
export type Word = { from: number; to: number; text: string };

// Fixed band (AGENTS.md): x 100–980, y 1500–1660, English above Chinese.
const BAND = { x: 100, y: 1500, w: 880, h: 160 };

/**
 * Torn left/right edges, like a strip torn out of the journal. Each caption gets its own tear.
 * Top and bottom stay straight (cut edges); depth of the tear is 3–9px.
 */
const tornClip = (seed: string) => {
  const steps = 11;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    left.push(`${3 + random(`${seed}-l${i}`) * 9}px ${y}%`);
    right.push(`calc(100% - ${3 + random(`${seed}-r${i}`) * 9}px) ${100 - y}%`);
  }
  return `polygon(${left.join(", ")}, ${right.join(", ")})`;
};

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.36 0 0 0 0 0.25 0 0 0 0.10 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")";

/**
 * Series subtitles (SERIES.md §1.4). Fixed: position, EN over ZH, single-line EN, highlighter on the
 * spoken word. Skin follows the episode world: `paper` (default) or `glass` for dark worlds.
 * `glass` may be a number 0–1 to cross-fade between the two during a transition.
 */
export const Subtitles: React.FC<{ captions: Caption[]; words: Word[]; glass?: boolean | number }> = ({
  captions,
  words,
  glass = false,
}) => {
  const g = typeof glass === "number" ? Math.min(1, Math.max(0, glass)) : glass ? 1 : 0;
  const mix = (a: [number, number, number], b: [number, number, number], alphaA: number, alphaB: number) =>
    `rgba(${a.map((v, i) => Math.round(v + (b[i] - v) * g)).join(",")},${alphaA + (alphaB - alphaA) * g})`;
  const slipBg = mix([255, 253, 248], [18, 20, 32], 0.93, 0.62);
  const enColor = mix([22, 22, 22], [246, 242, 234], 1, 1);
  const zhColor = mix([85, 81, 74], [200, 196, 188], 1, 1);
  const f = useCurrentFrame();

  const idx = captions.findIndex((c, i) => {
    const next = captions[i + 1];
    const end = next && next.from - c.to < 12 ? next.from : c.to + 6;
    return f >= c.from && f < end;
  });
  if (idx === -1) return null;
  const cap = captions[idx];

  const enter = interpolate(f - cap.from, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const capWords = words.filter((w) => w.from >= cap.from - 2 && w.from < cap.to);
  const tokens = cap.english.split(" ");
  const aligned = capWords.length === tokens.length;
  const active = aligned ? capWords.filter((w) => w.from <= f).length - 1 : -1;
  const enSize = Math.min(48, Math.floor(800 / (cap.english.length * 0.52)));

  return (
    <div
      style={{
        position: "absolute",
        left: BAND.x,
        top: BAND.y,
        width: BAND.w,
        height: BAND.h,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      {/* drop-shadow follows the torn outline (box-shadow would be clipped away) */}
      <div style={{ filter: g < 0.5 ? "drop-shadow(0 2px 2px rgba(70,45,20,0.18)) drop-shadow(0 10px 18px rgba(70,45,20,0.16))" : "drop-shadow(0 10px 24px rgba(0,0,0,0.35))", transform: `rotate(${(random(`tilt-${idx}`) - 0.5) * 1.2}deg)` }}>
      <div
        style={{
          padding: "12px 34px 12px",
          clipPath: tornClip(`cap-${idx}`),
          backgroundColor: slipBg,
          backgroundImage: g < 0.5 ? GRAIN : undefined,
          backdropFilter: g > 0 ? `blur(${10 * g}px)` : undefined,
          textAlign: "center",
          maxWidth: BAND.w,
        }}
      >
        <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: enSize, color: enColor, whiteSpace: "nowrap", letterSpacing: -0.3, lineHeight: 1.2 }}>
          {tokens.map((t, i) => {
            const on = i === active;
            const w = aligned ? capWords[i] : null;
            const sweep = on && w ? interpolate(f, [w.from, w.from + 4], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
            return (
              <React.Fragment key={i}>
                {i > 0 ? " " : null}
                <span
                  style={{
                    backgroundImage: on ? `linear-gradient(100deg, ${INK.highlighter} ${sweep}%, transparent ${sweep}%)` : undefined,
                    color: on && sweep >= 100 ? INK.ink : undefined,
                    borderRadius: 4,
                    padding: "0 3px",
                    margin: "0 -3px",
                  }}
                >
                  {t}
                </span>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ fontFamily: FONT.zh, fontWeight: 500, fontSize: 34, color: zhColor, marginTop: 4, whiteSpace: "nowrap" }}>{cap.chinese}</div>
      </div>
      </div>
    </div>
  );
};

import React from "react";
import { AbsoluteFill, random } from "remotion";

/** Shared space palette for the space blocks. */
export const SPACE_THEME = { nebula: "#3A3F9E", cyan: "#6FE3FF", coral: "#FF7A59", mint: "#3DDC97" };
const P = SPACE_THEME;

/**
 * One parallax layer of stars. Stack 3 (far/mid/near) with growing size and parallax.
 * `cam` moves the camera; `streak` > 0 turns stars into warp streaks.
 */
export const StarLayer: React.FC<{ n: number; seed: string; size: [number, number]; parallax: number; cam: { x: number; y: number }; streak: number; f: number }> = ({
  n,
  seed,
  size,
  parallax,
  cam,
  streak,
  f,
}) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    {new Array(n).fill(0).map((_, i) => {
      const x = (((random(`${seed}x${i}`) * 1400 - cam.x * parallax) % 1400) + 1400) % 1400 - 160;
      const y = (((random(`${seed}y${i}`) * 2300 - cam.y * parallax) % 2300) + 2300) % 2300 - 190;
      const r = size[0] + random(`${seed}r${i}`) * (size[1] - size[0]);
      const tw = 0.55 + 0.45 * Math.sin(f / (9 + random(`${seed}t${i}`) * 14) + i);
      const warm = random(`${seed}c${i}`);
      const color = warm > 0.85 ? "#FFE3B0" : warm < 0.12 ? "#BFD8FF" : "#FFFFFF";
      if (streak > 0.5) {
        const len = streak * parallax * 3;
        return <line key={i} x1={x} y1={y} x2={x - len * 0.82} y2={y + len * 0.57} stroke={color} strokeWidth={r} strokeLinecap="round" opacity={tw * 0.8} />;
      }
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={tw} />;
    })}
  </svg>
);

export const Nebula: React.FC<{ cam: { x: number; y: number } }> = ({ cam }) => (
  <AbsoluteFill style={{ transform: `translate(${-cam.x * 0.08}px, ${-cam.y * 0.08}px)` }}>
    <div style={{ position: "absolute", left: -200, top: 120, width: 900, height: 700, borderRadius: "50%", background: `radial-gradient(closest-side, ${P.nebula}aa, transparent)`, filter: "blur(30px)" }} />
    <div style={{ position: "absolute", left: 500, top: 700, width: 800, height: 600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,122,89,0.28), transparent)", filter: "blur(40px)" }} />
    <div style={{ position: "absolute", left: 180, top: 1200, width: 900, height: 700, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(111,227,255,0.16), transparent)", filter: "blur(40px)" }} />
  </AbsoluteFill>
);

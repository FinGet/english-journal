import React from "react";
import { random } from "remotion";

import { SPACE_THEME as P } from "./Starfield";

/** Flat-vector capital ship pointing right (560×170). `thrust` 0–1 lights the engines. */
export const Spaceship: React.FC<{ f: number; thrust: number }> = ({ f, thrust }) => {
  const flick = 0.85 + 0.15 * Math.sin(f * 1.7);
  const blink = Math.floor(f / 12) % 3 === 0;
  return (
    <svg width={560} height={170} viewBox="-120 0 560 170" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="hullTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F6FA" />
          <stop offset="1" stopColor="#B9C2D2" />
        </linearGradient>
        <linearGradient id="plume" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.25" stopColor={P.cyan} />
          <stop offset="1" stopColor={P.cyan} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* engine plume */}
      {thrust > 0 ? (
        <g opacity={flick}>
          <ellipse cx={-20 - 60 * thrust} cy={86} rx={60 + 120 * thrust} ry={16 + 6 * thrust} fill="url(#plume)" />
          <ellipse cx={-10 - 30 * thrust} cy={86} rx={30 + 50 * thrust} ry={8} fill="#fff" opacity={0.9} />
        </g>
      ) : null}
      {/* engine block */}
      <path d="M10 56 L48 50 L48 122 L10 116 Z" fill="#59627A" />
      {[64, 86, 108].map((y) => (
        <g key={y}>
          <rect x={-2} y={y - 8} width={16} height={16} rx={4} fill="#3A4157" />
          <circle cx={-2} cy={y} r={6} fill={thrust > 0 ? "#E6FBFF" : "#2A3046"} />
        </g>
      ))}
      {/* main hull */}
      <path d="M48 52 L300 46 C350 46 410 66 430 86 C410 106 350 126 300 126 L48 120 Z" fill="url(#hullTop)" />
      <path d="M48 92 L430 86 C410 106 350 126 300 126 L48 120 Z" fill="#8E99AF" />
      {/* bridge tower */}
      <path d="M200 46 L214 24 L268 24 L282 46 Z" fill="#DDE3EC" />
      <path d="M220 28 L262 28 L262 34 L220 34 Z" fill="#2E3A58" />
      {/* fins */}
      <path d="M70 52 L40 18 L100 18 L130 50 Z" fill="#A9B3C6" />
      <path d="M70 120 L40 154 L100 154 L130 122 Z" fill="#7B869C" />
      {/* panel lines */}
      {[110, 160, 210, 260, 320].map((x) => (
        <line key={x} x1={x} y1={50} x2={x} y2={122} stroke="#7F8AA0" strokeWidth={1.5} opacity={0.6} />
      ))}
      {/* windows */}
      {new Array(14).fill(0).map((_, i) => (
        <rect key={i} x={120 + i * 16} y={72} width={8} height={5} rx={1.5} fill={random(`win${i}`) > 0.3 ? "#FFE7A0" : "#5A6580"} />
      ))}
      {/* name decal */}
      <text x={150} y={108} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={11} letterSpacing={3} fill="#3A4560">NATURAL SELECTION</text>
      {/* running lights */}
      <circle cx={428} cy={86} r={4} fill={blink ? "#FF5A4E" : "#7A2A28"} />
      {blink ? <circle cx={428} cy={86} r={12} fill="#FF5A4E" opacity={0.3} /> : null}
      <circle cx={100} cy={20} r={3} fill={!blink ? "#6FFFB0" : "#2A5A40"} />
      {/* key-light highlight */}
      <path d="M60 54 L300 48 C330 48 360 56 380 64" stroke="#fff" strokeWidth={2.5} fill="none" opacity={0.8} />
    </svg>
  );
};

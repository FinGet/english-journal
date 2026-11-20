import React from "react";
import { random } from "remotion";


/** Flat-vector Earth (660px): spinning continents, clouds, night side with city lights, lit rim. */
const CONTINENTS = [
  "M120 210 C150 150 230 140 270 170 C300 190 330 180 350 210 C370 250 320 300 280 290 C250 285 240 320 200 330 C160 340 120 300 130 260 Z",
  "M380 330 C420 300 470 320 480 360 C490 410 460 470 420 500 C390 520 360 480 370 440 C376 410 350 360 380 330 Z",
  "M160 420 C190 400 240 410 250 450 C260 490 220 520 190 510 C160 500 140 450 160 420 Z",
  "M420 160 C450 140 500 150 520 180 C530 200 500 220 470 215 C440 210 410 190 420 160 Z",
];

export const Earth: React.FC<{ f: number }> = ({ f }) => {
  const R = 330;
  const spin = f * 0.5;
  return (
    <div style={{ position: "relative", width: R * 2, height: R * 2 }}>
      {/* atmosphere glow */}
      <div style={{ position: "absolute", inset: -60, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(111,190,255,0.0) 78%, rgba(111,190,255,0.45) 86%, rgba(111,190,255,0) 100%)" }} />
      <svg width={R * 2} height={R * 2} viewBox="0 0 660 660" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="earth-clip">
            <circle cx={330} cy={330} r={330} />
          </clipPath>
          <radialGradient id="ocean" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#4FA3FF" />
            <stop offset="0.55" stopColor="#2563C9" />
            <stop offset="1" stopColor="#0D2A66" />
          </radialGradient>
          <radialGradient id="night" cx="85%" cy="85%" r="75%">
            <stop offset="0" stopColor="#030616" stopOpacity="0.92" />
            <stop offset="0.55" stopColor="#030616" stopOpacity="0.55" />
            <stop offset="0.8" stopColor="#030616" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g clipPath="url(#earth-clip)">
          <circle cx={330} cy={330} r={330} fill="url(#ocean)" />
          {[0, 660].map((off) => (
            <g key={off} transform={`translate(${((-spin % 660) + off) - 0} 0)`}>
              {CONTINENTS.map((d, i) => (
                <g key={i}>
                  <path d={d} fill="#3FAE6E" />
                  <path d={d} fill="#2E8A55" transform="translate(8 10)" opacity={0.6} />
                  <path d={d} fill="#5CC786" transform="translate(-4 -5) scale(0.98)" opacity={0.5} />
                </g>
              ))}
            </g>
          ))}
          {/* clouds */}
          {[0, 660].map((off) => (
            <g key={`c${off}`} transform={`translate(${((-spin * 1.4) % 660) + off} 0)`} fill="#fff" opacity={0.75}>
              <path d="M60 140 C90 120 140 130 170 120 C190 114 220 120 230 130 C200 136 150 142 60 140 Z" />
              <path d="M300 260 C340 246 400 250 440 240 C460 236 480 244 486 252 C440 258 380 262 300 260 Z" />
              <path d="M120 520 C160 506 220 512 260 504 C280 500 300 508 304 514 C260 520 200 524 120 520 Z" />
            </g>
          ))}
          <circle cx={330} cy={330} r={330} fill="url(#night)" />
          {/* city lights on the night side */}
          {new Array(40).fill(0).map((_, i) => {
            const a = random(`city${i}`) * Math.PI * 0.5 + 0.1;
            const rr = 120 + random(`cityr${i}`) * 190;
            return <circle key={i} cx={330 + Math.cos(a) * rr} cy={330 + Math.sin(a) * rr} r={1.5 + random(`cs${i}`) * 1.5} fill="#FFD27A" opacity={0.5 + 0.4 * Math.sin(f / 7 + i)} />;
          })}
          {/* lit rim from the key light */}
          <circle cx={330} cy={330} r={322} fill="none" stroke="rgba(190,230,255,0.55)" strokeWidth={10} strokeDasharray="700 2000" strokeDashoffset={1350} />
        </g>
      </svg>
    </div>
  );
};

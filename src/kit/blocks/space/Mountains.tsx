import React from "react";
import { random } from "remotion";

/** One layer of flat mountain silhouettes (SVG polygon). Stack 3 for atmospheric depth; `drift` for parallax. */
export const Mountains: React.FC<{ y: number; amp: number; color: string; seed: string; drift: number }> = ({ y, amp, color, seed, drift }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = i * 110 - 60 + drift;
    const h = y - random(`${seed}${i}`) * amp - (i % 2) * amp * 0.3;
    pts.push(`${x},${h}`);
  }
  return <polygon points={`-100,1920 ${pts.join(" ")} 1300,1920`} fill={color} />;
};

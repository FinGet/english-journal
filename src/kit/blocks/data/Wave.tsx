import React from "react";

/**
 * A short sine-wave strip (w×40). Animate `ph` with the frame for motion; tween `fq`/`ph`
 * of several waves toward one value to show "getting in sync / on the same wavelength".
 */
export const Wave: React.FC<{ fq: number; ph: number; color: string; w?: number; amp?: number; stroke?: number }> = ({ fq, ph, color, w = 140, amp = 14, stroke = 4 }) => {
  const d = new Array(41)
    .fill(0)
    .map((_, i) => {
      const x = (i / 40) * w;
      const y = 20 + Math.sin((i / 40) * Math.PI * 2 * fq * 1.6 + ph) * amp;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={40} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
};

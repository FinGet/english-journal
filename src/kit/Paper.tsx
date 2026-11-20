import React from "react";
import { AbsoluteFill } from "remotion";
import { INK } from "./tokens";

/**
 * Series base layer: paper colour + fibre grain + warm key light from top-left + soft vignette.
 * `tone` lets an episode tint the paper slightly without leaving the paper family.
 */
export const Paper: React.FC<{ tone?: string; grain?: number; ruled?: boolean }> = ({
  tone = INK.paper,
  grain = 0.5,
  ruled = false,
}) => (
  <AbsoluteFill style={{ backgroundColor: tone }}>
    {ruled ? (
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(transparent 0 62px, rgba(60,80,120,0.10) 62px 64px)",
          backgroundPosition: "0 40px",
        }}
      />
    ) : null}
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "multiply" }}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.26  0 0 0 0.22 0" />
      </filter>
      <filter id="paper-fibre">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="3" />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.10 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
      <rect width="100%" height="100%" filter="url(#paper-fibre)" />
    </svg>
    {/* warm key light top-left, falloff to the bottom-right */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 90% 60% at 18% 8%, rgba(255,236,200,0.55), transparent 70%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(90,60,30,0.16) 100%)",
      }}
    />
  </AbsoluteFill>
);

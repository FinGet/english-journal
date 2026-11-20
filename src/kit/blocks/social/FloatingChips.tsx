import React from "react";
import { interpolate, spring } from "remotion";
import { Avatar, type AvatarSpec } from "../../character/Avatar";
import { FONT, shadow } from "../../tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Chip = { at: number; avatar: AvatarSpec; text: string; x: number; y: number; rotate?: number };

/** Frosted "status" pills (avatar + one line) that fade in and slowly drift upward over the host. */
export const FloatingChips: React.FC<{ f: number; items: Chip[]; until?: number; greyAvatars?: number }> = ({ f, items, until = Infinity, greyAvatars = 0.4 }) => {
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 14], [0, 1], clamp) : 0;
  if (out >= 1) return null;
  return (
    <>
      {items.map((c) => {
        if (f < c.at) return null;
        const s = spring({ frame: f - c.at, fps: 30, config: { damping: 200 }, durationInFrames: 16 });
        const drift = (f - c.at) * 0.35;
        return (
          <div
            key={`${c.at}-${c.text}`}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y - drift,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 22px 12px 12px",
              borderRadius: 40,
              backgroundColor: "rgba(250,247,240,0.82)",
              backdropFilter: "blur(14px)",
              boxShadow: shadow(0.9),
              transform: `rotate(${c.rotate ?? 0}deg) translateY(${(1 - s) * 30}px)`,
              opacity: s * (1 - out) * 0.96,
            }}
          >
            <Avatar a={c.avatar} size={56} grey={greyAvatars} />
            <span style={{ fontFamily: FONT.zh, fontSize: 28, color: "#3B3833", whiteSpace: "nowrap" }}>{c.text}</span>
          </div>
        );
      })}
    </>
  );
};

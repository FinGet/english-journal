import React from "react";
import { spring } from "remotion";
import { Avatar, type AvatarSpec } from "../../character/Avatar";
import { FONT, INK, shadow } from "../../tokens";

export type Comment = { at: number; avatar: AvatarSpec; text: string };

/**
 * Comment section CTA: an input that types its placeholder, with comment bubbles (avatar + text + heart)
 * popping in above it. Good for "leave your thoughts in the comments".
 */
export const CommentBox: React.FC<{
  f: number;
  at: number;
  placeholder: string;
  comments: Comment[];
  heartColor?: string;
  x?: number;
  y?: number;
  width?: number;
}> = ({ f, at, placeholder, comments, heartColor = "#F2643F", x = 100, y = 280, width = 880 }) => {
  const s = spring({ frame: f - at, fps: 30, config: { damping: 200 }, durationInFrames: 16 });
  if (f < at) return null;
  const typed = Array.from(placeholder).slice(0, Math.floor(Math.max(0, f - at - 6) / 2.5)).join("");
  return (
    <div style={{ position: "absolute", left: x, top: y, width, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        {comments.map((c) => {
          if (f < c.at) return null;
          const k = spring({ frame: f - c.at, fps: 30, config: { damping: 14, stiffness: 180 } });
          return (
            <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 12, alignSelf: "flex-start", padding: "8px 18px 8px 8px", borderRadius: 30, backgroundColor: "rgba(255,253,248,0.86)", backdropFilter: "blur(10px)", boxShadow: shadow(0.7), transform: `scale(${0.7 + 0.3 * k})`, transformOrigin: "0 50%", opacity: k }}>
              <Avatar a={c.avatar} size={44} />
              <span style={{ fontFamily: FONT.zh, fontSize: 26, color: "#3B3833" }}>{c.text}</span>
              <svg width="22" height="20" viewBox="0 0 64 60"><path d="M32 54 C14 42 6 32 6 21 C6 13 12 7 20 7 C25 7 29 10 32 14 C35 10 39 7 44 7 C52 7 58 13 58 21 C58 32 50 42 32 54 Z" fill={heartColor} /></svg>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px 12px 22px", borderRadius: 34, backgroundColor: "rgba(255,253,248,0.92)", boxShadow: shadow(1) }}>
        <span style={{ flex: 1, fontFamily: FONT.zh, fontSize: 28, color: "#8C877D" }}>
          {typed}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0, color: INK.ink }}>|</span>
        </span>
        <div style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: INK.highlighter, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 22 22"><path d="M2 11 L20 3 L13 20 L10 12 Z" fill={INK.ink} /></svg>
        </div>
      </div>
    </div>
  );
};

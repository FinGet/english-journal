import React from "react";
import { Easing, interpolate } from "remotion";
import { Avatar, type AvatarSpec } from "../../character/Avatar";
import { FONT, INK } from "../../tokens";
import { CHAT_THEME } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

export type SheetMember = { name: string; avatar: AvatarSpec; /** frame this member greys out and leaves */ leaveAt?: number; highlight?: boolean };

/** Bottom sheet listing members inside the chat screen. Pass as ChatApp `overlay`. */
export const MemberSheet: React.FC<{
  f: number;
  upAt: number;
  downAt: number;
  title: string;
  count: number;
  unit?: string;
  members: SheetMember[];
}> = ({ f, upAt, downAt, title, count, unit = "人", members }) => {
  const up = interpolate(f, [upAt, upAt + 20, downAt, downAt + 18], [0, 1, 1, 0], { ...clamp, easing: ease });
  if (up <= 0) return null;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(20,16,10,${0.28 * up})`, zIndex: 6 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 820, transform: `translateY(${(1 - up) * 860}px)`, backgroundColor: "#FBF9F4", borderRadius: "34px 34px 0 0", boxShadow: "0 -10px 40px rgba(40,25,10,0.25)", zIndex: 7, padding: "16px 28px", boxSizing: "border-box" }}>
        <div style={{ width: 60, height: 6, borderRadius: 3, backgroundColor: "#D8D1C5", margin: "0 auto 20px" }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 30, color: INK.ink }}>{title}</span>
          <span style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 44, color: count < 100 ? INK.redpen : INK.ink, fontVariantNumeric: "tabular-nums" }}>
            {count}
            <span style={{ fontSize: 20, fontWeight: 600, color: CHAT_THEME.meta, marginLeft: 6 }}>{unit}</span>
          </span>
        </div>
        <div style={{ marginTop: 14, height: 48, borderRadius: 14, backgroundColor: "#EFEBE3", display: "flex", alignItems: "center", gap: 10, paddingLeft: 16, fontFamily: FONT.zh, fontSize: 20, color: "#A8A196" }}>
          <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="8" cy="8" r="6" stroke="#A8A196" strokeWidth="2.5" fill="none" /><path d="M13 13 L18 18" stroke="#A8A196" strokeWidth="2.5" strokeLinecap="round" /></svg>
          搜索成员
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 18, marginTop: 26 }}>
          {members.map((m, i) => {
            const at = m.leaveAt;
            const g = at === undefined ? 0 : interpolate(f, [at, at + 10], [0, 1], clamp);
            const out = at === undefined ? 0 : interpolate(f, [at + 8, at + 18], [0, 1], clamp);
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - out * 0.85, transform: `scale(${1 - out * 0.25}) translateY(${out * 10}px)` }}>
                <Avatar a={m.avatar} size={92} grey={g} style={{ boxShadow: m.highlight ? `0 0 0 4px ${INK.highlighter}` : undefined }} />
                <span style={{ fontFamily: FONT.zh, fontSize: 18, color: g > 0.5 ? "#B4ADA2" : "#55514A", marginTop: 6 }}>{m.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

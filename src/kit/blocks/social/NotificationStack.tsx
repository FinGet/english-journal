import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FONT, INK, shadow } from "../../tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const META = "#9A948A";

export type Notification = {
  at: number;
  /** Sender shown before the text, coloured. */
  sender: string;
  senderColor: string;
  text: string;
  time: string;
  /** Frame at which a highlighter sweeps the text (optional). */
  highlightAt?: number;
};

/**
 * Lock-screen style notifications dropping in one by one; newer ones push older ones down and back.
 * Collapses upward at `exitAt` (as if tapped).
 */
export const NotificationStack: React.FC<{
  f: number;
  items: Notification[];
  title: string;
  count?: string;
  icon: React.ReactNode;
  badge?: string;
  exitAt?: number;
  x?: number;
  y?: number;
  width?: number;
}> = ({ f, items, title, count, icon, badge, exitAt = Infinity, x = 100, y = 300, width = 880 }) => {
  const exit = Number.isFinite(exitAt) ? interpolate(f, [exitAt, exitAt + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) }) : 0;
  if (exit >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      {items.map((n, i) => {
        if (f < n.at) return null;
        const s = spring({ frame: f - n.at, fps: 30, config: { damping: 15, stiffness: 170 } });
        const newer = items.filter((m) => f >= m.at && m.at > n.at).length;
        const push = spring({ frame: f - (items[i + newer]?.at ?? 0), fps: 30, config: { damping: 200 } });
        const depth = newer === 0 ? 0 : newer - 1 + push;
        const ty = (1 - s) * -160 + depth * 34;
        const scale = 1 - depth * 0.05;
        const hi = n.highlightAt === undefined ? 0 : interpolate(f, [n.highlightAt, n.highlightAt + 8], [0, 100], clamp);
        return (
          <div
            key={n.at}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width,
              transform: `translateY(${ty + exit * -40}px) scale(${scale * (1 - exit * 0.1)})`,
              transformOrigin: "50% 0",
              opacity: Math.min(1, s * 1.5) * (1 - depth * 0.25) * (1 - exit),
              zIndex: 10 - depth,
              borderRadius: 30,
              padding: "22px 26px",
              boxSizing: "border-box",
              backgroundColor: "rgba(250,247,240,0.86)",
              backdropFilter: "blur(18px)",
              boxShadow: shadow(1.2),
              display: "flex",
              gap: 20,
              alignItems: "center",
            }}
          >
            {icon}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 30, color: INK.ink }}>
                  {title}
                  {count ? <span style={{ fontWeight: 500, color: META, fontSize: 24, marginLeft: 10 }}>{count}</span> : null}
                </span>
                <span style={{ fontFamily: FONT.zh, fontSize: 22, color: META }}>{n.time}</span>
              </div>
              <div style={{ fontFamily: FONT.zh, fontSize: 30, color: "#3B3833", marginTop: 6, whiteSpace: "nowrap" }}>
                <span style={{ color: n.senderColor, fontWeight: 600 }}>{n.sender}：</span>
                {n.highlightAt !== undefined ? (
                  <span style={{ backgroundImage: `linear-gradient(98deg, ${INK.highlighter} ${hi}%, transparent 0)`, backgroundSize: "100% 55%", backgroundPosition: "0 85%", backgroundRepeat: "no-repeat" }}>{n.text}</span>
                ) : (
                  n.text
                )}
              </div>
            </div>
            {i === 0 && badge ? (
              <div style={{ position: "absolute", right: -14, top: -14, minWidth: 54, height: 44, borderRadius: 22, backgroundColor: INK.redpen, color: "#fff", fontFamily: FONT.ui, fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px", boxShadow: "0 4px 10px rgba(229,72,46,0.4)" }}>{badge}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

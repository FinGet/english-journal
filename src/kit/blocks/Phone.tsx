import React from "react";
import { FONT } from "../tokens";

export const PHONE = { w: 560, h: 1140, bezel: 14, radius: 70 };
export const SCREEN = { w: PHONE.w - PHONE.bezel * 2, h: PHONE.h - PHONE.bezel * 2, radius: PHONE.radius - PHONE.bezel };

/** Generic phone body (not a real brand): frame, side keys, island, glass highlight. */
export const Phone: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark = false }) => (
  <div style={{ position: "relative", width: PHONE.w, height: PHONE.h }}>
    {/* side keys */}
    <div style={{ position: "absolute", left: -5, top: 230, width: 6, height: 70, borderRadius: 3, background: "#2A2B33" }} />
    <div style={{ position: "absolute", left: -5, top: 320, width: 6, height: 110, borderRadius: 3, background: "#2A2B33" }} />
    <div style={{ position: "absolute", right: -5, top: 300, width: 6, height: 150, borderRadius: 3, background: "#2A2B33" }} />
    {/* body */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: PHONE.radius,
        background: "linear-gradient(145deg, #3B3D48 0%, #17181E 38%, #0F1014 100%)",
        boxShadow:
          "0 3px 6px rgba(60,35,10,0.25), 0 40px 90px rgba(60,35,10,0.35), inset 0 0 0 2px rgba(255,255,255,0.10), inset 2px 2px 0 rgba(255,255,255,0.12)",
      }}
    />
    {/* screen */}
    <div
      style={{
        position: "absolute",
        left: PHONE.bezel,
        top: PHONE.bezel,
        width: SCREEN.w,
        height: SCREEN.h,
        borderRadius: SCREEN.radius,
        overflow: "hidden",
        backgroundColor: dark ? "#0B0E1E" : "#ECE7DE",
      }}
    >
      {children}
      {/* island */}
      <div style={{ position: "absolute", left: SCREEN.w / 2 - 62, top: 14, width: 124, height: 36, borderRadius: 18, backgroundColor: "#050507" }}>
        <div style={{ position: "absolute", right: 14, top: 11, width: 14, height: 14, borderRadius: 7, background: "radial-gradient(circle at 35% 35%, #3A4A7A, #0A0C14 70%)" }} />
      </div>
      {/* glass reflection from the warm key light (top-left) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(120deg, rgba(255,250,235,0.16) 0%, rgba(255,250,235,0.05) 26%, transparent 27%)",
          pointerEvents: "none",
        }}
      />
    </div>
  </div>
);

export const StatusBar: React.FC<{ color?: string }> = ({ color = "#16171C" }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 40px 0 48px", boxSizing: "border-box", fontFamily: FONT.ui, fontWeight: 700, fontSize: 22, color, zIndex: 5 }}>
    <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="26" height="16" viewBox="0 0 26 16">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 7} y={12 - i * 4} width={5} height={4 + i * 4} rx={1.2} fill={color} />
        ))}
      </svg>
      <svg width="22" height="16" viewBox="0 0 22 16">
        <path d="M11 15 L7 11 A6 6 0 0 1 15 11 Z" fill={color} />
        <path d="M3.5 7.5 A11 11 0 0 1 18.5 7.5" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d="M0.8 4.2 A15 15 0 0 1 21.2 4.2" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.6} />
      </svg>
      <svg width="34" height="16" viewBox="0 0 34 16">
        <rect x={0.5} y={0.5} width={28} height={15} rx={4} stroke={color} strokeOpacity={0.5} fill="none" />
        <rect x={3} y={3} width={19} height={10} rx={2} fill={color} />
        <rect x={30} y={5} width={3} height={6} rx={1.2} fill={color} opacity={0.5} />
      </svg>
    </span>
  </div>
);

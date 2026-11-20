import type React from "react";
import type { AvatarSpec } from "../../character/Avatar";

/** A chat message. `at` = frame it arrives (omit = already in the history). */
export type ChatMessage =
  | { id: string; kind: "date"; text: string; at?: number }
  | { id: string; kind: "system"; text: string; at?: number }
  | { id: string; kind: "text"; who: string; text: string; at?: number }
  | { id: string; kind: "code"; who: string; lines: string[]; caption?: string; at?: number }
  | { id: string; kind: "link"; who: string; title: string; domain: string; thumb?: React.ReactNode; at?: number }
  | { id: string; kind: "sticker"; who: string; node: React.ReactNode; at?: number }
  | { id: string; kind: "voice"; who: string; secs: number; at?: number };

export type ChatPerson = { name: string; color: string; avatar: AvatarSpec };

/** Scroll keyframe: from `at`, ease over `dur` frames to the target. */
export type ChatScrollKey = {
  at: number;
  dur: number;
  to: "bottom" | "top" | { id: string; offset?: number; notPastBottom?: boolean };
};

/** Per-message emphasis at frame f: `hi` highlights text and lifts the bubble, `dim` fades it, `scale` pulses the row. */
export type ChatEmphasis = (id: string, kind: ChatMessage["kind"], f: number) => { hi?: number; dim?: number; scale?: number };

export const CHAT_THEME = {
  bg: "#ECE7DE",
  header: "#F8F5EF",
  bubbleMe: "#D9F5E4",
  bubbleOther: "#FFFFFF",
  meta: "#9A948A",
  accent: "#3DDC97",
};

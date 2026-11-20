import React from "react";
import { Easing, interpolate, random, spring } from "remotion";
import { Avatar, GroupAvatar } from "../../character/Avatar";
import { FONT, INK } from "../../tokens";
import { SCREEN, StatusBar } from "../Phone";
import { CHAT_THEME, type ChatEmphasis, type ChatMessage, type ChatPerson, type ChatScrollKey } from "./types";

/**
 * A full group-chat screen to put inside <Phone>. Data-driven: messages, people, scroll keyframes,
 * emphasis, header title (plain or animated with editText()) and an optional overlay (e.g. <MemberSheet>).
 */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

export const CHAT_LAYOUT = (() => {
  const headerTop = 60;
  const headerH = 110;
  const listTop = headerTop + headerH;
  const inputH = 100;
  return { headerTop, headerH, listTop, inputH, viewH: SCREEN.h - listTop - inputH };
})();

/** Screen-space point of the header title — target for an in-place zoom. */
export const CHAT_TITLE_ANCHOR = { x: 250, y: CHAT_LAYOUT.headerTop + 40 };

const lines = (t: string) => (Array.from(t).length > 13 ? 2 : 1);
export const chatRowHeight = (m: ChatMessage): number => {
  switch (m.kind) {
    case "date":
      return 64;
    case "system":
      return 62;
    case "text":
      return 44 + lines(m.text) * 40 + 34;
    case "code":
      return 44 + 230;
    case "link":
      return 44 + 190;
    case "sticker":
      return 44 + 200;
    case "voice":
      return 44 + 80 + 20;
  }
};

const appearT = (m: ChatMessage, f: number) => (m.at === undefined ? 1 : interpolate(f, [m.at, m.at + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));

const layoutAt = (messages: ChatMessage[], f: number) => {
  let y = 0;
  const rows = messages.map((m) => {
    const h = chatRowHeight(m) * appearT(m, f);
    const r = { m, y, h };
    y += h;
    return r;
  });
  return { rows, total: y + 24 };
};

export const chatScrollAt = (messages: ChatMessage[], keys: ChatScrollKey[], f: number) => {
  const bottom = (ff: number) => Math.min(0, CHAT_LAYOUT.viewH - layoutAt(messages, ff).total);
  const rowTop = (id: string, ff: number) => layoutAt(messages, ff).rows.find((r) => r.m.id === id)?.y ?? 0;
  const target = (k: ChatScrollKey, ff: number) => {
    if (k.to === "bottom") return bottom(ff);
    if (k.to === "top") return 0;
    const v = -rowTop(k.to.id, ff) + (k.to.offset ?? 120);
    return k.to.notPastBottom ? Math.max(bottom(ff), v) : v;
  };
  let v = bottom(f);
  for (const k of keys) {
    if (f < k.at) break;
    const t = interpolate(f, [k.at, k.at + k.dur], [0, 1], { ...clamp, easing: ease });
    v = v + (target(k, f) - v) * t;
  }
  return v;
};

/* ───────── message pieces ───────── */
const Bubble: React.FC<{ me: boolean; children: React.ReactNode; pad?: string }> = ({ me, children, pad = "14px 20px" }) => (
  <div style={{ position: "relative", maxWidth: 340, padding: pad, borderRadius: 22, borderTopLeftRadius: me ? 22 : 6, borderTopRightRadius: me ? 6 : 22, backgroundColor: me ? CHAT_THEME.bubbleMe : CHAT_THEME.bubbleOther, boxShadow: "0 1px 1.5px rgba(60,40,20,0.12)", fontFamily: FONT.zh, fontSize: 26, lineHeight: 1.45, color: INK.ink }}>
    {children}
  </div>
);

const KEYWORDS = /(\b(?:function|const|let|return|import|export|from|await|async|if|else)\b|\b[a-zA-Z_]+(?=\()|\(\d+\)|<\/?[a-z]+>|"[^"]*"|'[^']*'|\/\/.*$)/;
const tokenColor = (tok: string) => {
  if (/^(function|const|let|return|import|export|from|await|async|if|else)$/.test(tok)) return "#C792EA";
  if (/^\(\d+\)$/.test(tok)) return "#F78C6C";
  if (/^<\/?[a-z]+>$/.test(tok)) return "#FF5370";
  if (/^["']/.test(tok)) return "#C3E88D";
  if (/^\/\//.test(tok)) return "#697098";
  if (/^[a-zA-Z_]+$/.test(tok)) return "#82AAFF";
  return "#D6DEEB";
};

const Code: React.FC<{ lines: string[] }> = ({ lines: ls }) => (
  <div style={{ backgroundColor: "#1D2130", borderRadius: 12, padding: "14px 16px", fontFamily: "Menlo, monospace", fontSize: 18, lineHeight: 1.6, whiteSpace: "pre" }}>
    {ls.map((l, i) => (
      <div key={i}>
        {l.split(new RegExp(KEYWORDS.source, "g")).map((tok, j) => (
          <span key={j} style={{ color: tokenColor(tok) }}>{tok}</span>
        ))}
      </div>
    ))}
  </div>
);

const Voice: React.FC<{ secs: number; f: number }> = ({ secs, f }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, width: 260 }}>
    <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: INK.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="16" height="18" viewBox="0 0 16 18"><path d="M2 1 L15 9 L2 17 Z" fill="#fff" /></svg>
    </div>
    <svg width="150" height="40" viewBox="0 0 150 40">
      {new Array(24).fill(0).map((_, i) => {
        const h = 6 + random(`wave-${i}`) * 28 * (0.85 + 0.15 * Math.sin(f / 6 + i));
        return <rect key={i} x={i * 6.2} y={20 - h / 2} width={3.6} height={h} rx={1.8} fill={i < 9 ? INK.ink : "#B8B1A6"} />;
      })}
    </svg>
    <span style={{ fontFamily: FONT.ui, fontSize: 20, color: CHAT_THEME.meta, fontVariantNumeric: "tabular-nums" }}>0:{String(secs).padStart(2, "0")}</span>
  </div>
);

const Row: React.FC<{ m: ChatMessage; f: number; dim: number; hi: number; people: Record<string, ChatPerson>; me: string }> = ({ m, f, dim, hi, people, me: meId }) => {
  if (m.kind === "date" || m.kind === "system") {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: m.kind === "date" ? 14 : 12 }}>
        <span style={{ fontFamily: FONT.zh, fontSize: 19, color: "#7D776D", padding: "6px 16px", borderRadius: 12, backgroundColor: m.kind === "date" ? "rgba(120,105,85,0.12)" : "rgba(255,255,255,0.55)" }}>{m.text}</span>
      </div>
    );
  }
  const me = m.who === meId;
  const person = people[m.who];
  const pop = m.at === undefined ? 1 : spring({ frame: f - m.at, fps: 30, config: { damping: 14, stiffness: 180 } });
  let body: React.ReactNode = null;
  if (m.kind === "text") {
    body = (
      <Bubble me={me}>
        <span style={{ backgroundImage: hi > 0 ? `linear-gradient(98deg, ${INK.highlighter} ${hi * 100}%, transparent ${hi * 100}%)` : undefined, backgroundSize: "100% 60%", backgroundPosition: "0 80%", backgroundRepeat: "no-repeat" }}>{m.text}</span>
      </Bubble>
    );
  } else if (m.kind === "code") {
    body = (
      <Bubble me={me} pad="12px 14px">
        <Code lines={m.lines} />
        {m.caption ? <div style={{ marginTop: 8, marginLeft: 4 }}>{m.caption}</div> : null}
      </Bubble>
    );
  } else if (m.kind === "link") {
    body = (
      <Bubble me={me} pad="14px 14px 14px 18px">
        <div style={{ display: "flex", gap: 14, alignItems: "center", width: 330 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 24, lineHeight: 1.35 }}>{m.title}</div>
            <div style={{ fontFamily: FONT.ui, fontSize: 17, color: CHAT_THEME.meta, marginTop: 8 }}>{m.domain}</div>
          </div>
          {m.thumb}
        </div>
      </Bubble>
    );
  } else if (m.kind === "sticker") {
    body = m.node;
  } else if (m.kind === "voice") {
    body = (
      <Bubble me={me} pad="14px 18px">
        <Voice secs={m.secs} f={f} />
      </Bubble>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: me ? "row-reverse" : "row", gap: 12, padding: "10px 20px 0", opacity: 1 - dim * 0.6, transform: `scale(${(0.6 + 0.4 * pop) * (1 + hi * 0.08)})`, transformOrigin: me ? "right top" : "left top", filter: dim > 0 ? `saturate(${1 - dim * 0.5})` : undefined }}>
      <Avatar a={person.avatar} size={58} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: me ? "flex-end" : "flex-start" }}>
        {me ? null : <div style={{ fontFamily: FONT.zh, fontSize: 19, color: person.color, fontWeight: 600, marginBottom: 6, marginLeft: 4 }}>{person.name}</div>}
        {body}
      </div>
    </div>
  );
};

/* ───────── header title editing ───────── */
export type TitleEdit = { tapAt: number; deleteAt: number; typeAt: number; doneAt: number; from: string; to: string; delEvery?: number; typeEvery?: number };

/** In-place rename: tap → delete old title → type new title → check mark. Use as ChatApp `titleEdit`. */
export const editTitle = (f: number, e: TitleEdit) => {
  const del = e.delEvery ?? 5;
  const typ = e.typeEvery ?? 9.5;
  const oldC = Array.from(e.from);
  const newC = Array.from(e.to);
  let text: string;
  if (f < e.deleteAt) text = e.from;
  else if (f < e.typeAt) text = oldC.slice(0, Math.max(0, oldC.length - Math.floor((f - e.deleteAt) / del))).join("");
  else text = newC.slice(0, Math.min(newC.length, Math.floor((f - e.typeAt) / typ) + 1)).join("");
  const editing = f >= e.tapAt && f < e.doneAt + 12;
  return {
    text,
    caret: editing && Math.floor(f / 8) % 2 === 0,
    editP: interpolate(f, [e.tapAt, e.tapAt + 8, e.doneAt + 4, e.doneAt + 14], [0, 1, 1, 0], clamp),
    tap: interpolate(f, [e.tapAt - 4, e.tapAt + 14], [0, 1], clamp),
    done: interpolate(f, [e.doneAt, e.doneAt + 6, e.doneAt + 30, e.doneAt + 40], [0, 1, 1, 0], clamp),
  };
};

const Header: React.FC<{ f: number; title: string; titleEdit?: TitleEdit; subtitle: string; group: string[] }> = ({ f, title, titleEdit, subtitle, group }) => {
  const e = titleEdit ? editTitle(f, titleEdit) : { text: title, caret: false, editP: 0, tap: 0, done: 0 };
  const L = CHAT_LAYOUT;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: L.listTop, backgroundColor: CHAT_THEME.header, borderBottom: "1.5px solid rgba(80,60,40,0.10)", zIndex: 4 }}>
      <StatusBar />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.headerTop, height: L.headerH, display: "flex", alignItems: "center", padding: "0 22px", gap: 14 }}>
        <svg width="22" height="34" viewBox="0 0 22 34"><path d="M18 4 L5 17 L18 30" stroke={INK.ink} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <GroupAvatar size={68} ids={group} />
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          {e.tap > 0 && e.tap < 1 ? <div style={{ position: "absolute", left: 60 - 80 * e.tap, top: 20 - 80 * e.tap, width: 160 * e.tap, height: 160 * e.tap, borderRadius: "50%", backgroundColor: `rgba(61,220,151,${0.25 * (1 - e.tap)})` }} /> : null}
          <div style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", margin: "0 -10px", borderRadius: 10, backgroundColor: `rgba(61,220,151,${0.16 * e.editP})`, boxShadow: e.editP > 0 ? `inset 0 -3px 0 rgba(61,220,151,${0.9 * e.editP})` : undefined }}>
            <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 30, color: INK.ink, whiteSpace: "nowrap" }}>{e.text}</span>
            <span style={{ width: 3, height: 32, marginLeft: 2, backgroundColor: CHAT_THEME.accent, opacity: e.caret ? 1 : 0 }} />
            {e.done > 0 ? (
              <svg width="30" height="30" viewBox="0 0 30 30" style={{ marginLeft: 8, opacity: e.done, transform: `scale(${0.6 + 0.4 * e.done})` }}>
                <circle cx="15" cy="15" r="14" fill={CHAT_THEME.accent} />
                <path d="M8 15 L13 20 L22 10" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
          <div style={{ fontFamily: FONT.zh, fontSize: 19, color: CHAT_THEME.meta, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{subtitle}</div>
        </div>
        <svg width="34" height="10" viewBox="0 0 34 10">{[5, 17, 29].map((x) => <circle key={x} cx={x} cy={5} r={4} fill={INK.ink} />)}</svg>
      </div>
    </div>
  );
};

const InputBar: React.FC<{ placeholder: string }> = ({ placeholder }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: CHAT_LAYOUT.inputH, backgroundColor: CHAT_THEME.header, borderTop: "1.5px solid rgba(80,60,40,0.10)", display: "flex", alignItems: "flex-start", padding: "16px 20px 0", gap: 14, boxSizing: "border-box", zIndex: 4 }}>
    <div style={{ width: 44, height: 44, borderRadius: 22, border: `3px solid ${INK.ink}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1 V15 M1 8 H15" stroke={INK.ink} strokeWidth="3" strokeLinecap="round" /></svg>
    </div>
    <div style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: "#fff", fontFamily: FONT.ui, fontSize: 20, color: "#B4ADA2", display: "flex", alignItems: "center", paddingLeft: 20 }}>{placeholder}</div>
    <svg width="30" height="44" viewBox="0 0 30 44"><rect x="9" y="6" width="12" height="22" rx="6" fill={INK.ink} /><path d="M3 22 A12 12 0 0 0 27 22 M15 34 V40" stroke={INK.ink} strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
  </div>
);

export type ChatAppProps = {
  f: number;
  messages: ChatMessage[];
  people: Record<string, ChatPerson>;
  /** id of the phone owner (bubbles on the right, no name). */
  me: string;
  title: string;
  /** Animate a rename of the title in place. */
  titleEdit?: TitleEdit;
  subtitle: string;
  /** 4 person ids for the 2×2 group avatar. */
  group: string[];
  scroll?: ChatScrollKey[];
  emphasis?: ChatEmphasis;
  placeholder?: string;
  /** Rendered over the message list inside the screen, e.g. <MemberSheet>. */
  overlay?: React.ReactNode;
};

export const ChatApp: React.FC<ChatAppProps> = ({ f, messages, people, me, title, titleEdit, subtitle, group, scroll = [], emphasis, placeholder = "Message", overlay }) => {
  const { rows } = layoutAt(messages, f);
  const y = chatScrollAt(messages, scroll, f);
  const blur = Math.min(10, Math.abs(y - chatScrollAt(messages, scroll, f - 1)) / 9);
  const L = CHAT_LAYOUT;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CHAT_THEME.bg }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(rgba(120,100,70,0.13) 1.6px, transparent 1.7px)", backgroundSize: "26px 26px" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.listTop, height: L.viewH, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${y}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
          {rows.map(({ m, y: ry, h }) => {
            const e = emphasis ? emphasis(m.id, m.kind, f) : {};
            return (
              <div key={m.id} style={{ position: "absolute", left: 0, right: 0, top: ry, height: h, overflow: h < chatRowHeight(m) - 1 ? "hidden" : "visible", transform: e.scale ? `scale(${e.scale})` : undefined, transformOrigin: "120px 50%" }}>
                <Row m={m} f={f} dim={e.dim ?? 0} hi={e.hi ?? 0} people={people} me={me} />
              </div>
            );
          })}
        </div>
      </div>
      <Header f={f} title={title} titleEdit={titleEdit} subtitle={subtitle} group={group} />
      <InputBar placeholder={placeholder} />
      {overlay}
    </div>
  );
};

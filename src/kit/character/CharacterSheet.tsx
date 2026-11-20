import React from "react";
import { AbsoluteFill } from "remotion";
import { Paper } from "../Paper";
import { FONT, INK, shadow } from "../tokens";
import { Mushi, type MushiExpression, type MushiPalette } from "./Mushi";

const EXPRESSIONS: { e: MushiExpression; zh: string; talking?: boolean }[] = [
  { e: "neutral", zh: "平静 · 说话", talking: true },
  { e: "smile", zh: "微笑" },
  { e: "grin", zh: "开心" },
  { e: "think", zh: "思考" },
  { e: "surprised", zh: "惊讶" },
  { e: "worried", zh: "担心" },
];

// Same character re-coloured for two hypothetical episode palettes.
const ALT_PALETTES: { name: string; p: Partial<MushiPalette>; bg: string }[] = [
  { name: "night episode", p: { shirt: "#2E3A66", shirtShade: "#222B4E", accent: "#7FD4FF" }, bg: "#141A33" },
  { name: "sunny episode", p: { shirt: "#36D6A4", shirtShade: "#26B386", accent: "#FF6B57" }, bg: "#FFD24A" },
];

const Label: React.FC<{ en: string; zh: string }> = ({ en, zh }) => (
  <div style={{ textAlign: "center", marginTop: 6 }}>
    <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: INK.muted, textTransform: "uppercase" }}>{en}</div>
    <div style={{ fontFamily: FONT.zh, fontSize: 24, color: INK.ink }}>{zh}</div>
  </div>
);

export const CharacterSheet: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div style={{ position: "absolute", left: 100, top: 150 }}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: INK.muted }}>ENGLISH JOURNAL · CHARACTER</div>
      <div style={{ fontFamily: FONT.serif, fontWeight: 800, fontSize: 84, color: INK.ink, lineHeight: 1.05 }}>张木示</div>
      <div style={{ fontFamily: FONT.hand, fontSize: 40, color: INK.redpen, transform: "rotate(-3deg)", marginTop: 4 }}>
        glasses always on, hair never tidy
      </div>
    </div>

    {/* expressions grid */}
    <div style={{ position: "absolute", left: 70, top: 440, width: 940, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 30 }}>
      {EXPRESSIONS.map(({ e, zh, talking }, i) => (
        <div key={e} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 270, height: 270, borderRadius: 135, overflow: "hidden", backgroundColor: INK.white, boxShadow: shadow(1), display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
            <Mushi expression={e} talking={talking} seed={`sheet-${i}`} width={290} style={{ marginBottom: -14 }} />
          </div>
          <Label en={e} zh={zh} />
        </div>
      ))}
    </div>

    {/* poses */}
    <div style={{ position: "absolute", left: 70, top: 1180, width: 940, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 290, height: 330, borderRadius: 28, overflow: "hidden", background: "linear-gradient(#FFE8B8, #FFD889)", boxShadow: shadow(1), display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <Mushi pose="wave" expression="grin" seed="wave" width={280} />
        </div>
        <Label en="wave" zh="打招呼" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 290, height: 330, borderRadius: 28, overflow: "hidden", background: "linear-gradient(#DCE6FF, #C3D2FF)", boxShadow: shadow(1), display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <Mushi pose="desk" expression="think" seed="desk" width={270} />
        </div>
        <Label en="desk" zh="写代码" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ALT_PALETTES.map(({ name, p, bg }) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 290, height: 140, borderRadius: 24, overflow: "hidden", backgroundColor: bg, boxShadow: shadow(1), display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <Mushi palette={p} expression="smile" seed={name} width={170} style={{ marginBottom: -30 }} />
            </div>
            <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: INK.muted, marginTop: 4, textTransform: "uppercase" }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);

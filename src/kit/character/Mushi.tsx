import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";

/**
 * 张木示 flat-vector character. Series constant (SERIES.md §1.4):
 * black messy hair swept to one side, thick black square glasses, white tee.
 * Colours follow the episode palette through `palette`; the silhouette never changes.
 */

export type MushiExpression = "neutral" | "smile" | "grin" | "think" | "surprised" | "worried";
export type MushiPose = "bust" | "wave" | "desk";

export type MushiPalette = {
  skin: string;
  skinShade: string;
  hair: string;
  hairLight: string;
  frame: string;
  shirt: string;
  shirtShade: string;
  blush: string;
  accent: string; // laptop / props
};

export const MUSHI_DEFAULT: MushiPalette = {
  skin: "#F6C8A4",
  skinShade: "#E5A781",
  hair: "#1E1B24",
  hairLight: "#3B3646",
  frame: "#17151B",
  shirt: "#FFFBF3",
  shirtShade: "#E4DACB",
  blush: "#F2928A",
  accent: "#2F6BFF",
};

type Props = {
  expression?: MushiExpression;
  pose?: MushiPose;
  /** Mouth moves while true. */
  talking?: boolean;
  /** Look direction, -1 (left) … 1 (right). */
  look?: number;
  palette?: Partial<MushiPalette>;
  /** Changes blink timing so several characters don't blink in sync. */
  seed?: string;
  width?: number;
  style?: React.CSSProperties;
};

const VB_W = 400;

const FACE =
  "M122 196 C122 138 160 112 202 112 C246 112 282 138 282 196 L280 252 C276 302 242 332 202 332 C162 332 126 302 124 252 Z";

// Silhouette: left temple → crown → right side, then the fringe edge in rounded clumps
// whose tips point down-left (swept fringe), back to the left temple.
const HAIR =
  "M118 230 C104 170 120 110 178 88 C204 70 250 72 272 92 C300 114 304 164 290 216 L283 218 " +
  "C282 192 276 174 264 162 Q254 178 238 182 Q242 166 230 156 Q216 178 194 186 Q200 170 190 160 " +
  "Q172 184 146 190 Q156 176 158 166 Q138 182 130 210 L127 230 Z";
const VB_H = 440;

const useBlink = (seed: string) => {
  const f = useCurrentFrame();
  // A blink roughly every 2.5–4.5s, lasting 6 frames.
  let t = 0;
  let i = 0;
  while (t <= f) {
    const gap = 75 + Math.floor(random(`${seed}-blink-${i}`) * 60);
    if (f >= t && f < t + 6 && i > 0) {
      const k = f - t;
      return k < 3 ? 1 - k / 3 : (k - 2) / 4; // close fast, open a bit slower
    }
    t += gap;
    i++;
  }
  return 1;
};

const Brows: React.FC<{ expression: MushiExpression; c: string; halo: string }> = ({ expression, c, halo }) => {
  const lift = { neutral: 0, smile: -3, grin: -5, think: 0, surprised: -12, worried: -4 }[expression];
  const tiltL = { neutral: 0, smile: 0, grin: 2, think: -6, surprised: 0, worried: 8 }[expression];
  const tiltR = { neutral: 0, smile: 0, grin: -2, think: 8, surprised: 0, worried: -8 }[expression];
  const paths = [
    `M140 ${191 + lift + tiltL} Q160 ${182 + lift} 182 ${189 + lift - tiltL}`,
    `M218 ${189 + lift - tiltR} Q240 ${182 + lift} 260 ${191 + lift + tiltR}`,
  ];
  return (
    <g fill="none" strokeLinecap="round">
      {paths.map((d) => (
        <path key={`h${d}`} d={d} stroke={halo} strokeWidth={16} />
      ))}
      {paths.map((d) => (
        <path key={d} d={d} stroke={c} strokeWidth={9} />
      ))}
    </g>
  );
};

const Mouth: React.FC<{ expression: MushiExpression; open: number }> = ({ expression, open }) => {
  const cx = 200;
  const cy = 292;
  if (expression === "surprised") {
    const r = 9 + open * 4;
    return <ellipse cx={cx} cy={cy + 2} rx={r * 0.8} ry={r} fill="#5A2630" />;
  }
  if (expression === "think") {
    return <path d={`M${cx - 14} ${cy + 2} Q${cx} ${cy - 3} ${cx + 16} ${cy - 4}`} stroke="#5A2630" strokeWidth={6} fill="none" strokeLinecap="round" />;
  }
  if (expression === "worried" && open < 0.15) {
    return <path d={`M${cx - 16} ${cy + 4} Q${cx} ${cy - 6} ${cx + 16} ${cy + 4}`} stroke="#5A2630" strokeWidth={6} fill="none" strokeLinecap="round" />;
  }
  const smile = expression === "grin" ? 1 : expression === "smile" ? 0.7 : expression === "worried" ? 0 : 0.35;
  const w = 20 + smile * 8;
  const h = 4 + open * 16 + (expression === "grin" ? 10 : 0);
  if (h < 7) {
    return <path d={`M${cx - w} ${cy} Q${cx} ${cy + 8 + smile * 8} ${cx + w} ${cy}`} stroke="#5A2630" strokeWidth={6} fill="none" strokeLinecap="round" />;
  }
  // Open mouth: dark cavity, teeth strip, tongue.
  const d = `M${cx - w} ${cy - 2} Q${cx} ${cy + 2} ${cx + w} ${cy - 2} Q${cx + w * 0.7} ${cy + h} ${cx} ${cy + h} Q${cx - w * 0.7} ${cy + h} ${cx - w} ${cy - 2} Z`;
  return (
    <g>
      <defs>
        <clipPath id="mushi-mouth">
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="#5A2630" />
      <g clipPath="url(#mushi-mouth)">
        <rect x={cx - w} y={cy - 4} width={w * 2} height={6 + smile * 2} fill="#FFFDF8" />
        <ellipse cx={cx + 3} cy={cy + h + 2} rx={w * 0.6} ry={h * 0.45} fill="#E06D6D" />
      </g>
    </g>
  );
};

const Head: React.FC<{ p: MushiPalette; expression: MushiExpression; talking: boolean; look: number; seed: string }> = ({
  p,
  expression,
  talking,
  look,
  seed,
}) => {
  const f = useCurrentFrame();
  const blink = useBlink(seed);
  // Talking: pseudo-random syllables ~ every 3–4 frames.
  const syl = Math.floor(f / 3.5);
  const open = talking ? 0.25 + 0.75 * random(`${seed}-syl-${syl}`) * (random(`${seed}-gap-${Math.floor(f / 14)}`) > 0.15 ? 1 : 0.1) : 0;
  const eyeX = look * 5;
  const eyeOpen = expression === "surprised" ? 1.2 : expression === "grin" ? 0.55 : 1;

  return (
    <g>
      {/* ears */}
      <ellipse cx={118} cy={238} rx={15} ry={23} fill={p.skin} />
      <ellipse cx={120} cy={240} rx={7} ry={13} fill={p.skinShade} />
      <ellipse cx={284} cy={238} rx={15} ry={23} fill={p.skinShade} />
      <ellipse cx={282} cy={240} rx={7} ry={13} fill={p.skin} opacity={0.6} />

      {/* face */}
      <path d={FACE} fill={p.skin} />
      {/* core shadow on the far (right) side — key light is top-left */}
      <path d="M282 196 L280 252 C276 302 242 332 202 332 C232 318 256 290 262 246 C266 214 268 190 282 196 Z" fill={p.skinShade} opacity={0.75} />
      {/* hair cast shadow on forehead: the hair shape itself, offset by the top-left light, clipped to the face */}
      <defs>
        <clipPath id={`mushi-face-${seed}`}>
          <path d={FACE} />
        </clipPath>
      </defs>
      <g clipPath={`url(#mushi-face-${seed})`}>
        <path d={HAIR} fill={p.skinShade} opacity={0.6} transform="translate(7 11)" />
      </g>

      {/* blush */}
      <ellipse cx={148} cy={276} rx={17} ry={9} fill={p.blush} opacity={expression === "worried" ? 0.2 : 0.45} />
      <ellipse cx={254} cy={276} rx={17} ry={9} fill={p.blush} opacity={expression === "worried" ? 0.2 : 0.45} />

      {/* nose */}
      <path d="M204 246 C208 258 212 266 204 270" stroke={p.skinShade} strokeWidth={5} fill="none" strokeLinecap="round" />

      {/* eyes */}
      <g transform={`translate(${eyeX} 0)`}>
        {[162, 238].map((x) => (
          <g key={x} transform={`translate(${x} 230) scale(1 ${Math.max(0.08, blink * eyeOpen)})`}>
            <ellipse cx={0} cy={0} rx={7.5} ry={9.5} fill="#1A1820" />
            <circle cx={2.6} cy={-3.4} r={2.6} fill="#fff" />
          </g>
        ))}
      </g>

      {/* glasses: thick square frames, lens tint, glints */}
      <g>
        <rect x={130} y={204} width={64} height={52} rx={13} fill="rgba(255,255,255,0.22)" stroke={p.frame} strokeWidth={8} />
        <rect x={206} y={204} width={64} height={52} rx={13} fill="rgba(255,255,255,0.22)" stroke={p.frame} strokeWidth={8} />
        <path d="M194 220 Q200 214 206 220" stroke={p.frame} strokeWidth={7} fill="none" />
        <path d="M130 216 L118 212" stroke={p.frame} strokeWidth={7} strokeLinecap="round" />
        <path d="M270 216 L282 212" stroke={p.frame} strokeWidth={7} strokeLinecap="round" />
        {/* frame highlight */}
        <path d="M138 208 L170 208" stroke="#fff" strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M214 208 L246 208" stroke="#fff" strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" />
        {/* lens glints */}
        <path d="M176 214 L184 222" stroke="#fff" strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
        <path d="M252 214 L260 222" stroke="#fff" strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
      </g>

      <Mouth expression={expression} open={open} />

      {/* hair: soft volume on top, fringe in clumps swept toward the viewer's left */}
      <path d={HAIR} fill={p.hair} />
      {/* a few loose strands */}
      <g stroke={p.hair} strokeWidth={9} fill="none" strokeLinecap="round">
        <path d="M196 86 Q188 64 206 52" />
        <path d="M228 82 Q240 64 258 68" />
        <path d="M150 178 Q140 196 142 212" strokeWidth={7} />
      </g>
      {/* sheen following the sweep */}
      <path d="M158 112 C186 92 228 90 258 106" stroke={p.hairLight} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M214 132 C200 146 186 156 168 164" stroke={p.hairLight} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M262 140 C256 150 248 158 238 164" stroke={p.hairLight} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* brows sit on top of the fringe so expressions stay readable */}
      <Brows expression={expression} c={p.hair} halo={p.skin} />
    </g>
  );
};

const Shirt: React.FC<{ p: MushiPalette }> = ({ p }) => (
  <g>
    {/* neck */}
    <path d="M172 300 L228 300 L232 356 L168 356 Z" fill={p.skin} />
    <path d="M172 300 L228 300 L229 322 C214 332 186 332 171 322 Z" fill={p.skinShade} />
    {/* torso */}
    <path d="M44 440 C52 384 96 356 160 346 L240 346 C304 356 348 384 356 440 Z" fill={p.shirt} />
    {/* far-side shade + folds */}
    <path d="M240 346 C304 356 348 384 356 440 L290 440 C300 410 288 380 252 360 Z" fill={p.shirtShade} />
    <path d="M110 440 C112 414 120 398 132 386" stroke={p.shirtShade} strokeWidth={5} fill="none" strokeLinecap="round" />
    {/* crew neck rib */}
    <path d="M160 346 C176 372 224 372 240 346" stroke={p.shirtShade} strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

export const Mushi: React.FC<Props> = ({
  expression = "neutral",
  pose = "bust",
  talking = false,
  look = 0,
  palette,
  seed = "mushi",
  width = 400,
  style,
}) => {
  const f = useCurrentFrame();
  const p = { ...MUSHI_DEFAULT, ...palette };
  // Idle life: breathing and a slow head sway.
  const breathe = Math.sin(f / 22) * 2.2;
  const sway = Math.sin(f / 37 + 1) * 1.6 + (expression === "think" ? -5 : 0);
  const wave = Math.sin(f / 4.5) * 14;

  const desk = pose === "desk";
  const vbH = desk ? 520 : VB_H;

  return (
    <svg viewBox={`0 0 ${VB_W} ${vbH}`} width={width} height={(width * vbH) / VB_W} style={{ overflow: "visible", ...style }}>
      <g transform={`translate(0 ${breathe * 0.4})`}>
        <Shirt p={p} />
      </g>

      {pose === "wave" ? (
        <g transform={`rotate(${wave - 8} 318 372)`}>
          {/* raised forearm + hand */}
          <path d="M300 380 C320 340 330 300 336 262" stroke={p.shirt} strokeWidth={46} strokeLinecap="round" fill="none" />
          <path d="M318 330 C326 304 332 286 336 262" stroke={p.skin} strokeWidth={34} strokeLinecap="round" fill="none" />
          <ellipse cx={338} cy={238} rx={27} ry={31} fill={p.skin} />
          <path d="M322 214 L320 196 M336 208 L336 188 M350 212 L352 194" stroke={p.skin} strokeWidth={11} strokeLinecap="round" />
          <path d="M354 236 C362 240 364 252 358 262" stroke={p.skinShade} strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* motion ticks */}
          <path d="M378 214 L392 206 M380 238 L396 238" stroke={p.hair} strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : null}

      <g transform={`translate(0 ${breathe}) rotate(${sway} 200 320)`}>
        <Head p={p} expression={expression} talking={talking} look={look} seed={seed} />
      </g>

      {desk ? <Desk p={p} /> : null}
    </svg>
  );
};

const Desk: React.FC<{ p: MushiPalette }> = ({ p }) => {
  const f = useCurrentFrame();
  const typeL = Math.abs(Math.sin(f / 2.6)) * 6;
  const typeR = Math.abs(Math.sin(f / 2.6 + 1.7)) * 6;
  const glow = interpolate(Math.sin(f / 18), [-1, 1], [0.35, 0.6]);
  return (
    <g>
      {/* desk */}
      <rect x={-40} y={440} width={480} height={80} fill="#3A3355" />
      <rect x={-40} y={440} width={480} height={10} fill="#4C4470" />
      {/* hands typing */}
      <ellipse cx={142} cy={438 - typeL} rx={30} ry={16} fill={p.skin} />
      <ellipse cx={258} cy={438 - typeR} rx={30} ry={16} fill={p.skin} />
      {/* laptop back */}
      <path d="M96 444 L118 336 L282 336 L304 444 Z" fill="#23202E" />
      <path d="M118 336 L282 336 L280 346 L120 346 Z" fill="#35314A" />
      <circle cx={200} cy={392} r={11} fill={p.accent} opacity={glow + 0.3} />
      <circle cx={200} cy={392} r={22} fill={p.accent} opacity={glow * 0.25} />
      <rect x={84} y={440} width={232} height={10} rx={4} fill="#4A4560" />
    </g>
  );
};

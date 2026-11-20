import React from "react";

/**
 * Cartoon member avatars — same flat language as the Mushi character
 * (flat fills, far-side shade, blush), varied by hair, colour and accessories.
 */
export type AvatarSpec = {
  bg: string;
  skin: string;
  hair: string;
  style: "short" | "bob" | "bun" | "curly" | "cap" | "mushi" | "long";
  glasses?: boolean;
  beard?: boolean;
};

export const MEMBERS: Record<string, { name: string; color: string; a: AvatarSpec }> = {
  mushi: { name: "张木示", color: "#2E7D5B", a: { bg: "#FFD84D", skin: "#F6C8A4", hair: "#1E1B24", style: "mushi", glasses: true } },
  lin: { name: "小林", color: "#C2543A", a: { bg: "#FFB59E", skin: "#F3C29E", hair: "#3A2A22", style: "bob" } },
  jie: { name: "阿杰", color: "#3559C7", a: { bg: "#A9C3FF", skin: "#E9B48D", hair: "#18161C", style: "short", beard: true } },
  momo: { name: "Momo", color: "#8A45B8", a: { bg: "#E2C6FF", skin: "#F7D0B4", hair: "#6B3A2A", style: "bun", glasses: true } },
  kai: { name: "Kai", color: "#1F8A8A", a: { bg: "#9EE6D6", skin: "#D9A07A", hair: "#22201F", style: "cap" } },
  yue: { name: "月月", color: "#B8456E", a: { bg: "#FFC7D9", skin: "#F8D3BC", hair: "#2B2125", style: "long" } },
  hao: { name: "浩子", color: "#7A6A1E", a: { bg: "#F4E3A1", skin: "#EDBB93", hair: "#2A221E", style: "curly", glasses: true } },
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c.join(",")})`;
};

export const Avatar: React.FC<{ a: AvatarSpec; size: number; grey?: number; style?: React.CSSProperties }> = ({
  a,
  size,
  grey = 0,
  style,
}) => {
  const skinShade = shade(a.skin, 0.88);
  const hairLight = shade(a.hair, 1.6);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ borderRadius: "50%", filter: grey ? `grayscale(${grey}) opacity(${1 - grey * 0.45})` : undefined, ...style }}>
      <defs>
        <clipPath id={`av-${a.style}-${a.bg}`}>
          <circle cx={50} cy={50} r={50} />
        </clipPath>
      </defs>
      <g clipPath={`url(#av-${a.style}-${a.bg})`}>
        <rect width={100} height={100} fill={a.bg} />
        <circle cx={78} cy={18} r={30} fill="#fff" opacity={0.18} />
        {/* back hair for long styles */}
        {a.style === "long" || a.style === "bob" ? <path d="M22 50 C20 22 80 22 78 50 L80 86 L20 86 Z" fill={a.hair} /> : null}
        {/* shoulders */}
        <path d="M14 104 C16 84 32 76 50 76 C68 76 84 84 86 104 Z" fill={shade(a.bg, 0.72)} />
        <path d="M43 70 L57 70 L58 80 C54 83 46 83 42 80 Z" fill={skinShade} />
        {/* face */}
        <path d="M30 46 C30 30 40 24 50 24 C61 24 70 30 70 46 L69 56 C67 68 59 74 50 74 C41 74 33 68 31 56 Z" fill={a.skin} />
        <path d="M70 46 L69 56 C67 68 59 74 50 74 C58 70 63 62 64 54 C65 48 66 44 70 46 Z" fill={skinShade} />
        <ellipse cx={38} cy={60} rx={4.5} ry={2.5} fill="#F2928A" opacity={0.45} />
        <ellipse cx={62} cy={60} rx={4.5} ry={2.5} fill="#F2928A" opacity={0.45} />
        <ellipse cx={42} cy={52} rx={2.2} ry={2.8} fill="#1A1820" />
        <ellipse cx={58} cy={52} rx={2.2} ry={2.8} fill="#1A1820" />
        <path d="M45 64 Q50 67 55 64" stroke="#5A2630" strokeWidth={2} fill="none" strokeLinecap="round" />
        {a.beard ? <path d="M36 60 C38 72 46 75 50 75 C54 75 62 72 64 60 C60 66 56 68 50 68 C44 68 40 66 36 60 Z" fill={a.hair} opacity={0.85} /> : null}
        {a.glasses ? (
          <g fill="rgba(255,255,255,0.25)" stroke="#17151B" strokeWidth={2.6}>
            <rect x={34} y={46} width={14} height={11} rx={3} />
            <rect x={52} y={46} width={14} height={11} rx={3} />
            <path d="M48 50 L52 50" fill="none" />
          </g>
        ) : null}
        {/* hair */}
        {a.style === "mushi" ? (
          <path d="M28 52 C24 34 32 18 48 15 C58 12 72 16 74 30 C76 40 74 48 72 52 C70 44 68 40 64 37 Q60 42 55 43 Q56 39 53 37 Q48 43 42 44 Q44 40 43 38 Q36 42 32 50 Z" fill={a.hair} />
        ) : null}
        {a.style === "short" ? <path d="M29 48 C27 30 38 20 52 20 C64 20 73 28 71 48 C68 38 62 33 50 33 C40 33 33 38 29 48 Z" fill={a.hair} /> : null}
        {a.style === "bob" ? <path d="M27 54 C24 30 38 20 50 20 C64 20 76 30 73 54 C70 44 64 34 52 33 C46 40 36 44 27 54 Z" fill={a.hair} /> : null}
        {a.style === "long" ? <path d="M28 50 C26 28 40 20 50 20 C62 20 74 28 72 50 C66 40 60 33 50 32 C42 34 34 40 28 50 Z" fill={a.hair} /> : null}
        {a.style === "bun" ? (
          <g fill={a.hair}>
            <circle cx={50} cy={14} r={9} />
            <path d="M29 48 C27 30 38 22 50 22 C62 22 73 30 71 48 C66 38 60 34 50 34 C40 34 34 38 29 48 Z" />
          </g>
        ) : null}
        {a.style === "curly" ? (
          <g fill={a.hair}>
            {[30, 38, 46, 54, 62, 70].map((x, i) => (
              <circle key={x} cx={x} cy={30 + (i % 2) * 4} r={8} />
            ))}
            <circle cx={28} cy={40} r={6} />
            <circle cx={72} cy={40} r={6} />
          </g>
        ) : null}
        {a.style === "cap" ? (
          <g>
            <path d="M28 42 C28 26 38 18 50 18 C62 18 72 26 72 42 Z" fill="#E8553A" />
            <path d="M48 40 L86 42 C82 46 70 46 60 46 Z" fill={shade("#E8553A", 0.8)} />
            <circle cx={50} cy={18} r={2.5} fill={shade("#E8553A", 0.75)} />
          </g>
        ) : null}
        {a.style !== "cap" && a.style !== "curly" ? <path d="M40 26 C46 22 56 22 62 26" stroke={hairLight} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.7} /> : null}
      </g>
    </svg>
  );
};

/** 2×2 group avatar, like a chat app builds from members. */
export const GroupAvatar: React.FC<{ size: number; ids?: string[] }> = ({ size, ids = ["mushi", "lin", "jie", "momo"] }) => {
  const s = size / 2 - 3;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.24, backgroundColor: "#DCD6CB", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 2, boxSizing: "border-box", overflow: "hidden" }}>
      {ids.map((id) => (
        <Avatar key={id} a={MEMBERS[id].a} size={s} style={{ borderRadius: size * 0.12 }} />
      ))}
    </div>
  );
};

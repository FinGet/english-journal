import React from "react";

/** 104×104 link-card thumbnails (flat, our palette). Pass as ChatMessage `thumb`. */
export const CubeThumb: React.FC = () => (
  <svg width="104" height="104" viewBox="0 0 104 104">
    <rect width="104" height="104" rx="14" fill="#1C2340" />
    <g transform="translate(52 54)">
      <path d="M0 -34 L30 -17 L30 17 L0 34 L-30 17 L-30 -17 Z" fill="#8ED6FB" />
      <path d="M0 -34 L30 -17 L0 0 L-30 -17 Z" fill="#BFE9FF" />
      <path d="M0 0 L30 -17 L30 17 L0 34 Z" fill="#5BB4E8" />
      <path d="M0 -14 L13 -7 L13 7 L0 14 L-13 7 L-13 -7 Z" fill="#1C78C0" />
      <path d="M0 -14 L13 -7 L0 0 L-13 -7 Z" fill="#3D97DA" />
    </g>
  </svg>
);

/** Office buildings with a falling red trend line — news about companies / markets. */
export const NewsThumb: React.FC = () => (
  <svg width="104" height="104" viewBox="0 0 104 104">
    <rect width="104" height="104" rx="14" fill="#FFE2D8" />
    <rect x="16" y="34" width="30" height="56" fill="#3A3F5C" />
    <rect x="46" y="22" width="40" height="68" fill="#4D5478" />
    <rect x="46" y="22" width="8" height="68" fill="#3A3F5C" />
    {[0, 1, 2, 3, 4].map((r) =>
      [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={58 + c * 9} y={30 + r * 11} width={5} height={6} fill={(r + c) % 3 === 0 ? "#FFD84D" : "#7C84AE"} />),
    )}
    {[0, 1, 2, 3].map((r) => <rect key={r} x={22} y={42 + r * 11} width={18} height={5} fill="#5C6386" />)}
    <path d="M14 30 L36 44 L52 38 L86 66" stroke="#E5482D" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M76 66 L88 68 L86 56" stroke="#E5482D" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

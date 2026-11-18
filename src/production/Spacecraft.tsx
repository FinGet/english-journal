import React, { useId } from 'react';

export const Spacecraft: React.FC<{ x: number; y: number; heading: number; power: number; frame: number }> = ({ x, y, heading, power, frame }) => {
  const id = useId().replace(/:/g, '');
  const flame = (30 + power * 90) * (1 + Math.sin(frame * .18) * .06);
  const enginePower = (i: number) => Math.max(0, Math.min(1, (power - i * .18) / .55));
  return <g transform={`translate(${x} ${y}) rotate(${heading})`}>
    <defs><linearGradient id={`${id}-jet`} x1="100%" x2="0%"><stop stopColor="#fff2d8" /><stop offset=".3" stopColor="#edb980" /><stop offset="1" stopColor="#b86b4430" /></linearGradient><linearGradient id={`${id}-hull`} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#d6e3db" /><stop offset=".45" stopColor="#afc3b7" /><stop offset="1" stopColor="#6b8b7a" /></linearGradient></defs>
    {[-21, 0, 21].map((v, i) => <g key={i} opacity={enginePower(i)}>
      <path d={`M-121 ${v - 7}Q${-145 - flame * .3} ${v - 11} ${-136 - flame} ${v}Q${-145 - flame * .3} ${v + 11} -121 ${v + 7}Z`} fill={`url(#${id}-jet)`} />
      <path d={`M-122 ${v - 3}L${-137 - flame * .55} ${v}L-122 ${v + 3}Z`} fill="#fff2d8" opacity={.7} />
    </g>)}
    <path d="M-100-29L-89-66L-39-49L4-20M-100 29L-89 66L-39 49L4 20" fill="#728f7e" stroke="#a8bfb0" strokeWidth={1.2} />
    <path d="M-88-58L-51-46M-86 57L-48 45M-79-51L-72-35M-69-48L-62-32M-79 51L-72 35M-69 48L-62 32" stroke="#c0d2c7" strokeWidth={1} opacity={.55} />
    <path d="M-122-24L-62-37L48-19L130 3L48 26L-62 42L-122 29Z" fill="#3e5d4f" />
    <path d="M-122-30L-62-42L48-24L130-3L48 19L-62 35L-122 23Z" fill={`url(#${id}-hull)`} stroke="#e2eae4" strokeWidth={1.1} />
    <path d="M-62-42L-60-8L130-3L48-24Z" fill="#d2e0d7" /><path d="M-60-8L-62 35L48 19L130-3Z" fill="#8aa999" />
    <path d="M-114-24L-70-32L-70 24L-114 17Z" fill="#789a87" stroke="#acc2b4" strokeWidth={1} />
    {[-102, -91, -80].map(v => <path key={v} d={`M${v}-23V18`} stroke="#d1ded4" strokeWidth={2} opacity={.65} />)}
    <path d="M-45-31L6-22L6 14L-45 25Z" fill="#b4cbbb" stroke="#e0e9e2" strokeWidth={1} />
    <path d="M-36-20L-7-16L-7-5L-36-7Z" fill="#3c5f57" /><path d="M-33-17L-11-14" stroke="#a2d2c2" strokeWidth={1.5} />
    <path d="M17-19L54-12L73-4L20-3Z" fill="#355a52" stroke="#d4e2d9" strokeWidth={1} /><path d="M30-15L48-11M51-10L62-6" stroke="#8bbdad" strokeWidth={1.3} />
    <path d="M18 4L60 3L47 11L18 16Z" fill="#597c68" />
    <path d="M-61-9L-61 28M11-20V14M78-14L78 10M-108-26L-106 21" fill="none" stroke="#51755f" strokeWidth={1.1} />
    <path d="M-23-33V-57L-12-56L-7-30Z" fill="#bed2c4" stroke="#e3ece6" strokeWidth={1} /><path d="M-20-55L-16-68" stroke="#b8cfc0" strokeWidth={1.4} /><circle cx={-16} cy={-69} r={2} fill="#d9e9dd" />
    {[-21, 0, 21].map((v, i) => <g key={v}><ellipse cx={-124} cy={v} rx={8} ry={9} fill="#304f43" stroke="#c7d7cc" strokeWidth={2} /><ellipse cx={-126} cy={v} rx={4} ry={5} fill={enginePower(i) > .4 ? '#f1d6b5' : '#687f6e'} /></g>)}
    <path d="M-54 34L-38 31M9 21L20 19M90-9L107-5" stroke="#f4faf6" strokeWidth={2} opacity={.7} />
    <circle cx={-88} cy={-66} r={2.4} fill="#a85a43" /><circle cx={-88} cy={66} r={2.4} fill="#c7e1cf" />
  </g>;
};

import React from 'react';
import { Easing } from 'remotion';

const ease = Easing.bezier(.22, 1, .36, 1);
export const progress = (frame: number, start: number, duration = 18) => ease(Math.max(0, Math.min(1, (frame - start) / duration)));

export const Plate: React.FC<{ at: number; frame: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, frame, children, style }) => {
  const p = progress(frame, at, 20);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 25}px) scale(${.97 + p * .03})`, ...style }}>{children}</div>;
};

import React from 'react';
import { Easing } from 'remotion';
import type { ShotTransition } from './types';
import { elementMotion } from './camera-motion.mjs';

const ease = Easing.bezier(.22, 1, .36, 1);
export const progress = (frame: number, start: number, duration = 18) => ease(Math.max(0, Math.min(1, (frame - start) / duration)));

export const Plate: React.FC<{ at: number; frame: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, frame, children, style }) => {
  const p = progress(frame, at, 20);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 25}px) scale(${.97 + p * .03})`, ...style }}>{children}</div>;
};

export const ElementReveal: React.FC<{ at: number; frame: number; transition: ShotTransition; children: React.ReactNode; duration?: number; distance?: number; style?: React.CSSProperties }> = ({ at, frame, transition, children, duration = 18, distance, style }) => {
  const state = elementMotion({ transition: progress(frame, at, duration), active: frame >= at, spec: transition, distance });
  return <div style={{ ...style, opacity: state.opacity, transform: `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})` }}>{children}</div>;
};

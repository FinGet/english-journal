import React from 'react';
import { AbsoluteFill } from 'remotion';
import brand from '../../brand.config.json';
import project from '../../project.config.json';
import type { ShotTransition } from './types';
import { spatialCamera, worldCamera } from './camera-motion.mjs';

const C = brand.palette;
const W = project.video.width;
const H = project.video.height;

export const WorldBackdrop: React.FC<{ transitions: Array<ShotTransition | undefined>; index: number; transition: number; opacity: number }> = ({ transitions, index, transition, opacity }) => {
  const camera = worldCamera({ transitions, index, transition, width: W, height: H });
  const nearX = -camera.x * .14;
  const nearY = -camera.y * .1;
  const farX = -camera.x * .045;
  const farY = -camera.y * .035;
  return <AbsoluteFill data-journal="world-canvas" style={{ opacity, overflow: 'hidden', background: `linear-gradient(145deg, ${C.background}, #edf1ed 48%, #e8eeea)` }}>
    <AbsoluteFill style={{ opacity: .32, backgroundImage: `linear-gradient(${C.line}80 1px, transparent 1px), linear-gradient(90deg, ${C.line}80 1px, transparent 1px)`, backgroundSize: '64px 64px', backgroundPosition: `${nearX}px ${nearY}px` }} />
    <AbsoluteFill style={{ opacity: .28, backgroundImage: `radial-gradient(circle at center, ${C.accent}32 0 42px, transparent 44px), radial-gradient(circle at center, ${C.ink}1c 0 92px, transparent 94px)`, backgroundSize: '720px 720px, 1080px 1080px', backgroundPosition: `${farX}px ${farY}px, ${farX + 310}px ${farY + 220}px` }} />
  </AbsoluteFill>;
};

export const SpatialShot: React.FC<{ spec: ShotTransition; transition: number; role: 'current' | 'previous'; children: React.ReactNode }> = ({ spec, transition, role, children }) => {
  const state = spatialCamera({ spec, transition, role, width: W, height: H });
  return <AbsoluteFill data-journal={`spatial-shot-${role}`} style={{ opacity: state.opacity, transform: `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`, willChange: 'transform, opacity' }}>
    {children}
  </AbsoluteFill>;
};

import React from 'react';
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from 'remotion';
import brand from '../../brand.config.json';
import { JournalFonts } from './Film';
import type { ProductionProps } from './types';

// A separate 3:4 composition preserves the series layout instead of cropping a video frame.
export const JournalCover: React.FC<ProductionProps> = ({ production }) => {
  if (!production) throw new Error('Cover metadata was not loaded');
  const cover = production.cover;
  const frame = cover?.frame ?? 0;
  return <AbsoluteFill style={{ background: brand.palette.background, color: brand.palette.ink, fontFamily: brand.font, overflow: 'hidden' }}>
    <JournalFonts />
    <div style={{ position: 'absolute', left: 90, top: 105, width: 66, height: 66, borderRadius: '50%', background: brand.palette.accent, color: brand.palette.paper, display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 600 }}>{brand.mark}</div>
    <div style={{ position: 'absolute', left: 180, top: 99, right: 90 }}>
      <div style={{ fontSize: 36, fontWeight: 600 }}>{brand.name}</div>
      <div style={{ marginTop: 10, fontSize: 27, lineHeight: 1.3, color: brand.palette.muted }}>{brand.slogan}</div>
    </div>
    <div style={{ position: 'absolute', left: 90, top: 270, fontSize: 27, color: brand.palette.accent, fontWeight: 600, letterSpacing: 3 }}>EP.{String(production.episode).padStart(2, '0')}</div>
    <div style={{ position: 'absolute', left: 90, top: 355, width: 525, zIndex: 3, fontSize: 88, fontWeight: 600, lineHeight: 1.13, letterSpacing: -2 }}>
      {(cover?.title ?? ['Choose a', 'cover title']).map((line, i) => <div key={i} style={{ color: i === (cover?.title.length ?? 2) - 1 ? brand.palette.accent : brand.palette.ink, marginBottom: 7 }}>{line}</div>)}
    </div>
    <div style={{ position: 'absolute', left: 650, top: 455, width: 360, height: 790, borderRadius: 18, overflow: 'hidden', outline: `1px solid ${brand.palette.line}`, outlineOffset: 12 }}>
      <Freeze frame={frame}><OffthreadVideo muted src={staticFile(production.media.program)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: production.media.position }} /></Freeze>
    </div>
    <div style={{ position: 'absolute', left: 90, top: 1010, width: 485, fontSize: 28, lineHeight: 1.45, color: brand.palette.muted }}>ENGLISH SPEAKING JOURNAL</div>
    <div style={{ position: 'absolute', left: 90, right: 90, bottom: 98, fontSize: 24, letterSpacing: 3, color: brand.palette.muted }}>{brand.series}</div>
  </AbsoluteFill>;
};

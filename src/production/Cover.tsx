import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import brand from '../../brand.config.json';
import { JournalFonts } from './Film';
import type { ProductionProps } from './types';
const palette = brand.palette;

const textUnits = (text: string) => Array.from(text).reduce((sum, character) => sum + (/\s/.test(character) ? .3 : character.charCodeAt(0) <= 127 ? .62 : 1), 0);

export const JournalCover: React.FC<ProductionProps> = ({ production }) => {
  if (!production) throw new Error('Cover metadata was not loaded');
  const cover = production.cover;
  const title = cover?.title ?? ['填写本期', '中文主题'];
  const titleSize = Math.min(128, Math.floor(480 / Math.max(...title.map(textUnits))));
  return <AbsoluteFill style={{ background: palette.background, color: palette.ink, fontFamily: brand.font, overflow: 'hidden' }}>
    <JournalFonts />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 20%, ${palette.accent}33 0%, transparent 45%), radial-gradient(ellipse at 80% 70%, ${palette.muted}22 0%, transparent 50%)` }} />
    <div style={{ position: 'absolute', left: 72, top: 72, width: 56, height: 56, borderRadius: 14, background: palette.accent, color: palette.ink, display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 700 }}>{brand.mark}</div>
    <div style={{ position: 'absolute', left: 148, top: 74, width: 620 }}>
      <div style={{ fontSize: 30, fontWeight: 700 }}>{brand.name}</div>
      <div style={{ marginTop: 6, fontSize: 22, color: palette.muted }}>EP.{String(production.episode).padStart(2, '0')}</div>
    </div>
    <div data-journal="cover-topic" style={{ position: 'absolute', left: 66, width: 560, top: 280, zIndex: 3, fontFamily: `'PingFang SC', 'Hiragino Sans GB', ${brand.font}`, fontSize: titleSize, fontWeight: 800, lineHeight: 1.1, letterSpacing: -3, color: palette.ink }}>
      {title.map((line, i) => <div key={i} style={{ marginBottom: 10 }}><span style={{ color: i === title.length - 1 ? palette.accent : palette.ink }}>{line}</span></div>)}
    </div>
    {cover?.subtitle && <div data-journal="cover-note" style={{ position: 'absolute', left: 66, top: 680, width: 520, color: palette.muted, fontSize: 34, fontWeight: 600, letterSpacing: .5 }}>{cover.subtitle}</div>}
    {cover?.portrait ? <Img data-journal="cover-portrait" src={staticFile(cover.portrait)} style={{ position: 'absolute', right: -120, bottom: cover.portraitBottom ?? -80, width: 840, height: 'auto', maxWidth: 'none', filter: 'drop-shadow(0 20px 40px #000a)', zIndex: 2 }} /> : null}
    <div style={{ position: 'absolute', left: 72, bottom: 48, width: 220, height: 4, background: palette.accent, zIndex: 4 }} />
  </AbsoluteFill>;
};

import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import brand from '../../brand.config.json';
import { JournalFonts } from './Film';
import type { ProductionProps } from './types';

const C = brand.palette;

// Keep type editable in Studio; only the presenter is a prepared photographic asset.
export const JournalCover: React.FC<ProductionProps> = ({ production }) => {
  if (!production) throw new Error('Cover metadata was not loaded');
  const cover = production.cover;
  const title = cover?.title ?? ['填写本期', '中文主题'];
  const titleSize = Math.max(...title.map(line => Array.from(line).length)) > 7 ? 112 : 124;
  const portraitHeight = title.length === 3 ? 650 : 800;
  return <AbsoluteFill style={{ background: C.background, color: C.ink, fontFamily: brand.font, overflow: 'hidden' }}>
    <JournalFonts />
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.ink}09 1px, transparent 1px), linear-gradient(90deg, ${C.ink}09 1px, transparent 1px)`, backgroundSize: '36px 36px' }} />
    <svg width={1080} height={1440} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <filter id="journal-cover-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves={3} seed={7} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <filter id="journal-cover-outline" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={6} result="expanded" />
          <feFlood floodColor={C.paper} />
          <feComposite in2="expanded" operator="in" result="edge" />
          <feMerge><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
          <feDropShadow dx={-7} dy={10} stdDeviation={12} floodColor={C.ink} floodOpacity={.14} />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#journal-cover-grain)" opacity={.045} style={{ mixBlendMode: 'multiply' }} />
    </svg>

    <div style={{ position: 'absolute', left: 72, top: 72, width: 56, height: 56, borderRadius: '50%', background: C.accent, color: C.paper, display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 600 }}>{brand.mark}</div>
    <div style={{ position: 'absolute', left: 147, top: 67, width: 650 }}>
      <div style={{ fontSize: 30, fontWeight: 600 }}>{brand.name}</div>
      <div style={{ marginTop: 7, fontSize: 23, lineHeight: 1.3, color: C.muted }}>{brand.slogan}</div>
    </div>
    <div style={{ position: 'absolute', right: 72, top: 72, background: C.ink, color: C.paper, padding: '12px 20px', fontSize: 34, fontWeight: 600 }}>EP. {String(production.episode).padStart(2, '0')}</div>
    <div style={{ position: 'absolute', left: 72, right: 72, top: 189, height: 2, background: C.line }} />
    <div style={{ position: 'absolute', left: 72, top: 232, fontSize: 22, fontWeight: 600, letterSpacing: 3.5, color: C.muted }}>ENGLISH SPEAKING JOURNAL</div>

    <div data-journal="cover-topic" style={{ position: 'absolute', left: 66, right: 66, top: 296, zIndex: 3, fontFamily: `'PingFang SC', 'Hiragino Sans GB', ${brand.font}`, fontSize: titleSize, fontWeight: 800, lineHeight: 1.2, letterSpacing: -3 }}>
      {title.map((line, i) => <div key={i} style={{ marginBottom: 8 }}><span style={{ padding: '0 6px', boxDecorationBreak: 'clone', background: i === title.length - 1 ? `linear-gradient(transparent 64%, ${C.accent}2b 64%, ${C.accent}2b 94%, transparent 94%)` : undefined }}>{line}</span></div>)}
      {cover?.subtitle && <div style={{ marginTop: 26, paddingLeft: 6, fontFamily: brand.font, fontSize: 27, letterSpacing: 1, lineHeight: 1.4, fontWeight: 400, color: C.muted }}>{cover.subtitle}</div>}
    </div>

    <div style={{ position: 'absolute', left: 72, top: title.length === 3 ? 1050 : 960, width: 333, transform: 'rotate(-3deg)', filter: `drop-shadow(0 9px 12px ${C.ink}12)` }}>
      <div style={{ background: C.paper, clipPath: 'polygon(1% 5%, 8% 2%, 19% 4%, 30% 1%, 42% 3%, 54% 0, 65% 3%, 79% 1%, 90% 3%, 98% 1%, 100% 95%, 89% 99%, 78% 96%, 65% 100%, 53% 97%, 41% 99%, 29% 97%, 15% 100%, 2% 97%)', padding: '31px 26px 34px' }}>
        <div style={{ width: 42, height: 5, background: C.accent, marginBottom: 16 }} />
        <div style={{ fontSize: 48, lineHeight: 1.04, fontWeight: 600, letterSpacing: -1.8 }}>{brand.series}</div>
      </div>
    </div>

    {cover?.portrait ? <Img data-journal="cover-portrait" src={staticFile(cover.portrait)} style={{ position: 'absolute', right: -38, bottom: -35, width: 680, height: portraitHeight, objectFit: 'contain', objectPosition: 'right bottom', filter: 'url(#journal-cover-outline)', zIndex: 2 }} /> : <div style={{ position: 'absolute', right: 72, bottom: 180, width: 440, height: 550, border: `2px dashed ${C.line}`, display: 'grid', placeItems: 'center', color: C.muted, fontSize: 30 }}>准备本期人物抠图</div>}
    <div style={{ position: 'absolute', left: 72, bottom: 76, width: 325, height: 3, background: C.accent }} />
  </AbsoluteFill>;
};

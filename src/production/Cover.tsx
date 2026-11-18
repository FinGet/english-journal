import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import brand from '../../brand.config.json';
import { JournalFonts } from './Film';
import type { ProductionProps } from './types';

const C = brand.palette;
// shortcut: glyph widths are estimated; use measured fitting if a future headline needs finer control.
const textUnits = (text: string) => Array.from(text).reduce((sum, character) => sum + (/\s/.test(character) ? .3 : character.charCodeAt(0) <= 127 ? .62 : 1), 0);
const tornPaper = 'polygon(1% 5%, 8% 2%, 19% 4%, 30% 1%, 42% 3%, 54% 0, 65% 3%, 79% 1%, 90% 3%, 98% 1%, 100% 95%, 89% 99%, 78% 96%, 65% 100%, 53% 97%, 41% 99%, 29% 97%, 15% 100%, 2% 97%)';

// Keep type editable in Studio; only the presenter is a prepared photographic asset.
export const JournalCover: React.FC<ProductionProps> = ({ production }) => {
  if (!production) throw new Error('Cover metadata was not loaded');
  const cover = production.cover;
  const title = cover?.title ?? ['填写本期', '中文主题'];
  const titleSize = Math.min(128, Math.floor(480 / Math.max(...title.map(textUnits))));
  const [seriesLead, ...seriesRest] = brand.series.split(' ');
  const seriesLines = seriesRest.length ? [seriesLead, seriesRest.join(' ')] : [seriesLead];
  const seriesSize = Math.min(156, Math.floor(936 / Math.max(...seriesLines.map(textUnits))));
  const noteTop = Math.max(1020, 650 + title.length * (titleSize * 1.12 + 8) + 48);
  return <AbsoluteFill style={{ background: C.background, color: C.ink, fontFamily: brand.font, overflow: 'hidden' }}>
    <JournalFonts />
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.ink}0b 1px, transparent 1px), linear-gradient(90deg, ${C.ink}0b 1px, transparent 1px), linear-gradient(${C.ink}08 1px, transparent 1px), linear-gradient(90deg, ${C.ink}08 1px, transparent 1px)`, backgroundSize: '36px 36px, 36px 36px, 180px 180px, 180px 180px' }} />
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
      <path d="M0 610L525 582L584 1294L0 1332Z" fill={C.paper} opacity={.48} />
      <path d="M0 970L506 920L560 1350L0 1410Z" fill={C.accent} opacity={.045} />
      <text x={540} y={1110} fontFamily={brand.font} fontSize={820} fontWeight={700} fill={C.ink} opacity={.035} transform="rotate(8 800 850)">{brand.mark}</text>
      <rect width="100%" height="100%" filter="url(#journal-cover-grain)" opacity={.045} style={{ mixBlendMode: 'multiply' }} />
    </svg>

    <div style={{ position: 'absolute', left: 72, top: 72, width: 56, height: 56, borderRadius: '50%', background: C.accent, color: C.paper, display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 600 }}>{brand.mark}</div>
    <div style={{ position: 'absolute', left: 147, top: 67, width: 650 }}>
      <div style={{ fontSize: 30, fontWeight: 600 }}>{brand.name}</div>
      <div style={{ marginTop: 7, fontSize: 23, lineHeight: 1.3, color: C.muted }}>{brand.slogan}</div>
    </div>
    <div style={{ position: 'absolute', right: 72, top: 72, background: C.ink, color: C.paper, padding: '12px 20px', fontSize: 34, fontWeight: 600 }}>EP. {String(production.episode).padStart(2, '0')}</div>
    <div style={{ position: 'absolute', left: 72, right: 72, top: 169, height: 2, background: C.line }} />
    <div style={{ position: 'absolute', left: 72, top: 187, fontSize: 22, fontWeight: 600, letterSpacing: 3.5, color: C.muted }}>ENGLISH SPEAKING JOURNAL</div>

    <div data-journal="cover-series" style={{ position: 'absolute', left: 66, right: 66, top: 222, fontSize: seriesSize, lineHeight: .94, fontWeight: 700, letterSpacing: -5 }}>
      {seriesLines.map((line, i) => <div key={i}><span style={{ padding: '0 6px', background: i === seriesLines.length - 1 ? `linear-gradient(transparent 65%, ${C.accent}30 65%, ${C.accent}30 95%, transparent 95%)` : undefined }}>{line}</span></div>)}
    </div>

    <div data-journal="cover-topic" style={{ position: 'absolute', left: 66, width: 492, top: 650, zIndex: 3, fontFamily: `'PingFang SC', 'Hiragino Sans GB', ${brand.font}`, fontSize: titleSize, fontWeight: 800, lineHeight: 1.12, letterSpacing: -3 }}>
      {title.map((line, i) => <div key={i} style={{ marginBottom: 8 }}><span style={{ padding: '0 6px', boxDecorationBreak: 'clone', background: i === title.length - 1 ? `linear-gradient(transparent 64%, ${C.accent}2b 64%, ${C.accent}2b 94%, transparent 94%)` : undefined }}>{line}</span></div>)}
    </div>

    {cover?.subtitle && <div data-journal="cover-note" style={{ position: 'absolute', left: 62, top: noteTop, width: 480, transform: 'rotate(-4deg)', filter: `drop-shadow(0 9px 12px ${C.ink}18)`, zIndex: 4 }}>
      <div style={{ position: 'absolute', inset: '9px -9px -9px -9px', background: `${C.accent}1c`, clipPath: tornPaper, transform: 'rotate(2deg)' }} />
      <div style={{ position: 'relative', background: C.paper, clipPath: tornPaper, padding: '34px 28px 38px', minHeight: 150, boxSizing: 'border-box' }}>
        <div style={{ width: 60, height: 5, background: C.accent, marginBottom: 18 }} />
        <div style={{ fontSize: 36, lineHeight: 1.14, fontWeight: 600, letterSpacing: -.5, overflowWrap: 'anywhere' }}>{cover.subtitle}</div>
      </div>
      <div style={{ position: 'absolute', left: 62, top: -12, width: 112, height: 30, background: `${C.accent}30`, border: `1px solid ${C.accent}1c`, transform: 'rotate(7deg)' }} />
    </div>}

    {cover?.portrait ? <Img data-journal="cover-portrait" src={staticFile(cover.portrait)} style={{ position: 'absolute', right: -130, bottom: cover.portraitBottom ?? -80, width: 840, height: 'auto', maxWidth: 'none', filter: 'url(#journal-cover-outline)', zIndex: 2 }} /> : <div style={{ position: 'absolute', right: 0, bottom: 0, width: 600, height: 800, border: `2px dashed ${C.line}`, display: 'grid', placeItems: 'center', color: C.muted, fontSize: 30 }}>准备本期人物抠图</div>}
    <div style={{ position: 'absolute', left: 72, bottom: 44, width: 386, height: 4, background: C.accent, zIndex: 4 }} />
  </AbsoluteFill>;
};

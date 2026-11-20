import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Caption as TimedCaption } from '@remotion/captions';
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolateColors,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  Solid,
} from 'remotion';
import brand from '../../brand.config.json';
import project from '../../project.config.json';
import type { Brand, Caption, ProductionProps } from './types';
import { CaptionOutline } from '../components/remocn/caption-outline';
import { actionState, OUTRO_SOUND_CUES } from './outro-motion.mjs';

const B: Brand = brand;
const C = B.palette;
const L = project.layout;
const TEXT_WIDTH = project.video.width - L.left - L.right;
const ease = Easing.bezier(.22, 1, .36, 1);
const progress = (frame: number, start: number, duration: number) =>
  ease(Math.max(0, Math.min(1, (frame - start) / duration)));

export const JournalFonts: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading journal typography'));
  useEffect(() => {
    Promise.all([400, 600, 700].map(weight => document.fonts.load(`${weight} 52px 'Journal Sans'`)))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return <style>{`@font-face {font-family:'Journal Sans';src:url('${staticFile('fonts/outfit-latin.woff2')}') format('woff2');font-weight:100 900;font-style:normal;font-display:block;}`}</style>;
};

export const CaptionBlock: React.FC<{ caption: Caption; words: Array<{ from: number; to: number; text: string }>; light?: boolean }> = ({ caption, words, light = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender('Checking bilingual caption fit'));
  const tokens: TimedCaption[] = words.map((word, index) => ({
    text: `${index === 0 ? '' : ' '}${word.text}`,
    startMs: (word.from - caption.from) * 1000 / project.video.fps,
    endMs: (word.to - caption.from) * 1000 / project.video.fps,
    timestampMs: null,
    confidence: null,
    pageBreakAfter: index === words.length - 1,
  }));
  useLayoutEffect(() => {
    let active = true;
    document.fonts.ready.then(() => {
      if (!active) return;
      const element = ref.current;
      const en = element?.querySelector<HTMLElement>('[data-language="en"]');
      const zh = element?.querySelector<HTMLElement>('[data-language="zh"]');
      if (!en || !zh || en.offsetHeight > L.englishSize * 1.2 * 2 + 2 || zh.offsetHeight > L.chineseSize * 1.3 + 2 || en.scrollWidth > TEXT_WIDTH + 1 || zh.scrollWidth > TEXT_WIDTH + 1) {
        cancelRender(new Error(`Subtitle does not fit the series layout. Split this phrase at a spoken-word boundary: ${caption.english}`));
      } else continueRender(handle);
    }).catch(cancelRender);
    return () => { active = false; continueRender(handle); };
  }, [caption.english, caption.chinese, handle]);
  const color = light ? '#272019' : L.captionColor;
  const stroke = light ? '#fffaf1' : L.captionStrokeColor;
  return <div ref={ref} data-journal="captions" style={{ position: 'absolute', left: L.left, width: TEXT_WIDTH, top: L.captionTop, zIndex: 1000, textAlign: 'center', color, filter: light ? undefined : 'drop-shadow(0 3px 4px #0008)' }}>
    <div data-language="en" style={{ fontSize: L.englishSize, lineHeight: 1.16, textWrap: 'balance' }}><CaptionOutline captions={tokens} combineTokensWithinMilliseconds={(caption.to - caption.from) * 1000 / project.video.fps + 100} holdMs={120} fontSize={L.englishSize} fontWeight={700} color={color} activeColor={light ? '#8a421b' : '#ffd28f'} strokeColor={stroke} strokeWidth={.1} /></div>
    <div data-language="zh" style={{ fontSize: L.chineseSize, fontWeight: 500, lineHeight: 1.3, marginTop: 12, textWrap: 'balance', WebkitTextStroke: `8px ${stroke}`, paintOrder: 'stroke fill' }}>{caption.chinese}</div>
  </div>;
};

const OutroIcon: React.FC<{ frame: number; index: number; size: number; palette: Brand['palette'] }> = ({ frame, index, size, palette }) => {
  const state = actionState(frame, index);
  const active = index === 1 ? '#e8b72f' : '#fe2c55';
  const color = interpolateColors(state.activation, [0, 1], [palette.line, active]);
  return <div data-outro-action={index} data-confirmed={state.confirmed} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
    <svg width={size * 150 / 88} height={size * 150 / 88} viewBox="-75 -75 150 150" style={{ position: 'absolute', left: -size * 31 / 88, top: -size * 31 / 88, overflow: 'visible', opacity: state.burst }} fill="none" stroke={active} strokeWidth={2.5} strokeLinecap="round">
      <circle r={state.radius} opacity={.35} />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${-state.radius - 3}v-7`} transform={`rotate(${i * 60 + 20})`} />)}
    </svg>
    {index < 2 ? <div style={{ position: 'relative', width: size, height: size, transform: `scale(${state.scale}) rotate(${state.rotation}deg)` }}>
      <Img src={staticFile(index === 0 ? 'heart.svg' : 'star.svg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} />
      <div style={{ position: 'absolute', inset: 7 * size / 88, backgroundColor: color, maskImage: `url("${staticFile(index === 0 ? 'heart.svg' : 'star.svg')}")`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }} />
    </div> : <svg width={size} height={size} viewBox="0 0 88 88" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', overflow: 'visible', transform: `scale(${state.scale}) rotate(${state.rotation}deg)` }}>
      <circle cx="44" cy="36" r="31" fill={palette.accent} stroke={palette.accent} strokeWidth={2} />
      <text x="44" y="38" textAnchor="middle" dominantBaseline="central" fill={palette.paper} stroke="none" fontSize={40} fontWeight={600} fontFamily={B.font}>{B.mark}</text>
      <circle cx="44" cy="69" r="16" fill={interpolateColors(state.activation, [0, 1], [active, palette.paper])} stroke={state.activation > .5 ? palette.line : palette.paper} strokeWidth={2} />
      <path d="M37 69H51M44 62V76" stroke={palette.paper} strokeWidth={3} opacity={state.plus} style={{ transformOrigin: '44px 69px', transform: `rotate(${(1 - state.plus) * 90}deg)` }} />
      <path d="M37 69L42 74L52 63" stroke={active} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - state.check} opacity={state.check} />
    </svg>}
  </div>;
};

const OutroAction: React.FC<{ frame: number; index: number; palette: Brand['palette'] }> = ({ frame, index, palette }) => {
  const p = progress(frame, 12 + index * 6, 16);
  return <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
    <OutroIcon frame={frame} index={index} size={76} palette={palette} />
    <div style={{ fontSize: 36, fontWeight: 500, color: palette.muted }}>{index === 0 ? 'Like' : 'Save'}</div>
  </div>;
};

const Outro: React.FC<{ frame: number; palette: Brand['palette'] }> = ({ frame, palette }) => {
  const follow = actionState(frame, 2);
  const intro = progress(frame, 0, 18);
  return <AbsoluteFill style={{ background: palette.background, color: palette.ink, fontFamily: B.font, overflow: 'hidden' }}>
    {OUTRO_SOUND_CUES.map((cue, i) => <Sequence key={i} from={cue.at} durationInFrames={cue.duration}><Audio src={staticFile(B.outroSfx[i].src)} volume={B.outroSfx[i].volume} /></Sequence>)}
    <div style={{ position: 'absolute', left: L.left + (TEXT_WIDTH - 360) / 2, top: 400, width: 360, height: 360, borderRadius: '50%', border: `1px solid ${palette.line}`, opacity: intro * .65, transform: `scale(${.9 + intro * .1})` }} />
    <div style={{ position: 'absolute', left: L.left, top: 460, width: TEXT_WIDTH, display: 'flex', justifyContent: 'center', opacity: intro, transform: `translateY(${(1 - intro) * 24}px)` }}><OutroIcon frame={frame} index={2} size={260} palette={palette} /></div>
    <div style={{ position: 'absolute', top: 805, left: L.left, width: TEXT_WIDTH, textAlign: 'center', fontSize: 76, fontWeight: 600, opacity: progress(frame, 5, 16) }}>{B.name}</div>
    <div data-journal="slogan" style={{ position: 'absolute', top: 925, left: L.left + 90, width: TEXT_WIDTH - 180, textAlign: 'center', textWrap: 'balance', fontSize: 36, lineHeight: 1.45, color: palette.muted, fontWeight: 400, opacity: progress(frame, 9, 16) }}>{B.slogan}</div>
    <div data-journal="follow-prompt" data-confirmed={follow.confirmed} style={{ position: 'absolute', left: L.left + (TEXT_WIDTH - 310) / 2, top: 1160, width: 310, height: 94, borderRadius: 47, background: interpolateColors(follow.activation, [0, 1], [palette.accent, palette.ink]), color: palette.paper, display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 600, opacity: progress(frame, 12, 16), transform: `scale(${1 + (follow.scale - 1) * .2})` }}>{follow.confirmed ? 'Following' : 'Follow'}</div>
    <div style={{ position: 'absolute', left: L.left, top: 1360, width: TEXT_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64 }}>
      {[0, 1].map(index => <OutroAction key={index} index={index} frame={frame} palette={palette} />)}
    </div>
  </AbsoluteFill>;
};

export const JournalOutro: React.FC<{ palette?: Brand['palette'] }> = ({ palette = C }) => <><JournalFonts /><Outro frame={useCurrentFrame()} palette={palette} /></>;

export const JournalFilm: React.FC<ProductionProps> = ({ production, debugOverlay = false }) => {
  const frame = useCurrentFrame();
  if (!production) throw new Error('Production metadata was not loaded');
  if (frame >= production.durationInFrames) {
    return production.outro === false ? null : <Sequence from={production.durationInFrames} durationInFrames={B.outroFrames}><JournalOutro /></Sequence>;
  }
  const caption = production.captions.find(item => frame >= item.from && frame < item.to);
  const words = caption ? production.words.filter(word => word.from >= caption.from && word.to <= caption.to) : [];
  return <>
    <AbsoluteFill style={{ background: '#121212', fontFamily: B.font }}>
      <JournalFonts />
      <OffthreadVideo src={staticFile(production.media.program)} muted={Boolean(production.media.audio)} volume={production.media.volume ?? project.audio.voiceVolume} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      {production.media.audio && <Audio src={staticFile(production.media.audio)} volume={production.media.volume ?? project.audio.voiceVolume} />}
      {production.cues.map(cue => <Sequence key={cue.at} from={cue.at} durationInFrames={cue.duration}><Audio src={staticFile(cue.src)} volume={cue.volume} /></Sequence>)}
      {caption && <Sequence from={caption.from} durationInFrames={caption.to - caption.from} layout="none"><CaptionBlock key={caption.from} caption={caption} words={words} /></Sequence>}
      {debugOverlay && <div style={{ position: 'absolute', top: L.captionTop, left: L.left, right: L.right, height: 144, border: '2px dashed white' }} />}
    </AbsoluteFill>
  </>;
};

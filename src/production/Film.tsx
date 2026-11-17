import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, cancelRender, continueRender, delayRender, Easing, Img, interpolate, interpolateColors, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import brand from '../../brand.config.json';
import project from '../../project.config.json';
import type { Brand, Caption, ProductionProps, Shot, Visual } from './types';
import { actionState, OUTRO_SOUND_CUES } from './outro-motion.mjs';

const B: Brand = brand;
const C = B.palette;
const L = project.layout;
const TEXT_WIDTH = project.video.width - L.left - L.right;
const ease = Easing.bezier(.22, 1, .36, 1);
const progress = (f: number, start: number, duration = 18) => ease(Math.max(0, Math.min(1, (f - start) / duration)));
// Art uses the whole canvas. Caption placement never defines its bottom edge.
const box = { hero: { left: L.left, top: 470, width: TEXT_WIDTH, height: 1230, radius: 12 }, side: { left: 490, top: 1000, width: 440, height: 760, radius: 12 }, chip: { left: L.left, top: 1210, width: 320, height: 320, radius: 160 } };

export const JournalFonts: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading journal typography'));
  useEffect(() => {
    Promise.all([400, 600, 700].map(weight => document.fonts.load(`${weight} 52px 'Journal Sans'`)))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return <style>{`@font-face {font-family:'Journal Sans';src:url('${staticFile('fonts/outfit-latin.woff2')}') format('woff2');font-weight:100 900;font-style:normal;font-display:block;}`}</style>;
};

const BrandLockup: React.FC<{ episode?: number }> = ({ episode }) => <div data-journal="brand" style={{ position: 'absolute', left: L.left, right: L.right, top: L.brandTop, display: 'flex', alignItems: 'center', gap: 20, color: C.ink }}>
  <div style={{ width: 53, height: 53, borderRadius: '50%', background: C.accent, color: C.paper, display: 'grid', placeItems: 'center', fontSize: 32, lineHeight: 1, fontWeight: 600, letterSpacing: -.8 }}>{B.mark}</div>
  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.25 }}>{B.name}</div><div data-journal="slogan" style={{ marginTop: 8, fontSize: 26, lineHeight: 1.3, fontWeight: 400, color: C.muted }}>{B.slogan}</div></div>
  {episode !== undefined && <div style={{ alignSelf: 'flex-start', marginTop: 9, fontSize: 24, color: C.muted }}>EP.{String(episode).padStart(2, '0')}</div>}
</div>;

const RisingText: React.FC<{ text: string; frame: number; at: number; size?: number; color?: string }> = ({ text, frame, at, size = 70, color = C.ink }) => <span style={{ fontSize: size, lineHeight: 1.08, fontWeight: 600, letterSpacing: -1.7, color }}>
  {text.split(' ').map((word, wi, all) => <React.Fragment key={wi}><span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{Array.from(word).map((ch, ci) => {
    const start = at - 7 + Math.min(12, (all.slice(0, wi).join(' ').length + ci) * .6);
    return <span key={ci} style={{ display: 'inline-block', opacity: progress(frame, start, 20), transform: `translateY(${(1 - progress(frame, start, 11)) * size * .44}px)` }}>{ch}</span>;
  })}</span>{wi < all.length - 1 ? ' ' : ''}</React.Fragment>)}
</span>;

const Headlines: React.FC<{ shot: Shot; frame: number }> = ({ shot, frame }) => {
  const title = shot.titles.filter(t => frame >= t.at - 6 && frame < (t.until ?? shot.to)).at(-1);
  return title ? <div data-journal="title" style={{ position: 'absolute', left: L.left, width: TEXT_WIDTH, top: 272, minHeight: 160 }}><RisingText text={title.text} frame={frame} at={title.at} /></div> : null;
};

const Plate: React.FC<{ at: number; frame: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, frame, children, style }) => {
  const p = progress(frame, at, 20);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 25}px) scale(${.97 + p * .03})`, ...style }}>{children}</div>;
};

const MediaVisual: React.FC<{ visual: Extract<Visual, { kind: 'media' }>; shot: Shot; frame: number }> = ({ visual, shot, frame }) => <>
  {visual.images.map((image, i) => {
    const push = interpolate(frame, [shot.from, shot.to], [1, 1.035], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const stacked = visual.treatment === 'stack';
    return <Plate key={image.src + i} at={image.at - 7} frame={frame} style={{ position: 'absolute', left: stacked ? L.left + i * 55 : L.left, top: stacked ? 470 + i * 255 : 475, width: stacked ? 700 - i * 30 : TEXT_WIDTH, height: stacked ? 610 : 1295, overflow: 'hidden', borderRadius: 18, boxShadow: `0 18px 38px ${C.ink}1a` }}>
      <Img src={staticFile(image.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push})` }} />
      {image.label && <div style={{ position: 'absolute', left: 25, top: 25, background: C.paper, padding: '10px 18px', borderRadius: 8, fontSize: 28, fontWeight: 600, color: C.ink }}>{image.label}</div>}
    </Plate>;
  })}
</>;

const FlowVisual: React.FC<{ visual: Extract<Visual, { kind: 'flow' }>; frame: number }> = ({ visual, frame }) => <div style={{ position: 'absolute', left: L.left, top: 510, width: TEXT_WIDTH, height: 1260 }}>
  {visual.nodes.map((node, i) => <React.Fragment key={i}>
    <Plate at={node.at - 4} frame={frame} style={{ position: 'absolute', left: i * 280, top: i === 1 ? 65 : 0, width: 250, height: 180, borderRadius: 18, background: C.paper, padding: '50px 12px', textAlign: 'center', boxShadow: `0 12px 25px ${C.ink}10`, boxSizing: 'border-box', fontSize: 36, fontWeight: 600 }}>{node.text}</Plate>
    <svg width={820} height={440} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}><path d={`M ${i * 280 + 125} ${i === 1 ? 245 : 180} C ${i * 280 + 125} 350, 175 330, 175 435`} fill="none" stroke={C.accent} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress(frame, node.at + 6, 22)} opacity={frame >= node.at ? .55 : 0} /></svg>
  </React.Fragment>)}
  <Plate at={visual.resultAt - 5} frame={frame} style={{ position: 'absolute', left: 0, top: 440, width: 350, height: 210, background: C.accent, color: C.paper, borderRadius: 22, display: 'grid', placeItems: 'center', fontSize: 55, fontWeight: 600 }}>{visual.result}</Plate>
  <Plate at={visual.resultAt + 12} frame={frame} style={{ position: 'absolute', left: 0, top: 790, width: 345, color: C.muted, fontSize: 34, lineHeight: 1.3 }}>{visual.note}</Plate>
</div>;

const ContrastVisual: React.FC<{ visual: Extract<Visual, { kind: 'contrast' }>; frame: number }> = ({ visual, frame }) => {
  const visible = visual.items.filter(i => frame >= i.at - 5);
  const item = visible.at(-1);
  return item ? <div style={{ position: 'absolute', left: L.left, top: 285, width: TEXT_WIDTH }}><RisingText text={item.text} at={item.at} frame={frame} size={item.emphasis ? 82 : 68} color={item.emphasis ? C.accent : C.ink} /></div> : null;
};

const CaptionBlock: React.FC<{ caption: Caption }> = ({ caption }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender('Checking bilingual caption fit'));
  useLayoutEffect(() => {
    let active = true;
    document.fonts.ready.then(() => {
      if (!active) return;
      const element = ref.current;
      const en = element?.querySelector<HTMLElement>('[data-language="en"]');
      const zh = element?.querySelector<HTMLElement>('[data-language="zh"]');
      if (!en || !zh || en.offsetHeight > L.englishSize * 1.16 * 2 + 2 || zh.offsetHeight > L.chineseSize * 1.3 + 2 || en.scrollWidth > TEXT_WIDTH + 1 || zh.scrollWidth > TEXT_WIDTH + 1) {
        cancelRender(new Error(`Subtitle does not fit the series layout. Split this phrase at a spoken-word boundary: ${caption.english}`));
      } else continueRender(handle);
    }).catch(cancelRender);
    return () => { active = false; continueRender(handle); };
  }, [caption.english, caption.chinese, handle]);
  return <div ref={ref} data-journal="captions" style={{ position: 'absolute', left: L.left, width: TEXT_WIDTH, top: L.captionTop, zIndex: 1000, textAlign: 'center' }}>
    <div data-language="en" style={{ fontSize: L.englishSize, fontWeight: 600, lineHeight: 1.16, textWrap: 'balance' }}>{caption.english}</div>
    <div data-language="zh" style={{ fontSize: L.chineseSize, fontWeight: 400, lineHeight: 1.3, color: C.muted, marginTop: 12, textWrap: 'balance' }}>{caption.chinese}</div>
  </div>;
};

const ComparisonVisual: React.FC<{ visual: Extract<Visual, { kind: 'comparison' }>; frame: number; shot: Shot }> = ({ visual, frame, shot }) => <div style={{ position: 'absolute', left: L.left, top: 480, width: TEXT_WIDTH }}>
  <div style={{ height: 460, borderRadius: 18, overflow: 'hidden' }}><Img src={staticFile(visual.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + (frame - shot.from) / (shot.to - shot.from) * .025})` }} /></div>
  <div style={{ display: 'flex', gap: 24, marginTop: 26 }}>
    {(['left', 'right'] as const).map(side => <div key={side} style={{ flex: 1, minHeight: 300, borderRadius: 18, padding: '32px 24px', boxSizing: 'border-box', background: side === 'right' ? interpolateColors(.1, [0, 1], [C.background, C.accent]) : C.paper }}>
      <div style={{ fontSize: 29, color: C.muted, marginBottom: 15 }}>{visual[side]}</div>
      {visual.items.filter(i => i.side === side).map((item, i) => <Plate key={i} at={item.at - 4} frame={frame} style={{ fontSize: 36, lineHeight: 1.3, marginBottom: 12, fontWeight: 600, color: side === 'right' ? C.accent : C.ink }}>{item.text}</Plate>)}
    </div>)}
  </div>
</div>;

const ShotArt: React.FC<{ shot: Shot; frame: number }> = ({ shot, frame }) => {
  const v = shot.visual;
  return <>
    <Headlines shot={shot} frame={frame} />
    {v.kind === 'media' && <MediaVisual visual={v} shot={shot} frame={frame} />}
    {v.kind === 'flow' && <FlowVisual visual={v} frame={frame} />}
    {v.kind === 'contrast' && <ContrastVisual visual={v} frame={frame} />}
    {v.kind === 'comparison' && <ComparisonVisual visual={v} frame={frame} shot={shot} />}
    {v.kind === 'closing' && <>
      <Plate at={v.at - 5} frame={frame} style={{ position: 'absolute', left: L.left, top: 395, maxWidth: TEXT_WIDTH, fontSize: 29, color: C.muted }}>{v.prompt}</Plate>
    </>}
  </>;
};

const OutroAction: React.FC<{ frame: number; index: number }> = ({ frame, index }) => {
  const state = actionState(frame, index);
  const p = progress(frame, 7 + index * 8, 18);
  const active = index === 1 ? '#e8b72f' : '#fe2c55';
  const color = interpolateColors(state.activation, [0, 1], [C.line, active]);
  const label = index === 0 ? 'Like' : index === 1 ? 'Save' : state.confirmed ? 'Following' : 'Follow';
  return <div data-outro-action={index} data-confirmed={state.confirmed} style={{ width: (TEXT_WIDTH - 70) / 3, height: 255, borderRadius: 24, background: C.paper, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, opacity: p, transform: `translateY(${(1 - p) * 28}px)`, boxShadow: `0 15px 30px ${C.ink}0c` }}>
    <div style={{ width: 88, height: 88, position: 'relative' }}>
      <svg width={150} height={150} viewBox="-75 -75 150 150" style={{ position: 'absolute', left: -31, top: -31, overflow: 'visible', opacity: state.burst }} fill="none" stroke={active} strokeWidth={2.5} strokeLinecap="round">
        <circle r={state.radius} opacity={.35} />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${-state.radius - 3}v-7`} transform={`rotate(${i * 60 + 20})`} />)}
      </svg>
      <svg width={88} height={88} viewBox="0 0 88 88" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', overflow: 'visible', transform: `scale(${state.scale}) rotate(${state.rotation}deg)` }}>
        {index === 0 ? <path d="M44 73S13 54 13 32C13 13 35 12 44 28C53 12 75 13 75 32C75 54 44 73 44 73Z" fill={color} /> : index === 1 ? <path d="M44 10L54 32L78 35L60 52L65 77L44 65L23 77L28 52L10 35L34 32Z" fill={color} /> : <>
          <circle cx="44" cy="36" r="31" fill={C.background} stroke={C.line} strokeWidth={2} />
          <text x="44" y="38" textAnchor="middle" dominantBaseline="central" fill={C.ink} stroke="none" fontSize={40} fontWeight={600} fontFamily={B.font}>{B.mark}</text>
          <circle cx="44" cy="69" r="16" fill={interpolateColors(state.activation, [0, 1], [active, C.paper])} stroke={state.activation > .5 ? C.line : C.paper} strokeWidth={2} />
          <path d="M37 69H51M44 62V76" stroke={C.paper} strokeWidth={3} opacity={state.plus} style={{ transformOrigin: '44px 69px', transform: `rotate(${(1 - state.plus) * 90}deg)` }} />
          <path d="M37 69L42 74L52 63" stroke={active} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - state.check} opacity={state.check} />
        </>}
      </svg>
    </div>
    <div style={{ fontSize: 36, fontWeight: 600 }}>{label}</div>
  </div>;
};

const Outro: React.FC<{ frame: number }> = ({ frame }) => <AbsoluteFill style={{ background: C.background, color: C.ink, fontFamily: B.font }}>
  {OUTRO_SOUND_CUES.map((cue, i) => <Sequence key={i} from={cue.at} durationInFrames={cue.duration}><Audio src={staticFile(B.outroSfx[i].src)} volume={B.outroSfx[i].volume} /></Sequence>)}
  <div style={{ position: 'absolute', left: L.left, top: 165, maxWidth: TEXT_WIDTH, fontSize: 24, fontWeight: 500, letterSpacing: 2.5, color: C.muted }}>{B.series}</div>
  <div style={{ position: 'absolute', top: 465, left: L.left, width: TEXT_WIDTH, textAlign: 'center', fontSize: 64, fontWeight: 600 }}>{B.name}</div>
  <div data-journal="slogan" style={{ position: 'absolute', top: 580, left: L.left + 50, width: TEXT_WIDTH - 100, textAlign: 'center', fontSize: 40, lineHeight: 1.35, color: C.muted, fontWeight: 400 }}>{B.slogan}</div>
  <div style={{ position: 'absolute', top: 795, left: L.left, width: TEXT_WIDTH, textAlign: 'center' }}><RisingText text="Keep showing up." at={0} frame={frame} size={72} /></div>
  <div style={{ position: 'absolute', left: L.left, top: 1030, display: 'flex', gap: 35 }}>
    {[0, 1, 2].map(index => <OutroAction key={index} index={index} frame={frame} />)}
  </div>
</AbsoluteFill>;

export const JournalOutro: React.FC = () => <><JournalFonts /><Outro frame={useCurrentFrame()} /></>;

export const JournalFilm: React.FC<ProductionProps> = ({ production: p, debugOverlay = false }) => {
  const current = useCurrentFrame();
  if (!p) throw new Error('Production metadata was not loaded');
  if (current >= p.durationInFrames) return <Sequence from={p.durationInFrames} durationInFrames={B.outroFrames}><JournalOutro /></Sequence>;
  const f = current;
  const index = p.shots.findIndex(s => f >= s.from && f < s.to);
  const shot = p.shots[Math.max(0, index)];
  const previous = p.shots[Math.max(0, index - 1)];
  const transition = index > 0 ? progress(f, shot.from, 18) : 1;
  const oldRect = box[previous.portrait], nextRect = box[shot.portrait];
  const rect = Object.fromEntries(Object.entries(nextRect).map(([key, value]) => [key, oldRect[key as keyof typeof oldRect] + (value - oldRect[key as keyof typeof oldRect]) * transition])) as typeof nextRect;
  const caption = p.captions.find(c => f >= c.from && f < c.to);
  return <AbsoluteFill style={{ background: C.background, color: C.ink, fontFamily: B.font, overflow: 'hidden' }}>
    <JournalFonts />
    <div style={{ position: 'absolute', right: -180, top: 580, width: 650, height: 650, borderRadius: '50%', background: `radial-gradient(circle, ${C.ink}0c 0%, transparent 68%)` }} />
    <BrandLockup episode={p.episode} />
    {index > 0 && transition < 1 && <AbsoluteFill style={{ opacity: 1 - transition, transform: `translateY(${-transition * 20}px)` }}><ShotArt shot={previous} frame={f} /></AbsoluteFill>}
    <AbsoluteFill style={{ opacity: transition, transform: `translateY(${(1 - transition) * 20}px)` }}><ShotArt shot={shot} frame={f} /></AbsoluteFill>
    <div data-journal="portrait" style={{ position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: rect.radius, overflow: 'hidden', outline: `1px solid ${C.line}`, outlineOffset: 10, zIndex: 4 }}>
      <OffthreadVideo src={staticFile(p.media.program)} muted={Boolean(p.media.audio)} volume={p.media.volume ?? project.audio.voiceVolume} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.media.position }} />
    </div>
    {p.media.audio && <Audio src={staticFile(p.media.audio)} volume={p.media.volume ?? project.audio.voiceVolume} />}
    {p.cues.map((cue, i) => <Sequence key={i} from={cue.at} durationInFrames={cue.duration}><Audio src={staticFile(cue.src)} volume={cue.volume} /></Sequence>)}
    {caption && <CaptionBlock key={caption.from} caption={caption} />}
    {debugOverlay && <>
      <div style={{ position: 'absolute', inset: 24, outline: `2px dashed ${C.accent}`, zIndex: 2000 }} />
      <div style={{ position: 'absolute', top: 1840, left: 110, color: C.muted, fontSize: 24, zIndex: 2000 }}>FULL CANVAS · CAPTIONS ON TOP · {shot.id} · {f}</div>
    </>}
  </AbsoluteFill>;
};

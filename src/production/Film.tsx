import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, cancelRender, continueRender, delayRender, Img, interpolate, interpolateColors, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import brand from '../../brand.config.json';
import project from '../../project.config.json';
import type { Brand, Caption, ProductionProps, Shot, Visual } from './types';
import { actionState, OUTRO_SOUND_CUES } from './outro-motion.mjs';
import { Plate, progress } from './visual-motion';
import { EmotionFrame, EmotionVisual, MapVisual, RelationshipVisual, SceneVisual, TransformationVisual } from './NarrativeVisuals';
import { BrowserVisual, GroupChatVisual, BookVisual } from './DeviceVisuals';
import { SpaceflightVisual } from './SpaceflightVisual';
import { SpatialShot, WorldBackdrop } from './SpatialWorld';
import { cameraTransition } from './camera-motion.mjs';

const B: Brand = brand;
const C = B.palette;
const L = project.layout;
const TEXT_WIDTH = project.video.width - L.left - L.right;
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

const BrandLockup: React.FC<{ episode?: number; light?: number }> = ({ episode, light = 0 }) => <div data-journal="brand" style={{ position: 'absolute', left: L.left, right: L.right, top: L.brandTop, display: 'flex', alignItems: 'center', gap: 20, color: interpolateColors(light, [0, 1], [C.ink, C.paper]) }}>
  <div style={{ width: 53, height: 53, borderRadius: '50%', background: C.accent, color: C.paper, display: 'grid', placeItems: 'center', fontSize: 32, lineHeight: 1, fontWeight: 600, letterSpacing: -.8 }}>{B.mark}</div>
  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.25 }}>{B.name}</div><div data-journal="slogan" style={{ marginTop: 8, fontSize: 26, lineHeight: 1.3, fontWeight: 400, color: interpolateColors(light, [0, 1], [C.muted, '#bfccd9']) }}>{B.slogan}</div></div>
  {episode !== undefined && <div style={{ alignSelf: 'flex-start', marginTop: 9, fontSize: 24, color: interpolateColors(light, [0, 1], [C.muted, '#bfccd9']) }}>EP.{String(episode).padStart(2, '0')}</div>}
</div>;

const RisingText: React.FC<{ text: string; frame: number; at: number; size?: number; color?: string }> = ({ text, frame, at, size = 70, color = C.ink }) => <span style={{ fontSize: size, lineHeight: 1.08, fontWeight: 600, letterSpacing: -1.7, color }}>
  {text.split(' ').map((word, wi, all) => <React.Fragment key={wi}><span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{Array.from(word).map((ch, ci) => {
    const start = at - 7 + Math.min(12, (all.slice(0, wi).join(' ').length + ci) * .6);
    return <span key={ci} style={{ display: 'inline-block', opacity: progress(frame, start, 20), transform: `translateY(${(1 - progress(frame, start, 11)) * size * .44}px)` }}>{ch}</span>;
  })}</span>{wi < all.length - 1 ? ' ' : ''}</React.Fragment>)}
</span>;

const Headlines: React.FC<{ shot: Shot; frame: number }> = ({ shot, frame }) => {
  const title = shot.titles.filter(t => frame >= t.at - 6 && frame < (t.until ?? shot.to)).at(-1);
  return title ? <div data-journal="title" style={{ position: 'absolute', left: L.left, width: TEXT_WIDTH, top: 272, minHeight: 160 }}><RisingText text={title.text} frame={frame} at={title.at} color={shot.visual.kind === 'spaceflight' ? C.paper : C.ink} /></div> : null;
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

const SequenceVisual: React.FC<{ visual: Extract<Visual, { kind: 'sequence' }>; frame: number }> = ({ visual, frame }) => {
  const count = visual.steps.filter(step => frame >= step.at).length;
  const row = 164;
  return <div style={{ position: 'absolute', left: L.left, top: 490, width: TEXT_WIDTH }}>
    <div style={{ color: C.muted, fontSize: 25, letterSpacing: 2, textTransform: 'uppercase' }}>{visual.label}</div>
    <div style={{ position: 'absolute', right: 0, top: 60, display: 'flex', alignItems: 'baseline', color: count === visual.steps.length ? C.accent : C.ink }}>
      <span style={{ fontSize: 156, fontWeight: 600, letterSpacing: -7, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(count).padStart(2, '0')}</span>
      <span style={{ fontSize: 34, marginLeft: 12, color: C.muted }}>/ {String(visual.steps.length).padStart(2, '0')}</span>
    </div>
    <div style={{ position: 'relative', marginTop: 128, width: 350, height: (visual.steps.length - 1) * row + 90 }}>
      <svg width={62} height={(visual.steps.length - 1) * row + 62} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={`M31 31V${(visual.steps.length - 1) * row + 31}`} stroke={C.line} strokeWidth={2} fill="none" />
        {visual.steps.slice(1).map((step, i) => <path key={i} d={`M31 ${i * row + 31}v${row}`} stroke={C.accent} strokeWidth={3} fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress(frame, step.at, 22)} />)}
      </svg>
      {visual.steps.map((step, i) => {
        const p = progress(frame, step.at - 4, 18);
        return <div key={i} style={{ position: 'absolute', top: i * row, left: 0, width: 350, minHeight: 62, display: 'flex', alignItems: 'center', gap: 26 }}>
          <div style={{ flexShrink: 0, width: 60, height: 60, borderRadius: '50%', border: `1px solid ${C.line}`, background: interpolateColors(p, [0, 1], [C.background, C.accent]), color: interpolateColors(p, [0, 1], [C.muted, C.paper]), display: 'grid', placeItems: 'center', fontSize: 24, position: 'relative' }}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ opacity: p, transform: `translateX(${(1 - p) * 14}px)`, fontSize: 46, fontWeight: 600, lineHeight: 1.12, letterSpacing: -1 }}>{step.text}</div>
        </div>;
      })}
    </div>
    <Plate at={visual.resultAt - 4} frame={frame} style={{ marginTop: 26, width: 350, paddingTop: 22, borderTop: `2px solid ${C.accent}`, fontSize: 34, lineHeight: 1.2, fontWeight: 600, color: C.accent }}>{visual.result}</Plate>
  </div>;
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
  return <div ref={ref} data-journal="captions" style={{ position: 'absolute', left: L.left, width: TEXT_WIDTH, top: L.captionTop, zIndex: 1000, textAlign: 'center', color: L.captionColor, WebkitTextStroke: `${L.captionStrokeWidth}px ${L.captionStrokeColor}`, paintOrder: 'stroke fill', textShadow: '0 2px 3px #0006' }}>
    <div data-language="en" style={{ fontSize: L.englishSize, fontWeight: 600, lineHeight: 1.16, textWrap: 'balance' }}>{caption.english}</div>
    <div data-language="zh" style={{ fontSize: L.chineseSize, fontWeight: 400, lineHeight: 1.3, marginTop: 12, textWrap: 'balance' }}>{caption.chinese}</div>
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

const EvidenceVisual: React.FC<{ visual: Extract<Visual, { kind: 'evidence' }>; shot: Shot; frame: number }> = ({ visual, shot, frame }) => {
  const index = visual.focuses.filter(focus => frame >= focus.at).length - 1;
  const focus = visual.focuses[index];
  const previous = visual.focuses[index - 1]?.region ?? { x: 0, y: 0, width: 1, height: 1 };
  const p = focus ? progress(frame, focus.at, 24) : 0;
  const target = focus?.region ?? previous;
  const region = {
    x: previous.x + (target.x - previous.x) * p, y: previous.y + (target.y - previous.y) * p,
    width: previous.width + (target.width - previous.width) * p, height: previous.height + (target.height - previous.height) * p,
  };
  const { width, height } = visual.imageSize;
  const overviewScale = Math.min(TEXT_WIDTH / width, 560 / height);
  const detailWidth = TEXT_WIDTH - 380, detailHeight = 490;
  const zoom = .9 * Math.min(detailWidth / (region.width * width), detailHeight / (region.height * height));
  return <div data-journal="evidence" style={{ position: 'absolute', left: L.left, top: 480, width: TEXT_WIDTH }}>
    <Plate at={shot.from} frame={frame} style={{ width: TEXT_WIDTH, height: 560, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, overflow: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', left: (TEXT_WIDTH - width * overviewScale) / 2, top: (560 - height * overviewScale) / 2, width: width * overviewScale, height: height * overviewScale }}>
        <Img src={staticFile(visual.image)} onLoad={event => {
          if (event.currentTarget.naturalWidth !== width || event.currentTarget.naturalHeight !== height) cancelRender(new Error(`Evidence imageSize differs from the loaded image: ${visual.image}`));
        }} style={{ width: '100%', height: '100%' }} />
        {focus && <svg viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <rect x={region.x * width} y={region.y * height} width={region.width * width} height={region.height * height} fill={`${C.accent}16`} stroke={C.accent} strokeWidth={3} vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress(frame, focus.at, 18)} />
        </svg>}
      </div>
    </Plate>
    <Plate at={shot.from} frame={frame} style={{ position: 'absolute', top: 580, width: TEXT_WIDTH, color: C.muted, fontSize: 24 }}>{visual.sourceLabel}</Plate>
    {focus && <>
      <Plate key={focus.at} at={focus.at} frame={frame} style={{ position: 'absolute', left: 380, top: 650, width: detailWidth, fontSize: 32, lineHeight: 1.2, fontWeight: 600, color: C.accent, overflowWrap: 'anywhere' }}>{focus.label}</Plate>
      <Plate at={visual.focuses[0].at} frame={frame} style={{ position: 'absolute', left: 380, top: 780, width: detailWidth, height: detailHeight, border: `1px solid ${C.line}`, borderRadius: 18, overflow: 'hidden', background: C.paper, boxShadow: `0 18px 38px ${C.ink}12` }}>
        <Img src={staticFile(visual.image)} style={{ position: 'absolute', width: width * zoom, height: height * zoom, maxWidth: 'none', left: detailWidth / 2 - (region.x + region.width / 2) * width * zoom, top: detailHeight / 2 - (region.y + region.height / 2) * height * zoom }} />
      </Plate>
    </>}
  </div>;
};

const DialogueVisual: React.FC<{ visual: Extract<Visual, { kind: 'dialogue' }>; frame: number }> = ({ visual, frame }) => {
  const row = 230;
  const scroll = visual.messages.slice(3).reduce((offset, message) => offset + row * progress(frame, message.at, 20), 0);
  return <div data-journal="dialogue" style={{ position: 'absolute', left: L.left, top: 480, width: TEXT_WIDTH, height: 670, overflow: 'hidden' }}>
    {visual.messages.map((message, i) => {
      const next = visual.messages[i + 1];
      const active = progress(frame, message.at, 14) * (1 - (next ? progress(frame, next.at, 16) : 0));
      return <div key={i} style={{ position: 'absolute', left: message.side === 'left' ? 0 : 180, top: i * row - scroll, width: TEXT_WIDTH - 180 }}>
        <Plate at={message.at} frame={frame} style={{ height: 210, padding: '20px 24px', boxSizing: 'border-box', border: `1px solid ${interpolateColors(active, [0, 1], [C.line, C.accent])}`, borderRadius: message.side === 'left' ? '20px 20px 20px 4px' : '20px 20px 4px 20px', background: message.side === 'left' ? C.paper : interpolateColors(.07, [0, 1], [C.paper, C.ink]) }}>
          <div style={{ opacity: .55 + active * .45 }}>
            <div style={{ marginBottom: 8, color: C.muted, fontSize: 24, lineHeight: 1.1 }}>{visual[message.side]}</div>
            <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{message.text}</div>
          </div>
        </Plate>
      </div>;
    })}
  </div>;
};

const TimelineVisual: React.FC<{ visual: Extract<Visual, { kind: 'timeline' }>; frame: number }> = ({ visual, frame }) => {
  const spacing = (TEXT_WIDTH - 100) / (visual.events.length - 1);
  return <div data-journal="timeline" style={{ position: 'absolute', left: L.left, top: 480, width: TEXT_WIDTH }}>
    <div style={{ color: C.muted, fontSize: 25, letterSpacing: 2, textTransform: 'uppercase' }}>{visual.label}</div>
    <svg width={TEXT_WIDTH} height={160} style={{ position: 'absolute', top: 60, left: 0, overflow: 'visible' }}>
      <path d={`M50 40H${TEXT_WIDTH - 50}`} stroke={C.line} strokeWidth={2} fill="none" />
      {visual.events.map((event, i) => {
        const p = progress(frame, event.at, 20);
        return <React.Fragment key={i}>
          {i > 0 && <path d={`M${50 + (i - 1) * spacing} 40h${spacing}`} stroke={C.accent} strokeWidth={3} fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />}
          <circle cx={50 + i * spacing} cy={40} r={9 + 5 * p} fill={interpolateColors(p, [0, 1], [C.background, C.accent])} stroke={interpolateColors(p, [0, 1], [C.line, C.accent])} strokeWidth={2} />
        </React.Fragment>;
      })}
    </svg>
    {visual.events.map((event, i) => {
      const next = visual.events[i + 1];
      const entered = progress(frame, event.at, 20);
      const leaving = next ? progress(frame, next.at, 20) : 0;
      const labelWidth = Math.min(180, spacing);
      const labelLeft = Math.max(0, Math.min(TEXT_WIDTH - labelWidth, 50 + i * spacing - labelWidth / 2));
      return <React.Fragment key={i}>
        <div style={{ position: 'absolute', top: 138, left: labelLeft, width: labelWidth, opacity: entered, textAlign: 'center', color: leaving > .5 ? C.muted : C.accent, fontSize: 25, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{event.when}</div>
        {frame >= event.at && (!next || frame < next.at + 20) && <div style={{ position: 'absolute', left: 0, top: 280, width: TEXT_WIDTH, height: 410, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 32, padding: 32, borderRadius: 18, border: `1px solid ${C.line}`, background: C.paper, opacity: entered * (1 - leaving), transform: `translateY(${(1 - entered) * 20 - leaving * 20}px)` }}>
          {event.image && <Img src={staticFile(event.image)} style={{ width: 300, height: 346, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C.accent, fontSize: 24, marginBottom: 22 }}>{event.when}</div>
            <div style={{ fontSize: event.image ? 44 : 56, lineHeight: 1.15, fontWeight: 600, letterSpacing: -1, overflowWrap: 'anywhere' }}>{event.text}</div>
          </div>
        </div>}
      </React.Fragment>;
    })}
  </div>;
};

const ShotArt: React.FC<{ shot: Shot; frame: number }> = ({ shot, frame }) => {
  const v = shot.visual;
  return <>
    {v.kind === 'spaceflight' && <SpaceflightVisual visual={v} shot={shot} frame={frame} />}
    <Headlines shot={shot} frame={frame} />
    {v.kind === 'media' && (v.treatment === 'book' ? <BookVisual visual={v} shot={shot} frame={frame} /> : <MediaVisual visual={v} shot={shot} frame={frame} />)}
    {v.kind === 'browser' && <BrowserVisual visual={v} shot={shot} frame={frame} />}
    {v.kind === 'group-chat' && <GroupChatVisual visual={v} shot={shot} frame={frame} />}
    {v.kind === 'flow' && <FlowVisual visual={v} frame={frame} />}
    {v.kind === 'contrast' && <ContrastVisual visual={v} frame={frame} />}
    {v.kind === 'sequence' && <SequenceVisual visual={v} frame={frame} />}
    {v.kind === 'comparison' && <ComparisonVisual visual={v} frame={frame} shot={shot} />}
    {v.kind === 'evidence' && <EvidenceVisual visual={v} frame={frame} shot={shot} />}
    {v.kind === 'dialogue' && <DialogueVisual visual={v} frame={frame} />}
    {v.kind === 'timeline' && <TimelineVisual visual={v} frame={frame} />}
    {v.kind === 'scene' && <SceneVisual visual={v} frame={frame} />}
    {v.kind === 'transformation' && <TransformationVisual visual={v} frame={frame} />}
    {v.kind === 'relationship' && <RelationshipVisual visual={v} frame={frame} />}
    {v.kind === 'map' && <MapVisual visual={v} frame={frame} />}
    {v.kind === 'emotion' && <EmotionVisual visual={v} frame={frame} />}
    {v.kind === 'closing' && <>
      <Plate at={v.at - 5} frame={frame} style={{ position: 'absolute', left: L.left, top: 395, maxWidth: TEXT_WIDTH, fontSize: 29, color: C.muted }}>{v.prompt}</Plate>
    </>}
  </>;
};

const OutroIcon: React.FC<{ frame: number; index: number; size: number }> = ({ frame, index, size }) => {
  const state = actionState(frame, index);
  const active = index === 1 ? '#e8b72f' : '#fe2c55';
  const color = interpolateColors(state.activation, [0, 1], [C.line, active]);
  return <div data-outro-action={index} data-confirmed={state.confirmed} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size * 150 / 88} height={size * 150 / 88} viewBox="-75 -75 150 150" style={{ position: 'absolute', left: -size * 31 / 88, top: -size * 31 / 88, overflow: 'visible', opacity: state.burst }} fill="none" stroke={active} strokeWidth={2.5} strokeLinecap="round">
        <circle r={state.radius} opacity={.35} />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${-state.radius - 3}v-7`} transform={`rotate(${i * 60 + 20})`} />)}
      </svg>
      {index < 2 ? <div style={{ position: 'relative', width: size, height: size, transform: `scale(${state.scale}) rotate(${state.rotation}deg)` }}>
        <Img src={staticFile(index === 0 ? 'heart.svg' : 'star.svg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} />
        <div style={{ position: 'absolute', inset: 7 * size / 88, backgroundColor: color, maskImage: `url("${staticFile(index === 0 ? 'heart.svg' : 'star.svg')}")`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }} />
      </div> : <svg width={size} height={size} viewBox="0 0 88 88" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', overflow: 'visible', transform: `scale(${state.scale}) rotate(${state.rotation}deg)` }}>
          <circle cx="44" cy="36" r="31" fill={C.accent} stroke={C.accent} strokeWidth={2} />
          <text x="44" y="38" textAnchor="middle" dominantBaseline="central" fill={C.paper} stroke="none" fontSize={40} fontWeight={600} fontFamily={B.font}>{B.mark}</text>
          <circle cx="44" cy="69" r="16" fill={interpolateColors(state.activation, [0, 1], [active, C.paper])} stroke={state.activation > .5 ? C.line : C.paper} strokeWidth={2} />
          <path d="M37 69H51M44 62V76" stroke={C.paper} strokeWidth={3} opacity={state.plus} style={{ transformOrigin: '44px 69px', transform: `rotate(${(1 - state.plus) * 90}deg)` }} />
          <path d="M37 69L42 74L52 63" stroke={active} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - state.check} opacity={state.check} />
      </svg>}
  </div>;
};

const OutroAction: React.FC<{ frame: number; index: number }> = ({ frame, index }) => {
  const p = progress(frame, 12 + index * 6, 16);
  return <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
    <OutroIcon frame={frame} index={index} size={76} />
    <div style={{ fontSize: 36, fontWeight: 500, color: C.muted }}>{index === 0 ? 'Like' : 'Save'}</div>
  </div>;
};

const Outro: React.FC<{ frame: number }> = ({ frame }) => {
  const follow = actionState(frame, 2);
  const intro = progress(frame, 0, 18);
  return <AbsoluteFill style={{ background: C.background, color: C.ink, fontFamily: B.font, overflow: 'hidden' }}>
  {OUTRO_SOUND_CUES.map((cue, i) => <Sequence key={i} from={cue.at} durationInFrames={cue.duration}><Audio src={staticFile(B.outroSfx[i].src)} volume={B.outroSfx[i].volume} /></Sequence>)}
  <div style={{ position: 'absolute', left: L.left + (TEXT_WIDTH - 360) / 2, top: 400, width: 360, height: 360, borderRadius: '50%', border: `1px solid ${C.line}`, opacity: intro * .65, transform: `scale(${.9 + intro * .1})` }} />
  <div style={{ position: 'absolute', left: L.left, top: 460, width: TEXT_WIDTH, display: 'flex', justifyContent: 'center', opacity: intro, transform: `translateY(${(1 - intro) * 24}px)` }}><OutroIcon frame={frame} index={2} size={260} /></div>
  <div style={{ position: 'absolute', top: 805, left: L.left, width: TEXT_WIDTH, textAlign: 'center', fontSize: 76, fontWeight: 600, opacity: progress(frame, 5, 16) }}>{B.name}</div>
  <div data-journal="slogan" style={{ position: 'absolute', top: 925, left: L.left + 90, width: TEXT_WIDTH - 180, textAlign: 'center', textWrap: 'balance', fontSize: 36, lineHeight: 1.45, color: C.muted, fontWeight: 400, opacity: progress(frame, 9, 16) }}>{B.slogan}</div>
  <div data-journal="follow-prompt" data-confirmed={follow.confirmed} style={{ position: 'absolute', left: L.left + (TEXT_WIDTH - 310) / 2, top: 1160, width: 310, height: 94, borderRadius: 47, background: interpolateColors(follow.activation, [0, 1], [C.accent, C.ink]), color: C.paper, display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 600, opacity: progress(frame, 12, 16), transform: `scale(${1 + (follow.scale - 1) * .2})` }}>{follow.confirmed ? 'Following' : 'Follow'}</div>
  <div style={{ position: 'absolute', left: L.left, top: 1360, width: TEXT_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64 }}>
    {[0, 1].map(index => <OutroAction key={index} index={index} frame={frame} />)}
  </div>
  </AbsoluteFill>;
};

export const JournalOutro: React.FC = () => <><JournalFonts /><Outro frame={useCurrentFrame()} /></>;

export const JournalFilm: React.FC<ProductionProps> = ({ production: p, debugOverlay = false }) => {
  const current = useCurrentFrame();
  if (!p) throw new Error('Production metadata was not loaded');
  if (current >= p.durationInFrames) return p.outro === false ? null : <Sequence from={p.durationInFrames} durationInFrames={B.outroFrames}><JournalOutro /></Sequence>;
  const f = current;
  const index = p.shots.findIndex(s => f >= s.from && f < s.to);
  const shot = p.shots[Math.max(0, index)];
  const previous = p.shots[Math.max(0, index - 1)];
  const transitionSpec = shot.transition ?? ({ style: 'cut' } as const);
  const layoutTransition = index > 0 ? cameraTransition(f, shot.from) : 1;
  const transition = transitionSpec.style === 'cut' ? 1 : layoutTransition;
  const immersion = (shot.visual.kind === 'spaceflight' ? layoutTransition : 0) + (index > 0 && previous.visual.kind === 'spaceflight' ? 1 - layoutTransition : 0);
  const oldRect = box[previous.portrait], nextRect = box[shot.portrait];
  const rect = Object.fromEntries(Object.entries(nextRect).map(([key, value]) => [key, oldRect[key as keyof typeof oldRect] + (value - oldRect[key as keyof typeof oldRect]) * layoutTransition])) as typeof nextRect;
  const caption = p.captions.find(c => f >= c.from && f < c.to);
  return <AbsoluteFill style={{ background: C.background, color: C.ink, fontFamily: B.font, overflow: 'hidden' }}>
    <JournalFonts />
    <WorldBackdrop transitions={p.shots.map(s => s.transition)} index={index} transition={transition} opacity={1 - immersion} />
    {index > 0 && transition < 1 && <SpatialShot spec={transitionSpec} transition={transition} role="previous"><ShotArt shot={previous} frame={f} /></SpatialShot>}
    <SpatialShot spec={transitionSpec} transition={transition} role="current"><ShotArt shot={shot} frame={f} /></SpatialShot>
    <BrandLockup episode={p.episode} light={immersion} />
    <div data-journal="portrait" style={{ position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: rect.radius, overflow: 'hidden', outline: `1px solid ${C.line}`, outlineOffset: 10, zIndex: 4, opacity: 1 - immersion }}>
      <OffthreadVideo src={staticFile(p.media.program)} muted={Boolean(p.media.audio)} volume={p.media.volume ?? project.audio.voiceVolume} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.media.position }} />
      {previous.visual.kind === 'emotion' && index > 0 && layoutTransition < 1 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - layoutTransition }}><EmotionFrame visual={previous.visual} frame={f} /></div>}
      {shot.visual.kind === 'emotion' && <div style={{ position: 'absolute', inset: 0, opacity: layoutTransition }}><EmotionFrame visual={shot.visual} frame={f} /></div>}
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

import React from 'react';
import { interpolateColors } from 'remotion';
import brand from '../../brand.config.json';
import project from '../../project.config.json';
import type { Visual } from './types';
import { Plate, progress } from './visual-motion';
import { Spacecraft } from './Spacecraft';

const C = brand.palette;
const L = project.layout;
const W = project.video.width - L.left - L.right;
const H = 600;
type Props<K extends Visual['kind']> = { visual: Extract<Visual, { kind: K }>; frame: number };

const Stage: React.FC<{ label: string; tag?: string; children: React.ReactNode }> = ({ label, tag, children }) => <div style={{ position: 'absolute', left: L.left, top: 480, width: W }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 24, minHeight: 34, marginBottom: 24 }}>
    <div style={{ flex: 1, minWidth: 0, color: C.muted, fontSize: 28, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{label}</div>
    {tag && <div style={{ flexShrink: 0, color: C.muted, fontSize: 18, letterSpacing: 1 }}>{tag}</div>}
  </div>
  <div style={{ position: 'relative', width: W, height: H, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 20, overflow: 'hidden', boxSizing: 'border-box' }}>{children}</div>
</div>;

const Note: React.FC<{ text: string; at: number; frame: number }> = ({ text, at, frame }) => <Plate at={at} frame={frame} style={{ position: 'absolute', left: L.left + 380, top: 1230, width: W - 380, color: C.accent, fontSize: 36, lineHeight: 1.15, fontWeight: 600, overflowWrap: 'anywhere' }}>{text}</Plate>;

export const SceneVisual: React.FC<Props<'scene'>> = ({ visual, frame }) => {
  const beat = visual.beats.filter(item => frame >= item.at).at(-1);
  return <>
    <Stage label={visual.setting} tag="SCHEMATIC">
      <svg width={W} height={H}>
        <path d={`M30 550H${W - 30}M60 566H${W - 60}`} fill="none" stroke={C.line} strokeWidth={2} />
        {visual.actors.map(actor => {
          let x = actor.x, y = actor.y;
          for (const action of visual.beats.filter(item => item.actor === actor.id && frame >= item.at)) {
            const p = progress(frame, action.at, 28);
            x += (action.x - x) * p; y += (action.y - y) * p;
          }
          const color = beat?.actor === actor.id ? C.accent : C.ink;
          return <g key={actor.id} transform={`translate(${x * W} ${40 + y * 480})`} opacity={progress(frame, actor.at)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx={0} cy={60} rx={actor.shape === 'desk' ? 90 : 45} ry={7} fill={C.ink} opacity={.05} stroke="none" />
            {actor.shape === 'person' && <><circle cy={-32} r={18} fill={C.background} /><rect x={-21} y={-7} width={42} height={47} rx={16} fill={C.background} /><path d="M-21 1L-39 26M21 1L39 26M-11 40L-16 58M11 40L16 58" /></>}
            {actor.shape === 'desk' && <><rect x={-80} y={-12} width={160} height={18} rx={4} fill={C.background} /><path d="M-65 6V58M65 6V58M-65 30H65" /></>}
            {actor.shape === 'phone' && <><rect x={-26} y={-45} width={52} height={90} rx={9} fill={C.background} /><path d="M-8-34H8M-5 34H5" /></>}
            {actor.shape === 'door' && <><rect x={-40} y={-68} width={80} height={128} rx={4} fill={C.background} /><path d="M-28 60V-56H28V60" /><circle cx={16} cy={0} r={3} fill={color} /></>}
            {actor.shape === 'object' && <><rect x={-48} y={-36} width={96} height={80} rx={12} fill={C.background} /><path d="M-48-15H48M-14-36V-15H14V-36" /></>}
            <foreignObject x={-110} y={70} width={220} height={58} stroke="none"><div style={{ textAlign: 'center', fontSize: 22, lineHeight: 1.15, color, overflowWrap: 'anywhere' }}>{actor.label}</div></foreignObject>
          </g>;
        })}
      </svg>
    </Stage>
    {beat && <Note key={beat.at} text={beat.text} at={beat.at} frame={frame} />}
  </>;
};

const scattered = [[.22, .25], [.7, .2], [.43, .58], [.72, .8], [.2, .8], [.76, .49]];
const itemPose = (layout: 'scattered' | 'grouped' | 'aligned', index: number) => {
  if (layout === 'aligned') return { x: W / 2, y: 150 + index * 76, width: 620, height: 64, angle: 0 };
  if (layout === 'grouped') return { x: 160 + index % 3 * 280, y: 230 + Math.floor(index / 3) * 190, width: 230, height: 126, angle: 0 };
  return { x: scattered[index][0] * W, y: scattered[index][1] * H, width: 230, height: 116, angle: [-7, 5, -4, 7, -5, 3][index] };
};

export const TransformationVisual: React.FC<Props<'transformation'>> = ({ visual, frame }) => {
  const current = visual.states.filter(state => frame >= state.at).at(-1);
  return <>
    <Stage label={visual.subject}>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 14, display: 'flex', gap: 8 }}>
        {visual.states.map(state => <div key={state.at} style={{ flex: 1, padding: '8px 10px', borderBottom: `2px solid ${current?.at === state.at ? C.accent : C.line}`, color: current?.at === state.at ? C.accent : C.muted, opacity: progress(frame, state.at), fontSize: 18, lineHeight: 1.1, overflowWrap: 'anywhere' }}>{state.label}</div>)}
      </div>
      {visual.items.map((item, i) => {
        let pose = itemPose(visual.states[0].layout, i);
        for (const state of visual.states.slice(1).filter(state => frame >= state.at)) {
          const target = itemPose(state.layout, i), p = progress(frame, state.at, 30);
          pose = { x: pose.x + (target.x - pose.x) * p, y: pose.y + (target.y - pose.y) * p, width: pose.width + (target.width - pose.width) * p, height: pose.height + (target.height - pose.height) * p, angle: pose.angle + (target.angle - pose.angle) * p };
        }
        return <div key={item.id} style={{ position: 'absolute', left: pose.x - pose.width / 2, top: pose.y - pose.height / 2, width: pose.width, height: pose.height, opacity: progress(frame, visual.states[0].at), transform: `rotate(${pose.angle}deg)`, border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.accent}`, boxSizing: 'border-box', borderRadius: 12, background: C.background, boxShadow: `0 8px 18px ${C.ink}0a`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, textAlign: 'center', fontSize: 24, lineHeight: 1.2, fontWeight: 600, overflowWrap: 'anywhere' }}>{item.text}</div>;
      })}
    </Stage>
    {current && <Note key={current.at} text={current.label} at={current.at} frame={frame} />}
  </>;
};

export const RelationshipVisual: React.FC<Props<'relationship'>> = ({ visual, frame }) => <Stage label={visual.label}>
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
    {visual.edges.map((edge, i) => {
      const from = visual.nodes.find(node => node.id === edge.from)!;
      const to = visual.nodes.find(node => node.id === edge.to)!;
      const dx = (to.x - from.x) * W, dy = (to.y - from.y) * H, distance = Math.hypot(dx, dy);
      const ux = dx / distance, uy = dy / distance;
      const start = { x: from.x * W + ux * 100, y: from.y * H + uy * 100 };
      const end = { x: to.x * W - ux * 100, y: to.y * H - uy * 100 };
      const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const control = { x: Math.max(24, Math.min(W - 24, mid.x - uy * 100)), y: Math.max(24, Math.min(H - 24, mid.y + ux * 100)) };
      const feedback = edge.type === 'feedback';
      const path = feedback ? `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}` : `M${start.x} ${start.y}L${end.x} ${end.y}`;
      const angle = Math.atan2(end.y - (feedback ? control.y : start.y), end.x - (feedback ? control.x : start.x)) * 180 / Math.PI;
      const p = progress(frame, edge.at, 28);
      const color = edge.type === 'block' ? C.accent : C.ink;
      return <g key={i} opacity={frame >= edge.at ? 1 : 0}>
        <path d={path} fill="none" stroke={color} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
        {edge.type === 'block' ? <path d={`M${mid.x - uy * 13} ${mid.y + ux * 13}L${mid.x + uy * 13} ${mid.y - ux * 13}`} stroke={C.accent} strokeWidth={6} opacity={p} /> : <path d="M-12-7L0 0L-12 7" transform={`translate(${end.x} ${end.y}) rotate(${angle})`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={progress(frame, edge.at + 18, 10)} />}
        {edge.label && <text x={Math.max(190, Math.min(W - 190, feedback ? control.x : mid.x))} y={(feedback ? control.y : mid.y) - 18} textAnchor="middle" fontSize={22} fill={C.muted} stroke={C.paper} strokeWidth={8} paintOrder="stroke" opacity={p}>{edge.label}</text>}
      </g>;
    })}
  </svg>
  {visual.nodes.map(node => <div key={node.id} style={{ position: 'absolute', left: node.x * W - 84, top: node.y * H - 84, width: 168, height: 168, opacity: progress(frame, node.at), border: `1px solid ${C.line}`, borderRadius: '50%', background: C.background, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: 18, textAlign: 'center', fontSize: 28, lineHeight: 1.06, fontWeight: 600, overflowWrap: 'anywhere' }}>{node.text}</div>)}
</Stage>;

export const MapVisual: React.FC<Props<'map'>> = ({ visual, frame }) => {
  const space = visual.terrain === 'space';
  const leg = visual.legs.filter(item => frame >= item.at).at(-1);
  const origin = visual.places.find(place => place.id === visual.legs[0].from)!;
  const from = visual.places.find(place => place.id === (leg?.from ?? visual.legs[0].from))!;
  const to = leg ? visual.places.find(place => place.id === leg.to)! : from;
  const headingTo = leg ? to : visual.places.find(place => place.id === visual.legs[0].to)!;
  const t = leg ? Math.max(0, Math.min(1, (frame - leg.at) / (leg.arriveAt - leg.at))) : 0;
  const x = (from.x + (to.x - from.x) * t) * W, y = (from.y + (to.y - from.y) * t) * H;
  const zoom = 1 + Math.sin(t * Math.PI) * .18;
  const panX = Math.max(W * (1 - zoom), Math.min(0, W / 2 - x * zoom));
  const panY = Math.max(H * (1 - zoom), Math.min(0, H / 2 - y * zoom));
  const warmup = progress(frame, origin.at, Math.max(1, visual.legs[0].at - origin.at));
  return <>
    <Stage label={visual.label} tag="SCHEMATIC · NOT TO SCALE">
      <svg width={W} height={H}>
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          <rect width={W} height={H} fill={space ? C.ink : C.background} />
          {space ? <>
            {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={30 + ((i * 137 - t * (60 + i % 3 * 55)) % (W - 60) + W - 60) % (W - 60)} cy={30 + i * 83 % (H - 60)} r={i % 4 === 0 ? 2 : 1} fill={C.paper} opacity={.15 + i % 3 * .12} />)}
            <ellipse cx={W / 2} cy={H / 2} rx={W * .4} ry={H * .32} fill="none" stroke={C.paper} strokeWidth={1} strokeDasharray="4 10" opacity={.08} />
            <g transform={`translate(${origin.x * W} ${origin.y * H}) scale(${1 - t * .25})`}>
              <circle r={71} fill="#aacacb" opacity={.08} /><circle r={65} fill="#547f84" stroke="#9cbdba" strokeWidth={1.5} /><path d="M-42-44L-15-55L4-36L-6-16L-35-12L-47 7L-57-8Z M13-9L34-22L58-7L47 15L32 14L23 43L10 29Z" fill="#94ac8c" opacity={.8} /><path d="M-55-24Q-12-39 48-24M-53 16Q-2 6 55 20" fill="none" stroke="#d6e2d8" strokeWidth={5} opacity={.4} /><path d="M12-63A65 65 0 010 65A75 65 0 0040-50Z" fill="#173d3a" opacity={.42} />
            </g>
          </> : <>
            <path d={`M0 180H${W}M0 430H${W}M250 0V${H}M650 0V${H}`} stroke={C.line} strokeWidth={26} opacity={.36} />
            <path d={`M0 180H${W}M0 430H${W}M250 0V${H}M650 0V${H}`} stroke={C.paper} strokeWidth={2} strokeDasharray="12 12" />
            <rect x={330} y={230} width={230} height={125} rx={35} fill={C.line} opacity={.3} />
          </>}
          {visual.legs.map((route, i) => {
            const a = visual.places.find(place => place.id === route.from)!, b = visual.places.find(place => place.id === route.to)!;
            const p = Math.max(0, Math.min(1, (frame - route.at) / (route.arriveAt - route.at)));
            return <path key={i} d={`M${a.x * W} ${a.y * H}L${b.x * W} ${b.y * H}`} stroke={C.accent} strokeWidth={5} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} opacity={frame >= route.at ? .75 : 0} />;
          })}
          {visual.places.map(place => <g key={place.id} transform={`translate(${place.x * W} ${place.y * H})`} opacity={progress(frame, place.at)}>
            {!space && <><path d="M0 20C-5 12-16 1-16-9A16 16 0 1 1 16-9C16 1 5 12 0 20Z" fill={C.paper} stroke={C.ink} strokeWidth={2} /><circle cy={-6} r={5} fill={C.ink} /></>}
            <foreignObject x={-110} y={space ? Math.min(76, (H - panY) / zoom - place.y * H - 32) : 27} width={220} height={58}><div style={{ color: space ? C.paper : C.ink, textAlign: 'center', fontSize: 22, lineHeight: 1.15, fontWeight: 600, overflowWrap: 'anywhere' }}>{place.label}</div></foreignObject>
          </g>)}
          {space ? <Spacecraft x={x} y={y - 54} heading={Math.atan2((headingTo.y - from.y) * H, (headingTo.x - from.x) * W) * 180 / Math.PI} power={.04 + .96 * warmup} frame={frame} /> : <g transform={`translate(${x} ${y})`} opacity={progress(frame, origin.at)}>
            <circle r={21} fill={C.accent} opacity={.12} /><circle r={10} fill={C.accent} stroke={C.paper} strokeWidth={4} />
          </g>}
        </g>
        {space && <g transform="translate(26 28)"><rect width={180} height={62} rx={10} fill="#102d2b" stroke="#ffffff18" /><text x={14} y={21} fill="#c3d5ca" fontSize={12} letterSpacing={1.8}>FLIGHT CONTROL</text>{[0, 1, 2, 3].map(i => <rect key={i} x={14 + i * 25} y={34} width={17} height={11} rx={2} fill={warmup * 4 >= i + .8 ? '#e2b58b' : '#405d51'} />)}<text x={126} y={44} fill="#e5eade" fontSize={13}>{warmup >= .99 ? 'AHEAD 4' : 'READY'}</text></g>}
      </svg>
    </Stage>
    {leg && <Note key={leg.at} text={`${from.label} → ${to.label}`} at={leg.at} frame={frame} />}
  </>;
};

const moods = {
  tense: { density: 13, amplitude: 6, color: C.accent },
  frustrated: { density: 14, amplitude: 9, color: C.accent },
  hopeful: { density: 10, amplitude: 3, color: C.ink },
  calm: { density: 5, amplitude: 1, color: C.ink },
  confident: { density: 8, amplitude: 2, color: C.ink },
};
const emotionState = (visual: Extract<Visual, { kind: 'emotion' }>, frame: number) => {
  let state = { ...moods[visual.beats[0].mood] };
  for (const beat of visual.beats.slice(1).filter(beat => frame >= beat.at)) {
    const target = moods[beat.mood], p = progress(frame, beat.at, 30);
    state = { density: state.density + (target.density - state.density) * p, amplitude: state.amplitude + (target.amplitude - state.amplitude) * p, color: interpolateColors(p, [0, 1], [state.color, target.color]) };
  }
  return state;
};

export const EmotionVisual: React.FC<Props<'emotion'>> = ({ visual, frame }) => {
  const beat = visual.beats.filter(item => frame >= item.at).at(-1);
  if (!beat) return null;
  return <>
    <Plate key={`label-${beat.at}`} at={beat.at} frame={frame} style={{ position: 'absolute', left: L.left, top: 285, width: W, fontSize: 54, lineHeight: 1.08, fontWeight: 600, color: emotionState(visual, frame).color, overflowWrap: 'anywhere' }}>{beat.label}</Plate>
    <Plate key={`words-${beat.at}`} at={beat.at} frame={frame} style={{ position: 'absolute', left: L.left, top: 430, width: W, display: 'flex', gap: 14 }}>
      {beat.words.map((word, i) => <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 18, padding: '5px 10px', fontSize: 20, color: C.muted }}>{word}</div>)}
    </Plate>
  </>;
};

export const EmotionFrame: React.FC<Props<'emotion'>> = ({ visual, frame }) => {
  const state = emotionState(visual, frame);
  return <svg viewBox={`0 0 ${W} 1230`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: progress(frame, visual.beats[0].at) }} fill="none" stroke={state.color} strokeWidth={2} strokeLinecap="round">
    {[0, 1].map(side => <g key={side} transform={side ? `translate(${W} 0) scale(-1 1)` : undefined}>
      {Array.from({ length: 14 }, (_, i) => {
        const y = 40 + i * 82, wave = Math.sin(frame * .035 + i * 1.3) * state.amplitude;
        return <path key={i} d={`M12 ${y}Q${24 + wave} ${y + 20} 12 ${y + 40}`} opacity={Math.max(0, Math.min(1, state.density - i)) * .42} />;
      })}
    </g>)}
  </svg>;
};

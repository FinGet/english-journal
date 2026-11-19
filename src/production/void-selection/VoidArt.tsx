import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import brand from '../../../brand.config.json';
import project from '../../../project.config.json';
import { BlockSwap } from '../../components/remocn/block-swap';
import { BottomUpLetters } from '../../components/remocn/bottom-up-letters';
import { BugDock } from '../../components/remocn/bug-dock';
import { CrashZoom } from '../../components/remocn/crash-zoom';
import { ExplodedView } from '../../components/remocn/exploded-view';
import { GravityPile } from '../../components/remocn/gravity-pile';
import { IsometricBuild } from '../../components/remocn/isometric-build';
import { SoftBlurIn } from '../../components/remocn/soft-blur-in';
import { Synthwave } from '../../components/remocn/synthwave';
import { PathSearch } from '../../components/remocn/path-search';
import { PhoneScroll } from '../../components/remocn/phone-scroll';
import { ExtrudePop } from '../../components/remocn/extrude-pop';
import type { Shot } from '../types';

const ease = Easing.bezier(.22, 1, .36, 1);
export const progress = (frame: number, start: number, duration = 18) => ease(Math.max(0, Math.min(1, (frame - start) / duration)));

export const VOID = {
  bg: '#07090f',
  ink: '#f4f7fb',
  muted: '#8b9aab',
  accent: '#ffb454',
  danger: '#e5322d',
  cyan: '#63e8ff',
  panel: '#101822',
};

const L = project.layout;

export const VoidBackdrop: React.FC<{ shot: Shot; frame: number }> = ({ shot, frame }) => {
  const tech = shot.id === 'tech-stack' || shot.id === 'topic-shift';
  return <AbsoluteFill style={{ background: VOID.bg, overflow: 'hidden' }}>
    <AbsoluteFill>
      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 97 + 13) % 100;
        const y = (i * 53 + frame * (.08 + (i % 5) * .02)) % 100;
        return <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 2 + i % 3, height: 2 + i % 3, borderRadius: '50%', background: VOID.cyan, opacity: .18 + (i % 4) * .06, boxShadow: `0 0 8px ${VOID.cyan}` }} />;
      })}
    </AbsoluteFill>
    {tech && <AbsoluteFill style={{ opacity: .55 }}><Synthwave speed={.85} horizon={.62} gridSpeed={1.1} /></AbsoluteFill>}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 18%, ${VOID.danger}22 0%, transparent 42%), radial-gradient(ellipse at 70% 80%, ${VOID.cyan}14 0%, transparent 50%)` }} />
    <AbsoluteFill style={{ opacity: interpolate(frame % 180, [0, 90, 180], [.08, .14, .08]), backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '100% 4px', mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
  </AbsoluteFill>;
};

export const VoidBrand: React.FC<{ episode: number; mode?: 'mark' | 'hidden' }> = ({ episode, mode = 'mark' }) => {
  if (mode === 'hidden') return null;
  return <div data-journal="brand" style={{ position: 'absolute', left: 48, top: 48, zIndex: 30, display: 'flex', alignItems: 'center', gap: 14, color: VOID.ink }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: VOID.danger, color: VOID.ink, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 700 }}>{brand.mark}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -.5 }}>{brand.name}</div>
      <div style={{ marginTop: 4, fontSize: 18, color: VOID.muted }}>EP.{String(episode).padStart(2, '0')} · VOID</div>
    </div>
  </div>;
};

const RenameScreen: React.FC<{ frame: number; from: number; oldName: string; newName: string }> = ({ frame, from, oldName, newName }) => {
  const local = frame - from;
  const renaming = local >= 212;
  const saved = local >= 325;
  const name = saved ? newName : renaming ? newName.slice(0, Math.max(1, Math.floor((local - 212) / 4))) : oldName;
  return <div style={{ width: 393, minHeight: 1100, background: '#0c1218', color: '#e8eef5', fontFamily: brand.font, padding: '64px 18px 40px', boxSizing: 'border-box' }}>
    <div style={{ fontSize: 13, color: '#9aa8b8', marginBottom: 10 }}>Group · illustrated · not a chat log</div>
    <div style={{ fontSize: 30, fontWeight: 750, lineHeight: 1.15, minHeight: 70 }}>{name || ' '}</div>
    <div style={{ marginTop: 22, display: 'grid', gap: 12 }}>
      {[oldName, newName].map((line, i) => <div key={line} style={{ opacity: Math.max(progress(frame, from + 24 + i * 28, 16), .35), padding: '16px 14px', borderRadius: 16, background: i === 1 && renaming ? '#1a2733' : '#141b24', border: `1px solid ${i === 1 && renaming ? VOID.cyan : '#334455'}`, fontSize: 22, fontWeight: 650 }}>{line}</div>)}
    </div>
    <div style={{ marginTop: 28, opacity: Math.max(progress(frame, from + 180, 18), .2), padding: '18px 14px', borderRadius: 18, background: '#15202b', border: `1px solid ${VOID.accent}88` }}>
      <div style={{ fontSize: 13, color: VOID.muted, marginBottom: 8 }}>{saved ? 'Saved' : renaming ? 'Editing group name' : 'Open group info'}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: VOID.accent }}>{name}</div>
    </div>
  </div>;
};

const DeadTerminal: React.FC<{ frame: number; from: number }> = ({ frame, from }) => {
  const local = frame - from;
  return <AbsoluteFill style={{ background: '#05070b', color: '#b7f7c2', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
    <div style={{ position: 'absolute', left: 80, right: 80, top: 420, fontSize: 28, lineHeight: 1.55 }}>
      <div>$ frontend-evolution --status</div>
      <div style={{ marginTop: 18, opacity: progress(frame, from + 20, 14) }}>building workspace…</div>
      <div style={{ marginTop: 12, opacity: progress(frame, from + 70, 14), color: VOID.accent }}>warning: programmers being replaced</div>
      <div style={{ marginTop: 18, fontSize: 64, fontWeight: 800, color: VOID.danger, opacity: progress(frame, from + 120, 18) }}>404</div>
      <div style={{ marginTop: 10, opacity: progress(frame, from + 130, 14) }}>evolved right out of existence</div>
    </div>
    <div style={{ position: 'absolute', left: 80, bottom: 420, opacity: .55 + Math.sin(local * .2) * .1 }}>▌</div>
  </AbsoluteFill>;
};

export const VoidShotArt: React.FC<{ shot: Shot; frame: number }> = ({ shot, frame }) => {
  const v = shot.visual;

  if (shot.id === 'hook') {
    return <CrashZoom tease="Frontend is…" reveal="DEAD." tagline="a personal judgment, not a market report" theme="dark" background={VOID.bg} ink={VOID.ink} windup={28} delay={0} scale={1.05} />;
  }

  if (v.kind === 'group-chat') {
    return <PhoneScroll theme="dark" background={VOID.bg} ink={VOID.ink} accent={VOID.cyan} label="Rename the group." labelAccent="Rename" eyebrow="WeChat · illustrated" stops={[0]} scale={1.08} motionBlur={false}>
      <RenameScreen frame={frame} from={shot.from} oldName={v.oldName} newName={v.newName} />
    </PhoneScroll>;
  }

  if (shot.id === 'group-origin') {
    return <AbsoluteFill>
      <IsometricBuild background={VOID.bg} color="#d7e0ea" accent={VOID.accent} grid={6} maxHeight={2.6} seed={19} speed={1.05} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', paddingBottom: 280 }}>
        <BottomUpLetters text="2019" fontSize={120} color={VOID.ink} fontWeight={800} staggerDelay={2} />
      </div>
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 360, textAlign: 'center', color: VOID.muted, fontSize: 28, opacity: progress(frame, shot.from + 40, 18) }}>The year the group began</div>
    </AbsoluteFill>;
  }

  if (shot.id === 'tech-stack') {
    return <AbsoluteFill>
      <ExplodedView backgroundColor="transparent" layers={4} labels={['Interface', 'React', 'CSS', 'Ship']} highlight={0} labelColor={VOID.ink} speed={1.1} />
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 300, height: 120 }}>
        <SoftBlurIn text="All about tech" fontSize={52} color={VOID.ink} fontWeight={700} />
      </div>
    </AbsoluteFill>;
  }

  if (shot.id === 'topic-shift') {
    return <ExplodedView backgroundColor="transparent" layers={4} labels={['AI risk', 'Jobs', 'Chat', 'Old stack']} highlight={0} labelColor={VOID.ink} speed={1.05} />;
  }

  if (shot.id === 'new-normal') {
    const words = ['Layoffs', 'Anxiety', 'Lost', 'Normal'];
    return <GravityPile count={28} seed={23} gravity={.92} accentColor={VOID.danger} backgroundColor="transparent" colors={{ shapes: ['#1b2733', '#243445', '#314457'], accent: VOID.danger, floor: '#334155' }} items={words.map(word => <div key={word} style={{ width: '100%', height: '100%', borderRadius: '50%', background: VOID.panel, border: `2px solid ${VOID.accent}`, display: 'grid', placeItems: 'center', color: VOID.ink, fontSize: 16, fontWeight: 700 }}>{word}</div>)} />;
  }

  if (shot.id === 'evolved-away') {
    const collapse = progress(frame, 1527, 22);
    return <AbsoluteFill style={{ background: '#020305', transform: `scaleY(${1 - collapse * .92})`, transformOrigin: '50% 50%', filter: `brightness(${1 + collapse * 1.8})`, overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: .22, backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 3px, #63e8ff22 3px 4px)' }} />
      <DeadTerminal frame={frame} from={shot.from} />
      <AbsoluteFill style={{ opacity: collapse, background: `radial-gradient(circle at 50% 50%, ${VOID.cyan} 0 2px, #000 3px)` }} />
    </AbsoluteFill>;
  }

  if (shot.id === 'pause-before-reference') {
    return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${VOID.cyan}18, transparent 45%)` }}>
      <SoftBlurIn text="Out of existence?" fontSize={64} color={VOID.ink} fontWeight={700} />
    </AbsoluteFill>;
  }

  if (shot.id === 'the-dark-forest') {
    return <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: .4 }}>
        <PathSearch background="transparent" ink={VOID.ink} accent={VOID.danger} startLabel="NOW" goalLabel="FEAR" theme="dark" scale={1.05} floodStep={3} trace={28} grain={false} />
      </div>
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 360, textAlign: 'center' }}>
        <SoftBlurIn text="A STORY" fontSize={88} color={VOID.ink} fontWeight={800} />
      </div>
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 520, textAlign: 'center', color: VOID.muted, fontSize: 30, opacity: progress(frame, shot.from + 36, 18) }}>
        not a prop · a pressure
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1100 }}>
        <BottomUpLetters text="ESCAPE?" fontSize={72} color={VOID.accent} fontWeight={800} staggerDelay={2} />
      </div>
    </AbsoluteFill>;
  }

  if (shot.id === 'ahead-four') {
    const local = frame - shot.from;
    const command = local >= 260;
    return <AbsoluteFill>
      <PathSearch background="transparent" ink={VOID.ink} accent={VOID.cyan} startLabel="HERE" goalLabel="FORWARD" theme="dark" scale={1.12} floodStep={2} trace={40} grain={false} />
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 280, textAlign: 'center', opacity: progress(frame, shot.from + 12, 16) }}>
        <div style={{ fontSize: 28, color: VOID.muted, letterSpacing: 4, textTransform: 'uppercase' }}>command line</div>
        <div style={{ marginTop: 18, fontSize: command ? 92 : 64, fontWeight: 800, color: command ? VOID.accent : VOID.ink, letterSpacing: -2 }}>
          {command ? 'AHEAD FOUR' : 'NATURAL SELECTION'}
        </div>
      </div>
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 1280, textAlign: 'center', color: VOID.muted, fontSize: 28, opacity: progress(frame, shot.from + 420, 20) }}>
        keep moving into the blank
      </div>
    </AbsoluteFill>;
  }

  if (shot.id === 'unknown-future') {
    return <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: .35, color: VOID.cyan, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 18, lineHeight: 1.4, padding: 40, whiteSpace: 'pre-wrap' }}>
        {Array.from({ length: 40 }, (_, i) => `${(i * 37 % 97).toString(2).padStart(8, '0')} UNKNOWN FUTURE MAP MISSING\n`).join('')}
      </div>
      <SoftBlurIn text="UNKNOWN" fontSize={110} color={VOID.ink} fontWeight={800} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 980, height: 320, opacity: .85 }}>
        <ExtrudePop width={1080} height={320} letter="?" fontFamily={brand.font} fontSize={180} basePosition={[540, 220]} maxTextWidth={400} minimaxRadius={28} extrudeSteps={28} extrudeStartFrame={shot.from} extrudeEndFrame={shot.from + 36} bodyColor={VOID.cyan} faceColor={VOID.ink} />
      </div>
    </AbsoluteFill>;
  }

  if (shot.id === 'only-choice') {
    return <BlockSwap theme="dark" background={VOID.bg} ink={VOID.ink} accent={VOID.accent} lines={['Turns out', 'Move forward', 'Keep going']} highlight="Keep going" hold={34} scale={1.08} />;
  }

  if (v.kind === 'closing' || shot.id === 'keep-going') {
    return <AbsoluteFill>
      <BugDock name={brand.name} headline="Keep going, buddy." highlight="going" accent={VOID.accent} ink={VOID.ink} background={VOID.bg} />
      <div style={{ position: 'absolute', left: L.left, right: L.right, top: 1280, textAlign: 'center', color: VOID.muted, fontSize: 34, opacity: progress(frame, v.kind === 'closing' ? v.at : shot.from + 40, 16) }}>{v.kind === 'closing' ? v.prompt : 'See you.'}</div>
    </AbsoluteFill>;
  }

  if (v.kind === 'speaker') {
    return <AbsoluteFill style={{ display: 'grid', placeItems: 'center' }}>
      <SoftBlurIn text={shot.titles[0]?.text ?? brand.name} fontSize={70} color={VOID.ink} fontWeight={700} />
    </AbsoluteFill>;
  }

  return null;
};

export const voidPortraitGlow = `0 0 0 1px ${VOID.cyan}55, 0 18px 40px #0008`;

import React from 'react';
import { Img, staticFile } from 'remotion';
import brand from '../../brand.config.json';
import project from '../../project.config.json';
import type { Shot, Visual } from './types';
import { ElementReveal, progress } from './visual-motion';

const C = brand.palette, L = project.layout;
const W = project.video.width - L.left - L.right;
const green = '#07b75b';
type Props<K extends Visual['kind']> = { visual: Extract<Visual, { kind: K }>; shot: Shot; frame: number };

const Arrow: React.FC<{ back?: boolean }> = ({ back }) => <svg width={22} height={28} viewBox="0 0 22 28" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d={back ? 'M15 5L6 14L15 23' : 'M7 5L16 14L7 23'} /></svg>;
const Person: React.FC<{ color?: string; size?: number }> = ({ color = '#b6c7c0', size = 48 }) => <svg width={size} height={size} viewBox="0 0 48 48"><rect width={48} height={48} rx={10} fill={color} /><circle cx={24} cy={18} r={8} fill="#fff" opacity={.9} /><path d="M9 43C9 25 39 25 39 43" fill="#fff" opacity={.9} /></svg>;
const Touch: React.FC<{ x: number; y: number; at: number; frame: number }> = ({ x, y, at, frame }) => {
  const p = progress(frame, at, 24);
  return <div style={{ position: 'absolute', left: x - 24, top: y - 24, width: 48, height: 48, border: `2px solid ${green}`, borderRadius: '50%', background: '#07b75b18', opacity: frame >= at ? 1 - p : 0, transform: `scale(${.5 + p * 1.1})`, pointerEvents: 'none' }} />;
};

const Keyboard: React.FC<{ frame: number; at: number; phone?: boolean }> = ({ frame, at, phone = false }) => <div style={{ padding: phone ? '14px 7px 12px' : '9px 18px', borderRadius: phone ? 0 : 12, background: phone ? '#d6d9de' : 'linear-gradient(#e2e6e5,#bbc4c2)', border: phone ? undefined : '1px solid #a1aeaa', boxShadow: phone ? undefined : '0 12px 20px #173d3a16' }}>
  {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, r) => <div key={r} style={{ display: 'flex', justifyContent: 'center', gap: phone ? 6 : 8, marginBottom: phone ? 10 : 5 }}>
    {Array.from(row).map((key, i) => <div key={key} style={{ width: phone ? 43 : 47, height: phone ? 48 : 19, borderRadius: phone ? 6 : 3, background: frame >= at && frame < at + 90 && Math.floor((frame - at) / 5) % row.length === i && r === 1 ? '#b8d5c5' : '#f8f9fa', boxShadow: '0 1px 1px #4a575940', textAlign: 'center', lineHeight: phone ? '48px' : '19px', fontSize: phone ? 23 : 11, color: '#384341' }}>{key}</div>)}
  </div>)}
  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
    {phone && <div style={{ width: 67, height: 46, borderRadius: 6, background: '#bcc2cb', display: 'grid', placeItems: 'center', fontSize: 19 }}>123</div>}
    <div style={{ width: phone ? 260 : 330, height: phone ? 46 : 20, background: '#f8f9fa', borderRadius: 5, boxShadow: '0 1px 1px #4a575940', textAlign: 'center', lineHeight: '46px', fontSize: 18, color: '#77817e' }}>{phone ? 'space' : ''}</div>
    {phone && <div style={{ width: 88, height: 46, borderRadius: 6, background: '#bcc2cb', display: 'grid', placeItems: 'center', fontSize: 18 }}>return</div>}
  </div>
</div>;

const codeLines = ['<main className="page">', '  <Navigation />', '  <section className="hero">', '    <h1>Build something.</h1>', '    <Button>Explore</Button>', '  </section>', '  <CardGrid columns={3} />', '</main>'];
const cssLines = ['.page {', '  display: grid;', '  gap: 24px;', '  padding: 32px;', '}', '.hero {', '  border-radius: 18px;', '  background: #dfece5;', '}'];
const browserPointers = { load: { x: 420, y: 340 }, style: { x: 172, y: 188 }, assist: { x: 216, y: 58 }, inspect: { x: 640, y: 306 }, responsive: { x: 733, y: 58 }, empty: { x: 640, y: 306 } };

export const BrowserVisual: React.FC<Props<'browser'>> = ({ visual, shot, frame }) => {
  const beat = visual.beats.filter(item => frame >= item.at).at(-1) ?? visual.beats[0];
  const prior = visual.beats.filter(item => item.at < beat.at).at(-1);
  const p = progress(frame, beat.at, 28);
  const paneActions = ['style', 'assist', 'inspect'];
  const pane = 270 * ((prior && paneActions.includes(prior.action) ? 1 - p : 0) + (paneActions.includes(beat.action) ? p : 0));
  const styledAt = visual.beats.find(item => item.action === 'style')?.at;
  const styled = styledAt === undefined ? (beat.action === 'load' ? 0 : 1) : progress(frame, styledAt, 54);
  const mobile = beat.action === 'responsive' ? progress(frame, beat.at, 50) : 0;
  const empty = beat.action === 'empty' ? progress(frame, beat.at + 12, 60) : 0;
  const lines = beat.action === 'style' ? cssLines : codeLines;
  const typed = beat.action === 'assist' ? Math.ceil(progress(frame, beat.at, 88) * lines.length) : lines.length;
  const contentWidth = 836 - pane - 40;
  const cursorTarget = browserPointers[beat.action], cursorFrom = browserPointers[prior?.action ?? 'load'];
  return <div data-journal="browser-device" style={{ position: 'absolute', left: L.left, top: 475, width: W, opacity: progress(frame, shot.from, 14) }}>
    <div style={{ position: 'absolute', left: W / 2 - 55, top: 576, width: 110, height: 100, background: 'linear-gradient(90deg,#8b9995,#dce3e0 35%,#a9b4b0 70%,#87948f)', clipPath: 'polygon(22% 0,78% 0,100% 100%,0 100%)' }} />
    <div style={{ position: 'absolute', left: W / 2 - 180, top: 661, width: 360, height: 25, borderRadius: '12px 12px 6px 6px', background: 'linear-gradient(#dbe2de,#8c9993)', boxShadow: '0 10px 14px #173d3a20' }} />
    <div style={{ position: 'relative', height: 590, borderRadius: 23, border: '1px solid #0c1e1a', background: 'linear-gradient(135deg,#49534f,#151c19 20%,#303b35 95%)', boxShadow: '0 22px 42px #173d3a28, inset 0 1px 1px #ffffff70', padding: 22, boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', left: W / 2 - 3, top: 9, width: 6, height: 6, borderRadius: '50%', background: '#0a0f0d', boxShadow: 'inset 0 0 2px #7e9999' }} />
      <div style={{ position: 'relative', width: 836, height: 514, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '0 13px', background: '#e4e9e7' }}>
          {['#d8766e', '#dfbb67', '#7ea98c'].map(color => <div key={color} style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />)}
          <div style={{ marginLeft: 12, alignSelf: 'flex-end', padding: '7px 24px', borderRadius: '8px 8px 0 0', background: '#f8faf9', fontSize: 14, color: '#52645d' }}>{visual.siteTitle}<span style={{ marginLeft: 35, color: '#9aaa9f' }}>×</span></div>
          <span style={{ marginLeft: 8, color: '#7c8d84', fontSize: 20 }}>+</span>
        </div>
        <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 18, background: '#f8faf9', borderBottom: '1px solid #dce4df' }}>
          <span style={{ color: '#688277', fontSize: 20 }}>‹</span><span style={{ color: '#acb7b1', fontSize: 20 }}>›</span><span style={{ color: '#688277', fontSize: 19 }}>↻</span>
          <div style={{ flex: 1, background: '#e9eeeb', borderRadius: 14, padding: '5px 17px', fontSize: 14, color: '#6b7e74' }}><span style={{ marginRight: 14 }}>◦</span>{visual.url}</div>
          <span style={{ fontSize: 14, color: '#668172' }}>•••</span>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 76, width: pane, bottom: 24, overflow: 'hidden', background: '#17221f', color: '#d7e5dc' }}>
          <div style={{ width: 270, padding: '12px 16px', fontSize: 15, borderBottom: '1px solid #35443e', boxSizing: 'border-box', color: '#a9c4b5' }}>{beat.action === 'assist' ? '✦ AI assistant · draft' : beat.action === 'style' ? 'style.css' : 'page.tsx'}</div>
          <div style={{ width: 270, paddingTop: 16, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 15, lineHeight: '29px', whiteSpace: 'pre' }}>
            {lines.map((line, i) => <div key={i} style={{ opacity: i < typed ? 1 : .08 }}><span style={{ display: 'inline-block', width: 30, textAlign: 'right', marginRight: 15, color: '#64796e', fontSize: 12 }}>{i + 1}</span><span style={{ color: i % 3 === 0 ? '#d4b48e' : '#9ccebb' }}>{line}</span></div>)}
          </div>
          {beat.action === 'assist' && <div style={{ position: 'absolute', left: 16, bottom: 15, fontSize: 13, color: '#a4b9ad' }}>{typed < lines.length ? 'Building a draft…' : 'Preview ready'}</div>}
        </div>
        <div style={{ position: 'absolute', left: pane, top: 76, right: 0, bottom: 24, background: mobile > 0 ? '#dce3df' : '#fff', overflow: 'hidden' }}>
          <div style={{ position: 'relative', margin: '0 auto', width: contentWidth + 40 - (contentWidth - 280) * mobile, height: '100%', background: '#fff', padding: '18px 20px', boxSizing: 'border-box', opacity: 1 - empty }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 18, borderBottom: '1px solid #e3eae5' }}><div style={{ width: 21, height: 21, borderRadius: 6, background: styled > .4 ? C.accent : '#d8e3dc', transform: 'rotate(-9deg)' }} /><span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>STUDIO</span><div style={{ marginLeft: 'auto', fontSize: 12, color: '#6a8073' }}>{mobile > .5 ? '☰' : 'Work     About     Contact'}</div></div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 22, padding: `${16 * styled}px`, borderRadius: 14, background: styled > .1 ? '#e7efe9' : '#f0f2f1' }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ marginBottom: 8, fontSize: 10, letterSpacing: 2, color: '#6e8b79' }}>WEB EXPERIENCE</div><div style={{ fontSize: mobile > .5 ? 30 : 36, fontWeight: 600, letterSpacing: -1.1, lineHeight: 1.03, color: C.ink }}>Design.<br />Build. Ship.</div><div style={{ width: 110, height: 9, background: '#c4d1c8', borderRadius: 5, marginTop: 14 }} /><div style={{ marginTop: 16, display: 'inline-block', padding: '9px 15px', borderRadius: 7 + styled * 7, background: styled > .4 ? C.ink : '#d1dcd5', color: styled > .4 ? '#fff' : '#7d9585', fontSize: 13 }}>Explore work <span style={{ marginLeft: 8 }}>↗</span></div></div>
              {mobile < .5 && <svg width={110 + (contentWidth > 600 ? 60 : 0)} height={160} viewBox="0 0 170 160"><ellipse cx={90} cy={139} rx={64} ry={10} fill="#b9cabe" opacity={.35} /><path d="M26 44L98 18L151 47L78 76Z" fill={styled > .4 ? '#a9c0af' : '#d3dcd5'} /><path d="M26 44V109L78 140V76Z" fill="#c8d8cc" /><path d="M78 76L151 47V110L78 140Z" fill={styled > .4 ? '#789a86' : '#bdcdc1'} /><circle cx={75} cy={35} r={24} fill={styled > .4 ? '#b86c4e' : '#d6dfd7'} /><path d="M58 119L127 93" stroke="#eff5f0" strokeWidth={2} /></svg>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mobile > .5 ? 1 : 3},1fr)`, gap: 12, marginTop: 18 }}>
              {[0, 1, 2].map(i => <ElementReveal key={i} at={shot.from + 10 + i * 14} frame={frame} duration={30} transition={{ style: 'slide', from: 'bottom' }} distance={18} style={{ border: '1px solid #dde5df', borderRadius: 9, padding: 10, background: '#fff' }}><div style={{ height: mobile > .5 ? 18 : 33, borderRadius: 4, background: ['#c8d9cd', '#e1cabb', '#c8d7d8'][i], marginBottom: 9 }} /><div style={{ height: 5, width: '70%', background: '#bccbc0', borderRadius: 3 }} /><div style={{ height: 4, width: '90%', background: '#e0e7e1', borderRadius: 3, marginTop: 6 }} /></ElementReveal>)}
            </div>
          </div>
          {beat.action === 'empty' && <ElementReveal at={beat.at + 12} frame={frame} transition={{ style: 'cut' }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8faf8' }}><svg width={58} height={64} viewBox="0 0 58 64" fill="none" stroke={C.muted} strokeWidth={2}><path d="M10 2H35L48 16V62H10Z M35 2V16H48 M20 34L36 48M36 34L20 48" /></svg><div style={{ marginTop: 10, fontSize: 86, lineHeight: 1, letterSpacing: -4, color: C.ink }}>404</div><div style={{ marginTop: 14, color: C.muted, fontSize: 22 }}>Page not found</div></ElementReveal>}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: '#eff3f0', borderTop: '1px solid #d5e0d7', padding: '4px 13px', boxSizing: 'border-box', fontSize: 11, color: '#658172' }}>◦ Local preview<span style={{ float: 'right' }}>Illustrated interface</span></div>
        <svg width={30} height={38} viewBox="0 0 30 38" style={{ position: 'absolute', left: cursorFrom.x + (cursorTarget.x - cursorFrom.x) * p, top: cursorFrom.y + (cursorTarget.y - cursorFrom.y) * p, filter: 'drop-shadow(1px 2px 2px #0003)' }}><path d="M2 2V30L10 22L16 35L21 32L15 20H27Z" fill="#fff" stroke="#193a2b" strokeWidth={1.8} /></svg>
        <Touch x={cursorTarget.x + 9} y={cursorTarget.y + 12} at={beat.at + 26} frame={frame} />
      </div>
      <div style={{ position: 'absolute', bottom: 15, left: W / 2 - 17, width: 34, height: 4, borderRadius: 2, background: '#6f8377' }} />
    </div>
    <div style={{ position: 'absolute', left: 40, top: 724, width: W - 80 }}><Keyboard frame={frame} at={beat.action === 'assist' ? beat.at : -1000} /></div>
  </div>;
};

const ChatBubble: React.FC<{ text: string; index: number; at: number; frame: number }> = ({ text, index, at, frame }) => <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 23, opacity: progress(frame, at, 22), transform: `translateY(${(1 - progress(frame, at, 22)) * 18}px)` }}>
  <Person size={46} color={['#b7c8bd', '#b4c8ce', '#cbbdac', '#adbcc8'][index % 4]} />
  <div style={{ position: 'relative', background: '#fff', borderRadius: 8, padding: '13px 17px', maxWidth: 342, boxSizing: 'border-box', fontSize: 26, lineHeight: 1.25, color: '#202b25', boxShadow: '0 1px 0 #00000008' }}><div style={{ position: 'absolute', left: -7, top: 18, width: 13, height: 13, background: '#fff', transform: 'rotate(45deg)' }} />{text}</div>
</div>;

export const GroupChatVisual: React.FC<Props<'group-chat'>> = ({ visual, shot, frame }) => {
  const beat = visual.beats.filter(item => frame >= item.at).at(-1) ?? visual.beats[0];
  const savedAt = visual.beats.find(item => item.action === 'saved')?.at;
  const saved = savedAt !== undefined && frame >= savedAt;
  const currentName = saved ? visual.newName : visual.oldName;
  const info = beat.action === 'info' || beat.action === 'saved';
  const rename = beat.action === 'rename';
  const typed = visual.newName.slice(0, Math.floor(progress(frame, beat.at + 16, 76) * visual.newName.length));
  return <div data-journal="group-chat-device" style={{ position: 'absolute', inset: 0, opacity: progress(frame, shot.from, 14) }}>
    {visual.since ? <div style={{ position: 'absolute', left: L.left, top: 660, width: 272, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 12px 16px #173d3a15)' }}>
      <div style={{ position: 'absolute', inset: '8px -4px -7px 5px', background: '#dfe6df', border: `1px solid ${C.line}`, borderRadius: 14 }} />
      <div style={{ position: 'relative', borderRadius: 14, background: '#fff', overflow: 'hidden', border: `1px solid ${C.line}` }}><div style={{ background: C.accent, padding: '14px 22px', color: '#fff', fontSize: 19, letterSpacing: 3 }}>STARTED</div><div style={{ padding: '34px 16px 38px', textAlign: 'center', fontSize: 86, fontWeight: 600, letterSpacing: -4 }}>{visual.since}</div></div>
      {[64, 194].map(x => <div key={x} style={{ position: 'absolute', left: x, top: -9, width: 10, height: 29, borderRadius: 5, background: '#788c7c', boxShadow: 'inset 2px 0 2px #ffffff80' }} />)}
    </div> : <div style={{ position: 'absolute', left: L.left, top: 650, width: 270 }}>
      <div style={{ position: 'relative', height: 144 }}><svg width={240} height={140} style={{ position: 'absolute', inset: 0 }}><path d="M42 39L125 81L204 28M125 81L192 122" fill="none" stroke={C.line} strokeWidth={2} /></svg>{[[12, 8], [95, 50], [174, 0], [162, 92]].map(([x, y], i) => <div key={i} style={{ position: 'absolute', left: x, top: y, padding: 4, background: C.paper, borderRadius: 14, boxShadow: '0 4px 10px #173d3a0c' }}><Person size={46} color={['#b7c8bd', '#b4c8ce', '#cbbdac', '#adbcc8'][i]} /></div>)}</div>
      <div style={{ marginTop: 30, fontSize: 18, letterSpacing: 2, color: C.muted }}>GROUP NAME</div>
      <div style={{ marginTop: 18, fontSize: 34, lineHeight: 1.14, fontWeight: 600, letterSpacing: -.7, overflowWrap: 'anywhere' }}>{currentName}</div>
      {saved && <ElementReveal at={savedAt ?? beat.at} frame={frame} transition={{ style: 'fade' }} style={{ marginTop: 20, color: green, fontSize: 22 }}>✓ Updated</ElementReveal>}
    </div>}
    <div style={{ position: 'absolute', left: L.left, top: 1115, color: C.muted, fontSize: 18, letterSpacing: .6 }}>Illustrated interface</div>
    <div style={{ position: 'absolute', left: L.left + 330, top: 465, width: 550, height: 1040, borderRadius: 74, background: 'linear-gradient(105deg,#7f8b85,#151d19 3%,#121915 97%,#697c70)', boxShadow: '0 26px 48px #173d3a28, inset 0 0 0 2px #63756a', padding: 14, boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', left: -4, top: 190, width: 4, height: 80, borderRadius: 4, background: '#78877e' }} /><div style={{ position: 'absolute', right: -4, top: 245, width: 4, height: 110, borderRadius: 4, background: '#78877e' }} />
      <div style={{ position: 'relative', height: '100%', borderRadius: 61, background: '#ededed', overflow: 'hidden', color: '#202721' }}>
        <div style={{ height: 57, background: '#f8f8f8', position: 'relative' }}><div style={{ position: 'absolute', left: 30, top: 17, fontSize: 21, fontWeight: 600 }}>9:41</div><div style={{ position: 'absolute', left: 207, top: 10, width: 108, height: 29, background: '#111713', borderRadius: 18 }} /><svg width={88} height={25} viewBox="0 0 88 25" style={{ position: 'absolute', right: 28, top: 16 }} fill="none" stroke="#1b261e" strokeWidth={2}><path d="M3 19V15M9 19V11M15 19V6M21 19V2M31 8Q42-1 53 8M35 12Q42 6 49 12M40 17H44" /><rect x={60} y={5} width={23} height={13} rx={3} /><path d="M86 9V14" /><rect x={63} y={8} width={17} height={7} rx={1} fill="#1b261e" /></svg></div>
        <div style={{ height: 77, background: '#f8f8f8', borderBottom: '1px solid #d8ddd9', display: 'flex', alignItems: 'center', padding: '0 23px', gap: 15 }}><Arrow back /><div style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 25, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{rename ? 'Group Name' : info ? 'Group Info' : currentName}</div>{rename ? <div style={{ color: green, fontSize: 22 }}>Save</div> : <span style={{ fontSize: 27, letterSpacing: 1 }}>···</span>}</div>
        <ElementReveal key={beat.at} at={beat.at} frame={frame} transition={{ style: 'slide', from: 'right' }} distance={30} style={{ position: 'absolute', left: 0, right: 0, top: 135, bottom: 35 }}>
          {rename ? <>
            <div style={{ marginTop: 24, background: '#fff', padding: '22px 26px 28px', borderBottom: `2px solid ${green}` }}><div style={{ color: '#8a968d', fontSize: 21, marginBottom: 18 }}>Group name</div><div style={{ minHeight: 90, fontSize: 32, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{typed}<span style={{ display: 'inline-block', width: 2, height: 34, background: green, marginLeft: 4, verticalAlign: 'middle', opacity: Math.floor(frame / 15) % 2 ? 1 : .25 }} /></div></div>
            <div style={{ padding: '18px 26px', color: '#8c978f', fontSize: 19 }}>A new name for the same group.</div>
            <ElementReveal at={beat.at + 16} frame={frame} transition={{ style: 'slide', from: 'bottom' }} distance={90} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Keyboard phone frame={frame} at={beat.at + 16} /></ElementReveal>
            <Touch x={475} y={-40} at={beat.at + 94} frame={frame} />
          </> : info ? <>
            <div style={{ padding: '28px 28px 23px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '19px 25px', background: '#fff' }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ display: 'grid', placeItems: 'center' }}><Person size={64} color={['#b7c8bd', '#b4c8ce', '#cbbdac', '#adbcc8'][i % 4]} /></div>)}<div style={{ width: 62, height: 62, border: '1px solid #d8dfd9', borderRadius: 10, color: '#a4b2a7', fontSize: 43, textAlign: 'center', lineHeight: '56px' }}>+</div></div>
            <div style={{ marginTop: 15, background: '#fff' }}>{['Group name', 'Group QR code', 'Group notice', 'Chat settings'].map((label, i) => <div key={label} style={{ padding: '20px 25px', minHeight: i === 0 ? 115 : 78, boxSizing: 'border-box', borderBottom: '1px solid #edf0ed', display: 'flex', alignItems: 'center', gap: 20 }}><div style={{ fontSize: 23, flexShrink: 0, width: 133 }}>{label}</div><div style={{ flex: 1, minWidth: 0, color: i === 0 && saved ? '#427c55' : '#929f95', fontSize: 23, lineHeight: 1.18, overflowWrap: 'anywhere' }}>{i === 0 ? currentName : i === 1 ? '▦' : ''}</div><span style={{ color: '#bbc5bd' }}><Arrow /></span></div>)}</div>
            {saved && <div style={{ position: 'absolute', left: 186, top: 586, padding: '15px 23px', color: '#fff', borderRadius: 12, background: '#243c2be6', fontSize: 23, opacity: 1 - progress(frame, beat.at + 50, 24) }}>✓ Saved</div>}
            <Touch x={385} y={300} at={beat.at + 25} frame={frame} />
          </> : <>
            <div style={{ padding: '22px 24px 110px' }}><div style={{ textAlign: 'center', color: '#9ca59e', fontSize: 17, marginBottom: 28 }}>Topic sketch · not a chat record</div>
              {visual.topics.length ? visual.topics.map((topic, i) => <ChatBubble key={i} text={topic.text} index={i} at={topic.at} frame={frame} />) : [0, 1, 2].map(i => <div key={i} style={{ display: 'flex', gap: 13, marginBottom: 23, opacity: progress(frame, beat.at + 14 + i * 21, 25) }}><Person size={46} color={['#b7c8bd', '#b4c8ce', '#cbbdac'][i]} /><div style={{ width: 280 - i * 37, borderRadius: 8, padding: '20px 18px', background: '#fff' }}><div style={{ width: '86%', height: 8, borderRadius: 4, background: '#d6ded8' }} /><div style={{ width: '61%', height: 7, borderRadius: 4, background: '#e4e9e5', marginTop: 12 }} /></div></div>)}
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 75, borderTop: '1px solid #d6ded7', background: '#f8f8f8', padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box' }}><svg width={29} height={29} viewBox="0 0 29 29" fill="none" stroke="#5f7465" strokeWidth={1.6}><circle cx={14.5} cy={14.5} r={12} /><path d="M11 8Q18 14 11 21M16 8Q23 14 16 21" /></svg><div style={{ flex: 1, height: 43, background: '#fff', borderRadius: 7 }} /><span style={{ fontSize: 30, color: '#5f7465' }}>☺</span><div style={{ width: 27, height: 27, border: '1.8px solid #5f7465', borderRadius: '50%', textAlign: 'center', lineHeight: '25px', color: '#5f7465', fontSize: 26 }}>+</div></div>
          </>}
        </ElementReveal>
        <div style={{ position: 'absolute', left: 176, bottom: 11, width: 170, height: 6, borderRadius: 4, background: '#1d2821' }} />
      </div>
    </div>
  </div>;
};

export const BookVisual: React.FC<Props<'media'>> = ({ visual, shot, frame }) => {
  const image = visual.images[0];
  const entered = progress(frame, image.at, 54), turned = progress(frame, image.at + 70, 84), settled = progress(frame, image.at + 170, 70);
  const angle = -15 + entered * 8 + turned * 12 - settled * 8;
  return <div data-journal="book-object" style={{ position: 'absolute', left: L.left + 140, top: 475, width: 620, perspective: 1700, opacity: entered }}>
    <div style={{ position: 'absolute', left: 40, right: -10, top: 880, height: 60, borderRadius: '50%', background: C.ink, filter: 'blur(30px)', opacity: .15 }} />
    <div style={{ position: 'relative', transformStyle: 'preserve-3d', transform: `translateY(${(1 - entered) * 60}px) rotateY(${angle}deg) rotateZ(${-3 + settled * 2}deg)`, filter: `drop-shadow(15px 24px 22px ${C.ink}30)` }}>
      <div style={{ position: 'absolute', left: -21, top: 4, bottom: 4, width: 24, background: 'linear-gradient(90deg,#203731,#456156 65%,#1a3029)', transformOrigin: 'right center', transform: 'rotateY(-30deg)', borderRadius: '5px 0 0 5px' }} />
      <div style={{ position: 'absolute', right: -13, top: 7, bottom: -3, width: 17, background: 'repeating-linear-gradient(0deg,#f6f2e8 0px,#f6f2e8 2px,#d9d3c5 2px,#d9d3c5 3px)', borderRadius: '0 4px 4px 0' }} />
      <Img src={staticFile(image.src)} style={{ position: 'relative', display: 'block', width: '100%', height: 'auto', borderRadius: '3px 6px 6px 3px', boxShadow: 'inset 4px 0 7px #0005' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, background: 'linear-gradient(90deg,#0005,transparent)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 5, border: '1px solid #ffffff40', background: `linear-gradient(${110 + angle}deg, transparent 25%, #ffffff0e 48%, transparent 64%)` }} />
    </div>
    {image.label && <ElementReveal at={Math.max(image.at, shot.from) + 18} frame={frame} transition={{ style: 'fade' }} style={{ position: 'absolute', left: -70, top: -34, padding: '10px 18px', borderRadius: 8, background: C.paper, color: C.ink, fontSize: 24, fontWeight: 600, boxShadow: `0 5px 12px ${C.ink}12` }}>{image.label}</ElementReveal>}
  </div>;
};

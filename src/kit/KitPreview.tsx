import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { EntryTag } from "./EntryTag";
import { HOST, HostFrame, type HostKey } from "./HostFrame";
import { Highlight, MarginNote } from "./MarginNote";
import { Paper } from "./Paper";
import { withEpisodeData, type Timeline } from "./EpisodeData";
import { Subtitles } from "./Subtitles";
import { FONT, INK, shadow } from "./tokens";

const MAIN = 420;
export const KIT_PREVIEW_FRAMES = MAIN;

// A → B → C → A: the host frame morphs instead of cutting away.
const KEYS: HostKey[] = [
  { at: 0, to: HOST.full },
  { at: 100, to: HOST.card },
  { at: 240, to: HOST.circle },
  { at: 340, to: HOST.full },
];

const StageSlip: React.FC = () => {
  const f = useCurrentFrame();
  if (f < 112 || f > 250) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 330,
        width: 840,
        padding: "40px 48px",
        borderRadius: 14,
        backgroundColor: INK.white,
        boxShadow: shadow(1.4),
        transform: "rotate(-1.2deg)",
      }}
    >
      <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: INK.muted }}>KIT PREVIEW · STAGE</div>
      <div style={{ fontFamily: FONT.serif, fontWeight: 800, fontSize: 72, color: INK.ink, lineHeight: 1.15, marginTop: 10 }}>
        your <Highlight at={150}>episode world</Highlight>
      </div>
      <div style={{ fontFamily: FONT.zh, fontSize: 34, color: "#55514A", marginTop: 8 }}>舞台区内容由每期的"本期世界"决定</div>
    </div>
  );
};

// Demo: switch the subtitle skin to `glass` during the circle (world) section.
const GlassDemo: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ backgroundColor: "#121628", opacity: glassAt(f) }} />;
};

const glassAt = (f: number) =>
  interpolate(f, [240, 262, 330, 352], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const SubsDemo: React.FC<{ data: Timeline }> = ({ data }) => {
  const f = useCurrentFrame();
  return <Subtitles captions={data.captions} words={data.words} glass={glassAt(f)} />;
};

// Demo runs on any episode's footage (set `dir` in Studio props). Shows the setup card when missing.
const Preview: React.FC<{ data: Timeline; dir: string }> = ({ data, dir }) => {
  const SRC = staticFile(`${dir}/cut.mp4`);
  return (
  <AbsoluteFill>
    <Sequence durationInFrames={MAIN} name="Main">
      <Paper />
      <GlassDemo />
      <HostFrame src={SRC} keys={KEYS} />
      <StageSlip />
      <MarginNote at={160} until={236} x={700} y={800} text="stage area" arrowTo={{ dx: -150, dy: -230 }} rotate={-6} />
      <EntryTag entry={11} chapters={[0, 100, 240, 340]} />
      <SubsDemo data={data} />
      <Audio src={SRC} />
    </Sequence>
  </AbsoluteFill>
  );
};

export const KitPreview = withEpisodeData(Preview);

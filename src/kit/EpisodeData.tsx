import React from "react";
import { AbsoluteFill, staticFile, type CalculateMetadataFunction } from "remotion";
import { Mushi } from "./character/Mushi";
import { Paper } from "./Paper";
import type { Caption, Word } from "./Subtitles";
import { FONT, INK, shadow } from "./tokens";

/**
 * Personal footage and transcripts are not in the repo (.gitignore). Each episode reads
 * public/<dir>/timeline.json + cut.mp4 at runtime; when they are missing, the composition
 * shows how to make an episode from your own recording instead of failing.
 */
export type Timeline = { durationInFrames: number; captions: Caption[]; words: Word[] };
export type EpisodeProps = { dir: string; data: Timeline | null };

/** What every src/episodes/<slug>/Episode.tsx exports as `episode`; src/Root.tsx discovers them. */
export type EpisodeEntry = { id: string; dir: string; component: React.FC<EpisodeProps> };

const FALLBACK_FRAMES = 150;

export const loadEpisode: CalculateMetadataFunction<EpisodeProps> = async ({ props, abortSignal }) => {
  try {
    const [tl, video] = await Promise.all([
      fetch(staticFile(`${props.dir}/timeline.json`), { signal: abortSignal }),
      fetch(staticFile(`${props.dir}/cut.mp4`), { method: "HEAD", signal: abortSignal }),
    ]);
    if (!tl.ok || !video.ok) throw new Error("missing");
    const data = (await tl.json()) as Timeline;
    return { durationInFrames: data.durationInFrames, props: { ...props, data } };
  } catch {
    return { durationInFrames: FALLBACK_FRAMES, props: { ...props, data: null } };
  }
};

/** Renders the episode when its footage is present, otherwise the setup card. */
export const withEpisodeData = (Episode: React.FC<{ data: Timeline; dir: string }>): React.FC<EpisodeProps> => {
  const Gate: React.FC<EpisodeProps> = ({ dir, data }) => (data ? <Episode data={data} dir={dir} /> : <MissingFootage dir={dir} />);
  return Gate;
};

const Step: React.FC<{ n: number; title: string; code?: string }> = ({ n, title, code }) => (
  <div style={{ display: "flex", gap: 18, marginTop: 26 }}>
    <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 12, backgroundColor: INK.ink, color: INK.highlighter, fontFamily: FONT.serif, fontWeight: 800, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: FONT.zh, fontSize: 30, color: INK.ink, lineHeight: 1.4 }}>{title}</div>
      {code ? (
        <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, backgroundColor: "#1D2130", color: "#D6DEEB", fontFamily: "Menlo, monospace", fontSize: 19, lineHeight: 1.5, wordBreak: "break-all" }}>{code}</div>
      ) : null}
    </div>
  </div>
);

export const MissingFootage: React.FC<{ dir: string }> = ({ dir }) => (
  <AbsoluteFill>
    <Paper />
    <div style={{ position: "absolute", left: 90, top: 170, width: 900, padding: "44px 50px 48px", borderRadius: 20, backgroundColor: INK.white, boxShadow: shadow(1.6) }}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, color: INK.muted }}>ENGLISH JOURNAL · SETUP</div>
      <div style={{ fontFamily: FONT.serif, fontWeight: 800, fontSize: 64, color: INK.ink, lineHeight: 1.1, marginTop: 12 }}>Bring your own recording.</div>
      <div style={{ fontFamily: FONT.zh, fontSize: 30, color: "#55514A", marginTop: 14, lineHeight: 1.5 }}>
        口播视频和字幕属于个人素材，不在仓库里。这一期在 <span style={{ fontFamily: "Menlo, monospace", backgroundColor: INK.highlighter, padding: "0 6px" }}>public/{dir}/</span> 找不到素材。用你自己的口播从头做一期：
      </div>
      <Step n={1} title="录一段 9:16 口播，放进新目录" code={`public/<ep>/recording.mp4`} />
      <Step n={2} title="降噪 + 转写 + 双语字幕" code={`npm run process-video -- public/<ep>/recording.mp4 output/<ep>`} />
      <Step n={3} title="字幕转成帧时间轴" code={`node scripts/make-subtitle.mjs output/<ep> public/<ep>/subtitle.json`} />
      <Step n={4} title="去停顿，生成剪辑版和 timeline.json" code={`node scripts/build-edit.mjs output/<ep>/video.denoised.mp4 public/<ep>/subtitle.json public/<ep>/cut.mp4 public/<ep>/timeline.json`} />
      <Step n={5} title="按 SERIES.md 写导演方案，做本期世界" />
    </div>
    <div style={{ position: "absolute", right: 40, top: 1280 }}>
      <Mushi pose="wave" expression="smile" width={360} seed="setup" />
    </div>
  </AbsoluteFill>
);

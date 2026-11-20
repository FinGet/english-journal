import React from "react";
import { AbsoluteFill, Series, useCurrentFrame } from "remotion";
import { GroupAvatar, MEMBERS } from "../character/Avatar";
import { Paper } from "../Paper";
import { FONT, INK } from "../tokens";
import { ChatApp } from "./chat/ChatApp";
import { MemberSheet } from "./chat/MemberSheet";
import { CubeThumb, NewsThumb } from "./chat/Thumbs";
import type { ChatPerson } from "./chat/types";
import { RankedBars } from "./data/RankedBars";
import { ShareBars } from "./data/ShareBars";
import { TerminalPanel } from "./data/TerminalPanel";
import { Wave } from "./data/Wave";
import { Phone } from "./Phone";
import { CommentBox } from "./social/CommentBox";
import { FloatingChips } from "./social/FloatingChips";
import { NotificationStack } from "./social/NotificationStack";
import { Earth } from "./space/Earth";
import { Mountains } from "./space/Mountains";
import { Spaceship } from "./space/Spaceship";
import { Nebula, StarLayer } from "./space/Starfield";

/** Visual catalogue of src/kit/blocks with neutral sample data. One block per ~4s. */
const SCENE = 120;
export const GALLERY_FRAMES = SCENE * 9;

const Label: React.FC<{ name: string; note: string; dark?: boolean }> = ({ name, note, dark }) => (
  <div style={{ position: "absolute", left: 100, bottom: 290 }}>
    <div style={{ fontFamily: "Menlo, monospace", fontSize: 30, color: dark ? INK.highlighter : INK.ink }}>{name}</div>
    <div style={{ fontFamily: FONT.zh, fontSize: 28, color: dark ? "#C8C4BB" : "#6B665D", marginTop: 6 }}>{note}</div>
  </div>
);

const people: Record<string, ChatPerson> = Object.fromEntries(Object.entries(MEMBERS).map(([id, m]) => [id, { name: m.name, color: m.color, avatar: m.a }]));

const ChatDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{ position: "absolute", left: 260, top: 160, transform: "scale(0.92) rotate(-2deg)", transformOrigin: "50% 0" }}>
        <Phone>
          <ChatApp
            f={f}
            me="mushi"
            people={people}
            title="Weekend Hikers"
            titleEdit={{ tapAt: 20, deleteAt: 34, typeAt: 52, doneAt: 92, from: "Weekend Hikers", to: "Sunrise Club" }}
            subtitle="12 位成员"
            group={["mushi", "lin", "jie", "momo"]}
            messages={[
              { id: "d", kind: "date", text: "Saturday 06:10" },
              { id: "a", kind: "text", who: "lin", text: "Who's up for the summit?" },
              { id: "b", kind: "code", who: "jie", lines: ["const start = await getTrail('north')", "// 5.2 km, +640 m"] },
              { id: "c", kind: "link", who: "momo", title: "Trail conditions this week", domain: "trails.example", thumb: <CubeThumb /> },
              { id: "v", kind: "voice", who: "kai", secs: 9, at: 40 },
              { id: "e", kind: "text", who: "mushi", text: "On my way!", at: 70 },
              { id: "n", kind: "link", who: "lin", title: "Weather: clear skies", domain: "weather.example", thumb: <NewsThumb />, at: 96 },
            ]}
            overlay={null}
          />
        </Phone>
      </div>
      <Label name="Phone + ChatApp" note="群聊：消息流、代码、链接卡、语音、原位改群名、滚动" />
    </AbsoluteFill>
  );
};

const SheetDemo: React.FC = () => {
  const f = useCurrentFrame();
  const ids = ["mushi", "lin", "jie", "momo", "kai", "yue", "hao", "lin"];
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{ position: "absolute", left: 260, top: 160, transform: "scale(0.92)", transformOrigin: "50% 0" }}>
        <Phone>
          <ChatApp f={f} me="mushi" people={people} title="Book Club" subtitle="8 位成员" group={["lin", "jie", "momo", "kai"]} messages={[{ id: "a", kind: "text", who: "lin", text: "Next book?" }]} overlay={<MemberSheet f={f} upAt={10} downAt={200} title="群成员" count={8 - Math.max(0, Math.min(5, Math.floor((f - 50) / 8)))} members={ids.map((id, i) => ({ name: MEMBERS[id].name, avatar: MEMBERS[id].a, highlight: i === 0, leaveAt: i > 2 ? 50 + i * 6 : undefined }))} />} />
        </Phone>
      </div>
      <Label name="MemberSheet" note="成员列表底部抽屉：人数、头像变灰离开" />
    </AbsoluteFill>
  );
};

const SocialDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <NotificationStack
        f={f}
        title="Sunrise Club"
        count="(12)"
        badge="9+"
        icon={<GroupAvatar size={84} />}
        items={[
          { at: 4, sender: "小林", senderColor: MEMBERS.lin.color, text: "Meet at 6 tomorrow?", time: "5 分钟前" },
          { at: 22, sender: "阿杰", senderColor: MEMBERS.jie.color, text: "Bring water, it's hot", time: "2 分钟前" },
          { at: 40, sender: "Momo", senderColor: MEMBERS.momo.color, text: "I'll be late, go ahead", time: "现在", highlightAt: 52 },
        ]}
      />
      <FloatingChips f={f} items={[{ at: 60, avatar: MEMBERS.kai.a, text: "正在路上 · On the way", x: 140, y: 760, rotate: -2 }, { at: 74, avatar: MEMBERS.yue.a, text: "已到山顶 · At the top", x: 420, y: 880, rotate: 2 }]} />
      <Label name="NotificationStack · FloatingChips" note="通知一条条落下；头像状态小卡缓慢上飘" />
    </AbsoluteFill>
  );
};

const DataDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <ShareBars f={f} at={4} x={100} y={220} width={560} title="TIME SPENT · 时间分配" rows={[{ label: "2020", parts: [{ label: "Work", pct: 70, color: "#5F6F93" }, { label: "Family", pct: 30, color: "#C9C2B6" }] }, { label: "2026", focus: true, parts: [{ label: "Family", pct: 55, color: "#F2643F" }, { label: "Work", pct: 45, color: "#5F6F93" }] }]} />
      <div style={{ position: "absolute", left: 120, top: 760, display: "flex", flexDirection: "column", gap: 26 }}>
        {[0, 1, 2].map((i) => {
          const sync = Math.min(1, Math.max(0, (f - 50) / 30));
          const fq = 1.1 + (([0.6, -0.5, 1.2][i]) * (1 - sync));
          return <Wave key={i} fq={fq} ph={f / 4 + (1 - sync) * i} color={sync > 0.9 ? "#F2643F" : "#B4ADA2"} w={500} />;
        })}
      </div>
      <Label name="ShareBars · Wave" note="比例条形对比；几条波形渐渐同频" />
    </AbsoluteFill>
  );
};

const RankedDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <RankedBars
        f={f}
        show={[0, 10, 999, 1000]}
        label="POLL · 大家怎么选"
        initial="Best time to run:"
        steps={[
          { at: 8, pick: 46, headline: "Best time to run: morning", candidates: [["morning", 48], ["evening", 31], ["lunch", 14], ["midnight", 5], ["never", 2]] },
          { at: 60, pick: 92, headline: "Best time to run: morning, 5 km", candidates: [["5 km", 52], ["10 km", 27], ["3 km", 15], ["a marathon", 6]] },
        ]}
      />
      <Label name="RankedBars" note="排行柱状图，逐步挑出最高项；最后一项是高亮长尾" />
    </AbsoluteFill>
  );
};

const CommentDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <CommentBox f={f} at={4} placeholder="说说你的想法…" comments={[{ at: 24, avatar: MEMBERS.lin.a, text: "这个我也想试试" }, { at: 40, avatar: MEMBERS.jie.a, text: "收藏了" }, { at: 56, avatar: MEMBERS.momo.a, text: "下一期讲讲工具？" }]} />
      <Label name="CommentBox" note="评论区：输入框打字 + 评论气泡" />
    </AbsoluteFill>
  );
};

const TerminalDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#070A1C" }}>
      <Nebula cam={{ x: 0, y: 0 }} />
      <StarLayer n={120} seed="g1" size={[0.8, 1.8]} parallax={0.2} cam={{ x: f * 2, y: 0 }} streak={0} f={f} />
      <TerminalPanel f={f} at={4} title="DEPLOY · 发布" channel="prod · eu-1" lines={[{ at: 20, k: "BUILD", v: "passed", note: "2m 14s" }, { at: 34, k: "TESTS", v: "412 / 412" }, { at: 48, k: "REGION", v: "eu-west-1" }, { at: 62, k: "STATUS", v: "LIVE", strong: true }]} stamp={{ at: 74, text: "SHIPPED" }} />
      <Label name="TerminalPanel" note="深色玻璃控制台：键值行依次出现，最后盖章" dark />
    </AbsoluteFill>
  );
};

const SpaceDemo: React.FC = () => {
  const f = useCurrentFrame();
  const go = Math.max(0, (f - 50) / 60);
  const cam = { x: go * 300, y: -go * 300 };
  return (
    <AbsoluteFill style={{ backgroundColor: "#070A1C", overflow: "hidden" }}>
      <Nebula cam={cam} />
      <StarLayer n={160} seed="far" size={[0.8, 1.6]} parallax={0.15} cam={cam} streak={go > 0.1 ? 8 : 0} f={f} />
      <StarLayer n={40} seed="near" size={[2, 3.4]} parallax={1} cam={cam} streak={go > 0.1 ? 8 : 0} f={f} />
      <div style={{ position: "absolute", left: -250, top: 1000 }}>
        <Earth f={f} />
      </div>
      <div style={{ position: "absolute", left: 300 + go * 500, top: 900 - go * 600, transform: "translate(-50%,-50%) rotate(-48deg) scale(0.7)" }}>
        <Spaceship f={f} thrust={f > 46 ? 1 : 0} />
      </div>
      <Label name="Starfield · Earth · Spaceship" note="三层视差星空（可拉成光线）、自转地球、可点火的飞船" dark />
    </AbsoluteFill>
  );
};

const ScenicDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #1B1F4D 0%, #5B3F86 26%, #E2738A 48%, #FFB36B 62%, #FFE2A4 72%)" }} />
      <div style={{ position: "absolute", left: 370, top: 640, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, #FFF8DC 0%, #FFE08A 45%, rgba(255,190,90,0) 72%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Mountains y={900} amp={120} color="#C9708A" seed="m1" drift={-f * 0.1} />
        <Mountains y={960} amp={150} color="#9B4F7E" seed="m2" drift={-f * 0.25} />
        <Mountains y={1040} amp={170} color="#5E3466" seed="m3" drift={-f * 0.5} />
        <rect x={0} y={1100} width={1080} height={900} fill="#3A2350" />
      </svg>
      <Label name="Mountains" note="三层山脉剪影，按远近给不同颜色和视差" dark />
    </AbsoluteFill>
  );
};

export const BlocksGallery: React.FC = () => (
  <Series>
    {[ChatDemo, SheetDemo, SocialDemo, DataDemo, RankedDemo, CommentDemo, TerminalDemo, SpaceDemo, ScenicDemo].map((C, i) => (
      <Series.Sequence key={i} durationInFrames={SCENE} name={C.name}>
        <C />
      </Series.Sequence>
    ))}
  </Series>
);


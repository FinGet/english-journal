# src/kit/blocks/ · 积木目录

做新一期前**先读这一页**：能用积木就不重写。所有积木只接收数据和帧号（`f` = 合成里的绝对帧），不绑定任何一期。看效果：Studio 合成 `BlocksGallery`（每块约 4 秒，示例数据见 `Gallery.tsx`）。

通用约定：
- `f`：当前帧（`useCurrentFrame()`）；`at` 出现帧；`until` / `outAt` / `exitAt` 退场帧。
- 坐标 `x` / `y` / `width` 在 1080×1920 画布上，默认值已避开日记编号和字幕带。
- 人物头像用 `src/kit/character/Avatar.tsx` 的 `AvatarSpec`（`MEMBERS` 里有现成的 7 个）。
- 积木自带系列手感和配色。本期色板通过 `colors` / `accent` 之类的参数传入，不要改积木内部。
- 某一期做出了新的、可复用的组件，就抽到这里，在本页登记，并加进 `Gallery.tsx`。

## 设备与界面

| 积木 | 文件 | 用途 | 关键参数 |
|---|---|---|---|
| `Phone`、`StatusBar`、`PHONE`、`SCREEN` | `Phone.tsx` | 通用手机外壳（侧键、灵动岛、玻璃反光），560×1140 | `children` 放屏幕内容；`dark` |
| `ChatApp` | `chat/ChatApp.tsx` | 完整群聊屏幕，放进 `<Phone>` | `messages`、`people`、`me`、`title`、`subtitle`、`group`、`scroll`、`emphasis`、`titleEdit`、`overlay` |
| `MemberSheet` | `chat/MemberSheet.tsx` | 群成员底部抽屉，成员可依次变灰离开 | `upAt`、`downAt`、`title`、`count`、`members[{name, avatar, leaveAt?, highlight?}]` |
| `CubeThumb`、`NewsThumb` | `chat/Thumbs.tsx` | 链接卡缩略图（技术工具、公司 / 新闻） | — |

`ChatApp` 的消息类型（`chat/types.ts`）：`date`、`system`、`text`、`code`（自动语法高亮）、`link`（`thumb`）、`voice`（`secs`）、`sticker`（`node` 任意 React 元素）。带 `at` 的消息在那一帧弹入，不带的是历史消息。

```tsx
<Phone>
  <ChatApp
    f={f} me="mushi" people={people} group={["mushi", "lin", "jie", "momo"]}
    title="Old name" subtitle="12 位成员"
    titleEdit={{ tapAt: 20, deleteAt: 34, typeAt: 52, doneAt: 92, from: "Old name", to: "New name" }}  // 原位改名，可省略
    messages={[{ id: "a", kind: "text", who: "lin", text: "Hi!" }, { id: "b", kind: "text", who: "mushi", text: "Hey", at: 60 }]}
    scroll={[{ at: 100, dur: 60, to: "top" }, { at: 200, dur: 40, to: { id: "a", offset: 120 } }]}   // 默认停在最底部
    emphasis={(id, kind, f) => (id === "a" ? { hi: 1 } : { dim: 0.6 })}                                 // 高亮 / 压暗 / 缩放
    overlay={<MemberSheet f={f} upAt={300} downAt={400} title="群成员" count={12} members={...} />}
  />
</Phone>
```
`CHAT_TITLE_ANCHOR`：标题在屏幕里的坐标，用来对群名做原位放大。

## 社交 / 互动

| 积木 | 文件 | 用途 | 关键参数 |
|---|---|---|---|
| `NotificationStack` | `social/NotificationStack.tsx` | 锁屏通知一条条落下，新的把旧的往下推，可在 `exitAt` 收起 | `items[{at, sender, senderColor, text, time, highlightAt?}]`、`title`、`count`、`icon`、`badge` |
| `FloatingChips` | `social/FloatingChips.tsx` | 磨砂小卡（头像 + 一句状态），缓慢上飘，适合叠在真人画面上 | `items[{at, avatar, text, x, y, rotate?}]`、`until` |
| `CommentBox` | `social/CommentBox.tsx` | 评论区：输入框打字 + 评论气泡依次弹出 | `at`、`placeholder`、`comments[{at, avatar, text}]` |

## 数据 / 图表

| 积木 | 文件 | 用途 | 关键参数 |
|---|---|---|---|
| `ShareBars` | `data/ShareBars.tsx` | 浮动卡片，多行 100% 堆叠条形对比（例如"以前 vs 现在"），错峰填充 | `title`、`rows[{label, focus?, parts[{label, pct, color}]}]`、`at`、`until` |
| `RankedBars` | `data/RankedBars.tsx` | 排行柱状图，逐步挑出最高项并更新标题；最后一项是高亮的长尾。适合下一个词预测、投票、"大多数人怎么选" | `show[4]`、`label`、`initial`、`steps[{at, pick, headline, candidates[[label, pct]]}]`、`colors` |
| `TerminalPanel` | `data/TerminalPanel.tsx` | 深色玻璃控制台：闪烁状态灯、标题、键值行依次滑入，最后盖章。适合指令、部署、系统日志 | `at`、`outAt`、`title`、`channel`、`lines[{at, k, v, note?, strong?}]`、`stamp{at, text, color?}`、`accent` |
| `Wave` | `data/Wave.tsx` | 一小段正弦波；把几条波的频率和相位插值到同一值，就是"同频" | `fq`、`ph`（随帧变化）、`color`、`w`、`amp` |

## 太空 / 风景

| 积木 | 文件 | 用途 | 关键参数 |
|---|---|---|---|
| `StarLayer`、`Nebula`、`SPACE_THEME` | `space/Starfield.tsx` | 一层视差星空（叠远 / 中 / 近三层）；`streak` > 0 时拉成光线；星云 | `n`、`seed`、`size`、`parallax`、`cam{x, y}`、`streak` |
| `Earth` | `space/Earth.tsx` | 660px 扁平地球：自转大陆、云层、夜面城市灯光、亮边 | `f` |
| `Spaceship` | `space/Spaceship.tsx` | 朝右的舰船（560×170），航行灯会闪，`thrust` 0–1 点亮引擎尾焰 | `f`、`thrust` |
| `Mountains` | `space/Mountains.tsx` | 一层山脉剪影（SVG `<polygon>`，放在 `<svg>` 里）；叠三层做空气透视 | `y`、`amp`、`color`、`seed`、`drift` |

## 不在这里的

- 系列底盘（纸面、日记编号、字幕、真人框、批注、音效、卡通形象、头像）在上一级 `src/kit/`，见 [SERIES.md](../../../SERIES.md) 1.4。
- 和某一期剧情绑定太紧的画面（比如人生曲线塌缩成钟形分布）留在那一期自己的目录里；做第二次时再考虑抽象。

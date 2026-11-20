# English Journal 素材库

> 配合 [SERIES.md](SERIES.md) 1.9 使用。原则：能自己画就自己画；取外部素材先确认授权，入库时写清来源和授权；所有素材进片前都改成本期色板。
> 授权说明是登记时的理解，**每次入库都以官网当前条款为准**。

## 1. 自己画（优先）

| 类别 | 做法 | 已有实现 |
|---|---|---|
| 手机 / 群聊 / 通知 | HTML/CSS 重建：状态栏、标题栏、时间戳、已读、角标、输入框；聊天内容编造 | — |
| IDE / 终端 / diff | HTML/CSS + 等宽字体 | — |
| 浏览器 / App 界面 | HTML/CSS | — |
| 扁平矢量插画 | SVG 手绘：先定色板，再按"形体 + 暗面 + 2–3 个细节 + 一处不规则"画 | — |
| 粒子 / 噪点 / 手绘笔触 | Canvas 或 `@remotion/three` | — |

## 2. 现成组件

| 来源 | 可用组件（登记时） | 安装 |
|---|---|---|
| **remotion-ui** | `device-mockup-zoom`（手机、电脑、浏览器样机 + 慢拉镜头）、`multi-device-lineup`、`notification-stack`、`voice-note-bubble`、`reaction-burst`、`animated-noise-grain`（胶片颗粒）、`commit-graph`、`live-code-split`、`kanban-move`、`tab-switch-panel`、`claude-code`、`chat-gpt`、`claude-chat` | `npx remotion-ui add <name>`。注意：2026-11-20 时 CLI 的 `search` 报索引校验错误，可直接读 `https://remotionui.com/ai/components.json` |
| **remocn** | 约 800 个组件：转场、背景、字体动画、UI 场景 | 目录 `https://remocn.dev/llms-components.txt`；`npx shadcn add @remocn/<name>` |
| **Lottie** | LottieFiles 上的动画 | `@remotion/lottie` |

## 3. 外部素材来源

| 类别 | 来源 | 授权（登记时的理解） |
|---|---|---|
| 3D 模型、HDRI、贴图 | Poly Haven | CC0 |
| 3D 模型、2D 游戏素材 | Kenney | CC0 |
| 地球、星空影像 | NASA（如 Blue Marble） | 通常不受版权限制，需核对具体条目 |
| 行星贴图 | Solar System Scope | CC BY 4.0，需署名 |
| 手绘人物 | Open Peeps | CC0 |
| 扁平插画 | unDraw | 可免费商用，见其许可 |
| 卡通头像 | DiceBear（可本地生成 SVG） | 每种风格授权不同，按风格核对 |
| 图标 | Iconify（聚合 200+ 图标集） | 按图标集核对；每期只用一套 |

## 3.5 音效（`public/sfx/`，统一转成单声道 48k WAV 并做响度归一化）

| 文件 | 来源 | 授权 |
|---|---|---|
| `page` | Kenney RPG Audio · bookFlip2 | CC0 |
| `pen`, `pop`, `tick`, `drop`, `tap`, `key`, `notify`, `scroll`, `confirm`, `select`, `error`, `glass`, `bong` | Kenney Interface Sounds（scratch / pluck / tick / drop / click / glass / scroll / confirmation / select / error / bong） | CC0 |
| `computer`, `stamp`, `thrust`, `field` | Kenney Sci-Fi Sounds（computerNoise / impactMetal / thrusterFire / forceField） | CC0 |
| `heart` | Kenney Impact Sounds · impactSoft_heavy | CC0 |
| `sync` | Kenney Digital Audio · phaserUp2 | CC0 |
| `whoosh` | 自制：ffmpeg 粉噪 + 带通 + 起落包络 | 自有 |

Kenney 素材经 soundcn 仓库（github.com/kapishdima/soundcn）获取；该仓库的 `wow` 目录是暴雪素材，**不能用**。

## 3.6 积木

换数据就能复用的画面组件在 `src/kit/blocks/`，目录和用法见 [src/kit/blocks/README.md](src/kit/blocks/README.md)。

## 4. 入库登记

系列通用素材在这里登记。某一期专属的素材登记在本地的 `episodes/assets.md`（不入库）。

| 素材 | 类型 | 来源 / 授权 | 本地路径 | 用于 |
|---|---|---|---|---|
| 张木示卡通形象（6 种表情，半身 / 挥手 / 写代码 3 种姿势，会眨眼、说话、呼吸，颜色可换） | SVG 角色 | 自绘 | `src/kit/character/Mushi.tsx`；预览 `CharacterSheet` | 系列固定 |
| 纸面底（纸纹、纤维、左上暖光、暗角） | 背景 | 自绘 | `src/kit/Paper.tsx` | 系列固定 |
| 系列组件：日记编号、双语字幕（撕纸条）、真人框（三种构图连续变形）、手写批注、荧光笔 | 组件 | 自绘 | `src/kit/`；预览 `KitPreview` | 系列固定 |
| 卡通群友头像 7 款（发型 / 发色 / 眼镜 / 胡子 / 帽子可组合）+ 2×2 群头像 | SVG 角色 | 自绘 | `src/kit/character/Avatar.tsx` | 系列共用 |
| 旧版 ai-english-coach 字幕导入（ms → 帧、加中文、拆长句） | 脚本 | 自写 | `scripts/import-coach-episode.mjs` | 工具 |
| process-video 输出 → subtitle.json（双语 SRT + 词级时间戳 → 帧） | 脚本 | 自写 | `scripts/make-subtitle.mjs` | 工具 |
| 缺素材时的说明卡 + 运行时读取每期数据 | 组件 | 自写 | `src/kit/EpisodeData.tsx` | 系列固定 |

# 语义画面组件

本页说明组件选择和 `motion.json` 配置，不代表已完成浏览器验收。扩展组件包含 evidence、dialogue、timeline、scene、transformation、relationship、map、emotion、browser、group-chat、spaceflight及media.book；当前期数不自动改写，不新增演示合成。统一从 EnglishJournal 的 `shots[].visual` 使用。

## 导演设计

| 组件 | 观看对象 | 起始 → 动作 → 结果 | 人物与承接 |
| --- | --- | --- | --- |
| evidence | 真实图片或截图中的具体细节 | 完整原图建立背景 → 按词锚框选 → 右下细节窗放大并标注；切换细节时平滑移动取景区域 | 使用 chip；人物保留左下，细节窗在右下，字幕最高层；下一镜可回人物说明判断 |
| dialogue | 两方的话及回应关系 | 第一条短句 → 对方回复 → 当前句强调、前文减弱；超过三条时向上接力 | 使用 chip；最近三条位于人物上方；不新配音、不替换双语字幕 |
| timeline | 经历发生的先后与转折 | 时间轨迹 → 事件点按词锚点亮 → 当前事件展开，旧节点保留 | 使用 chip；事件详情在轨迹下方，人物保留左下；不把经历画成操作步骤 |
| scene | 场景中的人物、物件与动作 | 对象进入 → 指定对象移动 → 位置和动作说明保持 | chip；明确标记示意场景 |
| transformation | 同一组对象的重组 | 散乱 → 分组/排列 → 保留对象ID及状态轨迹 | chip；不伪造统计变化 |
| relationship | 影响、阻碍与反馈循环 | 节点建立 → 连线绘制 → 箭头/阻断/反馈关系可见 | chip；自由二维布局 |
| map | 地点间的路线 | 建立地点 → 绘线与标记移动、轻推近 → 到达并回全貌 | chip；固定标记示意、非比例 |
| browser | 电脑、网页及开发工具 | 网页载入 → 样式/AI辅助/检查/响应式预览 → 页面结果 | chip；浏览器操作示意，不访问外网 |
| group-chat | 手机群聊和群资料 | 聊天 → 群资料 → 编辑群名/键盘输入 → 保存并回到群聊 | chip；话题是概括示意，不冒充聊天记录 |
| spaceflight | 全屏宇宙环境与出发 | 建立地球/银河 → 火箭进入 → 点火远离 → 深空航行 | chip节点保持并淡出；口播/字幕连续，明确插画身份 |
| media.book | 一册真实作品 | 书封入场 → 侧转展示书脊和纸页 → 回到正面 | chip；一张实际书封、本地素材来源留档 |
| emotion | 说话者的真实情绪转折 | 人物稳定 → 短句/关键词与边缘纹样变化 → 新情绪停留 | hero；titles=[]，字幕最高层 |

所有时间均为**成片 30fps 的全局帧**，不是镜头相对帧。进入下一镜后不重置原口播或改写字幕。除emotion使用hero外，扩展组件使用chip，避免大人物/侧窗遮住关键信息；由运行时契约拒绝不兼容的人物布局。动画只由帧计算，拖动播放头与连续播放使用相同状态。

第二批五类的字段、导演设计和每类两个示例见[故事、变化、关系、路线与情绪](narrative-components.md)。下文保留第一批三类的完整配置。

## 已有组件

speaker（人物）、media（照片叠放/缓推）、contrast（反差词句）、sequence（操作步骤）、flow（输入汇聚）、comparison（双栏比较）、closing（收尾提问）继续可用。第一批三类与原有组件在 `src/production/Film.tsx`，第二批五类在 `src/production/NarrativeVisuals.tsx`；设备与实体书在 `src/production/DeviceVisuals.tsx`，空间路线的舰体在 `Spacecraft.tsx`；公共入场动作在 `visual-motion.tsx`。字段定义在 `types.ts`，契约及本地素材收集在 `validate.mjs`。

## evidence：先看全貌，再看细节

适合真实输出截图、聊天记录、文档、比赛照片。先在本期 public 目录准备图片并记录来源；`imageSize` 必须是实际图片像素尺寸。`sourceLabel` 为简短英文来源说明，完整来源及权利状态仍记录在 work/assets-sources.md。

`focuses` 为 1–3 个焦点，按 `at` 严格递增。`region` 的 x/y/width/height 都是相对**完整原图**的 0–1 比例，区域不得超出原图；最小宽高为 0.05。不会根据图片内容自动寻找细节。每个焦点 label 最多 36 字符；sourceLabel 最多 32 字符。

示例一：讲软件输出时，全图建立背景，先看一个问题，再看另一个。以下路径和区域仅示范格式，需要替换为本期真实素材和原声词锚。

```json
{
  "kind": "evidence",
  "image": "epXX/journal/assets/output.png",
  "imageSize": { "width": 1440, "height": 900 },
  "sourceLabel": "My editing session",
  "focuses": [
    { "at": 330, "label": "The timing", "region": { "x": 0.1, "y": 0.2, "width": 0.45, "height": 0.25 } },
    { "at": 420, "label": "The missing detail", "region": { "x": 0.55, "y": 0.5, "width": 0.35, "height": 0.35 } }
  ]
}
```

示例二：讲旅行照片中的路标，从环境转向地点细节。不能用无关地点照片冒充本人经历。

```json
{
  "kind": "evidence",
  "image": "epXX/journal/assets/street.jpg",
  "imageSize": { "width": 1600, "height": 1200 },
  "sourceLabel": "Photo from the walk",
  "focuses": [
    { "at": 960, "label": "The street sign", "region": { "x": 0.6, "y": 0.1, "width": 0.25, "height": 0.3 } }
  ]
}
```

## dialogue：往返而非单句卡片

`left`/`right` 是双方英文标签，最多 24 字符。`messages` 为 2–6 条，`side` 指定说话方，`text` 最多 56 字符；按 `at` 严格递增，最近三条持续保留。左右方可以连续发言。只能引用真实对话，或在导演方案中明确说明是转述/内心想法，不将设计出来的句子冒充原始聊天记录。

示例一：沟通中对一句话的不同理解。

```json
{
  "kind": "dialogue", "left": "My colleague", "right": "Me",
  "messages": [
    { "at": 300, "side": "left", "text": "Can we talk later?" },
    { "at": 360, "side": "right", "text": "Did I do something wrong?" },
    { "at": 450, "side": "left", "text": "I just need to finish this first." }
  ]
}
```

示例二：明确标记两种内心想法；这不是新增录音或字幕。

```json
{
  "kind": "dialogue", "left": "My first thought", "right": "On reflection",
  "messages": [
    { "at": 900, "side": "left", "text": "I am not ready yet." },
    { "at": 990, "side": "right", "text": "I can start with one small step." }
  ]
}
```

## timeline：经历与转折

`label` 最多 28 字符；`events` 为 2–5 个，按口播出现的 `at` 严格递增。`when` 最多 18 字符，`text` 最多 48 字符，可选 `image` 使用 public 相对路径。图上节点等距表示叙述顺序，不表示事件的实际时间间隔；过去/未来的事件不自动推算日期。

示例一：一次出行的经历。

```json
{
  "kind": "timeline", "label": "A change of plans",
  "events": [
    { "at": 300, "when": "Morning", "text": "The train was cancelled." },
    { "at": 420, "when": "An hour later", "text": "We found another route.", "image": "epXX/journal/assets/station.jpg" },
    { "at": 570, "when": "That evening", "text": "We finally arrived." }
  ]
}
```

示例二：学习习惯中的阶段变化。

```json
{
  "kind": "timeline", "label": "Learning to speak up",
  "events": [
    { "at": 900, "when": "At first", "text": "I avoided speaking." },
    { "at": 1020, "when": "The turning point", "text": "I recorded my first journal." },
    { "at": 1200, "when": "Now", "text": "I practise a little every day." }
  ]
}
```

## 接入某一期

上述均为 `visual` 对象，不是可直接播放的完整制作清单。放入对应 `shots[]`，第一批三类设置 `portrait: "chip"`，并填写真实 `from`/`to`、intent/action/outcome 和标题；emotion使用hero且titles=[]，其余第二批使用chip。所有触发帧必须处于 `[from, to)`。先给观众辨认背景，再触发细节；每条短句/事件留出阅读停留，信息过多就拆为相邻语义镜头，不靠缩字堆叠。

示例为虚构配置说明，不代表用户发生过这些经历、持有这些素材或已确认这些原话。不得将它们自动写入当前期数。组件接入正式renderer；按实际改动完成必要技术检查、构图预览、连续动作与听感审查，不另行等待恢复许可。文档中的示例不等于某一期的实际检查记录。


## 具象设备：browser、group-chat 与实体书

这三种形式使用chip人物。所有at仍是成片全局帧；beats需要1–8个、严格递增、第一拍等于镜头from，全部处于该镜头内。时间取真实口播词锚。先画对象，再表现操作，不用替代字幕的长段文字填屏。

browser的siteTitle最多32字符、url最多64字符，均是英文展示文字，url不发网络请求。beats.action支持load/style/assist/inspect/responsive/empty。可在同一电脑上依次展示网页、开发面板、AI草稿、响应式预览和404结果。

```json
{"kind":"browser","siteTitle":"My frontend page","url":"localhost:3000","beats":[{"at":300,"action":"load"},{"at":370,"action":"style"},{"at":450,"action":"responsive"}]}
```

group-chat的oldName最多40字符，newName最多48字符；可选since必须为四位年份；topics是0–4项{text,at}，每个text最多28字符。beats.action支持chat/info/rename/saved/topics。旧/新名称沿保存状态延续，编辑过程显示输入键盘。成员头像与话题为界面示意，不能伪造用户真实聊天。

```json
{"kind":"group-chat","oldName":"Frontend Evolution","newName":"Natural Selection, Ahead Four","since":"2019","topics":[{"text":"AI and work","at":340}],"beats":[{"at":300,"action":"info"},{"at":390,"action":"rename"},{"at":490,"action":"saved"}]}
```

media使用treatment:"book"时，images必须恰好一项，是实际本地书封。保留真实封面，不另造书中文字。例：

```json
{"kind":"media","treatment":"book","images":[{"src":"epXX/journal/assets/cover.jpg","at":300,"label":"Book title · Author"}]}
```

## 字幕与镜头停留

字幕固定白字、细深色描边及轻短阴影，样式统一从project.config.json读取。这个组合保持亮暗背景下的稳定轮廓，避免按帧自动切色产生跳变。仍需在实拍、浅背景和深图上实际检查，不能仅凭配置声称所有背景都已验收。

连续纯口播/静态场景最长4秒，改标题不重新计时；超过4秒要有不断推进的操作、状态变化或运动关系。quality会提示speaker/contrast/emotion/closing连续超时；它是基础提醒，不能自动判断其他组件是否真正有内容推进，导演仍须审查整个段落。

参考：[W3C TTML2文字描边](https://www.w3.org/TR/ttml2/#style-attribute-textOutline)、[Netflix字幕外观设置](https://help.netflix.com/en/node/100267)。这些说明字幕轮廓、阴影和背景是常见可用手段，不代表所有电影使用同一强制样式。


## spaceflight：全屏环境与出发

实现位于SpaceflightVisual.tsx。用全画布空间、银河尘带、远近星层、地球海陆/云层/昼夜与大气弧，配合有鼻锥、舷窗、金属壳、侧翼与尾焰的小火箭表现离开。是动作意象，不是作品官方舰型、真实天文数据或航天纪录。画面自动标识FICTION · ILLUSTRATED JOURNEY。

label最多40字符，说明本段对象。revealAt/launchAt/cruiseAt为成片全局帧，必须严格满足`shot.from < revealAt < launchAt < cruiseAt < shot.to`，分别对应环境建立、火箭进入、点火离开和远空航行。按原话锚点确定，不按固定速度自动分配。人物设置chip，渲染器淡出其图像而保留相同的视频/声音节点；结束时淡回，字幕持续在最高层，品牌和标题变浅色。

```json
{"kind":"spaceflight","label":"A journey into the unknown","revealAt":390,"launchAt":510,"cruiseAt":690}
```

新一期无需固定使用这些物件或相同构图。先按[视觉导演标准](visual-direction.md)主动判断观众应该看见什么，必要时扩展公共能力，不把组件清单当成创作上限。

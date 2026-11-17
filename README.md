# English Journal · 张木示

英语口语练习口播的 Remotion 制作工程。以真实声音与观点为核心，使用统一品牌、双语字幕、语义分镜和三连片尾。TalkCraft EP10 是当前示例；更换期数与话题不需要复制场景源码。

## 当前工作方式

用户当前自行在浏览器验收，agent只修改，不运行测试、构建、抽帧、审片、音频测量或渲染。下文命令是正式制作入口，本次整理没有执行。历史视频、字幕和模型缓存保留。

```sh
npm run dev
```

浏览器正式入口只有 `EnglishJournal`（整片）、`JournalCover`（独立3:4封面）、`JournalOutro`（通用有声片尾）。旧EP06/EP10实验和旧视觉组件已移出源码，恢复材料见 `output/_work/project-cleanup-20261117/legacy-code.tar.gz`。

封面使用1080×1440的独立构图，默认scale=1；人物帧和短英文主题在motion.json的cover字段配置。用户看过并确认后才导出，账号与slogan仍按Journal品牌排列。

## 制作流程

完整操作见 [制作手册](docs/workflow.md)，agent行为见 [AGENTS.md](AGENTS.md)。固定顺序：

1. 保留原片及其身份，建立本期独立工作目录。
2. 生成未剪辑的降噪识别副本，对它转写；原片不覆盖。
3. 核对原话，依据未降噪原声提出静音预剪；先报告，后应用。
4. 用同一剪辑清单生成program与成片词表，重新组织中英双语字幕。
5. 对剪后的原声生成降噪副本，单独处理口播响度；保留原声与处理记录。
6. 导入新edition，写语义分镜和来源，按本期内容选择公共组件。
7. 用户在网页检查字幕、构图、动效和声音，确认后更新制作状态。
8. 经用户允许再导出；最终文件检查通过后才替换成品。

## 配置

| 文件 | 职责 |
| --- | --- |
| `project.config.json` | 画布、导出scale/CRF、左右安全距离、字幕位置、口播响度和降噪默认值 |
| `brand.config.json` | 张木示、Z、slogan、色板、字体、三秒片尾和三连音效 |
| `episode.config.json` | 当前期数与edition清单 |
| `public/epXX/<edition>/motion.json` | 原片/成片身份、剪辑映射、词表、双语字幕、分镜、音效、口播固定增益和审查状态 |

通用规则参考ai-english-coach的制作约定与源码，取参数和素材保护方法；Journal保持自己的品牌与画面，不引入纠错、评分、发音训练、TTS或Coach视觉模板。封面借鉴其固定母版、3:4比例、主题与自然人物选帧流程，详见[封面制作](docs/cover-workflow.md)。

- 基础画布1080×1920、30fps；默认scale=2，导出2160×3840，PNG中间帧、CRF16。scale=1为1080p，4/3为2K。
- 核心文字左100px、右180px；主体可延展全画布，不因字幕缩小。字幕仍y1500，英文52px、中文34px，层级最高。
- 口播目标−18 LUFS，通常接受−19～−17；处理前留约−2 dBTP，最终编码≤−1 dBTP。优先固定增益，保留动态。音频已处理时播放增益为1。
- DeepFilterNet默认6dB衰减上限，户外可选12dB。转写可用降噪副本，静音删减必须依据原声，避免重复降噪。
- 导出不再将整条混音拉到−15 LUFS；口播在预览前处理，音效保持用户确认的相对音量。

当前EP10沿用此前处理的声音，本次没有按新规则测量或重做，不宣称它已达到新响度目标。规则主要约束后续制作。

## 常用命令

```sh
npm run setup
npm run denoise -- --video /path/to/original.mp4 --episode 11
npm run transcribe -- /path/to/denoised-copy.mp4 output/_work/ep11/journal/asr.json
npm run trim -- --video /path/to/original.mp4 --words output/_work/ep11/journal/asr.json --out output/_work/ep11/journal/trim
# 预剪报告确认后，同一命令加 --apply
npm run voice -- --input /path/to/denoised-program.mp4 --output output/_work/ep11/journal/voice.wav
npm run episode:new -- --episode 11 --edition journal --video /path/to/program.mp4 --source /path/to/original.mp4 --edit /path/to/edit.json --audio /path/to/voice.wav --transcript /path/to/bilingual.json --title "Learning to Listen" --select
npm run dev
```

用户恢复验证或明确导出后，再按需要使用：

```sh
npm run check
npm test
npm run build
npm run previews -- --episode 11 --edition journal
npm run sample -- --episode 11 --edition journal --from 0 --to 179 --name opening
npm run cover -- --episode 11 --edition journal
npm run render -- --episode 11 --edition journal
npm run render:1080p -- --episode 11 --edition journal
npm run render:2k -- --episode 11 --edition journal
```

`setup`只补缺失配置和目录，不再生成静音人物、假字幕或实验场景。`episode:new`不会自动翻译、校准或完成导演审查。`--edition`切换临时制作版本，原片和既有edition不覆盖。

## 文件和环境

- `src/index.tsx` → `src/Root.tsx` → `src/production/` 是唯一正式链路。
- `output/epXX/`只存 `video.mp4`、`cover.png`；工作文件统一放 `output/_work/epXX/<edition>/`。
- 历史原片与清单保留在public下，但旧格式不再加载旧渲染器；需重新制作时导入一个新edition，不原地迁移。
- Node20.19+、FFmpeg/ffprobe、本机Chrome；本机node_modules继续复用ai-english-coach，不安装第二套Remotion。
- Whisper和DeepFilterNet先找本工程缓存，再找ai-english-coach缓存或显式环境路径，缺失时停止，不自动下载。Python需使用已有mlx_whisper环境。
- 可复用的素材保护/时间轴契约测试保留，旧期数及旧场景的实验测试已归档。测试当前没有执行。

## Git仓库

源码仓库与新机器使用说明见[仓库说明](docs/repository.md)。原片、单期制作数据、模型和工作产物不随代码上传。

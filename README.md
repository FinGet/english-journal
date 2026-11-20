# English Journal 视频素材准备

在项目根目录执行。需要 Node.js、FFmpeg、ffprobe、DeepFilterNet，以及可访问 Metal 的 Apple Silicon Mac 和 MLX Whisper。

```sh
npm run process-video -- "path/to/recording.mp4" output/ep01
```

1. 用 ffprobe 读取视频和音频轨信息，写入 `video.json`。
2. 取第一条视频轨和第一条音轨，只对音频做 DeepFilterNet 降噪。脚本生成 `video.denoised.mp4`，校验画面数据及成片时长，保留原片和原时间轴。默认 6 dB，室外底噪较重时可用 `--denoise-db 12`。
3. 对降噪副本本地转写，输出含词级时间戳的 `whisper.json`、纯文字 `transcript.en.txt`、供翻译的 `captions.en.json` 和英文 `subtitles.en.srt`。
4. 以英文每条字幕的编号和时间戳生成简体中文 `subtitles/subtitles.zh.srt` 及英上中下的 `subtitles/subtitles.en-zh.srt`。

输出目录必须是新目录，建议放在 Git 已忽略的 `output/` 下。默认复用项目 `.cache/asr-tools/` 下的 DeepFilterNet 及 `.venv/bin/mlx_whisper`，也可从 PATH 使用 `deep-filter` 和 `mlx_whisper`。新环境可用 `python3 -m venv .venv` 和 `.venv/bin/pip install mlx-whisper==0.4.3` 安装转写工具。模型优先读本地 `.cache/asr-models/whisper-large-v3-turbo`，缺失时由 MLX Whisper 获取 `mlx-community/whisper-large-v3-turbo`。可用 `DEEP_FILTER_BIN`、`MLX_WHISPER_BIN`、`WHISPER_MODEL` 指定其他安装路径或模型。

## 生成中文及双语字幕

配置 `.env` 或环境变量 `LLM_API_KEY` 后，`process-video` 会自动调用翻译 API。接口默认使用 DeepSeek，可通过 `LLM_BASE_URL` 和 `LLM_MODEL` 指定支持 JSON 输出的 OpenAI 兼容接口。API 仅接收英文字幕文本及编号。翻译失败时，已完成的降噪视频和英文转写会保留，可单独重试翻译。

```sh
npm run subtitles -- output/ep01
```

也可由制作助手翻译 `captions.en.json`，将每条译文按原编号保存为如下 JSON，用同一命令生成字幕。

```json
[
  { "id": 1, "chinese": "第一条字幕的译文。" }
]
```

```sh
npm run subtitles -- output/ep01 --translations path/to/translation.json
```

要在同一批素材上重新翻译，先把现有 `subtitles/` 移到备份目录，再运行 `npm run subtitles`。

## 场景与画面设计

素材准备完成后，从 `mg-styles-15` 选风格提示词，用 `motion-design` 结合原片和完整字幕做分镜，再用 Remotion Skills 实现和审片。设计顺序与竖屏约束见 [制作规则](AGENTS.md)。

## 个人素材不入库

口播视频、字幕和时间轴属于个人素材，`.gitignore` 排除了 `public/` 下除音效 `public/sfx/` 以外的全部内容，以及 `episodes/*.subtitles.json`。

每一期在运行时读取 `public/<期目录>/cut.mp4` 和 `timeline.json`（`src/kit/EpisodeData.tsx`）。找不到时，Studio 不会报错，而是显示一张说明卡，引导用自己的口播从头做一期：

```sh
npm run process-video -- public/<ep>/recording.mp4 output/<ep>          # 降噪、转写、双语字幕
node scripts/make-subtitle.mjs output/<ep> public/<ep>/subtitle.json      # 字幕 → 帧时间轴
node scripts/build-edit.mjs output/<ep>/video.denoised.mp4 public/<ep>/subtitle.json public/<ep>/cut.mp4 public/<ep>/timeline.json   # 去停顿
```

然后按 [SERIES.md](SERIES.md) 写导演方案，在 `src/episodes/` 下做本期世界，并在 `src/Root.tsx` 注册合成（`calculateMetadata={loadEpisode}`，`defaultProps={{ dir: "<ep>", data: null }}`）。

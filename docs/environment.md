# 独立环境准备

English Journal的制作标准、渲染器、通用脚本、配置和许可均在本仓库内。无需克隆或读取其他业务项目。已有模型可以复用，复用方式是复制到本工程缓存，或明确指定模型/工具路径；脚本不搜索相邻项目目录。

## Node与媒体工具

新机器准备符合package.json engines的Node版本（最低20.19）、npm、FFmpeg/ffprobe和可用Chrome，然后运行：

```sh
npm ci
npm run setup
```

依赖版本由package-lock.json记录，node_modules应是本工程的安装目录。macOS若装有Google Chrome，remotion.config.ts会选择它；其他环境按Remotion正常浏览器配置准备可用浏览器。不要把另一业务工程的node_modules软链接当成项目必需条件。

setup只补配置和目录，不下载媒体或模型，也不会生成假字幕/静音演示。Git不包含单期原片、motion.json、模型或output。导入真实节目数据后再打开Studio；模型缺失不妨碍已有节目通过现成字幕/音频进行排版和渲染。

## 本地语音转写

当前转写脚本使用mlx_whisper，需要支持MLX的Apple Silicon环境和安装了mlx_whisper的Python解释器。使用自己的Python虚拟环境，并在执行npm run transcribe前激活；也可用该解释器直接运行scripts/transcribe.py。复制虚拟环境目录不能可靠替代在新机器准备Python依赖。

本项目可使用独立的`.venv`，避免依赖系统Python或其他项目：`python3 -m venv .venv`，然后`.venv/bin/python -m pip install --cache-dir .cache/pip mlx-whisper`。转写时直接用`.venv/bin/python scripts/transcribe.py ...`，或先`source .venv/bin/activate`再运行npm命令。这里安装的是程序依赖，语音模型仍须预先放在下述本地目录；转写脚本不下载模型。虚拟环境和pip缓存不随Git提交。

将现有MLX Whisper large-v3-turbo模型的完整目录（含config.json、weights.safetensors等文件）复制到：

```text
.cache/asr-models/whisper-large-v3-turbo/
```

也可显式指定任意已有模型目录：

```sh
python3 scripts/transcribe.py /path/to/denoised-copy.mp4 output/_work/ep11/journal/asr.json --model /absolute/path/to/whisper-large-v3-turbo
```

或在启动命令的shell中export LOCAL_ASR_MODEL。优先级：--model > LOCAL_ASR_MODEL > 本工程默认目录。Python脚本不自动读取.env；使用--model或shell环境变量，避免以为写入.env就已生效。转写强制使用离线模型，不在缺失时后台下载。其他平台需要明确准备新的转写实现，不能伪装成已完成同一流程。

## 本地降噪

当前缓存默认位置是Apple Silicon macOS可执行文件：

```text
.cache/asr-tools/deep-filter-0.5.6-aarch64-apple-darwin
```

也可将兼容的deep-filter放入PATH，或指定DEEP_FILTER_BIN的绝对路径。优先级：DEEP_FILTER_BIN > 适配本机的项目缓存 > PATH。denoise命令会读取本项目.env；复制.env.example后填入实际路径，或直接使用shell环境变量。

工具需支持--atten-lim-db和-D等本仓库降噪脚本使用的参数，默认6dB、户外12dB。其他系统/架构需准备相应可执行文件，不能直接复制macOS ARM二进制。工具不可运行时会停止，不以原声冒充降噪成品。

## 封面与素材

人物抠图为本期透明PNG素材；文字、背景、轮廓和布局在JournalCover中实现。制作新抠图需可用图片编辑工具，或使用用户提供的真实透明人物图；不用其他项目的封面作为隐藏输入。具体保真与中文主题要求见cover-workflow.md。公共字体、互动图标及音效随源码分发，单期素材另行导入。

## 历史本机迁移记录（非当前制作限制）

飞书交付只需本项目.env或shell中的应用凭据，不需要其他项目的Python客户端。配置及群绑定方式见publishing.md；新机器不会随Git获得密钥、本地群ID或发送记录。

本机已从原有文件建立项目内node_modules、Whisper模型目录与DeepFilterNet工具，未重新下载。迁移使用APFS写时复制，各目录可以独立修改；旧软链接及记录保留在output/_work/environment-migration/。这些本地依赖不加入Git，新机器仍按上述步骤准备自己的环境。

上述记录描述当时迁移的执行范围：当时未运行测试、构建、语音识别、降噪、试听或渲染，不能据此宣称环境验收通过，也不能把这条历史事实当作后续制作禁令。当前制作按AGENTS及workflow默认执行全部必要步骤。

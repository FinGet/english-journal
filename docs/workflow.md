# English Journal 制作手册

本手册描述正式制作流程，不代表本次已执行。当前用户自己在浏览器验收；agent遵守AGENTS中的暂停验证安排。

## 1. 建立期数与原片身份

每期使用 `public/epXX/<edition>/` 和 `output/_work/epXX/<edition>/`。原片另存且不覆盖，所有制作清单记录SHA256。相同期号的不同录音属于不同原片，不能互套字幕和切点。

先决定逻辑画布1080×1920/30fps。原录音若不是CFR30fps，另建同钟的CFR工作副本并保留真正原片，记录转码关系；不能只改视频帧率元数据，也不能借转码偷偷加速。静音剪辑脚本要求CFR30工作原声。

## 2. 降噪识别副本与真实转写

```sh
npm run denoise -- --video /path/to/working-original.mp4 --episode 11 --edition journal
npm run transcribe -- /path/to/printed-denoised-video.mp4 output/_work/ep11/journal/asr.json
```

DeepFilterNet默认6dB衰减上限，户外才选12dB。脚本优先复用本工程和ai-english-coach的native工具；相同输入哈希、档位、工具版本复用缓存。独立副本位于work/denoise，原片不原地替换。处理保留视频流，补回模型延迟造成的短尾音并检查同钟；失败停止，不能把未处理原声冒充成功结果。

Whisper脚本优先复用本工程和Coach的large-v3-turbo模型，也可通过LOCAL_ASR_MODEL/--model指定已有目录。使用安装了mlx_whisper的现有Python环境，不自动下载模型。词级时间必须来自实际音频；转写不是用户原话的最终裁决。

已有用户校准字幕时，保留它，不因改去噪重新覆盖原话。人工核对识别分歧、断句与译文；保留口语语法、口音和表达，不把语法纠正写回原话。

## 3. 依据未降噪原声预剪

```sh
npm run trim -- --video /path/to/working-original.mp4 --words output/_work/ep11/journal/asr.json --out output/_work/ep11/journal/trim
```

默认只产出 `trim-report.md`、`edit.json`、`words-program.json`。保守静音阈值−60dB，至少1秒的候选空隙，两端各留0.5秒，且不得与任何识别词相交；ASR漏词不是删除依据。没有安全区间就保留。语义重说、误起、表达性停顿由制作方结合原声另行判断，脚本不会按识别文本自动删词。

用户确认报告后，原命令加 `--apply`。脚本校验原片和词表身份与报告一致，再生成独立program.mp4；原片不替换，失败不覆盖已完成版本。视频和原声按同一EDL裁剪，输出帧数与清单相符。

本项目默认采用Coach的保守静音政策；旧TalkCraft示例已获批准的剪辑不自动重新执行，也不强制恢复已确认的停顿。新片如明确要求更紧的节奏，再另拟方案。

## 4. 同步字幕与动作时间轴

原片时钟只用于源入出点；成片时钟用于词表、字幕、标题、图形动作、音效。不能将原片秒数填进成片帧字段。

trim生成的words-program.json已为成片30fps帧。根据它组织双语字幕，不跨过真实停顿延长字幕，英文与已确认词序一致。输入bilingual.json：

```json
{
  "captions": [{"from":0,"to":45,"english":"Learning to listen.","chinese":"学习倾听"}],
  "words": [
    {"from":0,"to":15,"text":"Learning"},
    {"from":15,"to":23,"text":"to"},
    {"from":23,"to":45,"text":"listen."}
  ]
}
```

edit.json中的cuts格式为 `{sourceIn,sourceOut,from,reason}`，全部原片/成片30fps帧，区间半开，输出连续，源片顺序递增，默认不变速。一个词跨切点说明方案不成立，应回到原声修剪辑，而非截断字幕掩盖问题。

## 5. 剪后降噪与口播响度

对剪好的**原声**program再生成降噪副本；未发生裁剪则可复用第一阶段结果。不能将已降噪的识别副本再次当原片去噪，不能用降噪后的能量检测删静音。

```sh
npm run denoise -- --video output/_work/ep11/journal/trim/program.mp4 --episode 11 --edition journal
npm run voice -- --input /path/to/printed-denoised-program.mp4 --output output/_work/ep11/journal/voice.wav
```

voice步骤只处理口播：先提取同钟48kHz单声道PCM，测整段综合响度与真峰值，计算到−18 LUFS的固定增益，并预留约−2 dBTP。若达到目标需破坏动态，优先峰值安全，允许偏低并记录peakLimited，不按字句拉平，不强制压缩。通常接受−19～−17 LUFS，不能把手机音量50%当文件响度标准。

输出WAV与同名JSON记录原始身份、固定增益、处理前后测量和时长。输出存在时拒绝覆盖。处理后播放增益保持1，防止文件增益与media.volume重复放大；确需手动调整时先依据测量决定。原声、处理副本和记录都保留。

## 6. 导入与语义导演

```sh
npm run episode:new -- --episode 11 --edition journal \
  --video output/_work/ep11/journal/trim/program.mp4 \
  --source /path/to/working-original.mp4 \
  --edit output/_work/ep11/journal/trim/edit.json \
  --audio output/_work/ep11/journal/voice.wav \
  --transcript /path/to/bilingual.json --title "Learning to Listen" --select
```

程序校验身份/时钟后复制到public，不覆盖已有edition。导入只生成draft清单与director-plan骨架，不把默认全片口播当成高质量剪辑已完成。

修改画面前填写导演方案：一句话主旨、语义段、原话依据、观看对象、起始→动作→结果、人物位置为何保持/变化、触发词、相邻承接、来源、未完成项。几句话可组成一镜。标题负责点题，图解负责表现关系；不能全片只是换标题，也不能为了动画打断表达。

公共组件为speaker/media/contrast/flow/comparison/closing；每期数据独立，新增主题不修改公共renderer的期号判断。必要的新视觉关系再扩展公共组件，不拷贝一整期源码。

## 7. 品牌、边距和声音层级

project.config.json集中通用参数，brand.config.json集中身份与风格。账号张木示、圆标Z；完整slogan紧跟账号名下方。除账号中文名和中文字幕外，画面文字使用英文。

系列色板为青绿赤陶：浅灰绿底#f4f6f3、深青绿主文字与常规标题#173d3a、赤陶强调#a85134、次文字#61716b、细框#cfd9d2、白色卡片#ffffff。视频、封面和片尾共用，赤陶用于Z和重点信息；点赞红、收藏金保留互动含义。

核心文字左100、右180，给平台右侧按钮留出余量；字幕固定y1500，英文52/中文34、层级最高，无底条、描边或光晕。人物、照片和图解可以延展全画布、经过字幕背后，不能因安全区将主体缩在上半部。安全距约束关键信息而非所有画面；底部位置遵循当前用户选择，不能以Coach旧布局覆盖。

口播段转场/切换/标题使用柔和气流与纸声，音量0.16–0.22起步，不密集堆叠。片尾Like/Save/Follow依次动作，红心、金黄五角星、Z头像加号变勾；共用短音效按24/40/66帧触发。三秒片尾独立于原口播时钟，整片和JournalOutro共用局部Sequence。

## 8. 用户浏览器预览与制作状态

npm run dev打开同一个正式合成；修改公共JSON后刷新合成重新载入。用户当前负责浏览器验证，agent不自动截图、审片或自测。待用户允许再使用check/test/build/previews/sample。

明确区分：原话确认后transcript=confirmed；导演方案落实且代表段被实际审查后direction=ready。状态记录制作决定，不代表工具已理解叙事质量。用户未看过不能冒称已确认，缺哪类证据就说明。

若恢复验证，先看完整代表语义段及前后交接，再扩展全片；技术检查看素材/时钟/帧数/字体/字幕边界/声音，导演检查看对象/关系/重复/视线/停留，不能互相替代。独立审片只在用户允许时启用，不作为强制打断或额外审批。

## 9. 导出与交付

默认 `npm run render` 为scale2/2160×3840；1080p为scale1，2K为4/3。逻辑画布1080×1920不变，不在代码里到处乘scale。PNG中间帧、CRF16、单浏览器并发，画面和字幕细节优先；提高分辨率不能恢复原片没有的细节。

导出前静态契约和实际输入保护仍为程序的一部分：原片身份、帧数、音轨时长、已确认状态、素材缺失均能停止。导出母版位于work，最终混音只编码不再全局响度归一，以保留网页确认的口播/SFX比例。最终AAC真峰值≤−1dBTP，帧数/尺寸/音轨核对后才原子替换成品；旧版先备份。

口播目标−18 LUFS只针对口播。不要用包含静音片尾和音效的整片响度假冒口播测量，也不要将全部音轨一起强拉到−15。与预览不一致时先修前置声音处理，不能靠最后一步补救。

成品目录只放video.mp4与cover.png。封面沿Journal品牌并从当期人物选自然表情，避开发音中途/闭眼/畸变；保留原貌，不引入Coach纠错卡和绿系口号。JournalCover使用独立3:4（1080×1440）构图，固定品牌，只更新期号、短英文主题与当期真实人物帧；选帧、确认与导出步骤见cover-workflow.md，不能把视频直接裁成封面。

最终提供视频/封面路径、实际尺寸/时长、验证范围和遗留问题。没有导出就只说工程更新，不拿旧样片当新成片。

## 10. 复用规则的来源与边界

参考本地ai-english-coach：README.md的降噪、响度、制作顺序、导出和文件管理；scripts/remotion.mjs的scale默认值；scripts/denoise.mjs的缓存、延迟补尾和视频流保护；src/Coach.tsx的固定口播增益和left100/width800（右180）；remotion.config.ts的PNG/CRF16。参考日期2026-11-17。

没有引入内容纠错、打分、发音评测、词典录音、ElevenLabs、错误历史和其视觉模板。本次未下载模型、未处理当前录音、未运行验证。新规则不自动重做历史作品。

// Export an episode: video (default 2K = 1440×2560) + cover, then loudness-normalise the audio
// to −14 LUFS / −1 dBTP (SERIES.md §1.7).
//
//   npm run render -- ep12            # 2K   → output/ep12/video.mp4
//   npm run render:1080p -- ep12      # 1080 → output/ep12/video-1080p.mp4
//   npm run render:4k -- ep12         # 4K   → output/ep12/video-4k.mp4
//   npm run render -- 12 --no-cover   # episode number works too; skip the cover
//
// Browser: uses REMOTION_BROWSER if set, else the installed Google Chrome (Remotion's bundled
// headless shell crashes on this macOS: "icu_util Check failed"), else Remotion's default.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const RES = {
  "1080p": { scale: 1, suffix: "-1080p" },
  "2k": { scale: 4 / 3, suffix: "" },
  "4k": { scale: 2, suffix: "-4k" },
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    res: { type: "string", default: "2k" },
    "no-cover": { type: "boolean", default: false },
    "no-loudnorm": { type: "boolean", default: false },
    frames: { type: "string" }, // e.g. 2100-2190: export only a range (quick checks)
  },
});
const usage = "用法：npm run render -- <ep12|12> [--res 1080p|2k|4k] [--frames 0-299] [--no-cover] [--no-loudnorm]";
if (positionals.length !== 1) throw new Error(usage);
const res = RES[values.res.toLowerCase()];
if (!res) throw new Error(`--res 只支持 1080p、2k、4k。\n${usage}`);

// 1. Find the episode's composition id from src/episodes/*/Episode.tsx (`id: "...", dir: "epNN"`).
const dir = /^\d+$/.test(positionals[0]) ? `ep${positionals[0].padStart(2, "0")}` : positionals[0];
let id = null;
let hasCover = false;
for (const slug of existsSync("src/episodes") ? readdirSync("src/episodes") : []) {
  const file = join("src/episodes", slug, "Episode.tsx");
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");
  const m = src.match(/export const episode[^=]*=\s*\{[^}]*id:\s*"([^"]+)"[^}]*dir:\s*"([^"]+)"[^}]*\}/s);
  if (m && m[2] === dir) {
    id = m[1];
    hasCover = /cover:\s*\w+/.test(m[0]);
  }
}
if (!id) throw new Error(`没找到 dir 为 "${dir}" 的期数（src/episodes/*/Episode.tsx 里的 episode.dir）`);
for (const f of ["cut.mp4", "timeline.json"]) {
  if (!existsSync(join("public", dir, f))) throw new Error(`缺少 public/${dir}/${f}，先按 README 准备素材`);
}

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = process.env.REMOTION_BROWSER || (existsSync(CHROME) ? CHROME : null);
const browserArgs = browser ? [`--browser-executable=${browser}`] : [];
const remotion = (args) =>
  execFileSync(process.execPath, [resolve("node_modules/@remotion/cli/remotion-cli.js"), ...args, ...browserArgs], { stdio: "inherit" });

const outDir = join("output", dir);
mkdirSync(outDir, { recursive: true });
if (values.frames && !/^\d+-\d+$/.test(values.frames)) throw new Error(`--frames 格式是 起-止，例如 2100-2190\n${usage}`);
const final = join(outDir, `video${res.suffix}${values.frames ? `-f${values.frames}` : ""}.mp4`);
const raw = join(outDir, `.render-raw${res.suffix}.mp4`);

// 2. Render.
const size = `${Math.round(1080 * res.scale)}×${Math.round(1920 * res.scale)}`;
console.log(`\n导出 ${id}（${size}）→ ${final}${browser ? `\n浏览器：${browser}` : ""}\n`);
remotion(["render", "src/index.tsx", id, values["no-loudnorm"] ? final : raw, `--scale=${res.scale}`, "--codec=h264", "--crf=18", ...(values.frames ? [`--frames=${values.frames}`] : [])]);

// 3. Loudness (a short --frames range is measured on its own, so it can differ slightly from the full export): two-pass loudnorm on the audio only; the video stream is copied untouched.
if (!values["no-loudnorm"]) {
  const target = "I=-14:TP=-1:LRA=11";
  // pass 1: measure (ffmpeg prints the JSON report on stderr)
  const { stderr } = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-i", raw, "-vn", "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"], {
    encoding: "utf8",
  });
  const measured = JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1));
  const second = `loudnorm=${target}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-y", "-nostdin", "-i", raw, "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-af", second, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", final],
    { stdio: "inherit" },
  );
  rmSync(raw);
  console.log(`响度：${measured.input_i} LUFS → −14 LUFS（真峰值 ≤ −1 dBTP）`);
} else if (existsSync(raw)) {
  renameSync(raw, final);
}

// 4. Cover.
if (hasCover && !values["no-cover"]) {
  const cover = join(outDir, "cover.png");
  console.log(`\n封面 → ${cover}\n`);
  remotion(["still", "src/index.tsx", `${id}-Cover`, cover]);
}
// 5. Summary — Remotion's own log ends on the intermediate .render-raw file, which is deleted above.
const mb = (f) => `${(statSync(f).size / 1e6).toFixed(1)} MB`;
const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final], { encoding: "utf8" }).trim();
console.log(`\n━━ 导出完成 ━━`);
console.log(`视频：${resolve(final)}（${size}，${Number(dur).toFixed(1)}s，${mb(final)}）`);
if (hasCover && !values["no-cover"]) console.log(`封面：${resolve(join(outDir, "cover.png"))}`);
console.log(`（上面 Remotion 日志里的 .render-raw 是响度处理前的中间文件，已自动删除）`);
if (process.platform === "darwin") spawnSync("open", ["-R", final]);

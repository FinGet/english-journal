import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

export const run = (program, args) => execFileSync(program, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
const ffmpeg = (...args) => run("ffmpeg", ["-v", "error", "-nostdin", ...args]);
export const probe = (file) =>
  JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));

const pictureHash = (file) =>
  ffmpeg("-i", file, "-map", "0:V:0", "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-");

const wavSamples = (file) => {
  const [audio] = probe(file).streams;
  if (audio?.codec_name !== "pcm_s16le" || audio.sample_rate !== "48000" ||
      audio.channels !== 1 || audio.time_base !== "1/48000" ||
      !Number.isSafeInteger(audio.duration_ts) || audio.duration_ts <= 0) {
    throw new Error("降噪 WAV 必须为有效的 48 kHz 单声道 PCM16。");
  }
  return audio.duration_ts;
};

export function denoiseVideo(input, output, scratch, seconds, db) {
  const local = resolve(".cache/asr-tools/deep-filter-0.5.6-aarch64-apple-darwin");
  const tool = process.env.DEEP_FILTER_BIN || (process.platform === "darwin" && process.arch === "arm64" && existsSync(local) ? local : "deep-filter");
  try {
    run(tool, ["--version"]);
  } catch (error) {
    throw new Error("无法运行 DeepFilterNet。请检查 PATH 或 DEEP_FILTER_BIN。", { cause: error });
  }
  mkdirSync(scratch);
  try {
    const original = join(scratch, "audio.wav");
    const enhanced = join(scratch, "enhanced");
    mkdirSync(enhanced);
    // Preserve leading audio gaps and pad to the original video clock.
    ffmpeg("-i", input, "-map", "0:a:0", "-vn", "-af", "aresample=48000:async=1:first_pts=0,apad", "-t", String(seconds), "-ac", "1", "-c:a", "pcm_s16le", original);
    run(tool, ["-D", "--atten-lim-db", String(db), "-o", enhanced, original]);
    const filtered = join(enhanced, "audio.wav");
    const samples = wavSamples(filtered);
    const missing = wavSamples(original) - samples;
    if (missing < 0 || missing > 2400) throw new Error("降噪前后音频长度差异常。");

    const inputs = ["-i", input, "-i", filtered];
    let audio = "1:a:0";
    if (missing) {
      // DeepFilterNet may drop a short tail during delay compensation.
      inputs.push("-i", original, "-filter_complex", `[2:a]atrim=start_sample=${samples},asetpts=PTS-STARTPTS[tail];[1:a][tail]concat=v=0:a=1[aligned]`);
      audio = "[aligned]";
    }
    ffmpeg(...inputs, "-map", "0:V:0", "-map", audio, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-t", String(seconds), "-movflags", "+faststart", output);
    const actual = Number(probe(output).format.duration);
    if (!Number.isFinite(actual) || Math.abs(actual - seconds) > 0.05 || pictureHash(output) !== pictureHash(input)) {
      throw new Error("降噪后的时长或画面与原片不匹配。");
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

export function transcribeVideo(video, directory) {
  const local = resolve(".venv/bin/mlx_whisper");
  const tool = process.env.MLX_WHISPER_BIN || (existsSync(local) ? local : "mlx_whisper");
  const cached = resolve(".cache/asr-models/whisper-large-v3-turbo");
  const model = process.env.WHISPER_MODEL || (existsSync(join(cached, "weights.safetensors")) ? cached : "mlx-community/whisper-large-v3-turbo");
  const result = join(directory, "whisper.json");
  run(tool, [video, "--model", model, "--language", "en", "--word-timestamps", "True",
    "--verbose", "False", "--output-dir", directory, "--output-name", "whisper", "--output-format", "json"]);
  // The MLX CLI can exit successfully after skipping a failed input.
  if (!existsSync(result)) throw new Error("MLX Whisper 未产出转写 JSON，请检查模型与 Metal 环境。");
  return result;
}

// Turn process-video output (bilingual SRT + whisper word timestamps) into subtitle.json (frames @30fps)
// for scripts/build-edit.mjs.
// Usage: node scripts/make-subtitle.mjs output/<ep> public/<ep>/subtitle.json
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dir, outPath] = process.argv.slice(2);
if (!outPath) {
  console.error("usage: make-subtitle.mjs <process-video output dir> <out subtitle.json>");
  process.exit(1);
}
const FPS = 30;
const fr = (sec) => Math.round(sec * FPS);
const t = (s) => {
  const [h, m, rest] = s.trim().split(":");
  const [sec, ms] = rest.split(",");
  return Number(h) * 3600 + Number(m) * 60 + Number(sec) + Number(ms) / 1000;
};

const srt = readFileSync(join(dir, "subtitles", "subtitles.en-zh.srt"), "utf8").replace(/\r/g, "");
const captions = srt
  .trim()
  .split(/\n\s*\n/)
  .map((block) => {
    const lines = block.split("\n").filter(Boolean);
    const [a, b] = lines[1].split("-->");
    return { from: fr(t(a)), to: fr(t(b)), english: lines[2] ?? "", chinese: lines.slice(3).join(" ") };
  });

const whisper = JSON.parse(readFileSync(join(dir, "whisper.json"), "utf8"));
const words = whisper.segments.flatMap((s) => (s.words ?? []).map((w) => ({ from: fr(w.start), to: fr(w.end), text: w.word.trim() })));

writeFileSync(outPath, JSON.stringify({ captions, words }, null, 1));
console.log(`captions: ${captions.length}, words: ${words.length} -> ${outPath}`);

// Auto-trim long pauses from a talking-head clip and remap captions to the new timeline.
// Usage: node scripts/build-edit.mjs public/test/source.mp4 public/test/subtitle.json public/test/cut.mp4 public/test/timeline.json
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [srcVideo, srcSubs, outVideo, outJson] = process.argv.slice(2);
if (!outJson) {
  console.error("usage: build-edit.mjs <video> <subtitle.json> <out.mp4> <out.json>");
  process.exit(1);
}

const FPS = 30;
const MAX_GAP = 12; // pauses longer than this (frames) get shortened
const PAD_IN = 3;
const PAD_OUT = 6;

const subs = JSON.parse(readFileSync(srcSubs, "utf8"));
const totalFrames = Math.floor(
  Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", srcVideo,
    ]).toString(),
  ) * FPS,
);

// 1. Speech islands from word timings
const words = [...subs.words].sort((a, b) => a.from - b.from);
const islands = [];
for (const w of words) {
  const last = islands[islands.length - 1];
  if (last && w.from - last.to <= MAX_GAP) last.to = Math.max(last.to, w.to);
  else islands.push({ from: w.from, to: w.to });
}

// 1b. Never cut speech the word timings missed (ASR can drop or merge words; hand-corrected
// captions can leave holes). A pause is only removed if no 100 ms window inside it is speech-loud.
const SR = 16000;
const SPEECH_DB = -40; // clean pauses measure ≈ −45 dB or quieter; speech ≈ −30 dB
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", srcVideo, "-vn", "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"], {
  maxBuffer: 1 << 30,
});
const rmsDb = (a, z) => {
  let s = 0;
  for (let i = a; i < z; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    s += v * v;
  }
  return 10 * Math.log10(s / Math.max(1, z - a) + 1e-12);
};
const loudest = (fromFrame, toFrame) => {
  const a = Math.round((fromFrame / FPS) * SR);
  const z = Math.min(pcm.length / 2, Math.round((toFrame / FPS) * SR));
  const win = SR / 10;
  if (z - a < win) return rmsDb(a, z);
  let best = -200;
  for (let i = a; i + win <= z; i += win / 4) best = Math.max(best, rmsDb(i, i + win));
  return best;
};
for (let i = islands.length - 1; i > 0; i--) {
  const a = islands[i - 1].to + PAD_OUT;
  const b = islands[i].from - PAD_IN;
  if (b - a <= 0 || loudest(a, b) <= SPEECH_DB) continue;
  console.warn(`keeping ${(a / FPS).toFixed(2)}s–${(b / FPS).toFixed(2)}s: speech found where the word timings have a pause`);
  islands[i - 1].to = islands[i].to;
  islands.splice(i, 1);
}

// 2. Pad and clamp so neighbours never overlap
const segs = islands.map((s, i) => {
  const prevEnd = i > 0 ? islands[i - 1].to : 0;
  const nextStart = i < islands.length - 1 ? islands[i + 1].from : totalFrames;
  const from = Math.max(0, s.from - PAD_IN, i === 0 ? 0 : Math.ceil((prevEnd + s.from) / 2));
  const to = Math.min(totalFrames, s.to + PAD_OUT, i === islands.length - 1 ? totalFrames : Math.floor((s.to + nextStart) / 2));
  return { srcFrom: from, srcTo: Math.max(to, from + 1) };
});
// Keep a short tail after the last word for the outro
segs[segs.length - 1].srcTo = Math.min(totalFrames, islands[islands.length - 1].to + 20);
segs[0].srcFrom = 0;

let acc = 0;
for (const s of segs) {
  s.outFrom = acc;
  acc += s.srcTo - s.srcFrom;
}
const outFrames = acc;

const mapFrame = (f) => {
  for (const s of segs) {
    if (f < s.srcFrom) return s.outFrom;
    if (f <= s.srcTo) return s.outFrom + (f - s.srcFrom);
  }
  return outFrames;
};
const remap = (x) => ({ ...x, from: mapFrame(x.from), to: Math.max(mapFrame(x.to), mapFrame(x.from) + 1) });

// 3. Cut with ffmpeg (frame-accurate re-encode)
const parts = segs
  .map((s, i) => {
    const a = (s.srcFrom / FPS).toFixed(4);
    const b = (s.srcTo / FPS).toFixed(4);
    return `[0:v]trim=start=${a}:end=${b},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${((s.srcTo - s.srcFrom) / FPS - 0.015).toFixed(4)}:d=0.015[a${i}]`;
  })
  .join(";");
const concatIn = segs.map((_, i) => `[v${i}][a${i}]`).join("");
const filter = `${parts};${concatIn}concat=n=${segs.length}:v=1:a=1[v][a]`;
mkdirSync(dirname(outVideo), { recursive: true });
execFileSync(
  "ffmpeg",
  [
    "-v", "error", "-y", "-i", srcVideo, "-filter_complex", filter,
    "-map", "[v]", "-map", "[a]", "-r", String(FPS),
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-g", "15", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outVideo,
  ],
  { stdio: "inherit" },
);

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(
  outJson,
  JSON.stringify(
    {
      fps: FPS,
      sourceFrames: totalFrames,
      durationInFrames: outFrames,
      segments: segs,
      captions: subs.captions.map(remap),
      words: words.map(remap),
    },
    null,
    1,
  ),
);
console.log(`segments: ${segs.length}, ${totalFrames} -> ${outFrames} frames (${(outFrames / FPS).toFixed(1)}s)`);

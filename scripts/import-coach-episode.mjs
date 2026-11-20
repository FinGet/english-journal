// Convert an ai-english-coach episode (motion.json captions + captions.json words, in ms)
// into this project's subtitle.json (frames @30fps), adding Chinese and splitting long captions.
// Usage: node scripts/import-coach-episode.mjs <motion.json> <captions.json> <zh.json> <out subtitle.json>
import { readFileSync, writeFileSync } from "node:fs";

const [motionPath, wordsPath, zhPath, outPath] = process.argv.slice(2);
if (!outPath) {
  console.error("usage: import-coach-episode.mjs <motion.json> <captions.json> <zh.json> <out.json>");
  process.exit(1);
}
const FPS = 30;
const fr = (ms) => Math.round((ms / 1000) * FPS);

const motion = JSON.parse(readFileSync(motionPath, "utf8"));
const rawWords = JSON.parse(readFileSync(wordsPath, "utf8"));
const zh = JSON.parse(readFileSync(zhPath, "utf8")).captions;

const words = rawWords.map((w) => ({ from: fr(w.startMs), to: fr(w.endMs), text: w.text.trim() }));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

const captions = [];
motion.captions.forEach((c, i) => {
  const z = zh[i];
  if (!z) throw new Error(`missing Chinese for caption ${i}`);
  const from = fr(c.startMs);
  const to = fr(c.endMs);
  if (!z.split) {
    captions.push({ from, to, english: c.text, chinese: z.zh });
    return;
  }
  const tokens = c.text.split(" ");
  const at = tokens.findIndex((t, k) => k > 0 && norm(t) === norm(z.split));
  if (at < 0) throw new Error(`split word "${z.split}" not in caption ${i}`);
  const w = words.find((x) => x.from >= from - 2 && x.from < to && norm(x.text) === norm(z.split));
  if (!w) throw new Error(`split word "${z.split}" has no timing in caption ${i}`);
  captions.push({ from, to: w.from, english: tokens.slice(0, at).join(" "), chinese: z.zh[0] });
  captions.push({ from: w.from, to, english: tokens.slice(at).join(" "), chinese: z.zh[1] });
});

writeFileSync(outPath, JSON.stringify({ captions, words }, null, 1));
console.log(`captions: ${captions.length}, words: ${words.length}`);

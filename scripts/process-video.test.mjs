import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./process-video.mjs", import.meta.url));

function fixture(t, count = 2) {
  const directory = mkdtempSync(join(tmpdir(), "journal-subtitles-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const cues = Array.from({ length: count }, (_, index) => ({
    id: index + 1, startMs: 125 + index * 2000, endMs: 1375 + index * 2000, english: `Line ${index + 1}.`,
  }));
  writeFileSync(join(directory, "captions.en.json"), JSON.stringify(cues));
  return directory;
}

test("local translations keep English timing, reject missing cues, and preserve existing output", (t) => {
  const directory = fixture(t);
  const file = join(directory, "translations.json");
  const run = () => spawnSync(process.execPath, [cli, "--subtitles", directory, "--translations", file], { cwd: directory, encoding: "utf8" });
  writeFileSync(file, JSON.stringify([{ id: 1, chinese: "第一行。" }, { id: 1, chinese: "重复。" }]));
  assert.match(run().stderr, /第 2 条字幕缺少/);
  assert.equal(existsSync(join(directory, "subtitles")), false);

  writeFileSync(file, JSON.stringify([{ id: 2, chinese: "第二行。" }, { id: 1, chinese: "第一行。" }]));
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const output = join(directory, "subtitles", "subtitles.en-zh.srt");
  const bilingual = "1\n00:00:00,125 --> 00:00:01,375\nLine 1.\n第一行。\n\n2\n00:00:02,125 --> 00:00:03,375\nLine 2.\n第二行。\n";
  assert.equal(readFileSync(output, "utf8"), bilingual);
  assert.equal(readFileSync(join(directory, "subtitles", "subtitles.zh.srt"), "utf8"), bilingual.replace(/^Line .*\n/gm, ""));
  assert.match(run().stderr, /输出目录已存在/);
  assert.equal(readFileSync(output, "utf8"), bilingual);
});

test("API translation uses bounded batches and only sends cue IDs and text", (t) => {
  const directory = fixture(t, 41);
  const mock = `
    import assert from "node:assert/strict";
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://example.test/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer fixture");
      const batch = JSON.parse(JSON.parse(options.body).messages[1].content);
      assert.equal(batch.length, calls++ === 0 ? 40 : 1);
      for (const row of batch) assert.deepEqual(Object.keys(row), ["id", "english"]);
      const translations = batch.map(({ id }) => ({ id, chinese: "第 " + id + " 行。" }));
      return Response.json({ choices: [{ message: { content: JSON.stringify({ translations }) } }] });
    };
  `;
  const result = spawnSync(process.execPath, [
    "--import", `data:text/javascript,${encodeURIComponent(mock)}`, cli, "--subtitles", directory,
  ], {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, LLM_API_KEY: "fixture", LLM_BASE_URL: "https://example.test/v1/" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(join(directory, "subtitles", "subtitles.en-zh.srt"), "utf8"), /Line 41\.\n第 41 行。/);
});

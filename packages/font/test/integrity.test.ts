import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import fastGlob from "fast-glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const LOCK = path.resolve(__dirname, "../codepoints.lock.json");
const CORE_FONT = path.resolve(__dirname, "../../core/export-files/font");
const CORE_ICONS = path.resolve(__dirname, "../../core/export-files/icons");

const START_CODEPOINT = 0xf101;

const hasDist = fs.existsSync(path.join(DIST, "codepoints.json"));
const hasLock = fs.existsSync(LOCK);

describe("font package codepoint lock", () => {
  it("codepoints.lock.json exists", () => {
    expect(hasLock).toBe(true);
  });

  it.skipIf(!hasLock)(
    "lock assigns a codepoint to every source svg (additive-only)",
    async () => {
      const lock: Record<string, number> = JSON.parse(
        fs.readFileSync(LOCK, "utf-8")
      );
      const sources = await fastGlob(path.join(CORE_FONT, "*.svg"));
      const missing = sources
        .map((p) => path.basename(p, ".svg"))
        .filter((n) => lock[n] === undefined);
      expect(
        missing,
        `new icons must be pinned via \`pnpm --filter devicons build\`: ${missing.join(", ")}`
      ).toEqual([]);
    }
  );

  it.skipIf(!hasLock)("lock codepoints are unique", () => {
    const lock: Record<string, number> = JSON.parse(
      fs.readFileSync(LOCK, "utf-8")
    );
    const values = Object.values(lock);
    expect(new Set(values).size).toBe(values.length);
  });

  it.skipIf(!hasLock)(
    "lock codepoints start at 0xf101 and stay contiguous",
    () => {
      const lock: Record<string, number> = JSON.parse(
        fs.readFileSync(LOCK, "utf-8")
      );
      const values = Object.values(lock).sort((a, b) => a - b);
      expect(values[0]).toBe(START_CODEPOINT);
      const gaps: number[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i - 1] + 1) gaps.push(values[i - 1] + 1);
      }
      expect(
        gaps,
        `gaps at 0x${gaps.map((g) => g.toString(16)).join(",0x")} — icons were removed; regenerate the lock deliberately if intentional`
      ).toEqual([]);
    }
  );
});

describe.skipIf(!hasDist)("font package dist integrity", () => {
  it("emits woff2, ttf, css, codepoints, sprite", () => {
    for (const f of [
      "devicons.woff2",
      "devicons.ttf",
      "devicons.css",
      "codepoints.json",
      "sprite-symbol.svg",
    ]) {
      expect(fs.existsSync(path.join(DIST, f)), f).toBe(true);
    }
  });

  it("woff2 is non-empty", () => {
    const size = fs.statSync(path.join(DIST, "devicons.woff2")).size;
    expect(size).toBeGreaterThan(10 * 1024);
  });

  it("codepoints count matches font svg count", async () => {
    const sources = await fastGlob(path.join(CORE_FONT, "*.svg"));
    const codepoints = JSON.parse(
      fs.readFileSync(path.join(DIST, "codepoints.json"), "utf-8")
    );
    expect(Object.keys(codepoints).length).toBe(sources.length);
  });

  it("every codepoint is unique", () => {
    const codepoints = JSON.parse(
      fs.readFileSync(path.join(DIST, "codepoints.json"), "utf-8")
    );
    const values = Object.values(codepoints);
    expect(new Set(values).size).toBe(values.length);
  });

  it.skipIf(!hasLock)("built codepoints match the lock file", () => {
    const lock: Record<string, number> = JSON.parse(
      fs.readFileSync(LOCK, "utf-8")
    );
    const built: Record<string, number> = JSON.parse(
      fs.readFileSync(path.join(DIST, "codepoints.json"), "utf-8")
    );
    for (const [name, cp] of Object.entries(lock)) {
      expect(built[name], `${name} drifted from lock`).toBe(cp);
    }
  });

  it("sprite contains a <symbol> for every icon", async () => {
    const sources = await fastGlob(path.join(CORE_ICONS, "*.svg"));
    const sprite = fs.readFileSync(
      path.join(DIST, "sprite-symbol.svg"),
      "utf-8"
    );
    const symbols = sprite.match(/<symbol[^>]*id="/g) ?? [];
    expect(symbols.length).toBe(sources.length);
    for (const src of sources.slice(0, 5)) {
      const id = path.basename(src, ".svg");
      expect(sprite).toContain(`id="${id}"`);
    }
  });
});

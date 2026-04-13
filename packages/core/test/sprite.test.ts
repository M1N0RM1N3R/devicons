import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import fastGlob from "fast-glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPRITE = path.resolve(__dirname, "../dist/sprite/sprite-symbol.svg");
const ICONS = path.resolve(__dirname, "../export-files/icons");

const hasSprite = fs.existsSync(SPRITE);

describe.skipIf(!hasSprite)("core sprite", () => {
  it("has one <symbol> per source icon with viewBox", async () => {
    const sources = await fastGlob(path.join(ICONS, "*.svg"));
    const sprite = fs.readFileSync(SPRITE, "utf-8");
    const symbols = sprite.match(/<symbol\b[^>]*>/g) ?? [];
    expect(symbols.length).toBe(sources.length);
    for (const s of symbols) {
      expect(s).toMatch(/viewBox="/);
    }
  });
});

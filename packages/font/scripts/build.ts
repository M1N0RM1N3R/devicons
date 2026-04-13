import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildFont } from "../../core/scripts/to-font";
import { buildSprite } from "../../core/scripts/sprite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CORE_FONT_DIR = path.resolve(__dirname, "../../core/export-files/font");
const CORE_ICONS_DIR = path.resolve(__dirname, "../../core/export-files/icons");
const OUT_DIR = path.resolve(__dirname, "../dist");
const LOCK_PATH = path.resolve(__dirname, "../codepoints.lock.json");
const SPRITE_TMP = path.join(OUT_DIR, ".sprite");

const loadLock = (): Record<string, number> => {
  if (!fs.existsSync(LOCK_PATH)) return {};
  return JSON.parse(fs.readFileSync(LOCK_PATH, "utf-8"));
};

const writeLock = (codepoints: Record<string, number>) => {
  const sorted = Object.fromEntries(
    Object.entries(codepoints).sort(([, a], [, b]) => a - b)
  );
  fs.writeFileSync(LOCK_PATH, JSON.stringify(sorted, null, 2) + "\n");
};

const run = async () => {
  const start = Date.now();
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pinnedCodepoints = loadLock();
  const pinnedCount = Object.keys(pinnedCodepoints).length;

  const [font, sprite] = await Promise.all([
    buildFont({
      inputDir: CORE_FONT_DIR,
      outputDir: OUT_DIR,
      version: "1.8.0",
      pinnedCodepoints,
    }),
    buildSprite({ inputDir: CORE_ICONS_DIR, outputDir: SPRITE_TMP }),
  ]);

  const newEntries = font.assets.filter((n) => pinnedCodepoints[n] === undefined);
  if (newEntries.length > 0 || pinnedCount === 0) {
    writeLock(font.codepoints);
    console.log(
      `devicons: codepoints.lock.json updated (+${newEntries.length} new)`
    );
  }

  const spriteSrc = sprite.files.find((f) => f.endsWith("-symbol.svg"));
  if (spriteSrc) {
    fs.copyFileSync(spriteSrc, path.join(OUT_DIR, "sprite-symbol.svg"));
  }
  fs.rmSync(SPRITE_TMP, { recursive: true, force: true });

  console.log(
    `devicons: font (${font.assets.length} glyphs) + sprite built in ${
      Date.now() - start
    }ms`
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

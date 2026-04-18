import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const WIDTH = 1200;
const HEIGHT = 630;

// Bump when the shared OG layout/constants change in a way that should
// invalidate every cached PNG regardless of per-page inputs.
const LAYOUT_VERSION = "1";

const CACHE_DIR = path.join(process.cwd(), ".og-cache");

let fontsLoaded = false;
let displayFontData: ArrayBuffer;
let monoFontData: ArrayBuffer;
let fontsFingerprint = "";

function loadFonts() {
  if (fontsLoaded) return;
  const fontsDir = path.join(process.cwd(), "assets", "fonts");
  const display = fs.readFileSync(path.join(fontsDir, "bricolage-grotesque.ttf"));
  const mono = fs.readFileSync(path.join(fontsDir, "ibm-plex-mono-600.woff"));
  displayFontData = display.buffer.slice(
    display.byteOffset,
    display.byteOffset + display.byteLength,
  ) as ArrayBuffer;
  monoFontData = mono.buffer.slice(
    mono.byteOffset,
    mono.byteOffset + mono.byteLength,
  ) as ArrayBuffer;
  fontsFingerprint = createHash("sha1")
    .update(display)
    .update(mono)
    .digest("hex")
    .slice(0, 12);
  fontsLoaded = true;
}

export async function renderOgImage(jsx: any): Promise<Buffer> {
  loadFonts();

  const key = createHash("sha1")
    .update(LAYOUT_VERSION)
    .update(fontsFingerprint)
    .update(JSON.stringify(jsx))
    .digest("hex");
  const cachePath = path.join(CACHE_DIR, `${key}.png`);

  if (!process.env.OG_CACHE_DISABLE) {
    try {
      return fs.readFileSync(cachePath);
    } catch {
      // cache miss — fall through to render
    }
  }

  const svg = await satori(jsx, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Display", data: displayFontData, weight: 900 },
      { name: "Mono", data: monoFontData, weight: 600 },
    ],
  });

  const png = (await sharp(Buffer.from(svg)).png().toBuffer()) as Buffer;

  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath, png);
  } catch {
    // Best-effort cache write; never fail the build over it.
  }

  return png;
}

export const OG = {
  width: WIDTH,
  height: HEIGHT,
  bg: "#000000",
  surface: "#0a0a0a",
  border: "#1a1a1a",
  text: "#e6e6e6",
  textMuted: "#8a8a8a",
  accent: "#ff4d00",
  fontDisplay: "Display",
  fontMono: "Mono",
} as const;

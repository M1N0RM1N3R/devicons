import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;

let fontsLoaded = false;
let displayFontData: ArrayBuffer;
let monoFontData: ArrayBuffer;

function loadFonts() {
  if (fontsLoaded) return;
  const fontsDir = path.join(process.cwd(), "assets", "fonts");
  displayFontData = fs.readFileSync(path.join(fontsDir, "bricolage-grotesque.ttf")).buffer as ArrayBuffer;
  monoFontData = fs.readFileSync(path.join(fontsDir, "ibm-plex-mono-600.woff")).buffer as ArrayBuffer;
  fontsLoaded = true;
}

export async function renderOgImage(jsx: any): Promise<Buffer> {
  loadFonts();

  const svg = await satori(jsx, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Display", data: displayFontData, weight: 900 },
      { name: "Mono", data: monoFontData, weight: 600 },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer() as Promise<Buffer>;
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

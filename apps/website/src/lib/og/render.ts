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

  const fontsDir = path.join(process.cwd(), ".astro", "fonts");

  // Display font: the largest .woff file that isn't a mono font (variable font)
  // Mono fonts are named font-mono-*; display font hashes are the unnammed ones
  const allFiles = fs.readdirSync(fontsDir).filter((f) =>
    f.endsWith(".woff2") || f.endsWith(".woff") || f.endsWith(".ttf")
  );

  // Satori only supports .ttf and .woff (NOT .woff2)
  const ttfAndWoff = allFiles.filter((f) => f.endsWith(".ttf") || (f.endsWith(".woff") && !f.endsWith(".woff2")));

  // Mono font: find a .woff or .ttf mono file
  const monoFile = ttfAndWoff.find((f) => f.includes("font-mono"));
  if (!monoFile) {
    // Mono fonts are only stored as woff2 with font-mono prefix. Try the hashed .woff files.
    const woffFiles = ttfAndWoff.filter((f) => f.endsWith(".woff"));
    if (woffFiles.length > 0) {
      monoFontData = fs.readFileSync(path.join(fontsDir, woffFiles[0])).buffer as ArrayBuffer;
    }
  } else {
    monoFontData = fs.readFileSync(path.join(fontsDir, monoFile)).buffer as ArrayBuffer;
  }

  // Display font: find the largest .ttf file (likely the variable font)
  const nonMonoFiles = ttfAndWoff
    .filter((f) => !f.includes("font-mono"))
    .map((f) => ({
      name: f,
      size: fs.statSync(path.join(fontsDir, f)).size,
    }))
    .sort((a, b) => b.size - a.size);

  if (nonMonoFiles.length > 0) {
    displayFontData = fs.readFileSync(
      path.join(fontsDir, nonMonoFiles[0].name)
    ).buffer as ArrayBuffer;
  }

  fontsLoaded = true;
}

export async function renderOgImage(jsx: any): Promise<Buffer> {
  loadFonts();

  const fonts: satori.SatoriOptions["fonts"] = [];
  if (displayFontData) {
    fonts.push({ name: "Display", data: displayFontData, weight: 900 });
  }
  if (monoFontData) {
    fonts.push({ name: "Mono", data: monoFontData, weight: 600 });
  }

  // Fallback: if no fonts found, we can't render
  if (fonts.length === 0) {
    throw new Error(
      "No fonts found in .astro/fonts/. Run `astro build` or `astro dev` first to download fonts."
    );
  }

  const svg = await satori(jsx, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });

  return sharp(Buffer.from(svg)).png().toBuffer() as Promise<Buffer>;
}

// Shared style tokens
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

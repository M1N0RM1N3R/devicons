import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distPath = (file: string) => path.resolve(__dirname, "../dist", file);

export const cssPath = () => distPath("devicons.css");
export const woff2Path = () => distPath("devicons.woff2");
export const ttfPath = () => distPath("devicons.ttf");
export const spritePath = () => distPath("sprite-symbol.svg");
export const codepointsPath = () => distPath("codepoints.json");

export interface Codepoints {
  [name: string]: number;
}

export const loadCodepoints = async (): Promise<Codepoints> => {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(codepointsPath(), "utf-8");
  return JSON.parse(raw);
};

import path from 'node:path';
import { SVGIcons2SVGFontStream } from './svgicons2svgfont';
import fastGlob from 'fast-glob';
import {
  createReadStream,
  createWriteStream,
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';

import svg2ttf from 'svg2ttf';
import ttf2woff2 from 'ttf2woff2';
import { html } from './templates/html';
import { licence, fontBase, item } from './templates/css';

const DEFAULT_START_CODEPOINT = 0xf101;

const codepointToUnicode = (codepoint: number) => `\\${codepoint.toString(16)}`;

export interface BuildFontOptions {
  inputDir: string;
  outputDir: string;
  version?: string;
  hash?: string;
  pinnedCodepoints?: Record<string, number>;
}

export interface BuildFontResult {
  outputDir: string;
  codepoints: Record<string, number>;
  assets: string[];
}

export const buildFont = async (
  options: BuildFontOptions,
): Promise<BuildFontResult> => {
  const { inputDir, outputDir, pinnedCodepoints } = options;
  const version = options.version ?? '1.0.0';
  const hash = options.hash ?? Date.now().toString(36);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const codepoints = new Map<string, number>();
  const used = new Set<number>();
  let nextFree = DEFAULT_START_CODEPOINT;
  if (pinnedCodepoints) {
    for (const cp of Object.values(pinnedCodepoints)) {
      used.add(cp);
      if (cp >= nextFree) nextFree = cp + 1;
    }
  }
  const getNextCodePoint = (name: string) => {
    const pinned = pinnedCodepoints?.[name];
    if (pinned !== undefined) {
      codepoints.set(name, pinned);
      return pinned;
    }
    while (used.has(nextFree)) nextFree++;
    const codePoint = nextFree++;
    used.add(codePoint);
    codepoints.set(name, codePoint);
    return codePoint;
  };

  await new Promise<void>(async (resolve, reject) => {
    const svgFiles = await fastGlob(path.join(inputDir, '*.svg'));
    svgFiles.sort();

    const fontStream = new SVGIcons2SVGFontStream({
      fontName: 'Devicons',
      fontHeight: 1000,
      fontWeight: 400,
      normalize: true,
      // @ts-ignore
      log: () => {},
    });

    fontStream
      .pipe(createWriteStream(path.join(outputDir, 'devicons.svg')))
      .on('finish', () => resolve())
      .on('error', reject);

    for (const svgFile of svgFiles) {
      const name = path.basename(svgFile, '.svg');
      const codepoint = getNextCodePoint(name);
      const glyph = createReadStream(svgFile) as NodeJS.ReadableStream & {
        metadata?: unknown;
      };
      glyph.metadata = {
        name,
        unicode: [String.fromCharCode(codepoint)],
      };
      fontStream.write(glyph);
    }
    fontStream.end();
  });

  const codepointsObj = Object.fromEntries(codepoints);
  writeFileSync(
    path.join(outputDir, 'codepoints.json'),
    JSON.stringify(codepointsObj, null, 2),
  );

  const ttf = svg2ttf(
    readFileSync(path.join(outputDir, 'devicons.svg'), 'utf8'),
    { ts: 0 },
  );
  writeFileSync(path.join(outputDir, 'devicons.ttf'), Buffer.from(ttf.buffer));

  const woff2 = ttf2woff2(Buffer.from(ttf.buffer));
  writeFileSync(
    path.join(outputDir, 'devicons.woff2'),
    Buffer.from(woff2.buffer),
  );

  let css = licence(version) + fontBase(hash);
  for (const [name, codepoint] of codepoints) {
    css += item(name, codepointToUnicode(codepoint));
  }
  writeFileSync(path.join(outputDir, 'devicons.css'), css);

  const assets = Object.keys(codepointsObj);
  writeFileSync(path.join(outputDir, 'devicons.html'), html(assets));

  return { outputDir, codepoints: codepointsObj, assets };
};

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const cwd = process.cwd();
  buildFont({
    inputDir: path.join(cwd, 'export-files', 'font'),
    outputDir: path.join(cwd, 'dist', 'font'),
  })
    .then(r =>
      console.log(`@dev.icons/core: font built (${r.assets.length} glyphs)`),
    )
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

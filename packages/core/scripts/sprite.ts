import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import Spriter from 'svg-sprite';
import fastGlob from 'fast-glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BuildSpriteOptions {
  inputDir: string;
  outputDir: string;
}

export interface BuildSpriteResult {
  outputDir: string;
  files: string[];
}

export const buildSprite = async (
  options: BuildSpriteOptions,
): Promise<BuildSpriteResult> => {
  const { inputDir, outputDir } = options;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const spriter = new Spriter({
    dest: outputDir,
    svg: { namespaceIDPrefix: '' },
    shape: {
      id: {
        generator: (id: string) => `${id.replace('.svg', '')}`,
      },
    },
    mode: {
      css: false,
      view: false,
      defs: false,
      symbol: true,
      stack: false,
    },
  });

  const icons = await fastGlob(path.join(inputDir, '*.svg'));
  icons.sort();

  for (const icon of icons) {
    const basename = path.basename(icon);
    spriter.add(basename, null, fs.readFileSync(icon, 'utf-8'));
  }

  const { result } = await spriter.compileAsync();
  const written: string[] = [];

  for (const mode in result) {
    for (const resource in result[mode]) {
      const base = path.basename(resource) + `-${mode}` + '.svg';
      const outFile = path.join(outputDir, base);
      fs.writeFileSync(outFile, result[mode][resource].contents);
      written.push(outFile);
    }
  }

  return { outputDir, files: written };
};

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  buildSprite({
    inputDir: path.join(__dirname, '../export-files/icons'),
    outputDir: path.join(__dirname, '../dist/sprite'),
  })
    .then(r =>
      console.log(`@dev.icons/core: sprite built (${r.files.length} files)`),
    )
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

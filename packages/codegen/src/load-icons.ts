import fastGlob from 'fast-glob';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { iconToComponentName, getSvgContents } from '@dev.icons/utils';
import type { IconRecord } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_ICONS_DIR = path.resolve(
  __dirname,
  '../../core/export-files/icons',
);
export const DEFAULT_FONT_DIR = path.resolve(
  __dirname,
  '../../core/export-files/font',
);

export interface LoadIconsOptions {
  iconsDir?: string;
  fontDir?: string;
  concurrency?: number;
}

const mapConcurrent = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return out;
};

export const loadIcons = async (
  options: LoadIconsOptions = {},
): Promise<IconRecord[]> => {
  const iconsDir = options.iconsDir ?? DEFAULT_ICONS_DIR;
  const fontDir = options.fontDir ?? DEFAULT_FONT_DIR;
  const concurrency = options.concurrency ?? 32;

  const iconFiles = await fastGlob(path.join(iconsDir, '*.svg'));
  iconFiles.sort();

  return mapConcurrent(iconFiles, concurrency, async iconPath => {
    const filename = path.basename(iconPath);
    const baseName = path.basename(filename, '.svg');
    const componentName = iconToComponentName(filename);
    const fontPath = path.join(fontDir, filename);

    const [iconRaw, fontRaw] = await Promise.all([
      readFile(iconPath, 'utf-8'),
      readFile(fontPath, 'utf-8'),
    ]);

    return {
      filename,
      baseName,
      componentName,
      iconSvg: getSvgContents(iconRaw).trim(),
      fontSvg: getSvgContents(fontRaw).trim(),
    };
  });
};

// Optimizes every SVG under export-files/{icons,font} in place.
// Uses svgo's preset-default with: multipass, floatPrecision=1,
// viewBox preserved, and id rewriting kept non-destructive so refs
// emitted by process-icons.ts (devicon-<name>-<n>) stay intact.

import fastGlob from 'fast-glob';
import path from 'node:path';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import svgo from 'svgo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  path.join(ROOT, 'export-files/icons/**/*.svg'),
  path.join(ROOT, 'export-files/font/**/*.svg'),
];

type Row = { file: string; before: number; after: number };

const optimize = (svg: string, skipConvertPathData = false): string =>
  svgo.optimize(svg, {
    multipass: true,
    floatPrecision: 1,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            cleanupIds: { minify: false, remove: false },
            // svgo 3.3.2 has a reflectPoint bug that crashes on a few
            // files (e.g. snowflake.svg); retry path disables it so
            // the file still gets all other optimizations.
            ...(skipConvertPathData ? { convertPathData: false } : {}),
          },
        },
      },
    ],
  }).data;

const fmtKB = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const fmtPct = (before: number, after: number) =>
  `${(((before - after) / before) * 100).toFixed(1)}%`;

const run = async () => {
  const files = await fastGlob(TARGETS);
  const rows: Row[] = [];

  for (const file of files) {
    const before = (await stat(file)).size;
    const svg = await readFile(file, 'utf8');
    let next: string | null = null;
    try {
      next = optimize(svg);
    } catch {
      try {
        next = optimize(svg, true);
        console.warn(`fallback (no convertPathData): ${path.relative(ROOT, file)}`);
      } catch (err) {
        console.error(`skip ${file}:`, err);
      }
    }
    if (next != null) {
      if (next.length < svg.length) {
        await writeFile(file, next);
      }
      rows.push({ file, before, after: next.length });
    }
  }

  const sumBefore = rows.reduce((a, r) => a + r.before, 0);
  const sumAfter = rows.reduce((a, r) => a + r.after, 0);

  rows
    .map(r => ({ ...r, saved: r.before - r.after }))
    .sort((a, b) => b.saved - a.saved)
    .slice(0, 20)
    .forEach(r => {
      const rel = path.relative(ROOT, r.file);
      console.log(
        `${rel.padEnd(42)}  ${fmtKB(r.before).padStart(8)} → ${fmtKB(
          r.after,
        ).padStart(8)}  (-${fmtPct(r.before, r.after)})`,
      );
    });

  console.log(
    `\n${rows.length} files  ${fmtKB(sumBefore)} → ${fmtKB(
      sumAfter,
    )}  (-${fmtPct(sumBefore, sumAfter)})`,
  );
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});

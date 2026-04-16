import { readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

/** Recursively walk a directory, calling fn(absPath) on every .d.ts file (excluding .d.mts/.d.cts). */
const walkDts = (dir: string, fn: (file: string) => void) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDts(full, fn);
    else if (entry.name.endsWith('.d.ts') && !entry.name.endsWith('.d.mts') && !entry.name.endsWith('.d.cts')) fn(full);
  }
};

/**
 * Rewrite relative import/export specifiers in a .d.ts file body so they carry an
 * explicit runtime extension (.mjs or .cjs). Required by TS NodeNext ESM resolution
 * when the declaration file is .d.mts/.d.cts.
 */
const rewriteRelativeSpecifiers = (body: string, sourceFile: string, ext: 'mjs' | 'cjs'): string => {
  const sourceDir = path.dirname(sourceFile);
  // Matches: from '...' / from "..." / import '...' (side-effect) / export ... from '...'
  // Captures the specifier between quotes.
  const specRe = /((?:from|import)\s*)(['"])(\.\.?\/[^'"\n]+)\2/g;
  return body.replace(specRe, (_m, lead: string, quote: string, spec: string) => {
    // If already has a recognised JS-ish extension, leave it.
    if (/\.(m?js|c?js|json)$/i.test(spec)) return `${lead}${quote}${spec}${quote}`;
    const absNoExt = path.resolve(sourceDir, spec);
    // Directory index? Use ./foo/index.<ext>
    if (existsSync(absNoExt) && statSync(absNoExt).isDirectory()) {
      return `${lead}${quote}${spec.replace(/\/$/, '')}/index.${ext}${quote}`;
    }
    // Sibling file with .d.ts in dist? Append .<ext>.
    if (existsSync(absNoExt + '.d.ts')) {
      return `${lead}${quote}${spec}.${ext}${quote}`;
    }
    // Fallback: still append the extension (consistent with ESM expectations).
    return `${lead}${quote}${spec}.${ext}${quote}`;
  });
};

walkDts(DIST, file => {
  const base = file.slice(0, -'.d.ts'.length);
  const body = readFileSync(file, 'utf8');
  const mtsTarget = base + '.d.mts';
  const ctsTarget = base + '.d.cts';
  // If source file has no relative imports, a verbatim copy is fine (faster, preserves bytes).
  if (!/((?:from|import)\s*)['"]\.\.?\//.test(body)) {
    copyFileSync(file, mtsTarget);
    copyFileSync(file, ctsTarget);
    return;
  }
  writeFileSync(mtsTarget, rewriteRelativeSpecifiers(body, file, 'mjs'));
  writeFileSync(ctsTarget, rewriteRelativeSpecifiers(body, file, 'cjs'));
});

console.log('[post-build] dual-extension type files emitted');

// packages/core/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  // Force .mjs/.cjs filenames so the package.json `exports` map is self-documenting
  // regardless of `"type": "module"` (which would otherwise make tsup emit ESM as .js).
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  dts: true,
  sourcemap: false,
  clean: false, // build-all.ts manages dist lifecycle
  outDir: 'dist',
  target: 'es2022',
  // Defensive: if anything ever imports a workspace-private package,
  // bundle it inline rather than leak a `dependencies` entry.
  noExternal: ['@dev.icons/utils', '@dev.icons/codegen'],
});

# Release CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up automated npm releases for the devicons monorepo via `semantic-release` + conventional commits, so that pushes to `master`/`canary` that touch `packages/core/export-files/**` publish `@dev.icons/{core,react,vue,svelte}` (lockstep) and/or `devicons` (font, independent) to npm.

**Architecture:** Driver-and-mirror lockstep — `semantic-release` runs against `@dev.icons/core` (the driver) inside `scripts/release-group1.mjs`, computes the next version, then a mirror loop writes that version into `react`/`vue`/`svelte` `package.json` and `pnpm publish`es each. `devicons` runs independently via `semantic-release-monorepo` scoped to font paths. Canary uses native monotonic-within-window prereleases (`0.2.0-canary.1`, `0.2.0-canary.2`, …). All decisions driven by Conventional Commits.

**Tech Stack:** `semantic-release` (`@semantic-release/{commit-analyzer,release-notes-generator,changelog,npm,git,github}`), `semantic-release-monorepo`, `conventional-changelog-conventionalcommits`, `tsup` (for the new `@dev.icons/core` library entry), pnpm (already `pnpm@10.10.0`), GitHub Actions.

**Spec reference:** [docs/superpowers/specs/2026-04-15-release-ci-workflow-design.md](../specs/2026-04-15-release-ci-workflow-design.md)

---

## File Structure

**Created:**
- `packages/core/src/index.ts` — public library entry (icon manifest types + accessors)
- `packages/core/src/icons-data.ts` — generated icon manifest constant (gitignored)
- `packages/core/scripts/build-lib.ts` — generates `src/icons-data.ts` from `packages/font/codepoints.lock.json`, runs `tsup`, writes `dist/icons.json`
- `packages/core/tsup.config.ts` — tsup configuration for the library entry
- `packages/core/test/lib.test.ts` — Vitest spec for the library entry's manifest shape
- `packages/core/tsconfig.json` — minimal tsconfig used by tsup for type emission
- `scripts/release-group1.mjs` — programmatic semantic-release call + driver+mirror logic
- `packages/font/release.config.cjs` — semantic-release config for the independent `devicons` track, scoped via `semantic-release-monorepo`
- `.github/workflows/release.yml` — single workflow with two parallel jobs (`group1`, `font`)
- `CONTRIBUTING.md` — conventional-commits requirement for any commit touching `packages/core/export-files/`

**Modified:**
- `package.json` (root) — devDependencies + `release:dry` / `release:font:dry` scripts
- `.gitignore` — ignore `packages/core/src/icons-data.ts` (generated)
- `packages/core/package.json` — `"type": "module"` (already), new `exports` map, hygiene fields, `tsup` devDep, `build` script unchanged (still runs `build-all.ts`)
- `packages/core/scripts/build-all.ts` — add `core-lib` step that invokes `build-lib.ts`
- `packages/react/package.json` — hygiene fields
- `packages/vue/package.json` — hygiene fields
- `packages/svelte/package.json` — hygiene fields
- `packages/font/package.json` — `publishConfig.provenance` + hygiene fields

**Untouched (this plan does not modify these):**
- `packages/utils/package.json` (private, never publishes)
- `packages/codegen/package.json` (private, never publishes)
- `apps/figma/package.json` (private, never publishes)
- Any `packages/*/src/**` other than `packages/core/src/`

---

## Phase 0 — Repository preparation

Add the toolchain. No publishing logic yet.

### Task 0.1 — Add semantic-release devDependencies + scripts to root package.json

**Files:**
- Modify: [package.json](../../../package.json)

- [ ] **Step 1: Edit root `package.json`**

Replace the `devDependencies` and `scripts` blocks. Final shape:

```json
{
  "name": "@dev.icons/repo",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@10.10.0",
  "description": "Devicons - A collection of icons for developers",
  "keywords": [],
  "scripts": {
    "build": "pnpm -F @dev.icons/core build",
    "build:icons": "pnpm -F @dev.icons/core build -- --no-frameworks --no-font-pkg",
    "build:frameworks": "pnpm -F @dev.icons/core build -- --no-font --no-sprite --no-font-pkg",
    "build:font": "pnpm -F devicons build",
    "build:website": "pnpm -F @dev.icons/website build",
    "generate:react": "pnpm -F @dev.icons/react generate",
    "generate:vue": "pnpm -F @dev.icons/vue generate",
    "generate:svelte": "pnpm -F @dev.icons/svelte generate",
    "test": "pnpm -r --parallel test",
    "check": "pnpm -F @dev.icons/core check",
    "clean:generated": "node scripts/clean-generated.mjs",
    "release:dry": "DRY_RUN=true node scripts/release-group1.mjs",
    "release:font:dry": "DRY_RUN=true pnpm exec semantic-release --dry-run --no-ci -e ./packages/font/release.config.cjs"
  },
  "devDependencies": {
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/commit-analyzer": "^13.0.1",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^11.0.1",
    "@semantic-release/npm": "^12.0.1",
    "@semantic-release/release-notes-generator": "^14.0.3",
    "conventional-changelog-conventionalcommits": "^8.0.0",
    "semantic-release": "^24.2.0",
    "semantic-release-monorepo": "^8.0.2",
    "typescript": "^5.7.3",
    "vitest": "3.1.3"
  }
}
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile updates, all 9 new devDependencies installed at workspace root, no peer-warnings about semantic-release.

- [ ] **Step 3: Verify install**

Run: `node -p "require('semantic-release/package.json').version"`
Expected: prints `24.x.y`.

(Note: `pnpm exec semantic-release --version` reports the **cwd package's** version, not the tool's — it's a yargs quirk. Use the `node -p` form above instead.)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add semantic-release toolchain to root devDependencies"
```

---

### Task 0.2 — Bootstrap `packages/core` for a real library build

**Files:**
- Create: [packages/core/tsconfig.json](../../../packages/core/tsconfig.json)
- Modify: [packages/core/package.json](../../../packages/core/package.json) — add `tsup` devDep only (full hygiene pass comes in Task 1.5)
- Modify: [.gitignore](../../../.gitignore) — ignore generated `packages/core/src/icons-data.ts`

- [ ] **Step 1: Create `packages/core/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src/**/*", "scripts/**/*", "test/**/*"]
}
```

- [ ] **Step 2: Add `tsup` to `packages/core/package.json` devDependencies**

In [packages/core/package.json](../../../packages/core/package.json), insert `"tsup": "^8.3.5"` into the existing `devDependencies` block (alphabetical position — between `transformation-matrix-js` and `tsx`):

```json
    "transformation-matrix-js": "^2.7.6",
    "tsup": "^8.3.5",
    "tsx": "^4.19.2",
```

(Other hygiene fields land in Task 1.5; this step only adds the build tool.)

- [ ] **Step 3: Update root `.gitignore`**

In [.gitignore](../../../.gitignore), append:

```
# Generated by packages/core/scripts/build-lib.ts
packages/core/src/icons-data.ts
```

- [ ] **Step 4: Install + verify tsup**

Run: `pnpm install && pnpm -F @dev.icons/core exec tsup --version`
Expected: tsup version printed (`8.x.y`).

- [ ] **Step 5: Create the `src/` directory**

Run: `mkdir -p packages/core/src`
Expected: directory created.

- [ ] **Step 6: Commit**

```bash
git add packages/core/tsconfig.json packages/core/package.json pnpm-lock.yaml .gitignore
git commit -m "chore(core): bootstrap library build (tsup, tsconfig, gitignore generated data)"
```

---

## Phase 1 — `@dev.icons/core` library entry (TDD)

The package currently has no library entry. We add one — a tree-shakeable icon manifest backed by `packages/font/codepoints.lock.json`.

### Task 1.1 — Write failing test for library entry shape

**Files:**
- Create: [packages/core/test/lib.test.ts](../../../packages/core/test/lib.test.ts)

- [ ] **Step 1: Write the test**

```ts
// packages/core/test/lib.test.ts
import { describe, expect, it } from 'vitest';
import { ICONS, getIcon, type IconRecord } from '../src/index';

describe('@dev.icons/core library entry', () => {
  it('exposes a non-empty icon manifest', () => {
    expect(Array.isArray(ICONS)).toBe(true);
    expect(ICONS.length).toBeGreaterThan(0);
  });

  it('every icon has name + numeric codepoint + unicode escape', () => {
    for (const icon of ICONS) {
      expect(typeof icon.name).toBe('string');
      expect(icon.name.length).toBeGreaterThan(0);
      expect(typeof icon.codepoint).toBe('number');
      expect(icon.codepoint).toBeGreaterThan(0);
      expect(typeof icon.unicode).toBe('string');
      expect(icon.unicode.length).toBe(1);
      expect(icon.unicode.codePointAt(0)).toBe(icon.codepoint);
    }
  });

  it('flags icon variants (names ending in -icon)', () => {
    const variant = ICONS.find((i) => i.name.endsWith('-icon'));
    const plain = ICONS.find((i) => !i.name.endsWith('-icon'));
    expect(variant?.isVariant).toBe(true);
    expect(plain?.isVariant).toBe(false);
  });

  it('getIcon() returns a record by name and undefined for unknown', () => {
    const known: IconRecord | undefined = getIcon('adonisjs');
    expect(known?.name).toBe('adonisjs');
    expect(getIcon('nope-not-real')).toBeUndefined();
  });

  it('manifest is sorted by codepoint ascending', () => {
    for (let i = 1; i < ICONS.length; i++) {
      expect(ICONS[i].codepoint).toBeGreaterThan(ICONS[i - 1].codepoint);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm -F @dev.icons/core test -- lib.test.ts`
Expected: FAIL — "Cannot find module '../src/index'" or similar (file doesn't exist yet).

---

### Task 1.2 — Implement library entry + types

**Files:**
- Create: [packages/core/src/index.ts](../../../packages/core/src/index.ts)

- [ ] **Step 1: Write `src/index.ts`**

```ts
// packages/core/src/index.ts
import { ICONS_DATA } from './icons-data';

export interface IconRecord {
  /** Filename stem (no `.svg`), e.g. `"adonisjs"` or `"adonisjs-icon"`. */
  name: string;
  /** Decimal codepoint in the Private Use Area, e.g. `61697`. */
  codepoint: number;
  /** Single-character unicode string (`String.fromCodePoint(codepoint)`). */
  unicode: string;
  /** True iff `name` ends in `-icon`. */
  isVariant: boolean;
}

/** All icons, sorted by codepoint ascending. */
export const ICONS: readonly IconRecord[] = ICONS_DATA;

const BY_NAME: Map<string, IconRecord> = new Map(
  ICONS_DATA.map((icon) => [icon.name, icon]),
);

/** Lookup an icon by name. O(1). Returns `undefined` if the name is unknown. */
export const getIcon = (name: string): IconRecord | undefined =>
  BY_NAME.get(name);
```

- [ ] **Step 2: Run the test — should still fail (no `icons-data.ts` yet)**

Run: `pnpm -F @dev.icons/core test -- lib.test.ts`
Expected: FAIL — "Cannot find module './icons-data'".

This is correct — `icons-data.ts` is generated by `build-lib.ts` in the next task.

---

### Task 1.3 — Write `build-lib.ts` to generate `src/icons-data.ts` and `dist/icons.json`

**Files:**
- Create: [packages/core/scripts/build-lib.ts](../../../packages/core/scripts/build-lib.ts)
- Create: [packages/core/tsup.config.ts](../../../packages/core/tsup.config.ts)

- [ ] **Step 1: Write `tsup.config.ts`**

```ts
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
```

- [ ] **Step 2: Write `scripts/build-lib.ts`**

```ts
// packages/core/scripts/build-lib.ts
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

const CODEPOINTS_LOCK = path.join(ROOT, 'packages/font/codepoints.lock.json');
const SRC_DATA = path.join(__dirname, '../src/icons-data.ts');
const DIST_DIR = path.join(__dirname, '../dist');
const DIST_ICONS_JSON = path.join(DIST_DIR, 'icons.json');

interface IconRecord {
  name: string;
  codepoint: number;
  unicode: string;
  isVariant: boolean;
}

const buildManifest = (): IconRecord[] => {
  if (!fs.existsSync(CODEPOINTS_LOCK)) {
    throw new Error(
      `Codepoints lockfile not found at ${CODEPOINTS_LOCK}. ` +
        `Run \`pnpm -F devicons build\` first to generate it, or ensure ` +
        `the font build runs before core-lib in build-all.ts.`,
    );
  }
  const raw: Record<string, number> = JSON.parse(
    fs.readFileSync(CODEPOINTS_LOCK, 'utf-8'),
  );
  return Object.entries(raw)
    .map(([name, codepoint]) => ({
      name,
      codepoint,
      unicode: String.fromCodePoint(codepoint),
      isVariant: name.endsWith('-icon'),
    }))
    .sort((a, b) => a.codepoint - b.codepoint);
};

const writeIconsData = (manifest: IconRecord[]) => {
  // Generated TS module — imported by src/index.ts at compile time.
  // Gitignored. Regenerated on every build.
  const body =
    '// AUTO-GENERATED by packages/core/scripts/build-lib.ts. Do not edit.\n' +
    "import type { IconRecord } from './index';\n\n" +
    'export const ICONS_DATA: readonly IconRecord[] = ' +
    JSON.stringify(manifest, null, 2) +
    ';\n';
  fs.writeFileSync(SRC_DATA, body);
};

const writeDistIconsJson = (manifest: IconRecord[]) => {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.writeFileSync(DIST_ICONS_JSON, JSON.stringify(manifest, null, 2) + '\n');
};

const runTsup = () =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'tsup'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`tsup exited with code ${code}`)),
    );
  });

export const buildLib = async () => {
  const manifest = buildManifest();
  writeIconsData(manifest);
  writeDistIconsJson(manifest);
  await runTsup();
};

// CLI entry: `tsx scripts/build-lib.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  buildLib().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 3: Run `build-lib.ts` standalone to confirm it works**

Run: `pnpm -F @dev.icons/core exec tsx scripts/build-lib.ts`
Expected:
- `packages/core/src/icons-data.ts` is created
- `packages/core/dist/icons.json` is created
- `packages/core/dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` are emitted by tsup
- No errors

- [ ] **Step 4: Run the test — should now pass**

Run: `pnpm -F @dev.icons/core test -- lib.test.ts`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/index.ts packages/core/scripts/build-lib.ts \
        packages/core/tsup.config.ts packages/core/test/lib.test.ts
git commit -m "feat(core): add library entry exporting icon manifest"
```

---

### Task 1.4 — Wire `build-lib` into `build-all.ts`

**Files:**
- Modify: [packages/core/scripts/build-all.ts](../../../packages/core/scripts/build-all.ts)

- [ ] **Step 1: Edit `build-all.ts`**

Add the import at the top of the file (after the existing imports):

```ts
import { buildLib } from './build-lib';
```

Add a new flag near the existing flags:

```ts
const skipLib = args.has('--no-lib');
```

Add a new step inside `run()`, after the existing `tasks.push(...)` blocks for `core-sprite` / `core-font` / `codegen-*` and **before** `await Promise.all(tasks)`:

```ts
  if (!skipLib) {
    tasks.push(step('core-lib', () => buildLib()));
  }
```

`buildLib()` reads `packages/font/codepoints.lock.json`, which is updated by the font package build (`font-package` step at the bottom). On a **first** build (lockfile missing), `buildLib()` throws with a clear error pointing to `pnpm -F devicons build`. On subsequent builds the lockfile already exists, so order does not matter.

If you want zero-friction first-run, you can instead place `core-lib` after the `font-package` step:

```ts
  if (!skipFontPkg) {
    await step('font-package', () =>
      runNpmScript(path.join(ROOT, 'packages/font'), 'build'),
    );
  }

  if (!skipLib) {
    await step('core-lib', () => buildLib());
  }
```

**Use this second placement** — it's the safer default and matches what CI will do on a fresh clone.

The final `run()` body should look like this (sequential `core-lib` after `font-package`):

```ts
const run = async () => {
  const totalStart = Date.now();

  const icons = await step('load-icons', () =>
    loadIcons({ iconsDir: ICONS_IN, fontDir: FONT_IN }),
  );
  console.log(`  loaded ${icons.length} icons`);

  const tasks: Promise<unknown>[] = [];

  if (!skipSprite) {
    tasks.push(
      step('core-sprite', () =>
        buildSprite({
          inputDir: ICONS_IN,
          outputDir: path.join(CORE_DIST, 'sprite'),
        }),
      ),
    );
  }

  if (!skipFont) {
    tasks.push(
      step('core-font', () =>
        buildFont({
          inputDir: FONT_IN,
          outputDir: path.join(CORE_DIST, 'font'),
          version: '1.8.0',
        }),
      ),
    );
  }

  if (!skipFrameworks) {
    tasks.push(
      step('codegen-react', () =>
        generate({ framework: 'react', outDir: REACT_OUT, icons }),
      ),
      step('codegen-vue', () =>
        generate({ framework: 'vue', outDir: VUE_OUT, icons }),
      ),
      step('codegen-svelte', () =>
        generate({ framework: 'svelte', outDir: SVELTE_OUT, icons }),
      ),
    );
  }

  await Promise.all(tasks);

  if (!skipFontPkg) {
    await step('font-package', () =>
      runNpmScript(path.join(ROOT, 'packages/font'), 'build'),
    );
  }

  if (!skipLib) {
    await step('core-lib', () => buildLib());
  }

  console.log(`✓ build-all done in ${Date.now() - totalStart}ms`);
};
```

- [ ] **Step 2: Run a full build from scratch**

Run:
```bash
rm -rf packages/core/dist packages/core/src/icons-data.ts packages/font/dist
pnpm -F @dev.icons/core build
```

Expected: every step prints `▸` then `done in Xms`. At the end, `packages/core/dist/` contains `index.mjs`, `index.cjs`, `index.d.ts`, `icons.json`, `sprite/sprite-symbol.svg`, `font/devicons.{css,ttf,woff,woff2,eot}`.

- [ ] **Step 3: Sanity-check the output files exist**

Run: `ls packages/core/dist`
Expected output includes (order may vary): `font  icons.json  index.cjs  index.d.ts  index.mjs  sprite`

- [ ] **Step 4: Re-run tests (build wired up)**

Run: `pnpm -F @dev.icons/core test`
Expected: all tests pass (lib.test.ts + any pre-existing tests like `sprite.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add packages/core/scripts/build-all.ts
git commit -m "feat(core): wire core-lib step into build-all"
```

---

### Task 1.5 — Apply hygiene + new exports map to `packages/core/package.json`

**Files:**
- Modify: [packages/core/package.json](../../../packages/core/package.json)

- [ ] **Step 1: Replace `packages/core/package.json` with the final shape**

```json
{
  "name": "@dev.icons/core",
  "version": "0.0.0",
  "description": "Devicons Core - The core package for Devicons",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./icons.json": "./dist/icons.json",
    "./sprite": "./dist/sprite/sprite-symbol.svg",
    "./font/css": "./dist/font/devicons.css",
    "./font/woff2": "./dist/font/devicons.woff2",
    "./font/ttf": "./dist/font/devicons.ttf"
  },
  "files": ["dist"],
  "sideEffects": false,
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vorillaz/devicons.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/vorillaz/devicons#readme",
  "bugs": { "url": "https://github.com/vorillaz/devicons/issues" },
  "license": "MIT",
  "author": "Theodore Vorillas",
  "keywords": ["icons", "devicons", "sprite", "font", "svg"],
  "scripts": {
    "export-to-raw": "tsx scripts/export-to-raw.ts",
    "to-font": "tsx scripts/to-font.ts",
    "process-icons": "tsx scripts/process-icons.ts",
    "sprite": "tsx scripts/sprite.ts",
    "check": "tsx scripts/check.ts",
    "build": "tsx scripts/build-all.ts",
    "build:lib": "tsx scripts/build-lib.ts",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/node": "22.9.0",
    "@types/sax": "^1.2.7",
    "@types/svg2ttf": "^5.0.3",
    "@types/ttf2eot": "^2.0.2",
    "@types/ttf2woff": "^2.0.4",
    "@types/ttf2woff2": "^2.0.2",
    "debug": "^4.4.0",
    "fast-glob": "3.3.3",
    "sax": "^1.4.1",
    "svg-pathdata": "^7.1.0",
    "svgo": "3.3.2",
    "svg2ttf": "^6.0.3",
    "svg-sprite": "2.0.4",
    "ttf2eot": "^3.1.0",
    "ttf2woff": "^3.0.0",
    "ttf2woff2": "^5.0.0",
    "transformation-matrix-js": "^2.7.6",
    "tsup": "^8.3.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "3.1.3",
    "yerror": "^8.0.0",
    "@dev.icons/codegen": "workspace:*",
    "@dev.icons/utils": "workspace:*"
  }
}
```

- [ ] **Step 2: Verify the package can be packed and the tarball contains only `dist/`**

Run: `pnpm -F @dev.icons/core pack --pack-destination /tmp`
Expected: prints a tarball path like `/tmp/dev.icons-core-0.0.0.tgz`. No errors.

Run: `tar -tzf /tmp/dev.icons-core-0.0.0.tgz | head -20`
Expected: every entry starts with `package/dist/` or is `package/package.json` / `package/README.md`. No `src/`, no `scripts/`, no `test/`.

- [ ] **Step 3: Run publint against the tarball**

Run: `pnpm dlx publint /tmp/dev.icons-core-0.0.0.tgz`
Expected: zero errors. Warnings about missing `LICENSE` or `README` are OK to defer (file the README/LICENSE under separate cleanup), but no errors.

- [ ] **Step 4: Smoke-install the tarball and require the library entry**

Run:
```bash
mkdir -p /tmp/devicons-core-smoke && cd /tmp/devicons-core-smoke
npm init -y > /dev/null
npm install /tmp/dev.icons-core-0.0.0.tgz
node -e "const x = require('@dev.icons/core'); console.log('icons:', x.ICONS.length); console.log('first:', x.ICONS[0]);"
```

Expected: prints something like `icons: 850` then a record like `{ name: 'adonisjs', codepoint: 61697, unicode: '\uF101', isVariant: false }`.

Run: `node -e "import('@dev.icons/core').then(m => console.log('esm getIcon:', m.getIcon('adonisjs')));"`
Expected: prints the same record via ESM dynamic import.

- [ ] **Step 5: Cleanup smoke-test sandbox**

Run: `rm -rf /tmp/devicons-core-smoke /tmp/dev.icons-core-0.0.0.tgz`

- [ ] **Step 6: Commit**

```bash
git add packages/core/package.json
git commit -m "chore(core): publish hygiene — exports map, publishConfig, files, repo metadata"
```

---

## Phase 2 — Hygiene for `react` / `vue` / `svelte`

Each gets the same hygiene block. Tarball shape is already correct (`files: ["dist"]` is set in all three).

**Precondition for ALL three packages:** the vite build must emit `dist/index.d.ts`. If `pnpm -F @dev.icons/<pkg> build && ls packages/<pkg>/dist/index.d.ts` reports "no such file", wire up [`vite-plugin-dts`](https://github.com/qmhc/vite-plugin-dts) first:

1. `pnpm -F @dev.icons/react add -D vite-plugin-dts && pnpm -F @dev.icons/vue add -D vite-plugin-dts && pnpm -F @dev.icons/svelte add -D vite-plugin-dts`
2. In each `packages/<pkg>/vite.config.ts`, add the import + plugin:
   ```ts
   import dts from 'vite-plugin-dts';
   // ...
   plugins: [
     /* existing framework plugin (react()/vue()/svelte()) */,
     dts({ tsconfigPath: './tsconfig.json', insertTypesEntry: true, copyDtsFiles: false }),
   ],
   ```
3. Confirm `dist/index.d.ts` exists after rebuild.

Without this, publint will report 3 errors per package (types declared but file missing) and Phase 8 preflight fails.

**Also:** when the hygiene fields land in each `package.json`, ensure the `exports[".".]` object has `types` as the **first** key (publint enforces order):
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

### Task 2.1 — `packages/react/package.json` hygiene

**Files:**
- Modify: [packages/react/package.json](../../../packages/react/package.json)
- Create (if missing): [packages/react/src/index.ts](../../../packages/react/src/index.ts)

**Precondition:** `packages/react/src/index.ts` must exist. This barrel was never committed (vue/svelte have it; react doesn't). If `ls packages/react/src/index.ts` reports "no such file", create it before proceeding:

```ts
// packages/react/src/index.ts
export * from "./lib";
export * from "./ssr";
```

Without this file, `pnpm -F @dev.icons/react build` fails with `Could not resolve entry module "./src/index.ts"` (vite.config.ts uses it as the lib entry).

- [ ] **Step 1: Add hygiene fields to `packages/react/package.json`**

Insert these fields after the existing `"description"` line (before `"keywords"`), preserving everything else:

```json
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vorillaz/devicons.git",
    "directory": "packages/react"
  },
  "homepage": "https://github.com/vorillaz/devicons/tree/master/packages/react#readme",
  "bugs": { "url": "https://github.com/vorillaz/devicons/issues" },
  "license": "MIT",
  "author": "Theodore Vorillas",
```

Replace the empty `"keywords": []` with:

```json
  "keywords": ["icons", "devicons", "react", "svg", "components"],
```

- [ ] **Step 2: Verify pack output**

Run: `pnpm -F @dev.icons/react build && pnpm -F @dev.icons/react pack --pack-destination /tmp`
Expected: tarball at `/tmp/dev.icons-react-0.0.0.tgz`.

Run: `tar -tzf /tmp/dev.icons-react-0.0.0.tgz | grep -v '^package/dist/' | grep -v 'package.json\|README'`
Expected: no output (the only files are under `dist/`, plus `package.json` and `README.md`).

- [ ] **Step 3: Verify no `workspace:*` leak**

Run: `tar -xzOf /tmp/dev.icons-react-0.0.0.tgz package/package.json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); const all=Object.entries({...j.dependencies||{},...j.peerDependencies||{}}); for (const [k,v] of all) if (v.startsWith('workspace:')) { console.error('LEAK:', k, v); process.exit(1); } console.log('OK: no workspace: leaks');"`
Expected: prints `OK: no workspace: leaks`.

- [ ] **Step 4: Cleanup**

Run: `rm /tmp/dev.icons-react-0.0.0.tgz`

- [ ] **Step 5: Commit**

```bash
git add packages/react/package.json
git commit -m "chore(react): publish hygiene — repo metadata, publishConfig, license, keywords"
```

---

### Task 2.2 — `packages/vue/package.json` hygiene

**Files:**
- Modify: [packages/vue/package.json](../../../packages/vue/package.json)

- [ ] **Step 1: Add hygiene fields to `packages/vue/package.json`**

Insert after the existing `"description"` line (before `"keywords"`):

```json
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vorillaz/devicons.git",
    "directory": "packages/vue"
  },
  "homepage": "https://github.com/vorillaz/devicons/tree/master/packages/vue#readme",
  "bugs": { "url": "https://github.com/vorillaz/devicons/issues" },
  "license": "MIT",
  "author": "Theodore Vorillas",
```

Replace `"keywords": []` with:

```json
  "keywords": ["icons", "devicons", "vue", "svg", "components"],
```

- [ ] **Step 2: Verify pack + workspace-leak check**

Run: `pnpm -F @dev.icons/vue build && pnpm -F @dev.icons/vue pack --pack-destination /tmp`
Run: `tar -tzf /tmp/dev.icons-vue-0.0.0.tgz | grep -v '^package/dist/' | grep -v 'package.json\|README'`
Expected: no output.

Run: `tar -xzOf /tmp/dev.icons-vue-0.0.0.tgz package/package.json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); const all=Object.entries({...j.dependencies||{},...j.peerDependencies||{}}); for (const [k,v] of all) if (v.startsWith('workspace:')) { console.error('LEAK:', k, v); process.exit(1); } console.log('OK: no workspace: leaks');"`
Expected: `OK: no workspace: leaks`.

- [ ] **Step 3: Cleanup + commit**

```bash
rm /tmp/dev.icons-vue-0.0.0.tgz
git add packages/vue/package.json
git commit -m "chore(vue): publish hygiene — repo metadata, publishConfig, license, keywords"
```

---

### Task 2.3 — `packages/svelte/package.json` hygiene

**Files:**
- Modify: [packages/svelte/package.json](../../../packages/svelte/package.json)

- [ ] **Step 1: Add hygiene fields to `packages/svelte/package.json`**

Insert after the existing `"description"` line (before `"keywords"`):

```json
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vorillaz/devicons.git",
    "directory": "packages/svelte"
  },
  "homepage": "https://github.com/vorillaz/devicons/tree/master/packages/svelte#readme",
  "bugs": { "url": "https://github.com/vorillaz/devicons/issues" },
  "license": "MIT",
  "author": "Theodore Vorillas",
```

Replace `"keywords": []` with:

```json
  "keywords": ["icons", "devicons", "svelte", "svg", "components"],
```

- [ ] **Step 2: Verify pack + workspace-leak check**

Run: `pnpm -F @dev.icons/svelte build && pnpm -F @dev.icons/svelte pack --pack-destination /tmp`
Run: `tar -tzf /tmp/dev.icons-svelte-0.0.0.tgz | grep -v '^package/dist/' | grep -v 'package.json\|README'`
Expected: no output.

Run: `tar -xzOf /tmp/dev.icons-svelte-0.0.0.tgz package/package.json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); const all=Object.entries({...j.dependencies||{},...j.peerDependencies||{}}); for (const [k,v] of all) if (v.startsWith('workspace:')) { console.error('LEAK:', k, v); process.exit(1); } console.log('OK: no workspace: leaks');"`
Expected: `OK: no workspace: leaks`.

- [ ] **Step 3: Cleanup + commit**

```bash
rm /tmp/dev.icons-svelte-0.0.0.tgz
git add packages/svelte/package.json
git commit -m "chore(svelte): publish hygiene — repo metadata, publishConfig, license, keywords"
```

---

## Phase 3 — Hygiene for `devicons` (font)

`devicons` is already at `1.8.0` on npm; we only add provenance + repo metadata.

### Task 3.1 — `packages/font/package.json` hygiene

**Files:**
- Modify: [packages/font/package.json](../../../packages/font/package.json)

- [ ] **Step 1: Update `packages/font/package.json`**

Final shape:

```json
{
  "name": "devicons",
  "version": "1.8.0",
  "description": "Devicons - Icon font for developers",
  "type": "module",
  "keywords": ["icons", "font", "webfont", "devicons", "sprite"],
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./css": "./dist/devicons.css",
    "./woff2": "./dist/devicons.woff2",
    "./ttf": "./dist/devicons.ttf",
    "./sprite": "./dist/sprite-symbol.svg",
    "./codepoints": "./dist/codepoints.json"
  },
  "files": ["dist", "src", "codepoints.lock.json"],
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vorillaz/devicons.git",
    "directory": "packages/font"
  },
  "homepage": "https://github.com/vorillaz/devicons/tree/master/packages/font#readme",
  "bugs": { "url": "https://github.com/vorillaz/devicons/issues" },
  "license": "MIT",
  "author": "Theodore Vorillas",
  "scripts": {
    "build": "tsx scripts/build.ts",
    "test": "vitest run"
  },
  "devDependencies": {
    "@dev.icons/core": "workspace:*",
    "fast-glob": "3.3.3",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "3.1.3"
  }
}
```

Note: `main`/`types`/`exports[.]` continue to point at `src/index.ts` (the existing pattern — the font package ships `src` intentionally because `src/index.ts` is a thin re-export of `dist/*` asset paths and types).

- [ ] **Step 2: Verify pack output**

Run: `pnpm -F devicons build && pnpm -F devicons pack --pack-destination /tmp`
Expected: tarball at `/tmp/devicons-1.8.0.tgz`.

Run: `tar -tzf /tmp/devicons-1.8.0.tgz | sort | head -20`
Expected: entries include `package/dist/devicons.{css,ttf,woff2,...}`, `package/src/index.ts`, `package/codepoints.lock.json`, `package/package.json`, `package/README.md`. No `node_modules`, no `test/`.

- [ ] **Step 3: publint check**

Run: `pnpm dlx publint /tmp/devicons-1.8.0.tgz`
Expected: zero errors. (Pre-existing warnings about source-only `main` are acceptable for this package.)

- [ ] **Step 4: Cleanup + commit**

```bash
rm /tmp/devicons-1.8.0.tgz
git add packages/font/package.json
git commit -m "chore(font): publish hygiene — provenance, repo metadata, license"
```

---

## Phase 4 — `scripts/release-group1.mjs`

The driver script. Calls `semantic-release` programmatically against `@dev.icons/core`, then mirrors the version into `react`/`vue`/`svelte` and publishes them.

### Task 4.1 — Write the script

**Files:**
- Create: [scripts/release-group1.mjs](../../../scripts/release-group1.mjs)

- [ ] **Step 1: Confirm `scripts/` directory exists at repo root**

Run: `ls scripts`
Expected: existing files visible (e.g., `clean-generated.mjs`). If the directory does not exist, run `mkdir scripts`.

- [ ] **Step 2: Write `scripts/release-group1.mjs`**

```js
// scripts/release-group1.mjs
//
// Drives the lockstep release of @dev.icons/{core,react,vue,svelte}.
// - semantic-release runs against @dev.icons/core (the driver) and
//   computes the next version from conventional commits.
// - On a release-worthy bump, this script mirrors that version into
//   react/vue/svelte package.json and pnpm publishes each with the
//   same dist-tag (`latest` on master, `canary` on canary).
// - DRY_RUN=true makes everything no-op (semantic-release dryRun + pnpm publish --dry-run).
// - On canary the @semantic-release/changelog and @semantic-release/git plugins
//   are omitted so nothing is committed back to the canary branch.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import semanticRelease from 'semantic-release';

const DRY_RUN = process.env.DRY_RUN === 'true';

const detectBranch = () => {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return '';
  }
};

const branch = detectBranch();
const isCanary = branch === 'canary';

const plugins = [
  ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
  ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
  ...(isCanary
    ? []
    : [['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }]]),
  ['@semantic-release/npm', { pkgRoot: 'packages/core', npmPublish: true }],
  ...(isCanary
    ? []
    : [
        [
          '@semantic-release/git',
          {
            assets: ['CHANGELOG.md', 'packages/core/package.json'],
            message:
              'chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
          },
        ],
      ]),
  '@semantic-release/github',
];

console.log(
  `[release-group1] branch=${branch} isCanary=${isCanary} dryRun=${DRY_RUN}`,
);

const result = await semanticRelease({
  tagFormat: 'v${version}',
  branches: ['master', { name: 'canary', prerelease: 'canary' }],
  plugins,
  dryRun: DRY_RUN,
  ci: process.env.CI === 'true',
});

if (!result || !result.nextRelease) {
  console.log('[release-group1] No release.');
  process.exit(0);
}

const { version, channel } = result.nextRelease;
const tag = !channel || channel === 'default' ? 'latest' : channel;

console.log(
  `[release-group1] core@${version} published (tag: ${tag}). Mirroring to react/vue/svelte...`,
);

for (const pkg of ['react', 'vue', 'svelte']) {
  const pkgPath = `packages/${pkg}/package.json`;
  const json = JSON.parse(readFileSync(pkgPath, 'utf8'));
  json.version = version;
  writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n');

  const dryFlag = DRY_RUN ? '--dry-run' : '';
  const cmd =
    `pnpm publish --tag ${tag} ${dryFlag} --no-git-checks --provenance --access public`.trim();
  try {
    execSync(cmd, { cwd: `packages/${pkg}`, stdio: 'inherit' });
    console.log(`[release-group1] ${pkg}@${version} published.`);
  } catch (err) {
    console.error(
      `[release-group1] FAILED to publish ${pkg}@${version}. ` +
        `Check npm registry; the @dev.icons/core publish at ${version} already succeeded — ` +
        `manual recovery may be needed for the remaining mirror packages.`,
    );
    throw err;
  }
}

console.log(`[release-group1] All four packages at ${version} (tag: ${tag}).`);
```

- [ ] **Step 3: Verify the script parses cleanly**

Run: `node --check scripts/release-group1.mjs`
Expected: no output (success). Any syntax error is printed.

- [ ] **Step 4: Local dry-run smoke test**

This run won't actually call npm — it confirms the script wiring, semantic-release config, and conventional-commit parsing on the current branch.

Run:
```bash
GITHUB_TOKEN=$(gh auth token 2>/dev/null || echo dummy) pnpm release:dry
```

Expected one of two outcomes (both are OK at this point):
- `[release-group1] No release.` if no qualifying conventional commits exist since the last `v*` tag (or none exists yet — semantic-release will say so)
- A printed `nextRelease.version` from semantic-release's output, followed by mirror "publish" lines that include `--dry-run`. **Nothing is actually published.**

If you see a hard failure mentioning "ERELEASEBRANCHES" or "EINVALIDLOGGER", check that you're on `master` or `canary` — semantic-release rejects unknown branches.

- [ ] **Step 5: Commit**

```bash
git add scripts/release-group1.mjs
git commit -m "feat(release): add Group 1 driver script (semantic-release + mirror)"
```

---

## Phase 5 — `packages/font/release.config.cjs`

semantic-release for `devicons`, scoped to font paths.

### Task 5.1 — Write the config

**Files:**
- Create: [packages/font/release.config.cjs](../../../packages/font/release.config.cjs)

- [ ] **Step 1: Write `packages/font/release.config.cjs`**

```js
// packages/font/release.config.cjs
//
// Independent semantic-release run for `devicons` (the font package).
// Scoped via semantic-release-monorepo + extended commitPaths to include
// the upstream font asset source.
// On canary, omit @semantic-release/changelog and @semantic-release/git
// so nothing is committed back to the canary branch.

const monorepoConfig = require('semantic-release-monorepo');

const branch = process.env.GITHUB_REF_NAME || process.env.SR_BRANCH || '';
const isCanary = branch === 'canary';

module.exports = {
  ...monorepoConfig,
  tagFormat: 'devicons-v${version}',
  branches: ['master', { name: 'canary', prerelease: 'canary' }],
  // semantic-release-monorepo defaults commitPaths to the package directory.
  // Extend it to include the upstream font asset source.
  commitPaths: ['packages/font/**', 'packages/core/export-files/font/**'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ...(isCanary
      ? []
      : [
          [
            '@semantic-release/changelog',
            { changelogFile: 'packages/font/CHANGELOG.md' },
          ],
        ]),
    ['@semantic-release/npm', { pkgRoot: 'packages/font', npmPublish: true }],
    ...(isCanary
      ? []
      : [
          [
            '@semantic-release/git',
            {
              assets: [
                'packages/font/package.json',
                'packages/font/CHANGELOG.md',
              ],
              message:
                'chore(release): devicons ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
            },
          ],
        ]),
    '@semantic-release/github',
  ],
};
```

- [ ] **Step 2: Local dry-run smoke test**

Run:
```bash
GITHUB_TOKEN=$(gh auth token 2>/dev/null || echo dummy) pnpm release:font:dry
```

Expected: semantic-release-monorepo logs `[semantic-release] [@dev.icons/font] ...` (or similar package-scoped prefix), then either prints "No release." or a planned next version (e.g., `1.0.0` if no `devicons-v*` tag exists yet — that's expected pre-bootstrap).

- [ ] **Step 3: Commit**

```bash
git add packages/font/release.config.cjs
git commit -m "feat(release): add devicons (font) semantic-release config"
```

---

## Phase 6 — GitHub Actions workflow

### Task 6.1 — Write `.github/workflows/release.yml`

**Files:**
- Create: [.github/workflows/release.yml](../../../.github/workflows/release.yml)

- [ ] **Step 1: Confirm `.github/workflows/` exists**

Run: `ls .github/workflows`
Expected: existing `deploy-website.yml` listed.

- [ ] **Step 2: Write `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [master, canary]
    paths:
      - 'packages/core/export-files/**'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry-run mode (no publish, no tags)'
        type: boolean
        default: false

permissions:
  contents: write       # commit CHANGELOG, push tags, create releases
  issues: write         # semantic-release issue comments
  pull-requests: write  # semantic-release PR comments
  id-token: write       # npm provenance via OIDC

jobs:
  group1:
    name: Release Group 1 (core/react/vue/svelte)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: true
      - uses: pnpm/action-setup@v4
        with:
          version: 10.10.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - name: Build core (sprite + font assets + library)
        run: pnpm -F @dev.icons/core build
      - name: Build react/vue/svelte
        run: |
          pnpm -F @dev.icons/react build
          pnpm -F @dev.icons/vue build
          pnpm -F @dev.icons/svelte build
      - name: Release Group 1
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DRY_RUN: ${{ github.event.inputs.dry_run || 'false' }}
        run: node scripts/release-group1.mjs

  font:
    name: Release devicons (font)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: true
      - uses: pnpm/action-setup@v4
        with:
          version: 10.10.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - name: Build core (produces font assets in packages/core/dist/font)
        run: pnpm -F @dev.icons/core build
      - name: Build devicons font package
        run: pnpm -F devicons build
      - name: Release devicons
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DRY_RUN: ${{ github.event.inputs.dry_run || 'false' }}
        run: |
          ARGS=""
          if [ "$DRY_RUN" = "true" ]; then ARGS="--dry-run"; fi
          pnpm exec semantic-release -e ./packages/font/release.config.cjs $ARGS
```

- [ ] **Step 3: Validate YAML syntax locally**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))" && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Commit (do NOT push yet — push happens after secrets are set up in Phase 8)**

```bash
git add .github/workflows/release.yml
git commit -m "feat(release): add GitHub Actions workflow (group1 + font, parallel jobs)"
```

---

## Phase 7 — Contributor docs

### Task 7.1 — Add `CONTRIBUTING.md`

**Files:**
- Create: [CONTRIBUTING.md](../../../CONTRIBUTING.md)

- [ ] **Step 1: Write `CONTRIBUTING.md`**

```markdown
# Contributing

## Conventional commits (required for releases)

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org/).
Any commit that touches `packages/core/export-files/**` and lands on `master` or `canary`
will trigger a release if its message uses one of these prefixes:

| Prefix | Bump |
| --- | --- |
| `fix:` / `fix(scope):` | `patch` |
| `feat:` / `feat(scope):` | `minor` |
| `feat!:` / footer `BREAKING CHANGE:` | `major` |
| `chore:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, `style:`, `perf:` | none (no release) |

Scope (the optional `(...)` part) is informational. Routing to Group 1
(`@dev.icons/{core,react,vue,svelte}`) vs. `devicons` (the font) is decided
by **file paths** in the commit, not by commit-message scope:

- Touch `packages/core/export-files/icons/**` → triggers a Group 1 release
- Touch `packages/core/export-files/font/**` or `packages/font/**` → triggers a `devicons` release
- A commit that touches both will trigger both runs (parallel, independent)

## Branches

- `canary` — every release-worthy push publishes a prerelease (`0.2.0-canary.1`,
  `0.2.0-canary.2`, …). Install via `npm i @dev.icons/core@canary`.
- `master` — every release-worthy push publishes a stable version.
  Install via `npm i @dev.icons/core` (default `latest` dist-tag).

## Local dry-runs

Before relying on CI, you can preview what the next release would do:

```bash
# Group 1
pnpm release:dry

# Font
pnpm release:font:dry
```

Both commands compute the next version from conventional commits and show the
changelog body — without publishing, tagging, or committing anything.
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING with conventional-commits release guide"
```

---

## Phase 8 — Preflight audit (pre-bootstrap, all checks must be green)

This is the gate before the manual `0.1.0` bootstrap publish. **Do not proceed to Phase 9 unless every step here passes.**

### Task 8.1 — Build + tarball + tooling audit

**Files:** none modified.

- [ ] **Step 1: Clean build from scratch**

Run:
```bash
rm -rf packages/{core,font}/dist packages/core/src/icons-data.ts
pnpm install --frozen-lockfile
pnpm -F @dev.icons/core build
pnpm -F @dev.icons/react build
pnpm -F @dev.icons/vue build
pnpm -F @dev.icons/svelte build
```

Expected: every build succeeds. `packages/core/dist/` contains `index.{mjs,cjs,d.ts}`, `icons.json`, `sprite/`, `font/`. `packages/{react,vue,svelte}/dist/` each contains `index.{mjs,cjs,d.ts}`. `packages/font/dist/` contains `devicons.{css,ttf,woff,woff2,eot,...}`, `sprite-symbol.svg`, `codepoints.json`.

- [ ] **Step 2: Pack every publishable package**

Run:
```bash
mkdir -p /tmp/devicons-preflight
for p in core react vue svelte; do
  pnpm -F @dev.icons/$p pack --pack-destination /tmp/devicons-preflight
done
pnpm -F devicons pack --pack-destination /tmp/devicons-preflight
ls /tmp/devicons-preflight
```

Expected: 5 `.tgz` files listed (4 for `dev.icons-*` + 1 for `devicons-1.8.0.tgz`).

- [ ] **Step 3: publint against every tarball**

Run:
```bash
for f in /tmp/devicons-preflight/*.tgz; do
  echo "=== $f ===" && pnpm dlx publint "$f"
done
```

Expected: zero errors per tarball. Warnings about missing LICENSE/README files in framework packages are acceptable for v1 (separate cleanup) but should be noted.

- [ ] **Step 4: Are The Types Wrong (attw)**

Run:
```bash
for f in /tmp/devicons-preflight/dev.icons-*.tgz; do
  echo "=== $f ===" && pnpm dlx @arethetypeswrong/cli "$f"
done
```

Expected: the **library entry** (`"@dev.icons/core"`, `"@dev.icons/{react,vue,svelte}"`) row should be 🟢 across `node10` / `node16 from CJS` / `node16 from ESM` / `bundler`. Asset-path subpaths (`"@dev.icons/core/sprite"`, `"@dev.icons/core/font/css"`, etc.) will show 💀 "Resolution failed" — **this is expected and accepted**: those exports point to SVG/CSS/binary files, not JS modules, and attw can only model JS resolution. The `"@dev.icons/core/icons.json"` row should be 🟢 except for `node10` (which doesn't support `exports`-map fallback).

`devicons` (font) is excluded from the attw loop above — its `main`/`types` deliberately point at `src/index.ts`, which `attw` will (correctly) flag and we accept.

- [ ] **Step 5: Workspace-leak check across all framework tarballs**

Run:
```bash
for f in /tmp/devicons-preflight/dev.icons-{react,vue,svelte}-*.tgz; do
  echo "=== $f ===" && tar -xzOf "$f" package/package.json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); const all=Object.entries({...j.dependencies||{},...j.peerDependencies||{}}); for (const [k,v] of all) if (v.startsWith('workspace:')) { console.error('LEAK:', k, v); process.exit(1); } console.log('OK');"
done
```

Expected: every tarball prints `OK`.

- [ ] **Step 6: Install-the-tarball smoke for `@dev.icons/core`**

Run:
```bash
mkdir -p /tmp/devicons-smoke && cd /tmp/devicons-smoke
npm init -y > /dev/null
npm install /tmp/devicons-preflight/dev.icons-core-0.0.0.tgz
node -e "const x=require('@dev.icons/core'); console.log('icons:', x.ICONS.length, 'first:', x.ICONS[0]);"
cd - > /dev/null
```

Expected: prints icon count and first record. No "Cannot find module" errors.

- [ ] **Step 7: Pre-bootstrap dry-run for Group 1**

Run: `GITHUB_TOKEN=$(gh auth token) pnpm release:dry`
Expected: either `No release.` (because no `feat:`/`fix:` commits exist that touch icons since the bootstrap PR's commits) or `nextRelease.version === '1.0.0'` (semantic-release's default first release when no `v*` tag exists). **The `1.0.0` here is informational only** — the bootstrap manually publishes `0.1.0` and tags it. Either outcome is acceptable for this step; what matters is **the script ran without throwing**.

- [ ] **Step 8: Pre-bootstrap dry-run for font**

Run: `GITHUB_TOKEN=$(gh auth token) pnpm release:font:dry`
Expected: either `No release.` or a planned next version. Again, ran-without-throwing is the gate.

- [ ] **Step 9: Cleanup preflight artifacts**

Run: `rm -rf /tmp/devicons-preflight /tmp/devicons-smoke`

- [ ] **Step 10: Set up the `NPM_TOKEN` repo secret (manual, GitHub UI)**

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
- Name: `NPM_TOKEN`
- Value: a granular npm Automation token with publish permission for the `@dev.icons` org and the `devicons` package. **Provenance enabled.**

(Verify by visiting `https://www.npmjs.com/settings/<your-username>/tokens` and selecting "Granular Access Token".)

- [ ] **Step 11: Push all Phase 0–7 commits to remote**

Run:
```bash
git push origin canary
```

Expected: GitHub Actions does **not** run `release.yml` (the workflow file's `paths:` filter only matches `packages/core/export-files/**`, and no commit in this push touches that). The deploy-website workflow may run independently — that's unrelated.

- [ ] **Step 12: Final preflight — `workflow_dispatch` end-to-end dry run on canary**

In GitHub UI: **Actions → Release → Run workflow → Branch: canary → Dry-run mode: ✅ true → Run workflow**.

Expected:
- Both jobs (`group1`, `font`) start in parallel.
- Both succeed.
- `group1` job log shows `[release-group1] No release.` (or a planned version with mirror "publish" lines marked `--dry-run`). **No npm publishes occur.**
- `font` job log shows semantic-release's `--dry-run` output. **No npm publishes occur.**
- No tags appear on the repo. No GitHub Releases are created.

If either job fails, fix and re-run before proceeding to Phase 9.

---

## Phase 9 — Bootstrap (one-time manual publish)

semantic-release defaults the first release to `1.0.0` and there's no clean way to override that to `0.1.0`. So Group 1's first publish is manual; automation owns everything from `v0.2.0` onward.

### Task 9.1 — Manually publish Group 1 at `0.1.0` from `master`

**Files:** transient `package.json` edits (committed at the end).

**Pre-flight:** confirm you have `master` checked out, you have npm publish permission on `@dev.icons`, and the bootstrap PR (Phase 0–8 commits) is **already merged** to master.

- [ ] **Step 1: Get on a clean master**

Run:
```bash
git checkout master
git pull origin master
git status
```

Expected: clean working tree, on master, up to date with origin.

- [ ] **Step 2: Clean build all four packages**

Run:
```bash
rm -rf packages/{core,react,vue,svelte}/dist packages/core/src/icons-data.ts
pnpm install --frozen-lockfile
pnpm -F @dev.icons/core build
pnpm -F @dev.icons/react build
pnpm -F @dev.icons/vue build
pnpm -F @dev.icons/svelte build
```

Expected: all builds succeed.

- [ ] **Step 3: Set version to `0.1.0` in all four package.json files**

Run:
```bash
node -e "for (const p of ['core','react','vue','svelte']) { const f = 'packages/' + p + '/package.json'; const j = JSON.parse(require('fs').readFileSync(f, 'utf8')); j.version = '0.1.0'; require('fs').writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); console.log('set', p, '0.1.0'); }"
```

Expected: prints four `set <pkg> 0.1.0` lines.

- [ ] **Step 4: Dry-run publish each (verify shape one more time before going live)**

Run:
```bash
for p in core react vue svelte; do
  ( cd packages/$p && pnpm publish --dry-run --access public --no-git-checks --provenance )
done
```

Expected: each prints "Would publish: @dev.icons/<pkg>@0.1.0" (or pnpm equivalent). No errors. Verify each tarball list contains only `dist/` files.

- [ ] **Step 5: Authenticate npm (if not already)**

Run: `npm whoami`
Expected: prints your npm username. If "ENEEDAUTH", run `npm login` and re-check.

- [ ] **Step 6: Publish all four packages for real**

```bash
for p in core react vue svelte; do
  ( cd packages/$p && pnpm publish --access public --no-git-checks --provenance )
done
```

Expected: each prints a successful `+ @dev.icons/<pkg>@0.1.0` line. **If any one fails partway through, do NOT retry blindly — figure out which packages made it to npm (check `npm view @dev.icons/<pkg> versions`) and only publish the missing ones.**

- [ ] **Step 7: Commit the `0.1.0` version bumps + create the seed tag**

```bash
git add packages/{core,react,vue,svelte}/package.json
git commit -m "chore(release): v0.1.0 [skip ci]"
git tag v0.1.0
git push origin master
git push origin v0.1.0
```

Expected: commit pushed, tag pushed. The `[skip ci]` keeps the release workflow from triggering on this commit (which would attempt to publish 1.0.0 since the tag wasn't visible yet at workflow trigger time — though paths filter also blocks it).

- [ ] **Step 8: Verify on npm**

Run:
```bash
npm view @dev.icons/core version
npm view @dev.icons/react version
npm view @dev.icons/vue version
npm view @dev.icons/svelte version
```

Expected: each prints `0.1.0`.

---

### Task 9.2 — Seed `devicons-v1.8.0` tag

**Files:** none modified — only a git tag.

- [ ] **Step 1: Identify the commit that corresponds to the published `1.8.0`**

Run:
```bash
npm view devicons time --json | grep '"1.8.0"'
```

Note the timestamp. Then:

```bash
git log --oneline --before="<timestamp>" -- packages/font/package.json | head -3
```

Pick the most recent commit on `master` that introduced `version: "1.8.0"` to `packages/font/package.json`. If that history is unclear (e.g., the version bump never landed in this monorepo), use **the current HEAD on master** as the seed — the tag's only job is to be the starting point for `semantic-release-monorepo`'s next-version computation.

- [ ] **Step 2: Tag it**

```bash
git tag devicons-v1.8.0 <sha>      # use the sha from Step 1, or omit for HEAD
git push origin devicons-v1.8.0
```

- [ ] **Step 3: Verify**

Run: `git tag --list 'devicons-v*'`
Expected: `devicons-v1.8.0` listed.

---

## Phase 10 — Validate first auto-release

### Task 10.1 — Trigger first canary publish

**Files:** any small commit touching `packages/core/export-files/icons/**`.

- [ ] **Step 1: Create a test commit on `canary`**

Run:
```bash
git checkout canary
git pull origin canary
# Pick any existing icon and add a trivial trailing newline, OR add a tiny test icon
echo "" >> packages/core/export-files/icons/$(ls packages/core/export-files/icons/ | head -1)
git add packages/core/export-files/icons/
git commit -m "feat(icons): test canary release pipeline"
git push origin canary
```

- [ ] **Step 2: Watch the workflow**

In GitHub UI: **Actions → Release** — both jobs should start. The `group1` job should:
1. Build everything
2. Run `release-group1.mjs`
3. Print `nextRelease.version === '0.2.0-canary.1'` (or similar)
4. Publish `@dev.icons/core` via semantic-release
5. Mirror-publish `@dev.icons/react`, `@dev.icons/vue`, `@dev.icons/svelte` at the same version
6. Push tag `v0.2.0-canary.1`
7. Create GitHub Release marked prerelease

- [ ] **Step 3: Verify on npm**

Run:
```bash
npm view @dev.icons/core dist-tags
```

Expected: shows `latest: 0.1.0` (from bootstrap) and `canary: 0.2.0-canary.1`.

Run: `npm i --no-save @dev.icons/core@canary`
Expected: installs `0.2.0-canary.1`.

- [ ] **Step 4: Revert the test commit (cleanup)**

```bash
git revert HEAD --no-edit
git push origin canary
```

This will trigger another canary release at `0.2.0-canary.2` (the `revert(scope):` commit type produces no bump by default — but we used `feat(icons):` in the original commit, so the revert preserves that semantic). Acceptable; an extra canary is fine.

---

### Task 10.2 — Trigger first stable publish from `master`

- [ ] **Step 1: Open a PR from `canary` → `master`**

Run:
```bash
gh pr create --base master --head canary --title "Promote canary → master" --body "Initial release validation."
```

- [ ] **Step 2: Merge the PR**

Use squash-merge so the resulting commit has a single conventional-commit message. Title the merge commit `feat(icons): initial automated release`.

- [ ] **Step 3: Watch the workflow on master**

Expected:
- `group1` publishes `@dev.icons/core@0.2.0` and mirrors react/vue/svelte
- Tag `v0.2.0` pushed
- `CHANGELOG.md` committed back to master with `[skip ci]`
- GitHub Release created (not prerelease)

- [ ] **Step 4: Verify on npm**

```bash
npm view @dev.icons/core version       # 0.2.0
npm view @dev.icons/react version      # 0.2.0
npm view @dev.icons/vue version        # 0.2.0
npm view @dev.icons/svelte version     # 0.2.0
```

Expected: all four at `0.2.0`. The `latest` dist-tag now resolves to `0.2.0`.

- [ ] **Step 5: Update local working copies**

```bash
git checkout master && git pull
git checkout canary && git pull && git merge master
git push origin canary
```

The new `CHANGELOG.md` and version bumps are now on both branches. Future canary releases will compute `0.3.0-canary.1`, `0.3.0-canary.2`, etc.

---

## Done.

The pipeline is live. From this point forward:

- A `feat(...)` commit on `canary` touching `packages/core/export-files/**` → next prerelease (`0.3.0-canary.1`, …)
- A `fix(...)` commit on `canary` touching the same → patch prerelease in the same window
- Merging canary into master → a single stable release computed from the accumulated commits
- A `BREAKING CHANGE:` footer or `feat!:` → major bump
- Commits without a conventional prefix → no release (the workflow runs but exits with `No release.`)

Operators can always trigger a no-op dry run via **Actions → Release → Run workflow → Dry-run mode: true** to preview the next version before it ships.

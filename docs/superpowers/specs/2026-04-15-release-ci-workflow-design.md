# Release CI Workflow — Design

**Date:** 2026-04-15 (rewritten 2026-04-16: Changesets → semantic-release)
**Status:** Approved (brainstorming)
**Scope:** Automated npm publishing for the devicons monorepo, driven by conventional commits whose touched paths fall under `packages/core/export-files/`.

## Goals

1. Publish the public packages to npm automatically when conventional commits land on `main` or `canary` and touch the asset source (`packages/core/export-files/`).
2. Keep `devicons` (the icon font) on its own independent version track; keep the four framework packages (`core`, `react`, `vue`, `svelte`) in lockstep on a single shared version.
3. Provide a `canary` channel on the `canary` branch with monotonic-within-window prerelease versions (`0.2.0-canary.1`, `0.2.0-canary.2`, …) on every qualifying push. The counter resets when a new stable ships on `main` and the next-stable window advances (e.g., after `v0.2.0` lands, the next canary becomes `0.3.0-canary.1`).
4. Provide a stable `latest` channel on `main` with one commit-driven release per qualifying push.
5. Require zero per-PR changeset authoring from contributors. Bump type comes entirely from conventional-commit messages.
6. Provide a first-class dry-run path that proves the next version, the changelog, and the npm tarball shape — locally and in CI — before anything publishes.

## Non-goals

- Publishing private/internal packages (`@dev.icons/utils`, `@dev.icons/codegen`, `@dev.icons/figma`).
- Releasing on commits that don't touch `packages/core/export-files/`. This explicitly includes changes scoped **only** to `packages/font/**` (e.g., a bundler tweak inside the font package) or **only** to `packages/react|vue|svelte/**` (e.g., a test refactor). The workflow `paths` filter intentionally covers just `packages/core/export-files/**` — `core` is the asset source of truth, and framework/font packages regenerate from it. Code-only changes ship opportunistically the next time an asset change lands. Operators who need to ship a code-only change can invoke `workflow_dispatch` manually.
- Cross-package coordination beyond the lockstep `fixed` group (no peer-version pinning, no compat matrix).

## Packages

| Package | npm name | Current | Track | Published? |
| --- | --- | --- | --- | --- |
| `packages/core` | `@dev.icons/core` | `0.0.0` | Group 1 (lockstep, **driver**) | No |
| `packages/react` | `@dev.icons/react` | `0.0.0` | Group 1 (lockstep, mirror) | No |
| `packages/vue` | `@dev.icons/vue` | `0.0.0` | Group 1 (lockstep, mirror) | No |
| `packages/svelte` | `@dev.icons/svelte` | `0.0.0` | Group 1 (lockstep, mirror) | No |
| `packages/font` | `devicons` | `1.8.0` | Independent | Yes |
| `packages/utils` | `@dev.icons/utils` | — | private | No (never) |
| `packages/codegen` | `@dev.icons/codegen` | — | private | No (never) |
| `packages/figma` | `@dev.icons/figma` | — | private | No (never) |

Group 1 bootstraps at `0.1.0` on first publish (manual, one-time). `devicons` continues from its existing `1.8.0`.

## Stack

- [`semantic-release`](https://github.com/semantic-release/semantic-release) — drives version, changelog, npm publish, GitHub Release, git tag.
- [`semantic-release-monorepo`](https://github.com/pmowrer/semantic-release-monorepo) — scopes commit analysis to a package's directory tree (used for the font release run).
- pnpm (already the package manager — `pnpm@10.10.0`) — workspace + publish.
- GitHub Actions — orchestrator.

Plugin set (per release run):

| Plugin | Purpose |
| --- | --- |
| `@semantic-release/commit-analyzer` | Conventional-commits → bump type |
| `@semantic-release/release-notes-generator` | Build release notes from commits |
| `@semantic-release/changelog` | Write `CHANGELOG.md` (main only) |
| `@semantic-release/npm` | Bump `package.json`, publish to npm with `--provenance` |
| `@semantic-release/git` | Commit `CHANGELOG.md` back to `main` (main only) |
| `@semantic-release/github` | Create GitHub Release |

## Conventional commits convention

Bump type is derived purely from commit message via [Conventional Commits](https://www.conventionalcommits.org/) defaults:

| Commit prefix | Bump |
| --- | --- |
| `fix:` / `fix(scope):` | `patch` |
| `feat:` / `feat(scope):` | `minor` |
| `feat!:` / `fix!:` / footer `BREAKING CHANGE:` | `major` |
| `chore:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, `style:`, `perf:` | none (no release) |

**Scope is informational only.** Routing to Group 1 vs `devicons` is decided by **file paths in the commit**, not by the `(scope)` text — see *Trigger* and *Branch flows* below. This means a single commit `feat: add cursor icon and rebuild font` that touches both icons and font assets will trigger **both** release runs.

A commit lint hook is **not** in scope for v1 — we trust authors and rely on no-release fallback for non-conventional messages.

## Trigger

Both release workflows use:

```yaml
on:
  push:
    branches: [main, canary]
    paths:
      - 'packages/core/export-files/**'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Run semantic-release in dry-run mode (no publish, no tags)'
        type: boolean
        default: false
```

Nothing publishes unless the push diff touches `packages/core/export-files/**`. `workflow_dispatch` is the dry-run handle for operators.

## Branch flows

There are two release jobs — **Group 1** and **font** — and they run in parallel inside the same workflow file. Either, neither, or both may publish on a given push.

### Group 1 release (driver: `@dev.icons/core`)

1. Checkout with full history (`fetch-depth: 0` — required so semantic-release can read tags).
2. Setup Node + pnpm; configure npm auth via `setup-node`'s `registry-url`.
3. `pnpm install --frozen-lockfile`.
4. `pnpm -F @dev.icons/core build` → produces `dist/index.{mjs,cjs,d.ts}`, `dist/icons.json`, `dist/sprite/*`, `dist/font/*` AND regenerates `react`/`vue`/`svelte` `src/`.
5. `pnpm -F @dev.icons/react build && pnpm -F @dev.icons/vue build && pnpm -F @dev.icons/svelte build`.
6. `node scripts/release-group1.mjs` — programmatically invokes `semantic-release` from `packages/core` (the **driver**). Behavior:
   - On `main`: bump computed from conventional commits since last `v*` tag (excluding canary tags). On release-worthy bump, writes new version into `packages/core/package.json`, publishes `@dev.icons/core` to npm with `--tag latest --provenance`, mirrors that version into `react/vue/svelte` `package.json` and publishes each with the same flags. Pushes one git tag `v<version>`. Creates one GitHub Release. Commits root `CHANGELOG.md` back to `main` with `[skip ci]`.
   - On `canary`: bump computed from commits since last `v*-canary.*` tag. On release-worthy bump, same flow but `--tag canary`, version is `<next-stable>-canary.<n>` (monotonic). Tag `v<version>` pushed. GitHub prerelease created. **No CHANGELOG commit, no commit-back to `canary` branch.**
   - On no release-worthy commits: script exits 0 cleanly. Mirror step is skipped.

### Font release (`devicons`)

1. Same checkout/install/auth as above.
2. `pnpm -F @dev.icons/core build:font` (or whatever script regenerates font assets in `packages/font/dist/`). Need to confirm the exact existing script (current `package.json` says `pnpm -F devicons build`).
3. `pnpm exec semantic-release -e ./packages/font/release.config.cjs` — uses `semantic-release-monorepo` to scope commit analysis to `packages/font/**` and `packages/core/export-files/font/**`. Behavior mirrors Group 1's branch logic but for the single `devicons` package, with `tagFormat: 'devicons-v${version}'` and a separate per-package `CHANGELOG.md` at `packages/font/CHANGELOG.md`.
4. On no release-worthy commits scoped to those paths: exits 0 cleanly.

The two jobs are independent — Group 1 may release without `devicons`, or vice versa, or both.

## Configuration

### Group 1 config — built at runtime inside `scripts/release-group1.mjs`

Group 1 does **not** have a static `release.config.cjs` at the repo root. The plugin array is built at runtime inside `scripts/release-group1.mjs` so the main-only plugins (`@semantic-release/changelog`, `@semantic-release/git`) can be conditionally included. `@semantic-release/git` is **not** a no-op on prerelease branches by default — it runs unless we exclude it. Keeping the plugin list in one place (the script) avoids a config-drift bug where canary accidentally commits CHANGELOG back to `canary`.

The logical config is:

```js
// Assembled inline in scripts/release-group1.mjs — not a standalone file.
const isCanary = branch === 'canary';
const config = {
  tagFormat: 'v${version}',
  branches: [
    'main',
    { name: 'canary', prerelease: 'canary' }
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    // Master only — canary has no CHANGELOG file and no commit-back.
    ...(isCanary ? [] : [
      ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ]),
    ['@semantic-release/npm', {
      pkgRoot: 'packages/core',
      npmPublish: true
    }],
    // Mirror + publish for react/vue/svelte runs *after* semanticRelease() returns
    // (see the script below) — not a plugin.
    ...(isCanary ? [] : [
      ['@semantic-release/git', {
        assets: ['CHANGELOG.md', 'packages/core/package.json'],
        message: 'chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }],
    ]),
    '@semantic-release/github'
  ]
};
```

### `packages/font/release.config.cjs`

Same main-vs-canary conditional pattern: on `canary`, drop `@semantic-release/changelog` and `@semantic-release/git` so no commits go back to the `canary` branch.

```js
// packages/font/release.config.cjs
const monorepoConfig = require('semantic-release-monorepo');

const branch = process.env.GITHUB_REF_NAME || process.env.SR_BRANCH || '';
const isCanary = branch === 'canary';

module.exports = {
  ...monorepoConfig,
  tagFormat: 'devicons-v${version}',
  branches: [
    'main',
    { name: 'canary', prerelease: 'canary' }
  ],
  // semantic-release-monorepo defaults commitPaths to the package directory.
  // Extend it to include the upstream font asset source.
  commitPaths: [
    'packages/font/**',
    'packages/core/export-files/font/**'
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ...(isCanary ? [] : [
      ['@semantic-release/changelog', { changelogFile: 'packages/font/CHANGELOG.md' }],
    ]),
    ['@semantic-release/npm', { pkgRoot: 'packages/font', npmPublish: true }],
    ...(isCanary ? [] : [
      ['@semantic-release/git', {
        assets: ['packages/font/package.json', 'packages/font/CHANGELOG.md'],
        message: 'chore(release): devicons ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }],
    ]),
    '@semantic-release/github'
  ]
};
```

### `scripts/release-group1.mjs`

Programmatic semantic-release invocation. Builds the plugin array based on the current branch (so canary skips CHANGELOG + git commit), honors `DRY_RUN=true` for end-to-end dry runs, and handles the mirror publish for react/vue/svelte after `nextRelease` is known.

```js
// scripts/release-group1.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import semanticRelease from 'semantic-release';

const DRY_RUN = process.env.DRY_RUN === 'true';
const branch = process.env.GITHUB_REF_NAME || execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const isCanary = branch === 'canary';

const plugins = [
  ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
  ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
  ...(isCanary ? [] : [
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
  ]),
  ['@semantic-release/npm', { pkgRoot: 'packages/core', npmPublish: true }],
  ...(isCanary ? [] : [
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'packages/core/package.json'],
      message: 'chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
  ]),
  '@semantic-release/github'
];

const result = await semanticRelease({
  tagFormat: 'v${version}',
  branches: ['main', { name: 'canary', prerelease: 'canary' }],
  plugins,
  dryRun: DRY_RUN,
  ci: process.env.CI === 'true', // true in GitHub Actions, false locally — lets `pnpm release:dry` work on dev machines
});

if (!result || !result.nextRelease) {
  console.log('No release.');
  process.exit(0);
}

const { version, channel } = result.nextRelease;
const tag = !channel || channel === 'default' ? 'latest' : channel; // 'canary' on canary branch

for (const pkg of ['react', 'vue', 'svelte']) {
  const path = `packages/${pkg}/package.json`;
  const json = JSON.parse(readFileSync(path, 'utf8'));
  json.version = version;
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');

  const dryFlag = DRY_RUN ? '--dry-run' : '';
  try {
    execSync(
      `pnpm publish --tag ${tag} ${dryFlag} --no-git-checks --provenance --access public`.trim(),
      { cwd: `packages/${pkg}`, stdio: 'inherit' }
    );
    console.log(`[mirror] ${pkg}@${version} published (tag: ${tag}, dryRun: ${DRY_RUN}).`);
  } catch (err) {
    console.error(`[mirror] FAILED to publish ${pkg}@${version}.`);
    throw err;
  }
}
```

Notes:
- **Single env var for dry-run: `DRY_RUN`.** Workflow sets it from `inputs.dry_run`. Script reads it, passes it to `semanticRelease({ dryRun })`, and appends `--dry-run` to each `pnpm publish`.
- **npm auth handoff for the mirror loop:** `setup-node@v4` with `registry-url: 'https://registry.npmjs.org'` writes a repository `.npmrc` containing `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`. `pnpm publish` inherits that `.npmrc` automatically — no additional auth setup needed. `@semantic-release/npm` uses the same mechanism for `@dev.icons/core`'s own publish.
- `pnpm publish --no-git-checks` is required because semantic-release leaves the working tree dirty (modified `package.json`, `CHANGELOG.md` on main).
- `--provenance` requires `id-token: write` permission (granted at workflow level).
- **Partial-publish observability:** the `try/catch` logs which mirror package failed, so an operator can manually finish any publishes that didn't reach npm. Full atomicity (all-or-none) is out of scope for v1.

## Bootstrap (one-time, before automation takes over)

semantic-release defaults the first release to `1.0.0`. We want Group 1 to start at `0.1.0`, so the first publish is **manual** — automation takes over from `0.2.0` onward. `devicons` is already at `1.8.0` on npm; it just needs an initialization tag so semantic-release can find a starting point.

### Group 1 — manual `0.1.0` publish

1. Land all spec deliverables (workflows, configs, `release-group1.mjs`, `core` build fix, `package.json` hygiene) in a single PR. Do **not** add the workflow trigger paths yet (or land with `branches: []` placeholder).
2. After merge, on a clean `main` checkout:
   ```bash
   pnpm install --frozen-lockfile
   pnpm -F @dev.icons/core build
   pnpm -F @dev.icons/react build
   pnpm -F @dev.icons/vue build
   pnpm -F @dev.icons/svelte build

   # Set version manually
   node -e "for (const p of ['core','react','vue','svelte']) { const f=\`packages/\${p}/package.json\`; const j=JSON.parse(require('fs').readFileSync(f,'utf8')); j.version='0.1.0'; require('fs').writeFileSync(f, JSON.stringify(j,null,2)+'\n'); }"

   # Publish each
   for p in core react vue svelte; do
     ( cd packages/$p && pnpm publish --access public --provenance --no-git-checks )
   done

   # Create the seed tag
   git tag v0.1.0
   git push origin v0.1.0

   # Commit the version bumps back
   git add packages/{core,react,vue,svelte}/package.json
   git commit -m "chore(release): v0.1.0 [skip ci]"
   git push
   ```
3. Activate the workflow: PR that adds the real `paths:` trigger (or unblocks `branches: []`).
4. From this point on, any `feat:` commit touching `packages/core/export-files/icons/**` triggers `v0.2.0` automatically.

### `devicons` — seed tag for existing `1.8.0`

1. Find the commit on `main` that corresponds to the published `1.8.0` (most recent commit if 1.8.0 was just published, otherwise `git log packages/font/package.json`).
2. `git tag devicons-v1.8.0 <sha> && git push origin devicons-v1.8.0`.
3. From this point on, semantic-release-monorepo finds the seed tag and computes `1.9.0` for the next `feat(font):`-equivalent commit (where the path scope determines applicability, not the message scope).

## Preconditions (publish hygiene)

Each of the five publishable `package.json` files must have:

- `"publishConfig": { "access": "public", "provenance": true }`
- `"repository"`, `"license"`, `"homepage"`, `"author"`, `"bugs"` populated.
- `"files"` listing exactly what ships (`["dist"]` for the framework packages; `["dist", "src", "codepoints.lock.json"]` for the font; `"dist"` for `@dev.icons/core` after build fix).
- `"main"`/`"module"`/`"types"`/`"exports"` pointing to built artifacts, not `src` (font is the documented exception — it ships `src/index.ts` as a thin re-export of `./dist/*` assets).
- No `workspace:*` ranges in anything that ships at runtime. The framework packages depend on `@dev.icons/codegen` and `@dev.icons/utils` only as `devDependencies` (codegen-time only) — verify these never leak into `dependencies`.

For `@dev.icons/core` specifically: requires the build fix below before bootstrap can succeed.

## `@dev.icons/core` build fix

Current state: `packages/core/scripts/build-all.ts` produces `dist/sprite/*` and `dist/font/*` (binary assets), generates framework packages' `src/`, and builds the `devicons` font package. It does **not** emit any library entry (no `dist/index.*`), so `@dev.icons/core` has nothing to import and isn't publishable as-is.

Target shape for `@dev.icons/core` after fix:

**Library entry.** Add `packages/core/src/index.ts` exposing the icon manifest as a pure data module — name, codepoint, and category per icon, plus TypeScript types. This module must not import from `@dev.icons/codegen` or `@dev.icons/utils` at runtime (both are private workspace packages and cannot be resolved by npm consumers). If any helper from those is needed at runtime, inline it.

**Build tooling.** Add [`tsup`](https://tsup.egoist.dev/) as a devDependency of `@dev.icons/core`. New build step compiles `src/index.ts` → `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts`. Run with `noExternal: ['@dev.icons/utils', '@dev.icons/codegen']` as a defensive net so any accidental workspace import is inlined rather than leaked into published `package.json` runtime deps.

**Manifest file.** Emit `dist/icons.json` during the build — canonical list of `{ name, codepoint, unicode, categories }` for every icon. Downstream tools consume this instead of scraping `export-files/`.

**Assets.** Keep the existing `dist/sprite/sprite-symbol.svg` and `dist/font/devicons.{css,ttf,woff,woff2,eot}` outputs untouched.

**`build-all.ts` update.** Add one more step (`core-lib`) that invokes `tsup` for the library entry and writes `dist/icons.json`.

**Updated `packages/core/package.json`:**

```jsonc
{
  "name": "@dev.icons/core",
  "version": "0.0.0",
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
  "publishConfig": { "access": "public", "provenance": true },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vorillaz/devicons.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/vorillaz/devicons#readme",
  "bugs": { "url": "https://github.com/vorillaz/devicons/issues" },
  "license": "MIT",
  "keywords": ["icons", "devicons", "sprite", "font", "svg"]
}
```

The existing `scripts` block is preserved; `build` continues to delegate to `build-all.ts`.

**Framework packages (`@dev.icons/react`, `vue`, `svelte`).** Each currently has `@dev.icons/codegen` and `@dev.icons/utils` as devDependencies (used only at codegen time), which is fine — those don't end up in the published `package.json`'s runtime `dependencies`. The published artifact (`dist/`) is self-contained via vite bundling. Verify `files: ["dist"]` is set (already is for react/vue/svelte) and add the same `publishConfig`, `repository`, `homepage`, `bugs`, `license`, `keywords` block.

**`devicons` (font package).** Already published at `1.8.0`; needs `publishConfig.provenance: true` added, plus `repository`/`homepage`/`bugs` verified. No build change.

## Workflow files

### `.github/workflows/release.yml`

Single workflow, two parallel jobs. Triggered on `push` to `main` or `canary` with the `paths` filter, plus `workflow_dispatch` for manual dry runs.

```yaml
name: Release

on:
  push:
    branches: [main, canary]
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
  issues: write         # semantic-release comments on issues
  pull-requests: write  # semantic-release comments on PRs
  id-token: write       # npm provenance

jobs:
  group1:
    name: Release Group 1 (core/react/vue/svelte)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0, persist-credentials: true }
      - uses: pnpm/action-setup@v4
        with: { version: 10.10.0 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -F @dev.icons/core build
      - run: pnpm -F @dev.icons/react build && pnpm -F @dev.icons/vue build && pnpm -F @dev.icons/svelte build
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
        with: { fetch-depth: 0, persist-credentials: true }
      - uses: pnpm/action-setup@v4
        with: { version: 10.10.0 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -F @dev.icons/core build  # produces font assets
      - run: pnpm -F devicons build         # bundles devicons package
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

(Final YAML formatting and per-step `if:` guards refined during implementation; structure above is canonical.)

## Dry-run strategy

Dry-run is a first-class supported path with three coverage layers:

### 1. Local — package shape (no commit/branch needed)

Run any time, by any contributor:

```bash
# A. Tarball contents — shows what npm would publish without publishing
pnpm -F @dev.icons/core pack --pack-destination /tmp
pnpm -F @dev.icons/react pack --pack-destination /tmp
pnpm -F @dev.icons/vue pack --pack-destination /tmp
pnpm -F @dev.icons/svelte pack --pack-destination /tmp
pnpm -F devicons pack --pack-destination /tmp

# B. Package.json correctness (exports, types, files, conditional exports)
pnpm dlx publint packages/core
pnpm dlx publint packages/react
pnpm dlx publint packages/vue
pnpm dlx publint packages/svelte
pnpm dlx publint packages/font

# C. Are The Types Wrong (resolves dual-format types correctly?)
pnpm dlx @arethetypeswrong/cli --pack packages/core
pnpm dlx @arethetypeswrong/cli --pack packages/react
pnpm dlx @arethetypeswrong/cli --pack packages/vue
pnpm dlx @arethetypeswrong/cli --pack packages/svelte
pnpm dlx @arethetypeswrong/cli --pack packages/font

# D. Install-the-tarball smoke test
mkdir -p /tmp/smoke && cd /tmp/smoke && npm init -y
npm i /tmp/dev.icons-core-*.tgz
node -e "const x = require('@dev.icons/core'); console.log(Object.keys(x));"
```

### 2. Local — version computation (proves the next release without publishing)

```bash
# Group 1 — runs through the same script CI uses, with DRY_RUN=true
GITHUB_TOKEN=$(gh auth token) pnpm release:dry

# devicons — semantic-release CLI direct (single package, no mirror needed)
GITHUB_TOKEN=$(gh auth token) pnpm release:font:dry
```

semantic-release prints the next version, the changelog body, and the dist-tag — without writing tags, without committing, without publishing. The Group 1 dry-run additionally prints the mirror-publish plan (`pnpm publish --dry-run`) for react/vue/svelte. `--no-ci` (inside the font command) overrides CI-only guards so it works on a developer machine; the Group 1 script passes `{ dryRun: true }` directly and uses semantic-release's built-in non-CI handling.

### 3. CI — full pipeline dry run

Operator invokes `workflow_dispatch` with `dry_run: true`. The workflow:
- Runs install + build for real (ensures the build path works).
- Calls `semantic-release` with `--dry-run` (no tags, no GitHub release, no commits).
- Skips `pnpm publish` for the mirror packages (or substitutes `pnpm publish --dry-run`).
- Reports the planned next version per release run in the job summary.

This is the exit gate before flipping a real release. **Required before bootstrap PR merge** — the dry run on `main` must pass cleanly.

### 4. Bootstrap-specific dry-run drill

Before the manual `0.1.0` publish:

```bash
# Pretend to publish without sending bytes
for p in core react vue svelte; do
  ( cd packages/$p && pnpm publish --dry-run --access public --no-git-checks )
done
( cd packages/font && pnpm publish --dry-run --access public --no-git-checks )
```

Inspect every reported tarball. Confirm no `src/` files (except font), no test files, no `.tsbuildinfo`, no `node_modules`.

## Secrets & permissions

- Repo secret: `NPM_TOKEN` — npm Automation token. Scopes: `@dev.icons` org + `devicons` package. Permission: publish. **Granular access token** with provenance enabled.
- Workflow `permissions` (set at workflow level, see YAML above):
  ```yaml
  contents: write       # commit CHANGELOG, push tags, create releases
  issues: write         # semantic-release issue comments
  pull-requests: write  # semantic-release PR comments
  id-token: write       # npm provenance via OIDC
  ```
- Branch protection: `main` and `canary` require status checks, but the release workflow itself runs after merge (not as a check). Allow `[skip ci]` on the CHANGELOG commit-back to avoid loops.

## Files added

```
.github/workflows/release.yml
packages/font/release.config.cjs            # devicons (scoped)
scripts/release-group1.mjs                  # programmatic semantic-release + mirror
docs/superpowers/specs/2026-04-15-release-ci-workflow-design.md  # this doc
CHANGELOG.md                                # created by first main release
packages/font/CHANGELOG.md                  # created by first font release
```

**No root `release.config.cjs`.** The Group 1 plugin chain is built at runtime inside `scripts/release-group1.mjs` (see its code above); a static root config would duplicate the conditional-on-branch logic and invite drift. All Group 1 dry runs go through the script.

Edits:

- Root `package.json`: add devDependencies — `semantic-release`, `@semantic-release/changelog`, `@semantic-release/git`, `@semantic-release/github`, `@semantic-release/npm`, `@semantic-release/commit-analyzer`, `@semantic-release/release-notes-generator`, `semantic-release-monorepo`, `conventional-changelog-conventionalcommits`. Add scripts:
  - `"release:dry": "DRY_RUN=true node scripts/release-group1.mjs"` — dry-run Group 1 locally
  - `"release:font:dry": "DRY_RUN=true pnpm exec semantic-release --dry-run --no-ci -e ./packages/font/release.config.cjs"` — dry-run font locally
- Each publishable `package.json`: hygiene fields (Preconditions section).
- `packages/core/package.json` + `packages/core/scripts/build-all.ts` + new `packages/core/src/index.ts`: build fix per *@dev.icons/core build fix* section.
- Top-level `CONTRIBUTING.md` (or addition to README): document the conventional-commits requirement for any commit touching `packages/core/export-files/`.

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Mirror script publishes `react`/`vue`/`svelte` but `core` publish failed midway | semantic-release publishes `core` first; if it throws, the script process exits non-zero before reaching the mirror loop. To improve atomicity later, capture `nextRelease` from a `--dry-run` first, then publish all four in a strict order with rollback comments — out of scope for v1. |
| Canary version sequence resets after a stable release lands on `main` | Expected behavior of semantic-release prerelease channels: after `0.2.0` ships on main, the next canary becomes `0.3.0-canary.1`. Document this in CONTRIBUTING. |
| Non-conventional commit on `main` triggers nothing — release silently skipped | Acceptable. Operator can re-tag/re-publish via `workflow_dispatch`. Optional v2: add a check that warns when a push hits the path filter but contains zero conventional commits. |
| `pnpm publish` from mirror script fails because working tree is dirty | `--no-git-checks` flag bypasses pnpm's clean-tree assertion. |
| First-time canary release computes `1.0.0-canary.1` instead of `0.1.0-canary.1` because no `v*` tag exists | Bootstrap publishes `v0.1.0` from `main` first. Canary's first release reads that tag and produces `0.2.0-canary.1`. Do not run canary release before bootstrap. |
| `semantic-release-monorepo`'s `commitPaths` doesn't include the upstream `packages/core/export-files/font/**` and misses font releases | Spec explicitly extends `commitPaths` (see `packages/font/release.config.cjs`). Verify in dry run. |
| Provenance fails because `id-token: write` permission not granted | Workflow declares it at workflow level. Job-level `permissions:` would need to be repeated per job — keep at workflow level. |
| `@semantic-release/git` push on `main` triggers another workflow run → loop | Commit message includes `[skip ci]`. GitHub Actions skips workflows on `[skip ci]` commits by default. |
| Private packages accidentally get `private: false` and ship | `publishConfig.access` not set on private packages + dependency on root `pnpm` workspace ignoring private packages by default. Defense-in-depth: a CI step that runs `pnpm -r --filter "!./packages/utils" --filter "!./packages/codegen" --filter "!./packages/figma" exec true` before publish would catch accidental flips, but is out of scope for v1. |

## Preflight audit (before bootstrap PR merge)

Run once, manually, on a clean checkout of the bootstrap PR. **All must be green:**

1. `pnpm -F @dev.icons/core build` produces `dist/index.{mjs,cjs,d.ts}`, `dist/icons.json`, `dist/sprite/*`, `dist/font/*`.
2. `pnpm -F @dev.icons/react build && pnpm -F @dev.icons/vue build && pnpm -F @dev.icons/svelte build` succeed.
3. `pnpm -F devicons build` succeeds.
4. Every `pnpm -F <pkg> pack --pack-destination /tmp` tarball contains only what `files` lists (no `src/` except font, no `node_modules`, no `.test.ts`).
5. `pnpm dlx publint <each pkg>` (against the source dir) and `pnpm dlx publint <path-to-packed-tarball.tgz>` (against the packed artifact) both report zero errors. The tarball check catches issues the source-dir check misses (e.g., `exports` paths that only resolve post-build).
6. `pnpm dlx @arethetypeswrong/cli --pack <each pkg>` reports zero errors.
7. Install-the-tarball smoke test resolves the library entry of `@dev.icons/core` from a fresh `node_modules` without workspace deps.
8. **Pre-bootstrap (no `v*` tag exists yet):** `DRY_RUN=true node scripts/release-group1.mjs` from `main` exits either with "No release." (if the bootstrap PR's commits aren't conventional) or with `nextRelease.version === '1.0.0'` (semantic-release's default first-release when no tag exists). **This is informational only** — bootstrap overrides this by manually publishing `0.1.0` and seeding the `v0.1.0` tag. The preflight passes either way; it just confirms the script runs without throwing.
9. **Post-bootstrap re-run (after `v0.1.0` tag is pushed, before first auto-release):** `DRY_RUN=true node scripts/release-group1.mjs` reports `nextRelease.version === '0.2.0'` (next `feat:` commit since `v0.1.0`) or exits "No release." if no qualifying commits exist yet.
10. **Font pre-bootstrap check:** `pnpm exec semantic-release --dry-run --no-ci -e ./packages/font/release.config.cjs` exits cleanly. After the `devicons-v1.8.0` seed tag is pushed, the same command reports `nextRelease.version === '1.9.0'` or later.
11. `workflow_dispatch` with `dry_run: true` on the bootstrap PR branch completes both jobs successfully, with no tags pushed and no npm publishes.

## Open questions for implementation

_None. All decisions locked in; ready for `writing-plans`._

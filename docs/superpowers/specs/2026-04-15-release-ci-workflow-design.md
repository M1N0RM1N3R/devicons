# Release CI Workflow — Design

**Date:** 2026-04-15
**Status:** Approved (brainstorming)
**Scope:** Automated npm publishing for the devicons monorepo, driven by changes to `packages/core/export-files/`.

## Goals

1. Publish the public packages to npm automatically when the icon/font asset source (`packages/core/export-files/`) changes.
2. Keep `devicons` (the icon font) on its own independent version track; keep the four framework packages in lockstep.
3. Provide a `canary` channel on the `canary` branch that auto-publishes a prerelease on every qualifying merge.
4. Provide a stable `latest` channel on `master` via a reviewable "Version Packages" PR.
5. Require zero per-PR changeset authoring from contributors for the common case (icon additions).

## Non-goals

- Publishing private/internal packages (`@dev.icons/utils`, `@dev.icons/codegen`, `@dev.icons/figma`).
- Releasing on code-only changes that don't touch `packages/core/export-files/`. Such changes ship opportunistically the next time an asset change lands.
- Manual version pinning per package beyond what Changesets offers out of the box.

## Packages

| Package | npm name | Current | Track | Published? |
| --- | --- | --- | --- | --- |
| `packages/core` | `@dev.icons/core` | `0.0.0` | Group 1 (lockstep) | No |
| `packages/react` | `@dev.icons/react` | `0.0.0` | Group 1 (lockstep) | No |
| `packages/vue` | `@dev.icons/vue` | `0.0.0` | Group 1 (lockstep) | No |
| `packages/svelte` | `@dev.icons/svelte` | `0.0.0` | Group 1 (lockstep) | No |
| `packages/font` | `devicons` | `1.8.0` | Independent | Yes |
| `packages/utils` | `@dev.icons/utils` | — | private | No (never) |
| `packages/codegen` | `@dev.icons/codegen` | — | private | No (never) |
| `packages/figma` | `@dev.icons/figma` | — | private | No (never) |

Group 1 bootstraps at `0.1.0` on first publish.

## Stack

- [Changesets](https://github.com/changesets/changesets) (`@changesets/cli`, `changesets/action@v1`).
- pnpm (already the package manager — `pnpm@10.10.0`).
- GitHub Actions.

## Trigger

All release workflows use:

```yaml
on:
  push:
    branches: [master, canary]
    paths:
      - 'packages/core/export-files/**'
```

Nothing publishes unless assets under that directory change in the push.

## Auto-changeset generation

A Node script (`scripts/generate-changeset.mjs`) runs as the first step of each release workflow. It reads the push diff (`git diff --name-only ${{ github.event.before }} ${{ github.sha }}`) and writes `.changeset/<slug>.md` files:

- If any path matches `packages/core/export-files/icons/**` → one changeset bumping the four Group 1 packages by `minor`. Summary: `"Icon set update (<short-sha>)"`.
- If any path matches `packages/core/export-files/font/**` → one changeset bumping `devicons` by `minor`. Summary: `"Font asset update (<short-sha>)"`.
- Both can be emitted in the same run.

Contributors can still hand-write changesets for major bumps or custom messages; the script is additive, not exclusive.

## Branch flows

### `canary` branch — `.github/workflows/release-canary.yml`

1. Checkout with full history (`fetch-depth: 0`).
2. Setup Node + pnpm; `pnpm install --frozen-lockfile`.
3. Run `scripts/generate-changeset.mjs` to produce changesets for this push.
4. Build publishable packages (`pnpm -F @dev.icons/core build`, then framework builds, then font build — in dependency order).
5. `pnpm changeset version --snapshot canary` → versions become `0.1.0-canary-<sha>` / `1.9.0-canary-<sha>`.
6. `pnpm changeset publish --tag canary --no-git-tag` → publishes under dist-tag `canary`.
7. No commit back, no GitHub release, no git tag. Stateless and idempotent per commit.

### `master` branch — `.github/workflows/release.yml`

Two jobs, gated by the same path filter:

**Job A — `prepare`:** runs on every qualifying push.
1. Checkout with full history.
2. Setup Node + pnpm; install deps.
3. Run `scripts/generate-changeset.mjs`.
4. If new changeset files were produced, commit them back to `master` with message `chore(release): add changesets for <sha>` using the default `GITHUB_TOKEN`.

**Job B — `release`:** runs after Job A.
1. Checkout (post-commit from Job A).
2. Install + build.
3. `changesets/action@v1` with `publish: pnpm changeset publish`. Behavior:
   - If unreleased changesets exist: opens/updates the **"Version Packages"** PR that bumps versions and updates `CHANGELOG.md`.
   - If the push *is* a merge of that PR (no pending changesets, but version bumps in `package.json`): runs publish, creates git tags (`@dev.icons/core@0.2.0`, `devicons@1.9.0`, …), creates per-package GitHub Releases with the changelog body.

Dist-tag: `latest`. Provenance: enabled.

## Changesets configuration

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "<org>/devicons" }],
  "commit": false,
  "access": "public",
  "baseBranch": "master",
  "updateInternalDependencies": "patch",
  "fixed": [
    ["@dev.icons/core", "@dev.icons/react", "@dev.icons/vue", "@dev.icons/svelte"]
  ],
  "ignore": ["@dev.icons/utils", "@dev.icons/codegen", "@dev.icons/figma", "@dev.icons/website"]
}
```

Note: private packages are ignored by Changesets anyway, but listing them is explicit and protects against someone removing `"private": true`.

## Bootstrap (one-time, before automation takes over)

Group 1 has never been published. The first release is a hand-crafted PR to `master`:

1. Land `.changeset/config.json` and `.changeset/README.md`.
2. Land the two workflow files and `scripts/generate-changeset.mjs`.
3. Per-publishable-package `package.json` hygiene pass (see Preconditions).
4. Add a hand-written changeset `.changeset/initial-group1-release.md` bumping Group 1 to `0.1.0`:
   ```md
   ---
   "@dev.icons/core": minor
   "@dev.icons/react": minor
   "@dev.icons/vue": minor
   "@dev.icons/svelte": minor
   ---
   Initial public release.
   ```
5. Merge bootstrap PR to `master`. The workflow runs; since pending changesets exist, the "Version Packages" PR opens.
6. Merge the "Version Packages" PR → first publish of Group 1 at `0.1.0`. `devicons` is untouched (no changeset for it).

From this point on, automation handles everything.

## Preconditions (publish hygiene)

Each of the five publishable `package.json` files must have:

- `"publishConfig": { "access": "public", "provenance": true }`
- `"repository"`, `"license"`, `"homepage"`, `"author"`, `"bugs"` populated.
- `"files"` listing exactly what ships (`["dist"]` for the framework packages; `["dist", "src", "codepoints.lock.json"]` for the font; `"files"` audit for `@dev.icons/core`).
- `"main"`/`"module"`/`"types"`/`"exports"` pointing to built artifacts, not `src`.
- No `workspace:*` ranges in anything that ships (Changesets rewrites these at publish time, but verify).

For `@dev.icons/core` specifically: confirm there is a `dist` output and adjust `main`/`types` accordingly before the bootstrap PR ships.

## Secrets & permissions

- Repo secret: `NPM_TOKEN` — npm Automation token, scope: `@dev.icons` + `devicons`, permission: publish, OIDC/provenance enabled.
- Workflow `permissions`:
  ```yaml
  contents: write       # commit changesets back, push tags, create releases
  pull-requests: write  # open/update Version Packages PR
  id-token: write       # npm provenance
  ```

## Files added

```
.changeset/config.json
.changeset/README.md
.github/workflows/release.yml
.github/workflows/release-canary.yml
scripts/generate-changeset.mjs
```

Edits:

- Root `package.json`: add `@changesets/cli` and `@changesets/changelog-github` as devDependencies; add `"release": "changeset publish"`, `"version": "changeset version"` scripts.
- Each publishable `package.json`: hygiene fields (Preconditions).

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Auto-changeset runs on a force-push and re-bumps already-released icons | Script checks `git diff ${{ github.event.before }} ${{ github.sha }}`; force-pushes with `before == after` are a no-op. For true force-pushes, operator fixes manually. |
| Canary snapshot versions collide across re-runs | Snapshot template includes short SHA (`0.1.0-canary-<sha>`), unique per commit. Re-running same commit republishes the same version — npm rejects, workflow fails loudly (acceptable). |
| "Version Packages" PR goes stale while more pushes land | `changesets/action` updates it in place on every push — no staleness. |
| `devicons` accidentally bumped as part of Group 1 | `fixed` group explicitly excludes it; `publishConfig` and `name` are separate. |
| Private package gets flagged `public` by accident | `"private": true` in manifests + `ignore` list in Changesets config = two layers. |

## Open questions for implementation

- Exact GitHub org/repo slug for `@changesets/changelog-github` config (fill in when writing the plan).
- Whether `packages/core` builds a `dist/` ready for publish today, or needs adjustment (audit during Preconditions step).

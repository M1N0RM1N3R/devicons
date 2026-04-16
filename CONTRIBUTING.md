# Contributing

## Conventional commits (required for releases)

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org/).
Any commit that touches `packages/core/export-files/**` and lands on `main` or `canary`
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
- `main` — every release-worthy push publishes a stable version.
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

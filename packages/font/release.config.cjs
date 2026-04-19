// packages/font/release.config.cjs
//
// Independent semantic-release run for `devicons` (the font package).
// Scoped via semantic-release-monorepo + extended commitPaths to include
// the upstream font asset source.
//
// Authentication model:
//   Publishes to npm via Trusted Publisher (OIDC) — no NPM_TOKEN. The
//   workflow grants `id-token: write` so `npm publish` can exchange a
//   GitHub OIDC token for a short-lived credential. pnpm publish does not
//   yet support this flow, so the publish plugin shells out to `npm publish`.
//
// Version selection:
//   semantic-release computes the next version from conventional commits
//   scoped to packages/font/** and packages/core/export-files/font/**.
//     - On `main`:   X.Y.Z             (dist-tag: latest)
//     - On `canary`: X.Y.Z-canary.N    (dist-tag: canary)
//   The `.N` suffix increments by 1 per canary publish against the same
//   base version — continuous canary numbering.
//
// CWD note:
//   semantic-release is invoked from packages/font (via `working-directory`
//   in the workflow). semantic-release-monorepo scopes commits using the
//   package.json at cwd, so running from the repo root would scope to the
//   root `@dev.icons/repo` package and yield 0 commits — no canary ever
//   fires. Running from packages/font makes it scope to `devicons`.
//
//   Because cwd = packages/font, file paths in this config are relative
//   to packages/font (not the repo root). commitPaths is the exception:
//   semantic-release-monorepo matches commit diff paths (always repo-root
//   relative) against those globs, so commitPaths stays repo-root relative.
//
// Plugin loading note:
//   semantic-release-monorepo wraps each plugin by string name, so inline
//   plugin objects break it. The publish plugin is loaded by absolute path
//   from scripts/npm-publish-plugin.cjs (shared with scripts/release-group1.mjs).
//   The path MUST be absolute: semantic-release-plugin-decorators (used by
//   semantic-release-monorepo) resolves plugin paths relative to its own
//   file location inside node_modules, not the repo root, so a relative
//   `./scripts/…` path fails with ERR_MODULE_NOT_FOUND.
//
// On canary, @semantic-release/changelog and @semantic-release/git are
// omitted so nothing is committed back to the canary branch.

const path = require('node:path');
const monorepoConfig = require('semantic-release-monorepo');

const branch = process.env.GITHUB_REF_NAME || process.env.SR_BRANCH || '';
const isCanary = branch === 'canary';

const PUBLISH_PLUGIN = path.resolve(
  __dirname,
  '../../scripts/npm-publish-plugin.cjs',
);

module.exports = {
  ...monorepoConfig,
  tagFormat: 'devicons-v${version}',
  branches: ['main', { name: 'canary', prerelease: 'canary' }],
  // semantic-release-monorepo defaults commitPaths to the package directory.
  // Extend it to include the upstream font asset source.
  commitPaths: ['packages/font/**', 'packages/core/export-files/font/**'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    [
      '@semantic-release/release-notes-generator',
      { preset: 'conventionalcommits' },
    ],
    ...(isCanary
      ? []
      : [['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }]]),
    [PUBLISH_PLUGIN, { pkgRoot: '.' }],
    ...(isCanary
      ? []
      : [
          [
            '@semantic-release/git',
            {
              assets: ['package.json', 'CHANGELOG.md'],
              message:
                'chore(release): devicons ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
            },
          ],
        ]),
    '@semantic-release/github',
  ],
};

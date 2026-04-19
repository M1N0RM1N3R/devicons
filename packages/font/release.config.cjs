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
      : [
          [
            '@semantic-release/changelog',
            { changelogFile: 'packages/font/CHANGELOG.md' },
          ],
        ]),
    [PUBLISH_PLUGIN, { pkgRoot: 'packages/font' }],
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

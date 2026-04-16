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

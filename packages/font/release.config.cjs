// packages/font/release.config.cjs
//
// Independent semantic-release run for `devicons` (the font package).
// Scoped via semantic-release-monorepo + extended commitPaths to include
// the upstream font asset source.
//
// Authentication model:
//   Publishes to npm via Trusted Publisher (OIDC) — no NPM_TOKEN. The
//   workflow grants `id-token: write` so `npm publish` can exchange a
//   GitHub OIDC token for a short-lived credential. pnpm publish does
//   not yet support this flow, so we use `npm publish` directly.
//
// Version selection:
//   semantic-release computes the next version from conventional commits
//   scoped to packages/font/** and packages/core/export-files/font/**.
//     - On `main`:   X.Y.Z             (dist-tag: latest)
//     - On `canary`: X.Y.Z-canary.N    (dist-tag: canary)
//   The `.N` suffix increments by 1 per canary publish against the same
//   base version — continuous canary numbering, per semantic-release's
//   documented prerelease behaviour.
//
// On canary, @semantic-release/changelog and @semantic-release/git are
// omitted so nothing is committed back to the canary branch.

const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');

const monorepoConfig = require('semantic-release-monorepo');

const branch = process.env.GITHUB_REF_NAME || process.env.SR_BRANCH || '';
const isCanary = branch === 'canary';

const DRY_RUN = process.env.DRY_RUN === 'true';

const PKG_PATH = 'packages/font/package.json';

// Snapshot so DRY_RUN can revert the on-disk version.
let originalPkgJson;

const updateAndPublish = {
  prepare: (_pluginConfig, { logger, nextRelease }) => {
    originalPkgJson = readFileSync(PKG_PATH, 'utf8');
    const json = JSON.parse(originalPkgJson);
    json.version = nextRelease.version;
    writeFileSync(PKG_PATH, JSON.stringify(json, null, 2) + '\n');
    logger.log(`Stamped devicons → ${nextRelease.version}`);
  },
  publish: (_pluginConfig, { logger, nextRelease }) => {
    const { version, channel } = nextRelease;
    const tag = !channel || channel === 'default' ? 'latest' : channel;

    const args = [
      'publish',
      '--tag',
      tag,
      '--provenance',
      '--access',
      'public',
    ];
    if (DRY_RUN) args.push('--dry-run');

    try {
      execSync(`npm ${args.join(' ')}`, {
        cwd: 'packages/font',
        stdio: 'inherit',
      });
      logger.log(`Published devicons@${version} (dist-tag: ${tag})`);
    } finally {
      if (DRY_RUN && originalPkgJson !== undefined) {
        writeFileSync(PKG_PATH, originalPkgJson);
      }
    }

    return {
      name: `devicons@${version}`,
      url: `https://www.npmjs.com/package/devicons/v/${version}`,
    };
  },
};

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
    updateAndPublish,
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

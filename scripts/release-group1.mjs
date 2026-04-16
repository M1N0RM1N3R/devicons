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
  [
    '@semantic-release/release-notes-generator',
    { preset: 'conventionalcommits' },
  ],
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
  branches: ['main', { name: 'canary', prerelease: 'canary' }],
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
  const original = readFileSync(pkgPath, 'utf8');
  const json = JSON.parse(original);
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
  } finally {
    if (DRY_RUN) {
      writeFileSync(pkgPath, original);
    }
  }
}

console.log(`[release-group1] All four packages at ${version} (tag: ${tag}).`);

// scripts/release-group1.mjs
//
// Drives the lockstep release of @dev.icons/{core,react,vue,svelte}.
//
// Authentication model:
//   We publish to npm via Trusted Publisher (OIDC) — no NPM_TOKEN is used.
//   The workflow grants `id-token: write` so `npm publish` can exchange a
//   GitHub OIDC token for a short-lived publish credential. pnpm publish
//   does not yet support this flow, so we use `npm publish` directly.
//   (`workspace:*` references in the four packages live in devDependencies
//   only, so `npm publish` does not need to rewrite them.)
//
// Version selection:
//   semantic-release computes nextRelease.version from conventional commits.
//     - On `main`:   X.Y.Z             (dist-tag: latest)
//     - On `canary`: X.Y.Z-canary.N    (dist-tag: canary)
//   The `.N` suffix is incremented by semantic-release for every canary
//   release sharing the same base X.Y.Z, giving continuous canary numbers.
//   A new base (feat/fix on canary that bumps X.Y.Z) resets N to 1 — that
//   is the documented semantic-release prerelease behaviour and keeps the
//   produced semver strictly ordered.
//
// Lifecycle:
//   1. commit-analyzer          → compute version bump
//   2. release-notes-generator  → render release notes
//   3. changelog (main only)    → write CHANGELOG.md
//   4. updateAndPublish.prepare → stamp version into all 4 package.json
//   5. git (main only)          → commit CHANGELOG + 4 package.json files
//   6. updateAndPublish.publish → npm publish each of the 4 packages
//   7. github                   → create GitHub release
//
//   semantic-release creates the git tag BEFORE publish plugins run. If
//   publish fails mid-way (e.g. core succeeds, react fails), the logged
//   error lists exactly which packages already hit npm so manual recovery
//   of the remaining ones is straightforward — a retry of the workflow
//   would no-op because the tag already exists.
//
// DRY_RUN=true makes everything a no-op: semantic-release `dryRun`, and
// `npm publish --dry-run` for each package. Changes to package.json are
// reverted on disk at the end so repeated dry-runs stay idempotent.
//
// On canary, @semantic-release/changelog and @semantic-release/git are
// omitted so nothing is committed back to the canary branch.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import semanticRelease from 'semantic-release';

const DRY_RUN = process.env.DRY_RUN === 'true';
const PACKAGES = ['core', 'react', 'vue', 'svelte'];

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

const pkgJsonPath = (pkg) => `packages/${pkg}/package.json`;

// Snapshot package.json contents so DRY_RUN can restore them.
const originals = new Map();

const updateAndPublish = {
  prepare: async (_pluginConfig, { logger, nextRelease }) => {
    for (const pkg of PACKAGES) {
      const path = pkgJsonPath(pkg);
      const original = readFileSync(path, 'utf8');
      originals.set(pkg, original);
      const json = JSON.parse(original);
      json.version = nextRelease.version;
      writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
      logger.log(`Stamped @dev.icons/${pkg} → ${nextRelease.version}`);
    }
  },
  publish: async (_pluginConfig, { logger, nextRelease }) => {
    const { version, channel } = nextRelease;
    const tag = !channel || channel === 'default' ? 'latest' : channel;
    const published = [];

    try {
      for (const pkg of PACKAGES) {
        const args = [
          'publish',
          '--tag',
          tag,
          '--provenance',
          '--access',
          'public',
        ];
        if (DRY_RUN) args.push('--dry-run');
        execSync(`npm ${args.join(' ')}`, {
          cwd: `packages/${pkg}`,
          stdio: 'inherit',
        });
        published.push(pkg);
        logger.log(
          `Published @dev.icons/${pkg}@${version} (dist-tag: ${tag})`,
        );
      }
    } catch (err) {
      const remaining = PACKAGES.filter((p) => !published.includes(p));
      logger.error(
        `Publish failed at @dev.icons/${remaining[0]}@${version}. ` +
          `Succeeded (dist-tag: ${tag}): ${
            published.map((p) => `@dev.icons/${p}`).join(', ') || '(none)'
          }. ` +
          `Remaining: ${remaining
            .map((p) => `@dev.icons/${p}`)
            .join(', ')}. ` +
          `Manual publish of the remaining packages is required — the git tag v${version} has already been created so a workflow retry will no-op.`,
      );
      throw err;
    } finally {
      if (DRY_RUN) {
        for (const [pkg, original] of originals) {
          writeFileSync(pkgJsonPath(pkg), original);
        }
      }
    }

    return {
      name: `@dev.icons/core@${version}`,
      url: `https://www.npmjs.com/package/@dev.icons/core/v/${version}`,
    };
  },
};

const plugins = [
  ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
  [
    '@semantic-release/release-notes-generator',
    { preset: 'conventionalcommits' },
  ],
  ...(isCanary
    ? []
    : [['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }]]),
  updateAndPublish,
  ...(isCanary
    ? []
    : [
        [
          '@semantic-release/git',
          {
            assets: [
              'CHANGELOG.md',
              ...PACKAGES.map((p) => pkgJsonPath(p)),
            ],
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
  `[release-group1] All four @dev.icons packages released at ${version} (dist-tag: ${tag}).`,
);

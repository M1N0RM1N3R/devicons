// scripts/npm-publish-plugin.cjs
//
// semantic-release plugin that publishes one or more packages to npm using
// Trusted Publisher (OIDC). Must be loaded by path (string) so that
// semantic-release-monorepo can wrap it — inline plugin objects break the
// monorepo decorator's plugin-name lookup.
//
// Config:
//   pkgRoot:  'packages/font'                             (single package)
//   pkgRoots: ['packages/core', 'packages/react', …]      (lockstep group)
//
// Hooks:
//   prepare — stamps nextRelease.version into each package.json.
//   publish — runs `npm publish --tag <tag> --provenance --access public`
//             sequentially on each package. On failure, logs which packages
//             already hit npm so manual recovery of the remainder is easy.
//
// DRY_RUN=true makes the publish a no-op (`npm publish --dry-run`) and
// restores the on-disk package.json contents afterwards so repeated
// dry-runs are idempotent.

const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const isDryRun = () => process.env.DRY_RUN === 'true';
const pkgJsonPath = (root) => path.join(root, 'package.json');

// State retained between prepare and publish within the same run.
const state = { roots: [], originals: new Map() };

function normalizeRoots(config = {}) {
  if (Array.isArray(config.pkgRoots) && config.pkgRoots.length > 0) {
    return config.pkgRoots;
  }
  if (typeof config.pkgRoot === 'string' && config.pkgRoot.length > 0) {
    return [config.pkgRoot];
  }
  throw new Error(
    'npm-publish-plugin: pkgRoot (string) or pkgRoots (string[]) is required',
  );
}

function readPkgName(root) {
  return JSON.parse(readFileSync(pkgJsonPath(root), 'utf8')).name;
}

exports.prepare = async (pluginConfig, { logger, nextRelease }) => {
  state.roots = normalizeRoots(pluginConfig);
  state.originals.clear();
  for (const root of state.roots) {
    const p = pkgJsonPath(root);
    const original = readFileSync(p, 'utf8');
    state.originals.set(root, original);
    const json = JSON.parse(original);
    json.version = nextRelease.version;
    writeFileSync(p, JSON.stringify(json, null, 2) + '\n');
    logger.log(`Stamped ${json.name} (${root}) → ${nextRelease.version}`);
  }
};

exports.publish = async (pluginConfig, { logger, nextRelease }) => {
  const roots = state.roots.length
    ? state.roots
    : normalizeRoots(pluginConfig);
  const { version, channel } = nextRelease;
  const tag = !channel || channel === 'default' ? 'latest' : channel;
  const published = [];

  try {
    for (const root of roots) {
      const args = [
        'publish',
        '--tag',
        tag,
        '--provenance',
        '--access',
        'public',
      ];
      if (isDryRun()) args.push('--dry-run');
      execSync(`npm ${args.join(' ')}`, { cwd: root, stdio: 'inherit' });
      published.push(root);
      logger.log(
        `Published ${readPkgName(root)}@${version} (dist-tag: ${tag})`,
      );
    }
  } catch (err) {
    const remaining = roots.filter((r) => !published.includes(r));
    logger.error(
      `Publish failed at ${readPkgName(remaining[0])}@${version}. ` +
        `Succeeded (dist-tag: ${tag}): ${
          published.map((r) => readPkgName(r)).join(', ') || '(none)'
        }. ` +
        `Remaining: ${remaining.map((r) => readPkgName(r)).join(', ')}. ` +
        `The git tag has already been created — a workflow retry will no-op and the remaining packages must be published manually.`,
    );
    throw err;
  } finally {
    if (isDryRun()) {
      for (const [root, original] of state.originals) {
        writeFileSync(pkgJsonPath(root), original);
      }
    }
  }

  const primary = roots[0];
  const primaryName = readPkgName(primary);
  return {
    name: `${primaryName}@${version}`,
    url: `https://www.npmjs.com/package/${primaryName}/v/${version}`,
  };
};

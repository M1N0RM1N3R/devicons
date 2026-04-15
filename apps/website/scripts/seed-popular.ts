/**
 * Seed a flagship set of icons as `popular: true` so the
 * compute-recommended script has better material to pick from.
 *
 * Only rewrites files whose frontmatter isn't already `popular: true`.
 * Missing icon ids are skipped with a warning — safe to re-run.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../src/content/icons');

// Curated flagships across the major developer-tool categories. Each id must
// match a file at src/content/icons/<id>.mdx.
const FLAGSHIPS = [
  // Frontend frameworks & libraries
  'angular', 'astro', 'gatsby', 'nuxt', 'remix', 'solid',
  // Backend frameworks
  'django', 'express', 'fastapi', 'flask', 'laravel', 'rails', 'spring',
  // Languages
  'dart', 'elixir', 'java', 'kotlin', 'php', 'ruby', 'scala', 'swift',
  // Build tools / bundlers / runtimes
  'bun', 'deno', 'esbuild', 'rollup', 'turbopack',
  // Package managers
  'npm', 'pnpm', 'yarn',
  // Databases & data
  'cassandra', 'clickhouse', 'duckdb', 'elasticsearch', 'mariadb', 'mongodb',
  'mysql', 'neo4j', 'redis', 'snowflake', 'sqlite', 'supabase',
  // Streaming / queues
  'kafka', 'rabbitmq',
  // DevOps & infra
  'ansible', 'argocd', 'consul', 'grafana', 'helm', 'jenkins', 'prometheus',
  'pulumi', 'terraform', 'vault',
  // Cloud providers
  'aws', 'azure', 'cloudflare', 'digitalocean', 'gcp', 'heroku', 'linode',
  // Hosting platforms
  'fly', 'netlify', 'railway', 'render',
  // Observability
  'datadog', 'new-relic', 'sentry',
  // CI/CD
  'circleci', 'github-actions', 'gitlab-ci',
  // Testing
  'cypress', 'jest', 'playwright', 'vitest',
  // Linting / formatting
  'eslint', 'prettier',
  // Code hosting / SCM
  'bitbucket', 'gitlab',
  // APIs
  'graphql', 'postman', 'swagger',
  // ORMs
  'drizzle-orm', 'prisma', 'typeorm',
  // State mgmt
  'redux', 'zustand',
  // UI frameworks & CSS
  'bootstrap', 'chakra-ui', 'mantine', 'mui', 'radix-ui', 'sass', 'shadcn',
  // Design
  'figma', 'sketch', 'storybook',
  // Mobile
  'expo', 'flutter', 'ionic', 'react-native',
  // Payments
  'paypal', 'stripe',
  // SaaS essentials
  'airtable', 'notion', 'trello',
  // Comms
  'discord', 'slack', 'zoom',
  // CMS
  'contentful', 'ghost', 'sanity', 'strapi', 'wordpress',
  // Browsers
  'chrome', 'firefox', 'safari',
  // Editors
  'cursor', 'neovim', 'vim',
  // LLM providers
  'anthropic', 'claude', 'deepseek', 'google-gemini', 'groq', 'mistral-ai',
  'openai', 'xai',
  // AI toolkit
  'github-copilot', 'hugging-face', 'langchain', 'ollama',
  // ML libraries
  'jupyter', 'keras', 'numpy', 'pandas', 'pytorch', 'tensorflow',
  // Search & vector
  'algolia', 'meilisearch', 'pinecone', 'typesense', 'weaviate',
  // Web standards / core
  'html-5', 'css',
  // Dev utilities
  'curl',
  // Second pass — actual slug names in this collection
  'microsoft-azure', 'digital-ocean', 'argo', 'rollupjs', 'material-ui',
  'docker',
  // Third pass
  'google-cloud',
] as const;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

async function seed() {
  const changes: string[] = [];
  const missing: string[] = [];
  const already: string[] = [];

  for (const id of FLAGSHIPS) {
    const file = path.join(ICONS_DIR, `${id}.mdx`);
    if (!fsSync.existsSync(file)) {
      missing.push(id);
      continue;
    }
    const raw = await fs.readFile(file, 'utf8');
    const m = raw.match(FRONTMATTER_RE);
    if (!m) {
      missing.push(`${id} (no frontmatter)`);
      continue;
    }
    const fm = m[1];
    const body = m[2];

    if (/^popular\s*:\s*true\s*$/m.test(fm)) {
      already.push(id);
      continue;
    }

    let nextFm: string;
    if (/^popular\s*:/m.test(fm)) {
      nextFm = fm.replace(/^popular\s*:.*$/m, 'popular: true');
    } else {
      const lines = fm.split('\n');
      const tagsIdx = lines.findIndex((l) => /^tags\s*:/.test(l));
      const anchor = tagsIdx >= 0 ? tagsIdx : lines.length;
      lines.splice(anchor, 0, 'popular: true');
      nextFm = lines.join('\n');
    }
    await fs.writeFile(file, `---\n${nextFm}\n---\n${body}`);
    changes.push(id);
  }

  console.log(`Promoted: ${changes.length}`);
  console.log(`  ${changes.sort().join(', ')}`);
  console.log('');
  console.log(`Already popular: ${already.length}`);
  if (already.length) console.log(`  ${already.sort().join(', ')}`);
  console.log('');
  console.log(`Missing (no file): ${missing.length}`);
  if (missing.length) console.log(`  ${missing.sort().join(', ')}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

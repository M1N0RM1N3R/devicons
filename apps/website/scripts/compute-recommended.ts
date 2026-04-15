/**
 * Mark the "recommended" flagship icon per tag.
 *
 * Strategy:
 *   1. Parse every icon MDX file's frontmatter.
 *   2. Group by tag.
 *   3. For each tag, select up to MAX_PER_TAG icons, preferring ones already
 *      flagged `popular: true`, then falling back to alphabetical.
 *   4. Union the picks → set `recommended: true` in each winner's frontmatter.
 *   5. Print a per-tag summary for review.
 *
 * Idempotent: re-running rewrites the flag. Existing `recommended:` lines are
 * replaced, not duplicated.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fastGlob from 'fast-glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../src/content/icons');

const MAX_PER_TAG = 3;
// Tags with at least this many icons get a baseline pick even when no
// popular:true icon exists in the group — guarantees broad coverage for
// mainstream categories without forcing picks on long-tail niches.
const BASELINE_MIN_TAG_SIZE = 6;
const BASELINE_PER_TAG = 2;

interface IconDoc {
  id: string;
  file: string;
  name: string;
  tags: string[];
  popular: boolean;
  raw: string;
  frontmatter: string;
  body: string;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

// Minimal frontmatter parser — handles the shapes used in these mdx files.
function parseValue(v: string): unknown {
  const s = v.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((p) => parseValue(p));
  }
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1);
  const num = Number(s);
  if (!Number.isNaN(num) && s !== '') return num;
  return s;
}

function parseFrontmatter(fm: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of fm.split('\n')) {
    const match = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (!match) continue;
    const [, key, rest] = match;
    out[key] = parseValue(rest);
  }
  return out;
}

async function loadIcons(): Promise<IconDoc[]> {
  const files = await fastGlob(path.join(ICONS_DIR, '*.mdx'));
  const docs: IconDoc[] = [];
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const m = raw.match(FRONTMATTER_RE);
    if (!m) continue;
    const fm = parseFrontmatter(m[1]);
    const body = m[2];
    const id = path.basename(file, '.mdx');
    const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
    docs.push({
      id,
      file,
      name: typeof fm.name === 'string' ? (fm.name as string) : id,
      tags,
      popular: fm.popular === true,
      raw,
      frontmatter: m[1],
      body,
    });
  }
  return docs;
}

function pickRecommendedPerTag(docs: IconDoc[]) {
  const byTag = new Map<string, IconDoc[]>();
  for (const doc of docs) {
    for (const tag of doc.tags) {
      const arr = byTag.get(tag) ?? [];
      arr.push(doc);
      byTag.set(tag, arr);
    }
  }

  // Name-matches-tag beats alphabetical: "react" tag -> react.mdx wins.
  const scoreForTag = (doc: IconDoc, tag: string): number => {
    const id = doc.id.toLowerCase();
    const name = doc.name.toLowerCase();
    if (id === tag || name === tag) return 3;
    if (id.startsWith(tag) || name.startsWith(tag)) return 2;
    if (id.includes(tag) || name.includes(tag)) return 1;
    return 0;
  };

  const recommended = new Set<string>();
  const perTag: Array<{
    tag: string;
    total: number;
    popularPicks: string[];
    baselinePicks: string[];
  }> = [];

  for (const [tag, icons] of [...byTag.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const popularPicks = icons
      .filter((i) => i.popular)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_PER_TAG)
      .map((i) => i.id);

    let baselinePicks: string[] = [];
    if (popularPicks.length === 0 && icons.length >= BASELINE_MIN_TAG_SIZE) {
      baselinePicks = [...icons]
        .sort((a, b) => {
          const s = scoreForTag(b, tag) - scoreForTag(a, tag);
          if (s !== 0) return s;
          return a.name.localeCompare(b.name);
        })
        .slice(0, BASELINE_PER_TAG)
        .map((i) => i.id);
    }

    for (const id of popularPicks) recommended.add(id);
    for (const id of baselinePicks) recommended.add(id);
    perTag.push({ tag, total: icons.length, popularPicks, baselinePicks });
  }

  return { recommended, perTag };
}

function upsertRecommendedFlag(frontmatter: string, value: boolean): string {
  const lines = frontmatter.split('\n');
  const idx = lines.findIndex((l) => /^recommended\s*:/.test(l));
  const newLine = `recommended: ${value}`;
  if (idx >= 0) {
    if (!value) {
      lines.splice(idx, 1);
    } else {
      lines[idx] = newLine;
    }
  } else if (value) {
    // Insert before popular if possible, else before tags, else at end.
    const popularIdx = lines.findIndex((l) => /^popular\s*:/.test(l));
    const tagsIdx = lines.findIndex((l) => /^tags\s*:/.test(l));
    const anchor = popularIdx >= 0 ? popularIdx + 1 : tagsIdx >= 0 ? tagsIdx : lines.length;
    lines.splice(anchor, 0, newLine);
  }
  return lines.join('\n');
}

async function writeBack(doc: IconDoc, recommended: boolean) {
  const nextFm = upsertRecommendedFlag(doc.frontmatter, recommended);
  // Only rewrite if changed to keep dev-server noise down.
  if (nextFm === doc.frontmatter) return false;
  const next = `---\n${nextFm}\n---\n${doc.body}`;
  await fs.writeFile(doc.file, next);
  return true;
}

async function run() {
  const docs = await loadIcons();
  const { recommended, perTag } = pickRecommendedPerTag(docs);

  let changed = 0;
  for (const doc of docs) {
    const should = recommended.has(doc.id);
    if (await writeBack(doc, should)) changed++;
  }

  const tagsWithPicks = perTag.filter(
    (t) => t.popularPicks.length > 0 || t.baselinePicks.length > 0,
  );
  const tagsWithoutPicks = perTag.length - tagsWithPicks.length;

  // Readable tabular report — show only tags that got picks, biggest first.
  const rows = tagsWithPicks
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag))
    .map((t) => {
      const src = t.popularPicks.length > 0 ? 'popular' : 'baseline';
      const picks =
        t.popularPicks.length > 0 ? t.popularPicks : t.baselinePicks;
      return `${t.tag.padEnd(26)} ${String(t.total).padStart(4)}  ${src.padEnd(8)}  ${picks.join(', ')}`;
    });

  console.log('');
  console.log(`Icons:                ${docs.length}`);
  console.log(`Unique tags:          ${perTag.length}`);
  console.log(`Tags with picks:      ${tagsWithPicks.length}`);
  console.log(`Tags skipped (small): ${tagsWithoutPicks}`);
  console.log(`Icons recommended:    ${recommended.size}`);
  console.log(`Files rewritten:      ${changed}`);
  console.log('');
  console.log('TAG                         N   SOURCE    PICKS');
  console.log('─'.repeat(90));
  for (const row of rows) console.log(row);
  console.log('');
  console.log('Recommended icon ids:');
  console.log([...recommended].sort().join(', '));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const toPascal = (slug: string) =>
  slug
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

export const GET: APIRoute = async () => {
  const all = await getCollection('icons');
  const active = all.filter((i) => !i.data.deprecated);
  const recommended = active
    .filter((i) => i.data.recommended)
    .sort((a, b) => a.id.localeCompare(b.id));

  // Group recommended by primary tag for scannability.
  const byTag = new Map<string, typeof recommended>();
  for (const icon of recommended) {
    const primary = icon.data.tags[0] ?? 'other';
    const arr = byTag.get(primary) ?? [];
    arr.push(icon);
    byTag.set(primary, arr);
  }
  const tagsSorted = [...byTag.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const tableRows = recommended.map((icon) => {
    const component = `${toPascal(icon.id)}Icon`;
    const tags = icon.data.tags.slice(0, 4).join(', ');
    const aliases = icon.data.aliases?.join(', ') ?? '';
    return `| \`${icon.id}\` | ${icon.data.name} | \`${component}\` | ${tags} | ${aliases} |`;
  });

  const groupedSections = tagsSorted
    .map(([tag, icons]) => {
      const lines = icons
        .map((i) => {
          const name = i.data.name;
          const slug = i.id;
          const desc = i.data.description
            ? ` — ${i.data.description.split('.')[0]}`
            : '';
          return `- \`${slug}\` · **${name}**${desc}`;
        })
        .join('\n');
      return `### ${tag}\n\n${lines}`;
    })
    .join('\n\n');

  const body = `# Devicons recommended icons

${recommended.length} flagship icons across ${tagsSorted.length} primary tags. Use this list as the first lookup when choosing a slug for a given technology — these are the canonical picks curated per category.

The full catalog of ${active.length} icons is browsable at https://devicons.io/icons — fetch any icon not listed here by its slug.

## Quick lookup table

| Slug | Name | React component | Tags | Aliases |
| --- | --- | --- | --- | --- |
${tableRows.join('\n')}

## Grouped by primary tag

${groupedSections}

## Resolving an icon from a free-text query

When the user mentions a technology by name:

1. Normalize to lowercase, strip spaces and punctuation → compare against \`slug\`.
2. If no direct match, check the \`aliases\` field (e.g. "nodejs" resolves to slug \`nodejs\`, but "node" also works via aliases).
3. For generic categories ("a frontend framework", "a database"), pick the first recommended icon in that tag group.
4. For brand/logo requests not in the recommended list, check the full catalog at \`https://devicons.io/search?q=<term>\` or \`https://devicons.io/search-index.json\`.

## Fetching a specific icon as SVG

\`\`\`
https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/icons/<slug>.svg
https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/icons/<slug>-icon.svg
\`\`\`

## Querying the full catalog programmatically

\`\`\`ts
const entries = await fetch("https://devicons.io/search-index.json").then((r) => r.json());
// Array of { id, name, description, icons, tags, popular, recommended, ... }
\`\`\`

This endpoint returns every icon with its metadata — useful for building autocomplete, filters, or fuzzy matching in an agent.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION, GITHUB_URL } from '../consts';
import { markdownResponse } from '../lib/agent-md/response';

export const prerender = true;

export const GET: APIRoute = async () => {
  const icons = await getCollection('icons');
  const active = icons.filter(i => !i.data.deprecated);
  const popular = active.filter(i => i.data.popular).slice(0, 10);

  const md = [
    `# ${SITE_TITLE}`,
    '',
    SITE_DESCRIPTION,
    '',
    `${active.length.toLocaleString()} developer, brand, framework, and tooling SVG logos. MIT licensed.`,
    '',
    '## Sections',
    '',
    '- [Docs](/docs.md) — installation, usage, framework guides, CDN, theming',
    '- [Icons catalog](/icons.md) — browse every icon in the library',
    '- [Packs](/packs.md) — curated bundles (AI Toolkit, JAMstack, MERN, etc.)',
    '- [Skill](/skill.md) — the `skill.md` file for AI agents',
    '- [Legal](/legal.md) — MIT license and brand-asset terms',
    '',
    '## Popular icons',
    '',
    ...popular.map(i => `- [${i.data.name}](/icons/${i.id}.md)`),
    '',
    '## Install',
    '',
    '```bash',
    'npm install @dev.icons/react  # or @dev.icons/vue, @dev.icons/svelte',
    '```',
    '',
    '```ts',
    'import { ReactIcon } from "@dev.icons/react";',
    '',
    '<ReactIcon size={32} />',
    '```',
    '',
    'Every icon also ships as raw SVG, an icon font, and an SVG sprite. See [CDN docs](/docs/cdn.md).',
    '',
    '## For agents',
    '',
    '- Discovery index: [/.well-known/agent-skills](/.well-known/agent-skills)',
    '- Skill reference: [/.well-known/agent-skills/devicons/SKILL.md](/.well-known/agent-skills/devicons/SKILL.md)',
    '- Search index (JSON): [/search-index.json](/search-index.json)',
    '- Every content page has a `.md` counterpart (this file, `/docs/<slug>.md`, `/icons/<slug>.md`, `/packs/<slug>.md`, `/compare/<slug>.md`).',
    '',
    '## Links',
    '',
    `- Source: ${GITHUB_URL}`,
    '- Website: https://devicons.io',
  ].join('\n');

  return markdownResponse(md);
};

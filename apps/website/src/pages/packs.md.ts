import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { markdownResponse } from '../lib/agent-md/response';

export const prerender = true;

export const GET: APIRoute = async () => {
  const packs = await getCollection('packs');
  packs.sort((a, b) => a.data.order - b.data.order);

  const md: string[] = [];
  md.push('[Home](/index.md) › Packs');
  md.push('');
  md.push('# Packs');
  md.push('');
  md.push(
    'Curated bundles of icons grouped by use case. Each pack has a Markdown page listing its icons.',
  );
  md.push('');

  for (const pack of packs) {
    md.push(`## [${pack.data.title}](/packs/${pack.id}.md)`);
    md.push('');
    md.push(pack.data.description);
    if (pack.data.intro) md.push('', `> ${pack.data.intro}`);
    md.push('', `${pack.data.iconIds.length} icons.`);
    md.push('');
  }

  md.push('[← Home](/index.md)');

  return markdownResponse(md.join('\n'));
};

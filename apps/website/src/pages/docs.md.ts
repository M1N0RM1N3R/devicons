import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { markdownResponse } from '../lib/agent-md/response';
import { mdxToMd } from '../lib/agent-md/mdx-to-md';

export const prerender = true;

export const GET: APIRoute = async () => {
  const intro = await getEntry('docs', 'introduction');
  if (!intro) return new Response('Not found', { status: 404 });

  const allDocs = await getCollection('docs');
  const sorted = allDocs.sort((a, b) => {
    const catDelta = a.data.categoryOrder - b.data.categoryOrder;
    if (catDelta !== 0) return catDelta;
    if (a.data.category !== b.data.category)
      return a.data.category.localeCompare(b.data.category);
    return a.data.order - b.data.order;
  });

  // Category → entries (excluding the introduction itself, which IS this page)
  const byCategory = new Map<string, typeof sorted>();
  for (const entry of sorted) {
    if (entry.id === 'introduction') continue;
    const arr = byCategory.get(entry.data.category) ?? [];
    arr.push(entry);
    byCategory.set(entry.data.category, arr);
  }

  const md: string[] = [];
  md.push('[Home](/index.md) › Docs');
  md.push('');
  md.push(`# ${intro.data.title}`);
  if (intro.data.description) md.push('', intro.data.description);
  md.push('');

  const body = mdxToMd(intro.body ?? '');
  if (body.trim()) md.push(body.trim());

  md.push('', '## Contents', '');
  for (const [category, entries] of byCategory) {
    md.push(`### ${category}`);
    md.push('');
    for (const entry of entries) {
      const badge = entry.data.badge ? ` _(${entry.data.badge})_` : '';
      const desc = entry.data.description ? ` — ${entry.data.description}` : '';
      md.push(`- [${entry.data.title}](/docs/${entry.id}.md)${badge}${desc}`);
    }
    md.push('');
  }

  md.push('[← Home](/index.md)');

  return markdownResponse(md.join('\n'));
};

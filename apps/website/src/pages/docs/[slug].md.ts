import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { markdownResponse } from '../../lib/agent-md/response';
import { mdxToMd } from '../../lib/agent-md/mdx-to-md';

export const prerender = true;

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs
    .filter(entry => entry.id !== 'introduction')
    .map(entry => ({
      params: { slug: entry.id },
      props: { entry },
    }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: CollectionEntry<'docs'> };
  const body = mdxToMd(entry.body ?? '');

  // Prev/Next within the same category
  const all = await getCollection('docs');
  const sorted = all
    .filter(e => e.id !== 'introduction')
    .sort((a, b) => {
      const catDelta = a.data.categoryOrder - b.data.categoryOrder;
      if (catDelta !== 0) return catDelta;
      if (a.data.category !== b.data.category)
        return a.data.category.localeCompare(b.data.category);
      return a.data.order - b.data.order;
    });
  const idx = sorted.findIndex(e => e.id === entry.id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const md: string[] = [];
  md.push(
    `[Home](/index.md) › [Docs](/docs.md) › ${entry.data.category} › ${entry.data.title}`,
  );
  md.push('');
  md.push(`# ${entry.data.title}`);
  if (entry.data.badge) md.push('', `_${entry.data.badge}_`);
  if (entry.data.description) md.push('', entry.data.description);
  md.push('');
  if (body.trim()) md.push(body.trim());

  if (prev || next) {
    md.push('', '---', '');
    if (prev)
      md.push(`← Previous: [${prev.data.title}](/docs/${prev.id}.md)`);
    if (next) md.push(`→ Next: [${next.data.title}](/docs/${next.id}.md)`);
  }

  md.push('', '[← All docs](/docs.md)');

  return markdownResponse(md.join('\n'));
};

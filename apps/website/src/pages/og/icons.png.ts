import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgImage } from '../../lib/og/render';
import { ogShell } from '../../lib/og/layout';

export const GET: APIRoute = async () => {
  const icons = await getCollection('icons');
  const count = icons.filter(i => !i.data.deprecated).length;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / icons',
      category: 'Icons',
      title: 'All developer icons',
      description: `${count.toLocaleString()} free developer logos — optimized SVGs and ready-made React, Vue, and Svelte components.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

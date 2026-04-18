import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgImage } from '../../lib/og/render';
import { ogShell } from '../../lib/og/layout';

export const GET: APIRoute = async () => {
  const packs = await getCollection('packs');

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / packs',
      category: 'Packs',
      title: 'Icon packs',
      description: `${packs.length} hand-picked logo sets for the stacks you ship with — MERN, JAMstack, DevOps, modern data, and more.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

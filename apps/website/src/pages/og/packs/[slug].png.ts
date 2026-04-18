import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgImage } from '../../../lib/og/render';
import { ogShell } from '../../../lib/og/layout';

export const getStaticPaths: GetStaticPaths = async () => {
  const packs = await getCollection('packs');
  return packs.map(pack => ({
    params: { slug: pack.id },
    props: { pack },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const pack = (props as { pack: CollectionEntry<'packs'> }).pack;
  const { title, description, intro, iconIds } = pack.data;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / packs',
      category: `Pack · ${iconIds.length} icons`,
      title,
      description: intro ?? description,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

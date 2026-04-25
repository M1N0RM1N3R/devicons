import type { APIRoute, GetStaticPaths } from 'astro';
import { getActiveIcons } from '../../../lib/icons-query';
import { renderOgImage } from '../../../lib/og/render';
import { ogShell } from '../../../lib/og/layout';

interface Props {
  name: string;
  description?: string;
  primaryTag?: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const icons = await getActiveIcons();
  return icons.map(icon => ({
    params: { slug: icon.id },
    props: {
      name: icon.data.name,
      description: icon.data.description,
      primaryTag: icon.data.tags[0],
    } satisfies Props,
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { name, description, primaryTag } = props as Props;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / icons',
      category: primaryTag,
      title: `${name} logo`,
      description:
        description ??
        `Download the ${name} logo as a free SVG, or use the React, Vue, and Svelte components.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

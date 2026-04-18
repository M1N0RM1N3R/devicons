import type { APIRoute, GetStaticPaths } from 'astro';
import {
  getUniqueTags,
  slugifyTag,
  formatTagLabel,
} from '../../../../lib/icons-query';
import { renderOgImage } from '../../../../lib/og/render';
import { ogShell } from '../../../../lib/og/layout';

interface Props {
  label: string;
  count: number;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const tags = await getUniqueTags();
  return tags.map(({ tag, count }) => ({
    params: { tag: slugifyTag(tag) },
    props: { label: formatTagLabel(tag), count } satisfies Props,
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { label, count } = props as Props;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / tags',
      category: `${label} · ${count} icons`,
      title: `${label} icons`,
      description: `Browse ${count} free ${label.toLowerCase()} icons and logos. Optimized SVGs plus React, Vue, and Svelte components — MIT licensed.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

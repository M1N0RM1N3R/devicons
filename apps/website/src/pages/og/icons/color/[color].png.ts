import type { APIRoute, GetStaticPaths } from 'astro';
import { getActiveIcons } from '../../../../lib/icons-query';
import { COLOR_BUCKETS, bucketForHex } from '../../../../lib/colors';
import { renderOgImage } from '../../../../lib/og/render';
import { ogShell } from '../../../../lib/og/layout';

interface Props {
  label: string;
  count: number;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const icons = await getActiveIcons();
  return COLOR_BUCKETS.map(bucket => {
    const count = icons.filter(
      i => bucketForHex(i.data.mainColor) === bucket.slug,
    ).length;
    return {
      params: { color: bucket.slug },
      props: { label: bucket.label, count } satisfies Props,
    };
  }).filter(p => p.props.count > 0);
};

export const GET: APIRoute = async ({ props }) => {
  const { label, count } = props as Props;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / colors',
      category: `${label} · ${count} icons`,
      title: `${label} developer icons`,
      description: `Browse ${count} developer logos with a primary ${label.toLowerCase()} brand color. Free SVGs, React, Vue, and Svelte components.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

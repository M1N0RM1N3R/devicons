import type { APIRoute, GetStaticPaths } from 'astro';
import { getActiveIcons } from '../../../lib/icons-query';
import { COMPARISONS, compareSlug } from '../../../data/comparisons';
import { renderOgImage } from '../../../lib/og/render';
import { ogShell } from '../../../lib/og/layout';

interface Props {
  a: string;
  b: string;
  category: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const icons = await getActiveIcons();
  const byId = new Map(icons.map(i => [i.id, i.data.name]));
  return COMPARISONS.flatMap(cmp => {
    const a = byId.get(cmp.a);
    const b = byId.get(cmp.b);
    if (!a || !b) return [];
    return [
      {
        params: { slug: compareSlug(cmp.a, cmp.b) },
        props: { a, b, category: cmp.category } satisfies Props,
      },
    ];
  });
};

export const GET: APIRoute = async ({ props }) => {
  const { a, b, category } = props as Props;

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / compare',
      category,
      title: `${a} vs ${b}`,
      description: `Two popular ${category} options side-by-side. Free SVG logos and framework components.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

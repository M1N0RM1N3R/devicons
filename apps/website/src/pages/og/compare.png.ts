import type { APIRoute } from 'astro';
import { COMPARISONS } from '../../data/comparisons';
import { renderOgImage } from '../../lib/og/render';
import { ogShell } from '../../lib/og/layout';

export const GET: APIRoute = async () => {
  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / compare',
      category: 'Compare',
      title: 'Icon comparisons',
      description: `${COMPARISONS.length} curated pairs of developer tools — React vs Vue, Postgres vs MongoDB, Docker vs Kubernetes, and more. Grab either logo as a free SVG.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

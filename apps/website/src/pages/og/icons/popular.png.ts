import type { APIRoute } from 'astro';
import { getPopularIcons } from '../../../lib/icons-query';
import { renderOgImage } from '../../../lib/og/render';
import { ogShell } from '../../../lib/og/layout';

export const GET: APIRoute = async () => {
  const icons = await getPopularIcons();
  const preview = icons
    .slice(0, 6)
    .map(i => i.name)
    .join(', ');

  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / icons',
      category: 'Popular',
      title: 'Popular developer icons',
      description: `The logos developers reach for most — ${preview}, and more.`,
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

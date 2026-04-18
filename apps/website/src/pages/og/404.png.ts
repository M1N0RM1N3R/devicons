import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og/render';
import { ogShell } from '../../lib/og/layout';

export const GET: APIRoute = async () => {
  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / 404',
      category: 'Error / 404',
      title: 'Page not found',
      description: "That route isn't part of the Devicons catalog.",
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

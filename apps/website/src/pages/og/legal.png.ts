import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og/render';
import { ogShell } from '../../lib/og/layout';

export const GET: APIRoute = async () => {
  const png = await renderOgImage(
    ogShell({
      eyebrow: 'devicons.io / legal',
      category: 'Legal',
      title: 'License and terms',
      description: 'MIT License. Privacy. Brand guidelines.',
    }),
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};

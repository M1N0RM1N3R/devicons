import type { APIRoute } from 'astro';
import { getSkillMarkdown } from '../lib/skill-content';

export const prerender = true;

export const GET: APIRoute = async () => {
  const body = await getSkillMarkdown();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};

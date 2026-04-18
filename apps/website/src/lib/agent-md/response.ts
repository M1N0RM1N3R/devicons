import { approxTokens } from './tokens';

export function markdownResponse(body: string): Response {
  const text = body.endsWith('\n') ? body : `${body}\n`;
  return new Response(text, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'x-markdown-tokens': String(approxTokens(text)),
      Vary: 'Accept',
    },
  });
}

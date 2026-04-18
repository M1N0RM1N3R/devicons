/**
 * Cloudflare Pages Function: global middleware
 *
 * Implements Markdown-for-Agents content negotiation. When a client sends
 * `Accept: text/markdown` (or prefers it over `text/html` via q-values), this
 * middleware converts the underlying HTML response into Markdown at the edge
 * and returns it with `Content-Type: text/markdown; charset=utf-8`. Browsers
 * (which send `Accept: text/html,...`) always continue to receive HTML.
 *
 * The conversion uses the unified pipeline (`rehype-parse` → `rehype-remark`
 * → `remark-stringify` + `remark-gfm`), which is pure JS and runs inside the
 * Workers runtime without DOM polyfills.
 */

import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';

interface MiddlewareContext {
  request: Request;
  next: () => Promise<Response>;
}

const processor = unified()
  .use(rehypeParse, { fragment: false })
  .use(rehypeRemark, {
    handlers: {
      // Drop scripts/styles entirely — they have no markdown equivalent and
      // the unified default is to serialize them as text, which leaks JS into
      // the output.
      script: () => undefined,
      style: () => undefined,
      noscript: () => undefined,
    },
  })
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    fences: true,
    incrementListMarker: false,
    rule: '-',
  });

/**
 * Returns true if the client prefers `text/markdown` over `text/html` in its
 * Accept header (per RFC 9110 q-value comparison). A plain `Accept: */*` does
 * NOT trigger conversion — browsers send that as a fallback and we don't want
 * to break the default browsing experience.
 */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  let mdQ = -1;
  let htmlQ = -1;
  for (const raw of accept.split(',')) {
    const parts = raw.trim().split(';').map(s => s.trim());
    const type = parts[0]?.toLowerCase();
    if (!type) continue;
    let q = 1;
    for (let i = 1; i < parts.length; i++) {
      const m = parts[i].match(/^q=([0-9.]+)$/i);
      if (m) q = parseFloat(m[1]);
    }
    if (type === 'text/markdown' || type === 'text/x-markdown') {
      mdQ = Math.max(mdQ, q);
    } else if (type === 'text/html') {
      htmlQ = Math.max(htmlQ, q);
    }
  }
  return mdQ > 0 && mdQ >= htmlQ;
}

/**
 * Heuristic token estimate. Real BPE tokenizers vary by model, but ~4 chars
 * per token is a reasonable rule-of-thumb for English prose and is what
 * Anthropic/OpenAI cite for back-of-envelope sizing.
 */
function approxTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

async function convertToMarkdown(html: string): Promise<string> {
  const file = await processor.process(html);
  return String(file).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export const onRequest = async (
  context: MiddlewareContext,
): Promise<Response> => {
  const { request, next } = context;

  // Always pass through non-GET (and HEAD, which we still want to advertise).
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const wantsMd = prefersMarkdown(request.headers.get('Accept'));

  const response = await next();

  // Tell caches that response varies on Accept, regardless of which branch.
  const baseHeaders = new Headers(response.headers);
  const existingVary = baseHeaders.get('Vary');
  baseHeaders.set(
    'Vary',
    existingVary && !/\baccept\b/i.test(existingVary)
      ? `${existingVary}, Accept`
      : existingVary ?? 'Accept',
  );

  if (!wantsMd) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: baseHeaders,
    });
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().includes('text/html') || !response.ok) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: baseHeaders,
    });
  }

  // HEAD: convert headers but skip body (HTTP semantics).
  if (request.method === 'HEAD') {
    baseHeaders.set('Content-Type', 'text/markdown; charset=utf-8');
    baseHeaders.delete('Content-Length');
    baseHeaders.delete('Content-Encoding');
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers: baseHeaders,
    });
  }

  let markdown: string;
  try {
    const html = await response.text();
    markdown = await convertToMarkdown(html);
  } catch {
    // If conversion blows up for any reason, fail open with the original HTML
    // rather than serving a 500 to an agent.
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: baseHeaders,
    });
  }

  baseHeaders.set('Content-Type', 'text/markdown; charset=utf-8');
  baseHeaders.set('x-markdown-tokens', String(approxTokens(markdown)));
  baseHeaders.delete('Content-Length');
  baseHeaders.delete('Content-Encoding');

  return new Response(markdown, {
    status: response.status,
    statusText: response.statusText,
    headers: baseHeaders,
  });
};

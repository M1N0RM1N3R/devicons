/**
 * Cloudflare Pages Function: /og/icons/<slug>.png
 *
 * Replaces the build-time prerender of 1,200+ icon OG images (satori + sharp
 * in CI) with on-demand rendering at the edge. First hit per slug pays the
 * ~200-400ms render cost; every subsequent hit is served from the Cloudflare
 * edge cache thanks to the immutable Cache-Control header below.
 *
 * Requires the Cloudflare Pages project to have the `nodejs_compat`
 * compatibility flag enabled (Settings → Functions → Compatibility flags).
 */

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
// The Cloudflare build toolchain rewrites `.wasm` imports into
// WebAssembly.Module instances at deploy time.
// @ts-expect-error — wasm import handled by the CF build
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';

const OG = {
  width: 1200,
  height: 630,
  bg: '#000000',
  border: '#1a1a1a',
  text: '#e6e6e6',
  textMuted: '#8a8a8a',
  accent: '#ff4d00',
  // Mirrors `.icon-grid-card--bad-dark` in global.css: a near-white slab
  // behind icons flagged `badInDark` so they stay legible on the dark canvas.
  badInDarkSlab: '#f5f5f5',
  fontDisplay: 'Display',
  fontMono: 'Mono',
} as const;

interface IndexEntry {
  id: string;
  name: string;
  description?: string;
  icons?: string[];
  tags?: string[];
  badInDark?: boolean;
}

// Module scope — reused across requests on the same isolate.
let wasmReady: Promise<unknown> | null = null;
let fontCache: { displayFont: ArrayBuffer; monoFont: ArrayBuffer } | null = null;
let indexCache: IndexEntry[] | null = null;

function ensureWasm() {
  if (!wasmReady) {
    wasmReady = initWasm(resvgWasm as WebAssembly.Module);
  }
  return wasmReady;
}

async function loadFonts(origin: string) {
  if (fontCache) return fontCache;
  const [d, m] = await Promise.all([
    fetch(`${origin}/fonts/bricolage-grotesque.ttf`),
    fetch(`${origin}/fonts/ibm-plex-mono-600.woff`),
  ]);
  if (!d.ok || !m.ok) {
    throw new Error(`font fetch failed: display=${d.status}, mono=${m.status}`);
  }
  fontCache = {
    displayFont: await d.arrayBuffer(),
    monoFont: await m.arrayBuffer(),
  };
  return fontCache;
}

async function loadIndex(origin: string) {
  if (indexCache) return indexCache;
  const res = await fetch(`${origin}/search-index.json`);
  if (!res.ok) throw new Error(`search-index fetch failed (${res.status})`);
  indexCache = (await res.json()) as IndexEntry[];
  return indexCache;
}

async function fetchIconAsDataUri(
  slug: string,
  origin: string,
): Promise<string | null> {
  const res = await fetch(`${origin}/devicons/icons/${slug}.svg`);
  if (!res.ok) return null;
  const text = await res.text();
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

function buildJsx(
  name: string,
  description: string | undefined,
  iconImages: string[],
  tagList: string,
  badInDark: boolean,
) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: OG.bg,
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(${OG.border} 1px, transparent 1px), linear-gradient(90deg, ${OG.border} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              opacity: 0.3,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              flex: 1,
              position: 'relative',
              justifyContent: 'space-between',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '40px',
                          height: '40px',
                          backgroundColor: OG.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          clipPath:
                            'polygon(0 0, 100% 0, 100% 100%, 12% 100%, 0 88%)',
                        },
                        children: {
                          type: 'span',
                          props: {
                            style: {
                              fontFamily: OG.fontDisplay,
                              fontSize: '28px',
                              color: OG.bg,
                            },
                            children: 'D',
                          },
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontFamily: OG.fontMono,
                          fontSize: '13px',
                          color: OG.textMuted,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                        },
                        children: 'devicons.io',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                width: '12px',
                                height: '2px',
                                backgroundColor: OG.accent,
                              },
                            },
                          },
                          {
                            type: 'span',
                            props: {
                              style: {
                                fontFamily: OG.fontMono,
                                fontSize: '13px',
                                color: OG.accent,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                              },
                              children: 'Icon',
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'h1',
                      props: {
                        style: {
                          fontFamily: OG.fontDisplay,
                          fontSize: '56px',
                          color: OG.text,
                          lineHeight: 0.95,
                          letterSpacing: '-0.04em',
                          margin: 0,
                          maxWidth: '500px',
                        },
                        children: name,
                      },
                    },
                    ...(description
                      ? [
                          {
                            type: 'p',
                            props: {
                              style: {
                                fontFamily: OG.fontDisplay,
                                fontSize: '20px',
                                color: OG.textMuted,
                                margin: 0,
                                maxWidth: '450px',
                                lineHeight: 1.4,
                              },
                              children: description,
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  },
                  children: tagList
                    ? {
                        type: 'span',
                        props: {
                          style: {
                            fontFamily: OG.fontMono,
                            fontSize: '12px',
                            color: OG.textMuted,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          },
                          children: tagList,
                        },
                      }
                    : [],
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              width: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderLeft: `1px solid ${OG.border}`,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center',
                    ...(badInDark
                      ? {
                          padding: '40px',
                          paddingLeft: '37px',
                          backgroundColor: OG.badInDarkSlab,
                          borderLeft: `3px solid ${OG.accent}`,
                        }
                      : {}),
                  },
                  children: iconImages.map((src) => ({
                    type: 'img',
                    props: {
                      src,
                      width: 180,
                      height: 180,
                      style: { objectFit: 'contain' },
                    },
                  })),
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: OG.accent,
            },
          },
        },
      ],
    },
  };
}

// Cloudflare Pages Functions runtime types — lightweight so this file
// compiles under the Astro website's existing tsconfig without pulling
// @cloudflare/workers-types.
interface PagesContext {
  request: Request;
  params: { slug?: string };
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const slug = context.params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const origin = new URL(context.request.url).origin;

  try {
    const index = await loadIndex(origin);
    const entry = index.find((i) => i.id === slug);
    if (!entry) {
      return new Response('Not found', { status: 404 });
    }

    const slugs = entry.icons ?? [];
    const preferred = slugs.find((s) => s.endsWith('-icon')) ?? slugs[0];
    const iconImages: string[] = [];
    if (preferred) {
      const src = await fetchIconAsDataUri(preferred, origin);
      if (src) iconImages.push(src);
    }

    const tagList = (entry.tags ?? []).slice(0, 4).join(' / ');

    await ensureWasm();
    const { displayFont, monoFont } = await loadFonts(origin);

    // satori's types expect React-ish JSX but accepts plain objects with
    // { type, props } — we pass the latter to avoid pulling React.
    const svg = await satori(
      buildJsx(
        entry.name,
        entry.description,
        iconImages,
        tagList,
        entry.badInDark ?? false,
      ) as Parameters<typeof satori>[0],
      {
        width: OG.width,
        height: OG.height,
        fonts: [
          { name: OG.fontDisplay, data: displayFont, weight: 900 },
          { name: OG.fontMono, data: monoFont, weight: 600 },
        ],
      },
    );

    const png = new Resvg(svg).render().asPng();

    return new Response(png as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        // Browser cache is modest (1 day); the CDN edge holds it for a
        // full year. Bust by changing the icon slug/content if ever needed.
        'Cache-Control': 'public, max-age=86400',
        'CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`OG render failed: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};

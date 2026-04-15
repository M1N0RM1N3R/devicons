// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svgr from 'vite-plugin-svgr';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';
import { deviconsDark, deviconsLight } from './src/lib/shiki-themes.ts';

// https://astro.build/config
export default defineConfig({
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  site: 'https://devicons.io',
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    shikiConfig: {
      themes: {
        dark: deviconsDark,
        light: deviconsLight,
      },
      defaultColor: 'dark',
      wrap: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Bricolage Grotesque Variable',
      cssVariable: '--font-display',
      weights: ['200 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/og/') &&
        !page.includes('/search-index') &&
        !page.endsWith('/404') &&
        !page.endsWith('/404/'),
      changefreq: 'weekly',
      serialize(item) {
        const url = item.url;
        if (/\/(?:$|index)?$/.test(new URL(url).pathname)) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (url.includes('/docs')) {
          item.priority = 0.8;
        } else if (url.includes('/icons/')) {
          item.priority = 0.7;
        } else {
          item.priority = 0.5;
        }
        return item;
      },
    }),
    react(),
    svelte(),
  ],

  vite: {
    plugins: [
      tailwindcss(),
      svgr({
        include: '**/*.svg?react',
        svgrOptions: {
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
          svgoConfig: {
            plugins: [
              'preset-default',
              'removeTitle',
              'removeDesc',
              'removeDoctype',
              'cleanupIds',
            ],
          },
        },
      }),
    ],
  },
});

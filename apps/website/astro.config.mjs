// @ts-check
import { defineConfig } from 'astro/config';
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
  integrations: [mdx(), sitemap(), react(), svelte()],

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

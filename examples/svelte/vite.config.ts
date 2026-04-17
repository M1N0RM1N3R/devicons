import path from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  server: { port: 5183 },
  resolve: {
    alias: {
      "@dev.icons/svelte/mono": path.resolve(__dirname, "../../packages/svelte/src/mono.ts"),
      "@dev.icons/svelte": path.resolve(__dirname, "../../packages/svelte/src/index.ts"),
    },
  },
});

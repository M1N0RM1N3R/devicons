import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: { port: 5182 },
  resolve: {
    alias: {
      "@dev.icons/vue/mono": path.resolve(__dirname, "../../packages/vue/src/mono.ts"),
      "@dev.icons/vue": path.resolve(__dirname, "../../packages/vue/src/index.ts"),
    },
  },
});

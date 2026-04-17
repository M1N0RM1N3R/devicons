import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5184 },
  resolve: {
    alias: {
      "@dev.icons/react/mono": path.resolve(__dirname, "../../packages/react/src/mono.ts"),
      "@dev.icons/react": path.resolve(__dirname, "../../packages/react/src/index.ts"),
    },
  },
});

import { resolve } from "path";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: "./tsconfig.json", insertTypesEntry: true, copyDtsFiles: false }),
  ],
  build: {
    target: "ES2017",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: (format, name) => `${name}.${format === "umd" ? "cjs" : "mjs"}`,
    },
    rollupOptions: {
      external: Object.keys(pkg.peerDependencies),
      input: "./src/index.ts",
      output: [
        {
          format: "es",
          preserveModules: true,
          preserveModulesRoot: "src",
          globals: {
            vue: "Vue",
          },
        },
        {
          format: "umd",
          name: "DeviconsVue",
          globals: {
            vue: "Vue",
          },
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});

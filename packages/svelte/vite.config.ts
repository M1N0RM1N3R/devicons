import { resolve } from "path";
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

export default defineConfig({
  plugins: [
    svelte(),
    dts({ tsconfigPath: "./tsconfig.json", insertTypesEntry: true, copyDtsFiles: false }),
  ],
  build: {
    target: "ES2017",
    lib: {
      entry: [resolve(__dirname, "src/index.ts"), resolve(__dirname, "src/mono.ts")],
      fileName: (format, name) => `${name}.${format === "cjs" ? "cjs" : "mjs"}`,
    },
    rollupOptions: {
      external: [...Object.keys(pkg.peerDependencies), "svelte/internal"],
      input: {
        index: "./src/index.ts",
        mono: "./src/mono.ts",
      },
      output: [
        {
          format: "es",
          preserveModules: true,
          preserveModulesRoot: "src",
          globals: {
            svelte: "Svelte",
          },
        },
        {
          format: "cjs",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].cjs",
          globals: {
            svelte: "Svelte",
          },
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
    server: {
      deps: {
        inline: [/^svelte/],
      },
    },
  },
  resolve: {
    conditions: ["browser", "module", "import"],
  },
});

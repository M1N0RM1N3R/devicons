import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

export default defineConfig({
  plugins: [
    react({ jsxRuntime: "classic" }),
    dts({ tsconfigPath: "./tsconfig.json", insertTypesEntry: true, copyDtsFiles: false }),
  ],
  build: {
    target: "ES2017",
    lib: {
      entry: [resolve(__dirname, "src/index.ts"), resolve(__dirname, "src/mono.ts")],
      fileName: (format, name) => `${name}.${format === "cjs" ? "cjs" : "mjs"}`,
    },
    rollupOptions: {
      external: Object.keys(pkg.peerDependencies),
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
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
        {
          format: "cjs",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].cjs",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
  },
});

import path from "node:path";
import { writeFile } from "node:fs/promises";
import fastGlob from "fast-glob";
import { unlink } from "node:fs/promises";
import { ensureDir } from "@dev.icons/utils";
import type { Framework, IconRecord, Generator } from "./types";
import { reactGenerator } from "./generators/react";
import { vueGenerator } from "./generators/vue";
import { svelteGenerator } from "./generators/svelte";

const GENERATORS: Record<Framework, Generator> = {
  react: reactGenerator,
  vue: vueGenerator,
  svelte: svelteGenerator,
};

export interface GenerateOptions {
  framework: Framework;
  outDir: string;
  icons: IconRecord[];
  batchSize?: number;
  pretty?: boolean;
}

const cleanDir = async (dir: string, patterns: string[]) => {
  const files = await fastGlob(
    patterns.map((p) => path.join(dir, p))
  );
  await Promise.all(files.map((f) => unlink(f).catch(() => {})));
};

const writeBatched = async <T>(
  items: T[],
  batchSize: number,
  write: (item: T) => Promise<void>
) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    await Promise.all(slice.map(write));
  }
};

export const generate = async (options: GenerateOptions): Promise<number> => {
  const { framework, outDir, icons } = options;
  const batchSize = options.batchSize ?? 200;
  const generator = GENERATORS[framework];

  const defsDir = path.join(outDir, "defs");
  const iconsDir = path.join(
    outDir,
    framework === "react" ? "ssr" : "icons"
  );

  ensureDir(defsDir);
  ensureDir(iconsDir);

  await Promise.all([
    cleanDir(defsDir, ["*.ts", "*.tsx"]),
    cleanDir(iconsDir, ["*.ts", "*.tsx", "*.vue", "*.svelte"]),
  ]);

  const pretty = options.pretty ?? false;
  let formatter: ((s: string, parser: string) => Promise<string>) | null = null;
  if (pretty) {
    const prettier = (await import("prettier")).default;
    formatter = async (s, parser) =>
      prettier.format(s, { parser: parser as any });
  }

  const resolved = icons.map((i) => ({
    ...i,
    componentName: generator.resolveName(i.componentName),
  }));

  await writeBatched(resolved, batchSize, async (icon) => {
    const { defs, component } = generator.emit(icon);

    const defsContent = formatter
      ? await formatter(defs, "babel-ts")
      : defs;
    const componentContent =
      formatter && generator.extension === "tsx"
        ? await formatter(component, "babel-ts")
        : component;

    await Promise.all([
      writeFile(
        path.join(defsDir, `${icon.componentName}.${generator.defsExtension}`),
        defsContent
      ),
      writeFile(
        path.join(iconsDir, `${icon.componentName}.${generator.extension}`),
        componentContent
      ),
    ]);
  });

  const names = resolved.map((i) => i.componentName);
  const barrelContent = generator.emitBarrel(names);
  await writeFile(path.join(iconsDir, "index.ts"), barrelContent);

  return icons.length;
};

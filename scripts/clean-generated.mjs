#!/usr/bin/env node
import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const targets = [
  "packages/react/src/defs",
  "packages/react/src/ssr",
  "packages/vue/src/defs",
  "packages/vue/src/icons",
  "packages/svelte/src/defs",
  "packages/svelte/src/icons",
];

const KEEP = new Set([".gitkeep"]);

const cleanDir = async (dir) => {
  let removed = 0;
  for (const entry of await readdir(dir)) {
    if (KEEP.has(entry)) continue;
    await rm(join(dir, entry), { recursive: true, force: true });
    removed++;
  }
  return removed;
};

const total = (
  await Promise.all(
    targets.map(async (d) => {
      const n = await cleanDir(d);
      console.log(`cleaned ${n} entries in ${d}`);
      return n;
    }),
  )
).reduce((a, b) => a + b, 0);

console.log(`done — removed ${total} generated entries`);

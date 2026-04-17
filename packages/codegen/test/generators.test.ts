import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { loadIcons, generate } from "../src/index";
import { reactGenerator } from "../src/generators/react";
import { vueGenerator } from "../src/generators/vue";
import { svelteGenerator } from "../src/generators/svelte";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

describe("loadIcons", () => {
  it("loads paired icon+font svgs sorted by filename", async () => {
    const icons = await loadIcons({
      iconsDir: path.join(FIXTURES, "icons"),
      fontDir: path.join(FIXTURES, "font"),
    });
    expect(icons).toHaveLength(2);
    expect(icons.map((i) => i.baseName)).toEqual(["hexa-bolt", "sample"]);
    expect(icons[0].componentName).toBe("HexaBolt");
    expect(icons[0].iconSvg).toContain("<circle");
    expect(icons[0].fontSvg).toContain("<circle");
  });
});

describe("generator output snapshots", () => {
  const icon = {
    filename: "sample.svg",
    baseName: "sample",
    componentName: "DeviconsSample",
    iconSvg: '<path d="M3 3h18v18H3z" clip-rule="evenodd"/>',
    fontSvg: '<path d="M100 100h800v800H100z"/>',
  };

  it("reactGenerator colorful matches snapshot", () => {
    const component = reactGenerator.emitComponent(icon, "icon");
    expect(component).toMatchSnapshot("react-colorful");
    expect(component).toContain("clipRule");
  });

  it("reactGenerator mono matches snapshot", () => {
    const component = reactGenerator.emitComponent(icon, "font");
    expect(component).toMatchSnapshot("react-mono");
    expect(component).toContain("M100 100");
  });

  it("vueGenerator colorful matches snapshot", () => {
    const component = vueGenerator.emitComponent(icon, "icon");
    expect(component).toMatchSnapshot("vue-colorful");
    expect(component).toContain("clip-rule");
  });

  it("vueGenerator mono matches snapshot", () => {
    const component = vueGenerator.emitComponent(icon, "font");
    expect(component).toMatchSnapshot("vue-mono");
  });

  it("svelteGenerator colorful matches snapshot", () => {
    const component = svelteGenerator.emitComponent(icon, "icon");
    expect(component).toMatchSnapshot("svelte-colorful");
  });

  it("svelteGenerator mono matches snapshot", () => {
    const component = svelteGenerator.emitComponent(icon, "font");
    expect(component).toMatchSnapshot("svelte-mono");
  });

  it("vue/svelte escape backticks and ${ in source", () => {
    const evil = {
      ...icon,
      iconSvg: '<path d="`${injected}`"/>',
      fontSvg: "<path/>",
    };
    expect(vueGenerator.emitComponent(evil, "icon")).toContain("\\`");
    expect(vueGenerator.emitComponent(evil, "icon")).toContain("\\${");
    expect(svelteGenerator.emitComponent(evil, "icon")).toContain("\\`");
  });

  it("barrel exports list all component names", () => {
    const names = ["DeviconsA", "DeviconsB"];
    expect(reactGenerator.emitBarrel(names)).toContain('export * from "./DeviconsA"');
    expect(vueGenerator.emitBarrel(names)).toContain(
      'export { default as DeviconsA } from "./DeviconsA.vue"'
    );
    expect(svelteGenerator.emitBarrel(names)).toContain(
      'export { default as DeviconsA } from "./DeviconsA.svelte"'
    );
  });
});

describe("generate writes to disk", () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devicons-codegen-"));
  });
  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("emits colorful + mono components + barrels for each framework", async () => {
    const icons = await loadIcons({
      iconsDir: path.join(FIXTURES, "icons"),
      fontDir: path.join(FIXTURES, "font"),
    });

    const reactOut = path.join(tmp, "react");
    const vueOut = path.join(tmp, "vue");
    const svelteOut = path.join(tmp, "svelte");

    const [rc, vc, sc] = await Promise.all([
      generate({ framework: "react", outDir: reactOut, icons }),
      generate({ framework: "vue", outDir: vueOut, icons }),
      generate({ framework: "svelte", outDir: svelteOut, icons }),
    ]);

    expect(rc).toBe(2);
    expect(vc).toBe(2);
    expect(sc).toBe(2);

    expect(fs.existsSync(path.join(reactOut, "ssr/Sample.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(reactOut, "mono/Sample.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(reactOut, "ssr/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(reactOut, "mono/index.ts"))).toBe(true);

    expect(fs.existsSync(path.join(vueOut, "icons/Sample.vue"))).toBe(true);
    expect(fs.existsSync(path.join(vueOut, "mono/Sample.vue"))).toBe(true);

    expect(fs.existsSync(path.join(svelteOut, "icons/Sample.svelte"))).toBe(true);
    expect(fs.existsSync(path.join(svelteOut, "mono/Sample.svelte"))).toBe(true);
  });
});

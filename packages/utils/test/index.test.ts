import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {
  iconToComponentName,
  getSvgContents,
  normalizeProps,
  ensureDir,
  checkIfFileExists,
  nukeFolder,
} from "../src/index";

describe("iconToComponentName", () => {
  it("converts a basic icon filename", () => {
    expect(iconToComponentName("nodejs.svg")).toBe("Nodejs");
  });

  it("handles -icon suffix", () => {
    expect(iconToComponentName("adonisjs-icon.svg")).toBe("AdonisjsIcon");
  });

  it("handles -alt suffix", () => {
    expect(iconToComponentName("react-alt.svg")).toBe("ReactAlt");
  });

  it("handles multi-hyphen names", () => {
    expect(iconToComponentName("vuetify-wordmark.svg")).toBe(
      "VuetifyWordmark"
    );
  });

  it("escapes framework-reserved names", () => {
    expect(iconToComponentName("react.svg")).toBe("_React");
    expect(iconToComponentName("vue.svg")).toBe("_Vue");
    expect(iconToComponentName("svelte.svg")).toBe("_Svelte");
    expect(iconToComponentName("astro.svg")).toBe("_Astro");
  });
});

describe("getSvgContents", () => {
  it("extracts inner body", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 2"/></svg>';
    expect(getSvgContents(svg)).toBe('<path d="M1 2"/>');
  });

  it("handles nested elements across lines", () => {
    const svg = `<svg viewBox="0 0 24 24">\n<g><path d="M1"/></g>\n</svg>`;
    expect(getSvgContents(svg)).toContain("<g>");
  });

  it("throws on invalid SVG", () => {
    expect(() => getSvgContents("<div></div>")).toThrow();
  });
});

describe("normalizeProps", () => {
  it("converts hyphen-case to camelCase for known attrs", () => {
    const input =
      '<path clip-rule="evenodd" fill-rule="nonzero" stroke-width="2"/>';
    const out = normalizeProps(input);
    expect(out).toContain("clipRule");
    expect(out).toContain("fillRule");
    expect(out).toContain("strokeWidth");
  });

  it("converts all known SVG attributes", () => {
    const input =
      "clip-rule clip-path fill-rule fill-opacity stroke-linecap stop-opacity stop-color stroke-linejoin stroke-width stroke-miterlimit";
    const out = normalizeProps(input);
    expect(out).not.toContain("-");
  });
});

describe("fs helpers", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devicons-utils-"));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("ensureDir creates nested directories", () => {
    const target = path.join(tmp, "a/b/c");
    ensureDir(target);
    expect(fs.existsSync(target)).toBe(true);
  });

  it("ensureDir is idempotent", () => {
    const target = path.join(tmp, "once");
    ensureDir(target);
    expect(() => ensureDir(target)).not.toThrow();
  });

  it("checkIfFileExists distinguishes existing and missing", () => {
    const f = path.join(tmp, "hello.txt");
    expect(checkIfFileExists(f)).toBe(false);
    fs.writeFileSync(f, "hi");
    expect(checkIfFileExists(f)).toBe(true);
  });

  it("nukeFolder removes and recreates", () => {
    const target = path.join(tmp, "nuke");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "x"), "1");
    nukeFolder(target);
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readdirSync(target)).toHaveLength(0);
  });
});

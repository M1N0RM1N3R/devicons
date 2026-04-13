import { describe, it, expect, afterEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  iconToComponentName,
  getSvgContents,
  ensureDir,
  checkIfFileExists,
  nukeFolder,
} from "../src";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("iconToComponentName", () => {
  it("should convert icon name to component name", () => {
    expect(iconToComponentName("super-icon")).toBe("SuperIcon");
  });

  it("should convert icon name to component name with multiple words", () => {
    expect(iconToComponentName("another-super-icon")).toBe(
      "AnotherSuperIcon"
    );
  });

  it("should convert filenames to component names", () => {
    expect(iconToComponentName("alt-icon.svg")).toBe("AltIcon");
  });

  it("escapes framework-reserved names", () => {
    expect(iconToComponentName("react.svg")).toBe("_React");
    expect(iconToComponentName("vue.svg")).toBe("_Vue");
    expect(iconToComponentName("svelte.svg")).toBe("_Svelte");
    expect(iconToComponentName("astro.svg")).toBe("_Astro");
  });

  it("does not escape compound names that contain a reserved word", () => {
    expect(iconToComponentName("react-native.svg")).toBe("ReactNative");
    expect(iconToComponentName("astro-icon.svg")).toBe("AstroIcon");
  });
});

describe("getSvgContents", () => {
  it("should return the SVG contents of an icon", () => {
    expect(
      getSvgContents(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><path d='M184'></path></svg>"
      )
    ).toBe("<path d='M184'></path>");
  });

  it("should throw an error if no SVG is found", () => {
    expect(() => getSvgContents("")).toThrow();
  });

  it("should work with multiple children", () => {
    expect(
      getSvgContents(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'>
            <path d='M184'></path>
            <path d='M184'></path>
            <path d='M184'></path>
        </svg>`
      )
    ).toMatchInlineSnapshot(`
      "
                  <path d='M184'></path>
                  <path d='M184'></path>
                  <path d='M184'></path>
              "
    `);
  });
});

describe("ensureDir", () => {
  afterEach(() => {
    nukeFolder("test-dir");
  });

  it("should create a directory if it doesn't exist", () => {
    ensureDir("test-dir");
    expect(fs.existsSync("test-dir")).toBe(true);
  });
});

describe("checkIfFileExists", () => {
  const id = Date.now();
  const mock = path.join(__dirname, `test-file-${id}.txt`);
  fs.writeFileSync(mock, "test");

  afterAll(() => {
    try {
      fs.unlinkSync(mock);
    } catch (error) {}
  });

  it("should return false if the file doesn't exist", () => {
    const file = path.join(__dirname, "nonexistent-file.txt");
    expect(checkIfFileExists(file)).toBe(false);
  });
  it("should check mock file", () => {
    const filePath = path.join(__dirname, "nonexistent-file.txt");
    expect(checkIfFileExists(filePath)).toBe(false);
  });
});

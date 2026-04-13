import fs from "fs";

/*
 * Names that collide with a framework's own global identifier.
 * These must be escaped so `import { React } from "@dev.icons/react"`
 * (or the Vue / Svelte / Astro equivalents) can never shadow the
 * framework itself. Any other icon name is emitted unchanged.
 */
export const RESERVED_COMPONENT_NAMES = new Set([
  "React",
  "Vue",
  "Svelte",
  "Astro",
]);

export const escapeReservedComponentName = (name: string) =>
  RESERVED_COMPONENT_NAMES.has(name) ? `_${name}` : name;

/* Convert an icon name to Component Name
 * eg. super-icon -> SuperIcon
 * eg. react      -> _React (reserved)
 */
export const iconToComponentName = (icon: string) => {
  const withoutExtension = icon.split(".")[0];
  const pascal = withoutExtension
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return escapeReservedComponentName(pascal);
};

/*
 * Get the SVG contents of an icon as string
 * eg getSvgContents('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><path d="M184"></path></svg>')
 * returns '<path d="M184"></path>'
 */
export const getSvgContents = (icon: string) => {
  const svgContent = icon.match(/<svg[^>]*>(.*?)<\/svg>/s);
  if (!svgContent) {
    throw new Error("No SVG found in icon");
  }
  return svgContent[1];
};

export const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const checkIfFileExists = (filePath: string) => {
  return fs.existsSync(filePath);
};

export const nukeFolder = (folder: string) => {
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  ensureDir(folder);
};

export const normalizeProps = (svg: string) => {
  return svg
    .replace(/clip-rule/g, "clipRule")
    .replace(/clip-path/g, "clipPath")
    .replace(/fill\-rule/g, "fillRule")
    .replace(/fill-opacity/g, "fillOpacity")
    .replace(/stroke-linecap/g, "strokeLinecap")
    .replace(/stop-opacity/g, "stopOpacity")
    .replace(/stop-color/g, "stopColor")
    .replace(/stroke-linejoin/g, "strokeLinejoin")
    .replace(/stroke-width/g, "strokeWidth")
    .replace(/stroke-miterlimit/g, "strokeMiterlimit");
};

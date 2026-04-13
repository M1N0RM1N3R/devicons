import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { fileURLToPath } from "node:url";
import fastGlob from "fast-glob";
import { checkIfFileExists } from "./utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

const CORE_EXPORT = path.join(ROOT, "packages/core/export-files");
const SITE_ROOT = path.resolve(__dirname, "..");
const PUBLIC_ICONS = path.join(SITE_ROOT, "public/devicons/icons");
const PUBLIC_FONT = path.join(SITE_ROOT, "public/devicons/font");
const ASSETS_DIR = path.join(SITE_ROOT, "assets");
const MDX_DIR = path.join(SITE_ROOT, "src/content/icons");

const ensure = (p: string) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

const copyAll = async (src: string, dest: string, ext: string) => {
  ensure(dest);
  const files = await fastGlob(path.join(src, `*.${ext}`));
  await Promise.all(
    files.map((f) =>
      fsp.copyFile(f, path.join(dest, path.basename(f)))
    )
  );
  return files.length;
};

const scaffoldMdx = async () => {
  ensure(MDX_DIR);
  const icons = await fastGlob(path.join(CORE_EXPORT, "icons/*.svg"));
  icons.sort();
  let created = 0;
  for (const icon of icons) {
    const basename = path.basename(icon, ".svg");
    if (basename.includes("-icon") || basename.includes("-alt")) continue;

    const mdxFile = path.join(MDX_DIR, `${basename}.mdx`);
    if (checkIfFileExists(mdxFile)) continue;

    const iconList = [basename];
    const variants = icons.filter(
      (p) =>
        p.endsWith(`/${basename}-icon.svg`) ||
        p.endsWith(`/${basename}-alt.svg`)
    );
    iconList.push(...variants.map((v) => path.basename(v, ".svg")));

    const name = basename.charAt(0).toUpperCase() + basename.slice(1);
    await fsp.writeFile(
      mdxFile,
      `---\nname: "${name}"\ndescription: ""\nicons: [${iconList.join(", ")}]\ntags: []\n---\n`
    );
    created++;
  }
  return created;
};

const run = async () => {
  const start = Date.now();

  const [iconsCount, fontCount, mdxCreated] = await Promise.all([
    copyAll(path.join(CORE_EXPORT, "icons"), PUBLIC_ICONS, "svg"),
    copyAll(path.join(CORE_EXPORT, "font"), PUBLIC_FONT, "svg"),
    scaffoldMdx(),
  ]);

  ensure(ASSETS_DIR);

  console.log(
    `website/sync-assets: ${iconsCount} icons, ${fontCount} font svgs, ${mdxCreated} mdx scaffolded (${
      Date.now() - start
    }ms)`
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

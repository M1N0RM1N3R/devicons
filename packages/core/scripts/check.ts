import glob from "fast-glob";
import path from "node:path";
const run = async () => {
  const cwd = process.cwd();

  const fontFiles = await glob(path.join(cwd, "export-files/font/*.svg"));
  const iconFiles = await glob(path.join(cwd, "export-files/icons/*.svg"));

  const fontFilesSet = new Set(
    fontFiles.map((file) => path.basename(file, ".svg"))
  );
  const iconFilesSet = new Set(
    iconFiles.map((file) => path.basename(file, ".svg"))
  );

  // check if all icon files are in the font files
  for (const iconFile of iconFilesSet) {
    if (!fontFilesSet.has(iconFile)) {
      console.log(`Icon file ${iconFile} is not in the font files`);
    }
  }

  for (const fontFile of fontFilesSet) {
    if (!iconFilesSet.has(fontFile)) {
      console.log(`Font file ${fontFile} is not in the icon files`);
    }
  }
};

run();

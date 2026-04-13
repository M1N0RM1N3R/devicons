import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fastGlob from "fast-glob";
import { ensureDir } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  // Move to ../../../packages/core/export-files
  const coreExportFiles = path.join(
    __dirname,
    "../../../packages/core/export-files",
  );

  //   Pick first 15 alphabetical from
  // coreExportFiles/font and coreExportFiles/icons
  // and copy to public/icons
  const fontFiles = await fastGlob(path.join(coreExportFiles, "font/*.svg"));

  ensureDir(path.join(__dirname, "../public/devicons/font"));
  ensureDir(path.join(__dirname, "../public/devicons/icons"));

  // Copy the files to public/icons
  for (const file of fontFiles) {
    const fileName = path.basename(file);
    const destination = path.join(
      __dirname,
      "../public/devicons/font",
      fileName,
    );
    fs.copyFileSync(file, destination);
    console.log(`Copied ${fileName} to ${destination}`);
    fs.copyFileSync(
      path.join(coreExportFiles, "icons", fileName),
      path.join(__dirname, "../public/devicons/icons", fileName),
    );
  }
};

run();

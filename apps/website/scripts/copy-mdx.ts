import { fileURLToPath } from "url";
import path from "path";
import fastGlob from "fast-glob";
import fs from "fs";
import { checkIfFileExists } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const coreExportFiles = path.join(
    __dirname,
    "../../../packages/core/export-files"
  );
  const icons = await fastGlob(path.join(coreExportFiles, "icons/*.svg"));

  for (const icon of icons) {
    const iconName = path.basename(icon);
    const basename = path.basename(icon, ".svg");
    const mdxFile = path.join(
      __dirname,
      "../src/content/icons",
      `${basename}.mdx`
    );
    if (!checkIfFileExists(mdxFile)) {
      if (basename.includes("-icon") || basename.includes("-alt")) {
        console.log(basename, "skip");
        continue;
      }
      const iconList = [basename];

      //   Check if the list has any icons as basename-icon or basename-alt
      const hasIcon = icons.filter(
        (icon) =>
          icon.includes(`/${basename}-icon`) ||
          icon.includes(`/${basename}-alt`)
      );
      if (hasIcon.length > 0) {
        // Add the alts to the icons array
        iconList.push(...hasIcon.map((icon) => path.basename(icon, ".svg")));
        console.log(iconList);
      }

      fs.writeFileSync(
        mdxFile,
        `---
name: "${basename.charAt(0).toUpperCase() + basename.slice(1)}"
description: ""
icons: [${iconList.join(", ")}]
tags: []
---`
      );
    }
  }
};

run();

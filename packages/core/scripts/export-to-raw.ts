// This script parses any exported files from the export-files folder
// minifies them with svgo and saves them in the `raw` folder

import fs from "fs/promises";
import path from "path";
import svgo from "svgo";
import glob from "fast-glob";

const preprocessSvg = async (svg: string) => {
  // replace fill="currentColor" with fill="currentColor" everywhere
  let processed = svg.replace(/fill="black"/g, 'fill="currentColor"');
  // replace fill="#000(000)" with fill="currentColor"
  processed = processed.replace(/fill="#000(000)"/g, 'fill="currentColor"');

  //   replace <g> with <g>
  processed = processed.replace(
    /<g(?:\s+clip-path=['"][^'"]*['"])?\s*>/g,
    "<g>"
  );
  const defsRegex = /<defs>[\s\S]*?<\/defs>/g;
  processed = processed.replace(defsRegex, "");
  return processed;
};

const run = async () => {
  const cwd = process.cwd();
  const fontFiles = await glob(path.join(cwd, "export-files/font/*.svg"));

  for (const file of fontFiles) {
    const svg = await fs.readFile(file, "utf8");
    const optimised = await svgo.optimize(svg, {
      multipass: true,
      plugins: ["removeComments", "removeDimensions"],
    });
    const processed = await preprocessSvg(optimised.data);
    await fs.writeFile(file, processed);
  }
};

run();

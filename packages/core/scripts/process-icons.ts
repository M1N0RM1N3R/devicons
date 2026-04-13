import fastGlob from "fast-glob";
import path from "node:path";
import svgo from "svgo";
import { readFile, writeFile } from "node:fs/promises";

const run = async () => {
  const cwd = process.cwd();
  const inputDir = path.join(cwd, "export-files", "icons");
  const outputDir = path.join(cwd, "export-files", "icons");

  const files = await fastGlob(path.join(inputDir, "**/*.svg"));

  for (const file of files) {
    const svg = await readFile(file, "utf-8");
    let prefixCounter = 0;
    const fileInfo = path.parse(file);
    try {
      const optimized = await svgo.optimize(svg, {
        multipass: true,
        plugins: [
          "removeComments",
          "removeDoctype",
          "removeXMLProcInst",
          "removeEditorsNSData",
          "cleanupIds",
          "removeDimensions",
          "removeComments",
          "removeUselessDefs",
          "cleanupEnableBackground",
          "removeUnusedNS",
          "removeUselessStrokeAndFill",
          "removeEmptyText",
          "removeEmptyContainers",
          "mergeStyles",
          "convertStyleToAttrs",
          {
            name: "prefixIds",
            params: {
              delim: "-",
              prefix: (node, info) => {
                return `devicon-${fileInfo.name}-${prefixCounter++}`;
              },
            },
          },
        ],
      });
      const outputFile = path.join(outputDir, path.basename(file));
      await writeFile(outputFile, optimized.data);
    } catch (error) {
      console.log(file);
      console.error(error);
    }
  }
};

run();

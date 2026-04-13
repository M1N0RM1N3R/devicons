import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadIcons, generate } from '@dev.icons/codegen';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../src');
const pretty = process.argv.includes('--pretty');

const run = async () => {
  const start = Date.now();
  const icons = await loadIcons();
  const count = await generate({ framework: 'react', outDir, icons, pretty });
  console.log(
    `@dev.icons/react: generated ${count} components in ${Date.now() - start}ms`,
  );
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});

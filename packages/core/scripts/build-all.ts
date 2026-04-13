import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadIcons, generate } from '@dev.icons/codegen';
import { buildFont } from './to-font';
import { buildSprite } from './sprite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

const FONT_IN = path.resolve(__dirname, '../export-files/font');
const ICONS_IN = path.resolve(__dirname, '../export-files/icons');

const REACT_OUT = path.join(ROOT, 'packages/react/src');
const VUE_OUT = path.join(ROOT, 'packages/vue/src');
const SVELTE_OUT = path.join(ROOT, 'packages/svelte/src');
const CORE_DIST = path.resolve(__dirname, '../dist');

const runNpmScript = (cwd: string, script: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', ['run', script], { cwd, stdio: 'inherit' });
    child.on('exit', code =>
      code === 0
        ? resolve()
        : reject(new Error(`${script} in ${cwd} exited with ${code}`)),
    );
  });

const args = new Set(process.argv.slice(2));
const skipFont = args.has('--no-font');
const skipSprite = args.has('--no-sprite');
const skipFrameworks = args.has('--no-frameworks');
const skipFontPkg = args.has('--no-font-pkg');

const step = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  console.log(`▸ ${name}...`);
  const result = await fn();
  console.log(`  ${name} done in ${Date.now() - start}ms`);
  return result;
};

const run = async () => {
  const totalStart = Date.now();

  const icons = await step('load-icons', () =>
    loadIcons({ iconsDir: ICONS_IN, fontDir: FONT_IN }),
  );
  console.log(`  loaded ${icons.length} icons`);

  const tasks: Promise<unknown>[] = [];

  if (!skipSprite) {
    tasks.push(
      step('core-sprite', () =>
        buildSprite({
          inputDir: ICONS_IN,
          outputDir: path.join(CORE_DIST, 'sprite'),
        }),
      ),
    );
  }

  if (!skipFont) {
    tasks.push(
      step('core-font', () =>
        buildFont({
          inputDir: FONT_IN,
          outputDir: path.join(CORE_DIST, 'font'),
          version: '1.8.0',
        }),
      ),
    );
  }

  if (!skipFrameworks) {
    tasks.push(
      step('codegen-react', () =>
        generate({ framework: 'react', outDir: REACT_OUT, icons }),
      ),
      step('codegen-vue', () =>
        generate({ framework: 'vue', outDir: VUE_OUT, icons }),
      ),
      step('codegen-svelte', () =>
        generate({ framework: 'svelte', outDir: SVELTE_OUT, icons }),
      ),
    );
  }

  await Promise.all(tasks);

  if (!skipFontPkg) {
    await step('font-package', () =>
      runNpmScript(path.join(ROOT, 'packages/font'), 'build'),
    );
  }

  console.log(`✓ build-all done in ${Date.now() - totalStart}ms`);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});

import type { CollectionEntry } from 'astro:content';

type PackEntry = CollectionEntry<'packs'>;

interface ResolvedIcon {
  slug: string;
  name: string;
  description?: string;
}

interface BuildArgs {
  pack: PackEntry;
  icons: ResolvedIcon[];
}

export function buildPackMarkdown({ pack, icons }: BuildArgs): string {
  const { data } = pack;
  const lines: string[] = [];

  lines.push(`[Home](/index.md) › [Packs](/packs.md) › ${data.title}`);
  lines.push('');
  lines.push(`# ${data.title}`);
  lines.push('', data.description);
  if (data.intro) lines.push('', data.intro);

  lines.push('', `## Icons in this pack (${icons.length})`, '');
  if (icons.length === 0) {
    lines.push('_This pack has no matching icons yet._');
  } else {
    for (const icon of icons) {
      const detail = icon.description
        ? ` — ${icon.description}`
        : '';
      lines.push(`- [${icon.name}](/icons/${icon.slug}.md)${detail}`);
    }
  }

  lines.push('', '## Use it', '');
  lines.push('```bash');
  lines.push('npm install @dev.icons/react  # or @dev.icons/vue, @dev.icons/svelte');
  lines.push('```');
  lines.push('');
  lines.push(
    'Import each icon by its PascalCase name with `Icon` suffix (e.g. `LangChainIcon`).',
  );

  lines.push('', '[← All packs](/packs.md)');

  return lines.join('\n');
}

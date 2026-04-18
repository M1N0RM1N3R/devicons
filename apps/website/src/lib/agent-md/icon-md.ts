import type { CollectionEntry } from 'astro:content';
import { formatTagLabel, slugifyTag } from '../icons-query';
import { getRelatedIcons } from '../related-icons';

type IconEntry = CollectionEntry<'icons'>;

interface PackRef {
  slug: string;
  title: string;
}

interface BuildArgs {
  entry: IconEntry;
  packs: PackRef[];
  prev?: { slug: string; name: string } | null;
  next?: { slug: string; name: string } | null;
}

function pascal(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function importName(slug: string): string {
  // React/Vue/Svelte component names are `<Pascal>Icon`.
  return `${pascal(slug)}Icon`;
}

export async function buildIconMarkdown({
  entry,
  packs,
  prev,
  next,
}: BuildArgs): Promise<string> {
  const { id: slug, data } = entry;
  const name = data.name;
  const primaryFile = data.icons[0] ?? slug;
  const tags = data.tags ?? [];
  const related = await getRelatedIcons(slug, tags, 8);
  const cmpName = importName(primaryFile);

  const lines: string[] = [];

  // Breadcrumb
  lines.push(`[Home](/index.md) › [Icons](/icons.md) › ${name}`);
  lines.push('');

  // Title + description
  lines.push(`# ${name}`);
  if (data.description) lines.push('', data.description);

  // At-a-glance metadata
  const meta: string[] = [];
  if (data.website) meta.push(`- **Website**: ${data.website}`);
  if (data.license) meta.push(`- **License**: ${data.license}`);
  if (data.brandGuidelines)
    meta.push(`- **Brand guidelines**: ${data.brandGuidelines}`);
  if (data.aliases?.length)
    meta.push(`- **Also known as**: ${data.aliases.join(', ')}`);
  if (tags.length) {
    const tagLinks = tags
      .map(t => `[${formatTagLabel(t)}](/icons/tag/${slugifyTag(t)})`)
      .join(', ');
    meta.push(`- **Tags**: ${tagLinks}`);
  }
  if (data.mainColor) meta.push(`- **Primary color**: \`${data.mainColor}\``);
  if (data.version) meta.push(`- **Version added**: ${data.version}`);
  if (data.icons.length > 1) {
    meta.push(`- **Variants**: ${data.icons.map(f => `\`${f}\``).join(', ')}`);
  }
  if (meta.length) {
    lines.push('', '## At a glance', '', ...meta);
  }

  // Use it
  lines.push('', '## Install and use');
  lines.push('');
  lines.push('```bash');
  lines.push(`npm install @dev.icons/react  # or @dev.icons/vue, @dev.icons/svelte`);
  lines.push('```');
  lines.push('', '### React', '', '```tsx');
  lines.push(`import { ${cmpName} } from "@dev.icons/react";`);
  lines.push('');
  lines.push(`<${cmpName} size={32} />`);
  lines.push('```');
  lines.push('', '### Vue', '', '```vue');
  lines.push('<script setup>');
  lines.push(`import { ${cmpName} } from "@dev.icons/vue";`);
  lines.push('</script>');
  lines.push('');
  lines.push('<template>');
  lines.push(`  <${cmpName} :size="32" />`);
  lines.push('</template>');
  lines.push('```');
  lines.push('', '### Svelte', '', '```svelte');
  lines.push('<script>');
  lines.push(`  import { ${cmpName} } from "@dev.icons/svelte";`);
  lines.push('</script>');
  lines.push('');
  lines.push(`<${cmpName} size={32} />`);
  lines.push('```');

  // Raw SVG
  lines.push('', '### Raw SVG', '', '```html');
  lines.push(
    `<img src="https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/icons/${primaryFile}.svg" alt="${name} logo" width="48" height="48" />`,
  );
  lines.push('```');
  lines.push(
    '',
    `Direct link: https://cdn.jsdelivr.net/npm/@dev.icons/core@latest/export-files/icons/${primaryFile}.svg`,
  );

  // Packs that include this icon
  if (packs.length) {
    lines.push('', '## In these packs');
    lines.push('');
    for (const p of packs) {
      lines.push(`- [${p.title}](/packs/${p.slug}.md)`);
    }
  }

  // Related icons
  if (related.length) {
    lines.push('', '## Related icons');
    lines.push('');
    for (const r of related) {
      lines.push(`- [${r.name}](/icons/${r.slug}.md)`);
    }
  }

  // Pagination
  if (prev || next) {
    lines.push('', '## Browse the catalog');
    if (prev) lines.push(`- Previous: [${prev.name}](/icons/${prev.slug}.md)`);
    if (next) lines.push(`- Next: [${next.name}](/icons/${next.slug}.md)`);
    lines.push('- [All icons](/icons.md)');
  } else {
    lines.push('', '[← All icons](/icons.md)');
  }

  return lines.join('\n');
}

import { getCollection, type CollectionEntry } from 'astro:content';

type IconEntry = CollectionEntry<'icons'>;

export interface RelatedIcon {
  slug: string;
  name: string;
  iconFile: string;
  score: number;
}

export async function getRelatedIcons(
  currentSlug: string,
  tags: string[] | undefined,
  limit = 8,
): Promise<RelatedIcon[]> {
  if (!tags || tags.length === 0) return [];
  const tagSet = new Set(tags);
  const all = await getCollection('icons');
  const scored: RelatedIcon[] = [];
  for (const entry of all) {
    if (entry.id === currentSlug) continue;
    if (entry.data.deprecated) continue;
    const overlap = entry.data.tags.filter((t) => tagSet.has(t)).length;
    if (overlap === 0) continue;
    scored.push({
      slug: entry.id,
      name: entry.data.name,
      iconFile: entry.data.icons[0] ?? entry.id,
      score: overlap + (entry.data.popular ? 0.5 : 0),
    });
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit);
}

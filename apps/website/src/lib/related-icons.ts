import { getCollection, type CollectionEntry } from 'astro:content';

type IconEntry = CollectionEntry<'icons'>;

export interface RelatedIcon {
  slug: string;
  name: string;
  iconFile: string;
  score: number;
  badInDark: boolean;
  badInLight: boolean;
  recommended: boolean;
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
      score:
        overlap +
        (entry.data.popular ? 0.5 : 0) +
        (entry.data.recommended ? 1 : 0),
      badInDark: entry.data.badInDark === true,
      badInLight: entry.data.badInLight === true,
      recommended: entry.data.recommended === true,
    });
  }
  scored.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });
  return scored.slice(0, limit);
}

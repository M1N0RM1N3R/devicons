import { getCollection, type CollectionEntry } from "astro:content";

export type DocEntry = CollectionEntry<"docs">;

export type DocSection = {
  category: string;
  categoryOrder: number;
  entries: DocEntry[];
};

export async function getSortedDocs(): Promise<DocEntry[]> {
  const all = await getCollection("docs");
  return all.sort((a, b) => {
    const catDelta = a.data.categoryOrder - b.data.categoryOrder;
    if (catDelta !== 0) return catDelta;
    if (a.data.category !== b.data.category) {
      return a.data.category.localeCompare(b.data.category);
    }
    const orderDelta = a.data.order - b.data.order;
    if (orderDelta !== 0) return orderDelta;
    return a.data.title.localeCompare(b.data.title);
  });
}

export async function getDocSections(): Promise<DocSection[]> {
  const sorted = await getSortedDocs();
  const map = new Map<string, DocSection>();
  for (const entry of sorted) {
    const key = entry.data.category;
    const existing = map.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      map.set(key, {
        category: entry.data.category,
        categoryOrder: entry.data.categoryOrder,
        entries: [entry],
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => a.categoryOrder - b.categoryOrder || a.category.localeCompare(b.category),
  );
}

export async function getDocNav(currentId: string) {
  const sorted = await getSortedDocs();
  const index = sorted.findIndex((d) => d.id === currentId);
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}

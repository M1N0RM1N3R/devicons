import { useEffect, useState, useRef } from "react";
import MiniSearch from "minisearch";

export interface IconEntry {
  id: string;
  name: string;
  description: string;
  icons: string[];
  tags: string[];
  deprecated: boolean;
  popular: boolean;
  badInDark?: boolean;
  badInLight?: boolean;
  deprecatedOn?: string;
  version?: string;
  aliases?: string[];
  website?: string;
  license?: string;
  brandGuidelines?: string;
  mainColor?: string;
  otherColors?: string[];
}

// Module-level cache — survives remounts and navigation
let cachedIcons: IconEntry[] | null = null;
let cachedIndex: MiniSearch<IconEntry> | null = null;

function buildIndex(icons: IconEntry[]): MiniSearch<IconEntry> {
  const ms = new MiniSearch<IconEntry>({
    idField: "id",
    fields: ["name", "tags", "aliases", "description"],
    storeFields: [],
    searchOptions: {
      boost: { name: 10, aliases: 8, tags: 5, description: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  ms.addAll(icons);
  return ms;
}

export function useSearch(query: string | null) {
  const [allIcons, setAllIcons] = useState<IconEntry[]>(cachedIcons ?? []);
  const [isLoading, setIsLoading] = useState(!cachedIcons);
  const [isError, setIsError] = useState(false);
  const indexRef = useRef<MiniSearch<IconEntry> | null>(cachedIndex);

  useEffect(() => {
    if (cachedIcons) return;

    let mounted = true;
    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IconEntry[]) => {
        if (!mounted) return;
        cachedIcons = data;
        cachedIndex = buildIndex(data);
        indexRef.current = cachedIndex;
        setAllIcons(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsError(true);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const results = (() => {
    if (isLoading || isError || !allIcons.length) return [];
    if (!query?.trim()) {
      return [...allIcons].sort((a, b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    const searchResults = indexRef.current?.search(query) ?? [];
    const idToIcon = new Map(allIcons.map((icon) => [icon.id, icon]));
    const ranked = searchResults
      .map((r) => idToIcon.get(r.id))
      .filter((icon): icon is IconEntry => !!icon);

    const needle = query.trim().toLowerCase();
    const exact: IconEntry[] = [];
    const aliasExact: IconEntry[] = [];
    const startsWith: IconEntry[] = [];
    const rest: IconEntry[] = [];
    for (const icon of ranked) {
      const name = icon.name.toLowerCase();
      const id = icon.id.toLowerCase();
      if (name === needle || id === needle) {
        exact.push(icon);
      } else if (icon.aliases?.some((a) => a.toLowerCase() === needle)) {
        aliasExact.push(icon);
      } else if (name.startsWith(needle) || id.startsWith(needle)) {
        startsWith.push(icon);
      } else {
        rest.push(icon);
      }
    }
    const byName = (a: IconEntry, b: IconEntry) =>
      a.name.localeCompare(b.name);
    exact.sort(byName);
    aliasExact.sort(byName);
    startsWith.sort(byName);
    return [...exact, ...aliasExact, ...startsWith, ...rest];
  })();

  return { results, allIcons, isLoading, isError };
}

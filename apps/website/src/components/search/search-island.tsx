import { NuqsAdapter } from "nuqs/adapters/react";
import { useQueryState, parseAsString } from "nuqs";
import { useDebounce } from "@/hooks/debounce";
import { useSearch } from "@/hooks/search";
import { SearchSection } from "./search-results";
import { SearchDrawer } from "./search-drawer";

interface SearchIslandProps {
  maxResults?: number;
}

function SearchInner({ maxResults }: SearchIslandProps) {
  const [query, setQuery] = useQueryState("q", parseAsString);
  const debouncedQuery = useDebounce(query, 300);
  const { results, allIcons, isLoading, isError } = useSearch(debouncedQuery);

  return (
    <>
      <SearchSection
        results={results}
        isLoading={isLoading}
        isError={isError}
        query={query}
        setQuery={setQuery}
        maxResults={maxResults}
      />
      <SearchDrawer allIcons={allIcons} />
    </>
  );
}

export function SearchIsland({ maxResults }: SearchIslandProps = {}) {
  return (
    <NuqsAdapter>
      <SearchInner maxResults={maxResults} />
    </NuqsAdapter>
  );
}

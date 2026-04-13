/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Pagefind {
  init: () => Promise<void>;
  destroy: () => Promise<void>;
  search: (
    query: string | null,
    options?: PagefindSearchOptions
  ) => Promise<PagefindResponse>;
  debouncedSearch: (
    query: string | null,
    options?: PagefindSearchOptions
  ) => Promise<PagefindResponse>;
}

interface PagefindSearchOptions {
  filters?: { [key: string]: string | boolean | string[] | undefined };
  sort?: { [key: string]: string | boolean | string[] | undefined };
}

interface PagefindResponse {
  results: PagefindResult[];
}

export interface PagefindResult {
  id: string;
  data: () => Promise<PagefindDocument>;
}

interface PagefindDocument {
  url: string;
  excerpt: string;
  filters: {
    author: string;
  };
  meta: {
    title: string;
    categories?: string;
    tags?: string;
    integration_categories?: string;
    integration_image?: string;
  };
  content: string;
  word_count: number;
  sub_results: PagefindSubResult[];
}

export interface PagefindSubResult {
  title: string;
  url: string;
  excerpt: string;
  locations: number[];
}

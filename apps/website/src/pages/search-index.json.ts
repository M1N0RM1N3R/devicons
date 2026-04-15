import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const icons = await getCollection("icons");

  const entries = icons.map((entry) => ({
    id: entry.id,
    name: entry.data.name,
    description: entry.data.description ?? "",
    icons: entry.data.icons,
    tags: entry.data.tags,
    deprecated: entry.data.deprecated ?? false,
    popular: entry.data.popular ?? false,
    badInDark: entry.data.badInDark ?? false,
    badInLight: entry.data.badInLight ?? false,
    ...(entry.data.version && { version: entry.data.version }),
    ...(entry.data.aliases && { aliases: entry.data.aliases }),
  }));

  entries.sort((a, b) => a.name.localeCompare(b.name));

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
};

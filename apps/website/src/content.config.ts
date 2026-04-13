import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const icons = defineCollection({
  loader: glob({ base: "./src/content/icons", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    icons: z.array(z.string()),
    //
    deprecatedOn: z.string().optional(),
    deprecated: z.boolean().optional().default(false),
    version: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    //
    popular: z.boolean().optional().default(false),
    tags: z.array(z.string()),
    license: z.string().optional(),
    website: z.string().url().optional(),
    brandGuidelines: z.string().url().optional(),
    mainColor: z.string().optional(),
    otherColors: z.array(z.string()).optional(),
  }),
});

const docs = defineCollection({
  loader: glob({ base: "./src/content/docs", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
    category: z.string().default("Getting Started"),
    categoryOrder: z.number().default(0),
    badge: z.enum(["new", "updated", "beta"]).optional(),
  }),
});

export const collections = { icons, docs };

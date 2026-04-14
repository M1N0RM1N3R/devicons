import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage, OG } from "../../../lib/og/render";

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection("docs");
  return docs.map((entry) => ({
    params: { slug: entry.id === "introduction" ? "index" : entry.id },
    props: { entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection>>[number] };
  const { title, description, category } = entry.data;

  const png = await renderOgImage({
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG.bg,
        padding: "60px",
        position: "relative",
      },
      children: [
        // Grid
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(${OG.border} 1px, transparent 1px), linear-gradient(90deg, ${OG.border} 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
              opacity: 0.4,
            },
          },
        },
        // Top: logo + breadcrumb
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "auto",
              position: "relative",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "48px",
                    height: "48px",
                    backgroundColor: OG.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 12% 100%, 0 88%)",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontFamily: OG.fontDisplay,
                        fontSize: "32px",
                        color: OG.bg,
                      },
                      children: "D",
                    },
                  },
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: OG.fontMono,
                    fontSize: "14px",
                    color: OG.textMuted,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase" as const,
                  },
                  children: "devicons.io / docs",
                },
              },
            ],
          },
        },
        // Content
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            },
            children: [
              // Category label with accent bar
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "12px",
                          height: "2px",
                          backgroundColor: OG.accent,
                        },
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontFamily: OG.fontMono,
                          fontSize: "14px",
                          color: OG.accent,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase" as const,
                        },
                        children: category,
                      },
                    },
                  ],
                },
              },
              // Title
              {
                type: "h1",
                props: {
                  style: {
                    fontFamily: OG.fontDisplay,
                    fontSize: "64px",
                    color: OG.text,
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    margin: 0,
                  },
                  children: title,
                },
              },
              // Description
              ...(description
                ? [
                    {
                      type: "p",
                      props: {
                        style: {
                          fontFamily: OG.fontDisplay,
                          fontSize: "24px",
                          color: OG.textMuted,
                          margin: 0,
                          maxWidth: "700px",
                          lineHeight: 1.3,
                        },
                        children: description,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // Bottom accent bar
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "4px",
              backgroundColor: OG.accent,
            },
          },
        },
      ],
    },
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

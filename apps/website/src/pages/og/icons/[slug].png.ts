import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage, OG } from "../../../lib/og/render";
import fs from "node:fs";
import path from "node:path";

export const getStaticPaths: GetStaticPaths = async () => {
  const icons = await getCollection("icons");
  return icons.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

function loadSvgAsDataUri(slug: string): string | null {
  const svgPath = path.join(process.cwd(), "public", "devicons", "icons", `${slug}.svg`);
  if (!fs.existsSync(svgPath)) return null;
  const raw = fs.readFileSync(svgPath, "utf-8");
  return `data:image/svg+xml;base64,${Buffer.from(raw).toString("base64")}`;
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection>>[number] };
  const { name, description, icons: iconFiles, tags } = entry.data;

  // Load up to 2 icon variants as images
  const iconImages = iconFiles
    .slice(0, 2)
    .map((slug: string) => loadSvgAsDataUri(slug))
    .filter(Boolean) as string[];

  const tagList = tags.slice(0, 4).join(" / ");

  const png = await renderOgImage({
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: OG.bg,
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
              opacity: 0.3,
            },
          },
        },
        // Left content area
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              padding: "60px",
              flex: 1,
              position: "relative",
              justifyContent: "space-between",
            },
            children: [
              // Top: logo
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "40px",
                          height: "40px",
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
                              fontSize: "28px",
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
                          fontSize: "13px",
                          color: OG.textMuted,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase" as const,
                        },
                        children: "devicons.io",
                      },
                    },
                  ],
                },
              },
              // Middle: name + description
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  },
                  children: [
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
                                fontSize: "13px",
                                color: OG.accent,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase" as const,
                              },
                              children: "Icon",
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "h1",
                      props: {
                        style: {
                          fontFamily: OG.fontDisplay,
                          fontSize: "56px",
                          color: OG.text,
                          lineHeight: 0.95,
                          letterSpacing: "-0.04em",
                          margin: 0,
                          maxWidth: "500px",
                        },
                        children: name,
                      },
                    },
                    ...(description
                      ? [
                          {
                            type: "p",
                            props: {
                              style: {
                                fontFamily: OG.fontDisplay,
                                fontSize: "20px",
                                color: OG.textMuted,
                                margin: 0,
                                maxWidth: "450px",
                                lineHeight: 1.4,
                              },
                              children: description,
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },
              // Bottom: tags
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  },
                  children: tagList
                    ? {
                        type: "span",
                        props: {
                          style: {
                            fontFamily: OG.fontMono,
                            fontSize: "12px",
                            color: OG.textMuted,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase" as const,
                          },
                          children: tagList,
                        },
                      }
                    : [],
                },
              },
            ],
          },
        },
        // Right: icon display area
        {
          type: "div",
          props: {
            style: {
              width: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              borderLeft: `1px solid ${OG.border}`,
            },
            children: [
              // Icon images
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "24px",
                    alignItems: "center",
                  },
                  children: iconImages.map((src) => ({
                    type: "img",
                    props: {
                      src,
                      width: iconImages.length === 1 ? 180 : 120,
                      height: iconImages.length === 1 ? 180 : 120,
                      style: {
                        objectFit: "contain" as const,
                      },
                    },
                  })),
                },
              },
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

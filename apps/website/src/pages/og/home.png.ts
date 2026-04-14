import type { APIRoute } from "astro";
import { renderOgImage, OG } from "../../lib/og/render";
import { SITE_TITLE, SITE_DESCRIPTION } from "../../consts";

export const GET: APIRoute = async () => {
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
        // Grid lines (decorative)
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
        // Top bar: logo mark + label
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
              // Notch block D
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
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 12% 100%, 0 88%)",
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
                  children: "devicons.io",
                },
              },
            ],
          },
        },
        // Main title
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "relative",
            },
            children: [
              {
                type: "h1",
                props: {
                  style: {
                    fontFamily: OG.fontDisplay,
                    fontSize: "72px",
                    color: OG.text,
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    margin: 0,
                  },
                  children: SITE_TITLE,
                },
              },
              {
                type: "p",
                props: {
                  style: {
                    fontFamily: OG.fontDisplay,
                    fontSize: "28px",
                    color: OG.textMuted,
                    lineHeight: 1.3,
                    margin: 0,
                    maxWidth: "600px",
                  },
                  children: SITE_DESCRIPTION,
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

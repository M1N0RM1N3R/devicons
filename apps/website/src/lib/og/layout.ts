import { OG } from './constants';

interface OgShellProps {
  eyebrow: string;
  category?: string;
  title: string;
  description?: string;
  titleSize?: number;
  rightSlot?: unknown;
}

const grid = {
  type: 'div',
  props: {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `linear-gradient(${OG.border} 1px, transparent 1px), linear-gradient(90deg, ${OG.border} 1px, transparent 1px)`,
      backgroundSize: '48px 48px',
      opacity: 0.4,
    },
  },
};

const accentBar = {
  type: 'div',
  props: {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '4px',
      backgroundColor: OG.accent,
    },
  },
};

function mark(eyebrow: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '48px',
              height: '48px',
              backgroundColor: OG.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 12% 100%, 0 88%)',
            },
            children: {
              type: 'span',
              props: {
                style: {
                  fontFamily: OG.fontDisplay,
                  fontSize: '32px',
                  color: OG.bg,
                },
                children: 'D',
              },
            },
          },
        },
        {
          type: 'span',
          props: {
            style: {
              fontFamily: OG.fontMono,
              fontSize: '14px',
              color: OG.textMuted,
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
            },
            children: eyebrow,
          },
        },
      ],
    },
  };
}

function categoryLabel(category: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '12px',
              height: '2px',
              backgroundColor: OG.accent,
            },
          },
        },
        {
          type: 'span',
          props: {
            style: {
              fontFamily: OG.fontMono,
              fontSize: '14px',
              color: OG.accent,
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
            },
            children: category,
          },
        },
      ],
    },
  };
}

// Shared OG layout: grid background, brand mark + eyebrow, optional category
// label, big display title, optional description, bottom accent rail. An
// optional right-side slot (e.g. icons) sits next to the text column in a
// 1fr / 400px split, matching `/og/icons/<slug>.png`.
export function ogShell({
  eyebrow,
  category,
  title,
  description,
  titleSize = 64,
  rightSlot,
}: OgShellProps) {
  const content = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
      },
      children: [
        ...(category ? [categoryLabel(category)] : []),
        {
          type: 'h1',
          props: {
            style: {
              fontFamily: OG.fontDisplay,
              fontSize: `${titleSize}px`,
              color: OG.text,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              margin: 0,
            },
            children: title,
          },
        },
        ...(description
          ? [
              {
                type: 'p',
                props: {
                  style: {
                    fontFamily: OG.fontDisplay,
                    fontSize: '24px',
                    color: OG.textMuted,
                    margin: 0,
                    maxWidth: rightSlot ? '500px' : '700px',
                    lineHeight: 1.3,
                  },
                  children: description,
                },
              },
            ]
          : []),
      ],
    },
  };

  const textColumn = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        padding: '60px',
        flex: 1,
        position: 'relative',
        justifyContent: 'space-between',
      },
      children: [mark(eyebrow), content],
    },
  };

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: OG.bg,
        position: 'relative',
      },
      children: [
        grid,
        textColumn,
        ...(rightSlot ? [rightSlot] : []),
        accentBar,
      ],
    },
  };
}

/**
 * Custom Shiki themes built from the Devicons design tokens.
 *
 * Palette strategy
 * ----------------
 *  Two-hue brutalist: brand orange for the loudest semantic signals
 *  (keywords, tags, brand-tied operators) + one cool teal counterpoint
 *  for types / properties / attributes. Everything structural (vars,
 *  funcs, punct, comments) sits on a high-contrast grayscale ramp so
 *  the two hues stay rare and meaningful.
 *
 *  - Warm: keyword/tag/storage = `--c-accent-500` family (brand)
 *          string             = honey / olive (warm-neutral)
 *          number             = amber (warm-mid, distinct from keyword)
 *  - Cool: type/class         = mint-teal (complementary to orange)
 *          property/attribute = lighter mint
 *  - Gray: fg / variable / function = near-white (dark) / near-black (light)
 *          comment / punct          = mid-gray, italic on comments
 *  - Status red is reserved for `invalid`.
 *
 *  Background is transparent — code blocks inherit whatever surface
 *  sits behind them (page, doc card, install snippet).
 *
 * Contrast audit (WCAG ratios, against the worst-case page surface)
 * ------------------------------------------------------------------
 *  Code blocks are transparent and can sit on body (`--c-bg`),
 *  `--c-surface`, or `--c-surface-2`. Ratios below use the worst
 *  case: body `#000` on dark, body `#ffffff` on light. Hues are
 *  pulled from the site's accent ramp / tan / destructive tokens
 *  so the theme and the rest of the UI stay of-a-piece.
 *
 *  Light palette follows the GitHub / One Light convention: one warm
 *  accent (brand orange for keywords) against cool supporting hues
 *  (blue for types, green for strings) — reads calm on #fff without
 *  competing warm tones muddying each other. Dark palette keeps the
 *  two-hue warm + teal brutalist intent (works on #000; doesn't on #fff).
 *
 *    Dark surface = #000000            Light surface = #ffffff
 *    fg        #ededed   18.1 ✓ AAA    #1f2328   15.4 ✓ AAA
 *    comment   #8a8a8a    5.4 ✓ AA     #6e7781    4.6 ✓ AA
 *    punct     #6b6b6b    3.8 ✓ struct #8c959f    3.1 ✓ struct
 *    keyword   #ff6b2b    5.9 ✓ AA     #b33300    6.3 ✓ AA
 *    type      #7dd3c0   11.3 ✓ AAA    #0550ae    7.0 ✓ AAA
 *    string    #c9a876    9.4 ✓ AAA    #16794d    5.3 ✓ AA
 *    number    #ffb380   10.3 ✓ AAA    #8f4700    6.1 ✓ AA
 *    property  #b5e8d5   13.2 ✓ AAA    #0757ba    5.8 ✓ AA
 *    variable  #d4d4d4   13.8 ✓ AAA    #24292f   14.7 ✓ AAA
 *    invalid   #ff4d4d    6.7 ✓ AA     #cf222e    5.3 ✓ AA
 *
 *  Semantic tokens clear AA (4.5:1); body tokens hit AAA. Punct is
 *  intentionally below AA — it's structural and benefits from
 *  recession so meaningful tokens dominate.
 */

type Palette = {
  bg: string;
  fg: string;
  comment: string;
  keyword: string;
  func: string;
  type: string;
  string: string;
  number: string;
  tag: string;
  attribute: string;
  property: string;
  variable: string;
  punct: string;
  invalid: string;
  regex: string;
  selection: string;
  lineHighlight: string;
  cursor: string;
};

const dark: Palette = {
  bg: "#00000000",         // transparent — surface shows through
  fg: "#ededed",           // off-white — less glare than pure white
  comment: "#8a8a8a",      // --c-text-muted; italic
  keyword: "#ff6b2b",      // --c-accent-400 — brand on-ramp
  func: "#ededed",         // no extra hue — funcs read by position
  type: "#7dd3c0",         // mint-teal counterpoint, softened
  string: "#c9a876",       // --c-tan
  number: "#ffb380",       // --c-accent-200 — distinct from keyword
  tag: "#ff6b2b",
  attribute: "#7dd3c0",
  property: "#b5e8d5",     // lighter mint — sibling of type
  variable: "#d4d4d4",     // slightly recessed from fg
  punct: "#6b6b6b",        // intentionally low contrast — structural
  invalid: "#ff4d4d",      // --c-destructive
  regex: "#c9a876",
  selection: "#1f1f1f",
  lineHighlight: "#0a0a0a",
  cursor: "#ff4d00",       // --c-accent
};

const light: Palette = {
  bg: "#ffffff00",         // transparent — surface shows through
  fg: "#1f2328",           // cool near-black — reads softer than pure #000
  comment: "#6e7781",      // cool gray, italic
  keyword: "#b33300",      // --c-accent-500 — the single warm accent
  func: "#1f2328",         // neutral — functions read by position
  type: "#0550ae",         // blue-800 — classic, calm on white
  string: "#16794d",       // green-700 — universal string convention
  number: "#8f4700",       // amber-800 — warm but desaturated
  tag: "#b33300",
  attribute: "#0550ae",
  property: "#0757ba",     // blue-600 — shade-sibling of type
  variable: "#24292f",     // near-fg, one step recessed
  punct: "#8c959f",        // cool gray — structural
  invalid: "#cf222e",      // GitHub red — reads cleaner than pure #b91c1c
  regex: "#16794d",
  selection: "#ededed",
  lineHighlight: "#f5f5f5",
  cursor: "#b33300",
};

function buildTheme(name: string, type: "dark" | "light", p: Palette) {
  return {
    name,
    type,
    fg: p.fg,
    bg: p.bg,
    colors: {
      "editor.background": p.bg,
      "editor.foreground": p.fg,
      "editor.selectionBackground": p.selection,
      "editor.lineHighlightBackground": p.lineHighlight,
      "editorCursor.foreground": p.cursor,
      "editorLineNumber.foreground": p.punct,
      "editorLineNumber.activeForeground": p.fg,
    },
    tokenColors: [
      // ── Comments ─────────────────────────────────────────────
      {
        scope: [
          "comment",
          "comment.block",
          "comment.line",
          "punctuation.definition.comment",
          "string.comment",
        ],
        settings: { foreground: p.comment, fontStyle: "italic" },
      },

      // ── Keywords / control flow / storage ────────────────────
      {
        scope: [
          "keyword",
          "keyword.control",
          "keyword.control.flow",
          "keyword.control.import",
          "keyword.control.from",
          "keyword.control.export",
          "keyword.control.conditional",
          "keyword.control.loop",
          "keyword.operator.new",
          "keyword.operator.delete",
          "keyword.operator.expression",
          "keyword.operator.logical.python",
          "storage",
          "storage.type",
          "storage.modifier",
          "storage.type.function.arrow",
          "variable.language.this",
          "variable.language.self",
          "variable.language.super",
        ],
        settings: { foreground: p.keyword },
      },

      // ── Operators and punctuation ────────────────────────────
      {
        scope: [
          "keyword.operator",
          "keyword.operator.assignment",
          "keyword.operator.arithmetic",
          "keyword.operator.comparison",
          "keyword.operator.logical",
          "keyword.operator.bitwise",
          "keyword.operator.ternary",
          "keyword.operator.optional",
          "punctuation",
          "punctuation.separator",
          "punctuation.terminator",
          "punctuation.definition.parameters",
          "punctuation.definition.block",
          "meta.brace",
          "meta.delimiter",
        ],
        settings: { foreground: p.punct },
      },

      // ── Strings ──────────────────────────────────────────────
      {
        scope: [
          "string",
          "string.quoted",
          "string.quoted.single",
          "string.quoted.double",
          "string.template",
          "punctuation.definition.string",
          "meta.embedded.line",
          "string.interpolated",
        ],
        settings: { foreground: p.string },
      },
      {
        scope: ["string.regexp", "string.regexp constant.character.escape"],
        settings: { foreground: p.regex },
      },
      {
        scope: [
          "meta.template.expression",
          "meta.embedded.expression",
          "punctuation.definition.template-expression",
        ],
        settings: { foreground: p.keyword },
      },

      // ── Numbers, constants, booleans ─────────────────────────
      {
        scope: [
          "constant.numeric",
          "constant.numeric.decimal",
          "constant.numeric.integer",
          "constant.numeric.float",
          "constant.numeric.hex",
          "constant.language",
          "constant.language.boolean",
          "constant.language.null",
          "constant.language.undefined",
          "constant.language.nan",
          "constant.language.infinity",
          "constant.character",
          "constant.character.escape",
          "constant.other.symbol",
        ],
        settings: { foreground: p.number },
      },

      // ── Functions ────────────────────────────────────────────
      {
        scope: [
          "entity.name.function",
          "meta.function-call entity.name.function",
          "support.function",
          "support.function.builtin",
          "meta.definition.function entity.name.function",
        ],
        settings: { foreground: p.func },
      },

      // ── Classes / types / interfaces ─────────────────────────
      {
        scope: [
          "entity.name.class",
          "entity.name.type",
          "entity.name.type.class",
          "entity.name.type.interface",
          "entity.name.type.enum",
          "entity.name.type.alias",
          "entity.name.type.module",
          "entity.name.namespace",
          "support.class",
          "support.type",
          "support.type.builtin",
          "support.type.primitive",
        ],
        settings: { foreground: p.type },
      },

      // ── Variables / parameters ───────────────────────────────
      {
        scope: [
          "variable",
          "variable.other",
          "variable.other.readwrite",
          "variable.other.constant",
          "variable.parameter",
          "meta.definition.variable",
          "meta.definition.variable variable.other",
        ],
        settings: { foreground: p.variable },
      },

      // ── Object properties / keys ─────────────────────────────
      {
        scope: [
          "variable.other.property",
          "variable.other.object.property",
          "meta.object-literal.key",
          "support.type.property-name",
          "support.type.property-name.json",
          "entity.other.attribute-name.id",
        ],
        settings: { foreground: p.property },
      },

      // ── Tags (HTML / JSX / Vue / Svelte) ─────────────────────
      {
        scope: [
          "entity.name.tag",
          "meta.tag",
          "meta.tag.other",
          "punctuation.definition.tag",
        ],
        settings: { foreground: p.tag },
      },

      // ── Attributes ───────────────────────────────────────────
      {
        scope: [
          "entity.other.attribute-name",
          "entity.other.attribute-name.class",
          "meta.attribute",
          "meta.attribute.class.mustache",
        ],
        settings: { foreground: p.attribute },
      },

      // ── Markdown ─────────────────────────────────────────────
      {
        scope: ["markup.heading", "entity.name.section.markdown"],
        settings: { foreground: p.keyword, fontStyle: "bold" },
      },
      {
        scope: ["markup.bold"],
        settings: { foreground: p.fg, fontStyle: "bold" },
      },
      {
        scope: ["markup.italic"],
        settings: { foreground: p.fg, fontStyle: "italic" },
      },
      {
        scope: ["markup.inline.raw", "markup.fenced_code"],
        settings: { foreground: p.string },
      },
      {
        scope: ["markup.quote"],
        settings: { foreground: p.comment, fontStyle: "italic" },
      },
      {
        scope: ["markup.underline.link", "string.other.link", "markup.underline"],
        settings: { foreground: p.keyword },
      },
      {
        scope: ["markup.list", "punctuation.definition.list_item"],
        settings: { foreground: p.number },
      },

      // ── Diff / version-control markup ────────────────────────
      {
        scope: ["markup.inserted", "meta.diff.header.to-file"],
        settings: { foreground: type === "dark" ? "#00c951" : "#0a8f3a" },
      },
      {
        scope: ["markup.deleted", "meta.diff.header.from-file"],
        settings: { foreground: p.invalid },
      },
      {
        scope: ["markup.changed"],
        settings: { foreground: p.number },
      },

      // ── Errors / invalid ─────────────────────────────────────
      {
        scope: ["invalid", "invalid.illegal", "invalid.deprecated"],
        settings: { foreground: p.invalid },
      },
    ],
  };
}

export const deviconsDark = buildTheme("devicons-dark", "dark", dark);
export const deviconsLight = buildTheme("devicons-light", "light", light);

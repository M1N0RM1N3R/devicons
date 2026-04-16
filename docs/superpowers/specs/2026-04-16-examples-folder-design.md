# Examples Folder — Design

**Date:** 2026-04-16
**Status:** Approved (pending spec review + user review)
**Author:** Brainstormed with Claude

## Problem

The repo currently exposes per-package playgrounds at `packages/vue/example/` and `packages/svelte/example/`. They live inside the package they demonstrate, import directly from `../src`, and are useful as quick local sanity checks while developing the package itself.

What's missing is a top-level set of **standalone, copyable showcases** that demonstrate how an end-user would consume each published package — installing it as a dependency and importing from its public entry point — and that explicitly cover the `font` and `core` packages, which today have no example app at all.

## Goals

1. Add four self-contained Vite apps under a new top-level `examples/` directory:
   - `examples/font` — demonstrates the `devicons` icon-font package.
   - `examples/core` — demonstrates `@dev.icons/core` with both colorful (sprite) and monochrome (font) rendering, toggleable.
   - `examples/vue` — demonstrates `@dev.icons/vue`.
   - `examples/svelte` — demonstrates `@dev.icons/svelte`.
2. Wire the new folder into the pnpm workspace.
3. Keep each example fully independent — no shared code, no internal `_shared/` package — so a user can copy any single folder out of the repo as a starter.
4. Mark every example `"private": true` so semantic-release ignores them.

## Non-Goals

- A React example (the user's request was explicitly font, svelte, vue, core; `packages/react/example/` already exists and stays untouched).
- Replacing the existing `packages/{vue,svelte}/example/` folders. The new top-level apps **coexist** with the per-package playgrounds.
- Any shared workspace package, shared CSS bundle, or root-level orchestration script.
- Tests for the example apps (they're demos; underlying packages have their own test suites).
- A production-grade Tailwind install. All four apps use the Tailwind v4 browser CDN (`<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4">`), matching the existing `packages/{vue,svelte}/example/` pattern.

## Workspace Layout

```
examples/
├── font/
│   ├── README.md
│   ├── index.html
│   ├── package.json          # @dev.icons/example-font, private
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       └── App.ts            # render-to-DOM, no framework
├── core/
│   ├── README.md
│   ├── index.html
│   ├── package.json          # @dev.icons/example-core, private
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       └── App.ts
├── vue/
│   ├── README.md
│   ├── index.html
│   ├── package.json          # @dev.icons/example-vue, private
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       └── App.vue
└── svelte/
    ├── README.md
    ├── index.html
    ├── package.json          # @dev.icons/example-svelte, private
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── main.ts
        └── App.svelte
```

`pnpm-workspace.yaml` becomes:

```yaml
packages:
  - "apps/*"
  - "packages/**"
  - "examples/*"
```

## Per-App Skeleton

Every example follows the same shape. The differences live entirely in the App component and the build chain.

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Devicons {Framework} Example</title>
    <script
      crossorigin
      src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
    ></script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

### `package.json` shape

```json
{
  "name": "@dev.icons/example-<name>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": { /* per-example, see §Per-Example Specifics */ },
  "devDependencies": {
    "typescript": "^5.7.3",
    "vite": "5.4.1"
    /* + framework plugin where applicable */
  }
}
```

### `vite.config.ts`

Minimal — `defineConfig({ plugins: [...] })` with the framework plugin where relevant. No path aliases, no custom resolvers — examples consume the package's public entry, just as an end-user would.

### App component contract

Every `App` renders the same UX:

1. **Sticky header** (`sticky top-0 bg-white border-b z-10 p-4`) containing:
   - App title.
   - A text search input that filters icons by name (case-insensitive `String.prototype.includes`).
   - The per-example toggle (semantics differ — see §Per-Example Specifics).
2. **Auto-fill grid** with `grid` + `gap-4` + `style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))"`. Responsive by viewport, not a fixed `grid-cols-N`.
3. **Icon card** for each icon: `flex flex-col items-center justify-center p-3 rounded border border-gray-200 hover:border-gray-400 cursor-pointer`. Renders the icon at 48px, shows the name underneath in `text-xs text-gray-600 truncate w-full text-center`. `onClick` writes the icon name to clipboard via `navigator.clipboard.writeText(name)` and shows a 1-second "Copied!" toast (a single ephemeral `<div>` near the bottom of the viewport, no toast library).
4. **Empty state** — when search yields zero results, show `No icons match "<query>"` centered in the grid area.

## Per-Example Specifics

### `examples/font` — vanilla TS

**Dependencies:**

```json
"dependencies": {
  "devicons": "workspace:*",
  "@dev.icons/core": "workspace:*"
}
```

**`src/main.ts`:**

```ts
import "devicons/css";   // loads @font-face + dev-* utility classes
import { mountApp } from "./App";

mountApp(document.getElementById("app")!);
```

**`src/App.ts`** renders to the DOM imperatively (no framework). Pulls the icon list from `import { ICONS } from "@dev.icons/core"`, then for each record:

```ts
const el = document.createElement("i");
el.className = `dev dev-${name}`;
el.style.fontSize = "48px";
```

**Toggle semantics:** font is intrinsically monochrome, so the toggle filters by `isVariant`, not render mode. Three radio options:
- **All** — `ICONS`
- **Regular** — `ICONS.filter(i => !i.isVariant)`
- **`-icon` variants** — `ICONS.filter(i => i.isVariant)`

**Class-name caveat:** the `dev dev-<name>` convention assumes that's what `packages/font/dist/devicons.css` actually emits. If the generated class prefix differs (e.g. `devicon-`, `devicons-`, etc.), the App must be adjusted to match the actual CSS during implementation. The implementation plan must include a step to read the built CSS and confirm the prefix before writing the App.

### `examples/core` — vanilla TS

**Dependencies:**

```json
"dependencies": {
  "@dev.icons/core": "workspace:*"
}
```

**`src/main.ts`:**

```ts
import "@dev.icons/core/font/css";
import spriteUrl from "@dev.icons/core/sprite?url";
import { mountApp } from "./App";

mountApp(document.getElementById("app")!, spriteUrl);
```

**Toggle semantics:** **Sprite (colorful)** ↔ **Font (monochrome)**.

- Sprite mode renders, for each icon name `name`:
  ```html
  <svg width="48" height="48"><use href="<spriteUrl>#<symbolId>"></use></svg>
  ```
- Font mode renders `<i class="dev dev-<name>" style="font-size: 48px"></i>`.

**Symbol-id caveat:** the assumed `<use href="<url>#<name>">` convention depends on what symbol IDs `packages/core/dist/sprite/sprite-symbol.svg` actually uses. If the IDs are prefixed (e.g. `icon-<name>`) or differ from the bare icon name, the App must use the actual id format. The implementation plan must include a step to grep the built sprite for `<symbol id="..."` to confirm the convention before writing the App.

### `examples/vue` — Vue 3 + `@vitejs/plugin-vue`

**Dependencies:**

```json
"dependencies": {
  "@dev.icons/vue": "workspace:*",
  "vue": "^3.5.13"
},
"devDependencies": {
  "@vitejs/plugin-vue": "^5.2.3",
  "typescript": "^5.7.3",
  "vite": "5.4.1",
  "vue-tsc": "^2.2.8"
}
```

**`src/App.vue`** mirrors the existing `packages/vue/example/App.vue`:

```ts
import * as Icons from "@dev.icons/vue";
const iconComponents = Object.entries(Icons)
  .filter(([, value]) => typeof value !== "string")
  .map(([name, Icon]) => ({ name, Icon }));
```

**Toggle semantics:** **Icon (SVG)** ↔ **Font** — passes `:type="type"` to each component, identical to the existing per-package example. Renders with `<component :is="Icon" size="48px" :type="type" />`.

### `examples/svelte` — Svelte 5 + `@sveltejs/vite-plugin-svelte`

**Dependencies:**

```json
"dependencies": {
  "@dev.icons/svelte": "workspace:*",
  "svelte": "^5.28.2"
},
"devDependencies": {
  "@sveltejs/vite-plugin-svelte": "^4.0.0",
  "typescript": "^5.7.3",
  "vite": "5.4.1"
}
```

**`src/App.svelte`** mirrors the existing `packages/svelte/example/App.svelte` — same `Object.entries(Icons).filter(...)` pattern, same `<Icon size="48px" {type} />` render, same toggle semantics as Vue.

## Build Dependency Story

Every example consumes built artifacts from the workspace packages it depends on. Before running an example for the first time, the underlying package must be built:

| Example                  | Required prerequisite build              |
| ------------------------ | ---------------------------------------- |
| `examples/font`          | `pnpm -F devicons build` + `pnpm -F @dev.icons/core build` (for `ICONS` data) |
| `examples/core`          | `pnpm -F @dev.icons/core build`          |
| `examples/vue`           | `pnpm -F @dev.icons/vue build`           |
| `examples/svelte`        | `pnpm -F @dev.icons/svelte build`        |

**Considered and rejected:** baking the prerequisite build into each example's `dev` script (`dev: pnpm -F @dev.icons/vue build && vite`). The vue/svelte builds generate hundreds of components and would re-run on every `pnpm dev`, which is poor DX. Document the prereq in each README instead.

**Considered and rejected:** Vite path aliases pointing at each package's `src/`. This would skip the build step but would also stop demonstrating real-world consumption (which is the entire point of these examples — they need to import from the published entry, not source).

## READMEs

Each `examples/<name>/README.md` is short and follows the same three-section template:

```markdown
# Devicons <Name> Example

What this example demonstrates: <one sentence>.

## Setup

```sh
# from repo root
<exact prereq build command from the table above>
```

## Run

```sh
cd examples/<name>
pnpm dev
```
```

## Out-of-Scope Decisions Recorded

- **No root `examples` script.** Users run `pnpm -F @dev.icons/example-vue dev` or `cd examples/vue && pnpm dev`. Adding a wrapper for four discoverable apps is unnecessary surface area.
- **No `test` script in any example.** `pnpm test` at the root runs `pnpm -r --parallel test`, which would fail or no-op on the examples. They're demos; the underlying packages already have tests.
- **No shared CSS, no shared component library, no `examples/_shared/` package.** Four small apps don't justify the coupling, and abstraction would break the "copy any folder as a starter" property.

## Open Questions Surfaced for Implementation

1. **Font CSS class prefix** — confirm `dev dev-<name>` against the actual generated `packages/font/dist/devicons.css` before writing the font and core apps' font-mode rendering.
2. **Sprite symbol ID format** — confirm `<use href="<url>#<name>">` against the actual `packages/core/dist/sprite/sprite-symbol.svg` symbol IDs before writing the core app's sprite-mode rendering.

Both confirmations are cheap and must happen as the first steps of the implementation plan; if either assumption is wrong, the App code adjusts to use whatever the build artifact actually emits.

## Success Criteria

- `pnpm install` at the repo root succeeds with `examples/*` added to the workspace.
- For each of the four examples, after running its prerequisite build, `pnpm -F @dev.icons/example-<name> dev` opens a Vite dev server that renders a responsive grid of every icon, with a working name search and the example-specific toggle.
- Each example's `vite build` produces a working static bundle.
- `pnpm test` at the repo root behaves identically to before (the examples don't introduce a test script that would be picked up by `-r --parallel`).
- No semantic-release publish targets the examples (verified by `pnpm release:dry`).

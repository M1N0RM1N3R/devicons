# Mono Prop Refactor — Design

**Date:** 2026-04-17
**Status:** Approved

## Problem

The three framework packages (react, vue, svelte) expose a `type?: "icon" | "font"` prop on every icon component. The website documentation already documents the public API as `mono?: boolean` (default `false`). The implementation needs to align with the documented API.

## Goals

1. Replace `type?: IconType` with `mono?: boolean` (default `false`) in the `IconProps` interface for all three framework packages.
2. `mono` cascades through context providers exactly as `type` did.
3. Update all tests to use the new prop.
4. Update the top-level example apps to rename the "Font" toggle to "Mono".
5. No change to generated defs files or codegen templates — internal Map keys stay `"icon"` / `"font"`.

## Non-Goals

- Regenerating the ~5000 generated icon component/defs files.
- Changing codegen templates in `packages/codegen/`.
- Changing website components (`icon-preview-grid.tsx`, `svg-actions.tsx`) which use `IconVariant` for file path resolution, not the framework prop.

## Changes Per Framework

### Types (`src/lib/types.ts`)

All three packages:
- Remove `type?: IconType` from `IconProps`.
- Add `mono?: boolean` to `IconProps`.
- Keep `IconType` exported (the React generated defs import it from `"../lib"`; removing the export would break ~1689 generated files without regeneration). It's harmless once `type` is removed from `IconProps` — no consumer would reference it.

Before:
```ts
export type IconType = "icon" | "font";
export interface IconProps {
  // ...
  type?: IconType;
}
```

After:
```ts
export type IconType = "icon" | "font"; // kept exported for generated defs
export interface IconProps {
  // ...
  mono?: boolean;
}
```

### Base Components

**React (`src/lib/base.tsx`):**
- Destructure `mono` instead of `type` from merged props.
- Resolution: `const resolvedMono = mono ?? context.mono ?? false;`
- Lookup: `icons.get(resolvedMono ? "font" : "icon")`

**React SSR (`src/lib/ssr.tsx`):**
- Destructure `mono` instead of `type`.
- Lookup: `icons.get(mono ? "font" : "icon")`

**Vue (`src/lib/Base.vue`):**
- `const resolvedMono = computed(() => props.mono ?? context.mono ?? false);`
- `const iconContent = computed(() => props.icons.get(resolvedMono.value ? "font" : "icon") ?? "");`

**Svelte (`src/lib/Base.svelte`):**
- `const resolvedMono = $derived(mono ?? context.mono ?? false);`
- `const iconContent = $derived(icons.get(resolvedMono ? "font" : "icon") ?? "");`

### Context Providers

**React (`src/lib/ctx.ts`):**
- Default: `mono: false` (was `type: "icon"`)

**Vue (`src/lib/context.ts`):**
- Default: `mono: false` (was `type: "icon"`)

**Svelte (`src/lib/context.ts`):**
- Default: `mono: false` (was `type: "icon"`)

### Tests

All three packages' test files:
- Change `type: "font"` to `mono: true` in props.
- Update test names from `"type='font' switches..."` to `"mono switches to monochrome variant"`.

### Top-Level Examples

**`examples/react/src/App.tsx`, `examples/vue/src/App.vue`, `examples/svelte/src/App.svelte`:**
- Rename toggle labels from "Icon (SVG) / Font" to "Colorful / Mono".
- State variable changes from `type: "icon" | "font"` to `mono: boolean`.
- Pass `mono={mono}` (React), `:mono="mono"` (Vue), `{mono}` (Svelte) instead of `type={type}`.

**`examples/font/` and `examples/core/`:**
- No change — these use the font CSS / sprite directly, not the framework prop.

### Documentation

Already correct. All three framework MDX docs (`react.mdx`, `vue.mdx`, `svelte.mdx`) document `mono: boolean` with no mention of `type`. No doc changes needed.

## Files Touched (exhaustive)

| File | Change |
|------|--------|
| `packages/react/src/lib/types.ts` | `type` → `mono` in IconProps |
| `packages/react/src/lib/base.tsx` | Resolution + lookup |
| `packages/react/src/lib/ssr.tsx` | Resolution + lookup |
| `packages/react/src/lib/ctx.ts` | Default context |
| `packages/react/test/render.test.tsx` | Test props + names |
| `packages/vue/src/lib/types.ts` | `type` → `mono` in IconProps |
| `packages/vue/src/lib/Base.vue` | Resolution + lookup |
| `packages/vue/src/lib/context.ts` | Default context |
| `packages/vue/test/render.test.ts` | Test props + names |
| `packages/svelte/src/lib/types.ts` | `type` → `mono` in IconProps |
| `packages/svelte/src/lib/Base.svelte` | Resolution + lookup |
| `packages/svelte/src/lib/context.ts` | Default context |
| `packages/svelte/test/render.test.ts` | Test props + names |
| `examples/react/src/App.tsx` | Toggle labels + prop |
| `examples/vue/src/App.vue` | Toggle labels + prop |
| `examples/svelte/src/App.svelte` | Toggle labels + prop |

## Success Criteria

- `pnpm -r --parallel test` passes for react, vue, and svelte packages (excluding the pre-existing font codepoint gap failure).
- All three example apps render correctly with "Colorful / Mono" toggle.
- No changes to generated files (`src/defs/`, `src/ssr/`, `src/icons/`).
- Website docs remain accurate (already document `mono`).

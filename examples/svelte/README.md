# Devicons Svelte Example

Renders every icon component from [`@dev.icons/svelte`](../../packages/svelte) in
a responsive grid. Toggle each card between SVG (`type="icon"`) and webfont
(`type="font"`) rendering. Click any icon to copy its name.

## Setup

The example consumes the built `dist/` from the Svelte package, so build it once:

```sh
# from repo root
pnpm -F @dev.icons/svelte build
```

## Run

```sh
pnpm -F @dev.icons/example-svelte dev
```

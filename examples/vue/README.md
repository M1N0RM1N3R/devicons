# Devicons Vue Example

Renders every icon component from [`@dev.icons/vue`](../../packages/vue) in a
responsive grid. Toggle each card between SVG (`type="icon"`) and webfont
(`type="font"`) rendering. Click any icon to copy its name.

## Setup

The example consumes the built `dist/` from the Vue package, so build it once:

```sh
# from repo root
pnpm -F @dev.icons/vue build
```

## Run

```sh
pnpm -F @dev.icons/example-vue dev
```

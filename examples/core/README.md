# Devicons Core Example

Renders every icon from [`@dev.icons/core`](../../packages/core) in two modes:
**Sprite** (colorful SVG via `<use href>`) and **Font** (monochrome glyph). Toggle
between them in the header. Click any icon to copy its name.

## Setup

The example consumes the built sprite SVG and font CSS from the core package, so
build it once:

```sh
# from repo root
pnpm -F @dev.icons/core build
```

## Run

```sh
pnpm -F @dev.icons/example-core dev
```

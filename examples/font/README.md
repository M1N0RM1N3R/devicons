# Devicons Font Example

Renders every icon from the [`devicons`](../../packages/font) webfont package in
a responsive grid. Click any icon to copy its name. Filter by name or by
`isVariant` (`-icon` suffixed entries).

## Setup

The example consumes the built CSS + woff2 from the font package, so build it once:

```sh
# from repo root
pnpm -F devicons build
pnpm -F @dev.icons/core build
```

## Run

```sh
pnpm -F @dev.icons/example-font dev
```

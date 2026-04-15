// Shared OG theme tokens and layout sizes — referenced by both the
// build-time (Node / sharp) renderer and the edge (Workers / resvg-wasm)
// renderer so the two paths stay pixel-consistent.

export const OG = {
  width: 1200,
  height: 630,
  bg: '#000000',
  surface: '#0a0a0a',
  border: '#1a1a1a',
  text: '#e6e6e6',
  textMuted: '#8a8a8a',
  accent: '#ff4d00',
  fontDisplay: 'Display',
  fontMono: 'Mono',
} as const;

export function approxTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

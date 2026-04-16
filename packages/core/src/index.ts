// packages/core/src/index.ts
import { ICONS_DATA } from './icons-data';

export interface IconRecord {
  /** Filename stem (no `.svg`), e.g. `"adonisjs"` or `"adonisjs-icon"`. */
  name: string;
  /** Decimal codepoint in the Private Use Area, e.g. `61697`. */
  codepoint: number;
  /** Single-character unicode string (`String.fromCodePoint(codepoint)`). */
  unicode: string;
  /** True iff `name` ends in `-icon`. */
  isVariant: boolean;
}

/** All icons, sorted by codepoint ascending. */
export const ICONS: readonly IconRecord[] = ICONS_DATA;

const BY_NAME: Map<string, IconRecord> = new Map(
  ICONS_DATA.map((icon) => [icon.name, icon]),
);

/** Lookup an icon by name. O(1). Returns `undefined` if the name is unknown. */
export const getIcon = (name: string): IconRecord | undefined =>
  BY_NAME.get(name);

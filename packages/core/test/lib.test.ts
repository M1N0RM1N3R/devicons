// packages/core/test/lib.test.ts
import { describe, expect, it } from 'vitest';
import { ICONS, getIcon, type IconRecord } from '../src/index';

describe('@dev.icons/core library entry', () => {
  it('exposes a non-empty icon manifest', () => {
    expect(Array.isArray(ICONS)).toBe(true);
    expect(ICONS.length).toBeGreaterThan(0);
  });

  it('every icon has name + numeric codepoint + unicode escape', () => {
    for (const icon of ICONS) {
      expect(typeof icon.name).toBe('string');
      expect(icon.name.length).toBeGreaterThan(0);
      expect(typeof icon.codepoint).toBe('number');
      expect(icon.codepoint).toBeGreaterThan(0);
      expect(typeof icon.unicode).toBe('string');
      expect(icon.unicode.length).toBe(1);
      expect(icon.unicode.codePointAt(0)).toBe(icon.codepoint);
    }
  });

  it('flags icon variants (names ending in -icon)', () => {
    const variant = ICONS.find((i) => i.name.endsWith('-icon'));
    const plain = ICONS.find((i) => !i.name.endsWith('-icon'));
    expect(variant?.isVariant).toBe(true);
    expect(plain?.isVariant).toBe(false);
  });

  it('getIcon() returns a record by name and undefined for unknown', () => {
    const known: IconRecord | undefined = getIcon('adonisjs');
    expect(known?.name).toBe('adonisjs');
    expect(getIcon('nope-not-real')).toBeUndefined();
  });

  it('manifest is sorted by codepoint ascending', () => {
    for (let i = 1; i < ICONS.length; i++) {
      expect(ICONS[i].codepoint).toBeGreaterThan(ICONS[i - 1].codepoint);
    }
  });
});

export interface ColorBucket {
  slug: string;
  label: string;
  hex: string;
}

export const COLOR_BUCKETS: ColorBucket[] = [
  { slug: 'red', label: 'Red', hex: '#ef4444' },
  { slug: 'orange', label: 'Orange', hex: '#f97316' },
  { slug: 'yellow', label: 'Yellow', hex: '#eab308' },
  { slug: 'green', label: 'Green', hex: '#22c55e' },
  { slug: 'teal', label: 'Teal', hex: '#14b8a6' },
  { slug: 'blue', label: 'Blue', hex: '#3b82f6' },
  { slug: 'purple', label: 'Purple', hex: '#a855f7' },
  { slug: 'pink', label: 'Pink', hex: '#ec4899' },
  { slug: 'gray', label: 'Gray', hex: '#6b7280' },
  { slug: 'black', label: 'Black', hex: '#0a0a0a' },
  { slug: 'white', label: 'White', hex: '#fafafa' },
];

const parseHex = (hex: string): [number, number, number] | null => {
  const m = hex.trim().replace(/^#/, '');
  const full =
    m.length === 3
      ? m
          .split('')
          .map((c) => c + c)
          .join('')
      : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

// Returns [h (0-360), s (0-1), l (0-1)]
const rgbToHsl = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      case bn:
        h = ((rn - gn) / d + 4) * 60;
        break;
    }
  }
  return [h, s, l];
};

export const bucketForHex = (hex: string | undefined): string | null => {
  if (!hex) return null;
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(...rgb);
  if (l < 0.1) return 'black';
  if (l > 0.92 && s < 0.1) return 'white';
  if (s < 0.1) return 'gray';
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 160) return 'green';
  if (h < 190) return 'teal';
  if (h < 250) return 'blue';
  if (h < 290) return 'purple';
  if (h < 345) return 'pink';
  return 'red';
};

import { Shader, smoothStep, texture } from "./shader";

const MAP_SIZE = 192;
const INF = 1e9;

function meijsterSdf(mask: Uint8Array, w: number, h: number): Float32Array {
  const dist = new Float32Array(w * h);
  const g = new Float32Array(w * h);

  for (let x = 0; x < w; x++) {
    g[x] = mask[x] ? 0 : INF;
    for (let y = 1; y < h; y++) {
      const i = y * w + x;
      g[i] = mask[i] ? 0 : 1 + (g[i - w] ?? INF);
    }
    for (let y = h - 2; y >= 0; y--) {
      const i = y * w + x;
      const below = g[i + w] ?? INF;
      const cur = g[i] ?? INF;
      if (below < cur) g[i] = 1 + below;
    }
  }

  const s = new Int32Array(w);
  const t = new Int32Array(w);
  const f = (x: number, i: number, row: Float32Array) => {
    const gv = row[i] ?? INF;
    return (x - i) * (x - i) + gv * gv;
  };
  const sep = (i: number, u: number, row: Float32Array) => {
    const gi = row[i] ?? 0;
    const gu = row[u] ?? 0;
    return Math.floor((u * u - i * i + gu * gu - gi * gi) / (2 * (u - i)));
  };

  for (let y = 0; y < h; y++) {
    const off = y * w;
    const row = g.subarray(off, off + w);
    let q = 0;
    s[0] = 0;
    t[0] = 0;
    for (let u = 1; u < w; u++) {
      while (q >= 0 && f(t[q]!, s[q]!, row) > f(t[q]!, u, row)) q--;
      if (q < 0) {
        q = 0;
        s[0] = u;
      } else {
        const w2 = 1 + sep(s[q]!, u, row);
        if (w2 < w) {
          q++;
          s[q] = u;
          t[q] = w2;
        }
      }
    }
    for (let u = w - 1; u >= 0; u--) {
      dist[off + u] = Math.sqrt(f(u, s[q]!, row));
      if (u === t[q]!) q--;
    }
  }
  return dist;
}

async function rasterizeSvg(
  url: string,
  size: number,
): Promise<ImageData | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  const dataUrl = `data:image/svg+xml;base64,${btoa(
    String.fromCharCode(...new TextEncoder().encode(text)),
  )}`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  const loaded = new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
  img.src = dataUrl;
  if (!(await loaded)) return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const iw = img.width || size;
  const ih = img.height || size;
  const scale = Math.min(size / iw, size / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
  return ctx.getImageData(0, 0, size, size);
}

interface LogoSdf {
  size: number;
  /** Signed distance in normalized units [-1..+1 range, 0 at edge]. Negative inside. */
  signed: Float32Array;
}

async function buildLogoSdf(svgUrl: string): Promise<LogoSdf | null> {
  const data = await rasterizeSvg(svgUrl, MAP_SIZE);
  if (!data) return null;

  const n = MAP_SIZE * MAP_SIZE;
  const inside = new Uint8Array(n);
  const outside = new Uint8Array(n);
  let filled = 0;
  for (let i = 0; i < n; i++) {
    const a = data.data[i * 4 + 3] ?? 0;
    if (a > 16) {
      inside[i] = 1;
      filled++;
    } else {
      outside[i] = 1;
    }
  }
  if (filled < 16) return null;

  const dInsideToOutside = meijsterSdf(outside, MAP_SIZE, MAP_SIZE);
  const dOutsideToInside = meijsterSdf(inside, MAP_SIZE, MAP_SIZE);

  const signed = new Float32Array(n);
  const half = MAP_SIZE * 0.5;
  for (let i = 0; i < n; i++) {
    const inner = dInsideToOutside[i] ?? 0;
    const outer = dOutsideToInside[i] ?? 0;
    signed[i] = (outer - inner) / half;
  }
  return { size: MAP_SIZE, signed };
}

function sampleSdfBilinear(sdf: LogoSdf, u: number, v: number): number {
  const s = sdf.size;
  const fx = Math.max(0, Math.min(s - 1.001, u * (s - 1)));
  const fy = Math.max(0, Math.min(s - 1.001, v * (s - 1)));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const i00 = y0 * s + x0;
  const a = sdf.signed[i00] ?? 0;
  const b = sdf.signed[i00 + 1] ?? 0;
  const c = sdf.signed[i00 + s] ?? 0;
  const d = sdf.signed[i00 + s + 1] ?? 0;
  return (
    a * (1 - tx) * (1 - ty) +
    b * tx * (1 - ty) +
    c * (1 - tx) * ty +
    d * tx * ty
  );
}

export interface LogoGlassOptions {
  /** Pixel size of the filter region — should match the element size. */
  size: number;
  /** The SVG element inside hero-glass-defs that hosts the filter. */
  filterHost: SVGSVGElement;
  /** Stable filter id so CSS can reference it. */
  filterId: string;
  /**
   * Strength of edge refraction. Higher = more content displaced near the
   * logo rim. Shader normalises automatically; this just scales the
   * fragment output before normalisation.
   */
  strength?: number;
}

export async function installLogoGlass(
  svgUrl: string,
  opts: LogoGlassOptions,
): Promise<Shader | null> {
  const sdf = await buildLogoSdf(svgUrl);
  if (!sdf) return null;

  // strength is the fraction of "pull toward centre" at the rim. 0.2 means
  // content near the logo edge is sampled from 20 % closer to centre.
  // Anything above ~0.35 looks like a fish-eye, below ~0.05 is invisible.
  const strength = Math.max(0.02, Math.min(0.5, opts.strength ?? 0.2));

  // Fragment mirrors shader.js's pinch-to-centre pattern, but the shape
  // function is the logo silhouette's signed distance field. Inside the
  // logo, content passes through; within the rim transition zone, content
  // is pulled toward centre — that's the refraction ring that reads as
  // curved glass.
  const fragment = (uv: { x: number; y: number }) => {
    const ix = uv.x - 0.5;
    const iy = uv.y - 0.5;
    const sd = sampleSdfBilinear(sdf, uv.x, uv.y);

    // Edge-centred transition. sd is -1..+1 (approx); 0 at rim.
    // "displacement" peaks inside near the rim and fades out.
    const displacement = smoothStep(0.22, -0.18, sd);
    const scaled = smoothStep(0, 1, displacement);

    const pinch = 1 - (1 - scaled) * strength;
    return texture(ix * pinch + 0.5, iy * pinch + 0.5);
  };

  const shader = new Shader({
    width: opts.size,
    height: opts.size,
    fragment,
    filterOnly: true,
    filterHost: opts.filterHost,
    id: opts.filterId,
  });

  return shader;
}

export function installIdentityFilter(
  host: SVGSVGElement,
  filterId: string,
): void {
  const defs = host.querySelector("defs") ?? host;
  if (defs.querySelector(`#${CSS.escape(filterId)}`)) return;
  const ns = "http://www.w3.org/2000/svg";
  const filter = document.createElementNS(ns, "filter");
  filter.setAttribute("id", filterId);
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const m = document.createElementNS(ns, "feColorMatrix");
  m.setAttribute("in", "SourceGraphic");
  m.setAttribute("type", "matrix");
  m.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0");
  filter.appendChild(m);
  defs.appendChild(filter);
}

export function scheduleIdle(cb: () => void): void {
  type IdleCb = (cb: () => void) => void;
  const w = window as unknown as { requestIdleCallback?: IdleCb };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
  else setTimeout(cb, 0);
}

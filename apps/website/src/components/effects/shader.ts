// Liquid Glass shader — TS port of Shu Ding's vanilla JS implementation
// https://github.com/shuding/liquid-glass
//
// Per-pixel fragment function returns a texture sample position. The class
// computes the delta between output pixel and sample position for every
// pixel, normalises by the largest delta, packs (dx, dy) into the R/G
// channels of a canvas, and uses that as the `in2` of an
// `feDisplacementMap`. `scale` is set dynamically to the max displacement
// so the map can stay in [0, 255] without clipping.

export type Vec2 = { x: number; y: number };
export type TextureSample = { type: "t"; x: number; y: number };
export type FragmentFn = (uv: Vec2, mouse: Vec2) => TextureSample;

export interface ShaderOptions {
  width?: number;
  height?: number;
  fragment?: FragmentFn;
  canvasDPI?: number;
  /** Skip DOM container + drag listeners; only build the SVG filter. */
  filterOnly?: boolean;
  /** Existing <svg> to append the filter <defs> into. Defaults to self-created. */
  filterHost?: SVGSVGElement;
  /** Custom filter id. Defaults to a generated one. */
  id?: string;
}

export function smoothStep(a: number, b: number, t: number): number {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

export function length(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function roundedRectSDF(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): number {
  const qx = Math.abs(x) - width + radius;
  const qy = Math.abs(y) - height + radius;
  return (
    Math.min(Math.max(qx, qy), 0) +
    length(Math.max(qx, 0), Math.max(qy, 0)) -
    radius
  );
}

export function texture(x: number, y: number): TextureSample {
  return { type: "t", x, y };
}

function generateId(): string {
  return "liquid-glass-" + Math.random().toString(36).substring(2, 11);
}

const SVG_NS = "http://www.w3.org/2000/svg";

export class Shader {
  readonly width: number;
  readonly height: number;
  readonly canvasDPI: number;
  readonly id: string;
  readonly filterId: string;
  readonly filterOnly: boolean;
  fragment: FragmentFn;
  offset: number;
  mouse: Vec2;
  private mouseUsed: boolean;

  container?: HTMLDivElement;
  svg!: SVGSVGElement;
  feImage!: SVGFEImageElement;
  feDisplacementMap!: SVGFEDisplacementMapElement;
  canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;

  constructor(options: ShaderOptions = {}) {
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.fragment = options.fragment ?? ((uv) => texture(uv.x, uv.y));
    this.canvasDPI = options.canvasDPI ?? 1;
    this.id = options.id ?? generateId();
    // Keep passed id as the literal filter id so CSS `url(#...)` references line up.
    this.filterId = this.id;
    this.filterOnly = options.filterOnly ?? false;
    this.offset = 10;
    this.mouse = { x: 0, y: 0 };
    this.mouseUsed = false;

    this.createElement(options.filterHost);
    if (!this.filterOnly) this.setupEventListeners();
    this.updateShader();
  }

  private createElement(filterHost?: SVGSVGElement): void {
    if (!this.filterOnly) {
      this.container = document.createElement("div");
      this.container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${this.width}px;
        height: ${this.height}px;
        overflow: hidden;
        border-radius: 150px;
        box-shadow:
          0 4px 8px rgba(0, 0, 0, 0.25),
          0 -10px 25px inset rgba(0, 0, 0, 0.15),
          0 -1px 4px 1px inset rgba(255, 255, 255, 0.74);
        cursor: grab;
        backdrop-filter: url(#${this.filterId}) blur(0.25px) brightness(1.5) saturate(1.1);
        z-index: 9999;
        pointer-events: auto;
      `;
    }

    if (filterHost) {
      this.svg = filterHost;
    } else {
      this.svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
      this.svg.setAttribute("xmlns", SVG_NS);
      this.svg.setAttribute("width", "0");
      this.svg.setAttribute("height", "0");
      this.svg.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 9998;
      `;
    }

    let defs = this.svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVG_NS, "defs");
      this.svg.appendChild(defs);
    }

    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", this.filterId);
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");
    filter.setAttribute("width", String(this.width));
    filter.setAttribute("height", String(this.height));

    this.feImage = document.createElementNS(
      SVG_NS,
      "feImage",
    ) as SVGFEImageElement;
    this.feImage.setAttribute("id", `${this.id}-map`);
    this.feImage.setAttribute("width", String(this.width));
    this.feImage.setAttribute("height", String(this.height));

    this.feDisplacementMap = document.createElementNS(
      SVG_NS,
      "feDisplacementMap",
    ) as SVGFEDisplacementMapElement;
    this.feDisplacementMap.setAttribute("in", "SourceGraphic");
    this.feDisplacementMap.setAttribute("in2", `${this.id}-map`);
    this.feDisplacementMap.setAttribute("xChannelSelector", "R");
    this.feDisplacementMap.setAttribute("yChannelSelector", "G");

    filter.appendChild(this.feImage);
    filter.appendChild(this.feDisplacementMap);
    defs.appendChild(filter);

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width * this.canvasDPI;
    this.canvas.height = this.height * this.canvasDPI;
    this.canvas.style.display = "none";

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.context = ctx;
  }

  private constrainPosition(x: number, y: number): Vec2 {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minX = this.offset;
    const maxX = vw - this.width - this.offset;
    const minY = this.offset;
    const maxY = vh - this.height - this.offset;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }

  private setupEventListeners(): void {
    const container = this.container;
    if (!container) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      container.style.cursor = "grabbing";
      startX = e.clientX;
      startY = e.clientY;
      const rect = container.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const newX = initialX + (e.clientX - startX);
        const newY = initialY + (e.clientY - startY);
        const c = this.constrainPosition(newX, newY);
        container.style.left = `${c.x}px`;
        container.style.top = `${c.y}px`;
        container.style.transform = "none";
      }
      const rect = container.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) / rect.width;
      this.mouse.y = (e.clientY - rect.top) / rect.height;
      if (this.mouseUsed) this.updateShader();
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      container.style.cursor = "grab";
    });

    window.addEventListener("resize", () => {
      const rect = container.getBoundingClientRect();
      const c = this.constrainPosition(rect.left, rect.top);
      if (rect.left !== c.x || rect.top !== c.y) {
        container.style.left = `${c.x}px`;
        container.style.top = `${c.y}px`;
        container.style.transform = "none";
      }
    });
  }

  updateShader(): void {
    const mouseProxy = new Proxy(this.mouse, {
      get: (target, prop: keyof Vec2) => {
        this.mouseUsed = true;
        return target[prop];
      },
    });

    this.mouseUsed = false;
    const w = this.width * this.canvasDPI;
    const h = this.height * this.canvasDPI;
    const data = new Uint8ClampedArray(w * h * 4);

    let maxScale = 0;
    const rawValues: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor(i / 4 / w);
      const pos = this.fragment({ x: x / w, y: y / h }, mouseProxy);
      const dx = pos.x * w - x;
      const dy = pos.y * h - y;
      if (Math.abs(dx) > maxScale) maxScale = Math.abs(dx);
      if (Math.abs(dy) > maxScale) maxScale = Math.abs(dy);
      rawValues.push(dx, dy);
    }

    maxScale *= 0.5;
    if (maxScale === 0) maxScale = 1;

    let index = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = (rawValues[index++] ?? 0) / maxScale + 0.5;
      const g = (rawValues[index++] ?? 0) / maxScale + 0.5;
      data[i] = r * 255;
      data[i + 1] = g * 255;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }

    this.context.putImageData(new ImageData(data, w, h), 0, 0);
    this.feImage.setAttribute("href", this.canvas.toDataURL());
    this.feDisplacementMap.setAttribute(
      "scale",
      String(maxScale / this.canvasDPI),
    );
  }

  appendTo(parent: HTMLElement): void {
    if (this.svg.parentNode !== parent) parent.appendChild(this.svg);
    if (this.container && this.container.parentNode !== parent) {
      parent.appendChild(this.container);
    }
  }

  destroy(): void {
    this.svg.remove();
    this.container?.remove();
    this.canvas.remove();
  }
}

declare global {
  interface Window {
    liquidGlass?: Shader;
  }
}

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import Harness from "./BaseHarness.svelte";

const icons = new Map<string, string>([
  ["icon", '<path data-testid="body" d="M1 2"/>'],
  ["font", '<circle data-testid="body-font" r="10"/>'],
]);

describe("Base (svelte)", () => {
  it("renders svg with defaults", () => {
    const { container } = render(Harness, { props: { icons } });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(container.innerHTML).toContain('data-testid="body"');
  });

  it("applies color, size, mirrored", () => {
    const { container } = render(Harness, {
      props: { icons, color: "red", size: 32, mirrored: true },
    });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("red");
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("transform")).toBe("scale(-1, 1)");
  });

  it("type='font' switches body", () => {
    const { container } = render(Harness, {
      props: { icons, type: "font" },
    });
    expect(container.innerHTML).toContain("body-font");
  });
});

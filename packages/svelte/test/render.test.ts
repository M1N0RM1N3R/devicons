import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import Harness from "./BaseHarness.svelte";

const content = '<path data-testid="body" d="M1 2"/>';

describe("Base (svelte)", () => {
  it("renders svg with defaults", () => {
    const { container } = render(Harness, { props: { content } });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(container.innerHTML).toContain('data-testid="body"');
  });

  it("applies color, size, mirrored", () => {
    const { container } = render(Harness, {
      props: { content, color: "red", size: 32, mirrored: true },
    });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("red");
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("transform")).toBe("scale(-1, 1)");
  });
});

import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import SSRBase from "../src/lib/ssr";

describe("SSRBase", () => {
  it("renders an svg with default viewBox and icon body", () => {
    const { container, getByTestId } = render(
      <SSRBase>
        <path data-testid="body" d="M1 2" />
      </SSRBase>
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(getByTestId("body")).toBeTruthy();
  });

  it("applies color and size props", () => {
    const { container } = render(
      <SSRBase color="red" size={32}>
        <path d="M1 2" />
      </SSRBase>
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("red");
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("height")).toBe("32");
  });

  it("mirrored prop applies transform", () => {
    const { container } = render(
      <SSRBase mirrored>
        <path d="M1 2" />
      </SSRBase>
    );
    expect(container.querySelector("svg")!.getAttribute("transform")).toBe(
      "scale(-1, 1)"
    );
  });

  it("renders <title> when alt provided", () => {
    const { container } = render(
      <SSRBase alt="node">
        <path d="M1 2" />
      </SSRBase>
    );
    expect(container.querySelector("title")?.textContent).toBe("node");
  });
});

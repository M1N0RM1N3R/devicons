import { describe, it, expect } from "vitest";
import React, { ReactElement } from "react";
import { render } from "@testing-library/react";
import SSRBase from "../src/lib/ssr";
import type { IconType } from "../src/lib/types";

const icons = new Map<IconType, ReactElement>([
  ["icon", <path key="icon" data-testid="body" d="M1 2" />],
  ["font", <circle key="font" data-testid="body-font" r="10" />],
]);

describe("SSRBase", () => {
  it("renders an svg with default viewBox and icon body", () => {
    const { container, getByTestId } = render(<SSRBase icons={icons} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(getByTestId("body")).toBeTruthy();
  });

  it("applies color and size props", () => {
    const { container } = render(
      <SSRBase icons={icons} color="red" size={32} />
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("red");
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("height")).toBe("32");
  });

  it("mirrored prop applies transform", () => {
    const { container } = render(<SSRBase icons={icons} mirrored />);
    expect(container.querySelector("svg")!.getAttribute("transform")).toBe(
      "scale(-1, 1)"
    );
  });

  it("type='font' switches to font variant", () => {
    const { getByTestId } = render(<SSRBase icons={icons} type="font" />);
    expect(getByTestId("body-font")).toBeTruthy();
  });

  it("renders <title> when alt provided", () => {
    const { container } = render(<SSRBase icons={icons} alt="node" />);
    expect(container.querySelector("title")?.textContent).toBe("node");
  });
});

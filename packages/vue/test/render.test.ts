import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Base from "../src/lib/Base.vue";

const icons = new Map<string, string>([
  ["icon", '<path data-testid="body" d="M1 2"/>'],
  ["font", '<circle data-testid="body-font" r="10"/>'],
]);

describe("Base (vue)", () => {
  it("renders svg with defaults and icon body", () => {
    const wrapper = mount(Base, { props: { icons } });
    const svg = wrapper.find("svg").element as SVGSVGElement;
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(wrapper.html()).toContain('data-testid="body"');
  });

  it("applies color, size, mirrored", () => {
    const wrapper = mount(Base, {
      props: { icons, color: "red", size: 32, mirrored: true },
    });
    const svg = wrapper.find("svg").element as SVGSVGElement;
    expect(svg.getAttribute("fill")).toBe("red");
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("transform")).toBe("scale(-1, 1)");
  });

  it("mono switches to monochrome variant", () => {
    const wrapper = mount(Base, { props: { icons, mono: true } });
    expect(wrapper.html()).toContain("body-font");
  });

  it("renders title when alt provided", () => {
    const wrapper = mount(Base, { props: { icons, alt: "node" } });
    expect(wrapper.find("title").text()).toBe("node");
  });
});

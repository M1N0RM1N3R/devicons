import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Base from "../src/lib/Base.vue";

const content = '<path data-testid="body" d="M1 2"/>';

describe("Base (vue)", () => {
  it("renders svg with defaults and icon body", () => {
    const wrapper = mount(Base, { props: { content } });
    const svg = wrapper.find("svg").element as SVGSVGElement;
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 600");
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(wrapper.html()).toContain('data-testid="body"');
  });

  it("applies color, size, mirrored", () => {
    const wrapper = mount(Base, {
      props: { content, color: "red", size: 32, mirrored: true },
    });
    const svg = wrapper.find("svg").element as SVGSVGElement;
    expect(svg.getAttribute("fill")).toBe("red");
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("transform")).toBe("scale(-1, 1)");
  });

  it("renders title when alt provided", () => {
    const wrapper = mount(Base, { props: { content, alt: "node" } });
    expect(wrapper.find("title").text()).toBe("node");
  });
});

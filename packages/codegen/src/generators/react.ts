import { normalizeProps } from "@dev.icons/utils";
import type { Generator, IconRecord, Variant } from "../types";

const reactifyStyle = (svg: string) =>
  svg.replace(/style="([^"]*)"/g, (_, css: string) => {
    const pairs = css
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const obj = pairs
      .map((p) => {
        const idx = p.indexOf(":");
        if (idx === -1) return "";
        const key = p.slice(0, idx).trim();
        const val = p.slice(idx + 1).trim();
        const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        return `${camel}: ${JSON.stringify(val)}`;
      })
      .filter(Boolean)
      .join(", ");
    return obj ? `style={{${obj}}}` : "";
  });

const componentTemplate = (icon: IconRecord, variant: Variant) => {
  const body = reactifyStyle(
    normalizeProps(variant === "icon" ? icon.iconSvg : icon.fontSvg),
  );
  return `/* GENERATED FILE - DO NOT EDIT */
import React, { forwardRef } from "react";
import type { Icon } from "../lib/types";
import SSRBase from "../lib/ssr";

const I: Icon = forwardRef((props, ref) => (
  <SSRBase ref={ref} {...props}>
    ${body}
  </SSRBase>
));

I.displayName = "${icon.componentName}";
export { I as ${icon.componentName} };
`;
};

export const reactGenerator: Generator = {
  extension: "tsx",
  resolveName: (base) => base,
  emitComponent: componentTemplate,
  emitBarrel: (names) =>
    `/* GENERATED FILE - DO NOT EDIT */
${names.map((n) => `export * from "./${n}";`).join("\n")}
`,
};

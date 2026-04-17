import { normalizeProps } from "@dev.icons/utils";
import type { Generator, IconRecord, Variant } from "../types";

const componentTemplate = (icon: IconRecord, variant: Variant) => {
  const body = normalizeProps(variant === "icon" ? icon.iconSvg : icon.fontSvg);
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

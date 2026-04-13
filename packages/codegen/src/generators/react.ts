import { normalizeProps } from '@dev.icons/utils';
import type { Generator, IconRecord } from '../types';

const defsTemplate = (icon: IconRecord) => {
  const iconBody = normalizeProps(icon.iconSvg);
  const fontBody = normalizeProps(icon.fontSvg);
  return `/* GENERATED FILE - DO NOT EDIT */
import React, { ReactElement } from "react";
import { IconType } from "../lib";

export default new Map<IconType, ReactElement>([
  [
    "icon",
    <>
      ${iconBody}
    </>,
  ],
  [
    "font",
    <>
      ${fontBody}
    </>,
  ],
]);
`;
};

const componentTemplate = (icon: IconRecord) =>
  `/* GENERATED FILE - DO NOT EDIT */
import React, { forwardRef } from "react";
import type { Icon } from "../lib/types";
import SSRBase from "../lib/ssr";
import icons from "../defs/${icon.componentName}";

const I: Icon = forwardRef((props, ref) => (
  <SSRBase ref={ref} {...props} icons={icons} />
));

I.displayName = "${icon.componentName}";
export { I as ${icon.componentName} };
`;

export const reactGenerator: Generator = {
  extension: 'tsx',
  defsExtension: 'tsx',
  resolveName: base => base,
  emit: icon => ({
    defs: defsTemplate(icon),
    component: componentTemplate(icon),
  }),
  emitBarrel: names =>
    `/* GENERATED FILE - DO NOT EDIT */
${names.map(n => `export * from "./${n}";`).join('\n')}
`,
};

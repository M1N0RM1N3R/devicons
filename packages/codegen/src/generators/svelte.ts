import type { Generator, IconRecord } from "../types";

const escape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const defsTemplate = (icon: IconRecord) =>
  `/* GENERATED FILE - DO NOT EDIT */
import type { IconType } from "../lib/types";

export default new Map<IconType, string>([
  ["icon", \`${escape(icon.iconSvg)}\`],
  ["font", \`${escape(icon.fontSvg)}\`],
]);
`;

const componentTemplate = (icon: IconRecord) =>
  `<!-- GENERATED FILE - DO NOT EDIT -->
<script lang="ts">
  import Base from "../lib/Base.svelte";
  import icons from "../defs/${icon.componentName}";

  const { ...rest } = $props();
</script>

<Base {...rest} {icons} />
`;

export const svelteGenerator: Generator = {
  extension: "svelte",
  defsExtension: "ts",
  resolveName: (base) => base,
  emit: (icon) => ({
    defs: defsTemplate(icon),
    component: componentTemplate(icon),
  }),
  emitBarrel: (names) =>
    `/* GENERATED FILE - DO NOT EDIT */
${names
  .map((n) => `export { default as ${n} } from "./${n}.svelte";`)
  .join("\n")}
`,
};

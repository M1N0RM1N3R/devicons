import type { Generator, IconRecord, Variant } from "../types";

const escape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const componentTemplate = (icon: IconRecord, variant: Variant) =>
  `<!-- GENERATED FILE - DO NOT EDIT -->
<script lang="ts">
  import Base from "../lib/Base.svelte";

  const content = \`${escape(variant === "icon" ? icon.iconSvg : icon.fontSvg)}\`;

  const { ...rest } = $props();
</script>

<Base {...rest} {content} />
`;

export const svelteGenerator: Generator = {
  extension: "svelte",
  resolveName: (base) => base,
  emitComponent: componentTemplate,
  emitBarrel: (names) =>
    `/* GENERATED FILE - DO NOT EDIT */
${names
  .map((n) => `export { default as ${n} } from "./${n}.svelte";`)
  .join("\n")}
`,
};

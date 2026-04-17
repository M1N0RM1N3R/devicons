import type { Generator, IconRecord, Variant } from "../types";

const escape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const componentTemplate = (icon: IconRecord, variant: Variant) =>
  `<!-- GENERATED FILE - DO NOT EDIT -->
<script setup lang="ts">
import Base from "../lib/Base.vue";

defineOptions({ name: "${icon.componentName}" });

const content = \`${escape(variant === "icon" ? icon.iconSvg : icon.fontSvg)}\`;
</script>

<template>
  <Base v-bind="$attrs" :content="content" />
</template>
`;

export const vueGenerator: Generator = {
  extension: "vue",
  resolveName: (base) => base,
  emitComponent: componentTemplate,
  emitBarrel: (names) =>
    `/* GENERATED FILE - DO NOT EDIT */
${names.map((n) => `export { default as ${n} } from "./${n}.vue";`).join("\n")}
`,
};

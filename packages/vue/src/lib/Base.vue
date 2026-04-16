<script setup lang="ts">
import { inject, computed } from "vue";
import type { IconProps } from "./types";
import { IconContextKey, defaultContext } from "./context";

const props = defineProps<
  IconProps & {
    icons: Map<string, string>;
  }
>();

const context = inject(IconContextKey, defaultContext);

const resolvedColor = computed(() => props.color ?? context.color ?? "currentColor");
const resolvedSize = computed(() => props.size ?? context.size ?? "1em");
const resolvedMirrored = computed(() => props.mirrored ?? context.mirrored ?? false);
const resolvedMono = computed(() => props.mono ?? context.mono ?? false);
const iconContent = computed(() => props.icons.get(resolvedMono.value ? "font" : "icon") ?? "");
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="resolvedSize"
    :height="resolvedSize"
    :fill="resolvedColor"
    viewBox="0 0 600 600"
    :transform="resolvedMirrored ? 'scale(-1, 1)' : undefined"
    v-bind="$attrs"
  >
    <title v-if="props.alt">{{ props.alt }}</title>
    <slot />
    <g v-html="iconContent" />
  </svg>
</template>

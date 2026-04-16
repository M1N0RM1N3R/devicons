<script lang="ts">
  import type { Snippet } from "svelte";
  import type { IconProps } from "./types";
  import { getIconContext } from "./context";

  interface BaseProps extends IconProps {
    icons: Map<string, string>;
    children?: Snippet;
  }

  const { alt, color, size, mirrored, mono, icons, children, ...rest }: BaseProps = $props();

  const context = getIconContext();

  const resolvedColor = $derived(color ?? context.color ?? "currentColor");
  const resolvedSize = $derived(size ?? context.size ?? "1em");
  const resolvedMirrored = $derived(mirrored ?? context.mirrored ?? false);
  const resolvedMono = $derived(mono ?? context.mono ?? false);
  const iconContent = $derived(icons.get(resolvedMono ? "font" : "icon") ?? "");
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={resolvedSize}
  height={resolvedSize}
  fill={resolvedColor}
  viewBox="0 0 600 600"
  transform={resolvedMirrored ? "scale(-1, 1)" : undefined}
  {...rest}
>
  {#if alt}<title>{alt}</title>{/if}
  {#if children}{@render children()}{/if}
  {@html iconContent}
</svg>

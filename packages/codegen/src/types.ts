export type Framework = "react" | "vue" | "svelte";

export interface IconRecord {
  filename: string;
  baseName: string;
  componentName: string;
  iconSvg: string;
  fontSvg: string;
}

export type Variant = "icon" | "font";

export interface Generator {
  extension: "tsx" | "vue" | "svelte";
  resolveName: (base: string) => string;
  emitBarrel: (names: string[]) => string;
  emitComponent: (icon: IconRecord, variant: Variant) => string;
}

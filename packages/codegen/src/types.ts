export type Framework = "react" | "vue" | "svelte";

export interface IconRecord {
  filename: string;
  baseName: string;
  componentName: string;
  iconSvg: string;
  fontSvg: string;
}

export interface EmittedFile {
  path: string;
  content: string;
}

export interface GeneratorOutput {
  defs: EmittedFile;
  component: EmittedFile;
}

export interface Generator {
  extension: "tsx" | "vue" | "svelte";
  defsExtension: "tsx" | "ts";
  resolveName: (base: string) => string;
  emitBarrel: (names: string[]) => string;
  emit: (icon: IconRecord) => { defs: string; component: string };
}

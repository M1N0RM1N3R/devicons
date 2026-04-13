import type { InjectionKey } from "vue";
import type { IconProps } from "./types";

export const IconContextKey: InjectionKey<IconProps> = Symbol("DeviconsContext");

export const defaultContext: IconProps = {
  color: "currentColor",
  size: "1em",
  mirrored: false,
  type: "icon",
};

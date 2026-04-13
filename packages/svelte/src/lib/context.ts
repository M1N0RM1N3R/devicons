import { getContext, setContext } from "svelte";
import type { IconProps } from "./types";

const CONTEXT_KEY = "devicons";

export const getIconContext = (): IconProps => {
  try {
    return getContext<IconProps>(CONTEXT_KEY) ?? {};
  } catch {
    return {};
  }
};

export const setIconContext = (ctx: IconProps): void => {
  setContext(CONTEXT_KEY, ctx);
};

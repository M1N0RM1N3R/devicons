import { createContext } from "react";
import type { IconProps } from "./types";

export const IconContext = createContext<IconProps>({
  color: "currentColor",
  size: "1em",
  mirrored: false,
  mono: false,
});

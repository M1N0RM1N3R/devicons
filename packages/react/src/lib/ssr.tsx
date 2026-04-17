import React, { forwardRef } from "react";
import { IconProps } from "./types";

const SSRBase = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  const {
    alt,
    color = "currentColor",
    size = "1em",
    mirrored = false,
    children,
    ...restProps
  } = props;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={color}
      viewBox="0 0 600 600"
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...restProps}
    >
      {!!alt && <title>{alt}</title>}
      {children}
    </svg>
  );
});

SSRBase.displayName = "SSRBase";

export default SSRBase;

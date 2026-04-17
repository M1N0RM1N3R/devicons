import React, { forwardRef, useContext } from "react";
import { IconContext } from "./ctx";
import { IconProps } from "./types";

const Base = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  const { color, size, mirrored, children, ...rest } = props;

  const {
    alt,
    color: contextColor = "currentColor",
    size: contextSize,
    mirrored: contextMirrored = false,
    ...restContext
  } = useContext(IconContext);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size ?? contextSize}
      height={size ?? contextSize}
      fill={color ?? contextColor}
      viewBox="0 0 600 600"
      transform={mirrored || contextMirrored ? "scale(-1, 1)" : undefined}
      {...restContext}
      {...rest}
    >
      {!!alt && <title>{alt}</title>}
      {children}
    </svg>
  );
});

Base.displayName = "Base";

export default Base;

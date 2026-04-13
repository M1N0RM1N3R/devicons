import React, { forwardRef, ReactElement } from "react";
import { IconProps, IconType } from "./types";

interface SsrBaseProps extends IconProps {
  icons: Map<IconType, ReactElement>;
  type?: IconType;
}

const SSRBase = forwardRef<SVGSVGElement, SsrBaseProps>((props, ref) => {
  const {
    alt,
    color = "currentColor",
    size = "1em",
    mirrored = false,
    children,
    type = "icon",
    icons,
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
      {icons.get(type)}
    </svg>
  );
});

SSRBase.displayName = "SSRBase";

export default SSRBase;

import React, { forwardRef, useContext, ReactElement } from 'react';
import { IconContext } from './ctx';
import { IconProps, IconType } from './types';

interface BaseProps extends IconProps {
  icons: Map<IconType, ReactElement>;
}

const Base = forwardRef<SVGSVGElement, BaseProps>((props, ref) => {
  const { color, size, mirrored, children, icons, ...rest } = props;

  const {
    alt,
    color: contextColor = 'currentColor',
    size: contextSize,
    mirrored: contextMirrored = false,
    mono: contextMono = false,
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
      transform={mirrored || contextMirrored ? 'scale(-1, 1)' : undefined}
      {...restContext}
      {...rest}>
      {!!alt && <title>{alt}</title>}
      {children}
      {icons.get(contextMono ? "font" : "icon")}
    </svg>
  );
});

Base.displayName = 'Base';

export default Base;

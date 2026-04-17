import type {
  ComponentPropsWithoutRef,
  RefAttributes,
  ForwardRefExoticComponent,
} from "react";

export interface IconProps
  extends ComponentPropsWithoutRef<"svg">,
    RefAttributes<SVGSVGElement> {
  alt?: string;
  color?: string;
  size?: string | number;
  mirrored?: boolean;
}

export type Icon = ForwardRefExoticComponent<IconProps>;

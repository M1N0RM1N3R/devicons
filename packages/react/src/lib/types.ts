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
  mono?: boolean;
}

export type IconType = "icon" | "font";
export type Icon = ForwardRefExoticComponent<IconProps>;

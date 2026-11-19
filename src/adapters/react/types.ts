import type { HTMLAttributes } from "react";

export type TextTag = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> {
  children: string;
  as?: TextTag;
}

import { Fragment } from "react";
import type { HTMLAttributes } from "react";
import { segmentSentences } from "./index.js";
import type { WrapTextProps } from "./react.js";

export interface SentenceTextProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> {
  children: string;
  as?: WrapTextProps["as"];
  locale?: string;
}

export const SentenceText = ({ children, as: Tag = "span", locale = "ko", style, ...props }: SentenceTextProps) => {
  const segments = segmentSentences(children, locale);
  return <Tag {...props} style={{ whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "anywhere", ...style }}>
    {segments.map(({ text, start }) => {
      const content = text.trimEnd();
      return <Fragment key={start}>
        {content && <span style={{ display: "inline-block", maxWidth: "100%" }}>{content}</span>}{text.slice(content.length)}
      </Fragment>;
    })}
  </Tag>;
};

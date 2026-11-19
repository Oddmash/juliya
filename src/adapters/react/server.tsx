import { Fragment } from "react";
import { manualLines, segmentSentences } from "../../core/segmentation.js";
import type { TextProps } from "./types.js";

export interface SentenceTextProps extends TextProps {
  locale?: string;
  forcedBreaks?: readonly number[];
}

export const SentenceText = ({ children, as: Tag = "span", locale = "ko", forcedBreaks, style, ...props }: SentenceTextProps) => {
  const blocks = forcedBreaks?.length ? manualLines(children, forcedBreaks) : [{ text: children, start: 0, breakAfter: "" }];
  return <Tag {...props} style={{ whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "anywhere", ...style }}>
    {blocks.map((block, index) => <Fragment key={block.start}>
      {segmentSentences(block.text, locale).map(({ text, start }) => {
        const content = text.trimEnd();
        return <Fragment key={start}>
          {content && <span style={{ display: "inline-block", maxWidth: "100%" }}>{content}</span>}{text.slice(content.length)}
        </Fragment>;
      })}{block.breakAfter || (index < blocks.length - 1 ? <br /> : null)}
    </Fragment>)}
  </Tag>;
};

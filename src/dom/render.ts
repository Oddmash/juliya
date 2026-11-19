import { manualLines } from "../core/segmentation.js";
import type { WrappedLine } from "../core/types.js";
import { observeKowrap } from "./observe.js";
import type { KowrapController, KowrapOptions } from "./types.js";

const wrapStyles = {
  whiteSpace: "pre-wrap",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
} as const;

const renderLines = (element: HTMLElement, lines: WrappedLine[]) => {
  const doc = element.ownerDocument;
  const fragment = doc.createDocumentFragment();
  lines.forEach((line, index) => {
    fragment.append(doc.createTextNode(line.text));
    if (line.breakAfter) fragment.append(doc.createTextNode(line.breakAfter));
    else if (index < lines.length - 1) fragment.append(doc.createElement("br"));
  });
  element.replaceChildren(fragment);
};

const sameLines = (previous: WrappedLine[] | undefined, next: WrappedLine[]) => previous?.length === next.length && previous.every((line, index) => line.text === next[index]?.text && line.breakAfter === next[index]?.breakAfter);

export const mountKowrap = (element: HTMLElement, initial: KowrapOptions): KowrapController => {
  const initialLines = manualLines(initial.text, initial.forcedBreaks);
  const style = element.style;
  const previousStyles = { whiteSpace: style.whiteSpace, wordBreak: style.wordBreak, overflowWrap: style.overflowWrap };
  let options = initial;
  let previousLines: WrappedLine[] | undefined;
  let active = true;
  const applyStyles = () => Object.assign(style, wrapStyles, { overflowWrap: options.breakLongWords === false ? "normal" : "anywhere" });
  const render = (lines: WrappedLine[]) => {
    if (!sameLines(previousLines, lines)) renderLines(element, lines);
    previousLines = lines;
  };
  applyStyles();
  render(initialLines);
  const observer = observeKowrap(element, initial, ({ lines }) => render(lines));
  return {
    update: (next) => {
      if (!active) return;
      manualLines(next.text, next.forcedBreaks);
      options = next;
      applyStyles();
      observer.update(next);
    },
    refresh: observer.refresh,
    destroy: () => {
      if (!active) return;
      active = false;
      observer.destroy();
      Object.assign(style, previousStyles);
      element.textContent = options.text;
    },
  };
};

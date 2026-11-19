import { manualLines } from "../core/segmentation.js";
import type { WrappedLine } from "../core/types.js";
import { observeKowrap } from "./observe.js";
import type { KowrapController, MountKowrapOptions } from "./types.js";
import { mountInline } from "./inline.js";

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

export const mountKowrap = (element: HTMLElement, initial: MountKowrapOptions): KowrapController => {
  if (initial.inline) {
    const previous = { whiteSpace: element.style.whiteSpace, wordBreak: element.style.wordBreak, overflowWrap: element.style.overflowWrap };
    Object.assign(element.style, wrapStyles, { overflowWrap: initial.breakLongWords === false ? "normal" : "anywhere" });
    const controller = mountInline(element, initial);
    return { ...controller, update: (next) => { if (!next.inline) throw new TypeError("Cannot change inline mode"); element.style.overflowWrap = next.breakLongWords === false ? "normal" : "anywhere"; controller.update(next); }, destroy: () => { controller.destroy(); Object.assign(element.style, previous); } };
  }
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
      if (next.inline) throw new TypeError("Cannot change inline mode");
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

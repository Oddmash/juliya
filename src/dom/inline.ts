import { manualLines } from "../core/segmentation.js";
import { wrap } from "../core/wrap.js";
import type { Measure, WrappedLine } from "../core/types.js";
import { createLocalizedCanvasMeasure, languageOf } from "./measure.js";
import { fontOf, observeElementLayout } from "./observe-element.js";
import type { InlineKowrapOptions } from "./types.js";

export const inlineBreakAttribute = "data-kowrap-break";

interface Run {
  node: Text;
  start: number;
  end: number;
}

export const readInline = (element: HTMLElement) => {
  let text = "";
  const runs: Run[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === 3) {
      const value = (node as Text).data;
      runs.push({ node: node as Text, start: text.length, end: text.length + value.length });
      text += value;
    } else if (node.nodeType === 1) {
      const child = node as HTMLElement;
      if (child.hasAttribute(inlineBreakAttribute)) return;
      if (child.tagName === "BR") text += "\n";
      else child.childNodes.forEach(visit);
    }
  };
  element.childNodes.forEach(visit);
  return { text, runs };
};

export const breakOffsets = (lines: WrappedLine[]) => lines.slice(0, -1).filter((line) => !line.breakAfter).map((line) => line.end);

type ReadAuthorMarkup = <T>(read: () => T) => T;

const readStyledRuns = (element: HTMLElement) => {
  const { text, runs } = readInline(element);
  const view = element.ownerDocument.defaultView!;
  const styles = new Map<string, { font: ReturnType<typeof fontOf>; language: ReturnType<typeof languageOf> }>();
  const styled: { start: number; end: number; key: string }[] = [];
  for (const run of runs) {
    const parent = run.node.parentElement!;
    const font = fontOf(view.getComputedStyle(parent));
    const language = languageOf(parent);
    const key = JSON.stringify([font, language]);
    styles.set(key, { font, language });
    const last = styled.at(-1);
    if (last?.key === key && last.end === run.start) last.end = run.end;
    else styled.push({ start: run.start, end: run.end, key });
  }
  return { text, styles, styled };
};

export const observeInline = (element: HTMLElement, getOptions: () => InlineKowrapOptions, onBreaks: (offsets: number[]) => void, readAuthorMarkup?: ReadAuthorMarkup) => {
  let previous: { signature: string; authorSignature: string; measure: Measure; offsets: number[] } | undefined;
  let forceAuthorRead = false;
  const observer = observeElementLayout(element, (layout) => {
    const options = getOptions();
    if (!layout) {
      previous = undefined;
      onBreaks(breakOffsets(manualLines(readInline(element).text, options.forcedBreaks)));
      return;
    }
    const { locale, strategy, breakLongWords, forcedBreaks } = options;
    const signatureOf = ({ text, styled }: ReturnType<typeof readStyledRuns>) => JSON.stringify([text, layout.width, locale, strategy, breakLongWords, forcedBreaks, styled]);
    const rendered = readStyledRuns(element);
    const signature = signatureOf(rendered);
    if (!forceAuthorRead && previous?.signature === signature && previous.measure === layout.measure) {
      onBreaks(previous.offsets);
      return;
    }
    const author = readAuthorMarkup ? readAuthorMarkup(() => readStyledRuns(element)) : rendered;
    const authorSignature = signatureOf(author);
    const { text, styles, styled } = author;
    if (previous?.authorSignature === authorSignature && previous.measure === layout.measure) {
      onBreaks(previous.offsets);
      previous.signature = readAuthorMarkup ? signatureOf(readStyledRuns(element)) : signature;
      return;
    }
    const measures = new Map<string, Measure>();
    for (const [key, { font, language }] of styles) {
      measures.set(key, createLocalizedCanvasMeasure(font, element.ownerDocument, language));
    }
    const measureRange = (start: number, end: number) => styled.reduce((width, run) => {
      const left = Math.max(start, run.start);
      const right = Math.min(end, run.end);
      return left < right ? width + measures.get(run.key)!(text.slice(left, right)) : width;
    }, 0);
    const offsets = breakOffsets(wrap(text, { ...options, ...layout, measureRange }));
    onBreaks(offsets);
    previous = { signature: readAuthorMarkup ? signatureOf(readStyledRuns(element)) : signature, authorSignature, measure: layout.measure, offsets };
  });
  return {
    ...observer,
    refresh: (force = true) => {
      forceAuthorRead = force;
      try { observer.refresh(); } finally { forceAuthorRead = false; }
    },
  };
};

export const mountInline = (element: HTMLElement, initial: InlineKowrapOptions) => {
  let options = initial;
  let undo: (() => void)[] = [];
  let previous: number[] = [];
  const generated = new Set<HTMLBRElement>();
  let mutations: MutationObserver | undefined;
  const restore = () => {
    undo.reverse().forEach((apply) => apply());
    undo = [];
    previous = [];
    generated.clear();
    mutations?.takeRecords();
  };
  const render = (offsets: number[]) => {
    if (offsets.join(",") === previous.join(",")) return;
    restore();
    const { runs } = readInline(element);
    for (const offset of [...offsets].reverse()) {
      const run = runs.find(({ start, end }) => start < offset && offset <= end);
      if (!run) continue;
      const { node, start } = run;
      const br = element.ownerDocument.createElement("br");
      br.setAttribute(inlineBreakAttribute, "");
      generated.add(br);
      const position = offset - start;
      if (position === node.length) {
        node.after(br);
        undo.push(() => br.remove());
      } else {
        const left = node.data.slice(0, position);
        const tail = node.splitText(position);
        node.after(br);
        undo.push(() => {
          if (node.data === left && node.parentNode === tail.parentNode) node.appendData(tail.data);
          tail.remove();
          br.remove();
        });
      }
    }
    previous = offsets;
    mutations?.takeRecords();
  };
  const readAuthorMarkup: ReadAuthorMarkup = (read) => {
    if (!generated.size) return read();
    const positions = Array.from(element.querySelectorAll<HTMLBRElement>("br")).filter((br) => generated.has(br)).map((br) => ({ br, parent: br.parentNode!, next: br.nextSibling }));
    const selection = element.ownerDocument.getSelection();
    const anchor = selection?.anchorNode;
    const focus = selection?.focusNode;
    const anchorOffset = selection?.anchorOffset ?? 0;
    const focusOffset = selection?.focusOffset ?? 0;
    try {
      positions.forEach(({ br }) => br.remove());
      return read();
    } finally {
      positions.reverse().forEach(({ br, parent, next }) => parent.insertBefore(br, next));
      if (selection && anchor && focus && (element.contains(anchor) || element.contains(focus)) &&
        (selection.anchorNode !== anchor || selection.focusNode !== focus || selection.anchorOffset !== anchorOffset || selection.focusOffset !== focusOffset)) {
        selection.setBaseAndExtent(anchor, anchorOffset, focus, focusOffset);
      }
      mutations?.takeRecords();
    }
  };
  const observer = observeInline(element, () => options, render, readAuthorMarkup);
  const Mutation = element.ownerDocument.defaultView?.MutationObserver;
  if (Mutation) {
    mutations = new Mutation((records) => {
      if (records.some((record) => record.type !== "attributes")) restore();
      observer.refresh();
    });
    mutations.observe(element, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "lang"] });
  }
  const refresh = () => {
    const records = mutations?.takeRecords() ?? [];
    if (records.some((record) => record.type !== "attributes")) restore();
    observer.refresh();
  };
  return {
    update: (next: InlineKowrapOptions) => { options = next; refresh(); },
    refresh,
    destroy: () => { observer.destroy(); mutations?.disconnect(); restore(); },
    restore,
  };
};

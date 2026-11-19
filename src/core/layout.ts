import { boundariesOf, candidatesFrom } from "./boundaries.js";
import { visibleText } from "./segmentation.js";
import { lineCost } from "./scoring.js";
import type { Boundary, LineCandidate, ParagraphOptions, PlannedLine } from "./types.js";

interface Choice {
  count: number;
  cost: number;
  next: number;
  width: number;
}

const greedyPlan = (text: string, points: Boundary[], options: ParagraphOptions): PlannedLine[] => {
  const lines: PlannedLine[] = [];
  for (let start = 0; start < points.length - 1;) {
    let chosen: LineCandidate | undefined;
    for (const candidate of candidatesFrom(text, points, start, options)) chosen = candidate;
    if (!chosen) throw new Error("No line candidate");
    lines.push({ start: points[start]!.offset, end: points[chosen.next]!.offset, width: chosen.width });
    start = chosen.next;
  }
  return lines;
};

const balancedPlan = (text: string, points: Boundary[], options: ParagraphOptions): PlannedLine[] => {
  const last = points.length - 1;
  const choices: Choice[] = [];
  choices[last] = { count: 0, cost: 0, next: last, width: 0 };
  for (let start = last - 1; start >= 0; start--) {
    let best: Choice | undefined;
    for (const candidate of candidatesFrom(text, points, start, options)) {
      const tail = choices[candidate.next]!;
      const choice = {
        count: tail.count + 1,
        cost: tail.cost + lineCost(candidate, options.width, candidate.next === last),
        next: candidate.next,
        width: candidate.width,
      };
      if (!best || choice.count < best.count || (choice.count === best.count && choice.cost < best.cost)) best = choice;
    }
    if (!best) throw new Error("No line candidate");
    choices[start] = best;
  }
  const lines: PlannedLine[] = [];
  for (let start = 0; start < last;) {
    const choice = choices[start]!;
    lines.push({ start: points[start]!.offset, end: points[choice.next]!.offset, width: choice.width });
    start = choice.next;
  }
  return lines;
};

export const planParagraph = (text: string, options: ParagraphOptions): PlannedLine[] => {
  const visible = visibleText(text);
  const fullWidth = options.measureRange ? options.measureRange(0, visible.length) : options.measure(visible);
  if (!text || fullWidth <= options.width) return [{ start: 0, end: text.length, width: fullWidth }];
  const points = boundariesOf(text, options);
  return options.strategy === "greedy" ? greedyPlan(text, points, options) : balancedPlan(text, points, options);
};

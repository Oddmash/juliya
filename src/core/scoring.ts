import type { LineCandidate } from "./types.js";

const sentenceEnd = /[.!?。！？…][”’"')\]]*$/u;
const clauseEnd = /[,;:，、；：]$/u;
const boundModifier = /(?:^|\s)(?:이|그|저|각|모든|어떤|이런|그런|저런|다음|해당|본|여러|\S+(?:로운|스러운|적인|들의|에서의|로서의|으로의|와의|과의|사이의))$/u;

const boundaryCost = ({ fragment, emergency }: LineCandidate) => {
  if (emergency) return 0.75;
  if (sentenceEnd.test(fragment)) return 0;
  if (clauseEnd.test(fragment)) return 0.02;
  if (boundModifier.test(fragment)) return 0.35;
  return 0.06;
};

export const lineCost = (candidate: LineCandidate, availableWidth: number, isLast: boolean) => {
  const slack = (availableWidth - Math.min(candidate.width, availableWidth)) / availableWidth;
  const overflow = Math.max(0, candidate.width - availableWidth) / availableWidth;
  return slack ** 2 + overflow ** 2 * 4 + (isLast ? 0 : boundaryCost(candidate));
};

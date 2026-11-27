import type { LineCandidate, WrapLocale } from "./types.js";

const sentenceEnd = /[.!?。！？…][”’"')\]]*$/u;
const clauseEnd = /[,;:，、；：]$/u;
const boundModifier = /(?:^|\s)(?:이|그|저|각|모든|어떤|이런|그런|저런|다음|해당|본|여러|다른|같은|기존|\S*(?:로운|스러운|적인|들의|에서의|로서의|으로의|와의|과의|사이의|하는|되는|있는|없는|않는|않은|했던|하던|보이는|필요한|위한|열린|닫는))$/u;
const technicalPrefix = /^(?:[A-Z][A-Z0-9]{1,}|[A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+\.[a-z]+)$/u;
const technicalHead = /^(?:import|export|module|runtime|client|server|layer|token|hook|input|output|API|CLI|SDK|파일|모듈|출력|레이어|토큰|컴포넌트|런타임|훅|스타일)(?:[가-힣]*|[.,;:]?)$/u;
const numeralModifier = /^(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|\d+(?:[.,]\d+)?)$/u;
const counterHead = /^(?:개|명|건|번|권|회|종|가지|대|장|쪽|줄|단계|시간|분|초|일|개월|년|주)(?:의|이|가|을|를|은|는|에|로|으로|와|과|도|만|부터|까지|에서|에게|이나|나|씩|마다|으로는|로는)?[.,!?。！？…]?$/u;
const compounds: Readonly<Record<string, readonly string[]>> = {
  공통: ["패키지", "코드", "컴포넌트", "모듈"],
  패키지: ["매니저"],
  계약: ["런타임"],
  디자인: ["시스템", "토큰"],
  배포: ["구조", "단위", "경계", "결과"],
  사용: ["범위", "경험", "환경"],
  런타임: ["의존성", "검증"],
  퇴출: ["모션", "완료"],
  완료: ["처리", "콜백"],
  전체: ["스타일", "CSS", "코드"],
  실제: ["사용", "화면", "입력"],
  숨겨진: ["입력", "요소", "폼"],
  키보드: ["포커스", "입력"],
  접근: ["가능한"],
};

const adverbialModifier = /^[가-힣]+게$/u;
const predicateHead = /^[가-힣]+(?:거나|지만|면서|도록|고|면|며|다|요|기|지|게|서)[.!?。！？…,;:]?$/u;
const vowelPredicateStems = new Set(["가", "오", "보", "주", "쓰", "켜", "끄", "뛰", "서", "자", "피", "치", "비치", "보이", "들리", "바꾸", "만드", "지나", "나오", "들어오"]);
const inflectedPredicateHead = (word: string) => {
  const match = /^([가-힣]+)[.!?。！？…,;:]?$/u.exec(word);
  if (!match) return false;
  const head = match[1]!;
  const last = head.charCodeAt(head.length - 1) - 0xac00;
  const final = last % 28;
  if (final !== 4 && final !== 8) return false;
  const stem = head.slice(0, -1) + String.fromCharCode(0xac00 + last - final);
  return vowelPredicateStems.has(stem) || /(?:하|되|시키)$/u.test(stem);
};

const protectedPair = (fragment: string, nextWord: string) => {
  const left = fragment.match(/\S+$/u)?.[0] ?? "";
  if (adverbialModifier.test(left) && !left.endsWith("에게") && (predicateHead.test(nextWord) || inflectedPredicateHead(nextWord))) return true;
  if (numeralModifier.test(left) && counterHead.test(nextWord)) return true;
  if (technicalPrefix.test(left) && technicalHead.test(nextWord)) return true;
  return Object.hasOwn(compounds, left) && compounds[left]!.some((head) => nextWord.startsWith(head));
};

const englishModifier = /(?:^|\s)(?:a|an|the|this|that|these|those|every|each|some|my|your|our|their|its|to|of|for|with|from|in|on|at|as)$/iu;
const boundaryCost = ({ fragment, emergency }: LineCandidate, nextWord: string, locale: WrapLocale = "ko") => {
  if (emergency) return 0.75;
  if (sentenceEnd.test(fragment)) return 0;
  if (clauseEnd.test(fragment)) return 0.02;
  if (locale === "ko" && protectedPair(fragment, nextWord)) return 0.65;
  if (locale === "ko" && boundModifier.test(fragment)) return 0.45;
  if (locale === "en" && englishModifier.test(fragment)) return 0.45;
  return 0.06;
};

export const lineCost = (candidate: LineCandidate, availableWidth: number, isLast: boolean, nextWord = "", locale: WrapLocale = "ko") => {
  const slack = (availableWidth - Math.min(candidate.width, availableWidth)) / availableWidth;
  const overflow = Math.max(0, candidate.width - availableWidth) / availableWidth;
  return slack ** 2 + overflow ** 2 * 4 + (isLast ? 0 : boundaryCost(candidate, nextWord, locale));
};

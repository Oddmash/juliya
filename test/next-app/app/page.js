import { wrap } from "@oddmash/kowrap";
import { WrapText } from "@oddmash/kowrap/react";
import { SentenceText } from "@oddmash/kowrap/react/server";
import { portfolioCorpus } from "../../fixtures/portfolio-prose.mjs";

const text = "오늘은 모든 사람이 함께 자연스러운 한국어 줄바꿈을 경험할 수 있습니다.";

const Page = () => {
  const serverLines = wrap(text, { width: 12, measure: (value) => [...value].length });
  return <main>
    <WrapText as="h1" id="title" style={{ width: "min(480px, 90vw)", fontSize: 24 }}>{text}</WrapText>
    <section id="portfolio-prose">{portfolioCorpus.map((paragraph, index) => <WrapText key={index} as="p" data-prose={index} style={{ width: "min(850px, 90vw)", fontSize: 17, lineHeight: 1.9 }}>{paragraph}</WrapText>)}</section>
    <p id="server-count">{serverLines.length}</p>
    <SentenceText as="p" id="sentence">한 문장입니다. 다른 문장입니다.</SentenceText>
  </main>;
};

export default Page;

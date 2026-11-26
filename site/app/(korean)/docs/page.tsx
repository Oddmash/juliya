import type { Metadata } from "next";
import { DocsPage } from "../../../components/docs-page";
import { getGuide } from "../../../lib/guides";

export const metadata: Metadata = { title: "빠르게 시작하기" };

const Page = () => <DocsPage guide={getGuide("start")!} />;

export default Page;

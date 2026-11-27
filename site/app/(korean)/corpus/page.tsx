import { CorpusPage } from "../../../components/corpus-page";
import { corpusCopy } from "../../../lib/corpus-copy";

export const metadata = { title: corpusCopy.ko.pageTitle, description: corpusCopy.ko.pageDescription };
const Page = () => <CorpusPage locale="ko" />;
export default Page;

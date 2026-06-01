import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicMarkdownViewProps = {
  entry: ProductDocumentationEntry;
  markdown: string;
};

/** Renders curated repo markdown inside the operator help shell (no GitHub chrome). */
export function HelpTopicMarkdownView(props: HelpTopicMarkdownViewProps): React.ReactElement {
  const { entry, markdown } = props;

  return (
    <article className="space-y-6">
      <HelpTopicHashScroll />
      <header className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <p className="m-0">
          <Link href="/help" className={`text-sm underline-offset-2 hover:underline ${DESIGN_TOKENS.accent.link}`}>
            ← Back to Help
          </Link>
        </p>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{entry.title}</h1>
        <p className={`m-0 max-w-prose ${OPERATOR_TYPOGRAPHY.meta}`}>{entry.summary}</p>
      </header>

      <div className="max-w-prose">
        <MarketingAccessibilityMarkdownFragment markdownBody={markdown} tableCaption={`${entry.title} reference table`} />
      </div>
    </article>
  );
}

import { cn } from "@/lib/utils";
import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

type HelpTopicMarkdownViewProps = {
  entry: ProductDocumentationEntry;
  markdown: string;
};

/** Renders curated repo markdown inside the operator help shell (no GitHub chrome). */
export function HelpTopicMarkdownView(props: HelpTopicMarkdownViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const headings = extractHelpMarkdownHeadings(markdown);

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap}>
      <HelpTopicHashScroll />
      <header className={cn("border-b border-neutral-200 pb-5 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{entry.title}</h1>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.meta}`}>{entry.summary}</p>
        {entry.audience === "developer" ? (
          <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.label}`}>
            Engineering runbook — CLI commands, environment variables, and log detail. For symptom-first operator help,
            open{" "}
            <Link href={inAppHelpHref("troubleshooting")} className={`underline-offset-2 hover:underline ${DESIGN_TOKENS.accent.link}`}>
              Troubleshooting
            </Link>
            .
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-start">
        <div className="min-w-0 max-w-3xl">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={entry.sourcePaths[0]}
          />
        </div>
        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}

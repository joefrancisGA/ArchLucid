import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

type HelpTopicMarkdownViewProps = {
  entry: ProductDocumentationEntry;
  markdown: string;
};

/** Renders curated repo markdown inside the operator help shell (no GitHub chrome). */
export function HelpTopicMarkdownView(props: HelpTopicMarkdownViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath);
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap}>
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{entry.title}</h1>
        <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>{entry.summary}</p>
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

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-topic-content">
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

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REVIEW_GUIDE_HELP_OVERVIEW,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE,
  REVIEW_GUIDE_HELP_PAGE_TITLE,
  REVIEW_GUIDE_HELP_PATH,
  REVIEW_GUIDE_HELP_PRIMARY_ACTIONS,
} from "@/lib/review-guide-help-guide-content";
import { cn } from "@/lib/utils";

type HelpReviewGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty review wizard field-reference for `/help/review-guide` (HR). */
export function HelpReviewGuideView(props: HelpReviewGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-review-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={REVIEW_GUIDE_HELP_PAGE_TITLE}
        titleTestId="help-review-guide-page-title"
        subtitle={REVIEW_GUIDE_HELP_PAGE_SUBTITLE}
        navHref={REVIEW_GUIDE_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-review-guide-header-actions">
            <Button asChild size="sm" variant="primary" data-testid="help-review-guide-start-review">
              <Link href={REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href}>
                {REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.href}>
                {REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.label}
              </Link>
            </Button>
            <Link
              href={REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.findingsGuide.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.findingsGuide.label}
            </Link>
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-review-guide-overview">
            {REVIEW_GUIDE_HELP_OVERVIEW}
          </p>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-review-guide-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}

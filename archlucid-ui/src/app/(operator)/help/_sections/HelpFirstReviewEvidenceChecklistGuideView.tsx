import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { FirstReviewHelpClaimDisciplineStrip } from "@/components/help/FirstReviewHelpClaimDisciplineStrip";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  buildFirstReviewHelpTocHeadings,
  FIRST_REVIEW_HELP_EVIDENCE_ARC,
  FIRST_REVIEW_HELP_OVERVIEW,
  FIRST_REVIEW_HELP_PAGE_SUBTITLE,
  FIRST_REVIEW_HELP_PAGE_TITLE,
  FIRST_REVIEW_HELP_PRIMARY_ACTIONS,
} from "@/lib/first-review-help-guide-content";
import { FIRST_REVIEW_HELP_PATH } from "@/lib/first-review-help-route";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpFirstReviewEvidenceChecklistGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin/SE first-run evidence checklist for `/help/first-review` (traffic FI). */
export function HelpFirstReviewEvidenceChecklistGuideView(
  props: HelpFirstReviewEvidenceChecklistGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = buildFirstReviewHelpTocHeadings(extractHelpMarkdownHeadings(preparedMarkdown));
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-first-review-evidence-checklist-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={FIRST_REVIEW_HELP_PAGE_TITLE}
        titleTestId="help-first-review-page-title"
        subtitle={FIRST_REVIEW_HELP_PAGE_SUBTITLE}
        navHref={FIRST_REVIEW_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-first-review-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <FirstReviewHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <div className="space-y-6" data-testid="help-first-review-first-viewport">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-first-review-overview">
              {FIRST_REVIEW_HELP_OVERVIEW}
            </p>

            <section
              aria-labelledby="help-first-review-arc-heading"
              data-testid="help-first-review-evidence-arc"
              id="evidence-arc"
            >
              <h2
                id="help-first-review-arc-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                Evidence arc
              </h2>
              <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                {FIRST_REVIEW_HELP_EVIDENCE_ARC.map((beat) => (
                  <li key={beat}>{beat}</li>
                ))}
              </ol>
            </section>

            <Card
              className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
              data-testid="help-first-review-action-panel"
            >
              <CardHeader className={OPERATOR_CARD.header}>
                <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                  Run the evidence path
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
                <Button asChild size="sm" variant="primary">
                  <Link href={FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.href}>
                    {FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.label}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={FIRST_REVIEW_HELP_PRIMARY_ACTIONS.startArchitectureReview.href}>
                    {FIRST_REVIEW_HELP_PRIMARY_ACTIONS.startArchitectureReview.label}
                  </Link>
                </Button>
                <Link
                  href={FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openAuditTrail.href}
                  className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
                >
                  {FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-first-review-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={preparedMarkdown}
            />
          </div>
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
      </div>
    </article>
  );
}

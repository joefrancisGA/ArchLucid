import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { ReviewGuideHelpHeaderAsOfLine } from "@/components/help/ReviewGuideHelpHeaderAsOfLine";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
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
  REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  REVIEW_GUIDE_HELP_OVERVIEW,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE,
  REVIEW_GUIDE_HELP_PAGE_TITLE,
  REVIEW_GUIDE_HELP_PATH,
  REVIEW_GUIDE_HELP_PRIMARY_ACTIONS,
  stripReviewGuideClaimDisciplineFromMarkdown,
} from "@/lib/review-guide-help-guide-content";
import { cn } from "@/lib/utils";

type HelpReviewGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

const REVIEW_GUIDE_CONTENT_GRID =
  "grid w-full max-w-[90rem] grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:items-start";

/** Specialty review wizard field-reference for `/help/review-guide` (HR). */
export function HelpReviewGuideView(props: HelpReviewGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const bodyMarkdown = stripReviewGuideClaimDisciplineFromMarkdown(markdown);
  const preparedMarkdown = prepareHelpMarkdownForPresentation(bodyMarkdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[90rem]")}
      data-testid="help-review-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={REVIEW_GUIDE_HELP_PAGE_TITLE}
        titleTestId="help-review-guide-page-title"
        subtitle={REVIEW_GUIDE_HELP_PAGE_SUBTITLE}
        navHref={REVIEW_GUIDE_HELP_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-review-guide-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: REVIEW_GUIDE_HELP_PAGE_TITLE }]}
          />
        }
        metadata={
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            data-testid="help-review-guide-header-metadata"
          >
            <ReviewGuideHelpHeaderAsOfLine entry={entry} />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-review-guide-header-actions">
            <Button
              asChild
              size="sm"
              variant="primary"
              className="min-h-6 min-w-6"
              data-testid="help-review-guide-start-review"
            >
              <Link href={REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href}>
                {REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="min-h-6 min-w-6">
              <Link href={REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.href}>
                {REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.label}
              </Link>
            </Button>
            <span
              className="mx-1 hidden h-5 w-px bg-neutral-300 sm:inline-block dark:bg-neutral-700"
              aria-hidden="true"
            />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      >
        <HelpTopicExportClaimDiscipline claimDiscipline={REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE} />
      </OperatorPageHeader>

      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3 print:border print:border-neutral-400")}
        data-testid="help-review-guide-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <div className={REVIEW_GUIDE_CONTENT_GRID}>
        <div className="min-w-0 space-y-6">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-review-guide-overview">
            {REVIEW_GUIDE_HELP_OVERVIEW}
          </p>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-review-guide-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={bodyMarkdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-review-guide-footer-actions"
          >
            <Button asChild size="sm" variant="primary" className="min-h-6 min-w-6">
              <Link
                href={REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href}
                data-testid="help-review-guide-start-review-footer"
              >
                {REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </Button>
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}

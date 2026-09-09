import Link from "next/link";

import { HelpReviewGuideRelatedGuidesSection } from "@/app/(operator)/help/_sections/HelpReviewGuideRelatedGuidesSection";
import { HelpReviewGuideSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpReviewGuideSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { ReviewGuideHelpClaimDisciplineStrip } from "@/components/help/ReviewGuideHelpClaimDisciplineStrip";
import { ReviewGuideHelpHeaderAsOfLine } from "@/components/help/ReviewGuideHelpHeaderAsOfLine";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  REVIEW_GUIDE_HELP_OVERVIEW,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE,
  REVIEW_GUIDE_HELP_PAGE_TITLE,
  REVIEW_GUIDE_HELP_PATH,
  REVIEW_GUIDE_HELP_PRIMARY_ACTIONS,
  prepareReviewGuideHelpBodyMarkdown,
} from "@/lib/review-guide-help-guide-content";
import {
  REVIEW_GUIDE_HELP_BUYER_OVERVIEW,
  REVIEW_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID,
  REVIEW_GUIDE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  REVIEW_GUIDE_HELP_PAGE_LEAD,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE_BUYER,
  REVIEW_GUIDE_HELP_PRIMARY_CONTENT_ID,
  REVIEW_GUIDE_HELP_SKIP_LINK_LABEL,
  REVIEW_GUIDE_HELP_SKIP_TARGET_ID,
  REVIEW_GUIDE_HELP_START_HERE_HELPER,
  REVIEW_GUIDE_HELP_WORKSPACE_TEST_ID,
} from "@/lib/review-guide-help-page-copy";
import { cn } from "@/lib/utils";

type HelpReviewGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function reviewGuideHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? REVIEW_GUIDE_HELP_PAGE_SUBTITLE_BUYER : REVIEW_GUIDE_HELP_PAGE_SUBTITLE;
}

function ReviewGuideStartHerePanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-review-guide-action-panel"
      aria-labelledby="help-review-guide-action-panel-heading"
    >
      <h2
        id="help-review-guide-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Start here
      </h2>
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
    </section>
  );
}

/** Specialty review wizard field-reference for `/help/review-guide` (HR). */
export function HelpReviewGuideView(props: HelpReviewGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const bodyMarkdown = prepareReviewGuideHelpBodyMarkdown(markdown);
  const preparedMarkdown = prepareHelpMarkdownForPresentation(bodyMarkdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const showSectionNav = !buyerPolishedShell && headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? headings.length : 0);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  const pageBody = (
    <>
      <OperatorPageHeader
        title={REVIEW_GUIDE_HELP_PAGE_TITLE}
        titleTestId="help-review-guide-page-title"
        subtitle={reviewGuideHelpPageSubtitle(buyerPolishedShell)}
        subtitleClassName="max-w-3xl"
        navHref={REVIEW_GUIDE_HELP_PATH}
        headingLevel="h1"
        claimDiscipline={buyerPolishedShell ? REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId={buyerPolishedShell ? REVIEW_GUIDE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined}
        metadata={
          buyerPolishedShell ? undefined : (
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
              data-testid="help-review-guide-header-metadata"
            >
              <ReviewGuideHelpHeaderAsOfLine entry={entry} />
            </div>
          )
        }
        actions={
          buyerPolishedShell ? undefined : (
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
          )
        }
      >
        {buyerPolishedShell ? null : (
          <HelpTopicExportClaimDiscipline claimDiscipline={REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE} />
        )}
      </OperatorPageHeader>

      {buyerPolishedShell ? null : <ReviewGuideHelpClaimDisciplineStrip />}

      {buyerPolishedShell ? (
        <div
          id={REVIEW_GUIDE_HELP_SKIP_TARGET_ID}
          data-testid={REVIEW_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <div className="space-y-4" data-testid="help-review-guide-buyer-intro">
            <p className={readingBodyClass} data-testid="help-review-guide-intro">
              {REVIEW_GUIDE_HELP_PAGE_LEAD}
            </p>
          </div>
          <ReviewGuideStartHerePanel />
          <p
            className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-review-guide-start-here-helper"
          >
            {REVIEW_GUIDE_HELP_START_HERE_HELPER}
          </p>
        </div>
      ) : null}

      {buyerPolishedShell ? (
        <p className={readingBodyClass} data-testid="help-review-guide-overview">
          {REVIEW_GUIDE_HELP_BUYER_OVERVIEW}
        </p>
      ) : null}

      <section
        className={buyerPolishedShell ? cn("min-w-0", OPERATOR_LAYOUT.sectionStack) : undefined}
        data-testid={buyerPolishedShell ? REVIEW_GUIDE_HELP_WORKSPACE_TEST_ID : undefined}
      >
        <div className={contentGridClass}>
          <div className="min-w-0 space-y-6">
          {!buyerPolishedShell ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-review-guide-overview">
              {REVIEW_GUIDE_HELP_OVERVIEW}
            </p>
          ) : null}

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-review-guide-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={bodyMarkdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={preparedMarkdown}
            />
          </div>

          {buyerPolishedShell ? null : <HelpReviewGuideRelatedGuidesSection />}

          {buyerPolishedShell ? null : (
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
          )}
        </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={headings} /> : null}
        </div>
      </section>

      {buyerPolishedShell ? <HelpReviewGuideSourcesOrientationStrip /> : null}
    </>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("dashboard"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-review-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${REVIEW_GUIDE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {REVIEW_GUIDE_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={REVIEW_GUIDE_HELP_PRIMARY_CONTENT_ID}
          data-testid={REVIEW_GUIDE_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          {pageBody}
        </div>
      ) : (
        pageBody
      )}
    </article>
  );
}

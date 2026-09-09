"use client";

import Link from "next/link";

import { HelpRepeatReviewLoopPageHeader } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopPageHeader";
import { HelpRepeatReviewLoopSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopSourcesOrientationStrip";
import { HelpRepeatReviewLoopWorkflowStepper } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopWorkflowStepper";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { RepeatReviewLoopHelpClaimDisciplineStrip } from "@/components/help/RepeatReviewLoopHelpClaimDisciplineStrip";
import { RepeatReviewLoopHelpEvidenceOrientationStrip } from "@/components/help/RepeatReviewLoopHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { appendHelpClaimDisciplineTocHeadings, extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REPEAT_REVIEW_LOOP_HELP_AUDIENCE,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SUMMARY,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES_DARK,
  REPEAT_REVIEW_LOOP_HELP_OVERVIEW,
  REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
  REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL,
  REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS,
  repeatReviewLoopHelpPageSubtitle,
} from "@/lib/repeat-review-loop-help-guide-content";
import {
  REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
  REPEAT_REVIEW_LOOP_HELP_RELATED,
  REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import {
  COMPARE_REPEAT_REVIEW_HELP_JOB_MATRIX_HEADING,
  REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX,
  REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/compare-repeat-review-help-ia-dual";
import {
  REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW,
  REPEAT_REVIEW_LOOP_HELP_FIRST_VIEWPORT_TEST_ID,
  REPEAT_REVIEW_LOOP_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  REPEAT_REVIEW_LOOP_HELP_PAGE_LEAD,
  REPEAT_REVIEW_LOOP_HELP_PRIMARY_CONTENT_ID,
  REPEAT_REVIEW_LOOP_HELP_SKIP_LINK_LABEL,
  REPEAT_REVIEW_LOOP_HELP_SKIP_TARGET_ID,
  REPEAT_REVIEW_LOOP_HELP_START_HERE_HELPER,
} from "@/lib/repeat-review-loop-help-page-copy";
import { cn } from "@/lib/utils";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";

type HelpRepeatReviewLoopGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function RepeatReviewLoopEligibilitySection(): React.ReactElement {
  return (
    <div
      className="space-y-2 border-b border-neutral-200 pb-6 dark:border-neutral-800"
      data-testid="help-repeat-review-loop-eligibility"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{REPEAT_REVIEW_LOOP_HELP_AUDIENCE}</p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        {REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL}{" "}
        <Link
          href={REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}
          className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
        >
          {REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
        </Link>
        .
      </p>
    </div>
  );
}

function RepeatReviewLoopJobMatrixSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-repeat-review-loop-job-matrix-heading"
      className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
      data-testid={REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX_TEST_ID}
    >
      <h2
        id="help-repeat-review-loop-job-matrix-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {COMPARE_REPEAT_REVIEW_HELP_JOB_MATRIX_HEADING}
      </h2>
      <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX.map((row) => (
          <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            {row.isCurrent === true ? (
              <span
                className="shrink-0 font-medium text-al-text-primary"
                data-testid="help-repeat-review-loop-job-matrix-current"
              >
                {row.label}
              </span>
            ) : (
              <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={row.href ?? "#"}>
                {row.label}
              </Link>
            )}
            <span className="text-al-text-secondary">{row.when}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RepeatReviewLoopActionPanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-repeat-review-loop-action-panel"
      aria-labelledby="help-repeat-review-loop-action-panel-heading"
    >
      <h2
        id="help-repeat-review-loop-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Start the loop
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary">
          <Link href={REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.href}>
            {REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.label}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.startNextReview.href}>
            {REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.startNextReview.label}
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** Buyer-safe repeat-review orientation for `/help/repeat-review-loop`. */
export function HelpRepeatReviewLoopGuideView(props: HelpRepeatReviewLoopGuideViewProps): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const dark = useDocumentDarkMode();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = resolveGuideHeadingsForStrip(
    "repeat-review-loop-help",
    appendHelpClaimDisciplineTocHeadings(
      extractHelpMarkdownHeadings(preparedMarkdown),
      REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
    ),
    REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
  );
  const showSectionNav = !buyerPolishedShell && headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? headings.length : 0);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const diagramThemeVariables = dark
    ? REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES_DARK
    : REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES;

  const pageBody = (
    <>
      {buyerPolishedShell ? (
        <OperatorPageHeader
          title={REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE}
          titleTestId="help-repeat-review-loop-page-title"
          subtitle={repeatReviewLoopHelpPageSubtitle(true)}
          subtitleClassName="max-w-3xl"
          navHref={REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={REPEAT_REVIEW_LOOP_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        />
      ) : (
        <HelpRepeatReviewLoopPageHeader
          entry={entry}
          subtitle={repeatReviewLoopHelpPageSubtitle(false)}
        />
      )}

      {buyerPolishedShell ? null : <RepeatReviewLoopHelpClaimDisciplineStrip />}

      {buyerPolishedShell ? (
        <div
          id={REPEAT_REVIEW_LOOP_HELP_SKIP_TARGET_ID}
          data-testid={REPEAT_REVIEW_LOOP_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <div className="space-y-4" data-testid="help-repeat-review-loop-buyer-intro">
            <p className={readingBodyClass} data-testid="help-repeat-review-loop-intro">
              {REPEAT_REVIEW_LOOP_HELP_PAGE_LEAD}
            </p>
          </div>
          <RepeatReviewLoopEligibilitySection />
          <RepeatReviewLoopJobMatrixSection />
          <RepeatReviewLoopActionPanel />
          <p
            className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-repeat-review-loop-start-here-helper"
          >
            {REPEAT_REVIEW_LOOP_HELP_START_HERE_HELPER}
          </p>
        </div>
      ) : (
        <>
          <RepeatReviewLoopEligibilitySection />
          <RepeatReviewLoopJobMatrixSection />
          <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
            <RepeatReviewLoopActionPanel />
          </div>
        </>
      )}

      {buyerPolishedShell ? (
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-repeat-review-loop-overview"
        >
          {REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW}
        </p>
      ) : null}

      <HelpRepeatReviewLoopWorkflowStepper />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          {buyerPolishedShell ? null : <RepeatReviewLoopHelpEvidenceOrientationStrip />}

          {!buyerPolishedShell ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-repeat-review-loop-overview">
              {REPEAT_REVIEW_LOOP_HELP_OVERVIEW}
            </p>
          ) : null}

          <div
            className={cn(
              "w-full space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="help-repeat-review-loop-cycle-diagram"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SUMMARY}
              tableCaption="Repeat architecture review loop summary"
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
            <MermaidDiagram
              source={REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE}
              accessibleName="Repeat architecture review loop"
              themeVariables={diagramThemeVariables}
            />
          </div>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-repeat-review-loop-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          {buyerPolishedShell ? null : (
            <section
              className="space-y-2"
              aria-labelledby="help-repeat-review-loop-related-heading"
              data-testid="help-repeat-review-loop-related-help"
            >
              <h2 id="help-repeat-review-loop-related-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING}
              </h2>
              <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                {REPEAT_REVIEW_LOOP_HELP_RELATED.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} /> : null}
      </div>

      {buyerPolishedShell ? <HelpRepeatReviewLoopSourcesOrientationStrip /> : null}
    </>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-repeat-review-loop-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${REPEAT_REVIEW_LOOP_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {REPEAT_REVIEW_LOOP_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={REPEAT_REVIEW_LOOP_HELP_PRIMARY_CONTENT_ID}
          data-testid={REPEAT_REVIEW_LOOP_HELP_PRIMARY_CONTENT_ID}
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

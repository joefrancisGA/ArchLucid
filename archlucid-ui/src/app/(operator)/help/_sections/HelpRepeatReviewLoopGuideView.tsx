"use client";

import Link from "next/link";
import { HelpRepeatReviewLoopPageHeader } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopPageHeader";
import { HelpRepeatReviewLoopWorkflowStepper } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopWorkflowStepper";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { RepeatReviewLoopHelpClaimDisciplineStrip } from "@/components/help/RepeatReviewLoopHelpClaimDisciplineStrip";
import { RepeatReviewLoopHelpEvidenceOrientationStrip } from "@/components/help/RepeatReviewLoopHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
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
  REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL,
  REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS,
  repeatReviewLoopHelpPageSubtitle,
} from "@/lib/repeat-review-loop-help-guide-content";
import {
  REPEAT_REVIEW_LOOP_HELP_RELATED,
  REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import {
  COMPARE_REPEAT_REVIEW_HELP_JOB_MATRIX_HEADING,
  REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX,
  REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/compare-repeat-review-help-ia-dual";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";

type HelpRepeatReviewLoopGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe repeat-review orientation for `/help/repeat-review-loop`. */
export function HelpRepeatReviewLoopGuideView(props: HelpRepeatReviewLoopGuideViewProps): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const dark = useDocumentDarkMode();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = appendHelpClaimDisciplineTocHeadings(
    extractHelpMarkdownHeadings(preparedMarkdown),
    REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const diagramThemeVariables = dark
    ? REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES_DARK
    : REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-repeat-review-loop-guide"
    >
      <HelpTopicHashScroll />

      <HelpRepeatReviewLoopPageHeader
        entry={entry}
        subtitle={repeatReviewLoopHelpPageSubtitle(buyerPolishedShell)}
      />

      <RepeatReviewLoopHelpClaimDisciplineStrip />

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

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
          data-testid="help-repeat-review-loop-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Start the loop</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
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
          </CardContent>
        </Card>
      </div>

      <HelpRepeatReviewLoopWorkflowStepper />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-repeat-review-loop-overview">
            {REPEAT_REVIEW_LOOP_HELP_OVERVIEW}
          </p>

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

          <RepeatReviewLoopHelpEvidenceOrientationStrip />
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} /> : null}
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ComparisonReplayHelpEvidenceOrientationStrip } from "@/components/help/ComparisonReplayHelpEvidenceOrientationStrip";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  COMPARE_REPEAT_REVIEW_HELP_JOB_MATRIX_HEADING,
  COMPARISON_REPLAY_HELP_JOB_MATRIX,
  COMPARISON_REPLAY_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/compare-repeat-review-help-ia-dual";
import {
  COMPARISON_REPLAY_HELP_DECISION_COMPARE,
  COMPARISON_REPLAY_HELP_DECISION_PANEL_TEST_ID,
  COMPARISON_REPLAY_HELP_DECISION_PANEL_TITLE,
  COMPARISON_REPLAY_HELP_DECISION_VALIDATE,
  COMPARISON_REPLAY_HELP_DEFERRED_JOB_DETAIL_HEADING,
  COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME,
  COMPARISON_REPLAY_HELP_DIAGRAM_SOURCE,
  COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE,
  COMPARISON_REPLAY_HELP_FIRST_VIEWPORT_TEST_ID,
  COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS,
  COMPARISON_REPLAY_HELP_RELATED_GUIDES_HEADING,
  comparisonReplayValidateReviewUnavailableCopy,
  isComparisonReplayValidateReviewActionAvailable,
} from "@/lib/comparison-replay-help-guide-content";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpComparisonReplayGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function splitComparisonReplayMarkdown(markdown: string): {
  readonly deferredJobDetail: string;
  readonly relatedGuidesSection: string;
} {
  const deferredStart = markdown.indexOf(COMPARISON_REPLAY_HELP_DEFERRED_JOB_DETAIL_HEADING);
  const relatedIndex = markdown.indexOf(COMPARISON_REPLAY_HELP_RELATED_GUIDES_HEADING);
  const deferredEnd = relatedIndex >= 0 ? relatedIndex : markdown.length;

  return {
    deferredJobDetail: deferredStart >= 0 ? markdown.slice(deferredStart, deferredEnd).trimStart() : "",
    relatedGuidesSection: relatedIndex >= 0 ? markdown.slice(relatedIndex).trimStart() : "",
  };
}

/** Operator compare vs replay orientation for `/help/comparison-replay`. */
export function HelpComparisonReplayGuideView(
  props: HelpComparisonReplayGuideViewProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const { deferredJobDetail, relatedGuidesSection } = splitComparisonReplayMarkdown(preparedMarkdown);
  const validateUnavailable = comparisonReplayValidateReviewUnavailableCopy();
  const validateActionAvailable = isComparisonReplayValidateReviewActionAvailable();

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-comparison-replay-guide"
    >
      <HelpTopicHashScroll />

      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <HelpTopicTitleRow title={entry.title} />
            <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>{entry.summary}</p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        </div>
      </header>

      <ComparisonReplayHelpEvidenceOrientationStrip />

      <div
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={COMPARISON_REPLAY_HELP_FIRST_VIEWPORT_TEST_ID}
      >
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid={COMPARISON_REPLAY_HELP_DECISION_PANEL_TEST_ID}
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {COMPARISON_REPLAY_HELP_DECISION_PANEL_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
            <div className="grid gap-4 md:grid-cols-2">
              <div
                className="space-y-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                data-testid="help-comparison-replay-decision-compare"
              >
                <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{COMPARISON_REPLAY_HELP_DECISION_COMPARE.title}</h2>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{COMPARISON_REPLAY_HELP_DECISION_COMPARE.summary}</p>
                <Button asChild size="sm" variant="primary">
                  <Link href={COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.href}>
                    {COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.label}
                  </Link>
                </Button>
              </div>

              <div
                className="space-y-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                data-testid="help-comparison-replay-decision-validate"
              >
                <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{COMPARISON_REPLAY_HELP_DECISION_VALIDATE.title}</h2>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{COMPARISON_REPLAY_HELP_DECISION_VALIDATE.summary}</p>

                {validateActionAvailable ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.href}>
                      {COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.label}
                    </Link>
                  </Button>
                ) : null}

                {validateUnavailable !== null ? (
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="comparison-replay-validate-unavailable"
                    role="status"
                  >
                    <span className="font-medium text-al-text-primary">{validateUnavailable.label}</span> is not available
                    in this workspace mode. {validateUnavailable.description}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div
          className={cn(
            "space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="help-comparison-replay-decision-diagram-panel"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-comparison-replay-decision-diagram-summary">
            {COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE}
          </p>
          <MermaidDiagram
            source={COMPARISON_REPLAY_HELP_DIAGRAM_SOURCE}
            accessibleName={COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME}
          />
        </div>
      </div>

      <section
        aria-labelledby="help-comparison-replay-job-matrix-heading"
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={COMPARISON_REPLAY_HELP_JOB_MATRIX_TEST_ID}
      >
        <h2
          id="help-comparison-replay-job-matrix-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {COMPARE_REPEAT_REVIEW_HELP_JOB_MATRIX_HEADING}
        </h2>
        <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {COMPARISON_REPLAY_HELP_JOB_MATRIX.map((row) => (
            <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              {row.isCurrent === true ? (
                <span
                  className="shrink-0 font-medium text-al-text-primary"
                  data-testid="help-comparison-replay-job-matrix-current"
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

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn)} data-testid="help-comparison-replay-content">
          {deferredJobDetail.length > 0 ? (
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} compare and replay detail`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={deferredJobDetail}
            />
          ) : null}

          {relatedGuidesSection.length > 0 ? (
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} related guides`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={relatedGuidesSection}
            />
          ) : null}
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}

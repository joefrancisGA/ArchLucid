import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PilotFeedbackHelpClaimDisciplineStrip } from "@/components/help/PilotFeedbackHelpClaimDisciplineStrip";
import { PilotFeedbackHelpEvidenceOrientationStrip } from "@/components/help/PilotFeedbackHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { appendHelpClaimDisciplineTocHeadings, extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PILOT_FEEDBACK_HELP_JOB_MATRIX,
  PILOT_FEEDBACK_HELP_OVERVIEW,
  PILOT_FEEDBACK_HELP_PAGE_SUBTITLE,
  PILOT_FEEDBACK_HELP_PAGE_TITLE,
  PILOT_FEEDBACK_HELP_PRIMARY_ACTION,
  PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS,
  PILOT_FEEDBACK_HELP_WORKFLOW_STEPS,
} from "@/lib/pilot-feedback-help-guide-content";
import { PILOT_FEEDBACK_HELP_CANONICAL_PATH, PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID } from "@/lib/pilot-feedback-help-evidence-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpPilotFeedbackGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function PilotFeedbackWorkflowStepper(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-pilot-feedback-workflow-stepper"
    >
      <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
        {PILOT_FEEDBACK_HELP_WORKFLOW_STEPS.map((step, index) => (
          <li key={step} className="min-w-0">
            <div className="flex h-full flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span className="sr-only">{`Step ${index + 1}`}</span>
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {index + 1}
              </span>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Admin pilot-feedback orientation for `/help/pilot-feedback` (TB-1716 / TB-1718 / TB-1719 / TB-1720). */
export function HelpPilotFeedbackGuideView(props: HelpPilotFeedbackGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = appendHelpClaimDisciplineTocHeadings(
    extractHelpMarkdownHeadings(preparedMarkdown),
    PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-pilot-feedback-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PILOT_FEEDBACK_HELP_PAGE_TITLE}
        titleTestId="help-pilot-feedback-page-title"
        subtitle={PILOT_FEEDBACK_HELP_PAGE_SUBTITLE}
        navHref={PILOT_FEEDBACK_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-pilot-feedback-header-actions">
            <Button asChild size="sm" variant="primary" data-testid="help-pilot-feedback-primary-cta">
              <Link href={PILOT_FEEDBACK_HELP_PRIMARY_ACTION.href}>{PILOT_FEEDBACK_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.startReview.href}>
                {PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.startReview.label}
              </Link>
            </Button>
            <Link
              href={PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.pilotGuide.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.pilotGuide.label}
            </Link>
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <PilotFeedbackHelpClaimDisciplineStrip />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="help-pilot-feedback-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Admin pilot-feedback workflow
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
            <PilotFeedbackWorkflowStepper />
            <Button asChild size="sm" variant="outline">
              <Link href={PILOT_FEEDBACK_HELP_PRIMARY_ACTION.href}>{PILOT_FEEDBACK_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
          </CardContent>
        </Card>

      </div>

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-pilot-feedback-overview">
            {PILOT_FEEDBACK_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="help-pilot-feedback-job-matrix-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="help-pilot-feedback-job-matrix"
          >
            <h2 id="help-pilot-feedback-job-matrix-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Choose the right surface
            </h2>
            <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-900/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Surface</th>
                    <th className="px-3 py-2 font-medium">Use when</th>
                  </tr>
                </thead>
                <tbody>
                  {PILOT_FEEDBACK_HELP_JOB_MATRIX.map((row) => (
                    <tr key={row.href} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="px-3 py-2 align-top">
                        <Link href={row.href} className={cn(OPERATOR_TYPOGRAPHY.body, DESIGN_TOKENS.accent.link)}>
                          {row.label}
                        </Link>
                      </td>
                      <td className={cn("px-3 py-2 align-top text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                        {row.when}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-pilot-feedback-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          <PilotFeedbackHelpEvidenceOrientationStrip />
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} /> : null}
      </div>
    </article>
  );
}

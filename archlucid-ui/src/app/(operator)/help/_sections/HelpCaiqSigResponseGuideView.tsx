import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import { CaiqSigResponseHelpPostureSummary } from "@/components/help/CaiqSigResponseHelpPostureSummary";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildCaiqSigResponseHelpJobMatrix,
  CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID,
  CAIQ_SIG_RESPONSE_HELP_JOB_MATRIX_HEADING,
  CAIQ_SIG_RESPONSE_HELP_PAGE_SUBTITLE,
  CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE,
  CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS,
  CAIQ_SIG_RESPONSE_HELP_WORKFLOW_STEPS,
  CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY,
  CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID,
  splitCaiqSigPreparedMarkdown,
} from "@/lib/caiq-sig-response-help-guide-content";
import { CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE } from "@/lib/caiq-sig-response-help-evidence-copy";
import {
  buildCaiqSigResponseTocGroups,
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  computeCaiqSigResponsePostureCounts,
  countCaiqSigResponseTableRows,
  prepareCaiqSigResponseHelpMarkdown,
} from "@/lib/caiq-sig-response-help-presentation";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpCaiqSigResponseGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function resolveSectionId(
  headings: readonly { readonly id: string; readonly title: string }[],
  title: string,
  fallbackId: string,
): string {
  const match = headings.find((heading) => heading.title === title);

  if (match === undefined) {
    return fallbackId;
  }

  return match.id;
}

/** Buyer CAIQ/SIG questionnaire orientation for `/help/caiq-sig-response` (TB-1631). */
export function HelpCaiqSigResponseGuideView(props: HelpCaiqSigResponseGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareCaiqSigResponseHelpMarkdown(markdown, sourceDocPath);
  const { liteMarkdown, sigMarkdown } = splitCaiqSigPreparedMarkdown(preparedMarkdown);
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const tocGroups = buildCaiqSigResponseTocGroups(headings);
  const postureCounts = computeCaiqSigResponsePostureCounts(preparedMarkdown);
  const postureTableRowTotal = countCaiqSigResponseTableRows(preparedMarkdown);
  const liteSectionId = resolveSectionId(headings, CAIQ_SIG_RESPONSE_LITE_PART_HEADING, "caiq-lite-subset");
  const sigSectionId = resolveSectionId(
    headings,
    CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
    "sig-core-family-summary-index-not-a-full-row-checklist",
  );
  const jobMatrix = buildCaiqSigResponseHelpJobMatrix(liteSectionId, sigSectionId);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, HELP_PAGE_LAYOUT.technicalReferenceArticle)}
      data-testid={CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID}
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE}
        titleTestId="help-caiq-sig-response-page-title"
        subtitle={CAIQ_SIG_RESPONSE_HELP_PAGE_SUBTITLE}
        navHref="/help"
        headingLevel="h1"
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-caiq-sig-response-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <HelpTopicExportClaimDiscipline claimDiscipline={CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE} />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-caiq-sig-response-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Continue assurance diligence
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button
              asChild
              size="sm"
              variant="primary"
              data-testid={CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.testId}
            >
              <Link href={CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                {CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link
                href={CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openComplianceJourney.href}
                data-testid={CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openComplianceJourney.testId}
              >
                {CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openComplianceJourney.label}
              </Link>
            </Button>
            <Link
              href={CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.requestDiligencePack.href}
              className={cn(OPERATOR_LINK.stepPill, "no-underline")}
              data-testid={CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.requestDiligencePack.testId}
            >
              {CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.requestDiligencePack.label}
            </Link>
          </CardContent>
        </Card>

        <CaiqSigResponseHelpEvidenceOrientationStrip />

        <section
          aria-labelledby="help-caiq-sig-response-workflow-heading"
          data-testid="help-caiq-sig-response-workflow"
        >
          <h2
            id="help-caiq-sig-response-workflow-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            How to use this guide
          </h2>
          <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {CAIQ_SIG_RESPONSE_HELP_WORKFLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="help-caiq-sig-response-job-matrix-heading"
          data-testid="help-caiq-sig-response-job-matrix"
        >
          <h2
            id="help-caiq-sig-response-job-matrix-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {CAIQ_SIG_RESPONSE_HELP_JOB_MATRIX_HEADING}
          </h2>
          <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {jobMatrix.map((row) => (
              <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                {row.isCurrent === true ? (
                  <span className="shrink-0 font-medium text-al-text-primary">{row.label}</span>
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

        <CaiqSigResponseHelpPostureSummary counts={postureCounts} tableRowTotal={postureTableRowTotal} />
      </div>

      <div className={HELP_PAGE_LAYOUT.technicalReferenceGrid}>
        <div className={HELP_PAGE_LAYOUT.technicalReferenceColumn} data-testid="help-topic-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={liteMarkdown}
          />

          {sigMarkdown.length > 0 ? (
            <HelpLazyDetails
              className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40"
              summaryClassName={cn(
                "cursor-pointer select-none font-medium text-al-text-primary",
                OPERATOR_TYPOGRAPHY.body,
              )}
              bodyClassName={HELP_PAGE_LAYOUT.detailsBody}
              summary={CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY}
              data-testid={CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID}
              bodyTestId="help-caiq-sig-response-sig-deferred-body"
            >
              <MarketingAccessibilityMarkdownFragment
                markdownBody={markdown}
                tableCaption={`${entry.title} SIG reference table`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
                preparedMarkdownOverride={sigMarkdown}
              />
            </HelpLazyDetails>
          ) : null}
        </div>

        <HelpTopicTableOfContents headings={headings} groups={tocGroups} enableScrollSpy />
      </div>
    </article>
  );
}

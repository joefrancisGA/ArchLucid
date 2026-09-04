import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpCaiqSigResponseHeaderActions } from "@/app/(operator)/help/_sections/HelpCaiqSigResponseHeaderActions";
import { HelpCaiqSigResponseSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpCaiqSigResponseSourcesOrientationStrip";
import { CaiqSigResponseHelpClaimDisciplineStrip } from "@/components/help/CaiqSigResponseHelpClaimDisciplineStrip";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import { CaiqSigResponseHelpPostureSummary } from "@/components/help/CaiqSigResponseHelpPostureSummary";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
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
import {
  CAIQ_SIG_RESPONSE_HELP_CANONICAL_PATH,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import {
  CAIQ_SIG_RESPONSE_HELP_FIRST_VIEWPORT_TEST_ID,
  CAIQ_SIG_RESPONSE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CAIQ_SIG_RESPONSE_HELP_PRIMARY_CONTENT_ID,
  CAIQ_SIG_RESPONSE_HELP_SKIP_LINK_LABEL,
  CAIQ_SIG_RESPONSE_HELP_SKIP_TARGET_ID,
} from "@/lib/caiq-sig-response-help-page-copy";
import {
  buildCaiqSigResponseTocGroups,
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  computeCaiqSigResponsePostureCounts,
  countCaiqSigResponseTableRows,
  prepareCaiqSigResponseHelpMarkdown,
} from "@/lib/caiq-sig-response-help-presentation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
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
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
  const contentGridClass = buyerPolishedShell
    ? resolveHelpPageContentGridClass(headings.length)
    : HELP_PAGE_LAYOUT.technicalReferenceGrid;

  const firstViewportPanel = (
    <>
      {!buyerPolishedShell ? <CaiqSigResponseHelpEvidenceOrientationStrip /> : null}

      <section
        className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="help-caiq-sig-response-action-panel"
        aria-labelledby="help-caiq-sig-response-action-panel-heading"
      >
        <h2
          id="help-caiq-sig-response-action-panel-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          Continue assurance diligence
        </h2>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </section>

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
    </>
  );

  return (
    <article
      className={cn(
        buyerPolishedShell ? operatorPageContainerClass("workflow") : HELP_PAGE_LAYOUT.technicalReferenceArticle,
        OPERATOR_LAYOUT.majorSectionGap,
      )}
      data-testid={CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID}
    >
      {buyerPolishedShell ? (
        <a href={`#${CAIQ_SIG_RESPONSE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {CAIQ_SIG_RESPONSE_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={CAIQ_SIG_RESPONSE_HELP_PRIMARY_CONTENT_ID}
          data-testid={CAIQ_SIG_RESPONSE_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          <HelpTopicGuidePageHeader
            title={CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE}
            titleTestId="help-caiq-sig-response-page-title"
            subtitle={CAIQ_SIG_RESPONSE_HELP_PAGE_SUBTITLE}
            navHref={CAIQ_SIG_RESPONSE_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={CAIQ_SIG_RESPONSE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={<HelpCaiqSigResponseHeaderActions entry={entry} />}
          />

          <div
            id={CAIQ_SIG_RESPONSE_HELP_SKIP_TARGET_ID}
            data-testid={CAIQ_SIG_RESPONSE_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            {firstViewportPanel}
          </div>

          <div className={contentGridClass}>
            <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-topic-content">
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

          <div data-testid="help-caiq-sig-response-orientation-bottom">
            <HelpCaiqSigResponseSourcesOrientationStrip />
          </div>
        </div>
      ) : (
        <>
          <OperatorPageHeader
            title={CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE}
            titleTestId="help-caiq-sig-response-page-title"
            subtitle={CAIQ_SIG_RESPONSE_HELP_PAGE_SUBTITLE}
            navHref="/help"
            headingLevel="h1"
            actions={<HelpCaiqSigResponseHeaderActions entry={entry} />}
          />

          <CaiqSigResponseHelpClaimDisciplineStrip />

          <HelpTopicExportClaimDiscipline claimDiscipline={CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE} />

          <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
            {firstViewportPanel}
          </div>

          <div className={contentGridClass}>
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
        </>
      )}
    </article>
  );
}

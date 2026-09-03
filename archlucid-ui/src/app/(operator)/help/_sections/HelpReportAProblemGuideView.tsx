import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { ReportProblemAuditVocabularyRail } from "@/components/ReportProblemAuditVocabularyRail";
import { ReportProblemHelpEvidenceOrientationStrip } from "@/components/help/ReportProblemHelpEvidenceOrientationStrip";
import { ReportProblemSupportWorkspaceVocabularyRail } from "@/components/ReportProblemSupportWorkspaceVocabularyRail";
import { ReportProblemSurfaceCoverageTable } from "@/components/help/ReportProblemSurfaceCoverageTable";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractMarkdownSectionsByAnchor } from "@/lib/help/help-markdown-sections";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_SUMMARY,
  REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_TEST_ID,
  REPORT_A_PROBLEM_HELP_DEFERRED_SECTION_ANCHORS,
  REPORT_A_PROBLEM_HELP_NO_TRIGGER_CALLOUT,
  REPORT_A_PROBLEM_HELP_OVERVIEW,
  REPORT_A_PROBLEM_HELP_PAGE_SUBTITLE,
  REPORT_A_PROBLEM_HELP_PAGE_TITLE,
  REPORT_A_PROBLEM_HELP_PATH,
  REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS,
  REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_HEADING,
  REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_TEST_ID,
} from "@/lib/report-a-problem-help-guide-content";
import {
  REPORT_A_PROBLEM_HELP_RELATED,
  REPORT_A_PROBLEM_HELP_RELATED_HEADING,
} from "@/lib/report-a-problem-help-evidence-copy";
import {
  REPORT_A_PROBLEM_HELP_JOB_MATRIX,
  REPORT_A_PROBLEM_HELP_JOB_MATRIX_HEADING,
  REPORT_A_PROBLEM_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/report-a-problem-help-ia-dual";
import { REPORT_A_PROBLEM_HELP_RELATED_TEST_ID } from "@/lib/report-a-problem-help-related-guides";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpReportAProblemGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty support-intake orientation for `/help/report-a-problem` (TB-1741). */
export function HelpReportAProblemGuideView(
  props: HelpReportAProblemGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const deferredMarkdown = extractMarkdownSectionsByAnchor(
    markdown,
    [...REPORT_A_PROBLEM_HELP_DEFERRED_SECTION_ANCHORS],
    false,
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-report-a-problem-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={REPORT_A_PROBLEM_HELP_PAGE_TITLE}
        titleTestId="help-report-a-problem-page-title"
        subtitle={REPORT_A_PROBLEM_HELP_PAGE_SUBTITLE}
        navHref={REPORT_A_PROBLEM_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-report-a-problem-header-actions"
          >
            <Button
              asChild
              size="sm"
              variant="primary"
              data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.testId}
            >
              <Link href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.href}>
                {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.label}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.testId}
            >
              <a href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.href}>
                {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.label}
              </a>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.troubleshooting.testId}
            >
              <Link href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.troubleshooting.href}>
                {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.troubleshooting.label}
              </Link>
            </Button>
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <p
        className={cn("m-0 max-w-3xl rounded-md border border-neutral-200 bg-al-surface-raised p-4", OPERATOR_TYPOGRAPHY.body)}
        data-testid="help-report-a-problem-no-trigger-callout"
      >
        {REPORT_A_PROBLEM_HELP_NO_TRIGGER_CALLOUT}
      </p>

      <section
        aria-labelledby="help-report-a-problem-job-matrix-heading"
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={REPORT_A_PROBLEM_HELP_JOB_MATRIX_TEST_ID}
      >
        <h2
          id="help-report-a-problem-job-matrix-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {REPORT_A_PROBLEM_HELP_JOB_MATRIX_HEADING}
        </h2>
        <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {REPORT_A_PROBLEM_HELP_JOB_MATRIX.map((row) => (
            <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              {row.isCurrent === true ? (
                <span
                  className="shrink-0 font-medium text-al-text-primary"
                  data-testid="help-report-a-problem-job-matrix-current"
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

      <section
        aria-labelledby="help-report-a-problem-where-heading"
        className="space-y-4"
        data-testid={REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_TEST_ID}
      >
        <h2
          id="help-report-a-problem-where-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_HEADING}
        </h2>
        <ReportProblemSurfaceCoverageTable />
        <ReportProblemSupportWorkspaceVocabularyRail currentSurfaceId="report-a-problem" />
        <ReportProblemAuditVocabularyRail currentSurfaceId="report-problem" />
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="report-a-problem-help-support-email"
        >
          Support email (when Report problem is not on the page):{" "}
          <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>
            {ARCHLUCID_SUPPORT_EMAIL}
          </Link>
        </p>
      </section>

      <div className={HELP_PAGE_LAYOUT.contentColumn}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-report-a-problem-overview">
          {REPORT_A_PROBLEM_HELP_OVERVIEW}
        </p>

        <HelpLazyDetails
          summary={REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_SUMMARY}
          data-testid={REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_TEST_ID}
          bodyTestId="help-report-a-problem-deferred-body"
          className={cn("rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
          summaryClassName="cursor-pointer font-medium text-al-text-primary"
          bodyClassName="mt-4 space-y-4"
        >
          <MarketingAccessibilityMarkdownFragment
            markdownBody={deferredMarkdown}
            tableCaption={`${entry.title} captured fields`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </HelpLazyDetails>

        <section
          aria-labelledby="help-report-a-problem-related-heading"
          className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          data-testid={REPORT_A_PROBLEM_HELP_RELATED_TEST_ID}
        >
          <h2
            id="help-report-a-problem-related-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {REPORT_A_PROBLEM_HELP_RELATED_HEADING}
          </h2>
          <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {REPORT_A_PROBLEM_HELP_RELATED.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
                >
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ReportProblemHelpEvidenceOrientationStrip />
      </div>
    </article>
  );
}

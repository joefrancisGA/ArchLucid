import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import { RoiSummaryHelpClaimDisciplineStrip } from "@/components/help/RoiSummaryHelpClaimDisciplineStrip";
import { RoiSummaryHelpEvidenceOrientationStrip } from "@/components/help/RoiSummaryHelpEvidenceOrientationStrip";
import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CTA_WIDTH,
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  ROI_SUMMARY_HELP_BREADCRUMB_TOPIC_TITLE,
  ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
  ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS,
  ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE,
  ROI_SUMMARY_HELP_DIRECTIONAL_DISCLAIMER,
  ROI_SUMMARY_HELP_GUIDE_HEADINGS,
  ROI_SUMMARY_HELP_HOW_TO_READ_STEPS,
  ROI_SUMMARY_HELP_METHODOLOGY_BODY,
  ROI_SUMMARY_HELP_METHODOLOGY_COEFFICIENT_ROWS,
  ROI_SUMMARY_HELP_METHODOLOGY_FORMULA,
  ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE,
  ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE,
  ROI_SUMMARY_HELP_OVERVIEW,
  ROI_SUMMARY_HELP_PAGE_SUBTITLE,
  ROI_SUMMARY_HELP_PAGE_TITLE,
  ROI_SUMMARY_HELP_PRIMARY_ACTION,
  ROI_SUMMARY_HELP_REPORT_ITEMS,
  ROI_SUMMARY_HELP_REPORT_SECTION_TITLE,
  ROI_SUMMARY_HELP_SIBLING_REPORTS,
  ROI_SUMMARY_HELP_START_HERE_CARD_TITLE,
  ROI_SUMMARY_HELP_START_HERE_HELPER,
} from "@/lib/roi-summary-help-guide-content";
import { ROI_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/roi-summary-help-evidence-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpRoiSummaryGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function HowToReadRoiSummarySteps(): React.ReactElement {
  return (
    <ol
      className={cn("m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3", HELP_PAGE_LAYOUT.readingBody)}
      data-testid="help-roi-summary-how-stepper"
    >
      {ROI_SUMMARY_HELP_HOW_TO_READ_STEPS.map((step, index) => (
        <li key={step} className="flex min-w-0 gap-3">
          <span className="sr-only">{`Step ${index + 1}`}</span>
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
          >
            {index + 1}
          </span>
          <p className="m-0 min-w-0 text-al-text-primary">{step}</p>
        </li>
      ))}
    </ol>
  );
}

/** Operator ROI summary orientation for `/help/roi-summary`. */
export function HelpRoiSummaryGuideView(props: HelpRoiSummaryGuideViewProps): React.ReactElement {
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-roi-summary",
    ROI_SUMMARY_HELP_GUIDE_HEADINGS,
    ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-roi-summary-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={ROI_SUMMARY_HELP_PAGE_TITLE}
        titleTestId="help-roi-summary-page-title"
        subtitle={ROI_SUMMARY_HELP_PAGE_SUBTITLE}
        navHref={ROI_SUMMARY_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <RoiSummaryHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <RoiSummaryHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />

          <p className={readingBodyClass} data-testid="help-roi-summary-overview">
            {ROI_SUMMARY_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-roi-summary-action-panel"
            aria-labelledby="help-roi-summary-action-panel-heading"
          >
            <h2
              id="help-roi-summary-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {ROI_SUMMARY_HELP_START_HERE_CARD_TITLE}
            </h2>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-roi-summary-start-here-helper"
            >
              {ROI_SUMMARY_HELP_START_HERE_HELPER}
            </p>
            <Button asChild size="sm" variant="primary">
              <Link href={ROI_SUMMARY_HELP_PRIMARY_ACTION.href}>{ROI_SUMMARY_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
          </section>

          <section
            aria-labelledby="what-the-report-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-the-report-shows">{ROI_SUMMARY_HELP_REPORT_SECTION_TITLE}</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-roi-summary-report-items"
            >
              {ROI_SUMMARY_HELP_REPORT_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-to-read-roi-summary"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-to-read-roi-summary">How to read ROI summary</HelpSectionHeading>
            <HowToReadRoiSummarySteps />
          </section>

          <section
            aria-labelledby="data-needs-and-confidence"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="data-needs-and-confidence">
              {ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE}
            </HelpSectionHeading>
            <ul
              className={cn("m-0 list-disc space-y-1 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-roi-summary-data-needs"
            >
              {ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="basis-of-estimate"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="basis-of-estimate">{ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE}</HelpSectionHeading>
            <div
              className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")}
              data-testid="help-roi-summary-methodology"
            >
              <p className={readingBodyClass}>{ROI_SUMMARY_HELP_METHODOLOGY_BODY}</p>
              <p
                className={cn("m-0 font-medium text-al-text-primary", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-roi-summary-methodology-formula"
              >
                {ROI_SUMMARY_HELP_METHODOLOGY_FORMULA}
              </p>
              <table
                className={HELP_PAGE_LAYOUT.table}
                data-testid="help-roi-summary-methodology-coefficients"
              >
                <caption className="sr-only">Hours per finding severity and governance block</caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-left font-medium text-al-text-primary">
                      Unit
                    </th>
                    <th scope="col" className="text-left font-medium text-al-text-primary">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROI_SUMMARY_HELP_METHODOLOGY_COEFFICIENT_ROWS.map((row) => (
                    <tr key={row.id}>
                      <td className="text-al-text-primary">
                        {row.severity === undefined ? (
                          row.label
                        ) : (
                          <SeverityTag severity={row.severity} />
                        )}
                      </td>
                      <td className="text-al-text-primary">{row.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {ROI_SUMMARY_HELP_DIRECTIONAL_DISCLAIMER}
              </p>
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF}>
                Review pilot ROI measurement methodology
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="how-roi-summary-relates-to-nearby-surfaces"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-roi-summary-relates-to-nearby-surfaces">
              {ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE}
            </HelpSectionHeading>
            <ScorecardRoiVocabularyRail currentSurfaceId="roi-summary" variant="full" />
            <BaselineRoiVocabularyRail currentSurfaceId="roi-summary" variant="full" />
          </section>

          <section
            aria-labelledby="sibling-sponsor-reports"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="sibling-sponsor-reports">Related sponsor reports</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-roi-summary-sibling-reports">
              {ROI_SUMMARY_HELP_SIBLING_REPORTS.map((report) => (
                <div
                  key={report.id}
                  className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                >
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{report.title}</h3>
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{report.description}</p>
                  <Button asChild className={CTA_WIDTH.content} size="sm" variant="outline">
                    <Link href={report.href}>{report.actionLabel}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
      </div>
    </article>
  );
}

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import { RoiSummaryHelpEvidenceOrientationStrip } from "@/components/help/RoiSummaryHelpEvidenceOrientationStrip";
import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  ROI_SUMMARY_HELP_BASELINE_SECTION_TITLE,
  ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS,
  ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE,
  ROI_SUMMARY_HELP_DIRECTIONAL_DISCLAIMER,
  ROI_SUMMARY_HELP_GUIDE_HEADINGS,
  ROI_SUMMARY_HELP_HOW_TO_READ_STEPS,
  ROI_SUMMARY_HELP_METHODOLOGY_BODY,
  ROI_SUMMARY_HELP_METHODOLOGY_FORMULA,
  ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE,
  ROI_SUMMARY_HELP_OVERVIEW,
  ROI_SUMMARY_HELP_PAGE_SUBTITLE,
  ROI_SUMMARY_HELP_PAGE_TITLE,
  ROI_SUMMARY_HELP_PRIMARY_ACTION,
  ROI_SUMMARY_HELP_REPORT_ITEMS,
  ROI_SUMMARY_HELP_REPORT_SECTION_TITLE,
  ROI_SUMMARY_HELP_SCORECARD_SECTION_TITLE,
  ROI_SUMMARY_HELP_SIBLING_REPORTS,
} from "@/lib/roi-summary-help-guide-content";
import { ROI_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/roi-summary-help-evidence-copy";
import { cn } from "@/lib/utils";

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
      className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3"
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
          <p className={cn("m-0 min-w-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

/** Operator ROI summary orientation for `/help/roi-summary`. */
export function HelpRoiSummaryGuideView(props: HelpRoiSummaryGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(ROI_SUMMARY_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-roi-summary-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ROI_SUMMARY_HELP_PAGE_TITLE}
        titleTestId="help-roi-summary-page-title"
        subtitle={ROI_SUMMARY_HELP_PAGE_SUBTITLE}
        navHref={ROI_SUMMARY_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-roi-summary-overview">
            {ROI_SUMMARY_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-roi-summary-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open ROI summary</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={ROI_SUMMARY_HELP_PRIMARY_ACTION.href}>{ROI_SUMMARY_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-the-report-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-the-report-shows">{ROI_SUMMARY_HELP_REPORT_SECTION_TITLE}</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
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
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)} data-testid="help-roi-summary-data-needs">
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
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ROI_SUMMARY_HELP_METHODOLOGY_BODY}</p>
              <p className={cn("m-0 font-mono text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {ROI_SUMMARY_HELP_METHODOLOGY_FORMULA}
              </p>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ROI_SUMMARY_HELP_DIRECTIONAL_DISCLAIMER}</p>
              <Link className="text-sm underline-offset-2 hover:underline" href={SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF}>
                Review pilot ROI measurement methodology
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="scorecard-vs-roi-summary"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="scorecard-vs-roi-summary">{ROI_SUMMARY_HELP_SCORECARD_SECTION_TITLE}</HelpSectionHeading>
            <ScorecardRoiVocabularyRail currentSurfaceId="roi-summary" variant="compact" />
          </section>

          <section
            aria-labelledby="baseline-vs-roi-summary"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="baseline-vs-roi-summary">{ROI_SUMMARY_HELP_BASELINE_SECTION_TITLE}</HelpSectionHeading>
            <BaselineRoiVocabularyRail currentSurfaceId="roi-summary" variant="compact" />
          </section>

          <section
            aria-labelledby="sibling-sponsor-reports"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="sibling-sponsor-reports">Related sponsor reports</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-roi-summary-sibling-reports">
              {ROI_SUMMARY_HELP_SIBLING_REPORTS.map((report) => (
                <Card key={report.id} className="border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle as="h3" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {report.title}
                    </CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{report.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <Button asChild className="w-full" size="sm" variant="outline">
                      <Link href={report.href}>{report.actionLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <RoiSummaryHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={ROI_SUMMARY_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}

import Link from "next/link";

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  PILOT_ROI_MEASUREMENT_HELP_ANTI_OVERCLAIM,
  PILOT_ROI_MEASUREMENT_HELP_BASELINE_LABELS,
  PILOT_ROI_MEASUREMENT_HELP_LIFECYCLE_LINE,
  PILOT_ROI_MEASUREMENT_HELP_OVERVIEW,
  PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS,
  PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE,
} from "@/lib/sponsor/pilot-roi-measurement-help-guide-content";
import { cn } from "@/lib/utils";

type HelpPilotRoiMeasurementSectionProps = {
  readonly markdown: string;
  readonly sourceDocPath: string;
  readonly helpTopicSlug: string;
};

function stripPilotRoiMeasurementSectionHeading(markdown: string): string {
  return markdown
    .replace(/^## Pilot ROI measurement \{#pilot-roi-measurement\}\s*\n*/i, "")
    .replace(/^## Sponsor ROI methodology \{#pilot-roi-measurement\}\s*\n*/i, "")
    .trimStart();
}

/** Specialty first-viewport companion for `#pilot-roi-measurement` (TB-1391–TB-1393). */
export function HelpPilotRoiMeasurementSection(
  props: HelpPilotRoiMeasurementSectionProps,
): React.ReactElement {
  const { markdown, sourceDocPath, helpTopicSlug } = props;
  const bodyMarkdown = stripPilotRoiMeasurementSectionHeading(markdown);

  if (bodyMarkdown.trim().length === 0) {
    return <></>;
  }

  return (
    <section
      id="pilot-roi-measurement"
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "space-y-4 scroll-mt-24 border-t border-neutral-200 pt-6 dark:border-neutral-800")}
      data-testid="help-pilot-roi-measurement-section"
      aria-labelledby="pilot-roi-measurement-heading"
    >
      <h2 id="pilot-roi-measurement-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE}
      </h2>

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-pilot-roi-measurement-overview">
        {PILOT_ROI_MEASUREMENT_HELP_OVERVIEW}
      </p>

      <section
        aria-labelledby="help-pilot-roi-measurement-action-panel-heading"
        className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="help-pilot-roi-measurement-action-panel"
      >
        <h3
          id="help-pilot-roi-measurement-action-panel-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Set baseline and read proof labels
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="primary">
            <Link href={PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.setBaseline.href}>
              {PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.setBaseline.label}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.openArchitectureScorecard.href}>
              {PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.openArchitectureScorecard.label}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.openRoiSummary.href}>
              {PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS.openRoiSummary.label}
            </Link>
          </Button>
        </div>
      </section>

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-pilot-roi-measurement-lifecycle">
        {PILOT_ROI_MEASUREMENT_HELP_LIFECYCLE_LINE}
      </p>

      <div className="space-y-2" data-testid="help-pilot-roi-measurement-baseline-labels">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>ROI evidence labels</h3>
        <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          {PILOT_ROI_MEASUREMENT_HELP_BASELINE_LABELS.map((item) => (
            <div key={item.label}>
              <dt className="font-medium text-al-text-primary">{item.label}</dt>
              <dd className="m-0 mt-1 text-al-text-secondary">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p
        className={cn("m-0 rounded-md border border-neutral-200 bg-al-surface-raised p-3", OPERATOR_TYPOGRAPHY.body)}
        data-testid="help-pilot-roi-measurement-anti-overclaim"
      >
        {PILOT_ROI_MEASUREMENT_HELP_ANTI_OVERCLAIM}
      </p>

      <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-pilot-roi-measurement-content">
        <MarketingAccessibilityMarkdownFragment
          markdownBody={bodyMarkdown}
          tableCaption="Pilot ROI measurement reference table"
          presentation="help"
          sourceDocPath={sourceDocPath}
          helpTopicSlug={helpTopicSlug}
        />
      </div>
    </section>
  );
}

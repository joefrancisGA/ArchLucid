import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  PATTERN_LIBRARY_SUMMARY_DOMAINS_LABEL,
  PATTERN_LIBRARY_SUMMARY_PATTERNS_LABEL,
  PATTERN_LIBRARY_SUMMARY_PLATFORMS_LABEL,
  PATTERN_LIBRARY_SUMMARY_REVIEWS_LABEL,
  PATTERN_LIBRARY_SUMMARY_THRESHOLD_LABEL,
  PATTERN_LIBRARY_SUMMARY_UPDATED_LABEL,
} from "@/lib/pattern-library-copy";
import type { PatternLibrarySummary } from "@/lib/pattern-library-types";
import { formatRelativeTime } from "@/lib/relative-time";

type PatternLibrarySummaryRowProps = {
  readonly summary: PatternLibrarySummary;
};

function SummaryMetric(props: { readonly label: string; readonly value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.value}
      </p>
    </div>
  );
}

export function PatternLibrarySummaryRow(props: PatternLibrarySummaryRowProps): React.JSX.Element {
  const { summary } = props;

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
      data-testid="pattern-library-summary-row"
      aria-label="Pattern library summary"
    >
      <SummaryMetric label={PATTERN_LIBRARY_SUMMARY_PATTERNS_LABEL} value={finiteIntegerCountDisplay(summary.patternsTracked)} />
      <SummaryMetric label={PATTERN_LIBRARY_SUMMARY_DOMAINS_LABEL} value={finiteIntegerCountDisplay(summary.domainsRepresented)} />
      <SummaryMetric
        label={PATTERN_LIBRARY_SUMMARY_PLATFORMS_LABEL}
        value={finiteIntegerCountDisplay(summary.platformsRepresented)}
      />
      <SummaryMetric label={PATTERN_LIBRARY_SUMMARY_REVIEWS_LABEL} value={summary.reviewsContributingLabel} />
      <SummaryMetric
        label={PATTERN_LIBRARY_SUMMARY_THRESHOLD_LABEL}
        value={`k ≥ ${finiteIntegerCountDisplay(summary.minimumTenantThreshold)}`}
      />
      <SummaryMetric
        label={PATTERN_LIBRARY_SUMMARY_UPDATED_LABEL}
        value={formatRelativeTime(summary.lastUpdatedUtc)}
      />
    </section>
  );
}

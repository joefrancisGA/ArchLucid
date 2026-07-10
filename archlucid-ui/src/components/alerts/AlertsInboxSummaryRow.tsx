import { cn } from "@/lib/utils";

import {
  ALERTS_SUMMARY_ACKNOWLEDGED_LABEL,
  ALERTS_SUMMARY_BLOCKING_LABEL,
  ALERTS_SUMMARY_LAST_EVALUATED_LABEL,
  ALERTS_SUMMARY_LAST_EVALUATED_NEVER,
  ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED,
  ALERTS_SUMMARY_OPEN_LABEL,
  ALERTS_SUMMARY_RESOLVED_LABEL,
} from "@/lib/alerts-page-copy";
import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";

export type AlertsInboxSummaryRowProps = {
  readonly summary: AlertsInboxSummaryCounts;
  readonly loading: boolean;
  readonly hasAlertRules: boolean;
  readonly workspaceContextLoading: boolean;
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

function formatLastEvaluatedLabel(
  lastEvaluatedUtc: string | null,
  loading: boolean,
  hasAlertRules: boolean,
  workspaceContextLoading: boolean,
): string {
  if (loading || workspaceContextLoading) {
    return "…";
  }

  if (!hasAlertRules) {
    return ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED;
  }

  if (lastEvaluatedUtc === null) {
    return ALERTS_SUMMARY_LAST_EVALUATED_NEVER;
  }

  return formatRelativeTime(lastEvaluatedUtc);
}

export function AlertsInboxSummaryRow(props: AlertsInboxSummaryRowProps): React.JSX.Element {
  const { summary, loading, hasAlertRules, workspaceContextLoading } = props;
  const countValue = (value: number): string => (loading ? "…" : finiteIntegerCountDisplay(value));

  return (
    <section
      className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      data-testid="alerts-inbox-summary-row"
      aria-label="Alert inbox summary"
    >
      <SummaryMetric label={ALERTS_SUMMARY_OPEN_LABEL} value={countValue(summary.open)} />
      <SummaryMetric label={ALERTS_SUMMARY_ACKNOWLEDGED_LABEL} value={countValue(summary.acknowledged)} />
      <SummaryMetric label={ALERTS_SUMMARY_RESOLVED_LABEL} value={countValue(summary.resolved)} />
      <SummaryMetric label={ALERTS_SUMMARY_BLOCKING_LABEL} value={countValue(summary.blocking)} />
      <SummaryMetric
        label={ALERTS_SUMMARY_LAST_EVALUATED_LABEL}
        value={formatLastEvaluatedLabel(
          summary.lastEvaluatedUtc,
          loading,
          hasAlertRules,
          workspaceContextLoading,
        )}
      />
    </section>
  );
}

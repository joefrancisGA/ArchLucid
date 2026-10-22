import { cn } from "@/lib/utils";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  ALERTS_SUMMARY_ACKNOWLEDGED_LABEL,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA,
  ALERTS_SUMMARY_LAST_EVALUATED_LABEL,
  ALERTS_SUMMARY_LAST_EVALUATED_NEVER,
  ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED,
  ALERTS_SUMMARY_OPEN_BLOCKING_RELATIONSHIP_TITLE,
  ALERTS_SUMMARY_OPEN_LABEL,
  ALERTS_SUMMARY_RESOLVED_LABEL,
} from "@/lib/alerts-page-copy";
import {
  formatAlertsOpenSummaryAriaLabel,
  formatAlertsOpenSummaryValue,
  type AlertsInboxSummaryCounts,
} from "@/lib/alerts-inbox-summary";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";

export type AlertsInboxSummaryRowProps = {
  readonly summary: AlertsInboxSummaryCounts;
  readonly loading: boolean;
  readonly hasAlertRules: boolean;
  readonly workspaceContextLoading: boolean;
};

type SummaryCountDisplay = {
  readonly value: string;
  readonly valueAriaLabel?: string;
  readonly labelHint?: string;
};

function SummaryMetric(props: {
  readonly label: string;
  readonly value: string;
  readonly valueAriaLabel?: string;
  readonly labelHint?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="inline-flex items-center gap-1">
          {props.label}
          {props.labelHint ? <FieldHelpTooltip label={props.label} hint={props.labelHint} /> : null}
        </span>
      </p>
      <p
        className={cn("m-0 mt-1 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        aria-label={props.valueAriaLabel}
      >
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

/** Counters stay unmeasured until rules exist and at least one evaluation timestamp is present (TB-2104). */
export function resolveAlertsSummaryCountDisplay(args: {
  readonly value: number;
  readonly loading: boolean;
  readonly workspaceContextLoading: boolean;
  readonly hasAlertRules: boolean;
  readonly lastEvaluatedUtc: string | null;
}): SummaryCountDisplay {
  if (args.loading || args.workspaceContextLoading) {
    return { value: "…" };
  }

  if (!args.hasAlertRules) {
    return {
      value: ALERTS_SUMMARY_COUNT_NOT_EVALUATED,
      valueAriaLabel: ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA,
    };
  }

  if (args.lastEvaluatedUtc === null) {
    return {
      value: ALERTS_SUMMARY_COUNT_NOT_EVALUATED,
      valueAriaLabel: ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA,
    };
  }

  return { value: finiteIntegerCountDisplay(args.value) };
}

/** Open tile nests blocking as a subset so lifecycle and severity axes are not double-counted (TB-2107). */
export function resolveOpenAlertsSummaryDisplay(args: {
  readonly open: number;
  readonly blocking: number;
  readonly loading: boolean;
  readonly workspaceContextLoading: boolean;
  readonly hasAlertRules: boolean;
  readonly lastEvaluatedUtc: string | null;
}): SummaryCountDisplay {
  const base = resolveAlertsSummaryCountDisplay({
    value: args.open,
    loading: args.loading,
    workspaceContextLoading: args.workspaceContextLoading,
    hasAlertRules: args.hasAlertRules,
    lastEvaluatedUtc: args.lastEvaluatedUtc,
  });

  if (base.valueAriaLabel !== undefined) {
    return base;
  }

  if (args.loading || args.workspaceContextLoading) {
    return base;
  }

  return {
    value: formatAlertsOpenSummaryValue(args.open, args.blocking),
    valueAriaLabel: formatAlertsOpenSummaryAriaLabel(args.open, args.blocking),
    labelHint: ALERTS_SUMMARY_OPEN_BLOCKING_RELATIONSHIP_TITLE,
  };
}

/**
 * Summary metrics stay hidden until alert rules exist and evaluation has produced at least one
 * timestamp — same zero-theater contract as inbox controls (TB-1597, TB-2105).
 */
export function shouldShowAlertsInboxSummaryRow(args: {
  readonly hasAlertRules: boolean;
  readonly workspaceContextLoading: boolean;
  readonly summaryLoading: boolean;
  readonly lastEvaluatedUtc: string | null;
}): boolean {
  if (args.workspaceContextLoading || args.summaryLoading) {
    return true;
  }

  if (!args.hasAlertRules) {
    return false;
  }

  return args.lastEvaluatedUtc !== null;
}

export function AlertsInboxSummaryRow(props: AlertsInboxSummaryRowProps): React.JSX.Element | null {
  const { summary, loading, hasAlertRules, workspaceContextLoading } = props;

  if (
    !shouldShowAlertsInboxSummaryRow({
      hasAlertRules,
      workspaceContextLoading,
      summaryLoading: loading,
      lastEvaluatedUtc: summary.lastEvaluatedUtc,
    })
  ) {
    return null;
  }

  const openDisplay = resolveOpenAlertsSummaryDisplay({
    open: summary.open,
    blocking: summary.blocking,
    loading,
    workspaceContextLoading,
    hasAlertRules,
    lastEvaluatedUtc: summary.lastEvaluatedUtc,
  });
  const acknowledgedDisplay = resolveAlertsSummaryCountDisplay({
    value: summary.acknowledged,
    loading,
    workspaceContextLoading,
    hasAlertRules,
    lastEvaluatedUtc: summary.lastEvaluatedUtc,
  });
  const resolvedDisplay = resolveAlertsSummaryCountDisplay({
    value: summary.resolved,
    loading,
    workspaceContextLoading,
    hasAlertRules,
    lastEvaluatedUtc: summary.lastEvaluatedUtc,
  });

  return (
    <section
      className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="alerts-inbox-summary-row"
      aria-label="Alert inbox summary"
    >
      <SummaryMetric
        label={ALERTS_SUMMARY_OPEN_LABEL}
        value={openDisplay.value}
        valueAriaLabel={openDisplay.valueAriaLabel}
        labelHint={openDisplay.labelHint}
      />
      <SummaryMetric
        label={ALERTS_SUMMARY_ACKNOWLEDGED_LABEL}
        value={acknowledgedDisplay.value}
        valueAriaLabel={acknowledgedDisplay.valueAriaLabel}
      />
      <SummaryMetric
        label={ALERTS_SUMMARY_RESOLVED_LABEL}
        value={resolvedDisplay.value}
        valueAriaLabel={resolvedDisplay.valueAriaLabel}
      />
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

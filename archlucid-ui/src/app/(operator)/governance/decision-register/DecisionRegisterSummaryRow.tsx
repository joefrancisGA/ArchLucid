import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

import {
  DECISION_REGISTER_SUMMARY_HIGH_CONFIDENCE_LABEL,
  DECISION_REGISTER_SUMMARY_LAST_RECORDED_LABEL,
  DECISION_REGISTER_SUMMARY_NEEDING_REVIEW_LABEL,
  DECISION_REGISTER_SUMMARY_RECENT_LABEL,
  DECISION_REGISTER_SUMMARY_SIGNED_LABEL,
} from "./decision-register-copy";
import type { DecisionRegisterSummary } from "./decision-register-summary";

type DecisionRegisterSummaryRowProps = {
  readonly summary: DecisionRegisterSummary;
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

export function DecisionRegisterSummaryRow(props: DecisionRegisterSummaryRowProps): React.JSX.Element {
  const { summary } = props;

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      data-testid="decision-register-summary-row"
      aria-label="Decision register summary"
    >
      <SummaryMetric label={DECISION_REGISTER_SUMMARY_SIGNED_LABEL} value={finiteIntegerCountDisplay(summary.recordedDecisions)} />
      <SummaryMetric label={DECISION_REGISTER_SUMMARY_RECENT_LABEL} value={finiteIntegerCountDisplay(summary.recentDecisions)} />
      <SummaryMetric
        label={DECISION_REGISTER_SUMMARY_HIGH_CONFIDENCE_LABEL}
        value={finiteIntegerCountDisplay(summary.highConfidenceDecisions)}
      />
      <SummaryMetric
        label={DECISION_REGISTER_SUMMARY_NEEDING_REVIEW_LABEL}
        value={finiteIntegerCountDisplay(summary.decisionsNeedingReview)}
      />
      <SummaryMetric label={DECISION_REGISTER_SUMMARY_LAST_RECORDED_LABEL} value={summary.lastRecordedDecisionLabel} />
    </section>
  );
}

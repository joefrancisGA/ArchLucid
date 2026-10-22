import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import {
  IMPROVEMENT_PLANNING_FEEDBACK_SIGNALS_LABEL,
  IMPROVEMENT_PLANNING_HIGHEST_PRIORITY_LABEL,
  IMPROVEMENT_PLANNING_NO_FEEDBACK_SIGNALS_DETAIL,
  IMPROVEMENT_PLANNING_NO_PLANS_LINKED_DETAIL,
  IMPROVEMENT_PLANNING_NO_PRIORITY_DETAIL,
  IMPROVEMENT_PLANNING_SIGNALS_LINKED_LABEL,
} from "@/lib/planning-page-copy";
import type { LearningSummaryResponse } from "@/types/learning";

const cardListCls = "mt-3 flex list-none flex-wrap gap-2.5 p-0";
const cardCls = "min-w-[160px] rounded-lg border border-neutral-200 px-3.5 py-2.5 dark:border-neutral-700";

type PlanningSummaryMetricCardProps = {
  readonly detail: string;
  readonly label: string;
  readonly value: string;
  readonly zeroDetail?: string;
};

function PlanningSummaryMetricCard(props: PlanningSummaryMetricCardProps): React.JSX.Element {
  return (
    <li className={cardCls}>
      <div className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</div>
      <div className={cn("font-semibold", OPERATOR_TYPOGRAPHY.pageTitle)}>{props.value}</div>
      <div className={cn("mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.zeroDetail ?? props.detail}
      </div>
    </li>
  );
}

type PlanningSummarySectionProps = {
  summary: LearningSummaryResponse;
  generatedUtc: string | null;
};

/** Roll-up KPIs for feedback signals, linked plans, and priority ceiling. */
export function PlanningSummarySection(props: PlanningSummarySectionProps) {
  const { summary, generatedUtc } = props;
  const feedbackSignalsValue = String(summary.totalThemeEvidenceSignals);
  const linkedSignalsValue = String(summary.totalLinkedSignalsAcrossPlans);
  const priorityValue =
    summary.maxPlanPriorityScore !== null && summary.maxPlanPriorityScore !== undefined
      ? String(summary.maxPlanPriorityScore)
      : " — ";

  return (
    <section className="mb-7" aria-labelledby="planning-summary-heading">
      <h2 id="planning-summary-heading" className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}>
        Summary
      </h2>
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Generated {generatedUtc ? formatIsoUtcForDisplay(generatedUtc) : " — "} · {summary.themeCount} theme(s) ·{" "}
        {summary.planCount} plan(s)
      </p>
      <ul className={cardListCls}>
        <PlanningSummaryMetricCard
          label={IMPROVEMENT_PLANNING_FEEDBACK_SIGNALS_LABEL}
          value={feedbackSignalsValue}
          detail="Captured from review feedback analysis."
          zeroDetail={summary.totalThemeEvidenceSignals === 0 ? IMPROVEMENT_PLANNING_NO_FEEDBACK_SIGNALS_DETAIL : undefined}
        />
        <PlanningSummaryMetricCard
          label={IMPROVEMENT_PLANNING_SIGNALS_LINKED_LABEL}
          value={linkedSignalsValue}
          detail="Signals tied to generated improvement plans."
          zeroDetail={summary.totalLinkedSignalsAcrossPlans === 0 ? IMPROVEMENT_PLANNING_NO_PLANS_LINKED_DETAIL : undefined}
        />
        <PlanningSummaryMetricCard
          label={IMPROVEMENT_PLANNING_HIGHEST_PRIORITY_LABEL}
          value={priorityValue}
          detail="Highest priority score across generated plans."
          zeroDetail={
            summary.planCount === 0 || summary.maxPlanPriorityScore === null || summary.maxPlanPriorityScore === undefined
              ? IMPROVEMENT_PLANNING_NO_PRIORITY_DETAIL
              : undefined
          }
        />
      </ul>
    </section>
  );
}

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import type { LearningSummaryResponse } from "@/types/learning";

const cardListCls = "mt-3 flex list-none flex-wrap gap-2.5 p-0";
const cardCls = "min-w-[160px] rounded-lg border border-neutral-200 px-3.5 py-2.5 dark:border-neutral-700";

type PlanningSummarySectionProps = {
  summary: LearningSummaryResponse;
  generatedUtc: string | null;
};

/** Roll-up KPIs: evidence-style counts and plan priority ceiling. */
export function PlanningSummarySection(props: PlanningSummarySectionProps) {
  const { summary, generatedUtc } = props;

  return (
    <section className="mb-7" aria-labelledby="planning-summary-heading">
      <h3 id="planning-summary-heading" className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}>
        Summary
      </h3>
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Generated {generatedUtc ? formatIsoUtcForDisplay(generatedUtc) : "—"} · {summary.themeCount} theme(s) ·{" "}
        {summary.planCount} plan(s)
      </p>
      <ul className={cardListCls}>
        <li className={cardCls}>
          <div className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Theme evidence (signals)</div>
          <div className={cn("font-semibold", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.totalThemeEvidenceSignals}</div>
        </li>
        <li className={cardCls}>
          <div className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Linked signals (plans)</div>
          <div className={cn("font-semibold", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.totalLinkedSignalsAcrossPlans}</div>
        </li>
        <li className={cardCls}>
          <div className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Max plan priority</div>
          <div className={cn("font-semibold", OPERATOR_TYPOGRAPHY.pageTitle)}>{summary.maxPlanPriorityScore ?? "—"}</div>
        </li>
      </ul>
    </section>
  );
}

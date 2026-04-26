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
      <h3 id="planning-summary-heading" className="mb-2 text-[17px]">
        Summary
      </h3>
      <p className="mt-0 text-[13px] text-neutral-500 dark:text-neutral-400">
        Generated {generatedUtc ? formatIsoUtcForDisplay(generatedUtc) : "—"} · {summary.themeCount} theme(s) ·{" "}
        {summary.planCount} plan(s)
      </p>
      <ul className={cardListCls}>
        <li className={cardCls}>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Theme evidence (signals)</div>
          <div className="text-xl font-semibold">{summary.totalThemeEvidenceSignals}</div>
        </li>
        <li className={cardCls}>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Linked signals (plans)</div>
          <div className="text-xl font-semibold">{summary.totalLinkedSignalsAcrossPlans}</div>
        </li>
        <li className={cardCls}>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Max plan priority</div>
          <div className="text-xl font-semibold">{summary.maxPlanPriorityScore ?? "—"}</div>
        </li>
      </ul>
    </section>
  );
}

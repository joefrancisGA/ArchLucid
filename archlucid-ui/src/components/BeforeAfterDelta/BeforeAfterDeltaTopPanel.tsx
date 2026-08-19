"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  formatFindings,
  formatHours,
  formatMedianLlmCalls,
  formatPerRunFindingsLine,
  safeCommittedRunWindowCount,
} from "./formatDelta";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { useDeltaQuery } from "./useDeltaQuery";

/**
 * "Top" placement of `BeforeAfterDeltaPanel` — rendered above the runs index list.
 *
 * Aggregates the most recent N committed runs (default 5, matches owner Q29) and shows
 * the **median delta on findings + median time-to-committed-manifest** as the headline,
 * with a thin per-run row strip below so the median is auditable at a glance.
 *
 * Uses median (not mean) so a single noisy outlier run cannot inflate the headline —
 * the same choice the server makes in `RecentPilotRunDeltasService.ComputeMedian`.
 *
 * Hidden when zero committed runs are in scope so the runs index does not start with
 * a sad-empty card; the runs-index empty state already covers that case.
 */
export type BeforeAfterDeltaTopPanelProps = {
  /** Hard upper bound — server still clamps to [1, 25]. Default 5 matches the prompt. */
  count?: number;
};

export function BeforeAfterDeltaTopPanel({ count = 5 }: BeforeAfterDeltaTopPanelProps) {
  const { status, data } = useDeltaQuery({ count });

  if (status !== "ready" || data === null) return null;
  const windowCount = safeCommittedRunWindowCount(data.returnedCount);

  if (windowCount === null || windowCount < 1) return null;
  // Malformed proxy JSON (missing `items`) must not throw during `.map` — degrade to hidden panel.
  if (!Array.isArray(data.items)) return null;

  return (
    <section
      data-testid="before-after-delta-panel-top"
      role="region"
      aria-label="Median proof-of-ROI deltas across recent finalized reviews"
      className="mb-6 max-w-4xl rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Recent finalized reviews — median delta
      </h3>
      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Across the last <strong data-testid="delta-top-window">{windowCount}</strong> finalized review(s) in
        scope. Median (not mean) so one outlier does not skew the headline. Same numbers as the per-run value
        report.
      </p>

      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
          <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Median findings per finalized review
          </dt>
          <dd
            data-testid="delta-top-median-findings"
            className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          >
            {formatFindings(data.medianTotalFindings)}
          </dd>
        </div>
        <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
          <dt className={cn("font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Median time to finalized review
          </dt>
          <dd
            data-testid="delta-top-median-time"
            className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          >
            {formatHours(data.medianTimeToCommittedManifestTotalSeconds)}
          </dd>
        </div>
        <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
          <dt className={cn("inline-flex items-center gap-1 font-medium uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Median LLM calls (attested rows)
            <FieldHelpTooltip
              label="Median LLM calls"
              hint="Median count of persisted agent execution traces per run when all window rows have attested counts."
            />
          </dt>
          <dd
            data-testid="delta-top-median-llm"
            className={cn("mt-1 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}
          >
            {formatMedianLlmCalls(data.medianLlmCallCount)}
          </dd>
        </div>
      </dl>

      <ol
        data-testid="delta-top-rows"
        className={cn("mt-3 space-y-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      >
        {data.items.map((row, index) => {
          const rid = typeof row.runId === "string" && row.runId.length > 0 ? row.runId : `row-${String(index)}`;
          const shortId = rid.length >= 8 ? `${rid.slice(0, 8)}…` : rid;

          return (
          <li key={rid} className="flex flex-wrap gap-x-3">
            <span className="font-mono">{shortId}</span>
            <span>{formatPerRunFindingsLine(row.totalFindings)}</span>
            <span>{formatHours(row.timeToCommittedManifestTotalSeconds)}</span>
            <span>
              {row.llmCallCountResolved === false
                ? "— traces"
                : `${formatFindings(typeof row.llmCallCount === "number" ? row.llmCallCount : Number(row.llmCallCount))} traces`}
            </span>
            {row.isDemoTenant ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                demo
              </span>
            ) : null}
          </li>
          );
        })}
      </ol>
    </section>
  );
}

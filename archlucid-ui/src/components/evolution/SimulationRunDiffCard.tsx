import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactElement } from "react";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { EvolutionSimulationRunWithEvaluationResponse } from "@/types/evolution";
import { parseEvolutionOutcomeJson } from "@/lib/evolution-outcome";
import { cn } from "@/lib/utils";

const cardCls = "mb-3.5 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700";
const headerCls = cn(
  "flex flex-wrap items-baseline gap-2.5 border-b border-neutral-200 bg-neutral-50/90 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/50",
  OPERATOR_TYPOGRAPHY.body,
);
const colCls = (cn("p-3.5 leading-normal align-top", OPERATOR_TYPOGRAPHY.helper));
const colBeforeCls = `${colCls} border-r-[3px] border-neutral-300 bg-al-surface-raised dark:border-neutral-600`;
const colAfterCls = `${colCls} bg-al-surface-raised dark:bg-neutral-900/50`;
const labelCls = (cn("mb-1.5 font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper));
const monoCls = cn("font-mono break-all", OPERATOR_TYPOGRAPHY.helper);

function formatScore(n: number | null | undefined): string {
  if (n === null || n === undefined) {
    return "—";
  }

  return Number.isFinite(n) ? n.toFixed(4) : "—";
}

export type SimulationRunDiffCardProps = {
  run: EvolutionSimulationRunWithEvaluationResponse;
  /** Baseline run IDs from the plan snapshot (before context). */
  planLinkedRunIds: string[];
};

/**
 * One simulation row: plan-linked baseline context vs shadow re-analysis outcome (read-only diff layout).
 */
export function SimulationRunDiffCard(props: SimulationRunDiffCardProps): ReactElement {
  const { run, planLinkedRunIds } = props;
  const parsed = parseEvolutionOutcomeJson(run.outcomeJson);
  const baselineId = run.baselineArchitectureRunId.trim();
  const isLinkedOnPlan = planLinkedRunIds.some((id) => id === baselineId);
  const ev = run.evaluationScore;

  return (
    <article className={cardCls} aria-labelledby={`sim-run-${run.simulationRunId}`}>
      <div className={headerCls} id={`sim-run-${run.simulationRunId}`}>
        <span>
          <strong>Review baseline</strong>{" "}
          <Link href={`/architecture/reviews/${encodeURIComponent(baselineId)}`} className={cn(OPERATOR_LINK.inline, "font-mono break-all")}>
            {baselineId}
          </Link>
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          Completed {new Date(run.completedUtc).toLocaleString()} · {run.evaluationMode}
          {run.isShadowOnly ? " · read-only estimate" : ""}
        </span>
      </div>

      <div className="grid grid-cols-2">
        <div className={colBeforeCls}>
          <div className={labelCls}>Before (current baseline)</div>
          <p className="mb-2 text-stone-700 dark:text-stone-300">
            The review associated with this proposed change before the simulated update is applied.
          </p>
          <ul className="m-0 pl-[18px] text-stone-600 dark:text-stone-400">
            <li>
              Linked from planning:{" "}
              <strong>{isLinkedOnPlan ? "yes" : "no"}</strong>
              {planLinkedRunIds.length > 0 ? (
                <span className="mt-1.5 block">
                  Linked reviews:{" "}
                  {planLinkedRunIds.map((id, idx) => (
                    <span key={`${id}-${idx}`} className="block">
                      <Link href={`/architecture/reviews/${encodeURIComponent(id)}`} className={cn(OPERATOR_LINK.inline, "font-mono break-all")}>
                        {id}
                      </Link>
                      {id === baselineId ? " ← this row" : null}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400"> No reviews linked from planning.</span>
              )}
            </li>
          </ul>
        </div>

        <div className={colAfterCls}>
          <div className={labelCls}>After (simulated impact)</div>
          {parsed.kind === "empty" || parsed.kind === "invalid" ? (
            <p className="m-0 text-red-800 dark:text-red-400">
              {parsed.kind === "empty"
                ? "No simulation outcome stored yet."
                : "Simulation outcome could not be loaded for comparison."}
            </p>
          ) : (
            <>
              {parsed.shadow.error !== null && parsed.shadow.error !== undefined && parsed.shadow.error !== "" ? (
                <p className="mb-2 text-red-800 dark:text-red-400">
                  <strong>Error:</strong> {parsed.shadow.error}
                </p>
              ) : null}
              <dl className="m-0 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
                <dt className="text-neutral-500 dark:text-neutral-400">Review status</dt>
                <dd className="m-0">{parsed.shadow.runStatus ?? "—"}</dd>
                <dt className="text-neutral-500 dark:text-neutral-400">Review record version</dt>
                <dd className={cn("m-0 font-mono break-all", OPERATOR_TYPOGRAPHY.helper)}>{parsed.shadow.manifestVersion ?? "—"}</dd>
                <dt className="text-neutral-500 dark:text-neutral-400">Has manifest</dt>
                <dd className="m-0">{parsed.shadow.hasManifest ? "yes" : "no"}</dd>
                <dt className="text-neutral-500 dark:text-neutral-400">Summary length</dt>
                <dd className="m-0">{parsed.shadow.summaryLength}</dd>
                <dt className="text-neutral-500 dark:text-neutral-400">Analysis warnings</dt>
                <dd className="m-0">{parsed.shadow.warningCount}</dd>
              </dl>
            </>
          )}

          {ev !== null && ev !== undefined ? (
            <>
              <div className={`${labelCls} mt-3.5`}>Evaluation scores</div>
              <EnterpriseTable ariaLabel="Simulation evaluation scores" className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper)}>
                <EnterpriseTableBody>
                  <EnterpriseTableRow>
                    <EnterpriseTableCell className="pr-2 py-0.5 text-neutral-500 dark:text-neutral-400">Simulation</EnterpriseTableCell>
                    <EnterpriseTableCell className="p-0.5">{formatScore(ev.simulationScore)}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                  <EnterpriseTableRow>
                    <EnterpriseTableCell className="pr-2 py-0.5 text-neutral-500 dark:text-neutral-400">Determinism</EnterpriseTableCell>
                    <EnterpriseTableCell className="p-0.5">{formatScore(ev.determinismScore)}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                  <EnterpriseTableRow>
                    <EnterpriseTableCell className="pr-2 py-0.5 text-neutral-500 dark:text-neutral-400">Regression risk</EnterpriseTableCell>
                    <EnterpriseTableCell className="p-0.5">{formatScore(ev.regressionRiskScore)}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                  <EnterpriseTableRow>
                    <EnterpriseTableCell className="pr-2 py-0.5 text-neutral-500 dark:text-neutral-400">Improvement Δ</EnterpriseTableCell>
                    <EnterpriseTableCell className="p-0.5">{formatScore(ev.improvementDelta)}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                  <EnterpriseTableRow>
                    <EnterpriseTableCell className="pr-2 py-0.5 text-neutral-500 dark:text-neutral-400">Confidence</EnterpriseTableCell>
                    <EnterpriseTableCell className="p-0.5">{formatScore(ev.confidenceScore)}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                </EnterpriseTableBody>
              </EnterpriseTable>
              {(ev.regressionSignals ?? []).length > 0 ? (
                <div className="mt-2">
                  <div className={cn("mb-1 font-semibold", OPERATOR_TYPOGRAPHY.helper)}>Regression signals</div>
                  <ul className={cn("m-0 pl-[18px]", OPERATOR_TYPOGRAPHY.helper)}>
                    {(ev.regressionSignals ?? []).map((s, i) => (
                      <li key={`${i}-${s}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {run.evaluationExplanationSummary !== null &&
          run.evaluationExplanationSummary !== undefined &&
          run.evaluationExplanationSummary !== "" ? (
            <p className={cn("mt-2.5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              <strong>Summary:</strong> {run.evaluationExplanationSummary}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

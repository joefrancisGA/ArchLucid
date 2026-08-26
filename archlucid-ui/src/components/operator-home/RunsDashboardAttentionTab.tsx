import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import {
  isRunNeedingAttention,
  runListPrimaryTitle,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase } from "@/components/operator-home/runs-dashboard-load-phase";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { formatRunHomeListInsightLine } from "@/lib/operator/operator-home-run-list-insight";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";

export type RunsDashboardAttentionTabProps = {
  readonly phase: RunsDashboardLoadPhase;
  readonly failure: ApiLoadFailureState | null;
  readonly runListError: boolean;
  readonly filteredItems: readonly RunSummary[];
  /** Partition label for home dedup surfaces (TB-2369). */
  readonly attentionPartitionLabel?: string;
  /** Total attention count before home unfinished-rail dedup. */
  readonly totalAttentionCount?: number;
  /** Partition id for inventory markers on home attention preview. */
  readonly attentionPartitionId?: string;
};

export function RunsDashboardAttentionTab(props: RunsDashboardAttentionTabProps) {
  const attentionRuns = props.filteredItems.filter(isRunNeedingAttention);
  const attentionPreview = attentionRuns.slice(0, 3);
  const totalAttentionCount =
    typeof props.totalAttentionCount === "number" && Number.isFinite(props.totalAttentionCount)
      ? Math.max(0, Math.trunc(props.totalAttentionCount))
      : attentionRuns.length;
  const suppressedByUnfinishedRail = totalAttentionCount > 0 && attentionRuns.length === 0;

  return (
    <div
      data-testid="runs-dashboard-tab-attention"
      data-attention-partition={props.attentionPartitionId ?? undefined}
    >
      {props.phase === "loading" ? (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {RUNS_DASHBOARD_LABELS.loadingReviews}
        </p>
      ) : null}

      {props.runListError && props.failure !== null ? (
        <div className={cn(OPERATOR_TYPOGRAPHY.helper, "[&_strong]:font-semibold")}>
          <OperatorApiProblem
            problem={props.failure.problem}
            fallbackMessage={props.failure.message}
            correlationId={props.failure.correlationId}
          />
        </div>
      ) : null}

      {(props.phase === "ready" || (props.phase === "error" && props.filteredItems.length > 0)) ? (
        <>
          {attentionRuns.length === 0 ? (
            <p className={cn("m-0 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {suppressedByUnfinishedRail && props.attentionPartitionLabel !== undefined
                ? RUNS_DASHBOARD_LABELS.reviewsNeedAttentionShownInPartition(props.attentionPartitionLabel)
                : RUNS_DASHBOARD_LABELS.noReviewsNeedAttention}
            </p>
          ) : (
            <>
              {props.attentionPartitionLabel !== undefined ? (
                <p
                  className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="runs-dashboard-attention-partition-label"
                >
                  {props.attentionPartitionLabel}
                </p>
              ) : null}
              <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                {attentionRuns.length === 1
                  ? RUNS_DASHBOARD_LABELS.oneReviewNeedsAttention
                  : RUNS_DASHBOARD_LABELS.reviewsNeedAttentionCount(attentionRuns.length)}
              </p>
              <ul className="m-0 list-none space-y-2 p-0" data-testid="command-center-runs-card">
                {attentionPreview.map((run) => (
                  <li
                    key={run.runId}
                    className="flex flex-col gap-0.5 border-b border-neutral-100 pb-2 last:border-b-0 last:pb-0 dark:border-neutral-800"
                  >
                    <span className={cn("min-w-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
                      {runListPrimaryTitle(run)}
                    </span>
                    {(() => {
                      const insightLine = formatRunHomeListInsightLine(run);

                      if (insightLine === null) {
                        return null;
                      }

                      return (
                        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>
                          {insightLine}
                        </p>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

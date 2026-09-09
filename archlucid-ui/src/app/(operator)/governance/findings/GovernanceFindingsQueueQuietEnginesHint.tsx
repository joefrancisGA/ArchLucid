"use client";

import { useQuery } from "@tanstack/react-query";

import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import { ActorDependentFindingsQuietEnginesHint } from "@/components/findings/ActorDependentFindingsQuietEnginesHint";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { governanceFindingsQueueQuietEnginesBlockedReason } from "@/lib/governance/governance-findings-queue-quiet-engines-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getArchitectureGraphPage } from "@/lib/graph-api";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceFindingsQueueQuietEnginesHintProps = {
  readonly scopedRunId: string | null;
};

/** Working-mode honesty when a scoped package has zero Actor nodes (LD-03). */
export function GovernanceFindingsQueueQuietEnginesHint(
  props: GovernanceFindingsQueueQuietEnginesHintProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const runId = props.scopedRunId?.trim() ?? "";
  const enabled = isWorkingMode && runId.length > 0;

  const query = useQuery({
    queryKey: ["governance-findings-queue-quiet-engines", runId],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const [critical, graphPage] = await Promise.all([
        fetchRunDetailCriticalPageBundle(runId),
        getArchitectureGraphPage(runId, 1, 200),
      ]);
      const analysisComplete = analysisStagesCompleteOnSummary(critical.data.progressSummary);
      const actorCount = countActorNodesInGraphSnapshot({ nodes: graphPage.nodes });

      return {
        analysisComplete,
        actorCount,
      };
    },
  });

  if (!enabled) {
    return null;
  }

  if (query.isError) {
    const failure = toApiLoadFailure(query.error);
    const blockedReason = governanceFindingsQueueQuietEnginesBlockedReason(failure);

    return (
      <div className="space-y-2" data-testid="governance-findings-queue-quiet-engines-blocked">
        <OperatorApiProblem failure={failure} variant="warning" />
        {blockedReason ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
        ) : null}
      </div>
    );
  }

  if (query.data === undefined) {
    return null;
  }

  const show = query.data.analysisComplete && query.data.actorCount === 0;

  return <ActorDependentFindingsQuietEnginesHint show={show} runId={runId} workingMode={isWorkingMode} />;
}

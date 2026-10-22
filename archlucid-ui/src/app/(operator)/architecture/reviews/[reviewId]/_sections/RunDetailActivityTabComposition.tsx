import Link from "next/link";
import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { RunDetailActivityTabSectionNav } from "@/components/runs/RunDetailActivityTabSectionNav";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { resolveReviewFailureRecordedAtUtc } from "@/components/resolve-run-detail-last-failure-summary";
import type { RunDetailDeferredSectionContext, RunDetailPageModel } from "./run-detail-page-model";
import { isReviewPipelineTerminalFailure } from "@/lib/review-pipeline-terminal-state";
import {
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailBelowFoldSectionsDeferred,
  RunDetailLastFailureCardDeferred,
  RunDetailOperatorTechnicalForensicsPanelDeferred,
  RunDetailProgressTrackerDeferred,
} from "./RunDetailTabbedWorkspaceDeferredImports";

export type RunDetailActivityTabCompositionInput = {
  readonly model: RunDetailPageModel;
  readonly deferredContext: RunDetailDeferredSectionContext;
};

export function composeRunDetailActivityTab(
  input: RunDetailActivityTabCompositionInput,
): React.JSX.Element {
  const m = input.model;
  const terminalFailure = isReviewPipelineTerminalFailure(m.pipelineDiagnosticContext);
  const doThisNextOwnsFailureRecovery = terminalFailure && !m.manifestId;
  const provenanceHref = `/architecture/reviews/${encodeURIComponent(m.resolvedDetail.run.runId)}/provenance`;
  const failureRecordedAtUtc = resolveReviewFailureRecordedAtUtc({
    pipelineSummary: m.progressForPipelineUi ?? null,
    runCompletedUtc: m.resolvedDetail.run.completedUtc ?? null,
  });

  return (
    <div className={cn("flex flex-col xl:flex-row xl:items-start", OPERATOR_LAYOUT.unrelatedClusterGap, "xl:gap-6")}>
      <div className="min-w-0 flex-1 space-y-4">
        <RunDetailActivityTabSectionNav
          hasManifestId={Boolean(m.manifestId)}
          showFailureDetails={!doThisNextOwnsFailureRecovery}
          placement="inline-top"
        />
      {!m.manifestId && m.showProgressTracker ? (
        <div id="pipeline-timeline" className="scroll-mt-24">
          <RunDetailProgressTrackerDeferred
            runId={m.routeRunId}
            initialSummary={m.progressForPipelineUi}
            diagnosticContext={m.pipelineDiagnosticContext}
            deferFailureRecoveryToDoThisNext
            workingDeskProgressCopy={m.buyerPolishedArtifactTable !== true}
          />
        </div>
      ) : null}
      {m.showProgressTracker && m.manifestId ? (
        <RunDetailProgressTrackerDeferred
          runId={m.routeRunId}
          initialSummary={m.progressForPipelineUi}
          diagnosticContext={m.pipelineDiagnosticContext}
          workingDeskProgressCopy={m.buyerPolishedArtifactTable !== true}
        />
      ) : null}
      <section
        id="records-and-diagnostics"
        className="space-y-4 scroll-mt-24"
        aria-labelledby="records-and-diagnostics-heading"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2
            id="records-and-diagnostics-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Records and diagnostics
          </h2>
          <Link
            className={cn(OPERATOR_LINK.nav, "shrink-0")}
            href={provenanceHref}
            data-testid="run-detail-provenance-link"
          >
            Full provenance view
          </Link>
        </div>
        {!doThisNextOwnsFailureRecovery ? (
          <div id="review-failure-details" className="scroll-mt-24">
            <RunDetailLastFailureCardDeferred
              runId={m.resolvedDetail.run.runId}
              summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
              legacyRunStatus={
                (m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null
              }
              failureRecordedAtUtc={failureRecordedAtUtc}
            />
          </div>
        ) : null}
        {!m.buyerPolishedArtifactTable ? (
          <RunDetailOperatorTechnicalForensicsPanelDeferred
            agentExecutionLlmCostEstimate={m.resolvedDetail.agentExecutionLlmCostEstimate}
            results={m.resolvedDetail.results}
            agentExecutionOutcomes={m.resolvedDetail.agentExecutionOutcomes}
            retrievalGroundingSummary={m.resolvedDetail.retrievalGroundingSummary}
            run={m.resolvedDetail.run}
            runDetailTraceId={m.runDetailTraceId}
          />
        ) : null}
        <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
          <RunDetailBelowFoldSectionsDeferred
            model={m}
            context={input.deferredContext}
            renderedInsideTabbedWorkspace
          />
        </Suspense>
      </section>
      </div>
      <RunDetailActivityTabSectionNav
        hasManifestId={Boolean(m.manifestId)}
        showFailureDetails={!doThisNextOwnsFailureRecovery}
        placement="sidebar"
      />
    </div>
  );
}

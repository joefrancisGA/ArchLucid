import { Suspense } from "react";

import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import {
  BeforeAfterDeltaPanelDeferred,
  RunDetailCompareToBaselineCta,
  RunDetailGovernanceCtaDeferred,
  RunDetailGovernanceDecisionSectionDeferred,
  RunDetailWhatIfBranchCompareBannerDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { RunDetailDecisionDeltaDeferred } from "./RunDetailDecisionDeltaDeferred";
import { RunDetailDecisionDeltaSkeleton } from "./RunDetailDecisionDeltaSkeleton";

export type RunDetailGovernanceTabCompositionInput = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

export function composeRunDetailGovernanceTab(
  input: RunDetailGovernanceTabCompositionInput,
): React.JSX.Element {
  const m = input.model;
  const p = input.presentation;
  const {
    blockingApprovalCount,
    buyerFinalizedPackage,
    findingCoverageSummary,
    showGovernanceCta,
    showGovernanceCtaCard,
  } = p;

  const governanceCtaEl = showGovernanceCta ? (
    <RunDetailGovernanceCtaDeferred runId={m.resolvedDetail.run.runId} demoted />
  ) : null;

  const governanceDecisionSectionEl = (
    <RunDetailGovernanceDecisionSectionDeferred
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
      operatorGovernanceDecisionRationale={m.resolvedDetail.run.operatorGovernanceDecisionRationale}
      operatorGovernanceDecisionUtc={m.resolvedDetail.run.operatorGovernanceDecisionUtc}
      operatorGovernanceDecisionByUserId={m.resolvedDetail.run.operatorGovernanceDecisionByUserId}
      manifestStatus={m.manifestSummary?.status ?? null}
      governanceGateLabel={m.governanceGateLabel}
      blockingFindingCount={blockingApprovalCount}
      hasGovernanceWarnings={m.resolvedDetail.run.hasGovernanceWarnings === true}
      pagePrimaryOwnedElsewhere
    />
  );

  return (
    <div className="space-y-4">
      {governanceDecisionSectionEl}
      {m.buyerPolishedArtifactTable && m.manifestId ? (
        <Suspense fallback={<RunDetailDecisionDeltaSkeleton />}>
          <RunDetailDecisionDeltaDeferred
            runId={m.routeRunId}
            resolvedDetail={m.resolvedDetail}
            explanationSummary={m.explanationSummary}
            isCommitted
          />
        </Suspense>
      ) : null}
      {buyerFinalizedPackage ? null : showGovernanceCtaCard ? governanceCtaEl : null}
      {!m.buyerPolishedArtifactTable ? (
        <Suspense
          fallback={
            <div
              className="h-12 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
              role="status"
              aria-label="Loading comparison banner"
            />
          }
        >
          <RunDetailWhatIfBranchCompareBannerDeferred
            currentRunId={m.resolvedDetail.run.runId}
            hasCurrentManifest={Boolean(m.manifestId)}
          />
        </Suspense>
      ) : null}
      {!m.buyerPolishedArtifactTable ? (
        <RunDetailCompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
      ) : null}
      {m.manifestId && !m.buyerPolishedArtifactTable ? (
        <BeforeAfterDeltaPanelDeferred variant="inline" runId={m.routeRunId} />
      ) : null}
    </div>
  );
}

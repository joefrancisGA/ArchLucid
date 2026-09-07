import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import { RunDetailArtifactsExportsSectionDeferred, RunDetailEvidenceTabPanelDeferred } from "./run-detail-page-view-deferred-chunks";

export type RunDetailEvidenceTabCompositionInput = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

export function composeRunDetailEvidenceTab(
  input: RunDetailEvidenceTabCompositionInput,
): React.JSX.Element {
  const m = input.model;
  const p = input.presentation;
  const {
    evidenceCoverageSummary,
    evidenceInventoryCount,
    evidenceInventoryItems,
    evidenceReviewDateLabel,
    findingCoverageSummary,
    primaryConcernFindingId,
    primaryConcernLabel,
    blockingApprovalCount,
    reviewDisplayTitle,
  } = p;

  const artifactsExportsSectionEl =
    m.manifestId ? (
      <RunDetailArtifactsExportsSectionDeferred
        manifestId={m.manifestId}
        runId={m.resolvedDetail.run.runId}
        buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        artifacts={m.artifacts}
        artifactsFailure={m.artifactsFailure}
        artifactsMalformed={m.artifactsMalformed}
        goldenManifestJsonForExport={m.goldenManifestJsonForExport}
        manifestSummaryForUi={m.manifestSummaryForUi}
        manifestSummary={m.manifestSummary}
        trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
        usedStaticDemoRun={m.usedStaticDemoRun}
        requestId={
          m.resolvedDetail.run.architectureRequestId ??
          (m.resolvedDetail.run as { requestId?: string }).requestId
        }
        deliverablesDefaultOpen={false}
        enginesSucceeded={findingCoverageSummary?.enginesSucceeded ?? null}
        progressSummary={m.resolvedDetail.run}
        graphSnapshot={m.resolvedDetail.graphSnapshot}
        findingsSnapshot={m.resolvedDetail.findingsSnapshot}
        pagePrimaryOwnedElsewhere
      />
    ) : null;

  return (
    <RunDetailEvidenceTabPanelDeferred
      packageName={reviewDisplayTitle}
      reviewDateLabel={evidenceReviewDateLabel}
      evidenceItemCount={evidenceInventoryCount}
      deliverableCount={m.artifacts.length}
      evidenceCoverageSummaryLine={evidenceCoverageSummary.summaryLine}
      linkedFindingCount={evidenceCoverageSummary.linkedCount}
      openFindingCount={evidenceCoverageSummary.totalCount}
      items={evidenceInventoryItems}
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      buyerPolished={m.buyerPolishedArtifactTable ?? false}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
      faithfulnessWarning={m.explanationSummary?.faithfulnessWarning ?? null}
      artifactsExportsSection={artifactsExportsSectionEl}
      blockingFindingId={primaryConcernFindingId}
      blockingFindingTitle={primaryConcernLabel}
      approvalBlocked={blockingApprovalCount > 0}
      pagePrimaryOwnedElsewhere
    />
  );
}

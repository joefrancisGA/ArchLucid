import { Suspense } from "react";

import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";

import {
  RunDetailActivitySourcesPanelDeferred,
  RunDetailArchitectureCreateWorkItemSectionDeferred,
  RunDetailArchitectureCreatedWorkspaceDeferred,
  RunDetailArchitectureSponsorSharingPanelDeferred,
  RunDetailCreateHomeActivityPanelDeferred,
  RunDetailCreateHomeEvidencePanelDeferred,
  RunDetailGovernanceDecisionSectionDeferred,
  RunDetailReviewPackageDoThisNextResolvedDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { RunDetailWorkspaceDisclosureControls } from "./RunDetailWorkspaceShell";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import { RunDetailExplanationSkeleton, RunDetailMidDeferredSkeleton } from "./RunDetailDeferredSkeleton";
import { RunDetailExplanationDeferred } from "./RunDetailExplanationDeferred";
import { RunDetailCreateHomeFindingsPanel } from "./RunDetailCreateHomeFindingsPanel";
import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";

export type RunDetailPageViewCreateHomeProps = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
  readonly createHomeActivityOutcomeCardsEl: React.JSX.Element;
  readonly reviewPackageDoThisNextEvidenceProps: {
    readonly evidenceCoverageLinkedCount: number;
    readonly evidenceCoverageTotalCount: number;
    readonly governanceDecisionRecorded: boolean;
    readonly pipelineDiagnosticContext: ReviewPipelineDiagnosticContext | null;
    readonly lastFailureSummary: RunDetailLastFailureSummary | null;
    readonly pipelineSummary: RunSummary;
    readonly intakeDescription: string | null;
    readonly intakeSystemName: string | null;
    readonly realModeFellBackToSimulator: boolean;
  };
};

/** Create-home workspace main column for architecture-created review detail. */
export function RunDetailPageViewCreateHome(props: RunDetailPageViewCreateHomeProps): React.JSX.Element {
  const { model: m, presentation, createHomeActivityOutcomeCardsEl, reviewPackageDoThisNextEvidenceProps } = props;
  const {
    architectureCreatedBaseline,
    architectureCreatedHomeModel,
    architectureEditHref,
    blockingApprovalCount,
    commitBlockedReason,
    createHomeActivityProvenanceAsOfLabel,
    createHomeActivityStatusLine,
    createHomeAnalysisStagesComplete,
    createHomePreFinalizeReadyToFinalize,
    deferredContext,
    evidenceCoverageSummary,
    evidenceInventoryItems,
    evidenceReviewDateLabel,
    findingCoverageSummary,
    findingsTriageVisibleCount,
    finalizeAssumptionGateApplies,
    quickDecisionFindings,
    requestAssumptionTexts,
    reviewDisplayTitle,
    reviewStatusSummary,
    submittedArchitectureText,
  } = presentation;

  return (
    <>
      <RunDetailReviewPackageDoThisNextResolvedDeferred
        runId={m.resolvedDetail.run.runId}
        manifestId={m.manifestId}
        hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
        blockingFindingCount={blockingApprovalCount}
        buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
        manifestStatus={m.manifestSummary?.status ?? null}
        runCompleted={m.resolvedDetail.run.completedUtc != null}
        nextAction={reviewStatusSummary.nextAction}
        showProgressTracker={m.showProgressTracker}
        legacyRunStatus={m.resolvedDetail.run.legacyRunStatus ?? null}
        isDeadLettered={m.resolvedDetail.run.isDeadLettered === true}
        openClarificationGapCount={architectureCreatedHomeModel?.clarificationGaps.length ?? 0}
        correctionHref={architectureEditHref}
        useCreateHomeWorkspaceTabs
        hasGoldenManifest={Boolean(m.manifestId)}
        commitBlockedReason={commitBlockedReason}
        finalizeAssumptionGateApplies={finalizeAssumptionGateApplies}
        quickDecisionFindings={quickDecisionFindings}
        requestAssumptionTexts={requestAssumptionTexts}
        transparencyTrail={
          m.manifestSummary?.feasibilityVerdict?.transparencyTrail ??
          m.manifestSummaryForUi?.feasibilityVerdict?.transparencyTrail ??
          null
        }
        feasibilityVerdict={
          m.manifestSummary?.feasibilityVerdict ??
          m.manifestSummaryForUi?.feasibilityVerdict ??
          null
        }
        graphSnapshot={m.resolvedDetail.graphSnapshot}
        analysisStagesComplete={createHomeAnalysisStagesComplete}
        {...reviewPackageDoThisNextEvidenceProps}
      />
      {!m.manifestId ? (
        <RunDetailOverviewTransparencyTrail
          feasibilityVerdict={m.manifestSummary?.feasibilityVerdict ?? m.manifestSummaryForUi?.feasibilityVerdict ?? null}
          runCompleted={m.resolvedDetail.run.completedUtc != null}
        />
      ) : null}
      <RunDetailWorkspaceDisclosureControls />
      <Suspense fallback={<RunDetailExplanationSkeleton />}>
        <RunDetailArchitectureCreatedWorkspaceDeferred
          baseline={architectureCreatedBaseline}
          architectureSourceText={submittedArchitectureText ?? ""}
          canEditDiagram={!m.manifestId}
          findings={quickDecisionFindings}
          findingsTriageVisibleCount={findingsTriageVisibleCount}
          correctionHref={architectureEditHref}
          pagePrimaryOwnedElsewhere
          analysisStagesComplete={createHomeAnalysisStagesComplete}
          panels={{
            findings: (
              <RunDetailCreateHomeFindingsPanel
                runId={m.resolvedDetail.run.runId}
                packageCommitted={Boolean(m.manifestId)}
              >
                <RunDetailExplanationDeferred
                  runId={m.routeRunId}
                  buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                  resolvedDetail={m.resolvedDetail}
                  explanationSummary={m.explanationSummary}
                  explanationFailure={m.explanationFailure}
                  findingCountDisplay={m.findingCountDisplay}
                  warningCountDisplay={m.warningCountDisplay}
                  goldenManifestJsonForExport={m.goldenManifestJsonForExport}
                  manifestRuleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
                  manifestRuleSetVersion={m.manifestSummaryForUi?.ruleSetVersion ?? null}
                  packageCommitted={Boolean(m.manifestId)}
                  analysisStagesComplete={createHomeAnalysisStagesComplete}
                  triageVisibleCount={findingsTriageVisibleCount}
                  requestAssumptionTexts={requestAssumptionTexts}
                  providerNeutralWorkItems={Boolean(m.manifestId)}
                  architectureWorkItemContext={
                    m.manifestId
                      ? {
                          architectureName: architectureCreatedBaseline.architectureName,
                          architectureOverview: architectureCreatedBaseline.architectureOverview,
                          ownerLabel: architectureCreatedBaseline.ownerLabel,
                        }
                      : null
                  }
                />
              </RunDetailCreateHomeFindingsPanel>
            ),
            evidence: (
              <RunDetailCreateHomeEvidencePanelDeferred
                packageName={reviewDisplayTitle}
                reviewDateLabel={evidenceReviewDateLabel}
                deliverableCount={m.artifacts.length}
                evidenceCoverageSummaryLine={evidenceCoverageSummary.summaryLine}
                linkedFindingCount={evidenceCoverageSummary.linkedCount}
                openFindingCount={evidenceCoverageSummary.totalCount}
                items={evidenceInventoryItems}
                artifacts={m.artifacts}
                runId={m.resolvedDetail.run.runId}
                buyerPolished={m.buyerPolishedArtifactTable ?? false}
              />
            ),
            governance: (
              <>
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
                {m.manifestId ? (
                  <>
                    <RunDetailArchitectureCreateWorkItemSectionDeferred
                      runId={m.resolvedDetail.run.runId}
                      architectureName={architectureCreatedBaseline.architectureName}
                      architectureOverview={architectureCreatedBaseline.architectureOverview}
                      ownerLabel={architectureCreatedBaseline.ownerLabel}
                      findings={quickDecisionFindings}
                    />
                    <RunDetailArchitectureSponsorSharingPanelDeferred
                      runId={m.resolvedDetail.run.runId}
                      architecture={architectureCreatedBaseline}
                      architectureSourceText={submittedArchitectureText ?? ""}
                      findings={quickDecisionFindings}
                      pagePrimaryOwnedElsewhere
                    />
                  </>
                ) : null}
              </>
            ),
            activity: (
              <RunDetailCreateHomeActivityPanelDeferred
                runId={m.resolvedDetail.run.runId}
                routeRunId={m.routeRunId}
                manifestId={m.manifestId ?? null}
                showProgressTracker={m.showProgressTracker}
                statusLine={createHomeActivityStatusLine}
                provenanceAsOfLabel={createHomeActivityProvenanceAsOfLabel}
                preFinalizeReadyToFinalize={createHomePreFinalizeReadyToFinalize}
                progressForPipelineUi={m.progressForPipelineUi}
                pipelineDiagnosticContext={m.pipelineDiagnosticContext}
                outcomeCards={createHomeActivityOutcomeCardsEl}
                midDeferred={
                  <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                    <RunDetailMidDeferredSections context={deferredContext} includeSavingsSummary={false} />
                  </Suspense>
                }
                sourcesPanel={<RunDetailActivitySourcesPanelDeferred />}
                pagePrimaryOwnedElsewhere
              />
            ),
            submittedArchitecture: (
              <RunDetailSubmittedArchitectureSectionDeferred
                architectureText={submittedArchitectureText}
                canEditSource={!m.manifestId}
                editHref={architectureEditHref}
                useStructuredPresentation={false}
                runId={m.resolvedDetail.run.runId}
                sectionTitle="Submitted brief"
              />
            ),
          }}
        />
      </Suspense>
    </>
  );
}

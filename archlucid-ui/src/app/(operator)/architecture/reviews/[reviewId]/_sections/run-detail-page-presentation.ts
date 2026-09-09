import type { ArchitectureCreatedHomeModel, BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import { isBuyerGoldenReviewPackagePageReady } from "@/lib/buyer/buyer-golden-spine-run-id";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer/buyer-demo-content-gating";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { WithheldFindingRow } from "@/lib/findings/findings-withheld-band";
import type {
  EvidenceCoverageSummary,
  SponsorBottomLineContent,
  FindingSeverityCounts,
  ReviewHeaderPresentation,
  ReviewStatusSummary,
  RunDetailWorkspaceRecommendedAction,
  RunDetailWorkspaceStatus,
} from "@/lib/run-detail-workspace-derive";

import type { RunDetailDeferredSectionContext, RunDetailPageModel } from "./run-detail-page-model";
import { buildRunDetailEvidencePresentation } from "./run-detail-page-presentation-evidence";
import { buildRunDetailFindingsPresentation } from "./run-detail-page-presentation-findings";
import {
  buildRunDetailGovernancePresentation,
  type ReviewPolicyPackCallout,
  type ShowcasePolicyPackStrip,
} from "./run-detail-page-presentation-governance";

type FindingCoverageSummary = RunDetailPageModel["resolvedDetail"]["findingCoverageSummary"];

export type { ShowcasePolicyPackStrip, ReviewPolicyPackCallout };

/**
 * Every non-JSX value {@link RunDetailPageView} needs, derived once from the page model so the
 * view stays a composition root over deferred sections.
 */
export type RunDetailPresentation = {
  readonly deferredContext: RunDetailDeferredSectionContext;
  readonly runSummaryForBadge: RunDetailPageModel["progressForPipelineUi"];

  readonly findingCoverageSummary: FindingCoverageSummary | null;
  readonly commitBlockedReason: string | null;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly requestAssumptionTexts: readonly string[];

  readonly quickDecisionFindings: readonly QuickDecisionFinding[];
  readonly findingsTriageVisibleCount: number;
  readonly severityCounts: FindingSeverityCounts;
  readonly materialSeverityLine: string | null;
  readonly pendingDecisionCount: number;
  readonly primaryConcernFindingId: string | null;
  readonly primaryConcernLabel: string | null;

  readonly reviewDisplayTitle: string;
  readonly systemName: string | null;
  readonly architectureSummaryTitle: string | null;
  readonly reviewHeaderPresentation: ReviewHeaderPresentation;
  readonly reviewOwnerLabel: string | null;
  readonly templateLabel: string | null;
  readonly packageVersionLabel: string | null;
  readonly finalizedAtLabel: string | null;
  readonly signedReviewRecordId: string | null;
  readonly signedReviewRecordIdLabel: string | null;

  readonly overallPosture: string;
  readonly blockingApprovalCount: number;
  readonly lowExtractionConfidenceCount: number;
  readonly withheldFindings: readonly WithheldFindingRow[];
  readonly catalogAdvisoryEngineFailureCount: number;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly reviewPipelineIncomplete: boolean;
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly reviewStatusSummary: ReviewStatusSummary;
  readonly governanceDecisionLabel: string;
  readonly governanceOutcomeLine: string;
  readonly findingsSummaryLine: string;
  readonly executiveBottomLineContent: SponsorBottomLineContent | null;

  readonly submittedArchitectureText: string | null;
  readonly hasSubmittedArchitecture: boolean;
  readonly architectureEditHref: string | null;

  readonly evidenceCoverageSummary: EvidenceCoverageSummary;
  readonly evidenceInventoryItems: ReturnType<typeof buildRunDetailEvidencePresentation>["evidenceInventoryItems"];
  readonly evidenceInventoryCount: number;
  readonly evidenceReviewDateLabel: string;

  readonly buyerFinalizedPackage: boolean;
  readonly buyerGoldenPageReady: boolean;
  readonly showDemoMarketingChrome: boolean;
  readonly showcasePolicyPackStrip: ShowcasePolicyPackStrip | null;
  readonly reviewPolicyPackCallout: ReviewPolicyPackCallout | null;
  readonly showGovernanceCta: boolean;
  readonly showGovernanceCtaCard: boolean;

  readonly showArchitectureCreatedHome: boolean;
  readonly createHomeAnalysisStagesComplete: boolean;
  readonly createHomePreFinalizeReadyToFinalize: boolean;
  readonly createHomeActivityStatusLine: string;
  readonly createHomeActivityProvenanceAsOfLabel: string;
  readonly architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput;
  readonly architectureCreatedHomeModel: ArchitectureCreatedHomeModel | null;
};

function toDeferredSectionContext(model: RunDetailPageModel): RunDetailDeferredSectionContext {
  return {
    routeRunId: model.routeRunId,
    resolvedDetail: model.resolvedDetail,
    usedStaticDemoRun: model.usedStaticDemoRun,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    manifestId: model.manifestId,
    artifacts: model.artifacts,
  };
}

/**
 * Builds the run detail presentation. The workspace derive module is imported dynamically to keep
 * it out of the initial server chunk for routes that never render review detail.
 */
export async function buildRunDetailPresentation(
  model: RunDetailPageModel,
  fromArchitectureCreation: boolean,
): Promise<RunDetailPresentation> {
  const workspaceDerive = await import("@/lib/run-detail-workspace-derive");

  const {
    deriveHighestUnresolvedSeverityLabel,
    deriveOverallPostureLabel,
    deriveRecommendedWorkspaceActions,
    deriveReviewDisplayTitle,
    deriveReviewHeaderPresentation,
    deriveReviewOwnerLabel,
    deriveReviewStatusSummary,
    deriveReviewTemplateLabel,
    deriveRunDetailWorkspaceStatus,
    isReviewPipelineIncomplete,
    deriveSignedReviewRecordIdLabel,
    deriveSponsorBottomLineContent,
    deriveArchitectureSystemName,
    deriveFinalizedAtUtc,
    derivePackageVersionLabel,
    formatDecisionSnapshotFindingsLine,
    filterUnresolvedFindings,
  } = workspaceDerive;

  const runSummaryForBadge = model.progressForPipelineUi;
  const findingCoverageSummary = model.resolvedDetail.findingCoverageSummary ?? null;
  const coverageBlocking = findingCoverageSummary?.hasCommitBlockingFailures === true;
  const hasManifest = Boolean(model.manifestId);

  const findingsPresentation = buildRunDetailFindingsPresentation(
    model,
    workspaceDerive,
    coverageBlocking,
  );
  const { quickDecisionFindings, blockingApprovalCount } = findingsPresentation;

  const reviewDisplayTitle = deriveReviewDisplayTitle(runSummaryForBadge, model.headline);
  const systemName = deriveArchitectureSystemName(runSummaryForBadge, reviewDisplayTitle);
  const highestSeverity =
    deriveHighestUnresolvedSeverityLabel(quickDecisionFindings) ??
    model.explanationSummary?.riskPosture ??
    null;
  const overallPosture = deriveOverallPostureLabel(
    model.explanationSummary?.riskPosture,
    model.governanceGateLabel,
    highestSeverity,
  );

  const workspaceStatus = deriveRunDetailWorkspaceStatus({
    run: model.resolvedDetail.run,
    manifestId: model.manifestId,
    manifestStatus: model.manifestSummary?.status ?? null,
    showProgressTracker: model.showProgressTracker,
    operatorGovernanceDecision: model.resolvedDetail.run.operatorGovernanceDecision,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    blockingFindingCount: blockingApprovalCount,
  });

  const evidenceGapsCount = filterUnresolvedFindings(quickDecisionFindings).filter(
    (finding) => (finding.evidenceRefCount ?? 0) === 0,
  ).length;
  const evidenceCoverageComplete =
    evidenceGapsCount === 0 &&
    model.artifacts.length > 0 &&
    model.resolvedDetail.trustEvidenceCard !== null &&
    model.resolvedDetail.trustEvidenceCard !== undefined;

  const recommendedActions = deriveRecommendedWorkspaceActions({
    runId: model.resolvedDetail.run.runId,
    findings: quickDecisionFindings,
    manifestId: model.manifestId,
    showProgressTracker: model.showProgressTracker,
    hasCommitBlockingFailures: coverageBlocking,
    blockingFindingCount: blockingApprovalCount,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    operatorGovernanceDecision: model.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: model.manifestSummary?.status ?? null,
    runCompleted: model.resolvedDetail.run.completedUtc != null,
    evidenceCoverageComplete,
    skipDuplicateFindingsActions: coverageBlocking || (hasManifest && blockingApprovalCount > 0),
  });
  const reviewStatusSummary = deriveReviewStatusSummary({
    reviewOutcome: overallPosture,
    findings: quickDecisionFindings,
    recommendedActions,
    blockingFindingCount: blockingApprovalCount,
  });

  const governancePresentation = await buildRunDetailGovernancePresentation(model, workspaceDerive, {
    findingCoverageSummary,
    coverageBlocking,
    hasManifest,
    blockingApprovalCount,
    quickDecisionFindings,
  });
  const evidencePresentation = buildRunDetailEvidencePresentation(model, workspaceDerive, {
    fromArchitectureCreation,
    runSummaryForBadge,
    reviewDisplayTitle,
    systemName,
    workspaceStatus,
    quickDecisionFindings,
    hasManifest,
  });

  const finalizedAtUtc = deriveFinalizedAtUtc(model.resolvedDetail.run, model.manifestSummary, model.manifestId);

  return {
    deferredContext: toDeferredSectionContext(model),
    runSummaryForBadge,

    findingCoverageSummary,
    commitBlockedReason: governancePresentation.commitBlockedReason,
    finalizeAssumptionGateApplies: governancePresentation.finalizeAssumptionGateApplies,
    requestAssumptionTexts: governancePresentation.requestAssumptionTexts,

    ...findingsPresentation,

    reviewDisplayTitle,
    systemName,
    architectureSummaryTitle: systemName !== null && systemName !== reviewDisplayTitle ? systemName : null,
    reviewHeaderPresentation: deriveReviewHeaderPresentation({
      reviewTitle: reviewDisplayTitle,
      systemName,
      runId: model.resolvedDetail.run.runId,
      templateLabel: deriveReviewTemplateLabel(model.manifestSummaryForUi),
      manifestId: model.manifestId,
    }),
    reviewOwnerLabel: deriveReviewOwnerLabel(model.resolvedDetail.run),
    templateLabel: deriveReviewTemplateLabel(model.manifestSummaryForUi),
    packageVersionLabel: derivePackageVersionLabel(
      model.manifestSummaryForUi ?? model.manifestSummary,
      model.manifestId,
    ),
    finalizedAtLabel: finalizedAtUtc !== null ? formatInstantForLocale(finalizedAtUtc) : null,
    signedReviewRecordId: (model.manifestId ?? "").trim().length > 0 ? (model.manifestId ?? "").trim() : null,
    signedReviewRecordIdLabel: deriveSignedReviewRecordIdLabel(model.manifestId),

    overallPosture,
    workspaceStatus,
    reviewPipelineIncomplete: isReviewPipelineIncomplete(workspaceStatus),
    recommendedActions,
    reviewStatusSummary,
    governanceDecisionLabel: governancePresentation.governanceDecisionLabel,
    governanceOutcomeLine: governancePresentation.governanceOutcomeLine,
    findingsSummaryLine: formatDecisionSnapshotFindingsLine(
      reviewStatusSummary.openFindingsCount,
      blockingApprovalCount,
      reviewStatusSummary.findingsRequiringActionCount,
    ),
    executiveBottomLineContent: deriveSponsorBottomLineContent({
      governanceDecisionLabel: governancePresentation.governanceDecisionLabel,
      governanceDecisionRationale: model.resolvedDetail.run.operatorGovernanceDecisionRationale,
      overallPosture,
      blockingFindingCount: blockingApprovalCount,
      highestSeverity,
      themeSummaries: model.explanationSummary?.themeSummaries ?? null,
    }),

    ...evidencePresentation,

    buyerFinalizedPackage: model.buyerPolishedArtifactTable === true && hasManifest,
    buyerGoldenPageReady: isBuyerGoldenReviewPackagePageReady({
      buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
      runId: model.resolvedDetail.run.runId,
      headline: model.headline,
      manifestId: model.manifestId,
    }),
    showDemoMarketingChrome: shouldShowOperatorDemoMarketingChrome(
      model.buyerPolishedArtifactTable === true,
      model.usedStaticDemoRun,
    ),
    showcasePolicyPackStrip: governancePresentation.showcasePolicyPackStrip,
    reviewPolicyPackCallout: governancePresentation.reviewPolicyPackCallout,
    showGovernanceCta: governancePresentation.showGovernanceCta,
    showGovernanceCtaCard: governancePresentation.showGovernanceCtaCard,
  };
}

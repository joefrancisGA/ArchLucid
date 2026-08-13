import type { ArchitectureCreatedHomeModel, BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import { deriveArchitectureGapBaselineFromSubmittedText } from "@/lib/derive-architecture-gap-baseline";
import { isBuyerGoldenReviewPackagePageReady } from "@/lib/buyer/buyer-golden-spine-run-id";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer/buyer-demo-content-gating";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  humanReviewStatusDisplay,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-summary-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { resolvePartialRunCommitBlockPresentation } from "@/lib/runs/run-detail-partial-run-commit-block";
import {
  countRunDetailEvidenceInventoryItems,
  deriveRunDetailEvidenceInventory,
} from "@/lib/runs/run-detail-evidence-inventory";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";
import { deriveRunDetailFindingsTriageCounts } from "@/lib/runs/run-detail-findings-triage-counts";
import { shouldShowRunDetailGovernanceCta } from "@/lib/runs/run-detail-governance-cta-visibility";
import type {
  EvidenceCoverageSummary,
  ExecutiveBottomLineContent,
  FindingSeverityCounts,
  ReviewHeaderPresentation,
  ReviewStatusSummary,
  RunDetailWorkspaceRecommendedAction,
  RunDetailWorkspaceStatus,
} from "@/lib/run-detail-workspace-derive";
import { buildBuyerReviewPackageDispositionLine } from "@/lib/review-buyer-disposition-line";
import { SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF } from "@/lib/showcase-static-demo";

import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";
import type { RunDetailDeferredSectionContext, RunDetailPageModel } from "./run-detail-page-model";

type FindingCoverageSummary = RunDetailPageModel["resolvedDetail"]["findingCoverageSummary"];

/** Deep-link chip to the policy pack behind the curated showcase review. */
export type ShowcasePolicyPackStrip = {
  readonly href: string;
  readonly label: string;
};

export type ReviewPolicyPackCallout = {
  readonly ruleSetId: string;
  readonly ruleSetVersion: string;
};

/**
 * Every non-JSX value {@link RunDetailPageView} needs, derived once from the page model so the
 * view stays a composition root over deferred sections.
 */
export type RunDetailPresentation = {
  readonly deferredContext: RunDetailDeferredSectionContext;
  readonly runSummaryForBadge: RunDetailPageModel["progressForPipelineUi"];

  readonly findingCoverageSummary: FindingCoverageSummary | null;
  readonly commitBlockedReason: string | null;

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
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly reviewStatusSummary: ReviewStatusSummary;
  readonly governanceDecisionLabel: string;
  readonly governanceOutcomeLine: string;
  readonly findingsSummaryLine: string;
  readonly executiveBottomLineContent: ExecutiveBottomLineContent | null;

  readonly submittedArchitectureText: string | null;
  readonly hasSubmittedArchitecture: boolean;
  readonly architectureEditHref: string | null;

  readonly evidenceCoverageSummary: EvidenceCoverageSummary;
  readonly evidenceInventoryItems: readonly RunDetailEvidenceInventoryItem[];
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

function resolveCommitBlockedReason(
  model: RunDetailPageModel,
  findingCoverageSummary: FindingCoverageSummary | null,
): string | null {
  const coverageBlocked = findingCoverageSummary?.hasCommitBlockingFailures === true;

  if (coverageBlocked) {
    if (model.buyerPolishedArtifactTable === true) {
      return "Some checks must finish before this review can be finalized.";
    }

    const failedEngines = findingCoverageSummary?.failedEngineLabels?.length
      ? findingCoverageSummary.failedEngineLabels.join(", ")
      : "one or more required finding engines";

    return `Finding coverage is commit-blocking. Failed engines: ${failedEngines}.`;
  }

  const partialRunCommitBlock = resolvePartialRunCommitBlockPresentation({
    legacyRunStatus: model.resolvedDetail.run.legacyRunStatus ?? null,
    agentExecutionOutcomes: model.resolvedDetail.agentExecutionOutcomes ?? null,
    findingCoverageAlreadyBlocking: false,
  });

  return partialRunCommitBlock?.summary ?? null;
}

function resolveShowcasePolicyPackStrip(model: RunDetailPageModel): ShowcasePolicyPackStrip | null {
  const eligible =
    model.buyerPolishedArtifactTable === true &&
    model.manifestSummaryForUi !== null &&
    isShowcaseStaticDemoRunId(model.resolvedDetail.run.runId);

  if (!eligible || model.manifestSummaryForUi === null) {
    return null;
  }

  return {
    href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
    label: policyPackBuyerLabel(
      model.manifestSummaryForUi.ruleSetId,
      model.manifestSummaryForUi.ruleSetVersion,
    ),
  };
}

function resolveReviewPolicyPackCallout(model: RunDetailPageModel): ReviewPolicyPackCallout | null {
  if (model.manifestSummaryForUi === null || !model.manifestId) {
    return null;
  }

  return {
    ruleSetId: model.manifestSummaryForUi.ruleSetId,
    ruleSetVersion: model.manifestSummaryForUi.ruleSetVersion,
  };
}

function countPendingDecisions(findings: readonly QuickDecisionFinding[]): number {
  return findings.filter((finding) => humanReviewStatusDisplay(finding.humanReviewStatus)?.label === "Pending review")
    .length;
}

function guidedIntakeRerunHref(runId: string): string {
  return `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(runId)}`;
}

/**
 * Builds the run detail presentation. The workspace derive module is imported dynamically to keep
 * it out of the initial server chunk for routes that never render review detail.
 */
export async function buildRunDetailPresentation(
  model: RunDetailPageModel,
  fromArchitectureCreation: boolean,
): Promise<RunDetailPresentation> {
  const {
    countFindingsBySeverity,
    deriveArchitectureSystemName,
    deriveBlockingApprovalCount,
    deriveEvidenceCoverageSummary,
    deriveExecutiveBottomLineContent,
    deriveHighestFindingSeverityLabel,
    derivePrimaryConcernFinding,
    derivePrimaryConcernLabel,
    deriveFinalizedAtUtc,
    deriveLastEvaluatedLabel,
    deriveOverallPostureLabel,
    derivePackageVersionLabel,
    deriveRecommendedWorkspaceActions,
    deriveReviewDisplayTitle,
    deriveReviewHeaderPresentation,
    deriveReviewOwnerLabel,
    deriveReviewStatusSummary,
    deriveReviewTemplateLabel,
    deriveRunDetailWorkspaceStatus,
    deriveSignedReviewRecordIdLabel,
    deriveSubmittedArchitectureText,
    formatDecisionSnapshotFindingsLine,
    formatDecisionSnapshotGovernanceOutcome,
  } = await import("@/lib/run-detail-workspace-derive");

  const runSummaryForBadge = model.progressForPipelineUi;
  const findingCoverageSummary = model.resolvedDetail.findingCoverageSummary ?? null;
  const coverageBlocking = findingCoverageSummary?.hasCommitBlockingFailures === true;
  const hasManifest = Boolean(model.manifestId);

  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(
    model.resolvedDetail,
    model.explanationSummary,
  );
  const severityCounts = countFindingsBySeverity(quickDecisionFindings);
  const reviewDisplayTitle = deriveReviewDisplayTitle(runSummaryForBadge, model.headline);
  const systemName = deriveArchitectureSystemName(runSummaryForBadge, reviewDisplayTitle);
  const highestSeverity = deriveHighestFindingSeverityLabel(
    quickDecisionFindings,
    model.explanationSummary?.riskPosture ?? null,
  );
  const overallPosture = deriveOverallPostureLabel(
    model.explanationSummary?.riskPosture,
    model.governanceGateLabel,
    highestSeverity,
  );
  const blockingApprovalCount = deriveBlockingApprovalCount({
    unresolvedIssueCount: model.manifestSummary?.unresolvedIssueCount,
    hasCommitBlockingFailures: coverageBlocking,
    findings: quickDecisionFindings,
  });
  const workspaceStatus = deriveRunDetailWorkspaceStatus({
    run: model.resolvedDetail.run,
    manifestId: model.manifestId,
    manifestStatus: model.manifestSummary?.status ?? null,
    showProgressTracker: model.showProgressTracker,
    operatorGovernanceDecision: model.resolvedDetail.run.operatorGovernanceDecision,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    blockingFindingCount: blockingApprovalCount,
  });

  const submittedArchitectureText = deriveSubmittedArchitectureText(runSummaryForBadge, reviewDisplayTitle);
  const hasSubmittedArchitecture = submittedArchitectureText !== null;
  const evidenceInventoryItems = deriveRunDetailEvidenceInventory({
    findings: quickDecisionFindings,
    runCreatedUtc: model.resolvedDetail.run.createdUtc,
    submittedArchitecturePresent: hasSubmittedArchitecture,
  });
  const evidenceGapsCount = quickDecisionFindings.filter((finding) => (finding.evidenceRefCount ?? 0) === 0).length;
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
    blockingFindingCount: model.manifestSummary?.unresolvedIssueCount ?? 0,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    operatorGovernanceDecision: model.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: model.manifestSummary?.status ?? null,
    runCompleted: model.resolvedDetail.run.completedUtc != null,
    evidenceCoverageComplete,
    // Findings-tab actions duplicate the blocking banners when commit is already blocked.
    skipDuplicateFindingsActions: coverageBlocking || (hasManifest && blockingApprovalCount > 0),
  });
  const reviewStatusSummary = deriveReviewStatusSummary({
    reviewOutcome: overallPosture,
    findings: quickDecisionFindings,
    recommendedActions,
    blockingFindingCount: blockingApprovalCount,
  });

  const showGovernanceCta = shouldShowRunDetailGovernanceCta({
    manifestId: model.manifestId,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    operatorGovernanceDecision: model.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: model.manifestSummary?.status ?? null,
  });
  const governanceWouldBePrimaryAction =
    hasManifest && !coverageBlocking && blockingApprovalCount === 0 && showGovernanceCta;

  const governanceDecisionLabel =
    (model.resolvedDetail.run.operatorGovernanceDecision ?? "").trim().length > 0
      ? (model.resolvedDetail.run.operatorGovernanceDecision ?? "").trim()
      : model.governanceGateLabel ?? "No governance decision recorded";

  const finalizedAtUtc = deriveFinalizedAtUtc(model.resolvedDetail.run, model.manifestSummary, model.manifestId);
  const lastEvaluatedUtc = deriveLastEvaluatedLabel(model.resolvedDetail.run, model.manifestSummary);
  const derivedGapBaseline = deriveArchitectureGapBaselineFromSubmittedText(submittedArchitectureText);
  const architectureEditHref = hasManifest ? null : guidedIntakeRerunHref(model.resolvedDetail.run.runId);
  const architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput = {
    runId: model.resolvedDetail.run.runId,
    architectureName: systemName ?? reviewDisplayTitle,
    architectureOverview: submittedArchitectureText ?? "",
    businessOutcome: derivedGapBaseline.businessOutcome,
    peopleAndSystems: derivedGapBaseline.peopleAndSystems,
    ownerLabel: deriveReviewOwnerLabel(model.resolvedDetail.run),
    lastUpdatedLabel: lastEvaluatedUtc !== null ? formatInstantForLocale(lastEvaluatedUtc) : "just now",
    workspaceStatus,
    assessmentInProgress: model.showProgressTracker,
    hasArtifacts: model.artifacts.length > 0,
    correctionHref: architectureEditHref,
    gapAssertion: derivedGapBaseline.gapAssertion,
    gapSourceCapturedAtUtc: null,
  };
  const showArchitectureCreatedHome =
    fromArchitectureCreation && (model.manifestId ?? "").trim().length === 0;
  const createHomeAnalysisStagesComplete = analysisStagesCompleteOnSummary(model.progressForPipelineUi);

  return {
    deferredContext: toDeferredSectionContext(model),
    runSummaryForBadge,

    findingCoverageSummary,
    commitBlockedReason: resolveCommitBlockedReason(model, findingCoverageSummary),

    quickDecisionFindings,
    findingsTriageVisibleCount: deriveRunDetailFindingsTriageCounts(quickDecisionFindings).triageVisibleCount,
    severityCounts,
    materialSeverityLine:
      severityCounts.critical + severityCounts.high > 0
        ? `${severityCounts.critical} critical · ${severityCounts.high} high`
        : null,
    pendingDecisionCount: countPendingDecisions(quickDecisionFindings),
    primaryConcernFindingId: derivePrimaryConcernFinding(quickDecisionFindings)?.findingId ?? null,
    primaryConcernLabel: derivePrimaryConcernLabel(quickDecisionFindings),

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
    blockingApprovalCount,
    workspaceStatus,
    recommendedActions,
    reviewStatusSummary,
    governanceDecisionLabel,
    governanceOutcomeLine: formatDecisionSnapshotGovernanceOutcome({
      governanceDecisionLabel,
      blockingFindingCount: blockingApprovalCount,
    }),
    findingsSummaryLine: formatDecisionSnapshotFindingsLine(
      reviewStatusSummary.openFindingsCount,
      blockingApprovalCount,
      reviewStatusSummary.findingsRequiringActionCount,
    ),
    executiveBottomLineContent: deriveExecutiveBottomLineContent({
      governanceDecisionLabel,
      governanceDecisionRationale: model.resolvedDetail.run.operatorGovernanceDecisionRationale,
      overallPosture,
      blockingFindingCount: blockingApprovalCount,
      highestSeverity,
      themeSummaries: model.explanationSummary?.themeSummaries ?? null,
    }),

    submittedArchitectureText,
    hasSubmittedArchitecture,
    architectureEditHref,

    evidenceCoverageSummary: deriveEvidenceCoverageSummary(quickDecisionFindings),
    evidenceInventoryItems,
    evidenceInventoryCount: countRunDetailEvidenceInventoryItems(evidenceInventoryItems),
    evidenceReviewDateLabel:
      formatInstantForLocale(model.resolvedDetail.run.completedUtc ?? model.resolvedDetail.run.createdUtc) ||
      model.createdLabel,

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
    showcasePolicyPackStrip: resolveShowcasePolicyPackStrip(model),
    reviewPolicyPackCallout: resolveReviewPolicyPackCallout(model),
    showGovernanceCta,
    showGovernanceCtaCard: showGovernanceCta && !governanceWouldBePrimaryAction,

    showArchitectureCreatedHome,
    createHomeAnalysisStagesComplete,
    createHomePreFinalizeReadyToFinalize: showArchitectureCreatedHome && createHomeAnalysisStagesComplete,
    createHomeActivityStatusLine: buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: hasManifest,
      findingCountDisplay: model.findingCountDisplay,
      warningCountDisplay: model.warningCountDisplay,
      unresolvedIssueCountDisplay: model.manifestSummary?.unresolvedIssueCount ?? null,
      governanceGateLabel: model.governanceGateLabel,
      aggregateRiskPosture: model.explanationSummary?.riskPosture ?? null,
    }),
    createHomeActivityProvenanceAsOfLabel: formatInstantForLocale(
      model.resolvedDetail.run.completedUtc ?? model.resolvedDetail.run.createdUtc,
    ),
    architectureCreatedBaseline,
    architectureCreatedHomeModel: showArchitectureCreatedHome
      ? buildArchitectureCreatedHomeModel(architectureCreatedBaseline)
      : null,
  };
}

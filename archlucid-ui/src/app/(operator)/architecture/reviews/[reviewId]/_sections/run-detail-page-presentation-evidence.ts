import type { ArchitectureCreatedHomeModel, BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import { deriveArchitectureGapBaselineFromSubmittedText } from "@/lib/derive-architecture-gap-baseline";
import { extractAttachedIntakeFileNames } from "@/lib/intake-attached-file-names";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  countRunDetailEvidenceInventoryItems,
  deriveRunDetailEvidenceInventory,
} from "@/lib/runs/run-detail-evidence-inventory";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";
import type { EvidenceCoverageSummary, RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import { buildBuyerReviewPackageDispositionLine } from "@/lib/review-buyer-disposition-line";

import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";
import type { RunDetailPageModel } from "./run-detail-page-model";

function guidedIntakeRerunHref(runId: string): string {
  return `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(runId)}`;
}

export type RunDetailEvidencePresentation = {
  readonly submittedArchitectureText: string | null;
  readonly hasSubmittedArchitecture: boolean;
  readonly architectureEditHref: string | null;
  readonly evidenceCoverageSummary: EvidenceCoverageSummary;
  readonly evidenceInventoryItems: readonly RunDetailEvidenceInventoryItem[];
  readonly evidenceInventoryCount: number;
  readonly evidenceReviewDateLabel: string;
  readonly showArchitectureCreatedHome: boolean;
  readonly createHomeAnalysisStagesComplete: boolean;
  readonly createHomePreFinalizeReadyToFinalize: boolean;
  readonly createHomeActivityStatusLine: string;
  readonly createHomeActivityProvenanceAsOfLabel: string;
  readonly architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput;
  readonly architectureCreatedHomeModel: ArchitectureCreatedHomeModel | null;
};

export function buildRunDetailEvidencePresentation(
  model: RunDetailPageModel,
  workspaceDerive: typeof import("@/lib/run-detail-workspace-derive"),
  input: {
    readonly fromArchitectureCreation: boolean;
    readonly runSummaryForBadge: RunDetailPageModel["progressForPipelineUi"];
    readonly reviewDisplayTitle: string;
    readonly systemName: string | null;
    readonly workspaceStatus: RunDetailWorkspaceStatus;
    readonly quickDecisionFindings: readonly QuickDecisionFinding[];
    readonly hasManifest: boolean;
  },
): RunDetailEvidencePresentation {
  const submittedArchitectureText = workspaceDerive.deriveSubmittedArchitectureText(
    input.runSummaryForBadge,
    input.reviewDisplayTitle,
  );
  const attachedFileNames = extractAttachedIntakeFileNames(input.runSummaryForBadge.description);
  const hasSubmittedArchitecture = workspaceDerive.deriveHasSubmittedArchitectureDescription(
    input.runSummaryForBadge,
    input.reviewDisplayTitle,
  );
  const evidenceInventoryItems = deriveRunDetailEvidenceInventory({
    findings: input.quickDecisionFindings,
    runCreatedUtc: model.resolvedDetail.run.createdUtc,
    submittedArchitecturePresent: submittedArchitectureText !== null,
    attachedFileNames,
  });
  const derivedGapBaseline = deriveArchitectureGapBaselineFromSubmittedText(submittedArchitectureText);
  const architectureEditHref = input.hasManifest ? null : guidedIntakeRerunHref(model.resolvedDetail.run.runId);
  const lastEvaluatedUtc = workspaceDerive.deriveLastEvaluatedLabel(
    model.resolvedDetail.run,
    model.manifestSummary,
  );
  const architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput = {
    runId: model.resolvedDetail.run.runId,
    architectureName: input.systemName ?? input.reviewDisplayTitle,
    architectureOverview: submittedArchitectureText ?? "",
    businessOutcome: derivedGapBaseline.businessOutcome,
    peopleAndSystems: derivedGapBaseline.peopleAndSystems,
    ownerLabel: workspaceDerive.deriveReviewOwnerLabel(model.resolvedDetail.run),
    lastUpdatedLabel: lastEvaluatedUtc !== null ? formatInstantForLocale(lastEvaluatedUtc) : "just now",
    workspaceStatus: input.workspaceStatus,
    assessmentInProgress: model.showProgressTracker,
    hasArtifacts: model.artifacts.length > 0,
    correctionHref: architectureEditHref,
    gapAssertion: derivedGapBaseline.gapAssertion,
    gapSourceCapturedAtUtc: null,
  };
  const showArchitectureCreatedHome =
    input.fromArchitectureCreation && (model.manifestId ?? "").trim().length === 0;
  const createHomeAnalysisStagesComplete = analysisStagesCompleteOnSummary(model.progressForPipelineUi);

  return {
    submittedArchitectureText,
    hasSubmittedArchitecture,
    architectureEditHref,
    evidenceCoverageSummary: workspaceDerive.deriveEvidenceCoverageSummary(input.quickDecisionFindings),
    evidenceInventoryItems,
    evidenceInventoryCount: countRunDetailEvidenceInventoryItems(evidenceInventoryItems),
    evidenceReviewDateLabel:
      formatInstantForLocale(model.resolvedDetail.run.completedUtc ?? model.resolvedDetail.run.createdUtc) ||
      model.createdLabel,
    showArchitectureCreatedHome,
    createHomeAnalysisStagesComplete,
    createHomePreFinalizeReadyToFinalize: showArchitectureCreatedHome && createHomeAnalysisStagesComplete,
    createHomeActivityStatusLine: buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: input.hasManifest,
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

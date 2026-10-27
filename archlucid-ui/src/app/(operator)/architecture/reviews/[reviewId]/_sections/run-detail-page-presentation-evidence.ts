import type { ArchitectureCreatedHomeModel, BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import {
  resolveArchitectureTabEditSourceHrefFromRunSummary,
  resolveArchitectureTabSubmittedHelperText,
} from "@/lib/architecture/architecture-draft-spawn-one-writer";
import { resolveRunSummaryPackageOrigin } from "@/lib/architecture/architecture-package-origin";
import { deriveArchitectureGapBaselineFromSubmittedText } from "@/lib/derive-architecture-gap-baseline";
import { extractAttachedIntakeFileNames } from "@/lib/intake-attached-file-names";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  countRunDetailEvidenceInventoryItems,
  deriveRunDetailEvidenceInventory,
  findingsCiteEvidenceWithoutStoredSourceNames,
} from "@/lib/runs/run-detail-evidence-inventory";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";
import type { EvidenceCoverageSummary, RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import { buildBuyerReviewPackageDispositionLine } from "@/lib/review-buyer-disposition-line";
import { UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-draft-status";
import { formatSubmittedArchitectureTextForSummary } from "@/lib/reviews/submitted-architecture-text-honesty";

import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";
import type { RunDetailPageModel } from "./run-detail-page-model";

const DEFAULT_ARCHITECTURE_TAB_SUBMITTED_HELPER =
  "Source material submitted for this review — distinct from ArchLucid analysis in other tabs.";

export type RunDetailEvidencePresentation = {
  readonly submittedArchitectureText: string | null;
  readonly hasSubmittedArchitecture: boolean;
  readonly architectureEditHref: string | null;
  readonly architectureTabSubmittedHelperText: string;
  readonly evidenceCoverageSummary: EvidenceCoverageSummary;
  readonly evidenceInventoryItems: readonly RunDetailEvidenceInventoryItem[];
  readonly evidenceInventoryCount: number;
  readonly findingsCiteEvidenceWithoutSourceNames: boolean;
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
    readonly hasFindingsSnapshot: boolean;
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
    hasFindingsSnapshot: input.hasFindingsSnapshot,
  });
  const derivedGapBaseline = deriveArchitectureGapBaselineFromSubmittedText(submittedArchitectureText);
  const packageOrigin = resolveRunSummaryPackageOrigin(input.runSummaryForBadge);
  const architectureEditHref = resolveArchitectureTabEditSourceHrefFromRunSummary(
    input.runSummaryForBadge,
    input.hasManifest,
  );
  const architectureTabSubmittedHelperText = resolveArchitectureTabSubmittedHelperText({
    packageOrigin,
    hasManifest: input.hasManifest,
    defaultHelper: DEFAULT_ARCHITECTURE_TAB_SUBMITTED_HELPER,
  });
  const lastEvaluatedUtc = workspaceDerive.deriveLastEvaluatedLabel(
    model.resolvedDetail.run,
    model.manifestSummary,
  );
  const architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput = {
    runId: model.resolvedDetail.run.runId,
    architectureName: input.systemName?.trim() || UNTITLED_ARCHITECTURE_LABEL,
    architectureOverview: formatSubmittedArchitectureTextForSummary(
      submittedArchitectureText,
      input.runSummaryForBadge.description,
    ),
    businessOutcome: derivedGapBaseline.businessOutcome,
    peopleAndSystems: derivedGapBaseline.peopleAndSystems,
    keyIntegrations: derivedGapBaseline.keyIntegrations,
    submittedBriefStored: (submittedArchitectureText?.trim() ?? "").length > 0,
    artifactBundleKnown: model.artifactsFailure === null && model.artifactsMalformed === null,
    ownerLabel: workspaceDerive.deriveReviewOwnerLabel(model.resolvedDetail.run),
    lastUpdatedLabel:
      lastEvaluatedUtc !== null
        ? formatInstantForLocale(lastEvaluatedUtc)
        : "Last updated time was not stored.",
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
    architectureTabSubmittedHelperText,
    evidenceCoverageSummary: workspaceDerive.deriveEvidenceCoverageSummary(input.quickDecisionFindings, {
      hasFindingsSnapshot: input.hasFindingsSnapshot,
    }),
    evidenceInventoryItems,
    evidenceInventoryCount: countRunDetailEvidenceInventoryItems(evidenceInventoryItems),
    findingsCiteEvidenceWithoutSourceNames: findingsCiteEvidenceWithoutStoredSourceNames(
      input.quickDecisionFindings,
    ),
    evidenceReviewDateLabel:
      (model.resolvedDetail.run.completedUtc?.trim() ?? "").length > 0
        ? formatInstantForLocale(model.resolvedDetail.run.completedUtc) || model.createdLabel
        : "Review completed time was not stored.",
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
    createHomeActivityProvenanceAsOfLabel:
      (model.resolvedDetail.run.completedUtc?.trim() ?? "").length > 0
        ? formatInstantForLocale(model.resolvedDetail.run.completedUtc) ?? "Provenance time was not stored."
        : "Provenance time was not stored.",
    architectureCreatedBaseline,
    architectureCreatedHomeModel: showArchitectureCreatedHome
      ? buildArchitectureCreatedHomeModel(architectureCreatedBaseline)
      : null,
  };
}

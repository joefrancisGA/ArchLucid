import type { CompareEffectiveGovernanceAtCommitSnapshot } from "@/lib/compare-effective-governance-diff";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { resolvePartialRunCommitBlockPresentation } from "@/lib/runs/run-detail-partial-run-commit-block";
import { resolveAuthorityLifecycleCommitBlock } from "@/lib/runs/authority-lifecycle-commit-block";
import { shouldShowRunDetailGovernanceCta } from "@/lib/runs/run-detail-governance-cta-visibility";
import { evaluateFinalizeQualityScorecard } from "@/lib/review-quality/finalize-quality-scorecard";
import { deriveFinalizeQualityScorecardInput } from "@/lib/review-quality/finalize-quality-scorecard-from-findings";
import { tryLoadRequestAssumptionsForRun } from "@/lib/try-load-request-assumptions-for-run";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF } from "@/lib/showcase-static-demo";

import type { RunDetailPageModel } from "./run-detail-page-model";

type FindingCoverageSummary = RunDetailPageModel["resolvedDetail"]["findingCoverageSummary"];

/** Deep-link chip to the policy pack behind the curated showcase review. */
export type ShowcasePolicyPackStrip = {
  readonly href: string;
  readonly label: string;
};

export type ReviewPolicyPackCallout = {
  readonly ruleSetId: string;
  readonly ruleSetVersion: string;
  readonly effectiveGovernanceAtCommit?: CompareEffectiveGovernanceAtCommitSnapshot | null;
};

export function resolveCommitBlockedReason(
  model: RunDetailPageModel,
  findingCoverageSummary: FindingCoverageSummary | null,
): string | null {
  const authorityLifecycleBlock = resolveAuthorityLifecycleCommitBlock(
    model.resolvedDetail.authorityLifecyclePhase,
  );

  if (authorityLifecycleBlock !== null) {
    return authorityLifecycleBlock;
  }

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

export function resolveShowcasePolicyPackStrip(model: RunDetailPageModel): ShowcasePolicyPackStrip | null {
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

export function resolveReviewPolicyPackCallout(model: RunDetailPageModel): ReviewPolicyPackCallout | null {
  if (model.manifestSummaryForUi === null || !model.manifestId) {
    return null;
  }

  return {
    ruleSetId: model.manifestSummaryForUi.ruleSetId,
    ruleSetVersion: model.manifestSummaryForUi.ruleSetVersion,
    effectiveGovernanceAtCommit: model.manifestSummaryForUi.effectiveGovernanceAtCommit ?? null,
  };
}

export type RunDetailGovernancePresentation = {
  readonly commitBlockedReason: string | null;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly requestAssumptionTexts: readonly string[];
  readonly governanceDecisionLabel: string;
  readonly governanceOutcomeLine: string;
  readonly showGovernanceCta: boolean;
  readonly showGovernanceCtaCard: boolean;
  readonly showcasePolicyPackStrip: ShowcasePolicyPackStrip | null;
  readonly reviewPolicyPackCallout: ReviewPolicyPackCallout | null;
};

export async function buildRunDetailGovernancePresentation(
  model: RunDetailPageModel,
  workspaceDerive: typeof import("@/lib/run-detail-workspace-derive"),
  input: {
    readonly findingCoverageSummary: FindingCoverageSummary | null;
    readonly coverageBlocking: boolean;
    readonly hasManifest: boolean;
    readonly blockingApprovalCount: number;
    readonly quickDecisionFindings: readonly QuickDecisionFinding[];
  },
): Promise<RunDetailGovernancePresentation> {
  const baseCommitBlockedReason = resolveCommitBlockedReason(model, input.findingCoverageSummary);
  const finalizeAssumptionGateApplies = baseCommitBlockedReason === null && !input.hasManifest;
  const requestAssumptionTexts = await tryLoadRequestAssumptionsForRun(model.routeRunId);
  const finalizeScorecard =
    finalizeAssumptionGateApplies
      ? evaluateFinalizeQualityScorecard(
          deriveFinalizeQualityScorecardInput(input.quickDecisionFindings, input.blockingApprovalCount, {
            requestAssumptionTexts,
          }),
        )
      : null;
  const commitBlockedReason =
    baseCommitBlockedReason !== null
      ? baseCommitBlockedReason
      : finalizeScorecard !== null && !finalizeScorecard.ready
        ? finalizeScorecard.blockingReasons.join(" ")
        : null;

  const showGovernanceCta = shouldShowRunDetailGovernanceCta({
    runId: model.resolvedDetail.run.runId,
    manifestId: model.manifestId,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    operatorGovernanceDecision: model.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: model.manifestSummary?.status ?? null,
  });
  const governanceWouldBePrimaryAction =
    input.hasManifest && !input.coverageBlocking && input.blockingApprovalCount === 0 && showGovernanceCta;

  const governanceDecisionLabel =
    (model.resolvedDetail.run.operatorGovernanceDecision ?? "").trim().length > 0
      ? (model.resolvedDetail.run.operatorGovernanceDecision ?? "").trim()
      : model.governanceGateLabel ?? "No approval decision recorded";

  return {
    commitBlockedReason,
    finalizeAssumptionGateApplies,
    requestAssumptionTexts,
    governanceDecisionLabel,
    governanceOutcomeLine: workspaceDerive.formatDecisionSnapshotGovernanceOutcome({
      governanceDecisionLabel,
      blockingFindingCount: input.blockingApprovalCount,
    }),
    showGovernanceCta,
    showGovernanceCtaCard: showGovernanceCta && !governanceWouldBePrimaryAction,
    showcasePolicyPackStrip: resolveShowcasePolicyPackStrip(model),
    reviewPolicyPackCallout: resolveReviewPolicyPackCallout(model),
  };
}

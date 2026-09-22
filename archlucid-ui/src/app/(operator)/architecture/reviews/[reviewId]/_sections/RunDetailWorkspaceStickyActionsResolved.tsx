"use client";

import { useEffect, useState } from "react";

import { useAssumptionAwareCommitBlockedReason } from "@/hooks/use-assumption-aware-commit-blocked-reason";
import { useCareerFinalizeBlockedReason } from "@/hooks/use-career-finalize-blocked-reason";
import { useUnsupportedSemanticSupportFinalizeBlockedReason } from "@/hooks/use-unsupported-semantic-support-finalize-blocked-reason";
import { mergeFinalizeCommitBlockedReasons } from "@/lib/findings/semantic-support-band-finalize-honesty";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";
import type { FeasibilityVerdictKind, TransparencyTrail } from "@/types/feasibility-verdict";

import { RunDetailWorkspaceStickyActions } from "./RunDetailWorkspaceStickyActions";
import type {
  ResolveReviewPackagePrimaryActionInput,
  ReviewPackagePrimaryAction,
} from "./resolve-review-package-primary-action";

export type RunDetailWorkspaceStickyActionsResolvedProps = {
  readonly runId: string;
  readonly manifestId: string | null | undefined;
  readonly hasCommitBlockingFailures: boolean;
  readonly blockingFindingCount: number;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly runCompleted: boolean;
  readonly showProgressTracker: boolean;
  readonly commitBlockedReason: string | null | undefined;
  readonly serverFinalizeReadinessBlocks?: readonly FinalizeReadinessBlock[];
  readonly finalizeReadinessEnabled: boolean;
  readonly quickDecisionFindings: readonly QuickDecisionFinding[];
  readonly requestAssumptionTexts: readonly string[];
  readonly nextAction?: string | null;
  readonly feasibilityVerdictKind?: FeasibilityVerdictKind | null;
  readonly degradedFindingCoverage?: boolean;
  readonly degradedFindingCoverageFailedEngineLabels?: readonly string[];
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly pagePrimaryOwnedElsewhere?: boolean;
  readonly parentArchitectureId?: string | null;
};

/** Resolves sticky review actions with server finalize readiness blocks (wave unified-finalize-readiness). */
export function RunDetailWorkspaceStickyActionsResolved(
  props: RunDetailWorkspaceStickyActionsResolvedProps,
): React.JSX.Element | null {
  const [primaryAction, setPrimaryAction] = useState<ReviewPackagePrimaryAction | null>(null);

  const commitBlockedState = useAssumptionAwareCommitBlockedReason({
    runId: props.runId,
    serverCommitBlockedReason: props.commitBlockedReason,
    serverFinalizeReadinessBlocks: props.serverFinalizeReadinessBlocks,
    finalizeReadinessEnabled: props.finalizeReadinessEnabled,
    findings: props.quickDecisionFindings,
    blockingFindingCount: props.blockingFindingCount,
    requestAssumptionTexts: props.requestAssumptionTexts,
    transparencyTrail: props.transparencyTrail,
    degradedFindingCoverage: props.degradedFindingCoverage,
    degradedFindingCoverageFailedEngineLabels: props.degradedFindingCoverageFailedEngineLabels,
    blockDegradedFindingCoverageOnWorking: props.buyerPolishedArtifactTable !== true,
  });

  const unsupportedSemanticSupportCommitBlockedReason =
    useUnsupportedSemanticSupportFinalizeBlockedReason({
      findings: props.quickDecisionFindings,
      manifestFinalized: Boolean(props.manifestId),
      structuralExecutionMode: props.structuralExecutionMode,
    });

  const careerFinalizeBlockedReason = useCareerFinalizeBlockedReason({
    manifestFinalized: Boolean(props.manifestId),
    structuralExecutionMode: props.structuralExecutionMode,
    workingCareerRehearsalDoor: props.workingCareerRehearsalDoor,
    transparencyTrail: props.transparencyTrail,
  });

  const effectiveCommitBlockedReason = mergeFinalizeCommitBlockedReasons(
    commitBlockedState.blockedReason,
    commitBlockedState.readinessUnavailable || commitBlockedState.blocks.length > 0
      ? null
      : unsupportedSemanticSupportCommitBlockedReason,
    careerFinalizeBlockedReason,
  );

  const primaryActionContext: ResolveReviewPackagePrimaryActionInput = {
    runId: props.runId,
    manifestId: props.manifestId,
    hasCommitBlockingFailures: props.hasCommitBlockingFailures,
    blockingFindingCount: props.blockingFindingCount,
    buyerPolishedArtifactTable: props.buyerPolishedArtifactTable,
    operatorGovernanceDecision: props.operatorGovernanceDecision,
    manifestStatus: props.manifestStatus,
    runCompleted: props.runCompleted,
    nextAction: props.nextAction,
    feasibilityVerdictKind: props.feasibilityVerdictKind,
  };

  useEffect(() => {
    let canceled = false;

    void import("./resolve-review-package-primary-action").then(({ resolveReviewPackagePrimaryAction }) => {
      if (canceled) {
        return;
      }

      setPrimaryAction(resolveReviewPackagePrimaryAction(primaryActionContext));
    });

    return () => {
      canceled = true;
    };
  }, [
    props.runId,
    props.manifestId,
    props.hasCommitBlockingFailures,
    props.blockingFindingCount,
    props.buyerPolishedArtifactTable,
    props.operatorGovernanceDecision,
    props.manifestStatus,
    props.runCompleted,
    props.nextAction,
    props.feasibilityVerdictKind,
  ]);

  if (primaryAction === null) {
    return null;
  }

  return (
    <RunDetailWorkspaceStickyActions
      runId={props.runId}
      primaryAction={primaryAction}
      primaryActionContext={primaryActionContext}
      commitBlockedReason={effectiveCommitBlockedReason}
      commitBlockedBlocks={commitBlockedState.blocks}
      showProgressTracker={props.showProgressTracker}
      manifestId={props.manifestId}
      pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
      parentArchitectureId={props.parentArchitectureId}
    />
  );
}

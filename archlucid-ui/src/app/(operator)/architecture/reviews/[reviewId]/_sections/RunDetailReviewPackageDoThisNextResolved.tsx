"use client";

import { useEffect, useMemo, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { useAssumptionAwareCommitBlockedReason } from "@/hooks/use-assumption-aware-commit-blocked-reason";
import { usePriorSameRequestCompareHref } from "@/hooks/use-prior-same-request-compare-href";
import { useSessionAiReadiness } from "@/hooks/use-session-ai-readiness";
import { deriveReviewFailureRequiresWorkspaceAiProbe } from "@/lib/derive-review-failure-requires-workspace-ai-probe";
import { fetchLlmMonthlyDollarBudgetStatusCached } from "@/lib/llm-monthly-budget-status";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ReviewPackageDoThisNextStrip } from "./ReviewPackageDoThisNextStrip";
import { RunDetailReviewPackageDecisionReceiptStrip } from "./RunDetailReviewPackageDecisionReceiptStrip";
import { FinalizeReadinessStrip } from "@/components/reviews/FinalizeReadinessStrip";
import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";
import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import type {
  ResolveReviewPackageDoThisNextInput,
  ReviewPackageDoThisNext,
} from "./resolve-review-package-do-this-next";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";
import type { TransparencyTrail, ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type RunDetailReviewPackageDoThisNextResolvedProps = ResolveReviewPackageDoThisNextInput & {
  readonly hasGoldenManifest: boolean;
  readonly commitBlockedReason: string | null | undefined;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly quickDecisionFindings: readonly QuickDecisionFinding[];
  readonly requestAssumptionTexts: readonly string[];
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly feasibilityVerdict?: ManifestFeasibilityVerdict | null;
  readonly pipelineDiagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly pipelineSummary?: RunSummary | null;
  readonly intakeDescription?: string | null;
  readonly intakeSystemName?: string | null;
  readonly realModeFellBackToSimulator?: boolean | null;
  readonly graphSnapshot?: unknown;
  readonly analysisStagesComplete?: boolean;
};

function doThisNextLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className={cn(
        "h-20 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label="Loading next step"
      data-testid="run-detail-do-this-next-resolved-loading"
    />
  );
}

/** Resolves review-package next-step copy off the page-view sync import graph (wave 14). */
export function RunDetailReviewPackageDoThisNextResolved(
  props: RunDetailReviewPackageDoThisNextResolvedProps,
): React.JSX.Element {
  const [next, setNext] = useState<ReviewPackageDoThisNext | null>(null);
  const [usesCustomerAiConnection, setUsesCustomerAiConnection] = useState(false);
  const priorCompare = usePriorSameRequestCompareHref(props.runId, 25);
  const requireLiveProbe = useMemo(
    () =>
      deriveReviewFailureRequiresWorkspaceAiProbe({
        legacyRunStatus: props.legacyRunStatus,
        lastFailureSummary: props.lastFailureSummary,
        pipelineSummary: props.pipelineSummary,
        realModeFellBackToSimulator: props.realModeFellBackToSimulator,
        usesCustomerAiConnection,
      }),
    [
      props.lastFailureSummary,
      props.legacyRunStatus,
      props.pipelineSummary,
      props.realModeFellBackToSimulator,
      usesCustomerAiConnection,
    ],
  );
  const sessionAiReadiness = useSessionAiReadiness({ requireLiveProbe });
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canConfigureWorkspaceAi = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const assumptionAwareCommitBlockedReason = useAssumptionAwareCommitBlockedReason({
    runId: props.runId,
    serverCommitBlockedReason: props.commitBlockedReason,
    finalizeAssumptionGateApplies: props.finalizeAssumptionGateApplies,
    findings: props.quickDecisionFindings,
    blockingFindingCount: props.blockingFindingCount,
    requestAssumptionTexts: props.requestAssumptionTexts,
    transparencyTrail: props.transparencyTrail,
  });

  useEffect(() => {
    let canceled = false;

    void fetchLlmMonthlyDollarBudgetStatusCached()
      .then((status) => {
        if (!canceled) {
          setUsesCustomerAiConnection(status.customerAiProviderConfigured === true);
        }
      })
      .catch(() => {
        if (!canceled) {
          setUsesCustomerAiConnection(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    void import("./resolve-review-package-do-this-next").then(({ resolveReviewPackageDoThisNext }) => {
      if (canceled) {
        return;
      }

      setNext(
        resolveReviewPackageDoThisNext({
          runId: props.runId,
          manifestId: props.manifestId,
          hasCommitBlockingFailures: props.hasCommitBlockingFailures,
          blockingFindingCount: props.blockingFindingCount,
          buyerPolishedArtifactTable: props.buyerPolishedArtifactTable,
          operatorGovernanceDecision: props.operatorGovernanceDecision,
          manifestStatus: props.manifestStatus,
          runCompleted: props.runCompleted,
          nextAction: props.nextAction,
          showProgressTracker: props.showProgressTracker,
          openClarificationGapCount: props.openClarificationGapCount,
          findingsCount: props.quickDecisionFindings.length,
          correctionHref: props.correctionHref,
          useCreateHomeWorkspaceTabs: props.useCreateHomeWorkspaceTabs,
          evidenceCoverageLinkedCount: props.evidenceCoverageLinkedCount,
          evidenceCoverageTotalCount: props.evidenceCoverageTotalCount,
          governanceDecisionRecorded: props.governanceDecisionRecorded,
          compareWithPriorHref: priorCompare.compareWithPriorHref,
          legacyRunStatus: props.legacyRunStatus,
          isDeadLettered: props.isDeadLettered,
          pipelineDiagnosticContext: props.pipelineDiagnosticContext,
          lastFailureSummary: props.lastFailureSummary,
          pipelineSummary: props.pipelineSummary,
          intakeDescription: props.intakeDescription,
          intakeSystemName: props.intakeSystemName,
          canConfigureWorkspaceAi,
          realModeFellBackToSimulator: props.realModeFellBackToSimulator === true,
          usesCustomerAiConnection,
          effectiveSessionMode: sessionAiReadiness.sessionMode,
        }),
      );
    });

    return () => {
      canceled = true;
    };
  }, [
    priorCompare.compareWithPriorHref,
    usesCustomerAiConnection,
    props.runId,
    props.manifestId,
    props.hasCommitBlockingFailures,
    props.blockingFindingCount,
    props.buyerPolishedArtifactTable,
    props.operatorGovernanceDecision,
    props.manifestStatus,
    props.runCompleted,
    props.nextAction,
    props.showProgressTracker,
    props.openClarificationGapCount,
    props.quickDecisionFindings.length,
    props.correctionHref,
    props.useCreateHomeWorkspaceTabs,
    props.evidenceCoverageLinkedCount,
    props.evidenceCoverageTotalCount,
    props.governanceDecisionRecorded,
    props.legacyRunStatus,
    props.isDeadLettered,
    props.pipelineDiagnosticContext,
    props.lastFailureSummary,
    props.pipelineSummary,
    props.intakeDescription,
    props.intakeSystemName,
    canConfigureWorkspaceAi,
    props.realModeFellBackToSimulator,
  ]);

  if (next === null) {
    return doThisNextLoadingSkeleton();
  }

  return (
    <>
      {props.hasGoldenManifest ? (
        <RunDetailReviewPackageDecisionReceiptStrip
          runId={props.runId}
          feasibilityVerdict={props.feasibilityVerdict ?? null}
        />
      ) : null}
      {!props.hasGoldenManifest ? (
        <>
          <RunDetailOverviewTransparencyTrail
            feasibilityVerdict={props.feasibilityVerdict ?? null}
            runCompleted={props.runCompleted ?? false}
          />
          <RunDetailSealDeskCoverageStrip
            runId={props.runId}
            analysisStagesComplete={props.analysisStagesComplete}
            graphSnapshot={props.graphSnapshot}
            transparencyTrail={props.transparencyTrail ?? null}
            className="mb-3"
          />
        </>
      ) : null}
      <FinalizeReadinessStrip commitBlockedReason={assumptionAwareCommitBlockedReason} />
      <ReviewPackageDoThisNextStrip
        next={next}
        runId={props.runId}
        retryCount={props.pipelineDiagnosticContext?.retryCount ?? props.pipelineSummary?.retryCount ?? null}
        hasGoldenManifest={props.hasGoldenManifest}
        commitBlockedReason={assumptionAwareCommitBlockedReason}
        sessionAiReadiness={sessionAiReadiness}
        canConfigureWorkspaceAi={canConfigureWorkspaceAi}
        usesCustomerAiConnection={usesCustomerAiConnection}
        transparencyTrail={props.transparencyTrail ?? null}
      />
    </>
  );
}

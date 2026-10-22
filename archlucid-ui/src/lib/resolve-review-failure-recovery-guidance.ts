import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  deriveReviewSubmittedIntakeRecap,
  type ReviewSubmittedIntakeRecap,
} from "@/lib/derive-review-submitted-intake-recap";
import {
  isQualityRejectedRunStatus,
  plainLanguageFailureClassLabel,
  plainLanguageTriageTitle,
  resolveExecutionVsQualityAxis,
} from "@/lib/execution-vs-quality-outcome-copy";
import {
  buildCustomerConnectionAdminHandoffVerificationLines,
  buildManagedPlatformAdminHandoffVerificationLines,
  buildReviewFailureAdminHandoffMarkdown,
  isWorkspaceAiConfigurationFailure,
  recoveryStepsForLegacyStatusWithAudience,
  recoveryStepsForTriageScenarioWithAudience,
  resolveReviewFailureAdminConfigurationLink,
  resolveWorkspaceAiConfigurationSignal,
  type ReviewFailureAdminHandoff,
  type WorkspaceAiConfigurationSignal,
} from "@/lib/review-failure-recovery-role-copy";
import {
  deriveReviewPipelineTerminalFailureDiagnosis,
  type ReviewPipelineDiagnosticContext,
} from "@/lib/review-pipeline-stall-diagnosis";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";
import type { RunSummary } from "@/types/authority";

export const REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY =
  "Your submitted intake package was recorded. Processing stopped before the first pipeline stage — this is usually platform AI availability, not missing intake fields.";

export type ReviewFailureRecoveryGuidance = {
  readonly headline: string;
  readonly detail: string | null;
  readonly recoverySteps: readonly string[];
  readonly suggestSupportTicket: boolean;
  readonly severity: "warning" | "error";
  readonly supportHref: string;
  readonly intactSummary?: string | null;
  readonly submittedIntakeRecap?: ReviewSubmittedIntakeRecap | null;
  readonly workspaceAiConfigurationSignal?: WorkspaceAiConfigurationSignal | null;
  readonly adminHandoff?: ReviewFailureAdminHandoff | null;
  readonly adminConfigurationHref?: string | null;
  readonly adminConfigurationLabel?: string | null;
};

type RecoveryStepInput = {
  readonly runId?: string | null;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly summary?: RunSummary | null;
  readonly intakeDescription?: string | null;
  readonly intakeSystemName?: string | null;
  readonly canConfigureWorkspaceAi?: boolean;
  readonly realModeFellBackToSimulator?: boolean | null;
  readonly usesCustomerAiConnection?: boolean;
  readonly effectiveSessionMode?: "Simulator" | "Real" | null;
};

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function recoveryStepsForFailureClass(
  failureClass: string,
  canConfigureWorkspaceAi: boolean,
  usesCustomerAiConnection: boolean,
): readonly string[] | null {
  switch (failureClass) {
    case "missingCredentials":
      return recoveryStepsForTriageScenarioWithAudience({
        triageScenarioId: "missingCredentials",
        canConfigureWorkspaceAi,
        usesCustomerAiConnection,
      });
    case "contentSafety":
      return recoveryStepsForTriageScenarioWithAudience({
        triageScenarioId: "contentSafetyRejection",
        canConfigureWorkspaceAi,
      });
    case "parse":
      return recoveryStepsForTriageScenarioWithAudience({
        triageScenarioId: "schemaViolation",
        canConfigureWorkspaceAi,
      });
    case "timeout":
      return recoveryStepsForTriageScenarioWithAudience({
        triageScenarioId: "timeout",
        canConfigureWorkspaceAi,
      });
    case "quota":
    case "costBudget":
      return recoveryStepsForTriageScenarioWithAudience({
        triageScenarioId: "budgetCutoff",
        canConfigureWorkspaceAi,
        usesCustomerAiConnection,
      });
    case "qualityGate":
      return recoveryStepsForTriageScenarioWithAudience({
        triageScenarioId: "groundingInsufficiency",
        canConfigureWorkspaceAi,
      });
    case "circuitBreaker":
      return [
        "Wait about one minute for the AI circuit breaker to reset, then click Re-run review.",
        "If the circuit stays open, open a support ticket — the AI provider may be offline and needs platform investigation.",
      ];
    case "dependency":
      return canConfigureWorkspaceAi
        ? [
            "Confirm dependent services (database, message queue, AI endpoint) are healthy in Administration → System health.",
            "When health checks pass, click Re-run review on this page.",
          ]
        : [
            "Share the administrator handoff below so a workspace administrator can verify platform health and AI connectivity.",
            "After they confirm services are healthy, return here and click Re-run review.",
          ];
    case "pipelineDeadLetter":
      return [
        "Click Re-run review to retry processing with the same intake.",
        "If the review dead-letters again, open a support ticket with this review id.",
      ];
    case "canceled":
      return [
        "If you did not intend to cancel, click Re-run review to restart the assessment.",
      ];
    case "invalidOperation":
      return [
        "Click Re-run review to resume processing with the same intake.",
        "If it fails again before pipeline stages start, check AI configuration and that background review processing is running.",
      ];
    default:
      return null;
  }
}

function recoveryStepsForLegacyStatus(
  legacyStatus: string,
  completedStages: number,
  canConfigureWorkspaceAi: boolean,
  usesCustomerAiConnection: boolean,
): { readonly steps: readonly string[]; readonly specificity: "specific" | "generic" } | null {
  if (isQualityRejectedRunStatus(legacyStatus)) {
    const steps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "groundingInsufficiency",
      canConfigureWorkspaceAi,
    });

    return steps !== null ? { steps, specificity: "specific" } : null;
  }

  if (legacyStatus === "FailedPartial" || legacyStatus === "PartiallyCompleted") {
    const steps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "partialRequiredAgentsIncomplete",
      canConfigureWorkspaceAi,
    });

    return steps !== null ? { steps, specificity: "specific" } : null;
  }

  const preStageSteps = recoveryStepsForLegacyStatusWithAudience({
    legacyStatus,
    completedStages,
    canConfigureWorkspaceAi,
    usesCustomerAiConnection,
  });

  if (preStageSteps !== null) {
    return { steps: preStageSteps, specificity: "specific" };
  }

  if (legacyStatus === "Failed") {
    return {
      steps: [
        "Review the error detail below and fix configuration, credentials, or attachments as indicated.",
        "Click Re-run review with the same intake when the issue is resolved.",
      ],
      specificity: "generic",
    };
  }

  return null;
}

function recoveryStepsForDeadLetter(): readonly string[] {
  return recoveryStepsForTriageScenarioWithAudience({
    triageScenarioId: "pipelineDeadLetter",
    canConfigureWorkspaceAi: true,
  }) ?? [
    "Click Re-run review to retry processing with the same intake.",
    "If the review dead-letters again, open a support ticket with this review id.",
  ];
}

function completedPipelineStages(summary: RunSummary | null | undefined): number {
  if (summary === null || summary === undefined) {
    return 0;
  }

  return [
    summary.hasContextSnapshot === true,
    summary.hasGraphSnapshot === true,
    summary.hasFindingsSnapshot === true,
    summary.hasGoldenManifest === true,
  ].filter(Boolean).length;
}

/**
 * Operator-facing recovery guidance for terminal assessment failures.
 * Used in the Do this next strip so users do not need the Activity tab for first-line recovery.
 */
export function resolveReviewFailureRecoveryGuidance(
  input: RecoveryStepInput,
): ReviewFailureRecoveryGuidance | null {
  const diagnosis = deriveReviewPipelineTerminalFailureDiagnosis({
    diagnosticContext: input.diagnosticContext,
    summary: input.summary ?? null,
  });

  if (diagnosis === null) {
    return null;
  }

  const canConfigureWorkspaceAi = input.canConfigureWorkspaceAi === true;
  const usesCustomerAiConnection = input.usesCustomerAiConnection === true;
  const lastFailure = input.lastFailureSummary;
  const triageScenarioId = normalizeKey(lastFailure?.triageScenarioId);
  const failureClass = normalizeKey(lastFailure?.failureClass);
  const reasonCode = normalizeKey(lastFailure?.reasonCode);
  const legacyStatus = normalizeKey(input.diagnosticContext?.legacyRunStatus);
  const isDeadLettered = input.diagnosticContext?.isDeadLettered === true;
  const completedStages = completedPipelineStages(input.summary ?? null);
  // Bare invalidOperation before any pipeline stage is a deferred-pipeline miss, not bad intake.
  const isDeferredPipelineInvalidOperation =
    reasonCode === "NoScheduledAgentTasks" ||
    reasonCode === "MissingArchitectureRequest" ||
    (failureClass === "invalidOperation" && completedStages === 0);

  let recoverySteps: readonly string[] | null = null;
  let recoverySpecificity: "specific" | "generic" | "none" = "none";

  if (triageScenarioId.length > 0) {
    const steps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId,
      canConfigureWorkspaceAi,
      usesCustomerAiConnection,
      failureClass,
      effectiveSessionMode: input.effectiveSessionMode ?? null,
    });

    if (steps !== null) {
      recoverySteps = steps;
      recoverySpecificity = "specific";
    }
  }

  // Prefer Re-run / worker copy over intake or generic AI-config steps. Existing
  // dbo.Runs.LastFailureReason rows may be a bare failureClass=invalidOperation.
  if (recoverySteps === null && isDeferredPipelineInvalidOperation) {
    const steps = recoveryStepsForFailureClass(
      "invalidOperation",
      canConfigureWorkspaceAi,
      usesCustomerAiConnection,
    );

    if (steps !== null) {
      recoverySteps = steps;
      recoverySpecificity = "specific";
    }
  }

  if (recoverySteps === null && failureClass.length > 0) {
    const steps = recoveryStepsForFailureClass(failureClass, canConfigureWorkspaceAi, usesCustomerAiConnection);

    if (steps !== null) {
      recoverySteps = steps;
      recoverySpecificity = "specific";
    }
  }

  if (recoverySteps === null && isDeadLettered) {
    recoverySteps = recoveryStepsForDeadLetter();
    recoverySpecificity = "specific";
  }

  if (recoverySteps === null && legacyStatus.length > 0) {
    const legacyRecovery = recoveryStepsForLegacyStatus(
      legacyStatus,
      completedStages,
      canConfigureWorkspaceAi,
      usesCustomerAiConnection,
    );

    if (legacyRecovery !== null) {
      recoverySteps = legacyRecovery.steps;
      recoverySpecificity = legacyRecovery.specificity;
    }
  }

  const axis = resolveExecutionVsQualityAxis({
    failureClass: lastFailure?.failureClass,
    legacyRunStatus: legacyStatus,
  });

  const triageTitle = plainLanguageTriageTitle(lastFailure?.triageScenarioId);
  const failureClassLabel = plainLanguageFailureClassLabel(lastFailure?.failureClass);
  const lastFailureReason = normalizeKey(input.diagnosticContext?.lastFailureReason);

  let detail = diagnosis.detail.trim();

  if (detail.length === 0 && triageTitle !== null) {
    detail = triageTitle;
  }

  if (detail.length === 0 && failureClass.length > 0) {
    detail = `Failure type: ${failureClassLabel}.`;
  }

  if (detail.length === 0 && lastFailureReason.length > 0) {
    detail = lastFailureReason;
  }

  const suggestSupportTicket = recoverySpecificity !== "specific";

  const finalSteps: readonly string[] =
    recoverySteps !== null && recoverySteps.length > 0
      ? recoverySteps
      : [
          "We could not determine a specific fix from the available error information.",
          "Open Report a problem and include this review id so support can investigate.",
        ];

  const isPreStageExecutionFailure = legacyStatus === "Failed" && completedStages === 0;
  const intactSummary = isPreStageExecutionFailure ? REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY : null;
  const submittedIntakeRecap = isPreStageExecutionFailure
    ? deriveReviewSubmittedIntakeRecap({
        description: input.intakeDescription ?? input.summary?.description ?? null,
        systemName: input.intakeSystemName ?? input.summary?.displayName ?? null,
      })
    : null;

  const workspaceAiConfigurationSignal = resolveWorkspaceAiConfigurationSignal({
    triageScenarioId: lastFailure?.triageScenarioId,
    failureClass: lastFailure?.failureClass,
    legacyRunStatus: legacyStatus,
    completedStages,
    realModeFellBackToSimulator: input.realModeFellBackToSimulator,
    usesCustomerAiConnection,
    effectiveSessionMode: input.effectiveSessionMode ?? null,
  });

  const workspaceAiConfigurationFailure = isWorkspaceAiConfigurationFailure({
    triageScenarioId: lastFailure?.triageScenarioId,
    failureClass: lastFailure?.failureClass,
    legacyRunStatus: legacyStatus,
    completedStages,
    realModeFellBackToSimulator: input.realModeFellBackToSimulator,
    usesCustomerAiConnection,
    effectiveSessionMode: input.effectiveSessionMode ?? null,
  });

  const adminConfigurationLink = resolveReviewFailureAdminConfigurationLink({
    workspaceAiConfigurationFailure,
    canConfigureWorkspaceAi,
    triageScenarioId: lastFailure?.triageScenarioId,
    failureClass: lastFailure?.failureClass,
    legacyRunStatus: legacyStatus,
    completedStages,
  });

  const adminHandoff: ReviewFailureAdminHandoff | null =
    !canConfigureWorkspaceAi && workspaceAiConfigurationFailure
      ? {
          markdown: buildReviewFailureAdminHandoffMarkdown({
            runId:
              normalizeKey(input.runId) ||
              normalizeKey(input.summary?.runId) ||
              "unknown-review",
            headline: diagnosis.headline,
            detail: detail.length > 0 ? detail : null,
            lastFailureSummary: lastFailure ?? null,
            workspaceAiSignal: workspaceAiConfigurationSignal,
            usesCustomerAiConnection,
          }),
          verificationLines:
            usesCustomerAiConnection
              ? buildCustomerConnectionAdminHandoffVerificationLines()
              : buildManagedPlatformAdminHandoffVerificationLines(),
        }
      : null;

  return {
    headline: diagnosis.headline,
    detail: detail.length > 0 ? detail : null,
    recoverySteps: finalSteps,
    suggestSupportTicket,
    severity: axis === "quality" ? "warning" : diagnosis.severity === "warning" ? "warning" : "error",
    supportHref: SUPPORT_REPORT_PROBLEM_HELP_HREF,
    intactSummary,
    submittedIntakeRecap,
    workspaceAiConfigurationSignal,
    adminHandoff,
    adminConfigurationHref: adminConfigurationLink.href,
    adminConfigurationLabel: adminConfigurationLink.label,
  };
}

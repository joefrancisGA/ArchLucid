import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  isQualityRejectedRunStatus,
  plainLanguageFailureClassLabel,
  plainLanguageTriageTitle,
  resolveExecutionVsQualityAxis,
} from "@/lib/execution-vs-quality-outcome-copy";
import {
  deriveReviewPipelineTerminalFailureDiagnosis,
  type ReviewPipelineDiagnosticContext,
} from "@/lib/review-pipeline-stall-diagnosis";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";
import type { RunSummary } from "@/types/authority";

export type ReviewFailureRecoveryGuidance = {
  readonly headline: string;
  readonly detail: string | null;
  readonly recoverySteps: readonly string[];
  readonly suggestSupportTicket: boolean;
  readonly severity: "warning" | "error";
  readonly supportHref: string;
};

type RecoveryStepInput = {
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly summary?: RunSummary | null;
};

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function recoveryStepsForTriageScenario(triageScenarioId: string): readonly string[] | null {
  switch (triageScenarioId) {
    case "missingCredentials":
      return [
        "Open Administration → AI configuration and confirm Azure OpenAI credentials and deployment names are set for this workspace.",
        "Save any changes, wait one minute, then click Re-run review on this page.",
      ];
    case "contentSafetyRejection":
      return [
        "Review your intake text and attachments for content that may trigger safety filters.",
        "Revise or remove the flagged content, then click Re-run review with the same intake.",
      ];
    case "schemaViolation":
      return [
        "Confirm every required intake field is filled and attachments are valid (not corrupted or password-protected).",
        "Fix the intake, then click Re-run review with the same intake.",
      ];
    case "timeout":
      return [
        "Wait a few minutes for infrastructure to stabilize, then click Re-run review.",
        "If timeouts repeat, reduce attachment size or split large evidence bundles before re-running.",
      ];
    case "budgetCutoff":
      return [
        "Open Administration → AI configuration and raise the token quota or run cost budget for this workspace.",
        "After saving, click Re-run review on this page.",
      ];
    case "groundingInsufficiency":
      return [
        "Open the Evidence tab and add architecture diagrams, ADRs, or policy documents that support your intake claims.",
        "Return here and click Re-run review so the assessment can evaluate the enriched evidence.",
      ];
    case "fallbackToSimulator":
      return [
        "Confirm real-mode AI credentials are configured (Administration → AI configuration).",
        "Click Re-run review after credentials are in place — simulator output cannot be finalized.",
      ];
    case "partialRequiredAgentsIncomplete":
      return [
        "Click Re-run review to retry the assessments that did not finish.",
        "If the same agents fail again, open a support ticket with this review id.",
      ];
    default:
      return null;
  }
}

function recoveryStepsForFailureClass(failureClass: string): readonly string[] | null {
  switch (failureClass) {
    case "missingCredentials":
      return recoveryStepsForTriageScenario("missingCredentials");
    case "contentSafety":
      return recoveryStepsForTriageScenario("contentSafetyRejection");
    case "parse":
      return recoveryStepsForTriageScenario("schemaViolation");
    case "timeout":
      return recoveryStepsForTriageScenario("timeout");
    case "quota":
    case "costBudget":
      return recoveryStepsForTriageScenario("budgetCutoff");
    case "qualityGate":
      return recoveryStepsForTriageScenario("groundingInsufficiency");
    case "circuitBreaker":
      return [
        "Wait five minutes for the AI circuit breaker to reset, then click Re-run review.",
        "If the circuit stays open, open a support ticket — sustained failures may need platform investigation.",
      ];
    case "dependency":
      return [
        "Confirm dependent services (database, message queue, AI endpoint) are healthy in Administration → Diagnostics.",
        "When health checks pass, click Re-run review on this page.",
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
        "Review intake fields and attachments for invalid values or unsupported formats.",
        "Correct the intake, then click Re-run review with the same intake.",
      ];
    default:
      return null;
  }
}

function recoveryStepsForLegacyStatus(
  legacyStatus: string,
  completedStages: number,
): { readonly steps: readonly string[]; readonly specificity: "specific" | "generic" } | null {
  if (isQualityRejectedRunStatus(legacyStatus)) {
    const steps = recoveryStepsForTriageScenario("groundingInsufficiency");

    return steps !== null ? { steps, specificity: "specific" } : null;
  }

  if (legacyStatus === "FailedPartial" || legacyStatus === "PartiallyCompleted") {
    const steps = recoveryStepsForTriageScenario("partialRequiredAgentsIncomplete");

    return steps !== null ? { steps, specificity: "specific" } : null;
  }

  if (legacyStatus === "Failed" && completedStages === 0) {
    return {
      steps: [
        "Confirm intake fields are complete and every attachment uploaded successfully.",
        "Check Administration → AI configuration for valid credentials and deployment names.",
        "Click Re-run review with the same intake after fixing configuration or attachments.",
      ],
      specificity: "specific",
    };
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
  return recoveryStepsForTriageScenario("pipelineDeadLetter") ?? [
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

  const lastFailure = input.lastFailureSummary;
  const triageScenarioId = normalizeKey(lastFailure?.triageScenarioId);
  const failureClass = normalizeKey(lastFailure?.failureClass);
  const legacyStatus = normalizeKey(input.diagnosticContext?.legacyRunStatus);
  const isDeadLettered = input.diagnosticContext?.isDeadLettered === true;
  const completedStages = completedPipelineStages(input.summary ?? null);

  let recoverySteps: readonly string[] | null = null;
  let recoverySpecificity: "specific" | "generic" | "none" = "none";

  if (triageScenarioId.length > 0) {
    const steps = recoveryStepsForTriageScenario(triageScenarioId);

    if (steps !== null) {
      recoverySteps = steps;
      recoverySpecificity = "specific";
    }
  }

  if (recoverySteps === null && failureClass.length > 0) {
    const steps = recoveryStepsForFailureClass(failureClass);

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
    const legacyRecovery = recoveryStepsForLegacyStatus(legacyStatus, completedStages);

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

  return {
    headline: diagnosis.headline,
    detail: detail.length > 0 ? detail : null,
    recoverySteps: finalSteps,
    suggestSupportTicket,
    severity: axis === "quality" ? "warning" : diagnosis.severity === "warning" ? "warning" : "error",
    supportHref: SUPPORT_REPORT_PROBLEM_HELP_HREF,
  };
}

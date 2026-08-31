import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  plainLanguageFailureClassLabel,
  plainLanguageTriageTitle,
} from "@/lib/execution-vs-quality-outcome-copy";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";

export const REVIEW_FAILURE_ADMIN_CONFIGURATION_PATH = MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH;

export const WORKSPACE_AI_ADMIN_VERIFICATION_LINES = [
  "Azure OpenAI endpoint URL is configured for this workspace.",
  "API key or Key Vault secret name is set and reachable.",
  "Deployment names match the models ArchLucid expects for reviews.",
  "Connection probe passes on Administration → Model governance.",
] as const;

export type WorkspaceAiConfigurationSignal = {
  readonly label: string;
  readonly detail: string;
};

export type ReviewFailureAdminHandoff = {
  readonly markdown: string;
  readonly verificationLines: readonly string[];
};

type WorkspaceAiFailureContext = {
  readonly triageScenarioId?: string | null;
  readonly failureClass?: string | null;
  readonly legacyRunStatus?: string | null;
  readonly completedStages?: number;
  readonly realModeFellBackToSimulator?: boolean | null;
};

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function isWorkspaceAiConfigurationFailure(context: WorkspaceAiFailureContext): boolean {
  const triageScenarioId = normalizeKey(context.triageScenarioId);
  const failureClass = normalizeKey(context.failureClass);
  const legacyStatus = normalizeKey(context.legacyRunStatus);
  const completedStages = context.completedStages ?? 0;

  if (
    triageScenarioId === "missingCredentials" ||
    triageScenarioId === "fallbackToSimulator" ||
    triageScenarioId === "budgetCutoff"
  ) {
    return true;
  }

  if (
    failureClass === "missingCredentials" ||
    failureClass === "quota" ||
    failureClass === "costBudget"
  ) {
    return true;
  }

  if (context.realModeFellBackToSimulator === true) {
    return true;
  }

  if (legacyStatus === "Failed" && completedStages === 0) {
    return true;
  }

  return false;
}

export function resolveWorkspaceAiConfigurationSignal(
  context: WorkspaceAiFailureContext,
): WorkspaceAiConfigurationSignal | null {
  if (!isWorkspaceAiConfigurationFailure(context)) {
    return null;
  }

  const triageTitle = plainLanguageTriageTitle(context.triageScenarioId);

  if (triageTitle !== null) {
    return {
      label: "Workspace AI configuration",
      detail: triageTitle,
    };
  }

  if (context.realModeFellBackToSimulator === true) {
    return {
      label: "Workspace AI configuration",
      detail: "Real-mode AI credentials are not configured — reviews cannot run in production mode.",
    };
  }

  return {
    label: "Workspace AI configuration",
    detail:
      "Review execution stopped before processing began. This is usually workspace AI provider setup or platform configuration — not missing intake fields.",
  };
}

function adminStepsForMissingCredentials(): readonly string[] {
  return [
    "Open Administration → Model governance and confirm Azure OpenAI credentials, Key Vault secret, and deployment names are configured for this workspace.",
    "Run the connection probe and resolve any blocking findings, then wait one minute.",
    "Return here and click Re-run review on this page.",
  ];
}

function operatorStepsForMissingCredentials(): readonly string[] {
  return [
    "Share the administrator handoff below with a workspace administrator — this account cannot change AI configuration.",
    "After your administrator confirms the model-governance connection probe passes, return here and click Re-run review.",
    "If the failure repeats after setup is confirmed, open Report a problem and include this review id.",
  ];
}

function adminStepsForPreStageFailure(): readonly string[] {
  return [
    "Open Administration → Model governance and confirm Azure OpenAI credentials, Key Vault secret, and deployment names are configured for this workspace.",
    "Run the connection probe and resolve any blocking findings, then wait one minute.",
    "Return here and click Re-run review — your submitted intake package below will be reused unchanged.",
    "If the failure repeats, open Report a problem and include this review id so support can investigate.",
  ];
}

function operatorStepsForPreStageFailure(): readonly string[] {
  return [
    "Share the administrator handoff below with a workspace administrator — this account cannot change AI configuration.",
    "After your administrator confirms workspace AI setup, return here and click Re-run review.",
    "If the failure repeats after setup is confirmed, open Report a problem and include this review id.",
  ];
}

export function recoveryStepsForTriageScenarioWithAudience(input: {
  readonly triageScenarioId: string;
  readonly canConfigureWorkspaceAi: boolean;
}): readonly string[] | null {
  switch (input.triageScenarioId) {
    case "missingCredentials":
      return input.canConfigureWorkspaceAi
        ? adminStepsForMissingCredentials()
        : operatorStepsForMissingCredentials();
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
      return input.canConfigureWorkspaceAi
        ? [
            "Open Administration → Model governance or AI usage and raise the token quota or run cost budget for this workspace.",
            "After saving, click Re-run review on this page.",
          ]
        : [
            "Share the administrator handoff below so a workspace administrator can review AI usage limits and budgets.",
            "After limits are raised, return here and click Re-run review.",
          ];
    case "groundingInsufficiency":
      return [
        "Open the Evidence tab and add architecture diagrams, ADRs, or policy documents that support your intake claims.",
        "Return here and click Re-run review so the assessment can evaluate the enriched evidence.",
      ];
    case "fallbackToSimulator":
      return input.canConfigureWorkspaceAi
        ? [
            "Open Administration → Model governance and confirm real-mode Azure OpenAI credentials are configured.",
            "Click Re-run review after credentials are in place — simulator output cannot be finalized.",
          ]
        : [
            "Share the administrator handoff below so a workspace administrator can configure real-mode Azure OpenAI credentials.",
            "After credentials are in place, return here and click Re-run review — simulator output cannot be finalized.",
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

export function recoveryStepsForLegacyStatusWithAudience(input: {
  readonly legacyStatus: string;
  readonly completedStages: number;
  readonly canConfigureWorkspaceAi: boolean;
}): readonly string[] | null {
  if (input.legacyStatus === "Failed" && input.completedStages === 0) {
    return input.canConfigureWorkspaceAi
      ? adminStepsForPreStageFailure()
      : operatorStepsForPreStageFailure();
  }

  return null;
}

export function buildReviewFailureAdminHandoffMarkdown(input: {
  readonly runId: string;
  readonly headline: string;
  readonly detail?: string | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly workspaceAiSignal?: WorkspaceAiConfigurationSignal | null;
}): string {
  const lines: string[] = [
    "ArchLucid review execution failed — administrator action needed",
    "",
    `Review ID: ${input.runId}`,
    `Failure: ${input.headline}`,
  ];

  const detail = (input.detail ?? "").trim();

  if (detail.length > 0) {
    lines.push(`Detail: ${detail}`);
  }

  const triageTitle = plainLanguageTriageTitle(input.lastFailureSummary?.triageScenarioId);
  const failureClassLabel = plainLanguageFailureClassLabel(input.lastFailureSummary?.failureClass);

  if (triageTitle !== null) {
    lines.push(`Likely cause: ${triageTitle}`);
  } else if ((input.lastFailureSummary?.failureClass ?? "").trim().length > 0) {
    lines.push(`Failure class: ${failureClassLabel}`);
  } else if (input.workspaceAiSignal !== null && input.workspaceAiSignal !== undefined) {
    lines.push(`Likely cause: ${input.workspaceAiSignal.detail}`);
  }

  lines.push("", "Please verify for this workspace:");
  for (const verificationLine of WORKSPACE_AI_ADMIN_VERIFICATION_LINES) {
    lines.push(`- ${verificationLine}`);
  }

  lines.push(
    "",
    "Operator intake was recorded successfully — this is not a missing intake-fields issue.",
    "After configuration is fixed, the operator can click Re-run review on the review page.",
  );

  return lines.join("\n");
}

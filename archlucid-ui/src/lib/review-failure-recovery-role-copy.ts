import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  plainLanguageFailureClassLabel,
  plainLanguageTriageTitle,
} from "@/lib/execution-vs-quality-outcome-copy";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import {
  AI_MODELS_SETTINGS_CANONICAL_PATH,
  AI_MODELS_SETTINGS_OPEN_CTA_LABEL,
} from "@/lib/model-governance-settings-evidence-copy";

export const REVIEW_FAILURE_ADMIN_CONFIGURATION_PATH = AI_MODELS_SETTINGS_CANONICAL_PATH;

export const REVIEW_FAILURE_AI_USAGE_CONFIGURATION_PATH = AI_USAGE_SETTINGS_PATH;

export type WorkspaceAiRecoveryAudienceInput = {
  readonly canConfigureWorkspaceAi: boolean;
  readonly usesCustomerAiConnection: boolean;
};

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
  readonly usesCustomerAiConnection?: boolean;
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

function managedAiUnavailableDetail(): string {
  return "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.";
}

function customerAiConnectionUnavailableDetail(): string {
  return "Your workspace customer-provided AI connection is unavailable — reviews cannot start until the connection is restored.";
}

export function resolveWorkspaceAiConfigurationSignal(
  context: WorkspaceAiFailureContext,
): WorkspaceAiConfigurationSignal | null {
  if (!isWorkspaceAiConfigurationFailure(context)) {
    return null;
  }

  const usesCustomerAiConnection = context.usesCustomerAiConnection === true;
  const triageTitle = plainLanguageTriageTitle(context.triageScenarioId);

  if (usesCustomerAiConnection) {
    return {
      label: "Workspace AI connection",
      detail: customerAiConnectionUnavailableDetail(),
    };
  }

  if (triageTitle !== null && normalizeKey(context.triageScenarioId) === "budgetCutoff") {
    return {
      label: "Workspace AI budget",
      detail: triageTitle,
    };
  }

  if (context.realModeFellBackToSimulator === true) {
    return {
      label: "Workspace AI configuration",
      detail: managedAiUnavailableDetail(),
    };
  }

  if (legacyPreStageFailure(context)) {
    return {
      label: "Workspace AI availability",
      detail: managedAiUnavailableDetail(),
    };
  }

  if (triageTitle !== null) {
    return {
      label: "Workspace AI availability",
      detail: managedAiUnavailableDetail(),
    };
  }

  return {
    label: "Workspace AI availability",
    detail:
      "Review execution stopped before processing began. This is usually platform AI availability — not missing intake fields.",
  };
}

function legacyPreStageFailure(context: WorkspaceAiFailureContext): boolean {
  return normalizeKey(context.legacyRunStatus) === "Failed" && (context.completedStages ?? 0) === 0;
}

function operatorHandoffIntro(): string {
  return "Share the administrator handoff below with a workspace administrator — this account cannot change workspace AI settings.";
}

function operatorReportProblemStep(): string {
  return "If the failure repeats after your administrator confirms setup, open Report a problem and include this review id.";
}

function managedPlatformAdminSteps(): readonly string[] {
  return [
    "This review uses ArchLucid-managed AI, which is unavailable right now — changing models on Administration → AI models will not fix a platform outage.",
    "Open Report a problem and include this review id so support can investigate.",
    "Return here and click Re-run review after support confirms platform AI is healthy.",
  ];
}

function managedPlatformOperatorSteps(): readonly string[] {
  return [
    operatorHandoffIntro(),
    "After your administrator contacts support, return here and click Re-run review.",
    operatorReportProblemStep(),
  ];
}

function customerConnectionAdminSteps(): readonly string[] {
  return [
    "This review uses your workspace customer-provided AI connection, which is unavailable.",
    "Contact your ArchLucid support contact with this review id — connection credentials are managed outside this workspace UI.",
    "Return here and click Re-run review after the connection is restored.",
  ];
}

function customerConnectionOperatorSteps(): readonly string[] {
  return [
    operatorHandoffIntro(),
    "After your administrator confirms the workspace AI connection is restored, return here and click Re-run review.",
    operatorReportProblemStep(),
  ];
}

function adminAiUsageBudgetSteps(): readonly string[] {
  return [
    "Open Administration → AI usage and review workspace AI spend limits and monthly caps.",
    "After limits are adjusted, click Re-run review on this page.",
  ];
}

function operatorAiUsageBudgetSteps(): readonly string[] {
  return [
    operatorHandoffIntro(),
    "After limits are raised, return here and click Re-run review.",
  ];
}

function resolveInfrastructureRecoverySteps(input: WorkspaceAiRecoveryAudienceInput): readonly string[] {
  if (input.usesCustomerAiConnection) {
    return input.canConfigureWorkspaceAi ? customerConnectionAdminSteps() : customerConnectionOperatorSteps();
  }

  return input.canConfigureWorkspaceAi ? managedPlatformAdminSteps() : managedPlatformOperatorSteps();
}

export function recoveryStepsForTriageScenarioWithAudience(input: {
  readonly triageScenarioId: string;
  readonly canConfigureWorkspaceAi: boolean;
  readonly usesCustomerAiConnection?: boolean;
}): readonly string[] | null {
  const audience: WorkspaceAiRecoveryAudienceInput = {
    canConfigureWorkspaceAi: input.canConfigureWorkspaceAi,
    usesCustomerAiConnection: input.usesCustomerAiConnection === true,
  };

  switch (input.triageScenarioId) {
    case "missingCredentials":
      return resolveInfrastructureRecoverySteps(audience);
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
      return audience.canConfigureWorkspaceAi ? adminAiUsageBudgetSteps() : operatorAiUsageBudgetSteps();
    case "groundingInsufficiency":
      return [
        "Open the Evidence tab and add architecture diagrams, ADRs, or policy documents that support your intake claims.",
        "Return here and click Re-run review so the assessment can evaluate the enriched evidence.",
      ];
    case "fallbackToSimulator":
      return resolveInfrastructureRecoverySteps(audience);
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
  readonly usesCustomerAiConnection?: boolean;
}): readonly string[] | null {
  if (input.legacyStatus === "Failed" && input.completedStages === 0) {
    return resolveInfrastructureRecoverySteps({
      canConfigureWorkspaceAi: input.canConfigureWorkspaceAi,
      usesCustomerAiConnection: input.usesCustomerAiConnection === true,
    });
  }

  return null;
}

export function buildManagedPlatformAdminHandoffVerificationLines(): readonly string[] {
  return [
    "Confirm this workspace uses ArchLucid-managed AI (not a customer-provided connection).",
    "Open Report a problem with the review id — platform AI availability is restored by ArchLucid operations.",
    "After support confirms platform AI is healthy, the operator can click Re-run review on the review page.",
  ] as const;
}

export function buildCustomerConnectionAdminHandoffVerificationLines(): readonly string[] {
  return [
    "Confirm this workspace has an enabled customer-provided AI connection for review completions.",
    "Contact ArchLucid support with the review id — connection credentials and probes are managed outside tenant administration.",
    "After the connection is restored, the operator can click Re-run review on the review page.",
  ] as const;
}

export function buildReviewFailureAdminHandoffMarkdown(input: {
  readonly runId: string;
  readonly headline: string;
  readonly detail?: string | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly workspaceAiSignal?: WorkspaceAiConfigurationSignal | null;
  readonly usesCustomerAiConnection?: boolean;
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

  const verificationLines =
    input.usesCustomerAiConnection === true
      ? buildCustomerConnectionAdminHandoffVerificationLines()
      : buildManagedPlatformAdminHandoffVerificationLines();

  lines.push("", "Please verify for this workspace:");
  for (const verificationLine of verificationLines) {
    lines.push(`- ${verificationLine}`);
  }

  lines.push(
    "",
    "Operator intake was recorded successfully — this is not a missing intake-fields issue.",
    "After the issue is resolved, the operator can click Re-run review on the review page.",
  );

  return lines.join("\n");
}

export function resolveReviewFailureAdminConfigurationLink(input: {
  readonly workspaceAiConfigurationFailure: boolean;
  readonly canConfigureWorkspaceAi: boolean;
  readonly triageScenarioId?: string | null;
  readonly failureClass?: string | null;
  readonly legacyRunStatus?: string | null;
  readonly completedStages?: number;
}): { readonly href: string | null; readonly label: string | null } {
  if (!input.canConfigureWorkspaceAi || !input.workspaceAiConfigurationFailure) {
    return { href: null, label: null };
  }

  const triageScenarioId = normalizeKey(input.triageScenarioId);
  const failureClass = normalizeKey(input.failureClass);

  if (triageScenarioId === "budgetCutoff" || failureClass === "quota" || failureClass === "costBudget") {
    return { href: REVIEW_FAILURE_AI_USAGE_CONFIGURATION_PATH, label: "Open AI usage" };
  }

  return { href: null, label: null };
}

export { AI_MODELS_SETTINGS_OPEN_CTA_LABEL };

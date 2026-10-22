import { describe, expect, it } from "vitest";

import {
  buildCustomerConnectionAdminHandoffVerificationLines,
  buildManagedPlatformAdminHandoffVerificationLines,
  buildReviewFailureAdminHandoffMarkdown,
  isWorkspaceAiConfigurationFailure,
  recoveryStepsForLegacyStatusWithAudience,
  recoveryStepsForTriageScenarioWithAudience,
  resolveReviewFailureAdminConfigurationLink,
  resolveWorkspaceAiConfigurationSignal,
} from "./review-failure-recovery-role-copy";

describe("review-failure-recovery-role-copy", () => {
  it("detects workspace AI configuration failures", () => {
    expect(
      isWorkspaceAiConfigurationFailure({
        triageScenarioId: "missingCredentials",
        legacyRunStatus: "Failed",
        completedStages: 0,
      }),
    ).toBe(true);

    expect(
      isWorkspaceAiConfigurationFailure({
        legacyRunStatus: "Failed",
        completedStages: 0,
      }),
    ).toBe(true);

    expect(
      isWorkspaceAiConfigurationFailure({
        triageScenarioId: "groundingInsufficiency",
        legacyRunStatus: "ExecutionCompletedQualityRejected",
        completedStages: 2,
      }),
    ).toBe(false);
  });

  it("returns operator handoff steps for non-admin pre-stage failures", () => {
    const steps = recoveryStepsForLegacyStatusWithAudience({
      legacyStatus: "Failed",
      completedStages: 0,
      canConfigureWorkspaceAi: false,
    });

    expect(steps?.join(" ")).toContain("administrator handoff");
    expect(steps?.join(" ")).not.toContain("Key Vault");
    expect(steps?.join(" ")).not.toContain("connection probe");
  });

  it("returns managed-platform admin steps without secrets or probe language", () => {
    const steps = recoveryStepsForLegacyStatusWithAudience({
      legacyStatus: "Failed",
      completedStages: 0,
      canConfigureWorkspaceAi: true,
    });

    expect(steps?.join(" ")).toContain("Check AI availability");
    expect(steps?.join(" ")).toContain("live probe");
    expect(steps?.join(" ")).not.toContain("Key Vault");
    expect(steps?.join(" ")).not.toContain("connection probe");
    expect(steps?.join(" ")).not.toContain("administrator handoff");
  });

  it("branches missing-credentials triage steps by audience and provider mode", () => {
    const operatorSteps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "missingCredentials",
      canConfigureWorkspaceAi: false,
    });
    const managedAdminSteps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "missingCredentials",
      canConfigureWorkspaceAi: true,
    });
    const customerAdminSteps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "missingCredentials",
      canConfigureWorkspaceAi: true,
      usesCustomerAiConnection: true,
    });

    expect(operatorSteps?.join(" ")).toContain("administrator handoff");
    expect(managedAdminSteps?.join(" ")).toContain("Check AI availability");
    expect(customerAdminSteps?.join(" ")).toContain("workspace AI connection");
    expect(customerAdminSteps?.join(" ")).not.toContain("connection probe");
  });

  it("links budget failures to AI usage for tenant admins", () => {
    const link = resolveReviewFailureAdminConfigurationLink({
      workspaceAiConfigurationFailure: true,
      canConfigureWorkspaceAi: true,
      triageScenarioId: "budgetCutoff",
    });

    expect(link.href).toBe("/administration/ai-usage");
    expect(link.label).toBe("Open AI usage");
  });

  it("does not link infrastructure failures to AI models", () => {
    const link = resolveReviewFailureAdminConfigurationLink({
      workspaceAiConfigurationFailure: true,
      canConfigureWorkspaceAi: true,
      legacyRunStatus: "Failed",
      completedStages: 0,
    });

    expect(link.href).toBeNull();
    expect(link.label).toBeNull();
  });

  it("builds administrator handoff markdown without secret or probe checklist items", () => {
    const markdown = buildReviewFailureAdminHandoffMarkdown({
      runId: "run-abc",
      headline: "Execution failed before the first pipeline stage",
      detail: "Missing deployment",
      lastFailureSummary: {
        triageScenarioId: "missingCredentials",
        failureClass: "missingCredentials",
      },
      workspaceAiSignal: resolveWorkspaceAiConfigurationSignal({
        triageScenarioId: "missingCredentials",
        legacyRunStatus: "Failed",
        completedStages: 0,
      }),
    });

    expect(markdown).toContain("Review ID: run-abc");
    expect(markdown).toContain("Report a problem");
    expect(markdown).not.toContain("Key Vault");
    expect(markdown).not.toContain("connection probe");
    expect(markdown).toContain("not a missing intake-fields issue");
  });

  it("uses customer-connection verification lines when BYO is configured", () => {
    const markdown = buildReviewFailureAdminHandoffMarkdown({
      runId: "run-byo",
      headline: "Execution failed before the first pipeline stage",
      usesCustomerAiConnection: true,
    });

    for (const line of buildCustomerConnectionAdminHandoffVerificationLines()) {
      expect(markdown).toContain(line);
    }

    for (const line of buildManagedPlatformAdminHandoffVerificationLines()) {
      expect(markdown).not.toContain(line);
    }
  });
});

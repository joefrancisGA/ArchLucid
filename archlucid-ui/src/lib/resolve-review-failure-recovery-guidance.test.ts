import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { resolveReviewFailureRecoveryGuidance } from "./resolve-review-failure-recovery-guidance";

describe("resolveReviewFailureRecoveryGuidance", () => {
  it("returns operator handoff steps for missing-credentials triage by default", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      runId: "run-abc",
      diagnosticContext: { legacyRunStatus: "Failed", lastFailureReason: "Missing deployment" },
      lastFailureSummary: { triageScenarioId: "missingCredentials", failureClass: "missingCredentials" },
      summary: null,
    });

    expect(guidance).not.toBeNull();
    expect(guidance?.headline).toContain("Execution failed");
    expect(guidance?.recoverySteps.join(" ")).toContain("administrator handoff");
    expect(guidance?.adminHandoff?.markdown).toContain("Review ID: run-abc");
    expect(guidance?.workspaceAiConfigurationSignal?.detail).toContain("Check AI availability");
    expect(guidance?.suggestSupportTicket).toBe(false);
    expect(guidance?.adminConfigurationHref).toBeNull();
  });

  it("returns managed-platform admin steps without linking to AI models", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      diagnosticContext: { legacyRunStatus: "Failed", lastFailureReason: "Missing deployment" },
      lastFailureSummary: { triageScenarioId: "missingCredentials", failureClass: "missingCredentials" },
      summary: null,
      canConfigureWorkspaceAi: true,
    });

    expect(guidance?.recoverySteps.join(" ")).toContain("Real agent execution");
    expect(guidance?.recoverySteps.join(" ")).toContain("Simulator");
    expect(guidance?.recoverySteps.join(" ")).toContain("AI models");
    expect(guidance?.adminHandoff).toBeNull();
    expect(guidance?.adminConfigurationHref).toBeNull();
  });

  it("links budget failures to AI usage for tenant admins", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      diagnosticContext: { legacyRunStatus: "Failed" },
      lastFailureSummary: { triageScenarioId: "budgetCutoff", failureClass: "costBudget" },
      summary: null,
      canConfigureWorkspaceAi: true,
    });

    expect(guidance?.adminConfigurationHref).toBe(AI_USAGE_SETTINGS_PATH);
    expect(guidance?.adminConfigurationLabel).toBe("Open AI usage");
  });

  it("returns pre-stage failure steps when no structured failure is available", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      runId: "run-abc",
      diagnosticContext: { legacyRunStatus: "Failed" },
      lastFailureSummary: null,
      summary: {
        hasContextSnapshot: false,
        hasGraphSnapshot: false,
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
      intakeDescription:
        'Architecture review intake for "ArchLucid".\n\nAttached files:\n- handbook.docx',
    });

    expect(guidance?.headline).toBe("Execution failed before the first pipeline stage");
    expect(guidance?.recoverySteps.join(" ")).toContain("administrator handoff");
    expect(guidance?.recoverySteps.join(" ")).not.toContain("Confirm intake fields");
    expect(guidance?.intactSummary).toContain("submitted intake package");
    expect(guidance?.submittedIntakeRecap?.attachedFiles).toEqual(["handbook.docx"]);
    expect(guidance?.adminHandoff?.markdown).toContain("Review ID: run-abc");
    expect(guidance?.suggestSupportTicket).toBe(false);
  });

  it("uses customer-connection recovery copy when BYO is configured", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      diagnosticContext: { legacyRunStatus: "Failed" },
      lastFailureSummary: { triageScenarioId: "missingCredentials", failureClass: "missingCredentials" },
      summary: null,
      canConfigureWorkspaceAi: true,
      usesCustomerAiConnection: true,
    });

    expect(guidance?.recoverySteps.join(" ")).toContain("customer-provided AI connection");
    expect(guidance?.recoverySteps.join(" ")).not.toContain("connection probe");
  });

  it("suggests support ticket when only generic recovery steps are available", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      diagnosticContext: { legacyRunStatus: "Failed", lastFailureReason: "opaque_internal_code_xyz" },
      lastFailureSummary: { failureClass: "unknown" },
      summary: {
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    });

    expect(guidance?.suggestSupportTicket).toBe(true);
    expect(guidance?.recoverySteps.join(" ")).toContain("Re-run review");
    expect(guidance?.adminHandoff).toBeNull();
  });

  it("returns quality-gate recovery steps for quality-rejected runs", () => {
    const guidance = resolveReviewFailureRecoveryGuidance({
      diagnosticContext: { legacyRunStatus: "ExecutionCompletedQualityRejected" },
      lastFailureSummary: { failureClass: "qualityGate", triageScenarioId: "groundingInsufficiency" },
      summary: null,
    });

    expect(guidance?.severity).toBe("warning");
    expect(guidance?.recoverySteps.join(" ")).toContain("Evidence tab");
    expect(guidance?.adminHandoff).toBeNull();
  });
});

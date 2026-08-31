import { describe, expect, it } from "vitest";

import {
  buildReviewFailureAdminHandoffMarkdown,
  isWorkspaceAiConfigurationFailure,
  recoveryStepsForLegacyStatusWithAudience,
  recoveryStepsForTriageScenarioWithAudience,
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
    expect(steps?.join(" ")).not.toContain("Administration → Model governance");
  });

  it("returns admin configuration steps for admin pre-stage failures", () => {
    const steps = recoveryStepsForLegacyStatusWithAudience({
      legacyStatus: "Failed",
      completedStages: 0,
      canConfigureWorkspaceAi: true,
    });

    expect(steps?.join(" ")).toContain("Administration → Model governance");
    expect(steps?.join(" ")).not.toContain("administrator handoff");
  });

  it("branches missing-credentials triage steps by audience", () => {
    const operatorSteps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "missingCredentials",
      canConfigureWorkspaceAi: false,
    });
    const adminSteps = recoveryStepsForTriageScenarioWithAudience({
      triageScenarioId: "missingCredentials",
      canConfigureWorkspaceAi: true,
    });

    expect(operatorSteps?.join(" ")).toContain("administrator handoff");
    expect(adminSteps?.join(" ")).toContain("Model governance");
  });

  it("builds administrator handoff markdown with review id and verification checklist", () => {
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
    expect(markdown).toContain("Missing Azure OpenAI credentials or deployment config");
    expect(markdown).toContain("Connection probe passes on Administration → Model governance");
    expect(markdown).toContain("not a missing intake-fields issue");
  });
});

import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_SETUP_GUIDE_STEPS,
  isGovernanceFoundationIndicatorComplete,
  summarizeGovernanceSetupProgress,
} from "@/app/(operator)/governance/first-30-days/_sections/governance-setup-guide-steps";
import { presentGovernanceSetupStepStatus } from "@/app/(operator)/governance/first-30-days/_sections/governance-setup-step-status-present";

describe("governance-setup-guide-steps", () => {
  it("defines five setup steps with primary actions", () => {
    expect(GOVERNANCE_SETUP_GUIDE_STEPS).toHaveLength(5);
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[0]?.primaryActionLabel).toBe("Configure policy packs");
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[4]?.primaryActionLabel).toBe("Open workspace overview");
  });

  it("summarizes progress from step statuses", () => {
    const summary = summarizeGovernanceSetupProgress([
      "complete",
      "in-progress",
      "not-started",
      "not-started",
      "not-started",
    ]);

    expect(summary.completedCount).toBe(1);
    expect(summary.totalCount).toBe(5);
    expect(summary.firstIncompleteIndex).toBe(1);
    expect(summary.progressFraction).toBeCloseTo(0.2);
  });

  it("maps foundation indicators to checklist completion", () => {
    const statuses = ["complete", "not-started", "complete", "not-started", "not-started"] as const;

    expect(
      isGovernanceFoundationIndicatorComplete(
        { id: "policy-baseline", label: "Policy baseline established", stepIndex: 0 },
        statuses,
      ),
    ).toBe(true);

    expect(
      isGovernanceFoundationIndicatorComplete(
        { id: "approval-expectations", label: "Approval expectations documented", stepIndex: 3 },
        statuses,
      ),
    ).toBe(false);
  });
});

describe("governance-setup-step-status-present", () => {
  it("uses buyer-facing status labels", () => {
    expect(presentGovernanceSetupStepStatus("not-started").label).toBe("Not started");
    expect(presentGovernanceSetupStepStatus("in-progress").label).toBe("In progress");
    expect(presentGovernanceSetupStepStatus("complete").label).toBe("Complete");
  });
});

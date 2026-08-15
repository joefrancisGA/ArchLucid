import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_SETUP_GUIDE_STEPS,
  isGovernanceFoundationIndicatorComplete,
  summarizeGovernanceSetupProgress,
} from "@/app/(operator)/governance/setup/_sections/governance-setup-guide-steps";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import {
  presentGovernanceFoundationIndicatorStatus,
  presentGovernanceSetupStepStatus,
} from "@/app/(operator)/governance/setup/_sections/governance-setup-step-status-present";

describe("governance-setup-guide-steps", () => {
  it("defines five setup steps with primary actions and outcomes", () => {
    expect(GOVERNANCE_SETUP_GUIDE_STEPS).toHaveLength(5);
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[0]?.primaryActionLabel).toBe("Configure policy packs");
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[0]?.outcome.length).toBeGreaterThan(0);
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[0]?.tracked).toBe(true);
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[1]?.tracked).toBe(false);
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[2]?.tracked).toBe(true);
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[4]?.primaryActionLabel).toBe("Open workspace health");
    expect(GOVERNANCE_SETUP_GUIDE_STEPS[4]?.primaryActionHref).toBe(GOVERNANCE_WORKSPACE_HEALTH_HREF);
  });

  it("summarizes progress from tracked step statuses only", () => {
    // Inverted from the old 5-denominator model: untracked step 2 in-progress no longer affects progress.
    const summary = summarizeGovernanceSetupProgress([
      "complete",
      "in-progress",
      "not-started",
      "not-started",
      "not-started",
    ]);

    expect(summary.completedCount).toBe(1);
    expect(summary.totalCount).toBe(2);
    expect(summary.untrackedCount).toBe(3);
    expect(summary.firstIncompleteIndex).toBe(2);
    expect(summary.progressFraction).toBeCloseTo(0.5);
    expect(summary.nextStepTitle).toBe("Configure alert ownership");
    expect(summary.isComplete).toBe(false);
  });

  it("reports complete when all tracked steps are complete", () => {
    const summary = summarizeGovernanceSetupProgress([
      "complete",
      "not-started",
      "complete",
      "not-started",
      "not-started",
    ]);

    expect(summary.completedCount).toBe(2);
    expect(summary.totalCount).toBe(2);
    expect(summary.isComplete).toBe(true);
    expect(summary.firstIncompleteIndex).toBeNull();
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

  it("labels untracked foundation indicators as not tracked", () => {
    expect(presentGovernanceFoundationIndicatorStatus("untracked").label).toBe("Not tracked");
    expect(presentGovernanceFoundationIndicatorStatus("untracked").kind).toBe("neutral");
  });
});

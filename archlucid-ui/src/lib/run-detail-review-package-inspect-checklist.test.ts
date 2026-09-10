import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  resolveRunDetailReviewPackageInspectEmphasizedStepId,
  resolveRunDetailReviewPackageInspectSteps,
} from "@/lib/run-detail-review-package-inspect-checklist";
import { resolveRunDetailFindingsReviewed } from "@/lib/runs/run-detail-findings-tab-badge-count";

function baseFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Sample finding",
    recommendation: "Fix it.",
    severityValue: 3,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    ...overrides,
  };
}

describe("resolveRunDetailReviewPackageInspectSteps", () => {
  it("marks findings inspect step complete when detail snapshot has findings but explanation count is deferred", () => {
    const findingsReviewed = resolveRunDetailFindingsReviewed(null, [baseFinding()]);

    const steps = resolveRunDetailReviewPackageInspectSteps({
      reviewPicked: true,
      packageLoaded: true,
      findingsReviewed,
    });

    expect(steps.find((step) => step.id === "findings")?.complete).toBe(true);
    expect(resolveRunDetailReviewPackageInspectEmphasizedStepId({
      reviewPicked: true,
      packageLoaded: true,
      findingsReviewed,
    })).toBe("findings");
  });
});

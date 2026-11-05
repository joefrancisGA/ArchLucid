import { describe, expect, it } from "vitest";

import {
  governanceFindingQueuePrimaryInspectHref,
  governanceFindingQueueRowNeedsDispositionRecording,
} from "@/components/governance/findings/governance-findings-navigation";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

function queueRow(overrides: Partial<GovernanceFindingQueueRow>): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Run 1",
    manifestId: "",
    findingId: "finding-1",
    title: "Exposure path",
    severity: "High",
    category: "Storage",
    status: "Open",
    recommended: "Fix",
    recordKind: "finding",
    ...overrides,
  };
}

describe("governanceFindingQueuePrimaryInspectHref", () => {
  it("routes open decision-grade rows to the findings workspace deep link", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: null,
    });

    expect(governanceFindingQueueRowNeedsDispositionRecording(row)).toBe(true);
    expect(governanceFindingQueuePrimaryInspectHref(row)).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingId=finding-1#run-detail-first-review-spine-findings",
    );
  });

  it("keeps evidence-trace inspect when disposition is already recorded", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: "Accepted",
    });

    expect(governanceFindingQueueRowNeedsDispositionRecording(row)).toBe(false);
    expect(governanceFindingQueuePrimaryInspectHref(row)).toBe(
      "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
    );
  });
});

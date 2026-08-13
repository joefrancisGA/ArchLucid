import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  deriveRunDetailFindingsTriageCounts,
  formatFindingsExcludedSummaryLine,
} from "@/lib/runs/run-detail-findings-triage-counts";

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("deriveRunDetailFindingsTriageCounts", () => {
  it("excludes muted and low-confidence rows from triage-visible count", () => {
    const counts = deriveRunDetailFindingsTriageCounts([
      finding({ findingId: "f-visible", severityValue: 2 }),
      finding({ findingId: "f-muted", isMuted: true }),
      finding({
        findingId: "f-low",
        confidenceLevel: "Low",
        enforcementTier: "Advisory",
      }),
    ]);

    expect(counts.triageVisibleCount).toBe(1);
    expect(counts.mutedCount).toBe(1);
    expect(counts.hiddenByConfidenceCount).toBe(1);
    expect(formatFindingsExcludedSummaryLine(counts)).toBe("+1 muted · 1 low confidence excluded from triage");
  });
});

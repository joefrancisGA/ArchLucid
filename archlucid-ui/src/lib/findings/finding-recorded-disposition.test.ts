import { describe, expect, it } from "vitest";

import { quickDecisionFindingHasRecordedDisposition } from "@/lib/findings/finding-recorded-disposition";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function buildFinding(wireJson: string): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Sample finding",
    recommendation: "Fix it.",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson, reasoningTraceJson: null },
    isMuted: false,
    muteReason: null,
    enforcementTier: "Violation",
  };
}

describe("quickDecisionFindingHasRecordedDisposition (PC-10)", () => {
  it("returns true when latestDisposition is present on the wire", () => {
    const finding = buildFinding(JSON.stringify({ latestDisposition: "Accepted" }));

    expect(quickDecisionFindingHasRecordedDisposition(finding)).toBe(true);
  });

  it("returns false when latestDisposition is missing or empty", () => {
    expect(quickDecisionFindingHasRecordedDisposition(buildFinding(JSON.stringify({})))).toBe(false);
    expect(quickDecisionFindingHasRecordedDisposition(buildFinding(JSON.stringify({ latestDisposition: "   " })))).toBe(
      false,
    );
    expect(quickDecisionFindingHasRecordedDisposition(buildFinding("not-json"))).toBe(false);
  });
});

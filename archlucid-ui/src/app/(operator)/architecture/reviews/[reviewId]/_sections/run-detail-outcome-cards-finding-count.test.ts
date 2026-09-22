import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { resolveRunDetailOutcomeCardsFindingCountDisplay } from "./run-detail-outcome-cards-finding-count";

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

describe("resolveRunDetailOutcomeCardsFindingCountDisplay", () => {
  it("falls back to detail snapshot triage counts when explanation count is deferred", () => {
    const findings = [baseFinding(), baseFinding({ findingId: "finding-2", findingOrder: 1 })];

    expect(resolveRunDetailOutcomeCardsFindingCountDisplay(null, findings)).toBe(2);
  });

  it("prefers explanation headline counts when present", () => {
    expect(resolveRunDetailOutcomeCardsFindingCountDisplay(9, [baseFinding()])).toBe(9);
  });
});

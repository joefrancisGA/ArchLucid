import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  resolveRunDetailDeferredSurfaceFindingCount,
  resolveRunDetailFindingsReviewed,
  resolveRunDetailFindingsTabBadgeCount,
  resolveRunDetailFindingsTabCountHonestyLabel,
  RUN_DETAIL_FINDINGS_TAB_COUNT_NOT_STORED,
} from "@/lib/runs/run-detail-findings-tab-badge-count";

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

describe("resolveRunDetailFindingsTabBadgeCount", () => {
  it("prefers explanation headline counts when present", () => {
    expect(resolveRunDetailFindingsTabBadgeCount(9, [baseFinding()])).toBe(9);
  });

  it("falls back to detail snapshot triage counts when explanation count is deferred", () => {
    expect(
      resolveRunDetailFindingsTabBadgeCount(null, [baseFinding(), baseFinding({ findingId: "finding-2", findingOrder: 1 })]),
    ).toBe(2);
  });

  it("returns null when neither explanation nor detail snapshot exposes triage-visible findings", () => {
    expect(resolveRunDetailFindingsTabBadgeCount(null, [])).toBeNull();
    expect(resolveRunDetailFindingsTabBadgeCount(0, [])).toBeNull();
  });

  it("surfaces tab honesty when headline finding count was omitted", () => {
    expect(resolveRunDetailFindingsTabCountHonestyLabel(null, [])).toBe(
      RUN_DETAIL_FINDINGS_TAB_COUNT_NOT_STORED,
    );
    expect(resolveRunDetailFindingsTabCountHonestyLabel(null, [baseFinding()])).toBeNull();
  });

  it("reports findings reviewed only when detail snapshot has triage-visible findings", () => {
    expect(resolveRunDetailFindingsReviewed(null, [baseFinding()])).toBe(true);
    expect(resolveRunDetailFindingsReviewed(5, [])).toBe(false);
  });
});

describe("resolveRunDetailDeferredSurfaceFindingCount", () => {
  it("falls back to detail snapshot triage counts for policy callout and review-package surfaces", () => {
    const findings = [baseFinding(), baseFinding({ findingId: "finding-2", findingOrder: 1 })];

    expect(resolveRunDetailDeferredSurfaceFindingCount(null, findings)).toBe(2);
    expect(resolveRunDetailDeferredSurfaceFindingCount(null, findings)).toBe(
      resolveRunDetailFindingsTabBadgeCount(null, findings),
    );
  });
});

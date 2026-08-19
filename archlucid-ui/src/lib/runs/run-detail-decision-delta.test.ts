import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  RUN_DETAIL_DECISION_DELTA_TOP_N,
  buildRunDetailDecisionDeltaRow,
  resolveRunDetailDecisionDeltaView,
  selectMaterialDecisionDeltaFindings,
  truncateDecisionDeltaMessage,
} from "@/lib/runs/run-detail-decision-delta";

function makeFinding(overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">): QuickDecisionFinding {
  return {
    findingId: overrides.findingId,
    title: overrides.title ?? overrides.findingId,
    recommendation: "",
    severityValue: overrides.severityValue ?? 1,
    findingOrder: overrides.findingOrder ?? 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: overrides.isMuted ?? false,
    muteReason: null,
    enforcementTier: overrides.enforcementTier ?? "Blocking",
    ...overrides,
  };
}

describe("run-detail-decision-delta", () => {
  it("selects top three non-muted findings by severity", () => {
    const findings: QuickDecisionFinding[] = [
      makeFinding({ findingId: "low", severityValue: 0, findingOrder: 1 }),
      makeFinding({ findingId: "critical", severityValue: 3, findingOrder: 2 }),
      makeFinding({ findingId: "muted", severityValue: 3, findingOrder: 3, isMuted: true }),
      makeFinding({ findingId: "high", severityValue: 2, findingOrder: 4 }),
      makeFinding({ findingId: "medium", severityValue: 1, findingOrder: 5 }),
      makeFinding({ findingId: "extra", severityValue: 1, findingOrder: 6 }),
    ];

    const selected = selectMaterialDecisionDeltaFindings(findings);

    expect(selected.map((row) => row.findingId)).toEqual(["critical", "high", "medium"]);
    expect(selected).toHaveLength(RUN_DETAIL_DECISION_DELTA_TOP_N);
  });

  it("excludes disposition-closed findings from material decision delta selection", () => {
    const findings: QuickDecisionFinding[] = [
      makeFinding({
        findingId: "accepted-critical",
        severityValue: 4,
        aiReasoning: {
          wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
          reasoningTrace: "",
        },
      }),
      makeFinding({ findingId: "open-high", severityValue: 2 }),
    ];

    const selected = selectMaterialDecisionDeltaFindings(findings);

    expect(selected.map((row) => row.findingId)).toEqual(["open-high"]);
  });

  it("returns empty message when committed findings are only disposition-closed", () => {
    const view = resolveRunDetailDecisionDeltaView(
      [
        makeFinding({
          findingId: "accepted-critical",
          severityValue: 4,
          aiReasoning: {
            wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
            reasoningTrace: "",
          },
        }),
      ],
      true,
    );

    expect(view?.rows).toEqual([]);
    expect(view?.emptyMessage).toContain("No active findings");
  });

  it("returns null view when review is not committed", () => {
    const view = resolveRunDetailDecisionDeltaView([makeFinding({ findingId: "a" })], false);

    expect(view).toBeNull();
  });

  it("returns empty message when committed with no active findings", () => {
    const view = resolveRunDetailDecisionDeltaView([], true);

    expect(view?.rows).toEqual([]);
    expect(view?.emptyMessage).toContain("No active findings");
  });

  it("builds rows with rule key and evidence anchor hint", () => {
    const row = buildRunDetailDecisionDeltaRow(
      makeFinding({
        findingId: "f-1",
        title: "Encrypt data at rest",
        severityValue: 2,
        policyRuleId: "sec-base-010",
        evidenceRefSnippets: ["storageAccount.bicep:42 — encryption disabled"],
        evidenceRefCount: 2,
      }),
      1,
    );

    expect(row.severityLabel).toBe("High");
    expect(row.policyRuleId).toBe("sec-base-010");
    expect(row.evidenceAnchorHint).toContain("storageAccount.bicep");
    expect(row.trustChipSet.label).toBe("Deterministic rule");
    expect(row.compareDeltaTrustLabels.origin).toBe("Deterministic rule");
  });

  it("truncates long decision delta messages", () => {
    const long = "a".repeat(200);
    const truncated = truncateDecisionDeltaMessage(long);

    expect(truncated.length).toBeLessThanOrEqual(180);
    expect(truncated.endsWith("…")).toBe(true);
  });
});

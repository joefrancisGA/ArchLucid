import { describe, expect, it } from "vitest";

import type { RunDetail } from "@/types/authority";

import { resolveRunDecisionExplainabilityFromDetail } from "./run-decision-explainability-from-detail";

describe("resolveRunDecisionExplainabilityFromDetail", () => {
  it("maps server decisionExplainability into the UI model", () => {
    const detail = {
      decisionExplainability: {
        snapshotIds: {
          contextSnapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        },
        authorityRuleAudit: {
          ruleSetId: "baseline",
          ruleSetVersion: "1.0",
          appliedRuleIds: ["rule-1"],
          acceptedFindingIds: ["finding-1"],
        },
        manifestDecisions: [
          {
            decisionId: "dec-1",
            category: "Security",
            title: "Encrypt data at rest",
            selectedOption: "Required",
            rationale: "Accepted by rule engine.",
            confidence: 82,
            buyerConfidenceSource: "Evidence-backed",
            supportingFindingIds: ["finding-1"],
          },
        ],
        coordinatorDecisionNodes: [
          {
            decisionId: "node-1",
            topic: "TopologyAcceptance",
            rationale: "Topology proposal retained.",
            confidence: 0.74,
          },
        ],
        findingEngineFailures: [
          {
            engineType: "SecurityEngine",
            category: "Security",
            exceptionType: "TimeoutException",
            errorMessage: "timeout",
            durationMs: 1200,
          },
        ],
        manifestHonestyWarnings: ["Degraded finding coverage: one or more finding engines failed."],
      },
    } as RunDetail;

    const model = resolveRunDecisionExplainabilityFromDetail(detail);

    expect(model).not.toBeNull();
    expect(model?.manifestDecisions).toHaveLength(1);
    expect(model?.coordinatorDecisionNodes[0]?.topic).toBe("TopologyAcceptance");
    expect(model?.findingEngineFailures).toHaveLength(1);
    expect(model?.manifestHonestyWarnings).toHaveLength(1);
  });
});

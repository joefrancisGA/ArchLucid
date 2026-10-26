import { describe, expect, it } from "vitest";

import type { RunDetail } from "@/types/authority";

import { resolveRunDecisionExplainabilityFromDetail } from "@/lib/runs/run-decision-explainability-from-detail";

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

  it("keeps coordinator decisions when confidence is missing", () => {
    const detail = {
      decisionExplainability: {
        coordinatorDecisionNodes: [
          {
            decisionId: "node-no-confidence",
            topic: "RetentionPolicy",
            rationale: "Policy retained.",
          },
        ],
      },
    } as RunDetail;

    const model = resolveRunDecisionExplainabilityFromDetail(detail);

    expect(model?.coordinatorDecisionNodes).toHaveLength(1);
    expect(model?.coordinatorDecisionNodes[0]?.confidence).toBeNull();
  });

  it("uses omission copy for absent decision explainability fields", () => {
    const detail = {
      decisionExplainability: {
        manifestDecisions: [
          {
            decisionId: "dec-missing",
            category: "Security",
            selectedOption: "Required",
          },
        ],
        coordinatorDecisionNodes: [
          {
            decisionId: "node-missing",
            confidence: 0.5,
          },
        ],
        findingEngineFailures: [
          {
            engineType: "SecurityEngine",
            category: "Security",
          },
        ],
      },
    } as RunDetail;

    const model = resolveRunDecisionExplainabilityFromDetail(detail);

    expect(model?.manifestDecisions[0]?.title).toBe("Decision title was not stored.");
    expect(model?.manifestDecisions[0]?.pipeline).toBe("Pipeline was not stored.");
    expect(model?.coordinatorDecisionNodes[0]?.topic).toBe("Decision topic was not stored.");
    expect(model?.coordinatorDecisionNodes[0]?.pipeline).toBe("Pipeline was not stored.");
    expect(model?.coordinatorDecisionNodes[0]?.rationale).toBe("Decision rationale was not stored.");
    expect(model?.findingEngineFailures[0]?.exceptionType).toBe("Exception type was not stored.");
    expect(model?.findingEngineFailures[0]?.errorMessage).toBe("Error message was not stored.");
  });

  it("labels omitted decision ids without using unknown", () => {
    const detail = {
      decisionExplainability: {
        manifestDecisions: [{ category: "Security" }],
        coordinatorDecisionNodes: [{ topic: "Topology" }],
      },
    } as RunDetail;

    const model = resolveRunDecisionExplainabilityFromDetail(detail);

    expect(model?.manifestDecisions?.[0]?.decisionId).toBe("Decision id was not stored.");
    expect(model?.coordinatorDecisionNodes?.[0]?.decisionId).toBe("Decision id was not stored.");
  });

  it("distinguishes omitted id lists from stored empty lists on authority audit", () => {
    const detail = {
      decisionExplainability: {
        authorityRuleAudit: {
          ruleSetId: "baseline",
          ruleSetVersion: "1.0",
        },
        manifestDecisions: [],
        coordinatorDecisionNodes: [],
        findingEngineFailures: [],
      },
    } as RunDetail;

    const model = resolveRunDecisionExplainabilityFromDetail(detail);

    expect(model?.authorityRuleAudit?.pipeline).toBe("Pipeline was not stored.");
    expect(model?.authorityRuleAudit?.appliedRuleIds).toBeNull();
    expect(model?.authorityRuleAudit?.acceptedFindingIds).toBeNull();
    expect(model?.manifestDecisions).toEqual([]);
    expect(model?.findingEngineFailures).toEqual([]);
  });

  it("returns null lists when manifest, coordinator, and failure arrays were omitted", () => {
    const detail = {
      decisionExplainability: {
        authorityRuleAudit: {
          ruleSetId: "baseline",
          ruleSetVersion: "1.0",
          appliedRuleIds: [],
          acceptedFindingIds: [],
        },
      },
    } as RunDetail;

    const model = resolveRunDecisionExplainabilityFromDetail(detail);

    expect(model?.manifestDecisions).toBeNull();
    expect(model?.coordinatorDecisionNodes).toBeNull();
    expect(model?.findingEngineFailures).toBeNull();
    expect(model?.authorityRuleAudit?.appliedRuleIds).toEqual([]);
  });
});

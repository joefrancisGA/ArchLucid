import { describe, expect, it } from "vitest";

import { mapFindingInspectApiPayload } from "@/lib/finding-inspect-payload-map";

describe("mapFindingInspectApiPayload", () => {
  it("preserves typed trust fields from the inspect wire model", () => {
    const mapped = mapFindingInspectApiPayload({
      findingId: "f-1",
      typedPayload: null,
      decisionRuleId: "rule-1",
      decisionRuleName: "Rule",
      evidence: [],
      recommendedActions: [],
      auditRowId: null,
      runId: "run-1",
      manifestVersion: null,
      trustLabel: "DeterministicRule",
      trustLabelReason: "Rule fired.",
    });

    expect(mapped.trustLabel).toBe("DeterministicRule");
    expect(mapped.trustLabelReason).toBe("Rule fired.");
  });
});

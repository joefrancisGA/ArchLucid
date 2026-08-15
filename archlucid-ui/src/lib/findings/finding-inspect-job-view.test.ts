import { describe, expect, it } from "vitest";

import { classifyInspectPayloadJobView } from "@/lib/findings/finding-inspect-job-view";
import type { FindingInspectPayload } from "@/types/finding-inspect";

function basePayload(overrides: Partial<FindingInspectPayload> = {}): FindingInspectPayload {
  return {
    findingId: "f-1",
    typedPayload: null,
    decisionRuleId: null,
    decisionRuleName: null,
    evidence: [],
    recommendedActions: [],
    auditRowId: null,
    runId: "run-1",
    manifestVersion: null,
    ...overrides,
  };
}

describe("finding-inspect-job-view", () => {
  it("routes adversarial phrasing to verify-hypotheses", () => {
    const jobView = classifyInspectPayloadJobView(
      basePayload({
        typedPayload: {
          title: "Challenge failover assumption",
          severity: "Warning",
          recommendation: "Adversarial challenge: falsify/confirm with load test evidence.",
        },
        trustLabel: "Heuristic",
        reasoningTrace: "Exploratory challenge only.",
      }),
    );

    expect(jobView).toBe("verify-hypotheses");
  });

  it("routes cannot-determine phrasing to answer-these-questions", () => {
    const jobView = classifyInspectPayloadJobView(
      basePayload({
        typedPayload: {
          title: "RTO unknown",
          severity: "Error",
          recommendation: "Cannot determine recovery objective from intake.",
        },
      }),
    );

    expect(jobView).toBe("answer-these-questions");
  });
});

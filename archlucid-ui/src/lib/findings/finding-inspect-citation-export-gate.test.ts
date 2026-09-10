import { describe, expect, it } from "vitest";

import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  DECISION_GRADE_CITATION_REQUIRED_EXPORT_BLOCKED_REASON,
  resolveFindingInspectCitationExportBlockedReason,
} from "./finding-inspect-citation-export-gate";

function payload(overrides: Partial<FindingInspectPayload> & { typedPayload?: Record<string, unknown> }): FindingInspectPayload {
  return {
    findingId: "finding-1",
    runId: "run-1",
    decisionRuleId: null,
    decisionRuleName: null,
    evidence: [],
    recommendedActions: [],
    auditRowId: "audit-1",
    manifestVersion: "1",
    typedPayload: overrides.typedPayload ?? { classification: "DecisionGradeFinding" },
    ...overrides,
  };
}

describe("resolveFindingInspectCitationExportBlockedReason (FC-39)", () => {
  it("blocks decision-grade inspect without citations", () => {
    expect(
      resolveFindingInspectCitationExportBlockedReason(
        payload({ trustLabel: "EvidenceBacked", evidence: [] }),
      ),
    ).toBe(DECISION_GRADE_CITATION_REQUIRED_EXPORT_BLOCKED_REASON);
  });

  it("allows decision-grade inspect when evidence citations exist", () => {
    expect(
      resolveFindingInspectCitationExportBlockedReason(
        payload({
          evidence: [{ artifactId: "graph-node-1", excerpt: "Public subnet exposure." }],
        }),
      ),
    ).toBeNull();
  });

  it("allows deterministic rule findings without graph citations", () => {
    expect(
      resolveFindingInspectCitationExportBlockedReason(
        payload({
          decisionRuleId: "rule-1",
          trustLabel: "DeterministicRule",
          typedPayload: { classification: "DecisionGradeFinding" },
        }),
      ),
    ).toBeNull();
  });
});

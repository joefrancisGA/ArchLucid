import { describe, expect, it } from "vitest";

import { getDecisionGradeFindingProvenanceViolations } from "./decision-grade-finding-provenance-validator";

describe("getDecisionGradeFindingProvenanceViolations (FC-38)", () => {
  it("exempts checklist coverage findings", () => {
    const violations = getDecisionGradeFindingProvenanceViolations({
      findings: [
        {
          findingId: "check-1",
          findingType: "Hygiene",
          classification: "ChecklistCoverage",
        },
      ],
    });

    expect(violations).toHaveLength(0);
  });

  it("requires agent citation provenance", () => {
    const violations = getDecisionGradeFindingProvenanceViolations({
      findings: [
        {
          findingId: "agent-1",
          findingType: "AgentArchitectureFinding-Compliance",
          classification: "DecisionGradeFinding",
          trace: { citations: [] },
        },
      ],
    });

    expect(violations).toContain(
      "Finding 'agent-1' (AgentArchitectureFinding-Compliance) lacks agent citation provenance.",
    );
  });

  it("allows typed engine findings with nodes and rules", () => {
    const violations = getDecisionGradeFindingProvenanceViolations({
      findings: [
        {
          findingId: "engine-1",
          findingType: "TopologyGap",
          classification: "DecisionGradeFinding",
          relatedNodeIds: ["node-1"],
          trace: { rulesApplied: ["topology-gap-rule"] },
        },
      ],
    });

    expect(violations).toHaveLength(0);
  });

  it("blocks decision-grade findings without typed-engine provenance", () => {
    const violations = getDecisionGradeFindingProvenanceViolations({
      findings: [
        {
          findingId: "finding-1",
          findingType: "PolicyViolation",
          classification: "DecisionGradeFinding",
        },
      ],
    });

    expect(violations).toContain("Finding 'finding-1' (PolicyViolation) lacks typed-engine provenance.");
  });
});

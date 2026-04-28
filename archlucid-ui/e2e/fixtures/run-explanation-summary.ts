import type { RunExplanationSummary } from "@/types/explanation";

/** Minimal aggregate explanation for E2E mock API (run detail page). */
export function fixtureRunExplanationSummary(): RunExplanationSummary {
  return {
    explanation: {
      rawText: "{}",
      structured: {
        schemaVersion: 1,
        reasoning: "Scenario narrative.",
        evidenceRefs: [],
        confidence: 0.85,
      },
      confidence: 0.85,
      provenance: {
        agentType: "run-explanation",
        modelId: "e2e-mock",
        promptTemplateId: "explain-run-fixture",
        promptTemplateVersion: "v1",
        promptContentHash: null,
      },
      summary: "Executive summary for Claims Intake Modernization — modernization path with bounded risks.",
      keyDrivers: ["Member experience parity across channels", "Auditability of intake flows", "Throughput under peak loads"],
      riskImplications: ["No unresolved issues recorded."],
      costImplications: ["Max monthly cost not specified."],
      complianceImplications: ["No compliance gaps listed."],
      detailedNarrative:
        "Architecture review narrative: stable modernization path with explicit decisions, surfaced risks, " +
        "and evidence-backed recommendations aligned to claims intake.",
    },
    themeSummaries: ["Intake experience", "Platform integration", "Compliance posture"],

    overallAssessment:
      "Modernization preserves core intake guarantees while improving throughput and downstream traceability.",
    riskPosture: "Low",
    findingCount: 0,
    decisionCount: 1,
    unresolvedIssueCount: 0,
    complianceGapCount: 0,
    citations: [],
  };
}

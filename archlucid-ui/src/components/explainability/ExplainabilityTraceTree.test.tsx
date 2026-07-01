import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExplainabilityTraceTree, EXPLAINABILITY_TRACE_EVIDENCE_EMPTY_COPY } from "@/components/explainability/ExplainabilityTraceTree";
import type { FindingExplainability } from "@/types/explanation";

const sample: FindingExplainability = {
  findingId: "f-1",
  title: "Test finding",
  engineType: "Policy",
  severity: "High",
  traceCompletenessRatio: 0.75,
  graphNodeIdsExamined: ["n1"],
  rulesApplied: ["pack.rule.network"],
  decisionsTaken: ["Require private endpoint for storage account."],
  alternativePathsConsidered: [],
  notes: [],
  confidenceLevel: "High",
  evidence: {
    evidenceRefs: ["evidence://topology/node-1"],
    conclusion: "Policy breach on node n1.",
    alternativePathsConsidered: [],
    ruleId: "pack.rule.network",
  },
  narrativeText: "Narrative body.",
};

describe("ExplainabilityTraceTree", () => {
  it("renders decision and collapsible trace sections", () => {
    render(<ExplainabilityTraceTree data={sample} />);

    expect(screen.getByTestId("explainability-trace-tree")).toBeInTheDocument();
    expect(screen.getByText("Require private endpoint for storage account.")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-rules")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-confidence")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("explains heuristic vs evidence-backed findings when evidence references are empty (TB-514)", () => {
    const withoutEvidenceRefs: FindingExplainability = {
      ...sample,
      evidence: {
        ...sample.evidence!,
        evidenceRefs: [],
      },
    };

    render(<ExplainabilityTraceTree data={withoutEvidenceRefs} />);

    expect(screen.getByText(EXPLAINABILITY_TRACE_EVIDENCE_EMPTY_COPY)).toBeInTheDocument();
    expect(screen.queryByText(/^No evidence references recorded\.$/)).not.toBeInTheDocument();
  });
});

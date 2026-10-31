import { fireEvent, render, screen } from "@testing-library/react";
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
  it("does not claim a complete trace when missingTraceFields was omitted", () => {
    render(
      <ExplainabilityTraceTree
        data={{
          ...sample,
          missingTraceFields: null,
        }}
      />,
    );

    expect(screen.getByText(/Reasoning trace fields were not stored\./)).toBeInTheDocument();
  });

  it("renders decision and collapsible trace sections", () => {
    render(<ExplainabilityTraceTree data={sample} />);

    expect(screen.getByTestId("explainability-trace-tree")).toBeInTheDocument();
    expect(screen.getByText("Require private endpoint for storage account.")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-rules")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-confidence")).toBeInTheDocument();
    expect(screen.getByText("High confidence")).toBeInTheDocument();
  });

  it("explains the confidence bucket from evidence count and missing trace dimensions", () => {
    const lowConfidence: FindingExplainability = {
      ...sample,
      confidenceLevel: "Low",
      missingTraceFields: ["alternativePathsConsidered", "notes"],
    };

    render(<ExplainabilityTraceTree data={lowConfidence} />);

    expect(screen.getByText(/only one supporting source was identified/)).toBeInTheDocument();
    expect(screen.getByText(/2 parts of the reasoning trace were left empty/)).toBeInTheDocument();
  });

  it("summarizes how many sources back the finding", () => {
    render(<ExplainabilityTraceTree data={sample} />);

    expect(screen.getByText("1 evidence reference was stored.")).toBeInTheDocument();
  });

  it("distinguishes omitted evidence from an empty evidence list", () => {
    const withoutEvidenceObject: FindingExplainability = {
      ...sample,
      evidence: undefined,
    };

    render(<ExplainabilityTraceTree data={withoutEvidenceObject} />);

    expect(screen.getByText("Sources were not stored for this finding.")).toBeInTheDocument();
    expect(screen.queryByText(EXPLAINABILITY_TRACE_EVIDENCE_EMPTY_COPY)).not.toBeInTheDocument();
    expect(screen.getByText(/supporting sources were not stored/)).toBeInTheDocument();
  });

  it("states when evidence references were stored empty without heuristic copy (P-01)", () => {
    const withoutEvidenceRefs: FindingExplainability = {
      ...sample,
      evidence: {
        ...sample.evidence!,
        evidenceRefs: [],
      },
    };

    render(<ExplainabilityTraceTree data={withoutEvidenceRefs} />);

    expect(screen.getByText(EXPLAINABILITY_TRACE_EVIDENCE_EMPTY_COPY)).toBeInTheDocument();
    expect(screen.queryByText(/Heuristic/i)).not.toBeInTheDocument();
  });

  it("does not promote conclusion into decision or ruleId into rules applied (P-02, P-03)", () => {
    const conclusionOnly: FindingExplainability = {
      ...sample,
      decisionsTaken: [],
      rulesApplied: [],
      evidence: {
        ...sample.evidence!,
        conclusion: "Policy breach on node n1.",
        ruleId: "pack.rule.network",
      },
    };

    render(<ExplainabilityTraceTree data={conclusionOnly} />);

    expect(screen.getByText("Decision text was not stored.")).toBeInTheDocument();
    expect(screen.getByTestId("explainability-trace-conclusion")).toHaveTextContent("Policy breach on node n1.");
    fireEvent.click(screen.getByTestId("explainability-trace-rules"));
    expect(screen.getByText("Rules applied were not stored.")).toBeInTheDocument();
    expect(screen.queryByText("pack.rule.network")).not.toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingExplainabilityDialog } from "@/components/findings/FindingExplainabilityDialog";
import * as api from "@/lib/api";
import type { FindingExplainability } from "@/types/explanation";

vi.mock("@/components/findings/FindingEvidenceGraphLazy", () => ({
  FindingEvidenceGraph: () => <div data-testid="finding-evidence-graph">Evidence graph mock</div>,
}));

describe("FindingExplainabilityDialog", () => {
  it("loads explainability when opened with a finding id", async () => {
    const sample: FindingExplainability = {
      findingId: "f-1",
      title: "Test finding",
      engineType: "Policy",
      severity: "High",
      traceCompletenessRatio: 0.75,
      graphNodeIdsExamined: ["n1"],
      rulesApplied: ["r1"],
      decisionsTaken: ["d1"],
      alternativePathsConsidered: [],
      notes: [],
      evidence: {
        evidenceRefs: ["n1"],
        conclusion: "Policy breach on node n1.",
        alternativePathsConsidered: [],
        ruleId: "r1",
      },
      narrativeText: "Narrative body.",
    };

    const spy = vi.spyOn(api, "getFindingExplainability").mockResolvedValue(sample);
    vi.spyOn(api, "getFindingLlmAudit").mockResolvedValue({
      traceId: "t1",
      agentType: "Topology",
      systemPromptRedacted: "",
      userPromptRedacted: "",
      rawResponseRedacted: "",
      redactionCountsByCategory: {},
    });

    render(
      <FindingExplainabilityDialog open={true} onOpenChange={() => {}} runId="run-a" findingId="f-1" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Test finding")).toBeInTheDocument();
    });

    expect(screen.getByTestId("explainability-trace-tree")).toBeInTheDocument();
    expect(screen.getByTestId("finding-evidence-graph")).toBeInTheDocument();

    expect(screen.getAllByText(/Narrative body\./)[0]).toBeInTheDocument();
    expect(screen.getByText("Structured evidence")).toBeInTheDocument();
    expect(screen.getByText("Policy breach on node n1.")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("run-a", "f-1");
    spy.mockRestore();
  });

  it("shows API problem when fetch fails", async () => {
    vi.spyOn(api, "getFindingExplainability").mockRejectedValue(new Error("boom"));
    vi.spyOn(api, "getFindingLlmAudit").mockResolvedValue({
      traceId: "t1",
      agentType: "Topology",
      systemPromptRedacted: "",
      userPromptRedacted: "",
      rawResponseRedacted: "",
      redactionCountsByCategory: {},
    });

    render(
      <FindingExplainabilityDialog open={true} onOpenChange={() => {}} runId="run-a" findingId="f-1" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });

    vi.restoreAllMocks();
  });

});

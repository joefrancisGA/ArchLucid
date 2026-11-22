import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingExplainabilityDialog } from "@/components/findings/FindingExplainabilityDialog";
import * as api from "@/lib/api";
import type { FindingExplainability } from "@/types/explanation";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/lib/findings/finding-explainability-technical-disclosure-url", () => ({
  parseFindingExplainabilityTechnicalOpenFromSearch: () => true,
  findingExplainabilityTechnicalDisclosureHrefFromSearch: () => "/",
}));

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

  it("keeps the new finding visible when a previous request finishes late", async () => {
    function explanation(findingId: string, title: string): FindingExplainability {
      return {
        findingId, title, engineType: "Policy", severity: "High",
        graphNodeIdsExamined: [], rulesApplied: [], decisionsTaken: [],
        alternativePathsConsidered: [], notes: [],
        traceCompletenessRatio: 0.75,
        evidence: { evidenceRefs: [], conclusion: "Synthetic evidence.", alternativePathsConsidered: [], ruleId: "r1" },
        narrativeText: "Synthetic narrative.",
      };
    }
    let resolveOld!: (value: FindingExplainability) => void;
    const oldRequest = new Promise<FindingExplainability>((resolve) => { resolveOld = resolve; });
    const fetchExplanation = vi.spyOn(api, "getFindingExplainability");
    fetchExplanation.mockReturnValueOnce(oldRequest);
    fetchExplanation.mockResolvedValueOnce(explanation("f-2", "Current finding"));

    const { rerender } = render(
      <FindingExplainabilityDialog open onOpenChange={() => {}} runId="run-a" findingId="f-1" />,
    );
    expect(fetchExplanation).toHaveBeenCalledWith("run-a", "f-1");
    rerender(<FindingExplainabilityDialog open={false} onOpenChange={() => {}} runId="run-a" findingId={null} />);
    rerender(<FindingExplainabilityDialog open onOpenChange={() => {}} runId="run-a" findingId="f-2" />);
    expect(await screen.findByText("Current finding")).toBeInTheDocument();

    await act(async () => { resolveOld(explanation("f-1", "Previous finding")); });

    expect(screen.getByText("Current finding")).toBeInTheDocument();
    expect(screen.queryByText("Previous finding")).not.toBeInTheDocument();
    fetchExplanation.mockRestore();
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

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => true,
}));

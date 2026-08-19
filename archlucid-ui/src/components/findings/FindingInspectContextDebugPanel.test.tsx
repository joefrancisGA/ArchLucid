import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectContextDebugPanel } from "@/components/findings/FindingInspectContextDebugPanel";
import type { FindingInspectPayload } from "@/types/finding-inspect";

vi.mock("@/lib/api/finding-provenance", () => ({
  getFindingProvenance: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getFindingLlmAudit: vi.fn(),
}));

import { getFindingProvenance } from "@/lib/api/finding-provenance";
import { getFindingLlmAudit } from "@/lib/api";

const inspectPayload: FindingInspectPayload = {
  findingId: "sensitive-data-minimization-risk",
  typedPayload: null,
  decisionRuleId: "phi.minimization.intake",
  decisionRuleName: "PHI minimization at intake",
  evidence: [
    {
      artifactId: "ingress-classifier-spec",
      lineRange: "28-41",
      excerpt: "Ingress PHI classification rules applied before adapter handoff.",
    },
  ],
  recommendedActions: [],
  auditRowId: null,
  runId: "customer-intake-modernization",
  manifestVersion: "v1",
};

describe("FindingInspectContextDebugPanel", () => {
  it("renders collapsed by default", () => {
    render(
      <FindingInspectContextDebugPanel
        runId="customer-intake-modernization"
        findingId="sensitive-data-minimization-risk"
        inspectPayload={inspectPayload}
      />,
    );

    expect(screen.getByTestId("finding-inspect-context-debug-panel")).toBeInTheDocument();
    expect(screen.queryByText(/Ingress PHI classification rules/i)).not.toBeInTheDocument();
  });

  it("loads provenance and shows raw context blocks when enabled", async () => {
    vi.mocked(getFindingProvenance).mockResolvedValue({
      findingId: "sensitive-data-minimization-risk",
      steps: [
        {
          kind: "evidence",
          label: "Data flow identified",
          detail: "Patient demographics field detected in claims payload.",
        },
      ],
    });
    vi.mocked(getFindingLlmAudit).mockResolvedValue({
      traceId: "trace-1",
      agentType: "Compliance",
      systemPromptRedacted: "",
      userPromptRedacted: "Evaluate graph against policy pack.",
      rawResponseRedacted: "",
      modelDeploymentName: "gpt-4o",
      redactionCountsByCategory: {},
    });

    render(
      <FindingInspectContextDebugPanel
        runId="customer-intake-modernization"
        findingId="sensitive-data-minimization-risk"
        inspectPayload={inspectPayload}
      />,
    );

    fireEvent.click(screen.getByLabelText("Evidence trace detail"));

    await waitFor(() => {
      expect(getFindingProvenance).toHaveBeenCalledWith("customer-intake-modernization", "sensitive-data-minimization-risk");
    });

    expect(await screen.findByText(/Ingress PHI classification rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient demographics field detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluate graph against policy pack/i)).toBeInTheDocument();
  });
});

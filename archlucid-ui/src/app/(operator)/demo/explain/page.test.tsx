import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getDemoExplain: vi.fn(),
}));

vi.mock("@/components/OperatorApiProblem", () => ({
  OperatorApiProblem: ({ fallbackMessage }: { fallbackMessage: string }) => (
    <div data-testid="api-problem-mock">{fallbackMessage}</div>
  ),
}));

import { getDemoExplain } from "@/lib/api";
import type { DemoExplainResponse } from "@/types/demo-explain";

import DemoExplainPage from "./page";

const demoExplainMock = vi.mocked(getDemoExplain);

const fixedPayload: DemoExplainResponse = {
  generatedUtc: "2026-04-20T12:00:00.000Z",
  runId: "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
  manifestVersion: "v3",
  isDemoData: true,
  demoStatusMessage: "demo tenant — replace before publishing",
  runExplanation: {
    explanation: {
      rawText: "raw",
      structured: null,
      confidence: null,
      provenance: null,
      summary: "Summary",
      keyDrivers: [],
      riskImplications: [],
      costImplications: [],
      complianceImplications: [],
      detailedNarrative: "Narrative.",
    },
    themeSummaries: ["Theme A", "Theme B"],
    overallAssessment: "Healthy baseline with two open mediums.",
    riskPosture: "Moderate",
    findingCount: 6,
    decisionCount: 4,
    unresolvedIssueCount: 1,
    complianceGapCount: 0,
    citations: [
      { kind: "Manifest" as const, id: "m-1", label: "contoso-baseline-v1" },
      { kind: "Finding" as const, id: "f-1", label: "Public storage" },
    ],
  },
  provenanceGraph: {
    nodes: [
      { id: "n-run", label: "Run baseline", type: "Run" },
      { id: "n-manifest", label: "Golden manifest v3", type: "Manifest" },
      { id: "n-finding", label: "Public storage", type: "Finding" },
    ],
    edges: [
      { source: "n-run", target: "n-manifest", type: "Produced" },
      { source: "n-manifest", target: "n-finding", type: "Surfaced" },
    ],
    nodeCount: 3,
    edgeCount: 2,
    isEmpty: false,
  },
};

describe("DemoExplainPage (proof page snapshot)", () => {
  it("renders the side-by-side provenance + explanation layout for the demo tenant", async () => {
    demoExplainMock.mockResolvedValue(fixedPayload);

    const { container } = render(<DemoExplainPage />);

    await waitFor(() => {
      expect(screen.getByTestId("demo-explain-status-banner")).toHaveTextContent(
        "demo tenant — replace before publishing",
      );
      expect(screen.getByTestId("demo-explain-provenance-graph-nodes")).toHaveTextContent(
        "Run baseline",
      );
      expect(screen.getByTestId("demo-explain-citations")).toHaveTextContent("contoso-baseline-v1");
    });

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders the not-available notice when the API responds 404 (Demo:Enabled=false or no committed run)", async () => {
    demoExplainMock.mockResolvedValue(null);

    render(<DemoExplainPage />);

    await waitFor(() => {
      expect(screen.getByTestId("demo-explain-not-available")).toHaveTextContent(
        "No committed demo-seed run is available on this host",
      );
    });

    expect(screen.queryByTestId("demo-explain-status-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("demo-explain-provenance-graph")).not.toBeInTheDocument();
  });

  it("renders the API problem callout when the upstream call rejects", async () => {
    demoExplainMock.mockRejectedValue(new Error("explain failed"));

    render(<DemoExplainPage />);

    await waitFor(() => {
      expect(screen.getByTestId("api-problem-mock")).toHaveTextContent("explain failed");
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getDemoExplain: vi.fn(),
}));

vi.mock("@/lib/demo-explain-route-gate", () => ({
  shouldRedirectDemoExplainFromBuyerShell: vi.fn(() => false),
  getDemoExplainBuyerShellRedirectHref: vi.fn(() => "/see-it"),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isOperatorExperienceFullShellEnv: vi.fn(() => false),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/demo/explain",
  });
});

vi.mock("@/components/OperatorApiProblem", () => ({
  OperatorApiProblem: ({ fallbackMessage }: { fallbackMessage: string }) => (
    <div data-testid="api-problem-mock">{fallbackMessage}</div>
  ),
}));

import { getDemoExplain } from "@/lib/api";
import {
  getDemoExplainBuyerShellRedirectHref,
  shouldRedirectDemoExplainFromBuyerShell,
} from "@/lib/demo-explain-route-gate";
import type { DemoExplainResponse } from "@/types/demo-explain";

import DemoExplainPage from "./page";
import { redirect } from "next/navigation";

const demoExplainMock = vi.mocked(getDemoExplain);
const shouldRedirectMock = vi.mocked(shouldRedirectDemoExplainFromBuyerShell);
const redirectHrefMock = vi.mocked(getDemoExplainBuyerShellRedirectHref);
const redirectMock = vi.mocked(redirect);

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
      { id: "n-run", label: "Review baseline", type: "Review" },
      { id: "n-manifest", label: "Signed review record v3", type: "Manifest" },
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
  it("TB-1322: redirects buyer-polished shells to /see-it", async () => {
    shouldRedirectMock.mockReturnValueOnce(true);
    redirectHrefMock.mockReturnValueOnce("/see-it");
    redirectMock.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(DemoExplainPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/see-it");
    expect(demoExplainMock).not.toHaveBeenCalled();
  });

  it("renders the side-by-side provenance + explanation layout for the demo tenant", async () => {
    demoExplainMock.mockResolvedValue(fixedPayload);

    const page = await DemoExplainPage();
    const { container } = render(page);

    await waitFor(() => {
      const summary = screen.getByTestId("demo-explain-status-banner-summary");

      expect(summary).toHaveTextContent("demo tenant — replace before publishing");
      expect(summary.textContent).not.toContain(fixedPayload.runId);
      expect(summary.textContent).not.toContain("2026-04-20T12:00:00.000Z");
      expect(screen.getByTestId("demo-explain-evidence-trail-heading")).toHaveTextContent("Evidence trail");
      expect(screen.getByTestId("demo-explain-explanation-heading")).toHaveTextContent("Explanation & citations");
      expect(screen.getByTestId("demo-explain-provenance-graph-nodes")).toHaveTextContent("Review baseline");
      expect(screen.getByTestId("demo-explain-citations")).toHaveTextContent("contoso-baseline-v1");
      expect(screen.queryByText(/Provenance graph/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/re-seed the demo/i)).not.toBeInTheDocument();
    });

    expect(container.firstChild).toMatchSnapshot();
  });

  it("TB-1321: renders proof ladder when demo explain is not available", async () => {
    demoExplainMock.mockResolvedValue(null);

    const page = await DemoExplainPage();
    render(page);

    await waitFor(() => {
      expect(screen.getByTestId("demo-explain-not-available-title")).toBeInTheDocument();
      expect(screen.getByTestId("demo-explain-next-step-ladder")).toBeInTheDocument();
      expect(screen.getByTestId("demo-explain-ladder-primary")).toHaveAttribute("href", "/see-it");
    });

    expect(screen.queryByTestId("demo-explain-status-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("demo-explain-provenance-graph")).not.toBeInTheDocument();
    expect(screen.queryByText(/re-seed/i)).not.toBeInTheDocument();
  });

  it("renders the API problem callout when the upstream call rejects", async () => {
    demoExplainMock.mockRejectedValue(new Error("explain failed"));

    const page = await DemoExplainPage();
    render(page);

    await waitFor(() => {
      expect(screen.getByTestId("api-problem-mock")).toHaveTextContent("explain failed");
    });
  });
});

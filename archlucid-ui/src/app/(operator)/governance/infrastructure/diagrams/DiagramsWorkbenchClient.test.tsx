import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
} from "@/lib/governance/governance-infrastructure-copy";
import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";

const {
  fetchInfraEvidenceSnapshotsMock,
  downloadInfraEvidenceMermaidPngMock,
  fetchInfraEvidenceMermaidRenderMock,
} = vi.hoisted(() => ({
  fetchInfraEvidenceSnapshotsMock: vi.fn(),
  downloadInfraEvidenceMermaidPngMock: vi.fn(),
  fetchInfraEvidenceMermaidRenderMock: vi.fn(),
}));

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/diagrams",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-tenant-branding-presentation-query", () => ({
  useTenantBrandingPresentationQuery: () => ({ data: null }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: fetchInfraEvidenceSnapshotsMock,
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-mermaid-api", () => ({
  fetchInfraEvidenceMermaidPreview: vi.fn(async () => ({
    snapshotId: "11111111-1111-1111-1111-111111111111",
    modes: [
      {
        mode: "executive",
        status: "Partitioned",
        nodeCount: 500,
        edgeCount: 900,
        mermaid: null,
        fallbackArtifacts: [
          {
            key: "executive",
            label: "Executive (executive)",
            status: "Succeeded",
            nodeCount: 120,
            edgeCount: 180,
          },
          {
            key: "network",
            label: "Network (network)",
            status: "Succeeded",
            nodeCount: 90,
            edgeCount: 140,
          },
        ],
      },
    ],
  })),
  fetchInfraEvidenceMermaidRender: fetchInfraEvidenceMermaidRenderMock,
  downloadInfraEvidenceMermaidPng: downloadInfraEvidenceMermaidPngMock,
  formatInfraEvidenceMermaidApiError: (error: unknown) => String(error),
}));

vi.mock("@/components/architecture/ArchitectureDiagramViewer", () => ({
  ArchitectureDiagramViewer: () => <div data-testid="architecture-diagram-viewer-mock" />,
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Diagrams",
      useWhen: "Render inventory diagrams",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

const defaultSnapshotsResponse = {
  items: [
    {
      snapshotId: "11111111-1111-1111-1111-111111111111",
      subscriptionId: "sub-1",
      subscriptionName: "Prod",
      capturedUtc: "2026-09-01T12:00:00Z",
      captureStatus: 1,
      resourceCount: 500,
      relationshipCount: 120,
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 50,
  hasMore: false,
};

describe("DiagramsWorkbenchClient", () => {
  beforeEach(() => {
    fetchInfraEvidenceSnapshotsMock.mockReset();
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue(defaultSnapshotsResponse);
    downloadInfraEvidenceMermaidPngMock.mockReset();
    downloadInfraEvidenceMermaidPngMock.mockResolvedValue({ usedBrowserFallback: false });
    fetchInfraEvidenceMermaidRenderMock.mockReset();
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: query.mode === "dependencyNeighborhood" ? "Succeeded" : "Partitioned",
      mermaid: "flowchart LR\n  A-->B",
      metrics:
        query.mode === "dependencyNeighborhood"
          ? {
              nodeCount: 3,
              edgeCount: 2,
              subgraphCount: 0,
              maxDegree: 2,
              crossSubgraphEdgeCount: 0,
              textSizeBytes: 1200,
              layoutEstimate: 800,
            }
          : {
              nodeCount: 500,
              edgeCount: 900,
              subgraphCount: 12,
              maxDegree: 20,
              crossSubgraphEdgeCount: 40,
              textSizeBytes: 12000,
              layoutEstimate: 8000,
            },
      fallbackArtifacts: [
        {
          key: "executive",
          label: "Executive (executive)",
          status: "Succeeded",
          nodeCount: 120,
          edgeCount: 180,
        },
        {
          key: "network",
          label: "Network (network)",
          status: "Succeeded",
          nodeCount: 90,
          edgeCount: 140,
        },
      ],
    }));
  });

  it("renders snapshot picker and partitioned fallback cards", async () => {
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    const primaryContent = await screen.findByTestId("infra-diagrams-primary-content");
    expect(primaryContent.className).not.toMatch(/mx-auto/);
    expect(primaryContent).toHaveClass("w-full");
    expect(await screen.findByTestId("infra-diagrams-snapshot-picker")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-fallback-cards")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-fallback-executive")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-fallback-network")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-export-png")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-open-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?snapshotId=11111111-1111-1111-1111-111111111111&tab=diagram",
    );
    expect(await screen.findByTestId("infra-diagrams-render-status-strip")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-snapshot-id-readout")).toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("shows resource scope banner and scoped Ask link when cloudResourceId is in the URL", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-resource-scope-banner")).toHaveTextContent(
      "22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-diagrams-open-primary-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=diagram&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("link", { name: "View diagram correspondence in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-open-diagram-reconcile")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagram-reconcile?snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-diagrams-open-terraform-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=terraform&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-diagrams-open-findings-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=findings&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-diagrams-open-remediation-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=remediation&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-diagrams-open-drift-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=drift&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-diagrams-open-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111&tab=diagram",
    );
  });

  it("omits UUID subscription ids from snapshot picker labels", async () => {
    const subscriptionId = "0966098b-4d6c-4f09-af1b-965bc2a2ad1d";
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue({
      items: [
        {
          snapshotId: "11111111-1111-1111-1111-111111111111",
          subscriptionId,
          subscriptionName: null,
          capturedUtc: "2026-09-01T12:00:00Z",
          captureStatus: 1,
          resourceCount: 889,
          relationshipCount: 120,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    const picker = await screen.findByTestId("infra-diagrams-snapshot-picker");
    expect(picker).toHaveTextContent("889 resources");
    expect(picker).not.toHaveTextContent(subscriptionId);
  });

  it("opens dependency neighborhood drill-down when seed node is in the URL", async () => {
    const armId = "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway";
    searchParams = new URLSearchParams(
      `snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&mermaidMode=dependencyNeighborhood&seedNodeId=${encodeURIComponent(armId)}`,
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-seed-node-input")).toHaveValue(armId);
    expect(screen.getByTestId("infra-diagrams-mode-picker")).toHaveValue("dependencyNeighborhood");
    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-open-ask")).toHaveAttribute(
      "href",
      `/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111&seedNodeId=${encodeURIComponent(armId)}&tab=diagram`,
    );
  });

  it("requires a seed before rendering dependency neighborhood mode", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-dependency-seed-prompt")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();
    expect(fetchInfraEvidenceMermaidRenderMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mode: "dependencyNeighborhood" }),
    );
  });

  it("shows a modal when Focus neighborhood is clicked without a seed", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood",
    );
    render(<DiagramsWorkbenchClient />);

    fireEvent.change(await screen.findByTestId("infra-diagrams-seed-node-input"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Focus neighborhood" }));

    expect(await screen.findByTestId("infra-diagrams-dependency-seed-blocked-dialog")).toHaveTextContent(
      "Pick a seed resource before rendering",
    );
  });

  it("shows a modal when the applied seed produces an empty neighborhood", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "dependencyNeighborhood",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "",
      metrics: {
        nodeCount: 0,
        edgeCount: 0,
        subgraphCount: 0,
        maxDegree: 0,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 0,
        layoutEstimate: 0,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood&seedNodeId=bad-seed",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-dependency-seed-blocked-dialog")).toHaveTextContent(
      "Seed did not match this snapshot",
    );
  });

  it("shows honest empty content when render succeeds with no drawable nodes", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "network",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "",
      metrics: {
        nodeCount: 0,
        edgeCount: 0,
        subgraphCount: 0,
        maxDegree: 0,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 0,
        layoutEstimate: 0,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=network",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-empty-content")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE,
    );
    expect(screen.getByTestId("infra-diagrams-empty-content")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY,
    );
    expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();
    expect(screen.queryByText(/graph is too large/i)).not.toBeInTheDocument();
  });

  it("shows deep-linked missing snapshot status and suppresses render strip", async () => {
    searchParams = new URLSearchParams("snapshotId=99999999-9999-9999-9999-999999999999");
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-snapshot-deep-link-missing")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-fallback-cards")).not.toBeInTheDocument();
  });

  it("shows an inline error instead of a toast when PNG export fails without a browser fallback", async () => {
    const exportError = new Error("Request validation failed (HTTP 400): Snapshot missing.");
    downloadInfraEvidenceMermaidPngMock.mockRejectedValueOnce(exportError);

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DiagramsWorkbenchClient />);

    fireEvent.click(await screen.findByTestId("infra-diagrams-export-png"));

    expect(await screen.findByTestId("infra-diagrams-png-export-error")).toHaveTextContent(
      "Could not download diagram PNG",
    );
    expect(screen.queryByTestId("infra-diagrams-png-browser-fallback-note")).not.toBeInTheDocument();
    expect(screen.queryByText("The governance change did not save.")).not.toBeInTheDocument();
  });

  it("shows a browser fallback note when server PNG is unavailable but export succeeds in-browser", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  A-->B",
      metrics: {
        nodeCount: 11,
        edgeCount: 10,
        subgraphCount: 0,
        maxDegree: 3,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 1200,
        layoutEstimate: 800,
      },
      fallbackArtifacts: [],
    }));
    downloadInfraEvidenceMermaidPngMock.mockResolvedValueOnce({ usedBrowserFallback: true });

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DiagramsWorkbenchClient />);

    fireEvent.click(await screen.findByTestId("infra-diagrams-export-png"));

    expect(await screen.findByTestId("infra-diagrams-png-browser-fallback-note")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-png-export-error")).not.toBeInTheDocument();
  });

  it("does not refetch network mode after a partition fallback succeeds", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => {
      const fallbackKey = query.fallbackKey ?? null;
      const isFallback = fallbackKey != null && fallbackKey.length > 0;

      return {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        mode: isFallback ? fallbackKey : (query.mode ?? "executive"),
        fallbackKey,
        status: isFallback ? "Succeeded" : query.mode === "network" ? "Partitioned" : "Succeeded",
        mermaid: "flowchart LR\n  A-->B",
        metrics: {
          nodeCount: isFallback ? 40 : query.mode === "network" ? 500 : 11,
          edgeCount: isFallback ? 55 : query.mode === "network" ? 900 : 10,
          subgraphCount: isFallback ? 2 : query.mode === "network" ? 12 : 0,
          maxDegree: 3,
          crossSubgraphEdgeCount: isFallback ? 1 : query.mode === "network" ? 40 : 0,
          textSizeBytes: 1200,
          layoutEstimate: 800,
        },
        fallbackArtifacts: isFallback || query.mode === "network"
          ? [
              {
                key: "executive",
                label: "Executive (executive)",
                status: "Succeeded",
                nodeCount: 40,
                edgeCount: 55,
              },
              {
                key: "network",
                label: "Network (network)",
                status: "Succeeded",
                nodeCount: 90,
                edgeCount: 140,
              },
            ]
          : [],
      };
    });

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DiagramsWorkbenchClient />);

    fireEvent.change(await screen.findByTestId("infra-diagrams-mode-picker"), {
      target: { value: "network" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("infra-diagrams-fallback-cards")).toBeInTheDocument();
    });

    await waitFor(() => {
      const fallbackCalls = fetchInfraEvidenceMermaidRenderMock.mock.calls.filter(
        (call) => call[1]?.fallbackKey === "executive",
      );
      expect(fallbackCalls.length).toBe(1);
    });

    const settledCallCount = fetchInfraEvidenceMermaidRenderMock.mock.calls.length;

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 75);
      });
    });

    expect(fetchInfraEvidenceMermaidRenderMock.mock.calls.length).toBe(settledCallCount);
    expect(
      fetchInfraEvidenceMermaidRenderMock.mock.calls.filter((call) => call[1]?.mode === "network").length,
    ).toBe(1);
    expect(screen.getByTestId("infra-diagrams-fallback-cards")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";

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
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
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
  })),
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
  fetchInfraEvidenceMermaidRender: vi.fn(async (_snapshotId, query) => ({
    snapshotId: "11111111-1111-1111-1111-111111111111",
    mode: query.mode ?? "executive",
    fallbackKey: query.fallbackKey ?? null,
    status: query.mode === "dependencyNeighborhood" ? "Succeeded" : "Partitioned",
    mermaid: "flowchart LR\n  A-->B",
    metrics: {
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
  })),
  downloadInfraEvidenceMermaidPng: vi.fn(async () => undefined),
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

describe("DiagramsWorkbenchClient", () => {
  it("renders snapshot picker and partitioned fallback cards", async () => {
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-snapshot-picker")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-fallback-cards")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-fallback-executive")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-fallback-network")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-export-png")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-open-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?snapshotId=11111111-1111-1111-1111-111111111111",
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
      "/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("opens dependency neighborhood drill-down when seed node is in the URL", async () => {
    const armId = "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway";
    searchParams = new URLSearchParams(
      `snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&mermaidMode=dependencyNeighborhood&seedNodeId=${encodeURIComponent(armId)}`,
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-seed-node-input")).toHaveValue(armId);
    expect(screen.getByTestId("infra-diagrams-mode-picker")).toHaveValue("dependencyNeighborhood");
    expect(screen.getByTestId("infra-diagrams-open-ask")).toHaveAttribute(
      "href",
      `/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111&seedNodeId=${encodeURIComponent(armId)}`,
    );
  });
});

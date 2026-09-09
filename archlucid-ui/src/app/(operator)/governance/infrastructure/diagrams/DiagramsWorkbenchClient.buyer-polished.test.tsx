import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/diagrams",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
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
        ],
      },
    ],
  })),
  fetchInfraEvidenceMermaidRender: vi.fn(async (_snapshotId, query) => ({
    snapshotId: "11111111-1111-1111-1111-111111111111",
    mode: query.mode ?? "executive",
    fallbackKey: query.fallbackKey ?? null,
    status: "Partitioned",
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

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { DiagramsWorkbenchClient } from "./DiagramsWorkbenchClient";

describe("DiagramsWorkbenchClient buyer-polished chrome", () => {
  it("renders skip link, claim discipline, picker sections, and sources strip", async () => {
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-diagrams-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-diagrams-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-snapshot-picker")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-export-png")).toBeInTheDocument();
  });

  it("hides inline resource id behind disclosure when scoped", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222",
    );

    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-resource-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-resource-scope-banner")).toHaveTextContent("Scoped to resource.");
  });
});

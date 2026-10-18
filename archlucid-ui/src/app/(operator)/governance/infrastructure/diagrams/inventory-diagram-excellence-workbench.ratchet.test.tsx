import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";

const {
  fetchInfraEvidenceSnapshotsMock,
  fetchInfraEvidenceMermaidPreviewMock,
  fetchInfraEvidenceMermaidRenderMock,
} = vi.hoisted(() => ({
  fetchInfraEvidenceSnapshotsMock: vi.fn(),
  fetchInfraEvidenceMermaidPreviewMock: vi.fn(),
  fetchInfraEvidenceMermaidRenderMock: vi.fn(),
}));

let searchParams = new URLSearchParams();
const pathname = "/governance/infrastructure/diagrams";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-tenant-branding-presentation-query", () => ({
  useTenantBrandingPresentationQuery: () => ({ data: null }),
}));

vi.mock("@/lib/use-iana-time-zone-preference", () => ({
  useIanaTimeZonePreference: () => ({
    ianaTimeZoneId: "America/New_York",
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: fetchInfraEvidenceSnapshotsMock,
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-mermaid-api", () => ({
  fetchInfraEvidenceMermaidPreview: fetchInfraEvidenceMermaidPreviewMock,
  fetchInfraEvidenceMermaidRender: fetchInfraEvidenceMermaidRenderMock,
  downloadInfraEvidenceMermaidPng: vi.fn(),
  formatInfraEvidenceMermaidApiError: (error: unknown) => String(error),
}));

vi.mock("@/components/architecture/ArchitectureDiagramViewer", () => ({
  ArchitectureDiagramViewer: () => <div data-testid="architecture-diagram-viewer-mock" />,
}));

vi.mock("@/components/infra-evidence/SecureNowQuestionQueue", () => ({
  SecureNowQuestionQueue: () => null,
  SecureNowQuestionQueueProvider: ({ children }: { children: React.ReactNode }) => children,
  SecureNowQuestionQueueSnapshotPromo: () => null,
  SecureNowQuestionQueueBar: () => null,
  useSecureNowQuestionQueue: () => ({
    drawerOpen: false,
    currentQuestion: null,
  }),
  useSecureNowQuestionSubjectNodeId: () => null,
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

const defaultPreviewResponse = {
  snapshotId: "11111111-1111-1111-1111-111111111111",
  modes: [
    {
      mode: "executive",
      status: "Succeeded",
      nodeCount: 12,
      edgeCount: 6,
      mermaid: null,
      fallbackArtifacts: [],
    },
  ],
  completenessWarnings: [],
};

function defaultRenderResponse(query: { mode?: string | null }) {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    mode: query.mode ?? "executive",
    fallbackKey: null,
    status: "Succeeded",
    mermaid: "flowchart LR\n  A-->B",
    metrics: {
      nodeCount: 12,
      edgeCount: 6,
      subgraphCount: 0,
      maxDegree: 2,
      crossSubgraphEdgeCount: 0,
      textSizeBytes: 120,
      layoutEstimate: 80,
    },
    fallbackArtifacts: [],
    completenessWarnings: [],
    completenessSummary: null,
  };
}

describe("InventoryDiagramExcellence workbench ratchet", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchInfraEvidenceSnapshotsMock.mockReset();
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue(defaultSnapshotsResponse);
    fetchInfraEvidenceMermaidPreviewMock.mockReset();
    fetchInfraEvidenceMermaidPreviewMock.mockResolvedValue(defaultPreviewResponse);
    fetchInfraEvidenceMermaidRenderMock.mockReset();
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) =>
      defaultRenderResponse(query),
    );
  });

  it("InventoryDiagramExcellence_private_endpoint_toggle_defaults_off_without_url_flag", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    const privateEndpoints = await screen.findByTestId("infra-diagrams-show-private-endpoints");

    expect(privateEndpoints).not.toBeChecked();
  });

  it("InventoryDiagramExcellence_completeness_banner_renders_missing_classes_from_render_summary", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      ...defaultRenderResponse(query),
      completenessWarnings: ["logic-app-connections-missing"],
      completenessSummary: {
        mode: "executive",
        visibleNodeCount: 12,
        visibleEdgeCount: 6,
        connectedComponentCount: 2,
        hiddenHopsUsedCount: 1,
        likelyInCollocationEdgeCount: 0,
        missingClasses: ["logicAppConnections"],
        collectedClasses: ["inventory-nic-subnet"],
      },
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-evidence-completeness-warnings-banner")).toBeInTheDocument();
    expect(screen.getByText(/Missing: logicAppConnections/)).toBeInTheDocument();
    expect(screen.getByText(/\(1 from hidden attachment hops\)/)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchInfraEvidenceMermaidRenderMock).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        expect.objectContaining({ includePrivateEndpointNodes: false }),
      );
    });
  });
});

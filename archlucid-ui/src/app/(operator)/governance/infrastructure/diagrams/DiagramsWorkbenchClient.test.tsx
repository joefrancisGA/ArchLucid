import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatInfraEvidenceDiagramsSnapshotPickerLabel } from "@/lib/infra-evidence/format-infra-evidence-diagrams-snapshot-label";
import { SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH, SECURENOW_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_BACKBONE_KEEP_CAPTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_ALL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_CONFIRM,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";

const {
  fetchInfraEvidenceSnapshotsMock,
  downloadInfraEvidenceMermaidPngMock,
  fetchInfraEvidenceMermaidPreviewMock,
  fetchInfraEvidenceMermaidRenderMock,
} = vi.hoisted(() => ({
  fetchInfraEvidenceSnapshotsMock: vi.fn(),
  downloadInfraEvidenceMermaidPngMock: vi.fn(),
  fetchInfraEvidenceMermaidPreviewMock: vi.fn(),
  fetchInfraEvidenceMermaidRenderMock: vi.fn(),
}));

let searchParams = new URLSearchParams();
let pathname = "/governance/infrastructure/diagrams";

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
  downloadInfraEvidenceMermaidPng: downloadInfraEvidenceMermaidPngMock,
  formatInfraEvidenceMermaidApiError: (error: unknown) => String(error),
}));

vi.mock("@/components/architecture/ArchitectureDiagramViewer", () => ({
  ArchitectureDiagramViewer: (props: { scopeContextLine?: string | null }) => (
    <div data-testid="architecture-diagram-viewer-mock">
      {props.scopeContextLine != null ? (
        <p data-testid="architecture-diagram-scope-context">{props.scopeContextLine}</p>
      ) : null}
    </div>
  ),
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

async function selectDiagramsSubscription(subscriptionId: string): Promise<void> {
  const subscriptionPicker = await screen.findByTestId("infra-diagrams-subscription-picker");

  fireEvent.change(subscriptionPicker, { target: { value: subscriptionId } });
}

async function openDiagramOutlineNodes(): Promise<void> {
  const disclosure = await screen.findByTestId("infra-diagrams-outline-nodes-disclosure");

  if (disclosure.getAttribute("aria-expanded") === "true") {
    return;
  }

  fireEvent.click(disclosure);

  expect(await screen.findByTestId("infra-diagrams-outline-nodes-panel")).toBeInTheDocument();
}

describe("DiagramsWorkbenchClient", () => {
  beforeEach(() => {
    pathname = "/governance/infrastructure/diagrams";
    window.sessionStorage.clear();
    fetchInfraEvidenceSnapshotsMock.mockReset();
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue(defaultSnapshotsResponse);
    downloadInfraEvidenceMermaidPngMock.mockReset();
    downloadInfraEvidenceMermaidPngMock.mockResolvedValue({ usedBrowserFallback: false });
    fetchInfraEvidenceMermaidPreviewMock.mockReset();
    fetchInfraEvidenceMermaidPreviewMock.mockResolvedValue({
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
      completenessWarnings: [],
    });
    fetchInfraEvidenceMermaidRenderMock.mockReset();
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => {
      const fallbackKey = query.fallbackKey ?? null;
      const isFallback = fallbackKey != null && fallbackKey.length > 0;

      return {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        mode: isFallback ? fallbackKey : (query.mode ?? "executive"),
        fallbackKey,
        status:
          query.mode === "dependencyNeighborhood" ? "Succeeded" : isFallback ? "Succeeded" : "Partitioned",
        mermaid: "flowchart LR\n  A-->B",
        metrics: query.mode === "dependencyNeighborhood"
          ? {
              nodeCount: 3,
              edgeCount: 2,
              subgraphCount: 0,
              maxDegree: 2,
              crossSubgraphEdgeCount: 0,
              textSizeBytes: 1200,
              layoutEstimate: 800,
            }
          : isFallback
            ? {
                nodeCount: 120,
                edgeCount: 180,
                subgraphCount: 2,
                maxDegree: 8,
                crossSubgraphEdgeCount: 4,
                textSizeBytes: 4000,
                layoutEstimate: 2000,
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
      };
    });
  });

  it("renders the inventory diagrams nav icon before the page title on SecureNow routes", async () => {
    pathname = SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH;
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    const icon = await screen.findByTestId("page-heading-icon");
    const title = screen.getByTestId("infra-diagrams-page-title");

    expect(title).toHaveTextContent(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE);
    expect(icon.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the inventory diagrams nav icon before the page title on SecureNow routes", async () => {
    pathname = SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH;
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    const icon = await screen.findByTestId("page-heading-icon");
    const title = screen.getByTestId("infra-diagrams-page-title");

    expect(title).toHaveTextContent(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE);
    expect(icon.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders human-readable snapshot label above the diagram", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  A-->B",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 120,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    const snapshotLabel = formatInfraEvidenceDiagramsSnapshotPickerLabel(defaultSnapshotsResponse.items[0]);

    const scopeContext = await screen.findByTestId("architecture-diagram-scope-context");

    expect(scopeContext).toHaveTextContent(`Snapshot ${snapshotLabel}`);
    expect(scopeContext).not.toHaveTextContent("11111111-1111-1111-1111-111111111111");
    expect(scopeContext).toHaveTextContent("EDT");
    expect(scopeContext.textContent ?? "").not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it("defaults the subscription picker to Select a subscription and filters snapshots when a subscription is chosen", async () => {
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue({
      items: [
        defaultSnapshotsResponse.items[0],
        {
          snapshotId: "22222222-2222-2222-2222-222222222222",
          subscriptionId: "sub-dev",
          subscriptionName: "Dev",
          architectureName: "Payments",
          capturedUtc: "2026-09-02T12:00:00Z",
          captureStatus: 1,
          resourceCount: 12,
          relationshipCount: 3,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    const subscriptionPicker = await screen.findByTestId("infra-diagrams-subscription-picker");
    const modePicker = await screen.findByTestId("infra-diagrams-mode-picker");

    expect(subscriptionPicker).toHaveValue("");
    expect(modePicker).toBeDisabled();

    const snapshotPicker = await screen.findByTestId("infra-diagrams-snapshot-picker");

    expect(snapshotPicker).toBeDisabled();

    fireEvent.change(subscriptionPicker, { target: { value: "sub-dev" } });

    expect(snapshotPicker.querySelectorAll("option")).toHaveLength(2);
    expect(snapshotPicker).toHaveValue("");
    expect(modePicker).toBeDisabled();
  });

  it("does not auto-select a snapshot or render the Executive diagram until the user chooses one", async () => {
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    const subscriptionPicker = await screen.findByTestId("infra-diagrams-subscription-picker");

    expect(subscriptionPicker).toHaveValue("");
    expect(screen.queryByTestId("infra-diagrams-subscription-prompt")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-snapshot-prompt")).not.toBeInTheDocument();

    await selectDiagramsSubscription("sub-1");

    const picker = await screen.findByTestId("infra-diagrams-snapshot-picker");

    expect(picker).toHaveValue("");
    expect(await screen.findByTestId("infra-diagrams-snapshot-prompt")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_TITLE,
    );
    expect(screen.getByTestId("infra-diagrams-snapshot-prompt")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_BODY,
    );
    expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-snapshot-id-readout")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-executive-always-show")).not.toBeInTheDocument();
    expect(fetchInfraEvidenceMermaidRenderMock).not.toHaveBeenCalled();
  });

  it("does not show Executive always-show choices until Executive is selected", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-snapshot-picker")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-mode-picker")).toHaveValue("");
    expect(screen.queryByTestId("infra-diagrams-executive-always-show")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("infra-diagrams-mode-picker"), {
      target: { value: "executive" },
    });

    expect(await screen.findByTestId("infra-diagrams-executive-always-show")).toBeInTheDocument();
  });

  it("shows an all-resource-groups picker after subscription and snapshot selection", async () => {
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    await selectDiagramsSubscription("sub-1");

    const snapshotPicker = await screen.findByTestId("infra-diagrams-snapshot-picker");
    fireEvent.change(snapshotPicker, { target: { value: "11111111-1111-1111-1111-111111111111" } });

    const resourceGroupPicker = await screen.findByTestId("infra-diagrams-resource-group-picker");

    expect(resourceGroupPicker).toHaveValue("");
    expect(resourceGroupPicker).toHaveTextContent(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_ALL);
    await waitFor(() => expect(resourceGroupPicker).toBeEnabled());
    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE)).toBeInTheDocument();
  });

  it("renders the Executive diagram after the user chooses a snapshot", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  A-->B",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 120,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    await selectDiagramsSubscription("sub-1");

    const picker = await screen.findByTestId("infra-diagrams-snapshot-picker");

    fireEvent.change(picker, { target: { value: "11111111-1111-1111-1111-111111111111" } });

    expect(await screen.findByTestId("infra-diagrams-type-prompt")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();

    const modePicker = await screen.findByTestId("infra-diagrams-mode-picker");

    fireEvent.change(modePicker, { target: { value: "executive" } });

    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-snapshot-prompt")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-executive-always-show")).toBeInTheDocument();
    expect(fetchInfraEvidenceMermaidRenderMock).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      expect.objectContaining({ mode: "executive" }),
    );
  });

  it("renders snapshot picker and partitioned fallback cards", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=full");
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
    expect(screen.getByTestId("infra-diagrams-export-mmd")).toHaveTextContent(/^Export Mermaid$/);
    expect(screen.queryByTestId("infra-diagrams-export-advisory-status")).not.toBeInTheDocument();
    expect(screen.queryByText("Advisory export")).not.toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-open-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?snapshotId=11111111-1111-1111-1111-111111111111&tab=diagram",
    );
    expect(screen.queryByTestId("infra-diagrams-render-status-strip")).not.toBeInTheDocument();
    expect(await screen.findByTestId("infra-diagrams-snapshot-id-readout")).toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-density-coach")).not.toBeInTheDocument();
    expect(screen.queryByText(/This view is too large to read/i)).not.toBeInTheDocument();
  });

  it("does not show too-large chrome in executive mode", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive");
    render(<DiagramsWorkbenchClient />);

    await screen.findByTestId("infra-diagrams-snapshot-picker");

    expect(screen.queryByTestId("infra-diagrams-fallback-cards")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-density-coach")).not.toBeInTheDocument();
    expect(screen.queryByText(/too large for a single diagram/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/This view is too large to read/i)).not.toBeInTheDocument();
  });

  it("shows render status strip only when render fails", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Failed",
      mermaid: null,
      metrics: null,
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    await waitFor(() => {
      const strip = screen.getByTestId("infra-diagrams-render-status-strip");
      expect(strip).toHaveTextContent("Render failed");
      expect(strip).not.toHaveTextContent("subgraphs");
    });
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

    await selectDiagramsSubscription(subscriptionId);

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
    expect(screen.getByTestId("infra-diagrams-choose-another-view")).toBeInTheDocument();
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

    expect(await screen.findByTestId("infra-diagrams-mermaid-outline")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();
    expect(fetchInfraEvidenceMermaidRenderMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mode: "dependencyNeighborhood" }),
    );
  });

  it("shows the starting resource helper above the seed controls", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood",
    );
    render(<DiagramsWorkbenchClient />);

    const helper = await screen.findByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER);
    const input = screen.getByTestId("infra-diagrams-seed-node-input");

    expect(helper.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText("Pick a Nodes row, or paste a cloud resource id or ARM id.")).not.toBeInTheDocument();
  });

  it("loads executive resources for dependency neighborhood seed picking", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: [
        "flowchart TD",
        '    %% al-type=Microsoft.Network/virtualNetworks al-rg=rg-net al-seed=seed-vnet',
        '    n_vnet["vnet-aep-hi-test-wus-001"]',
        '    %% al-type=Microsoft.Network/publicIPAddresses al-rg=rg-net al-seed=seed-pip',
        '    n_pip["gateway-pip"]',
        "    n_vnet --> n_pip",
      ].join("\n"),
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 400,
        layoutEstimate: 200,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-mermaid-outline")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("infra-diagrams-outline-nodes-disclosure"));
    expect(screen.getByRole("button", { name: /Focus neighborhood from vnet-aep-hi-test-wus-001/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Focus neighborhood from gateway-pip/i })).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-dependency-seed-prompt")).not.toBeInTheDocument();
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
      "Pick a starting resource before rendering",
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
      "Starting resource did not match this snapshot",
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
    expect(screen.queryByText(/too large for a single diagram/i)).not.toBeInTheDocument();
  });

  it("explains omitted identity resources instead of generic empty content", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "identity",
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
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=identity",
    );
    render(<DiagramsWorkbenchClient />);

    const coach = await screen.findByTestId("infra-diagrams-density-coach");

    expect(coach).toHaveAttribute("data-coach-variant", "empty-identity");
    expect(coach).toHaveTextContent(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE);
    expect(coach).toHaveTextContent(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY);
    expect(screen.queryByTestId("infra-diagrams-empty-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();
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

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    await screen.findByTestId("architecture-diagram-viewer-mock");

    const exportButton = await screen.findByTestId("infra-diagrams-export-png");

    await waitFor(() => {
      expect(exportButton).not.toBeDisabled();
    });

    fireEvent.click(exportButton);

    expect(await screen.findByTestId("infra-diagrams-png-export-error")).toHaveTextContent(
      "Could not download diagram PNG",
    );
    expect(screen.queryByTestId("infra-diagrams-png-browser-fallback-note")).not.toBeInTheDocument();
    expect(screen.queryAllByText("The governance change did not save.")).toHaveLength(0);
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

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
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
      expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetchInfraEvidenceMermaidRenderMock.mock.calls.some((call) => call[1]?.mode === "network")).toBe(
        true,
      );
      expect(
        fetchInfraEvidenceMermaidRenderMock.mock.calls.some((call) => call[1]?.fallbackKey === "executive"),
      ).toBe(true);
    });

    const settledCallCount = fetchInfraEvidenceMermaidRenderMock.mock.calls.length;
    const networkModeCalls = fetchInfraEvidenceMermaidRenderMock.mock.calls.filter(
      (call) => call[1]?.mode === "network",
    ).length;

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 75);
      });
    });

    expect(fetchInfraEvidenceMermaidRenderMock.mock.calls.length).toBe(settledCallCount);
    expect(
      fetchInfraEvidenceMermaidRenderMock.mock.calls.filter((call) => call[1]?.mode === "network").length,
    ).toBe(networkModeCalls);
    expect(networkModeCalls).toBe(1);
    expect(screen.getByTestId("infra-diagrams-fallback-cards")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
  });

  it("applies a starting resource from a Nodes row", async () => {
    const seedId = "22222222-2222-2222-2222-222222222222";

    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: [
        "flowchart TD",
        `    %% al-type=Microsoft.Network/virtualNetworks al-rg=anly-aep-test-hi al-seed=${seedId}`,
        '    n_vnet["vnet-aep-hi-test-wus-001"]',
      ].join("\n"),
      metrics: {
        nodeCount: 11,
        edgeCount: 10,
        subgraphCount: 0,
        maxDegree: 2,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 400,
        layoutEstimate: 200,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    await openDiagramOutlineNodes();

    fireEvent.click(
      await screen.findByRole("button", { name: "Focus neighborhood from vnet-aep-hi-test-wus-001" }),
    );

    await waitFor(() => {
      expect(fetchInfraEvidenceMermaidRenderMock).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        expect.objectContaining({
          mode: "dependencyNeighborhood",
          seedNodeId: seedId,
        }),
      );
    });

    expect(screen.getByTestId("infra-diagrams-mode-picker")).toHaveValue("dependencyNeighborhood");
    expect(screen.getByTestId("infra-diagrams-seed-node-input")).toHaveValue(seedId);
  });

  it("clears the stale executive diagram while focusing a dependency neighborhood", async () => {
    const seedId = "22222222-2222-2222-2222-222222222222";
    let dependencyFetchStarted = false;

    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => {
      if (query.mode === "dependencyNeighborhood") {
        dependencyFetchStarted = true;

        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });

        return {
          snapshotId: "11111111-1111-1111-1111-111111111111",
          mode: "dependencyNeighborhood",
          fallbackKey: null,
          status: "Succeeded",
          mermaid: 'flowchart TD\n    n_vnet["focused-neighborhood"]',
          metrics: {
            nodeCount: 3,
            edgeCount: 2,
            subgraphCount: 0,
            maxDegree: 2,
            crossSubgraphEdgeCount: 0,
            textSizeBytes: 400,
            layoutEstimate: 200,
          },
          fallbackArtifacts: [],
        };
      }

      return {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        mode: query.mode ?? "executive",
        fallbackKey: query.fallbackKey ?? null,
        status: "Succeeded",
        mermaid: [
          "flowchart TD",
          `    %% al-type=Microsoft.Network/virtualNetworks al-rg=anly-aep-test-hi al-seed=${seedId}`,
          '    n_vnet["vnet-aep-hi-test-wus-001"]',
        ].join("\n"),
        metrics: {
          nodeCount: 11,
          edgeCount: 10,
          subgraphCount: 0,
          maxDegree: 2,
          crossSubgraphEdgeCount: 0,
          textSizeBytes: 400,
          layoutEstimate: 200,
        },
        fallbackArtifacts: [],
      };
    });

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();

    await openDiagramOutlineNodes();

    fireEvent.click(
      await screen.findByRole("button", { name: "Focus neighborhood from vnet-aep-hi-test-wus-001" }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("architecture-diagram-viewer-mock")).not.toBeInTheDocument();
    });
    expect(dependencyFetchStarted).toBe(true);

    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    expect(fetchInfraEvidenceMermaidRenderMock).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      expect.objectContaining({
        mode: "dependencyNeighborhood",
        seedNodeId: seedId,
      }),
    );
  });

  it("refetches dependency neighborhood when Focus neighborhood is clicked again for the same seed", async () => {
    const seedId = "22222222-2222-2222-2222-222222222222";
    let dependencyRenderCount = 0;

    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => {
      if (query.mode === "dependencyNeighborhood") {
        dependencyRenderCount += 1;

        return {
          snapshotId: "11111111-1111-1111-1111-111111111111",
          mode: "dependencyNeighborhood",
          fallbackKey: null,
          status: "Succeeded",
          mermaid: `flowchart TD\n    n_vnet["focused-neighborhood-${dependencyRenderCount}"]`,
          metrics: {
            nodeCount: 3,
            edgeCount: 2,
            subgraphCount: 0,
            maxDegree: 2,
            crossSubgraphEdgeCount: 0,
            textSizeBytes: 400,
            layoutEstimate: 200,
          },
          fallbackArtifacts: [],
        };
      }

      return {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        mode: query.mode ?? "executive",
        fallbackKey: query.fallbackKey ?? null,
        status: "Succeeded",
        mermaid: "flowchart TD\n    n_vnet[\"vnet-aep-hi-test-wus-001\"]",
        metrics: {
          nodeCount: 11,
          edgeCount: 10,
          subgraphCount: 0,
          maxDegree: 2,
          crossSubgraphEdgeCount: 0,
          textSizeBytes: 400,
          layoutEstimate: 200,
        },
        fallbackArtifacts: [],
      };
    });

    searchParams = new URLSearchParams(
      `snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood&seedNodeId=${seedId}`,
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    await waitFor(() => {
      expect(dependencyRenderCount).toBe(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Focus neighborhood" }));

    await waitFor(() => {
      expect(dependencyRenderCount).toBe(2);
    });
    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
  });

  it("paints server layout svg when dependency neighborhood mermaid is withheld", async () => {
    const seedId = "22222222-2222-2222-2222-222222222222";

    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "dependencyNeighborhood",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: null,
      layoutSvg: "<svg viewBox=\"0 0 120 80\"><text>neighborhood</text></svg>",
      metrics: {
        nodeCount: 3,
        edgeCount: 2,
        subgraphCount: 0,
        maxDegree: 2,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 400,
        layoutEstimate: 200,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      `snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood&seedNodeId=${seedId}`,
    );
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-empty-content")).not.toBeInTheDocument();
  });

  it("shows the resource group dropdown when the subscription has two or more resource groups", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => {
      const mode = query.mode ?? "executive";
      const isPicker = mode === "resourceGroup";
      const isNamedGroup = typeof mode === "string" && mode.startsWith("resourceGroup:");

      return {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        mode,
        fallbackKey: null,
        status: "Succeeded",
        mermaid: isNamedGroup ? "flowchart TD\n    %% al-type=Microsoft.Resources/resourceGroups al-rg=rg-net\n    n1[\"rg-net\"]" : "",
        metrics: isNamedGroup
          ? {
              nodeCount: 4,
              edgeCount: 2,
              subgraphCount: 0,
              maxDegree: 2,
              crossSubgraphEdgeCount: 0,
              textSizeBytes: 200,
              layoutEstimate: 100,
            }
          : {
              nodeCount: 0,
              edgeCount: 0,
              subgraphCount: 0,
              maxDegree: 0,
              crossSubgraphEdgeCount: 0,
              textSizeBytes: 0,
              layoutEstimate: 0,
            },
        fallbackArtifacts: isPicker || isNamedGroup
          ? [
              {
                key: "resourceGroup:rg-net",
                label: "rg-net",
                status: "Succeeded",
                nodeCount: 4,
                edgeCount: 2,
              },
              {
                key: "resourceGroup:rg-data",
                label: "rg-data",
                status: "Succeeded",
                nodeCount: 2,
                edgeCount: 1,
              },
            ]
          : [],
      };
    });

    fetchInfraEvidenceMermaidPreviewMock.mockResolvedValue({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      modes: [
        {
          mode: "resourceGroup",
          status: "Succeeded",
          nodeCount: 0,
          edgeCount: 0,
          mermaid: null,
          fallbackArtifacts: [
            {
              key: "resourceGroup:rg-net",
              label: "rg-net",
              status: "Succeeded",
              nodeCount: 4,
              edgeCount: 2,
            },
            {
              key: "resourceGroup:rg-data",
              label: "rg-data",
              status: "Succeeded",
              nodeCount: 2,
              edgeCount: 1,
            },
          ],
        },
      ],
    });

    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    await selectDiagramsSubscription("sub-1");

    const picker = await screen.findByTestId("infra-diagrams-snapshot-picker");

    fireEvent.change(picker, { target: { value: "11111111-1111-1111-1111-111111111111" } });

    const resourceGroupPicker = await screen.findByTestId("infra-diagrams-resource-group-picker");

    fireEvent.change(resourceGroupPicker, { target: { value: "rg-net" } });

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("infra-diagrams-resource-group-cards")).not.toBeInTheDocument();
  });

  it("shows the resource group picker when only one resource group exists and resource group mode is requested", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => {
      const mode = query.mode ?? "executive";
      const isPicker = mode === "resourceGroup";
      const isNamedGroup = typeof mode === "string" && mode.startsWith("resourceGroup:");

      return {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        mode,
        fallbackKey: null,
        status: "Succeeded",
        mermaid: isNamedGroup ? "flowchart TD\n    %% al-type=Microsoft.Resources/resourceGroups al-rg=rg-net\n    n1[\"rg-net\"]" : "",
        metrics: isNamedGroup
          ? {
              nodeCount: 4,
              edgeCount: 2,
              subgraphCount: 0,
              maxDegree: 2,
              crossSubgraphEdgeCount: 0,
              textSizeBytes: 200,
              layoutEstimate: 100,
            }
          : {
              nodeCount: 0,
              edgeCount: 0,
              subgraphCount: 0,
              maxDegree: 0,
              crossSubgraphEdgeCount: 0,
              textSizeBytes: 0,
              layoutEstimate: 0,
            },
        fallbackArtifacts: isPicker || isNamedGroup
          ? [
              {
                key: "resourceGroup:rg-net",
                label: "rg-net",
                status: "Succeeded",
                nodeCount: 4,
                edgeCount: 2,
              },
            ]
          : [],
      };
    });

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=resourceGroup",
    );
    render(<DiagramsWorkbenchClient />);

    const resourceGroupPicker = await screen.findByTestId("infra-diagrams-resource-group-picker");
    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE)).toBeInTheDocument();
    expect(resourceGroupPicker).toHaveValue("");
  });

  it("shows the resource group map caption for a collapsed full subscription diagram", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "full",
      fallbackKey: null,
      status: "Succeeded",
      mermaid: "flowchart TD\n    %% al-view=resource-group-map\n    n1[\"rg-net (40 resources)\"]",
      metrics: {
        nodeCount: 12,
        edgeCount: 4,
        subgraphCount: 0,
        maxDegree: 3,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 400,
        layoutEstimate: 200,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=full");
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-resource-group-map-caption")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION,
    );
    expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
  });

  it("shows the backbone caption when Full subscription keeps VMs and databases", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "full",
      fallbackKey: null,
      status: "Succeeded",
      mermaid:
        "flowchart TD\n    %% al-view=backbone-keep\n    n1[\"vm-app-01\"]\n    n2[\"sqldb-claims\"]",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 180,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=full");
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-backbone-keep-caption")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_BACKBONE_KEEP_CAPTION,
    );
    expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
  });

  it("keeps singleton components in the walkthrough and outline by default", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: [
        "flowchart TD",
        '    n_a["vnet-a"]',
        '    n_b["vnet-b"]',
        '    n_c["vnet-c"]',
        "    n_a --> n_b",
      ].join("\n"),
      metrics: {
        nodeCount: 3,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 180,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
      collapseReport: {
        entries: [
          {
            kind: "AlwaysDisposeArmType",
            cloudResourceId: null,
            nodeId: null,
            reason: "Always dispose — never shown on inventory diagrams: Microsoft.Network/dnszones",
          },
        ],
      },
    }));

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive");
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagrams-walkthrough")).toHaveTextContent("2 connected components");
    expect(screen.getByTestId("infra-diagrams-include-never-show")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("infra-diagrams-always-excluded-panel")).toHaveTextContent("dnszones");

    await openDiagramOutlineNodes();

    expect(screen.getByText("vnet-c")).toBeInTheDocument();
  });

  it("shows always-excluded disclosure when the toggle is off and recompiles when on", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: [
        "flowchart TD",
        '    n_a["vnet-a"]',
        '    n_b["vnet-b"]',
        '    n_c["vnet-c"]',
        "    n_a --> n_b",
      ].join("\n"),
      metrics: {
        nodeCount: 3,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 180,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
      collapseReport: query.includeNeverShow
        ? null
        : {
            entries: [
              {
                kind: "AlwaysDisposeArmType",
                cloudResourceId: null,
                nodeId: null,
                reason: "Always dispose — never shown on inventory diagrams: Microsoft.Network/dnszones",
              },
            ],
          },
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive&includeNeverShow=1",
    );
    render(<DiagramsWorkbenchClient />);

    await screen.findByTestId("infra-diagrams-walkthrough");
    expect(screen.getByTestId("infra-diagrams-include-never-show")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("infra-diagrams-always-excluded-panel")).not.toBeInTheDocument();
    expect(fetchInfraEvidenceMermaidRenderMock).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      expect.objectContaining({ includeNeverShow: true }),
    );
  });

  it("shows Executive always-show tier checkboxes and passes hidden tiers to the render API", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: 'flowchart TD\n    n_a["vnet-a"]',
      metrics: {
        nodeCount: 1,
        edgeCount: 0,
        subgraphCount: 0,
        maxDegree: 0,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 80,
        layoutEstimate: 40,
      },
      fallbackArtifacts: [],
      collapseReport: null,
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive&hideTiers=storage",
    );
    render(<DiagramsWorkbenchClient />);

    const storageTier = await screen.findByTestId("infra-diagrams-executive-tier-storage");
    expect(storageTier).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-executive-tier-workloads")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-executive-tier-databases")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-executive-tier-integration")).toBeInTheDocument();
    expect(storageTier.querySelector('input[type="checkbox"]')).not.toBeChecked();
    expect(screen.getByTestId("infra-diagrams-executive-tier-workloads").querySelector('input[type="checkbox"]')).toBeChecked();

    await waitFor(() => {
      expect(fetchInfraEvidenceMermaidRenderMock).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        expect.objectContaining({ hiddenExecutiveTierKeys: ["storage"] }),
      );
    });
  });

  it("shows completeness warnings banner from preview response", async () => {
    fetchInfraEvidenceMermaidPreviewMock.mockResolvedValue({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      modes: [
        {
          mode: "executive",
          status: "Succeeded",
          nodeCount: 2,
          edgeCount: 1,
          mermaid: null,
          fallbackArtifacts: [],
        },
      ],
      completenessWarnings: ["app-settings-not-collected-hosted-get-only"],
    });
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: 'flowchart TD\n  web["orders-api"] -.->|"May access"| sql["orders-db"]',
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 120,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
      completenessWarnings: ["app-settings-not-collected-hosted-get-only"],
    }));

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive");
    render(<DiagramsWorkbenchClient />);

    expect(await screen.findByTestId("infra-evidence-completeness-warnings-banner")).toBeInTheDocument();
    expect(screen.getByText(/App setting hostnames not collected on hosted pull/)).toBeInTheDocument();
  });

  it("links the SecureNow breadcrumb parent to the infrastructure overview", async () => {
    pathname = SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH;
    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    const breadcrumbLink = (await screen.findByTestId("infra-diagrams-breadcrumb")).querySelector("a");

    expect(breadcrumbLink).toHaveAttribute("href", SECURENOW_INFRASTRUCTURE_PATH);
  });

  it("passes the active render query to PNG export", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  A-->B",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 120,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive&includePrivateEndpoints=1",
    );
    render(<DiagramsWorkbenchClient />);

    await screen.findByTestId("architecture-diagram-viewer-mock");

    const exportButton = await screen.findByTestId("infra-diagrams-export-png");

    await waitFor(() => {
      expect(exportButton).not.toBeDisabled();
    });

    fireEvent.click(exportButton);

    const renderQuery = fetchInfraEvidenceMermaidRenderMock.mock.calls.at(-1)?.[1];
    const exportQuery = downloadInfraEvidenceMermaidPngMock.mock.calls.at(-1)?.[1];

    expect(renderQuery).toEqual(
      expect.objectContaining({
        mode: "executive",
        includeNeverShow: false,
        includePrivateEndpointNodes: true,
      }),
    );
    expect(exportQuery).toEqual(renderQuery);
  });

  it("renders show cross-group links unchecked by default", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    const toggle = await screen.findByTestId("infra-diagrams-show-cross-group-links");

    expect(toggle).not.toBeChecked();
  });

  it("toggles show cross-group links in the search param and mermaid request", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  A-->B",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 120,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    await screen.findByTestId("architecture-diagram-viewer-mock");

    const toggle = await screen.findByTestId("infra-diagrams-show-cross-group-links");

    fireEvent.click(toggle);

    await waitFor(() => {
      const renderQuery = fetchInfraEvidenceMermaidRenderMock.mock.calls.at(-1)?.[1];

      expect(renderQuery).toEqual(
        expect.objectContaining({
          mode: "executive",
          includeCrossGroupFanOut: true,
        }),
      );
    });
  });

  it("toggles include recovery services in the search param and mermaid request", async () => {
    fetchInfraEvidenceMermaidRenderMock.mockImplementation(async (_snapshotId, query) => ({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: query.mode ?? "executive",
      fallbackKey: query.fallbackKey ?? null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  A-->B",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 120,
        layoutEstimate: 80,
      },
      fallbackArtifacts: [],
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive",
    );
    render(<DiagramsWorkbenchClient />);

    await screen.findByTestId("architecture-diagram-viewer-mock");

    const toggle = await screen.findByTestId("infra-diagrams-include-recovery-services");

    fireEvent.click(toggle);

    await waitFor(() => {
      const renderQuery = fetchInfraEvidenceMermaidRenderMock.mock.calls.at(-1)?.[1];

      expect(renderQuery).toEqual(
        expect.objectContaining({
          mode: "executive",
          includeRecoveryServices: true,
        }),
      );
    });
  });

  it("confirms before a subscription change clears the active diagram selection", async () => {
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue({
      items: [
        defaultSnapshotsResponse.items[0],
        {
          snapshotId: "22222222-2222-2222-2222-222222222222",
          subscriptionId: "sub-dev",
          subscriptionName: "Dev",
          capturedUtc: "2026-09-02T12:00:00Z",
          captureStatus: 1,
          resourceCount: 12,
          relationshipCount: 3,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    searchParams = new URLSearchParams();
    render(<DiagramsWorkbenchClient />);

    await selectDiagramsSubscription("sub-1");

    fireEvent.change(await screen.findByTestId("infra-diagrams-snapshot-picker"), {
      target: { value: "11111111-1111-1111-1111-111111111111" },
    });

    fireEvent.change(await screen.findByTestId("infra-diagrams-mode-picker"), {
      target: { value: "executive" },
    });

    fireEvent.change(await screen.findByTestId("infra-diagrams-subscription-picker"), {
      target: { value: "sub-dev" },
    });

    expect(await screen.findByTestId("infra-diagrams-subscription-change-dialog")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_TITLE,
    );

    fireEvent.click(await screen.findByTestId("infra-diagrams-subscription-change-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("infra-diagrams-subscription-picker")).toHaveValue("sub-dev");
      expect(screen.getByTestId("infra-diagrams-snapshot-picker")).toHaveValue("");
      expect(screen.getByTestId("infra-diagrams-mode-picker")).toHaveValue("");
    });
  });
});

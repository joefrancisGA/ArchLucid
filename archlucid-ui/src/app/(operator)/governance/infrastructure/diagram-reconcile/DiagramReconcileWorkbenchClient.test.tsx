import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DiagramReconcileWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient";

let searchParams = new URLSearchParams(
  "runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/diagram-reconcile",
  useSearchParams: () => searchParams,
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
        resourceCount: 12,
        relationshipCount: 4,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  })),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-diagram-reconcile-api", () => ({
  fetchArchitectureDiagramModel: vi.fn(async () => ({ nodes: [{ id: "n1", label: "api" }], edges: [] })),
  fetchArchitectureDiagramReconciliation: vi.fn(async () => ({
    runId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    snapshotId: "11111111-1111-1111-1111-111111111111",
    diagramNodeCount: 1,
    inventoryResourceCount: 2,
    rows: [
      {
        correspondenceId: "diagram-node-1",
        diagramNodeId: "node-1",
        diagramNodeLabel: "private gateway (rg-net)",
        cloudResourceId: "22222222-3333-4444-5555-666666666666",
        azureResourceId: "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
        resourceType: "Microsoft.Network/publicIPAddresses",
        resourceGroup: "rg-net",
        terraformAddress: null,
        matchKind: "Conflict",
        confidenceBand: "Likely",
        explainText: "Multiple inventory resources matched the diagram node.",
        aiRationale: null,
        securityDiscrepancy: true,
      },
      {
        correspondenceId: "infra-only-1",
        diagramNodeId: null,
        diagramNodeLabel: null,
        cloudResourceId: "33333333-4444-5555-6666-777777777777",
        azureResourceId: "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Storage/storageAccounts/orphan",
        resourceType: "Microsoft.Storage/storageAccounts",
        resourceGroup: "rg-net",
        terraformAddress: null,
        matchKind: "InfrastructureOnly",
        confidenceBand: "InsufficientEvidence",
        explainText: "Inventory resource has no corresponding diagram node.",
        aiRationale: null,
        securityDiscrepancy: false,
      },
    ],
  })),
  ingestArchitectureDiagram: vi.fn(async () => ({ warnings: [], sourceFingerprints: ["fp1"], model: { nodes: [], edges: [] } })),
  reconcileArchitectureDiagram: vi.fn(),
  ingestOperationalSecurityFindings: vi.fn(async () => ({ items: [] })),
  formatInfraEvidenceDiagramReconcileApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Diagram reconciliation",
      useWhen: "Reconcile diagrams",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

describe("DiagramReconcileWorkbenchClient", () => {
  it("renders wizard controls, filter, and conflict row with both sides", async () => {
    render(<DiagramReconcileWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagram-reconcile-run-id")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagram-reconcile-snapshot-picker")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagram-reconcile-filter")).toBeInTheDocument();

    const conflictRow = await screen.findByTestId("infra-diagram-reconcile-row-diagram-node-1");
    expect(within(conflictRow).getByText("Conflict")).toBeInTheDocument();
    expect(within(conflictRow).getByText(/private gateway/)).toBeInTheDocument();
    expect(within(conflictRow).getAllByText(/publicIPAddresses\/gateway/).length).toBeGreaterThan(0);
    expect(within(conflictRow).getByTestId("infra-diagram-reconcile-ask-diagram-node-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=22222222-3333-4444-5555-666666666666&snapshotId=11111111-1111-1111-1111-111111111111&correspondenceId=diagram-node-1&runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    expect(within(conflictRow).getByTestId("infra-diagram-reconcile-remediation-diagram-node-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=22222222-3333-4444-5555-666666666666&correspondenceId=diagram-node-1&runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(
      within(conflictRow).queryByTestId("infra-diagram-reconcile-remediation-infra-only-1"),
    ).not.toBeInTheDocument();

    const filter = screen.getByTestId("infra-diagram-reconcile-filter");
    fireEvent.change(filter, { target: { value: "Conflict" } });

    expect(screen.getByTestId("infra-diagram-reconcile-row-diagram-node-1")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagram-reconcile-row-infra-only-1")).not.toBeInTheDocument();
  });

  it("highlights and scrolls to a deep-linked correspondence row", async () => {
    searchParams = new URLSearchParams(
      "runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111&correspondenceId=diagram-node-1",
    );
    render(<DiagramReconcileWorkbenchClient />);

    const conflictRow = await screen.findByTestId("infra-diagram-reconcile-row-diagram-node-1");
    expect(conflictRow).toHaveClass("bg-muted/40");
  });

  it("shows missing copy when correspondence deep link is absent from reconciliation", async () => {
    searchParams = new URLSearchParams(
      "runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111&correspondenceId=missing-correspondence",
    );
    render(<DiagramReconcileWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagram-reconcile-correspondence-deep-link-missing")).toHaveTextContent(
      "linked diagram correspondence row is not in the loaded reconciliation",
    );
  });

  it("shows resource scope banner and filters rows when cloudResourceId is in the URL", async () => {
    searchParams = new URLSearchParams(
      "runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-3333-4444-5555-666666666666",
    );
    render(<DiagramReconcileWorkbenchClient />);

    expect(await screen.findByTestId("infra-diagram-reconcile-resource-scope-banner")).toHaveTextContent(
      "22222222-3333-4444-5555-666666666666",
    );
    expect(screen.getByRole("link", { name: "Open resource evidence hub" })).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-3333-4444-5555-666666666666?tab=diagram&runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-diagram-reconcile-row-diagram-node-1")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagram-reconcile-row-infra-only-1")).not.toBeInTheDocument();
  });
});

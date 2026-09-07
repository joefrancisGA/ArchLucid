import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams(
  "runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/diagram-reconcile",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
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
  fetchArchitectureDiagramModel: vi.fn(async () => ({ nodes: [], edges: [] })),
  fetchArchitectureDiagramReconciliation: vi.fn(async () => ({
    runId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    snapshotId: "11111111-1111-1111-1111-111111111111",
    diagramNodeCount: 0,
    inventoryResourceCount: 0,
    rows: [],
  })),
  ingestArchitectureDiagram: vi.fn(),
  reconcileArchitectureDiagram: vi.fn(),
  ingestOperationalSecurityFindings: vi.fn(),
  formatInfraEvidenceDiagramReconcileApiError: (error: unknown) => String(error),
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
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { DiagramReconcileWorkbenchClient } from "./DiagramReconcileWorkbenchClient";

describe("DiagramReconcileWorkbenchClient buyer-polished chrome", () => {
  it("renders skip link, claim discipline, wizard sections, and sources strip", () => {
    render(<DiagramReconcileWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-diagram-reconcile-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-diagram-reconcile-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-diagram-reconcile-run-id")).toBeInTheDocument();
  });

  it("hides inline resource id behind disclosure when scoped", () => {
    searchParams = new URLSearchParams(
      "runId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-3333-4444-5555-666666666666",
    );

    render(<DiagramReconcileWorkbenchClient />);

    expect(screen.getByTestId("infra-diagram-reconcile-resource-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagram-reconcile-resource-scope-banner")).toHaveTextContent("Scoped to resource.");
  });
});

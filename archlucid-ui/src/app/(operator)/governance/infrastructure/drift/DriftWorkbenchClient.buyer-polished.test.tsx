import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams(
  "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/governance/infrastructure/drift",
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
        resourceCount: 42,
        relationshipCount: 10,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  })),
  fetchInfraEvidenceDiffsForSnapshot: vi.fn(async () => [
    {
      diffId: "diff-1",
      snapshotAId: "11111111-1111-1111-1111-111111111111",
      snapshotBId: "33333333-3333-3333-3333-333333333333",
      totalChanges: 1,
      createdUtc: "2026-09-01T12:00:00Z",
    },
  ]),
  fetchInfraEvidenceDiffChanges: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 100,
    hasMore: false,
  })),
  downloadInfraEvidenceTerraformAdvisoryZip: vi.fn(async () => undefined),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Drift",
      useWhen: "Compare snapshots",
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
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { DriftWorkbenchClient } from "./DriftWorkbenchClient";

describe("DriftWorkbenchClient buyer-polished chrome", () => {
  it("renders skip link, claim discipline, picker sections, and sources strip", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-drift-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-drift-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    expect(await screen.findByTestId("infra-drift-snapshot-picker")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-drift-export-terraform")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-copy-scoped-link")).toBeInTheDocument();
  });

  it("hides inline resource id behind disclosure when scoped", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );

    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-resource-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-resource-scope-banner")).toHaveTextContent("Scoped to resource.");
  });
});

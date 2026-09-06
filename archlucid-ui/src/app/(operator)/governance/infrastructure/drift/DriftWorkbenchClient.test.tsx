import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DriftWorkbenchClient } from "@/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient";

let searchParams = new URLSearchParams(
  "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222",
);

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

const mockFetchDiffs = vi.fn(async () => [
  {
    diffId: "diff-1",
    snapshotAId: "11111111-1111-1111-1111-111111111111",
    snapshotBId: "33333333-3333-3333-3333-333333333333",
    totalChanges: 1,
    createdUtc: "2026-09-01T12:00:00Z",
  },
]);

const mockFetchChanges = vi.fn(async () => ({
  items: [
    {
      changeId: "change-1",
      diffId: "diff-1",
      cloudResourceId: "22222222-2222-2222-2222-222222222222",
      azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
      changeType: "Modified",
      property: "sku",
      oldValue: "Basic",
      newValue: "Standard",
      riskClassification: "Medium",
      evidenceReference: "snapshot-diff",
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 100,
  hasMore: false,
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
  fetchInfraEvidenceDiffsForSnapshot: (...args: unknown[]) => mockFetchDiffs(...args),
  fetchInfraEvidenceDiffChanges: (...args: unknown[]) => mockFetchChanges(...args),
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

describe("DriftWorkbenchClient", () => {
  beforeEach(() => {
    mockFetchDiffs.mockClear();
    mockFetchChanges.mockClear();
  });

  it("renders snapshot picker and export button", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-snapshot-picker")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-export-terraform")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-export-terraform")).not.toBeDisabled();
  });

  it("shows resource scope banner when cloudResourceId is in the URL", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-resource-scope-banner")).toHaveTextContent(
      "22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-drift-open-terraform-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=terraform&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    await waitFor(() => {
      expect(mockFetchChanges).toHaveBeenCalledWith("diff-1", 1, 100, {
        cloudResourceId: "22222222-2222-2222-2222-222222222222",
      });
    });
  });

  it("opens change detail when changeId is deep-linked", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&changeId=change-1&cloudResourceId=22222222-2222-2222-2222-222222222222",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-change-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-change-row-change-1")).toHaveClass("bg-muted/40");
  });

  it("links Ask with diff and resource scope when a diff is selected", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
    render(<DriftWorkbenchClient />);

    const askLink = await screen.findByTestId("infra-drift-open-ask");
    expect(askLink).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1",
    );
  });

  it("shows missing deep-link copy when changeId is absent from the diff", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&changeId=missing-change",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-change-deep-link-missing")).toHaveTextContent(
      "linked drift change is not in the selected diff",
    );
  });
});

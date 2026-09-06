import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriftWorkbenchClient } from "@/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222",
    ),
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
  fetchInfraEvidenceDiffsForSnapshot: vi.fn(async () => []),
  fetchInfraEvidenceDiffChanges: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 50, hasMore: false })),
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
  it("renders snapshot picker and export button", async () => {
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-snapshot-picker")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-export-terraform")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-export-terraform")).not.toBeDisabled();
  });

  it("shows resource scope banner when cloudResourceId is in the URL", async () => {
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-resource-scope-banner")).toHaveTextContent(
      "22222222-2222-2222-2222-222222222222",
    );
  });
});

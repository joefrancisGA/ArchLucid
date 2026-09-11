import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowArchitectOutcomeMetricsPanel } from "@/components/security/SecureNowArchitectOutcomeMetricsPanel";
import {
  SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED,
  SECURENOW_ARCHITECT_METRICS_TITLE,
} from "@/lib/product-line/securenow-architect-metrics-copy";

vi.mock("@/hooks/use-infra-evidence-snapshots-query", () => ({
  useInfraEvidenceSnapshotsQuery: vi.fn(),
}));

vi.mock("@/hooks/use-securenow-architect-metrics-query", () => ({
  useSecureNowArchitectOutcomeMetricsQuery: vi.fn(),
}));

import { useInfraEvidenceSnapshotsQuery } from "@/hooks/use-infra-evidence-snapshots-query";
import { useSecureNowArchitectOutcomeMetricsQuery } from "@/hooks/use-securenow-architect-metrics-query";

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SecureNowArchitectOutcomeMetricsPanel />
    </QueryClientProvider>,
  );
}

describe("SecureNowArchitectOutcomeMetricsPanel", () => {
  it("shows empty copy when fewer than two snapshots exist", () => {
    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: [
          {
            snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-02T00:00:00Z",
            captureStatus: 1,
            resourceCount: 10,
            relationshipCount: 5,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);
    vi.mocked(useSecureNowArchitectOutcomeMetricsQuery).mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    renderPanel();

    expect(screen.getByText(SECURENOW_ARCHITECT_METRICS_TITLE)).toBeInTheDocument();
    expect(screen.getByText(/At least two inventory snapshots/i)).toBeInTheDocument();
  });

  it("renders headline architect outcome metrics for a snapshot pair", () => {
    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: [
          {
            snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-02T00:00:00Z",
            captureStatus: 1,
            resourceCount: 12,
            relationshipCount: 6,
          },
          {
            snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-01T00:00:00Z",
            captureStatus: 1,
            resourceCount: 10,
            relationshipCount: 5,
          },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);
    vi.mocked(useSecureNowArchitectOutcomeMetricsQuery).mockReturnValue({
      data: {
        fromSnapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        toSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        ruleVersion: "SA11-metrics-v1",
        criticalOrHighConfidencePathsRemoved: 3,
        privilegedIdentityNodesOnPathsReduced: 2,
        unrestrictedEgressCapabilityPathsReduced: 1,
        assertedCrownJewelExposurePathsRemoved: 1,
        sharedControlBlastRadiusPathsRemoved: 0,
        exceptionsExpired: 4,
        remediationRecurrenceCount: 1,
        supportingOperationalMetrics: { openFindings: 7 },
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    renderPanel();

    expect(screen.getByTestId("securenow-architect-outcome-metrics-grid")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-architect-metric-Critical/high paths removed")).toHaveTextContent("3");
    expect(screen.getByText(/SA11-metrics-v1/)).toBeInTheDocument();
  });
});
